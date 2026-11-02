// Hospital at Home view state – SPEC.md § 11.5. Mixed into the store; the map layers are view state and are not logged.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { InfraLayer } from './types';

export type HomeLayerKey = InfraLayer | 'patients';
export const HOME_LAYER_KEYS: HomeLayerKey[] = ['patients', 'roads', 'el', 'water'];

export interface HomeState {
  /** Defaults: patients and roads on, el and water off. */
  layers: Record<HomeLayerKey, boolean>;
}

export interface HomeActions {
  setHomeLayer: (layer: HomeLayerKey, on: boolean) => void;
}

export function initialHome(): HomeState {
  return { layers: { patients: true, roads: true, el: false, water: false } };
}

export const createHomeSlice: StateCreator<AppStore, [], [], HomeActions> = (set) => ({
  setHomeLayer: (layer, on) => set((s) => ({ home: { ...s.home, layers: { ...s.home.layers, [layer]: on } } })),
});
