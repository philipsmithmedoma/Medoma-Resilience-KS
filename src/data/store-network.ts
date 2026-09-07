// Network actions – SPEC.md § 6.9.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { CareNode, NodeStatus, NodeType, SharingLevel, Site } from './types';
import { NET, NODE_STATUS_LABELS, NODE_TYPE_LABELS, SHARING_LABELS } from './vocab';
import { formatClock } from '@/lib/time';
import { fmt } from '@/lib/format';

export interface StandUpInput {
  name: string;
  type: NodeType;
  site: Site;
  plannedBeds: number;
  lead: string;
  sharing: SharingLevel;
}

export interface NetworkActions {
  standUpNode: (input: StandUpInput) => string;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setNodeSharing: (nodeId: string, sharing: SharingLevel) => void;
}

export const createNetworkSlice: StateCreator<AppStore, [], [], NetworkActions> = (set, get) => ({
  standUpNode: ({ name, type, site, plannedBeds, lead, sharing }) => {
    const { clock, nextId, logEntry } = get();
    const at = formatClock(clock);
    const id = nextId('node');
    const node: CareNode = {
      id,
      name: name.trim(),
      shortName: name.trim(),
      type,
      status: 'Standing up',
      lead,
      place: site.place,
      lat: site.lat,
      lng: site.lng,
      sharing,
      sync: 'Manual',
      lastSync: at,
      beds: {
        total: { value: 0, confidence: 'illustrative', basis: 'etablerad nod, planerade platser', dataSource: 'Manual', lastConfirmed: at },
        free: { value: 0, confidence: 'illustrative', basis: 'etablerad nod', dataSource: 'Manual', lastConfirmed: at },
      },
      plannedBeds,
      staffOnDuty: { value: 0, confidence: 'illustrative', basis: 'etablerad nod', dataSource: 'Manual', lastConfirmed: at },
      accepts: ['Ward'],
    };
    set((s) => ({ nodes: [...s.nodes, node] }));
    logEntry(NET.audit.stoodUp(node.name), node.name, NET.audit.detail(NODE_TYPE_LABELS[type], site.name, fmt(plannedBeds)));
    return id;
  },

  setNodeStatus: (nodeId, status) => {
    const { nodes, clock, logEntry } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.status === status) return;
    const at = formatClock(clock);
    let next: CareNode = { ...node, status };
    if (status === 'Operational' && node.status === 'Standing up' && node.plannedBeds !== undefined && node.beds) {
      const occupied = (node.beds.total.value ?? 0) - (node.beds.free.value ?? 0);
      const free = node.plannedBeds - occupied;
      next = {
        ...next,
        beds: {
          total: { ...node.beds.total, value: node.plannedBeds, lastConfirmed: at },
          free: { ...node.beds.free, value: free, lastConfirmed: at },
        },
        lastSync: at,
      };
    }
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === nodeId ? next : n)) }));
    logEntry(NET.audit.changedStatus(node.name, NODE_STATUS_LABELS[status]), node.name, NODE_STATUS_LABELS[status]);
  },

  setNodeSharing: (nodeId, sharing) => {
    const { nodes, logEntry } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.sharing === sharing) return;
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, sharing } : n)) }));
    logEntry(NET.audit.changedSharing(node.name, SHARING_LABELS[sharing]), node.name, SHARING_LABELS[sharing]);
  },
});
