import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { INITIAL_CLOCK } from '@/lib/time';

describe('store (SPEC.md § 4)', () => {
  beforeEach(() => useStore.getState().reset());

  it('starts at 14:40 with Vikby sjukhus as scope and the six initial log entries', () => {
    const s = useStore.getState();
    expect(s.clock).toBe(INITIAL_CLOCK);
    expect(s.scope).toBe('vikby');
    expect(s.log).toHaveLength(6);
    expect(s.patients).toHaveLength(40);
  });

  it('logEntry appends an entry stamped with the clock and advances the clock one minute', () => {
    useStore.getState().logEntry('Did something', 'Object', 'Detail');
    const s = useStore.getState();
    expect(s.clock).toBe(INITIAL_CLOCK + 1);
    const last = s.log[s.log.length - 1];
    expect(last).toMatchObject({ at: '14:40', actor: 'Eva Lind', action: 'Did something', object: 'Object', detail: 'Detail' });
  });

  it('the EHR outage switch writes two log entries as System and records when it started', () => {
    useStore.getState().setEhrOutage(true);
    expect(useStore.getState().ehrOutage).toBe(true);
    expect(useStore.getState().ehrOutageSince).toBe('14:40');
    useStore.getState().setEhrOutage(false);
    const s = useStore.getState();
    expect(s.ehrOutage).toBe(false);
    expect(s.ehrOutageSince).toBeNull();
    const added = s.log.slice(6);
    expect(added.map((e) => e.action)).toEqual(['EHR connection lost, switched to operational mirror', 'EHR connection restored']);
    expect(added.every((e) => e.actor === 'System')).toBe(true);
    expect(s.clock).toBe(INITIAL_CLOCK + 2);
  });

  it('reset restores the initial dataset without sharing object identity with the mock', () => {
    const before = useStore.getState().nodes[0];
    before.name = 'Changed';
    useStore.getState().setScope('region');
    useStore.getState().reset();
    const s = useStore.getState();
    expect(s.nodes[0].name).toBe('Vikby sjukhus');
    expect(s.scope).toBe('vikby');
    expect(s.clock).toBe(INITIAL_CLOCK);
  });
});
