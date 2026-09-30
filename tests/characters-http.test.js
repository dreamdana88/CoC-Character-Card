import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readAuthConfig } from "../auth/config.js";
import { createWebSession } from "../auth/store.js";
import { handleRequest } from "../server.js";
import { createCharacter, getCharacter, openDatabase } from "../storage/index.js";
import { minimalCharacter } from "./minimalCharacter.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-05-01T00:00:00.000Z");
const USER_A = "80351110224678912";
const USER_B = "80351110224678913";
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
  const dir = mkdtempSync(join(tmpdir(), "coc-card-b4-"));
  const dbPath = join(dir, "characters.sqlite");
  const db = openDatabase({ DATABASE_PATH: dbPath });
  const finish = () => {
    db.close();
    removeTemp(dir);
  };
  try {
    const result = fn(db, dbPath);
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

function sessionFor(db, userId) {
  return createWebSession(db, readAuthConfig(env), userId, NOW);
}

async function call(db, { method = "GET", url, cookie, body }) {
  const response = createResponse();
  const request = { method, url, headers: {} };
  if (cookie) request.headers.cookie = `coc_session=${encodeURIComponent(cookie)}`;
  if (body !== undefined) request.body = typeof body === "string" ? body : JSON.stringify(body);
  await handleRequest(request, response, {
    db,
    env,
    now: NOW,
    fetchImpl() {
      throw new Error("discord should not be called");
    },
    log() {},
  });
  return response;
}

function json(response) {
  return JSON.parse(response.body);
}

function validBody(name = "奈洛莉") {
  return {
    id: "client-picked",
    ownerDiscordUserId: USER_B,
    currentHp: 5,
    occupation: {
      id: "accountant",
      name: "会计师",
      pointFormula: "EDU_X4",
      creditMin: 30,
      creditMax: 70,
      occupationalSkills: ["会计"],
    },
    skills: [
      { name: "会计", base: 5, growth: 0, occupationPoints: 1, interestPoints: 0 },
      { name: "信用评级", specialty: "", base: 0, growth: 30, occupationPoints: 0, interestPoints: 0 },
    ],
    identity: {
      name,
      age: 28,
      sex: "女",
      era: "1920s",
      residence: "阿卡姆",
      birthplace: "波士顿",
      currentSan: 10,
    },
    characteristics: {
      str: 50,
      con: 60,
      siz: 55,
      dex: 70,
      app: 40,
      int: 75,
      pow: 50,
      edu: 80,
      luck: 60,
    },
  };
}

test("character sources do not embed the bot token or production guild", () => {
  for (const file of ["api/characters.js", "web/pages.js", "web/editor.js", "web/site.css", "server.js"]) {
    const source = readFileSync(join(root, file), "utf8");
    assert.equal(source.includes("1447978053665030280"), false, file);
    assert.equal(source.includes("Bot "), false, file);
    assert.equal(source.includes("DISCORD_BOT"), false, file);
    assert.equal(source.includes("better-sqlite3"), false, file);
  }
});

test("guests cannot open character pages or the character API", async () => {
  await withDb(async (db) => {
    const pages = ["/investigators", "/investigators/new", "/investigators/card-1/edit"];
    for (const url of pages) {
      const response = await call(db, { url });
      assert.equal(response.statusCode, 302, url);
      assert.equal(response.headers.get("location"), "/auth/login");
    }
    const routes = [
      ["GET", "/api/characters"],
      ["POST", "/api/characters"],
      ["POST", "/api/characters/preview"],
      ["POST", "/api/characteristics/rolls"],
      ["GET", "/api/characters/card-1"],
      ["PATCH", "/api/characters/card-1"],
      ["DELETE", "/api/characters/card-1"],
      ["POST", "/api/characters/card-1/duplicate"],
      ["GET", "/api/characters/card-1/export"],
      ["POST", "/api/characters/import"],
    ];
    for (const [method, url] of routes) {
      const response = await call(db, { method, url, body: "{" });
      assert.equal(response.statusCode, 401, `${method} ${url}`);
      assert.equal(json(response).error, "SESSION_MISSING");
    }
    const home = await call(db, { url: "/" });
    assert.equal(home.statusCode, 200);
    assert.match(home.body, /href="\/auth\/login"/);
    const css = await call(db, { url: "/site.css" });
    assert.equal(css.statusCode, 200);
    assert.match(css.body, /max-width:\s*40rem/);
  });
});

test("a signed-in investigator only lists and opens their own card", async () => {
  await withDb(async (db) => {
    const cookieA = sessionFor(db, USER_A);
    const cookieB = sessionFor(db, USER_B);
    const createdA = await call(db, { method: "POST", url: "/api/characters", cookie: cookieA, body: validBody("甲的卡") });
    const createdB = await call(db, { method: "POST", url: "/api/characters", cookie: cookieB, body: validBody("乙的卡") });
    assert.equal(createdA.statusCode, 201);
    assert.equal(createdB.statusCode, 201);
    const idA = json(createdA).id;
    const idB = json(createdB).id;

    const listA = json(await call(db, { url: "/api/characters", cookie: cookieA }));
    assert.deepEqual(listA.characters.map((card) => card.identity.name), ["甲的卡"]);
    const listB = json(await call(db, { url: "/api/characters", cookie: cookieB }));
    assert.deepEqual(listB.characters.map((card) => card.identity.name), ["乙的卡"]);

    const pageA = await call(db, { url: "/investigators", cookie: cookieA });
    assert.equal(pageA.statusCode, 200);
    assert.match(pageA.body, /我的调查员/);
    assert.match(pageA.body, /甲的卡/);
    assert.equal(pageA.body.includes("乙的卡"), false);
    assert.equal(pageA.body.includes('name="ownerDiscordUserId"'), false);

    const foreign = await call(db, { url: `/api/characters/${idA}`, cookie: cookieB });
    assert.equal(foreign.statusCode, 403);
    assert.equal(foreign.body.includes("甲的卡"), false);
    const foreignPage = await call(db, { url: `/investigators/${idA}/edit`, cookie: cookieB });
    assert.equal(foreignPage.statusCode, 403);
    assert.equal(foreignPage.body.includes("甲的卡"), false);

    const foreignPatch = await call(db, {
      method: "PATCH",
      url: `/api/characters/${idA}`,
      cookie: cookieB,
      body: validBody("被改掉"),
    });
    assert.equal(foreignPatch.statusCode, 403);
    assert.equal(getCharacter(db, idA).character.identity.name, "甲的卡");

    const foreignDelete = await call(db, { method: "DELETE", url: `/api/characters/${idA}`, cookie: cookieB });
    assert.equal(foreignDelete.statusCode, 403);
    const foreignCopy = await call(db, { method: "POST", url: `/api/characters/${idA}/duplicate`, cookie: cookieB });
    assert.equal(foreignCopy.statusCode, 403);
    assert.equal(json(await call(db, { url: "/api/characters", cookie: cookieA })).characters.length, 1);
    assert.equal(getCharacter(db, idB).character.ownerDiscordUserId, USER_B);
  });
});

test("creating a card ignores the client id and owner and stores the submitted sheet", async () => {
  await withDb(async (db, dbPath) => {
    const cookie = sessionFor(db, USER_A);
    const response = await call(db, { method: "POST", url: "/api/characters", cookie, body: validBody("<img src=x onerror=alert(1)>") });
    assert.equal(response.statusCode, 201);
    const body = json(response);
    assert.match(body.id, /^[0-9a-f-]{36}$/);
    assert.equal(body.id === "client-picked", false);
    assert.equal(Object.hasOwn(body, "ownerDiscordUserId"), false);
    assert.equal(Object.hasOwn(body, "pointBuy"), false);
    assert.equal(body.occupation.pointFormula, "EDU_X4");
    assert.equal(body.identity.name, "<img src=x onerror=alert(1)>");

    const stored = getCharacter(db, body.id).character;
    assert.equal(stored.ownerDiscordUserId, USER_A);
    assert.equal(stored.schemaVersion, 1);
    assert.equal(stored.ruleset, "coc7");
    assert.equal(stored.occupation.pointFormula, "EDU_X4");
    assert.equal(stored.occupation.id, "accountant");
    assert.equal(stored.occupation.name, "会计师");
    assert.deepEqual(stored.occupation.occupationalSkills, ["会计"]);
    assert.deepEqual(stored.skills, [
      {
        name: "会计",
        specialty: "",
        base: 5,
        growth: 0,
        occupationPoints: 1,
        interestPoints: 0,
      },
      {
        name: "信用评级",
        specialty: "",
        base: 0,
        growth: 30,
        occupationPoints: 0,
        interestPoints: 0,
      },
    ]);
    assert.deepEqual(stored.weapons, []);
    assert.equal(stored.armor, null);
    assert.deepEqual(stored.possessions, { items: [] });
    assert.deepEqual(stored.spells, []);
    assert.equal(JSON.stringify(stored).includes("currentHp"), false);
    assert.equal(JSON.stringify(stored).includes("currentSan"), false);

    const home = await call(db, { url: "/", cookie });
    assert.equal(home.statusCode, 302);
    assert.equal(home.headers.get("location"), "/investigators");

    const form = await call(db, { url: `/investigators/${body.id}/edit`, cookie });
    assert.equal(form.statusCode, 200);
    assert.match(form.body, /编辑调查员/);
    assert.match(form.body, /力量 STR/);
    assert.equal(form.body.includes("玩家显示名"), false);
    assert.equal(form.body.includes('name="ownerDiscordUserId"'), false);
    assert.equal(form.body.includes("<img"), false);
    assert.match(form.body, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(form.body, /\/\^-\?\\d\+\$\//);
    assert.match(form.body, /删除这张调查员卡？此操作不能撤销。/);

    const saved = await call(db, { url: `/investigators/${body.id}/edit?saved=1`, cookie });
    assert.match(saved.body, /已保存/);

    const again = openDatabase({ DATABASE_PATH: dbPath });
    try {
      assert.equal(getCharacter(again, body.id).character.identity.name, "<img src=x onerror=alert(1)>");
    } finally {
      again.close();
    }
  });
});

test("editing persists, and an illegal field does not change the stored card", async () => {
  await withDb(async (db, dbPath) => {
    const cookie = sessionFor(db, USER_A);
    const card = minimalCharacter();
    card.id = "card-1";
    card.ownerDiscordUserId = USER_A;
    createCharacter(db, card, { now: NOW });
    const before = getCharacter(db, "card-1");

    const illegal = validBody("改名");
    illegal.identity.age = -1;
    illegal.ownerDiscordUserId = USER_B;
    illegal.id = "other-id";
    const rejected = await call(db, { method: "PATCH", url: "/api/characters/card-1", cookie, body: illegal });
    assert.equal(rejected.statusCode, 400);
    const failure = json(rejected);
    assert.equal(failure.error, "VALIDATION");
    assert.equal(failure.errors.some((error) => error.path === "identity.age" && error.message === "年龄不能为负数"), true);
    const unchanged = getCharacter(db, "card-1");
    assert.equal(unchanged.character.identity.name, "奈洛莉");
    assert.equal(unchanged.character.identity.age, 28);
    assert.equal(unchanged.character.ownerDiscordUserId, USER_A);
    assert.equal(unchanged.updatedAt, before.updatedAt);
    assert.equal(unchanged.character.occupation.name, "会计师");

    const payload = validBody("改名");
    delete payload.skills;
    payload.ownerDiscordUserId = USER_B;
    payload.id = "other-id";
    const updated = await call(db, { method: "PATCH", url: "/api/characters/card-1", cookie, body: payload });
    assert.equal(updated.statusCode, 200);
    assert.equal(json(updated).id, "card-1");
    assert.equal(json(updated).identity.name, "改名");
    assert.equal(Object.hasOwn(json(updated), "ownerDiscordUserId"), false);

    const stored = getCharacter(db, "card-1");
    assert.equal(stored.character.identity.name, "改名");
    assert.equal(stored.character.ownerDiscordUserId, USER_A);
    assert.equal(stored.character.id, "card-1");
    assert.equal(stored.character.occupation.name, "会计师");
    assert.equal(stored.character.occupation.pointFormula, "EDU_X4");
    assert.equal(stored.character.skills.length, 3);
    assert.equal(stored.createdAt, before.createdAt);

    const again = openDatabase({ DATABASE_PATH: dbPath });
    try {
      assert.equal(getCharacter(again, "card-1").character.identity.name, "改名");
    } finally {
      again.close();
    }

    const page = await call(db, { url: "/investigators/card-1/edit", cookie });
    assert.match(page.body, /value="改名"/);
    const fresh = await call(db, { url: "/investigators/new", cookie });
    assert.match(fresh.body, /新建调查员/);
    assert.match(fresh.body, /\/\^-\?\\d\+\$\//);
    assert.equal(fresh.body.includes('name="ownerDiscordUserId"'), false);
  });
});

test("duplicate stays with the same owner and delete removes only that card", async () => {
  await withDb(async (db) => {
    const cookie = sessionFor(db, USER_A);
    const created = json(await call(db, { method: "POST", url: "/api/characters", cookie, body: validBody("原本") }));
    const copy = await call(db, { method: "POST", url: `/api/characters/${created.id}/duplicate`, cookie });
    assert.equal(copy.statusCode, 201);
    const copied = json(copy);
    assert.equal(copied.id === created.id, false);
    assert.equal(copied.identity.name, "原本");
    const stored = getCharacter(db, copied.id);
    assert.equal(stored.character.ownerDiscordUserId, USER_A);
    assert.equal(stored.character.occupation.pointFormula, "EDU_X4");
    const names = json(await call(db, { url: "/api/characters", cookie })).characters.map((card) => card.id);
    assert.deepEqual(names.sort(), [created.id, copied.id].sort());

    const removed = await call(db, { method: "DELETE", url: `/api/characters/${created.id}`, cookie });
    assert.equal(removed.statusCode, 200);
    assert.equal(json(removed).ok, true);
    const missing = await call(db, { url: `/api/characters/${created.id}`, cookie });
    assert.equal(missing.statusCode, 404);
    assert.equal(json(missing).error, "NOT_FOUND");
    const left = json(await call(db, { url: "/api/characters", cookie })).characters;
    assert.deepEqual(left.map((card) => card.id), [copied.id]);

    const gone = await call(db, { method: "POST", url: "/auth/logout", cookie });
    assert.equal(gone.statusCode, 200);
    assert.equal(gone.body, "已退出");
    const after = await call(db, { url: "/api/characters", cookie });
    assert.equal(after.statusCode, 401);
    assert.equal(json(after).error, "SESSION_REVOKED");
    const page = await call(db, { url: "/investigators", cookie });
    assert.equal(page.statusCode, 302);
    assert.equal(page.headers.get("location"), "/auth/login");
  });
});

test("coc7.json export downloads the stored card and import creates a new card for the current user", async () => {
  await withDb(async (db) => {
    const cookieA = sessionFor(db, USER_A);
    const cookieB = sessionFor(db, USER_B);
    const trickyName = "奈洛莉\"\r\n../x";
    const created = await call(db, { method: "POST", url: "/api/characters", cookie: cookieA, body: validBody(trickyName) });
    assert.equal(created.statusCode, 201);
    const originalId = json(created).id;
    const before = getCharacter(db, originalId);

    const exported = await call(db, { url: `/api/characters/${originalId}/export`, cookie: cookieA });
    assert.equal(exported.statusCode, 200);
    assert.equal(exported.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(exported.headers.get("cache-control"), "no-store");
    const disposition = exported.headers.get("content-disposition");
    assert.equal(disposition.includes("\r") || disposition.includes("\n"), false);
    assert.equal(disposition.includes("filename=\"investigator.coc7.json\""), true);
    assert.equal(disposition.includes(`filename*=UTF-8''${encodeURIComponent("奈洛莉..x.coc7.json")}`), true);
    const file = json(exported);
    assert.deepEqual(file, before.character);
    assert.equal(file.schemaVersion, 1);
    assert.equal(file.ruleset, "coc7");
    assert.equal(file.ownerDiscordUserId, USER_A);
    assert.equal(Object.hasOwn(file, "derived"), false);
    assert.equal(Object.hasOwn(file, "createdAt"), false);
    assert.equal(Object.hasOwn(file, "updatedAt"), false);
    assert.equal(file.identity.name, trickyName);

    const roundTrip = await call(db, { method: "POST", url: "/api/characters/import", cookie: cookieA, body: file });
    assert.equal(roundTrip.statusCode, 201);
    const copiedId = json(roundTrip).id;
    assert.match(copiedId, /^[0-9a-f-]{36}$/);
    assert.equal(copiedId === originalId, false);
    assert.equal(Object.hasOwn(json(roundTrip), "ownerDiscordUserId"), false);
    const copied = getCharacter(db, copiedId).character;
    assert.deepEqual(copied, { ...file, id: copiedId });
    assert.deepEqual(getCharacter(db, originalId).character, before.character);
    assert.equal(getCharacter(db, originalId).updatedAt, before.updatedAt);

    const foreignFile = {
      ...file,
      id: originalId,
      ownerDiscordUserId: USER_A,
      background: { ...file.background, beliefs: "旧神已死" },
      weapons: [{ name: "手电筒", type: "", skill: "", damage: "", note: "黄铜" }],
      spells: [{ name: "神智复原" }],
      initialSan: 50,
      sanity: 12,
    };
    const imported = await call(db, { method: "POST", url: "/api/characters/import", cookie: cookieB, body: foreignFile });
    assert.equal(imported.statusCode, 201);
    const importedId = json(imported).id;
    assert.equal(importedId === originalId, false);
    const importedCard = getCharacter(db, importedId).character;
    assert.equal(importedCard.ownerDiscordUserId, USER_B);
    assert.equal(importedCard.identity.name, trickyName);
    assert.equal(importedCard.background.beliefs, "旧神已死");
    assert.deepEqual(importedCard.weapons, foreignFile.weapons);
    assert.deepEqual(importedCard.spells, foreignFile.spells);
    assert.equal(importedCard.initialSan, 50);
    assert.equal(Object.hasOwn(importedCard, "sanity"), false);
    assert.equal(getCharacter(db, originalId).character.ownerDiscordUserId, USER_A);
    assert.equal(getCharacter(db, originalId).character.background.beliefs, "");
    assert.deepEqual(json(await call(db, { url: "/api/characters", cookie: cookieA })).characters.map((card) => card.id).sort(), [originalId, copiedId].sort());
    assert.deepEqual(json(await call(db, { url: "/api/characters", cookie: cookieB })).characters.map((card) => card.id), [importedId]);

    const legacy = { ...file, id: originalId, ownerDiscordUserId: USER_B };
    delete legacy.initialSan;
    legacy.sanity = 42;
    const migrated = await call(db, { method: "POST", url: "/api/characters/import", cookie: cookieA, body: legacy });
    assert.equal(migrated.statusCode, 201);
    const migratedCard = getCharacter(db, json(migrated).id).character;
    assert.equal(migratedCard.initialSan, 42);
    assert.equal(Object.hasOwn(migratedCard, "sanity"), false);
    assert.equal(migratedCard.ownerDiscordUserId, USER_A);

    const countBeforeRejects = json(await call(db, { url: "/api/characters", cookie: cookieA })).characters.length;
    const presentShape = json(await call(db, { url: `/api/characters/${originalId}`, cookie: cookieA }));
    const rejected = [
      presentShape,
      { ...file, schemaVersion: 2 },
      { ...file, ruleset: "coc6" },
      { ...file, skills: undefined },
      { ...file, currentHp: 3 },
      { ...file, identity: { ...file.identity, currentSan: 1 } },
      { ...file, skills: [{ ...file.skills[0], base: 1 }] },
      { ...file, pointBuy: { total: 100, includeLuck: false } },
      "[",
    ];
    delete rejected[3].skills;
    for (const body of rejected) {
      const response = await call(db, { method: "POST", url: "/api/characters/import", cookie: cookieA, body });
      assert.equal(response.statusCode, 400, JSON.stringify(body).slice(0, 80));
    }
    const oversized = await call(db, {
      method: "POST",
      url: "/api/characters/import",
      cookie: cookieA,
      body: "x".repeat(512 * 1024 + 1),
    });
    assert.equal(oversized.statusCode, 413);
    assert.equal(json(oversized).error, "BODY_TOO_LARGE");
    assert.equal(json(await call(db, { url: "/api/characters", cookie: cookieA })).characters.length, countBeforeRejects);
    assert.deepEqual(getCharacter(db, originalId).character, before.character);

    const missing = await call(db, { url: "/api/characters/missing-card/export", cookie: cookieA });
    assert.equal(missing.statusCode, 404);
    const foreignExport = await call(db, { url: `/api/characters/${originalId}/export`, cookie: cookieB });
    assert.equal(foreignExport.statusCode, 403);
    assert.equal(foreignExport.body.includes(trickyName), false);
    const postExport = await call(db, { method: "POST", url: `/api/characters/${originalId}/export`, cookie: cookieA });
    assert.equal(postExport.statusCode, 405);
    assert.equal(postExport.headers.get("allow"), "GET");
    const getImport = await call(db, { url: "/api/characters/import", cookie: cookieA });
    assert.equal(getImport.statusCode, 405);
    assert.equal(getImport.headers.get("allow"), "POST");

    const list = await call(db, { url: "/investigators", cookie: cookieA });
    assert.match(list.body, /导入为新卡/);
    assert.match(list.body, /id="import-card"/);
    assert.match(list.body, /id="import-errors"/);
    assert.match(list.body, /accept="\.coc7\.json,\.json,application\/json"/);
    assert.match(list.body, new RegExp(`/api/characters/${originalId}/export`));
    assert.match(list.body, />导出</);
    const edit = await call(db, { url: `/investigators/${originalId}/edit`, cookie: cookieA });
    assert.match(edit.body, new RegExp(`/api/characters/${originalId}/export`));
    assert.match(edit.body, /删除这张调查员卡？此操作不能撤销。/);
    assert.match(edit.body, /\/\^-\?\\d\+\$\//);
    const fresh = await call(db, { url: "/investigators/new", cookie: cookieA });
    assert.equal(/\/api\/characters\/[^"]+\/export/.test(fresh.body), false);
  });
});

test("an old player display name is hidden, left out of the file, and dropped on save", async () => {
  await withDb(async (db) => {
    const cookie = sessionFor(db, USER_A);
    const legacy = minimalCharacter();
    legacy.id = "legacy-player";
    legacy.ownerDiscordUserId = USER_A;
    legacy.identity.playerName = "纸面玩家";
    const now = "2026-05-01T00:00:00.000Z";
    db.prepare(`
      INSERT INTO characters (
        id, owner_discord_user_id, schema_version, ruleset, character_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(legacy.id, USER_A, 1, "coc7", JSON.stringify(legacy), now, now);

    const page = await call(db, { url: "/investigators/legacy-player/edit", cookie });
    assert.equal(page.statusCode, 200);
    assert.equal(page.body.includes("玩家显示名"), false);
    assert.equal(page.body.includes("纸面玩家"), false);
    assert.match(page.body, /value="奈洛莉"/);
    const fresh = await call(db, { url: "/investigators/new", cookie });
    assert.equal(fresh.body.includes("玩家显示名"), false);

    const exported = json(await call(db, { url: "/api/characters/legacy-player/export", cookie }));
    assert.equal(Object.hasOwn(exported.identity, "playerName"), false);
    assert.equal(exported.identity.name, "奈洛莉");
    assert.equal(getCharacter(db, "legacy-player").character.identity.playerName, "纸面玩家");

    const copied = await call(db, { method: "POST", url: "/api/characters/legacy-player/duplicate", cookie });
    assert.equal(copied.statusCode, 201);
    assert.equal(Object.hasOwn(getCharacter(db, json(copied).id).character.identity, "playerName"), false);

    const saved = await call(db, { method: "PATCH", url: "/api/characters/legacy-player", cookie, body: exported });
    assert.equal(saved.statusCode, 200);
    assert.equal(Object.hasOwn(getCharacter(db, "legacy-player").character.identity, "playerName"), false);
    assert.equal(getCharacter(db, "legacy-player").character.identity.name, "奈洛莉");
  });
});

test("auth routes still go through the login handler", async () => {
  await withDb(async (db) => {
    const response = await call(db, { url: "/auth/logout" });
    assert.equal(response.statusCode, 405);
    assert.equal(response.body, "请使用 POST");
  });
});
