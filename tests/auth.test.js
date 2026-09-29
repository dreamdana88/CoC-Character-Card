import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readAuthConfig } from "../auth/config.js";
import {
  DISCORD_API_BASE,
  DISCORD_AUTHORIZE_URL,
  ENTITLEMENT_TTL_MS,
  OAUTH_SCOPES,
  OAUTH_STATE_TTL_MS,
  SESSION_TTL_MS,
  handleAuthRequest,
  readSession,
} from "../auth/index.js";
import { openDatabase } from "../storage/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const START = new Date("2026-05-01T00:00:00.000Z");
const ACCESS_TOKEN = "access-token-value";
const REFRESH_TOKEN = "refresh-token-value";
const USER_ID = "80351110224678912";
const CODE = "oauth-code-value";
const env = {
  DISCORD_CLIENT_ID: "157730590492196864",
  DISCORD_CLIENT_SECRET: "client-secret-value",
  OAUTH_CALLBACK_URL: "https://card.example/auth/callback",
  DISCORD_GUILD_ID: "9001",
  COC_ACCESS_ROLE_ID: "42",
  SESSION_SECRET: "session-secret-value",
};

function removeTemp(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 });
  } catch (error) {
    if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error?.code)) throw error;
  }
}

function withDb(fn) {
  const dir = mkdtempSync(join(tmpdir(), "coc-card-b3-"));
  const db = openDatabase({ DATABASE_PATH: join(dir, "characters.sqlite") });
  const finish = () => {
    db.close();
    removeTemp(dir);
  };
  try {
    const result = fn(db);
    if (result && typeof result.then === "function") return result.finally(finish);
    finish();
    return result;
  } catch (error) {
    finish();
    throw error;
  }
}

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 0,
    body: "",
    headers,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    end(body = "") {
      this.body = String(body);
    },
  };
}

