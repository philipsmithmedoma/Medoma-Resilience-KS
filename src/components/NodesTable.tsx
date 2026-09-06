import { useNavigate } from 'react-router-dom';
import type { CareNode } from '@/data/types';
import { CC, LABELS } from '@/data/vocab';
import { displaySyncState, viewFigure, type OutageView } from '@/lib/figure';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusChip } from './Chip';
import { TimeStamp } from './FigureLines';
import { isStale } from '@/lib/time';

interface NodesTableProps {
  nodes: CareNode[];
  clock: number;
  outage: OutageView;
  extended?: boolean; // adds Lead and Place (Network page)
}

/** Region nodes table – SPEC.md § 6.1 (region scope) and § 6.5. Row click → /network/:nodeId. */
export function NodesTable({ nodes, clock, outage, extended = false }: NodesTableProps) {
  const navigate = useNavigate();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{CC.columns.node}</TableHead>
          <TableHead>{CC.columns.type}</TableHead>
          <TableHead>{CC.columns.status}</TableHead>
          <TableHead className="text-right">{CC.columns.acuteBeds}</TableHead>
          <TableHead className="text-right">{CC.columns.intensiveCare}</TableHead>
          <TableHead className="text-right">{CC.columns.staff}</TableHead>
          <TableHead>{CC.columns.sync}</TableHead>
          <TableHead>{CC.columns.sharing}</TableHead>
          {extended ? (
            <>
              <TableHead>{CC.columns.lead}</TableHead>
              <TableHead>{CC.columns.place}</TableHead>
            </>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((n) => {
          const beds = n.acuteBeds ?? n.homeCarePlaces;
          const free = beds ? viewFigure(beds.free, outage) : undefined;
          const icu = n.intensiveCare ? viewFigure(n.intensiveCare.free, outage) : undefined;
          const staff = viewFigure(n.staffOnDuty, outage);
          const shared = n.sharing !== 'None';
          const sync = displaySyncState(n, clock);
          return (
            <TableRow
              key={n.id}
              tabIndex={0}
              role="link"
              aria-label={`Open ${n.name}`}
              className="cursor-pointer"
              onClick={() => navigate(`/network/${n.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/network/${n.id}`);
                }
              }}
            >
              <TableCell className="font-medium">{n.name}</TableCell>
              <TableCell>{n.type}</TableCell>
              <TableCell>
                <StatusChip status={n.status} />
              </TableCell>
              <TableCell className="text-right tabular">
                {beds && free && shared ? `${free.value} / ${beds.total}` : LABELS.notShared}
                {n.homeCarePlaces ? <span className="ml-1 text-small text-text-muted">places</span> : null}
              </TableCell>
              <TableCell className="text-right tabular">{n.intensiveCare && icu && shared ? `${icu.value} / ${n.intensiveCare.usable}` : LABELS.none}</TableCell>
              <TableCell className="text-right tabular">{n.sharing === 'Full' ? staff.value : <StatusChip status={LABELS.notShared} />}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <StatusChip status={sync} />
                  <TimeStamp time={n.lastSync} stale={isStale(clock, n.lastSync)} />
                </span>
              </TableCell>
              <TableCell>{n.sharing}</TableCell>
              {extended ? (
                <>
                  <TableCell>{n.lead}</TableCell>
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
