import { randomUUID } from "node:crypto";
import { readAuthConfig } from "../auth/config.js";
import { SESSION_COOKIE } from "../auth/constants.js";
import { AuthError, authStatus } from "../auth/errors.js";
import { readCookie } from "../auth/http.js";
import { readSession } from "../auth/store.js";
import {
  BACKGROUND_FIELDS,
  CHARACTERISTIC_FIELDS,
  IDENTITY_FIELDS,
  RULESET,
  SCHEMA_VERSION,
} from "../rules/characterSchema.js";
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

const MAX_BODY_BYTES = 64 * 1024;
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

// B4 页面不编辑职业。CUSTOM 只是校验能通过的空职业，不代表已经选了职业。
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

function emptySections() {
  return {
    occupation: emptyOccupation(),
    skills: [],
    background: emptyBackground(),
    weapons: [],
    armor: null,
    possessions: { items: [] },
    spells: [],
  };
}

function present(record) {
  return {
    id: record.character.id,
    identity: copyKnown(record.character.identity, IDENTITY_FIELDS),
    characteristics: copyKnown(record.character.characteristics, CHARACTERISTIC_FIELDS),
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
  const duplicated = pathname.match(/^\/api\/characters\/([^/]+)\/duplicate$/);
  if (duplicated) return { name: "duplicate", id: decodeURIComponent(duplicated[1]) };
  const one = pathname.match(/^\/api\/characters\/([^/]+)$/);
  if (one) return { name: "one", id: decodeURIComponent(one[1]) };
  return null;
}

function assembleCreate(body, ownerId) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ruleset: RULESET,
    id: randomUUID(),
    ownerDiscordUserId: ownerId,
    identity: copyKnown(body.identity, IDENTITY_FIELDS),
    characteristics: copyKnown(body.characteristics, CHARACTERISTIC_FIELDS),
    ...emptySections(),
  };
}

// 请求体只有简介和属性。职业、技能和背景沿用已保存的内容。
function assembleUpdate(existing, body, ownerId, id) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ruleset: RULESET,
    id,
    ownerDiscordUserId: ownerId,
    identity: copyKnown(body.identity, IDENTITY_FIELDS),
    characteristics: copyKnown(body.characteristics, CHARACTERISTIC_FIELDS),
    occupation: existing.occupation,
    skills: existing.skills,
    background: existing.background,
    weapons: existing.weapons,
    armor: existing.armor,
    possessions: existing.possessions,
    spells: existing.spells,
  };
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

    if (route.name === "collection" && request.method === "POST") {
      const payload = await readPayload(request);
      if (payload.error) {
        sendJson(response, 400, { ok: false, error: "BAD_REQUEST", message: payload.error });
        return;
      }
      const card = assembleCreate(payload.value, user.userDiscordId);
      const result = validateCharacter(card);
      if (!result.ok) {
        validationResponse(response, result.errors);
        return;
      }
      sendJson(response, 201, present(createCharacter(context.db, card, { now: context.now })));
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
      const card = assembleUpdate(existing.character, payload.value, user.userDiscordId, route.id);
      const result = validateCharacter(card);
      if (!result.ok) {
        validationResponse(response, result.errors);
        return;
      }
      sendJson(response, 200, present(updateCharacter(context.db, route.id, card, { now: context.now })));
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
