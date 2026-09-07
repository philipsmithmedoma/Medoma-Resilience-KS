import { describe, expect, it } from 'vitest';
import type { ScenarioInputs } from '@/data/types';
import { KAROLINSKA_PACK } from '@/data/packs/karolinska';
import { crosses, horizonFor, masskadaCasualties, simulate } from './scenario';

const preset = (key: string) => KAROLINSKA_PACK.scenarios.find((s) => s.key === key)!;

/** The DATA.md baseline as the store captures it at 14:40. */
const INPUTS: ScenarioInputs = {
  tickMin: 15,
  horizonTicks: 16,
  sites: {
    solna: { akutrum: 6, overvakning: 20, behandlingsrum: 16, ctScanners: 3, orSlots: 2, ivaFree: 2, imaFree: 1, bedsFree: 23, bloodUnits: 22, edPatients: 22, asihEligible: 5 },
    huddinge: { akutrum: 4, overvakning: 25, behandlingsrum: 25, ctScanners: 3, orSlots: 3, ivaFree: 0, imaFree: 0, bedsFree: 9, bloodUnits: 16, edPatients: 84, asihEligible: 8 },
  },
  akutambulans: 12,
  regionNodes: [
    { id: 'sos', name: 'Södersjukhuset', shortName: 'SÖS', free: 14 },
    { id: 'ds', name: 'Danderyds sjukhus', shortName: 'DS', free: 11 },
    { id: 'stgoran', name: 'Capio S:t Görans sjukhus', shortName: 'S:t Göran', free: 9 },
    { id: 'sodertalje', name: 'Södertälje sjukhus', shortName: 'Södertälje', free: 6 },
    { id: 'norrtalje', name: 'Norrtälje sjukhus (Tiohundra)', shortName: 'Norrtälje', free: 4 },
    { id: 'ersta', name: 'Ersta sjukhus', shortName: 'Ersta', free: 2 },
  ],
};

const pool = (series: ReturnType<typeof simulate>['series'], pool: string, site: string) => series.map((r) => r.pools.find((p) => p.pool === pool && p.site === site)!);

describe('integer distribution with carry', () => {
  it('spreads 60 % over 12 patients as 7 and 50 % as 6', () => {
    expect([...Array(12).keys()].filter((j) => crosses(j, 0.6))).toHaveLength(7);
    expect([...Array(12).keys()].filter((j) => crosses(j, 0.5))).toHaveLength(6);
  });

  it('masskada defaults: 12 red, 24 yellow, 24 green; first arrival +20 min; yellow 50/50, green 30/40/30', () => {
    const c = masskadaCasualties(preset('masskada').params);
    expect(c).toHaveLength(60);
    expect(c.filter((x) => x.cat === 'rod')).toHaveLength(12);
    expect(c.filter((x) => x.cat === 'gul')).toHaveLength(24);
    expect(c.filter((x) => x.cat === 'gron')).toHaveLength(24);
    expect(c[0].arrival).toBe(20);
    expect(c.filter((x) => x.cat === 'rod').every((x) => x.site === 'solna')).toBe(true);
    expect(c.filter((x) => x.cat === 'gul' && x.site === 'solna')).toHaveLength(12);
    expect(c.filter((x) => x.cat === 'gron' && x.site === 'region')).toHaveLength(7);
    expect(c.filter((x) => x.cat === 'rod' && x.iva)).toHaveLength(7);
  });
});

