import { useId } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/data/store';
import { LABELS } from '@/data/vocab';
import { formatClock } from '@/lib/time';

/** SPEC.md § 2.4 – the Demo popover in the nav's right cluster. */
export function DemoControls() {
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const setEhrOutage = useStore((s) => s.setEhrOutage);
  const reset = useStore((s) => s.reset);
  const switchId = useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          {LABELS.demo}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={switchId}>{LABELS.simulateEhrOutage}</label>
          <Switch id={switchId} checked={ehrOutage} onCheckedChange={setEhrOutage} />
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            toast(LABELS.demoDataReset);
          }}
        >
          {LABELS.resetDemoData}
        </Button>
        <p className="text-small text-text-secondary">{LABELS.demoClock(formatClock(clock))}</p>
      </PopoverContent>
    </Popover>
  );
}
