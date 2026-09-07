import type { LadderStep } from '@/data/types';
import { CAP } from '@/data/vocab';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { SectionHeading } from '@/components/PageTitle';
import { fmt } from '@/lib/format';

interface LadderProps {
  steps: LadderStep[]; // five steps, belagda and lediga already replaced by live values
}

/** SPEC.md § 6.5 Vårdplatsstege: five bars proportional to fastställda, each with name, value and confidence chip, plus the gap sentence. */
export function Ladder({ steps }: LadderProps) {
  const max = steps[0]?.figure.value ?? 0;
  const fastsallda = steps.find((s) => s.key === 'fastsallda')?.figure.value ?? 0;
  const normal = steps.find((s) => s.key === 'disponibla_normal')?.figure.value ?? 0;
  return (
    <section aria-label={CAP.ladder}>
      <SectionHeading>{CAP.ladder}</SectionHeading>
      <ol className="space-y-2">
        {steps.map((step) => (
          <li key={step.key} className="grid grid-cols-[240px_minmax(0,1fr)_80px_120px] items-center gap-4 text-body">
            <span>{step.label}</span>
            <span className="h-5 rounded-sm bg-track">
              <span
                className="block h-5 rounded-sm bg-primary"
                style={{ width: `${max > 0 && step.figure.value !== null ? Math.max(1, Math.round((step.figure.value / max) * 100)) : 0}%` }}
              />
            </span>
            <span className="text-right text-heading tabular">{fmt(step.figure.value)}</span>
            <span>
              <ConfidenceChip figure={step.figure} showSource />
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-text-secondary">{CAP.ladderGap(fmt(fastsallda - normal))}</p>
    </section>
  );
}
