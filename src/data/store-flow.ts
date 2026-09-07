// Läget nu actions: patient placement and discharge-ready flows – SPEC.md § 6.2, § 6.4. Mixed into the store.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { DischargeReady, FlowMetric, SiteId } from './types';
import { ED_NAME } from './packs/karolinska';
import { ASIH_ID, GERIATRIK_ID, SYSTEM_ACTOR } from './vocab';
import { t } from '@/lib/i18n';
import { addToFigure } from '@/lib/figure';
import { fmtDuration } from '@/lib/format';
import { isImaWard } from '@/lib/placement';
import { INITIAL_CLOCK } from '@/lib/time';

export interface FlowActions {
  /** Place a bed request in a ward; `relocate` marks an utlokalisering. */
  placePatient: (requestId: string, wardId: string, relocate: boolean) => void;
  rejectPlacement: (requestId: string, reason: string) => void;
  sendToAsih: (id: string) => void;
  sendToGeriatrik: (id: string) => void;
  waitDischarge: (id: string) => void;
  /** Sent requests become "Utskriven" two clock minutes later or on the next action (SPEC.md § 6.4). */
  settleDischarges: () => void;
}

const SETTLE_AFTER_MIN = 2;

function bump(metrics: FlowMetric[], key: string, site: SiteId, delta: number): FlowMetric[] {
  return metrics.map((m) => (m.key === key && m.site === site ? { ...m, value: addToFigure(m.value, delta) } : m));
}

export const createFlowSlice: StateCreator<AppStore, [], [], FlowActions> = (set, get) => {
  let settling = false;

  const adjustSiteFree = (site: SiteId, delta: number) =>
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === site && n.beds ? { ...n, beds: { ...n.beds, free: addToFigure(n.beds.free, delta) } } : n)) }));

  const adjustWard = (wardId: string, delta: number) => set((s) => ({ wards: s.wards.map((w) => (w.id === wardId ? { ...w, free: w.free + delta } : w)) }));

  const send = (id: string, status: DischargeReady['status'], audit: (patient: string) => string) => {
    const { dischargeReady, clock, logEntry } = get();
    const d = dischargeReady.find((x) => x.id === id);
    if (!d || d.status !== 'Väntar') return;
    set((s) => ({ dischargeReady: s.dischargeReady.map((x) => (x.id === id ? { ...x, status, sentAt: clock } : x)) }));
    logEntry(audit(d.patient), d.patient, d.waitingFor);
  };

  return {
    placePatient: (requestId, wardId, relocate) => {
      const { bedRequests, wards, clock, logEntry } = get();
      const r = bedRequests.find((x) => x.id === requestId);
      const w = wards.find((x) => x.id === wardId);
      if (!r || !w || w.site !== r.site || w.free <= 0) return;
      adjustWard(wardId, -1);
      set((s) => {
        let flowMetrics = s.flowMetrics;
        if (r.from === ED_NAME[r.site]) flowMetrics = bump(flowMetrics, 'akuten.waitingBed', r.site, -1);
        if (relocate) flowMetrics = bump(flowMetrics, 'beds.utlokaliserade', r.site, 1);
        return { flowMetrics, bedRequests: s.bedRequests.filter((x) => x.id !== requestId) };
      });
      if (!isImaWard(w)) adjustSiteFree(r.site, -1);
      const waited = fmtDuration(r.waitingMin + Math.max(0, clock - INITIAL_CLOCK));
      logEntry(relocate ? t('FLOW.placement.audit.relocated', { ward: w.name }) : t('FLOW.placement.audit.placed', { ward: w.name }), r.patient, `${r.from}, ${waited}`);
    },

    rejectPlacement: (requestId, reason) => {
      const { bedRequests, logEntry } = get();
      const r = bedRequests.find((x) => x.id === requestId);
      if (!r) return;
      set((s) => ({ bedRequests: s.bedRequests.filter((x) => x.id !== requestId) }));
      logEntry(t('FLOW.placement.audit.rejected', { patient: r.patient }), r.patient, reason.trim() || undefined);
    },

    sendToAsih: (id) => send(id, 'ASIH-förfrågan skickad', (patient) => t('FLOW.discharge.audit.asihSent', { patient })),

    sendToGeriatrik: (id) => send(id, 'Geriatrik-förfrågan skickad', (patient) => t('FLOW.discharge.audit.geriatrikSent', { patient })),

    waitDischarge: (id) => {
      const { dischargeReady, logEntry } = get();
      const d = dischargeReady.find((x) => x.id === id);
      if (!d) return;
      logEntry(t('FLOW.discharge.audit.waited', { patient: d.patient }), d.patient, d.waitingFor);
    },

    settleDischarges: () => {
      if (settling) return;
      const { dischargeReady, clock } = get();
      const due = dischargeReady.filter((d) => d.sentAt !== undefined && d.status !== 'Utskriven' && d.status !== 'Väntar' && clock - d.sentAt >= SETTLE_AFTER_MIN);
      if (due.length === 0) return;
      settling = true;
      try {
        for (const d of due) {
          const toAsih = d.status === 'ASIH-förfrågan skickad';
          const capacityNode = toAsih ? ASIH_ID : GERIATRIK_ID;
          set((s) => ({
            dischargeReady: s.dischargeReady.map((x) => (x.id === d.id ? { ...x, status: 'Utskriven' } : x)),
            flowMetrics: bump(toAsih ? bump(s.flowMetrics, 'beds.asihEligible', d.site, -1) : s.flowMetrics, 'beds.utskrivningsklara', d.site, -1),
            nodes: s.nodes.map((n) => (n.id === capacityNode && n.beds ? { ...n, beds: { ...n.beds, free: addToFigure(n.beds.free, -1) } } : n)),
          }));
          adjustWard(d.wardId, 1);
          adjustSiteFree(d.site, 1);
          get().logEntry(toAsih ? t('FLOW.discharge.audit.dischargedAsih', { patient: d.patient }) : t('FLOW.discharge.audit.dischargedGeriatrik', { patient: d.patient }), d.patient, d.waitingFor, SYSTEM_ACTOR);
        }
      } finally {
        settling = false;
      }
    },
  };
};
