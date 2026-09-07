// In-memory zustand store – SPEC.md § 5. Every state-changing action goes through logEntry(), which appends
// an audit entry stamped with the scenario clock and advances the clock by one minute.
import { create } from 'zustand';
import type {
  AuditEntry,
  BedRequest,
  Bottleneck,
  Capability,
  CareNode,
  ClosedIncident,
  DataPack,
  DischargeReady,
  FlowMetric,
  Incident,
  Message,
  NodeId,
  Patient,
  Playbook,
  Resource,
  ResourceRequest,
  ScenarioKey,
  ScenarioState,
  Staff,
  Ward,
} from './types';
import { loadPack } from './packs/karolinska';
import { AUDIT, CURRENT_USER, DEFAULT_SCOPE, SCENARIO, SCENARIO_NAMES, SYSTEM_ACTOR } from './vocab';
import { DAY_MIN, INITIAL_CLOCK, TICK_MIN, formatClock } from '@/lib/time';
import { createIncidentSlice, type IncidentActions } from './store-incident';
import { createEvacuationSlice, type EvacuationActions } from './store-evacuation';
import { createResourcesSlice, type ResourcesActions } from './store-resources';
import { createNetworkSlice, type NetworkActions } from './store-network';
import { createFlowSlice, type FlowActions } from './store-flow';
import { createScenarioSlice, type ScenarioActions } from './store-scenario';

export interface DataState {
  pack: DataPack;
  scope: NodeId;
  clock: number;
  clockRunning: boolean;
  clockHold: number; // open confirmation dialogs pause a running clock (SPEC.md § 7.2)
  ehrOutage: boolean;
  ehrOutageSince: string | null;
  nodes: CareNode[];
  wards: Ward[];
  capabilities: Capability[];
  bottlenecks: Bottleneck[];
  flowMetrics: FlowMetric[];
  bedRequests: BedRequest[];
  dischargeReady: DischargeReady[];
  resources: Resource[];
  patients: Patient[];
  requests: ResourceRequest[];
  playbooks: Playbook[];
  incident: Incident | null;
  closedIncidents: ClosedIncident[];
  log: AuditEntry[];
  staff: Staff[];
  messagesFromNodes: Message[];
  whatIf: Record<string, Record<string, number>>;
  scenario: ScenarioState | null;
  scenarioPanel: { open: boolean; key: ScenarioKey | null };
  freedByScenario: number;
  ids: number;
}

export interface Actions {
  /** Append an audit entry and advance the clock one minute (scenario-driven entries pass advance: false). Returns the entry id. */
  logEntry: (action: string, object: string, detail?: string, actor?: string, ref?: string, options?: { advance?: boolean }) => string;
  nextId: (prefix: string) => string;
  setScope: (scope: NodeId) => void;
  setEhrOutage: (on: boolean, detail?: string) => void;
  setWhatIf: (capabilityId: string, component: string, value: number) => void;
  clearWhatIf: (capabilityId: string) => void;
  /** Scenario clock: play/pause, one tick forward, and reset to 14:40. */
  setClockRunning: (running: boolean) => void;
  holdClock: (hold: boolean) => void;
  stepClock: () => void;
  resetClock: () => void;
  /** Reset restores the pack, clears incident and scenario, sets the clock to 14:40. */
  reset: () => void;
  /** Opens the scenario panel on Kapacitet with a preset selected (chapters 3 and 5). */
  openScenarioPanel: (key: ScenarioKey | null) => void;
  /** Starts a scenario with its defaults for a chapter; `start` also runs the clock. */
  armScenario: (key: ScenarioKey, start: boolean) => void;
}

export type AppStore = DataState & Actions & IncidentActions & EvacuationActions & ResourcesActions & NetworkActions & FlowActions & ScenarioActions;

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function initialData(): DataState {
  const pack = loadPack();
  return {
    pack,
    scope: DEFAULT_SCOPE,
    clock: INITIAL_CLOCK,
    clockRunning: false,
    clockHold: 0,
    ehrOutage: false,
    ehrOutageSince: null,
    nodes: clone(pack.nodes),
    wards: clone(pack.wards),
    capabilities: clone(pack.capabilities),
    bottlenecks: clone(pack.bottlenecks),
    flowMetrics: clone(pack.flowMetrics),
    bedRequests: clone(pack.bedRequests),
    dischargeReady: clone(pack.dischargeReady),
    resources: clone(pack.resources),
    patients: clone([...pack.patientsBySite.solna, ...pack.patientsBySite.huddinge]),
    requests: clone(pack.requests),
    playbooks: clone(pack.playbooks),
    incident: null,
    closedIncidents: [],
    log: clone(pack.initialLog),
    staff: clone(pack.staff),
    messagesFromNodes: clone(pack.messages),
    whatIf: {},
    scenario: null,
    scenarioPanel: { open: false, key: null },
    freedByScenario: 0,
    ids: 100,
  };
}

