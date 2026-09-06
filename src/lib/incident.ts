// Building an incident from a playbook – SPEC.md § 6.2.2.
import type { Channel, Incident, IncidentTask, Playbook } from '@/data/types';
import { INCIDENT } from '@/data/vocab';
import { formatClock } from './time';

export const COMMANDER_ROLE = 'Incident commander';

/**
 * Member roles of a channel: Incident command → every role; otherwise the Incident commander plus the
 * owner roles of tasks whose area name appears in the channel name (see DECISIONS.md).
 */
export function channelRoles(playbook: Playbook, channelName: string): string[] {
  if (channelName === 'Incident command') return [...playbook.roles];
  const name = channelName.toLowerCase();
  const areas = new Set(playbook.tasks.map((t) => t.area));
  const matching = [...areas].filter((a) => name.includes(a.toLowerCase()));
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
  note?: string;
  nextId: (prefix: string) => string;
}

export function buildIncident({ playbook, clock, commander, activatedBy, note, nextId }: BuildInput): Incident {
  const at = formatClock(clock);
  const tasks: IncidentTask[] = playbook.tasks.map((t) => ({
    ...t,
    id: nextId('task'),
    status: 'Not started',
    due: formatClock(clock + t.dueOffsetMin),
  }));
  const channels: Channel[] = playbook.channels.map((name) => {
    const memberRoles = channelRoles(playbook, name);
    const text = name === 'Incident command' ? INCIDENT.systemActivated(playbook.name, at) : INCIDENT.systemChannelOpened(at, memberRoles);
    return {
      id: nextId('channel'),
      name,
      memberRoles,
      messages: [{ id: nextId('msg'), author: 'System', role: 'System', at, text }],
    };
  });
  const roles: Record<string, string | undefined> = {};
  for (const r of playbook.roles) roles[r] = r === COMMANDER_ROLE ? commander : undefined;
  return {
    playbookId: playbook.id,
    name: playbook.name,
    level: playbook.level,
    activatedAt: at,
    activatedBy,
    commander,
    roles,
    tasks,
    channels,
    note: note?.trim() || undefined,
    targets: playbook.targets.map((t) => ({ label: t.label, target: t.target, unit: t.unit, measure: t.measure, dueAt: formatClock(clock + t.withinMin) })),
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
