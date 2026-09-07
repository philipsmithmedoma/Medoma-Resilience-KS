// Confidence, freshness and the EHR outage view of figures – SPEC.md § 7.1, DESIGN-KS.md § 4.
import type { CareNode, Confidence, Figure, SourceEntry, SyncState } from '@/data/types';
import { isStale } from './time';

export interface OutageView {
  ehrOutage: boolean;
  ehrOutageSince: string | null;
}

const RANK: Record<Confidence, number> = { verified: 0, reported: 1, estimate: 2, illustrative: 3 };

/** The weakest of several confidences (SPEC.md § 4: sums take the weakest confidence of their parts). */
export function weakest(...confidences: Confidence[]): Confidence {
  return confidences.reduce<Confidence>((a, b) => (RANK[b] > RANK[a] ? b : a), 'verified');
}

/**
 * The figure as it is displayed. During an EHR outage every figure whose data source is the EHR shows
 * source Mirror, confidence estimate and lastConfirmed frozen at the outage start (§ 7.1). The store data
 * itself is never changed, so turning the outage off restores the original view.
 */
export function viewFigure(figure: Figure, outage: OutageView): Figure {
  if (outage.ehrOutage && figure.dataSource === 'EHR') {
    return {
      ...figure,
      dataSource: 'Mirror',
      confidence: figure.confidence === 'verified' || figure.confidence === 'reported' ? 'estimate' : figure.confidence,
      verified: 0,
      estimated: figure.value ?? 0,
      lastConfirmed: outage.ehrOutageSince ?? figure.lastConfirmed,
      basis: figure.basis,
    };
  }
  return figure;
}

/** True when the displayed figure comes from the operational mirror. */
export function isMirror(figure: Figure): boolean {
  return figure.dataSource === 'Mirror';
}

/** Sum several figures into one aggregate with the weakest confidence; null parts make the sum null. */
export function sumFigures(figures: Figure[]): Figure | undefined {
  if (figures.length === 0) return undefined;
  const anyNull = figures.some((f) => f.value === null);
  const oldest = figures.reduce((a, b) => ((b.lastConfirmed ?? '') < (a.lastConfirmed ?? '') ? b : a));
  const sources = [...new Set(figures.map((f) => f.source).filter(Boolean))] as string[];
  return {
    value: anyNull ? null : figures.reduce((n, f) => n + (f.value ?? 0), 0),
    confidence: weakest(...figures.map((f) => f.confidence)),
    source: sources.length === 1 ? sources[0] : undefined,
    basis: figures.length > 1 ? 'summa av delar; svagaste klass' : figures[0].basis,
    dataSource: figures.some((f) => f.dataSource === 'Mirror') ? 'Mirror' : oldest.dataSource,
    lastConfirmed: oldest.lastConfirmed,
  };
}

/** A new figure with a changed value and the same provenance; changed values are illustrative session state. */
export function withValue(figure: Figure, value: number | null, confidence?: Confidence): Figure {
  return { ...figure, value, confidence: confidence ?? figure.confidence };
}

export function addToFigure(figure: Figure, delta: number): Figure {
  return withValue(figure, (figure.value ?? 0) + delta);
}

/** The sync state to display for a node: a sync older than 30 minutes is shown as Delayed. */
export function displaySyncState(node: Pick<CareNode, 'sync' | 'lastSync'>, clock: number): SyncState {
  if (node.sync === 'Offline') return 'Offline';
  if (isStale(clock, node.lastSync)) return 'Delayed';
  return node.sync;
}

/**
 * Sources listed in the Kapacitet sources popover. Karolinska, its sites and the region list the five
 * hospital systems; other nodes list the data sources their figures come from.
 */
export function sourcesForScope(scope: string, nodes: CareNode[], hospitalSources: SourceEntry[], outage: OutageView, clock: number): SourceEntry[] {
  if (scope === 'region' || scope === 'karolinska' || scope === 'solna' || scope === 'huddinge') {
    return hospitalSources.map((s) => {
      if (s.source === 'EHR' && outage.ehrOutage) return { ...s, state: 'Offline' };
      return { ...s, state: isStale(clock, s.lastSync) ? 'Delayed' : s.state };
    });
  }
  const node = nodes.find((n) => n.id === scope);
  if (!node) return [];
  const figures: Figure[] = [];
  if (node.staffOnDuty) figures.push(node.staffOnDuty);
  if (node.beds) figures.push(node.beds.free);
  if (node.intensiveCare) figures.push(node.intensiveCare.free);
  const seen = new Map<string, SourceEntry>();
  for (const f of figures) {
    if (!f.dataSource || !f.lastConfirmed) continue;
    if (!seen.has(f.dataSource)) {
      seen.set(f.dataSource, {
        source: f.dataSource,
        state: isStale(clock, f.lastConfirmed) ? 'Delayed' : node.sync === 'Manual' ? 'Manual' : 'Synced',
        lastSync: f.lastConfirmed,
      });
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
