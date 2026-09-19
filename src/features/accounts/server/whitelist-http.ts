import type { D1Database } from "@cloudflare/workers-types";

import { normalizeEmail } from "./account";
import { AccountRepository } from "./account-repository";

interface WhitelistHttpDependencies {
  db: D1Database;
  now?: () => Date;
  createId?: (emailNormalized: string) => string;
}

interface WhitelistRequestBody {
  emails?: unknown;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function createWhitelistHttpHandler(dependencies: WhitelistHttpDependencies) {
  const repository = new AccountRepository(dependencies.db);
  const now = dependencies.now ?? (() => new Date());
  const createId = dependencies.createId ?? (() => `account_${crypto.randomUUID()}`);

  return async function handleWhitelistImport(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return json({ error: { code: "method_not_allowed", message: "Method not allowed" } }, 405);
    }

    let body: WhitelistRequestBody;
    try {
      body = (await request.json()) as WhitelistRequestBody;
    } catch {
      return json({ error: { code: "invalid_json", message: "Invalid JSON body" } }, 400);
    }

    if (!Array.isArray(body.emails)) {
      return json(
        { error: { code: "invalid_whitelist", message: "emails must be an array" } },
        400,
      );
    }

    const normalizedEmails = new Set<string>();
    let invalid = 0;

    for (const candidate of body.emails) {
      if (typeof candidate !== "string") {
        invalid += 1;
        continue;
      }

      const emailNormalized = normalizeEmail(candidate);
      if (!isEmail(emailNormalized)) {
        invalid += 1;
        continue;
      }

      normalizedEmails.add(emailNormalized);
    }

    let created = 0;
    const importedAt = now().toISOString();

    for (const emailNormalized of normalizedEmails) {
      const result = await repository.ensureEligible({
        id: createId(emailNormalized),
        email: emailNormalized,
        now: importedAt,
      });
      if (result.created) {
        created += 1;
      }
    }

    return json({
      received: body.emails.length,
      unique: normalizedEmails.size,
      created,
      unchanged: normalizedEmails.size - created,
      invalid,
    });
  };
}
