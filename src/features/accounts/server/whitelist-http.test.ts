// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createWhitelistHttpHandler } from "./whitelist-http";

describe("POST whitelist import", () => {
  let database: D1TestDatabase;

  beforeEach(async () => {
    database = await createD1TestDatabase();
  });

  afterEach(async () => {
    await database?.dispose();
  });

  it("persists normalized eligible accounts and reports a repeated import as unchanged", async () => {
    const handler = createWhitelistHttpHandler({
      db: database.db,
      now: () => new Date("2026-09-19T08:00:00.000Z"),
      createId: (email) => `account_${email.split("@")[0]}`,
    });
    const body = {
      emails: ["  Alice@Example.org ", "alice@example.org", "BOB@example.org"],
    };

    const firstResponse = await handler(
      new Request("https://alumni.test/api/admin/accounts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual({
      received: 3,
      unique: 2,
      created: 2,
      unchanged: 0,
      invalid: 0,
    });

    const repeatedResponse = await handler(
      new Request("https://alumni.test/api/admin/accounts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(repeatedResponse.status).toBe(200);
    await expect(repeatedResponse.json()).resolves.toEqual({
      received: 3,
      unique: 2,
      created: 0,
      unchanged: 2,
      invalid: 0,
    });
  });
});
