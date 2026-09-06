// Demo clock helpers. The clock is minutes since 00:00 (SPEC.md § 4).

export const INITIAL_CLOCK = 14 * 60 + 40;
export const STALE_AFTER_MIN = 30;

export function formatClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function parseClock(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return Number.NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return Number.NaN;
  return h * 60 + m;
}

export function isValidClock(hhmm: string): boolean {
  return !Number.isNaN(parseClock(hhmm));
}

/** Minutes from `hhmm` to the current clock (positive when hhmm is in the past). */
export function minutesSince(clock: number, hhmm: string): number {
  return clock - parseClock(hhmm);
}

/** True when `hhmm` is older than 30 minutes relative to the clock (strictly). */
export function isStale(clock: number, hhmm: string): boolean {
  return minutesSince(clock, hhmm) > STALE_AFTER_MIN;
}

export function formatOffset(minutes: number): string {
  return `+${minutes} min`;
}