/** Minutes one tick advances: a day for PB5/pandemi, 15 minutes otherwise. */
export function tickMinutes(state: Pick<DataState, 'scenario' | 'incident'>): number {
  if (state.scenario?.key === 'pandemi' || state.incident?.playbookKey === 'pandemi') return DAY_MIN;
  return TICK_MIN;
}

export const useStore = create<AppStore>()((set, get, api) => ({
  ...initialData(),
  ...createIncidentSlice(set, get, api),
  ...createEvacuationSlice(set, get, api),
  ...createResourcesSlice(set, get, api),
  ...createNetworkSlice(set, get, api),
  ...createFlowSlice(set, get, api),
  ...createScenarioSlice(set, get, api),

  nextId: (prefix) => {
    const n = get().ids + 1;
    set({ ids: n });
    return `${prefix}-${n}`;
  },

  logEntry: (action, object, detail, actor = CURRENT_USER.name, ref, options) => {
    const state = get();
    const id = `log-${state.log.length + 1}-${state.ids + 1}`;
    const entry: AuditEntry = { id, at: formatClock(state.clock), actor, action, object, detail, ref };
    set({ log: [...state.log, entry], clock: state.clock + (options?.advance === false ? 0 : 1), ids: state.ids + 1 });
    get().settleDischarges();
    return id;
  },

  setScope: (scope) => set({ scope }),

  setEhrOutage: (on, detail) => {
    const { ehrOutage, clock, logEntry } = get();
    if (on === ehrOutage) return;
    if (on) {
      set({ ehrOutage: true, ehrOutageSince: formatClock(clock) });
      logEntry(AUDIT.ehrLost, AUDIT.ehrObject, detail, SYSTEM_ACTOR);
    } else {
      set({ ehrOutage: false, ehrOutageSince: null });
      logEntry(AUDIT.ehrRestored, AUDIT.ehrObject, detail, SYSTEM_ACTOR);
    }
  },

  setWhatIf: (capabilityId, component, value) =>
    set((s) => ({ whatIf: { ...s.whatIf, [capabilityId]: { ...(s.whatIf[capabilityId] ?? {}), [component]: value } } })),

  clearWhatIf: (capabilityId) =>
    set((s) => {
      const next = { ...s.whatIf };
      delete next[capabilityId];
      return { whatIf: next };
    }),

  setClockRunning: (running) => set({ clockRunning: running }),

  holdClock: (hold) => set((s) => ({ clockHold: Math.max(0, s.clockHold + (hold ? 1 : -1)) })),

  stepClock: () => {
    const s = get();
    set({ clock: s.clock + tickMinutes(s) });
    get().settleDischarges();
    if (s.scenario?.running) get().advanceScenario();
  },

  resetClock: () => {
    const { logEntry, scenario } = get();
    set({ clock: INITIAL_CLOCK, clockRunning: false, scenario: null, freedByScenario: 0 });
    logEntry(AUDIT.clockReset, AUDIT.clockObject, scenario ? SCENARIO.stopped(SCENARIO_NAMES[scenario.key]) : undefined, SYSTEM_ACTOR);
    set({ clock: INITIAL_CLOCK });
  },

  reset: () => set({ ...initialData() }),

  openScenarioPanel: (key) => set({ scenarioPanel: { open: true, key } }),

  armScenario: (key, start) => {
    set({ scenarioPanel: { open: false, key } });
    get().startScenario(key, {}, start);
  },
}));

/** Convenience selectors. */
export const selectNode = (id: NodeId) => (s: DataState) => s.nodes.find((n) => n.id === id);
export const selectClockLabel = (s: DataState) => formatClock(s.clock);
export const selectOutage = (s: DataState) => ({ ehrOutage: s.ehrOutage, ehrOutageSince: s.ehrOutageSince });
