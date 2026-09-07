import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { ED_NAME } from './packs/karolinska';
import { siteValues } from '@/lib/flow';

const s = () => useStore.getState();
const ward = (site: string, name: string) => s().wards.find((w) => w.site === site && w.name === name)!;
const metric = (key: string, site: 'solna' | 'huddinge') => s().flowMetrics.find((m) => m.key === key && m.site === site)!.value.value;
const node = (id: string) => s().nodes.find((n) => n.id === id)!;
const values = (site: 'solna' | 'huddinge') =>
  siteValues(site, { flowMetrics: s().flowMetrics, nodes: s().nodes, wards: s().wards, bedRequests: s().bedRequests, edName: ED_NAME, clock: s().clock, outage: { ehrOutage: false, ehrOutageSince: null } });

describe('patient placement (SPEC.md § 6.2)', () => {
  beforeEach(() => s().reset());

  it('placing br-1 reduces HKN Kardiologi Huddinge free to 0 and "Väntar på vårdplats" Huddinge to 16', () => {
    s().placePatient('br-1', ward('huddinge', 'HKN Kardiologi').id, false);
    expect(ward('huddinge', 'HKN Kardiologi').free).toBe(0);
    expect(metric('akuten.waitingBed', 'huddinge')).toBe(16);
    expect(node('huddinge').beds!.free.value).toBe(8);
    expect(values('huddinge').figures['beds.belagda'].value).toBe(542);
    expect(s().bedRequests.some((r) => r.id === 'br-1')).toBe(false);
    expect(s().log[s().log.length - 1]).toMatchObject({ action: 'Placerade patient – HKN Kardiologi', object: 'Andersson, Anna', detail: 'Akutmottagningen, 5 h 40 min' });
  });

  it('utlokalisering marks the site and the log; a Postop request does not touch the akuten queue', () => {
    s().placePatient('br-4', ward('huddinge', 'I&Å Internmedicin').id, true);
    expect(metric('beds.utlokaliserade', 'huddinge')).toBe(10);
    expect(metric('akuten.waitingBed', 'huddinge')).toBe(16);
    expect(s().log[s().log.length - 1].action).toBe('Utlokaliserade patient – I&Å Internmedicin');
    s().placePatient('br-5', ward('huddinge', 'ARM Ortopedi').id, false);
    expect(metric('akuten.waitingBed', 'huddinge')).toBe(16);
  });

  it('placing into the IMA does not consume a vårdplats; rejecting removes with a reason', () => {
    s().placePatient('br-11', ward('solna', 'IMA Solna').id, false);
    expect(ward('solna', 'IMA Solna').free).toBe(0);
    expect(node('solna').beds!.free.value).toBe(23);
    expect(values('solna').figures['ima.occupied'].value).toBe(12);
    s().rejectPlacement('br-6', 'Kvarstannar på IVA');
    expect(s().bedRequests.some((r) => r.id === 'br-6')).toBe(false);
    expect(s().log[s().log.length - 1]).toMatchObject({ action: 'Avvisade placering – Forsberg, Fredrik', detail: 'Kvarstannar på IVA' });
  });
});

describe('utskrivningsklara (SPEC.md § 6.4)', () => {
  beforeEach(() => s().reset());

  it('"Till ASIH" on dr-2 is settled on the next action: frees a bed in I&Å Internmedicin Huddinge and reduces ASIH capacity to 119', () => {
    s().sendToAsih('dr-2');
    expect(s().dischargeReady.find((d) => d.id === 'dr-2')!.status).toBe('ASIH-förfrågan skickad');
    expect(ward('huddinge', 'I&Å Internmedicin').free).toBe(1);
    s().logEntry('Nästa åtgärd', 'Test');
    const d = s().dischargeReady.find((x) => x.id === 'dr-2')!;
    expect(d.status).toBe('Utskriven');
    expect(ward('huddinge', 'I&Å Internmedicin').free).toBe(2);
    expect(node('huddinge').beds!.free.value).toBe(10);
    expect(node('asih').beds!.free.value).toBe(119);
    expect(metric('beds.utskrivningsklara', 'huddinge')).toBe(30);
    expect(metric('beds.asihEligible', 'huddinge')).toBe(7);
    expect(s().log[s().log.length - 1]).toMatchObject({ actor: 'System', action: 'Utskriven till ASIH – Nyström, Nils' });
  });

  it('a request is also settled by the scenario clock, and "Till geriatrik" reduces the geriatrik class to 22', () => {
    s().sendToGeriatrik('dr-3');
    s().stepClock();
    expect(s().dischargeReady.find((d) => d.id === 'dr-3')!.status).toBe('Utskriven');
    expect(node('geriatrik').beds!.free.value).toBe(22);
    expect(ward('huddinge', 'ARM Ortopedi').free).toBe(3);
    s().waitDischarge('dr-1');
    expect(s().log[s().log.length - 1].action).toBe('Avvaktar – Magnusson, Maria');
    expect(s().dischargeReady.find((d) => d.id === 'dr-1')!.status).toBe('Väntar');
  });
});
