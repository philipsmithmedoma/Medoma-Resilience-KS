import { Link } from 'react-router-dom';
import type { Figure, FlowBlock, SiteId } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { aggregateFigure, blockStatus, formatRowValue, FLOW_ROWS, rowLabel, sumMetric, type FlowRow, type SiteValues } from '@/lib/flow';
import { fmt } from '@/lib/format';
import { weakest } from '@/lib/figure';
import { StatusChip } from '@/components/Chip';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSiteValues } from './useSiteValues';

const BLOCKS: FlowBlock[] = ['akuten', 'vardplatser', 'operation', 'bild', 'iva', 'bemanning'];

const UNLOCK_ROUTES: Record<NonNullable<FlowRow['unlock']>, string | null> = {
  placement: '/laget-nu/placering',
  discharge: '/laget-nu/utskrivningsklara',
  surgery: '/kapacitet?kapacitet=surgery',
  ct: '/kapacitet?kapacitet=ct',
  intensive: '/kapacitet?kapacitet=intensive',
  staffing: null,
};

function cellText(row: FlowRow, figures: Record<string, Figure> | undefined): string {
  if (!figures) return '–';
  if (row.composite) {
    const parts = row.composite.map((k) => figures[k]?.value ?? null);
    if (row.key === 'ct.down') return t('FLOW.ctDown', { down: fmt(parts[0]), total: fmt(parts[1]) });
    return parts.map((p) => fmt(p)).join(' / ');
  }
  const f = figures[row.key];
  return f ? formatRowValue(row.format, f.value) : '–';
}

function sumText(row: FlowRow, sites: SiteValues[]): string {
  if (row.composite) {
    if (row.aggregate === 'none') return '–';
    const parts = row.composite.map((k) => sumMetric(k, sites));
    if (row.key === 'ct.down') return t('FLOW.ctDown', { down: fmt(parts[0]), total: fmt(parts[1]) });
    return parts.map((p) => fmt(p)).join(' / ');
  }
  const agg = aggregateFigure(row, sites);
  return agg ? formatRowValue(row.format, agg.value) : '–';
}

function rowFigure(row: FlowRow, sites: SiteValues[]): Figure | undefined {
  const parts = sites.map((s) => s.figures[row.composite?.[0] ?? row.key]).filter(Boolean) as Figure[];
  if (parts.length === 0) return undefined;
  return { ...parts[0], confidence: weakest(...parts.map((p) => p.confidence)) };
}

/** DESIGN-KS.md § 6 – six stacked blocks with status chip, metric rows per site and sum, "Vad frigör" link. */
export function OverviewTab({ sites }: { sites: SiteId[] }) {
  const values = useSiteValues(sites);
  const multi = sites.length > 1;

  return (
    <div className="space-y-8">
      {BLOCKS.map((block) => {
        const status = blockStatus(block, values);
        const rows = FLOW_ROWS[block];
        const unlockRow = rows.find((r) => r.unlock);
        const unlock = unlockRow?.unlock;
        return (
          <section key={block} aria-label={tm('FLOW_BLOCK_LABELS')[block]}>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-heading">{tm('FLOW_BLOCK_LABELS')[block]}</h2>
              <StatusChip status={status} label={tm('FLOW_STATUS_LABELS')[status]} />
              <span className="ml-auto">{unlock ? <UnlockLink unlock={unlock} values={values} /> : null}</span>
            </div>
            <table className="w-full text-body">
              <thead>
                <tr className="text-small text-text-secondary">
                  <th className="h-8 text-left font-normal">{t('FLOW.columns.metric')}</th>
                  {multi ? (
                    <>
                      <th className="h-8 w-40 text-right font-normal">{t('SITE_LABELS.solna')}</th>
                      <th className="h-8 w-40 text-right font-normal">{t('SITE_LABELS.huddinge')}</th>
                      <th className="h-8 w-40 text-right font-normal">{t('FLOW.columns.sum')}</th>
                    </>
                  ) : (
                    <th className="h-8 w-40 text-right font-normal">{tm('SITE_LABELS')[sites[0]]}</th>
                  )}
                  <th className="h-8 w-32 text-left font-normal" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const figure = rowFigure(row, values);
                  const qualifier = row.qualifierKey
                    ? multi
                      ? `${t('FLOW.blocksQualifier.ofWhich')} ${fmt(sumMetric(row.qualifierKey, values))} ${t('FLOW.blocksQualifier.asih')}`
                      : `${t('FLOW.blocksQualifier.ofWhich')} ${fmt(values[0]?.figures[row.qualifierKey]?.value ?? null)} ${t('FLOW.blocksQualifier.asih')}`
                    : row.aggregate === 'none' && multi
                      ? t('FLOW.perSiteOnly')
                      : undefined;
                  return (
                    <tr key={row.key} className="h-12 border-t border-border">
                      <td className="pr-4 text-text-secondary">
                        {rowLabel(row)}
                        {qualifier ? <span className="ml-2 text-small text-text-muted">{qualifier}</span> : null}
                      </td>
                      {values.map((v) => (
                        <td key={v.site} className="text-right text-[20px] leading-7 font-semibold tabular">
                          {cellText(row, v.figures)}
                        </td>
                      ))}
                      {multi ? <td className="text-right text-[20px] leading-7 font-semibold tabular">{sumText(row, values)}</td> : null}
                      <td className="pl-4">{figure ? <ConfidenceChip figure={figure} showSource /> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function UnlockLink({ unlock, values }: { unlock: NonNullable<FlowRow['unlock']>; values: SiteValues[] }) {
  const route = UNLOCK_ROUTES[unlock];
  if (route) {
    return (
      <Link to={route} className="text-primary-text hover:text-primary-hover hover:underline">
        {t('FLOW.whatFrees')}
      </Link>
    );
  }
  const vacant = fmt(sumMetric('staff.vacant', values));
  const agency = fmt(sumMetric('staff.agency', values));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="text-primary-text hover:text-primary-hover hover:underline">
          {t('FLOW.whatFrees')}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 text-body">
        <h3 className="mb-1 font-medium">{t('FLOW.staffingTitle')}</h3>
        <p>{t('FLOW.staffingPopover', { vacant, agency })}</p>
      </PopoverContent>
    </Popover>
  );
}
