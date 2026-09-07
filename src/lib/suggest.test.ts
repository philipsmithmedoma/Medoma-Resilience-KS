import { describe, expect, it } from 'vitest';
import { KAROLINSKA_PACK, NODES } from '@/data/packs/karolinska';
import { suggestMoves } from './suggest';

const patients = [...KAROLINSKA_PACK.patientsBySite.solna, ...KAROLINSKA_PACK.patientsBySite.huddinge];

describe('suggestMoves (SPEC.md § 6.7)', () => {
  const result = suggestMoves(patients, NODES, 'huddinge');
  const byId = new Map(patients.map((p) => [p.id, p]));
  const dest = (id: string) => result.suggestions.filter((s) => s.destinationId === id);

  it('only proposes for the source site and respects free counts', () => {
    expect(result.suggestions.every((s) => byId.get(s.patientId)!.nodeId === 'huddinge')).toBe(true);
    expect(result.suggestions.length + result.unplaced.length).toBe(40);
  });

  it('Kritisk → Solna while its 2 free IVA beds last; the other 4 are unplaced', () => {
    const critical = dest('solna').filter((s) => byId.get(s.patientId)!.stability === 'Critical');
    expect(critical).toHaveLength(2);
    expect(result.unplaced.filter((p) => p.stability === 'Critical')).toHaveLength(4);
  });

  it('Övervakning → region hospitals by distance while free beds last', () => {
    const monitor = result.suggestions.filter((s) => byId.get(s.patientId)!.stability === 'Monitor');
    expect(monitor).toHaveLength(12);
    // Södersjukhuset is the nearest region hospital to Huddinge and has 14 free beds, so all 12 go there.
    expect(monitor.every((s) => s.destinationId === 'sos')).toBe(true);
    expect(dest('sos')).toHaveLength(14);
  });

  it('Stabil eligible → ASIH, Stabil 75+ → Geriatrik, other Stabil → nearest region hospital', () => {
    const asih = dest('asih');
    expect(asih).toHaveLength(12);
    expect(asih.every((s) => byId.get(s.patientId)!.homeCareEligible)).toBe(true);
    const geriatrik = dest('geriatrik');
    expect(geriatrik.every((s) => byId.get(s.patientId)!.age >= 75 && byId.get(s.patientId)!.stability === 'Stable')).toBe(true);
    expect(geriatrik.length).toBeGreaterThan(0);
  });

  it('a stood-up operational vårdhubb takes Stabil patients once the region hospitals are full', () => {
    const hub = { ...NODES[0], id: 'node-101', name: 'Vårdhubb Kista', shortName: 'Kista', type: 'Care hub' as const, site: undefined, parent: undefined, intensiveCare: undefined, beds: { total: { value: 40, confidence: 'illustrative' as const }, free: { value: 40, confidence: 'illustrative' as const } }, accepts: ['Ward' as const] };
    const fullRegion = NODES.map((n) => (n.type === 'Hospital' && !n.site ? { ...n, beds: { ...n.beds!, free: { ...n.beds!.free, value: 0 } } } : n));
    const r = suggestMoves(patients, [...fullRegion, hub], 'solna');
    expect(r.suggestions.filter((s) => s.destinationId === 'node-101').length).toBeGreaterThan(0);
    // Kritisk from Solna go to Huddinge, which has 0 free IVA beds → all unplaced.
    expect(r.unplaced.filter((p) => p.stability === 'Critical')).toHaveLength(6);
  });

  it('skips patients that already have a plan', () => {
    const planned = patients.map((p) => (p.id === 'ph-1' ? { ...p, move: { destinationId: 'sos', status: 'Planned' as const, suggested: false } } : p));
    const r = suggestMoves(planned, NODES, 'huddinge');
    expect(r.suggestions.some((s) => s.patientId === 'ph-1')).toBe(false);
  });
});
