import assert from "node:assert/strict";
import test from "node:test";
import { validateCharacter } from "../rules/validation.js";
import { minimalCharacter } from "./minimalCharacter.js";

function messages(result) {
  return result.errors.map((error) => `${error.path}: ${error.message}`).join("\n");
}

test("a legal character passes", () => {
  const result = validateCharacter(minimalCharacter());
  assert.equal(result.ok, true);
  assert.equal(result.errors, undefined);
});

test("initialSan is an integer from 0 through 99 and can differ from POW", () => {
  const card = minimalCharacter();
  card.initialSan = 40;
  assert.equal(validateCharacter(card).ok, true);
  assert.equal(card.characteristics.pow, 50);

  card.initialSan = 0;
  assert.equal(validateCharacter(card).ok, true);

  card.initialSan = 99;
  assert.equal(validateCharacter(card).ok, true);

  card.initialSan = -1;
  assert.match(messages(validateCharacter(card)), /初始理智必须是 0 到 99 的整数/);

  card.initialSan = 100;
  assert.match(messages(validateCharacter(card)), /初始理智必须是 0 到 99 的整数/);

  card.initialSan = 40.5;
  assert.match(messages(validateCharacter(card)), /初始理智必须是整数/);
});

test("a card has no player name, and the investigator name is not the owner id", () => {
  const card = minimalCharacter();
  assert.equal(Object.hasOwn(card.identity, "playerName"), false);
  assert.equal(validateCharacter(card).ok, true);
  delete card.ownerDiscordUserId;
  card.identity.name = "100";
  const result = validateCharacter(card);
  assert.equal(result.ok, false);
  assert.match(messages(result), /ownerDiscordUserId/);
});

test("schemaVersion, ruleset, id, and owner are required", () => {
  const missingVersion = minimalCharacter();
  delete missingVersion.schemaVersion;
  assert.match(messages(validateCharacter(missingVersion)), /缺少 schemaVersion/);

  const wrongVersion = minimalCharacter();
  wrongVersion.schemaVersion = 2;
  assert.match(messages(validateCharacter(wrongVersion)), /schemaVersion 必须是 1/);

  const stringVersion = minimalCharacter();
  stringVersion.schemaVersion = "1";
  assert.match(messages(validateCharacter(stringVersion)), /schemaVersion 必须是 1/);

  const wrongRuleset = minimalCharacter();
  wrongRuleset.ruleset = "coc6";
  assert.match(messages(validateCharacter(wrongRuleset)), /ruleset 必须是 "coc7"/);

  const missingId = minimalCharacter();
  missingId.id = "";
  assert.match(messages(validateCharacter(missingId)), /缺少 id/);

  const numericOwner = minimalCharacter();
  numericOwner.ownerDiscordUserId = 100;
  assert.match(messages(validateCharacter(numericOwner)), /ownerDiscordUserId/);
});

test("wrong types and unknown occupation formulas fail without being rewritten", () => {
  const card = minimalCharacter();
  const originalFormula = card.occupation.pointFormula;
  card.characteristics.str = "50";
  card.occupation.pointFormula = "EDU*4";
  const result = validateCharacter(card);
  assert.equal(result.ok, false);
  assert.match(messages(result), /str必须是整数/);
  assert.match(messages(result), /未知职业点公式：EDU\*4/);
  assert.equal(card.occupation.pointFormula, "EDU*4");
  assert.equal(originalFormula, "EDU_X4");
});

test("session state and excel coordinates are rejected", () => {
  const card = minimalCharacter();
  card.currentHp = 3;
  card.excelCell = "N10";
  const result = validateCharacter(card);
  assert.equal(result.ok, false);
  assert.match(messages(result), /currentHp/);
  assert.match(messages(result), /excelCell/);
  assert.equal(card.currentHp, 3);
});

