import type { D1Database } from "@cloudflare/workers-types";

import { normalizeEmail } from "@/features/accounts/server/account";
import { hashOpaqueToken } from "@/lib/security/opaque-token";

interface ActivationVerifyDependencies {
  db: D1Database;
  pepper: string;
  now?: () => Date;
  createGrantId?: () => string;
  createGrantToken?: () => string;
}

interface VerificationChallengeRow {
  id: string;
  account_id: string;
  code_hash: string;
  attempt_count: number;
  max_attempts: number;
  expires_at: string;
  consumed_at: string | null;
  invalidated_at: string | null;
}

interface ActivationVerifyBody {
  email?: unknown;
  code?: unknown;
}

export function createActivationVerifyHandler(dependencies: ActivationVerifyDependencies) {
  const now = dependencies.now ?? (() => new Date());
  const createGrantId = dependencies.createGrantId ?? (() => `grant_${crypto.randomUUID()}`);
  const createGrantToken =
    dependencies.createGrantToken ?? (() => `${crypto.randomUUID()}${crypto.randomUUID()}`);

  return async function handleActivationVerify(request: Request): Promise<Response> {
    const body = (await request.json()) as ActivationVerifyBody;
    if (typeof body.email !== "string" || typeof body.code !== "string") {
      return authError("invalid_request", "Requête invalide", 400);
    }

    const verifiedAt = now();
    const verifiedAtIso = verifiedAt.toISOString();
    const challenge = await dependencies.db
      .prepare(
        `SELECT id, account_id, code_hash, attempt_count, max_attempts,
                expires_at, consumed_at, invalidated_at
         FROM verification_challenge
         WHERE target_email_normalized = ? AND purpose = 'activation'
         ORDER BY requested_at DESC
         LIMIT 1`,
      )
      .bind(normalizeEmail(body.email))
      .first<VerificationChallengeRow>();

    if (!challenge) {
      return authError("invalid_code", "Code invalide", 400);
    }
    if (challenge.consumed_at) {
      return authError("code_consumed", "Ce code a déjà été utilisé", 409);
    }
    if (challenge.invalidated_at || challenge.attempt_count >= challenge.max_attempts) {
      return authError("too_many_attempts", "Ce code n’est plus utilisable", 429);
    }
    if (challenge.expires_at <= verifiedAtIso) {
      return authError("code_expired", "Ce code a expiré", 410);
    }

    const submittedCodeHash = await hashOpaqueToken(body.code, dependencies.pepper);
    if (submittedCodeHash !== challenge.code_hash) {
      const attemptCount = challenge.attempt_count + 1;
      const invalidatedAt = attemptCount >= challenge.max_attempts ? verifiedAtIso : null;
      await dependencies.db
        .prepare(
          `UPDATE verification_challenge
           SET attempt_count = ?, invalidated_at = ?
           WHERE id = ? AND consumed_at IS NULL AND invalidated_at IS NULL`,
        )
        .bind(attemptCount, invalidatedAt, challenge.id)
        .run();
      if (invalidatedAt) {
        return authError("too_many_attempts", "Ce code n’est plus utilisable", 429);
      }
      return authError("invalid_code", "Code invalide", 400);
    }

    const activationToken = createGrantToken();
    const tokenHash = await hashOpaqueToken(activationToken, dependencies.pepper);
    const expiresAt = new Date(verifiedAt.getTime() + 10 * 60 * 1000);

    await dependencies.db.batch([
      dependencies.db
        .prepare(
          `UPDATE verification_challenge
           SET consumed_at = ?
           WHERE id = ? AND consumed_at IS NULL AND invalidated_at IS NULL
             AND expires_at > ? AND attempt_count < max_attempts`,
        )
        .bind(verifiedAtIso, challenge.id, verifiedAtIso),
      dependencies.db
        .prepare(
          `INSERT INTO activation_grant (
            id, challenge_id, account_id, token_hash, created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          createGrantId(),
          challenge.id,
          challenge.account_id,
          tokenHash,
          verifiedAtIso,
          expiresAt.toISOString(),
        ),
    ]);

    return Response.json({ activationToken, expiresAt: expiresAt.toISOString() });
  };
}

function authError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}
