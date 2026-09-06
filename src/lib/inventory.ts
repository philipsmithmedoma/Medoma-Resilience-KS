// Inventory status and sums – SPEC.md § 3 (Resource comment) and § 6.4.2.
import type { Resource } from '@/data/types';
import { INVENTORY_STATUS_OUT_OF_SERVICE, type SupplyStatus } from '@/data/vocab';

/** Supply status: Critical if available < criticalBelow, Low if available < lowBelow, else Ok. */
export function supplyStatus(r: Pick<Resource, 'available' | 'criticalBelow' | 'lowBelow'>): SupplyStatus {
  if (r.criticalBelow !== undefined && r.available < r.criticalBelow) return 'Critical';
  if (r.lowBelow !== undefined && r.available < r.lowBelow) return 'Low';
  return 'Ok';
}

/** Status chip label for the inventory table. */
export function inventoryStatus(r: Resource): string {
  if (r.category === 'Supply') return supplyStatus(r);
  return r.outOfService > 0 ? INVENTORY_STATUS_OUT_OF_SERVICE : 'Ok';
}

export const NUMERIC_COLUMNS = ['total', 'available', 'inUse', 'reserved', 'outOfService', 'inTransit', 'unknown'] as const;
export type NumericColumn = (typeof NUMERIC_COLUMNS)[number];

export function sumColumns(rows: Resource[]): Record<NumericColumn, number> {
  const sums = Object.fromEntries(NUMERIC_COLUMNS.map((c) => [c, 0])) as Record<NumericColumn, number>;
  for (const r of rows) for (const c of NUMERIC_COLUMNS) sums[c] += r[c];
  return sums;
}

/** Distinct resource names across all nodes, alphabetically. */
export function distinctResourceNames(resources: Resource[]): string[] {
  return [...new Set(resources.map((r) => r.name))].sort((a, b) => a.localeCompare(b, 'sv'));
}
