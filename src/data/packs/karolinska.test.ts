import { describe, expect, it } from 'vitest';
import type { Figure } from './types';
import { KAROLINSKA_PACK, REGION_FIGURES } from './karolinska';
import { collectFigures } from '@/lib/sources';

const pack = KAROLINSKA_PACK;
const count = <T,>(list: T[], pred: (t: T) => boolean) => list.filter(pred).length;

describe('patients per site (SPEC.md § 6.7)', () => {
  for (const site of ['solna', 'huddinge'] as const) {
    const patients = pack.patientsBySite[site];
    it(`${site}: 40 patients with unique ids and pins, wards from DATA.md § 5.1`, () => {
      expect(patients).toHaveLength(40);
      expect(new Set(patients.map((p) => p.id)).size).toBe(40);
      expect(new Set(patients.map((p) => p.pin)).size).toBe(40);
      expect(patients.every((p) => p.nodeId === site)).toBe(true);
      const wardNames = new Set(pack.wards.filter((w) => w.site === site).map((w) => w.name));
      expect(patients.every((p) => wardNames.has(p.ward))).toBe(true);
    });

    it(`${site}: stability 22 / 12 / 6, transport 14 / 10 / 12 / 2 / 2, equipment 18 / 10 / 8 / 6, 12 home care eligible`, () => {
      expect(count(patients, (p) => p.stability === 'Stable')).toBe(22);
      expect(count(patients, (p) => p.stability === 'Monitor')).toBe(12);
      expect(count(patients, (p) => p.stability === 'Critical')).toBe(6);
      expect(count(patients, (p) => p.transport === 'Walking')).toBe(14);
      expect(count(patients, (p) => p.transport === 'Wheelchair')).toBe(10);
      expect(count(patients, (p) => p.transport === 'Stretcher')).toBe(12);
      expect(count(patients, (p) => p.transport === 'Ambulance')).toBe(2);
      expect(count(patients, (p) => p.transport === 'Intensive care transport')).toBe(2);
      expect(count(patients, (p) => p.equipment.length === 0)).toBe(18);
      expect(count(patients, (p) => p.equipment.includes('Oxygen'))).toBe(10);
      expect(count(patients, (p) => p.equipment.includes('IV infusion'))).toBe(8);
      expect(count(patients, (p) => p.equipment.includes('Monitoring'))).toBe(6);
      const eligible = patients.filter((p) => p.homeCareEligible);
      expect(eligible).toHaveLength(12);
      expect(eligible.every((p) => p.stability === 'Stable' && (p.transport === 'Walking' || p.transport === 'Wheelchair'))).toBe(true);
    });

    it(`${site}: ages 24–91 and pins consistent with the age on 4 September 2026`, () => {
      for (const p of patients) {
        expect(p.age).toBeGreaterThanOrEqual(24);
        expect(p.age).toBeLessThanOrEqual(91);
        expect(p.pin).toMatch(/^\d{8}-\d{4}$/);
        const y = Number(p.pin.slice(0, 4));
        const m = Number(p.pin.slice(4, 6));
        const d = Number(p.pin.slice(6, 8));
        const today = Date.UTC(2026, 8, 4);
        const ageAtToday = 2026 - y - (Date.UTC(2026, m - 1, d) > today ? 1 : 0);
        expect(ageAtToday).toBe(p.age);
      }
    });
  }

  it('uses no name that belongs to a person in DATA.md § 7', () => {
    const staffNames = new Set(pack.staff.map((s) => s.name));
    const all = [...pack.patientsBySite.solna, ...pack.patientsBySite.huddinge];
    expect(all.every((p) => !staffNames.has(`${p.givenName} ${p.familyName}`))).toBe(true);
    expect(new Set(all.map((p) => `${p.familyName}, ${p.givenName}`)).size).toBe(80);
  });
});

