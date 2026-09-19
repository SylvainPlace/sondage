// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccountRepository } from "@/features/accounts/server/account-repository";
import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createLoginHandler } from "./login-http";

describe("POST /api/auth/login", () => {
  let database: D1TestDatabase;

  beforeEach(async () => {
    database = await createD1TestDatabase();
    const importWhitelist = createWhitelistHttpHandler({
      db: database.db,
      createId: () => "account_alice",
    });
    await importWhitelist(
      new Request("https://alumni.test/api/admin/accounts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails: ["alice@example.org"] }),
      }),
    );
    await new AccountRepository(database.db).activate(
      "account_alice",
      "firebase_alice",
      "2026-09-19T09:00:00.000Z",
    );
  });

  afterEach(async () => {
    await database.dispose();
  });

  it("creates an opaque session for a matching active D1 account", async () => {
    const login = createLoginHandler({
      db: database.db,
      identity: {
        async authenticateWithPassword() {
          return {
            uid: "firebase_alice",
            emailNormalized: "alice@example.org",
            authenticatedAt: new Date("2026-09-19T10:00:00.000Z"),
          };
        },
      },
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await login(loginRequest("alice@example.org"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      account: { id: "account_alice", email: "alice@example.org", role: "alumni" },
      expiresAt: "2027-12-19T10:00:00.000Z",
    });
    expect(response.headers.get("set-cookie")).toMatch(
      /^__Host-alumni_session=.+; Path=\/; HttpOnly; Secure; SameSite=Lax; Expires=/u,
    );
  });

  it("does not reveal whether a Firebase identity lacks an active D1 account", async () => {
    const login = createLoginHandler({
      db: database.db,
      identity: {
        async authenticateWithPassword({ emailNormalized }) {
          return {
            uid: "firebase_outsider",
            emailNormalized,
            authenticatedAt: new Date("2026-09-19T10:00:00.000Z"),
          };
        },
      },
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await login(loginRequest("outsider@example.org"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "invalid_credentials", message: "Identifiants invalides" },
    });
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("returns invalid credentials when Firebase rejects the password", async () => {
    const login = createLoginHandler({
      db: database.db,
      identity: {
        async authenticateWithPassword() {
          throw new Error("INVALID_PASSWORD");
        },
      },
      sessionPepper: "session-pepper",
    });

    const response = await login(loginRequest("alice@example.org"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_credentials" },
    });
    expect(response.headers.has("set-cookie")).toBe(false);
  });
});

function loginRequest(email: string): Request {
  return new Request("https://alumni.test/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "Test browser" },
    body: JSON.stringify({ email, password: "correct horse battery staple" }),
  });
}
