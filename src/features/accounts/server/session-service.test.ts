import { describe, expect, it, vi } from "vitest";

import type {
  AuthenticatedSession,
  NewSession,
  SessionAuthenticationStore,
  SessionStore,
} from "./session-repository";
import { authenticateSession, issueSession } from "./session-service";

describe("issueSession", () => {
  it("persists only the token hash and returns the raw token once", async () => {
    const create = vi.fn<(session: NewSession) => Promise<void>>().mockResolvedValue();
    const store: SessionStore = { create };
    const now = new Date("2026-07-30T10:00:00.000Z");

    const issued = await issueSession(store, {
      accountId: "account_1",
      pepper: "test-pepper",
      now,
      deviceLabel: "Firefox sur Windows",
    });

    expect(create).toHaveBeenCalledOnce();
    const persisted = create.mock.calls[0]?.[0];
    expect(persisted).toBeDefined();
    expect(persisted?.accountId).toBe("account_1");
    expect(persisted?.tokenHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(persisted?.tokenHash).not.toBe(issued.token);
    expect(persisted?.expiresAt).toBe("2027-10-30T10:00:00.000Z");
    expect(issued.expiresAt.toISOString()).toBe(persisted?.expiresAt);
  });
});

describe("authenticateSession", () => {
  const activeSession: AuthenticatedSession = {
    sessionId: "session_1",
    accountId: "account_1",
    emailNormalized: "alumni@example.org",
    role: "alumni",
    lastSeenAt: "2026-07-29T10:00:00.000Z",
    expiresAt: "2027-10-29T10:00:00.000Z",
  };

  it("rejects unknown, revoked, expired or inactive sessions through the store", async () => {
    const store: SessionAuthenticationStore = {
      findAuthenticated: vi.fn().mockResolvedValue(null),
      touch: vi.fn(),
    };

    await expect(
      authenticateSession(store, "unknown-token", "test-pepper", new Date("2026-07-30T10:00:00Z")),
    ).resolves.toBeNull();
    expect(store.touch).not.toHaveBeenCalled();
  });

  it("slides the expiry after one day without persisting on every request", async () => {
    const findAuthenticated = vi.fn().mockResolvedValue(activeSession);
    const touch = vi.fn().mockResolvedValue(undefined);
    const store: SessionAuthenticationStore = { findAuthenticated, touch };
    const now = new Date("2026-07-30T10:00:00.000Z");

    const session = await authenticateSession(store, "raw-token", "test-pepper", now);

    expect(touch).toHaveBeenCalledWith(
      "session_1",
      "2026-07-30T10:00:00.000Z",
      "2027-10-30T10:00:00.000Z",
      "2026-07-30T10:00:00.000Z",
    );
    expect(session?.expiresAt).toBe("2027-10-30T10:00:00.000Z");
  });

  it("does not write a recent session back to D1", async () => {
    const recentSession = {
      ...activeSession,
      lastSeenAt: "2026-07-30T09:00:00.000Z",
    };
    const touch = vi.fn();
    const store: SessionAuthenticationStore = {
      findAuthenticated: vi.fn().mockResolvedValue(recentSession),
      touch,
    };

    await authenticateSession(
      store,
      "raw-token",
      "test-pepper",
      new Date("2026-07-30T10:00:00.000Z"),
    );

    expect(touch).not.toHaveBeenCalled();
  });
});