describe('pack shape (DATA.md § 1–8)', () => {
  it('has 2 sites, 6 region hospitals, 5 classes and Ambulanssjukvården', () => {
    const ids = pack.nodes.map((n) => n.id);
    expect(ids).toEqual(['solna', 'huddinge', 'sos', 'ds', 'stgoran', 'sodertalje', 'norrtalje', 'ersta', 'geriatrik', 'palliativ', 'rehab', 'psykiatri', 'asih', 'ambulans']);
    expect(count(pack.nodes, (n) => n.type === 'Hospital')).toBe(8);
    expect(count(pack.nodes, (n) => n.type === 'Capacity class')).toBe(4);
    expect(pack.nodes.find((n) => n.id === 'asih')).toMatchObject({ type: 'Home care', radiusKm: 25, accepts: ['Home'] });
    expect(pack.nodes.find((n) => n.id === 'ambulans')?.type).toBe('Transport');
  });

  it('ladder: 1 600 / 1 070 / 915 / 1 038 / 32 with confidence reported / estimate / verified / illustrative / illustrative', () => {
    const k = pack.ladders.karolinska;
    expect(k.map((s) => s.figure.value)).toEqual([1600, 1070, 915, 1038, 32]);
    expect(k.map((s) => s.figure.confidence)).toEqual(['reported', 'estimate', 'verified', 'illustrative', 'illustrative']);
    expect(pack.ladders.solna.map((s) => s.figure.value)).toEqual([775, 520, 443, 497, 23]);
    expect(pack.ladders.huddinge.map((s) => s.figure.value)).toEqual([825, 550, 472, 541, 9]);
  });

  it('IVA totals are verified (S5) and sum to 27; region hospitals have unknown IVA except S:t Göran', () => {
    const solna = pack.nodes.find((n) => n.id === 'solna')!;
    const huddinge = pack.nodes.find((n) => n.id === 'huddinge')!;
    expect(solna.intensiveCare!.total).toMatchObject({ value: 18, confidence: 'verified', source: 'S5' });
    expect(huddinge.intensiveCare!.total).toMatchObject({ value: 9, confidence: 'verified', source: 'S5' });
    expect(pack.nodes.find((n) => n.id === 'sos')!.intensiveCare!.total.value).toBeNull();
    expect(pack.nodes.find((n) => n.id === 'stgoran')!.intensiveCare!.total).toMatchObject({ value: 8, confidence: 'estimate' });
  });

  it('has PB1–PB5; PB1 has 8 roles, 15 tasks in 5 areas, 5 channels, 4 targets; PB2 sets the outage; PB4 navigates; PB5 ticks days', () => {
    expect(pack.playbooks.map((p) => p.code)).toEqual(['PB1', 'PB2', 'PB3', 'PB4', 'PB5']);
    const pb1 = pack.playbooks[0];
    expect(pb1.roles).toHaveLength(8);
    expect(pb1.tasks).toHaveLength(15);
    expect(new Set(pb1.tasks.map((t) => t.area)).size).toBe(5);
    expect(pb1.channels).toHaveLength(5);
    expect(pb1.targets).toHaveLength(4);
    expect(pb1.defaultLage).toBe('Förstärkningsläge');
    expect(pack.playbooks[1]).toMatchObject({ setsEhrOutage: true, defaultLage: 'Stabsläge' });
    expect(pack.playbooks[2].defaultLage).toBe('Stabsläge');
    expect(pack.playbooks[3].navigateTo).toBe('/evakuering');
    expect(pack.playbooks[4]).toMatchObject({ tickDays: true });
    expect(pack.playbooks[4].targets[0]).toMatchObject({ withinUnit: 'dygn', withinMin: 14400 });
    expect(pb1.tasks.some((t) => t.title.sv === 'Anmäl läget till TiB och RSSL')).toBe(true);
  });

  it('resource counts add up to the total for every row, including "Ej i tjänst"', () => {
    for (const r of pack.resources) {
      expect(r.available + r.inUse + r.reserved + r.outOfService + r.notInService + r.inTransit + r.unknown).toBe(r.total);
    }
    expect(pack.resources.find((r) => r.nodeId === 'ambulans' && r.name === 'Akutambulans')).toMatchObject({ total: 100, available: 12, inUse: 60, notInService: 28 });
  });

  it('seeds five requests, three messages, 13 fictional people and 12 + 12 queue rows', () => {
    expect(pack.requests.map((r) => r.id)).toEqual(['req-1', 'req-2', 'req-3', 'req-4', 'req-5']);
    expect(pack.requests[2].fromNodeId).toBe('ambulans');
    expect(pack.messages).toHaveLength(3);
    expect(pack.staff).toHaveLength(13);
    expect(pack.bedRequests).toHaveLength(12);
    expect(pack.dischargeReady).toHaveLength(12);
    expect(pack.dischargeReady.filter((d) => d.asihEligible)).toHaveLength(7);
    expect(pack.scenarios.map((s) => s.key)).toEqual(['masskada', 'tryck', 'journalbortfall', 'mottagande', 'pandemi', 'siteevac']);
  });

  it('has all 22 source keys S1–S22 and every figure references a known source', () => {
    const keys = pack.sources.map((s) => s.key);
    expect(keys).toEqual(['S1', 'S2', 'S3', 'S4a', 'S4b', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22']);
    const known = new Set(keys);
    const entries = collectFigures(pack);
    expect(entries.length).toBeGreaterThan(100);
    for (const e of entries) {
      expect(['verified', 'reported', 'estimate', 'illustrative']).toContain(e.figure.confidence);
      if (e.figure.source) expect(known.has(e.figure.source)).toBe(true);
      if (e.figure.confidence === 'verified') expect(e.figure.source).toBeDefined();
      if (e.figure.confidence === 'estimate' || e.figure.confidence === 'illustrative') expect(e.figure.basis).toBeDefined();
    }
    // every source key is referenced by at least one verified or reported figure
    const referenced = new Set(entries.filter((e) => e.figure.confidence === 'verified' || e.figure.confidence === 'reported').map((e) => e.figure.source));
    for (const k of keys) expect(referenced.has(k)).toBe(true);
  });

  it('flow metrics cover both sites for every key and the baseline of DATA.md § 4', () => {
    const keys = new Set(pack.flowMetrics.map((m) => m.key));
    for (const k of keys) expect(pack.flowMetrics.filter((m) => m.key === k).map((m) => m.site).sort()).toEqual(['huddinge', 'solna']);
    const v = (key: string, site: 'solna' | 'huddinge') => pack.flowMetrics.find((m) => m.key === key && m.site === site)!.value.value;
    expect(v('akuten.waitingBed', 'huddinge')).toBe(17);
    expect(v('beds.belagda', 'solna')).toBe(497);
    expect(v('beds.overbelaggning', 'huddinge')).toBe(6);
    expect(v('op.cancelled', 'solna')).toBe(3);
    expect(v('iva.occupied', 'huddinge')).toBe(9);
    expect(v('staff.vacant', 'huddinge')).toBe(12);
  });

  it('region figures carry sources', () => {
    expect(REGION_FIGURES.every((r: { figure: Figure }) => r.figure.source || r.figure.basis)).toBe(true);
  });
});

describe('Hospital at Home pack (SPEC.md § 11.4, DATA.md § 11)', () => {
  const ZONE_COUNTS: Record<string, number> = {
    solna: 25, innerstaden: 20, bromma: 15, sodermalm: 15, soderort: 20, huddinge: 20, botkyrka: 10, nacka: 10, lidingo: 5, taby: 10,
  };
  const TEAMS: Record<string, string> = {
    solna: 'ASIH Nord', bromma: 'ASIH Nord', lidingo: 'ASIH Nord', taby: 'ASIH Nord',
    innerstaden: 'ASIH City', sodermalm: 'ASIH City', nacka: 'ASIH City',
    soderort: 'ASIH Syd', huddinge: 'ASIH Syd', botkyrka: 'ASIH Sydväst',
  };
  const BATTERY: Record<string, [number, number]> = { Monitoring: [10, 24], Oxygen: [2, 6], 'IV infusion': [6, 12], 'Home ventilator': [4, 10] };
  const km = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const dLat = (bLat - aLat) * 111.32;
    const dLng = (bLng - aLng) * 111.32 * Math.cos((aLat * Math.PI) / 180);
    return Math.hypot(dLat, dLng);
  };

  it('has 150 patients with unique ids and the zone counts of SPEC.md § 11.4', () => {
    expect(pack.homePatients).toHaveLength(150);
    expect(new Set(pack.homePatients.map((p) => p.id)).size).toBe(150);
    expect(pack.homeZones.map((z) => z.id)).toEqual(Object.keys(ZONE_COUNTS));
    for (const [zone, n] of Object.entries(ZONE_COUNTS)) expect(count(pack.homePatients, (p) => p.zone === zone), zone).toBe(n);
  });

  it('places every patient inside its zone radius and assigns the team by zone', () => {
    for (const p of pack.homePatients) {
      const z = pack.homeZones.find((x) => x.id === p.zone)!;
      expect(km(z.lat, z.lng, p.lat, p.lng), p.id).toBeLessThanOrEqual(z.radiusKm);
      expect(p.team).toBe(TEAMS[p.zone]);
    }
  });

  it('derives equipment, battery and criticality as specified', () => {
    for (const p of pack.homePatients) {
      const powered = p.equipment.find((e) => e !== 'Home dialysis');
      expect(p.equipment.length).toBeLessThanOrEqual(2);
      expect(p.elCritical).toBe(p.equipment.some((e) => e === 'Oxygen' || e === 'IV infusion' || e === 'Home ventilator'));
      expect(p.waterCritical).toBe(p.equipment.includes('Home dialysis'));
      if (powered) {
        const [lo, hi] = BATTERY[powered];
        expect(Number.isInteger(p.batteryHours)).toBe(true);
        expect(p.batteryHours!).toBeGreaterThanOrEqual(lo);
        expect(p.batteryHours!).toBeLessThanOrEqual(hi);
      } else {
        expect(p.batteryHours).toBeNull();
      }
    }
    expect(count(pack.homePatients, (p) => p.elCritical)).toBeGreaterThan(0);
    expect(count(pack.homePatients, (p) => p.waterCritical)).toBeGreaterThan(0);
    expect(count(pack.homePatients, (p) => p.visitToday)).toBeGreaterThan(30);
  });

  it('uses no staff name and no name of a hospital patient', () => {
    const staffNames = new Set(pack.staff.map((s) => s.name));
    const hospital = new Set([...pack.patientsBySite.solna, ...pack.patientsBySite.huddinge].map((p) => `${p.givenName} ${p.familyName}`));
    const names = pack.homePatients.map((p) => `${p.givenName} ${p.familyName}`);
    expect(new Set(names).size).toBe(150);
    expect(names.every((n) => !staffNames.has(n) && !hospital.has(n))).toBe(true);
  });

  it('has the ten zones with Places coordinates (reported) and a vertex of their own', () => {
    expect(pack.homeZones).toHaveLength(10);
    for (const z of pack.homeZones) {
      expect(z.coordConfidence).toBe('reported');
      expect(z.coordSource).toContain('Google Places');
      expect(z.graphNode).toBe(`zone:${z.id}`);
      expect(z.name.sv && z.name.en).toBeTruthy();
    }
    expect(pack.homeZones.find((z) => z.id === 'sodermalm')).toMatchObject({ lat: 59.3125, lng: 18.0616, radiusKm: 1.8 });
  });

  it('has 17 infrastructure nodes (5 water, 5 el, 7 roads), each with a coordSource, role and status in both languages', () => {
    expect(count(pack.infraNodes, (n) => n.layer === 'water')).toBe(5);
    expect(count(pack.infraNodes, (n) => n.layer === 'el')).toBe(5);
    expect(count(pack.infraNodes, (n) => n.layer === 'roads')).toBe(7);
    expect(new Set(pack.infraNodes.map((n) => n.id)).size).toBe(17);
    for (const n of pack.infraNodes) {
      expect(n.coordSource.length, n.id).toBeGreaterThan(0);
      for (const text of [n.name, n.role, n.status]) expect(text.sv.length && text.en.length, n.id).toBeGreaterThan(0);
    }
    // Only the regional grid is unverified; its coordinate is illustrative.
    expect(pack.infraNodes.filter((n) => !n.verified).map((n) => n.id)).toEqual(['e-regionnat']);
    expect(pack.infraNodes.find((n) => n.id === 'e-regionnat')!.coordConfidence).toBe('illustrative');
    expect(pack.infraNodes.find((n) => n.id === 'w-gorvaln')!.coordConfidence).toBe('estimate');
    expect(pack.infraNodes.find((n) => n.id === 'r-centralbron')).toMatchObject({ coordConfidence: 'reported', lat: 59.3264, lng: 18.0635 });
    expect(pack.infraNodes.find((n) => n.id === 'e-overby')).toMatchObject({ lat: 59.4757, lng: 17.8844 });
  });

  it('carries confidence and a known source on every infrastructure figure', () => {
    const known = new Set(pack.homeSources.map((s) => s.key));
    expect(pack.homeSources.map((s) => s.key)).toEqual(Array.from({ length: 14 }, (_, i) => `S-H${i + 1}`));
    const figures = pack.infraNodes.flatMap((n) => n.figures ?? []);
    expect(figures.length).toBe(5);
    for (const f of figures) {
      expect(['verified', 'reported', 'estimate', 'illustrative']).toContain(f.confidence);
      expect(known.has(f.source!)).toBe(true);
    }
    const essing = pack.infraNodes.find((n) => n.id === 'r-essingeleden')!.figures![0];
    expect(essing).toMatchObject({ value: 140000, valueMax: 170000, confidence: 'verified', source: 'S-H12' });
    expect(pack.infraNodes.find((n) => n.id === 'r-centralbron')!.figures![0]).toMatchObject({ value: 102000, confidence: 'reported', source: 'S-H13' });
  });

  it('resolves every link endpoint to a site, a zone vertex or an infrastructure node', () => {
    const sites = new Set(['solna', 'huddinge']);
    const zones = new Set(pack.homeZones.map((z) => z.graphNode));
    const nodes = new Set(pack.infraNodes.map((n) => n.id));
    const roadNodes = new Set(pack.infraNodes.filter((n) => n.layer === 'roads').map((n) => n.id));
    expect(new Set(pack.infraLinks.map((l) => l.id)).size).toBe(pack.infraLinks.length);
    for (const l of pack.infraLinks) {
      for (const end of [l.a, l.b]) {
        expect(sites.has(end) || zones.has(end) || nodes.has(end), `${l.id}: ${end}`).toBe(true);
        if (l.layer === 'roads') expect(sites.has(end) || zones.has(end) || roadNodes.has(end), `${l.id}: ${end}`).toBe(true);
      }
      if (l.offmap) expect(l.offmap.text.sv && l.offmap.text.en).toBeTruthy();
    }
    // The hand-made corridor links are gone; the roads come from OpenStreetMap (SPEC.md § 12.4).
    expect(count(pack.infraLinks, (l) => l.layer === 'roads')).toBe(0);
    expect(count(pack.infraLinks, (l) => l.layer === 'water')).toBe(12);
    expect(count(pack.infraLinks, (l) => l.layer === 'el')).toBe(7); // the hand-drawn line between nodes is replaced by power.json (SPEC.md § 12.5)
    expect(count(pack.infraLinks, (l) => !!l.offmap)).toBe(6);
  });

  it('keeps the three flag presets of SPEC.md § 11.5', () => {
    expect(pack.homePresets.map((p) => p.key)).toEqual(['bridge', 'power', 'water']);
    expect(pack.homePresets[0].blockedNodes).toEqual(['r-essingeleden', 'r-centralbron']);
  });
});
