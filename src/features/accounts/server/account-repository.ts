import type { D1Database } from "@cloudflare/workers-types";

import type { Account, AccountRole, AccountStatus } from "./account";
import { normalizeEmail } from "./account";

interface AccountRow {
  id: string;
  email_normalized: string | null;
  firebase_uid: string | null;
  role: AccountRole;
  status: AccountStatus;
  activated_at: string | null;
  suspended_at: string | null;
  deletion_requested_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateEligibleAccount {
  id: string;
  email: string;
  role?: AccountRole;
  now: string;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    emailNormalized: row.email_normalized,
    firebaseUid: row.firebase_uid,
    role: row.role,
    status: row.status,
    activatedAt: row.activated_at,
    suspendedAt: row.suspended_at,
    deletionRequestedAt: row.deletion_requested_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ACCOUNT_COLUMNS = `
  id,
  email_normalized,
  firebase_uid,
  role,
  status,
  activated_at,
  suspended_at,
  deletion_requested_at,
  deleted_at,
  created_at,
  updated_at
`;

export class AccountRepository {
  constructor(private readonly db: D1Database) {}

  async findById(id: string): Promise<Account | null> {
    const row = await this.db
      .prepare(`SELECT ${ACCOUNT_COLUMNS} FROM account WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<AccountRow>();

    return row ? toAccount(row) : null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const row = await this.db
      .prepare(`SELECT ${ACCOUNT_COLUMNS} FROM account WHERE email_normalized = ? LIMIT 1`)
      .bind(normalizeEmail(email))
      .first<AccountRow>();

    return row ? toAccount(row) : null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<Account | null> {
    const row = await this.db
      .prepare(`SELECT ${ACCOUNT_COLUMNS} FROM account WHERE firebase_uid = ? LIMIT 1`)
      .bind(firebaseUid)
      .first<AccountRow>();

    return row ? toAccount(row) : null;
  }

  async createEligible(input: CreateEligibleAccount): Promise<Account> {
    const emailNormalized = normalizeEmail(input.email);

    await this.db
      .prepare(
        `INSERT OR IGNORE INTO account (
          id, email_normalized, role, status, created_at, updated_at
        ) VALUES (?, ?, ?, 'eligible', ?, ?)`,
      )
      .bind(input.id, emailNormalized, input.role ?? "alumni", input.now, input.now)
      .run();

    const account = await this.findByEmail(emailNormalized);
    if (!account) {
      throw new Error("Eligible account could not be created");
    }

    return account;
  }

  async activate(id: string, firebaseUid: string, now: string): Promise<Account | null> {
    await this.db
      .prepare(
        `UPDATE account
         SET firebase_uid = ?, status = 'active', activated_at = ?, updated_at = ?
         WHERE id = ? AND status = 'eligible'`,
      )
      .bind(firebaseUid, now, now, id)
      .run();

    return this.findById(id);
  }

  async updateStatus(id: string, status: AccountStatus, now: string): Promise<Account | null> {
    const suspendedAt = status === "suspended" ? now : null;
    const deletionRequestedAt = status === "deletion_pending" ? now : null;
    const deletedAt = status === "deleted" ? now : null;

    await this.db
      .prepare(
        `UPDATE account
         SET status = ?,
             suspended_at = COALESCE(?, suspended_at),
             deletion_requested_at = COALESCE(?, deletion_requested_at),
             deleted_at = COALESCE(?, deleted_at),
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(status, suspendedAt, deletionRequestedAt, deletedAt, now, id)
      .run();

    return this.findById(id);
  }
}
