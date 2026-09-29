CREATE TABLE oauth_states (
  state_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE web_sessions (
  session_token_hash TEXT PRIMARY KEY,
  user_discord_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_entitlement_check_at TEXT NOT NULL,
  revoked_at TEXT
);
