import { describe, expect, it } from 'vitest';
import { NODES } from '@/data/mock';
import { displaySyncState, distanceKm, sourcesForScope, sumFigures, viewFigure } from './figure';
import { INITIAL_CLOCK } from './time';

const vikby = NODES.find((n) => n.id === 'vikby')!;

describe('viewFigure (SPEC.md § 7.2)', () => {
  it('shows EHR figures as Mirror, fully estimated and frozen at the outage start during an outage', () => {
    const f = vikby.acuteBeds!.free;
    const v = viewFigure(f, { ehrOutage: true, ehrOutageSince: '14:41' });
    expect(v).toMatchObject({ value: 16, verified: 0, estimated: 16, source: 'Mirror', lastConfirmed: '14:41' });
    expect(f.source).toBe('EHR'); // untouched
  });

  it('leaves non-EHR figures and figures outside an outage alone', () => {
    expect(viewFigure(vikby.staffOnDuty, { ehrOutage: true, ehrOutageSince: '14:41' })).toBe(vikby.staffOnDuty);
    expect(viewFigure(vikby.acuteBeds!.free, { ehrOutage: false, ehrOutageSince: null })).toBe(vikby.acuteBeds!.free);
  });
});

describe('displaySyncState (SPEC.md § 5.2)', () => {
  it('shows Fältsjukhus Alfa as Delayed at 14:40 and Ekhaga vårdhubb only from 14:41', () => {
    const alfa = NODES.find((n) => n.id === 'falt-alfa')!;
    const ekhaga = NODES.find((n) => n.id === 'ekhaga')!;
    expect(displaySyncState(alfa, INITIAL_CLOCK)).toBe('Delayed');
    expect(displaySyncState(ekhaga, INITIAL_CLOCK)).toBe('Manual');
    expect(displaySyncState(ekhaga, INITIAL_CLOCK + 1)).toBe('Delayed');
    expect(displaySyncState(vikby, INITIAL_CLOCK)).toBe('Synced');
  });
});

describe('sumFigures and sources', () => {
  it('sums values and keeps the oldest source', () => {
    const s = sumFigures([vikby.acuteBeds!.free, NODES[1].acuteBeds!.free])!;
    expect(s.value).toBe(28);
    expect(s.verified).toBe(26);
    expect(s.estimated).toBe(2);
    expect(s.lastConfirmed).toBe('14:30');
  });

  it('lists the five Vikby sources with EHR Offline during an outage', () => {
    const on = sourcesForScope('vikby', NODES, { ehrOutage: true, ehrOutageSince: '14:40' }, INITIAL_CLOCK);
    expect(on.map((s) => `${s.source}:${s.state}`)).toEqual(['EHR:Offline', 'HR:Delayed', 'RIS:Synced', 'OR planning:Synced', 'Logistics:Synced']);
  });

  it('computes rounded distances', () => {
    const sjoberga = NODES.find((n) => n.id === 'sjoberga')!;
    expect(distanceKm(vikby, sjoberga)).toBe(22);
  });
});
