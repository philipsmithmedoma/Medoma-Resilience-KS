import { HOME_MODES } from '@/data/store-home';
import { useStore } from '@/data/store';
import { disruptionCount } from '@/lib/reachability';
import { tm } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Disruption modes above the map (SPEC.md § 11.5): close roads, power outage, water disruption, and the "Reset" chip. */
export function ModeChips({ className }: { className?: string }) {
  const mode = useStore((s) => s.home.mode);
  const home = useStore((s) => s.home);
  const setHomeMode = useStore((s) => s.setHomeMode);
  const resetHomeDisruptions = useStore((s) => s.resetHomeDisruptions);
  const labels = tm('HOME.modes');
  const any = disruptionCount(home) > 0;
  return (
    <div role="group" aria-label={labels.label} className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-small text-text-secondary">{labels.label}</span>
      {HOME_MODES.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => setHomeMode(m)}
          className={cn(
            'h-7 rounded-full border px-3 text-small whitespace-nowrap transition-colors duration-150',
            mode === m ? 'border-primary-text bg-primary text-primary-foreground' : 'border-border bg-surface text-text hover:bg-bg-muted',
          )}
        >
          {labels[m]}
        </button>
      ))}
      <button
        type="button"
        disabled={!any}
        onClick={resetHomeDisruptions}
        className="h-7 rounded-full border border-chip-red-border bg-chip-red-bg px-3 text-small whitespace-nowrap text-chip-red-text transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {labels.reset}
      </button>
    </div>
  );
}
