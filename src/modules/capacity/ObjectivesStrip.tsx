import { useStore } from '@/data/store';
import { CAP, LABELS } from '@/data/vocab';
import { fmt } from '@/lib/format';
import { measureTarget, targetProgress } from '@/lib/targets';
import { Progress } from '@/components/ui/progress';
import { useTargetInputs } from './useTargetInputs';

/** SPEC.md § 6.5 – one compact progress row per target of the active incident. */
export function ObjectivesStrip() {
  const incident = useStore((s) => s.incident);
  const inputs = useTargetInputs();
  if (!incident) return null;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-border bg-bg-muted px-5 py-3" aria-label={CAP.objectives}>
      {incident.targets.map((t) => {
        const current = measureTarget(t.measure, inputs);
        const due = t.withinUnit === 'dygn' ? CAP.dueDay(fmt(10)) : CAP.dueAt(t.dueAt);
        return (
          <div key={t.label} className="flex items-center gap-3">
            <span className="w-[440px] shrink-0 text-body">{CAP.objective(t.label, fmt(current), fmt(t.target), t.unit, due)}</span>
            <Progress value={targetProgress(current, t.target)} className="h-2" aria-label={LABELS.ariaProgress(t.label)} />
          </div>
        );
      })}
    </div>
  );
}
