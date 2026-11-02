import { Fragment, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/data/store';
import type { HomePackId } from '@/data/types';
import { HOME_PACK_IDS, homePacks, withHomePack } from '@/data/packs/home-packs';
import { SOURCE_ANCHORS } from '@/data/vocab';
import { t, tm } from '@/lib/i18n';
import { fmt, fmtDec } from '@/lib/format';
import { collectFigures, collectHomeFigures, type FigureEntry } from '@/lib/sources';
import { PageTitle, SectionHeading } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function valueText(e: FigureEntry): string {
  if (e.text) return e.text;
  if (e.figure.value === null) return t('LABELS.unknown');
  return Number.isInteger(e.figure.value) ? fmt(e.figure.value) : fmtDec(e.figure.value);
}


/** The infrastructure sources of one home pack (S-H1…S-H14 for Karolinska, S-L1…S-L5 for SUS Lund) and the figures that cite them. */
function HomeSources({ id }: { id: HomePackId }) {
  const pack = useStore((s) => s.pack);
  const data = useMemo(() => withHomePack(pack, id), [pack, id]);
  const homeFigures = useMemo(() => collectHomeFigures(data), [data]);
  return (
      <section>
          <SectionHeading>{id === 'karolinska' ? t('SOURCES.homeHeading') : t('SOURCES.homeHeadingPack', { pack: homePacks[id].name })}</SectionHeading>
          <p className="mb-3 max-w-[900px] text-text-secondary">{t('SOURCES.homeIntro')}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('SOURCES.columns.figure')}</TableHead>
                <TableHead className="text-right">{t('SOURCES.columns.value')}</TableHead>
                <TableHead>{t('SOURCES.columns.confidence')}</TableHead>
                <TableHead>{t('SOURCES.columns.date')}</TableHead>
                <TableHead>{t('SOURCES.columns.link')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody lang="sv">
              {data.homeSources.map((src) => {
                const rows = homeFigures.filter((e) => e.figure.source === src.key);
                return (
                  <Fragment key={src.key}>
                    <TableRow id={src.key} className="scroll-mt-4 bg-bg-muted hover:bg-bg-muted">
                      <TableCell colSpan={3} className="whitespace-normal font-medium">
                        {src.key}: {src.name}
                      </TableCell>
                      <TableCell className="whitespace-normal">{src.date}</TableCell>
                      <TableCell>
                        {src.url ? (
                          <a href={src.url} target="_blank" rel="noreferrer" className="text-primary-text hover:text-primary-hover hover:underline">
                            {t('SOURCES.open')}
                          </a>
                        ) : (
                          <span className="text-text-muted">{t('SOURCES.noLink')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {rows.map((e, i) => (
                      <TableRow key={`${src.key}-${i}`}>
                        <TableCell className="whitespace-normal pl-6">
                          {e.label}
                          {e.figure.basis ? <span className="block text-small text-text-muted">{e.figure.basis}</span> : null}
                        </TableCell>
                        <TableCell className="text-right tabular whitespace-normal">
                          {e.valueMax !== undefined ? `${fmt(e.figure.value ?? 0)}–${fmt(e.valueMax)}` : fmt(e.figure.value ?? 0)} {e.unit}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={tm('CONFIDENCE_LABELS')[e.figure.confidence]} label={tm('CONFIDENCE_LABELS')[e.figure.confidence]} />
                        </TableCell>
                        <TableCell>{e.figure.asOf ?? src.date}</TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </section>
  );
}

/** SPEC.md § 6.10 – two tables generated from the pack's sources and every figure referencing a source or basis. */
export function SourcesPage() {
  const pack = useStore((s) => s.pack);
  const location = useLocation();
  const entries = useMemo(() => collectFigures(pack), [pack]);
  const homeFigures = useMemo(() => HOME_PACK_IDS.flatMap((id) => collectHomeFigures(withHomePack(pack, id))), [pack]);
  const verified = entries.filter((e) => e.figure.confidence === 'verified' || e.figure.confidence === 'reported');
  const estimates = entries.filter((e) => e.figure.confidence === 'estimate');
  const illustrative = entries.filter((e) => e.figure.confidence === 'illustrative');
  const sections = [...new Set(entries.map((e) => e.section))];

  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('bg-orange-light');
      const t = window.setTimeout(() => el.classList.remove('bg-orange-light'), 1500);
      return () => window.clearTimeout(t);
    }
  }, [location.hash, entries, homeFigures]);

  const grouped = (list: FigureEntry[]) =>
    sections.map((section) => ({ section, rows: list.filter((e) => e.section === section) })).filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <PageTitle title={t('SOURCES.title')} />
        <p className="max-w-[900px]">{t('SOURCES.intro')}</p>
      </div>

      <section>
        <SectionHeading>{t('SOURCES.verifiedTable')}</SectionHeading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('SOURCES.columns.figure')}</TableHead>
              <TableHead className="text-right">{t('SOURCES.columns.value')}</TableHead>
              <TableHead>{t('SOURCES.columns.confidence')}</TableHead>
              <TableHead>{t('SOURCES.columns.date')}</TableHead>
              <TableHead>{t('SOURCES.columns.link')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody lang="sv">
            {pack.sources.map((src) => {
              const rows = verified.filter((e) => e.figure.source === src.key);
              return (
                <Fragment key={src.key}>
                  <TableRow id={src.key} className="scroll-mt-4 bg-bg-muted hover:bg-bg-muted">
                    <TableCell colSpan={3} className="whitespace-normal font-medium">
                      {src.key}: {src.name}
                    </TableCell>
                    <TableCell className="whitespace-normal">{src.date}</TableCell>
                    <TableCell>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noreferrer" className="text-primary-text hover:text-primary-hover hover:underline">
                          {t('SOURCES.open')}
                        </a>
                      ) : (
                        <span className="text-text-muted">{t('SOURCES.noLink')}</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="whitespace-normal text-text-secondary">
                        {t('SOURCES.noFigures')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((e, i) => (
                      <TableRow key={`${src.key}-${i}`}>
                        <TableCell className="whitespace-normal pl-6">
                          {e.label}
                          {e.figure.basis ? <span className="block text-small text-text-muted">{e.figure.basis}</span> : null}
                        </TableCell>
                        <TableCell className="text-right tabular whitespace-normal">{valueText(e)}</TableCell>
                        <TableCell>
                          <StatusChip status={tm('CONFIDENCE_LABELS')[e.figure.confidence]} label={tm('CONFIDENCE_LABELS')[e.figure.confidence]} />
                        </TableCell>
                        <TableCell>{e.figure.asOf ?? src.date}</TableCell>
                        <TableCell />
                      </TableRow>
                    ))
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section>
        <SectionHeading>{t('SOURCES.estimatesTable')}</SectionHeading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('SOURCES.columns.figure')}</TableHead>
              <TableHead className="text-right">{t('SOURCES.columns.value')}</TableHead>
              <TableHead>{t('SOURCES.columns.confidence')}</TableHead>
              <TableHead>{t('SOURCES.columns.basis')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody lang="sv">
            {[
              { id: SOURCE_ANCHORS.estimate, label: t('CONFIDENCE_LABELS.estimate'), groups: grouped(estimates) },
              { id: SOURCE_ANCHORS.illustrative, label: t('CONFIDENCE_LABELS.illustrative'), groups: grouped(illustrative) },
            ].map((block) => (
              <Fragment key={block.id}>
                <TableRow id={block.id} className="scroll-mt-4 bg-bg-muted hover:bg-bg-muted">
                  <TableCell colSpan={4} className="font-medium">
                    {block.label}
                  </TableCell>
                </TableRow>
                {block.groups.map((g) => (
                  <Fragment key={`${block.id}-${g.section}`}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="pl-6 text-small text-text-secondary">
                        {g.section}
                      </TableCell>
                    </TableRow>
                    {g.rows.map((e, i) => (
                      <TableRow key={`${g.section}-${i}`}>
                        <TableCell className="whitespace-normal pl-6">{e.label}</TableCell>
                        <TableCell className="text-right tabular whitespace-normal">{valueText(e)}</TableCell>
                        <TableCell>
                          <StatusChip status={tm('CONFIDENCE_LABELS')[e.figure.confidence]} label={tm('CONFIDENCE_LABELS')[e.figure.confidence]} />
                        </TableCell>
                        <TableCell className="whitespace-normal text-text-secondary">
                          {e.figure.basis ?? ''}
                          {e.figure.source ? ` (${e.figure.source})` : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </section>

      {HOME_PACK_IDS.map((id) => (
        <HomeSources key={id} id={id} />
      ))}
    </div>
  );
}
