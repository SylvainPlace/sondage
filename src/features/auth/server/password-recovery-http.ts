import type { D1Database } from "@cloudflare/workers-types";

import { normalizeEmail } from "@/features/accounts/server/account";
import { AccountRepository } from "@/features/accounts/server/account-repository";
import { hashOpaqueToken } from "@/lib/security/opaque-token";
import type {
  EmailProvider,
  HumanVerificationProvider,
  IdentityProvider,
} from "@/lib/services/external-services";

interface RecoveryRequestDependencies {
  db: D1Database;
  email: EmailProvider;
  humanVerification: HumanVerificationProvider;
  pepper: string;
  now?: () => Date;
  createChallengeId?: () => string;
  createCode?: () => string;
}

interface RecoveryCompleteDependencies {
  db: D1Database;
  identity: Pick<IdentityProvider, "resetPassword">;
  pepper: string;
  now?: () => Date;
}

interface ChallengeRow {
  id: string;
  account_id: string;
  firebase_uid: string;
  code_hash: string;
  attempt_count: number;
  max_attempts: number;
  expires_at: string;
  consumed_at: string | null;
  invalidated_at: string | null;
}

const NEUTRAL_RESPONSE = {
  ok: true,
  message: "Si cette adresse correspond à un compte actif, un code vient d’être envoyé.",
} as const;

export function createPasswordRecoveryRequestHandler(dependencies: RecoveryRequestDependencies) {
  const now = dependencies.now ?? (() => new Date());
  const createChallengeId =
    dependencies.createChallengeId ?? (() => `recovery_${crypto.randomUUID()}`);
  const createCode = dependencies.createCode ?? createSixDigitCode;

  return async function requestPasswordRecovery(request: Request): Promise<Response> {
    const body = (await request.json()) as { email?: unknown; turnstileToken?: unknown };
    if (typeof body.email !== "string" || typeof body.turnstileToken !== "string") {
      return error("invalid_request", "Requête invalide", 400);
    }

    try {
      const verification = await dependencies.humanVerification.verify({
        token: body.turnstileToken,
        remoteIp: request.headers.get("cf-connecting-ip") ?? undefined,
        idempotencyKey: crypto.randomUUID(),
      });
      if (!verification.valid)
        return error("human_verification_failed", "Vérification impossible", 403);
    } catch {
      return error(
        "human_verification_unavailable",
        "Vérification temporairement indisponible",
        503,
      );
    }

    const emailNormalized = normalizeEmail(body.email);
    const account = await new AccountRepository(dependencies.db).findByEmail(emailNormalized);
    if (!account || account.status !== "active" || !account.firebaseUid) {
      return Response.json(NEUTRAL_RESPONSE, { status: 202 });
    }

    const requestedAt = now();
    const challengeId = createChallengeId();
    const code = createCode();
    await dependencies.db
      .prepare(
        `INSERT INTO verification_challenge (
          id, account_id, target_email_normalized, purpose, code_hash, requested_at, expires_at
        ) VALUES (?, ?, ?, 'password_reset', ?, ?, ?)`,
      )
      .bind(
        challengeId,
        account.id,
        emailNormalized,
        await hashOpaqueToken(code, dependencies.pepper),
        requestedAt.toISOString(),
        new Date(requestedAt.getTime() + 10 * 60 * 1000).toISOString(),
      )
      .run();

    try {
      await dependencies.email.send({
        to: emailNormalized,
        template: "password-reset-code",
        variables: { code, expiresInMinutes: "10" },
        idempotencyKey: `password-reset:${challengeId}`,
      });
    } catch {
      await dependencies.db
        .prepare("UPDATE verification_challenge SET invalidated_at = ? WHERE id = ?")
        .bind(now().toISOString(), challengeId)
        .run();
    }

    return Response.json(NEUTRAL_RESPONSE, { status: 202 });
  };
}

export function createPasswordRecoveryCompleteHandler(dependencies: RecoveryCompleteDependencies) {
  const now = dependencies.now ?? (() => new Date());

  return async function completePasswordRecovery(request: Request): Promise<Response> {
    const body = (await request.json()) as { email?: unknown; code?: unknown; password?: unknown };
    if (
      typeof body.email !== "string" ||
      typeof body.code !== "string" ||
      typeof body.password !== "string"
    ) {
      return error("invalid_request", "Requête invalide", 400);
    }

    const completedAt = now().toISOString();
    const challenge = await dependencies.db
      .prepare(
        `SELECT challenge.id, challenge.account_id, account.firebase_uid,
                challenge.code_hash, challenge.attempt_count, challenge.max_attempts,
                challenge.expires_at, challenge.consumed_at, challenge.invalidated_at
         FROM verification_challenge AS challenge
         INNER JOIN account ON account.id = challenge.account_id
         WHERE challenge.target_email_normalized = ?
           AND challenge.purpose = 'password_reset'
           AND account.status = 'active'
           AND account.firebase_uid IS NOT NULL
         ORDER BY challenge.requested_at DESC
         LIMIT 1`,
      )
      .bind(normalizeEmail(body.email))
      .first<ChallengeRow>();

    if (!challenge) return error("invalid_code", "Code invalide", 400);
    if (challenge.consumed_at) return error("code_consumed", "Ce code a déjà été utilisé", 409);
    if (challenge.invalidated_at || challenge.attempt_count >= challenge.max_attempts) {
      return error("too_many_attempts", "Ce code n’est plus utilisable", 429);
    }
    if (challenge.expires_at <= completedAt) return error("code_expired", "Ce code a expiré", 410);

    const submittedHash = await hashOpaqueToken(body.code, dependencies.pepper);
    if (submittedHash !== challenge.code_hash) {
      const attemptCount = challenge.attempt_count + 1;
      await dependencies.db
        .prepare(
          `UPDATE verification_challenge
           SET attempt_count = ?, invalidated_at = ?
           WHERE id = ? AND consumed_at IS NULL AND invalidated_at IS NULL`,
        )
        .bind(
          attemptCount,
          attemptCount >= challenge.max_attempts ? completedAt : null,
          challenge.id,
        )
        .run();
      return attemptCount >= challenge.max_attempts
        ? error("too_many_attempts", "Ce code n’est plus utilisable", 429)
        : error("invalid_code", "Code invalide", 400);
    }

    try {
      await dependencies.identity.resetPassword({
        uid: challenge.firebase_uid,
        password: body.password,
      });
    } catch {
      return error("identity_unavailable", "Récupération temporairement indisponible", 503);
    }

    await dependencies.db.batch([
      dependencies.db
        .prepare(
          `UPDATE verification_challenge SET consumed_at = ?
           WHERE id = ? AND consumed_at IS NULL AND invalidated_at IS NULL`,
        )
        .bind(completedAt, challenge.id),
      dependencies.db
        .prepare(
          `UPDATE user_session SET revoked_at = ?, revoke_reason = 'password_reset'
           WHERE account_id = ? AND revoked_at IS NULL`,
        )
        .bind(completedAt, challenge.account_id),
    ]);

    return new Response(null, { status: 204 });
  };
}

function createSixDigitCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String((values[0] ?? 0) % 1_000_000).padStart(6, "0");
}

function error(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}
