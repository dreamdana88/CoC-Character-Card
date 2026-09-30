import { randomUUID } from "node:crypto";
import { readAuthConfig } from "../auth/config.js";
import { SESSION_COOKIE } from "../auth/constants.js";
import { AuthError, authStatus } from "../auth/errors.js";
import { readCookie } from "../auth/http.js";
import { readSession } from "../auth/store.js";
import { RuleError } from "../rules/coc7.js";
import {
  BACKGROUND_FIELDS,
  CHARACTERISTIC_FIELDS,
  IDENTITY_FIELDS,
  RULESET,
  SCHEMA_VERSION,
} from "../rules/characterSchema.js";
import { derivePreview, pointBuyUsage, rollCharacteristicSets, skillBaseErrors } from "../rules/sheet.js";
import { validateCharacter } from "../rules/validation.js";
import {
  createCharacter,
  deleteCharacter,
  duplicateCharacter,
  getCharacter,
  listCharactersByOwner,
  updateCharacter,
} from "../storage/index.js";
import { StorageError } from "../storage/errors.js";

const MAX_BODY_BYTES = 512 * 1024;
const SESSION_FAILURES = new Set([
  "SESSION_MISSING",
  "SESSION_EXPIRED",
  "SESSION_REVOKED",
  "ENTITLEMENT_EXPIRED",
]);

function headerValue(headers, name) {
  if (!headers) return "";
  const value = headers[name] ?? headers[name.toLowerCase()];
  return typeof value === "string" ? value : "";
}

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function copyKnown(source, keys) {
  const out = {};
  if (!source || typeof source !== "object" || Array.isArray(source)) return out;
  for (const key of keys) {
    if (Object.hasOwn(source, key)) out[key] = source[key];
  }
  return out;
}

function emptyOccupation() {
  return {
    id: "unset",
    name: "",
    pointFormula: "CUSTOM",
    creditMin: 0,
    creditMax: 0,
    occupationalSkills: [],
  };
}

function emptyBackground() {
  return Object.fromEntries(BACKGROUND_FIELDS.map((key) => [key, ""]));
}

function readOccupation(occupation) {
  if (!occupation || typeof occupation !== "object" || Array.isArray(occupation)) return occupation;
  const id = typeof occupation.id === "string" && occupation.id.trim() !== "" ? occupation.id : "";
  return {
    id,
    name: occupation.name,
    pointFormula: occupation.pointFormula,
    creditMin: occupation.creditMin,
    creditMax: occupation.creditMax,
    occupationalSkills: occupation.occupationalSkills,
  };
}

function readSkill(skill) {
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) return skill;
  const out = {
    name: skill.name,
    base: skill.base,
    growth: skill.growth,
    occupationPoints: skill.occupationPoints,
    interestPoints: skill.interestPoints,
  };
  out.specialty = Object.hasOwn(skill, "specialty") ? skill.specialty : "";
  if (Object.hasOwn(skill, "key")) out.key = skill.key;
  return out;
}

function readSkills(skills) {
  if (!Array.isArray(skills)) return skills;
  return skills.map(readSkill);
}

function readWeapon(weapon, index, errors) {
  if (!weapon || typeof weapon !== "object" || Array.isArray(weapon)) return weapon;
  const out = {
    name: weapon.name,
    type: typeof weapon.type === "string" ? weapon.type : "",
    skill: typeof weapon.skill === "string" ? weapon.skill : "",
    damage: typeof weapon.damage === "string" ? weapon.damage : "",
  };
  if (Object.hasOwn(weapon, "quantity")) {
    const quantity = weapon.quantity;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
      errors.push({ path: `weapons[${index}].quantity`, message: "数量必须是非负整数" });
    } else {
      out.quantity = quantity;
    }
  }
  return out;
}

function readWeapons(weapons, errors) {
  if (!Array.isArray(weapons)) return weapons;
  return weapons.map((weapon, index) => readWeapon(weapon, index, errors));
}

function readArmor(armor) {
  if (armor === null) return null;
  if (!armor || typeof armor !== "object" || Array.isArray(armor)) return armor;
  const out = {
    name: armor.name,
    applyMovPenalty: armor.applyMovPenalty,
  };
  if (Object.hasOwn(armor, "movPenalty")) out.movPenalty = armor.movPenalty;
  return out;
}

function readNamedList(list) {
  if (!Array.isArray(list)) return list;
  return list.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
    return { name: entry.name };
  });
}

