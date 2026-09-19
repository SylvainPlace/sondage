// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccountRepository } from "@/features/accounts/server/account-repository";
import { SessionRepository } from "@/features/accounts/server/session-repository";
import { issueSession, type IssuedSession } from "@/features/accounts/server/session-service";
import { createWhitelistHttpHandler } from "@/features/accounts/server/whitelist-http";
import { createD1TestDatabase, type D1TestDatabase } from "@/test/d1";

import { createActivitiesHandler } from "./activities-http";

describe("/api/activities", () => {
  let database: D1TestDatabase;
  let session: IssuedSession;

  beforeEach(async () => {
    database = await createD1TestDatabase();
    const importWhitelist = createWhitelistHttpHandler({
      db: database.db,
      createId: () => "account_alice",
    });
    await importWhitelist(
      jsonRequest("https://alumni.test/api/admin/accounts/import", "POST", {
        emails: ["alice@example.org"],
      }),
    );
    await new AccountRepository(database.db).activate(
      "account_alice",
      "firebase_alice",
      "2026-09-19T08:00:00.000Z",
    );
    session = await issueSession(new SessionRepository(database.db), {
      accountId: "account_alice",
      pepper: "session-pepper",
      now: new Date("2026-09-19T09:00:00.000Z"),
    });
  });

  afterEach(async () => database.dispose());

  it("creates a first professional activity and immediately returns its current snapshot", async () => {
    const activities = createActivitiesHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
      createActivityId: () => "activity_alice_1",
      createSnapshotId: () => "snapshot_alice_1",
    });
    const input = {
      employmentRelation: "permanent",
      domainCategoryId: "domain_software",
      occupationCategoryId: "occupation_backend",
      jobTitle: "Développeuse backend",
      sectorCategoryId: "sector_technology",
      employmentCountryCode: "FR",
      startedOn: "2024-03-01",
      observedOn: "2026-09-15",
      fixedCompensationEuros: 52_000,
      variableCompensationKnown: true,
      variableCompensationEuros: 4_000,
    };

    const createResponse = await activities(authenticatedRequest("POST", session, input));
    const listResponse = await activities(authenticatedRequest("GET", session));
    const created = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(created).toEqual({
      activity: {
        id: "activity_alice_1",
        isPrimary: true,
        startedOn: "2024-03-01",
        employmentRelation: "permanent",
        domain: { id: "domain_software", label: "Ingénierie logicielle" },
        occupation: { id: "occupation_backend", label: "Développeur backend" },
        jobTitle: "Développeuse backend",
        sector: { id: "sector_technology", label: "Technologies et numérique" },
        employmentCountryCode: "FR",
        currentSnapshot: {
          id: "snapshot_alice_1",
          observedOn: "2026-09-15",
          fixedCompensationEuros: 52_000,
          variableCompensationKnown: true,
          variableCompensationEuros: 4_000,
          workRatioPercent: 100,
          weeklyHours: 35,
          currency: "EUR",
        },
      },
    });
    await expect(listResponse.json()).resolves.toMatchObject({
      activities: [created.activity],
      options: {
        domains: expect.arrayContaining([
          {
            id: "domain_product",
            label: "Produit",
            occupations: expect.arrayContaining([
              { id: "occupation_product_manager", label: "Product Manager" },
            ]),
          },
        ]),
        sectors: expect.arrayContaining([
          { id: "sector_technology", label: "Technologies et numérique" },
        ]),
      },
    });
  });

  it("rejects an occupation outside the selected domain", async () => {
    const activities = createActivitiesHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
    });

    const response = await activities(
      authenticatedRequest("POST", session, {
        employmentRelation: "permanent",
        domainCategoryId: "domain_data_ai",
        occupationCategoryId: "occupation_backend",
        jobTitle: "Développeuse backend",
        sectorCategoryId: "sector_technology",
        employmentCountryCode: "FR",
        fixedCompensationEuros: 52_000,
        variableCompensationKnown: false,
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_activity",
        fields: { occupationCategoryId: "Choisissez un métier du domaine sélectionné." },
      },
    });
  });

  it("never accepts a client-provided account scope", async () => {
    const activities = createActivitiesHandler({
      db: database.db,
      sessionPepper: "session-pepper",
    });

    const response = await activities(
      authenticatedRequest("POST", session, {
        accountId: "account_bob",
        employmentRelation: "permanent",
        domainCategoryId: "domain_software",
        occupationCategoryId: "occupation_backend",
        jobTitle: "Développeuse backend",
        sectorCategoryId: "sector_technology",
        employmentCountryCode: "FR",
        fixedCompensationEuros: 52_000,
        variableCompensationKnown: false,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "account_scope_forbidden" },
    });
  });

  it("rejects unknown controlled values", async () => {
    const activities = createActivitiesHandler({
      db: database.db,
      sessionPepper: "session-pepper",
    });
    const response = await activities(
      authenticatedRequest("POST", session, {
        employmentRelation: "mystery_contract",
        domainCategoryId: "domain_software",
        occupationCategoryId: "occupation_backend",
        jobTitle: "Développeuse backend",
        sectorCategoryId: "sector_unknown",
        employmentCountryCode: "France",
        fixedCompensationEuros: -1,
        variableCompensationKnown: true,
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "invalid_activity",
        fields: {
          employmentRelation: expect.any(String),
          sectorCategoryId: expect.any(String),
          employmentCountryCode: expect.any(String),
          fixedCompensationEuros: expect.any(String),
          variableCompensationEuros: expect.any(String),
        },
      },
    });
  });

  it("lets only the owner correct and delete an activity", async () => {
    const activities = createActivitiesHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T10:00:00.000Z"),
      createActivityId: () => "activity_alice_1",
      createSnapshotId: () => "snapshot_alice_1",
    });
    const initialInput = {
      employmentRelation: "permanent",
      domainCategoryId: "domain_software",
      occupationCategoryId: "occupation_backend",
      jobTitle: "Développeuse backend",
      sectorCategoryId: "sector_technology",
      employmentCountryCode: "FR",
      fixedCompensationEuros: 52_000,
      variableCompensationKnown: false,
    };
    await activities(authenticatedRequest("POST", session, initialInput));

    const importBob = createWhitelistHttpHandler({
      db: database.db,
      createId: () => "account_bob",
    });
    await importBob(
      jsonRequest("https://alumni.test/api/admin/accounts/import", "POST", {
        emails: ["bob@example.org"],
      }),
    );
    await new AccountRepository(database.db).activate(
      "account_bob",
      "firebase_bob",
      "2026-09-19T10:05:00.000Z",
    );
    const bobSession = await issueSession(new SessionRepository(database.db), {
      accountId: "account_bob",
      pepper: "session-pepper",
      now: new Date("2026-09-19T10:10:00.000Z"),
    });

    const bobList = await activities(authenticatedRequest("GET", bobSession));
    await expect(bobList.json()).resolves.toMatchObject({ activities: [] });

    const denied = await activities(
      authenticatedRequest("DELETE", bobSession, undefined, "/api/activities/activity_alice_1"),
    );
    expect(denied.status).toBe(404);

    const corrected = await activities(
      authenticatedRequest(
        "PUT",
        session,
        {
          ...initialInput,
          jobTitle: "Lead backend",
          fixedCompensationEuros: 58_000,
          variableCompensationKnown: true,
          variableCompensationEuros: 5_000,
        },
        "/api/activities/activity_alice_1",
      ),
    );
    expect(corrected.status).toBe(200);
    await expect(corrected.json()).resolves.toMatchObject({
      activity: {
        id: "activity_alice_1",
        jobTitle: "Lead backend",
        currentSnapshot: {
          fixedCompensationEuros: 58_000,
          variableCompensationEuros: 5_000,
        },
      },
    });

    const removed = await activities(
      authenticatedRequest("DELETE", session, undefined, "/api/activities/activity_alice_1"),
    );
    expect(removed.status).toBe(204);
    const listResponse = await activities(authenticatedRequest("GET", session));
    await expect(listResponse.json()).resolves.toMatchObject({ activities: [] });
  });

  it("uses contribution-friendly defaults without forcing irrelevant fields", async () => {
    const activities = createActivitiesHandler({
      db: database.db,
      sessionPepper: "session-pepper",
      now: () => new Date("2026-09-19T23:30:00.000Z"),
      createActivityId: () => "activity_alice_1",
      createSnapshotId: () => "snapshot_alice_1",
    });

    const response = await activities(
      authenticatedRequest("POST", session, {
        employmentRelation: "independent",
        domainCategoryId: "domain_software",
        occupationCategoryId: "occupation_backend",
        jobTitle: "Consultante backend",
        sectorCategoryId: "sector_technology",
        employmentCountryCode: "FR",
        fixedCompensationEuros: 60_000,
        variableCompensationKnown: false,
        variableCompensationEuros: 99_999,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      activity: {
        startedOn: null,
        currentSnapshot: {
          observedOn: "2026-09-19",
          variableCompensationKnown: false,
          variableCompensationEuros: null,
          workRatioPercent: 100,
          weeklyHours: 35,
          currency: "EUR",
        },
      },
    });
  });
});

function authenticatedRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  session: IssuedSession,
  body?: object,
  path = "/api/activities",
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
  return new Request(`https://alumni.test${path}`, init);
}

function jsonRequest(url: string, method: string, body: object): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
