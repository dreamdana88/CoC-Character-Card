import assert from "node:assert/strict";
import test from "node:test";
import { OCCUPATION_POINT_FORMULAS } from "../rules/characterSchema.js";
import {
  RuleError,
  ageBandNote,
  ageMovPenalty,
  build,
  calculateOccupationPoints,
  damageBonus,
  dodgeBase,
  extremeSuccess,
  hardSuccess,
  hitPoints,
  interestPointsTotal,
  magicPoints,
  majorWoundThreshold,
  movement,
  ownLanguageBase,
  remainingInterestPoints,
  remainingOccupationPoints,
  sanMaximum,
  skillRating,
} from "../rules/coc7.js";

const stats = { edu: 80, str: 50, dex: 60, app: 40, pow: 70 };

test("derived values use Excel INT and CEILING", () => {
  assert.equal(hitPoints(60, 55), 11);
  assert.equal(hitPoints(50, 50), 10);
  assert.equal(hitPoints(61, 50), 11);
  assert.equal(majorWoundThreshold(11), 6);
  assert.equal(majorWoundThreshold(1), 1);
  assert.equal(majorWoundThreshold(2), 1);
  assert.equal(magicPoints(50), 10);
  assert.equal(magicPoints(54), 10);
  assert.equal(magicPoints(55), 11);
  assert.equal(sanMaximum(0), 99);
  assert.equal(sanMaximum(5), 94);
  assert.equal(hardSuccess(70), 35);
  assert.equal(hardSuccess(71), 35);
  assert.equal(extremeSuccess(70), 14);
  assert.equal(extremeSuccess(71), 14);
  assert.equal(extremeSuccess(3), 0);
  assert.equal(dodgeBase(71), 35);
  assert.equal(ownLanguageBase(80), 80);
  assert.equal(interestPointsTotal(75), 150);
});

test("skill rating is base plus growth, occupation, and interest", () => {
  const rating = skillRating({
    base: 20,
    growth: 10,
    occupationPoints: 40,
    interestPoints: 5,
  });
  assert.deepEqual(rating, { regular: 75, hard: 37, extreme: 15 });
});

test("movement is 7, 8, or 9, then subtracts age and armor", () => {
  assert.equal(movement({ str: 80, siz: 60, dex: 70, age: 25 }), 9);
  assert.equal(movement({ str: 40, siz: 70, dex: 50, age: 25 }), 7);
  assert.equal(movement({ str: 80, siz: 60, dex: 40, age: 25 }), 8);
  assert.equal(movement({ str: 50, siz: 50, dex: 50, age: 25 }), 8);
  assert.equal(ageMovPenalty(39), 0);
  assert.equal(ageMovPenalty(40), 1);
  assert.equal(ageMovPenalty(45), 1);
  assert.equal(movement({ str: 80, siz: 60, dex: 70, age: 45 }), 8);
  assert.equal(movement({ str: 80, siz: 60, dex: 70, age: 45, armorMovPenalty: 1 }), 7);
});

test("build and damage bonus follow the audited table", () => {
  const cases = [
    [1, 0, "0"],
    [0, 0, "0"],
    [2, -2, "-2"],
    [64, -2, "-2"],
    [65, -1, "-1"],
    [84, -1, "-1"],
    [85, 0, "0"],
    [124, 0, "0"],
    [125, 1, "+1D4"],
    [164, 1, "+1D4"],
    [165, 2, "+1D6"],
    [204, 2, "+1D6"],
    [205, 3, "+2D6"],
    [284, 3, "+2D6"],
    [285, 4, "+3D6"],
    [364, 4, "+3D6"],
    [365, 5, "+4D6"],
    [445, 6, "+5D6"],
  ];
  for (const [total, expectedBuild, bonus] of cases) {
    assert.equal(build(total, 0), expectedBuild, String(total));
    assert.equal(damageBonus(expectedBuild), bonus, String(total));
  }
});

test("twelve occupation formulas are explicit and the custom formula fails closed", () => {
  const expected = {
    EDU_X4: 320,
    EDU_X2_PLUS_MAX_STR_X2_DEX_X2: 280,
    EDU_X2_PLUS_APP_X2: 240,
    EDU_X2_PLUS_DEX_X2: 280,
    EDU_X2_PLUS_MAX_DEX_X2_APP_X2: 280,
    EDU_X2_PLUS_MAX_APP_X2_POW_X2: 300,
    EDU_X2_PLUS_STR_X2: 260,
    EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2: 280,
    EDU_X2_PLUS_MAX_DEX_X2_POW_X2: 300,
    EDU_X2_PLUS_MAX_APP_X2_DEX_X2: 280,
    EDU_X2_PLUS_MAX_POW_X2_DEX_X2: 300,
    EDU_X2_PLUS_MAX_EDU_X2_APP_X2: 320,
  };
  assert.deepEqual(Object.keys(expected).sort(), OCCUPATION_POINT_FORMULAS.filter((formula) => formula !== "CUSTOM").sort());
  for (const [formula, points] of Object.entries(expected)) {
    assert.equal(calculateOccupationPoints(formula, stats), points, formula);
  }
  assert.equal(calculateOccupationPoints("EDU_X2_PLUS_MAX_EDU_X2_APP_X2", { edu: 40, app: 90 }), 260);
  assert.throws(() => calculateOccupationPoints("CUSTOM", stats), RuleError);
  assert.throws(() => calculateOccupationPoints("EDU*4", stats), /未知职业点公式/);
});

test("remaining points subtract what was allocated", () => {
  const skills = [
    { occupationPoints: 40, interestPoints: 10 },
    { occupationPoints: 15, interestPoints: 5 },
  ];
  assert.equal(remainingOccupationPoints(320, skills), 265);
  assert.equal(remainingInterestPoints(150, skills), 135);
});

test("age notes do not change characteristics", () => {
  const characteristics = { str: 60, con: 55, dex: 50, app: 45, edu: 70, luck: 40 };
  const before = structuredClone(characteristics);
  const young = ageBandNote(16);
  assert.equal(young.text, "力量体型共-5 E-5 L*2");
  assert.equal(young.adjustsCharacteristics, false);
  assert.equal(ageBandNote(28).text, "教育进步*1");
  assert.equal(ageBandNote(90).text, null);
  assert.equal(ageBandNote(14).text, null);
  assert.deepEqual(characteristics, before);
});
