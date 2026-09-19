import type { D1Database } from "@cloudflare/workers-types";

import { SessionRepository } from "@/features/accounts/server/session-repository";
import { authenticateSession } from "@/features/accounts/server/session-service";
import { hashOpaqueToken } from "@/lib/security/opaque-token";

interface SessionsDependencies {
  db: D1Database;
  sessionPepper: string;
  now?: () => Date;
}

interface RevokeBody {
  sessionId?: unknown;
}

export function createSessionsHandler(dependencies: SessionsDependencies) {
  const now = dependencies.now ?? (() => new Date());
  const sessions = new SessionRepository(dependencies.db);

  return async function handleSessions(request: Request): Promise<Response> {
    const cookies = parseCookies(request.headers.get("cookie"));
    const sessionToken = cookies.get("__Host-alumni_session");
    if (!sessionToken) return unauthorized();

    const authenticated = await authenticateSession(
      sessions,
      sessionToken,
      dependencies.sessionPepper,
      now(),
    );
    if (!authenticated) return unauthorized();

    if (request.method === "GET") {
      const activeSessions = await sessions.listActiveForAccount(
        authenticated.accountId,
        now().toISOString(),
      );
      const response = Response.json({
        sessions: activeSessions.map((session) => ({
          ...session,
          current: session.id === authenticated.sessionId,
        })),
      });
      if (authenticated.touched) {
        response.headers.set(
          "set-cookie",
          `__Host-alumni_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(authenticated.expiresAt).toUTCString()}`,
        );
      }
      return response;
    }

    if (request.method !== "DELETE") {
      return Response.json({ error: { code: "method_not_allowed" } }, { status: 405 });
    }

    const validCsrf = await hasValidCsrfProof(
      request,
      cookies,
      authenticated.csrfTokenHash,
      dependencies.sessionPepper,
    );
    if (!validCsrf) {
      return Response.json(
        { error: { code: "csrf_failed", message: "Preuve de sécurité invalide" } },
        { status: 403 },
      );
    }

    const body = (await request.json()) as RevokeBody;
    if (typeof body.sessionId !== "string") {
      return Response.json({ error: { code: "invalid_request" } }, { status: 400 });
    }

    const revokedAt = now().toISOString();
    if (body.sessionId === "all") {
      await sessions.revokeAllForAccount(authenticated.accountId, revokedAt, "user_logout_all");
    } else if (body.sessionId === "current") {
      await sessions.revoke(authenticated.sessionId, revokedAt, "user_logout");
    } else {
      await sessions.revokeForAccount(
        body.sessionId,
        authenticated.accountId,
        revokedAt,
        "user_revoked_device",
      );
    }

    return new Response(null, { status: 204 });
  };
}

async function hasValidCsrfProof(
  request: Request,
  cookies: Map<string, string>,
  expectedHash: string | null,
  pepper: string,
): Promise<boolean> {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin || !expectedHash) return false;

  const cookieToken = cookies.get("__Host-alumni_csrf");
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || cookieToken !== headerToken) return false;
  return (await hashOpaqueToken(cookieToken, pepper)) === expectedHash;
}

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
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
