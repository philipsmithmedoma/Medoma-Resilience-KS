import { useStore } from '@/data/store';
import { t, tn, lt } from '@/lib/i18n';
import { activeDisruptions } from '@/lib/disruptions';
import { formatClock } from '@/lib/time';
import type { Impact } from '@/lib/reachability';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { Button } from '@/components/ui/button';

/** Middle pane with disruptions (SPEC.md § 11.6): the active disruptions as text with a reset link, the headline and the facts. */
export function ImpactPanel({ impact }: { impact: Impact }) {
  const pack = useStore((s) => s.pack);
  const home = useStore((s) => s.home);
  const resetHomeDisruptions = useStore((s) => s.resetHomeDisruptions);
  const { summary } = impact;
  const total = pack.homePatients.length;
  const zoneName = (id: string) => lt(pack.homeZones.find((z) => z.id === id)?.name ?? id);

  const clock = useStore((s) => s.clock);
  const endHomeDisruption = useStore((s) => s.endHomeDisruption);
  const active = activeDisruptions(home.disruptions);

  const facts: string[] = [];
  if (summary.unreachable > 0) {
    facts.push(tn('HOME.impact.facts.unreachable', summary.unreachable, { zones: summary.unreachableZones.map(zoneName).join(', ') }));
    facts.push(t('HOME.impact.facts.visitToday', { n: summary.unreachableVisitToday }));
    facts.push(t('HOME.impact.facts.critical', { n: summary.unreachableCritical }));
  }
  if (summary.powerOut > 0) {
    facts.push(tn('HOME.impact.facts.power', summary.powerOut));
    if (summary.shortestBattery !== null) facts.push(t('HOME.impact.facts.battery', { n: summary.shortestBattery }));
    if (summary.earliestBatteryEmptyAt !== null && summary.earliestBatteryEmptyAt > clock) facts.push(t('HOME.time.earliest', { hhmm: formatClock(summary.earliestBatteryEmptyAt) }));
    if (summary.runOutWithin2h > 0) facts.push(t('HOME.time.runOut', { n: summary.runOutWithin2h }));
  }
  if (summary.waterOut > 0) {
    facts.push(tn('HOME.impact.facts.water', summary.waterOut));
    facts.push(t('HOME.impact.facts.dialysis', { n: summary.dialysis }));
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="space-y-1">
        <h3 className="text-body font-medium">{t('HOME.impact.active')}</h3>
        <ul className="space-y-2">
          {active.map((d) => (
            <li key={d.id} className="flex items-start gap-2">
              <span className="min-w-0 flex-1">
                {lt(d.label)}
                <span className="block text-small text-text-secondary tabular">
                  {t('HOME.time.startedAt', { hhmm: formatClock(d.startedAt) })}, {d.expectedEnd !== null ? t('HOME.time.endsAbout', { hhmm: formatClock(d.expectedEnd) }) : t('HOME.time.noEnd')}
                </span>
              </span>
              <Button variant="link" className="h-auto shrink-0 p-0" onClick={() => endHomeDisruption(d.id)}>
                {t('HOME.time.endNow')}
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="link" className="h-auto p-0" onClick={resetHomeDisruptions}>
          {t('HOME.impact.reset')}
        </Button>
      </section>
      <section className="space-y-2">
        <h2 className="text-heading">
          {t('HOME.impact.headline', { n: summary.affected, total })}
          {summary.detour > 0 ? t('HOME.impact.detour', { n: summary.detour }) : ''}
        </h2>
        {/* The patient count is a synthetic figure, so it carries the illustrative chip. */}
        <ConfidenceChip figure={{ value: total, confidence: 'illustrative', basis: t('HOME.impact.basis') }} />
        {facts.length ? (
          <ul className="space-y-1">
            {facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
