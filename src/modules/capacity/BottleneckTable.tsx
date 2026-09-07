import type { Bottleneck, Capability, CareNode } from '@/data/types';
import { t } from '@/lib/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface BottleneckTableProps {
  bottlenecks: Bottleneck[];
  capabilities: Capability[];
  nodes: CareNode[];
  showNode?: boolean;
  onSelectCapability?: (capabilityId: string) => void;
}

/** Ranked bottlenecks; a row click selects the matching capability when one exists. */
export function BottleneckTable({ bottlenecks, capabilities, nodes, showNode = false, onSelectCapability }: BottleneckTableProps) {
  const capabilityFor = (b: Bottleneck) => capabilities.find((c) => c.nodeId === b.nodeId && c.kind === b.capabilityKind);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{t('CAP.columns.rank')}</TableHead>
          {showNode ? <TableHead>{t('CAP.columns.node')}</TableHead> : null}
          <TableHead>{t('CAP.columns.capacity')}</TableHead>
          <TableHead>{t('CAP.columns.limitingResource')}</TableHead>
          <TableHead>{t('CAP.columns.impact')}</TableHead>
          <TableHead>{t('CAP.columns.wouldUnlock')}</TableHead>
        </TableRow>
      </TableHeader>
      {/* Bottleneck narratives are pack data and stay Swedish in both languages (DESIGN-LANG.md § 3). */}
      <TableBody lang="sv">
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
              aria-label={clickable ? t('LABELS.ariaExpand', { name: b.capacity }) : undefined}
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
              <TableCell className={cn(clickable && 'text-primary-text')}>{b.capacity}</TableCell>
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
