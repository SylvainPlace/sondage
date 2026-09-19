import type { D1Database } from "@cloudflare/workers-types";

import { SessionRepository } from "@/features/accounts/server/session-repository";
import { authenticateSession } from "@/features/accounts/server/session-service";
import { hashOpaqueToken } from "@/lib/security/opaque-token";
import type { IdentityProvider } from "@/lib/services/external-services";

const RECENT_AUTHENTICATION_MS = 10 * 60 * 1000;

interface ReauthenticationDependencies {
  db: D1Database;
  identity: Pick<IdentityProvider, "authenticateWithPassword">;
  sessionPepper: string;
  now?: () => Date;
}

export function createReauthenticationHandler(dependencies: ReauthenticationDependencies) {
  const now = dependencies.now ?? (() => new Date());
  const repository = new SessionRepository(dependencies.db);

  return async function handleReauthentication(request: Request): Promise<Response> {
    const cookies = parseCookies(request.headers.get("cookie"));
    const token = cookies.get("__Host-alumni_session");
    if (!token) return unauthorized();
    const session = await authenticateSession(repository, token, dependencies.sessionPepper, now());
    if (!session) return unauthorized();

    if (request.method === "GET") {
      return isRecentAuthentication(session.authenticatedAt, now())
        ? new Response(null, { status: 204 })
        : Response.json(
            {
              error: {
                code: "reauthentication_required",
                message: "Veuillez confirmer votre mot de passe",
              },
            },
            { status: 428 },
          );
    }
    if (request.method !== "POST") return new Response(null, { status: 405 });

    const csrfToken = cookies.get("__Host-alumni_csrf");
    const sameOrigin = request.headers.get("origin") === new URL(request.url).origin;
    const validCsrf =
      sameOrigin &&
      csrfToken &&
      csrfToken === request.headers.get("x-csrf-token") &&
      session.csrfTokenHash &&
      (await hashOpaqueToken(csrfToken, dependencies.sessionPepper)) === session.csrfTokenHash;
    if (!validCsrf) {
      return Response.json({ error: { code: "csrf_failed" } }, { status: 403 });
    }

    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string") {
      return Response.json({ error: { code: "invalid_request" } }, { status: 400 });
    }

    try {
      const identity = await dependencies.identity.authenticateWithPassword({
        emailNormalized: session.emailNormalized,
        password: body.password,
      });
      if (identity.uid !== session.firebaseUid) throw new Error("identity mismatch");
    } catch {
      return Response.json(
        { error: { code: "invalid_credentials", message: "Identifiants invalides" } },
        { status: 401 },
      );
    }

    await repository.markReauthenticated(session.sessionId, now().toISOString());
    return new Response(null, { status: 204 });
  };
}

export function isRecentAuthentication(authenticatedAt: string, now: Date): boolean {
  const age = now.getTime() - new Date(authenticatedAt).getTime();
  return age >= 0 && age <= RECENT_AUTHENTICATION_MS;
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
  return Response.json({ error: { code: "unauthorized" } }, { status: 401 });
}
