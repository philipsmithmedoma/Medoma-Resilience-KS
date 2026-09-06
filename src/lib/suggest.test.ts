import { describe, expect, it } from 'vitest';
import { NODES, PATIENTS, RESOURCES } from '@/data/mock';
import { suggestMoves } from './suggest';

describe('suggestMoves (SPEC.md § 6.3)', () => {
  const result = suggestMoves(PATIENTS, NODES, RESOURCES);
  const byId = new Map(PATIENTS.map((p) => [p.id, p]));
  const dest = (id: string) => result.suggestions.filter((s) => s.destinationId === id);

  it('places 32 patients and leaves 8 (4 Critical, 4 Stable) unplaced with the initial dataset', () => {
    expect(result.suggestions).toHaveLength(32);
    expect(result.unplaced).toHaveLength(8);
    expect(result.unplaced.filter((p) => p.stability === 'Critical')).toHaveLength(4);
    expect(result.unplaced.filter((p) => p.stability === 'Stable')).toHaveLength(4);
  });

  it('sends Critical patients to Sjöberga while its intensive care lasts (2)', () => {
    const critical = dest('sjoberga').filter((s) => byId.get(s.patientId)!.stability === 'Critical');
    expect(critical).toHaveLength(2);
  });

  it('sends Monitor patients to Ekhaga while monitors last (4), then Sjöberga acute beds (8)', () => {
    const monitorAtEkhaga = dest('ekhaga').filter((s) => byId.get(s.patientId)!.stability === 'Monitor');
    const monitorAtSjoberga = dest('sjoberga').filter((s) => byId.get(s.patientId)!.stability === 'Monitor');
    expect(monitorAtEkhaga).toHaveLength(4);
    expect(monitorAtSjoberga).toHaveLength(8);
  });

  it('sends home-care-eligible Stable patients to Hemsjukvård while places last (8), other Stable to Ekhaga (10)', () => {
    const home = dest('hemsjukvard');
    expect(home).toHaveLength(8);
    expect(home.every((s) => byId.get(s.patientId)!.homeCareEligible)).toBe(true);
    const stableAtEkhaga = dest('ekhaga').filter((s) => byId.get(s.patientId)!.stability === 'Stable');
    expect(stableAtEkhaga).toHaveLength(10);
    // Fältsjukhus Alfa is Standing up, so nobody goes there.
    expect(dest('falt-alfa')).toHaveLength(0);
  });

  it('never exceeds free counts: Ekhaga 14 beds, Sjöberga 12 beds + 2 intensive, Hemsjukvård 8 places', () => {
    expect(dest('ekhaga')).toHaveLength(14);
    expect(dest('sjoberga')).toHaveLength(10);
    expect(dest('hemsjukvard')).toHaveLength(8);
  });

  it('uses Fältsjukhus Alfa for other Stable patients once it is Operational', () => {
    const nodes = NODES.map((n) => (n.id === 'falt-alfa' ? { ...n, status: 'Operational' as const } : n));
    const r = suggestMoves(PATIENTS, nodes, RESOURCES);
    const alfa = r.suggestions.filter((s) => s.destinationId === 'falt-alfa');
    expect(alfa).toHaveLength(12);
    expect(r.unplaced).toHaveLength(4); // only the 4 Critical remain
  });

  it('skips patients that already have a plan', () => {
    const patients = PATIENTS.map((p, i) => (i === 0 ? { ...p, move: { destinationId: 'sjoberga', status: 'Planned' as const, suggested: false } } : p));
    const r = suggestMoves(patients, NODES, RESOURCES);
    expect(r.suggestions.some((s) => s.patientId === patients[0].id)).toBe(false);
  });
});
