import Database from "better-sqlite3";
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StorageError } from "./errors.js";

const MIGRATION_NAME = /^(\d{3})_.+\.sql$/;
const SQLITE_MAGIC = "SQLite format 3\u0000";
const defaultMigrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

function requireDatabasePath(env) {
  const databasePath = env?.DATABASE_PATH;
  if (typeof databasePath !== "string" || databasePath.trim() === "") {
    throw new StorageError("缺少 DATABASE_PATH", { code: "MISSING_PATH" });
  }
  return databasePath;
}

function migrationFiles(migrationsDir) {
  let names;
  try {
    names = readdirSync(migrationsDir);
  } catch (error) {
    throw new StorageError(`读不到迁移目录：${error.message}`, { code: "MIGRATION", cause: error });
  }
  const files = names.filter((name) => name.endsWith(".sql")).map((name) => {
    const match = MIGRATION_NAME.exec(name);
    if (!match) {
      throw new StorageError(`迁移文件名无法识别：${name}`, { code: "MIGRATION" });
    }
    return { name, version: Number(match[1]) };
  });
  files.sort((left, right) => left.version - right.version);
  if (files.length === 0) {
    throw new StorageError("没有迁移文件", { code: "MIGRATION" });
  }
  files.forEach((file, index) => {
    const expected = index + 1;
    if (file.version !== expected) {
      throw new StorageError(`迁移版本不连续，期望 ${String(expected).padStart(3, "0")}`, { code: "MIGRATION" });
    }
  });
  return files;
}

function assertExistingSqlite(databasePath) {
  let info;
  try {
    info = statSync(databasePath);
  } catch (error) {
    throw new StorageError(`读不到角色库文件：${error.message}`, { code: "NOT_A_DATABASE", cause: error });
  }
  if (!info.isFile() || info.size < SQLITE_MAGIC.length) {
    throw new StorageError(`角色库文件已存在但不是完整的 SQLite 数据库，已拒绝新建空库覆盖：${databasePath}`, {
      code: "NOT_A_DATABASE",
    });
  }
  const fd = openSync(databasePath, "r");
  try {
    const buffer = Buffer.alloc(SQLITE_MAGIC.length);
    const bytes = readSync(fd, buffer, 0, buffer.length, 0);
    if (bytes !== buffer.length || buffer.toString("utf8") !== SQLITE_MAGIC) {
      throw new StorageError(`角色库文件已存在但不是 SQLite 数据库，已拒绝新建空库覆盖：${databasePath}`, {
        code: "NOT_A_DATABASE",
      });
    }
  } finally {
    closeSync(fd);
  }
}

function appliedVersions(db) {
  const table = db.prepare(
    "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
  ).get();
  if (!table) return [];
  return db.prepare("SELECT version FROM schema_migrations ORDER BY version").all().map((row) => row.version);
}

function applyMigration(db, version, sql) {
  const apply = db.transaction((appliedAt) => {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(version, appliedAt);
  });
  apply(new Date().toISOString());
}

function migrate(db, migrationsDir) {
  const files = migrationFiles(migrationsDir);
  const applied = appliedVersions(db);
  const newestFile = files.at(-1).version;
  if (applied.some((version) => version > newestFile)) {
    throw new StorageError("数据库迁移版本高于当前程序", { code: "MIGRATION" });
  }
  for (let index = 0; index < applied.length; index += 1) {
    if (applied[index] !== index + 1) {
      throw new StorageError("数据库迁移记录不连续", { code: "MIGRATION" });
    }
  }
  for (const file of files) {
    if (applied.includes(file.version)) continue;
    applyMigration(db, file.version, readFileSync(join(migrationsDir, file.name), "utf8"));
  }
}

function assertIntegrity(db) {
  let values;
  try {
    values = db.prepare("PRAGMA integrity_check").all().map((row) => row.integrity_check);
  } catch (error) {
    throw new StorageError(`数据库完整性检查失败：${error.message}`, { code: "INTEGRITY", cause: error });
  }
  if (values.length === 1 && values[0] === "ok") return;
  throw new StorageError(`数据库完整性检查失败：${values.join("；") || "无结果"}`, { code: "INTEGRITY" });
}

function openChecked(databasePath, migrationsDir) {
  migrationFiles(migrationsDir);
  const parent = dirname(databasePath);
  if (!existsSync(parent)) {
    throw new StorageError(`数据库目录不存在：${parent}`, { code: "MISSING_PATH" });
  }
  const existed = existsSync(databasePath);
  if (existed) assertExistingSqlite(databasePath);

  let db;
  try {
    db = new Database(databasePath, { fileMustExist: existed });
    assertIntegrity(db);
    migrate(db, migrationsDir);
    const mode = db.pragma("journal_mode = WAL", { simple: true });
    if (mode !== "wal") {
      throw new StorageError(`数据库没有进入 WAL：${mode}`, { code: "INTEGRITY" });
    }
    return db;
  } catch (error) {
    if (db) db.close();
    throw error;
  }
}

function rejectUnusable(error) {
  if (error instanceof StorageError) return error;
  if (error?.code === "SQLITE_NOTADB") {
    return new StorageError(`角色库无法作为 SQLite 打开，已拒绝新建空库覆盖：${error.message}`, {
      code: "NOT_A_DATABASE",
      cause: error,
    });
  }
  if (typeof error?.code === "string" && error.code.startsWith("SQLITE_CORRUPT")) {
    return new StorageError(`数据库完整性检查失败：${error.message}`, { code: "INTEGRITY", cause: error });
  }
  return error;
}

export function openDatabase(env = process.env, options = {}) {
  const databasePath = requireDatabasePath(env);
  const migrationsDir = options.migrationsDir ?? defaultMigrationsDir;
  try {
    return openChecked(databasePath, migrationsDir);
  } catch (error) {
    const storageError = rejectUnusable(error);
    if (storageError instanceof StorageError && (storageError.code === "INTEGRITY" || storageError.code === "NOT_A_DATABASE")) {
      console.error(storageError.message);
    }
    throw storageError;
  }
}
