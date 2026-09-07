import { useStore } from '@/data/store';

/** SPEC.md § 6.5 – the current tick's pools with brist in red; rendered once the engine lands in Batch 3. */
export function ScenarioStrip() {
  const scenario = useStore((s) => s.scenario);
  if (!scenario) return null;
  return null;
}
