import { describe, expect, it } from 'vitest';
import { fmt, fmtDec, fmtDuration, fmtOffset, fmtPct } from './format';
import { dayOf, formatClock } from './time';

const NBSP = ' ';

describe('Swedish formatting (DESIGN-KS.md § 1)', () => {
  it('groups thousands with a space and uses a decimal comma', () => {
    expect(fmt(16500)).toBe(`16${NBSP}500`);
    expect(fmt(1600)).toBe(`1${NBSP}600`);
    expect(fmt(32)).toBe('32');
    expect(fmt(null)).toBe('Okänt');
    expect(fmtDec(1.3)).toBe('1,3');
  });

  it('formats shares as percentages with a space before %', () => {
    expect(fmtPct(0.956)).toBe(`95,6${NBSP}%`);
    expect(fmtPct(0.34, 0)).toBe(`34${NBSP}%`);
  });

  it('formats durations and offsets', () => {
    expect(fmtDuration(190)).toBe('3 h 10 min');
    expect(fmtDuration(45)).toBe('45 min');
    expect(fmtDuration(360)).toBe('6 h');
    expect(fmtOffset(30)).toBe('+30 min');
    expect(fmtOffset(2880)).toBe('dag 2');
  });

  it('formats the clock across days', () => {
    expect(formatClock(880)).toBe('14:40');
    expect(formatClock(880 + 1440)).toBe('14:40');
    expect(dayOf(880)).toBe(1);
    expect(dayOf(880 + 1440)).toBe(2);
  });
});
