import type { Figure } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { fmt } from '@/lib/format';
import { isStale } from '@/lib/time';
import { cn } from '@/lib/utils';
import { ConfidenceChip } from './ConfidenceChip';

interface FigureLinesProps {
  figure: Figure;
  clock: number;
  className?: string;
}

/**
 * The 13 px lines under a figure: "{verified} verifierade + {estimated} estimerade" when the figure was
 * split, and "Senast bekräftad HH:MM (källa)" when it has a data source; a time older than 30 minutes
 * is shown in orange with the title "Äldre än 30 minuter".
 */
export function FigureLines({ figure, clock, className }: FigureLinesProps) {
  return (
    <div className={cn('text-small', className)}>
      {figure.estimated !== undefined && figure.estimated > 0 && figure.verified !== undefined && figure.verified > 0 ? (
        <div className="text-text-secondary">
          {fmt(figure.verified)} verifierade + {fmt(figure.estimated)} estimerade
        </div>
      ) : null}
      <LastConfirmed figure={figure} clock={clock} />
    </div>
  );
}

export function LastConfirmed({ figure, clock }: { figure: Figure; clock: number }) {
  if (!figure.lastConfirmed || !figure.dataSource) return null;
  const stale = isStale(clock, figure.lastConfirmed);
  return (
    <div className="text-text-muted">
      {t('LABELS.lastConfirmedLabel')} <TimeStamp time={figure.lastConfirmed} stale={stale} /> ({tm('DATA_SOURCE_LABELS')[figure.dataSource]})
    </div>
  );
}

export function TimeStamp({ time, stale }: { time: string; stale: boolean }) {
  return (
    <span className={cn('tabular', stale && 'text-orange-text')} title={stale ? t('LABELS.olderThan30') : undefined}>
      {time}
    </span>
  );
}

/** A figure's value (Swedish format, "Okänt" for null) followed by its confidence chip. */
export function FigureText({ figure, format, className, showSource }: { figure: Figure; format?: (n: number) => string; className?: string; showSource?: boolean }) {
  const text = figure.value === null ? t('LABELS.unknown') : format ? format(figure.value) : fmt(figure.value);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="tabular">{text}</span>
      <ConfidenceChip figure={figure} showSource={showSource} />
    </span>
  );
}
