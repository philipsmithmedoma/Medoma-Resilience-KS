import { describe, expect, it } from 'vitest';
import { KAROLINSKA_PACK as pack } from '@/data/packs/karolinska';
import type { HomePatient } from '@/data/types';
import { NO_DISRUPTIONS, disruptionCount, impact, prioritise, priorityTier, roadDistances, zoneStatus, type Disruptions, type ImpactRow } from './reachability';

const none = new Set<string>();
const set = (...ids: string[]) => new Set(ids);
const dis = (p: Partial<Disruptions>): Disruptions => ({ ...NO_DISRUPTIONS, ...p });
const links = pack.infraLinks;
const dist = (blockedNodes: Set<string>, sites: Array<'solna' | 'huddinge'>, blockedLinks = none) => roadDistances(links, blockedLinks, blockedNodes, sites);
const zv = (id: string) => `zone:${id}`;

describe('roadDistances (SPEC.md § 11.5)', () => {
  it('counts hops over road links from the sites in scope', () => {
    const d = dist(none, ['solna']);
    expect(d.get('solna')).toBe(0);
    expect(d.get(zv('solna'))).toBe(1);
    expect(d.get('r-norra-lanken')).toBe(1);
    expect(d.get('r-essingeleden')).toBe(2);
    expect(d.get(zv('soderort'))).toBe(3);
    expect(d.get('huddinge')).toBe(3);
    expect(d.get(zv('botkyrka'))).toBe(4);
    expect(dist(none, ['huddinge']).get('r-essingeleden')).toBe(1);
  });

  it('takes the minimum over several sites and ignores water and electricity links', () => {
    const both = dist(none, ['solna', 'huddinge']);
    expect(both.get('solna')).toBe(0);
    expect(both.get('huddinge')).toBe(0);
    expect(both.get(zv('soderort'))).toBe(2); // via Huddinge, not 3 via Essingeleden from Solna
    expect(both.has('w-gorvaln')).toBe(false);
    expect(both.has('e-overby')).toBe(false);
  });

  it('skips blocked links and links that touch blocked nodes', () => {
    const noLidingo = dist(none, ['solna'], set('rl-norra-lanken-lidingo'));
    expect(noLidingo.has(zv('lidingo'))).toBe(false);
    expect(noLidingo.has(zv('taby'))).toBe(true);
    const noNorra = dist(set('r-norra-lanken'), ['solna']);
    expect(noNorra.has('r-norra-lanken')).toBe(false);
    expect(noNorra.has(zv('taby'))).toBe(false);
    expect(noNorra.has(zv('innerstaden'))).toBe(true);
  });
});

describe('zoneStatus (SPEC.md § 11.5)', () => {
  const base = dist(none, ['solna']);
  it('is ok with nothing blocked', () => {
    expect(Object.values(zoneStatus(pack.homeZones, base, base)).every((s) => s === 'ok')).toBe(true);
  });
  it('marks a zone without a distance unreachable and a longer distance delayed', () => {
    const status = zoneStatus(pack.homeZones, base, dist(set('r-essingeleden'), ['solna']));
    expect(status.soderort).toBe('delayed');
    expect(status.solna).toBe('ok');
    const cut = zoneStatus(pack.homeZones, base, dist(none, ['solna'], set('rl-norra-lanken-lidingo')));
    expect(cut.lidingo).toBe('unreachable');
    expect(cut.taby).toBe('ok');
  });
});

