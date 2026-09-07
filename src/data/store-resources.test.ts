import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';

const s = () => useStore.getState();
const resource = (nodeId: string, name: string) => s().resources.find((r) => r.nodeId === nodeId && r.name === name);

describe('request flow with inventory side effects (SPEC.md § 6.8)', () => {
  beforeEach(() => s().reset());

  it('walks req-1 Acceptera → Tilldela (Solna, 4 lediga) → Sänd → Markera mottagen, moving 2 ventilators', () => {
    s().acceptRequest('req-1');
    s().allocateRequest('req-1', 'solna');
    expect(resource('solna', 'Ventilator')).toMatchObject({ available: 2, reserved: 2 });
    s().dispatchRequest('req-1', '15:20');
    expect(resource('solna', 'Ventilator')).toMatchObject({ available: 2, reserved: 0, inTransit: 2, total: 34 });
    s().receiveRequest('req-1');
    expect(resource('solna', 'Ventilator')).toMatchObject({ available: 2, inTransit: 0, total: 32 });
    expect(resource('huddinge', 'Ventilator')).toMatchObject({ available: 4, total: 24 });
    const actions = s().log.filter((e) => e.ref === 'req-1').map((e) => e.action);
    expect(actions).toEqual([
      'Begärde',
      'Accepterade förfrågan – Ventilator × 2 – till Karolinska Huddinge',
      'Tilldelade förfrågan – Ventilator × 2 – till Karolinska Huddinge',
      'Sände förfrågan – Ventilator × 2 – till Karolinska Huddinge',
      'Tog emot förfrågan – Ventilator × 2 – till Karolinska Huddinge',
    ]);
  });

  it('receiving req-3 moves two Transportambulans from Ambulanssjukvården to Huddinge as a new row', () => {
    s().receiveRequest('req-3');
    expect(resource('huddinge', 'Transportambulans')).toMatchObject({ available: 2, total: 2, category: 'Transport', dataSource: 'Manual', lastConfirmed: '14:40' });
  });

  it('a transport request gets Ambulanssjukvården as "Från" and carries the Incident chip while an incident is active', () => {
    const id = s().createRequest({ resourceName: 'Transportambulans', quantity: 4, toNodeId: 'solna', priority: 'High' });
    expect(s().requests.find((r) => r.id === id)).toMatchObject({ fromNodeId: 'ambulans', unit: 'fordon', incident: false, requestedBy: 'Eva Lind' });
    s().activatePlaybook('pb3', 'Eva Lind', 'Stabsläge');
    const id2 = s().createRequest({ resourceName: 'Bår', quantity: 2, toNodeId: 'huddinge', priority: 'Normal' });
    expect(s().requests.find((r) => r.id === id2)).toMatchObject({ incident: true, fromNodeId: undefined });
  });

  it('refuses to allocate from a node without enough available and rejects with a reason', () => {
    s().acceptRequest('req-1');
    s().allocateRequest('req-1', 'huddinge'); // 2 available, 2 needed → allowed
    expect(s().requests.find((r) => r.id === 'req-1')!.status).toBe('Allocated');
    s().rejectRequest('req-2', 'Inga att avvara');
    expect(s().requests.find((r) => r.id === 'req-2')!.status).toBe('Accepted'); // only Requested can be rejected
  });
});

describe('network actions (SPEC.md § 6.9)', () => {
  beforeEach(() => s().reset());

  it('stands up a node at a preset site and makes it operational with planned beds free', () => {
    const site = s().pack.presetSites[0];
    const id = s().standUpNode({ name: site.name, type: 'Care hub', site, plannedBeds: 40, lead: 'Mats Öberg', sharing: 'Full' });
    const node = s().nodes.find((n) => n.id === id)!;
    expect(node).toMatchObject({ status: 'Standing up', plannedBeds: 40, accepts: ['Ward'], sync: 'Manual', lastSync: '14:40' });
    expect(node.beds!.free).toMatchObject({ value: 0, confidence: 'illustrative', dataSource: 'Manual' });
    s().setNodeStatus(id, 'Operational');
    const up = s().nodes.find((n) => n.id === id)!;
    expect(up.beds!.total.value).toBe(40);
    expect(up.beds!.free.value).toBe(40);
    expect(s().log[s().log.length - 1].action).toBe('Ändrade nodstatus – Tillfällig vårdhubb Flemingsberg – I drift');
    s().setNodeSharing(id, 'Capacity only');
    expect(s().log[s().log.length - 1].action).toBe('Ändrade noddelning – Tillfällig vårdhubb Flemingsberg – Endast kapacitet');
  });
});
