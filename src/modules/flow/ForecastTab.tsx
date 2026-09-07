import type { Figure, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { t, tm } from '@/lib/i18n';
import { forecast, type ForecastResult } from '@/lib/forecast';
import { fmt, fmtDec } from '@/lib/format';
import { StatusChip } from '@/components/Chip';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ForecastChart } from './ForecastChart';

const FORECAST_FIGURE: Figure = { value: null, confidence: 'illustrative', basis: 'prognos ur illustrativa ankomstprofiler (DATA.md § 5.4)' };

/** SPEC.md § 6.3 – Inflödesprognos per site: bar timeline, horizon table and the deficit sentence. */
export function ForecastTab({ sites }: { sites: SiteId[] }) {
  const profiles = useStore((s) => s.pack.forecastProfiles);
  const nodes = useStore((s) => s.nodes);
  const scenario = useStore((s) => s.scenario);
  const clock = useStore((s) => s.clock);

  return (
    <div className="space-y-10">
      <p className="text-small text-text-muted">{t('FLOW.forecast.basis')}</p>
      {sites.map((site) => {
        const profile = profiles.find((p) => p.site === site)!;
        const free = nodes.find((n) => n.id === site)?.beds?.free.value ?? 0;
        const pressure = scenario?.key === 'tryck' && scenario.params.site === site;
        const factor = pressure ? Number(scenario!.params.faktor) : 1;
        const hours = pressure ? Number(scenario!.params.timmar) : 0;
        const result: ForecastResult = forecast(profile, free, { multiplier: factor, multiplierHours: hours });
        const rows = [
          { label: t('FLOW.forecast.horizons.h4'), free: result.freeAt.h4 },
          { label: t('FLOW.forecast.horizons.h12'), free: result.freeAt.h12 },
          { label: t('FLOW.forecast.horizons.h24'), free: result.freeAt.h24 },
        ];
        return (
          <section key={site} aria-label={`${t('FLOW.forecast.title')} ${tm('SITE_LABELS')[site]}`}>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-heading">{t('FLOW.forecast.heading', { site: tm('SITE_LABELS')[site] })}</h2>
              <ConfidenceChip figure={FORECAST_FIGURE} />
              {pressure ? <StatusChip status="Ansträngt" label={t('FLOW.forecast.multiplier', { factor: fmtDec(factor), hours: fmt(hours) })} /> : null}
            </div>
            <ForecastChart result={result} clock={clock} />
            <div className="mt-4 grid grid-cols-[360px_minmax(0,1fr)] items-start gap-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('FLOW.forecast.columns.horizon')}</TableHead>
                    <TableHead className="text-right">{t('FLOW.forecast.columns.free')}</TableHead>
                    <TableHead>{t('FLOW.forecast.columns.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className={`text-right tabular ${r.free < 0 ? 'text-red' : ''}`}>{fmt(r.free)}</TableCell>
                      <TableCell>{r.free < 0 ? <StatusChip status="Brist" label={t('FLOW.forecast.shortage')} /> : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-body">{result.deficit ? t('FLOW.forecast.deficit', { n: fmt(result.deficit.beds), time: result.deficit.at, site: tm('SITE_LABELS')[site] }) : t('FLOW.forecast.noDeficit')}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
