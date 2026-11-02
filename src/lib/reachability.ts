// Hospital at Home reachability and impact – SPEC.md § 11.5. Pure: a breadth-first search over the road
// graph from the sites in scope, a status per zone, one row per affected patient and their priority order.
import type { DataPack, HomePatient, HomeZone, InfraLink, SiteId, ZoneId } from '@/data/types';

export const BOTH_SITES: SiteId[] = ['solna', 'huddinge'];

/** Minimum hop count per road-graph vertex; a vertex that cannot be reached is absent. */
export type Distances = Map<string, number>;

export type ZoneState = 'ok' | 'delayed' | 'unreachable';

/** Everything that can be disrupted. */
export interface Disruptions {
  blockedLinks: ReadonlySet<string>;
  blockedNodes: ReadonlySet<string>;
  powerOutZones: ReadonlySet<ZoneId>;
  waterOutZones: ReadonlySet<ZoneId>;
}

export const NO_DISRUPTIONS: Disruptions = {
  blockedLinks: new Set(),
  blockedNodes: new Set(),
  powerOutZones: new Set(),
  waterOutZones: new Set(),
};

export function disruptionCount(d: Disruptions): number {
  return d.blockedLinks.size + d.blockedNodes.size + d.powerOutZones.size + d.waterOutZones.size;
}

/**
 * Breadth-first hop counts from the given sites over the road links. A blocked link and a link that touches a
 * blocked node are not travelled; a blocked node is not entered. Returns the minimum hops per vertex.
 */
