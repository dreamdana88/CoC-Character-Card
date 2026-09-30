// Visual review of actual routes using an isolated temporary database and dummy OAuth settings.
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleRequest } from "../../server.js";
import { openDatabase } from "../../storage/index.js";
const dir = mkdtempSync(join(tmpdir(), "arkham-ui-review-"));
const db = openDatabase({ DATABASE_PATH: join(dir, "review.sqlite") });
const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "visual-review-only", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "visual-review-only" };
const server = createServer((request, response) => handleRequest(request, response, { db, env, fetchImpl: async () => { throw new Error("Visual review does not contact Discord"); } }));
server.listen(8787, "127.0.0.1", () => console.log(`Visual review: http://127.0.0.1:${server.address().port} (temporary DB; no real OAuth)`));
function close() { server.close(() => { db.close(); rmSync(dir, { recursive: true, force: true }); process.exit(0); }); }
process.on("SIGINT", close);
process.on("SIGTERM", close);
