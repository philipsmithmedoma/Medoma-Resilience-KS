import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';

const s = () => useStore.getState();
const resource = (nodeId: string, name: string) => s().resources.find((r) => r.nodeId === nodeId && r.name === name)!;
const node = (id: string) => s().nodes.find((n) => n.id === id)!;

describe('evacuation rules (SPEC.md § 6.3)', () => {
  beforeEach(() => s().reset());

  it('walks a Stable patient Plan → Handed over and moves one vehicle unit through reserved, in use and back', () => {
    const p = s().patients.find((x) => x.stability === 'Stable' && x.transport === 'Walking')!;
    s().planMove(p.id, 'ekhaga');
    expect(node('ekhaga').acuteBeds!.free.value).toBe(13);
    expect(s().patients.find((x) => x.id === p.id)!.move).toMatchObject({ destinationId: 'ekhaga', status: 'Planned', suggested: false });
    s().acceptMove(p.id);
    const taxi = resource('vikby', 'Taxi contract');
    s().assignTransport(p.id, taxi.id);
    expect(resource('vikby', 'Taxi contract')).toMatchObject({ available: 3, reserved: 1, inUse: 0 });
    s().markDeparted(p.id);
    expect(resource('vikby', 'Taxi contract')).toMatchObject({ available: 3, reserved: 0, inUse: 1 });
    s().markArrived(p.id);
    expect(resource('vikby', 'Taxi contract')).toMatchObject({ available: 4, reserved: 0, inUse: 0 });
    s().markHandedOver(p.id);
    expect(s().patients.find((x) => x.id === p.id)!.move?.status).toBe('Handed over');
    const actions = s().log.slice(6).map((e) => e.action);
    expect(actions).toEqual([
      `Planned move – ${p.familyName}, ${p.givenName} – to Ekhaga vårdhubb`,
      `Accepted at destination – ${p.familyName}, ${p.givenName}`,
      `Assigned transport – ${p.familyName}, ${p.givenName} – Taxi contract`,
      `Departed – ${p.familyName}, ${p.givenName}`,
      `Arrived – ${p.familyName}, ${p.givenName} – Ekhaga vårdhubb`,
      `Handed over – ${p.familyName}, ${p.givenName} – Ekhaga vårdhubb`,
    ]);
  });

  it('a Monitored patient to Ekhaga also takes a Patient monitor, and cancelling gives everything back', () => {
    const p = s().patients.find((x) => x.stability === 'Monitor')!;
    s().planMove(p.id, 'ekhaga');
    expect(resource('ekhaga', 'Patient monitor')).toMatchObject({ available: 3, reserved: 1 });
    expect(node('ekhaga').acuteBeds!.free.value).toBe(13);
    s().acceptMove(p.id);
    const amb = resource('vikby', 'Ambulance');
    s().assignTransport(p.id, amb.id);
    expect(resource('vikby', 'Ambulance')).toMatchObject({ available: 1, reserved: 1 });
    s().cancelMove(p.id);
    expect(resource('ekhaga', 'Patient monitor')).toMatchObject({ available: 4, reserved: 0 });
    expect(node('ekhaga').acuteBeds!.free.value).toBe(14);
    expect(resource('vikby', 'Ambulance')).toMatchObject({ available: 2, reserved: 0 });
    expect(s().patients.find((x) => x.id === p.id)!.move).toBeUndefined();
  });

  it('an Intensive patient takes intensive care at Sjöberga; cancelling is refused once departed', () => {
    const p = s().patients.find((x) => x.stability === 'Critical')!;
    s().planMove(p.id, 'sjoberga');
    expect(node('sjoberga').intensiveCare!.free.value).toBe(1);
    s().acceptMove(p.id);
    s().assignTransport(p.id, resource('vikby', 'Ambulance').id);
    s().markDeparted(p.id);
    s().cancelMove(p.id);
    expect(s().patients.find((x) => x.id === p.id)!.move?.status).toBe('Departed');
  });

  it('suggestions take no counts until accepted; accepting logs an authorisation by Eva Lind', () => {
    const r = s().suggestPlan();
    expect(r).toEqual({ suggested: 32, unplaced: 8 });
    expect(node('ekhaga').acuteBeds!.free.value).toBe(14);
    expect(s().log[s().log.length - 1]).toMatchObject({ actor: 'System', action: 'Suggested moves – 32 patients' });
    const suggested = s().patients.find((x) => x.move?.suggested && x.move.destinationId === 'ekhaga' && x.careLevel === 'Monitored')!;
    s().acceptSuggestion(suggested.id);
    expect(node('ekhaga').acuteBeds!.free.value).toBe(13);
    expect(resource('ekhaga', 'Patient monitor').available).toBe(3);
    expect(s().patients.find((x) => x.id === suggested.id)!.move).toMatchObject({ status: 'Planned', suggested: false });
    expect(s().log[s().log.length - 1]).toMatchObject({ actor: 'Eva Lind', action: `Authorised suggested move – ${suggested.familyName}, ${suggested.givenName} – to Ekhaga vårdhubb` });
    const other = s().patients.find((x) => x.move?.suggested)!;
    s().rejectSuggestion(other.id);
    expect(s().patients.find((x) => x.id === other.id)!.move).toBeUndefined();
    s().clearSuggestions();
    expect(s().patients.filter((x) => x.move?.suggested)).toHaveLength(0);
    expect(s().patients.filter((x) => x.move)).toHaveLength(1);
  });
});

