// Preparedness mode – SPEC.md § 12.7. The navigation has two states: normal operation (the Medoma platform tabs and a
// "Beredskap" button) and preparedness mode (the resilience modules as tabs, a filled indicator, the scenario controls).
// Whether the mode is active is derived, never stored on its own: the manual flag, an incident, a scenario in effect, or a
// route that belongs to a resilience module. Pure.
import { MODULE_DEFS, PLATFORM_DEFS, type ModuleDef } from '@/data/vocab';

export type PreparednessReason = 'manual' | 'incident' | 'scenario' | 'route';

/** The parts of the store the mode depends on. */
export interface PreparednessState {
  preparednessOn: boolean;
  incident: unknown | null;
  scenario: unknown | null;
}

/** The start page of the resilience modules; the module list does not contain it. */
export const START_PATH = '/start';
export const PLATFORM_HOME = '/patients';
/** Where the close control goes from a resilience route: the first platform module after the mode ends. */
export const CLOSE_FALLBACK = '/planning';

/** Routes of the resilience modules, taken from the module list (the nav's own definition) plus Start. */
export const resiliencePaths = (): string[] => [START_PATH, ...MODULE_DEFS.map((m) => m.path)];

/** True for a resilience module's route and its children (`/natverk/node-1`, `/incident/kanaler/lssl`). */
export function isResilienceRoute(route: string): boolean {
  const path = route.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return resiliencePaths().some((p) => path === p || path.startsWith(`${p}/`));
}

/** Why the mode is on, in the order manual, incident, scenario, route; null when it is off. */
export function preparednessReason(state: PreparednessState, route: string): PreparednessReason | null {
  if (state.preparednessOn) return 'manual';
  if (state.incident !== null) return 'incident';
  if (state.scenario !== null) return 'scenario';
  if (isResilienceRoute(route)) return 'route';
  return null;
}

export function preparednessActive(state: PreparednessState, route: string): boolean {
  return preparednessReason(state, route) !== null;
}

/** The close control is disabled while an incident is active or a scenario is in effect: they would turn the mode on again. */
export function closeBlocked(state: Pick<PreparednessState, 'incident' | 'scenario'>): boolean {
  return state.incident !== null || state.scenario !== null;
}

/** What the root route redirects to. */
export const rootTarget = (active: boolean): string => (active ? START_PATH : PLATFORM_HOME);

/** What the navigation shows in each state (SPEC.md § 12.7); the component renders it and the tests read it. */
export interface NavModel {
  /** The five platform entries as tabs (normal) or inside one menu "Medoma" (preparedness). */
  platform: 'tabs' | 'menu';
  platformModules: ModuleDef[];
  /** The resilience modules that are tabs: none in normal operation. */
  resilienceTabs: ModuleDef[];
  /** The outlined "Beredskap" button, or the filled indicator with a close control. */
  button: 'enter' | 'indicator';
  scenarioControls: boolean;
}

export function navModel(active: boolean): NavModel {
  return active
    ? { platform: 'menu', platformModules: PLATFORM_DEFS, resilienceTabs: MODULE_DEFS, button: 'indicator', scenarioControls: true }
    : { platform: 'tabs', platformModules: PLATFORM_DEFS, resilienceTabs: [], button: 'enter', scenarioControls: false };
}

/**
 * The log entry a change of the derived mode needs, or null. The manual flag logs itself in the action that sets it, so a
 * change to or from "manual" is not repeated here; a mode that turns on or off because of an incident, a scenario or the
 * route is logged with that reason (SPEC.md § 12.7).
 */
export function preparednessTransition(before: PreparednessReason | null, after: PreparednessReason | null): { on: boolean; reason: PreparednessReason } | null {
  if (before === null && after !== null && after !== 'manual') return { on: true, reason: after };
  if (before !== null && after === null && before !== 'manual') return { on: false, reason: before };
  return null;
}
