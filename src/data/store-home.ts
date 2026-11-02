// Hospital at Home view state – SPEC.md § 11.5. Mixed into the store; the map layers are view state and are not logged.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { InfraLayer } from './types';

export type HomeLayerKey = InfraLayer | 'patients';
export const HOME_LAYER_KEYS: HomeLayerKey[] = ['patients', 'roads', 'el', 'water'];

export interface HomeState {
  /** Defaults: patients and roads on, el and water off. */
  layers: Record<HomeLayerKey, boolean>;
  /** The infrastructure node the panel shows; the map dims everything it is not linked to. */
  selectedNode: string | null;
}

export interface HomeActions {
  setHomeLayer: (layer: HomeLayerKey, on: boolean) => void;
  /** Selecting is view state (not logged); selecting the selected node again clears it. */
  selectHomeNode: (id: string | null) => void;
}

export function initialHome(): HomeState {
  return { layers: { patients: true, roads: true, el: false, water: false }, selectedNode: null };
}

export const createHomeSlice: StateCreator<AppStore, [], [], HomeActions> = (set) => ({
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
});
