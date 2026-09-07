// Evacuation actions – SPEC.md § 6.7. Mixed into the store as a slice.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { CareNode, NodeId, Patient, Resource, SiteId } from './types';
import { EVAC, SYSTEM_ACTOR } from './vocab';
import { canCancel, patientName } from '@/lib/evacuation';
import { addToFigure } from '@/lib/figure';
import { suggestMoves } from '@/lib/suggest';

export interface EvacuationActions {
  planMove: (patientId: string, destinationId: NodeId) => void;
  acceptMove: (patientId: string) => void;
  assignTransport: (patientId: string, resourceId: string) => void;
  markDeparted: (patientId: string) => void;
  markArrived: (patientId: string) => void;
  markHandedOver: (patientId: string) => void;
  cancelMove: (patientId: string) => void;
  suggestPlan: (site: SiteId) => { suggested: number; unplaced: number };
  acceptSuggestion: (patientId: string) => void;
  rejectSuggestion: (patientId: string) => void;
  clearSuggestions: (site: SiteId) => void;
}

/** Change the destination's relevant free count (beds or IVA). */
function adjustDestination(nodes: CareNode[], destinationId: NodeId, patient: Patient, delta: number): CareNode[] {
  return nodes.map((n) => {
    if (n.id !== destinationId) return n;
    if (patient.careLevel === 'Intensive' && n.intensiveCare) return { ...n, intensiveCare: { ...n.intensiveCare, free: addToFigure(n.intensiveCare.free, delta) } };
    if (n.beds) return { ...n, beds: { ...n.beds, free: addToFigure(n.beds.free, delta) } };
    return n;
  });
}

function adjustResource(resources: Resource[], match: (r: Resource) => boolean, delta: Partial<Pick<Resource, 'available' | 'reserved' | 'inUse'>>): Resource[] {
  let done = false;
  return resources.map((r) => {
    if (done || !match(r)) return r;
    done = true;
    return { ...r, available: r.available + (delta.available ?? 0), reserved: r.reserved + (delta.reserved ?? 0), inUse: r.inUse + (delta.inUse ?? 0) };
  });
}

