// The road graph with the two sites and the patients attached (SPEC.md § 12.3), built once per pack load.
import type { DataPack, HomePatient, HomeTeam, SiteId, TeamId } from '@/data/types';
import { buildRoadGraph, dijkstra, snapToGraph, type RoadCollection, type RoadGraph, type Snap } from './roadGraph';
import { loadGeoData, type GeoData } from './geoData';

export interface RoadModel {
  graph: RoadGraph;
  /** Where each site attaches to the graph (a site beyond 1 500 m gets no source). */
  sites: Record<SiteId, Snap>;
  /** Where each patient attaches; `unsnapped` patients have no road within 1.5 km. */
  patients: Map<string, Snap>;
  /** Where each team's base attaches (SPEC.md § 14.2); a base beyond 1 500 m reaches nobody. */
  teams: Record<TeamId, Snap>;
  /** Distances from every team's base with nothing blocked, computed once. */
  teamBaseline: () => Map<TeamId, Float64Array>;
  /** Distances with nothing blocked from the sites in scope, computed once per scope and memoised. */
  baseline: (scope: SiteId[]) => Float64Array;
  source: GeoData['source']['roads'];
}

type SitePoint = { id: string; lat: number; lng: number };

export function buildRoadModel(
  roads: RoadCollection,
  sites: SitePoint[],
  patients: Array<Pick<HomePatient, 'id' | 'lat' | 'lng'>>,
  source: RoadModel['source'] = 'osm',
  teams: Array<Pick<HomeTeam, 'id' | 'baseLat' | 'baseLng'>> = [],
): RoadModel {
  const graph = buildRoadGraph(roads);
  const siteSnap = {} as Record<SiteId, Snap>;
  for (const s of sites) siteSnap[s.id as SiteId] = snapToGraph(graph, s.lat, s.lng);
  const patientSnap = new Map<string, Snap>();
  for (const p of patients) patientSnap.set(p.id, snapToGraph(graph, p.lat, p.lng));
  const teamSnap: Record<TeamId, Snap> = {};
  for (const tm of teams) teamSnap[tm.id] = snapToGraph(graph, tm.baseLat, tm.baseLng);
  let teamMemo: Map<TeamId, Float64Array> | null = null;
  const memo = new Map<string, Float64Array>();
  const model: RoadModel = {
    graph,
    sites: siteSnap,
    patients: patientSnap,
    teams: teamSnap,
    teamBaseline: () => {
      teamMemo ??= new Map(teams.map((tm) => [tm.id, teamDistancesFrom(graph, teamSnap[tm.id])]));
      return teamMemo;
    },
    source,
    baseline: (scope) => {
      const key = [...scope].sort().join(',');
      let d = memo.get(key);
      if (!d) {
        d = dijkstra(graph, sourceVertices(model, scope)).dist;
        memo.set(key, d);
      }
      return d;
    },
  };
  return model;
}

/** Distances in metres from a team base's snap over the graph, nothing blocked unless flags are given; all Infinity when the base has no road. */
export function teamDistancesFrom(graph: RoadGraph, snap: Snap | undefined, blocked?: Uint8Array): Float64Array {
  if (!snap || snap.unsnapped) return new Float64Array(graph.vertexCount).fill(Infinity);
  return dijkstra(graph, [snap.vertex], blocked).dist;
}

/** Graph vertices the sites in scope attach to; a site with no road within 1.5 km contributes none. */
export function sourceVertices(model: Pick<RoadModel, 'sites'>, scope: SiteId[]): number[] {
  return scope.map((s) => model.sites[s]).filter((s) => s && !s.unsnapped).map((s) => s.vertex);
}

let current: RoadModel | null = null;
let loading: Promise<RoadModel> | null = null;

/** The loaded model, or null before `loadRoadModel` has finished. */
export const getRoadModel = (): RoadModel | null => current;

/** Loads the geometry (dynamic import) and builds the model once. */
export function loadRoadModel(pack: Pick<DataPack, 'nodes' | 'homePatients'> & Partial<Pick<DataPack, 'homeTeams'>>): Promise<RoadModel> {
  loading ??= loadGeoData().then((geo) => {
    const sites = pack.nodes.filter((n) => n.id === 'solna' || n.id === 'huddinge');
    current = buildRoadModel(geo.roads, sites, pack.homePatients, geo.source.roads, pack.homeTeams);
    return current;
  });
  return loading;
}
