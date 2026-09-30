import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { handleRequest } from "../server.js";
import { openDatabase } from "../storage/index.js";
import { createWebSession } from "../auth/store.js";
import { readAuthConfig } from "../auth/config.js";

const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "test-secret", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "test-session-secret" };
async function call(url, { method = "GET", db, cookie } = {}) {
  const headers = new Map();
  const response = { statusCode: 0, setHeader(name, value) { headers.set(name.toLowerCase(), value); }, end(body) { this.body = body; } };
  await handleRequest({ url, method, headers: cookie ? { cookie } : {} }, response, { env, db, fetchImpl() { throw new Error("Unexpected Discord request"); }, log(message) { throw new Error(message); } });
  return { ...response, headers };
}
test("login uses the existing OAuth entry; authenticated visitors still go to their cards", async () => {
  const dir = mkdtempSync(join(tmpdir(), "coc-ui-1-"));
  const db = openDatabase({ DATABASE_PATH: join(dir, "test.sqlite") });
  try {
    const response = await call("/", { db });
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /茶话会调查员档案馆/);
    assert.match(response.body, /href="\/auth\/login"/);
    assert.match(response.body, /href="\/login.css"/);
    assert.equal(response.body.includes("<script"), false);
    const login = await call("/auth/login", { db });
    assert.equal(login.statusCode, 302);
    const location = new URL(login.headers.get("location"));
    assert.equal(location.hostname, "discord.com");
    assert.equal(location.searchParams.get("scope"), "identify guilds.members.read");
    assert.ok(location.searchParams.get("state"));
    const session = createWebSession(db, readAuthConfig(env), "12345");
    const authenticated = await call("/", { db, cookie: `coc_session=${session}` });
    assert.equal(authenticated.statusCode, 302);
    assert.equal(authenticated.headers.get("location"), "/investigators");
  } finally { db.close(); rmSync(dir, { recursive: true, force: true }); }
});
test("public assets load without login; original art, licenses and path traversal remain private", async () => {
  for (const [url, type] of [["/login.css", "text/css"], ["/assets/login-study.webp", "image/webp"], ["/assets/archive-emblem.png", "image/png"], ["/assets/brass-corner.svg", "image/svg+xml"], ["/assets/archive-divider.svg", "image/svg+xml"], ["/assets/paper-texture.svg", "image/svg+xml"], ["/assets/archive-login.woff2", "font/woff2"], ["/ui/asset-review", "text/html"], ["/ui/asset-review.css", "text/css"]]) {
    const response = await call(url);
    assert.equal(response.statusCode, 200, url);
    assert.ok(response.headers.get("content-type").startsWith(type), url);
    assert.ok(response.body.length > 0, url);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  }
  for (const url of ["/assets/登录页背景-v1.png", "/assets/README.md", "/assets/%2e%2e%2f.env", "/assets/noto-serif-sc-ofl.txt", "/ui/not-a-page"]) {
    assert.equal((await call(url)).statusCode, 404, url);
  }
  const head = await call("/assets/login-study.webp", { method: "HEAD" });
  assert.equal(head.statusCode, 200);
  assert.equal(head.body, undefined);
  assert.ok(head.headers.get("content-length") > 0);
  assert.equal((await call("/assets/archive-emblem.png", { method: "POST" })).statusCode, 405);
});
