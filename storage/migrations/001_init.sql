-- version 是数据库迁移版本。characters.schema_version 只描述角色卡 JSON，两者不是一回事。

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  owner_discord_user_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  ruleset TEXT NOT NULL,
  character_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX characters_by_owner ON characters (owner_discord_user_id);
