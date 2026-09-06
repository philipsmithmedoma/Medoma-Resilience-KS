import { describe, expect, it } from 'vitest';
import { CAPABILITIES, NODES, PATIENTS, PLAYBOOKS } from '@/data/mock';
import type { Incident } from '@/data/types';
import { measureTarget, targetProgress } from './targets';

function incidentWithDone(titles: string[], playbookId = 'mc-2'): Incident {
  const pb = PLAYBOOKS.find((p) => p.id === playbookId)!;
  return {
    playbookId: pb.id,
    name: pb.name,
    level: 2,
    activatedAt: '14:40',
    activatedBy: 'Eva Lind',
    commander: 'Eva Lind',
    roles: {},
    channels: [],
    targets: [],
    tasks: pb.tasks.map((t, i) => ({ ...t, id: `t-${i}`, status: titles.includes(t.title) ? 'Done' : 'Not started', due: '15:00' })),
  };
}

const base = { patients: PATIENTS, capabilities: CAPABILITIES, nodes: NODES };

describe('measureTarget (SPEC.md § 3)', () => {
  it('edTriage is 31 until "Set up triage zones" is Done, then 40', () => {
    expect(measureTarget('edTriage', { ...base, incident: incidentWithDone([]) })).toBe(31);
    expect(measureTarget('edTriage', { ...base, incident: incidentWithDone(['Set up triage zones']) })).toBe(40);
  });

  it('theatresAvailable is the surgery capacity plus 4 once theatres are released', () => {
    expect(measureTarget('theatresAvailable', { ...base, incident: incidentWithDone([]) })).toBe(2);
    expect(measureTarget('theatresAvailable', { ...base, incident: incidentWithDone(['Stop elective surgery and release theatres']) })).toBe(6);
  });

  it('icuFreed and wardsOnMirror follow their tasks', () => {
    expect(measureTarget('icuFreed', { ...base, incident: incidentWithDone(['Convert post-operative unit to intensive care overflow']) })).toBe(2);
    expect(measureTarget('icuFreed', { ...base, incident: null })).toBe(0);
    expect(measureTarget('wardsOnMirror', { ...base, incident: incidentWithDone(['Switch to operational mirror on all wards'], 'it-outage') })).toBe(4);
    expect(measureTarget('wardsOnMirror', { ...base, incident: incidentWithDone([], 'it-outage') })).toBe(0);
  });

  it('acuteBedsFreed counts Departed, Arrived and Handed over moves', () => {
    const patients = PATIENTS.map((p, i) => ({
      ...p,
      move: i < 3 ? { destinationId: 'sjoberga', status: (['Departed', 'Arrived', 'Planned'] as const)[i], suggested: false } : undefined,
    }));
    expect(measureTarget('acuteBedsFreed', { ...base, patients, incident: null })).toBe(2);
  });

  it('targetProgress clamps to 0–100', () => {
    expect(targetProgress(31, 40)).toBe(78);
    expect(targetProgress(45, 40)).toBe(100);
    expect(targetProgress(0, 0)).toBe(100);
  });
});
