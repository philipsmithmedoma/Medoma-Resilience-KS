import { useStore } from '@/data/store';
import { t, tm } from '@/lib/i18n';
import { fmt, fmtDec } from '@/lib/format';
import { cn } from '@/lib/utils';
import { poolSiteLabel } from './ScenarioPanel';

/** SPEC.md § 6.5 – the current tick's pools as compact chips, brist in red. */
export function ScenarioStrip() {
  const scenario = useStore((s) => s.scenario);
  const nodes = useStore((s) => s.nodes);
  if (!scenario) return null;
  const current = scenario.series.find((r) => r.tick === scenario.tick);
  const offset = scenario.key === 'pandemi' ? t('SCENARIO.offsetDay', { d: scenario.tick }) : t('SCENARIO.offset', { min: scenario.tick * scenario.inputs.tickMin });
  return (
    <div className="rounded-lg border border-border bg-bg-muted px-5 py-3" aria-label={t('SCENARIO.scenarioStrip')}>
      <div className="mb-1 flex items-center gap-3 text-body">
        <span className="font-medium">{t('SCENARIO.scenarioStrip')}</span>
        <span className="text-text-secondary">
          {tm('SCENARIO_NAMES')[scenario.key]}, {t('SCENARIO.tick', { t: fmt(scenario.tick) })}, {offset}
        </span>
      </div>
      {current && current.pools.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          {current.pools.map((p) => {
            const brist = p.demand > p.capacity;
            return (
              <span key={`${p.pool}-${p.site}`} className={cn('tabular', brist ? 'font-medium text-red' : 'text-text-secondary')}>
                {tm('SCENARIO.poolLabels')[p.pool] ?? p.pool} {poolSiteLabel(p.site, nodes)} {t('SCENARIO.demandCapacity', { demand: fmtDec(p.demand), capacity: fmtDec(p.capacity) })}
                {brist ? ` ${t('SCENARIO.shortage').toLowerCase()}` : ''}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-small text-text-secondary">{scenario.events.filter((e) => e.tick <= scenario.tick).map((e) => e.text).join(' · ') || t('SCENARIO.noEvents')}</p>
      )}
    </div>
  );
}
