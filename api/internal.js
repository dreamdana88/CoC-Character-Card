import { timingSafeEqual } from "node:crypto";
import { getCharacter, listCharactersByOwner } from "../storage/index.js";
import { derivePreview } from "../rules/sheet.js";

function send(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function fail(response, status, error, message) {
  send(response, status, { ok: false, error, message });
}

function authorized(request, env) {
  const secret = env?.INTERNAL_API_SECRET;
  const header = request.headers?.authorization;
  if (typeof secret !== "string" || !secret.trim() || typeof header !== "string") return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function handleInternalApi(request, response, context) {
  if (!authorized(request, context.env)) {
    fail(response, 401, "UNAUTHORIZED", "内部接口认证失败");
    return;
  }
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    fail(response, 405, "METHOD_NOT_ALLOWED", "内部接口只允许 GET");
    return;
  }
  try {
    const path = new URL(request.url, "http://127.0.0.1").pathname;
    const users = /^\/internal\/users\/([^/]*)\/characters$/.exec(path);
    if (users) {
      let userId;
      try { userId = decodeURIComponent(users[1]); }
      catch { fail(response, 400, "INVALID_PARAMETER", "Discord 用户 ID 无效"); return; }
      if (!/^\d+$/.test(userId)) {
        fail(response, 400, "INVALID_PARAMETER", "Discord 用户 ID 必须为非空数字字符串");
        return;
      }
      const characters = listCharactersByOwner(context.db, userId).map(({ character, updatedAt }) => ({
        id: character.id,
        ownerDiscordUserId: character.ownerDiscordUserId,
        name: character.identity.name,
        occupation: character.occupation.name,
        era: character.identity.era,
        updatedAt,
      }));
      send(response, 200, { ok: true, characters });
      return;
    }
    const card = /^\/internal\/characters\/([^/]+)$/.exec(path);
    if (card) {
      let id;
      try { id = decodeURIComponent(card[1]); }
      catch { fail(response, 400, "INVALID_PARAMETER", "角色卡 ID 无效"); return; }
      if (!id.trim()) { fail(response, 400, "INVALID_PARAMETER", "角色卡 ID 不能为空"); return; }
      const record = getCharacter(context.db, id);
      send(response, 200, { ok: true, ...record, derived: derivePreview(record.character) });
      return;
    }
    fail(response, 404, "NOT_FOUND", "内部接口不存在");
  } catch (error) {
    if (error?.code === "NOT_FOUND") {
      fail(response, 404, "NOT_FOUND", "角色卡不存在");
      return;
    }
    // Do not log exception text, request headers, or other potentially sensitive values.
    (context.log ?? console.error)("内部角色卡读取失败");
    fail(response, 500, "INTERNAL_ERROR", "内部角色卡读取失败");
  }
}
