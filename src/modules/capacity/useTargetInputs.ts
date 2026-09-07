import { useStore } from '@/data/store';
import type { TargetInputs } from '@/lib/targets';

/** Everything the target measures need, read from the store. */
export function useTargetInputs(): TargetInputs {
  const incident = useStore((s) => s.incident);
  const patients = useStore((s) => s.patients);
  const capabilities = useStore((s) => s.capabilities);
  const dischargeReady = useStore((s) => s.dischargeReady);
  const scenario = useStore((s) => s.scenario);
  const freedByScenario = useStore((s) => s.freedByScenario);
  const edPatientsSolna = useStore((s) => s.flowMetrics.find((m) => m.key === 'akuten.patients' && m.site === 'solna')?.value.value ?? 0);
  return { incident, patients, capabilities, dischargeReady, scenario, freedByScenario, edPatientsSolna };
}
