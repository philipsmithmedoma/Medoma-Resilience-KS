// Building an incident from a playbook – SPEC.md § 6.6.
import type { BeredskapsLage, Channel, Incident, IncidentTask, Playbook } from '@/data/types';
import { COMMANDER_ROLE, INCIDENT, LSSL_CHANNEL, SYSTEM_ACTOR } from '@/data/vocab';
import { formatClock } from './time';

/**
 * Member roles of a channel: LSSL → every role; otherwise the Sjukvårdsledare plus the owner roles of tasks
 * whose area's first word appears in the channel name (see DECISIONS.md).
 */
export function channelRoles(playbook: Playbook, channelName: string): string[] {
  if (channelName === LSSL_CHANNEL) return [...playbook.roles];
  const name = channelName.toLowerCase();
  const areas = new Set(playbook.tasks.map((t) => t.area));
  const matching = [...areas].filter((a) => name.includes(a.toLowerCase().split(' ')[0]));
  const roles = new Set<string>([COMMANDER_ROLE]);
  for (const t of playbook.tasks) if (matching.includes(t.area)) roles.add(t.ownerRole);
  return playbook.roles.filter((r) => roles.has(r));
}

export function areasOf(playbook: Pick<Playbook, 'tasks'>): string[] {
  return [...new Set(playbook.tasks.map((t) => t.area))];
}

interface BuildInput {
  playbook: Playbook;
  clock: number;
  commander: string;
  activatedBy: string;
  lage: BeredskapsLage;
  note?: string;
  nextId: (prefix: string) => string;
}

export function buildIncident({ playbook, clock, commander, activatedBy, lage, note, nextId }: BuildInput): Incident {
  const at = formatClock(clock);
  const tasks: IncidentTask[] = playbook.tasks.map((t) => ({
    ...t,
    id: nextId('task'),
    status: 'Not started',
    due: formatClock(clock + t.dueOffsetMin),
  }));
  const channels: Channel[] = playbook.channels.map((name) => {
    const memberRoles = channelRoles(playbook, name);
    const text = name === LSSL_CHANNEL ? INCIDENT.systemActivated(playbook.name, at, lage) : INCIDENT.systemChannelOpened(at, memberRoles);
    return {
      id: nextId('channel'),
      name,
      memberRoles,
      messages: [{ id: nextId('msg'), author: SYSTEM_ACTOR, role: SYSTEM_ACTOR, at, text }],
    };
  });
  const roles: Record<string, string | undefined> = {};
  for (const r of playbook.roles) roles[r] = r === COMMANDER_ROLE ? commander : undefined;
  return {
    playbookId: playbook.id,
    playbookKey: playbook.key,
    name: playbook.name,
    lage,
    activatedAt: at,
    activatedBy,
    commander,
    roles,
    tasks,
    channels,
    note: note?.trim() || undefined,
    targets: playbook.targets.map((t) => ({ label: t.label, target: t.target, unit: t.unit, measure: t.measure, withinUnit: t.withinUnit, dueAt: formatClock(clock + t.withinMin) })),
    setsEhrOutage: playbook.setsEhrOutage,
  };
}

export function taskCounts(tasks: IncidentTask[]): { notStarted: number; inProgress: number; done: number; total: number } {
  return {
    notStarted: tasks.filter((t) => t.status === 'Not started').length,
    inProgress: tasks.filter((t) => t.status === 'In progress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
    total: tasks.length,
  };
}
