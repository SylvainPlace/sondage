// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createActivationCompleteHandler } from "./activation-complete-http";
import { createActivationRequestHandler } from "./activation-request-http";
import { createActivationVerifyHandler } from "./activation-verify-http";

describe("POST /api/auth/activation/complete", () => {
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
    const requestActivation = createActivationRequestHandler({
      db: database.db,
      email: { send: async () => ({ messageId: "email_1" }) },
      humanVerification: { verify: async () => ({ valid: true }) },
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:00:00.000Z"),
      createChallengeId: () => "challenge_1",
      createCode: () => "482731",
    });
    await requestActivation(
      jsonRequest("/activation/request", {
        email: "alice@example.org",
        turnstileToken: "turnstile-token",
      }),
    );
    const verifyActivation = createActivationVerifyHandler({
      db: database.db,
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:05:00.000Z"),
      createGrantId: () => "grant_1",
      createGrantToken: () => "opaque-activation-token",
    });
    await verifyActivation(
      jsonRequest("/activation/verify", {
        email: "alice@example.org",
        code: "482731",
      }),
    );
  });

  afterEach(async () => {
    await database.dispose();
  });

  it("activates the D1 account through Firebase and creates a secure application session", async () => {
    const completeActivation = createActivationCompleteHandler({
      db: database.db,
      identity: {
        async activateWithPassword() {
          return {
            uid: "firebase_alice",
            emailNormalized: "alice@example.org",
            authenticatedAt: new Date("2026-09-19T09:06:00.000Z"),
          };
        },
      },
      activationPepper: "test-pepper",
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T09:06:00.000Z"),
    });

    const response = await completeActivation(
      jsonRequest("/activation/complete", {
        activationToken: "opaque-activation-token",
        password: "correct horse battery staple",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      account: {
        id: "account_alice",
        email: "alice@example.org",
        role: "alumni",
      },
      expiresAt: "2027-12-19T09:06:00.000Z",
    });
    expect(response.headers.get("set-cookie")).toMatch(
      /^__Host-alumni_session=.+; Path=\/; HttpOnly; Secure; SameSite=Lax; Expires=/u,
    );
  });

  it("keeps the D1 account and activation grant recoverable when Firebase fails", async () => {
    const completeActivation = createActivationCompleteHandler({
      db: database.db,
      identity: {
        async activateWithPassword() {
          throw new Error("temporary Firebase failure");
        },
      },
      activationPepper: "test-pepper",
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T09:06:00.000Z"),
    });

    const response = await completeActivation(
      jsonRequest("/activation/complete", {
        activationToken: "opaque-activation-token",
        password: "correct horse battery staple",
      }),
    );
    const account = await database.db
      .prepare("SELECT status, firebase_uid FROM account WHERE id = 'account_alice'")
      .first<{ status: string; firebase_uid: string | null }>();
    const grant = await database.db
      .prepare("SELECT consumed_at FROM activation_grant WHERE id = 'grant_1'")
      .first<{ consumed_at: string | null }>();

    expect(response.status).toBe(503);
    expect(account).toEqual({ status: "eligible", firebase_uid: null });
    expect(grant).toEqual({ consumed_at: null });
  });
});

function jsonRequest(pathname: string, body: unknown): Request {
  return new Request(`https://alumni.test/api/auth${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
