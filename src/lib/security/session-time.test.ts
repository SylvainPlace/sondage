import { describe, expect, it } from "vitest";

import {
  addUtcMonthsClamped,
  calculateSessionExpiry,
  isSessionExpired,
  shouldTouchSession,
} from "./session-time";

describe("session time policy", () => {
  it("expires a session after fifteen calendar months of inactivity", () => {
    const lastSeenAt = new Date("2026-07-30T12:30:00.000Z");

    expect(calculateSessionExpiry(lastSeenAt).toISOString()).toBe("2027-10-30T12:30:00.000Z");
  });

  it("clamps month-end dates instead of overflowing", () => {
    const januaryEnd = new Date("2025-01-31T08:00:00.000Z");

    expect(addUtcMonthsClamped(januaryEnd, 1).toISOString()).toBe("2025-02-28T08:00:00.000Z");
  });

  it("only refreshes the persisted session once per day", () => {
    const lastSeenAt = new Date("2026-07-30T08:00:00.000Z");

    expect(shouldTouchSession(lastSeenAt, new Date("2026-07-31T07:59:59.999Z"))).toBe(false);
    expect(shouldTouchSession(lastSeenAt, new Date("2026-07-31T08:00:00.000Z"))).toBe(true);
  });

  it("treats the exact expiry instant as expired", () => {
    const expiry = new Date("2026-07-30T08:00:00.000Z");

    expect(isSessionExpired(expiry, new Date("2026-07-30T07:59:59.999Z"))).toBe(false);
    expect(isSessionExpired(expiry, expiry)).toBe(true);
  });
});
