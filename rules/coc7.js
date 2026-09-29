import { OCCUPATION_POINT_FORMULAS } from "./characterSchema.js";

export class RuleError extends Error {
  constructor(message) {
    super(message);
    this.name = "RuleError";
  }
}

export const CTHULHU_MYTHOS_NAME = "克苏鲁神话";

function finiteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RuleError(`${label}需要有限数字`);
  }
  return value;
}

/** Excel INT：向负无穷取整。 */
export function excelInt(value) {
  return Math.floor(finiteNumber(value, "INT"));
}

/** Excel CEILING(value, 1)。只确认了非负数。 */
export function excelCeilingUnit(value) {
  const number = finiteNumber(value, "CEILING");
  if (number < 0) {
    throw new RuleError("CEILING 只确认了非负数");
  }
  return Math.ceil(number);
}

export function hitPoints(con, siz) {
  return excelInt((finiteNumber(con, "CON") + finiteNumber(siz, "SIZ")) / 10);
}

export function majorWoundThreshold(hp) {
  const points = finiteNumber(hp, "HP");
  if (points < 0) {
    throw new RuleError("重伤线只确认了非负 HP");
  }
  return excelCeilingUnit(points / 2);
}

export function magicPoints(pow) {
  return excelInt(finiteNumber(pow, "POW") / 5);
}

export function sanMaximum(mythosRating) {
  return 99 - finiteNumber(mythosRating, "克苏鲁神话技能");
}

export function hardSuccess(rating) {
  return excelInt(finiteNumber(rating, "成功率") / 2);
}

export function extremeSuccess(rating) {
  return excelInt(finiteNumber(rating, "成功率") / 5);
}

export function dodgeBase(dex) {
  return excelInt(finiteNumber(dex, "DEX") / 2);
}

export function ownLanguageBase(edu) {
  return finiteNumber(edu, "EDU");
}

export function interestPointsTotal(intelligence) {
  const value = finiteNumber(intelligence, "INT");
  return value + value;
}

export function skillRating(skill) {
  const base = finiteNumber(skill?.base, "技能基础值");
  const growth = finiteNumber(skill?.growth, "技能成长");
  const occupationPoints = finiteNumber(skill?.occupationPoints, "职业点");
  const interestPoints = finiteNumber(skill?.interestPoints, "兴趣点");
  const regular = base + growth + occupationPoints + interestPoints;
  return {
    regular,
    hard: hardSuccess(regular),
    extreme: extremeSuccess(regular),
  };
}

export function isCthulhuMythosSkill(skill) {
  return skill?.name === CTHULHU_MYTHOS_NAME || skill?.key === "cthulhuMythos";
}

export function mythosPointError(skill) {
  if (!isCthulhuMythosSkill(skill)) return null;
  if (skill.occupationPoints) return "克苏鲁神话不能分配职业点";
  if (skill.interestPoints) return "克苏鲁神话不能分配兴趣点";
  return null;
}

export function ageMovPenalty(age) {
  const years = finiteNumber(age, "年龄");
  if (years < 0) throw new RuleError("年龄不能为负数");
  if (years < 40) return 0;
  return excelInt(years / 10) - 3;
}

export function ageBandNote(age) {
  const years = finiteNumber(age, "年龄");
  if (years < 0) throw new RuleError("年龄不能为负数");
  const bands = [
    [15, 19, "力量体型共-5 E-5 L*2"],
    [20, 39, "教育进步*1"],
    [40, 49, "进步*2, SCD共-5 A-5"],
    [50, 59, "进步*3, SCD共-10 A-10"],
    [60, 69, "进步*4, SCD共-20 A-15"],
    [70, 79, "进步*4, SCD共-40 A-20"],
    [80, 89, "进步*4, SCD共-80 A-25"],
  ];
  for (const [min, max, text] of bands) {
    if (years >= min && years <= max) {
      return { band: `${min}–${max}`, text, adjustsCharacteristics: false };
    }
  }
  if (years >= 90) {
    return {
      band: "90+",
      text: null,
      adjustsCharacteristics: false,
      reason: "审计只写明 90 岁以上沿用同一套缩写继续加码，没有给出可执行的数值",
    };
  }
  return {
    band: null,
    text: null,
    adjustsCharacteristics: false,
    reason: "审计没有这个年龄的年龄段提示",
  };
}

function compareAttribute(left, right) {
  if (left > right) return 1;
  if (left < right) return -1;
  return 0;
}

export function attributeMovAdjust(str, siz, dex) {
  const strength = compareAttribute(finiteNumber(str, "STR"), finiteNumber(siz, "SIZ"));
  const dexterity = compareAttribute(finiteNumber(dex, "DEX"), finiteNumber(siz, "SIZ"));
  if (strength === 1 && dexterity === 1) return 1;
  if (strength === -1 && dexterity === -1) return -1;
  return 0;
}

