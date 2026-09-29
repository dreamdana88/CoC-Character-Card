import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleCharacterApi } from "./api/characters.js";
import { handleAuthRequest } from "./auth/http.js";
import { openDatabase } from "./storage/index.js";
import { handlePage } from "./web/pages.js";

function alreadySent(response) {
  return response.writableEnded === true || response.headersSent === true;
}

export async function handleRequest(request, response, context) {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const log = context.log ?? console.error;
  try {
    if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) {
      await handleAuthRequest(request, response, context);
      return;
    }
    if (url.pathname === "/api/characters" || url.pathname.startsWith("/api/characters/")) {
      await handleCharacterApi(request, response, context);
      return;
    }
    await handlePage(request, response, context);
  } catch (error) {
    log(`请求失败：${error?.code || "UNKNOWN"}`);
    if (alreadySent(response)) return;
    response.statusCode = 500;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end("服务器错误");
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  const db = openDatabase(process.env);
  const port = process.env.PORT && /^\d+$/.test(process.env.PORT) ? Number(process.env.PORT) : 8787;
  const server = createServer((request, response) => {
    handleRequest(request, response, {
      db,
      env: process.env,
      fetchImpl: globalThis.fetch,
      log: console.error,
    }).catch((error) => {
      console.error(`请求失败：${error?.code || "UNKNOWN"}`);
      if (alreadySent(response)) return;
      response.statusCode = 500;
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("服务器错误");
    });
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`listening http://127.0.0.1:${port}`);
  });
}
