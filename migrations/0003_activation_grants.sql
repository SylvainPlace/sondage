PRAGMA foreign_keys = ON;

CREATE TABLE activation_grant (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE
    REFERENCES verification_challenge(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
) STRICT;

CREATE INDEX activation_grant_lookup_idx
  ON activation_grant(token_hash, expires_at, consumed_at);
