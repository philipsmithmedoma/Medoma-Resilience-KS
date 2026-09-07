import { Link } from 'react-router-dom';
import type { Figure } from '@/data/types';
import { useStore } from '@/data/store';
import { CONFIDENCE_CHIPS, CONFIDENCE_TEXT, SOURCES, toneOf } from '@/data/vocab';
import { isMirror } from '@/lib/figure';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Chip } from './Chip';

/** The Källor anchor for a figure: its source key, or the confidence class row. */
export function sourceAnchor(figure: Figure): string {
  if (figure.source) return figure.source;
  if (figure.confidence === 'reported') return SOURCES.anchors.reported;
  if (figure.confidence === 'estimate') return SOURCES.anchors.estimate;
  return SOURCES.anchors.illustrative;
}

interface ConfidenceChipProps {
  figure: Figure;
  /** Show a small "Källa S5" link for verified figures (which have no chip by default). */
  showSource?: boolean;
  className?: string;
}

/**
 * DESIGN-KS.md § 4: verified → no chip; reported → grey "Uppgift"; estimate → warning "Estimat";
 * illustrative → grey "Illustrativt"; a figure served from the mirror → warning "Spegel". Clicking opens a
 * popover with the meaning, source, basis and a link "Visa i Källor".
 */
export function ConfidenceChip({ figure, showSource = false, className }: ConfidenceChipProps) {
  const mirror = isMirror(figure);
  const label = mirror ? CONFIDENCE_TEXT.mirror : CONFIDENCE_CHIPS[figure.confidence];
  if (!label) {
    if (!showSource || !figure.source) return null;
    return (
      <ConfidencePopover figure={figure}>
        <button type="button" className={`text-small text-text-muted hover:text-primary hover:underline ${className ?? ''}`}>
          {CONFIDENCE_TEXT.source} {figure.source}
        </button>
      </ConfidencePopover>
    );
  }
  return (
    <ConfidencePopover figure={figure}>
      <button type="button" className={`rounded-full ${className ?? ''}`} aria-label={`${label}: ${CONFIDENCE_TEXT[mirror ? 'mirror' : figure.confidence]}`}>
        <Chip tone={toneOf(label)}>{label}</Chip>
      </button>
    </ConfidencePopover>
  );
}

export function ConfidencePopover({ figure, children }: { figure: Figure; children: React.ReactNode }) {
  const sources = useStore((s) => s.pack.sources);
  const since = useStore((s) => s.ehrOutageSince);
  const source = figure.source ? sources.find((s) => s.key === figure.source) : undefined;
  const mirror = isMirror(figure);
  const text = mirror ? CONFIDENCE_TEXT.mirrorText(since ?? '') : CONFIDENCE_TEXT[figure.confidence];
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 text-body">
        <p className="font-medium">{text}</p>
        {source ? (
          <p className="text-small text-text-secondary">
            {source.key}: {source.name}, {source.date}.{' '}
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {SOURCES.open}
              </a>
            ) : null}
          </p>
        ) : null}
        {figure.basis ? (
          <p className="text-small text-text-secondary">
            {CONFIDENCE_TEXT.basis}: {figure.basis}
          </p>
        ) : null}
        <Link to={`/kallor#${sourceAnchor(figure)}`} className="block text-primary hover:text-primary-hover hover:underline">
          {CONFIDENCE_TEXT.showInSources}
        </Link>
      </PopoverContent>
    </Popover>
  );
}
