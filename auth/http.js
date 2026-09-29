import { OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_MS, SESSION_COOKIE, SESSION_TTL_MS } from "./constants.js";
import { readAuthConfig } from "./config.js";
import { buildAuthorizeUrl, exchangeAuthorizationCode, fetchCurrentUser, fetchGuildMember } from "./discord.js";
import { AuthError, authStatus } from "./errors.js";
import { consumeOAuthState, createOAuthState, createWebSession, revokeWebSession } from "./store.js";

const COOKIE_FLAGS = "HttpOnly; Secure; SameSite=Lax; Path=/";

function serializeCookie(name, value, maxAgeSeconds) {
  return `${name}=${encodeURIComponent(value)}; ${COOKIE_FLAGS}; Max-Age=${maxAgeSeconds}`;
}

function clearCookie(name) {
  return serializeCookie(name, "", 0);
}

export function readCookie(header, name) {
  if (typeof header !== "string" || header === "") return "";
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return "";
}

function logAuthFailure(error, log) {
  log(`登录或会话失败：${error instanceof AuthError ? error.code : "UNKNOWN"}`);
}

function sendError(response, error, log, cookies = []) {
  logAuthFailure(error, log);
  const code = error instanceof AuthError ? error.code : "UNKNOWN";
  const message = error instanceof AuthError ? error.message : "登录失败";
  response.statusCode = authStatus(code);
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (cookies.length > 0) response.setHeader("Set-Cookie", cookies);
  response.end(`${code} ${message}`);
}

export function startLogin(db, config, now) {
  const state = createOAuthState(db, config, now);
  return {
    location: buildAuthorizeUrl({ clientId: config.clientId, redirectUri: config.redirectUri, state }),
    cookies: [serializeCookie(OAUTH_STATE_COOKIE, state, OAUTH_STATE_TTL_MS / 1000)],
  };
}

export async function completeLogin(db, config, { code, state, stateCookie, oauthError, fetchImpl, now, previousSessionId }) {
  if (typeof state !== "string" || state === "" || stateCookie !== state) {
    throw new AuthError("登录状态无效", { code: "INVALID_STATE" });
  }
  consumeOAuthState(db, config, state, now);
  if (oauthError || typeof code !== "string" || code === "") {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  }
  if (typeof fetchImpl !== "function") {
    throw new AuthError("缺少 Discord HTTP 客户端", { code: "MISSING_CONFIG" });
  }
  const { accessToken } = await exchangeAuthorizationCode({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    code,
    fetchImpl,
  });
  const user = await fetchCurrentUser({ accessToken, fetchImpl });
  const member = await fetchGuildMember({ accessToken, guildId: config.guildId, fetchImpl });
  if (!member.roles.includes(config.accessRoleId)) {
    throw new AuthError("没有茶会贵宾身份", { code: "MISSING_ROLE" });
  }
  const sessionId = createWebSession(db, config, user.id, now);
  if (previousSessionId && previousSessionId !== sessionId) {
    revokeWebSession(db, config, previousSessionId, now);
  }
  return {
    sessionId,
    userDiscordId: user.id,
    cookies: [
      serializeCookie(SESSION_COOKIE, sessionId, SESSION_TTL_MS / 1000),
      clearCookie(OAUTH_STATE_COOKIE),
    ],
  };
}

export function finishLogout(db, config, sessionId, now) {
  revokeWebSession(db, config, sessionId, now);
  return { cookies: [clearCookie(SESSION_COOKIE), clearCookie(OAUTH_STATE_COOKIE)] };
}

function headerValue(headers, name) {
  if (!headers) return "";
  const value = headers[name] ?? headers[name.toLowerCase()];
  return typeof value === "string" ? value : "";
}

export async function handleAuthRequest(request, response, context) {
  const log = context.log ?? console.error;
  let config;
  try {
    config = readAuthConfig(context.env);
  } catch (error) {
    sendError(response, error, log);
    return;
  }
  const url = new URL(request.url, "http://127.0.0.1");
  try {
    if (url.pathname === "/auth/login" && request.method === "GET") {
      const started = startLogin(context.db, config, context.now);
      response.statusCode = 302;
      response.setHeader("Location", started.location);
      response.setHeader("Set-Cookie", started.cookies);
      response.end("");
      return;
    }
    if (url.pathname === "/auth/callback" && request.method === "GET") {
      try {
        const result = await completeLogin(context.db, config, {
          code: url.searchParams.get("code"),
          state: url.searchParams.get("state"),
          stateCookie: readCookie(headerValue(request.headers, "cookie"), OAUTH_STATE_COOKIE),
          oauthError: url.searchParams.get("error"),
          fetchImpl: context.fetchImpl,
          now: context.now,
          previousSessionId: readCookie(headerValue(request.headers, "cookie"), SESSION_COOKIE),
        });
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.setHeader("Set-Cookie", result.cookies);
        response.end("已登录");
      } catch (error) {
        sendError(response, error, log, [clearCookie(OAUTH_STATE_COOKIE)]);
      }
      return;
    }
    if (url.pathname === "/auth/logout") {
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end("请使用 POST");
        return;
      }
      const result = finishLogout(
        context.db,
        config,
        readCookie(headerValue(request.headers, "cookie"), SESSION_COOKIE),
        context.now,
      );
      response.statusCode = 200;
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.setHeader("Set-Cookie", result.cookies);
      response.end("已退出");
      return;
    }
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("没有这个地址");
  } catch (error) {
    sendError(response, error, log);
  }
}

