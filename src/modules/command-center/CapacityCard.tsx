import { Card } from '@/components/Card';
import { StatusChip } from '@/components/Chip';
import { ConfidenceLine, LastConfirmed } from '@/components/FigureLines';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LABELS } from '@/data/vocab';
import type { CardModel } from './cards';

interface CapacityCardProps {
  card: CardModel;
  clock: number;
  onShowDetail?: (card: CardModel) => void;
}

/** DESIGN.md § 4 capacity card: figure 32/600 with unit 15/400, confidence line, last confirmed, "Show detail". */
export function CapacityCard({ card, clock, onShowDetail }: CapacityCardProps) {
  const figure = card.figure;
  const value = card.value ?? figure?.value;
  const estimated = figure ? figure.estimated > 0 : false;

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
    <Card
      title={card.title}
      subtitle={card.subtitle}
      tile={card.tile}
      titleRight={estimated ? <StatusChip status={LABELS.estimated} /> : card.notShared ? <StatusChip status={LABELS.notShared} /> : null}
      action={card.notAvailable || card.notShared ? null : action}
    >
      {card.notAvailable ? (
        <p className="text-text-secondary">{LABELS.notAvailableAtNode}</p>
      ) : card.notShared ? (
        <p className="text-text-secondary">{LABELS.notShared}</p>
      ) : (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-figure tabular">{value}</span>
            {card.unit ? <span className="text-body text-text-secondary">{card.unit}</span> : null}
          </div>
          <div className="mt-1 text-small">
            {card.confidence ? (
              <div className="text-text-secondary">{card.confidence}</div>
            ) : figure && estimated ? (
              <ConfidenceLine figure={figure} />
            ) : null}
            {figure && figure.lastConfirmed ? <LastConfirmed figure={figure} clock={clock} /> : null}
          </div>
        </div>
      )}
    </Card>
  );
}
