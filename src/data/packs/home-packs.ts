// The home packs (SPEC.md § 14.5): `homePacks` maps a pack id to the Hospital at Home data of one hospital. `karolinska` is the data
// of § 11–13 (sites Solna and Huddinge); `lund` is the SUS Lund pack of DATA.md § 14. A pack also says where its OpenStreetMap
// geometry is (dynamic imports under geo/<pack>/), so nothing in the app is Karolinska-specific.
import type { DataPack, GeoLoader, HomePack, HomePackId } from './types';
import { HOME_SOURCES, KAROLINSKA_PACK, KOLBOTTEN, OSM_MATCHES } from './karolinska';
import {
  LUND_INFRA_LINKS, LUND_INFRA_NODES, LUND_MESSAGES, LUND_OSM_MATCHES, LUND_PRESETS, LUND_SITE, LUND_SOURCES, LUND_TEAMS, LUND_VISITS, LUND_ZONES,
} from './lund';
import { LUND_PATIENTS } from './home-patients-lund';

type Files = Record<string, () => Promise<{ default: unknown }>>;

// Only files that exist are in the maps, so a roads.json that has not been fetched is not a build error.
const KAROLINSKA_FILES = import.meta.glob('./geo/karolinska/*.json') as Files;
const LUND_FILES = import.meta.glob('./geo/lund/*.json') as Files;

function loaders(files: Files, dir: string): HomePack['geo'] {
  const get = (name: string) => files[`./geo/${dir}/${name}.json`];
  const loader = (osm: string, fixture: string): GeoLoader => ({ osm: get(osm), fixture: get(fixture) });
  return {
    roads: loader('roads', 'fixture'),
    streets: loader('streets', 'fixture-streets'),
    power: loader('power', 'fixture-power'),
    water: loader('water', 'fixture-water'),
  };
}

const karolinskaSites = ['solna', 'huddinge'].map((id) => {
  const n = KAROLINSKA_PACK.nodes.find((x) => x.id === id)!;
  return { id, name: n.name, lat: n.lat, lng: n.lng };
});

export const homePacks: Record<HomePackId, HomePack> = {
  karolinska: {
    id: 'karolinska',
    name: 'Karolinska',
    sites: karolinskaSites,
    zones: KAROLINSKA_PACK.homeZones,
    patients: KAROLINSKA_PACK.homePatients,
    teams: KAROLINSKA_PACK.homeTeams,
    visits: KAROLINSKA_PACK.homeVisits,
    infraNodes: KAROLINSKA_PACK.infraNodes,
    infraLinks: KAROLINSKA_PACK.infraLinks,
    messages: KAROLINSKA_PACK.homeMessages,
    presets: KAROLINSKA_PACK.homePresets,
    sources: HOME_SOURCES,
    osmMatches: OSM_MATCHES,
    osmExtra: { [KOLBOTTEN.id]: KOLBOTTEN },
    geo: loaders(KAROLINSKA_FILES, 'karolinska'),
  },
  lund: {
    id: 'lund',
    name: 'SUS Lund',
    sites: [LUND_SITE],
    zones: LUND_ZONES,
    patients: LUND_PATIENTS,
    teams: LUND_TEAMS,
    visits: LUND_VISITS,
    infraNodes: LUND_INFRA_NODES,
    infraLinks: LUND_INFRA_LINKS,
    messages: LUND_MESSAGES,
    presets: LUND_PRESETS,
    sources: LUND_SOURCES,
    osmMatches: LUND_OSM_MATCHES,
    osmExtra: {},
    geo: loaders(LUND_FILES, 'lund'),
  },
};

export const HOME_PACK_IDS: HomePackId[] = ['karolinska', 'lund'];

/** The pack's id as a DataPack carries it; a pack without one is Karolinska's. */
export const homePackIdOf = (pack: { homePackId?: HomePackId }): HomePackId => pack.homePackId ?? 'karolinska';

/** The data pack with the home members of the given home pack (the hospital members are untouched). */
export function withHomePack(base: DataPack, id: HomePackId): DataPack {
  const h = homePacks[id];
  return {
    ...base,
    homeZones: h.zones,
    homePatients: h.patients,
    homeTeams: h.teams,
    homeVisits: h.visits,
    infraNodes: h.infraNodes,
    infraLinks: h.infraLinks,
    homeMessages: h.messages,
    homePresets: h.presets,
    homeSources: h.sources,
    homePackId: id,
  };
}
