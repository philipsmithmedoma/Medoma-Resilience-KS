import { useState } from 'react';
import type { Incident, TaskStatus } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT, TASK_STATUSES } from '@/data/vocab';
import { areasOf } from '@/lib/incident';
import { StatusGlyph } from '@/components/StatusGlyph';
import { RolePill, TextPill } from '@/components/RolePill';
import { StaffSelect } from '@/components/StaffSelect';

function nextTaskStatus(status: TaskStatus): TaskStatus {
  const i = TASK_STATUSES.indexOf(status);
  return TASK_STATUSES[(i + 1) % TASK_STATUSES.length];
}

/** SPEC.md § 6.2.3 Tasks: grouped by area in playbook order; status glyph cycles; Assign opens a staff select. */
export function TasksTab({ incident }: { incident: Incident }) {
  const staff = useStore((s) => s.staff);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const assignTask = useStore((s) => s.assignTask);
  const [assigning, setAssigning] = useState<string | null>(null);
  const areas = areasOf(incident);

  return (
    <div className="space-y-8">
      {areas.map((area) => {
        const tasks = incident.tasks.filter((t) => t.area === area);
        return (
          <section key={area}>
            <h2 className="mb-2 text-heading">
              {area} <span className="font-normal text-text-secondary">({tasks.length})</span>
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {tasks.map((t) => {
                const owner = staff.find((s) => s.name === t.owner);
                return (
                  <li key={t.id} className="flex min-h-10 items-center gap-3 py-1.5">
                    <button
                      type="button"
                      aria-label={`${t.title}: ${t.status}. Change status`}
                      title={t.status}
                      onClick={() => setTaskStatus(t.id, nextTaskStatus(t.status))}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-bg-muted"
                    >
                      <StatusGlyph status={t.status} />
                    </button>
                    <span className="min-w-0 flex-1">{t.title}</span>
                    <TextPill>{t.ownerRole}</TextPill>
                    {owner ? (
                      <span className="flex items-center gap-2 text-small text-text-secondary">
                        {owner.name}
                        <RolePill profession={owner.profession} />
                      </span>
                    ) : null}
                    <span className="w-14 text-right tabular text-text-secondary" title={INCIDENT.due(t.due)}>
                      {t.due}
                    </span>
                    {assigning === t.id ? (
                      <StaffSelect
                        className="w-56"
                        value={t.owner}
                        ariaLabel={`Assign ${t.title}`}
                        autoOpen
                        onChange={(name) => {
                          assignTask(t.id, name);
                          setAssigning(null);
                        }}
                      />
                    ) : (
                      <button type="button" className="w-14 text-right text-primary hover:text-primary-hover hover:underline" onClick={() => setAssigning(t.id)}>
                        {INCIDENT.assign}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
