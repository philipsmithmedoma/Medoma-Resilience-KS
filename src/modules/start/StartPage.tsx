import { Link, useNavigate } from 'react-router-dom';
import { BedIcon, HeartPulseIcon, ScissorsIcon, StethoscopeIcon, UsersIcon, BuildingIcon } from 'lucide-react';
import type { Figure, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { ICON_TINTS } from '@/data/vocab';
import { t, tm } from '@/lib/i18n';
import { sumFigures } from '@/lib/figure';
import { isRegion, isSite, scopeName, sitesInScope } from '@/lib/scope';
import { Button } from '@/components/ui/button';
import type { IconTileProps } from '@/components/Card';
import { CapacityCard } from '@/modules/capacity/CapacityCard';
import type { CardModel } from '@/modules/capacity/cards';
import { startChapter } from './chapters';

const tile = (icon: IconTileProps['icon'], tint: keyof typeof ICON_TINTS): IconTileProps => ({ icon, iconClass: ICON_TINTS[tint].icon, tileClass: ICON_TINTS[tint].tile });

/** DESIGN-KS.md § 5 – presenter start page: title, five chapters, Nyckeltal, footer. */
export function StartPage() {
  const navigate = useNavigate();
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const ladders = useStore((s) => s.pack.ladders);
  const hospital = useStore((s) => s.pack.hospital);
  const clock = useStore((s) => s.clock);
  const sites = sitesInScope(scope);
  const ladderScope = isSite(scope) ? scope : 'karolinska';
  const ladder = ladders[ladderScope];
  const step = (key: string): Figure => ladder.find((s) => s.key === key)!.figure;
  const icuTotal = sumFigures(nodes.filter((n) => n.site && (sites.length ? sites.includes(n.site) : true) && n.intensiveCare).map((n) => n.intensiveCare!.total));
  const siteScope = isSite(scope);
  const wholeHospital = siteScope ? t('START.wholeHospital') : undefined;
  const keyScope = isRegion(scope) || sites.length === 0 ? 'Karolinska' : scopeName(scope, nodes);

  const cards: CardModel[] = [
    { key: 'fastsallda', title: t('START.cards.fastsallda'), tile: tile(BedIcon, 'beds'), figure: step('fastsallda'), unit: t('START.units.beds') },
    { key: 'disponibla', title: t('START.cards.disponibla'), tile: tile(BedIcon, 'beds'), figure: step('disponibla_normal'), unit: t('START.units.beds') },
    { key: 'iva', title: t('START.cards.iva'), tile: tile(HeartPulseIcon, 'intensive'), figure: icuTotal, unit: t('START.units.beds') },
    { key: 'employees', title: t('START.cards.employees'), tile: tile(UsersIcon, 'staff'), figure: hospital.employees, unit: t('START.units.people'), note: wholeHospital },
    { key: 'operations', title: t('START.cards.operations'), tile: tile(ScissorsIcon, 'theatres'), figure: hospital.operations, unit: t('START.units.operations'), note: wholeHospital },
    { key: 'inpatient', title: t('START.cards.inpatient'), tile: tile(StethoscopeIcon, 'imaging'), figure: hospital.inpatientEpisodes, unit: t('START.units.episodes'), note: wholeHospital },
  ];

  const start = (n: number) => {
    const effect = startChapter(n, useStore.getState());
    navigate(effect.route);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-title">{t('START.title')}</h1>
        <p className="text-body text-text-secondary">
          {t('START.subtitle')}{' '}
          <Link to="/kallor" className="text-primary-text hover:text-primary-hover hover:underline">
            {t('START.sourcesLink')}
          </Link>
        </p>
        {t('START.glossary') ? <p className="text-small text-text-muted">{t('START.glossary')}</p> : null}
      </div>

      <section aria-label={t('START.chapters')}>
        <div className="grid grid-cols-5 gap-4">
          {tm('START.chapterList').map((c) => (
            <article key={c.n} className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-card">
              <span className="text-small text-text-secondary tabular">{c.n}</span>
              <h2 className="mt-1 text-heading">{c.title}</h2>
              <p className="mt-2 flex-1 text-body text-text-secondary">{c.description}</p>
              <Button className="mt-4 self-start" onClick={() => start(c.n)}>
                {t('START.startChapter')}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-heading">
          {t('START.keyFigures')} <span className="font-normal text-text-secondary">{t('START.keyFigureScope', { scope: keyScope })}</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <CapacityCard key={card.key} card={card} clock={clock} />
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-small text-text-muted">
        <BuildingIcon className="size-4" strokeWidth={1.5} aria-hidden />
        {t('START.footer')}
      </p>
    </div>
  );
}

export type { SiteId };
