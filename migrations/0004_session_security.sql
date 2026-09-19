PRAGMA foreign_keys = ON;

ALTER TABLE user_session ADD COLUMN csrf_token_hash TEXT;
ALTER TABLE user_session ADD COLUMN authenticated_at TEXT;

UPDATE user_session
SET authenticated_at = created_at
WHERE authenticated_at IS NULL;
