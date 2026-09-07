import { useStore } from '@/data/store';
import { key, lt, t } from '@/lib/i18n';
import { fmt } from '@/lib/format';
import { measureTarget, targetProgress } from '@/lib/targets';
import { Progress } from '@/components/ui/progress';
import { targetUnit } from '@/modules/incident/OverviewTab';
import { useTargetInputs } from './useTargetInputs';

/** SPEC.md § 6.5 – one compact progress row per target of the active incident. */
export function ObjectivesStrip() {
  const incident = useStore((s) => s.incident);
  const inputs = useTargetInputs();
  if (!incident) return null;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-border bg-bg-muted px-5 py-3" aria-label={t('CAP.objectives')}>
      {incident.targets.map((target) => {
        const current = measureTarget(target.measure, inputs);
        const due = target.withinUnit === 'dygn' ? t('CAP.dueDay', { d: fmt(10) }) : t('CAP.dueAt', { at: target.dueAt });
        return (
          <div key={key(target.label)} className="flex items-center gap-3">
            <span className="w-[440px] shrink-0 text-body">{t('CAP.objective', { label: lt(target.label), current: fmt(current), target: fmt(target.target), unit: targetUnit(target.unit), due })}</span>
            <Progress value={targetProgress(current, target.target)} className="h-2" aria-label={t('LABELS.ariaProgress', { label: lt(target.label) })} />
          </div>
        );
      })}
    </div>
  );
}
