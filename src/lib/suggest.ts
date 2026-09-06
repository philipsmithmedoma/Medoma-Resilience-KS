// Evacuation suggestion – SPEC.md § 6.3 "Suggest plan". Pure: never touches the store.
import type { CareNode, NodeId, Patient, Resource } from '@/data/types';
import { monitorsAvailable, relevantFree } from './evacuation';

export interface Suggestion {
  patientId: string;
  destinationId: NodeId;
}

export interface SuggestResult {
  suggestions: Suggestion[];
  unplaced: Patient[];
}

const ORDER = { Critical: 0, Monitor: 1, Stable: 2 } as const;

/**
 * Proposes destinations for every patient without a plan, in priority order Critical, Monitor,
 * Stable, respecting remaining free counts (decremented as it goes):
 * - Critical → Sjöberga sjukhus while its intensive care free count lasts.
 * - Monitor → Ekhaga vårdhubb while its Patient monitor count (and beds) last, then Sjöberga acute beds.
 * - Stable and homeCareEligible → Hemsjukvård Sollentuna while its free places last, then as other Stable.
 * - Other Stable → Fältsjukhus Alfa when Operational, else Ekhaga vårdhubb.
 */
export function suggestMoves(patients: Patient[], nodes: CareNode[], resources: Resource[]): SuggestResult {
  const remaining = new Map<string, number>(); // key: nodeId or nodeId:intensive or nodeId:monitor
  const node = (id: string) => nodes.find((n) => n.id === id);
  const bedsKey = (id: string) => id;
  const icuKey = (id: string) => `${id}:intensive`;
  const monitorKey = (id: string) => `${id}:monitor`;

  for (const n of nodes) {
    const beds = n.acuteBeds ?? n.homeCarePlaces;
    remaining.set(bedsKey(n.id), beds?.free.value ?? 0);
    if (n.intensiveCare) remaining.set(icuKey(n.id), n.intensiveCare.free.value);
    remaining.set(monitorKey(n.id), monitorsAvailable(n.id, resources));
  }
  // Already planned (non-suggested) moves are reflected in the node counts already; suggested ones are not,
  // so reserve their places here to keep proposals consistent.
  for (const p of patients) {
    if (p.move?.suggested) {
      const key = p.careLevel === 'Intensive' ? icuKey(p.move.destinationId) : bedsKey(p.move.destinationId);
      remaining.set(key, (remaining.get(key) ?? 0) - 1);
      if (p.careLevel === 'Monitored' && p.move.destinationId === 'ekhaga') {
        remaining.set(monitorKey('ekhaga'), (remaining.get(monitorKey('ekhaga')) ?? 0) - 1);
      }
    }
  }

  const take = (key: string): boolean => {
    const left = remaining.get(key) ?? 0;
    if (left <= 0) return false;
    remaining.set(key, left - 1);
    return true;
  };
  const operational = (id: string) => node(id)?.status === 'Operational';
  const accepts = (id: string, patient: Patient) => {
    const n = node(id);
    if (!n) return false;
    if (n.type === 'Home care') return patient.homeCareEligible && n.accepts.includes('Home');
    const level = patient.careLevel === 'Intensive' ? 'Intensive' : patient.careLevel === 'Monitored' ? 'Monitored' : 'Ward';
    return n.accepts.includes(level) && relevantFree(n, patient) !== undefined;
  };

  const candidates = patients.filter((p) => !p.move).sort((a, b) => ORDER[a.stability] - ORDER[b.stability]);
  const suggestions: Suggestion[] = [];
  const unplaced: Patient[] = [];

  const tryBeds = (id: string, p: Patient) => operational(id) && accepts(id, p) && take(bedsKey(id));

  for (const p of candidates) {
    let destination: NodeId | undefined;
    if (p.stability === 'Critical') {
      if (operational('sjoberga') && accepts('sjoberga', p) && take(icuKey('sjoberga'))) destination = 'sjoberga';
    } else if (p.stability === 'Monitor') {
      if (operational('ekhaga') && accepts('ekhaga', p) && (remaining.get(monitorKey('ekhaga')) ?? 0) > 0 && (remaining.get(bedsKey('ekhaga')) ?? 0) > 0) {
        take(monitorKey('ekhaga'));
        take(bedsKey('ekhaga'));
        destination = 'ekhaga';
      } else if (tryBeds('sjoberga', p)) destination = 'sjoberga';
    } else {
      if (p.homeCareEligible && tryBeds('hemsjukvard', p)) destination = 'hemsjukvard';
      else if (operational('falt-alfa') && tryBeds('falt-alfa', p)) destination = 'falt-alfa';
      else if (tryBeds('ekhaga', p)) destination = 'ekhaga';
    }
    if (destination) suggestions.push({ patientId: p.id, destinationId: destination });
    else unplaced.push(p);
  }

  return { suggestions, unplaced };
}
