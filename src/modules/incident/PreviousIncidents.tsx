import { useState } from 'react';
import type { ClosedIncident } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT, LABELS } from '@/data/vocab';
import { taskCounts } from '@/lib/incident';
import { SectionHeading } from '@/components/PageTitle';
import { LogDrawer } from '@/components/LogDrawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** Tidigare incidenter – closed incidents this session; hidden when empty. */
export function PreviousIncidents() {
  const closed = useStore((s) => s.closedIncidents);
  const [showing, setShowing] = useState<ClosedIncident | null>(null);
  if (closed.length === 0) return null;
  return (
    <section>
      <SectionHeading>{INCIDENT.previous}</SectionHeading>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{INCIDENT.columns.name}</TableHead>
            <TableHead>{INCIDENT.columns.lage}</TableHead>
            <TableHead>{INCIDENT.columns.activated}</TableHead>
            <TableHead>{INCIDENT.columns.closed}</TableHead>
            <TableHead>{INCIDENT.columns.tasksDone}</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {closed.map((c, i) => {
            const counts = taskCounts(c.incident.tasks);
            return (
              <TableRow key={`${c.incident.activatedAt}-${i}`}>
                <TableCell className="font-medium">{c.incident.name}</TableCell>
                <TableCell>{c.incident.lage}</TableCell>
                <TableCell className="tabular">{c.incident.activatedAt}</TableCell>
                <TableCell className="tabular">{c.closedAt}</TableCell>
                <TableCell className="tabular">
                  {counts.done} / {counts.total}
                </TableCell>
                <TableCell className="text-right">
                  <button type="button" className="text-primary-text hover:text-primary-hover hover:underline" onClick={() => setShowing(c)}>
                    {LABELS.showLog}
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <LogDrawer open={showing !== null} onOpenChange={(open) => !open && setShowing(null)} entries={showing?.log ?? []} title={showing ? `${LABELS.auditLog}: ${showing.incident.name}` : LABELS.auditLog} />
    </section>
  );
}
