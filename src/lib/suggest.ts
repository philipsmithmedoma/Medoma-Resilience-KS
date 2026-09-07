// Evacuation suggestion – SPEC.md § 6.7 "Föreslå plan". Pure: never touches the store.
import type { CareNode, NodeId, Patient, SiteId } from '@/data/types';
import { ASIH_ID, GERIATRIK_ID } from '@/data/vocab';
import { GERIATRIK_MIN_AGE, evacuationDestinations, relevantFree } from './evacuation';
import { distanceKm } from './figure';
import { otherSite } from './scope';

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
 * Proposes destinations for every patient of the site without a plan, in order Kritisk, Övervakning,
 * Stabil, respecting remaining free counts:
 * - Kritisk → the other Karolinska site while its IVA free count lasts.
 * - Övervakning → region hospitals by distance while free beds last.
 * - Stabil and eligible → ASIH; Stabil age ≥ 75 → Geriatrik; other Stabil → nearest region hospital,
 *   then an operational vårdhubb (stood-up node).
 */
export function suggestMoves(patients: Patient[], nodes: CareNode[], site: SiteId): SuggestResult {
  const source = nodes.find((n) => n.id === site)!;
  const destinations = evacuationDestinations(nodes, site);
  const remaining = new Map<string, number>();
  const bedsKey = (id: string) => id;
  const icuKey = (id: string) => `${id}:intensive`;
  for (const n of destinations) {
    remaining.set(bedsKey(n.id), n.beds?.free.value ?? 0);
    remaining.set(icuKey(n.id), n.intensiveCare?.free.value ?? 0);
  }
  // Suggested (not yet accepted) moves take no counts in the store; reserve them here so proposals stay consistent.
  for (const p of patients) {
    if (p.move?.suggested) {
      const key = p.careLevel === 'Intensive' ? icuKey(p.move.destinationId) : bedsKey(p.move.destinationId);
      remaining.set(key, (remaining.get(key) ?? 0) - 1);
    }
  }
  const take = (key: string): boolean => {
    const left = remaining.get(key) ?? 0;
    if (left <= 0) return false;
    remaining.set(key, left - 1);
    return true;
  };
  const operational = (n: CareNode) => n.status === 'Operational';
  const regionHospitals = destinations
    .filter((n) => n.type === 'Hospital' && n.site === undefined)
    .sort((a, b) => distanceKm(source, a) - distanceKm(source, b));
  const hubs = destinations.filter((n) => (n.type === 'Care hub' || n.type === 'Field hospital') && operational(n));
  const other = destinations.find((n) => n.id === otherSite(site));
  const asih = destinations.find((n) => n.id === ASIH_ID);
  const geriatrik = destinations.find((n) => n.id === GERIATRIK_ID);

  const candidates = patients.filter((p) => p.nodeId === site && !p.move).sort((a, b) => ORDER[a.stability] - ORDER[b.stability]);
  const suggestions: Suggestion[] = [];
  const unplaced: Patient[] = [];

  const tryBeds = (n: CareNode | undefined, p: Patient): NodeId | undefined => {
    if (!n || !operational(n) || !relevantFree(n, p)) return undefined;
    return take(bedsKey(n.id)) ? n.id : undefined;
  };
  const firstBeds = (list: CareNode[], p: Patient): NodeId | undefined => {
    for (const n of list) {
      const id = tryBeds(n, p);
      if (id) return id;
    }
    return undefined;
  };

  for (const p of candidates) {
    let destination: NodeId | undefined;
    if (p.stability === 'Critical') {
      if (other && operational(other) && other.intensiveCare && take(icuKey(other.id))) destination = other.id;
    } else if (p.stability === 'Monitor') {
      destination = firstBeds(regionHospitals, p);
    } else {
      if (p.homeCareEligible && asih && operational(asih) && take(bedsKey(asih.id))) destination = asih.id;
      else if (p.age >= GERIATRIK_MIN_AGE && geriatrik && operational(geriatrik) && take(bedsKey(geriatrik.id))) destination = geriatrik.id;
      else destination = firstBeds(regionHospitals, p) ?? firstBeds(hubs, p);
    }
    if (destination) suggestions.push({ patientId: p.id, destinationId: destination });
    else unplaced.push(p);
  }

  return { suggestions, unplaced };
}
