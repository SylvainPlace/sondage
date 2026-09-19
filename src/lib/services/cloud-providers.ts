import { importPKCS8, SignJWT } from "jose";

import { normalizeEmail } from "@/features/accounts/server/account";
import type {
  EmailMessage,
  EmailProvider,
  HumanVerificationProvider,
  IdentityProvider,
  VerifiedIdentity,
} from "@/lib/services/external-services";

const FIREBASE_API = "https://identitytoolkit.googleapis.com/v1";

export class TurnstileProvider implements HumanVerificationProvider {
  constructor(
    private readonly secret: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async verify(input: {
    token: string;
    remoteIp?: string;
    idempotencyKey: string;
  }): Promise<{ valid: boolean }> {
    const body = new URLSearchParams({
      secret: this.secret,
      response: input.token,
      idempotency_key: input.idempotencyKey,
    });
    if (input.remoteIp) body.set("remoteip", input.remoteIp);

    const response = await this.fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!response.ok) return { valid: false };

    const result = (await response.json()) as { success?: boolean };
    return { valid: result.success === true };
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    if (message.template !== "activation-code" && message.template !== "password-reset-code") {
      throw new Error(`Unsupported email template: ${message.template}`);
    }

    const code = escapeHtml(message.variables.code ?? "");
    const expiresInMinutes = escapeHtml(message.variables.expiresInMinutes ?? "10");
    const response = await this.fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject:
          message.template === "activation-code"
            ? "Votre code d’activation"
            : "Votre code de récupération",
        html: `<p>Votre code est :</p><p><strong>${code}</strong></p><p>Il expire dans ${expiresInMinutes} minutes.</p>`,
        text: `Votre code est ${message.variables.code ?? ""}. Il expire dans ${message.variables.expiresInMinutes ?? "10"} minutes.`,
      }),
    });
    if (!response.ok) throw new Error(`Resend request failed (${response.status})`);

    const result = (await response.json()) as { id?: string };
    if (!result.id) throw new Error("Resend response did not include a message id");
    return { messageId: result.id };
  }
}

interface FirebasePasswordResponse {
  localId?: string;
  email?: string;
  idToken?: string;
}

export class FirebaseIdentityProvider implements IdentityProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly adminCredentials?: FirebaseAdminCredentials,
    private readonly adminAccessTokenFactory?: () => Promise<string>,
  ) {}

  async activateWithPassword(input: {
    emailNormalized: string;
    password: string;
  }): Promise<VerifiedIdentity> {
    try {
      return await this.passwordRequest("accounts:signUp", input);
    } catch (error) {
      if (error instanceof FirebaseIdentityError && error.code === "EMAIL_EXISTS") {
        return this.passwordRequest("accounts:signInWithPassword", input);
      }
      throw error;
    }
  }

  authenticateWithPassword(input: {
    emailNormalized: string;
    password: string;
  }): Promise<VerifiedIdentity> {
    return this.passwordRequest("accounts:signInWithPassword", input);
  }

  async verifyIdToken(idToken: string): Promise<VerifiedIdentity> {
    const response = await this.firebaseRequest("accounts:lookup", { idToken });
    const result = (await response.json()) as {
      users?: Array<{ localId?: string; email?: string }>;
    };
    const user = result.users?.[0];
    if (!user?.localId || !user.email) throw new Error("Firebase identity is incomplete");
    return identityFromFirebase({ localId: user.localId, email: user.email });
  }

  async resetPassword(input: { uid: string; password: string }): Promise<void> {
    if (!this.adminCredentials) throw new Error("Firebase admin credentials are required");
    const accessToken = this.adminAccessTokenFactory
      ? await this.adminAccessTokenFactory()
      : await createGoogleAccessToken(this.adminCredentials, this.fetcher);
    const response = await this.fetcher(
      `${FIREBASE_API}/projects/${encodeURIComponent(this.adminCredentials.projectId)}/accounts:update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ localId: input.uid, password: input.password }),
      },
    );
    if (!response.ok) throw new Error(`Firebase admin update failed (${response.status})`);
  }

  private async passwordRequest(
    operation: "accounts:signUp" | "accounts:signInWithPassword",
    input: { emailNormalized: string; password: string },
  ): Promise<VerifiedIdentity> {
    const response = await this.firebaseRequest(operation, {
      email: input.emailNormalized,
      password: input.password,
      returnSecureToken: true,
    });
    const result = (await response.json()) as FirebasePasswordResponse;
    if (!result.localId || !result.email) throw new Error("Firebase identity is incomplete");
    return identityFromFirebase({ localId: result.localId, email: result.email });
  }

  private async firebaseRequest(operation: string, body: object): Promise<Response> {
    const response = await this.fetcher(`${FIREBASE_API}/${operation}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return response;

    const result = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new FirebaseIdentityError(result.error?.message ?? `HTTP_${response.status}`);
  }
}

export interface FirebaseAdminCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

async function createGoogleAccessToken(
  credentials: FirebaseAdminCredentials,
  fetcher: typeof fetch,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(credentials.privateKey.replaceAll("\\n", "\n"), "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/identitytoolkit",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(credentials.clientEmail)
    .setSubject(credentials.clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 3600)
    .sign(key);
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth request failed (${response.status})`);
  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token)
    throw new Error("Google OAuth response did not include an access token");
  return result.access_token;
}

class FirebaseIdentityError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "FirebaseIdentityError";
  }
}

function identityFromFirebase(value: { localId: string; email: string }): VerifiedIdentity {
  return {
    uid: value.localId,
    emailNormalized: normalizeEmail(value.email),
    authenticatedAt: new Date(),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
