// Network actions – SPEC.md § 6.5.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { CareNode, NodeStatus, NodeType, SharingLevel, Site } from './types';
import { NET } from './vocab';
import { formatClock } from '@/lib/time';

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
      type,
      status: 'Standing up',
      lead,
      place: site.place,
      lat: site.lat,
      lng: site.lng,
      sharing,
      sync: 'Manual',
      lastSync: at,
      acuteBeds: { total: 0, free: { value: 0, verified: 0, estimated: 0, source: 'Manual', lastConfirmed: at } },
      plannedBeds,
      staffOnDuty: { value: 0, verified: 0, estimated: 0, source: 'Manual', lastConfirmed: at },
      accepts: ['Ward'],
    };
    set((s) => ({ nodes: [...s.nodes, node] }));
    logEntry(NET.audit.stoodUp(node.name), node.name, `${type}, ${site.name}, ${plannedBeds} planned beds`);
    return id;
  },

  setNodeStatus: (nodeId, status) => {
    const { nodes, clock, logEntry } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.status === status) return;
    const at = formatClock(clock);
    let next: CareNode = { ...node, status };
    if (status === 'Operational' && node.status === 'Standing up' && node.plannedBeds !== undefined && node.acuteBeds) {
      const occupied = node.acuteBeds.total - node.acuteBeds.free.value;
      const free = node.plannedBeds - occupied;
      next = {
        ...next,
        acuteBeds: { total: node.plannedBeds, free: { value: free, verified: 0, estimated: free, source: 'Manual', lastConfirmed: at } },
        sync: node.sync === 'Manual' ? 'Manual' : node.sync,
        lastSync: at,
      };
    }
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === nodeId ? next : n)) }));
    logEntry(NET.audit.changed('status', node.name, status), node.name, status);
  },

  setNodeSharing: (nodeId, sharing) => {
    const { nodes, logEntry } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.sharing === sharing) return;
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, sharing } : n)) }));
    logEntry(NET.audit.changed('sharing', node.name, sharing), node.name, sharing);
  },
});
