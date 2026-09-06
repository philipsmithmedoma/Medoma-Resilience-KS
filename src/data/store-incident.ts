// Incident actions – SPEC.md § 6.2. Mixed into the store as a slice.
import type { StateCreator } from 'zustand';
import type { AppStore } from './store';
import type { IncidentTask, Message, TaskStatus } from './types';
import { CURRENT_USER, INCIDENT, SYSTEM_ACTOR } from './vocab';
import { buildIncident } from '@/lib/incident';
import { formatClock } from '@/lib/time';

export interface IncidentActions {
  activatePlaybook: (playbookId: string, commander: string, note?: string) => void;
  closeIncident: () => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  assignTask: (taskId: string, owner: string) => void;
  assignRole: (role: string, person: string) => void;
  addTask: (input: { title: string; area: string; ownerRole: string; dueInMin: number }) => void;
  sendChannelMessage: (channelId: string, text: string) => void;
}

export const createIncidentSlice: StateCreator<AppStore, [], [], IncidentActions> = (set, get) => ({
  activatePlaybook: (playbookId, commander, note) => {
    const { playbooks, clock, nextId, logEntry, setEhrOutage } = get();
    const playbook = playbooks.find((p) => p.id === playbookId);
    if (!playbook || get().incident) return;
    const incident = buildIncident({ playbook, clock, commander, activatedBy: CURRENT_USER.name, note, nextId });
    const logStartId = logEntry(INCIDENT.audit.activated(playbook.name), playbook.name, note?.trim() || undefined);
    incident.logStartId = logStartId;
    set({ incident });
    for (const t of incident.tasks) logEntry(INCIDENT.audit.createdTask(t.title), t.area, `${t.ownerRole}, due ${t.due}`, SYSTEM_ACTOR);
    for (const c of incident.channels) logEntry(INCIDENT.audit.openedChannel(c.name), playbook.name, c.memberRoles.join(', '), SYSTEM_ACTOR);
    if (playbook.setsEhrOutage) setEhrOutage(true);
  },

  closeIncident: () => {
    const { incident, logEntry, setEhrOutage } = get();
    if (!incident) return;
    logEntry(INCIDENT.audit.closed, incident.name);
    const { log, clock } = get();
    const start = incident.logStartId ? log.findIndex((e) => e.id === incident.logStartId) : log.length;
    const slice = log.slice(Math.max(0, start));
    set((s) => ({ incident: null, closedIncidents: [...s.closedIncidents, { incident, closedAt: formatClock(clock - 1), log: slice }] }));
    if (incident.setsEhrOutage) setEhrOutage(false);
  },

  setTaskStatus: (taskId, status) => {
    const { incident, logEntry } = get();
    const task = incident?.tasks.find((t) => t.id === taskId);
    if (!incident || !task) return;
    set({ incident: { ...incident, tasks: incident.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) } });
    logEntry(INCIDENT.audit.taskStatus(task.title, status), task.title, task.area);
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
    const commander = role === 'Incident commander' ? person : incident.commander;
    set({ incident: { ...incident, commander, roles: { ...incident.roles, [role]: person } } });
    logEntry(INCIDENT.audit.changedRole(role, person), role, incident.name);
  },

  addTask: ({ title, area, ownerRole, dueInMin }) => {
    const { incident, clock, nextId, logEntry } = get();
    if (!incident) return;
    const task: IncidentTask = { id: nextId('task'), title, area, ownerRole, dueOffsetMin: dueInMin, status: 'Not started', due: formatClock(clock + dueInMin) };
    set({ incident: { ...incident, tasks: [...incident.tasks, task] } });
    logEntry(INCIDENT.audit.addedTask, title, `${area}, ${ownerRole}, due ${task.due}`);
  },

  sendChannelMessage: (channelId, text) => {
    const { incident, clock, nextId, logEntry } = get();
    const channel = incident?.channels.find((c) => c.id === channelId);
    if (!incident || !channel || !text.trim()) return;
    const message: Message = { id: nextId('msg'), author: CURRENT_USER.name, role: CURRENT_USER.role, at: formatClock(clock), text: text.trim(), nodeId: 'vikby' };
    set({
      incident: {
        ...incident,
        channels: incident.channels.map((c) => (c.id === channelId ? { ...c, messages: [...c.messages, message] } : c)),
      },
    });
    logEntry(INCIDENT.audit.sentMessage(channel.name), channel.name, message.text);
  },
});