export function roadDistances(
  links: InfraLink[],
  blockedLinks: ReadonlySet<string>,
  blockedNodes: ReadonlySet<string>,
  fromSites: SiteId[],
): Distances {
  const adjacency = new Map<string, string[]>();
  for (const l of links) {
    if (l.layer !== 'roads' || blockedLinks.has(l.id) || blockedNodes.has(l.a) || blockedNodes.has(l.b)) continue;
    adjacency.set(l.a, [...(adjacency.get(l.a) ?? []), l.b]);
    adjacency.set(l.b, [...(adjacency.get(l.b) ?? []), l.a]);
  }
  const dist: Distances = new Map();
  const queue: string[] = [];
  for (const s of fromSites) {
    if (!dist.has(s)) {
      dist.set(s, 0);
      queue.push(s);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const v = queue[i];
    for (const next of adjacency.get(v) ?? []) {
      if (!dist.has(next)) {
        dist.set(next, dist.get(v)! + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}

/** `unreachable` when the zone's vertex has no distance, `delayed` when it is further than with nothing blocked, else `ok`. */
export function zoneStatus(zones: HomeZone[], baseline: Distances, current: Distances): Record<ZoneId, ZoneState> {
  const out: Record<ZoneId, ZoneState> = {};
  for (const z of zones) {
    const now = current.get(z.graphNode);
    const before = baseline.get(z.graphNode);
    out[z.id] = now === undefined ? 'unreachable' : before !== undefined && now > before ? 'delayed' : 'ok';
  }
  return out;
}

export type ImpactReason = 'unreachable' | 'detour' | 'power' | 'water';

export interface ImpactRow {
  patient: HomePatient;
  reasons: ImpactReason[]; // unreachable and detour are exclusive
  unreachable: boolean;
  delayed: boolean;
  power: boolean;
  water: boolean;
  /** Affected counts unreachable, power or water; a patient who only has a detour is a row but not affected. */
  affected: boolean;
  /** Affected and el- or water-critical (drives the ring on the map). */
  critical: boolean;
}

export interface ImpactSummary {
  affected: number;
  detour: number;
  unreachable: number;
  unreachableZones: ZoneId[];
  unreachableVisitToday: number;
  unreachableCritical: number; // el- or water-critical among the unreachable
  powerOut: number;
  shortestBattery: number | null; // among el-critical patients without power
  waterOut: number;
  dialysis: number; // water-critical among those with a water disruption
}

export interface Impact {
  rows: ImpactRow[]; // pack order; one row per patient with at least one flag
  summary: ImpactSummary;
  zoneStates: Record<ZoneId, ZoneState>;
}

export function impact(
  pack: Pick<DataPack, 'homeZones' | 'homePatients' | 'infraLinks'>,
  state: Disruptions,
  scopeSites: SiteId[],
): Impact {
  // A scope that yields no sites (a stood-up node) uses both Karolinska sites (SPEC.md § 11.1).
  const sites = scopeSites.length ? scopeSites : BOTH_SITES;
  const baseline = roadDistances(pack.infraLinks, new Set(), new Set(), sites);
  const current = roadDistances(pack.infraLinks, state.blockedLinks, state.blockedNodes, sites);
  const zoneStates = zoneStatus(pack.homeZones, baseline, current);

  const rows: ImpactRow[] = [];
  for (const p of pack.homePatients) {
    const unreachable = zoneStates[p.zone] === 'unreachable';
    const delayed = zoneStates[p.zone] === 'delayed';
    const power = state.powerOutZones.has(p.zone);
    const water = state.waterOutZones.has(p.zone);
    if (!unreachable && !delayed && !power && !water) continue;
    const reasons: ImpactReason[] = [];
    if (unreachable) reasons.push('unreachable');
    if (delayed) reasons.push('detour');
    if (power) reasons.push('power');
    if (water) reasons.push('water');
    const affected = unreachable || power || water;
    rows.push({ patient: p, reasons, unreachable, delayed, power, water, affected, critical: affected && (p.elCritical || p.waterCritical) });
  }

  const unreachableRows = rows.filter((r) => r.unreachable);
  const powerRows = rows.filter((r) => r.power);
  const waterRows = rows.filter((r) => r.water);
  const batteries = powerRows.filter((r) => r.patient.elCritical && r.patient.batteryHours !== null).map((r) => r.patient.batteryHours!);
  const summary: ImpactSummary = {
    affected: rows.filter((r) => r.affected).length,
    detour: rows.filter((r) => r.delayed).length,
    unreachable: unreachableRows.length,
    unreachableZones: pack.homeZones.filter((z) => zoneStates[z.id] === 'unreachable').map((z) => z.id),
    unreachableVisitToday: unreachableRows.filter((r) => r.patient.visitToday).length,
    unreachableCritical: unreachableRows.filter((r) => r.patient.elCritical || r.patient.waterCritical).length,
    powerOut: powerRows.length,
    shortestBattery: batteries.length ? Math.min(...batteries) : null,
    waterOut: waterRows.length,
    dialysis: waterRows.filter((r) => r.patient.waterCritical).length,
  };
  return { rows, summary, zoneStates };
}

/**
 * Priority tier of a row, 1 first: unreachable with a visit today, power-out el-critical, water-out dialysis,
 * unreachable, any other power or water disruption, detour.
 */
export function priorityTier(r: ImpactRow): 1 | 2 | 3 | 4 | 5 | 6 {
  if (r.unreachable && r.patient.visitToday) return 1;
  if (r.power && r.patient.elCritical) return 2;
  if (r.water && r.patient.waterCritical) return 3;
  if (r.unreachable) return 4;
  if (r.power || r.water) return 5;
  return 6;
}

/** Tiers 1–3 are the ones the list marks "Prioritera". */
export const isPrioritised = (r: ImpactRow): boolean => priorityTier(r) <= 3;

/** Order for the list: by tier, ties by battery hours ascending (no battery last), then by name so the order is stable. */
export function prioritise(rows: ImpactRow[]): ImpactRow[] {
  const battery = (r: ImpactRow) => r.patient.batteryHours ?? Number.POSITIVE_INFINITY;
  return [...rows].sort(
    (a, b) =>
      priorityTier(a) - priorityTier(b) ||
      battery(a) - battery(b) ||
      a.patient.familyName.localeCompare(b.patient.familyName, 'sv') ||
      a.patient.givenName.localeCompare(b.patient.givenName, 'sv'),
  );
}