function readPossessions(possessions, errors) {
  if (!possessions || typeof possessions !== "object" || Array.isArray(possessions)) return possessions;
  const out = { items: readNamedList(possessions.items) };
  if (Object.hasOwn(possessions, "cash")) {
    const cash = possessions.cash;
    if (typeof cash !== "number" || !Number.isInteger(cash) || cash < 0) {
      errors.push({ path: "possessions.cash", message: "现金必须是非负整数" });
    } else {
      out.cash = cash;
    }
  }
  return out;
}

function sectionValue(body, key, existing, fallback, read) {
  if (Object.hasOwn(body, key)) return read(body[key]);
  if (existing && Object.hasOwn(existing, key)) return existing[key];
  return fallback;
}

function pointBuyError(characteristics, pointBuy) {
  const usage = pointBuyUsage(characteristics, pointBuy);
  if (!usage.ok) return usage.message;
  if (usage.remaining < 0) return `购点超过总额，已用 ${usage.used} / ${usage.total}`;
  return "";
}

// 请求没带的栏目沿用已保存的内容。购点额度不写入角色卡。
function assembleCard(body, { id, ownerId, existing }) {
  const errors = [];
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const card = {
    schemaVersion: SCHEMA_VERSION,
    ruleset: RULESET,
    id,
    ownerDiscordUserId: ownerId,
    identity: copyKnown(source.identity, IDENTITY_FIELDS),
    characteristics: copyKnown(source.characteristics, CHARACTERISTIC_FIELDS),
    occupation: sectionValue(source, "occupation", existing, emptyOccupation(), readOccupation),
    skills: sectionValue(source, "skills", existing, [], readSkills),
    background: sectionValue(source, "background", existing, emptyBackground(), (value) => copyKnown(value, BACKGROUND_FIELDS)),
    weapons: sectionValue(source, "weapons", existing, [], (value) => readWeapons(value, errors)),
    armor: sectionValue(source, "armor", existing, null, readArmor),
    possessions: sectionValue(source, "possessions", existing, { items: [] }, (value) => readPossessions(value, errors)),
    spells: sectionValue(source, "spells", existing, [], readNamedList),
  };
  if (Object.hasOwn(source, "sanity")) {
    if (source.sanity !== null && source.sanity !== "") {
      if (typeof source.sanity !== "number" || !Number.isInteger(source.sanity)) {
        errors.push({ path: "sanity", message: "理智必须是整数" });
      } else if (source.sanity > 99) {
        errors.push({ path: "sanity", message: "理智不能超过 99" });
      } else {
        card.sanity = source.sanity;
      }
    }
  } else if (existing && Object.hasOwn(existing, "sanity")) {
    card.sanity = existing.sanity;
  }
  if (Object.hasOwn(source, "pointBuy")) {
    const message = pointBuyError(card.characteristics, source.pointBuy);
    if (message) errors.push({ path: "pointBuy", message });
  }
  errors.push(...skillBaseErrors(card));
  return { card, errors };
}

function presentSkill(skill) {
  const out = {
    name: skill?.name,
    specialty: typeof skill?.specialty === "string" ? skill.specialty : "",
    base: skill?.base,
    growth: skill?.growth,
    occupationPoints: skill?.occupationPoints,
    interestPoints: skill?.interestPoints,
  };
  if (skill && Object.hasOwn(skill, "key")) out.key = skill.key;
  return out;
}

function presentWeapon(weapon) {
  const out = {
    name: weapon?.name,
    type: typeof weapon?.type === "string" ? weapon.type : "",
    skill: typeof weapon?.skill === "string" ? weapon.skill : "",
    damage: typeof weapon?.damage === "string" ? weapon.damage : "",
  };
  if (weapon && Object.hasOwn(weapon, "quantity")) out.quantity = weapon.quantity;
  return out;
}

function presentArmor(armor) {
  if (armor == null) return null;
  const out = {
    name: armor.name,
    applyMovPenalty: armor.applyMovPenalty,
  };
  if (Object.hasOwn(armor, "movPenalty")) out.movPenalty = armor.movPenalty;
  return out;
}

function presentPossessions(possessions) {
  const items = Array.isArray(possessions?.items) ? possessions.items.map((item) => ({ name: item?.name })) : [];
  const out = { items };
  if (possessions && Object.hasOwn(possessions, "cash")) out.cash = possessions.cash;
  return out;
}

