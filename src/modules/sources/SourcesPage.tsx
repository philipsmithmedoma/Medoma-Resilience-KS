import { Fragment, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/data/store';
import { CONFIDENCE_LABELS, LABELS, SOURCES } from '@/data/vocab';
import { fmt, fmtDec } from '@/lib/format';
import { collectFigures, type FigureEntry } from '@/lib/sources';
import { PageTitle, SectionHeading } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function valueText(e: FigureEntry): string {
  if (e.text) return e.text;
  if (e.figure.value === null) return LABELS.unknown;
  return Number.isInteger(e.figure.value) ? fmt(e.figure.value) : fmtDec(e.figure.value);
}

/** SPEC.md § 6.10 – two tables generated from the pack's sources and every figure referencing a source or basis. */
export function SourcesPage() {
  const pack = useStore((s) => s.pack);
  const location = useLocation();
  const entries = useMemo(() => collectFigures(pack), [pack]);
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
  }, [location.hash, entries]);

  const grouped = (list: FigureEntry[]) =>
    sections.map((section) => ({ section, rows: list.filter((e) => e.section === section) })).filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <PageTitle title={SOURCES.title} />
        <p className="max-w-[900px]">{SOURCES.intro}</p>
      </div>

      <section>
        <SectionHeading>{SOURCES.verifiedTable}</SectionHeading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{SOURCES.columns.figure}</TableHead>
              <TableHead className="text-right">{SOURCES.columns.value}</TableHead>
              <TableHead>{SOURCES.columns.confidence}</TableHead>
              <TableHead>{SOURCES.columns.date}</TableHead>
              <TableHead>{SOURCES.columns.link}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                          {SOURCES.open}
                        </a>
                      ) : (
                        <span className="text-text-muted">{SOURCES.noLink}</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="whitespace-normal text-text-secondary">
                        {SOURCES.noFigures}
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
                          <StatusChip status={CONFIDENCE_LABELS[e.figure.confidence]} label={CONFIDENCE_LABELS[e.figure.confidence]} />
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
        <SectionHeading>{SOURCES.estimatesTable}</SectionHeading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{SOURCES.columns.figure}</TableHead>
              <TableHead className="text-right">{SOURCES.columns.value}</TableHead>
              <TableHead>{SOURCES.columns.confidence}</TableHead>
              <TableHead>{SOURCES.columns.basis}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { id: SOURCES.anchors.estimate, label: CONFIDENCE_LABELS.estimate, groups: grouped(estimates) },
              { id: SOURCES.anchors.illustrative, label: CONFIDENCE_LABELS.illustrative, groups: grouped(illustrative) },
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
                          <StatusChip status={CONFIDENCE_LABELS[e.figure.confidence]} label={CONFIDENCE_LABELS[e.figure.confidence]} />
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
    </div>
  );
}
