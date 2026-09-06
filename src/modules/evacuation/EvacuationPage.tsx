import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/data/store';
import { EVAC } from '@/data/vocab';
import { isInTransit } from '@/lib/evacuation';
import { measureTarget } from '@/lib/targets';
import { PageTitle } from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { PatientList } from './PatientList';
import { PlanningPane } from './PlanningPane';
import { EvacuationMap } from './EvacuationMap';

/** SPEC.md § 6.3 – Evacuation from Vikby sjukhus: summary row, three panes and the map. */
export function EvacuationPage() {
  const patients = useStore((s) => s.patients);
  const incident = useStore((s) => s.incident);
  const capabilities = useStore((s) => s.capabilities);
  const nodes = useStore((s) => s.nodes);
  const suggestPlan = useStore((s) => s.suggestPlan);
  const clearSuggestions = useStore((s) => s.clearSuggestions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const target = incident?.targets.find((t) => t.measure === 'acuteBedsFreed');
  const freed = measureTarget('acuteBedsFreed', { incident, patients, capabilities, nodes });

  const onSuggest = () => {
    const r = suggestPlan();
    toast(EVAC.toasts.suggested(r.suggested, r.unplaced));
  };
  const onClear = () => {
    clearSuggestions();
    toast(EVAC.toasts.suggestionsCleared);
  };

  return (
    <div className="flex flex-col" style={{ height: incident ? 'calc(100vh - 136px)' : 'calc(100vh - 96px)' }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <PageTitle title={EVAC.title} scope={EVAC.from} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body">
            <span>
              {target ? EVAC.target(target.target) : EVAC.noTarget}
              {target ? <span className="ml-2 text-text-secondary">{EVAC.freed(freed)}</span> : null}
            </span>
            <span className="tabular">
              {EVAC.counts.planned} {counts.planned}
            </span>
            <span className="tabular">
              {EVAC.counts.accepted} {counts.accepted}
            </span>
            <span className="tabular">
              {EVAC.counts.inTransit} {counts.inTransit}
            </span>
            <span className="tabular">
              {EVAC.counts.arrived} {counts.arrived}
            </span>
            <span className="tabular">
              {EVAC.counts.handedOver} {counts.handedOver}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasSuggestions ? (
            <Button variant="link" onClick={onClear}>
              {EVAC.clearSuggestions}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onSuggest}>
            {EVAC.suggestPlan}
          </Button>
        </div>
      </div>

      <div className="-mx-6 flex min-h-[520px] flex-1 border-t border-border">
        <div className="w-[380px] shrink-0 overflow-y-auto border-r border-border">
          <PatientList patients={patients} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="w-[320px] shrink-0 overflow-y-auto border-r border-border">
          <PlanningPane patient={selected} />
        </div>
        <div className="min-w-0 flex-1">
          <EvacuationMap selected={selected} />
        </div>
      </div>
    </div>
  );
}
