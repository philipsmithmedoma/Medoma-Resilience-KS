import { describe, expect, it } from 'vitest';
import { FORECAST_PROFILES } from '@/data/packs/karolinska';
import { forecast } from './forecast';

const huddinge = FORECAST_PROFILES.find((p) => p.site === 'huddinge')!;
const solna = FORECAST_PROFILES.find((p) => p.site === 'solna')!;

describe('forecast (SPEC.md § 6.3)', () => {
  const h = forecast(huddinge, 9);
  const s = forecast(solna, 23);

  it('builds 24 hourly buckets from 14:40', () => {
    expect(h.buckets).toHaveLength(24);
    expect(h.buckets[0].label).toBe('14:40');
    expect(h.buckets[23].label).toBe('13:40');
    // 14:40–15:40 at 9 per hour, 32 % admitted
    expect(h.buckets[0].arrivals).toBeCloseTo(9, 5);
    expect(h.buckets[0].admissions).toBeCloseTo(2.88, 5);
    // elective admissions tomorrow 07–09
    expect(h.buckets.filter((b) => b.elective > 0).map((b) => b.label)).toEqual(['06:40', '07:40', '08:40']);
    expect(h.buckets.reduce((n, b) => n + b.elective, 0)).toBeCloseTo(24, 5);
  });

  it('Huddinge goes negative within 24 h (first at 03:40) and Solna does not', () => {
    expect(h.deficit).toBeDefined();
    expect(h.deficit!.at).toBe('03:40');
    expect(h.deficit!.beds).toBe(1);
    expect(h.freeAt).toEqual({ h4: 14, h12: 1, h24: -16 });
    expect(s.deficit).toBeUndefined();
    expect(s.freeAt).toEqual({ h4: 34, h12: 31, h24: 30 });
  });

  it('scenario Tryck (factor 1,3 for 6 h) moves the Huddinge deficit earlier, to 23:40', () => {
    const t = forecast(huddinge, 9, { multiplier: 1.3, multiplierHours: 6 });
    expect(t.deficit).toBeDefined();
    expect(t.deficit!.bucket).toBeLessThan(h.deficit!.bucket);
    expect(t.deficit!.at).toBe('23:40');
    expect(t.freeAt).toEqual({ h4: 11, h12: -4, h24: -21 });
    expect(t.freeAt.h12).toBeLessThan(h.freeAt.h12);
  });
});
