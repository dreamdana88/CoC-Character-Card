import { DISCORD_API_BASE, DISCORD_AUTHORIZE_URL, OAUTH_SCOPES } from "./constants.js";
import { AuthError } from "./errors.js";

export function buildAuthorizeUrl({ clientId, redirectUri, state }) {
  const url = new URL(DISCORD_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED", cause: error });
  }
}

function bearer(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function exchangeAuthorizationCode({ clientId, clientSecret, redirectUri, code, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(`${DISCORD_API_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
  } catch (error) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED", cause: error });
  }
  if (!response.ok) throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  const payload = await readJson(response);
  const granted = new Set(typeof payload.scope === "string" ? payload.scope.split(" ").filter(Boolean) : []);
  if (payload.token_type !== "Bearer" || typeof payload.access_token !== "string" || payload.access_token === "") {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  }
  if (!OAUTH_SCOPES.every((scope) => granted.has(scope))) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  }
  return { accessToken: payload.access_token };
}

export async function fetchCurrentUser({ accessToken, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(`${DISCORD_API_BASE}/users/@me`, { headers: bearer(accessToken) });
  } catch (error) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED", cause: error });
  }
  if (!response.ok) throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  const user = await readJson(response);
  if (typeof user?.id !== "string" || !/^\d+$/.test(user.id)) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  }
  return { id: user.id };
}

export async function fetchGuildMember({ accessToken, guildId, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(`${DISCORD_API_BASE}/users/@me/guilds/${encodeURIComponent(guildId)}/member`, {
      headers: bearer(accessToken),
    });
  } catch (error) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED", cause: error });
  }
  if (response.status === 404) throw new AuthError("不属于这个茶话会服务器", { code: "NOT_IN_GUILD" });
  if (!response.ok) throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  const member = await readJson(response);
  if (!Array.isArray(member?.roles) || member.roles.some((role) => typeof role !== "string")) {
    throw new AuthError("Discord 登录失败", { code: "LOGIN_FAILED" });
  }
  return { roles: member.roles };
}
