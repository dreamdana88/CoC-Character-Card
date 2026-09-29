import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  StorageError,
  backupDatabase,
  createCharacter,
  deleteCharacter,
  duplicateCharacter,
  getCharacter,
  listCharactersByOwner,
  openDatabase,
  updateCharacter,
} from "../storage/index.js";
import { minimalCharacter } from "./minimalCharacter.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const initSql = join(root, "storage", "migrations", "001_init.sql");

function tempDir() {
  return mkdtempSync(join(tmpdir(), "coc-card-b2-"));
}

function removeTemp(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 });
  } catch (error) {
    if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error?.code)) throw error;
  }
}

function databasePath(dir) {
  return join(dir, "characters.sqlite");
}

function openTemp(dir, options) {
  return openDatabase({ DATABASE_PATH: databasePath(dir) }, options);
}

function expectStorageError(error, code) {
  assert.equal(error instanceof StorageError, true);
  assert.equal(error.code, code);
  return true;
}

function versions(db) {
  return db.prepare("SELECT version FROM schema_migrations ORDER BY version").all().map((row) => row.version);
}

function characterCount(db) {
  return db.prepare("SELECT COUNT(*) AS n FROM characters").get().n;
}

test("storage code does not create tables or copy database files", () => {
  const files = ["backup.js", "characters.js", "database.js", "errors.js", "index.js"];
  for (const file of files) {
    const source = readFileSync(join(root, "storage", file), "utf8");
    assert.equal(source.includes("CREATE TABLE"), false, file);
    assert.equal(source.includes("copyFile"), false, file);
    assert.equal(source.includes("TeaParty-Bell"), false, file);
    assert.equal(source.includes("discord.js"), false, file);
  }
  assert.match(readFileSync(join(root, "storage", "backup.js"), "utf8"), /backup\(/);
  assert.match(readFileSync(initSql, "utf8"), /CREATE TABLE characters/);
});

test("migrations apply once and survive reopen", () => {
  const dir = tempDir();
  try {
    assert.equal(existsSync(databasePath(dir)), false);
    const created = openTemp(dir);
    assert.equal(existsSync(databasePath(dir)), true);
    assert.deepEqual(versions(created), [1, 2]);
    assert.deepEqual(
      created.prepare("PRAGMA table_info(characters)").all().map((column) => column.name),
      ["id", "owner_discord_user_id", "schema_version", "ruleset", "character_json", "created_at", "updated_at"],
    );
    assert.equal(created.pragma("integrity_check", { simple: true }), "ok");
    assert.equal(created.pragma("journal_mode", { simple: true }), "wal");
    const card = minimalCharacter();
    const record = createCharacter(created, card, { now: new Date("2026-01-01T00:00:00.000Z") });
    assert.equal(record.character.identity.name, "奈洛莉");
    assert.equal(record.createdAt, "2026-01-01T00:00:00.000Z");
    assert.equal(Object.hasOwn(record.character, "createdAt"), false);
    created.close();

    const reopened = openTemp(dir);
    assert.deepEqual(versions(reopened), [1, 2]);
    assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM schema_migrations").get().n, 2);
    assert.equal(getCharacter(reopened, card.id).character.identity.name, "奈洛莉");
    reopened.close();
  } finally {
    removeTemp(dir);
  }
});

test("migrations upgrade in order and a gap does not create a database", () => {
  const dir = tempDir();
  const migrationsDir = join(dir, "migrations");
  mkdirSync(migrationsDir);
  copyFileSync(initSql, join(migrationsDir, "001_init.sql"));
  try {
    const first = openTemp(dir, { migrationsDir });
    const card = minimalCharacter();
    createCharacter(first, card);
    first.close();

    writeFileSync(join(migrationsDir, "002_probe.sql"), "CREATE TABLE migration_probe (id INTEGER PRIMARY KEY);\n");
    const second = openTemp(dir, { migrationsDir });
    assert.deepEqual(versions(second), [1, 2]);
    assert.equal(second.prepare("SELECT name FROM sqlite_master WHERE name = 'migration_probe'").get().name, "migration_probe");
    second.close();

    const third = openTemp(dir, { migrationsDir });
    assert.deepEqual(versions(third), [1, 2]);
    assert.equal(getCharacter(third, card.id).character.identity.name, "奈洛莉");
    third.exec("INSERT INTO schema_migrations (version, applied_at) VALUES (3, '2026-01-01T00:00:00.000Z')");
    third.close();

    const older = join(dir, "older-migrations");
    mkdirSync(older);
    copyFileSync(initSql, join(older, "001_init.sql"));
    copyFileSync(join(migrationsDir, "002_probe.sql"), join(older, "002_probe.sql"));
    assert.throws(() => openTemp(dir, { migrationsDir: older }), (error) => expectStorageError(error, "MIGRATION"));

    writeFileSync(join(migrationsDir, "003_marker.sql"), "SELECT 1;\n");
    const stillThere = openTemp(dir, { migrationsDir });
    assert.equal(getCharacter(stillThere, card.id).character.identity.name, "奈洛莉");
    stillThere.close();
  } finally {
    removeTemp(dir);
  }

  const gapDir = tempDir();
  try {
    const gapMigrations = join(gapDir, "migrations");
    mkdirSync(gapMigrations);
    writeFileSync(join(gapMigrations, "003_gap.sql"), "CREATE TABLE should_not_exist (id INTEGER PRIMARY KEY);\n");
    assert.throws(
      () => openDatabase({ DATABASE_PATH: databasePath(gapDir) }, { migrationsDir: gapMigrations }),
      (error) => expectStorageError(error, "MIGRATION"),
    );
    assert.equal(existsSync(databasePath(gapDir)), false);
  } finally {
    removeTemp(gapDir);
  }
});

test("DATABASE_PATH is the only place the database path comes from", () => {
  assert.throws(() => openDatabase({}), (error) => expectStorageError(error, "MISSING_PATH"));
  assert.throws(() => openDatabase({ DATABASE_PATH: "   " }), (error) => expectStorageError(error, "MISSING_PATH"));
});

test("characters can be created, read, updated, listed, duplicated, and deleted", () => {
  const dir = tempDir();
  const db = openTemp(dir);
  try {
    const first = minimalCharacter();
    const second = minimalCharacter();
    second.id = "card-2";
    second.ownerDiscordUserId = "200";
    second.identity.playerName = "100";
    second.identity.name = "别人的卡";
    const created = createCharacter(db, first, { now: new Date("2026-02-01T00:00:00.000Z") });
    createCharacter(db, second, { now: new Date("2026-02-02T00:00:00.000Z") });

    assert.throws(() => createCharacter(db, first), (error) => expectStorageError(error, "DUPLICATE_ID"));
    assert.equal(characterCount(db), 2);
    assert.equal(getCharacter(db, first.id).character.ownerDiscordUserId, "100");

    const mine = listCharactersByOwner(db, "100");
    assert.deepEqual(mine.map((record) => record.character.id), [first.id]);
    assert.deepEqual(listCharactersByOwner(db, "200").map((record) => record.character.id), [second.id]);
    assert.deepEqual(listCharactersByOwner(db, "100"), mine);

    const edited = structuredClone(created.character);
    edited.identity.name = "新名字";
    const updated = updateCharacter(db, first.id, edited, { now: new Date("2026-02-03T00:00:00.000Z") });
    assert.equal(updated.character.identity.name, "新名字");
    assert.equal(updated.createdAt, created.createdAt);
    assert.equal(updated.updatedAt, "2026-02-03T00:00:00.000Z");
    assert.equal(getCharacter(db, first.id).character.identity.name, "新名字");

    const copy = duplicateCharacter(db, first.id, "100", { now: new Date("2026-02-04T00:00:00.000Z") });
    assert.notEqual(copy.character.id, first.id);
    assert.equal(copy.character.ownerDiscordUserId, "100");
    assert.equal(copy.character.identity.name, "新名字");
    assert.equal(copy.createdAt, "2026-02-04T00:00:00.000Z");
    assert.deepEqual(listCharactersByOwner(db, "100").map((record) => record.character.id), [first.id, copy.character.id]);

    deleteCharacter(db, copy.character.id, "100");
    assert.throws(() => getCharacter(db, copy.character.id), (error) => expectStorageError(error, "NOT_FOUND"));
    assert.equal(getCharacter(db, second.id).character.identity.name, "别人的卡");
  } finally {
    db.close();
    removeTemp(dir);
  }
});

test("illegal cards, missing rows, owner swaps, and other people's cards are rejected", () => {
  const dir = tempDir();
  const db = openTemp(dir);
  try {
    const illegal = minimalCharacter();
    illegal.identity.age = -1;
    assert.throws(() => createCharacter(db, illegal), (error) => {
      assert.equal(error.code, "VALIDATION");
      assert.equal(Array.isArray(error.errors), true);
      return true;
    });
    assert.equal(characterCount(db), 0);

    const card = minimalCharacter();
    const created = createCharacter(db, card, { now: new Date("2026-03-01T00:00:00.000Z") });
    const broken = structuredClone(created.character);
    broken.ruleset = "coc6";
    assert.throws(() => updateCharacter(db, card.id, broken), (error) => expectStorageError(error, "VALIDATION"));
    assert.equal(getCharacter(db, card.id).character.ruleset, "coc7");
    assert.equal(getCharacter(db, card.id).updatedAt, created.updatedAt);

    const swapped = structuredClone(created.character);
    swapped.ownerDiscordUserId = "200";
    assert.throws(() => updateCharacter(db, card.id, swapped), (error) => expectStorageError(error, "OWNER_MISMATCH"));
    const row = db.prepare("SELECT owner_discord_user_id, character_json FROM characters WHERE id = ?").get(card.id);
    assert.equal(row.owner_discord_user_id, "100");
    assert.equal(JSON.parse(row.character_json).ownerDiscordUserId, "100");

    const moved = structuredClone(created.character);
    moved.id = "card-renamed";
    assert.throws(() => updateCharacter(db, card.id, moved), (error) => expectStorageError(error, "ID_MISMATCH"));
    assert.throws(() => getCharacter(db, "card-renamed"), (error) => expectStorageError(error, "NOT_FOUND"));
    assert.equal(getCharacter(db, card.id).character.identity.name, "奈洛莉");

    assert.throws(() => getCharacter(db, "missing"), (error) => expectStorageError(error, "NOT_FOUND"));
    const absent = minimalCharacter();
    absent.id = "missing";
    assert.throws(() => updateCharacter(db, "missing", absent), (error) => expectStorageError(error, "NOT_FOUND"));
    assert.throws(() => deleteCharacter(db, "missing", "100"), (error) => expectStorageError(error, "NOT_FOUND"));
    assert.throws(() => deleteCharacter(db, card.id, "200"), (error) => expectStorageError(error, "OWNER_MISMATCH"));
    assert.throws(() => duplicateCharacter(db, card.id, "200"), (error) => expectStorageError(error, "OWNER_MISMATCH"));
    assert.equal(characterCount(db), 1);
    assert.equal(getCharacter(db, card.id).character.ownerDiscordUserId, "100");
  } finally {
    db.close();
    removeTemp(dir);
  }
});

test("a corrupt or non-database file is left untouched", (t) => {
  const errors = [];
  t.mock.method(console, "error", (...parts) => {
    errors.push(parts.join(" "));
  });
  const dir = tempDir();
  try {
    const garbage = join(dir, "garbage.sqlite");
    writeFileSync(garbage, "this is not sqlite");
    const before = readFileSync(garbage);
    assert.throws(() => openDatabase({ DATABASE_PATH: garbage }), (error) => expectStorageError(error, "NOT_A_DATABASE"));
    assert.deepEqual(readFileSync(garbage), before);

    const empty = join(dir, "empty.sqlite");
    writeFileSync(empty, Buffer.alloc(0));
    assert.throws(() => openDatabase({ DATABASE_PATH: empty }), (error) => expectStorageError(error, "NOT_A_DATABASE"));
    assert.equal(statSync(empty).size, 0);

    const validPath = join(dir, "valid.sqlite");
    const db = openDatabase({ DATABASE_PATH: validPath });
    db.pragma("journal_mode = DELETE");
    db.close();
    for (const suffix of ["-wal", "-shm"]) {
      const sidecar = `${validPath}${suffix}`;
      if (existsSync(sidecar)) rmSync(sidecar);
    }
    const corrupted = readFileSync(validPath).subarray(0, 200);
    assert.equal(corrupted.subarray(0, 15).toString("utf8"), "SQLite format 3");
    writeFileSync(validPath, corrupted);
    assert.throws(() => openDatabase({ DATABASE_PATH: validPath }), (error) => {
      assert.equal(error instanceof StorageError, true);
      assert.equal(["INTEGRITY", "NOT_A_DATABASE"].includes(error.code), true, error.code);
      return true;
    });
    assert.equal(statSync(validPath).size, 200);
    assert.equal(errors.some((message) => message.includes("拒绝") || message.includes("完整性检查失败")), true);
  } finally {
    removeTemp(dir);
  }
});

test("online backup keeps one file per day and the newest 14", async () => {
  const dir = tempDir();
  const backupDir = join(dir, "backups");
  const db = openTemp(dir);
  try {
    const card = minimalCharacter();
    createCharacter(db, card);
    const now = new Date("2026-04-01T12:00:00.000Z");
    const destination = await backupDatabase(db, { now, backupDir });
    assert.equal(destination, join(backupDir, "coc-2026-04-01.sqlite"));
    const backedUp = openDatabase({ DATABASE_PATH: destination });
    try {
      assert.equal(getCharacter(backedUp, card.id).character.identity.name, "奈洛莉");
    } finally {
      backedUp.close();
    }

    const snapshot = readFileSync(destination);
    const extra = minimalCharacter();
    extra.id = "card-2";
    createCharacter(db, extra);
    const sameDay = await backupDatabase(db, { now, backupDir });
    assert.equal(sameDay, destination);
    assert.deepEqual(readFileSync(destination), snapshot);

    mkdirSync(backupDir, { recursive: true });
    for (let day = 16; day >= 1; day -= 1) {
      const name = `coc-2026-01-${String(day).padStart(2, "0")}.sqlite`;
      writeFileSync(join(backupDir, name), day === 16 ? "KEEP" : `day-${day}`);
    }
    writeFileSync(join(backupDir, "notes.txt"), "leave me");
    await backupDatabase(db, { now: new Date("2026-01-16T00:00:00.000Z"), backupDir });
    const names = readdirSync(backupDir).filter((name) => /^coc-\d{4}-\d{2}-\d{2}\.sqlite$/.test(name)).sort();
    assert.equal(names.length, 14);
    assert.equal(names.includes("coc-2026-01-01.sqlite"), false);
    assert.equal(names.includes("coc-2026-01-02.sqlite"), false);
    assert.equal(names.includes("coc-2026-01-03.sqlite"), false);
    assert.equal(names.includes("coc-2026-01-04.sqlite"), true);
    assert.equal(names.includes("coc-2026-01-16.sqlite"), true);
    assert.equal(names.includes("coc-2026-04-01.sqlite"), true);
    assert.equal(readFileSync(join(backupDir, "coc-2026-01-16.sqlite"), "utf8"), "KEEP");
    assert.equal(readFileSync(join(backupDir, "notes.txt"), "utf8"), "leave me");
  } finally {
    db.close();
    removeTemp(dir);
  }
});