function present(record) {
  const card = record.character;
  return {
    id: card.id,
    identity: copyKnown(card.identity, IDENTITY_FIELDS),
    characteristics: copyKnown(card.characteristics, CHARACTERISTIC_FIELDS),
    occupation: readOccupation(card.occupation),
    skills: Array.isArray(card.skills) ? card.skills.map(presentSkill) : [],
    background: copyKnown(card.background, BACKGROUND_FIELDS),
    weapons: Array.isArray(card.weapons) ? card.weapons.map(presentWeapon) : [],
    armor: presentArmor(card.armor),
    possessions: presentPossessions(card.possessions),
    spells: Array.isArray(card.spells) ? card.spells.map((spell) => ({ name: spell?.name })) : [],
    derived: derivePreview(card),
    ...(Object.hasOwn(card, "sanity") ? { sanity: card.sanity } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function currentUser(request, context) {
  const config = readAuthConfig(context.env);
  const sessionId = readCookie(headerValue(request.headers, "cookie"), SESSION_COOKIE);
  return readSession(context.db, config, sessionId, context.now);
}

function readRawBody(request) {
  if (typeof request.body === "string") return Promise.resolve(request.body);
  if (typeof request.on !== "function") return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let failed = false;
    request.on("data", (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        failed = true;
        reject(Object.assign(new Error("请求体过大"), { code: "BODY_TOO_LARGE" }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!failed) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", (error) => {
      if (!failed) reject(error);
    });
  });
}

function parsePayload(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && !Buffer.isBuffer(raw)) {
    return { value: raw };
  }
  const text = typeof raw === "string" ? raw : "";
  if (text.trim() === "") return { value: {} };
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { error: "请求体不是 JSON 对象" };
    }
    return { value };
  } catch {
    return { error: "请求体不是 JSON" };
  }
}

async function readPayload(request) {
  if (Object.hasOwn(request, "body") && request.body != null && typeof request.body !== "string") {
    return parsePayload(request.body);
  }
  const raw = await readRawBody(request);
  if (raw.length > MAX_BODY_BYTES) {
    throw Object.assign(new Error("请求体过大"), { code: "BODY_TOO_LARGE" });
  }
  return parsePayload(raw);
}

function validationResponse(response, errors) {
  sendJson(response, 400, {
    ok: false,
    error: "VALIDATION",
    message: "角色卡未通过校验",
    errors,
  });
}

function ownedOrReject(response, record, userId) {
  if (record.character.ownerDiscordUserId === userId) return true;
  sendJson(response, 403, { ok: false, error: "FORBIDDEN", message: "不能访问别人的角色卡" });
  return false;
}

function sendStorageError(response, error) {
  if (error.code === "NOT_FOUND") {
    sendJson(response, 404, { ok: false, error: "NOT_FOUND", message: "找不到角色卡" });
    return;
  }
  if (error.code === "OWNER_MISMATCH") {
    sendJson(response, 403, { ok: false, error: "FORBIDDEN", message: "不能访问别人的角色卡" });
    return;
  }
  if (error.code === "VALIDATION") {
    validationResponse(response, error.errors ?? []);
    return;
  }
  sendJson(response, 500, { ok: false, error: error.code || "UNKNOWN", message: "角色卡保存失败" });
}

function routeOf(pathname) {
  if (pathname === "/api/characters") return { name: "collection" };
  if (pathname === "/api/characters/preview") return { name: "preview" };
  if (pathname === "/api/characteristics/rolls") return { name: "rolls" };
  const duplicated = pathname.match(/^\/api\/characters\/([^/]+)\/duplicate$/);
  if (duplicated) return { name: "duplicate", id: decodeURIComponent(duplicated[1]) };
  const one = pathname.match(/^\/api\/characters\/([^/]+)$/);
  if (one) return { name: "one", id: decodeURIComponent(one[1]) };
  return null;
}

function mergedErrors(assembled, validated) {
  return assembled.errors.concat(validated.ok ? [] : validated.errors);
}

