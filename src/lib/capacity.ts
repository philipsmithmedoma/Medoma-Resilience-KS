// Capacity maths – capability = min(available); limiting = components at the minimum; next = smallest above.
import type { Capability, Component } from '@/data/types';
import { t } from '@/lib/i18n';
import { fmt } from './format';

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
  const names = components.map((c) => c.name.toLowerCase());
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${t('CAP.and')} ${names[names.length - 1]}`;
}

/** The capacity sentence shown under the dependency table, in Swedish. */
export function capacitySentence(result: CapacityResult): { now: string; next?: string } {
  const now = t('CAP.capacitySentence', { capacity: fmt(result.capacity), unit: result.unit, limiting: joinNames(result.limiting), available: fmt(result.capacity) });
  if (!result.next || result.gap === undefined) return { now };
  const next = t('CAP.nextSentence', { gap: fmt(result.gap), limiting: joinNames(result.limiting), more: fmt(result.gap), next: result.next.name.toLowerCase(), available: fmt(result.next.available) });
  return { now, next };
}

/** True when any override differs from the capability's own figure. */
export function hasOverrides(capability: Capability, overrides?: Record<string, number>): boolean {
  if (!overrides) return false;
  return capability.components.some((c) => overrides[c.name] !== undefined && overrides[c.name] !== c.available);
}
