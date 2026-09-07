import { describe, expect, it } from 'vitest';
import { CAPABILITIES } from '@/data/packs/karolinska';
import { capacitySentence, computeCapacity, hasOverrides } from './capacity';

const surgery = CAPABILITIES.find((c) => c.id === 'solna-surgery')!;
const intensive = CAPABILITIES.find((c) => c.id === 'huddinge-intensive')!;

describe('computeCapacity (SPEC.md § 6.5)', () => {
  it('Akut operation Solna: capacity 2 limited by postop-platser, next anestesiteam with gap 2', () => {
    const r = computeCapacity(surgery);
    expect(r.capacity).toBe(2);
    expect(r.limiting.map((c) => c.name)).toEqual(['Postop-platser']);
    expect(r.next?.name).toBe('Anestesiteam');
    expect(r.gap).toBe(2);
  });

  it('raising postop-platser to 6 in what-if gives capacity 4 limited by anestesiteam', () => {
    const r = computeCapacity(surgery, { 'Postop-platser': 6 });
    expect(r.capacity).toBe(4);
    expect(r.limiting.map((c) => c.name)).toEqual(['Anestesiteam']);
  });

  it('writes the Swedish capacity sentence', () => {
    const s = capacitySentence(computeCapacity(surgery));
    expect(s.now).toBe('Kapacitet nu: 2 akuta operationer möjliga nu, begränsas av postop-platser (2 tillgängliga).');
    expect(s.next).toBe('Om 2 postop-platser frigörs möjliggörs 2 till; nästa begränsning är anestesiteam (4).');
  });

  it('IVA Huddinge is at 0 with three equally limiting components joined by "och"', () => {
    const r = computeCapacity(intensive);
    expect(r.capacity).toBe(0);
    expect(r.limiting).toHaveLength(3);
    expect(capacitySentence(r).now).toContain(' och ');
  });

  it('clamps overrides to 0..total and detects real changes', () => {
    expect(computeCapacity(surgery, { 'Postop-platser': 99 }).components.find((c) => c.name === 'Postop-platser')?.available).toBe(14);
    expect(hasOverrides(surgery, { 'Postop-platser': 2 })).toBe(false);
    expect(hasOverrides(surgery, { 'Postop-platser': 3 })).toBe(true);
  });
});
