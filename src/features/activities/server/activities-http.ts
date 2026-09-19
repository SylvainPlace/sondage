import type { D1Database } from "@cloudflare/workers-types";

import { SessionRepository } from "@/features/accounts/server/session-repository";
import { authenticateSession } from "@/features/accounts/server/session-service";
import { hashOpaqueToken } from "@/lib/security/opaque-token";

interface ActivitiesDependencies {
  db: D1Database;
  sessionPepper: string;
  now?: () => Date;
  createActivityId?: () => string;
  createSnapshotId?: () => string;
}

interface CreateActivityInput {
  employmentRelation: string;
  domainCategoryId: string;
  occupationCategoryId: string;
  jobTitle: string;
  sectorCategoryId: string;
  employmentCountryCode: string;
  startedOn?: string | null;
  observedOn?: string;
  fixedCompensationEuros: number;
  variableCompensationKnown: boolean;
  variableCompensationEuros?: number | null;
}

interface ActivityRow {
  activity_id: string;
  is_primary: number;
  started_on: string | null;
  employment_relation: string;
  domain_id: string;
  domain_label: string;
  occupation_id: string;
  occupation_label: string;
  job_title: string;
  sector_id: string;
  sector_label: string;
  employment_country_code: string;
  snapshot_id: string;
  observed_on: string;
  fixed_compensation_eur_minor: number;
  variable_compensation_eur_minor: number | null;
  work_ratio_basis_points: number;
  weekly_minutes: number;
  compensation_currency: string;
}

interface TaxonomyOptionRow {
  id: string;
  parent_id: string | null;
  label: string;
}

const EMPLOYMENT_RELATIONS = new Set([
  "permanent",
  "fixed_term",
  "civil_servant",
  "public_contract",
  "independent",
  "apprenticeship",
  "internship",
  "volunteer",
  "other",
]);

