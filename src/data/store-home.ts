// Hospital at Home state – SPEC.md § 11.5. Mixed into the store. Map layers, the mode and the selection are view
// state and are not logged; every change to the disruptions (a road closed or opened, an outage, a reset) is written
// to the audit log through logEntry() like every other action.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { InfraLayer, ZoneId } from './types';
import { lt, t } from '@/lib/i18n';
import { linkLabel } from '@/lib/home-names';
import { sitesInScope } from '@/lib/scope';
import { disruptionCount, impact } from '@/lib/reachability';

export type HomeLayerKey = InfraLayer | 'patients';
export const HOME_LAYER_KEYS: HomeLayerKey[] = ['patients', 'roads', 'el', 'water'];

/** What a tap on the map does: nothing selected = select a node; otherwise toggle a road, a power outage or a water disruption. */
export type HomeMode = null | 'roads' | 'el' | 'water';
export const HOME_MODES: Array<Exclude<HomeMode, null>> = ['roads', 'el', 'water'];

export interface HomeState {
  /** Defaults: patients and roads on, el and water off. */
  layers: Record<HomeLayerKey, boolean>;
  mode: HomeMode;
  blockedLinks: Set<string>;
  blockedNodes: Set<string>;
  powerOutZones: Set<ZoneId>;
  waterOutZones: Set<ZoneId>;
  /** The infrastructure node the panel shows; the map dims everything it is not linked to. */
  selectedNode: string | null;
}

export interface HomeActions {
  setHomeLayer: (layer: HomeLayerKey, on: boolean) => void;
  /** Selecting is view state (not logged); selecting the selected node again clears it. */
  selectHomeNode: (id: string | null) => void;
  /** Picks the mode (picking the active one clears it) and switches on the layer the mode acts on. */
  setHomeMode: (mode: HomeMode) => void;
  toggleBlockedNode: (id: string) => void;
  toggleBlockedLink: (id: string) => void;
  togglePowerOut: (zone: ZoneId) => void;
  toggleWaterOut: (zone: ZoneId) => void;
  /** Clears every disruption and writes one log entry; nothing happens when there is none. */
  resetHomeDisruptions: () => void;
}

export function initialHome(): HomeState {
  return {
    layers: { patients: true, roads: true, el: false, water: false },
    mode: null,
    blockedLinks: new Set(),
    blockedNodes: new Set(),
    powerOutZones: new Set(),
    waterOutZones: new Set(),
    selectedNode: null,
  };
}

const toggled = <T>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
};

export const createHomeSlice: StateCreator<AppStore, [], [], HomeActions> = (set, get) => {
  /** "N of 150 patients affected" for the current state and scope: the detail of every disruption log entry. */
  const detail = () => {
    const { pack, home, scope } = get();
    const r = impact(pack, home, sitesInScope(scope));
    return t('AUDIT.homeDetail', { n: r.summary.affected, total: pack.homePatients.length });
  };
  const zoneName = (zone: ZoneId) => {
    const z = get().pack.homeZones.find((x) => x.id === zone);
    return z ? lt(z.name) : zone;
  };

  return {
    setHomeLayer: (layer, on) =>
      set((s) => ({
        home: {
          ...s.home,
          layers: { ...s.home.layers, [layer]: on },
          // A node of a layer that is switched off cannot stay selected.
          selectedNode: !on && layer !== 'patients' && s.pack.infraNodes.find((n) => n.id === s.home.selectedNode)?.layer === layer ? null : s.home.selectedNode,
        },
      })),

    selectHomeNode: (id) => set((s) => ({ home: { ...s.home, selectedNode: id === s.home.selectedNode ? null : id } })),

    setHomeMode: (mode) =>
      set((s) => {
        const next = mode === s.home.mode ? null : mode;
        return { home: { ...s.home, mode: next, layers: next ? { ...s.home.layers, [next]: true } : s.home.layers } };
      }),

    toggleBlockedNode: (id) => {
      const { pack, home, logEntry } = get();
      const node = pack.infraNodes.find((n) => n.id === id && n.layer === 'roads');
      if (!node) return;
      const blocking = !home.blockedNodes.has(id);
      set((s) => ({ home: { ...s.home, blockedNodes: toggled(s.home.blockedNodes, id) } }));
      logEntry(blocking ? t('AUDIT.homeBlocked') : t('AUDIT.homeUnblocked'), lt(node.name), detail());
    },

    toggleBlockedLink: (id) => {
      const { pack, home, logEntry } = get();
      const link = pack.infraLinks.find((l) => l.id === id && l.layer === 'roads');
      if (!link) return;
      const blocking = !home.blockedLinks.has(id);
      set((s) => ({ home: { ...s.home, blockedLinks: toggled(s.home.blockedLinks, id) } }));
      logEntry(blocking ? t('AUDIT.homeBlocked') : t('AUDIT.homeUnblocked'), linkLabel(link, pack), detail());
    },

    togglePowerOut: (zone) => {
      const { pack, home, logEntry } = get();
      if (!pack.homeZones.some((z) => z.id === zone)) return;
      const out = !home.powerOutZones.has(zone);
      set((s) => ({ home: { ...s.home, powerOutZones: toggled(s.home.powerOutZones, zone) } }));
      logEntry(out ? t('AUDIT.homePowerOut') : t('AUDIT.homePowerRestored'), zoneName(zone), detail());
    },

    toggleWaterOut: (zone) => {
      const { pack, home, logEntry } = get();
      if (!pack.homeZones.some((z) => z.id === zone)) return;
      const out = !home.waterOutZones.has(zone);
      set((s) => ({ home: { ...s.home, waterOutZones: toggled(s.home.waterOutZones, zone) } }));
      logEntry(out ? t('AUDIT.homeWaterOut') : t('AUDIT.homeWaterRestored'), zoneName(zone), detail());
    },

    resetHomeDisruptions: () => {
      const { home, logEntry } = get();
      if (disruptionCount(home) === 0) return;
      set((s) => ({ home: { ...s.home, blockedLinks: new Set(), blockedNodes: new Set(), powerOutZones: new Set(), waterOutZones: new Set() } }));
      logEntry(t('AUDIT.homeReset'), t('AUDIT.homeObject'), detail());
    },
  };
};

