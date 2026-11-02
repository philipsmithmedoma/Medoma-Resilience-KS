// Hospital at Home reachability and impact – SPEC.md § 11.5 and § 12.3. Pure: Dijkstra by length over the road graph from
// the sites in scope, a status per patient, one row per affected patient and their priority order. Zones keep their role
// for power and water outages only.
import type { DataPack, HomePatient, SiteId, ZoneId } from '@/data/types';
import { blockedWayFlags, dijkstra, pathWayNames } from './roadGraph';
import { getRoadModel, sourceVertices, type RoadModel } from './roadModel';
import { batteryEmptyAt } from './disruptions';

export const BOTH_SITES: SiteId[] = ['solna', 'huddinge'];

/** Everything that can be disrupted (SPEC.md § 11.5, § 12.3). */
export interface Disruptions {
  /** OSM way ids (as strings) closed by a tap on a segment. */
  blockedWays: ReadonlySet<string>;
  /** Road keys (`name` or `name|ref`) closed by a tap with "block whole road". */
  blockedRoads: ReadonlySet<string>;
  /** InfraNode ids of bridges and tunnels; each blocks the ways in its `osmWayNames`. */
  blockedNodes: ReadonlySet<string>;
  powerOutZones: ReadonlySet<ZoneId>;
  waterOutZones: ReadonlySet<ZoneId>;
  /** Zone → clock minute at which the earliest active power disruption covering it started (SPEC.md § 13.2); absent in pure tests. */
  powerStart?: ReadonlyMap<ZoneId, number>;
}

export const NO_DISRUPTIONS: Disruptions = {
  blockedWays: new Set(),
  blockedRoads: new Set(),
  blockedNodes: new Set(),
  powerOutZones: new Set(),
  waterOutZones: new Set(),
};

export function disruptionCount(d: Disruptions): number {
  return d.blockedWays.size + d.blockedRoads.size + d.blockedNodes.size + d.powerOutZones.size + d.waterOutZones.size;
}

/** A patient is delayed when the shortest path is at least 25 % or 3 km longer than with nothing blocked (SPEC.md § 12.3). */
export const DELAY_RATIO = 1.25;
export const DELAY_EXTRA_M = 3000;

type RoadPack = Pick<DataPack, 'infraNodes'>;

/** Flags per way of the graph for the roads the state closes. */
export function blockedFlags(model: RoadModel, state: Disruptions, pack: RoadPack): Uint8Array {
  const names = [...state.blockedNodes].flatMap((id) => pack.infraNodes.find((n) => n.id === id)?.osmWayNames ?? []);
  return blockedWayFlags(model.graph, { ways: state.blockedWays, roads: state.blockedRoads, names });
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
  /** Clock minute at which the battery is empty: the start of the earliest power disruption plus the battery hours (SPEC.md § 13.2). */
  batteryEmptyAt?: number | null;
  /** The clock has passed `batteryEmptyAt`; the row is then critical whatever the equipment. */
  batteryEmpty?: boolean;
}

/** The window of the summary line "N run out within 2 h" (SPEC.md § 13.2). */
export const BATTERY_WARNING_MIN = 120;

export interface ImpactSummary {
  affected: number;
  detour: number;
  unreachable: number;
  unreachableZones: ZoneId[];
  unreachableVisitToday: number;
  unreachableCritical: number; // el- or water-critical among the unreachable
  powerOut: number;
  shortestBattery: number | null; // among el-critical patients without power
  /** Patients without power whose battery is empty or runs out within 2 h of the clock (needs the clock and a start time). */
  runOutWithin2h: number;
  /** Of those, the ones whose battery is already empty. */
  batteryEmpty: number;
  earliestBatteryEmptyAt: number | null;
  waterOut: number;
  dialysis: number; // water-critical among those with a water disruption
}

export interface Impact {
  rows: ImpactRow[]; // pack order; one row per patient with at least one flag
  summary: ImpactSummary;
}

/** OSM ids of every way the state closes (by id, by road or through a node), for drawing them in the danger colour. */
export function blockedWayIdSet(model: RoadModel, state: Disruptions, pack: RoadPack): Set<number> {
  const flags = blockedFlags(model, state, pack);
  const ids = new Set<number>();
  flags.forEach((f, i) => {
    if (f) ids.add(model.graph.ways[i].id);
  });
  return ids;
}

/**
 * Impact of the disruptions on the patients from the sites in scope. Road status per patient comes from the road model
 * (null before the geometry has loaded: only power and water show). A patient with no road within 1.5 km never reaches
 * a site, with or without a disruption; that is a property of the data, reported by the model, not an effect, so such a
 * patient is not a row here.
 */
