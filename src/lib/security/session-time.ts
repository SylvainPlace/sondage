export const SESSION_INACTIVITY_MONTHS = 15;
export const SESSION_TOUCH_INTERVAL_MS = 24 * 60 * 60 * 1000;

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function addUtcMonthsClamped(date: Date, months: number): Date {
  if (!Number.isInteger(months)) {
    throw new Error("Month offset must be an integer");
  }

  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(date.getUTCDate(), daysInUtcMonth(targetYear, targetMonth));

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

export function calculateSessionExpiry(lastSeenAt: Date): Date {
  return addUtcMonthsClamped(lastSeenAt, SESSION_INACTIVITY_MONTHS);
}

export function shouldTouchSession(lastSeenAt: Date, now: Date): boolean {
  return now.getTime() - lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS;
}

export function isSessionExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}
