import type { CareNode } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { displaySyncState, type OutageView } from '@/lib/figure';
import { Chip, StatusChip } from './Chip';

interface SyncChipProps {
  node: Pick<CareNode, 'id' | 'sync' | 'lastSync'>;
  clock: number;
  outage: OutageView;
  /** Whether the EHR outage applies to this node (Karolinska sites and the region). */
  ehrScope?: boolean;
}

/**
 * Sync chip: "Synkad 14:37" (green), "Fördröjd" (warning) when the last sync is older than 30 minutes,
 * "Journalsystem frånkopplat, spegel sedan HH:MM" (red) during the outage.
 */
export function SyncChip({ node, clock, outage, ehrScope = false }: SyncChipProps) {
  if (ehrScope && outage.ehrOutage) {
    return <Chip tone="red">{t('LABELS.ehrOffline', { since: outage.ehrOutageSince ?? '' })}</Chip>;
  }
  const state = displaySyncState(node, clock);
  if (state === 'Delayed') {
    return (
      <span className="flex items-center gap-2">
        <StatusChip status="Delayed" label={t('SYNC_LABELS.Delayed')} />
        <span className="text-small text-text-muted">Senaste synk {node.lastSync}</span>
      </span>
    );
  }
  return <StatusChip status={state} label={`${tm('SYNC_LABELS')[state]} ${node.lastSync}`} />;
}
