import type { D1Database } from "@cloudflare/workers-types";

import { normalizeEmail } from "@/features/accounts/server/account";
import { AccountRepository } from "@/features/accounts/server/account-repository";
import { SessionRepository } from "@/features/accounts/server/session-repository";
import { issueSession } from "@/features/accounts/server/session-service";
import type { IdentityProvider } from "@/lib/services/external-services";

interface LoginDependencies {
  db: D1Database;
  identity: Pick<IdentityProvider, "authenticateWithPassword">;
  sessionPepper: string;
  now?: () => Date;
}

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export function createLoginHandler(dependencies: LoginDependencies) {
  const now = dependencies.now ?? (() => new Date());

  return async function handleLogin(request: Request): Promise<Response> {
    const body = (await request.json()) as LoginBody;
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return authError("invalid_request", "Requête invalide", 400);
    }

    const emailNormalized = normalizeEmail(body.email);
    let identity;
    try {
      identity = await dependencies.identity.authenticateWithPassword({
        emailNormalized,
        password: body.password,
      });
    } catch {
      return authError("invalid_credentials", "Identifiants invalides", 401);
    }

    const account = await new AccountRepository(dependencies.db).findByEmail(emailNormalized);
    if (
      !account ||
      account.status !== "active" ||
      account.firebaseUid !== identity.uid ||
      identity.emailNormalized !== emailNormalized
    ) {
      return authError("invalid_credentials", "Identifiants invalides", 401);
    }

    const session = await issueSession(new SessionRepository(dependencies.db), {
      accountId: account.id,
      pepper: dependencies.sessionPepper,
      now: now(),
      authenticatedAt: identity.authenticatedAt,
      userAgentSummary: request.headers.get("user-agent"),
    });
    const response = Response.json({
      account: { id: account.id, email: account.emailNormalized, role: account.role },
      expiresAt: session.expiresAt.toISOString(),
    });
    response.headers.set(
      "set-cookie",
      `__Host-alumni_session=${session.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}`,
    );
    response.headers.append(
      "set-cookie",
      `__Host-alumni_csrf=${session.csrfToken}; Path=/; Secure; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}`,
    );
    return response;
  };
}

function authError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}
