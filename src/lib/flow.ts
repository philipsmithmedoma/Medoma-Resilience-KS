// Läget nu: live site values, block statuses and row definitions – SPEC.md § 6.1. Pure.
import type { BedRequest, CareNode, Figure, FlowBlock, FlowMetric, SiteId, Ward } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { viewFigure, weakest, withValue, type OutageView } from './figure';
import { fmt, fmtDuration, fmtPct } from './format';
import { isImaWard } from './placement';
import { INITIAL_CLOCK } from './time';

export type BlockStatus = 'Normalt' | 'Ansträngt' | 'Kritiskt';

export interface SiteValues {
  site: SiteId;
  figures: Record<string, Figure>; // by metric key, including derived keys
}

export interface FlowInputs {
  flowMetrics: FlowMetric[];
  nodes: CareNode[];
  wards: Ward[];
  bedRequests: BedRequest[];
  edName: Record<SiteId, string>;
  clock: number;
  outage: OutageView;
}

function num(f: Figure | undefined): number {
  return f?.value ?? 0;
}

/**
 * The live figures of one site: pack metrics plus derived values – lediga and belagda from the node's
 * free beds, IVA lediga/belagda from the node's IVA figure, IMA from the wards, longest wait and the
 * placement queue from the bed requests (their waiting time grows with the clock).
 */
export function siteValues(site: SiteId, inputs: FlowInputs): SiteValues {
  const { flowMetrics, nodes, wards, bedRequests, edName, clock, outage } = inputs;
  const figures: Record<string, Figure> = {};
  for (const m of flowMetrics) if (m.site === site) figures[m.key] = viewFigure(m.value, outage);
  const node = nodes.find((n) => n.id === site);
  if (node?.beds) {
    const free = viewFigure(node.beds.free, outage);
    const disponibla = num(node.beds.total);
    figures['beds.lediga'] = free;
    figures['beds.belagda'] = withValue({ ...figures['beds.belagda'], dataSource: free.dataSource, lastConfirmed: free.lastConfirmed }, disponibla - num(free));
    figures['beds.belaggning'] = { ...free, value: disponibla > 0 ? (disponibla - num(free)) / disponibla : null, basis: 'härlett: belagda genom disponibla' };
  }
  if (node?.intensiveCare) {
    const free = viewFigure(node.intensiveCare.free, outage);
    figures['iva.free'] = free;
    figures['iva.occupied'] = withValue({ ...figures['iva.occupied'], dataSource: free.dataSource, lastConfirmed: free.lastConfirmed }, num(node.intensiveCare.total) - num(free));
  }
  const ima = wards.find((w) => w.site === site && isImaWard(w));
  if (ima) {
    figures['ima.total'] = withValue(figures['ima.total'] ?? { value: null, confidence: 'illustrative' }, ima.total);
    figures['ima.occupied'] = withValue(figures['ima.occupied'] ?? { value: null, confidence: 'illustrative' }, ima.total - ima.free);
  }
  const drift = clock - INITIAL_CLOCK;
  const edRequests = bedRequests.filter((r) => r.site === site && r.from === edName[site]);
  if (edRequests.length) {
    const longest = Math.max(...edRequests.map((r) => r.waitingMin)) + Math.max(0, drift);
    figures['akuten.longestWait'] = withValue(figures['akuten.longestWait'], longest);
  } else if (figures['akuten.longestWait']) {
    figures['akuten.longestWait'] = withValue(figures['akuten.longestWait'], 0);
  }
  return { site, figures };
}

const THRESHOLDS: Record<FlowBlock, (f: Record<string, Figure>) => BlockStatus> = {
  akuten: (f) => {
    const waiting = num(f['akuten.waitingBed']);
    const longest = num(f['akuten.longestWait']);
    if (waiting >= 20 || longest >= 360) return 'Kritiskt';
    if (waiting >= 10 || num(f['akuten.over4h']) >= 0.35) return 'Ansträngt';
    return 'Normalt';
  },
  vardplatser: (f) => {
    const occupancy = f['beds.belaggning']?.value ?? 0;
    if (occupancy >= 1 || num(f['beds.overbelaggning']) >= 5) return 'Kritiskt';
    if (occupancy >= 0.95 || num(f['beds.utlokaliserade']) >= 5) return 'Ansträngt';
    return 'Normalt';
  },
  operation: (f) => {
    const cancelled = num(f['op.cancelled']);
    if (cancelled >= 5) return 'Kritiskt';
    if (cancelled >= 2) return 'Ansträngt';
    return 'Normalt';
  },
  bild: (f) => {
    const waiting = num(f['ct.waiting']);
    if (waiting >= 15) return 'Kritiskt';
    if (waiting >= 8 || num(f['ct.down']) > 0) return 'Ansträngt';
    return 'Normalt';
  },
  iva: (f) => {
    const free = num(f['iva.free']);
    const waiting = num(f['iva.waiting']);
    if (free === 0 && waiting >= 2) return 'Kritiskt';
    if (free <= 1 || waiting >= 1) return 'Ansträngt';
    return 'Normalt';
  },
  bemanning: (f) => {
    const vacant = num(f['staff.vacant']);
    if (vacant >= 15) return 'Kritiskt';
    if (vacant >= 8) return 'Ansträngt';
    return 'Normalt';
  },
};

const RANK: Record<BlockStatus, number> = { Normalt: 0, Ansträngt: 1, Kritiskt: 2 };

/** Status of a block for one site (thresholds of SPEC.md § 6.1). */
export function siteBlockStatus(block: FlowBlock, values: SiteValues): BlockStatus {
  return THRESHOLDS[block](values.figures);
}

