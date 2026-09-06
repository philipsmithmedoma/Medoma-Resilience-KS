import type { Bottleneck, Capability, CareNode } from '@/data/types';
import { CC } from '@/data/vocab';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface BottleneckTableProps {
  bottlenecks: Bottleneck[];
  capabilities: Capability[];
  nodes: CareNode[];
  showNode?: boolean;
  onSelectCapability?: (capabilityId: string) => void;
}

/** SPEC.md § 6.1.2 – ranked bottlenecks; a row click selects the matching capability when one exists. */
export function BottleneckTable({ bottlenecks, capabilities, nodes, showNode = false, onSelectCapability }: BottleneckTableProps) {
  const capabilityFor = (b: Bottleneck) => capabilities.find((c) => c.nodeId === b.nodeId && c.name === b.capacity);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{CC.columns.rank}</TableHead>
          {showNode ? <TableHead>{CC.columns.node}</TableHead> : null}
          <TableHead>{CC.columns.capacity}</TableHead>
          <TableHead>{CC.columns.limitingResource}</TableHead>
          <TableHead>{CC.columns.impact}</TableHead>
          <TableHead>{CC.columns.wouldUnlock}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bottlenecks.map((b) => {
          const cap = capabilityFor(b);
          const clickable = Boolean(cap && onSelectCapability);
          const select = () => cap && onSelectCapability?.(cap.id);
          return (
            <TableRow
              key={`${b.nodeId}-${b.rank}`}
              className={cn(clickable && 'cursor-pointer')}
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? 'button' : undefined}
              aria-label={clickable ? `Show ${b.capacity}` : undefined}
              onClick={clickable ? select : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        select();
                      }
                    }
                  : undefined
              }
            >
              <TableCell className="tabular">{b.rank}</TableCell>
              {showNode ? <TableCell>{nodes.find((n) => n.id === b.nodeId)?.name ?? b.nodeId}</TableCell> : null}
              <TableCell className={cn(clickable && 'text-primary')}>{b.capacity}</TableCell>
              <TableCell className="whitespace-normal">{b.limitingResource}</TableCell>
              <TableCell className="whitespace-normal">{b.impact}</TableCell>
              <TableCell className="whitespace-normal">{b.wouldUnlock}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
