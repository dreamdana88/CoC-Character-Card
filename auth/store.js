import { createHmac, randomBytes } from "node:crypto";
import { ENTITLEMENT_TTL_MS, OAUTH_STATE_TTL_MS, SESSION_TTL_MS } from "./constants.js";
import { AuthError } from "./errors.js";

function atTime(now) {
  const value = typeof now === "function" ? now() : now instanceof Date ? now : new Date();
  if (Number.isNaN(value.getTime())) throw new AuthError("时间无效", { code: "INVALID_TIME" });
  return value;
}

export function tokenHash(secret, token) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function createOAuthState(db, config, now) {
  const created = atTime(now);
  const state = randomToken();
  db.prepare(`
    INSERT INTO oauth_states (state_hash, created_at, expires_at, used_at)
    VALUES (?, ?, ?, NULL)
  `).run(
    tokenHash(config.sessionSecret, state),
    created.toISOString(),
    new Date(created.getTime() + OAUTH_STATE_TTL_MS).toISOString(),
  );
  return state;
}

export function consumeOAuthState(db, config, state, now) {
  if (typeof state !== "string" || state === "") {
    throw new AuthError("登录状态无效", { code: "INVALID_STATE" });
  }
  const nowIso = atTime(now).toISOString();
  const stateHash = tokenHash(config.sessionSecret, state);
  const outcome = db.transaction(() => {
    const row = db.prepare("SELECT expires_at, used_at FROM oauth_states WHERE state_hash = ?").get(stateHash);
    if (!row) return "INVALID_STATE";
    if (row.used_at !== null) return "STATE_REUSED";
    if (row.expires_at <= nowIso) return "STATE_EXPIRED";
    const result = db.prepare(`
      UPDATE oauth_states
      SET used_at = ?
      WHERE state_hash = ? AND used_at IS NULL
    `).run(nowIso, stateHash);
    return result.changes === 1 ? "OK" : "STATE_REUSED";
  })();
  if (outcome === "OK") return;
  if (outcome === "STATE_REUSED") throw new AuthError("登录状态已使用", { code: "STATE_REUSED" });
  if (outcome === "STATE_EXPIRED") throw new AuthError("登录状态已过期", { code: "STATE_EXPIRED" });
  throw new AuthError("登录状态无效", { code: "INVALID_STATE" });
}

export function createWebSession(db, config, userDiscordId, now) {
  const created = atTime(now);
  const sessionId = randomToken();
  const createdIso = created.toISOString();
  db.prepare(`
    INSERT INTO web_sessions (
      session_token_hash, user_discord_id, created_at, expires_at, last_entitlement_check_at, revoked_at
    ) VALUES (?, ?, ?, ?, ?, NULL)
  `).run(
    tokenHash(config.sessionSecret, sessionId),
    userDiscordId,
    createdIso,
    new Date(created.getTime() + SESSION_TTL_MS).toISOString(),
    createdIso,
  );
  return sessionId;
}

export function revokeWebSession(db, config, sessionId, now) {
  if (typeof sessionId !== "string" || sessionId === "") return;
  db.prepare(`
    UPDATE web_sessions
    SET revoked_at = ?
    WHERE session_token_hash = ? AND revoked_at IS NULL
  `).run(atTime(now).toISOString(), tokenHash(config.sessionSecret, sessionId));
}

export function readSession(db, config, sessionId, now) {
  if (typeof sessionId !== "string" || sessionId === "") {
    throw new AuthError("未登录", { code: "SESSION_MISSING" });
  }
  const row = db.prepare(`
    SELECT user_discord_id, expires_at, last_entitlement_check_at, revoked_at
    FROM web_sessions
    WHERE session_token_hash = ?
  `).get(tokenHash(config.sessionSecret, sessionId));
  if (!row) throw new AuthError("未登录", { code: "SESSION_MISSING" });
  if (row.revoked_at !== null) throw new AuthError("登录已退出", { code: "SESSION_REVOKED" });
  const nowIso = atTime(now).toISOString();
  if (row.expires_at <= nowIso) throw new AuthError("登录已过期", { code: "SESSION_EXPIRED" });
  const entitlementEnds = new Date(Date.parse(row.last_entitlement_check_at) + ENTITLEMENT_TTL_MS).toISOString();
  if (nowIso >= entitlementEnds) {
    throw new AuthError("贵宾资格已过期，请重新登录", { code: "ENTITLEMENT_EXPIRED" });
  }
  return { userDiscordId: row.user_discord_id };
}
