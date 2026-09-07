// Scenario actions – SPEC.md § 7.2–7.4. Start, tick, apply recommendations, project the current tick onto
// the live figures. Mixed into the store as a slice.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { ScenarioInputs, ScenarioKey, ScenarioState, SiteId, TickResult } from './types';
import { AMBULANCE_NODE_ID, ASIH_ID, CURRENT_USER, SYSTEM_ACTOR, VEHICLES } from './vocab';
import { t, tm } from '@/lib/i18n';
import { computeCapacity } from '@/lib/capacity';
import { addToFigure, withValue } from '@/lib/figure';
import { isImaWard } from '@/lib/placement';
import { horizonFor, simulate } from '@/lib/scenario';
import { formatClock } from '@/lib/time';

export interface ScenarioActions {
  startScenario: (key: ScenarioKey, params: Record<string, number | string>, running?: boolean) => void;
  stopScenario: () => void;
  /** Advance one tick; called by stepClock when a scenario is running. */
  advanceScenario: () => void;
  applyRecommendation: (key: string) => void;
}

const SITES: SiteId[] = ['solna', 'huddinge'];
const HUB_OPENS_AFTER_TICKS = 4;

/** Captures the baseline the engine simulates against (SPEC.md § 7.3). */
export function buildScenarioInputs(s: AppStore, tickMin: number, horizonTicks: number): ScenarioInputs {
  const site = (id: SiteId) => {
    const node = s.nodes.find((n) => n.id === id)!;
    const rooms = s.pack.edRooms[id];
    const ct = s.capabilities.find((c) => c.nodeId === id && c.kind === 'ct');
    const surgery = s.capabilities.find((c) => c.nodeId === id && c.kind === 'surgery');
    const flow = (key: string) => s.flowMetrics.find((m) => m.key === key && m.site === id)?.value.value ?? 0;
    return {
      akutrum: rooms.akutrum.value ?? 0,
      overvakning: rooms.overvakning.value ?? 0,
      behandlingsrum: rooms.behandlingsrum.value ?? 0,
      ctScanners: ct ? computeCapacity(ct).capacity : 0,
      orSlots: surgery ? computeCapacity(surgery).capacity : 0,
      ivaFree: node.intensiveCare?.free.value ?? 0,
      imaFree: s.wards.find((w) => w.site === id && isImaWard(w))?.free ?? 0,
      bedsFree: node.beds?.free.value ?? 0,
      bloodUnits: s.resources.find((r) => r.nodeId === id && r.name === 'Blodprodukter O-negativ')?.available ?? 0,
      edPatients: flow('akuten.patients'),
      asihEligible: flow('beds.asihEligible'),
    };
  };
  return {
    tickMin,
    horizonTicks,
    sites: { solna: site('solna'), huddinge: site('huddinge') },
    akutambulans: s.resources.find((r) => r.nodeId === AMBULANCE_NODE_ID && r.name === VEHICLES.akut)?.available ?? 0,
    regionNodes: s.nodes.filter((n) => n.type === 'Hospital' && !n.site).map((n) => ({ id: n.id, name: n.name, shortName: n.shortName, free: n.beds?.free.value ?? 0 })),
  };
}

