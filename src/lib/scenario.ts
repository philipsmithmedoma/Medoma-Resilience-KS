// Scenario engine – SPEC.md § 7.3. Pure, deterministic, tick-based; integer distribution with carry.
import type { Recommendation, ScenarioEvent, ScenarioInputs, ScenarioKey, ScenarioPreset, SiteId, TickResult } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { fmt, fmtOffset } from './format';

export interface SimulationResult {
  series: TickResult[];
  events: ScenarioEvent[];
  recommendations: Recommendation[];
}

/** Applied recommendations with the tick they were applied at. */
export type Applied = Record<string, number>;

const SITES: SiteId[] = ['solna', 'huddinge'];

/** Integer distribution with carry: is item j (0-based) the one that crosses the next integer at share p? */
export function crosses(j: number, p: number): boolean {
  return Math.floor((j + 1) * p + 1e-9) - Math.floor(j * p + 1e-9) === 1;
}

/** Sequential largest-deficit assignment: the index whose running count lags its target share the most. */
function pickByShare(counts: number[], shares: number[], served: number): number {
  let best = 0;
  let bestDeficit = -Infinity;
  shares.forEach((share, i) => {
    const deficit = (served + 1) * share - counts[i];
    if (deficit > bestDeficit + 1e-9) {
      bestDeficit = deficit;
      best = i;
    }
  });
  return best;
}

interface Pool {
  pool: string;
  site: string;
  capacity: (tick: number) => number;
  demand: (tick: number) => number;
}

function rec(key: string, applicable: boolean, applied: Applied): Recommendation {
  const r = tm('SCENARIO.recs')[key];
  return { key, label: r.label, effect: r.effect, applicable: applicable && applied[key] === undefined };
}

function offsetLabel(minutes: number, dayTicks: boolean): string {
  return dayTicks ? t('SCENARIO.offsetDay', { d: Math.round(minutes / 1440) }) : fmtOffset(minutes);
}

