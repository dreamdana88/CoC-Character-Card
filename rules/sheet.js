import { CHARACTERISTIC_FIELDS, OCCUPATION_POINT_FORMULAS } from "./characterSchema.js";
import {
  ageBandNote,
  attributeMovAdjust,
  build,
  calculateOccupationPoints,
  damageBonus,
  dodgeBase,
  hitPoints,
  interestPointsTotal,
  isCthulhuMythosSkill,
  magicPoints,
  majorWoundThreshold,
  movement,
  mythosPointError,
  ownLanguageBase,
  remainingInterestPoints,
  remainingOccupationPoints,
  sanMaximum,
  skillRating,
  spentPoints,
  RuleError,
} from "./coc7.js";

export const ROLL_SET_LIMIT = 20;

export const FORMULA_LABELS = Object.freeze([
  ["EDU_X4", "教育×4"],
  ["EDU_X2_PLUS_MAX_STR_X2_DEX_X2", "教育×2 + 较高的（力量×2 或 敏捷×2）"],
  ["EDU_X2_PLUS_APP_X2", "教育×2 + 外貌×2"],
  ["EDU_X2_PLUS_DEX_X2", "教育×2 + 敏捷×2"],
  ["EDU_X2_PLUS_MAX_DEX_X2_APP_X2", "教育×2 + 较高的（敏捷×2 或 外貌×2）"],
  ["EDU_X2_PLUS_MAX_APP_X2_POW_X2", "教育×2 + 较高的（外貌×2 或 意志×2）"],
  ["EDU_X2_PLUS_STR_X2", "教育×2 + 力量×2"],
  ["EDU_X2_PLUS_MAX_DEX_X2_APP_X2_STR_X2", "教育×2 + 较高的（敏捷×2、外貌×2 或 力量×2）"],
  ["EDU_X2_PLUS_MAX_DEX_X2_POW_X2", "教育×2 + 较高的（敏捷×2 或 意志×2）"],
  ["EDU_X2_PLUS_MAX_APP_X2_DEX_X2", "教育×2 + 较高的（外貌×2 或 敏捷×2）"],
  ["EDU_X2_PLUS_MAX_POW_X2_DEX_X2", "教育×2 + 较高的（意志×2 或 敏捷×2）"],
  ["EDU_X2_PLUS_MAX_EDU_X2_APP_X2", "教育×2 + 较高的（教育×2 或 外貌×2）"],
  ["CUSTOM", "自定义职业（不能从属性算出职业点）"],
]);

const FIXED_BASES = Object.freeze({
  会计: 5,
  聆听: 20,
  图书馆使用: 20,
  攀爬: 20,
  话术: 5,
  信用评级: 0,
  克苏鲁神话: 0,
});

export const FIGHTING_SPECIALTY_BASES = Object.freeze({
  鞭子: 5,
  电锯: 10,
  斧: 15,
  剑: 20,
  绞具: 15,
  链枷: 10,
  矛: 20,
});

export const FIREARMS_SPECIALTY_BASES = Object.freeze({
  "步枪/霰弹枪": 25,
  冲锋枪: 15,
  弓术: 15,
  喷射器: 10,
  机枪: 10,
  重武器: 10,
});

export const SKILL_NAMES = Object.freeze([
  "会计", "人类学", "估价", "考古学", "技艺", "取悦", "攀爬", "计算机使用", "信用评级", "克苏鲁神话",
  "乔装", "闪避", "汽车驾驶", "电气维修", "电子学", "话术", "格斗", "射击", "急救", "历史", "恐吓", "跳跃",
  "外语", "母语", "法律", "图书馆使用", "聆听", "锁匠", "机械维修", "医学", "博物学", "导航", "神秘学",
  "操作重型机械", "说服", "驾驶", "精神分析", "心理学", "骑术", "科学", "妙手", "侦查", "潜行", "生存",
  "游泳", "投掷", "追踪", "动物驯养", "潜水", "爆破", "读唇", "催眠", "炮术", "学识", "自定义技能",
]);

const LUCK_ROLL_NOTE = "审计的生成提示没有写幸运的骰点公式";
const ROLL_MOV_NOTE = "未计年龄和护甲";
const ROLL_STAT_KEYS = Object.freeze(["str", "con", "dex", "app", "pow", "siz", "int", "edu"]);

function integerOrNull(value) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function die(rng, sides) {
  const sample = rng();
  if (typeof sample !== "number" || sample < 0 || sample >= 1) {
    throw new RuleError("随机源必须给出 [0, 1) 的数");
  }
  return Math.floor(sample * sides) + 1;
}

function roll3d6Times5(rng) {
  return (die(rng, 6) + die(rng, 6) + die(rng, 6)) * 5;
}

function roll2d6Plus6Times5(rng) {
  return (die(rng, 6) + die(rng, 6) + 6) * 5;
}

