// Capacity maths – SPEC.md § 3 (Capability comment) and § 6.1.3.
import type { Capability, Component } from '@/data/types';

export interface CapacityResult {
  capacity: number;
  unit: string;
  components: Component[];
  limiting: Component[];
  next?: Component;
  gap?: number;
}

/** Apply what-if overrides (component name → available) without touching the source capability. */
export function applyOverrides(capability: Capability, overrides?: Record<string, number>): Component[] {
  return capability.components.map((c) => {
    const o = overrides?.[c.name];
    if (o === undefined) return c;
    return { ...c, available: Math.max(0, Math.min(c.total, o)) };
  });
}

export function computeCapacity(capability: Capability, overrides?: Record<string, number>): CapacityResult {
  const components = applyOverrides(capability, overrides);
  if (components.length === 0) {
    return { capacity: 0, unit: capability.unit, components, limiting: [] };
  }
  const capacity = Math.min(...components.map((c) => c.available));
  const limiting = components.filter((c) => c.available === capacity);
  const higher = components.filter((c) => c.available > capacity).sort((a, b) => a.available - b.available);
  const next = higher[0];
  return {
    capacity,
    unit: capability.unit,
    components,
    limiting,
    next,
    gap: next ? next.available - capacity : undefined,
  };
}

function joinNames(components: Component[]): string {
  const names = components.map((c) => c.name);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The capacity sentence of SPEC.md § 6.1.3. */
export function capacitySentence(result: CapacityResult): { now: string; next?: string } {
  const now = `Capacity now: ${result.capacity} ${result.unit}, limited by ${joinNames(result.limiting)} (${result.capacity} available).`;
  if (!result.next || result.gap === undefined) return { now };
  const next = `Freeing ${result.gap} ${joinNames(result.limiting)} would allow ${result.gap} more; the next constraint is ${result.next.name} (${result.next.available}).`;
  return { now, next };
}

/** True when any override differs from the capability's own figure. */
export function hasOverrides(capability: Capability, overrides?: Record<string, number>): boolean {
  if (!overrides) return false;
  return capability.components.some((c) => overrides[c.name] !== undefined && overrides[c.name] !== c.available);
}
