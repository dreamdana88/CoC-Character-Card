import {
  BACKGROUND_FIELDS,
  CHARACTERISTIC_FIELDS,
  ERAS,
  FORBIDDEN_CARD_FIELDS,
  RULESET,
  SCHEMA_VERSION,
  isOccupationPointFormula,
} from "./characterSchema.js";
import { mythosPointError } from "./coc7.js";
import { creditRatingError, occupationPointTargetErrors, pointPoolErrors } from "./sheet.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rejectForbidden(value, path, fail) {
  if (!isPlainObject(value)) return;
  for (const key of FORBIDDEN_CARD_FIELDS) {
    if (Object.hasOwn(value, key)) {
      fail(path ? `${path}.${key}` : key, "长期卡不保存本局状态或 Excel 坐标");
    }
  }
}

function requireObject(card, path, fail) {
  const value = card;
  if (!isPlainObject(value)) {
    fail(path, `${path}必须是对象`);
    return null;
  }
  rejectForbidden(value, path, fail);
  return value;
}

function requireString(object, path, key, fail, { allowEmpty = true } = {}) {
  if (!object || !Object.hasOwn(object, key)) {
    fail(`${path}.${key}`, `缺少 ${key}`);
    return;
  }
  const value = object[key];
  if (typeof value !== "string") {
    fail(`${path}.${key}`, `${key}必须是字符串`);
    return;
  }
  if (!allowEmpty && value.trim() === "") {
    fail(`${path}.${key}`, `缺少 ${key}`);
  }
}

function requireInteger(object, path, key, fail) {
  if (!object || !Object.hasOwn(object, key)) {
    fail(`${path}.${key}`, `缺少 ${key}`);
    return;
  }
  const value = object[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(`${path}.${key}`, `${key}必须是整数`);
  }
}

function validateSkill(skill, index, fail) {
  const path = `skills[${index}]`;
  if (!isPlainObject(skill)) {
    fail(path, "技能必须是对象");
    return;
  }
  rejectForbidden(skill, path, fail);
  requireString(skill, path, "name", fail, { allowEmpty: false });
  if (Object.hasOwn(skill, "specialty") && typeof skill.specialty !== "string") {
    fail(`${path}.specialty`, "专攻必须是字符串");
  }
  if (Object.hasOwn(skill, "key") && typeof skill.key !== "string") {
    fail(`${path}.key`, "key必须是字符串");
  }
  for (const key of ["base", "growth", "occupationPoints", "interestPoints"]) {
    requireInteger(skill, path, key, fail);
    if (typeof skill[key] === "number" && skill[key] < 0) {
      fail(`${path}.${key}`, `${key}不能为负数`);
    }
  }
  const mythosError = mythosPointError(skill);
  if (mythosError) fail(path, mythosError);
}

