import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { INITIAL_CLOCK } from '@/lib/time';

const s = () => useStore.getState();

describe('store (SPEC.md § 5)', () => {
  beforeEach(() => s().reset());

  it('starts at 14:40 with Karolinska as scope, the seven initial log entries and 80 patients', () => {
    expect(s().clock).toBe(INITIAL_CLOCK);
    expect(s().scope).toBe('karolinska');
    expect(s().log).toHaveLength(7);
    expect(s().patients).toHaveLength(80);
    expect(s().scenario).toBeNull();
    expect(s().clockRunning).toBe(false);
  });

  it('logEntry appends an entry stamped with the clock and advances the clock one minute', () => {
    s().logEntry('Gjorde något', 'Objekt', 'Detalj');
    expect(s().clock).toBe(INITIAL_CLOCK + 1);
    const last = s().log[s().log.length - 1];
    expect(last).toMatchObject({ at: '14:40', actor: 'Eva Lind', action: 'Gjorde något', object: 'Objekt', detail: 'Detalj' });
  });

  it('the outage switch writes two System entries in Swedish and records when it started', () => {
    s().setEhrOutage(true);
    expect(s().ehrOutage).toBe(true);
    expect(s().ehrOutageSince).toBe('14:40');
    s().setEhrOutage(false);
    const added = s().log.slice(7);
    expect(added.map((e) => e.action)).toEqual(['Journalsystemet frånkopplat, drift på operativ spegel', 'Journalsystemet återanslutet']);
    expect(added.every((e) => e.actor === 'System')).toBe(true);
  });

  it('the scenario clock steps 15 minutes, a day for PB5, and resets to 14:40', () => {
    s().stepClock();
    expect(s().clock).toBe(INITIAL_CLOCK + 15);
    s().activatePlaybook('pb5', 'Eva Lind', 'Förstärkningsläge');
    const before = s().clock;
    s().stepClock();
    expect(s().clock).toBe(before + 1440);
    s().resetClock();
    expect(s().clock).toBe(INITIAL_CLOCK);
    expect(s().incident).not.toBeNull(); // reset clock keeps other state
    expect(s().log[s().log.length - 1].action).toBe('Återställde klockan');
  });

  it('reset restores the pack without sharing object identity', () => {
    s().nodes[0].name = 'Ändrad';
    s().setScope('region');
    s().reset();
    expect(s().nodes[0].name).toBe('Karolinska Solna');
    expect(s().scope).toBe('karolinska');
    expect(s().clock).toBe(INITIAL_CLOCK);
  });
});
