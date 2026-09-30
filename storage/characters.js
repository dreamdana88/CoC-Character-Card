import { randomUUID } from "node:crypto";
import { validateCharacter } from "../rules/validation.js";
import { StorageError } from "./errors.js";

function withoutPlayerName(card) {
  if (!card?.identity || typeof card.identity !== "object" || Array.isArray(card.identity) || !Object.hasOwn(card.identity, "playerName")) {
    return card;
  }
  const identity = { ...card.identity };
  delete identity.playerName;
  return { ...card, identity };
}

function assertValid(card) {
  const result = validateCharacter(card);
  if (result.ok) return;
  const error = new StorageError("角色卡未通过校验，没有写入", { code: "VALIDATION" });
  error.errors = result.errors;
  throw error;
}

function currentTimestamp(now) {
  const value = typeof now === "function" ? now() : now ?? new Date();
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new StorageError("时间无效", { code: "INVALID_TIME" });
  }
  return value.toISOString();
}

function parseStoredCharacter(json) {
  try {
    const character = JSON.parse(json);
    if (!character || typeof character !== "object" || Array.isArray(character)) {
      throw new StorageError("库存的角色卡不是对象", { code: "INTEGRITY" });
    }
    return character;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("库存的角色卡 JSON 无法读取", { code: "INTEGRITY", cause: error });
  }
}

function toRecord(row) {
  return {
    character: parseStoredCharacter(row.character_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireId(id) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new StorageError("缺少角色卡 id", { code: "VALIDATION" });
  }
}

function requireOwner(ownerDiscordUserId) {
  if (typeof ownerDiscordUserId !== "string" || ownerDiscordUserId.trim() === "") {
    throw new StorageError("缺少 ownerDiscordUserId", { code: "VALIDATION" });
  }
}

function insertCharacter(db, card, createdAt, updatedAt) {
  try {
    db.prepare(`
      INSERT INTO characters (
        id, owner_discord_user_id, schema_version, ruleset, character_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      card.id,
      card.ownerDiscordUserId,
      card.schemaVersion,
      card.ruleset,
      JSON.stringify(card),
      createdAt,
      updatedAt,
    );
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      throw new StorageError("角色卡 id 已存在", { code: "DUPLICATE_ID", cause: error });
    }
    throw error;
  }
}

export function createCharacter(db, card, options = {}) {
  const stored = withoutPlayerName(card);
  assertValid(stored);
  const timestamp = currentTimestamp(options.now);
  insertCharacter(db, stored, timestamp, timestamp);
  return getCharacter(db, stored.id);
}

export function getCharacter(db, id) {
  requireId(id);
  const row = db.prepare(`
    SELECT character_json, created_at, updated_at
    FROM characters
    WHERE id = ?
  `).get(id);
  if (!row) throw new StorageError("找不到角色卡", { code: "NOT_FOUND" });
  return toRecord(row);
}

export function listCharactersByOwner(db, ownerDiscordUserId) {
  requireOwner(ownerDiscordUserId);
  return db.prepare(`
    SELECT character_json, created_at, updated_at
    FROM characters
    WHERE owner_discord_user_id = ?
    ORDER BY created_at, id
  `).all(ownerDiscordUserId).map(toRecord);
}

export function updateCharacter(db, id, card, options = {}) {
  card = withoutPlayerName(card);
  assertValid(card);
  requireId(id);
  if (card.id !== id) {
    throw new StorageError("角色卡 JSON 里的 id 必须和要更新的记录一致", { code: "ID_MISMATCH" });
  }
  const existing = db.prepare(`
    SELECT owner_discord_user_id, created_at
    FROM characters
    WHERE id = ?
  `).get(id);
  if (!existing) throw new StorageError("找不到角色卡", { code: "NOT_FOUND" });
  if (existing.owner_discord_user_id !== card.ownerDiscordUserId) {
    throw new StorageError("不能更换角色卡的所有者", { code: "OWNER_MISMATCH" });
  }
  const updatedAt = currentTimestamp(options.now);
  const result = db.prepare(`
    UPDATE characters
    SET schema_version = ?,
        ruleset = ?,
        character_json = ?,
        updated_at = ?
    WHERE id = ? AND owner_discord_user_id = ?
  `).run(
    card.schemaVersion,
    card.ruleset,
    JSON.stringify(card),
    updatedAt,
    id,
    existing.owner_discord_user_id,
  );
  if (result.changes !== 1) throw new StorageError("找不到角色卡", { code: "NOT_FOUND" });
  const record = getCharacter(db, id);
  if (record.createdAt !== existing.created_at) {
    throw new StorageError("更新时创建时间被改动", { code: "INTEGRITY" });
  }
  return record;
}

function ownedRow(db, id, ownerDiscordUserId) {
  requireId(id);
  requireOwner(ownerDiscordUserId);
  const row = db.prepare(`
    SELECT owner_discord_user_id, character_json, created_at, updated_at
    FROM characters
    WHERE id = ?
  `).get(id);
  if (!row) throw new StorageError("找不到角色卡", { code: "NOT_FOUND" });
  if (row.owner_discord_user_id !== ownerDiscordUserId) {
    throw new StorageError("只能操作自己的角色卡", { code: "OWNER_MISMATCH" });
  }
  return row;
}

export function deleteCharacter(db, id, ownerDiscordUserId) {
  ownedRow(db, id, ownerDiscordUserId);
  const result = db.prepare(`
    DELETE FROM characters
    WHERE id = ? AND owner_discord_user_id = ?
  `).run(id, ownerDiscordUserId);
  if (result.changes !== 1) throw new StorageError("找不到角色卡", { code: "NOT_FOUND" });
}

export function duplicateCharacter(db, id, ownerDiscordUserId, options = {}) {
  const row = ownedRow(db, id, ownerDiscordUserId);
  const copy = withoutPlayerName(parseStoredCharacter(row.character_json));
  copy.id = randomUUID();
  if (copy.ownerDiscordUserId !== row.owner_discord_user_id) {
    throw new StorageError("库存的所有者与角色卡 JSON 不一致", { code: "INTEGRITY" });
  }
  assertValid(copy);
  const timestamp = currentTimestamp(options.now);
  insertCharacter(db, copy, timestamp, timestamp);
  return getCharacter(db, copy.id);
}
