import type { CareNode, NodeId } from '@/data/types';
import { REGION_ID, REGION_NAME } from '@/data/vocab';

export function scopeName(scope: NodeId, nodes: CareNode[]): string {
  if (scope === REGION_ID) return REGION_NAME;
  return nodes.find((n) => n.id === scope)?.name ?? REGION_NAME;
}

export function isRegion(scope: NodeId): boolean {
  return scope === REGION_ID;
}