export function movement({ str, siz, dex, age, armorMovPenalty = 0 }) {
  const penalty = finiteNumber(armorMovPenalty, "护甲移动惩罚");
  return attributeMovAdjust(str, siz, dex) - penalty - ageMovPenalty(age) + 8;
}

export function build(str, siz) {
  const total = finiteNumber(str, "STR") + finiteNumber(siz, "SIZ");
  if (total <= 1) return 0;
  if (total <= 64) return -2;
  if (total <= 84) return -1;
  if (total <= 124) return 0;
  if (total <= 164) return 1;
  if (total <= 204) return 2;
  if (total <= 284) return 3;
  return 4 + excelInt((total - 285) / 80);
}

export function damageBonus(buildValue) {
  const value = finiteNumber(buildValue, "体格");
  if (value === -2) return "-2";
  if (value === -1) return "-1";
  if (value === 0) return "0";
  if (value === 1) return "+1D4";
  if (value === 2) return "+1D6";
  if (value > 2) return `+${value - 1}D6`;
  throw new RuleError(`没有体格 ${value} 的伤害加值`);
}

function readCharacteristic(characteristics, key) {
  return finiteNumber(characteristics?.[key], key.toUpperCase());
}

function twice(value) {
  return value * 2;
}

const OCCUPATION_FORMULAS = {
  EDU_X4: (stats) => stats.edu * 4,
  EDU_X2_PLUS_MAX_STR_X2_DEX_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.str), twice(stats.dex)),
  EDU_X2_PLUS_APP_X2: (stats) => twice(stats.edu) + twice(stats.app),
  EDU_X2_PLUS_DEX_X2: (stats) => twice(stats.edu) + twice(stats.dex),
  EDU_X2_PLUS_MAX_DEX_X2_APP_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.dex), twice(stats.app)),
  EDU_X2_PLUS_MAX_APP_X2_POW_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.app), twice(stats.pow)),
  EDU_X2_PLUS_STR_X2: (stats) => twice(stats.edu) + twice(stats.str),
  EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.dex), twice(stats.app), twice(stats.str)),
  EDU_X2_PLUS_MAX_DEX_X2_POW_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.dex), twice(stats.pow)),
  EDU_X2_PLUS_MAX_APP_X2_DEX_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.app), twice(stats.dex)),
  EDU_X2_PLUS_MAX_POW_X2_DEX_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.pow), twice(stats.dex)),
  EDU_X2_PLUS_MAX_EDU_X2_APP_X2: (stats) => twice(stats.edu) + Math.max(twice(stats.edu), twice(stats.app)),
};

const FORMULA_KEYS = {
  EDU_X4: ["edu"],
  EDU_X2_PLUS_MAX_STR_X2_DEX_X2: ["edu", "str", "dex"],
  EDU_X2_PLUS_APP_X2: ["edu", "app"],
  EDU_X2_PLUS_DEX_X2: ["edu", "dex"],
  EDU_X2_PLUS_MAX_DEX_X2_APP_X2: ["edu", "dex", "app"],
  EDU_X2_PLUS_MAX_APP_X2_POW_X2: ["edu", "app", "pow"],
  EDU_X2_PLUS_STR_X2: ["edu", "str"],
  EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2: ["edu", "dex", "app", "str"],
  EDU_X2_PLUS_MAX_DEX_X2_POW_X2: ["edu", "dex", "pow"],
  EDU_X2_PLUS_MAX_APP_X2_DEX_X2: ["edu", "app", "dex"],
  EDU_X2_PLUS_MAX_POW_X2_DEX_X2: ["edu", "pow", "dex"],
  EDU_X2_PLUS_MAX_EDU_X2_APP_X2: ["edu", "app"],
};

export function calculateOccupationPoints(formula, characteristics) {
  if (formula === "CUSTOM") {
    throw new RuleError("自定义职业没有已确认的封闭点数公式，不能从属性算出职业点");
  }
  const calculate = OCCUPATION_FORMULAS[formula];
  if (!calculate || !OCCUPATION_POINT_FORMULAS.includes(formula)) {
    throw new RuleError(`未知职业点公式：${formula}`);
  }
  const stats = {};
  for (const key of FORMULA_KEYS[formula]) {
    stats[key] = readCharacteristic(characteristics, key);
  }
  return calculate(stats);
}

export function spentPoints(skills, field) {
  if (!Array.isArray(skills)) throw new RuleError("技能列表必须是数组");
  return skills.reduce((total, skill) => total + finiteNumber(skill?.[field], field), 0);
}

export function remainingOccupationPoints(total, skills) {
  return finiteNumber(total, "职业点总额") - spentPoints(skills, "occupationPoints");
}

export function remainingInterestPoints(total, skills) {
  return finiteNumber(total, "兴趣点总额") - spentPoints(skills, "interestPoints");
}
