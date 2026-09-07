// Target measures computed from state – SPEC.md § 6.6 targets.
import type { Capability, DischargeReady, Incident, Patient, ScenarioState, SiteId, TargetMeasure } from '@/data/types';
import { computeCapacity } from './capacity';
import { hasLeft } from './evacuation';

export interface TargetInputs {
  incident: Incident | null;
  patients: Patient[];
  capabilities: Capability[];
  dischargeReady: DischargeReady[];
  scenario: ScenarioState | null;
  edPatientsSolna: number;
  freedByScenario: number; // beds freed by scenario recommendations (asih, tidig_utskrivning)
}

/** Tasks whose completion drives a target measure. */
export const MEASURE_TASKS: Partial<Record<TargetMeasure, string>> = {
  triageSolna: 'Upprätta triagezoner röd/gul/grön',
  theatresAvailable: 'Stryk elektiv operation och frigör salar',
  icuAdded: 'Öppna IMA som IVA-överflöd',
  wardsOnMirror: 'Gå över till operativ spegel och läskopia på alla avdelningar',
  receivingBeds: 'Reservera mottagningsplatser per tema',
  icuAddedDays: 'Aktivera plan för IVA-utbyggnad i O-huset',
};

function taskDone(incident: Incident | null, measure: TargetMeasure): boolean {
  const title = MEASURE_TASKS[measure];
  return Boolean(title && incident?.tasks.some((t) => t.title === title && t.status === 'Done'));
}

function applied(scenario: ScenarioState | null, key: string): boolean {
  return Boolean(scenario?.applied.includes(key));
}

export function measureTarget(measure: TargetMeasure, inputs: TargetInputs): number {
  const { incident, patients, capabilities, dischargeReady, scenario } = inputs;
  switch (measure) {
    case 'triageSolna':
      return taskDone(incident, measure) ? 40 : inputs.edPatientsSolna;
    case 'theatresAvailable': {
      const primary: SiteId = (scenario?.params.primar as SiteId) ?? 'solna';
      const surgery = capabilities.find((c) => c.nodeId === primary && c.kind === 'surgery');
      const capacity = surgery ? computeCapacity(surgery).capacity : 0;
      return capacity + (taskDone(incident, measure) || applied(scenario, 'stryk_elektiv') ? 4 : 0);
    }
    case 'icuAdded':
      return taskDone(incident, measure) || applied(scenario, 'ima_overflow') ? 6 : 0;
    case 'bedsFreed': {
      const discharged = dischargeReady.filter((d) => d.status === 'Utskriven').length;
      const moved = patients.filter((p) => p.move && !p.move.suggested && hasLeft(p.move.status)).length;
      return discharged + moved + inputs.freedByScenario;
    }
    case 'wardsOnMirror':
      return taskDone(incident, measure) ? 4 : 0;
    case 'receivingBeds':
      return taskDone(incident, measure) ? 60 : 0;
    case 'patientsMoved':
      return patients.filter((p) => p.move && !p.move.suggested && hasLeft(p.move.status)).length;
    case 'icuAddedDays': {
      if (scenario?.key === 'pandemi' && applied(scenario, 'o_huset')) {
        const since = scenario.tick - (scenario.appliedAt.o_huset ?? scenario.tick);
        return Math.min(64, Math.round(6.4 * since));
      }
      return taskDone(incident, measure) ? 20 : 0;
    }
  }
}

/** Progress in percent, clamped to 0–100. */
export function targetProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}