describe('incident actions (SPEC.md § 6.2)', () => {
  beforeEach(() => s().reset());

  it('activating Mass casualty – Level 2 creates 6 roles, 15 tasks, 4 channels, 4 targets and logs each object', () => {
    s().activatePlaybook('mc-2', 'Eva Lind', 'Bus crash on E4');
    const inc = s().incident!;
    expect(Object.keys(inc.roles)).toHaveLength(6);
    expect(inc.tasks).toHaveLength(15);
    expect(inc.channels).toHaveLength(4);
    expect(inc.targets).toHaveLength(4);
    expect(inc.commander).toBe('Eva Lind');
    expect(inc.tasks[0]).toMatchObject({ title: 'Set up triage zones', status: 'Not started', due: '14:55' });
    expect(inc.targets[0].dueAt).toBe('15:10');
    expect(inc.channels[0].messages[0].text).toBe('Incident Mass casualty – Level 2 activated at 14:40.');
    expect(inc.channels[1].messages[0].text).toBe('Channel opened at 14:40 for Incident commander, Medical lead, Intensive care lead.');
    const added = s().log.slice(6);
    expect(added[0]).toMatchObject({ actor: 'Eva Lind', action: 'Activated incident – Mass casualty – Level 2', detail: 'Bus crash on E4' });
    expect(added.filter((e) => e.action.startsWith('Created task')).length).toBe(15);
    expect(added.filter((e) => e.action.startsWith('Opened channel')).length).toBe(4);
    expect(s().clock).toBe(14 * 60 + 40 + 20);
  });

  it('cycling a task status logs it and closing keeps the incident with its log slice', () => {
    s().activatePlaybook('mc-2', 'Eva Lind');
    const task = s().incident!.tasks[0];
    s().setTaskStatus(task.id, 'In progress');
    s().setTaskStatus(task.id, 'Done');
    expect(s().log[s().log.length - 1].action).toBe('Changed task status – Set up triage zones – Done');
    s().closeIncident();
    expect(s().incident).toBeNull();
    expect(s().closedIncidents).toHaveLength(1);
    const closed = s().closedIncidents[0];
    expect(closed.log[0].action).toBe('Activated incident – Mass casualty – Level 2');
    expect(closed.log[closed.log.length - 1].action).toBe('Closed incident');
    expect(closed.log).toHaveLength(1 + 15 + 4 + 2 + 1);
  });

  it('IT outage turns the EHR outage on and closing turns it off', () => {
    s().activatePlaybook('it-outage', 'Eva Lind');
    expect(s().ehrOutage).toBe(true);
    s().closeIncident();
    expect(s().ehrOutage).toBe(false);
  });

  it('adding a task, assigning roles and sending messages log entries', () => {
    s().activatePlaybook('mc-1', 'Eva Lind');
    s().addTask({ title: 'Check helipad', area: 'Incident command', ownerRole: 'Logistics lead', dueInMin: 20 });
    expect(s().incident!.tasks).toHaveLength(4);
    s().assignRole('Medical lead', 'Johan Ek');
    expect(s().incident!.roles['Medical lead']).toBe('Johan Ek');
    const ch = s().incident!.channels[0];
    s().sendChannelMessage(ch.id, 'All teams report in.');
    expect(s().incident!.channels[0].messages).toHaveLength(2);
    expect(s().log.slice(-3).map((e) => e.action)).toEqual(['Added task', 'Changed role – Medical lead – Johan Ek', 'Sent message – Incident command']);
  });
});
