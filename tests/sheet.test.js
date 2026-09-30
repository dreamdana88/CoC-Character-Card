import assert from "node:assert/strict";
import test from "node:test";
import { OCCUPATION_POINT_FORMULAS } from "../rules/characterSchema.js";
import { calculateOccupationPoints, interestPointsTotal } from "../rules/coc7.js";
import {
  FIGHTING_SPECIALTY_BASES,
  FIREARMS_SPECIALTY_BASES,
  FORMULA_LABELS,
  derivePreview,
  describeCharacteristicSet,
  expectedSkillBase,
  pointBuyUsage,
  rollCharacteristicSets,
  skillBaseErrors,
  starterSkills,
} from "../rules/sheet.js";
import { minimalCharacter } from "./minimalCharacter.js";

test("derived values come from the existing rule functions", () => {
  const card = minimalCharacter();
  const preview = derivePreview(card);
  assert.equal(preview.hp, 11);
  assert.equal(preview.majorWound, 6);
  assert.equal(preview.mp, 10);
  assert.equal(Object.hasOwn(preview, "sanity"), false);
  assert.equal(preview.sanMaximum, 99);
  assert.equal(preview.mov, 8);
  assert.equal(preview.build, 0);
  assert.equal(preview.damageBonus, "0");
  assert.equal(preview.occupationPoints.total, calculateOccupationPoints("EDU_X4", card.characteristics));
  assert.equal(preview.occupationPoints.total, 320);
  assert.equal(preview.occupationPoints.spent, 40);
  assert.equal(preview.occupationPoints.remaining, 280);
  assert.equal(preview.interestPoints.total, interestPointsTotal(card.characteristics.int));
  assert.equal(preview.interestPoints.total, 150);
  assert.equal(preview.interestPoints.spent, 0);
  assert.equal(preview.interestPoints.remaining, 150);
  const accounting = preview.skills[0];
  assert.equal(accounting.rating.regular, 45);
  assert.equal(accounting.rating.hard, 22);
  assert.equal(accounting.rating.extreme, 9);
  assert.equal(preview.age.adjustsCharacteristics, false);
  assert.equal(preview.age.text, "教育进步*1");
});

test("named occupation formulas are calculated, and CUSTOM is not guessed", () => {
  assert.deepEqual(FORMULA_LABELS.map(([formula]) => formula), [...OCCUPATION_POINT_FORMULAS]);
  const card = minimalCharacter();
  for (const formula of OCCUPATION_POINT_FORMULAS) {
    if (formula === "CUSTOM") continue;
    card.occupation.pointFormula = formula;
    const preview = derivePreview(card);
    assert.equal(preview.occupationPoints.total, calculateOccupationPoints(formula, card.characteristics), formula);
    assert.equal(preview.occupationPoints.message, undefined, formula);
  }
  card.occupation.pointFormula = "CUSTOM";
  let customMessage = "";
  try {
    calculateOccupationPoints("CUSTOM", card.characteristics);
  } catch (error) {
    customMessage = error.message;
  }
  const custom = derivePreview(card);
  assert.equal(custom.occupationPoints.total, null);
  assert.equal(custom.occupationPoints.message, customMessage);
  assert.match(custom.occupationPoints.message, /不能从属性算出职业点/);
});

