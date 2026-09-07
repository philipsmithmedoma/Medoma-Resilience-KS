import { Card } from '@/components/Card';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { LastConfirmed } from '@/components/FigureLines';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LABELS } from '@/data/vocab';
import { fmt } from '@/lib/format';
import type { CardModel } from './cards';

interface CapacityCardProps {
  card: CardModel;
  clock: number;
  onShowDetail?: (card: CardModel) => void;
  format?: (n: number) => string;
}

/** DESIGN.md § 4 capacity card: figure 32/600 with unit 15/400, confidence chip on the title row, last confirmed, "Visa detalj". */
export function CapacityCard({ card, clock, onShowDetail, format }: CapacityCardProps) {
  const figure = card.figure;
  const value = figure ? (figure.value === null ? LABELS.unknown : format ? format(figure.value) : fmt(figure.value)) : LABELS.unknown;

  let action: React.ReactNode = null;
  if (card.detail?.kind === 'popover') {
    action = (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="text-primary hover:text-primary-hover hover:underline">
            {LABELS.showDetail}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-sm text-body">
          {card.detail.text}
        </PopoverContent>
      </Popover>
    );
  } else if (card.detail && onShowDetail) {
    action = (
      <button type="button" className="text-primary hover:text-primary-hover hover:underline" onClick={() => onShowDetail(card)}>
        {LABELS.showDetail}
      </button>
    );
  }

  return (
    <Card title={card.title} subtitle={card.subtitle} tile={card.tile} titleRight={figure ? <ConfidenceChip figure={figure} showSource /> : null} action={card.notAvailable ? null : action}>
      {card.notAvailable ? (
        <p className="text-text-secondary">{LABELS.notAvailableAtNode}</p>
      ) : (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-figure tabular">{value}</span>
            {card.unit ? <span className="text-body text-text-secondary">{card.unit}</span> : null}
          </div>
          <div className="mt-1 text-small">
            {card.note ? <div className="text-text-secondary">{card.note}</div> : null}
            {figure ? <LastConfirmed figure={figure} clock={clock} /> : null}
          </div>
        </div>
      )}
    </Card>
  );
}
