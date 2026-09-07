import { useNavigate } from 'react-router-dom';
import type { CareNode } from '@/data/types';
import { LABELS, NET, NODE_STATUS_LABELS, NODE_TYPE_LABELS, SHARING_LABELS, SYNC_LABELS } from '@/data/vocab';
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
          <TableHead>{NET.columns.node}</TableHead>
          <TableHead>{NET.columns.type}</TableHead>
          <TableHead>{NET.columns.status}</TableHead>
          <TableHead className="text-right">{NET.columns.capacity}</TableHead>
          <TableHead className="text-right">{NET.columns.free}</TableHead>
          <TableHead className="text-right">{NET.columns.iva}</TableHead>
          <TableHead>{NET.columns.sharing}</TableHead>
          <TableHead>{NET.columns.sync}</TableHead>
          <TableHead>{NET.columns.source}</TableHead>
          {extended ? (
            <>
              <TableHead>{NET.columns.lead}</TableHead>
              <TableHead>{NET.columns.place}</TableHead>
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
              aria-label={LABELS.ariaOpen(n.name)}
              className="cursor-pointer"
              onClick={() => navigate(`/natverk/${n.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/natverk/${n.id}`);
                }
              }}
            >
              <TableCell className="font-medium">{n.name}</TableCell>
              <TableCell>{NODE_TYPE_LABELS[n.type]}</TableCell>
              <TableCell>
                <StatusChip status={n.status} label={NODE_STATUS_LABELS[n.status]} />
              </TableCell>
              <TableCell className="text-right tabular">{total ? fmt(total.value) : '–'}</TableCell>
              <TableCell className="text-right tabular">{free && shared ? fmt(free.value) : free ? LABELS.notShared : '–'}</TableCell>
              <TableCell className="text-right tabular">
                {icuTotal ? (icu && icu.value !== null && shared ? `${fmt(icu.value)} / ${fmt(icuTotal.value)}` : icuTotal.value === null ? LABELS.unknown : `– / ${fmt(icuTotal.value)}`) : '–'}
              </TableCell>
              <TableCell>{SHARING_LABELS[n.sharing]}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <StatusChip status={sync} label={SYNC_LABELS[sync]} />
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
