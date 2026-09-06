import { useState } from 'react';
import type { Incident } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT, LABELS } from '@/data/vocab';
import { measureTarget, targetProgress } from '@/lib/targets';
import { taskCounts } from '@/lib/incident';
import { SectionHeading } from '@/components/PageTitle';
import { KeyValueTable } from '@/components/KeyValueTable';
import { RolePill } from '@/components/RolePill';
import { StaffSelect } from '@/components/StaffSelect';
import { Progress } from '@/components/ui/progress';

/** SPEC.md § 6.2.3 Overview: targets as progress rows, roles table with Change, task summary line. */
export function OverviewTab({ incident }: { incident: Incident }) {
  const patients = useStore((s) => s.patients);
  const capabilities = useStore((s) => s.capabilities);
  const nodes = useStore((s) => s.nodes);
  const staff = useStore((s) => s.staff);
  const assignRole = useStore((s) => s.assignRole);
  const [editing, setEditing] = useState<string | null>(null);
  const inputs = { incident, patients, capabilities, nodes };
  const counts = taskCounts(incident.tasks);

  return (
    <div className="grid grid-cols-2 gap-8">
      <section>
        <SectionHeading>{INCIDENT.targets}</SectionHeading>
        <ul className="space-y-4">
          {incident.targets.map((t) => {
            const current = measureTarget(t.measure, inputs);
            return (
              <li key={t.label}>
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <span>{t.label}</span>
                  <span className="tabular text-text-secondary">
                    {current} / {t.target} {t.unit}, {INCIDENT.due(t.dueAt).toLowerCase()}
                  </span>
                </div>
                <Progress value={targetProgress(current, t.target)} aria-label={`${t.label} progress`} />
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
                    ariaLabel={`Assign ${role}`}
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
                  <button type="button" className="text-primary hover:text-primary-hover hover:underline" onClick={() => setEditing(role)}>
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
