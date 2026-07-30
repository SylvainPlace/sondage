export const ACCOUNT_ROLES = ["alumni", "admin"] as const;
export const ACCOUNT_STATUSES = [
  "eligible",
  "active",
  "suspended",
  "deletion_pending",
  "deleted",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface Account {
  id: string;
  emailNormalized: string | null;
  firebaseUid: string | null;
  role: AccountRole;
  status: AccountStatus;
  activatedAt: string | null;
  suspendedAt: string | null;
  deletionRequestedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
