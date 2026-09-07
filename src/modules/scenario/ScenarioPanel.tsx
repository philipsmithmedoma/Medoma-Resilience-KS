import { useEffect, useId, useState } from 'react';
import type { ScenarioKey } from '@/data/types';
import { useStore } from '@/data/store';
import { SCENARIO, SCENARIO_NAMES } from '@/data/vocab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ScenarioPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * DESIGN-KS.md § 7 – the scenario panel: scenario, parameters and "Starta". The engine, the timeline and
 * the recommendations land in Batch 3; until then starting is a no-op that closes the panel.
 */
export function ScenarioPanel({ open, onOpenChange }: ScenarioPanelProps) {
  const presets = useStore((s) => s.pack.scenarios);
  const armed = useStore((s) => s.scenarioPanel);
  const [key, setKey] = useState<ScenarioKey>('masskada');
  const [params, setParams] = useState<Record<string, number | string>>({});
  const selectId = useId();

  useEffect(() => {
    if (open) {
      const k = armed.key ?? 'masskada';
      setKey(k);
      setParams({ ...presets.find((p) => p.key === k)!.params });
    }
  }, [open, armed, presets]);

  const preset = presets.find((p) => p.key === key)!;
  const choose = (k: ScenarioKey) => {
    setKey(k);
    setParams({ ...presets.find((p) => p.key === k)!.params });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{SCENARIO.title}</SheetTitle>
          <SheetDescription>{SCENARIO.notStarted}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <div className="space-y-1">
            <label htmlFor={selectId}>{SCENARIO.choose}</label>
            <Select value={key} onValueChange={(v) => choose(v as ScenarioKey)}>
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {SCENARIO_NAMES[p.key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <section className="space-y-3">
            <h3 className="text-body font-medium">{SCENARIO.params}</h3>
            {preset.paramDefs.map((def) => (
              <div key={def.key} className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-3">
                <label htmlFor={`${selectId}-${def.key}`}>{def.label}</label>
                {def.type === 'select' ? (
                  <Select value={String(params[def.key] ?? '')} onValueChange={(v) => setParams((p) => ({ ...p, [def.key]: v }))}>
                    <SelectTrigger id={`${selectId}-${def.key}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {def.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="flex items-center gap-2">
                    <Input id={`${selectId}-${def.key}`} type="number" value={String(params[def.key] ?? '')} onChange={(e) => setParams((p) => ({ ...p, [def.key]: Number(e.target.value) }))} className="w-32" />
                    {def.unit ? <span className="text-small text-text-secondary">{def.unit}</span> : null}
                  </span>
                )}
              </div>
            ))}
          </section>
          <Button onClick={() => onOpenChange(false)}>{SCENARIO.start}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