export function describeCharacteristicSet(set) {
  const stats = {};
  for (const key of ROLL_STAT_KEYS) {
    const value = integerOrNull(set?.[key]);
    if (value === null) throw new RuleError("属性方案的八项属性必须是整数");
    stats[key] = value;
  }
  const luckMissing = set?.luck === null || set?.luck === undefined;
  const luck = luckMissing ? null : integerOrNull(set.luck);
  if (!luckMissing && luck === null) throw new RuleError("幸运必须是整数或空");
  const total = ROLL_STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
  const hp = hitPoints(stats.con, stats.siz);
  const buildValue = build(stats.str, stats.siz);
  return {
    ...stats,
    luck,
    luckNote: typeof set?.luckNote === "string" ? set.luckNote : (luck === null ? LUCK_ROLL_NOTE : ""),
    total,
    totalWithLuck: luck === null ? null : total + luck,
    derived: {
      hp,
      majorWound: majorWoundThreshold(hp),
      mp: magicPoints(stats.pow),
      sanity: stats.pow,
      mov: movement({ str: stats.str, siz: stats.siz, dex: stats.dex, age: 0, armorMovPenalty: 0 }),
      movNote: ROLL_MOV_NOTE,
      build: buildValue,
      damageBonus: damageBonus(buildValue),
    },
  };
}

export function rollCharacteristicSet(rng = Math.random) {
  return describeCharacteristicSet({
    str: roll3d6Times5(rng),
    con: roll3d6Times5(rng),
    dex: roll3d6Times5(rng),
    app: roll3d6Times5(rng),
    pow: roll3d6Times5(rng),
    siz: roll2d6Plus6Times5(rng),
    int: roll2d6Plus6Times5(rng),
    edu: roll2d6Plus6Times5(rng),
    luck: roll3d6Times5(rng),
    luckNote: "",
  });
}

export function rollCharacteristicSets(count, rng = Math.random) {
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > ROLL_SET_LIMIT) {
    throw new RuleError(`生成数量必须是 1 到 ${ROLL_SET_LIMIT} 的整数`);
  }
  return Array.from({ length: count }, () => rollCharacteristicSet(rng));
}

export function expectedSkillBase(skill, characteristics = {}) {
  const name = typeof skill?.name === "string" ? skill.name.trim() : "";
  const specialty = typeof skill?.specialty === "string" ? skill.specialty.trim() : "";
  if (name === "闪避") {
    const dex = integerOrNull(characteristics.dex);
    if (dex === null) return { known: false };
    return { known: true, base: dodgeBase(dex) };
  }
  if (name === "母语") {
    const edu = integerOrNull(characteristics.edu);
    if (edu === null) return { known: false };
    return { known: true, base: ownLanguageBase(edu) };
  }
  if (name === "技艺") return { known: true, base: 5 };
  if (name === "科学") return { known: true, base: specialty === "数学" ? 10 : 1 };
  if (name === "格斗") {
    if (!Object.hasOwn(FIGHTING_SPECIALTY_BASES, specialty)) return { known: false };
    return { known: true, base: FIGHTING_SPECIALTY_BASES[specialty] };
  }
  if (name === "射击") {
    if (!Object.hasOwn(FIREARMS_SPECIALTY_BASES, specialty)) return { known: false };
    return { known: true, base: FIREARMS_SPECIALTY_BASES[specialty] };
  }
  if (Object.hasOwn(FIXED_BASES, name)) return { known: true, base: FIXED_BASES[name] };
  return { known: false };
}

export function skillBaseErrors(card) {
  const errors = [];
  const skills = Array.isArray(card?.skills) ? card.skills : [];
  skills.forEach((skill, index) => {
    const expected = expectedSkillBase(skill, card?.characteristics);
    if (!expected.known) return;
    if (skill?.base !== expected.base) {
      errors.push({ path: `skills[${index}].base`, message: `基础值应为 ${expected.base}` });
    }
  });
  return errors;
}

export function pointBuyUsage(characteristics, options = {}) {
  const total = options.total;
  if (typeof total !== "number" || !Number.isInteger(total) || total <= 0) {
    return { ok: false, message: "购点总额必须是正整数" };
  }
  if (typeof options.includeLuck !== "boolean") {
    return { ok: false, message: "是否包含幸运必须明确选择" };
  }
  const keys = options.includeLuck
    ? CHARACTERISTIC_FIELDS
    : CHARACTERISTIC_FIELDS.filter((key) => key !== "luck");
  let used = 0;
  for (const key of keys) {
    const value = characteristics?.[key];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return { ok: false, message: "购点时计入的属性必须是整数" };
    }
    used += value;
  }
  return {
    ok: true,
    total,
    used,
    remaining: total - used,
    includeLuck: options.includeLuck,
  };
}

function safe(label, fn) {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    if (error instanceof RuleError) return { ok: false, message: error.message };
    throw error;
  }
}

