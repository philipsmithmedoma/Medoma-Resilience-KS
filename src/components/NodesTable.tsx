import { useNavigate } from 'react-router-dom';
import type { CareNode } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { nodeLabel } from '@/lib/scope';
import { displaySyncState, viewFigure, type OutageView } from '@/lib/figure';
import { fmt } from '@/lib/format';
import { isStale } from '@/lib/time';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusChip } from './Chip';
import { ConfidenceChip } from './ConfidenceChip';
import { TimeStamp } from './FigureLines';

interface NodesTableProps {
  nodes: CareNode[];
  clock: number;
  outage: OutageView;
  extended?: boolean; // adds Ansvarig and Plats (Nätverk page)
}

/** Nodes table – SPEC.md § 6.9: Nod, Typ, Status, Disponibla/kapacitet, Lediga, IVA, Delning, Synk, Källa. */
export function NodesTable({ nodes, clock, outage, extended = false }: NodesTableProps) {
  const navigate = useNavigate();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('NET.columns.node')}</TableHead>
          <TableHead>{t('NET.columns.type')}</TableHead>
          <TableHead>{t('NET.columns.status')}</TableHead>
          <TableHead className="text-right">{t('NET.columns.capacity')}</TableHead>
          <TableHead className="text-right">{t('NET.columns.free')}</TableHead>
          <TableHead className="text-right">{t('NET.columns.iva')}</TableHead>
          <TableHead>{t('NET.columns.sharing')}</TableHead>
          <TableHead>{t('NET.columns.sync')}</TableHead>
          <TableHead>{t('NET.columns.source')}</TableHead>
          {extended ? (
            <>
              <TableHead>{t('NET.columns.lead')}</TableHead>
              <TableHead>{t('NET.columns.place')}</TableHead>
            </>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((n) => {
          const total = n.beds ? viewFigure(n.beds.total, outage) : undefined;
          const free = n.beds ? viewFigure(n.beds.free, outage) : undefined;
          const icu = n.intensiveCare ? viewFigure(n.intensiveCare.free, outage) : undefined;
          const icuTotal = n.intensiveCare ? n.intensiveCare.total : undefined;
          const shared = n.sharing !== 'None';
          const sync = displaySyncState(n, clock);
          const sourceFigure = free ?? total;
          return (
            <TableRow
              key={n.id}
              tabIndex={0}
              role="link"
              aria-label={t('LABELS.ariaOpen', { name: nodeLabel(n) })}
              className="cursor-pointer"
              onClick={() => navigate(`/natverk/${n.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/natverk/${n.id}`);
                }
              }}
            >
              <TableCell className="font-medium">{nodeLabel(n)}</TableCell>
              <TableCell>{tm('NODE_TYPE_LABELS')[n.type]}</TableCell>
              <TableCell>
                <StatusChip status={n.status} label={tm('NODE_STATUS_LABELS')[n.status]} />
              </TableCell>
              <TableCell className="text-right tabular">{total ? fmt(total.value) : '–'}</TableCell>
              <TableCell className="text-right tabular">{free && shared ? fmt(free.value) : free ? t('LABELS.notShared') : '–'}</TableCell>
              <TableCell className="text-right tabular">
                {icuTotal ? (icu && icu.value !== null && shared ? `${fmt(icu.value)} / ${fmt(icuTotal.value)}` : icuTotal.value === null ? t('LABELS.unknown') : `– / ${fmt(icuTotal.value)}`) : '–'}
              </TableCell>
              <TableCell>{tm('SHARING_LABELS')[n.sharing]}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <StatusChip status={sync} label={tm('SYNC_LABELS')[sync]} />
                  <TimeStamp time={n.lastSync} stale={isStale(clock, n.lastSync)} />
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                {sourceFigure ? <ConfidenceChip figure={sourceFigure} showSource /> : '–'}
              </TableCell>
              {extended ? (
                <>
                  <TableCell>{n.lead || '–'}</TableCell>
                  <TableCell>{n.place}</TableCell>
                </>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