describe('road scenarios (SPEC.md § 11.7 batch 4)', () => {
  const FIVE = set('r-essingeleden', 'r-centralbron', 'r-vasterbron', 'r-liljeholmsbron', 'r-skanstullsbron');
  const SOUTH = ['soderort', 'huddinge', 'botkyrka', 'nacka'];
  const NORTH = ['solna', 'innerstaden', 'bromma', 'taby', 'lidingo'];
  const status = (blocked: Set<string>, sites: Array<'solna' | 'huddinge'>) =>
    zoneStatus(pack.homeZones, dist(none, sites), dist(blocked, sites));

  it('blocking Essingeleden alone leaves Söderort reachable via Centralbron or Västerbron', () => {
    const d = dist(set('r-essingeleden'), ['solna']);
    expect(d.get(zv('soderort'))).toBe(5); // Solna, Innerstaden, a bridge, Södermalm, Liljeholmsbron, Söderort
    expect(status(set('r-essingeleden'), ['solna']).soderort).toBe('delayed');
    // Closing Centralbron as well: Västerbron still carries it; closing Västerbron too leaves no way across.
    expect(dist(set('r-essingeleden', 'r-centralbron'), ['solna']).get(zv('soderort'))).toBe(5);
    expect(dist(set('r-essingeleden', 'r-vasterbron'), ['solna']).get(zv('soderort'))).toBe(5);
    expect(dist(set('r-essingeleden', 'r-centralbron', 'r-vasterbron'), ['solna']).has(zv('soderort'))).toBe(false);
  });

  it('blocking the five crossings cuts every zone south of Saltsjö–Mälaren from Solna but not from Huddinge', () => {
    const fromSolna = status(FIVE, ['solna']);
    const fromHuddinge = status(FIVE, ['huddinge']);
    for (const z of SOUTH) {
      expect(fromSolna[z], `${z} from Solna`).toBe('unreachable');
      expect(fromHuddinge[z], `${z} from Huddinge`).not.toBe('unreachable');
    }
    // Södermalm's only road links are the bridges, so it is cut off from both sites; the north is the mirror image.
    expect(fromSolna.sodermalm).toBe('unreachable');
    expect(fromHuddinge.sodermalm).toBe('unreachable');
    for (const z of NORTH) {
      expect(fromSolna[z], `${z} from Solna`).not.toBe('unreachable');
      expect(fromHuddinge[z], `${z} from Huddinge`).toBe('unreachable');
    }
    // At Karolinska scope a patient is reachable from either site: only Södermalm stays cut off.
    const both = impact(pack, dis({ blockedNodes: FIVE }), ['solna', 'huddinge']);
    expect(both.summary.unreachableZones).toEqual(['sodermalm']);
    const solnaOnly = impact(pack, dis({ blockedNodes: FIVE }), ['solna']);
    expect(solnaOnly.summary.unreachableZones).toEqual(['sodermalm', 'soderort', 'huddinge', 'botkyrka', 'nacka']);
  });
});