export const createEvacuationSlice: StateCreator<AppStore, [], [], EvacuationActions> = (set, get) => {
  const patientById = (id: string) => get().patients.find((p) => p.id === id);
  const nodeName = (id: NodeId) => get().nodes.find((n) => n.id === id)?.name ?? id;
  const updatePatient = (id: string, patch: (p: Patient) => Patient) =>
    set((s) => ({ patients: s.patients.map((p) => (p.id === id ? patch(p) : p)) }));

  const plan = (patient: Patient, destinationId: NodeId, suggested: boolean) => {
    set((s) => ({ nodes: adjustDestination(s.nodes, destinationId, patient, -1) }));
    updatePatient(patient.id, (p) => ({ ...p, move: { destinationId, status: 'Planned', suggested: false } }));
    get().logEntry(
      suggested ? EVAC.audit.authorised(patientName(patient), nodeName(destinationId)) : EVAC.audit.planned(patientName(patient), nodeName(destinationId)),
      patientName(patient),
      nodeName(destinationId),
    );
  };

  return {
    planMove: (patientId, destinationId) => {
      const patient = patientById(patientId);
      if (!patient || patient.move) return;
      plan(patient, destinationId, false);
    },

    acceptMove: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move || patient.move.status !== 'Planned' || patient.move.suggested) return;
      updatePatient(patientId, (p) => ({ ...p, move: { ...p.move!, status: 'Accepted' } }));
      get().logEntry(EVAC.audit.accepted(patientName(patient)), patientName(patient), nodeName(patient.move.destinationId));
    },

    assignTransport: (patientId, resourceId) => {
      const patient = patientById(patientId);
      const vehicle = get().resources.find((r) => r.id === resourceId);
      if (!patient?.move || patient.move.status !== 'Accepted' || !vehicle || vehicle.available <= 0) return;
      set((s) => ({ resources: adjustResource(s.resources, (r) => r.id === resourceId, { available: -1, reserved: 1 }) }));
      updatePatient(patientId, (p) => ({ ...p, move: { ...p.move!, status: 'Transport assigned', transportId: resourceId } }));
      get().logEntry(EVAC.audit.assigned(patientName(patient), vehicle.name), patientName(patient), vehicle.name);
    },

    markDeparted: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move || patient.move.status !== 'Transport assigned') return;
      const transportId = patient.move.transportId;
      set((s) => ({ resources: adjustResource(s.resources, (r) => r.id === transportId, { reserved: -1, inUse: 1 }) }));
      updatePatient(patientId, (p) => ({ ...p, move: { ...p.move!, status: 'Departed' } }));
      get().logEntry(EVAC.audit.departed(patientName(patient)), patientName(patient), nodeName(patient.move.destinationId));
    },

    markArrived: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move || patient.move.status !== 'Departed') return;
      const transportId = patient.move.transportId;
      set((s) => ({ resources: adjustResource(s.resources, (r) => r.id === transportId, { inUse: -1, available: 1 }) }));
      updatePatient(patientId, (p) => ({ ...p, move: { ...p.move!, status: 'Arrived' } }));
      get().logEntry(EVAC.audit.arrived(patientName(patient), nodeName(patient.move.destinationId)), patientName(patient), nodeName(patient.move.destinationId));
    },

    markHandedOver: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move || patient.move.status !== 'Arrived') return;
      updatePatient(patientId, (p) => ({ ...p, move: { ...p.move!, status: 'Handed over' } }));
      get().logEntry(EVAC.audit.handedOver(patientName(patient), nodeName(patient.move.destinationId)), patientName(patient), nodeName(patient.move.destinationId));
    },

    cancelMove: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move || patient.move.suggested || !canCancel(patient.move.status)) return;
      const move = patient.move;
      set((s) => {
        let resources = s.resources;
        if (move.status === 'Transport assigned' && move.transportId) {
          resources = adjustResource(resources, (r) => r.id === move.transportId, { reserved: -1, available: 1 });
        }
        return { nodes: adjustDestination(s.nodes, move.destinationId, patient, 1), resources };
      });
      updatePatient(patientId, (p) => ({ ...p, move: undefined }));
      get().logEntry(EVAC.audit.cancelled(patientName(patient)), patientName(patient), nodeName(move.destinationId));
    },

    suggestPlan: (site) => {
      const { patients, nodes, logEntry } = get();
      const result = suggestMoves(patients, nodes, site);
      const byPatient = new Map(result.suggestions.map((s) => [s.patientId, s.destinationId]));
      set((s) => ({
        patients: s.patients.map((p) => {
          const dest = byPatient.get(p.id);
          return dest ? { ...p, move: { destinationId: dest, status: 'Planned', suggested: true } } : p;
        }),
      }));
      logEntry(EVAC.audit.suggested(result.suggestions.length), EVAC.title, EVAC.audit.suggestedDetail(result.unplaced.length), SYSTEM_ACTOR);
      return { suggested: result.suggestions.length, unplaced: result.unplaced.length };
    },

    acceptSuggestion: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move?.suggested) return;
      const destinationId = patient.move.destinationId;
      updatePatient(patientId, (p) => ({ ...p, move: undefined }));
      plan({ ...patient, move: undefined }, destinationId, true);
    },

    rejectSuggestion: (patientId) => {
      const patient = patientById(patientId);
      if (!patient?.move?.suggested) return;
      updatePatient(patientId, (p) => ({ ...p, move: undefined }));
      get().logEntry(EVAC.audit.rejected(patientName(patient)), patientName(patient), nodeName(patient.move.destinationId));
    },

    clearSuggestions: (site) => {
      const suggested = get().patients.filter((p) => p.nodeId === site && p.move?.suggested);
      if (suggested.length === 0) return;
      set((s) => ({ patients: s.patients.map((p) => (p.nodeId === site && p.move?.suggested ? { ...p, move: undefined } : p)) }));
      get().logEntry(EVAC.audit.cleared, EVAC.title, EVAC.audit.clearedDetail(suggested.length));
    },
  };
};