test("skill bases follow the audited specialties", () => {
  const stats = { dex: 70, edu: 80 };
  assert.deepEqual(expectedSkillBase({ name: "闪避" }, stats), { known: true, base: 35 });
  assert.deepEqual(expectedSkillBase({ name: "闪避" }, {}), { known: false });
  assert.deepEqual(expectedSkillBase({ name: "母语" }, stats), { known: true, base: 80 });
  assert.deepEqual(expectedSkillBase({ name: "母语" }, {}), { known: false });
  assert.deepEqual(expectedSkillBase({ name: "技艺", specialty: "木工" }), { known: true, base: 5 });
  assert.deepEqual(expectedSkillBase({ name: "科学", specialty: "" }), { known: true, base: 1 });
  assert.deepEqual(expectedSkillBase({ name: "科学", specialty: "数学" }), { known: true, base: 10 });
  assert.deepEqual(expectedSkillBase({ name: "科学", specialty: "物理" }), { known: true, base: 1 });
  assert.deepEqual(expectedSkillBase({ name: "图书馆使用" }), { known: true, base: 20 });
  assert.deepEqual(expectedSkillBase({ name: "信用评级" }), { known: true, base: 0 });
  assert.deepEqual(expectedSkillBase({ name: "克苏鲁神话" }), { known: true, base: 0 });
  assert.deepEqual(expectedSkillBase({ name: "人类学" }), { known: false });
  assert.deepEqual(expectedSkillBase({ name: "格斗①", specialty: "矛" }), { known: false });
  for (const [specialty, base] of Object.entries(FIGHTING_SPECIALTY_BASES)) {
    assert.deepEqual(expectedSkillBase({ name: "格斗", specialty }), { known: true, base }, specialty);
  }
  for (const [specialty, base] of Object.entries(FIREARMS_SPECIALTY_BASES)) {
    assert.deepEqual(expectedSkillBase({ name: "射击", specialty }), { known: true, base }, specialty);
  }
  assert.deepEqual(expectedSkillBase({ name: "格斗", specialty: "拳" }), { known: false });
  assert.deepEqual(expectedSkillBase({ name: "射击", specialty: "手枪" }), { known: false });

  const card = minimalCharacter();
  card.characteristics.dex = 70;
  card.skills = [{ name: "闪避", specialty: "", base: 34, growth: 0, occupationPoints: 0, interestPoints: 0 }];
  assert.deepEqual(skillBaseErrors(card), [{ path: "skills[0].base", message: "基础值应为 35" }]);
});

test("Cthulhu Mythos points and age notes do not rewrite characteristics", () => {
  const card = minimalCharacter();
  card.skills[1].occupationPoints = 5;
  assert.equal(derivePreview(card).skills[1].mythosError, "克苏鲁神话不能分配职业点");
  card.skills[1].occupationPoints = 0;
  card.skills[1].interestPoints = 3;
  assert.equal(derivePreview(card).skills[1].mythosError, "克苏鲁神话不能分配兴趣点");
  card.skills[1].interestPoints = 0;
  card.skills[1].growth = 10;
  assert.equal(Object.hasOwn(derivePreview(card), "sanity"), false);
  assert.equal(derivePreview(card).sanMaximum, 89);

  card.identity.age = 15;
  const before = card.characteristics.str;
  const preview = derivePreview(card);
  assert.equal(card.characteristics.str, before);
  assert.equal(preview.age.adjustsCharacteristics, false);
  assert.match(preview.age.text, /力量体型共-5/);
  assert.equal(Object.hasOwn(preview, "adjustedCharacteristics"), false);
});

test("armor changes only MOV, and point buy is a sum against the entered total", () => {
  const card = minimalCharacter();
  card.armor = { name: "皮甲", applyMovPenalty: true, movPenalty: 1 };
  assert.equal(derivePreview(card).mov, 7);

  const characteristics = {
    str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50, luck: 50,
  };
  const withoutLuck = pointBuyUsage(characteristics, { total: 500, includeLuck: false });
  assert.deepEqual(withoutLuck, { ok: true, total: 500, used: 400, remaining: 100, includeLuck: false });
  const withLuck = pointBuyUsage(characteristics, { total: 500, includeLuck: true });
  assert.equal(withLuck.used, 450);
  assert.equal(withLuck.remaining, 50);
  const over = pointBuyUsage(characteristics, { total: 100, includeLuck: false });
  assert.equal(over.ok, true);
  assert.equal(over.remaining < 0, true);
  assert.equal(pointBuyUsage(characteristics, { total: 0, includeLuck: false }).ok, false);
  assert.equal(pointBuyUsage(characteristics, { total: 500, includeLuck: "true" }).ok, false);
  assert.match(pointBuyUsage(characteristics, { total: "500", includeLuck: true }).message, /正整数/);
});

