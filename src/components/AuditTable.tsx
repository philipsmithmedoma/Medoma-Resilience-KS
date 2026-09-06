import type { AuditEntry } from '@/data/types';
import { AUDIT_COLUMNS } from '@/data/vocab';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditTableProps {
  entries: AuditEntry[];
  limit?: number;
}

/** SPEC.md § 7.3 – Time, Actor, Action, Object, Detail; newest first; most recent 200. */
export function AuditTable({ entries, limit = 200 }: AuditTableProps) {
  const rows = [...entries].reverse().slice(0, limit);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{AUDIT_COLUMNS.time}</TableHead>
          <TableHead className="w-32">{AUDIT_COLUMNS.actor}</TableHead>
          <TableHead>{AUDIT_COLUMNS.action}</TableHead>
          <TableHead>{AUDIT_COLUMNS.object}</TableHead>
          <TableHead>{AUDIT_COLUMNS.detail}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="tabular">{e.at}</TableCell>
            <TableCell>{e.actor}</TableCell>
            <TableCell>{e.action}</TableCell>
            <TableCell>{e.object}</TableCell>
            <TableCell className="text-text-secondary">{e.detail ?? ''}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