/** Status across sites: the worse of the site statuses, never thresholds applied to sums. */
export function blockStatus(block: FlowBlock, sites: SiteValues[]): BlockStatus {
  return sites.map((s) => siteBlockStatus(block, s)).reduce<BlockStatus>((a, b) => (RANK[b] > RANK[a] ? b : a), 'Normalt');
}

// ---------------------------------------------------------------------------
// Rows per block (DATA.md § 4)
export type RowFormat = 'number' | 'pct' | 'duration' | 'minutes';
export type RowAggregate = 'sum' | 'none' | 'ratio';

export interface FlowRow {
  key: string;
  labelKey?: string; // FLOW_LABELS key when it differs from the metric key (composite rows)
  format: RowFormat;
  aggregate: RowAggregate; // how the Karolinska column is built
  qualifierKey?: string; // metric whose value is shown as qualifier, e.g. "varav 5 ASIH-kandidater"
  composite?: string[]; // keys joined with " / " (e.g. IVA-platser / belagda / lediga)
  unlock?: 'placement' | 'discharge' | 'surgery' | 'ct' | 'intensive' | 'staffing';
}

/** Row label in the current locale. */
export function rowLabel(row: Pick<FlowRow, 'key' | 'labelKey'>): string {
  const labels = tm('FLOW_LABELS');
  return labels[row.labelKey ?? row.key] ?? row.key;
}

export const FLOW_ROWS: Record<FlowBlock, FlowRow[]> = {
  akuten: [
    { key: 'akuten.patients', format: 'number', aggregate: 'sum' },
    { key: 'akuten.waitingBed', format: 'number', aggregate: 'sum', unlock: 'placement' },
    { key: 'akuten.longestWait', format: 'duration', aggregate: 'none' },
    { key: 'akuten.over4h', format: 'pct', aggregate: 'none' },
    { key: 'akuten.timeToDoctor', format: 'minutes', aggregate: 'none' },
    { key: 'akuten.trauma', format: 'number', aggregate: 'sum' },
  ],
  vardplatser: [
    { key: 'beds.disponibla', format: 'number', aggregate: 'sum' },
    { key: 'beds.belagda', format: 'number', aggregate: 'sum' },
    { key: 'beds.belaggning', format: 'pct', aggregate: 'ratio' },
    { key: 'beds.lediga', format: 'number', aggregate: 'sum' },
    { key: 'beds.overbelaggning', format: 'number', aggregate: 'sum' },
    { key: 'beds.utlokaliserade', format: 'number', aggregate: 'sum' },
    { key: 'beds.utskrivningsklara', format: 'number', aggregate: 'sum', qualifierKey: 'beds.asihEligible', unlock: 'discharge' },
  ],
  operation: [
    { key: 'op.program', format: 'number', aggregate: 'sum' },
    { key: 'op.done', format: 'number', aggregate: 'sum' },
    { key: 'op.cancelled', format: 'number', aggregate: 'sum', unlock: 'surgery' },
    { key: 'op.waiting90', format: 'number', aggregate: 'sum' },
  ],
  bild: [
    { key: 'ct.waiting', format: 'number', aggregate: 'sum', unlock: 'ct' },
    { key: 'ct.median', format: 'minutes', aggregate: 'none' },
    { key: 'ct.down', format: 'number', aggregate: 'sum', composite: ['ct.down', 'ct.total'] },
    { key: 'mr.waiting', format: 'number', aggregate: 'sum' },
  ],
  iva: [
    { key: 'iva.total', labelKey: 'iva.composite', format: 'number', aggregate: 'sum', composite: ['iva.total', 'iva.occupied', 'iva.free'], unlock: 'intensive' },
    { key: 'iva.waiting', format: 'number', aggregate: 'sum' },
    { key: 'iva.stepdown', format: 'number', aggregate: 'sum' },
    { key: 'ima.total', labelKey: 'ima.composite', format: 'number', aggregate: 'sum', composite: ['ima.total', 'ima.occupied'] },
  ],
  bemanning: [
    { key: 'staff.vacant', format: 'number', aggregate: 'sum', unlock: 'staffing' },
    { key: 'staff.agency', format: 'number', aggregate: 'sum' },
    { key: 'staff.sick', format: 'pct', aggregate: 'none' },
  ],
};

export function formatRowValue(format: RowFormat, value: number | null): string {
  if (value === null) return t('LABELS.unknown');
  switch (format) {
    case 'pct':
      return fmtPct(value);
    case 'duration':
      return fmtDuration(value);
    case 'minutes':
      return `${fmt(value)} min`;
    default:
      return fmt(value);
  }
}

/** The Karolinska (sum) figure for a row, or undefined when the row is per site only. */
export function aggregateFigure(row: FlowRow, sites: SiteValues[]): Figure | undefined {
  if (row.aggregate === 'none' || sites.length < 2) return undefined;
  const parts = sites.map((s) => s.figures[row.key]).filter(Boolean) as Figure[];
  if (parts.length === 0) return undefined;
  const confidence = weakest(...parts.map((p) => p.confidence));
  if (row.aggregate === 'ratio') {
    const belagda = sites.reduce((n, s) => n + num(s.figures['beds.belagda']), 0);
    const disponibla = sites.reduce((n, s) => n + num(s.figures['beds.disponibla']), 0);
    return { ...parts[0], confidence, value: disponibla > 0 ? belagda / disponibla : null, basis: 'total belagda genom total disponibla' };
  }
  return { ...parts[0], confidence, value: parts.some((p) => p.value === null) ? null : parts.reduce((n, p) => n + (p.value ?? 0), 0) };
}

/** Sum of a metric across sites (helper for KPI strips). */
export function sumMetric(key: string, sites: SiteValues[]): number {
  return sites.reduce((n, s) => n + num(s.figures[key]), 0);
}