export function validateCharacter(card) {
  const errors = [];
  const fail = (path, message) => errors.push({ path, message });

  if (!isPlainObject(card)) {
    return { ok: false, errors: [{ path: "", message: "角色卡必须是对象" }] };
  }
  rejectForbidden(card, "", fail);

  if (!Object.hasOwn(card, "schemaVersion")) fail("schemaVersion", "缺少 schemaVersion");
  else if (card.schemaVersion !== SCHEMA_VERSION) fail("schemaVersion", "schemaVersion 必须是 1");

  if (!Object.hasOwn(card, "ruleset")) fail("ruleset", "缺少 ruleset");
  else if (card.ruleset !== RULESET) fail("ruleset", 'ruleset 必须是 "coc7"');

  if (typeof card.id !== "string" || card.id.trim() === "") fail("id", "缺少 id");
  if (typeof card.ownerDiscordUserId !== "string" || card.ownerDiscordUserId.trim() === "") {
    fail("ownerDiscordUserId", "缺少 ownerDiscordUserId");
  }

  const identity = requireObject(card.identity, "identity", fail);
  if (identity) {
    for (const key of ["name", "sex", "residence", "birthplace"]) {
      requireString(identity, "identity", key, fail);
    }
    requireInteger(identity, "identity", "age", fail);
    if (typeof identity.age === "number" && identity.age < 0) fail("identity.age", "年龄不能为负数");
    if (!Object.hasOwn(identity, "era")) fail("identity.era", "缺少 era");
    else if (!ERAS.includes(identity.era)) fail("identity.era", "时代必须是 1920s、现代或其他");
  }

  if (Object.hasOwn(card, "initialSan")) {
    if (typeof card.initialSan !== "number" || !Number.isInteger(card.initialSan)) fail("initialSan", "初始理智必须是整数");
    else if (card.initialSan < 0 || card.initialSan > 99) fail("initialSan", "初始理智必须是 0 到 99 的整数");
  }

  const characteristics = requireObject(card.characteristics, "characteristics", fail);
  if (characteristics) {
    for (const key of CHARACTERISTIC_FIELDS) {
      requireInteger(characteristics, "characteristics", key, fail);
    }
  }

  const occupation = requireObject(card.occupation, "occupation", fail);
  if (occupation) {
    requireString(occupation, "occupation", "id", fail, { allowEmpty: false });
    requireString(occupation, "occupation", "name", fail);
    if (!Object.hasOwn(occupation, "pointFormula")) fail("occupation.pointFormula", "缺少职业点公式");
    else if (!isOccupationPointFormula(occupation.pointFormula)) {
      fail("occupation.pointFormula", `未知职业点公式：${occupation.pointFormula}`);
    }
    requireInteger(occupation, "occupation", "creditMin", fail);
    requireInteger(occupation, "occupation", "creditMax", fail);
    if (Number.isInteger(occupation.creditMin) && Number.isInteger(occupation.creditMax) && occupation.creditMin > occupation.creditMax) {
      fail("occupation.creditMin", "信用评级下限不能高于上限");
    }
    if (!Array.isArray(occupation.occupationalSkills) || occupation.occupationalSkills.some((skill) => typeof skill !== "string")) {
      fail("occupation.occupationalSkills", "本职技能必须是字符串数组");
    } else if (occupation.pointFormula === "CUSTOM" && occupation.occupationalSkills.length > 8) {
      fail("occupation.occupationalSkills", "自定义职业最多 8 个本职技能");
    }
  }

  if (!Array.isArray(card.skills)) fail("skills", "技能必须是数组");
  else card.skills.forEach((skill, index) => validateSkill(skill, index, fail));

  const background = requireObject(card.background, "background", fail);
  if (background) {
    for (const key of BACKGROUND_FIELDS) requireString(background, "background", key, fail);
  }

  if (!Array.isArray(card.weapons)) fail("weapons", "武器必须是数组");
  else {
    card.weapons.forEach((weapon, index) => {
      if (!isPlainObject(weapon)) fail(`weapons[${index}]`, "武器必须是对象");
      else {
        requireString(weapon, `weapons[${index}]`, "name", fail, { allowEmpty: false });
        for (const key of ["type", "skill", "damage", "range", "impale", "rate", "ammo", "malfunction", "era", "price", "invented", "note"]) {
          if (Object.hasOwn(weapon, key) && typeof weapon[key] !== "string") {
            fail(`weapons[${index}].${key}`, "武器资料必须是文字");
          }
        }
      }
    });
  }

  if (card.armor !== null && card.armor !== undefined) {
    const armor = requireObject(card.armor, "armor", fail);
    if (armor) {
      requireString(armor, "armor", "name", fail);
      if (typeof armor.applyMovPenalty !== "boolean") fail("armor.applyMovPenalty", "护甲移动惩罚开关必须是布尔值");
      if (armor.applyMovPenalty === true && (typeof armor.movPenalty !== "number" || !Number.isInteger(armor.movPenalty) || armor.movPenalty < 0)) {
        fail("armor.movPenalty", "打开护甲移动惩罚时必须给出非负整数惩罚");
      }
    }
  }

  if (!isPlainObject(card.possessions)) fail("possessions", "物品必须是对象");
  else if (!Array.isArray(card.possessions.items) || card.possessions.items.some((item) => !isPlainObject(item) || typeof item.name !== "string" || item.name.trim() === "")) {
    fail("possessions.items", "物品必须是带名称的数组");
  }

  if (!Array.isArray(card.spells)) fail("spells", "法术必须是数组");
  else {
    card.spells.forEach((spell, index) => {
      if (!isPlainObject(spell)) fail(`spells[${index}]`, "法术必须是对象");
      else requireString(spell, `spells[${index}]`, "name", fail, { allowEmpty: false });
    });
  }

  for (const error of pointPoolErrors(card)) fail(error.path, error.message);
  for (const error of occupationPointTargetErrors(card)) fail(error.path, error.message);
  const credit = creditRatingError(card);
  if (credit) fail(credit.path, credit.message);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
