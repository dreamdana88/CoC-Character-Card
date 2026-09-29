import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKGROUND_FIELDS,
  CHARACTERISTIC_FIELDS,
  OCCUPATION_POINT_FORMULAS,
  SCHEMA_VERSION,
  RULESET,
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

test("card fields keep luck and separate phobias from manias", () => {
  assert.equal(CHARACTERISTIC_FIELDS.includes("luck"), true);
  assert.equal(BACKGROUND_FIELDS.includes("phobias"), true);
  assert.equal(BACKGROUND_FIELDS.includes("manias"), true);
  assert.equal(BACKGROUND_FIELDS.includes("phobiasManias"), false);
});
