// Loads the OpenStreetMap GeoJSON of SPEC.md § 12.2 from src/data/packs/geo/ with dynamic imports, so the files are
// fetched only when Hospital at Home needs them and never enter the initial bundle. A file that has not been fetched
// yet (scripts/fetch-osm.mjs) is replaced by its hand-designed fixture, which has the same schema. The app makes no
// network request for this data.
import type { RoadCollection } from './roadGraph';

export type Source = 'osm' | 'fixture';

export interface PointFeature {
  type: 'Feature';
  properties: { id: number; name: string | null; operator?: string | null; power?: string; voltage?: string | null };
  geometry: { type: 'Point'; coordinates: [number, number] };
}
export interface LineFeature {
  type: 'Feature';
  properties: { id: number; name: string | null; operator?: string | null; power?: string; voltage?: string | null };
  geometry: { type: 'LineString'; coordinates: Array<[number, number]> };
}
export interface Collection<F> {
  type: 'FeatureCollection';
  features: F[];
}

export interface GeoData {
  roads: RoadCollection;
  streets: Collection<LineFeature>;
  power: Collection<PointFeature | LineFeature>;
  water: Collection<PointFeature>;
  /** Per file: the OpenStreetMap file, or the fixture standing in for it. */
  source: Record<'roads' | 'streets' | 'power' | 'water', Source>;
}

// Only files that exist are in the map, so a missing roads.json is not a build error.
const files = import.meta.glob('../data/packs/geo/*.json') as Record<string, () => Promise<{ default: unknown }>>;
const find = (name: string) => files[`../data/packs/geo/${name}.json`];

async function pick<T>(osmName: string, fixtureName: string): Promise<{ data: T; source: Source }> {
  const osm = find(osmName);
  if (osm) return { data: (await osm()).default as T, source: 'osm' };
  const fixture = find(fixtureName);
  if (!fixture) throw new Error(`Neither ${osmName}.json nor ${fixtureName}.json exists in src/data/packs/geo/`);
  return { data: (await fixture()).default as T, source: 'fixture' };
}

let cached: Promise<GeoData> | null = null;

export function loadGeoData(): Promise<GeoData> {
  cached ??= (async () => {
    const [roads, streets, power, water] = await Promise.all([
      pick<RoadCollection>('roads', 'fixture'),
      pick<GeoData['streets']>('streets', 'fixture-streets'),
      pick<GeoData['power']>('power', 'fixture-power'),
      pick<GeoData['water']>('water', 'fixture-water'),
    ]);
    return { roads: roads.data, streets: streets.data, power: power.data, water: water.data, source: { roads: roads.source, streets: streets.source, power: power.source, water: water.source } };
  })();
  return cached;
}
