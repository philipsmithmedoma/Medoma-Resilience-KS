import type { SourceEntry } from '@/data/types';
import { CAP, DATA_SOURCE_LABELS, SYNC_LABELS } from '@/data/vocab';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip } from '@/components/Chip';
import { TimeStamp } from '@/components/FigureLines';
import { isStale } from '@/lib/time';

interface SourcesPopoverProps {
  sources: SourceEntry[];
  clock: number;
  children: React.ReactNode; // the sync chip acting as trigger
}

/** SPEC.md § 6.5 – clicking the sync chip lists the systems for the scope with a state chip and last sync. */
export function SourcesPopover({ sources, clock, children }: SourcesPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rounded-full" aria-label={CAP.sources}>
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <h3 className="mb-2 text-body font-medium">{CAP.sources}</h3>
        <table className="w-full text-body">
          <thead>
            <tr className="text-small text-text-secondary">
              <th className="py-1 text-left font-normal">{CAP.columns.source}</th>
              <th className="py-1 text-left font-normal">{CAP.columns.state}</th>
              <th className="py-1 text-right font-normal">{CAP.columns.lastSync}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.source} className="border-t border-border">
                <td className="py-1.5">{DATA_SOURCE_LABELS[s.source]}</td>
                <td className="py-1.5">
                  <StatusChip status={s.state} label={SYNC_LABELS[s.state]} />
                </td>
                <td className="py-1.5 text-right">
                  <TimeStamp time={s.lastSync} stale={s.state !== 'Offline' && isStale(clock, s.lastSync)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
}
