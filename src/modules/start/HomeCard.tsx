import { Link, useLocation } from 'react-router-dom';
import { HouseIcon } from 'lucide-react';
import type { Figure } from '@/data/types';
import { useStore } from '@/data/store';
import { ICON_TINTS } from '@/data/vocab';
import { t } from '@/lib/i18n';
import { preparednessActive } from '@/lib/preparedness';
import { Card } from '@/components/Card';
import { FigureText } from '@/components/FigureLines';
import { useHomeImpact } from '@/modules/home/useHomeImpact';
import { useHomeGeo } from '@/modules/home/useHomeGeo';

/** The road graph is needed for "unreachable" only while a road is closed; it is loaded then, not before. */
function LoadRoadGraph() {
  useHomeGeo();
  return null;
}

/**
 * SPEC.md § 13.5 – one card "Sjukhus hemma" in the existing card style: patients at home, affected now, unreachable and
 * battery empty within 2 h, each a Figure with confidence `illustrative`, and a link to /home. Preparedness mode only.
 */
export function HomeCard() {
  const location = useLocation();
  const preparednessOn = useStore((s) => s.preparednessOn);
  const incident = useStore((s) => s.incident);
  const scenario = useStore((s) => s.scenario);
  const total = useStore((s) => s.pack.homePatients.length);
  const roadsClosed = useStore((s) => s.home.blockedWays.size + s.home.blockedRoads.size + s.home.blockedNodes.size > 0);
  const { impact } = useHomeImpact();
  if (!preparednessActive({ preparednessOn, incident, scenario }, location.pathname)) return null;
  const fig = (value: number): Figure => ({ value, confidence: 'illustrative', basis: t('HOME.impact.basis') });
  const rows: Array<{ key: string; label: string; figure: Figure }> = [
    { key: 'atHome', label: t('HOME.startPage.atHome'), figure: fig(total) },
    { key: 'affected', label: t('HOME.startPage.affected'), figure: fig(impact.summary.affected) },
    { key: 'unreachable', label: t('HOME.startPage.unreachable'), figure: fig(impact.summary.unreachable) },
    { key: 'battery', label: t('HOME.startPage.battery'), figure: fig(impact.summary.runOutWithin2h) },
  ];
  return (
    <>
      {roadsClosed ? <LoadRoadGraph /> : null}
      <Card
        id="start-home"
        title={t('HOME.startPage.title')}
        tile={{ icon: HouseIcon, iconClass: ICON_TINTS.beds.icon, tileClass: ICON_TINTS.beds.tile }}
        action={
          <Link to="/home" className="text-primary-text hover:text-primary-hover hover:underline">
            {t('HOME.startPage.open')}
          </Link>
        }
      >
        <dl className="grid grid-cols-4 gap-4" data-testid="start-home">
          {rows.map((r) => (
            <div key={r.key} className="space-y-1">
              <dt className="text-small text-text-secondary">{r.label}</dt>
              <dd className="text-heading">
                <FigureText figure={r.figure} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </>
  );
}