describe('impact (SPEC.md § 11.5)', () => {
  const huddingeIds = pack.homePatients.filter((p) => p.zone === 'huddinge').map((p) => p.id);

  it('has no rows and an empty summary with nothing disrupted', () => {
    const r = impact(pack, NO_DISRUPTIONS, ['solna', 'huddinge']);
    expect(r.rows).toHaveLength(0);
    expect(r.summary).toMatchObject({ affected: 0, detour: 0, unreachable: 0, powerOut: 0, waterOut: 0, shortestBattery: null });
    expect(disruptionCount(NO_DISRUPTIONS)).toBe(0);
  });

  it('a power outage in Huddinge flags exactly the Huddinge patients', () => {
    const r = impact(pack, dis({ powerOutZones: set('huddinge') }), ['solna', 'huddinge']);
    expect(r.rows.map((x) => x.patient.id).sort()).toEqual([...huddingeIds].sort());
    expect(r.rows.every((x) => x.power && !x.unreachable && !x.delayed && x.reasons.join() === 'power')).toBe(true);
    expect(r.summary.affected).toBe(20);
    expect(r.summary.powerOut).toBe(20);
    const batteries = pack.homePatients.filter((p) => p.zone === 'huddinge' && p.elCritical).map((p) => p.batteryHours!);
    expect(r.summary.shortestBattery).toBe(batteries.length ? Math.min(...batteries) : null);
  });

  it('a water disruption counts the zone and its dialysis patients', () => {
    const r = impact(pack, dis({ waterOutZones: set('solna') }), ['solna', 'huddinge']);
    const inZone = pack.homePatients.filter((p) => p.zone === 'solna');
    expect(r.summary.waterOut).toBe(25);
    expect(r.summary.dialysis).toBe(inZone.filter((p) => p.waterCritical).length);
    expect(r.rows.every((x) => x.water && x.reasons.includes('water'))).toBe(true);
  });

  it('counts unreachable and detour patients, their zones, visits today and critical patients', () => {
    const r = impact(pack, dis({ blockedLinks: set('rl-norra-lanken-lidingo'), blockedNodes: set('r-essingeleden') }), ['solna']);
    const lidingo = pack.homePatients.filter((p) => p.zone === 'lidingo');
    expect(r.summary.unreachable).toBe(lidingo.length);
    expect(r.summary.unreachableZones).toEqual(['lidingo']);
    expect(r.summary.unreachableVisitToday).toBe(lidingo.filter((p) => p.visitToday).length);
    expect(r.summary.unreachableCritical).toBe(lidingo.filter((p) => p.elCritical || p.waterCritical).length);
    // Södermalm, Söderört, Huddinge, Botkyrka and Nacka are still reached, over the bridges.
    expect(r.summary.detour).toBeGreaterThan(0);
    expect(r.summary.affected).toBe(lidingo.length); // detour patients are rows but not "affected"
    expect(r.rows.some((x) => x.delayed && !x.affected)).toBe(true);
  });

  it('uses both sites when the scope yields none', () => {
    const d = dis({ blockedNodes: set('r-essingeleden') });
    expect(impact(pack, d, []).summary).toEqual(impact(pack, d, ['solna', 'huddinge']).summary);
  });
});

describe('prioritise (SPEC.md § 11.5)', () => {
  const patient = (id: string, o: Partial<HomePatient>): HomePatient => ({
    id, familyName: id, givenName: 'X', age: 70, zone: 'solna', lat: 0, lng: 0, team: 'ASIH Nord', equipment: [], batteryHours: null,
    visitToday: false, elCritical: false, waterCritical: false, ...o,
  });
  const row = (id: string, o: Partial<HomePatient>, f: Partial<ImpactRow>): ImpactRow => ({
    patient: patient(id, o), reasons: [], unreachable: false, delayed: false, power: false, water: false, affected: true, critical: false, ...f,
  });

  it('orders unreachable with a visit, power-out el-critical by battery, water-out dialysis, unreachable, other, detour', () => {
    const rows = [
      row('detour', {}, { delayed: true, affected: false }),
      row('unreach', {}, { unreachable: true }),
      row('dialysis', { waterCritical: true }, { water: true }),
      row('power-9h', { elCritical: true, batteryHours: 9 }, { power: true }),
      row('power-3h', { elCritical: true, batteryHours: 3 }, { power: true }),
      row('unreach-visit', { visitToday: true }, { unreachable: true }),
      row('power-plain', {}, { power: true }),
    ];
    expect(prioritise(rows).map((r) => r.patient.id)).toEqual(['unreach-visit', 'power-3h', 'power-9h', 'dialysis', 'unreach', 'power-plain', 'detour']);
    expect(prioritise(rows).map(priorityTier)).toEqual([1, 2, 2, 3, 4, 5, 6]);
  });

  it('breaks ties by battery ascending, a missing battery last, and does not change its input', () => {
    const rows = [
      row('b', { visitToday: true, batteryHours: 8 }, { unreachable: true }),
      row('a', { visitToday: true, batteryHours: 4 }, { unreachable: true }),
      row('c', { visitToday: true, batteryHours: null }, { unreachable: true }),
    ];
    expect(prioritise(rows).map((r) => r.patient.id)).toEqual(['a', 'b', 'c']);
    expect(rows.map((r) => r.patient.id)).toEqual(['b', 'a', 'c']);
  });
});
