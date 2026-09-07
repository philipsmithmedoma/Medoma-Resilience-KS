import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ScenarioKey } from '@/data/types';
import { useStore } from '@/data/store';
import { CLOCK, LABELS, SCENARIO, SCENARIO_NAMES, SCOPE_LABELS, SITE_LABELS } from '@/data/vocab';
import { fmt, fmtDec } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/Chip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const KATASTROF_THRESHOLD = 60;

export function poolSiteLabel(site: string, nodes: Array<{ id: string; shortName: string }>): string {
  if (site === 'solna' || site === 'huddinge') return SITE_LABELS[site];
  if (site === 'karolinska') return SCOPE_LABELS.karolinska;
  if (site === 'region') return SCOPE_LABELS.region;
  return nodes.find((n) => n.id === site)?.shortName ?? site;
}

/**
 * DESIGN-KS.md § 7 – right-hand Sheet: scenario, parameters, "Starta"; while running the event timeline,
 * a bar per pool (red when demand > capacity) and the recommendation buttons. Store-driven so that
 * chapters can open it on any page.
 */
export function ScenarioPanel() {
  const panel = useStore((s) => s.scenarioPanel);
  const presets = useStore((s) => s.pack.scenarios);
  const scenario = useStore((s) => s.scenario);
  const nodes = useStore((s) => s.nodes);
  const clockRunning = useStore((s) => s.clockRunning);
  const closeScenarioPanel = useStore((s) => s.closeScenarioPanel);
  const startScenario = useStore((s) => s.startScenario);
  const stopScenario = useStore((s) => s.stopScenario);
  const setClockRunning = useStore((s) => s.setClockRunning);
  const stepClock = useStore((s) => s.stepClock);
  const applyRecommendation = useStore((s) => s.applyRecommendation);
  const holdClock = useStore((s) => s.holdClock);
  const navigate = useNavigate();
  const [key, setKey] = useState<ScenarioKey>('masskada');
  const [params, setParams] = useState<Record<string, number | string>>({});
  const [confirmKatastrof, setConfirmKatastrof] = useState(false);
  const selectId = useId();

  useEffect(() => {
    if (panel.open) {
      const k = scenario?.key ?? panel.key ?? 'masskada';
      setKey(k);
      setParams({ ...(scenario?.params ?? presets.find((p) => p.key === k)!.params) });
    }
  }, [panel, presets, scenario]);

  useEffect(() => {
    if (!confirmKatastrof) return;
    holdClock(true);
    return () => holdClock(false);
  }, [confirmKatastrof, holdClock]);

  const preset = presets.find((p) => p.key === key)!;
  const running = scenario !== null;
  const choose = (k: ScenarioKey) => {
    setKey(k);
    setParams({ ...presets.find((p) => p.key === k)!.params });
  };
  const start = () => {
    startScenario(key, params, true);
    toast(SCENARIO.started(SCENARIO_NAMES[key]));
    if (key === 'siteevac') {
      closeScenarioPanel();
      navigate('/evakuering');
    }
  };
  const close = (open: boolean) => {
    if (!open) closeScenarioPanel();
  };
  const apply = (k: string) => {
    if (k === 'katastrof' && Number(scenario?.params.skadade ?? 0) <= KATASTROF_THRESHOLD) {
      setConfirmKatastrof(true);
      return;
    }
    applyRecommendation(k);
    toast(SCENARIO.recs[k].label);
  };

  const current = scenario?.series.find((r) => r.tick === scenario.tick);
  const tickOffset = scenario ? (scenario.key === 'pandemi' ? SCENARIO.offsetDay(scenario.tick) : SCENARIO.offset(scenario.tick * scenario.inputs.tickMin)) : '';
  const pastEvents = scenario ? scenario.events.filter((e) => e.tick <= scenario.tick) : [];
  const sitesInSeries = current ? [...new Set(current.pools.map((p) => p.site))] : [];

  return (
    <>
      <Sheet open={panel.open} onOpenChange={close} modal={false}>
        <SheetContent className="overflow-y-auto" style={{ top: 48, height: 'calc(100% - 48px)' }} onInteractOutside={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>{scenario ? SCENARIO_NAMES[scenario.key] : SCENARIO.title}</SheetTitle>
            <SheetDescription>
              {scenario ? (scenario.running ? `${CLOCK.running}, ${SCENARIO.tick(fmt(scenario.tick))}, ${tickOffset}` : scenario.tick >= scenario.inputs.horizonTicks ? SCENARIO.finished : `${SCENARIO.tick(fmt(scenario.tick))}, ${tickOffset}`) : SCENARIO.notStarted}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-4 pb-6">
            {!running ? (
              <>
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
                          <Input id={`${selectId}-${def.key}`} type="number" step={def.key === 'faktor' ? 0.1 : 1} value={String(params[def.key] ?? '')} onChange={(e) => setParams((p) => ({ ...p, [def.key]: Number(e.target.value) }))} className="w-32" />
                          {def.unit ? <span className="text-small text-text-secondary">{def.unit}</span> : null}
                        </span>
                      )}
                    </div>
                  ))}
                </section>
                <Button onClick={start}>{SCENARIO.start}</Button>
              </>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="text-body font-medium">{SCENARIO.params}</h3>
                  <p className="text-small text-text-secondary">
                    {Object.entries(scenario!.params)
                      .map(([k, v]) => `${SCENARIO.paramLabels[k] ?? k}: ${typeof v === 'number' ? (Number.isInteger(v) ? fmt(v) : fmtDec(v)) : String(v)}`)
                      .join(' · ')}
                  </p>
                  <div className="flex items-center gap-3">
                    {scenario!.running ? (
                      <>
                        <Button variant="secondary" onClick={() => setClockRunning(!clockRunning)}>
                          {clockRunning ? CLOCK.pause : CLOCK.play}
                        </Button>
                        <Button variant="secondary" onClick={stepClock}>
                          {scenario!.key === 'pandemi' ? CLOCK.stepDay : CLOCK.step}
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        stopScenario();
                        toast(SCENARIO.stopped(SCENARIO_NAMES[scenario!.key]));
                      }}
                    >
                      {SCENARIO.stop}
                    </Button>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-body font-medium">{SCENARIO.events}</h3>
                  {pastEvents.length === 0 ? (
                    <p className="text-small text-text-secondary">{SCENARIO.noEvents}</p>
                  ) : (
                    <ol className="space-y-1 text-body">
                      {pastEvents.map((e, i) => (
                        <li key={`${e.tick}-${i}`} className="flex gap-2">
                          <span className="w-2 shrink-0 pt-2">
                            <span className="block size-2 rounded-full bg-primary" />
                          </span>
                          <span>{e.text}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                {current && current.pools.length ? (
                  <section>
                    <h3 className="mb-2 text-body font-medium">{SCENARIO.pools}</h3>
                    {sitesInSeries.map((site) => (
                      <div key={site} className="mb-3">
                        <h4 className="mb-1 text-small text-text-secondary">{poolSiteLabel(site, nodes)}</h4>
                        <ol className="space-y-1.5">
                          {current.pools
                            .filter((p) => p.site === site)
                            .map((p) => {
                              const brist = p.demand > p.capacity;
                              const max = Math.max(p.demand, p.capacity, 1);
                              return (
                                <li key={p.pool} className="grid grid-cols-[150px_minmax(0,1fr)_72px] items-center gap-2 text-small">
                                  <span className="truncate" title={SCENARIO.poolLabels[p.pool] ?? p.pool}>
                                    {SCENARIO.poolLabels[p.pool] ?? p.pool}
                                  </span>
                                  <span className="relative h-4 rounded-sm bg-track">
                                    <span className={cn('block h-4 rounded-sm', brist ? 'bg-red-icon' : 'bg-primary')} style={{ width: `${Math.min(100, Math.round((p.demand / max) * 100))}%` }} />
                                    <span className="absolute top-0 h-4 w-0.5 bg-text" style={{ left: `${Math.min(100, Math.round((p.capacity / max) * 100))}%` }} aria-hidden />
                                  </span>
                                  <span className={cn('text-right tabular', brist && 'text-red')}>{SCENARIO.demandCapacity(fmtDec(p.demand), fmtDec(p.capacity))}</span>
                                </li>
                              );
                            })}
                        </ol>
                      </div>
                    ))}
                  </section>
                ) : null}

                <section>
                  <h3 className="mb-2 text-body font-medium">{SCENARIO.recommendations}</h3>
                  <ul className="space-y-2">
                    {scenario!.recommendations.map((r) => {
                      const applied = scenario!.applied.includes(r.key);
                      return (
                        <li key={r.key} className="flex items-center justify-between gap-3 rounded-md border border-border p-2">
                          <span className="min-w-0">
                            <span className="block text-body">{r.label}</span>
                            <span className="block text-small text-text-muted">{r.effect}</span>
                          </span>
                          {applied ? (
                            <StatusChip status="Done" label={SCENARIO.applied} />
                          ) : (
                            <Button variant="secondary" size="sm" disabled={!r.applicable} title={r.applicable ? undefined : SCENARIO.notApplicable} onClick={() => apply(r.key)}>
                              {SCENARIO.execute}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmKatastrof} onOpenChange={setConfirmKatastrof}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{SCENARIO.katastrofConfirmTitle}</DialogTitle>
            <DialogDescription>{SCENARIO.katastrofConfirmBody(fmt(Number(scenario?.params.skadade ?? 0)))}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmKatastrof(false)}>
              {LABELS.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmKatastrof(false);
                applyRecommendation('katastrof');
                toast(SCENARIO.recs.katastrof.label);
              }}
            >
              {SCENARIO.confirmKatastrof}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