describe('masskada (SPEC.md § 7.3)', () => {
  const params = preset('masskada').params;
  const base = simulate(INPUTS, 'masskada', params);

  it('is deterministic and covers the horizon', () => {
    expect(simulate(INPUTS, 'masskada', params)).toEqual(base);
    expect(base.series).toHaveLength(17);
    expect(base.series[0].pools.map((p) => p.pool)).toContain('akutambulans');
  });

  it('IVA Solna demand exceeds capacity within 2 h with defaults', () => {
    const iva = pool(base.series, 'iva', 'solna');
    const first = iva.findIndex((p) => p.demand > p.capacity);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(8);
    expect(iva[16].demand).toBe(7);
    expect(base.events[0].text).toBe('+20 min: Första skadade anländer till Solna');
    expect(base.events.some((e) => e.text.endsWith('IVA-platser Solna: brist') && e.tick <= 8)).toBe(true);
    expect(base.recommendations.find((r) => r.key === 'ima_overflow')?.applicable).toBe(true);
  });

  it('after ima_overflow (+6) IVA Solna demand stays within capacity for the horizon', () => {
    const after = simulate(INPUTS, 'masskada', params, { ima_overflow: 0 });
    expect(pool(after.series, 'iva', 'solna').every((p) => p.demand <= p.capacity)).toBe(true);
    expect(after.recommendations.find((r) => r.key === 'ima_overflow')?.applicable).toBe(false);
  });

  it('blood O-negativ Solna runs short (6 × 4 units against 22); akutrum Solna stays at its capacity of 6', () => {
    const blood = pool(base.series, 'blod_oneg', 'solna');
    expect(blood[16].demand).toBe(24);
    expect(blood.some((p) => p.demand > p.capacity)).toBe(true);
    expect(Math.max(...pool(base.series, 'akutrum', 'solna').map((p) => p.demand))).toBe(6);
  });
});

describe('pandemi (SPEC.md § 7.3)', () => {
  const params = preset('pandemi').params;
  it('without o_huset the deficit appears by day 3; with it never', () => {
    const without = simulate({ ...INPUTS, tickMin: 1440, horizonTicks: 14 }, 'pandemi', params);
    const iva = pool(without.series, 'iva', 'karolinska');
    const first = iva.findIndex((p) => p.demand > p.capacity);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(3);
    expect(without.recommendations.find((r) => r.key === 'o_huset')?.applicable).toBe(true);
    const withIt = simulate({ ...INPUTS, tickMin: 1440, horizonTicks: 14 }, 'pandemi', params, { o_huset: 0 });
    expect(pool(withIt.series, 'iva', 'karolinska').every((p) => p.demand <= p.capacity)).toBe(true);
    expect(pool(withIt.series, 'iva', 'karolinska')[14].capacity).toBe(66);
    expect(withIt.events[0].text).toBe('dag 1: IVA-behovet ökar med 3 per dygn');
  });
});

describe('mottagande (SPEC.md § 7.3)', () => {
  const params = preset('mottagande').params;
  const inputs = { ...INPUTS, horizonTicks: 48 };
  const r = simulate(inputs, 'mottagande', params);
  it('distributes 260 patients: 91 to Karolinska by free beds, the rest to region hospitals; nodes run out', () => {
    const last = r.series[48].pools;
    const total = last.reduce((n, p) => n + p.demand, 0);
    expect(total).toBe(260);
    const karolinska = last.filter((p) => p.site === 'solna' || p.site === 'huddinge').reduce((n, p) => n + p.demand, 0);
    expect(karolinska).toBe(91);
    expect(last.find((p) => p.site === 'sos')!.demand).toBeGreaterThan(14);
    expect(r.events.some((e) => e.text.includes('SÖS: vårdplatser slut'))).toBe(true);
    expect(r.recommendations.find((x) => x.key === 'vardhubb')?.applicable).toBe(true);
  });

  it('a vårdhubb applied at tick 4 opens at tick 8 and takes region-bound patients', () => {
    const withHub = simulate(inputs, 'mottagande', params, { vardhubb: 4 });
    const hub = pool(withHub.series, 'vardplatser', 'vardhubb');
    expect(hub[7].capacity).toBe(0);
    expect(hub[8].capacity).toBe(40);
    expect(hub[48].demand).toBe(40);
  });
});

describe('horizons', () => {
  it('derives ticks from the parameters', () => {
    expect(horizonFor(preset('journalbortfall'), { timmar: 6 })).toEqual({ tickMin: 15, horizonTicks: 24 });
    expect(horizonFor(preset('pandemi'), { dygn: 14 })).toEqual({ tickMin: 1440, horizonTicks: 14 });
    expect(horizonFor(preset('masskada'), preset('masskada').params)).toEqual({ tickMin: 15, horizonTicks: 16 });
  });
});
