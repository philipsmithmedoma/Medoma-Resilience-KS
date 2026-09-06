// Target measures computed from state – SPEC.md § 3 (after the domain model).
import type { Capability, CareNode, Incident, Patient, TargetMeasure } from '@/data/types';
import { MEASURE_TASKS } from '@/data/vocab';
import { computeCapacity } from './capacity';

export interface TargetInputs {
  incident: Incident | null;
  patients: Patient[];
  capabilities: Capability[];
  nodes: CareNode[];
}

function taskDone(incident: Incident | null, title: string): boolean {
  return incident?.tasks.some((t) => t.title === title && t.status === 'Done') ?? false;
}

export function measureTarget(measure: TargetMeasure, inputs: TargetInputs): number {
  const { incident, patients, capabilities, nodes } = inputs;
  switch (measure) {
    case 'edTriage': {
      const ed = nodes.find((n) => n.id === 'vikby')?.emergencyDepartment;
      return taskDone(incident, MEASURE_TASKS.edTriage) ? (ed?.slots ?? 40) : (ed?.inUse.value ?? 31);
    }
    case 'theatresAvailable': {
      const surgery = capabilities.find((c) => c.nodeId === 'vikby' && c.name === 'Emergency surgery');
      const capacity = surgery ? computeCapacity(surgery).capacity : 0;
      return capacity + (taskDone(incident, MEASURE_TASKS.theatresAvailable) ? 4 : 0);
    }
    case 'icuFreed':
      return taskDone(incident, MEASURE_TASKS.icuFreed) ? 2 : 0;
    case 'acuteBedsFreed':
      return patients.filter((p) => p.move && ['Departed', 'Arrived', 'Handed over'].includes(p.move.status)).length;
    case 'wardsOnMirror':
      return taskDone(incident, MEASURE_TASKS.wardsOnMirror) ? 4 : 0;
  }
}

/** Progress in percent, clamped to 0–100. */
export function targetProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}