export const createScenarioSlice: StateCreator<AppStore, [], [], ScenarioActions> = (set, get) => {
  const resimulate = (sc: ScenarioState): ScenarioState => {
    const r = simulate(sc.inputs, sc.key, sc.params, sc.appliedAt);
    return { ...sc, series: r.series, events: r.events, recommendations: r.recommendations };
  };

  /** Projects one tick's pools onto the live figures: free beds, IVA, akuten patients, blood, region nodes. */
  const overlay = (sc: ScenarioState, result: TickResult | undefined) => {
    if (!result) return;
    const pools = result.pools;
    const value = (pool: string, site: string) => {
      const p = pools.find((x) => x.pool === pool && x.site === site);
      return p ? Math.max(0, p.capacity - p.demand) : undefined;
    };
    const demand = (pool: string, site: string) => pools.find((x) => x.pool === pool && x.site === site)?.demand ?? 0;
    set((s) => ({
      nodes: s.nodes.map((n) => {
        let next = n;
        const beds = value('vardplatser', n.id === sc.hubNodeId ? 'vardhubb' : n.id);
        if (beds !== undefined && n.beds && !(n.id === sc.hubNodeId && n.status !== 'Operational')) next = { ...next, beds: { ...n.beds, free: withValue(n.beds.free, Math.round(beds)) } };
        const iva = value('iva', n.id);
        if (iva !== undefined && n.intensiveCare) next = { ...next, intensiveCare: { ...n.intensiveCare, free: withValue(n.intensiveCare.free, Math.round(iva)) } };
        return next;
      }),
      flowMetrics: s.flowMetrics.map((m) => {
        if (m.key !== 'akuten.patients' || sc.key !== 'masskada') return m;
        const ed = demand('akutrum', m.site) + demand('overvakning', m.site) + demand('behandlingsrum', m.site);
        return { ...m, value: withValue(m.value, sc.inputs.sites[m.site].edPatients + ed) };
      }),
      resources: s.resources.map((r) => {
        if (r.name !== 'Blodprodukter O-negativ' || sc.key !== 'masskada') return r;
        const left = value('blod_oneg', r.nodeId);
        return left === undefined ? r : { ...r, available: Math.round(left) };
      }),
    }));
  };

  return {
    startScenario: (key, params, running = true) => {
      const s = get();
      const preset = s.pack.scenarios.find((p) => p.key === key);
      if (!preset) return;
      const merged = { ...preset.params, ...params };
      if (key === 'siteevac') {
        // No simulation: open Evakuering with the target (PB4) at the chosen site.
        set({ scope: String(merged.site) });
        if (!s.incident) s.activatePlaybook('pb4', CURRENT_USER.name, 'Förstärkningsläge');
        s.logEntry(t('SCENARIO.started', { name: t('SCENARIO_NAMES.siteevac') }), t('SCENARIO.eventObject'), `${merged.patienter} patienter, ${merged.site}`);
        return;
      }
      const { tickMin, horizonTicks } = horizonFor(preset, merged);
      const inputs = buildScenarioInputs(s, tickMin, horizonTicks);
      const base: ScenarioState = {
        key,
        params: merged,
        startedAt: formatClock(s.clock),
        startedAtClock: s.clock,
        tick: 0,
        running: true,
        applied: [],
        appliedAt: {},
        series: [],
        events: [],
        recommendations: [],
        inputs,
      };
      const sc = resimulate(base);
      set({ scenario: sc, clockRunning: running, scenarioPanel: { open: s.scenarioPanel.open, key } });
      get().logEntry(t('SCENARIO.started', { name: tm('SCENARIO_NAMES')[key] }), t('SCENARIO.eventObject'), Object.entries(merged).map(([k, v]) => `${k} ${v}`).join(', '));
      if (key === 'journalbortfall') {
        if (!get().incident) get().activatePlaybook('pb2', CURRENT_USER.name, 'Stabsläge');
        else get().setEhrOutage(true, t('SCENARIO_NAMES.journalbortfall'));
      }
    },

    stopScenario: () => {
      const { scenario, logEntry } = get();
      if (!scenario) return;
      set({ scenario: null, clockRunning: false });
      logEntry(t('SCENARIO.stopped', { name: tm('SCENARIO_NAMES')[scenario.key] }), t('SCENARIO.eventObject'));
    },

    advanceScenario: () => {
      const s = get();
      const sc = s.scenario;
      if (!sc || !sc.running) return;
      const tick = sc.tick + 1;
      const next: ScenarioState = { ...sc, tick };
      set({ scenario: next });
      if (sc.hubNodeId && sc.appliedAt.vardhubb !== undefined && tick >= sc.appliedAt.vardhubb + HUB_OPENS_AFTER_TICKS) {
        const hub = get().nodes.find((n) => n.id === sc.hubNodeId);
        if (hub && hub.status === 'Standing up') {
          s.setNodeStatus(hub.id, 'Operational');
          set((st) => ({ scenario: st.scenario ? { ...st.scenario, events: [...st.scenario.events, { tick, text: `${offset(st.scenario, tick)}: ${t('SCENARIO.eventText.vardhubbOpen', { name: hub.name })}` }] } : st.scenario }));
        }
      }
      overlay(next, next.series.find((r) => r.tick === tick));
      // Scenario events reaching this tick are logged as System.
      for (const e of sc.events.filter((x) => x.tick === tick)) s.logEntry(e.text, t('SCENARIO.eventObject'), tm('SCENARIO_NAMES')[sc.key], SYSTEM_ACTOR, undefined, { advance: false });
      if (tick >= sc.inputs.horizonTicks) {
        set((st) => ({ scenario: st.scenario ? { ...st.scenario, running: false } : null, clockRunning: false }));
        if (sc.key === 'journalbortfall') get().setEhrOutage(false, t('SCENARIO_NAMES.journalbortfall'));
        get().logEntry(t('SCENARIO.horizonReached', { name: tm('SCENARIO_NAMES')[sc.key] }), t('SCENARIO.eventObject'), undefined, SYSTEM_ACTOR, undefined, { advance: false });
      }
    },

    applyRecommendation: (key) => {
      const s = get();
      const sc = s.scenario;
      if (!sc || sc.appliedAt[key] !== undefined) return;
      const r = tm('SCENARIO.recs')[key];
      if (!r) return;
      const tick = sc.tick;
      const primar = (sc.params.primar as SiteId) ?? 'solna';
      let hubNodeId = sc.hubNodeId;
      switch (key) {
        case 'forstarkning':
          if (!s.incident) s.activatePlaybook('pb1', CURRENT_USER.name, 'Förstärkningsläge');
          else s.setLage('Förstärkningsläge');
          break;
        case 'katastrof':
          if (!s.incident) s.activatePlaybook('pb1', CURRENT_USER.name, 'Katastrofläge');
          else s.setLage('Katastrofläge');
          break;
        case 'stryk_elektiv':
          s.markTaskDoneByTitle('Stryk elektiv operation och frigör salar');
          s.markTaskDoneByTitle('Stryk elektiv verksamhet stegvis');
          break;
        case 'ima_overflow':
          s.markTaskDoneByTitle('Öppna IMA som IVA-överflöd');
          break;
        case 'asih': {
          const eligible = s.dischargeReady.filter((d) => d.asihEligible && d.status !== 'Utskriven');
          const freed = SITES.reduce((n, site) => n + sc.inputs.sites[site].asihEligible, 0);
          set((st) => ({
            dischargeReady: st.dischargeReady.map((d) => (d.asihEligible && d.status !== 'Utskriven' ? { ...d, status: 'Utskriven', sentAt: st.clock } : d)),
            wards: st.wards.map((w) => {
              const n = eligible.filter((d) => d.wardId === w.id).length;
              return n ? { ...w, free: w.free + n } : w;
            }),
            flowMetrics: st.flowMetrics.map((m) =>
              m.key === 'beds.utskrivningsklara' ? { ...m, value: addToFigure(m.value, -sc.inputs.sites[m.site].asihEligible) } : m.key === 'beds.asihEligible' ? { ...m, value: withValue(m.value, 0) } : m,
            ),
            nodes: st.nodes.map((n) => (n.id === ASIH_ID && n.beds ? { ...n, beds: { ...n.beds, free: addToFigure(n.beds.free, -freed) } } : n)),
            freedByScenario: st.freedByScenario + freed,
          }));
          break;
        }
        case 'tidig_utskrivning':
          set((st) => ({ freedByScenario: st.freedByScenario + 18 }));
          s.markTaskDoneByTitle('Identifiera patienter för tidigare utskrivning');
          break;
        case 'omfordela': {
          const free = (id: string) => s.nodes.find((n) => n.id === id)?.beds?.free.value ?? 0;
          const toSos = Math.min(10, free('sos'));
          const toDs = Math.min(20 - toSos, free('ds'));
          set((st) => ({ nodes: st.nodes.map((n) => (n.id === 'sos' && n.beds ? { ...n, beds: { ...n.beds, free: addToFigure(n.beds.free, -toSos) } } : n.id === 'ds' && n.beds ? { ...n, beds: { ...n.beds, free: addToFigure(n.beds.free, -toDs) } } : n)) }));
          break;
        }
        case 'transport':
          s.createRequest({ resourceName: VEHICLES.transport, quantity: 4, toNodeId: primar, priority: 'High', fromNodeId: AMBULANCE_NODE_ID });
          s.markTaskDoneByTitle('Begär transportresurser från Ambulanssjukvården');
          break;
        case 'vardhubb': {
          const site = s.pack.presetSites[0];
          hubNodeId = s.standUpNode({ name: site.name, type: 'Care hub', site, plannedBeds: 40, lead: 'Mats Öberg', sharing: 'Full' });
          break;
        }
        case 'o_huset':
          s.markTaskDoneByTitle('Aktivera plan för IVA-utbyggnad i O-huset');
          break;
      }
      const current = get().scenario;
      if (!current) return;
      const updated = resimulate({ ...current, hubNodeId, applied: [...current.applied, key], appliedAt: { ...current.appliedAt, [key]: tick } });
      updated.events = [...updated.events, { tick, text: `${offset(updated, tick)}: ${t('SCENARIO.eventText.applied', { label: r.label })}` }].sort((a, b) => a.tick - b.tick);
      set({ scenario: updated });
      get().logEntry(t('SCENARIO.authorised', { label: r.label }), t('SCENARIO.eventObject'), r.effect, CURRENT_USER.name);
      overlay(updated, updated.series.find((x) => x.tick === tick));
    },
  };
};

function offset(sc: ScenarioState, tick: number): string {
  return sc.key === 'pandemi' ? t('SCENARIO.offsetDay', { d: tick }) : `+${tick * sc.inputs.tickMin} min`;
}
