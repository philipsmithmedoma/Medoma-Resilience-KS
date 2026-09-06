import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';

const s = () => useStore.getState();
const resource = (nodeId: string, name: string) => s().resources.find((r) => r.nodeId === nodeId && r.name === name);

describe('request flow with inventory side effects (SPEC.md § 6.4.1)', () => {
  beforeEach(() => s().reset());

  it('walks req-1 Accept → Allocate (Vikby, 4 available) → Dispatch → Mark received, moving 2 ventilators', () => {
    s().acceptRequest('req-1');
    expect(s().requests.find((r) => r.id === 'req-1')!.status).toBe('Accepted');
    s().allocateRequest('req-1', 'vikby');
    expect(resource('vikby', 'Ventilator')).toMatchObject({ available: 2, reserved: 2 });
    s().dispatchRequest('req-1', '15:20');
    expect(resource('vikby', 'Ventilator')).toMatchObject({ available: 2, reserved: 0, inTransit: 2, total: 30 });
    expect(s().requests.find((r) => r.id === 'req-1')).toMatchObject({ status: 'Dispatched', eta: '15:20', fromNodeId: 'vikby' });
    s().receiveRequest('req-1');
    expect(resource('vikby', 'Ventilator')).toMatchObject({ available: 2, inTransit: 0, total: 28 });
    expect(resource('ekhaga', 'Ventilator')).toMatchObject({ available: 2, total: 2 });
    const actions = s().log.filter((e) => e.ref === 'req-1').map((e) => e.action);
    expect(actions).toEqual([
      'Requested',
      'Accepted request – Ventilator × 2 – to Ekhaga vårdhubb',
      'Allocated request – Ventilator × 2 – to Ekhaga vårdhubb',
      'Dispatched request – Ventilator × 2 – to Ekhaga vårdhubb',
      'Received request – Ventilator × 2 – to Ekhaga vårdhubb',
    ]);
  });

  it('receiving a dispatched request creates the row at the destination when missing', () => {
    s().receiveRequest('req-3');
    expect(resource('vikby', 'Mobile care team')).toMatchObject({ inTransit: 0, total: 2 });
    expect(resource('falt-alfa', 'Mobile care team')).toMatchObject({ available: 1, total: 1, category: 'Team', unit: 'teams', source: 'Manual', lastConfirmed: '14:40' });
    s().receiveRequest('req-4');
    expect(resource('vikby', 'Saline 1000 ml')).toMatchObject({ inTransit: 0, total: 750, available: 750 });
    expect(resource('ekhaga', 'Saline 1000 ml')).toMatchObject({ available: 50, total: 50, category: 'Supply' });
  });

  it('refuses to allocate from a node without enough available and rejects with a reason', () => {
    s().allocateRequest('req-2', 'vikby'); // 8 available, 10 needed
    expect(s().requests.find((r) => r.id === 'req-2')!.status).toBe('Accepted');
    s().rejectRequest('req-1', 'None to spare');
    expect(s().requests.find((r) => r.id === 'req-1')).toMatchObject({ status: 'Rejected', rejectReason: 'None to spare' });
  });

  it('creates a request with the Incident chip while an incident is active', () => {
    s().createRequest({ resourceName: 'Ventilator', quantity: 2, toNodeId: 'ekhaga', priority: 'High', note: 'From msg-1' });
    expect(s().requests[s().requests.length - 1]).toMatchObject({ status: 'Requested', requestedBy: 'Eva Lind', requestedAt: '14:40', unit: 'units', incident: false });
    s().activatePlaybook('mc-1', 'Eva Lind');
    const id = s().createRequest({ resourceName: 'Stretcher', quantity: 2, toNodeId: 'vikby', priority: 'Normal' });
    expect(s().requests.find((r) => r.id === id)!.incident).toBe(true);
  });
});

describe('network actions (SPEC.md § 6.5)', () => {
  beforeEach(() => s().reset());

  it('stands up a node and makes it operational with planned beds free', () => {
    const id = s().standUpNode({ name: 'Vikby idrottshall', type: 'Field hospital', site: { name: 'Vikby idrottshall', place: 'Sollentuna', lat: 59.432, lng: 17.96 }, plannedBeds: 20, lead: 'Karin Sjö', sharing: 'Full' });
    const node = s().nodes.find((n) => n.id === id)!;
    expect(node).toMatchObject({ status: 'Standing up', plannedBeds: 20, accepts: ['Ward'], sync: 'Manual', lastSync: '14:40' });
    expect(node.acuteBeds).toMatchObject({ total: 0, free: { value: 0, source: 'Manual' } });
    s().setNodeStatus(id, 'Operational');
    const up = s().nodes.find((n) => n.id === id)!;
    expect(up.acuteBeds).toMatchObject({ total: 20, free: { value: 20, verified: 0, estimated: 20, source: 'Manual', lastConfirmed: '14:41' } });
    expect(s().log[s().log.length - 1].action).toBe('Changed node status – Vikby idrottshall – Operational');
    s().setNodeSharing(id, 'Capacity only');
    expect(s().log[s().log.length - 1].action).toBe('Changed node sharing – Vikby idrottshall – Capacity only');
  });

  it('Fältsjukhus Alfa set Operational gets 30 beds with 30 free', () => {
    s().setNodeStatus('falt-alfa', 'Operational');
    expect(s().nodes.find((n) => n.id === 'falt-alfa')!.acuteBeds).toMatchObject({ total: 30, free: { value: 30 } });
  });
});
