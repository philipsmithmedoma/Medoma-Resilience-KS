// Confidence, freshness and the EHR outage view of figures – SPEC.md § 7.1, § 7.2, § 5.2.
import type { CareNode, Figure, SourceEntry, SyncState } from '@/data/types';
import { VIKBY_SOURCES } from '@/data/mock';
import { HOME_NODE_ID, REGION_ID } from '@/data/vocab';
import { isStale } from './time';

export interface OutageView {
  ehrOutage: boolean;
  ehrOutageSince: string | null;
}

/**
 * The figure as it is displayed. During an EHR outage every Figure with source EHR shows source
 * Mirror, all of its value as estimated and lastConfirmed frozen at the outage start (§ 7.2).
 * The store data itself is never changed, so turning the outage off restores the original view.
 */
export function viewFigure(figure: Figure, outage: OutageView): Figure {
  if (outage.ehrOutage && figure.source === 'EHR') {
    return {
      ...figure,
      source: 'Mirror',
      verified: 0,
      estimated: figure.value,
      lastConfirmed: outage.ehrOutageSince ?? figure.lastConfirmed,
    };
  }
  return figure;
}

/** Sum several figures into one aggregate; source and lastConfirmed are taken from the oldest figure. */
export function sumFigures(figures: Figure[]): Figure | undefined {
  if (figures.length === 0) return undefined;
  const oldest = figures.reduce((a, b) => (b.lastConfirmed < a.lastConfirmed ? b : a));
  return {
    value: figures.reduce((n, f) => n + f.value, 0),
    verified: figures.reduce((n, f) => n + f.verified, 0),
    estimated: figures.reduce((n, f) => n + f.estimated, 0),
    source: oldest.source,
    lastConfirmed: oldest.lastConfirmed,
  };
}

/** The sync state to display for a node: a sync older than 30 minutes is shown as Delayed (§ 5.2). */
export function displaySyncState(node: Pick<CareNode, 'sync' | 'lastSync'>, clock: number): SyncState {
  if (node.sync === 'Offline') return 'Offline';
  if (isStale(clock, node.lastSync)) return 'Delayed';
  return node.sync;
}

/** True when the Figure's own source is affected by the EHR outage. */
export function isEhrFigure(figure: Figure): boolean {
  return figure.source === 'EHR';
}

/**
 * Sources listed in the Command Center sources popover. Vikby sjukhus (and the region, whose
 * command centre is Vikby) list the five hospital systems; other nodes list the sources their
 * figures come from.
 */
export function sourcesForScope(scope: string, nodes: CareNode[], outage: OutageView, clock: number): SourceEntry[] {
  if (scope === REGION_ID || scope === HOME_NODE_ID) {
    return VIKBY_SOURCES.map((s) => {
      if (s.source === 'EHR' && outage.ehrOutage) return { ...s, state: 'Offline' };
      return { ...s, state: isStale(clock, s.lastSync) ? 'Delayed' : s.state };
    });
  }
  const node = nodes.find((n) => n.id === scope);
  if (!node) return [];
  const figures: Figure[] = [node.staffOnDuty];
  if (node.acuteBeds) figures.push(node.acuteBeds.free);
  if (node.homeCarePlaces) figures.push(node.homeCarePlaces.free);
  if (node.intensiveCare) figures.push(node.intensiveCare.free);
  const seen = new Map<string, SourceEntry>();
  for (const f of figures) {
    if (!seen.has(f.source)) {
      seen.set(f.source, { source: f.source, state: isStale(clock, f.lastConfirmed) ? 'Delayed' : node.sync === 'Manual' ? 'Manual' : 'Synced', lastSync: f.lastConfirmed });
    }
  }
  return [...seen.values()];
}

/** Straight-line distance between two coordinates in km (haversine), rounded to whole km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
