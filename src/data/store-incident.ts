// Incident actions – SPEC.md § 6.6. Mixed into the store as a slice.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { BeredskapsLage, IncidentTask, Message, TaskStatus } from './types';
import { COMMANDER_ROLE, CURRENT_USER, INCIDENT, KAROLINSKA_ID, SYSTEM_ACTOR, TASK_STATUS_LABELS } from './vocab';
import { buildIncident } from '@/lib/incident';
import { formatClock } from '@/lib/time';

export interface IncidentActions {
  activatePlaybook: (playbookId: string, commander: string, lage: BeredskapsLage, note?: string) => void;
  closeIncident: () => void;
  setLage: (lage: BeredskapsLage) => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  markTaskDoneByTitle: (title: string) => void;
  assignTask: (taskId: string, owner: string) => void;
  assignRole: (role: string, person: string) => void;
  addTask: (input: { title: string; area: string; ownerRole: string; dueInMin: number }) => void;
  sendChannelMessage: (channelId: string, text: string) => void;
}

export const createIncidentSlice: StateCreator<AppStore, [], [], IncidentActions> = (set, get) => ({
  activatePlaybook: (playbookId, commander, lage, note) => {
    const { playbooks, clock, nextId, logEntry, setEhrOutage } = get();
    const playbook = playbooks.find((p) => p.id === playbookId);
    if (!playbook || get().incident) return;
    const incident = buildIncident({ playbook, clock, commander, activatedBy: CURRENT_USER.name, lage, note, nextId });
    const logStartId = logEntry(INCIDENT.audit.activated(playbook.name), playbook.name, [lage, note?.trim()].filter(Boolean).join('. '));
    incident.logStartId = logStartId;
    set({ incident });
    for (const t of incident.tasks) logEntry(INCIDENT.audit.createdTask(t.title), t.area, INCIDENT.audit.dueDetail(t.ownerRole, t.due), SYSTEM_ACTOR);
    for (const c of incident.channels) logEntry(INCIDENT.audit.openedChannel(c.name), playbook.name, c.memberRoles.join(', '), SYSTEM_ACTOR);
    if (playbook.setsEhrOutage) setEhrOutage(true, playbook.name);
  },

  closeIncident: () => {
    const { incident, logEntry, setEhrOutage } = get();
    if (!incident) return;
    logEntry(INCIDENT.audit.closed, incident.name);
    const { log, clock } = get();
    const start = incident.logStartId ? log.findIndex((e) => e.id === incident.logStartId) : log.length;
    const slice = log.slice(Math.max(0, start));
    set((s) => ({ incident: null, closedIncidents: [...s.closedIncidents, { incident, closedAt: formatClock(clock - 1), log: slice }] }));
    if (incident.setsEhrOutage) setEhrOutage(false, incident.name);
  },

  setLage: (lage) => {
    const { incident, logEntry } = get();
    if (!incident || incident.lage === lage) return;
    set({ incident: { ...incident, lage } });
    logEntry(INCIDENT.audit.changedLage(lage), incident.name, lage);
  },

  setTaskStatus: (taskId, status) => {
    const { incident, logEntry } = get();
    const task = incident?.tasks.find((t) => t.id === taskId);
    if (!incident || !task) return;
    set({ incident: { ...incident, tasks: incident.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) } });
    logEntry(INCIDENT.audit.taskStatus(task.title, TASK_STATUS_LABELS[status]), task.title, task.area);
  },

  markTaskDoneByTitle: (title) => {
    const { incident, setTaskStatus } = get();
    const task = incident?.tasks.find((t) => t.title === title);
    if (task && task.status !== 'Done') setTaskStatus(task.id, 'Done');
  },

  assignTask: (taskId, owner) => {
    const { incident, logEntry } = get();
    const task = incident?.tasks.find((t) => t.id === taskId);
    if (!incident || !task) return;
    set({ incident: { ...incident, tasks: incident.tasks.map((t) => (t.id === taskId ? { ...t, owner } : t)) } });
    logEntry(INCIDENT.audit.assignedTask(task.title, owner), task.title, task.ownerRole);
  },

  assignRole: (role, person) => {
    const { incident, logEntry } = get();
    if (!incident) return;
    const commander = role === COMMANDER_ROLE ? person : incident.commander;
    set({ incident: { ...incident, commander, roles: { ...incident.roles, [role]: person } } });
    logEntry(INCIDENT.audit.changedRole(role, person), role, incident.name);
  },

  addTask: ({ title, area, ownerRole, dueInMin }) => {
    const { incident, clock, nextId, logEntry } = get();
    if (!incident) return;
    const task: IncidentTask = { id: nextId('task'), title, area, ownerRole, dueOffsetMin: dueInMin, status: 'Not started', due: formatClock(clock + dueInMin) };
    set({ incident: { ...incident, tasks: [...incident.tasks, task] } });
    logEntry(INCIDENT.audit.addedTask, title, `${area}, ${INCIDENT.audit.dueDetail(ownerRole, task.due)}`);
  },

  sendChannelMessage: (channelId, text) => {
    const { incident, clock, nextId, logEntry } = get();
    const channel = incident?.channels.find((c) => c.id === channelId);
    if (!incident || !channel || !text.trim()) return;
    const message: Message = { id: nextId('msg'), author: CURRENT_USER.name, role: CURRENT_USER.role, at: formatClock(clock), text: text.trim(), nodeId: KAROLINSKA_ID };
    set({
      incident: {
        ...incident,
        channels: incident.channels.map((c) => (c.id === channelId ? { ...c, messages: [...c.messages, message] } : c)),
      },
    });
    logEntry(INCIDENT.audit.sentMessage(channel.name), channel.name, message.text);
  },
});
