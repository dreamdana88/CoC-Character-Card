import assert from "node:assert/strict";
import test from "node:test";
import { validateCharacter } from "../rules/validation.js";
import { minimalCharacter, setCredit } from "./minimalCharacter.js";

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
  card.skills[0].occupationPoints = 0;
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
  setCredit(low, { occupationPoints: 0 });
  assert.match(messages(validateCharacter(low)), /信用评级必须在 30 到 70 之间/);

  const high = minimalCharacter();
  setCredit(high, { occupationPoints: 71 });
  assert.match(messages(validateCharacter(high)), /信用评级必须在 30 到 70 之间/);

  const edge = minimalCharacter();
  setCredit(edge, { occupationPoints: 70 });
  assert.equal(validateCharacter(edge).ok, true);
});

test("occupation points only go to occupational skills and credit rating", () => {
  const stray = minimalCharacter();
  stray.skills.push({ name: "聆听", specialty: "", base: 20, growth: 0, occupationPoints: 5, interestPoints: 0 });
  const strayResult = validateCharacter(stray);
  assert.equal(strayResult.ok, false);
  assert.match(messages(strayResult), /skills\[\d+\]\.occupationPoints: 非本职技能不能分配职业点/);

  const interestOnly = minimalCharacter();
  interestOnly.skills.push({ name: "聆听", specialty: "", base: 20, growth: 0, occupationPoints: 0, interestPoints: 5 });
  assert.equal(validateCharacter(interestOnly).ok, true);

  const listed = minimalCharacter();
  listed.occupation.occupationalSkills = ["会计", "聆听"];
  listed.skills.push({ name: "聆听", specialty: "", base: 20, growth: 0, occupationPoints: 5, interestPoints: 3 });
  assert.equal(validateCharacter(listed).ok, true);

  const creditPoints = minimalCharacter();
  setCredit(creditPoints, { occupationPoints: 40 });
  assert.equal(validateCharacter(creditPoints).ok, true);
});

test("a selected occupation needs exactly one credit rating", () => {
  const missing = minimalCharacter();
  missing.skills = missing.skills.filter((skill) => skill.name !== "信用评级");
  assert.match(messages(validateCharacter(missing)), /选定职业后必须有一条信用评级/);

  const duplicate = minimalCharacter();
  duplicate.skills.push({ name: "信用评级", specialty: "另一条", base: 0, growth: 0, occupationPoints: 30, interestPoints: 0 });
  assert.match(messages(validateCharacter(duplicate)), /信用评级只能有一条/);

  const decorated = minimalCharacter();
  decorated.skills.push({ name: "信用评级：", specialty: "", base: 0, growth: 0, occupationPoints: 30, interestPoints: 0 });
  assert.match(messages(validateCharacter(decorated)), /信用评级只能有一条/);

  const unset = minimalCharacter();
  unset.occupation.id = "unset";
  unset.occupation.creditMin = 0;
  unset.occupation.creditMax = 0;
  unset.skills = unset.skills.filter((skill) => skill.name !== "信用评级");
  assert.equal(validateCharacter(unset).ok, true);
});

test("credit rating follows the selected occupation range", () => {
  const card = minimalCharacter();
  card.occupation.creditMin = 9;
  card.occupation.creditMax = 30;
  for (const [points, ok] of [[8, false], [9, true], [24, true], [30, true], [31, false]]) {
    const sample = structuredClone(card);
    setCredit(sample, { occupationPoints: points });
    const result = validateCharacter(sample);
    assert.equal(result.ok, ok, String(points));
    if (!ok) assert.match(messages(result), /信用评级必须在 9 到 30 之间/);
  }

  const summed = structuredClone(card);
  setCredit(summed, { occupationPoints: 20, interestPoints: 10, growth: 1 });
  assert.equal(summed.skills.find((skill) => skill.name === "信用评级").base + 20 + 10 + 1, 31);
  assert.match(messages(validateCharacter(summed)), /信用评级必须在 9 到 30 之间/);

  const wider = structuredClone(card);
  wider.occupation.creditMin = 5;
  wider.occupation.creditMax = 75;
  setCredit(wider, { occupationPoints: 31 });
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


test("selected zero-point interests and extended investigator notes are validated", () => {
  const card = minimalCharacter();
  card.skills[0].interestSelected = true;
  Object.assign(card.background, { assets: "旧书店", mythos: "调查线索", companions: "同行记者" });
  assert.equal(validateCharacter(card).ok, true);
  card.skills[0].interestSelected = "yes";
  assert.match(messages(validateCharacter(card)), /interestSelected/);
  card.skills[0].interestSelected = true;
  card.background.assets = 125;
  assert.match(messages(validateCharacter(card)), /background.assets/);
});
