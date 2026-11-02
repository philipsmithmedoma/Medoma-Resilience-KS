import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { homePacks } from './packs/home-packs';
import { getRoadModel, loadRoadModel } from '@/lib/roadModel';
import { homeSitesInScope } from '@/lib/home-sites';
import { impact } from '@/lib/reachability';

const s = () => useStore.getState();

describe('the home pack switch (SPEC.md § 14.5)', () => {
  beforeEach(() => s().reset());

  it('starts on Karolinska; switching swaps patients, infrastructure, teams, visits and messages and logs it', () => {
    expect(s().pack.homePackId).toBe('karolinska');
    const n = s().log.length;
    s().setHomePack('lund');
    expect(s().pack.homePackId).toBe('lund');
    expect(s().pack.homePatients).toBe(homePacks.lund.patients);
    expect(s().pack.homePatients.every((p) => p.id.startsWith('lp-'))).toBe(true);
    expect(s().pack.homeTeams.map((t) => t.name)).toEqual(['ASIH Lund Nord', 'ASIH Lund Syd']);
    expect(s().pack.infraNodes.some((x) => x.id === 'r-lund-s')).toBe(true);
    expect(s().pack.infraNodes.some((x) => x.id === 'r-essingeleden')).toBe(false);
    expect(s().pack.homeMessages[0].id).toBe('lmsg-road');
    expect(s().home.visits).toEqual(homePacks.lund.visits);
    expect(s().home.infraNodes).toBe(s().pack.infraNodes);
    expect(s().log).toHaveLength(n + 1);
    expect(s().log.at(-1)).toMatchObject({ action: 'Bytte sjukhus för Sjukhus hemma till', object: 'SUS Lund', actor: 'Eva Lind', area: 'home', detail: '150 patienter, 2 team' });
    // The hospital data is untouched.
    expect(s().pack.nodes.some((x) => x.id === 'solna')).toBe(true);
    s().setHomePack('lund'); // already there: nothing happens
    expect(s().log).toHaveLength(n + 1);
    s().setHomePack('karolinska');
    expect(s().pack.homePatients).toHaveLength(150);
    expect(s().pack.homePatients[0].id).toBe('hp-1');
    expect(s().log.at(-1)).toMatchObject({ object: 'Karolinska' });
  });

  it('disruptions and work start over with the pack, the layers stay, a demo reset returns to Karolinska', () => {
    s().togglePowerOut('huddinge');
    s().setHomeLayer('el', true);
    s().setHomePack('lund');
    expect(s().home.disruptions).toEqual([]);
    expect(s().home.work).toEqual({});
    expect(s().home.layers.el).toBe(true);
    s().togglePowerOut('huddinge'); // not a Lund zone: ignored
    expect(s().home.powerOutZones.size).toBe(0);
    s().togglePowerOut('dalby');
    expect([...s().home.powerOutZones]).toEqual(['dalby']);
    s().reset();
    expect(s().pack.homePackId).toBe('karolinska');
    expect(s().home.powerOutZones.size).toBe(0);
  });

  it('with the Lund pack reachability runs from SUS Lund and the scope is ignored', async () => {
    expect(homeSitesInScope('karolinska', 'solna')).toEqual(['solna']);
    expect(homeSitesInScope('lund', 'solna')).toEqual(['suslund']);
    expect(homeSitesInScope('lund', 'region')).toEqual(['suslund']);
    s().setHomePack('lund');
    await loadRoadModel(s().pack);
    s().setHomeGeoReady();
    expect(getRoadModel()!.sites.suslund).toBeDefined();
    s().setScope('huddinge');
    s().togglePowerOut('dalby');
    const row = s().log.at(-1)!;
    expect(row.detail).toBe('15 av 150 patienter påverkade');
    s().setScope('solna');
    const r = impact(s().pack, s().home, homeSitesInScope('lund', s().scope), getRoadModel(), s().clock);
    expect(r.summary.affected).toBe(15);
  });

  it('Bring in uses the pack\'s own site, and a preset acts on the pack\'s own nodes and zones', () => {
    s().setHomePack('lund');
    s().applyHomePreset('power');
    expect([...s().home.powerOutZones]).toEqual(['dalby']);
    const p = s().pack.homePatients.find((x) => x.zone === 'dalby')!;
    s().bringInPatient(p.id);
    expect(s().home.work[p.id].bringInSite).toBe('suslund');
    expect(s().log.at(-1)).toMatchObject({ action: 'Tog in patient', detail: 'SUS Lund' });
    s().applyHomePreset('bridge');
    expect([...s().home.blockedNodes].sort()).toEqual(['r-lund-n', 'r-lund-s']);
  });
});
