// Inflow forecast – SPEC.md § 6.3. Pure: 24 hourly buckets from the start minute, minute-by-minute integration.
import type { ForecastProfile } from '@/data/types';
import { INITIAL_CLOCK, formatClock } from './time';

export interface ForecastBucket {
  start: number; // minutes since 00:00 of the demo day (may exceed 1440)
  end: number;
  label: string; // HH:MM of the bucket start
  arrivals: number;
  admissions: number;
  discharges: number;
  elective: number;
  free: number; // free beds at the end of the bucket
}

export interface ForecastOptions {
  startMin?: number; // default 14:40
  multiplier?: number; // arrivals factor (scenario Tryck)
  multiplierHours?: number; // hours from start the factor applies
}

export interface ForecastResult {
  buckets: ForecastBucket[];
  freeAt: { h4: number; h12: number; h24: number };
  deficit?: { at: string; beds: number; bucket: number };
}

const RESIDUAL_SHARE = 0.05;
const ELECTIVE_FROM = 7;
const ELECTIVE_TO = 9;
const TOMORROW_DISCHARGES_FROM = 10;

function hourOfDay(minute: number): number {
  return ((minute % 1440) + 1440) % 1440 / 60;
}

function arrivalRatePerMinute(profile: ForecastProfile, minute: number): number {
  const h = hourOfDay(minute);
  const range = profile.arrivalsPerHour.find((r) => (r.from <= h && h < r.to) || (r.from <= h + 24 && h + 24 < r.to));
  return (range?.rate ?? 0) / 60;
}

/** Share of the day's planned discharges falling in this minute (windows from the profile, 5 % spread over the other hours). */
function dischargeSharePerMinute(profile: ForecastProfile, minute: number): number {
  const h = hourOfDay(minute);
  const tomorrow = minute >= 1440;
  if (tomorrow && h < TOMORROW_DISCHARGES_FROM) return 0;
  const window = profile.dischargeShareByHour.find((w) => w.from <= h && h < w.to);
  if (window) return window.share / ((window.to - window.from) * 60);
  const windowHours = profile.dischargeShareByHour.reduce((s, w) => s + (w.to - w.from), 0);
  return RESIDUAL_SHARE / ((24 - windowHours) * 60);
}

function electivePerMinute(profile: ForecastProfile, minute: number): number {
  if (minute < 1440) return 0;
  const h = hourOfDay(minute);
  if (h >= ELECTIVE_FROM && h < ELECTIVE_TO) return profile.electiveAdmissionsTomorrow / ((ELECTIVE_TO - ELECTIVE_FROM) * 60);
  return 0;
}

/**
 * Expected arrivals, admissions, discharges, elective admissions and resulting free beds per hour for
 * 24 hours from the start (14:40 by default). All values illustrative.
 */
export function forecast(profile: ForecastProfile, freeBedsNow: number, options: ForecastOptions = {}): ForecastResult {
  const start = options.startMin ?? INITIAL_CLOCK;
  const multiplier = options.multiplier ?? 1;
  const multiplierUntil = start + (options.multiplierHours ?? 0) * 60;
  const buckets: ForecastBucket[] = [];
  let free = freeBedsNow;
  for (let b = 0; b < 24; b++) {
    const bucketStart = start + b * 60;
    const bucketEnd = bucketStart + 60;
    let arrivals = 0;
    let discharges = 0;
    let elective = 0;
    for (let m = bucketStart; m < bucketEnd; m++) {
      const factor = m < multiplierUntil ? multiplier : 1;
      arrivals += arrivalRatePerMinute(profile, m) * factor;
      discharges += profile.plannedDischargesToday * dischargeSharePerMinute(profile, m);
      elective += electivePerMinute(profile, m);
    }
    const admissions = arrivals * profile.admissionShare;
    free = free - admissions - elective + discharges;
    buckets.push({ start: bucketStart, end: bucketEnd, label: formatClock(bucketStart), arrivals, admissions, discharges, elective, free });
  }
  const firstNegative = buckets.findIndex((x) => x.free < 0);
  const deficit = firstNegative >= 0 ? { at: formatClock(buckets[firstNegative].end), beds: Math.ceil(-buckets[firstNegative].free), bucket: firstNegative } : undefined;
  return {
    buckets,
    freeAt: { h4: Math.round(buckets[3].free), h12: Math.round(buckets[11].free), h24: Math.round(buckets[23].free) },
    deficit,
  };
}
