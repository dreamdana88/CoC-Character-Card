import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKGROUND_FIELDS,
  CHARACTERISTIC_FIELDS,
  OCCUPATION_POINT_FORMULAS,
  SCHEMA_VERSION,
  RULESET,
  readBackground,
} from "../rules/characterSchema.js";

test("schema version and ruleset are fixed", () => {
  assert.equal(SCHEMA_VERSION, 1);
  assert.equal(RULESET, "coc7");
});

test("occupation formulas are the 13 audited enums", () => {
  assert.equal(OCCUPATION_POINT_FORMULAS.length, 13);
  assert.equal(new Set(OCCUPATION_POINT_FORMULAS).size, 13);
  assert.equal(OCCUPATION_POINT_FORMULAS.includes("EDU_X4"), true);
  assert.equal(OCCUPATION_POINT_FORMULAS.includes("EDU_X2_PLUS_APP_X2"), true);
  assert.equal(OCCUPATION_POINT_FORMULAS.includes("CUSTOM"), true);
  assert.equal(OCCUPATION_POINT_FORMULAS.includes("EDU*4"), false);
});

test("card fields keep luck, and phobia text shares one field with the old mania note", () => {
  assert.equal(CHARACTERISTIC_FIELDS.includes("luck"), true);
  assert.equal(BACKGROUND_FIELDS.includes("phobias"), true);
  assert.equal(BACKGROUND_FIELDS.includes("personalHistory"), true);
  assert.equal(BACKGROUND_FIELDS.includes("manias"), false);
  assert.equal(BACKGROUND_FIELDS.includes("phobiasManias"), false);

  const merged = readBackground({
    appearance: "灰色眼睛",
    phobias: "蜘蛛",
    manias: "收集骨头",
  });
  assert.equal(merged.phobias, "蜘蛛\n收集骨头");
  assert.equal(merged.personalHistory, "");
  assert.equal(merged.appearance, "灰色眼睛");
  assert.equal(Object.hasOwn(merged, "manias"), false);

  const kept = readBackground({ phobias: "蜘蛛\n收集骨头", manias: "收集骨头", personalHistory: "在博物馆工作过" });
  assert.equal(kept.phobias, "蜘蛛\n收集骨头");
  assert.equal(kept.personalHistory, "在博物馆工作过");
});
