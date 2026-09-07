// Resource request actions with inventory side effects – SPEC.md § 6.8.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { NodeId, Priority, Resource, ResourceRequest } from './types';
import { AMBULANCE_NODE_ID, CURRENT_USER, KAROLINSKA_ID } from './vocab';
import { t, tm } from '@/lib/i18n';
import { formatClock } from '@/lib/time';

export interface NewRequestInput {
  resourceName: string;
  quantity: number;
  toNodeId: NodeId;
  priority: Priority;
  note?: string;
  fromNodeId?: NodeId;
  requestedBy?: string;
}

export interface ResourcesActions {
  createRequest: (input: NewRequestInput) => string;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string, reason: string) => void;
  allocateRequest: (id: string, fromNodeId: NodeId) => void;
  dispatchRequest: (id: string, eta: string) => void;
  receiveRequest: (id: string) => void;
  addNodeMessage: (text: string) => void;
}

function adjust(resources: Resource[], match: (r: Resource) => boolean, delta: Partial<Pick<Resource, 'available' | 'reserved' | 'inTransit' | 'total'>>): Resource[] {
  let done = false;
  return resources.map((r) => {
    if (done || !match(r)) return r;
    done = true;
    return {
      ...r,
      available: r.available + (delta.available ?? 0),
      reserved: r.reserved + (delta.reserved ?? 0),
      inTransit: r.inTransit + (delta.inTransit ?? 0),
      total: r.total + (delta.total ?? 0),
    };
  });
}

export const createResourcesSlice: StateCreator<AppStore, [], [], ResourcesActions> = (set, get) => {
  const request = (id: string) => get().requests.find((r) => r.id === id);
  const nodeName = (id?: NodeId) => (id ? (get().nodes.find((n) => n.id === id)?.name ?? id) : '');
  const update = (id: string, patch: Partial<ResourceRequest>) =>
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const logTransition = (action: string, r: ResourceRequest, detail?: string) =>
    get().logEntry(t('RES.audit.transition', { action: tm('RES.audit.actions')[action] ?? action, name: r.resourceName, qty: r.quantity, node: nodeName(r.toNodeId) }), t('RES.audit.object', { name: r.resourceName, qty: r.quantity }), detail, CURRENT_USER.name, r.id);

  return {
    createRequest: ({ resourceName, quantity, toNodeId, priority, note, fromNodeId, requestedBy }) => {
      const { resources, clock, nextId, incident } = get();
      const template = resources.find((r) => r.name === resourceName);
      const id = nextId('req');
      // Transport requests go to Ambulanssjukvården as "Från" (SPEC.md § 6.8).
      const from = fromNodeId ?? (template?.category === 'Transport' ? AMBULANCE_NODE_ID : undefined);
      const req: ResourceRequest = {
        id,
        resourceName,
        quantity,
        unit: template?.unit ?? 'st',
        fromNodeId: from,
        toNodeId,
        priority,
        status: 'Requested',
        requestedBy: requestedBy ?? CURRENT_USER.name,
        requestedAt: formatClock(clock),
        note: note?.trim() || undefined,
        incident: Boolean(incident),
      };
      set((s) => ({ requests: [...s.requests, req] }));
      get().logEntry(t('RES.audit.requested'), t('RES.audit.object', { name: resourceName, qty: quantity }), t('RES.audit.toNode', { node: nodeName(toNodeId) }), requestedBy ?? CURRENT_USER.name, id);
      return id;
    },

    acceptRequest: (id) => {
      const r = request(id);
      if (!r || r.status !== 'Requested') return;
      update(id, { status: 'Accepted' });
      logTransition('Accepted', r);
    },

    rejectRequest: (id, reason) => {
      const r = request(id);
      if (!r || r.status !== 'Requested') return;
      update(id, { status: 'Rejected', rejectReason: reason.trim() || undefined });
      logTransition('Rejected', r, reason.trim() || undefined);
    },

    allocateRequest: (id, fromNodeId) => {
      const r = request(id);
      if (!r || r.status !== 'Accepted') return;
      const source = get().resources.find((x) => x.nodeId === fromNodeId && x.name === r.resourceName);
      if (!source || source.available < r.quantity) return;
      set((s) => ({ resources: adjust(s.resources, (x) => x.id === source.id, { available: -r.quantity, reserved: r.quantity }) }));
      update(id, { status: 'Allocated', fromNodeId });
      logTransition('Allocated', r, t('RES.audit.fromNode', { node: nodeName(fromNodeId) }));
    },

    dispatchRequest: (id, eta) => {
      const r = request(id);
      if (!r || r.status !== 'Allocated' || !r.fromNodeId) return;
      const fromNodeId = r.fromNodeId;
      set((s) => ({ resources: adjust(s.resources, (x) => x.nodeId === fromNodeId && x.name === r.resourceName, { reserved: -r.quantity, inTransit: r.quantity }) }));
      update(id, { status: 'Dispatched', eta });
      logTransition('Dispatched', r, t('RES.eta', { at: eta }));
    },

    receiveRequest: (id) => {
      const r = request(id);
      if (!r || r.status !== 'Dispatched') return;
      const { clock } = get();
      set((s) => {
        let resources = s.resources;
        const fromNodeId = r.fromNodeId;
        if (fromNodeId) {
          resources = adjust(resources, (x) => x.nodeId === fromNodeId && x.name === r.resourceName, { inTransit: -r.quantity, total: -r.quantity });
        }
        const existing = resources.find((x) => x.nodeId === r.toNodeId && x.name === r.resourceName);
        if (existing) {
          resources = adjust(resources, (x) => x.id === existing.id, { available: r.quantity, total: r.quantity });
        } else {
          const template = resources.find((x) => x.name === r.resourceName);
          resources = [
            ...resources,
            {
              id: `${r.toNodeId}-${r.resourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${s.ids + 1}`,
              nodeId: r.toNodeId,
              name: r.resourceName,
              category: template?.category ?? 'Supply',
              unit: template?.unit ?? r.unit,
              total: r.quantity,
              available: r.quantity,
              inUse: 0,
              reserved: 0,
              outOfService: 0,
              notInService: 0,
              inTransit: 0,
              unknown: 0,
              dataSource: 'Manual',
              lastConfirmed: formatClock(clock),
              confidence: 'illustrative',
            },
          ];
        }
        return { resources };
      });
      update(id, { status: 'Received' });
      logTransition('Received', r);
    },

    addNodeMessage: (text) => {
      const { clock, nextId } = get();
      if (!text.trim()) return;
      set((s) => ({
        messagesFromNodes: [...s.messagesFromNodes, { id: nextId('msg'), author: CURRENT_USER.name, role: t('LABELS.currentUserRole'), at: formatClock(clock), text: text.trim(), nodeId: KAROLINSKA_ID }],
      }));
      get().logEntry(t('RES.audit.sentMessage'), t('RES.title'), text.trim());
    },
  };
};
