import { readFile } from "node:fs/promises";
import path from "node:path";

import type { D1Database } from "@cloudflare/workers-types";
import { Miniflare } from "miniflare";

export interface D1TestDatabase {
  db: D1Database;
  dispose(): Promise<void>;
}

interface CreateD1TestDatabaseOptions {
  applyMigrations?: boolean;
}

const D1_MIGRATIONS = [
  "0001_v1_core.sql",
  "0002_seed_taxonomies.sql",
  "0003_activation_grants.sql",
  "0004_session_security.sql",
] as const;

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let statement = "";
  let quote: "'" | '"' | null = null;
  let lineComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const nextCharacter = sql[index + 1];

    if (lineComment) {
      statement += character;
      if (character === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (!quote && character === "-" && nextCharacter === "-") {
      lineComment = true;
      statement += "--";
      index += 1;
      continue;
    }

    if (quote) {
      statement += character;
      if (character === quote) {
        if (nextCharacter === quote) {
          statement += nextCharacter;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      statement += character;
      continue;
    }

    if (character === ";") {
      if (statement.trim()) {
        statements.push(statement.trim());
      }
      statement = "";
      continue;
    }

    statement += character;
  }

  if (statement.trim()) {
    statements.push(statement.trim());
  }

  return statements;
}

export async function applyD1Migrations(
  db: D1Database,
  migrations: readonly string[] = D1_MIGRATIONS,
): Promise<void> {
  const migrationDirectory = path.resolve(process.cwd(), "migrations");

  for (const migration of migrations) {
    const sql = await readFile(path.join(migrationDirectory, migration), "utf8");
    for (const statement of splitSqlStatements(sql.replaceAll("\r\n", "\n"))) {
      await db.prepare(statement).run();
    }
  }
}

export async function createD1TestDatabase(
  options: CreateD1TestDatabaseOptions = {},
): Promise<D1TestDatabase> {
  const miniflare = new Miniflare({
    d1Databases: ["DB"],
    modules: true,
    script: "export default { fetch() { return new Response('Not found', { status: 404 }); } }",
  });
  const db = await miniflare.getD1Database("DB");

  if (options.applyMigrations !== false) {
    await applyD1Migrations(db);
  }

  return {
    db,
    dispose: () => miniflare.dispose(),
  };
}
