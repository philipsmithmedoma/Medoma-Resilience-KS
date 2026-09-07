import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { t } from '@/lib/i18n';
import { isInTransit } from '@/lib/evacuation';
import { fmt } from '@/lib/format';
import { defaultEvacuationSite, isSite, siteName } from '@/lib/scope';
import { measureTarget } from '@/lib/targets';
import { PageTitle } from '@/components/PageTitle';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button } from '@/components/ui/button';
import { useTargetInputs } from '@/modules/capacity/useTargetInputs';
import { PatientList } from './PatientList';
import { PlanningPane } from './PlanningPane';
import { EvacuationMap } from './EvacuationMap';

/** SPEC.md § 6.7 – Evakuering from the selected source site: summary row, three panes and the map. */
export function EvacuationPage() {
  const scope = useStore((s) => s.scope);
  const allPatients = useStore((s) => s.patients);
  const incident = useStore((s) => s.incident);
  const suggestPlan = useStore((s) => s.suggestPlan);
  const clearSuggestions = useStore((s) => s.clearSuggestions);
  const [site, setSite] = useState<SiteId>(defaultEvacuationSite(scope));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputs = useTargetInputs();

  useEffect(() => {
    setSite(defaultEvacuationSite(scope));
    setSelectedId(null);
  }, [scope]);

  const patients = useMemo(() => allPatients.filter((p) => p.nodeId === site), [allPatients, site]);
  const selected = patients.find((p) => p.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const real = patients.filter((p) => p.move && !p.move.suggested).map((p) => p.move!);
    return {
      planned: real.filter((m) => m.status === 'Planned').length,
      accepted: real.filter((m) => m.status === 'Accepted').length,
      inTransit: real.filter((m) => isInTransit(m.status)).length,
      arrived: real.filter((m) => m.status === 'Arrived').length,
      handedOver: real.filter((m) => m.status === 'Handed over').length,
    };
  }, [patients]);
  const hasSuggestions = patients.some((p) => p.move?.suggested);
  const target = incident?.targets.find((t) => t.measure === 'patientsMoved');
  const moved = measureTarget('patientsMoved', inputs);

  const onSuggest = () => {
    const r = suggestPlan(site);
    toast(t('EVAC.toasts.suggested', { n: fmt(r.suggested), m: fmt(r.unplaced) }));
  };
  const onClear = () => {
    clearSuggestions(site);
    toast(t('EVAC.toasts.suggestionsCleared'));
  };

  return (
    <div className="flex flex-col" style={{ height: incident ? 'calc(100vh - 136px)' : 'calc(100vh - 96px)' }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <PageTitle title={t('EVAC.title')} scope={t('EVAC.from', { site: siteName(site) })}>
            {!isSite(scope) ? (
              <SegmentedControl
                label={t('EVAC.siteSwitch')}
                value={site}
                onChange={(v) => {
                  setSite(v);
                  setSelectedId(null);
                }}
                options={[
                  { value: 'solna', label: t('SITE_LABELS.solna') },
                  { value: 'huddinge', label: t('SITE_LABELS.huddinge') },
                ]}
              />
            ) : null}
          </PageTitle>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body">
            <span>
              {target ? t('EVAC.target', { n: fmt(target.target) }) : t('EVAC.noTarget')}
              {target ? <span className="ml-2 text-text-secondary">{t('EVAC.moved', { n: fmt(moved) })}</span> : null}
            </span>
            <span className="tabular">
              {t('EVAC.counts.planned')} {counts.planned}
            </span>
            <span className="tabular">
              {t('EVAC.counts.accepted')} {counts.accepted}
            </span>
            <span className="tabular">
              {t('EVAC.counts.inTransit')} {counts.inTransit}
            </span>
            <span className="tabular">
              {t('EVAC.counts.arrived')} {counts.arrived}
            </span>
            <span className="tabular">
              {t('EVAC.counts.handedOver')} {counts.handedOver}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasSuggestions ? (
            <Button variant="link" onClick={onClear}>
              {t('EVAC.clearSuggestions')}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onSuggest}>
            {t('EVAC.suggestPlan')}
          </Button>
        </div>
      </div>

      <div className="-mx-6 flex min-h-[520px] flex-1 border-t border-border">
        <div className="w-[380px] shrink-0 overflow-y-auto border-r border-border">
          <PatientList patients={patients} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="w-[320px] shrink-0 overflow-y-auto border-r border-border">
          <PlanningPane patient={selected} site={site} />
        </div>
        <div className="min-w-0 flex-1">
          <EvacuationMap selected={selected} site={site} />
        </div>
      </div>
    </div>
  );
}
