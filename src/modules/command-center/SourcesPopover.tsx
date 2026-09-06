import type { SourceEntry } from '@/data/types';
import { CC } from '@/data/vocab';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip } from '@/components/Chip';
import { TimeStamp } from '@/components/FigureLines';
import { isStale } from '@/lib/time';

interface SourcesPopoverProps {
  sources: SourceEntry[];
  clock: number;
  children: React.ReactNode; // the sync chip acting as trigger
}

/** SPEC.md § 6.1 – clicking the sync chip lists the sources for the scope with a state chip and last sync. */
export function SourcesPopover({ sources, clock, children }: SourcesPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rounded-full" aria-label="Show sources">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <h3 className="mb-2 text-body font-medium">{CC.sources}</h3>
        <table className="w-full text-body">
          <thead>
            <tr className="text-small text-text-secondary">
              <th className="py-1 text-left font-normal">{CC.columns.source}</th>
              <th className="py-1 text-left font-normal">{CC.columns.state}</th>
              <th className="py-1 text-right font-normal">{CC.columns.lastSync}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.source} className="border-t border-border">
                <td className="py-1.5">{s.source}</td>
                <td className="py-1.5">
                  <StatusChip status={s.state} />
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
