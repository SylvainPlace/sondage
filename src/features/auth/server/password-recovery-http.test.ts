// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccountRepository } from "@/features/accounts/server/account-repository";
import { SessionRepository } from "@/features/accounts/server/session-repository";
import { issueSession } from "@/features/accounts/server/session-service";
import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import type { EmailMessage } from "@/lib/services/external-services";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import {
  createPasswordRecoveryCompleteHandler,
  createPasswordRecoveryRequestHandler,
} from "./password-recovery-http";

describe("password recovery HTTP flow", () => {
  let database: D1TestDatabase;
  const sentEmails: EmailMessage[] = [];

  beforeEach(async () => {
    database = await createD1TestDatabase();
    sentEmails.length = 0;
    const importWhitelist = createWhitelistHttpHandler({
      db: database.db,
      createId: () => "account_alice",
    });
    await importWhitelist(jsonRequest("/import", { emails: ["alice@example.org"] }));
    await new AccountRepository(database.db).activate(
      "account_alice",
      "firebase_alice",
      "2026-09-19T08:00:00.000Z",
    );
  });

  afterEach(async () => database.dispose());

  it("keeps recovery requests neutral and sends a code only for an active account", async () => {
    const requestRecovery = recoveryRequestHandler();

    const known = await requestRecovery(
      jsonRequest("/recovery/request", {
        email: "alice@example.org",
        turnstileToken: "valid-token",
      }),
    );
    const unknown = await requestRecovery(
      jsonRequest("/recovery/request", {
        email: "unknown@example.org",
        turnstileToken: "valid-token",
      }),
    );

    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(await known.json()).toEqual(await unknown.json());
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]).toMatchObject({
      to: "alice@example.org",
      template: "password-reset-code",
      variables: { code: "731924", expiresInMinutes: "10" },
    });
  });

  it("resets Firebase password, consumes the proof and revokes every session", async () => {
    await recoveryRequestHandler()(
      jsonRequest("/recovery/request", {
        email: "alice@example.org",
        turnstileToken: "valid-token",
      }),
    );
    await issueSession(new SessionRepository(database.db), {
      accountId: "account_alice",
      pepper: "session-pepper",
      now: new Date("2026-09-19T09:01:00.000Z"),
    });
    const resetCalls: Array<{ uid: string; password: string }> = [];
    const completeRecovery = createPasswordRecoveryCompleteHandler({
      db: database.db,
      identity: {
        async resetPassword(input) {
          resetCalls.push(input);
        },
      },
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:05:00.000Z"),
    });

    const response = await completeRecovery(
      jsonRequest("/recovery/complete", {
        email: "alice@example.org",
        code: "731924",
        password: "a new secure password",
      }),
    );
    const session = await database.db
      .prepare("SELECT revoked_at FROM user_session LIMIT 1")
      .first<{ revoked_at: string | null }>();

    expect(response.status).toBe(204);
    expect(resetCalls).toEqual([{ uid: "firebase_alice", password: "a new secure password" }]);
    expect(session?.revoked_at).toBe("2026-09-19T09:05:00.000Z");
    expect(
      (
        await completeRecovery(
          jsonRequest("/recovery/complete", {
            email: "alice@example.org",
            code: "731924",
            password: "another password",
          }),
        )
      ).status,
    ).toBe(409);
  });

  function recoveryRequestHandler() {
    return createPasswordRecoveryRequestHandler({
      db: database.db,
      email: {
        async send(message) {
          sentEmails.push(message);
          return { messageId: "email_1" };
        },
      },
      humanVerification: { verify: async () => ({ valid: true }) },
      pepper: "test-pepper",
      now: () => new Date("2026-09-19T09:00:00.000Z"),
      createChallengeId: () => "recovery_1",
      createCode: () => "731924",
    });
  }
});

function jsonRequest(path: string, body: object): Request {
  return new Request(`https://alumni.test/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
