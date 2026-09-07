import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';

const s = () => useStore.getState();
const resource = (nodeId: string, name: string) => s().resources.find((r) => r.nodeId === nodeId && r.name === name)!;
const node = (id: string) => s().nodes.find((n) => n.id === id)!;

describe('evacuation rules (SPEC.md § 6.7)', () => {
  beforeEach(() => s().reset());

  it('walks a Stabil patient from Huddinge to SÖS through the chain and moves one Transportambulans through reserved, in use and back', () => {
    const p = s().patients.find((x) => x.nodeId === 'huddinge' && x.stability === 'Stable' && x.transport === 'Walking')!;
    s().planMove(p.id, 'sos');
    expect(node('sos').beds!.free.value).toBe(13);
    s().acceptMove(p.id);
    const bus = resource('ambulans', 'Transportambulans');
    s().assignTransport(p.id, bus.id);
    expect(resource('ambulans', 'Transportambulans')).toMatchObject({ available: 5, reserved: 1, inUse: 14 });
    s().markDeparted(p.id);
    expect(resource('ambulans', 'Transportambulans')).toMatchObject({ available: 5, reserved: 0, inUse: 15 });
    s().markArrived(p.id);
    expect(resource('ambulans', 'Transportambulans')).toMatchObject({ available: 6, reserved: 0, inUse: 14 });
    s().markHandedOver(p.id);
    expect(s().patients.find((x) => x.id === p.id)!.move?.status).toBe('Handed over');
    const actions = s().log.slice(7).map((e) => e.action);
    expect(actions).toEqual([
      `Planerade flytt – ${p.familyName}, ${p.givenName} – till Södersjukhuset`,
      `Accepterad vid destination – ${p.familyName}, ${p.givenName}`,
      `Tilldelade transport – ${p.familyName}, ${p.givenName} – Transportambulans`,
      `Avrest – ${p.familyName}, ${p.givenName}`,
      `Ankommen – ${p.familyName}, ${p.givenName} – Södersjukhuset`,
      `Överlämnad – ${p.familyName}, ${p.givenName} – Södersjukhuset`,
    ]);
  });

  it('a Kritisk patient takes an IVA bed at the other site; cancelling gives it back, cancelling after departure is refused', () => {
    const p = s().patients.find((x) => x.nodeId === 'huddinge' && x.stability === 'Critical' && x.transport === 'Intensive care transport')!;
    s().planMove(p.id, 'solna');
    expect(node('solna').intensiveCare!.free.value).toBe(1);
    s().cancelMove(p.id);
    expect(node('solna').intensiveCare!.free.value).toBe(2);
    s().planMove(p.id, 'solna');
    s().acceptMove(p.id);
    s().assignTransport(p.id, resource('ambulans', 'IVA-ambulans').id);
    s().markDeparted(p.id);
    s().cancelMove(p.id);
    expect(s().patients.find((x) => x.id === p.id)!.move?.status).toBe('Departed');
  });

  it('suggestions take no counts until accepted; accepting logs an authorisation by Eva Lind', () => {
    const r = s().suggestPlan('huddinge');
    expect(r.suggested + r.unplaced).toBe(40);
    expect(node('asih').beds!.free.value).toBe(120);
    expect(s().log[s().log.length - 1]).toMatchObject({ actor: 'System', action: `Föreslog flyttar – ${r.suggested} patienter` });
    const suggested = s().patients.find((x) => x.move?.suggested && x.move.destinationId === 'asih')!;
    s().acceptSuggestion(suggested.id);
    expect(node('asih').beds!.free.value).toBe(119);
    expect(s().log[s().log.length - 1]).toMatchObject({ actor: 'Eva Lind', action: `Godkände föreslagen flytt – ${suggested.familyName}, ${suggested.givenName} – till ASIH – avancerad sjukvård i hemmet` });
    s().clearSuggestions('huddinge');
    expect(s().patients.filter((x) => x.move?.suggested)).toHaveLength(0);
    expect(s().patients.filter((x) => x.move)).toHaveLength(1);
  });
});

describe('incident actions (SPEC.md § 6.6)', () => {
  beforeEach(() => s().reset());

  it('activating PB1 creates 8 roles, 15 tasks, 5 channels, 4 targets with Förstärkningsläge and logs each object', () => {
    s().activatePlaybook('pb1', 'Eva Lind', 'Förstärkningsläge', 'Bussolycka på E4');
    const inc = s().incident!;
    expect(Object.keys(inc.roles)).toHaveLength(8);
    expect(inc.tasks).toHaveLength(15);
    expect(inc.channels).toHaveLength(5);
    expect(inc.targets).toHaveLength(4);
    expect(inc.lage).toBe('Förstärkningsläge');
    expect(inc.commander).toBe('Eva Lind');
    expect(inc.tasks[0]).toMatchObject({ title: { sv: 'Upprätta triagezoner röd/gul/grön', en: 'Set up triage zones red/yellow/green' }, status: 'Not started', due: '14:55' });
    expect(inc.channels[0].messages[0].text).toBe('Incident Allvarlig händelse: masskada aktiverad 14:40. Förstärkningsläge.');
    expect(inc.channels[1].memberRoles.map((r) => r.sv)).toEqual(['Sjukvårdsledare LSSL', 'Medicinskt ansvarig', 'Akutansvarig']);
    expect(inc.channels[4].memberRoles.map((r) => r.sv)).toContain('Kommunikationsansvarig (KiB)');
    const added = s().log.slice(7);
    expect(added[0]).toMatchObject({ actor: 'Eva Lind', action: 'Aktiverade incident – Allvarlig händelse: masskada', detail: 'Förstärkningsläge. Bussolycka på E4' });
    expect(added.filter((e) => e.action.startsWith('Skapade uppgift')).length).toBe(15);
    expect(added.filter((e) => e.action.startsWith('Öppnade kanal')).length).toBe(5);
  });

  it('changing the beredskapsläge is logged; PB2 turns the outage on and closing turns it off', () => {
    s().activatePlaybook('pb2', 'Eva Lind', 'Stabsläge');
    expect(s().ehrOutage).toBe(true);
    s().setLage('Katastrofläge');
    expect(s().incident!.lage).toBe('Katastrofläge');
    expect(s().log[s().log.length - 1].action).toBe('Ändrade beredskapsläge – Katastrofläge');
    s().closeIncident();
    expect(s().incident).toBeNull();
    expect(s().ehrOutage).toBe(false);
    expect(s().closedIncidents[0].log[0].action).toBe('Aktiverade incident – Journalsystem otillgängligt');
  });

  it('task status cycling, adding a task, assigning roles and sending messages log Swedish entries', () => {
    s().activatePlaybook('pb4', 'Eva Lind', 'Förstärkningsläge');
    const task = s().incident!.tasks[0];
    s().setTaskStatus(task.id, 'Done');
    expect(s().log[s().log.length - 1].action).toBe('Ändrade uppgiftsstatus – Klassificera patienter för flytt – Klar');
    s().addTask({ title: 'Kontrollera helikopterplattan', area: 'Logistik och transport', ownerRole: 'Logistikansvarig', dueInMin: 20 });
    expect(s().incident!.tasks).toHaveLength(5);
    s().assignRole('Medicinskt ansvarig', 'Johan Ek');
    const ch = s().incident!.channels[0];
    s().sendChannelMessage(ch.id, 'Alla team rapporterar.');
    expect(s().log.slice(-3).map((e) => e.action)).toEqual(['Lade till uppgift', 'Ändrade roll – Medicinskt ansvarig – Johan Ek', 'Skickade meddelande – LSSL']);
  });
});