export async function handleCharacterApi(request, response, context) {
  const log = context.log ?? console.error;
  const url = new URL(request.url, "http://127.0.0.1");
  let route;
  try {
    route = routeOf(url.pathname);
  } catch {
    sendJson(response, 404, { ok: false, error: "NOT_FOUND", message: "找不到角色卡" });
    return;
  }
  if (!route) {
    sendJson(response, 404, { ok: false, error: "NOT_FOUND", message: "没有这个地址" });
    return;
  }

  const allowed = {
    collection: ["GET", "POST"],
    preview: ["POST"],
    rolls: ["POST"],
    one: ["GET", "PATCH", "DELETE"],
    duplicate: ["POST"],
  };
  if (!allowed[route.name].includes(request.method)) {
    response.setHeader("Allow", allowed[route.name].join(", "));
    sendJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED", message: "方法不允许" });
    return;
  }

  let user;
  try {
    user = currentUser(request, context);
  } catch (error) {
    if (error instanceof AuthError) {
      if (SESSION_FAILURES.has(error.code) || error.code === "MISSING_CONFIG") {
        log(`登录或会话失败：${error.code}`);
      }
      sendJson(response, authStatus(error.code), { ok: false, error: error.code, message: error.message });
      return;
    }
    throw error;
  }

  try {
    if (route.name === "collection" && request.method === "GET") {
      const records = listCharactersByOwner(context.db, user.userDiscordId);
      sendJson(response, 200, { characters: records.map(present) });
      return;
    }

    if (route.name === "preview" && request.method === "POST") {
      const payload = await readPayload(request);
      if (payload.error) {
        sendJson(response, 400, { ok: false, error: "BAD_REQUEST", message: payload.error });
        return;
      }
      const assembled = assembleCard(payload.value, {
        id: "preview",
        ownerId: user.userDiscordId,
        existing: null,
      });
      const pointBuy = Object.hasOwn(payload.value, "pointBuy") ? payload.value.pointBuy : undefined;
      sendJson(response, 200, {
        derived: derivePreview(assembled.card, pointBuy ? { pointBuy } : {}),
      });
      return;
    }

    if (route.name === "rolls" && request.method === "POST") {
      const payload = await readPayload(request);
      if (payload.error) {
        sendJson(response, 400, { ok: false, error: "BAD_REQUEST", message: payload.error });
        return;
      }
      try {
        const sets = rollCharacteristicSets(payload.value.count, context.rng ?? Math.random);
        sendJson(response, 200, { sets });
      } catch (error) {
        if (error instanceof RuleError) {
          sendJson(response, 400, { ok: false, error: "BAD_REQUEST", message: error.message });
          return;
        }
        throw error;
      }
      return;
    }

    if (route.name === "collection" && request.method === "POST") {
      const payload = await readPayload(request);
      if (payload.error) {
        sendJson(response, 400, { ok: false, error: "BAD_REQUEST", message: payload.error });
        return;
      }
      const assembled = assembleCard(payload.value, {
        id: randomUUID(),
        ownerId: user.userDiscordId,
        existing: null,
      });
      const validated = validateCharacter(assembled.card);
      const errors = mergedErrors(assembled, validated);
      if (errors.length > 0) {
        validationResponse(response, errors);
        return;
      }
      sendJson(response, 201, present(createCharacter(context.db, assembled.card, { now: context.now })));
      return;
    }

    if (route.name === "one" && request.method === "GET") {
      const record = getCharacter(context.db, route.id);
      if (!ownedOrReject(response, record, user.userDiscordId)) return;
      sendJson(response, 200, present(record));
      return;
    }

    if (route.name === "one" && request.method === "PATCH") {
      const existing = getCharacter(context.db, route.id);
      if (!ownedOrReject(response, existing, user.userDiscordId)) return;
      const payload = await readPayload(request);
      if (payload.error) {
        sendJson(response, 400, { ok: false, error: "BAD_REQUEST", message: payload.error });
        return;
      }
      const assembled = assembleCard(payload.value, {
        id: route.id,
        ownerId: user.userDiscordId,
        existing: existing.character,
      });
      const validated = validateCharacter(assembled.card);
      const errors = mergedErrors(assembled, validated);
      if (errors.length > 0) {
        validationResponse(response, errors);
        return;
      }
      sendJson(response, 200, present(updateCharacter(context.db, route.id, assembled.card, { now: context.now })));
      return;
    }

    if (route.name === "one" && request.method === "DELETE") {
      deleteCharacter(context.db, route.id, user.userDiscordId);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (route.name === "duplicate" && request.method === "POST") {
      const record = duplicateCharacter(context.db, route.id, user.userDiscordId, { now: context.now });
      sendJson(response, 201, present(record));
    }
  } catch (error) {
    if (error instanceof StorageError) {
      if (!["NOT_FOUND", "OWNER_MISMATCH", "VALIDATION"].includes(error.code)) {
        log(`角色卡请求失败：${error.code}`);
      }
      sendStorageError(response, error);
      return;
    }
    if (error?.code === "BODY_TOO_LARGE") {
      sendJson(response, 413, { ok: false, error: "BODY_TOO_LARGE", message: "请求体过大" });
      return;
    }
    throw error;
  }
}
