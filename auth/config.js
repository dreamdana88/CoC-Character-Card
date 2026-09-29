import { AuthError } from "./errors.js";

const REQUIRED = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "OAUTH_CALLBACK_URL",
  "DISCORD_GUILD_ID",
  "COC_ACCESS_ROLE_ID",
  "SESSION_SECRET",
];

function requiredText(env, key) {
  const value = env?.[key];
  if (typeof value !== "string" || value.trim() === "") return null;
  return value;
}

export function readAuthConfig(env) {
  const missing = REQUIRED.filter((key) => requiredText(env, key) === null);
  if (missing.length > 0) {
    throw new AuthError(`缺少登录配置：${missing.join("、")}`, { code: "MISSING_CONFIG" });
  }
  let redirectUrl;
  try {
    redirectUrl = new URL(env.OAUTH_CALLBACK_URL);
  } catch {
    throw new AuthError("OAUTH_CALLBACK_URL 不是有效地址", { code: "MISSING_CONFIG" });
  }
  if (redirectUrl.protocol !== "https:" && redirectUrl.protocol !== "http:") {
    throw new AuthError("OAUTH_CALLBACK_URL 不是有效地址", { code: "MISSING_CONFIG" });
  }
  const clientId = env.DISCORD_CLIENT_ID;
  const guildId = env.DISCORD_GUILD_ID;
  const accessRoleId = env.COC_ACCESS_ROLE_ID;
  if (!/^\d+$/.test(clientId) || !/^\d+$/.test(guildId) || !/^\d+$/.test(accessRoleId)) {
    throw new AuthError("Discord ID 配置必须是数字字符串", { code: "MISSING_CONFIG" });
  }
  return {
    clientId,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.OAUTH_CALLBACK_URL,
    guildId,
    accessRoleId,
    sessionSecret: env.SESSION_SECRET,
  };
}
