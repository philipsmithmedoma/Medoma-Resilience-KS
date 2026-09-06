import type { Patient } from '@/data/types';
import { useStore } from '@/data/store';
import { NodeMap } from '@/components/NodeMap';

/** SPEC.md § 6.3 right pane – all nodes; the selected patient's destination highlighted and joined to Vikby. */
export function EvacuationMap({ selected }: { selected: Patient | null }) {
  const nodes = useStore((s) => s.nodes);
  const destinationId = selected?.move?.destinationId;
  return <NodeMap nodes={nodes} selectedId={destinationId} lineFrom={destinationId ? 'vikby' : undefined} className="h-full" />;
}