function setCookies(response) {
  const value = response.headers.get("set-cookie");
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function cookieByName(response, name) {
  return setCookies(response).find((line) => line.startsWith(`${name}=`));
}

function cookieValue(line) {
  return decodeURIComponent(line.slice(line.indexOf("=") + 1, line.indexOf(";")));
}

function assertCookieFlags(line) {
  assert.match(line, /; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=\d+$/);
}

function hash(token) {
  return createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}

function codeIs(code) {
  return (error) => {
    assert.equal(error.code, code);
    return true;
  };
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

function mockDiscord(overrides = {}) {
  const calls = [];
  const options = {
    tokenStatus: 200,
    userStatus: 200,
    memberStatus: 200,
    userBody: { id: USER_ID, username: "nelly" },
    memberBody: { roles: ["7", "42"], joined_at: "2020-01-01T00:00:00.000Z", deaf: false, mute: false },
    tokenBody: {
      access_token: ACCESS_TOKEN,
      token_type: "Bearer",
      expires_in: 604800,
      refresh_token: REFRESH_TOKEN,
      scope: "identify guilds.members.read",
    },
    ...overrides,
  };
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const target = String(url);
    if (target === `${DISCORD_API_BASE}/oauth2/token`) {
      return jsonResponse(options.tokenStatus, options.tokenStatus === 200 ? options.tokenBody : { error: "invalid_grant" });
    }
    if (target === `${DISCORD_API_BASE}/users/@me`) return jsonResponse(options.userStatus, options.userBody);
    if (target === `${DISCORD_API_BASE}/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`) {
      return jsonResponse(options.memberStatus, options.memberStatus === 200 ? options.memberBody : { message: "Unknown Guild" });
    }
    throw new Error(`unexpected Discord URL ${target}`);
  };
  return { fetchImpl, calls };
}

async function request(db, { method, url, cookie = "", now = START, fetchImpl, logs = [], envOverride = env }) {
  const response = createResponse();
  await handleAuthRequest(
    { method, url, headers: { cookie } },
    response,
    { db, env: envOverride, now, fetchImpl, log: (message) => logs.push(String(message)) },
  );
  return response;
}

async function beginLogin(db, logs = []) {
  const response = await request(db, { method: "GET", url: "/auth/login", logs });
  const location = new URL(response.headers.get("location"));
  const state = location.searchParams.get("state");
  return { response, location, state, cookie: cookieValue(cookieByName(response, "coc_oauth_state")) };
}

function callbackUrl(state, code = CODE) {
  return `/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
}

function stateCookie(state) {
  return `coc_oauth_state=${encodeURIComponent(state)}`;
}

test("auth source stays off the bot token and does not create tables in JavaScript", () => {
  assert.deepEqual(OAUTH_SCOPES, ["identify", "guilds.members.read"]);
  assert.equal(SESSION_TTL_MS, 90 * 24 * 60 * 60 * 1000);
  assert.equal(ENTITLEMENT_TTL_MS, 30 * 24 * 60 * 60 * 1000);
  assert.equal(OAUTH_STATE_TTL_MS, 10 * 60 * 1000);
  assert.equal(DISCORD_AUTHORIZE_URL, "https://discord.com/oauth2/authorize");
  const files = readdirSync(join(root, "auth")).filter((name) => name.endsWith(".js"));
  for (const file of files) {
    const source = readFileSync(join(root, "auth", file), "utf8");
    assert.equal(source.includes("1447978053665030280"), false, file);
    assert.equal(source.includes("Bot "), false, file);
    assert.equal(source.includes("DISCORD_BOT"), false, file);
    assert.equal(source.includes("better-sqlite3"), false, file);
    assert.equal(source.includes("CREATE TABLE"), false, file);
    assert.equal(source.includes("../TeaParty-Bell"), false, file);
  }
  const sql = readFileSync(join(root, "storage", "migrations", "002_auth.sql"), "utf8");
  assert.equal(sql.includes("access_token"), false);
  assert.equal(sql.includes("refresh_token"), false);
});

test("oauth url, state, role gate, cookie, and hashed session", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("real network");
  };
  try {
    await withDb(async (db) => {
      assert.deepEqual(
        db.prepare("PRAGMA table_info(web_sessions)").all().map((column) => column.name),
        ["session_token_hash", "user_discord_id", "created_at", "expires_at", "last_entitlement_check_at", "revoked_at"],
      );
      const logs = [];
      const discord = mockDiscord();
      const started = await beginLogin(db, logs);
      assert.equal(started.response.statusCode, 302);
      assert.equal(started.location.origin + started.location.pathname, DISCORD_AUTHORIZE_URL);
      assert.equal(started.location.searchParams.get("response_type"), "code");
      assert.equal(started.location.searchParams.get("client_id"), env.DISCORD_CLIENT_ID);
      assert.equal(started.location.searchParams.get("redirect_uri"), env.OAUTH_CALLBACK_URL);
      assert.equal(started.location.searchParams.get("scope"), "identify guilds.members.read");
      assert.equal(started.location.searchParams.get("prompt"), "consent");
      assert.equal(started.location.toString().includes(env.DISCORD_CLIENT_SECRET), false);
      assert.equal(started.state, started.cookie);
      assert.equal(started.state.length >= 43, true);
      const stateCookieLine = cookieByName(started.response, "coc_oauth_state");
      assertCookieFlags(stateCookieLine);
      assert.match(stateCookieLine, /Max-Age=600$/);
      const stateRow = db.prepare("SELECT state_hash, used_at FROM oauth_states").get();
      assert.equal(stateRow.state_hash, hash(started.state));
      assert.equal(stateRow.used_at, null);
      assert.equal(JSON.stringify(stateRow).includes(started.state), false);

      const callback = await request(db, {
        method: "GET",
        url: callbackUrl(started.state),
        cookie: stateCookie(started.state),
        fetchImpl: discord.fetchImpl,
        logs,
      });
      assert.equal(callback.statusCode, 302);
      assert.equal(callback.headers.get("location"), "/investigators");
      assert.equal(callback.body, "");
      assert.deepEqual(discord.calls.map((call) => call.url), [
        `${DISCORD_API_BASE}/oauth2/token`,
        `${DISCORD_API_BASE}/users/@me`,
        `${DISCORD_API_BASE}/users/@me/guilds/9001/member`,
      ]);
      const tokenCall = discord.calls[0].init;
      assert.equal(tokenCall.method, "POST");
      assert.equal(tokenCall.headers["Content-Type"], "application/x-www-form-urlencoded");
      assert.equal(
        tokenCall.headers.Authorization,
        `Basic ${Buffer.from(`${env.DISCORD_CLIENT_ID}:${env.DISCORD_CLIENT_SECRET}`).toString("base64")}`,
      );
      assert.equal(tokenCall.body.get("grant_type"), "authorization_code");
      assert.equal(tokenCall.body.get("code"), CODE);
      assert.equal(tokenCall.body.get("redirect_uri"), env.OAUTH_CALLBACK_URL);
      assert.equal(tokenCall.body.get("client_secret"), null);
      assert.equal(discord.calls[1].init.headers.Authorization, `Bearer ${ACCESS_TOKEN}`);
      assert.equal(discord.calls[2].init.headers.Authorization, `Bearer ${ACCESS_TOKEN}`);
      for (const call of discord.calls) {
        assert.equal(String(call.init.headers.Authorization).startsWith("Bot"), false);
      }

      const sessionLine = cookieByName(callback, "coc_session");
      assertCookieFlags(sessionLine);
      assert.match(sessionLine, new RegExp(`Max-Age=${SESSION_TTL_MS / 1000}$`));
      const sessionId = cookieValue(sessionLine);
      assert.equal(callback.body.includes(sessionId), false);
      assert.equal(callback.body.includes(ACCESS_TOKEN), false);
      const row = db.prepare("SELECT * FROM web_sessions").get();
      assert.equal(row.session_token_hash, hash(sessionId));
      assert.notEqual(row.session_token_hash, sessionId);
      assert.equal(row.user_discord_id, USER_ID);
      assert.equal(row.created_at, START.toISOString());
      assert.equal(row.expires_at, new Date(START.getTime() + SESSION_TTL_MS).toISOString());
      assert.equal(row.last_entitlement_check_at, START.toISOString());
      assert.equal(row.revoked_at, null);
      const dump = `${JSON.stringify(db.prepare("SELECT * FROM web_sessions").all())}${JSON.stringify(db.prepare("SELECT * FROM oauth_states").all())}`;
      for (const secret of [ACCESS_TOKEN, REFRESH_TOKEN, sessionId, started.state, CODE, env.DISCORD_CLIENT_SECRET, env.SESSION_SECRET]) {
        assert.equal(dump.includes(secret), false, secret);
      }
      const config = readAuthConfig(env);
      assert.deepEqual(readSession(db, config, sessionId, START), { userDiscordId: USER_ID });
      readSession(db, config, sessionId, new Date(START.getTime() + 24 * 60 * 60 * 1000));
      assert.equal(db.prepare("SELECT last_entitlement_check_at FROM web_sessions").get().last_entitlement_check_at, START.toISOString());
      assert.deepEqual(logs, []);

      const reused = await request(db, {
        method: "GET",
        url: callbackUrl(started.state),
        cookie: stateCookie(started.state),
        fetchImpl: discord.fetchImpl,
        logs,
      });
      assert.equal(reused.statusCode, 400);
      assert.match(reused.body, /^STATE_REUSED /);
      assert.equal(discord.calls.length, 3);
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM web_sessions").get().n, 1);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("bad, expired, and mismatched oauth state is rejected before Discord", async () => {
  await withDb(async (db) => {
    const discord = mockDiscord();
    const logs = [];
    const started = await beginLogin(db, logs);
    const wrong = await request(db, {
      method: "GET",
      url: callbackUrl("wrong-state"),
      cookie: stateCookie(started.state),
      fetchImpl: discord.fetchImpl,
      logs,
    });
    assert.equal(wrong.statusCode, 400);
    assert.match(wrong.body, /^INVALID_STATE /);
    assert.equal(discord.calls.length, 0);
    assert.equal(db.prepare("SELECT used_at FROM oauth_states").get().used_at, null);

    const mismatched = await request(db, {
      method: "GET",
      url: callbackUrl(started.state),
      cookie: stateCookie("other-browser"),
      fetchImpl: discord.fetchImpl,
      logs,
    });
    assert.match(mismatched.body, /^INVALID_STATE /);
    assert.equal(db.prepare("SELECT used_at FROM oauth_states").get().used_at, null);

    const expired = await request(db, {
      method: "GET",
      url: callbackUrl(started.state),
      cookie: stateCookie(started.state),
      now: new Date(START.getTime() + OAUTH_STATE_TTL_MS),
      fetchImpl: discord.fetchImpl,
      logs,
    });
    assert.equal(expired.statusCode, 400);
    assert.match(expired.body, /^STATE_EXPIRED /);
    assert.equal(discord.calls.length, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM web_sessions").get().n, 0);
    assert.equal(logs.every((line) => line === "登录或会话失败：INVALID_STATE" || line === "登录或会话失败：STATE_EXPIRED"), true);
    for (const secret of [env.DISCORD_CLIENT_SECRET, env.SESSION_SECRET, CODE, started.state]) {
      assert.equal(logs.some((line) => line.includes(secret)), false, secret);
    }
  });
});

test("guild and role failures do not create a session", async () => {
  await withDb(async (db) => {
    const logs = [];
    const noRole = mockDiscord({ memberBody: { roles: ["7", "420"] } });
    const started = await beginLogin(db, logs);
    const denied = await request(db, {
      method: "GET",
      url: callbackUrl(started.state),
      cookie: stateCookie(started.state),
      fetchImpl: noRole.fetchImpl,
      logs,
    });
    assert.equal(denied.statusCode, 403);
    assert.match(denied.body, /^MISSING_ROLE /);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM web_sessions").get().n, 0);
    assert.deepEqual(logs, ["登录或会话失败：MISSING_ROLE"]);

    const outside = mockDiscord({ memberStatus: 404 });
    const again = await beginLogin(db, logs);
    const notMember = await request(db, {
      method: "GET",
      url: callbackUrl(again.state),
      cookie: stateCookie(again.state),
      fetchImpl: outside.fetchImpl,
      logs,
    });
    assert.equal(notMember.statusCode, 403);
    assert.match(notMember.body, /^NOT_IN_GUILD /);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM web_sessions").get().n, 0);

    const broken = mockDiscord({ memberStatus: 403 });
    const third = await beginLogin(db, logs);
    const loginFailed = await request(db, {
      method: "GET",
      url: callbackUrl(third.state),
      cookie: stateCookie(third.state),
      fetchImpl: broken.fetchImpl,
      logs,
    });
    assert.equal(loginFailed.statusCode, 401);
    assert.match(loginFailed.body, /^LOGIN_FAILED /);

    const tokenFailed = mockDiscord({ tokenStatus: 400 });
    const fourth = await beginLogin(db, logs);
    const exchanged = await request(db, {
      method: "GET",
      url: callbackUrl(fourth.state),
      cookie: stateCookie(fourth.state),
      fetchImpl: tokenFailed.fetchImpl,
      logs,
    });
    assert.match(exchanged.body, /^LOGIN_FAILED /);
    assert.equal(tokenFailed.calls.length, 1);

    const narrow = mockDiscord({
      tokenBody: {
        access_token: ACCESS_TOKEN,
        token_type: "Bearer",
        expires_in: 604800,
        refresh_token: REFRESH_TOKEN,
        scope: "identify",
      },
    });
    const fifth = await beginLogin(db, logs);
    const partial = await request(db, {
      method: "GET",
      url: callbackUrl(fifth.state),
      cookie: stateCookie(fifth.state),
      fetchImpl: narrow.fetchImpl,
      logs,
    });
    assert.match(partial.body, /^LOGIN_FAILED /);
    assert.equal(narrow.calls.length, 1);

    const numericId = mockDiscord({ userBody: { id: 42, username: "nelly" } });
    const sixth = await beginLogin(db, logs);
    const notSnowflake = await request(db, {
      method: "GET",
      url: callbackUrl(sixth.state),
      cookie: stateCookie(sixth.state),
      fetchImpl: numericId.fetchImpl,
      logs,
    });
    assert.match(notSnowflake.body, /^LOGIN_FAILED /);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM web_sessions").get().n, 0);
    for (const line of logs) {
      assert.equal(line.includes(ACCESS_TOKEN), false);
      assert.equal(line.includes(REFRESH_TOKEN), false);
      assert.equal(line.includes(env.DISCORD_CLIENT_SECRET), false);
      assert.equal(line.includes(CODE), false);
    }
  });
});

test("session expires at 90 days, entitlement expires at 30 days, and logout revokes", async () => {
  await withDb(async (db) => {
    const discord = mockDiscord();
    const logs = [];
    const started = await beginLogin(db, logs);
    const callback = await request(db, {
      method: "GET",
      url: callbackUrl(started.state),
      cookie: stateCookie(started.state),
      fetchImpl: discord.fetchImpl,
      logs,
    });
    const sessionId = cookieValue(cookieByName(callback, "coc_session"));
    const config = readAuthConfig(env);
    assert.deepEqual(
      readSession(db, config, sessionId, new Date(START.getTime() + ENTITLEMENT_TTL_MS - 1)),
      { userDiscordId: USER_ID },
    );
    assert.throws(
      () => readSession(db, config, sessionId, new Date(START.getTime() + ENTITLEMENT_TTL_MS)),
      codeIs("ENTITLEMENT_EXPIRED"),
    );
    assert.throws(
      () => readSession(db, config, sessionId, new Date(START.getTime() + SESSION_TTL_MS)),
      codeIs("SESSION_EXPIRED"),
    );

    const logout = await request(db, {
      method: "POST",
      url: "/auth/logout",
      cookie: `coc_session=${encodeURIComponent(sessionId)}`,
      logs,
    });
    assert.equal(logout.statusCode, 200);
    assert.equal(logout.body, "已退出");
    const cleared = cookieByName(logout, "coc_session");
    assertCookieFlags(cleared);
    assert.match(cleared, /Max-Age=0$/);
    assert.equal(db.prepare("SELECT revoked_at FROM web_sessions").get().revoked_at, START.toISOString());
    assert.throws(() => readSession(db, config, sessionId, START), codeIs("SESSION_REVOKED"));
    const getLogout = await request(db, { method: "GET", url: "/auth/logout", logs });
    assert.equal(getLogout.statusCode, 405);
    const missingPage = await request(db, { method: "GET", url: "/characters", logs });
    assert.equal(missingPage.statusCode, 404);
  });
});

test("missing auth config fails closed", async () => {
  const logs = [];
  const response = await request(null, {
    method: "GET",
    url: "/auth/login",
    envOverride: { ...env, DISCORD_GUILD_ID: "" },
    logs,
  });
  assert.equal(response.statusCode, 500);
  assert.match(response.body, /^MISSING_CONFIG /);
  assert.equal(response.body.includes("1447978053665030280"), false);
  assert.deepEqual(logs, ["登录或会话失败：MISSING_CONFIG"]);
});
