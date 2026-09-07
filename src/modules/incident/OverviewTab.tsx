import { useState } from 'react';
import type { Incident } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT, LABELS } from '@/data/vocab';
import { fmt } from '@/lib/format';
import { measureTarget, targetProgress } from '@/lib/targets';
import { taskCounts } from '@/lib/incident';
import { SectionHeading } from '@/components/PageTitle';
import { KeyValueTable } from '@/components/KeyValueTable';
import { RolePill } from '@/components/RolePill';
import { StaffSelect } from '@/components/StaffSelect';
import { Progress } from '@/components/ui/progress';
import { useTargetInputs } from '@/modules/capacity/useTargetInputs';

/** Översikt: targets as progress rows, roles table with Ändra, task summary line. */
export function OverviewTab({ incident }: { incident: Incident }) {
  const staff = useStore((s) => s.staff);
  const assignRole = useStore((s) => s.assignRole);
  const [editing, setEditing] = useState<string | null>(null);
  const inputs = useTargetInputs();
  const counts = taskCounts(incident.tasks);

  return (
    <div className="grid grid-cols-2 gap-8">
      <section>
        <SectionHeading>{INCIDENT.targets}</SectionHeading>
        <ul className="space-y-4">
          {incident.targets.map((t) => {
            const current = measureTarget(t.measure, inputs);
            const due = t.withinUnit === 'dygn' ? INCIDENT.dueDay(fmt(10)) : INCIDENT.due(t.dueAt);
            return (
              <li key={t.label}>
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <span>{t.label}</span>
                  <span className="tabular text-text-secondary">
                    {fmt(current)} / {fmt(t.target)} {t.unit}, {due.toLowerCase()}
                  </span>
                </div>
                <Progress value={targetProgress(current, t.target)} aria-label={LABELS.ariaProgress(t.label)} />
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-text-secondary">{INCIDENT.summary(counts.notStarted, counts.inProgress, counts.done)}</p>
      </section>
      <section>
        <SectionHeading>{INCIDENT.roles}</SectionHeading>
        <KeyValueTable
          rows={Object.entries(incident.roles).map(([role, person]) => {
            const member = staff.find((s) => s.name === person);
            return {
              label: role,
              value:
                editing === role ? (
                  <StaffSelect
                    value={person}
                    ariaLabel={`${INCIDENT.assign} ${role}`}
                    autoOpen
                    onChange={(name) => {
                      assignRole(role, name);
                      setEditing(null);
                    }}
                  />
                ) : person ? (
                  <span className="flex items-center gap-2">
                    {person}
                    {member ? <RolePill profession={member.profession} /> : null}
                  </span>
                ) : (
                  <span className="text-text-muted">{INCIDENT.unassigned}</span>
                ),
              action:
                editing === role ? null : (
                  <button type="button" className="text-primary-text hover:text-primary-hover hover:underline" onClick={() => setEditing(role)}>
                    {LABELS.change}
                  </button>
                ),
            };
          })}
        />
      </section>
    </div>
  );
}
