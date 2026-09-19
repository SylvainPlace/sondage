// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createActivationRequestHandler } from "./activation-request-http";
import { createActivationVerifyHandler } from "./activation-verify-http";

describe("POST /api/auth/activation/verify", () => {
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
    await requestActivation(activationRequest());
  });

  afterEach(async () => {
    await database.dispose();
  });

  it("exchanges a valid six-digit code for a short-lived opaque activation token", async () => {
    const verifyActivation = createActivationVerifyHandler({
      db: database.db,
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:05:00.000Z"),
      createGrantId: () => "grant_1",
      createGrantToken: () => "opaque-activation-token",
    });

    const response = await verifyActivation(
      new Request("https://alumni.test/api/auth/activation/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "Alice@example.org", code: "482731" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      activationToken: "opaque-activation-token",
      expiresAt: "2026-09-19T09:15:00.000Z",
    });
  });

  it("invalidates the code on the fifth failed attempt", async () => {
    const verifyActivation = createActivationVerifyHandler({
      db: database.db,
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:05:00.000Z"),
    });

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await verifyActivation(
        new Request("https://alumni.test/api/auth/activation/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "alice@example.org", code: "000000" }),
        }),
      );

      expect(response.status).toBe(attempt < 5 ? 400 : 429);
    }
  });

  it("rejects an expired code", async () => {
    const verifyActivation = createActivationVerifyHandler({
      db: database.db,
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:10:00.001Z"),
    });

    const response = await verifyActivation(verificationRequest("482731"));

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "code_expired" } });
  });

  it("rejects a code that has already been consumed", async () => {
    const verifyActivation = createActivationVerifyHandler({
      db: database.db,
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:05:00.000Z"),
    });

    expect((await verifyActivation(verificationRequest("482731"))).status).toBe(200);
    const secondResponse = await verifyActivation(verificationRequest("482731"));

    expect(secondResponse.status).toBe(409);
    await expect(secondResponse.json()).resolves.toMatchObject({
      error: { code: "code_consumed" },
    });
  });
});

function activationRequest(): Request {
  return new Request("https://alumni.test/api/auth/activation/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "alice@example.org", turnstileToken: "turnstile-token" }),
  });
}

function verificationRequest(code: string): Request {
  return new Request("https://alumni.test/api/auth/activation/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "alice@example.org", code }),
  });
}
