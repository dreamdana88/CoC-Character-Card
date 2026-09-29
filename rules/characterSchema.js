export const SCHEMA_VERSION = 1;
export const RULESET = "coc7";

export const IDENTITY_FIELDS = Object.freeze([
  "name",
  "playerName",
  "age",
  "sex",
  "era",
  "residence",
  "birthplace",
]);

export const CHARACTERISTIC_FIELDS = Object.freeze([
  "str",
  "con",
  "siz",
  "dex",
  "app",
  "int",
  "pow",
  "edu",
  "luck",
]);

export const BACKGROUND_FIELDS = Object.freeze([
  "appearance",
  "beliefs",
  "significantPeople",
  "meaningfulLocations",
  "treasuredPossessions",
  "traits",
  "scars",
  "phobias",
  "manias",
]);

export const ERAS = Object.freeze(["1920s", "现代", "其他"]);

export const OCCUPATION_POINT_FORMULAS = Object.freeze([
  "EDU_X4",
  "EDU_X2_PLUS_MAX_STR_X2_DEX_X2",
  "EDU_X2_PLUS_APP_X2",
  "EDU_X2_PLUS_DEX_X2",
  "EDU_X2_PLUS_MAX_DEX_X2_APP_X2",
  "EDU_X2_PLUS_MAX_APP_X2_POW_X2",
  "EDU_X2_PLUS_STR_X2",
  "EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2",
  "EDU_X2_PLUS_MAX_DEX_X2_POW_X2",
  "EDU_X2_PLUS_MAX_APP_X2_DEX_X2",
  "EDU_X2_PLUS_MAX_POW_X2_DEX_X2",
  "EDU_X2_PLUS_MAX_EDU_X2_APP_X2",
  "CUSTOM",
]);

export const FORBIDDEN_CARD_FIELDS = Object.freeze([
  "currentHp",
  "currentSan",
  "currentMp",
  "currentLuck",
  "hpLoss",
  "sanLoss",
  "mpSpent",
  "luckSpent",
  "wounds",
  "injury",
  "madness",
  "insanity",
  "dead",
  "death",
  "moduleResult",
  "excelCell",
  "excelFormula",
  "死亡",
  "退役",
  "伤势",
  "疯狂",
]);

export function isOccupationPointFormula(value) {
  return OCCUPATION_POINT_FORMULAS.includes(value);
}
