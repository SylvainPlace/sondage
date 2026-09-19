// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";

import { applyD1Migrations, createD1TestDatabase, type D1TestDatabase } from "./d1";

describe("D1 migrations", () => {
  let database: D1TestDatabase | undefined;

  afterEach(async () => {
    await database?.dispose();
  });

  it("applies every migration to an empty database", async () => {
    database = await createD1TestDatabase({ applyMigrations: false });

    await applyD1Migrations(database.db);

    const configuration = await database.db
      .prepare("SELECT id FROM email_configuration WHERE id = 1")
      .first<{ id: number }>();
    const seededDomain = await database.db
      .prepare("SELECT label FROM taxonomy_category WHERE id = 'domain_software'")
      .first<{ label: string }>();
    const activationGrantTable = await database.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'activation_grant'")
      .first<{ name: string }>();
    const securityColumns = await database.db
      .prepare(
        `SELECT name FROM pragma_table_info('user_session')
         WHERE name IN ('csrf_token_hash', 'authenticated_at') ORDER BY name`,
      )
      .all<{ name: string }>();

    expect(configuration).toEqual({ id: 1 });
    expect(seededDomain).toEqual({ label: "Ingénierie logicielle" });
    expect(activationGrantTable).toEqual({ name: "activation_grant" });
    expect(securityColumns.results.map((column) => column.name)).toEqual([
      "authenticated_at",
      "csrf_token_hash",
    ]);
  });

  it("upgrades the previous schema without losing existing accounts", async () => {
    database = await createD1TestDatabase({ applyMigrations: false });
    await applyD1Migrations(database.db, ["0001_v1_core.sql"]);
    await database.db
      .prepare(
        `INSERT INTO account (id, email_normalized, created_at, updated_at)
         VALUES ('account_existing', 'existing@example.org', ?, ?)`,
      )
      .bind("2026-09-19T08:00:00.000Z", "2026-09-19T08:00:00.000Z")
      .run();

    await applyD1Migrations(database.db, ["0002_seed_taxonomies.sql"]);

    const account = await database.db
      .prepare("SELECT email_normalized FROM account WHERE id = 'account_existing'")
      .first<{ email_normalized: string }>();
    const seededDomain = await database.db
      .prepare("SELECT label FROM taxonomy_category WHERE id = 'domain_software'")
      .first<{ label: string }>();

    expect(account).toEqual({ email_normalized: "existing@example.org" });
    expect(seededDomain).toEqual({ label: "Ingénierie logicielle" });
  });

  it("adds activation grants to the previous schema without losing challenges", async () => {
    database = await createD1TestDatabase({ applyMigrations: false });
    await applyD1Migrations(database.db, ["0001_v1_core.sql", "0002_seed_taxonomies.sql"]);
    await database.db
      .prepare(
        `INSERT INTO account (id, email_normalized, created_at, updated_at)
         VALUES ('account_existing', 'existing@example.org', ?, ?)`,
      )
      .bind("2026-09-19T08:00:00.000Z", "2026-09-19T08:00:00.000Z")
      .run();
    await database.db
      .prepare(
        `INSERT INTO verification_challenge (
           id, account_id, target_email_normalized, purpose, code_hash, requested_at, expires_at
         ) VALUES ('challenge_existing', 'account_existing', 'existing@example.org',
                   'activation', 'hash', ?, ?)`,
      )
      .bind("2026-09-19T08:00:00.000Z", "2026-09-19T08:10:00.000Z")
      .run();

    await applyD1Migrations(database.db, ["0003_activation_grants.sql"]);

    const challenge = await database.db
      .prepare("SELECT account_id FROM verification_challenge WHERE id = 'challenge_existing'")
      .first<{ account_id: string }>();
    const activationGrantTable = await database.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'activation_grant'")
      .first<{ name: string }>();

    expect(challenge).toEqual({ account_id: "account_existing" });
    expect(activationGrantTable).toEqual({ name: "activation_grant" });
  });

  it("adds session security metadata without losing active sessions", async () => {
    database = await createD1TestDatabase({ applyMigrations: false });
    await applyD1Migrations(database.db, [
      "0001_v1_core.sql",
      "0002_seed_taxonomies.sql",
      "0003_activation_grants.sql",
    ]);
    await database.db
      .prepare(
        `INSERT INTO account (id, email_normalized, status, created_at, updated_at)
         VALUES ('account_existing', 'existing@example.org', 'active', ?, ?)`,
      )
      .bind("2026-09-19T08:00:00.000Z", "2026-09-19T08:00:00.000Z")
      .run();
    await database.db
      .prepare(
        `INSERT INTO user_session (
           id, token_hash, account_id, created_at, last_seen_at, expires_at
         ) VALUES ('session_existing', 'token_hash', 'account_existing', ?, ?, ?)`,
      )
      .bind("2026-09-19T08:00:00.000Z", "2026-09-19T09:00:00.000Z", "2027-12-19T09:00:00.000Z")
      .run();

    await applyD1Migrations(database.db, ["0004_session_security.sql"]);

    const session = await database.db
      .prepare(
        `SELECT authenticated_at, csrf_token_hash
         FROM user_session WHERE id = 'session_existing'`,
      )
      .first<{ authenticated_at: string; csrf_token_hash: string | null }>();
    expect(session).toEqual({
      authenticated_at: "2026-09-19T08:00:00.000Z",
      csrf_token_hash: null,
    });
  });
});