export function impact(
  pack: Pick<DataPack, 'homeZones' | 'homePatients' | 'infraNodes'>,
  state: Disruptions,
  scopeSites: SiteId[],
  model: RoadModel | null = getRoadModel(),
  clock: number | null = null,
): Impact {
  // A scope that yields no sites (a stood-up node) uses both Karolinska sites (SPEC.md § 11.1).
  const sites = scopeSites.length ? scopeSites : BOTH_SITES;
  const roadsClosed = state.blockedWays.size + state.blockedRoads.size + state.blockedNodes.size > 0;
  let base: Float64Array | null = null;
  let now: Float64Array | null = null;
  if (model && roadsClosed) {
    base = model.baseline(sites);
    now = dijkstra(model.graph, sourceVertices(model, sites), blockedFlags(model, state, pack)).dist;
  }

  const rows: ImpactRow[] = [];
  for (const p of pack.homePatients) {
    let unreachable = false;
    let delayed = false;
    const snap = model?.patients.get(p.id);
    if (base && now && snap && !snap.unsnapped) {
      const b = base[snap.vertex];
      const d = now[snap.vertex];
      if (Number.isFinite(b)) {
        if (!Number.isFinite(d)) unreachable = true;
        else delayed = d > b && (d >= b * DELAY_RATIO || d >= b + DELAY_EXTRA_M);
      }
    }
    const power = state.powerOutZones.has(p.zone);
    const water = state.waterOutZones.has(p.zone);
    if (!unreachable && !delayed && !power && !water) continue;
    const reasons: ImpactReason[] = [];
    if (unreachable) reasons.push('unreachable');
    if (delayed) reasons.push('detour');
    if (power) reasons.push('power');
    if (water) reasons.push('water');
    const affected = unreachable || power || water;
    const start = power ? state.powerStart?.get(p.zone) : undefined;
    const emptyAt = start !== undefined && p.batteryHours !== null ? batteryEmptyAt(start, p.batteryHours) : null;
    const batteryEmpty = emptyAt !== null && clock !== null && clock >= emptyAt;
    rows.push({ patient: p, reasons, unreachable, delayed, power, water, affected, critical: affected && (p.elCritical || p.waterCritical || batteryEmpty), batteryEmptyAt: emptyAt, batteryEmpty });
  }

  const unreachableRows = rows.filter((r) => r.unreachable);
  const powerRows = rows.filter((r) => r.power);
  const waterRows = rows.filter((r) => r.water);
  const batteries = powerRows.filter((r) => r.patient.elCritical && r.patient.batteryHours !== null).map((r) => r.patient.batteryHours!);
  const emptyAts = powerRows.map((r) => r.batteryEmptyAt).filter((x): x is number => x != null);
  const soon = clock === null ? [] : powerRows.filter((r) => r.batteryEmptyAt != null && r.batteryEmptyAt <= clock + BATTERY_WARNING_MIN);
  const unreachableZoneIds = new Set(unreachableRows.map((r) => r.patient.zone));
  const summary: ImpactSummary = {
    affected: rows.filter((r) => r.affected).length,
    detour: rows.filter((r) => r.delayed).length,
    unreachable: unreachableRows.length,
    unreachableZones: pack.homeZones.filter((z) => unreachableZoneIds.has(z.id)).map((z) => z.id),
    unreachableVisitToday: unreachableRows.filter((r) => r.patient.visitToday).length,
    unreachableCritical: unreachableRows.filter((r) => r.patient.elCritical || r.patient.waterCritical).length,
    powerOut: powerRows.length,
    shortestBattery: batteries.length ? Math.min(...batteries) : null,
    runOutWithin2h: soon.length,
    batteryEmpty: powerRows.filter((r) => r.batteryEmpty).length,
    earliestBatteryEmptyAt: emptyAts.length ? Math.min(...emptyAts) : null,
    waterOut: waterRows.length,
    dialysis: waterRows.filter((r) => r.patient.waterCritical).length,
  };
  return { rows, summary };
}

/**
 * The way names on the shortest path from the sites in scope to a patient with the roads closed, or null when there is
 * none or the patient has no road within 1.5 km. Used to explain a path that a test expects not to exist.
 */
export function explainPath(
  pack: Pick<DataPack, 'infraNodes'>,
  state: Disruptions,
  scopeSites: SiteId[],
  model: RoadModel,
  patient: Pick<HomePatient, 'id'>,
): string[] | null {
  const snap = model.patients.get(patient.id);
  if (!snap || snap.unsnapped) return null;
  const paths = dijkstra(model.graph, sourceVertices(model, scopeSites.length ? scopeSites : BOTH_SITES), blockedFlags(model, state, pack));
  return Number.isFinite(paths.dist[snap.vertex]) ? pathWayNames(model.graph, paths, snap.vertex) : null;
}

/**
 * Priority tier of a row, 1 first: unreachable with a visit today, power-out el-critical, water-out dialysis,
 * unreachable, any other power or water disruption, detour.
 */
export function priorityTier(r: ImpactRow): 1 | 2 | 3 | 4 | 5 | 6 {
  if (r.unreachable && r.patient.visitToday) return 1;
  if (r.power && (r.patient.elCritical || r.batteryEmpty === true)) return 2;
  if (r.water && r.patient.waterCritical) return 3;
  if (r.unreachable) return 4;
  if (r.power || r.water) return 5;
  return 6;
}

/** Tiers 1–3 are the ones the list marks "Prioritera". */
export const isPrioritised = (r: ImpactRow): boolean => priorityTier(r) <= 3;

/**
 * Order for the list: by tier, then by the clock minute the battery is empty ascending (SPEC.md § 13.2), then by battery
 * hours ascending (no battery last) for rows that have no deadline, then by name so the order is stable.
 */
export function prioritise(rows: ImpactRow[]): ImpactRow[] {
  const deadline = (r: ImpactRow) => r.batteryEmptyAt ?? Number.POSITIVE_INFINITY;
  const battery = (r: ImpactRow) => r.patient.batteryHours ?? Number.POSITIVE_INFINITY;
  return [...rows].sort(
    (a, b) =>
      priorityTier(a) - priorityTier(b) ||
      deadline(a) - deadline(b) ||
      battery(a) - battery(b) ||
      a.patient.familyName.localeCompare(b.patient.familyName, 'sv') ||
      a.patient.givenName.localeCompare(b.patient.givenName, 'sv'),
  );
}