export function createActivitiesHandler(dependencies: ActivitiesDependencies) {
  const now = dependencies.now ?? (() => new Date());
  const createActivityId =
    dependencies.createActivityId ?? (() => `activity_${crypto.randomUUID()}`);
  const createSnapshotId =
    dependencies.createSnapshotId ?? (() => `snapshot_${crypto.randomUUID()}`);

  return async function handleActivities(request: Request): Promise<Response> {
    const cookies = parseCookies(request.headers.get("cookie"));
    const token = cookies.get("__Host-alumni_session");
    if (!token) return unauthorized();
    const session = await authenticateSession(
      new SessionRepository(dependencies.db),
      token,
      dependencies.sessionPepper,
      now(),
    );
    if (!session) return unauthorized();

    const activityId = activityIdFromUrl(request.url);
    if (request.method === "GET" && !activityId) {
      const [activities, options] = await Promise.all([
        loadActivities(dependencies.db, session.accountId),
        loadActivityOptions(dependencies.db),
      ]);
      return Response.json({ activities, options });
    }
    if (!["POST", "PUT", "DELETE"].includes(request.method)) {
      return new Response(null, { status: 405 });
    }

    if (
      !(await hasValidCsrf(request, cookies, session.csrfTokenHash, dependencies.sessionPepper))
    ) {
      return Response.json({ error: { code: "csrf_failed" } }, { status: 403 });
    }

    if (request.method === "DELETE") {
      if (!activityId) return new Response(null, { status: 405 });
      const result = await dependencies.db
        .prepare("DELETE FROM professional_activity WHERE id = ? AND account_id = ?")
        .bind(activityId, session.accountId)
        .run();
      return result.meta.changes === 0
        ? Response.json({ error: { code: "not_found" } }, { status: 404 })
        : new Response(null, { status: 204 });
    }

    const body = await request.json();
    if (!isJsonObject(body)) return invalidActivity({ form: "Le formulaire est invalide." });
    if (Object.hasOwn(body, "accountId")) {
      return Response.json({ error: { code: "account_scope_forbidden" } }, { status: 400 });
    }
    const fields = await validateActivityInput(dependencies.db, body);
    if (Object.keys(fields).length > 0) return invalidActivity(fields);
    const input = body as unknown as CreateActivityInput;
    const recordedAt = now();
    if (request.method === "PUT") {
      if (!activityId) return new Response(null, { status: 405 });
      const ownedActivity = await dependencies.db
        .prepare("SELECT id FROM professional_activity WHERE id = ? AND account_id = ?")
        .bind(activityId, session.accountId)
        .first<{ id: string }>();
      if (!ownedActivity) {
        return Response.json({ error: { code: "not_found" } }, { status: 404 });
      }
      const fixedMinor = input.fixedCompensationEuros * 100;
      const variableMinor = input.variableCompensationKnown
        ? (input.variableCompensationEuros ?? 0) * 100
        : null;
      const totalMinor = variableMinor === null ? null : fixedMinor + variableMinor;
      await dependencies.db.batch([
        dependencies.db
          .prepare(
            `UPDATE professional_activity
             SET occupation_category_id = ?, started_on = ?, updated_at = ?
             WHERE id = ? AND account_id = ?`,
          )
          .bind(
            input.occupationCategoryId,
            input.startedOn ?? null,
            recordedAt.toISOString(),
            activityId,
            session.accountId,
          ),
        dependencies.db
          .prepare(
            `UPDATE situation_snapshot
             SET observed_on = COALESCE(?, observed_on), job_title = ?, employment_relation = ?,
                 sector_category_id = ?, employment_country_code = ?,
                 fixed_compensation_minor = ?, variable_compensation_minor = ?,
                 fixed_compensation_eur_minor = ?, variable_compensation_eur_minor = ?,
                 total_compensation_fte_eur_minor = ?, updated_at = ?
             WHERE id = (
               SELECT snapshot.id FROM situation_snapshot AS snapshot
               WHERE snapshot.activity_id = ?
               ORDER BY snapshot.observed_on DESC, snapshot.recorded_at DESC LIMIT 1
             )`,
          )
          .bind(
            input.observedOn ?? null,
            input.jobTitle,
            input.employmentRelation,
            input.sectorCategoryId,
            input.employmentCountryCode,
            fixedMinor,
            variableMinor,
            fixedMinor,
            variableMinor,
            totalMinor,
            recordedAt.toISOString(),
            activityId,
          ),
      ]);
      const updated = (await loadActivities(dependencies.db, session.accountId)).find(
        (activity) => activity.id === activityId,
      );
      return Response.json({ activity: updated });
    }

    const newActivityId = createActivityId();
    const snapshotId = createSnapshotId();
    const fixedMinor = input.fixedCompensationEuros * 100;
    const variableMinor = input.variableCompensationKnown
      ? (input.variableCompensationEuros ?? 0) * 100
      : null;
    const totalMinor = variableMinor === null ? null : fixedMinor + variableMinor;

    await dependencies.db.batch([
      dependencies.db
        .prepare(
          `INSERT INTO professional_activity (
             id, account_id, occupation_category_id, started_on, is_primary, created_at, updated_at
           ) VALUES (?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          newActivityId,
          session.accountId,
          input.occupationCategoryId,
          input.startedOn ?? null,
          recordedAt.toISOString(),
          recordedAt.toISOString(),
        ),
      dependencies.db
        .prepare(
          `INSERT INTO situation_snapshot (
             id, activity_id, observed_on, recorded_at, job_title, employment_relation,
             sector_category_id, employment_country_code,
             fixed_compensation_minor, variable_compensation_minor, compensation_currency,
             fixed_compensation_eur_minor, variable_compensation_eur_minor,
             total_compensation_fte_eur_minor, work_ratio_basis_points, weekly_minutes,
             source, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EUR', ?, ?, ?, 10000, 2100, 'alumni', ?)`,
        )
        .bind(
          snapshotId,
          newActivityId,
          input.observedOn ?? isoDate(recordedAt),
          recordedAt.toISOString(),
          input.jobTitle,
          input.employmentRelation,
          input.sectorCategoryId,
          input.employmentCountryCode,
          fixedMinor,
          variableMinor,
          fixedMinor,
          variableMinor,
          totalMinor,
          recordedAt.toISOString(),
        ),
    ]);

    const activities = await loadActivities(dependencies.db, session.accountId);
    return Response.json({ activity: activities[0] }, { status: 201 });
  };
}

async function loadActivityOptions(db: D1Database) {
  const [domainsResult, occupationsResult, sectorsResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, parent_id, label FROM taxonomy_category
         WHERE kind = 'domain' AND active = 1 ORDER BY sort_order, label`,
      )
      .all<TaxonomyOptionRow>(),
    db
      .prepare(
        `SELECT id, parent_id, label FROM taxonomy_category
         WHERE kind = 'occupation' AND active = 1 ORDER BY sort_order, label`,
      )
      .all<TaxonomyOptionRow>(),
    db
      .prepare(
        `SELECT id, parent_id, label FROM taxonomy_category
         WHERE kind = 'sector' AND active = 1 ORDER BY sort_order, label`,
      )
      .all<TaxonomyOptionRow>(),
  ]);

  return {
    domains: domainsResult.results.map((domain) => ({
      id: domain.id,
      label: domain.label,
      occupations: occupationsResult.results
        .filter((occupation) => occupation.parent_id === domain.id)
        .map(({ id, label }) => ({ id, label })),
    })),
    sectors: sectorsResult.results.map(({ id, label }) => ({ id, label })),
  };
}

function activityIdFromUrl(url: string): string | null {
  const match = new URL(url).pathname.match(/^\/api\/activities\/([^/]+)$/);
  const encodedId = match?.[1];
  return encodedId ? decodeURIComponent(encodedId) : null;
}

async function validateActivityInput(
  db: D1Database,
  input: Record<string, unknown>,
): Promise<Record<string, string>> {
  const fields: Record<string, string> = {};
  if (!EMPLOYMENT_RELATIONS.has(String(input.employmentRelation))) {
    fields.employmentRelation = "Choisissez une relation d’emploi valide.";
  }
  if (typeof input.jobTitle !== "string" || input.jobTitle.trim().length === 0) {
    fields.jobTitle = "Indiquez votre intitulé de poste.";
  }
  if (!isCountryCode(input.employmentCountryCode)) {
    fields.employmentCountryCode = "Indiquez un code pays à deux lettres.";
  }
  if (input.startedOn != null && !isIsoDate(input.startedOn)) {
    fields.startedOn = "Indiquez une date valide.";
  }
  if (input.observedOn != null && !isIsoDate(input.observedOn)) {
    fields.observedOn = "Indiquez une date d’observation valide.";
  }
  if (!isEuroAmount(input.fixedCompensationEuros)) {
    fields.fixedCompensationEuros = "Indiquez un salaire fixe positif en euros.";
  }
  if (typeof input.variableCompensationKnown !== "boolean") {
    fields.variableCompensationKnown = "Précisez si la part variable est connue.";
  } else if (input.variableCompensationKnown && !isEuroAmount(input.variableCompensationEuros)) {
    fields.variableCompensationEuros = "Indiquez une part variable positive en euros.";
  }

  const occupation =
    typeof input.occupationCategoryId === "string"
      ? await db
          .prepare(
            `SELECT parent_id FROM taxonomy_category
             WHERE id = ? AND kind = 'occupation' AND active = 1`,
          )
          .bind(input.occupationCategoryId)
          .first<{ parent_id: string }>()
      : null;
  if (!occupation || occupation.parent_id !== input.domainCategoryId) {
    fields.occupationCategoryId = "Choisissez un métier du domaine sélectionné.";
  }

  const sector =
    typeof input.sectorCategoryId === "string"
      ? await db
          .prepare(
            `SELECT id FROM taxonomy_category
             WHERE id = ? AND kind = 'sector' AND active = 1`,
          )
          .bind(input.sectorCategoryId)
          .first<{ id: string }>()
      : null;
  if (!sector) fields.sectorCategoryId = "Choisissez un secteur valide.";

  return fields;
}

async function loadActivities(db: D1Database, accountId: string) {
  const result = await db
    .prepare(
      `SELECT activity.id AS activity_id, activity.is_primary, activity.started_on,
              snapshot.employment_relation,
              domain.id AS domain_id, domain.label AS domain_label,
              occupation.id AS occupation_id, occupation.label AS occupation_label,
              snapshot.job_title,
              sector.id AS sector_id, sector.label AS sector_label,
              snapshot.employment_country_code,
              snapshot.id AS snapshot_id, snapshot.observed_on,
              snapshot.fixed_compensation_eur_minor,
              snapshot.variable_compensation_eur_minor,
              snapshot.work_ratio_basis_points, snapshot.weekly_minutes,
              snapshot.compensation_currency
       FROM professional_activity AS activity
       INNER JOIN taxonomy_category AS occupation
         ON occupation.id = activity.occupation_category_id
       INNER JOIN taxonomy_category AS domain ON domain.id = occupation.parent_id
       INNER JOIN situation_snapshot AS snapshot ON snapshot.id = (
         SELECT candidate.id FROM situation_snapshot AS candidate
         WHERE candidate.activity_id = activity.id
         ORDER BY candidate.observed_on DESC, candidate.recorded_at DESC LIMIT 1
       )
       INNER JOIN taxonomy_category AS sector ON sector.id = snapshot.sector_category_id
       WHERE activity.account_id = ?
       ORDER BY activity.is_primary DESC, activity.created_at ASC`,
    )
    .bind(accountId)
    .all<ActivityRow>();

  return result.results.map((row) => ({
    id: row.activity_id,
    isPrimary: row.is_primary === 1,
    startedOn: row.started_on,
    employmentRelation: row.employment_relation,
    domain: { id: row.domain_id, label: row.domain_label },
    occupation: { id: row.occupation_id, label: row.occupation_label },
    jobTitle: row.job_title,
    sector: { id: row.sector_id, label: row.sector_label },
    employmentCountryCode: row.employment_country_code,
    currentSnapshot: {
      id: row.snapshot_id,
      observedOn: row.observed_on,
      fixedCompensationEuros: row.fixed_compensation_eur_minor / 100,
      variableCompensationKnown: row.variable_compensation_eur_minor !== null,
      variableCompensationEuros:
        row.variable_compensation_eur_minor === null
          ? null
          : row.variable_compensation_eur_minor / 100,
      workRatioPercent: row.work_ratio_basis_points / 100,
      weeklyHours: row.weekly_minutes / 60,
      currency: row.compensation_currency,
    },
  }));
}

async function hasValidCsrf(
  request: Request,
  cookies: Map<string, string>,
  expectedHash: string | null,
  pepper: string,
): Promise<boolean> {
  const csrfToken = cookies.get("__Host-alumni_csrf");
  return Boolean(
    request.headers.get("origin") === new URL(request.url).origin &&
    csrfToken &&
    csrfToken === request.headers.get("x-csrf-token") &&
    expectedHash &&
    (await hashOpaqueToken(csrfToken, pepper)) === expectedHash,
  );
}

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator >= 0)
      cookies.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  return cookies;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && isoDate(new Date(timestamp)) === value;
}

function isEuroAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Number.isInteger(value * 100)
  );
}

function invalidActivity(fields: Record<string, string>): Response {
  return Response.json({ error: { code: "invalid_activity", fields } }, { status: 422 });
}

function unauthorized(): Response {
  return Response.json({ error: { code: "unauthorized" } }, { status: 401 });
}
