// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccountRepository } from "@/features/accounts/server/account-repository";
import { SessionRepository } from "@/features/accounts/server/session-repository";
import { issueSession, type IssuedSession } from "@/features/accounts/server/session-service";
import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createProfileHandler } from "./profile-http";

describe("/api/profile", () => {
  let database: D1TestDatabase;
  let aliceSession: IssuedSession;

  beforeEach(async () => {
    database = await createD1TestDatabase();
    const importWhitelist = createWhitelistHttpHandler({
      db: database.db,
      createId: () => "account_alice",
    });
    await importWhitelist(
      jsonRequest("https://alumni.test/api/admin/accounts/import", {
        emails: ["alice@example.org"],
      }),
    );
    await new AccountRepository(database.db).activate(
      "account_alice",
      "firebase_alice",
      "2026-09-19T08:00:00.000Z",
    );
    aliceSession = await issueSession(new SessionRepository(database.db), {
      accountId: "account_alice",
      pepper: "session-pepper",
      now: new Date("2026-09-19T09:00:00.000Z"),
    });
  });

  afterEach(async () => database.dispose());

  it("returns private defaults for an authenticated alumni without a saved profile", async () => {
    const profile = createProfileHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await profile(authenticatedRequest("GET", aliceSession));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      profile: {
        graduationYear: null,
        specialty: null,
        additionalDegrees: [],
        availableForRecruiting: false,
        availableForMentoring: false,
        remindersEnabled: true,
      },
      directoryConsent: {
        directoryEnabled: false,
        showName: false,
        showJobTitle: false,
        showEmployer: false,
        showCity: false,
        showContactAvailability: false,
      },
    });
  });

  it("saves stable information and contact preferences for the authenticated alumni", async () => {
    const profile = createProfileHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });
    const input = {
      graduationYear: 2018,
      specialty: "Intelligence artificielle",
      additionalDegrees: ["Master économie numérique"],
      availableForRecruiting: true,
      availableForMentoring: false,
      remindersEnabled: false,
    };

    const updateResponse = await profile(authenticatedRequest("PUT", aliceSession, input));
    const readResponse = await profile(authenticatedRequest("GET", aliceSession));

    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({ profile: input });
    await expect(readResponse.json()).resolves.toMatchObject({ profile: input });
  });

  it("accepts a graduation year on its own and keeps optional fields disabled", async () => {
    const profile = createProfileHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await profile(
      authenticatedRequest("PUT", aliceSession, { graduationYear: 2020 }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        graduationYear: 2020,
        specialty: null,
        additionalDegrees: [],
        availableForRecruiting: false,
        availableForMentoring: false,
        remindersEnabled: true,
      },
    });
  });

  it("reports invalid profile fields without saving a partial update", async () => {
    const profile = createProfileHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await profile(
      authenticatedRequest("PUT", aliceSession, {
        graduationYear: 1949,
        specialty: 42,
        additionalDegrees: ["Master droit", 12],
        availableForRecruiting: "yes",
      }),
    );
    const readResponse = await profile(authenticatedRequest("GET", aliceSession));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_profile",
        message: "Certains champs sont invalides",
        fields: {
          graduationYear: "Choisissez une année comprise entre 1950 et 2200",
          specialty: "La spécialité doit être un texte",
          additionalDegrees: "Les diplômes complémentaires doivent être des textes",
          availableForRecruiting: "Cette préférence doit être activée ou désactivée",
        },
      },
    });
    await expect(readResponse.json()).resolves.toMatchObject({
      profile: { graduationYear: null },
    });
  });

  it("rejects attempts to target a profile other than the session owner", async () => {
    const profile = createProfileHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await profile(
      authenticatedRequest("PUT", aliceSession, {
        accountId: "account_bob",
        graduationYear: 2021,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "account_scope_forbidden",
        message: "Le profil est déterminé par la session",
      },
    });
  });
});

function authenticatedRequest(
  method: "GET" | "PUT",
  session: IssuedSession,
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
  return new Request("https://alumni.test/api/profile", init);
}

function jsonRequest(url: string, body: object): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
