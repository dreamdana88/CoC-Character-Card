import { CHARACTERISTIC_FIELDS, OCCUPATION_POINT_FORMULAS } from "./characterSchema.js";
import {
  ART_BASE,
  ART_SPECIALTIES,
  DRIVE_BASE,
  FIGHTING_SPECIALTY_BASES,
  FIREARMS_SPECIALTY_BASES,
  FIXED_SKILL_BASES,
  LANGUAGE_BASE,
  LORE_BASE,
  SCIENCE_DEFAULT_BASE,
  SCIENCE_SPECIALTY_BASES,
  SKILL_NAMES,
  SURVIVAL_BASE,
} from "./data/skills.js";

export {
  ART_SPECIALTIES,
  FIGHTING_SPECIALTY_BASES,
  FIREARMS_SPECIALTY_BASES,
  SCIENCE_SPECIALTY_BASES,
  SKILL_NAMES,
};
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
      initialSan: stats.pow,
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

function canonicalSkillName(name) {
  return name.trim().replace(/[：:]\s*$/u, "").replace(/\s*Ω\s*$/u, "").replace(/[①②③]$/u, "");
}

export function expectedSkillBase(skill, characteristics = {}) {
  const name = canonicalSkillName(typeof skill?.name === "string" ? skill.name : "");
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
  if (name === "技艺") return { known: true, base: ART_BASE };
  if (name === "科学") {
    if (Object.hasOwn(SCIENCE_SPECIALTY_BASES, specialty)) return { known: true, base: SCIENCE_SPECIALTY_BASES[specialty] };
    return { known: true, base: SCIENCE_DEFAULT_BASE };
  }
  if (name === "格斗") {
    if (!Object.hasOwn(FIGHTING_SPECIALTY_BASES, specialty)) return { known: false };
    return { known: true, base: FIGHTING_SPECIALTY_BASES[specialty] };
  }
  if (name === "射击") {
    if (!Object.hasOwn(FIREARMS_SPECIALTY_BASES, specialty)) return { known: false };
    return { known: true, base: FIREARMS_SPECIALTY_BASES[specialty] };
  }
  if (name === "驾驶") return { known: true, base: DRIVE_BASE };
  if (name === "外语") return { known: true, base: LANGUAGE_BASE };
  if (name === "生存") return { known: true, base: SURVIVAL_BASE };
  if (name === "学识") return { known: true, base: LORE_BASE };
  if (Object.hasOwn(FIXED_SKILL_BASES, name)) return { known: true, base: FIXED_SKILL_BASES[name] };
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

function pointsAreIntegers(skills, field) {
  return skills.every((skill) => integerOrNull(skill?.[field]) !== null);
}

export function pointPoolErrors(card) {
  const errors = [];
  const skills = Array.isArray(card?.skills) ? card.skills : [];
  const formula = card?.occupation?.pointFormula;
  if (pointsAreIntegers(skills, "occupationPoints") && formula && formula !== "CUSTOM" && OCCUPATION_POINT_FORMULAS.includes(formula)) {
    try {
      const total = calculateOccupationPoints(formula, card?.characteristics);
      const remaining = remainingOccupationPoints(total, skills);
      if (remaining < 0) {
        errors.push({ path: "occupationPoints", message: `职业点超过总额，已用 ${total - remaining} / ${total}` });
      }
    } catch (error) {
      if (!(error instanceof RuleError)) throw error;
    }
  }
  const intelligence = integerOrNull(card?.characteristics?.int);
  if (intelligence !== null && pointsAreIntegers(skills, "interestPoints")) {
    const total = interestPointsTotal(intelligence);
    const remaining = remainingInterestPoints(total, skills);
    if (remaining < 0) {
      errors.push({ path: "interestPoints", message: `兴趣点超过总额，已用 ${total - remaining} / ${total}` });
    }
  }
  return errors;
}

function creditSkillIndexes(skills) {
  const indexes = [];
  skills.forEach((skill, index) => {
    const name = canonicalSkillName(typeof skill?.name === "string" ? skill.name : "");
    if (name === "信用评级") indexes.push(index);
  });
  return indexes;
}

function occupationIsSelected(occupation) {
  const id = typeof occupation?.id === "string" ? occupation.id.trim() : "";
  return id !== "" && id !== "unset";
}

export function creditRatingError(card) {
  const skills = Array.isArray(card?.skills) ? card.skills : [];
  const indexes = creditSkillIndexes(skills);
  if (indexes.length > 1) {
    return { path: `skills[${indexes[1]}]`, message: "信用评级只能有一条" };
  }
  if (indexes.length === 0) {
    if (occupationIsSelected(card?.occupation)) {
      return { path: "skills", message: "选定职业后必须有一条信用评级" };
    }
    return null;
  }
  const index = indexes[0];
  const min = card?.occupation?.creditMin;
  const max = card?.occupation?.creditMax;
  if (!Number.isInteger(min) || !Number.isInteger(max)) return null;
  const skill = skills[index];
  if (!["base", "growth", "occupationPoints", "interestPoints"].every((key) => integerOrNull(skill?.[key]) !== null)) return null;
  let rating;
  try {
    rating = skillRating(skill).regular;
  } catch (error) {
    if (error instanceof RuleError) return null;
    throw error;
  }
  if (rating < min || rating > max) {
    return { path: `skills[${index}]`, message: `信用评级必须在 ${min} 到 ${max} 之间` };
  }
  return null;
}

export function occupationPointTargetErrors(card) {
  const errors = [];
  const skills = Array.isArray(card?.skills) ? card.skills : [];
  const listed = card?.occupation?.occupationalSkills;
  if (!Array.isArray(listed)) return errors;
  const allowed = new Set(listed.filter((name) => typeof name === "string").map((name) => name.trim()).filter(Boolean));
  skills.forEach((skill, index) => {
    const points = skill?.occupationPoints;
    if (typeof points !== "number" || !Number.isInteger(points) || points <= 0) return;
    const rawName = typeof skill?.name === "string" ? skill.name.trim() : "";
    if (canonicalSkillName(rawName) === "信用评级") return;
    if (allowed.has(rawName)) return;
    errors.push({
      path: `skills[${index}].occupationPoints`,
      index,
      message: "非本职技能不能分配职业点",
    });
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
  for (const key of CHARACTERISTIC_FIELDS) {
    const value = characteristics?.[key];
    const counted = keys.includes(key);
    if (!counted && (value === undefined || value === null || value === "")) continue;
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return { ok: false, message: "购点时计入的属性必须是整数" };
    }
    if (value < 0 || value > 90) {
      return { ok: false, message: "购点时每项属性必须是 0 到 90 的整数" };
    }
  }
  let used = 0;
  for (const key of keys) used += characteristics[key];
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

function creditView(draft) {
  const min = draft?.occupation?.creditMin;
  const max = draft?.occupation?.creditMax;
  const error = creditRatingError(draft);
  const skills = Array.isArray(draft?.skills) ? draft.skills : [];
  const matches = skills.filter((item) => canonicalSkillName(typeof item?.name === "string" ? item.name : "") === "信用评级");
  const skill = matches.length === 1 ? matches[0] : null;
  let rating = null;
  if (skill && ["base", "growth", "occupationPoints", "interestPoints"].every((key) => integerOrNull(skill?.[key]) !== null)) {
    const result = safe("信用评级", () => skillRating(skill));
    if (result.ok) rating = result.value.regular;
  }
  return {
    min: Number.isInteger(min) ? min : null,
    max: Number.isInteger(max) ? max : null,
    rating,
    error: error?.message ?? null,
  };
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
  const placementByIndex = new Map(occupationPointTargetErrors(draft).map((error) => [error.index, error.message]));
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
    skills: skills.map((skill, index) => {
      const view = skillView(skill, characteristics);
      view.occupationPointError = placementByIndex.get(index) ?? null;
      return view;
    }),
    skillBaseErrors: skillBaseErrors(draft),
    credit: creditView(draft),
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
