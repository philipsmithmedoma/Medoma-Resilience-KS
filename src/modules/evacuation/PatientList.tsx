import { useMemo, useState } from 'react';
import type { Patient, Stability, TransportNeed } from '@/data/types';
import { EVAC, STABILITIES, TRANSPORT_NEEDS } from '@/data/vocab';
import { isInTransit, patientName } from '@/lib/evacuation';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/Chip';
import { Button } from '@/components/ui/button';

type StatusFilter = (typeof EVAC.statusFilters)[number];

function statusMatches(p: Patient, f: StatusFilter): boolean {
  const m = p.move;
  switch (f) {
    case 'All':
      return true;
    case 'Not planned':
      return !m || m.suggested;
    case 'Planned':
      return Boolean(m && !m.suggested && (m.status === 'Planned' || m.status === 'Accepted'));
    case 'In transit':
      return Boolean(m && !m.suggested && isInTransit(m.status));
    case 'Arrived':
      return Boolean(m && !m.suggested && (m.status === 'Arrived' || m.status === 'Handed over'));
  }
}

function FilterRow<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="mr-1 w-16 text-small text-text-secondary">{label}</span>
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={cn(
              'h-[22px] rounded-full border px-2 text-small transition-colors duration-150',
              active ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text hover:bg-bg-muted',
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

interface PatientListProps {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** SPEC.md § 6.3 left pane – filter chips, grouped by ward, one row per patient. */
export function PatientList({ patients, selectedId, onSelect }: PatientListProps) {
  const [stability, setStability] = useState<'All' | Stability>('All');
  const [transport, setTransport] = useState<'All' | TransportNeed>('All');
  const [status, setStatus] = useState<StatusFilter>('All');

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) => (stability === 'All' || p.stability === stability) && (transport === 'All' || p.transport === transport) && statusMatches(p, status),
      ),
    [patients, stability, transport, status],
  );
  const wards = [...new Set(patients.map((p) => p.ward))];
  const clear = () => {
    setStability('All');
    setTransport('All');
    setStatus('All');
  };

  return (
    <div>
      <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-white px-4 py-3">
        <h2 className="text-heading">{EVAC.patients(filtered.length)}</h2>
        <FilterRow label={EVAC.filters.stability} options={['All', ...STABILITIES] as const} value={stability} onChange={setStability} />
        <FilterRow label={EVAC.filters.transport} options={['All', ...TRANSPORT_NEEDS] as const} value={transport} onChange={setTransport} />
        <FilterRow label={EVAC.filters.status} options={EVAC.statusFilters} value={status} onChange={setStatus} />
      </div>
      {filtered.length === 0 ? (
        <div className="space-y-2 px-4 py-6">
          <p>{EVAC.noMatch}</p>
          <Button variant="link" onClick={clear}>
            {EVAC.clearFilters}
          </Button>
        </div>
      ) : (
        wards.map((ward) => {
          const rows = filtered.filter((p) => p.ward === ward);
          if (rows.length === 0) return null;
          return (
            <section key={ward}>
              <h3 className="bg-bg-muted px-4 py-1.5 text-body font-medium">
                {ward} <span className="font-normal text-text-secondary">({rows.length})</span>
              </h3>
              <ul>
                {rows.map((p) => {
                  const selected = p.id === selectedId;
                  return (
                    <li key={p.id} className="border-b border-border">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onSelect(p.id)}
                        className={cn('flex w-full flex-col gap-1 px-4 py-2 text-left hover:bg-bg-muted', selected && 'bg-bg-muted')}
                      >
                        <span className="flex w-full items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {patientName(p)} <span className="font-normal text-text-secondary tabular">{p.age}</span>
                          </span>
                          <StatusChip status={p.stability} />
                        </span>
                        <span className="flex w-full items-center gap-2 text-small">
                          <span className="text-text-secondary">{p.transport}</span>
                          {p.equipment.length ? <span className="text-text-muted">{p.equipment.join(', ')}</span> : null}
                          <span className="ml-auto">
                            {p.move ? (
                              p.move.suggested ? (
                                <StatusChip status={EVAC.suggested} />
                              ) : (
                                <StatusChip status={p.move.status} />
                              )
                            ) : (
                              <span className="text-text-muted">{EVAC.notPlanned}</span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
