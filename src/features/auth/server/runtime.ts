import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  FirebaseIdentityProvider,
  ResendEmailProvider,
  TurnstileProvider,
} from "@/lib/services/cloud-providers";

export async function getAuthRuntime() {
  const { env } = await getCloudflareContext({ async: true });
  return {
    db: env.DB,
    identity: new FirebaseIdentityProvider(
      required(env.FIREBASE_WEB_API_KEY, "FIREBASE_WEB_API_KEY"),
      fetch,
      {
        projectId: required(env.FIREBASE_PROJECT_ID, "FIREBASE_PROJECT_ID"),
        clientEmail: required(env.FIREBASE_CLIENT_EMAIL, "FIREBASE_CLIENT_EMAIL"),
        privateKey: required(env.FIREBASE_PRIVATE_KEY, "FIREBASE_PRIVATE_KEY"),
      },
    ),
    email: new ResendEmailProvider(
      required(env.RESEND_API_KEY, "RESEND_API_KEY"),
      required(env.RESEND_FROM_EMAIL, "RESEND_FROM_EMAIL"),
    ),
    humanVerification: new TurnstileProvider(required(env.TURNSTILE_SECRET, "TURNSTILE_SECRET")),
    activationPepper: required(env.AUTH_TOKEN_PEPPER, "AUTH_TOKEN_PEPPER"),
    sessionPepper: required(env.SESSION_TOKEN_PEPPER, "SESSION_TOKEN_PEPPER"),
  };
}

export async function getSessionRuntime() {
  const { env } = await getCloudflareContext({ async: true });
  return {
    db: env.DB,
    sessionPepper: required(env.SESSION_TOKEN_PEPPER, "SESSION_TOKEN_PEPPER"),
  };
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing Cloudflare secret: ${name}`);
  return value;
}
