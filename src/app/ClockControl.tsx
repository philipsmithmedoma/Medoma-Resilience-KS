import { PauseIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react';
import { toast } from 'sonner';
import { tickMinutes, useStore } from '@/data/store';
import { CLOCK, SCENARIO, SCENARIO_NAMES } from '@/data/vocab';
import { fmt, fmtDec } from '@/lib/format';
import { DAY_MIN, dayOf, formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/Chip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function IconButton({ label, onClick, primary, children }: { label: string; onClick: () => void; primary?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn('flex size-8 items-center justify-center rounded-md hover:bg-bg-muted', primary ? 'bg-primary text-primary-foreground hover:bg-primary-hover' : 'text-text')}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** DESIGN-KS.md § 3 – the scenario clock: time, play/pause, step one tick, reset; scenario chip while running. */
export function ClockControl() {
  const clock = useStore((s) => s.clock);
  const running = useStore((s) => s.clockRunning);
  const scenario = useStore((s) => s.scenario);
  const incident = useStore((s) => s.incident);
  const setClockRunning = useStore((s) => s.setClockRunning);
  const stepClock = useStore((s) => s.stepClock);
  const resetClock = useStore((s) => s.resetClock);
  const dayTicks = tickMinutes({ scenario, incident }) === DAY_MIN;
  const day = dayOf(clock);

  const chip = scenario
    ? SCENARIO.chip(
        SCENARIO_NAMES[scenario.key],
        scenario.key === 'masskada'
          ? SCENARIO.chipDetail.masskada(fmt(Number(scenario.params.skadade)))
          : scenario.key === 'tryck'
            ? SCENARIO.chipDetail.tryck(fmtDec(Number(scenario.params.faktor)))
            : scenario.key === 'journalbortfall'
              ? SCENARIO.chipDetail.journalbortfall(fmt(Number(scenario.params.timmar)))
              : scenario.key === 'mottagande'
                ? SCENARIO.chipDetail.mottagande(fmt(Number(scenario.params.patienter)))
                : scenario.key === 'pandemi'
                  ? SCENARIO.chipDetail.pandemi(fmt(Number(scenario.params.dygn)))
                  : SCENARIO.chipDetail.siteevac(fmt(Number(scenario.params.patienter))),
      )
    : null;

  return (
    <div className="flex items-center gap-1">
      {chip ? <Chip tone="blue">{chip}</Chip> : null}
      <span className="mx-1 text-body font-medium tabular" aria-label={CLOCK.ariaClock(formatClock(clock))}>
        {formatClock(clock)}
        {day > 1 ? <span className="ml-1 font-normal text-text-secondary">{CLOCK.day(day)}</span> : null}
      </span>
      <IconButton label={running ? CLOCK.pause : CLOCK.play} onClick={() => setClockRunning(!running)} primary={running}>
        {running ? <PauseIcon className="size-5" strokeWidth={1.5} aria-hidden /> : <PlayIcon className="size-5" strokeWidth={1.5} aria-hidden />}
      </IconButton>
      <IconButton label={dayTicks ? CLOCK.stepDay : CLOCK.step} onClick={stepClock}>
        <SkipForwardIcon className="size-5" strokeWidth={1.5} aria-hidden />
      </IconButton>
      <IconButton
        label={CLOCK.reset}
        onClick={() => {
          resetClock();
          toast(CLOCK.clockReset);
        }}
      >
        <RotateCcwIcon className="size-5" strokeWidth={1.5} aria-hidden />
      </IconButton>
    </div>
  );
}
