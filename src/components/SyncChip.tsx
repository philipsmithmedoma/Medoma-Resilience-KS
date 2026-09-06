import type { CareNode } from '@/data/types';
import { LABELS } from '@/data/vocab';
import { displaySyncState, type OutageView } from '@/lib/figure';
import { Chip, StatusChip } from './Chip';

interface SyncChipProps {
  node: Pick<CareNode, 'id' | 'sync' | 'lastSync'>;
  clock: number;
  outage: OutageView;
  /** Whether the EHR outage applies to this node (Vikby sjukhus and the region). */
  ehrScope?: boolean;
}

/**
 * SPEC.md § 6.1 sync chip: "Synced 14:37" (green), "Delayed" (warning) when the last sync is
 * older than 30 minutes, "EHR offline, operating on mirror since HH:MM" (red) during the outage.
 */
export function SyncChip({ node, clock, outage, ehrScope = false }: SyncChipProps) {
  if (ehrScope && outage.ehrOutage) {
    return <Chip tone="red">{LABELS.ehrOffline(outage.ehrOutageSince ?? '')}</Chip>;
  }
  const state = displaySyncState(node, clock);
  if (state === 'Delayed') {
    return (
      <span className="flex items-center gap-2">
        <StatusChip status="Delayed" />
        <span className="text-small text-text-muted">Last sync {node.lastSync}</span>
      </span>
    );
  }
  return <StatusChip status={state}>{`${state} ${node.lastSync}`}</StatusChip>;
}
