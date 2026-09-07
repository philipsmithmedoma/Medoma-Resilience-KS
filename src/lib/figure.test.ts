import { describe, expect, it } from 'vitest';
import { NODES } from '@/data/packs/karolinska';
import { displaySyncState, distanceKm, sumFigures, viewFigure, weakest } from './figure';
import { INITIAL_CLOCK } from './time';

const solna = NODES.find((n) => n.id === 'solna')!;
const huddinge = NODES.find((n) => n.id === 'huddinge')!;

describe('viewFigure (SPEC.md § 7.1)', () => {
  it('shows EHR figures as Mirror and estimate, frozen at the outage start, during an outage', () => {
    const f = solna.beds!.free;
    const v = viewFigure(f, { ehrOutage: true, ehrOutageSince: '14:41' });
    expect(v).toMatchObject({ value: 23, dataSource: 'Mirror', lastConfirmed: '14:41' });
    expect(f.dataSource).toBe('EHR'); // untouched
    const verified = viewFigure({ value: 18, confidence: 'verified', source: 'S5', dataSource: 'EHR', lastConfirmed: '14:00' }, { ehrOutage: true, ehrOutageSince: '14:41' });
    expect(verified.confidence).toBe('estimate');
  });

  it('leaves non-EHR figures and figures outside an outage alone', () => {
    expect(viewFigure(solna.staffOnDuty!, { ehrOutage: true, ehrOutageSince: '14:41' })).toBe(solna.staffOnDuty);
    expect(viewFigure(solna.beds!.free, { ehrOutage: false, ehrOutageSince: null })).toBe(solna.beds!.free);
  });
});

describe('sumFigures and weakest (SPEC.md § 4)', () => {
  it('sums values and takes the weakest confidence', () => {
    const s = sumFigures([solna.intensiveCare!.total, huddinge.intensiveCare!.total])!;
    expect(s.value).toBe(27);
    expect(s.confidence).toBe('verified');
    expect(s.source).toBe('S5');
    const mixed = sumFigures([solna.intensiveCare!.total, solna.intensiveCare!.free])!;
    expect(mixed.confidence).toBe('illustrative');
    expect(weakest('verified', 'reported', 'estimate')).toBe('estimate');
  });

  it('a null part makes the sum unknown', () => {
    const s = sumFigures([{ value: 5, confidence: 'verified' }, { value: null, confidence: 'verified' }])!;
    expect(s.value).toBeNull();
  });
});

describe('displaySyncState and distance', () => {
  it('shows Delayed only when the last sync is strictly older than 30 minutes', () => {
    expect(displaySyncState({ sync: 'Synced', lastSync: '14:10' }, INITIAL_CLOCK)).toBe('Synced');
    expect(displaySyncState({ sync: 'Synced', lastSync: '14:10' }, INITIAL_CLOCK + 1)).toBe('Delayed');
  });

  it('computes rounded distances between the sites', () => {
    expect(distanceKm(solna, huddinge)).toBe(15);
  });
});
