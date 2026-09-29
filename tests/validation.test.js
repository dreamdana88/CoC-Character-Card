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

test("playerName is display text and does not replace the owner id", () => {
  const card = minimalCharacter();
  delete card.ownerDiscordUserId;
  card.identity.playerName = "100";
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

test("credit limits are not silently swapped", () => {
  const card = minimalCharacter();
  card.occupation.creditMin = 70;
  card.occupation.creditMax = 30;
  const result = validateCharacter(card);
  assert.equal(result.ok, false);
  assert.equal(card.occupation.creditMin, 70);
  assert.match(messages(result), /下限不能高于上限/);
});
