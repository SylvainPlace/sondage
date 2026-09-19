import type { D1Database } from "@cloudflare/workers-types";

import { AccountRepository } from "@/features/accounts/server/account-repository";
import { normalizeEmail } from "@/features/accounts/server/account";
import type { EmailProvider, HumanVerificationProvider } from "@/lib/services/external-services";
import { hashOpaqueToken } from "@/lib/security/opaque-token";

interface ActivationRequestDependencies {
  db: D1Database;
  email: EmailProvider;
  humanVerification: HumanVerificationProvider;
  pepper: string;
  now?: () => Date;
  createChallengeId?: () => string;
  createCode?: () => string;
}

interface ActivationRequestBody {
  email?: unknown;
  turnstileToken?: unknown;
}

const NEUTRAL_RESPONSE = {
  ok: true,
  message: "Si cette adresse est éligible, un code vient d’être envoyé.",
} as const;

export function createActivationRequestHandler(dependencies: ActivationRequestDependencies) {
  const accounts = new AccountRepository(dependencies.db);
  const now = dependencies.now ?? (() => new Date());
  const createChallengeId =
    dependencies.createChallengeId ?? (() => `challenge_${crypto.randomUUID()}`);
  const createCode = dependencies.createCode ?? createSixDigitCode;

  return async function handleActivationRequest(request: Request): Promise<Response> {
    const body = (await request.json()) as ActivationRequestBody;
    if (typeof body.email !== "string" || typeof body.turnstileToken !== "string") {
      return Response.json(
        { error: { code: "invalid_request", message: "Requête invalide" } },
        { status: 400 },
      );
    }

    const emailNormalized = normalizeEmail(body.email);
    let verification;
    try {
      verification = await dependencies.humanVerification.verify({
        token: body.turnstileToken,
        remoteIp: request.headers.get("cf-connecting-ip") ?? undefined,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch {
      return Response.json(
        {
          error: {
            code: "human_verification_unavailable",
            message: "Vérification temporairement indisponible, veuillez réessayer",
          },
        },
        { status: 503 },
      );
    }
    if (!verification.valid) {
      return Response.json(
        { error: { code: "human_verification_failed", message: "Vérification impossible" } },
        { status: 403 },
      );
    }

    const account = await accounts.findByEmail(emailNormalized);
    if (!account || account.status !== "eligible") {
      return Response.json(NEUTRAL_RESPONSE, { status: 202 });
    }

    const requestedAt = now();
    const expiresAt = new Date(requestedAt.getTime() + 10 * 60 * 1000);
    const challengeId = createChallengeId();
    const code = createCode();
    const codeHash = await hashOpaqueToken(code, dependencies.pepper);

    await dependencies.db
      .prepare(
        `INSERT INTO verification_challenge (
          id, account_id, target_email_normalized, purpose, code_hash,
          requested_at, expires_at
        ) VALUES (?, ?, ?, 'activation', ?, ?, ?)`,
      )
      .bind(
        challengeId,
        account.id,
        emailNormalized,
        codeHash,
        requestedAt.toISOString(),
        expiresAt.toISOString(),
      )
      .run();

    try {
      await dependencies.email.send({
        to: emailNormalized,
        template: "activation-code",
        variables: { code, expiresInMinutes: "10" },
        idempotencyKey: `activation:${challengeId}`,
      });
    } catch {
      await dependencies.db
        .prepare(
          `UPDATE verification_challenge
           SET invalidated_at = ?
           WHERE id = ? AND consumed_at IS NULL`,
        )
        .bind(now().toISOString(), challengeId)
        .run();
    }

    return Response.json(NEUTRAL_RESPONSE, { status: 202 });
  };
}

function createSixDigitCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String((values[0] ?? 0) % 1_000_000).padStart(6, "0");
}
