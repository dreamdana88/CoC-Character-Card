import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { StorageError } from "./errors.js";

const BACKUP_NAME = /^coc-(\d{4}-\d{2}-\d{2})\.sqlite$/;
const BACKUP_KEEP = 14;

function utcDate(now) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pruneBackups(directory) {
  const dated = readdirSync(directory)
    .map((name) => {
      const match = BACKUP_NAME.exec(name);
      return match ? { name, date: match[1] } : null;
    })
    .filter(Boolean);
  dated.sort((left, right) => right.date.localeCompare(left.date));
  for (const file of dated.slice(BACKUP_KEEP)) {
    unlinkSync(join(directory, file.name));
  }
}

export async function backupDatabase(db, { now = new Date(), backupDir } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new StorageError("备份时间无效", { code: "INVALID_TIME" });
  }
  if (!db?.open || typeof db.backup !== "function" || typeof db.name !== "string" || db.name === "" || db.name === ":memory:") {
    throw new StorageError("数据库没有打开，不能备份", { code: "NOT_OPEN" });
  }
  const directory = backupDir ?? join(dirname(db.name), "backups");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, `coc-${utcDate(now)}.sqlite`);
  if (destination === db.name) {
    throw new StorageError("备份路径不能是正在使用的数据库", { code: "BACKUP" });
  }
  if (!existsSync(destination)) {
    await db.backup(destination);
  }
  pruneBackups(directory);
  return destination;
}