/** Builds the series from pools and emits the first-brist event per pool. */
function run(pools: Pool[], horizon: number, tickMin: number, dayTicks: boolean, siteName: (site: string) => string): { series: TickResult[]; events: ScenarioEvent[] } {
  const series: TickResult[] = [];
  const events: ScenarioEvent[] = [];
  const flagged = new Set<string>();
  for (let tk = 0; tk <= horizon; tk++) {
    const result: TickResult = { tick: tk, pools: pools.map((p) => ({ pool: p.pool, site: p.site, demand: round1(p.demand(tk)), capacity: round1(p.capacity(tk)) })) };
    series.push(result);
    for (const p of result.pools) {
      const key = `${p.pool}:${p.site}`;
      if (tk > 0 && p.demand > p.capacity && !flagged.has(key)) {
        flagged.add(key);
        events.push({ tick: tk, text: `${offsetLabel(tk * tickMin, dayTicks)}: ${t('SCENARIO.eventText.poolFull', { pool: tm('SCENARIO.poolLabels')[p.pool] ?? p.pool, site: siteName(p.site) })}` });
      }
    }
  }
  return { series, events };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function hasBrist(series: TickResult[], pool: string, site: string, fromTick: number): boolean {
  return series.some((r) => r.tick >= fromTick && r.pools.some((p) => p.pool === pool && p.site === site && p.demand > p.capacity));
}

/** True when the pool is being consumed at all within the horizon (pressure short of brist). */
function hasDemand(series: TickResult[], pool: string, site: string): boolean {
  return series.some((r) => r.pools.some((p) => p.pool === pool && p.site === site && p.demand > 0));
}

const siteLabel = (site: string) => (site === 'solna' || site === 'huddinge' ? tm('SITE_LABELS')[site] : site === 'karolinska' ? t('SCOPE_LABELS.karolinska') : site);

// ---------------------------------------------------------------------------
// Masskada
interface Casualty {
  cat: 'rod' | 'gul' | 'gron';
  site: SiteId | 'region';
  arrival: number; // minutes after scenario start
  ct: boolean;
  op: boolean;
  iva: boolean;
  bed: boolean;
  blood: boolean;
}

export function masskadaCasualties(params: Record<string, number | string>): Casualty[] {
  const total = Number(params.skadade);
  const rod = Math.floor((total * Number(params.rod)) / 100 + 1e-9);
  const gul = Math.floor((total * (Number(params.rod) + Number(params.gul))) / 100 + 1e-9) - rod;
  const gron = total - rod - gul;
  const window = Number(params.fonster);
  const first = Number(params.forsta);
  const primar = String(params.primar) as SiteId;
  const sekundar = String(params.sekundar) as SiteId;
  const out: Casualty[] = [];
  const build = (cat: Casualty['cat'], n: number, route: (j: number) => Casualty['site'], attrs: (j: number) => Omit<Casualty, 'cat' | 'site' | 'arrival'>) => {
    for (let j = 0; j < n; j++) out.push({ cat, site: route(j), arrival: first + Math.floor((j * window) / Math.max(1, n)), ...attrs(j) });
  };
  build('rod', rod, () => primar, (j) => {
    const iva = crosses(j, 0.6);
    return { ct: true, op: crosses(j, 0.5), iva, bed: !iva, blood: crosses(j, 0.5) };
  });
  const gulCounts = [0, 0];
  build('gul', gul, () => {
    const i = pickByShare(gulCounts, [0.5, 0.5], gulCounts[0] + gulCounts[1]);
    gulCounts[i]++;
    return i === 0 ? primar : sekundar;
  }, (j) => ({ ct: crosses(j, 0.6), op: crosses(j, 0.2), iva: false, bed: crosses(j, 0.8), blood: false }));
  const gronCounts = [0, 0, 0];
  build('gron', gron, () => {
    const i = pickByShare(gronCounts, [0.3, 0.4, 0.3], gronCounts[0] + gronCounts[1] + gronCounts[2]);
    gronCounts[i]++;
    return i === 0 ? primar : i === 1 ? sekundar : 'region';
  }, (j) => ({ ct: false, op: false, iva: false, bed: crosses(j, 0.1), blood: false }));
  return out.sort((a, b) => a.arrival - b.arrival);
}

function simulateMasskada(inputs: ScenarioInputs, params: Record<string, number | string>, applied: Applied): SimulationResult {
  const tick = inputs.tickMin;
  const horizon = inputs.horizonTicks;
  const primar = String(params.primar) as SiteId;
  const casualties = masskadaCasualties(params);
  // Omfördela: the first 20 yellow patients (respecting SÖS+DS free beds) go to the region instead.
  if (applied.omfordela !== undefined) {
    const regionFree = inputs.regionNodes.filter((n) => n.id === 'sos' || n.id === 'ds').reduce((s, n) => s + n.free, 0);
    let moved = 0;
    for (const c of casualties) {
      if (c.cat === 'gul' && moved < Math.min(20, regionFree) && c.arrival >= applied.omfordela * tick) {
        c.site = 'region';
        moved++;
      }
    }
  }
  const at = (t: number) => t * tick;
  const occupying = (t: number, site: string, from: (c: Casualty) => number | null, to: (c: Casualty) => number) =>
    casualties.filter((c) => c.site === site && from(c) !== null && (from(c) as number) <= at(t) && at(t) < to(c)).length;
  const boost = (key: string, t: number, amount: number) => (applied[key] !== undefined && t >= applied[key] ? amount : 0);
  const pools: Pool[] = [];
  for (const site of SITES) {
    const s = inputs.sites[site];
    pools.push(
      { pool: 'akutrum', site, capacity: () => s.akutrum, demand: (t) => occupying(t, site, (c) => (c.cat === 'rod' ? c.arrival : null), (c) => c.arrival + 60) },
      { pool: 'overvakning', site, capacity: () => s.overvakning, demand: (t) => occupying(t, site, (c) => (c.cat === 'gul' ? c.arrival : null), (c) => c.arrival + 120) },
      { pool: 'behandlingsrum', site, capacity: () => s.behandlingsrum, demand: (t) => occupying(t, site, (c) => (c.cat === 'gron' ? c.arrival : null), (c) => c.arrival + 60) },
      {
        pool: 'ct_slots',
        site,
        capacity: () => (s.ctScanners * 2 * tick) / 60,
        demand: (t) => casualties.filter((c) => c.site === site && c.ct && c.arrival > at(t - 1) && c.arrival <= at(t)).length,
      },
      {
        pool: 'or_slots',
        site,
        capacity: (t) => s.orSlots + boost('stryk_elektiv', t, 4),
        demand: (t) =>
          occupying(
            t,
            site,
            (c) => (c.op ? c.arrival + (c.cat === 'rod' ? 60 : 120) : null),
            (c) => c.arrival + (c.cat === 'rod' ? 180 : 210),
          ),
      },
      { pool: 'iva', site, capacity: (t) => s.ivaFree + (site === primar ? boost('ima_overflow', t, 6) : 0), demand: (t) => occupying(t, site, (c) => (c.iva ? c.arrival + 30 : null), () => Infinity) },
      { pool: 'ima', site, capacity: (t) => Math.max(0, s.imaFree - (site === primar ? boost('ima_overflow', t, 6) : 0)), demand: () => 0 },
      {
        pool: 'vardplatser',
        site,
        capacity: (t) => s.bedsFree + boost('asih', t, s.asihEligible) + boost('tidig_utskrivning', t, site === 'solna' ? 8 : 10),
        demand: (t) =>
          occupying(
            t,
            site,
            (c) => (c.bed ? c.arrival + (c.cat === 'rod' ? (c.op ? 180 : 60) : c.cat === 'gul' ? (c.op ? 210 : 120) : 60) : null),
            () => Infinity,
          ),
      },
      { pool: 'blod_oneg', site, capacity: () => s.bloodUnits, demand: (t) => casualties.filter((c) => c.site === site && c.blood && c.arrival <= at(t)).length * 4 },
    );
  }
  pools.push({ pool: 'akutambulans', site: 'region', capacity: () => inputs.akutambulans, demand: (t) => casualties.filter((c) => c.arrival > at(t - 1) && c.arrival <= at(t)).length });

  const { series, events } = run(pools, horizon, tick, false, siteLabel);
  const first = casualties[0];
  if (first) events.unshift({ tick: Math.ceil(first.arrival / tick), text: `${fmtOffset(first.arrival)}: ${t('SCENARIO.eventText.firstArrivals', { site: siteLabel(primar) })}` });
  const bedsBrist = SITES.some((s) => hasBrist(series, 'vardplatser', s, 0));
  const bedsPressure = SITES.some((s) => hasDemand(series, 'vardplatser', s));
  const recommendations: Recommendation[] = [
    rec('forstarkning', true, applied),
    rec('katastrof', true, applied),
    rec('stryk_elektiv', SITES.some((s) => hasBrist(series, 'or_slots', s, 0)) || hasBrist(series, 'iva', primar, 0), applied),
    rec('ima_overflow', hasBrist(series, 'iva', primar, 0), applied),
    rec('asih', bedsPressure, applied),
    rec('tidig_utskrivning', bedsPressure, applied),
    rec('omfordela', SITES.some((s) => hasDemand(series, 'overvakning', s)), applied),
    rec('transport', true, applied),
    rec('vardhubb', bedsBrist, applied),
  ];
  return { series, events: sortEvents(events), recommendations };
}

// ---------------------------------------------------------------------------
// Mottagande
function simulateMottagande(inputs: ScenarioInputs, params: Record<string, number | string>, applied: Applied, hubOpenAt?: number): SimulationResult {
  const tick = inputs.tickMin;
  const horizon = inputs.horizonTicks;
  const total = Number(params.patienter);
  const ticks = Math.max(1, Math.round((Number(params.timmar) * 60) / tick));
  const share = Number(params.andel) / 100;
  const siteFree = SITES.map((s) => inputs.sites[s].bedsFree);
  const siteShares = siteFree.map((f) => f / Math.max(1, siteFree[0] + siteFree[1]));
  const regionTotal = inputs.regionNodes.reduce((n, r) => n + r.free, 0);
  const regionShares = inputs.regionNodes.map((r) => r.free / Math.max(1, regionTotal));
  const hubCapacity = 40;
  // Per-destination cumulative arrivals per tick.
  const destinations = [...SITES, ...inputs.regionNodes.map((r) => r.id), 'vardhubb'];
  const arrivalsByTick: number[][] = Array.from({ length: horizon + 1 }, () => destinations.map(() => 0));
  const siteCounts = [0, 0];
  const regionCounts = inputs.regionNodes.map(() => 0);
  let hubCount = 0;
  let served = 0;
  for (let t = 1; t <= horizon; t++) {
    const cumulative = t <= ticks ? Math.floor((total * t) / ticks + 1e-9) : total;
    const previous = t - 1 <= ticks ? Math.floor((total * (t - 1)) / ticks + 1e-9) : total;
    for (let i = previous; i < cumulative; i++) {
      let dest: number;
      if (crosses(i, share)) {
        const si = pickByShare(siteCounts, siteShares, siteCounts[0] + siteCounts[1]);
        siteCounts[si]++;
        dest = si;
      } else if (hubOpenAt !== undefined && t >= hubOpenAt && hubCount < hubCapacity) {
        hubCount++;
        dest = destinations.length - 1;
      } else {
        const ri = pickByShare(regionCounts, regionShares, served);
        regionCounts[ri]++;
        served++;
        dest = SITES.length + ri;
      }
      arrivalsByTick[t][dest]++;
    }
  }
  const cumulativeAt = (dest: number, t: number) => arrivalsByTick.slice(0, t + 1).reduce((n, row) => n + row[dest], 0);
  const boost = (key: string, t: number, amount: number) => (applied[key] !== undefined && t >= applied[key] ? amount : 0);
  const pools: Pool[] = [];
  SITES.forEach((site, i) => {
    const s = inputs.sites[site];
    pools.push({
      pool: 'vardplatser',
      site,
      capacity: (t) => s.bedsFree + boost('asih', t, s.asihEligible) + boost('tidig_utskrivning', t, site === 'solna' ? 8 : 10),
      demand: (t) => cumulativeAt(i, t),
    });
  });
  inputs.regionNodes.forEach((r, i) => pools.push({ pool: 'vardplatser', site: r.id, capacity: () => r.free, demand: (t) => cumulativeAt(SITES.length + i, t) }));
  if (hubOpenAt !== undefined) pools.push({ pool: 'vardplatser', site: 'vardhubb', capacity: (t) => (t >= hubOpenAt ? hubCapacity : 0), demand: (t) => cumulativeAt(destinations.length - 1, t) });
  const nameOf = (site: string) => inputs.regionNodes.find((r) => r.id === site)?.shortName ?? (site === 'vardhubb' ? t('SCENARIO.recs.vardhubb.label').replace('Etablera ', '') : siteLabel(site));
  const { series, events } = run(pools, horizon, tick, false, nameOf);
  // Node-level "runs out" events replace the generic pool text.
  for (const e of events) e.text = e.text.replace(`${t('SCENARIO.poolLabels.vardplatser')} `, '').replace(': brist', `: ${t('SCENARIO.eventText.nodeOut', { node: '' }).replace(': vårdplatser slut', '')}vårdplatser slut`);
  events.unshift({ tick: 1, text: `${fmtOffset(tick)}: ${t('SCENARIO.eventText.receiving', { n: fmt(total) })}` });
  const anyBrist = pools.some((p) => hasBrist(series, p.pool, p.site, 0));
  const karolinskaBrist = SITES.some((s) => hasBrist(series, 'vardplatser', s, 0));
  const recommendations: Recommendation[] = [
    rec('asih', karolinskaBrist, applied),
    rec('vardhubb', anyBrist, applied),
    rec('tidig_utskrivning', karolinskaBrist, applied),
    rec('transport', true, applied),
    rec('forstarkning', true, applied),
  ];
  return { series, events: sortEvents(events), recommendations };
}

// ---------------------------------------------------------------------------
// Pandemi
function simulatePandemi(inputs: ScenarioInputs, params: Record<string, number | string>, applied: Applied): SimulationResult {
  const perDay = Number(params.ivaPerDygn);
  const horizon = Number(params.dygn);
  const baseline = SITES.reduce((n, s) => n + inputs.sites[s].ivaFree, 0);
  const oHuset = (t: number) => (applied.o_huset !== undefined && t >= applied.o_huset ? Math.min(64, Math.round(6.4 * (t - applied.o_huset))) : 0);
  const pools: Pool[] = [{ pool: 'iva', site: 'karolinska', capacity: (t) => baseline + oHuset(t), demand: (t) => t * perDay }];
  const { series, events } = run(pools, horizon, 1440, true, siteLabel);
  events.unshift({ tick: 1, text: `${t('SCENARIO.offsetDay', { d: 1 })}: ${t('SCENARIO.eventText.pandemic', { n: fmt(perDay) })}` });
  const brist = hasBrist(series, 'iva', 'karolinska', 0);
  return {
    series,
    events: sortEvents(events),
    recommendations: [rec('o_huset', brist, applied), rec('stryk_elektiv', brist, applied), rec('forstarkning', true, applied)],
  };
}

// ---------------------------------------------------------------------------
function simulateTryck(inputs: ScenarioInputs, params: Record<string, number | string>): SimulationResult {
  return {
    series: [],
    events: [{ tick: 0, text: `${fmtOffset(0)}: ${t('SCENARIO.eventText.pressure', { factor: String(params.faktor).replace('.', ','), hours: fmt(Number(params.timmar)) })}` }],
    recommendations: [{ ...rec('asih', true, {}), applicable: true }, rec('tidig_utskrivning', true, {})].map((r) => ({ ...r, applicable: inputs.sites.huddinge.bedsFree < 10 })),
  };
}

function simulateJournalbortfall(inputs: ScenarioInputs): SimulationResult {
  return {
    series: [],
    events: [
      { tick: 0, text: `${fmtOffset(0)}: ${t('SCENARIO.eventText.outageStart')}` },
      { tick: inputs.horizonTicks, text: `${fmtOffset(inputs.horizonTicks * inputs.tickMin)}: ${t('SCENARIO.eventText.outageEnd')}` },
    ],
    recommendations: [rec('forstarkning', true, {})],
  };
}

function sortEvents(events: ScenarioEvent[]): ScenarioEvent[] {
  return [...events].sort((a, b) => a.tick - b.tick);
}

export interface SimulateOptions {
  hubOpenAt?: number; // mottagande: tick the vårdhubb opens
}

/** simulate(pack inputs, preset, params, applied) → { series, events, recommendations } – deterministic. */
export function simulate(inputs: ScenarioInputs, key: ScenarioKey, params: Record<string, number | string>, applied: Applied = {}, options: SimulateOptions = {}): SimulationResult {
  switch (key) {
    case 'masskada':
      return simulateMasskada(inputs, params, applied);
    case 'mottagande':
      return simulateMottagande(inputs, params, applied, options.hubOpenAt ?? (applied.vardhubb !== undefined ? applied.vardhubb + 4 : undefined));
    case 'pandemi':
      return simulatePandemi(inputs, params, applied);
    case 'tryck':
      return simulateTryck(inputs, params);
    case 'journalbortfall':
      return simulateJournalbortfall(inputs);
    case 'siteevac':
      return { series: [], events: [], recommendations: [] };
  }
}

/** Preset tick length and horizon, with pandemi honouring the "dygn" parameter. */
export function horizonFor(preset: ScenarioPreset, params: Record<string, number | string>): { tickMin: number; horizonTicks: number } {
  if (preset.key === 'pandemi') return { tickMin: 1440, horizonTicks: Number(params.dygn) };
  if (preset.key === 'journalbortfall' || preset.key === 'tryck') return { tickMin: preset.tickMin, horizonTicks: Math.round((Number(params.timmar) * 60) / preset.tickMin) };
  if (preset.key === 'mottagande') return { tickMin: preset.tickMin, horizonTicks: Math.max(preset.horizonTicks, Math.round((Number(params.timmar) * 60) / preset.tickMin)) };
  return { tickMin: preset.tickMin, horizonTicks: preset.horizonTicks };
}
