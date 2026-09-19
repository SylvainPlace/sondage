// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccountRepository } from "@/features/accounts/server/account-repository";
import { SessionRepository } from "@/features/accounts/server/session-repository";
import { issueSession } from "@/features/accounts/server/session-service";
import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createSessionsHandler } from "./sessions-http";
import { createReauthenticationHandler } from "./reauthentication-http";

describe("/api/auth/sessions", () => {
  let database: D1TestDatabase;

  beforeEach(async () => {
    database = await createD1TestDatabase();
    const importWhitelist = createWhitelistHttpHandler({
      db: database.db,
      createId: () => "account_alice",
    });
    await importWhitelist(
      jsonRequest("/api/admin/accounts/import", { emails: ["alice@example.org"] }),
    );
    await new AccountRepository(database.db).activate(
      "account_alice",
      "firebase_alice",
      "2026-09-19T08:00:00.000Z",
    );
  });

  afterEach(async () => database.dispose());

  it("lists active devices without exposing token material", async () => {
    const current = await createSession("Firefox sur Windows", "2026-09-19T09:00:00.000Z");
    await createSession("Safari sur iPhone", "2026-09-18T09:00:00.000Z");
    const handler = createSessionsHandler(dependencies("2026-09-19T10:00:00.000Z"));

    const response = await handler(authenticatedRequest("GET", current));
    const body = (await response.json()) as { sessions: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(body.sessions).toHaveLength(2);
    expect(body.sessions).toContainEqual(
      expect.objectContaining({
        id: current.id,
        deviceLabel: "Firefox sur Windows",
        current: true,
      }),
    );
    expect(JSON.stringify(body)).not.toContain(current.token);
    expect(JSON.stringify(body)).not.toContain(current.csrfToken);
    expect(JSON.stringify(body)).not.toContain("tokenHash");
  });

  it("revokes another session when origin and CSRF token are valid", async () => {
    const current = await createSession("Firefox sur Windows", "2026-09-19T09:00:00.000Z");
    const other = await createSession("Safari sur iPhone", "2026-09-18T09:00:00.000Z");
    const handler = createSessionsHandler(dependencies("2026-09-19T10:00:00.000Z"));

    const response = await handler(
      authenticatedRequest("DELETE", current, { sessionId: other.id }),
    );
    const sessions = await database.db
      .prepare("SELECT id, revoked_at FROM user_session ORDER BY id")
      .all<{ id: string; revoked_at: string | null }>();

    expect(response.status).toBe(204);
    expect(sessions.results.find((session) => session.id === current.id)?.revoked_at).toBeNull();
    expect(sessions.results.find((session) => session.id === other.id)?.revoked_at).not.toBeNull();
  });

  it("rejects an authenticated mutation without a same-origin CSRF proof", async () => {
    const current = await createSession("Firefox sur Windows", "2026-09-19T09:00:00.000Z");
    const handler = createSessionsHandler(dependencies("2026-09-19T10:00:00.000Z"));
    const request = authenticatedRequest("DELETE", current, { sessionId: "all" });
    request.headers.delete("x-csrf-token");

    const response = await handler(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "csrf_failed" } });
  });

  it("rejects an expired or suspended session at the next request", async () => {
    const expired = await createSession("Ancien appareil", "2025-01-01T00:00:00.000Z");
    const handler = createSessionsHandler(dependencies("2026-09-19T10:00:00.000Z"));
    expect((await handler(authenticatedRequest("GET", expired))).status).toBe(401);

    const active = await createSession("Appareil actif", "2026-09-19T09:00:00.000Z");
    await database.db
      .prepare("UPDATE account SET status = 'suspended' WHERE id = 'account_alice'")
      .run();
    expect((await handler(authenticatedRequest("GET", active))).status).toBe(401);
  });

  it("requires a recent Firebase authentication for sensitive operations", async () => {
    const current = await createSession("Firefox sur Windows", "2026-09-19T09:00:00.000Z");
    const reauthenticate = createReauthenticationHandler({
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

    expect((await reauthenticate(authenticatedRequest("GET", current))).status).toBe(428);
    expect(
      (
        await reauthenticate(
          authenticatedRequest("POST", current, { password: "correct horse battery staple" }),
        )
      ).status,
    ).toBe(204);
    expect((await reauthenticate(authenticatedRequest("GET", current))).status).toBe(204);
  });

  function dependencies(now: string) {
    return {
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date(now),
    };
  }

  async function createSession(deviceLabel: string, now: string) {
    return issueSession(new SessionRepository(database.db), {
      accountId: "account_alice",
      pepper: "session-pepper",
      now: new Date(now),
      authenticatedAt: new Date(now),
      deviceLabel,
    });
  }
});

function authenticatedRequest(
  method: "GET" | "POST" | "DELETE",
  session: { token: string; csrfToken: string },
  body?: object,
): Request {
  const init: RequestInit = {
    method,
    headers: {
      cookie: `__Host-alumni_session=${session.token}; __Host-alumni_csrf=${session.csrfToken}`,
      origin: "https://alumni.test",
      "x-csrf-token": session.csrfToken,
      "content-type": "application/json",
    },
  };
  if (body) init.body = JSON.stringify(body);
  return new Request("https://alumni.test/api/auth/sessions", init);
}

function jsonRequest(path: string, body: object): Request {
  return new Request(`https://alumni.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
