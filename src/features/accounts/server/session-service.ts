import { createOpaqueSessionToken, hashOpaqueToken } from "@/lib/security/opaque-token";
import { calculateSessionExpiry, shouldTouchSession } from "@/lib/security/session-time";

import type {
  AuthenticatedSession,
  NewSession,
  SessionAuthenticationStore,
  SessionStore,
} from "./session-repository";

interface IssueSessionInput {
  accountId: string;
  pepper: string;
  now: Date;
  deviceLabel?: string | null;
  userAgentSummary?: string | null;
  authenticatedAt?: Date;
}

export interface IssuedSession {
  id: string;
  token: string;
  expiresAt: Date;
  csrfToken: string;
}

export async function issueSession(
  store: SessionStore,
  input: IssueSessionInput,
): Promise<IssuedSession> {
  const token = createOpaqueSessionToken();
  const tokenHash = await hashOpaqueToken(token, input.pepper);
  const csrfToken = createOpaqueSessionToken();
  const csrfTokenHash = await hashOpaqueToken(csrfToken, input.pepper);
  const id = `session_${crypto.randomUUID()}`;
  const expiresAt = calculateSessionExpiry(input.now);
  const nowIso = input.now.toISOString();

  const session: NewSession = {
    id,
    tokenHash,
    accountId: input.accountId,
    deviceLabel: input.deviceLabel ?? describeDevice(input.userAgentSummary),
    userAgentSummary: input.userAgentSummary ?? null,
    createdAt: nowIso,
    lastSeenAt: nowIso,
    expiresAt: expiresAt.toISOString(),
    csrfTokenHash,
    authenticatedAt: (input.authenticatedAt ?? input.now).toISOString(),
  };

  await store.create(session);

  return { id, token, expiresAt, csrfToken };
}

export function describeDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return "Appareil non identifié";
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Firefox/")
      ? "Firefox"
      : userAgent.includes("Chrome/")
        ? "Chrome"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Navigateur";
  const system = userAgent.includes("iPhone")
    ? "iPhone"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Macintosh")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "appareil inconnu";
  return `${browser} sur ${system}`;
}

export async function authenticateSession(
  store: SessionAuthenticationStore,
  token: string,
  pepper: string,
  now: Date,
): Promise<AuthenticatedSession | null> {
  const tokenHash = await hashOpaqueToken(token, pepper);
  const session = await store.findAuthenticated(tokenHash, now.toISOString());

  if (!session) {
    return null;
  }

  const lastSeenAt = new Date(session.lastSeenAt);
  if (!shouldTouchSession(lastSeenAt, now)) {
    return { ...session, touched: false };
  }

  const expiresAt = calculateSessionExpiry(now);
  await store.touch(
    session.sessionId,
    now.toISOString(),
    expiresAt.toISOString(),
    now.toISOString(),
  );

  return {
    ...session,
    lastSeenAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    touched: true,
  };
}
