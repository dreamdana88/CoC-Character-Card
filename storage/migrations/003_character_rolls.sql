CREATE TABLE characteristic_rolls (
  owner_discord_user_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  sets_json TEXT NOT NULL,
  PRIMARY KEY (owner_discord_user_id, character_id)
);
