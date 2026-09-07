import type { Patient, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { NodeMap } from '@/components/NodeMap';

/** Right pane – all nodes with the ASIH circle; the selected patient's destination highlighted and joined to the source site. */
export function EvacuationMap({ selected, site }: { selected: Patient | null; site: SiteId }) {
  const nodes = useStore((s) => s.nodes);
  const destinationId = selected?.move?.destinationId;
  return <NodeMap nodes={nodes} selectedId={destinationId} lineFrom={destinationId ? site : undefined} className="h-full" />;
}
