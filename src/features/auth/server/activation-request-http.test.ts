// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import type {
  EmailMessage,
  EmailProvider,
  HumanVerificationProvider,
} from "@/lib/services/external-services";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createActivationRequestHandler } from "./activation-request-http";

describe("POST /api/auth/activation/request", () => {
  let database: D1TestDatabase;

  beforeEach(async () => {
    database = await createD1TestDatabase();
  });

  afterEach(async () => {
    await database.dispose();
  });

  it("returns the same response for known and unknown addresses but emails only an eligible alumni", async () => {
    const importWhitelist = createWhitelistHttpHandler({
      db: database.db,
      now: () => new Date("2026-09-19T08:00:00.000Z"),
      createId: () => "account_alice",
    });
    await importWhitelist(
      new Request("https://alumni.test/api/admin/accounts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails: ["alice@example.org"] }),
      }),
    );

    const sentEmails: EmailMessage[] = [];
    const email: EmailProvider = {
      async send(message) {
        sentEmails.push(message);
        return { messageId: "email_1" };
      },
    };
    const humanVerification: HumanVerificationProvider = {
      async verify() {
        return { valid: true };
      },
    };
    const handler = createActivationRequestHandler({
      db: database.db,
      email,
      humanVerification,
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:00:00.000Z"),
      createChallengeId: () => "challenge_1",
      createCode: () => "482731",
    });

    const knownResponse = await handler(activationRequest(" Alice@Example.org "));
    const unknownResponse = await handler(activationRequest("unknown@example.org"));

    expect(knownResponse.status).toBe(202);
    expect(unknownResponse.status).toBe(202);
    await expect(knownResponse.json()).resolves.toEqual({
      ok: true,
      message: "Si cette adresse est éligible, un code vient d’être envoyé.",
    });
    await expect(unknownResponse.json()).resolves.toEqual({
      ok: true,
      message: "Si cette adresse est éligible, un code vient d’être envoyé.",
    });
    expect(sentEmails).toEqual([
      {
        to: "alice@example.org",
        template: "activation-code",
        variables: { code: "482731", expiresInMinutes: "10" },
        idempotencyKey: "activation:challenge_1",
      },
    ]);
  });

  it("keeps the neutral response and allows a retry when email delivery fails", async () => {
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

    let sendAttempt = 0;
    const email: EmailProvider = {
      async send() {
        sendAttempt += 1;
        if (sendAttempt === 1) {
          throw new Error("temporary provider failure");
        }
        return { messageId: "email_2" };
      },
    };
    const challengeIds = ["challenge_failed", "challenge_retry"];
    const handler = createActivationRequestHandler({
      db: database.db,
      email,
      humanVerification: { verify: async () => ({ valid: true }) },
      pepper: "test-pepper",
      createChallengeId: () => challengeIds.shift() ?? "challenge_fallback",
      createCode: () => "482731",
    });

    const firstResponse = await handler(activationRequest("alice@example.org"));
    const retryResponse = await handler(activationRequest("alice@example.org"));

    expect(firstResponse.status).toBe(202);
    expect(retryResponse.status).toBe(202);
    expect(sendAttempt).toBe(2);
  });

  it("returns a recoverable error when Turnstile is temporarily unavailable", async () => {
    const handler = createActivationRequestHandler({
      db: database.db,
      email: { send: async () => ({ messageId: "unused" }) },
      humanVerification: {
        async verify() {
          throw new Error("network unavailable");
        },
      },
      pepper: "test-pepper",
    });

    const response = await handler(activationRequest("alice@example.org"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "human_verification_unavailable" },
    });
  });
});

function activationRequest(email: string): Request {
  return new Request("https://alumni.test/api/auth/activation/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, turnstileToken: "turnstile-token" }),
  });
}
