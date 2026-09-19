import type { D1Database } from "@cloudflare/workers-types";

import type { AccountRole } from "./account";

export interface NewSession {
  id: string;
  tokenHash: string;
  accountId: string;
  deviceLabel: string | null;
  userAgentSummary: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  csrfTokenHash: string;
  authenticatedAt: string;
}

export interface AuthenticatedSession {
  sessionId: string;
  accountId: string;
  firebaseUid: string;
  emailNormalized: string;
  role: AccountRole;
  lastSeenAt: string;
  expiresAt: string;
  csrfTokenHash: string | null;
  authenticatedAt: string;
  touched?: boolean;
}

interface AuthenticatedSessionRow {
  session_id: string;
  account_id: string;
  firebase_uid: string;
  email_normalized: string;
  role: AccountRole;
  last_seen_at: string;
  expires_at: string;
  csrf_token_hash: string | null;
  authenticated_at: string | null;
}

export interface SessionSummary {
  id: string;
  deviceLabel: string | null;
  userAgentSummary: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface SessionStore {
  create(session: NewSession): Promise<void>;
}

export interface SessionAuthenticationStore {
  findAuthenticated(tokenHash: string, now: string): Promise<AuthenticatedSession | null>;
  touch(id: string, lastSeenAt: string, expiresAt: string, now: string): Promise<void>;
}

export class SessionRepository implements SessionStore, SessionAuthenticationStore {
  constructor(private readonly db: D1Database) {}

  async create(session: NewSession): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO user_session (
          id,
          token_hash,
          account_id,
          device_label,
          user_agent_summary,
          created_at,
          last_seen_at,
          expires_at,
          csrf_token_hash,
          authenticated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        session.id,
        session.tokenHash,
        session.accountId,
        session.deviceLabel,
        session.userAgentSummary,
        session.createdAt,
        session.lastSeenAt,
        session.expiresAt,
        session.csrfTokenHash,
        session.authenticatedAt,
      )
      .run();
  }

  async findAuthenticated(tokenHash: string, now: string): Promise<AuthenticatedSession | null> {
    const row = await this.db
      .prepare(
        `SELECT
          session.id AS session_id,
          session.account_id,
          account.email_normalized,
          account.firebase_uid,
          account.role,
          session.last_seen_at,
          session.expires_at,
          session.csrf_token_hash,
          session.authenticated_at
        FROM user_session AS session
        INNER JOIN account ON account.id = session.account_id
        WHERE session.token_hash = ?
          AND session.revoked_at IS NULL
          AND session.expires_at > ?
          AND account.status = 'active'
          AND account.email_normalized IS NOT NULL
          AND account.firebase_uid IS NOT NULL
        LIMIT 1`,
      )
      .bind(tokenHash, now)
      .first<AuthenticatedSessionRow>();

    if (!row) {
      return null;
    }

    return {
      sessionId: row.session_id,
      accountId: row.account_id,
      firebaseUid: row.firebase_uid,
      emailNormalized: row.email_normalized,
      role: row.role,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
      csrfTokenHash: row.csrf_token_hash,
      authenticatedAt: row.authenticated_at ?? row.last_seen_at,
    };
  }

  async touch(id: string, lastSeenAt: string, expiresAt: string, now: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE user_session
         SET last_seen_at = ?, expires_at = ?
         WHERE id = ? AND revoked_at IS NULL AND expires_at > ?`,
      )
      .bind(lastSeenAt, expiresAt, id, now)
      .run();
  }

  async revoke(id: string, now: string, reason: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE user_session
         SET revoked_at = ?, revoke_reason = ?
         WHERE id = ? AND revoked_at IS NULL`,
      )
      .bind(now, reason, id)
      .run();
  }

  async revokeAllForAccount(accountId: string, now: string, reason: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE user_session
         SET revoked_at = ?, revoke_reason = ?
         WHERE account_id = ? AND revoked_at IS NULL`,
      )
      .bind(now, reason, accountId)
      .run();
  }

  async listActiveForAccount(accountId: string, now: string): Promise<SessionSummary[]> {
    const result = await this.db
      .prepare(
        `SELECT id, device_label, user_agent_summary, created_at, last_seen_at, expires_at
         FROM user_session
         WHERE account_id = ? AND revoked_at IS NULL AND expires_at > ?
         ORDER BY last_seen_at DESC`,
      )
      .bind(accountId, now)
      .all<{
        id: string;
        device_label: string | null;
        user_agent_summary: string | null;
        created_at: string;
        last_seen_at: string;
        expires_at: string;
      }>();

    return result.results.map((row) => ({
      id: row.id,
      deviceLabel: row.device_label,
      userAgentSummary: row.user_agent_summary,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
    }));
  }

  async revokeForAccount(
    id: string,
    accountId: string,
    now: string,
    reason: string,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE user_session
         SET revoked_at = ?, revoke_reason = ?
         WHERE id = ? AND account_id = ? AND revoked_at IS NULL`,
      )
      .bind(now, reason, id, accountId)
      .run();
  }

  async markReauthenticated(id: string, authenticatedAt: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE user_session SET authenticated_at = ?
         WHERE id = ? AND revoked_at IS NULL`,
      )
      .bind(authenticatedAt, id)
      .run();
  }
}
