import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { handleRequest } from "../server.js";
import { createCharacter, openDatabase } from "../storage/index.js";
import { derivePreview } from "../rules/sheet.js";
import { FORBIDDEN_CARD_FIELDS } from "../rules/characterSchema.js";
import { minimalCharacter } from "./minimalCharacter.js";

const SECRET = "test-internal-secret-not-production";
async function fixture(t, env = { INTERNAL_API_SECRET: SECRET }) {
  const dir = mkdtempSync(join(tmpdir(), "coc-b7-"));
  const db = openDatabase({ DATABASE_PATH: join(dir, "cards.sqlite") });
  const logs = [];
  for (const [id, owner, san] of [["a", "100", 70], ["b", "200", undefined]]) {
    const card = minimalCharacter();
    card.id = id;
    card.ownerDiscordUserId = owner;
    if (san !== undefined) card.initialSan = san;
    createCharacter(db, card);
  }
  const server = createServer((request, response) => {
    void handleRequest(request, response, {
      db, env, log: (message) => logs.push(message),
      fetchImpl() { throw new Error("Discord must not be called"); },
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 });
  });
  async function call(path, { auth = `Bearer ${SECRET}`, method = "GET" } = {}) {
    const headers = auth === null ? {} : { Authorization: auth };
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers });
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(JSON.stringify(body).includes(SECRET), false);
    return { status: response.status, body, headers: response.headers };
  }
  return { db, logs, call };
}

test("B7 requires a configured Bearer secret without OAuth or cookies", async (t) => {
  const { call, logs } = await fixture(t);
  for (const auth of [null, "Bearer wrong", "Basic abc", "Bearer "]) {
    const result = await call("/internal/users/100/characters", { auth });
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { ok: false, error: "UNAUTHORIZED", message: "内部接口认证失败" });
    assert.equal((await call("/internal/characters/a", { auth })).status, 401);
  }
  assert.equal((await call("/internal/characters/a")).status, 200);
  assert.deepEqual(logs, []);
});

test("B7 missing server secret fails closed", async (t) => {
  const { call } = await fixture(t, {});
  assert.equal((await call("/internal/characters/a")).status, 401);
});

test("B7 lists only owner summaries and returns an empty list normally", async (t) => {
  const { call } = await fixture(t);
  for (const [owner, id] of [["100", "a"], ["200", "b"]]) {
    const result = await call(`/internal/users/${owner}/characters`);
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.characters.length, 1);
    const summary = result.body.characters[0];
    assert.equal(summary.id, id);
    assert.equal(summary.ownerDiscordUserId, owner);
    assert.equal(summary.name, "奈洛莉");
    assert.equal(summary.occupation, "会计师");
    assert.equal(summary.era, "1920s");
    assert.deepEqual(Object.keys(summary).sort(), ["id", "ownerDiscordUserId", "name", "occupation", "era", "updatedAt"].sort());
  }
  assert.deepEqual((await call("/internal/users/999/characters")).body, { ok: true, characters: [] });
});

test("B7 validates parameters and missing routes/cards", async (t) => {
  const { call } = await fixture(t);
  for (const id of ["abc", "", "%20", "-1", "1.5", "%ZZ"]) {
    const result = await call(`/internal/users/${id}/characters`);
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "INVALID_PARAMETER");
  }
  for (const path of ["/internal/characters/missing", "/internal/characters/奈洛莉", "/internal/unknown"]) {
    assert.equal((await call(path)).status, 404);
  }
  assert.equal((await call("/internal/characters/%ZZ")).status, 400);
});

test("B7 rejects all write methods with Allow GET", async (t) => {
  const { call } = await fixture(t);
  for (const path of ["/internal/users/100/characters", "/internal/characters/a"]) {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const result = await call(path, { method });
      assert.equal(result.status, 405);
      assert.equal(result.headers.get("allow"), "GET");
      assert.equal(result.body.error, "METHOD_NOT_ALLOWED");
    }
  }
});

test("B7 full cards preserve initial SAN and Luck and reuse derived results without writes", async (t) => {
  const { db, call } = await fixture(t);
  const before = db.prepare("SELECT * FROM characters ORDER BY id").all();
  for (const row of before) {
    const result = await call(`/internal/characters/${row.id}`);
    const stored = JSON.parse(row.character_json);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.character, stored);
    assert.deepEqual(result.body.derived, derivePreview(stored));
    assert.equal(result.body.character.characteristics.luck, 60);
    assert.equal(result.body.createdAt, row.created_at);
    assert.equal(result.body.updatedAt, row.updated_at);
    for (const key of FORBIDDEN_CARD_FIELDS) assert.equal(Object.hasOwn(result.body.character, key), false);
    if (row.id === "a") assert.equal(result.body.character.initialSan, 70);
    else {
      assert.equal(stored.characteristics.pow, 50);
      assert.equal(Object.hasOwn(result.body.character, "initialSan"), false);
    }
  }
  await call("/internal/users/100/characters");
  assert.deepEqual(db.prepare("SELECT * FROM characters ORDER BY id").all(), before);
});

test("B7 unexpected errors return sanitized JSON and never log secrets", async (t) => {
  const { db, call, logs } = await fixture(t);
  db.prepare("UPDATE characters SET character_json = ? WHERE id = 'a'").run(JSON.stringify({ identity: null, secret: SECRET }));
  const result = await call("/internal/users/100/characters");
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { ok: false, error: "INTERNAL_ERROR", message: "内部角色卡读取失败" });
  assert.deepEqual(logs, ["内部角色卡读取失败"]);
});
