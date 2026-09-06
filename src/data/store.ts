// In-memory zustand store – SPEC.md § 4. Every state-changing action goes through logEntry(),
// which appends an audit entry and advances the demo clock by one minute.
import { create } from 'zustand';
import type {
  AuditEntry,
  Bottleneck,
  Capability,
  CareNode,
  ClosedIncident,
  Incident,
  Message,
  NodeId,
  Patient,
  Playbook,
  Resource,
  ResourceRequest,
  Staff,
} from './types';
import {
  BOTTLENECKS,
  CAPABILITIES,
  INITIAL_LOG,
  INITIAL_PATIENTS,
  MESSAGES_FROM_NODES,
  NODES,
  PLAYBOOKS,
  REQUESTS,
  RESOURCES,
  STAFF,
} from './mock';
import { AUDIT, CURRENT_USER, HOME_NODE_ID, SYSTEM_ACTOR } from './vocab';
import { formatClock, INITIAL_CLOCK } from '@/lib/time';
import { createIncidentSlice, type IncidentActions } from './store-incident';
import { createEvacuationSlice, type EvacuationActions } from './store-evacuation';
import { createResourcesSlice, type ResourcesActions } from './store-resources';
import { createNetworkSlice, type NetworkActions } from './store-network';

export interface DataState {
  scope: NodeId;
  clock: number;
  ehrOutage: boolean;
  ehrOutageSince: string | null;
  nodes: CareNode[];
  capabilities: Capability[];
  bottlenecks: Bottleneck[];
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
  ids: number; // running id counter for objects created during the session (starts above the seeded ids)
}

export interface Actions {
  /** Append an audit entry and advance the clock one minute. Returns the entry id. */
  logEntry: (action: string, object: string, detail?: string, actor?: string, ref?: string) => string;
  nextId: (prefix: string) => string;
  setScope: (scope: NodeId) => void;
  setEhrOutage: (on: boolean) => void;
  /** What-if overrides never touch capability data and are not logged (they are "not saved"). */
  setWhatIf: (capabilityId: string, component: string, value: number) => void;
  clearWhatIf: (capabilityId: string) => void;
  reset: () => void;
}

export type AppStore = DataState & Actions & IncidentActions & EvacuationActions & ResourcesActions & NetworkActions;

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function initialData(): DataState {
  return {
    scope: HOME_NODE_ID,
    clock: INITIAL_CLOCK,
    ehrOutage: false,
    ehrOutageSince: null,
    nodes: clone(NODES),
    capabilities: clone(CAPABILITIES),
    bottlenecks: clone(BOTTLENECKS),
    resources: clone(RESOURCES),
    patients: clone(INITIAL_PATIENTS),
    requests: clone(REQUESTS),
    playbooks: clone(PLAYBOOKS),
    incident: null,
    closedIncidents: [],
    log: clone(INITIAL_LOG),
    staff: clone(STAFF),
    messagesFromNodes: clone(MESSAGES_FROM_NODES),
    whatIf: {},
    ids: 100,
  };
}

export const useStore = create<AppStore>()((set, get, api) => ({
  ...initialData(),
  ...createIncidentSlice(set, get, api),
  ...createEvacuationSlice(set, get, api),
  ...createResourcesSlice(set, get, api),
  ...createNetworkSlice(set, get, api),

  nextId: (prefix) => {
    const n = get().ids + 1;
    set({ ids: n });
    return `${prefix}-${n}`;
  },

  logEntry: (action, object, detail, actor = CURRENT_USER.name, ref) => {
    const state = get();
    const id = `log-${state.log.length + 1}-${state.ids + 1}`;
    const entry: AuditEntry = { id, at: formatClock(state.clock), actor, action, object, detail, ref };
    set({ log: [...state.log, entry], clock: state.clock + 1, ids: state.ids + 1 });
    return id;
  },

  setScope: (scope) => set({ scope }),

  setEhrOutage: (on) => {
    const { ehrOutage, clock, logEntry } = get();
    if (on === ehrOutage) return;
    if (on) {
      set({ ehrOutage: true, ehrOutageSince: formatClock(clock) });
      logEntry(AUDIT.ehrLost, 'EHR', 'Vikby sjukhus', SYSTEM_ACTOR);
    } else {
      set({ ehrOutage: false, ehrOutageSince: null });
      logEntry(AUDIT.ehrRestored, 'EHR', 'Vikby sjukhus', SYSTEM_ACTOR);
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

  reset: () => set(initialData()),
}));

/** Convenience selectors. */
export const selectNode = (id: NodeId) => (s: DataState) => s.nodes.find((n) => n.id === id);
export const selectClockLabel = (s: DataState) => formatClock(s.clock);
