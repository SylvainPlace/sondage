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
}

export interface AuthenticatedSession {
  sessionId: string;
  accountId: string;
  emailNormalized: string;
  role: AccountRole;
  lastSeenAt: string;
  expiresAt: string;
}

interface AuthenticatedSessionRow {
  session_id: string;
  account_id: string;
  email_normalized: string;
  role: AccountRole;
  last_seen_at: string;
  expires_at: string;
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
          expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
          account.role,
          session.last_seen_at,
          session.expires_at
        FROM user_session AS session
        INNER JOIN account ON account.id = session.account_id
        WHERE session.token_hash = ?
          AND session.revoked_at IS NULL
          AND session.expires_at > ?
          AND account.status = 'active'
          AND account.email_normalized IS NOT NULL
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
      emailNormalized: row.email_normalized,
      role: row.role,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
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
}
