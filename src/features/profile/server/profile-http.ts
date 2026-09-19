import type { D1Database } from "@cloudflare/workers-types";

import { SessionRepository } from "@/features/accounts/server/session-repository";
import { authenticateSession } from "@/features/accounts/server/session-service";
import { hashOpaqueToken } from "@/lib/security/opaque-token";

interface ProfileDependencies {
  db: D1Database;
  sessionPepper: string;
  now?: () => Date;
}

interface ProfileRow {
  graduation_year: number | null;
  specialty: string | null;
  additional_degrees: string | null;
  available_for_recruiting: number;
  available_for_mentoring: number;
  reminders_enabled: number;
}

interface DirectoryConsentRow {
  directory_enabled: number;
  show_name: number;
  show_job_title: number;
  show_employer: number;
  show_city: number;
  show_contact_availability: number;
}

interface ProfileInput {
  accountId?: unknown;
  graduationYear?: unknown;
  specialty?: unknown;
  additionalDegrees?: unknown;
  availableForRecruiting?: unknown;
  availableForMentoring?: unknown;
  remindersEnabled?: unknown;
}

export function createProfileHandler(dependencies: ProfileDependencies) {
  const now = dependencies.now ?? (() => new Date());

  return async function handleProfile(request: Request): Promise<Response> {
    const sessionToken = parseCookies(request.headers.get("cookie")).get("__Host-alumni_session");
    if (!sessionToken) return unauthorized();
    const session = await authenticateSession(
      new SessionRepository(dependencies.db),
      sessionToken,
      dependencies.sessionPepper,
      now(),
    );
    if (!session) return unauthorized();

    if (request.method === "PUT") {
      const csrfToken = parseCookies(request.headers.get("cookie")).get("__Host-alumni_csrf");
      const validCsrf =
        request.headers.get("origin") === new URL(request.url).origin &&
        csrfToken &&
        csrfToken === request.headers.get("x-csrf-token") &&
        session.csrfTokenHash &&
        (await hashOpaqueToken(csrfToken, dependencies.sessionPepper)) === session.csrfTokenHash;
      if (!validCsrf) {
        return Response.json({ error: { code: "csrf_failed" } }, { status: 403 });
      }

      const input = (await request.json()) as ProfileInput;
      if (input.accountId !== undefined) {
        return Response.json(
          {
            error: {
              code: "account_scope_forbidden",
              message: "Le profil est déterminé par la session",
            },
          },
          { status: 400 },
        );
      }
      const fields: Record<string, string> = {};
      if (
        !Number.isInteger(input.graduationYear) ||
        (input.graduationYear as number) < 1950 ||
        (input.graduationYear as number) > 2200
      ) {
        fields.graduationYear = "Choisissez une année comprise entre 1950 et 2200";
      }
      if (
        input.specialty !== undefined &&
        input.specialty !== null &&
        typeof input.specialty !== "string"
      ) {
        fields.specialty = "La spécialité doit être un texte";
      }
      if (
        input.additionalDegrees !== undefined &&
        (!Array.isArray(input.additionalDegrees) ||
          !input.additionalDegrees.every((degree) => typeof degree === "string"))
      ) {
        fields.additionalDegrees = "Les diplômes complémentaires doivent être des textes";
      }
      for (const preference of [
        "availableForRecruiting",
        "availableForMentoring",
        "remindersEnabled",
      ] as const) {
        if (input[preference] !== undefined && typeof input[preference] !== "boolean") {
          fields[preference] = "Cette préférence doit être activée ou désactivée";
        }
      }
      if (Object.keys(fields).length > 0) {
        return Response.json(
          {
            error: {
              code: "invalid_profile",
              message: "Certains champs sont invalides",
              fields,
            },
          },
          { status: 422 },
        );
      }

      const normalizedInput = {
        graduationYear: input.graduationYear as number,
        specialty: typeof input.specialty === "string" ? input.specialty.trim() || null : null,
        additionalDegrees: Array.isArray(input.additionalDegrees)
          ? (input.additionalDegrees as string[]).map((degree) => degree.trim()).filter(Boolean)
          : [],
        availableForRecruiting:
          typeof input.availableForRecruiting === "boolean" ? input.availableForRecruiting : false,
        availableForMentoring:
          typeof input.availableForMentoring === "boolean" ? input.availableForMentoring : false,
        remindersEnabled:
          typeof input.remindersEnabled === "boolean" ? input.remindersEnabled : true,
      };
      const updatedAt = now().toISOString();
      await dependencies.db
        .prepare(
          `INSERT INTO alumni_profile (
            account_id, graduation_year, specialty, additional_degrees,
            available_for_recruiting, available_for_mentoring, reminders_enabled,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(account_id) DO UPDATE SET
            graduation_year = excluded.graduation_year,
            specialty = excluded.specialty,
            additional_degrees = excluded.additional_degrees,
            available_for_recruiting = excluded.available_for_recruiting,
            available_for_mentoring = excluded.available_for_mentoring,
            reminders_enabled = excluded.reminders_enabled,
            updated_at = excluded.updated_at`,
        )
        .bind(
          session.accountId,
          normalizedInput.graduationYear,
          normalizedInput.specialty,
          JSON.stringify(normalizedInput.additionalDegrees),
          normalizedInput.availableForRecruiting ? 1 : 0,
          normalizedInput.availableForMentoring ? 1 : 0,
          normalizedInput.remindersEnabled ? 1 : 0,
          updatedAt,
          updatedAt,
        )
        .run();
    } else if (request.method !== "GET") {
      return new Response(null, { status: 405 });
    }

    const [profile, directoryConsent] = await Promise.all([
      dependencies.db
        .prepare(
          `SELECT graduation_year, specialty, additional_degrees,
                  available_for_recruiting, available_for_mentoring, reminders_enabled
           FROM alumni_profile WHERE account_id = ?`,
        )
        .bind(session.accountId)
        .first<ProfileRow>(),
      dependencies.db
        .prepare(
          `SELECT directory_enabled, show_name, show_job_title, show_employer,
                  show_city, show_contact_availability
           FROM directory_consent WHERE account_id = ?`,
        )
        .bind(session.accountId)
        .first<DirectoryConsentRow>(),
    ]);

    return Response.json({
      profile: {
        graduationYear: profile?.graduation_year ?? null,
        specialty: profile?.specialty ?? null,
        additionalDegrees: parseAdditionalDegrees(profile?.additional_degrees),
        availableForRecruiting: profile?.available_for_recruiting === 1,
        availableForMentoring: profile?.available_for_mentoring === 1,
        remindersEnabled: profile?.reminders_enabled !== 0,
      },
      directoryConsent: {
        directoryEnabled: directoryConsent?.directory_enabled === 1,
        showName: directoryConsent?.show_name === 1,
        showJobTitle: directoryConsent?.show_job_title === 1,
        showEmployer: directoryConsent?.show_employer === 1,
        showCity: directoryConsent?.show_city === 1,
        showContactAvailability: directoryConsent?.show_contact_availability === 1,
      },
    });
  };
}

function parseAdditionalDegrees(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
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

function unauthorized(): Response {
  return Response.json(
    { error: { code: "unauthorized", message: "Session invalide ou expirée" } },
    { status: 401 },
  );
}
