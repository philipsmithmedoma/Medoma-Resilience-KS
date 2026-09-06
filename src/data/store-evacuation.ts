// Evacuation actions – SPEC.md § 6.3. Mixed into the store as a slice.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { CareNode, Figure, NodeId, Patient, Resource } from './types';
import { EVAC, SYSTEM_ACTOR } from './vocab';
import { EKHAGA_ID, MONITOR_RESOURCE, canCancel, patientName, takesMonitor } from '@/lib/evacuation';
import { suggestMoves } from '@/lib/suggest';

export interface EvacuationActions {
  planMove: (patientId: string, destinationId: NodeId) => void;
  acceptMove: (patientId: string) => void;
  assignTransport: (patientId: string, resourceId: string) => void;
  markDeparted: (patientId: string) => void;
  markArrived: (patientId: string) => void;
  markHandedOver: (patientId: string) => void;
  cancelMove: (patientId: string) => void;
  suggestPlan: () => { suggested: number; unplaced: number };
  acceptSuggestion: (patientId: string) => void;
  rejectSuggestion: (patientId: string) => void;
  clearSuggestions: () => void;
}

/** Adjust a Figure's value; verified is consumed first, estimated when verified is exhausted. */
function adjustFigure(f: Figure, delta: number): Figure {
  if (delta < 0) {
    const fromVerified = Math.min(f.verified, -delta);
    return { ...f, value: f.value + delta, verified: f.verified - fromVerified, estimated: f.estimated - (-delta - fromVerified) };
  }
  return { ...f, value: f.value + delta, verified: f.verified + delta };
}

/** Change the destination's relevant free count (acute beds, home care places or intensive care). */
function adjustDestination(nodes: CareNode[], destinationId: NodeId, patient: Patient, delta: number): CareNode[] {
  return nodes.map((n) => {
    if (n.id !== destinationId) return n;
    if (patient.careLevel === 'Intensive' && n.intensiveCare) return { ...n, intensiveCare: { ...n.intensiveCare, free: adjustFigure(n.intensiveCare.free, delta) } };
    if (n.acuteBeds) return { ...n, acuteBeds: { ...n.acuteBeds, free: adjustFigure(n.acuteBeds.free, delta) } };
    if (n.homeCarePlaces) return { ...n, homeCarePlaces: { ...n.homeCarePlaces, free: adjustFigure(n.homeCarePlaces.free, delta) } };
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

/** Take the counts of a plan: destination free −1 and, for a Monitored patient to Ekhaga, one Patient monitor. */
function takePlanCounts(nodes: CareNode[], resources: Resource[], patient: Patient, destinationId: NodeId, sign: 1 | -1) {
  const nextNodes = adjustDestination(nodes, destinationId, patient, -sign);
  const nextResources = takesMonitor(patient, destinationId)
    ? adjustResource(resources, (r) => r.nodeId === EKHAGA_ID && r.name === MONITOR_RESOURCE, { available: -sign, reserved: sign })
    : resources;
  return { nodes: nextNodes, resources: nextResources };
}

export const createEvacuationSlice: StateCreator<AppStore, [], [], EvacuationActions> = (set, get) => {
  const patientById = (id: string) => get().patients.find((p) => p.id === id);
  const nodeName = (id: NodeId) => get().nodes.find((n) => n.id === id)?.name ?? id;
  const updatePatient = (id: string, patch: (p: Patient) => Patient) =>
    set((s) => ({ patients: s.patients.map((p) => (p.id === id ? patch(p) : p)) }));

  const plan = (patient: Patient, destinationId: NodeId, suggested: boolean) => {
    const { nodes, resources } = get();
    const counts = takePlanCounts(nodes, resources, patient, destinationId, 1);
    set({ ...counts });
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
      const { nodes, resources } = get();
      let counts = takePlanCounts(nodes, resources, patient, patient.move.destinationId, -1);
      if (patient.move.status === 'Transport assigned' && patient.move.transportId) {
        const transportId = patient.move.transportId;
        counts = { ...counts, resources: adjustResource(counts.resources, (r) => r.id === transportId, { reserved: -1, available: 1 }) };
      }
      set({ ...counts });
      updatePatient(patientId, (p) => ({ ...p, move: undefined }));
      get().logEntry(EVAC.audit.cancelled(patientName(patient)), patientName(patient), nodeName(patient.move.destinationId));
    },

    suggestPlan: () => {
      const { patients, nodes, resources, logEntry } = get();
      const result = suggestMoves(patients, nodes, resources);
      const byPatient = new Map(result.suggestions.map((s) => [s.patientId, s.destinationId]));
      set((s) => ({
        patients: s.patients.map((p) => {
          const dest = byPatient.get(p.id);
          return dest ? { ...p, move: { destinationId: dest, status: 'Planned', suggested: true } } : p;
        }),
      }));
      logEntry(EVAC.audit.suggested(result.suggestions.length), EVAC.title, `${result.unplaced.length} could not be placed`, SYSTEM_ACTOR);
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

    clearSuggestions: () => {
      const suggested = get().patients.filter((p) => p.move?.suggested);
      if (suggested.length === 0) return;
      set((s) => ({ patients: s.patients.map((p) => (p.move?.suggested ? { ...p, move: undefined } : p)) }));
      get().logEntry(EVAC.clearSuggestions, EVAC.title, `${suggested.length} suggestions rejected`);
    },
  };
};
