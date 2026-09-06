import { Fragment, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import type { Playbook } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT } from '@/data/vocab';
import { formatOffset } from '@/lib/time';
import { SectionHeading } from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivateDialog } from './ActivateDialog';

/** SPEC.md § 6.2.1 – Playbooks table with expandable rows and an Activate button per row. */
export function PlaybooksTable() {
  const playbooks = useStore((s) => s.playbooks);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activating, setActivating] = useState<Playbook | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section>
      <SectionHeading>{INCIDENT.playbooks}</SectionHeading>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{INCIDENT.columns.name}</TableHead>
            <TableHead>{INCIDENT.columns.level}</TableHead>
            <TableHead>{INCIDENT.columns.trigger}</TableHead>
            <TableHead className="text-right">{INCIDENT.columns.roles}</TableHead>
            <TableHead className="text-right">{INCIDENT.columns.tasks}</TableHead>
            <TableHead className="text-right">{INCIDENT.columns.channels}</TableHead>
            <TableHead className="text-right">{INCIDENT.columns.targets}</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {playbooks.map((p) => {
            const open = expanded.has(p.id);
            return (
              <Fragment key={p.id}>
                <TableRow>
                  <TableCell>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={`${open ? 'Collapse' : 'Expand'} ${p.name}`}
                      onClick={() => toggle(p.id)}
                      className="flex size-6 items-center justify-center rounded text-text-secondary hover:bg-bg-muted"
                    >
                      {open ? <ChevronDownIcon className="size-4" strokeWidth={1.5} /> : <ChevronRightIcon className="size-4" strokeWidth={1.5} />}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.level ?? ''}</TableCell>
                  <TableCell className="whitespace-normal">{p.trigger}</TableCell>
                  <TableCell className="text-right tabular">{p.roles.length}</TableCell>
                  <TableCell className="text-right tabular">{p.tasks.length}</TableCell>
                  <TableCell className="text-right tabular">{p.channels.length}</TableCell>
                  <TableCell className="text-right tabular">{p.targets.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => setActivating(p)}>
                      {INCIDENT.activate}
                    </Button>
                  </TableCell>
                </TableRow>
                {open ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell />
                    <TableCell colSpan={8} className="whitespace-normal py-3">
                      <p className="mb-3 text-text-secondary">{p.summary}</p>
                      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8">
                        <div>
                          <h4 className="mb-1 text-small text-text-secondary">{INCIDENT.columns.tasks}</h4>
                          <ul className="divide-y divide-border">
                            {p.tasks.map((t) => (
                              <li key={t.title} className="grid grid-cols-[180px_minmax(0,1fr)_160px_64px] gap-3 py-1.5 text-body">
                                <span className="text-text-secondary">{t.area}</span>
                                <span>{t.title}</span>
                                <span className="text-text-secondary">{t.ownerRole}</span>
                                <span className="text-right tabular">{formatOffset(t.dueOffsetMin)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="mb-1 text-small text-text-secondary">{INCIDENT.columns.targets}</h4>
                          <ul className="divide-y divide-border">
                            {p.targets.map((t) => (
                              <li key={t.label} className="flex justify-between gap-3 py-1.5 text-body">
                                <span>{t.label}</span>
                                <span className="tabular">
                                  {t.target} {t.unit}, {formatOffset(t.withinMin)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      <ActivateDialog playbook={activating} onOpenChange={(open) => !open && setActivating(null)} />
    </section>
  );
}