test("Cthulhu Mythos cannot receive occupation or interest points", () => {
  const occupation = minimalCharacter();
  occupation.skills[1].occupationPoints = 10;
  assert.match(messages(validateCharacter(occupation)), /克苏鲁神话不能分配职业点/);

  const interest = minimalCharacter();
  interest.skills[1].interestPoints = 5;
  assert.match(messages(validateCharacter(interest)), /克苏鲁神话不能分配兴趣点/);

  const byKey = minimalCharacter();
  byKey.skills[1].name = "其他名字";
  byKey.skills[1].key = "cthulhuMythos";
  byKey.skills[1].occupationPoints = 1;
  assert.match(messages(validateCharacter(byKey)), /克苏鲁神话不能分配职业点/);
});

test("custom occupation may exist but cannot list more than eight skills", () => {
  const card = minimalCharacter();
  card.occupation.pointFormula = "CUSTOM";
  card.occupation.occupationalSkills = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  assert.match(messages(validateCharacter(card)), /最多 8 个本职技能/);

  card.occupation.occupationalSkills = ["一", "二"];
  assert.equal(validateCharacter(card).ok, true);
});

test("overspent pools and an out-of-range credit rating cannot be saved", () => {
  const overOccupation = minimalCharacter();
  overOccupation.skills[0].occupationPoints = 321;
  assert.match(messages(validateCharacter(overOccupation)), /职业点超过总额/);

  const overInterest = minimalCharacter();
  overInterest.skills[0].interestPoints = 151;
  assert.match(messages(validateCharacter(overInterest)), /兴趣点超过总额/);

  const mixed = minimalCharacter();
  mixed.skills[0].occupationPoints = 40;
  mixed.skills[0].interestPoints = 20;
  mixed.skills[0].growth = 4;
  assert.equal(validateCharacter(mixed).ok, true);

  const negative = minimalCharacter();
  negative.skills[0].occupationPoints = -1;
  assert.match(messages(validateCharacter(negative)), /不能为负数/);

  const custom = minimalCharacter();
  custom.occupation.pointFormula = "CUSTOM";
  custom.skills[0].occupationPoints = 999;
  assert.equal(validateCharacter(custom).ok, true);

  const low = minimalCharacter();
  low.skills.push({ name: "信用评级", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 });
  assert.match(messages(validateCharacter(low)), /信用评级必须在 30 到 70 之间/);

  const high = minimalCharacter();
  high.skills.push({ name: "信用评级", specialty: "", base: 0, growth: 0, occupationPoints: 71, interestPoints: 0 });
  assert.match(messages(validateCharacter(high)), /信用评级必须在 30 到 70 之间/);

  const edge = minimalCharacter();
  edge.skills.push({ name: "信用评级", specialty: "", base: 0, growth: 0, occupationPoints: 70, interestPoints: 0 });
  assert.equal(validateCharacter(edge).ok, true);
});

test("credit rating follows the selected occupation range", () => {
  const card = minimalCharacter();
  card.occupation.creditMin = 9;
  card.occupation.creditMax = 30;
  const credit = { name: "信用评级", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 };
  for (const [points, ok] of [[8, false], [9, true], [24, true], [30, true], [31, false]]) {
    const sample = structuredClone(card);
    sample.skills.push({ ...credit, occupationPoints: points });
    const result = validateCharacter(sample);
    assert.equal(result.ok, ok, String(points));
    if (!ok) assert.match(messages(result), /信用评级必须在 9 到 30 之间/);
  }

  const summed = structuredClone(card);
  summed.skills.push({ ...credit, occupationPoints: 20, interestPoints: 10, growth: 1 });
  assert.equal(summed.skills.at(-1).base + 20 + 10 + 1, 31);
  assert.match(messages(validateCharacter(summed)), /信用评级必须在 9 到 30 之间/);

  const wider = structuredClone(card);
  wider.occupation.creditMin = 5;
  wider.occupation.creditMax = 75;
  wider.skills.push({ ...credit, occupationPoints: 31 });
  assert.equal(validateCharacter(wider).ok, true);
});

test("credit limits are not silently swapped", () => {
  const card = minimalCharacter();
  card.occupation.creditMin = 70;
  card.occupation.creditMax = 30;
  const result = validateCharacter(card);
  assert.equal(result.ok, false);
  assert.equal(card.occupation.creditMin, 70);
  assert.match(messages(result), /下限不能高于上限/);
});
