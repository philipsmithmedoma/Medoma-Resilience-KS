import type { Figure } from '@/data/types';
import { LABELS } from '@/data/vocab';
import { isStale } from '@/lib/time';
import { cn } from '@/lib/utils';

interface FigureLinesProps {
  figure: Figure;
  clock: number;
  className?: string;
}

/**
 * SPEC.md § 7.1 – the two 13 px lines under a figure: "{verified} verified + {estimated} estimated"
 * (only when estimated > 0) and "Last confirmed HH:MM (source)"; a time older than 30 minutes is
 * shown in orange with the title "Older than 30 minutes".
 */
export function FigureLines({ figure, clock, className }: FigureLinesProps) {
  return (
    <div className={cn('text-small', className)}>
      {figure.estimated > 0 ? <ConfidenceLine figure={figure} /> : null}
      <LastConfirmed figure={figure} clock={clock} />
    </div>
  );
}

export function ConfidenceLine({ figure }: { figure: Figure }) {
  return (
    <div className="text-text-secondary">
      {figure.verified} verified + {figure.estimated} estimated
    </div>
  );
}

export function LastConfirmed({ figure, clock }: { figure: Figure; clock: number }) {
  const stale = isStale(clock, figure.lastConfirmed);
  return (
    <div className="text-text-muted">
      Last confirmed <TimeStamp time={figure.lastConfirmed} stale={stale} /> ({figure.source})
    </div>
  );
}

export function TimeStamp({ time, stale }: { time: string; stale: boolean }) {
  return (
    <span className={cn('tabular', stale && 'text-orange-text')} title={stale ? LABELS.olderThan30 : undefined}>
      {time}
    </span>
  );
}
