import { describe, expect, it } from 'vitest';
import { CAPABILITIES } from '@/data/mock';
import { capacitySentence, computeCapacity, hasOverrides } from './capacity';

const surgery = CAPABILITIES.find((c) => c.id === 'emergency-surgery')!;
const intensive = CAPABILITIES.find((c) => c.id === 'intensive-care')!;

describe('computeCapacity', () => {
  it('Emergency surgery: capacity 2 limited by Post-operative beds, next Anaesthesia teams with gap 2', () => {
    const r = computeCapacity(surgery);
    expect(r.capacity).toBe(2);
    expect(r.limiting.map((c) => c.name)).toEqual(['Post-operative beds']);
    expect(r.next?.name).toBe('Anaesthesia teams');
    expect(r.next?.available).toBe(4);
    expect(r.gap).toBe(2);
  });

  it('raising Post-operative beds to 6 in what-if gives capacity 4 limited by Anaesthesia teams', () => {
    const r = computeCapacity(surgery, { 'Post-operative beds': 6 });
    expect(r.capacity).toBe(4);
    expect(r.limiting.map((c) => c.name)).toEqual(['Anaesthesia teams']);
    expect(r.next?.name).toBe('Surgeons on site');
    expect(r.gap).toBe(1);
  });

  it('lists several limiting components joined by "and"', () => {
    const r = computeCapacity(intensive);
    expect(r.capacity).toBe(3);
    expect(r.limiting.map((c) => c.name)).toEqual(['Equipped bed slots (ventilator, monitoring)', 'Medication and material covered']);
    const s = capacitySentence(r);
    expect(s.now).toBe(
      'Capacity now: 3 beds available, limited by Equipped bed slots (ventilator, monitoring) and Medication and material covered (3 available).',
    );
    expect(s.next).toBe(
      'Freeing 1 Equipped bed slots (ventilator, monitoring) and Medication and material covered would allow 1 more; the next constraint is Staffed bed slots (4).',
    );
  });

  it('produces the capacity sentence for Emergency surgery', () => {
    const s = capacitySentence(computeCapacity(surgery));
    expect(s.now).toBe('Capacity now: 2 surgeries possible now, limited by Post-operative beds (2 available).');
    expect(s.next).toBe('Freeing 2 Post-operative beds would allow 2 more; the next constraint is Anaesthesia teams (4).');
  });

  it('has no next constraint when every component is equally limiting', () => {
    const r = computeCapacity({ id: 'x', nodeId: 'vikby', name: 'X', unit: 'u', components: [{ name: 'A', total: 2, available: 1 }] });
    expect(r.next).toBeUndefined();
    expect(capacitySentence(r).next).toBeUndefined();
  });

  it('clamps overrides to 0..total and detects real changes', () => {
    const r = computeCapacity(surgery, { 'Post-operative beds': 99 });
    expect(r.components.find((c) => c.name === 'Post-operative beds')?.available).toBe(12);
    expect(hasOverrides(surgery, { 'Post-operative beds': 2 })).toBe(false);
    expect(hasOverrides(surgery, { 'Post-operative beds': 3 })).toBe(true);
  });
});
