import { useStore } from '@/data/store';
import { CC } from '@/data/vocab';
import { measureTarget, targetProgress } from '@/lib/targets';
import { Progress } from '@/components/ui/progress';

/** SPEC.md § 6.1 – one compact progress row per target of the active incident. */
export function ObjectivesStrip() {
  const incident = useStore((s) => s.incident);
  const patients = useStore((s) => s.patients);
  const capabilities = useStore((s) => s.capabilities);
  const nodes = useStore((s) => s.nodes);
  if (!incident) return null;
  const inputs = { incident, patients, capabilities, nodes };
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-border bg-bg-muted px-5 py-3" aria-label="Incident objectives">
      {incident.targets.map((t) => {
        const current = measureTarget(t.measure, inputs);
        return (
          <div key={t.label} className="flex items-center gap-3">
            <span className="w-[420px] shrink-0 text-body">{CC.objective(t.label, current, t.target, t.unit, t.dueAt)}</span>
            <Progress value={targetProgress(current, t.target)} className="h-2" aria-label={`${t.label} progress`} />
          </div>
        );
      })}
    </div>
  );
}
