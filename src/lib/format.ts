// Swedish number, percent, duration and date formatting (DESIGN-KS.md § 1). Intl.NumberFormat('sv-SE') everywhere.
const NUMBER = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 });
const DECIMAL_1 = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const DECIMAL_2 = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Whole number with Swedish thousands separator (16 500). */
export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return 'Okänt';
  return NUMBER.format(n);
}

/** Number with one decimal (1,3). */
export function fmt1(n: number): string {
  return DECIMAL_1.format(n);
}

/** Number with up to two decimals, no trailing zeros (1,3 or 0,75). */
export function fmtDec(n: number): string {
  return DECIMAL_2.format(n);
}

/** Share 0–1 as a percentage with one decimal and a space before % (95,6 %). */
export function fmtPct(share: number | null | undefined, decimals = 1): string {
  if (share === null || share === undefined || Number.isNaN(share)) return 'Okänt';
  const f = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${f.format(share * 100)} %`;
}

/** Duration in minutes as "3 h 10 min", "45 min" or "6 h". */
export function fmtDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} min`;
  if (rest === 0) return `${h} h`;
  return `${h} h ${rest} min`;
}

/** Relative offset as "+30 min", "+2 h 15 min" or "dag 3". */
export function fmtOffset(minutes: number): string {
  if (minutes >= 1440 && minutes % 1440 === 0) return `dag ${minutes / 1440}`;
  return `+${fmtDuration(minutes)}`;
}

/** Days as "10 dygn". */
export function fmtDays(days: number): string {
  return `${fmt(days)} dygn`;
}

/** "{h} h {min} min" split for KPI strips. */
export function fmtHoursMinutes(minutes: number): string {
  return fmtDuration(minutes);
}
