// Destination and transport compatibility for evacuation planning – SPEC.md § 6.7.
import type { CareNode, MoveStatus, Patient, Resource, SiteId } from '@/data/types';
import { ACCEPTS_FOR_CARE_LEVEL, AMBULANCE_NODE_ID, ASIH_ID, CARE_LEVEL_LABELS, EVAC, GERIATRIK_ID, TRANSPORT_COMPATIBILITY, TRANSPORT_LABELS, VEHICLES } from '@/data/vocab';

export const GERIATRIK_MIN_AGE = 75;

export function patientName(p: Pick<Patient, 'familyName' | 'givenName'>): string {
  return `${p.familyName}, ${p.givenName}`;
}

/** Nodes that can be an evacuation destination from a site (SPEC.md § 6.7). */
export function evacuationDestinations(nodes: CareNode[], site: SiteId): CareNode[] {
  return nodes.filter((n) => n.id !== site && n.type !== 'Transport' && (n.accepts.length > 0 || n.plannedBeds !== undefined));
}

/** The node's free count relevant to a patient's care level, with the matching total (null = unknown). */
export function relevantFree(node: CareNode, patient: Pick<Patient, 'careLevel'>): { free: number | null; total: number | null; kind: 'beds' | 'intensive' } | undefined {
  if (patient.careLevel === 'Intensive') {
    if (!node.intensiveCare) return undefined;
    return { free: node.intensiveCare.free.value, total: node.intensiveCare.total.value, kind: 'intensive' };
  }
  if (node.beds) return { free: node.beds.free.value, total: node.beds.total.value, kind: 'beds' };
  return undefined;
}

/** Reason a destination is incompatible for the patient, or undefined when compatible. */
export function destinationReason(patient: Patient, node: CareNode): string | undefined {
  if (node.type === 'Home care' || node.id === ASIH_ID) {
    if (!node.accepts.includes('Home')) return EVAC.reasons.doesNotAccept(CARE_LEVEL_LABELS[patient.careLevel]);
    if (!patient.homeCareEligible || patient.stability !== 'Stable') return EVAC.reasons.notEligible;
  } else if (!node.accepts.includes(ACCEPTS_FOR_CARE_LEVEL[patient.careLevel])) {
    return EVAC.reasons.doesNotAccept(CARE_LEVEL_LABELS[patient.careLevel]);
  }
  if (node.id === GERIATRIK_ID) {
    if (patient.stability !== 'Stable') return EVAC.reasons.doesNotAccept(CARE_LEVEL_LABELS[patient.careLevel]);
    if (patient.age < GERIATRIK_MIN_AGE) return EVAC.reasons.ageLimit;
  }
  if (node.status !== 'Operational') return node.status;
  const free = relevantFree(node, patient);
  if (!free) return EVAC.reasons.noFreePlaces;
  if (free.free === null) return patient.careLevel === 'Intensive' ? EVAC.reasons.ivaUnknown : EVAC.reasons.noFreePlaces;
  if (free.free <= 0) return EVAC.reasons.noFreePlaces;
  return undefined;
}

/** Vehicles of the Ambulanssjukvården node that can carry evacuated patients. */
export function evacuationVehicles(resources: Resource[]): Resource[] {
  return resources.filter((r) => r.nodeId === AMBULANCE_NODE_ID && r.category === 'Transport' && r.name !== VEHICLES.helicopter);
}

/** Reason a vehicle is incompatible for the patient, or undefined when it can be assigned. */
export function vehicleReason(patient: Pick<Patient, 'transport'>, vehicle: Resource): string | undefined {
  if (!TRANSPORT_COMPATIBILITY[patient.transport].includes(vehicle.name)) return EVAC.reasons.notSuitable(TRANSPORT_LABELS[patient.transport]);
  if (vehicle.available <= 0) return EVAC.reasons.noneAvailable;
  return undefined;
}

export function isInTransit(status: MoveStatus): boolean {
  return status === 'Transport assigned' || status === 'Departed';
}

export function hasLeft(status: MoveStatus): boolean {
  return status === 'Departed' || status === 'Arrived' || status === 'Handed over';
}

export function canCancel(status: MoveStatus): boolean {
  return status === 'Planned' || status === 'Accepted' || status === 'Transport assigned';
}