function skillView(skill, characteristics) {
  const expected = expectedSkillBase(skill, characteristics);
  const numbers = ["base", "growth", "occupationPoints", "interestPoints"].every((key) => integerOrNull(skill?.[key]) !== null);
  const rating = numbers ? safe("技能", () => skillRating(skill)) : { ok: false };
  const mythosError = mythosPointError({
    name: skill?.name,
    occupationPoints: skill?.occupationPoints,
    interestPoints: skill?.interestPoints,
  });
  return {
    name: skill?.name ?? "",
    specialty: skill?.specialty ?? "",
    expectedBase: expected.known ? expected.base : null,
    rating: rating.ok ? rating.value : null,
    mythos: isCthulhuMythosSkill(skill),
    mythosError,
  };
}

export function derivePreview(draft, options = {}) {
  const characteristics = draft?.characteristics ?? {};
  const skills = Array.isArray(draft?.skills) ? draft.skills : [];
  const con = integerOrNull(characteristics.con);
  const siz = integerOrNull(characteristics.siz);
  const pow = integerOrNull(characteristics.pow);
  const str = integerOrNull(characteristics.str);
  const dex = integerOrNull(characteristics.dex);
  const intelligence = integerOrNull(characteristics.int);
  const age = integerOrNull(draft?.identity?.age);
  const hp = con !== null && siz !== null ? safe("HP", () => hitPoints(con, siz)) : null;
  const mp = pow !== null ? safe("MP", () => magicPoints(pow)) : null;
  const buildValue = str !== null && siz !== null ? safe("体格", () => build(str, siz)) : null;
  const mythos = skills.find((skill) => isCthulhuMythosSkill(skill));
  const mythosRating = mythos && ["base", "growth", "occupationPoints", "interestPoints"].every((key) => integerOrNull(mythos[key]) !== null)
    ? skillRating(mythos).regular
    : mythos
      ? null
      : 0;
  const armorPenalty = draft?.armor?.applyMovPenalty === true ? integerOrNull(draft.armor.movPenalty) : 0;
  const movable = str !== null && siz !== null && dex !== null && age !== null && age >= 0 && armorPenalty !== null;
  const formula = draft?.occupation?.pointFormula;
  let occupationPoints = null;
  if (formula === "CUSTOM") {
    occupationPoints = { total: null, message: "自定义职业没有已确认的封闭点数公式，不能从属性算出职业点" };
  } else if (OCCUPATION_POINT_FORMULAS.includes(formula)) {
    const total = safe("职业点", () => calculateOccupationPoints(formula, characteristics));
    occupationPoints = total.ok
      ? { total: total.value, spent: null, remaining: null }
      : { total: null, message: total.message };
  }
  if (occupationPoints?.total != null && skills.every((skill) => integerOrNull(skill?.occupationPoints) !== null)) {
    occupationPoints.spent = spentPoints(skills, "occupationPoints");
    occupationPoints.remaining = remainingOccupationPoints(occupationPoints.total, skills);
  }
  let interestPoints = null;
  if (intelligence !== null) {
    const total = interestPointsTotal(intelligence);
    interestPoints = { total, spent: null, remaining: null };
    if (skills.every((skill) => integerOrNull(skill?.interestPoints) !== null)) {
      interestPoints.spent = spentPoints(skills, "interestPoints");
      interestPoints.remaining = remainingInterestPoints(total, skills);
    }
  }
  const preview = {
    hp: hp?.ok ? hp.value : null,
    majorWound: hp?.ok ? safe("重伤", () => majorWoundThreshold(hp.value)).value ?? null : null,
    mp: mp?.ok ? mp.value : null,
    sanMaximum: mythosRating === null ? null : sanMaximum(mythosRating),
    mov: movable
      ? movement({ str, siz, dex, age, armorMovPenalty: armorPenalty ?? 0 })
      : null,
    build: buildValue?.ok ? buildValue.value : null,
    damageBonus: buildValue?.ok ? damageBonus(buildValue.value) : null,
    movAdjust: str !== null && siz !== null && dex !== null ? attributeMovAdjust(str, siz, dex) : null,
    occupationPoints,
    interestPoints,
    age: age !== null && age >= 0 ? ageBandNote(age) : null,
    skills: skills.map((skill) => skillView(skill, characteristics)),
    skillBaseErrors: skillBaseErrors(draft),
  };
  if (options.pointBuy) preview.pointBuy = pointBuyUsage(characteristics, options.pointBuy);
  return preview;
}

export function starterSkills() {
  return [
    { name: "会计", specialty: "", base: 5, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "攀爬", specialty: "", base: 20, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "话术", specialty: "", base: 5, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "聆听", specialty: "", base: 20, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "图书馆使用", specialty: "", base: 20, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "信用评级", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "克苏鲁神话", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "技艺", specialty: "", base: 5, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "科学", specialty: "", base: 1, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "闪避", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "母语", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "格斗", specialty: "鞭子", base: 5, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "射击", specialty: "步枪/霰弹枪", base: 25, growth: 0, occupationPoints: 0, interestPoints: 0 },
  ];
}
