import type { D1Database } from "@cloudflare/workers-types";

import { SessionRepository } from "@/features/accounts/server/session-repository";
import { issueSession } from "@/features/accounts/server/session-service";
import type { AccountRole } from "@/features/accounts/server/account";
import { hashOpaqueToken } from "@/lib/security/opaque-token";
import type { IdentityProvider } from "@/lib/services/external-services";

interface ActivationCompleteDependencies {
  db: D1Database;
  identity: Pick<IdentityProvider, "activateWithPassword">;
  activationPepper: string;
  sessionPepper: string;
  now?: () => Date;
}

interface ActivationGrantRow {
  id: string;
  account_id: string;
  email_normalized: string;
  role: AccountRole;
  expires_at: string;
}

interface ActivationCompleteBody {
  activationToken?: unknown;
  password?: unknown;
}

export function createActivationCompleteHandler(dependencies: ActivationCompleteDependencies) {
  const now = dependencies.now ?? (() => new Date());

  return async function handleActivationComplete(request: Request): Promise<Response> {
    const body = (await request.json()) as ActivationCompleteBody;
    if (typeof body.activationToken !== "string" || typeof body.password !== "string") {
      return authError("invalid_request", "Requête invalide", 400);
    }

    const activatedAt = now();
    const activatedAtIso = activatedAt.toISOString();
    const tokenHash = await hashOpaqueToken(body.activationToken, dependencies.activationPepper);
    const grant = await dependencies.db
      .prepare(
        `SELECT grant.id, grant.account_id, grant.expires_at,
                account.email_normalized, account.role
         FROM activation_grant AS grant
         INNER JOIN account ON account.id = grant.account_id
         WHERE grant.token_hash = ?
           AND grant.consumed_at IS NULL
           AND grant.expires_at > ?
           AND account.status = 'eligible'
           AND account.email_normalized IS NOT NULL
         LIMIT 1`,
      )
      .bind(tokenHash, activatedAtIso)
      .first<ActivationGrantRow>();

    if (!grant) {
      return authError("invalid_activation", "Activation invalide ou expirée", 400);
    }

    let identity;
    try {
      identity = await dependencies.identity.activateWithPassword({
        emailNormalized: grant.email_normalized,
        password: body.password,
      });
    } catch {
      return authError(
        "identity_unavailable",
        "Activation temporairement indisponible, veuillez réessayer",
        503,
      );
    }
    if (identity.emailNormalized !== grant.email_normalized) {
      return authError("identity_mismatch", "L’identité ne correspond pas au compte", 409);
    }

    const updates = await dependencies.db.batch([
      dependencies.db
        .prepare(
          `UPDATE account
           SET firebase_uid = ?, status = 'active', activated_at = ?, updated_at = ?
           WHERE id = ? AND status = 'eligible'`,
        )
        .bind(identity.uid, activatedAtIso, activatedAtIso, grant.account_id),
      dependencies.db
        .prepare(
          `UPDATE activation_grant
           SET consumed_at = ?
           WHERE id = ? AND consumed_at IS NULL AND expires_at > ?`,
        )
        .bind(activatedAtIso, grant.id, activatedAtIso),
    ]);
    const accountUpdate = updates[0];
    const grantUpdate = updates[1];

    if (
      !accountUpdate ||
      !grantUpdate ||
      accountUpdate.meta.changes !== 1 ||
      grantUpdate.meta.changes !== 1
    ) {
      return authError("invalid_activation", "Activation invalide ou déjà utilisée", 409);
    }

    const session = await issueSession(new SessionRepository(dependencies.db), {
      accountId: grant.account_id,
      pepper: dependencies.sessionPepper,
      now: activatedAt,
      authenticatedAt: identity.authenticatedAt,
      userAgentSummary: request.headers.get("user-agent"),
    });

    const response = Response.json(
      {
        account: {
          id: grant.account_id,
          email: grant.email_normalized,
          role: grant.role,
        },
        expiresAt: session.expiresAt.toISOString(),
      },
      { status: 201 },
    );
    response.headers.set("set-cookie", sessionCookie(session.token, session.expiresAt));
    response.headers.append(
      "set-cookie",
      `__Host-alumni_csrf=${session.csrfToken}; Path=/; Secure; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}`,
    );
    return response;
  };
}

function sessionCookie(token: string, expiresAt: Date): string {
  return `__Host-alumni_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`;
}

function authError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}
