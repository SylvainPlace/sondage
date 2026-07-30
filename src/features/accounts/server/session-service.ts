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
}

export interface IssuedSession {
  id: string;
  token: string;
  expiresAt: Date;
}

export async function issueSession(
  store: SessionStore,
  input: IssueSessionInput,
): Promise<IssuedSession> {
  const token = createOpaqueSessionToken();
  const tokenHash = await hashOpaqueToken(token, input.pepper);
  const id = `session_${crypto.randomUUID()}`;
  const expiresAt = calculateSessionExpiry(input.now);
  const nowIso = input.now.toISOString();

  const session: NewSession = {
    id,
    tokenHash,
    accountId: input.accountId,
    deviceLabel: input.deviceLabel ?? null,
    userAgentSummary: input.userAgentSummary ?? null,
    createdAt: nowIso,
    lastSeenAt: nowIso,
    expiresAt: expiresAt.toISOString(),
  };

  await store.create(session);

  return { id, token, expiresAt };
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
    return session;
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
  };
}
