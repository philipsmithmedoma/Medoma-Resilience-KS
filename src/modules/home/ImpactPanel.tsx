import { useStore } from '@/data/store';
import { t, tn, lt } from '@/lib/i18n';
import { linkLabel } from '@/lib/home-names';
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

  const lines: string[] = [];
  const closed = [
    ...[...home.blockedNodes].map((id) => lt(pack.infraNodes.find((n) => n.id === id)?.name ?? id)),
    ...[...home.blockedLinks].map((id) => {
      const link = pack.infraLinks.find((l) => l.id === id);
      return link ? linkLabel(link, pack) : id;
    }),
  ];
  if (closed.length) lines.push(t('HOME.impact.closed', { names: closed.join(', ') }));
  if (home.powerOutZones.size) lines.push(t('HOME.impact.powerOut', { names: [...home.powerOutZones].map(zoneName).join(', ') }));
  if (home.waterOutZones.size) lines.push(t('HOME.impact.waterOut', { names: [...home.waterOutZones].map(zoneName).join(', ') }));

  const facts: string[] = [];
  if (summary.unreachable > 0) {
    facts.push(tn('HOME.impact.facts.unreachable', summary.unreachable, { zones: summary.unreachableZones.map(zoneName).join(', ') }));
    facts.push(t('HOME.impact.facts.visitToday', { n: summary.unreachableVisitToday }));
    facts.push(t('HOME.impact.facts.critical', { n: summary.unreachableCritical }));
  }
  if (summary.powerOut > 0) {
    facts.push(tn('HOME.impact.facts.power', summary.powerOut));
    if (summary.shortestBattery !== null) facts.push(t('HOME.impact.facts.battery', { n: summary.shortestBattery }));
  }
  if (summary.waterOut > 0) {
    facts.push(tn('HOME.impact.facts.water', summary.waterOut));
    facts.push(t('HOME.impact.facts.dialysis', { n: summary.dialysis }));
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="space-y-1">
        <h3 className="text-body font-medium">{t('HOME.impact.active')}</h3>
        <ul className="space-y-1">
          {lines.map((l) => (
            <li key={l}>{l}</li>
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