test("characteristic rolls use the confirmed dice, including luck", () => {
  let calls = 0;
  const rng = () => {
    calls += 1;
    return (calls % 7) / 7;
  };
  const sets = rollCharacteristicSets(2, rng);
  assert.equal(calls, 48);
  assert.equal(sets.length, 2);
  assert.notDeepEqual(sets[0], sets[1]);
  assert.equal(typeof sets[0].luck, "number");
  assert.equal(sets[0].totalWithLuck, sets[0].total + sets[0].luck);

  const flat = rollCharacteristicSets(1, () => 0);
  assert.equal(calls, 48);
  assert.equal(flat[0].str, 15);
  assert.equal(flat[0].con, 15);
  assert.equal(flat[0].dex, 15);
  assert.equal(flat[0].app, 15);
  assert.equal(flat[0].pow, 15);
  assert.equal(flat[0].siz, 40);
  assert.equal(flat[0].int, 40);
  assert.equal(flat[0].edu, 40);
  assert.equal(flat[0].luck, 15);
  assert.equal(flat[0].total, 195);
  assert.equal(flat[0].totalWithLuck, 210);
  assert.equal(flat[0].luckNote, "");
  assert.equal(flat[0].derived.hp, 5);
  assert.equal(flat[0].derived.majorWound, 3);
  assert.equal(flat[0].derived.mp, 3);
  assert.equal(flat[0].derived.mov, 7);
  assert.equal(flat[0].derived.movNote, "未计年龄和护甲");
  assert.equal(flat[0].derived.build, -2);
  assert.equal(flat[0].derived.damageBonus, "-2");
  assert.equal(flat[0].derived.sanity, 15);
  assert.equal(Object.hasOwn(flat[0].derived, "sanMaximum"), false);

  const pictured = describeCharacteristicSet({
    str: 50,
    dex: 35,
    pow: 75,
    con: 80,
    app: 75,
    edu: 80,
    siz: 50,
    int: 70,
    luck: 40,
  });
  assert.equal(pictured.total, 515);
  assert.equal(pictured.totalWithLuck, 555);
  assert.equal(pictured.derived.hp, 13);
  assert.equal(pictured.derived.sanity, 75);
  assert.equal(pictured.derived.mp, 15);
  assert.equal(pictured.derived.mov, 8);
  assert.equal(pictured.derived.build, 0);
  assert.equal(pictured.derived.damageBonus, "0");
  assert.equal(pictured.derived.majorWound, 7);

  assert.throws(() => rollCharacteristicSets(0, () => 0), /1 到 20/);
  assert.throws(() => rollCharacteristicSets(21, () => 0), /1 到 20/);
  assert.equal(rollCharacteristicSets(20, () => 0).length, 20);
});

test("starter skills only include audited bases", () => {
  const skills = starterSkills();
  const byName = new Map(skills.map((skill) => [skill.name, skill]));
  assert.equal(byName.get("会计").base, 5);
  assert.equal(byName.get("攀爬").base, 20);
  assert.equal(byName.get("话术").base, 5);
  assert.equal(byName.get("聆听").base, 20);
  assert.equal(byName.get("图书馆使用").base, 20);
  assert.equal(byName.get("信用评级").base, 0);
  assert.equal(byName.get("克苏鲁神话").base, 0);
  assert.equal(byName.get("克苏鲁神话").occupationPoints, 0);
  assert.equal(byName.get("克苏鲁神话").interestPoints, 0);
  assert.equal(byName.get("技艺").base, 5);
  assert.equal(byName.get("科学").base, 1);
  assert.equal(byName.get("闪避").base, 0);
  assert.equal(byName.get("母语").base, 0);
  assert.equal(byName.get("格斗").specialty, "鞭子");
  assert.equal(byName.get("格斗").base, 5);
  assert.equal(byName.get("射击").specialty, "步枪/霰弹枪");
  assert.equal(byName.get("射击").base, 25);
  assert.equal(skills.some((skill) => skill.name === "人类学"), false);
});
