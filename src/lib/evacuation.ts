// Destination and transport compatibility for evacuation planning – SPEC.md § 6.3.
import type { CareNode, MoveStatus, Patient, Resource } from '@/data/types';
import { ACCEPTS_FOR_CARE_LEVEL, EVAC, TRANSPORT_COMPATIBILITY } from '@/data/vocab';

export const EKHAGA_ID = 'ekhaga';
export const MONITOR_RESOURCE = 'Patient monitor';

export function patientName(p: Pick<Patient, 'familyName' | 'givenName'>): string {
  return `${p.familyName}, ${p.givenName}`;
}

/** The node's free count relevant to a patient's care level, with the matching total. */
export function relevantFree(node: CareNode, patient: Pick<Patient, 'careLevel'>): { free: number; total: number; kind: 'beds' | 'places' | 'intensive' } | undefined {
  if (patient.careLevel === 'Intensive') {
    if (!node.intensiveCare) return undefined;
    return { free: node.intensiveCare.free.value, total: node.intensiveCare.usable, kind: 'intensive' };
  }
  if (node.acuteBeds) return { free: node.acuteBeds.free.value, total: node.acuteBeds.total, kind: 'beds' };
  if (node.homeCarePlaces) return { free: node.homeCarePlaces.free.value, total: node.homeCarePlaces.total, kind: 'places' };
  return undefined;
}

export function monitorsAvailable(nodeId: string, resources: Resource[]): number {
  return resources.filter((r) => r.nodeId === nodeId && r.name === MONITOR_RESOURCE).reduce((s, r) => s + r.available, 0);
}

/** Whether a Monitored patient going to this node takes a Patient monitor (Ekhaga vårdhubb only). */
export function takesMonitor(patient: Pick<Patient, 'careLevel'>, destinationId: string): boolean {
  return patient.careLevel === 'Monitored' && destinationId === EKHAGA_ID;
}

/** Reason a destination is incompatible for the patient, or undefined when compatible. */
export function destinationReason(patient: Patient, node: CareNode, resources: Resource[]): string | undefined {
  const isHome = node.type === 'Home care';
  if (isHome) {
    if (!patient.homeCareEligible || !node.accepts.includes('Home')) return EVAC.reasons.doesNotAccept(patient.careLevel);
  } else if (!node.accepts.includes(ACCEPTS_FOR_CARE_LEVEL[patient.careLevel])) {
    return EVAC.reasons.doesNotAccept(patient.careLevel);
  }
  if (node.status !== 'Operational') return node.status;
  const free = relevantFree(node, patient);
  if (!free || free.free <= 0) return EVAC.reasons.noFreePlaces;
  if (takesMonitor(patient, node.id) && monitorsAvailable(node.id, resources) <= 0) return EVAC.reasons.noFreeMonitors;
  return undefined;
}

/** Reason a vehicle is incompatible for the patient, or undefined when it can be assigned. */
export function vehicleReason(patient: Pick<Patient, 'transport'>, vehicle: Resource): string | undefined {
  if (!TRANSPORT_COMPATIBILITY[patient.transport].includes(vehicle.name)) return EVAC.reasons.notSuitable(patient.transport);
  if (vehicle.available <= 0) return EVAC.reasons.noneAvailable;
  return undefined;
}

export function isInTransit(status: MoveStatus): boolean {
  return status === 'Transport assigned' || status === 'Departed';
}

export function canCancel(status: MoveStatus): boolean {
  return status === 'Planned' || status === 'Accepted' || status === 'Transport assigned';
}

export function nextStatus(status: MoveStatus): MoveStatus | undefined {
  const chain: MoveStatus[] = ['Planned', 'Accepted', 'Transport assigned', 'Departed', 'Arrived', 'Handed over'];
  const i = chain.indexOf(status);
  return chain[i + 1];
}
