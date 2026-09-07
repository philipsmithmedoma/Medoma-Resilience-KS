import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { ED_NAME } from './packs/karolinska';
import { siteValues } from '@/lib/flow';
import { INITIAL_CLOCK } from '@/lib/time';

const s = () => useStore.getState();
const node = (id: string) => s().nodes.find((n) => n.id === id)!;
const lediga = (site: 'solna' | 'huddinge') =>
  siteValues(site, { flowMetrics: s().flowMetrics, nodes: s().nodes, wards: s().wards, bedRequests: s().bedRequests, edName: ED_NAME, clock: s().clock, outage: { ehrOutage: false, ehrOutageSince: null } }).figures['beds.lediga'].value;

describe('scenario store (SPEC.md § 7.2–7.4)', () => {
  beforeEach(() => s().reset());

  it('chapter 3: masskada runs on the clock; IVA Solna brist within 2 h; ima_overflow becomes applicable and resolves it', () => {
    s().startScenario('masskada', {}, false);
    const sc = s().scenario!;
    expect(sc.key).toBe('masskada');
    expect(sc.inputs.sites.solna).toMatchObject({ akutrum: 6, ivaFree: 2, bedsFree: 23, bloodUnits: 22, orSlots: 2, ctScanners: 3 });
    expect(sc.inputs.sites.huddinge).toMatchObject({ akutrum: 4, overvakning: 25, ivaFree: 0, bedsFree: 9 });
    expect(sc.events[0].text).toBe('+20 min: Första skadade anländer till Solna');
    expect(s().log[s().log.length - 1].action).toBe('Startade scenario – Masskada');
    s().setClockRunning(true);
    for (let i = 0; i < 8; i++) s().stepClock();
    expect(s().scenario!.tick).toBe(8);
    expect(s().clock).toBe(INITIAL_CLOCK + 8 * 15 + 1);
    expect(node('solna').intensiveCare!.free.value).toBe(0);
    const rec = s().scenario!.recommendations.find((r) => r.key === 'ima_overflow')!;
    expect(rec.applicable).toBe(true);
    s().applyRecommendation('ima_overflow');
    const after = s().scenario!;
    expect(after.applied).toEqual(['ima_overflow']);
    expect(after.series.slice(8).every((r) => r.pools.find((p) => p.pool === 'iva' && p.site === 'solna')!.demand <= r.pools.find((p) => p.pool === 'iva' && p.site === 'solna')!.capacity)).toBe(true);
    expect(after.recommendations.find((r) => r.key === 'ima_overflow')!.applicable).toBe(false);
    expect(s().log[s().log.length - 1]).toMatchObject({ actor: 'Eva Lind', action: 'Utförde rekommendation – Öppna IMA som IVA-överflöd' });
    expect(node('solna').intensiveCare!.free.value).toBeGreaterThan(0);
  });

  it('forstarkning activates PB1 with Förstärkningsläge and katastrof changes the läge; the incident marks tasks done', () => {
    s().startScenario('masskada', {}, false);
    s().applyRecommendation('forstarkning');
    expect(s().incident).toMatchObject({ playbookKey: 'masskada', lage: 'Förstärkningsläge' });
    s().applyRecommendation('katastrof');
    expect(s().incident!.lage).toBe('Katastrofläge');
    s().applyRecommendation('stryk_elektiv');
    expect(s().incident!.tasks.find((t) => t.title === 'Stryk elektiv operation och frigör salar')!.status).toBe('Done');
    s().applyRecommendation('transport');
    const req = s().requests[s().requests.length - 1];
    expect(req).toMatchObject({ resourceName: 'Transportambulans', quantity: 4, fromNodeId: 'ambulans', toNodeId: 'solna', priority: 'High', incident: true });
  });

  it('asih frees 13 beds (5 Solna, 8 Huddinge) and Läget nu reflects it; ASIH capacity drops by 13', () => {
    s().startScenario('masskada', {}, false);
    s().stepClock();
    s().applyRecommendation('asih');
    expect(lediga('solna')).toBe(28);
    expect(lediga('huddinge')).toBe(17);
    expect(node('asih').beds!.free.value).toBe(107);
    expect(s().dischargeReady.filter((d) => d.asihEligible).every((d) => d.status === 'Utskriven')).toBe(true);
    expect(s().freedByScenario).toBe(13);
  });

  it('chapter 4: journalbortfall activates PB2, turns the outage on and clears it at the horizon', () => {
    s().armScenario('journalbortfall', true);
    expect(s().ehrOutage).toBe(true);
    expect(s().incident?.playbookKey).toBe('journalbortfall');
    expect(s().clockRunning).toBe(true);
    for (let i = 0; i < 24; i++) s().stepClock();
    expect(s().scenario!.running).toBe(false);
    expect(s().clockRunning).toBe(false);
    expect(s().ehrOutage).toBe(false);
    expect(s().log.some((e) => e.action === 'Scenario Journalsystem otillgängligt nådde horisonten')).toBe(true);
  });

  it('chapter 5: mottagande distributes 260 patients, nodes run out, vardhubb stands up Flemingsberg and opens after 4 ticks', () => {
    s().setScope('region');
    s().startScenario('mottagande', {}, true);
    for (let i = 0; i < 20; i++) s().stepClock();
    expect(node('sos').beds!.free.value).toBe(0);
    expect(s().scenario!.events.some((e) => e.tick <= 20 && e.text.includes('SÖS: vårdplatser slut'))).toBe(true);
    s().applyRecommendation('vardhubb');
    const hubId = s().scenario!.hubNodeId!;
    expect(node(hubId)).toMatchObject({ name: 'Tillfällig vårdhubb Flemingsberg', status: 'Standing up', plannedBeds: 40 });
    for (let i = 0; i < 4; i++) s().stepClock();
    expect(node(hubId).status).toBe('Operational');
    for (let i = 0; i < 24; i++) s().stepClock();
    expect(s().scenario!.running).toBe(false);
    const last = s().scenario!.series[48].pools;
    expect(last.reduce((n, p) => n + p.demand, 0)).toBe(260);
    expect(last.find((p) => p.site === 'vardhubb')!.demand).toBeGreaterThan(0);
  });

  it('pandemi ticks a day at a time; o_huset resolves the deficit; the PB5 target counts days', () => {
    s().activatePlaybook('pb5', 'Eva Lind', 'Förstärkningsläge');
    s().startScenario('pandemi', {}, false);
    const before = s().clock;
    s().stepClock();
    expect(s().clock).toBe(before + 1440);
    expect(s().scenario!.tick).toBe(1);
    const iva = s().scenario!.series[3].pools[0];
    expect(iva.demand).toBeGreaterThan(iva.capacity);
    s().applyRecommendation('o_huset');
    expect(s().scenario!.series.slice(2).every((r) => r.pools[0].demand <= r.pools[0].capacity)).toBe(true);
    expect(s().incident!.tasks[0].status).toBe('Done');
  });

  it('siteevac opens Evakuering with PB4 at Huddinge; stop and reset clock clear the scenario', () => {
    s().startScenario('siteevac', {});
    expect(s().scenario).toBeNull();
    expect(s().scope).toBe('huddinge');
    expect(s().incident?.playbookKey).toBe('evakuering');
    s().reset();
    s().startScenario('tryck', {}, true);
    expect(s().scenario?.key).toBe('tryck');
    s().resetClock();
    expect(s().scenario).toBeNull();
    expect(s().clock).toBe(INITIAL_CLOCK);
  });
});
