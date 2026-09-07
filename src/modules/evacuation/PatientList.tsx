import { useMemo, useState } from 'react';
import type { Patient, Stability, TransportNeed } from '@/data/types';
import { EQUIPMENT_LABELS, EVAC, LABELS, MOVE_STATUS_LABELS, STABILITIES, STABILITY_LABELS, TRANSPORT_LABELS, TRANSPORT_NEEDS } from '@/data/vocab';
import { isInTransit, patientName } from '@/lib/evacuation';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/Chip';
import { Button } from '@/components/ui/button';

type StatusFilter = (typeof EVAC.statusFilters)[number]['key'];

function statusMatches(p: Patient, f: StatusFilter): boolean {
  const m = p.move;
  switch (f) {
    case 'all':
      return true;
    case 'notPlanned':
      return !m || m.suggested;
    case 'planned':
      return Boolean(m && !m.suggested && (m.status === 'Planned' || m.status === 'Accepted'));
    case 'inTransit':
      return Boolean(m && !m.suggested && isInTransit(m.status));
    case 'arrived':
      return Boolean(m && !m.suggested && (m.status === 'Arrived' || m.status === 'Handed over'));
  }
}

function FilterRow<T extends string>({ label, options, value, onChange }: { label: string; options: ReadonlyArray<{ key: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="mr-1 w-16 text-small text-text-secondary">{label}</span>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.key)}
            className={cn('h-[22px] rounded-full border px-2 text-small transition-colors duration-150', active ? 'border-primary-text bg-primary text-primary-foreground' : 'border-border bg-surface text-text hover:bg-bg-muted')}
          >
            {o.label}
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

const ALL = 'all' as const;
const STABILITY_OPTIONS = [{ key: ALL, label: EVAC.filters.all }, ...STABILITIES.map((s) => ({ key: s, label: STABILITY_LABELS[s] }))] as const;
const TRANSPORT_OPTIONS = [{ key: ALL, label: EVAC.filters.all }, ...TRANSPORT_NEEDS.map((t) => ({ key: t, label: TRANSPORT_LABELS[t] }))] as const;

/** Left pane – filter chips, grouped by ward, one row per patient. */
export function PatientList({ patients, selectedId, onSelect }: PatientListProps) {
  const [stability, setStability] = useState<typeof ALL | Stability>(ALL);
  const [transport, setTransport] = useState<typeof ALL | TransportNeed>(ALL);
  const [status, setStatus] = useState<StatusFilter>('all');

  const filtered = useMemo(
    () => patients.filter((p) => (stability === ALL || p.stability === stability) && (transport === ALL || p.transport === transport) && statusMatches(p, status)),
    [patients, stability, transport, status],
  );
  const wards = [...new Set(patients.map((p) => p.ward))];
  const clear = () => {
    setStability(ALL);
    setTransport(ALL);
    setStatus('all');
  };

  return (
    <div>
      <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-surface px-4 py-3">
        <h2 className="text-heading">{EVAC.patients(filtered.length)}</h2>
        <p className="text-small text-text-muted">{LABELS.fictionalPatients}</p>
        <FilterRow label={EVAC.filters.stability} options={STABILITY_OPTIONS} value={stability} onChange={setStability} />
        <FilterRow label={EVAC.filters.transport} options={TRANSPORT_OPTIONS} value={transport} onChange={setTransport} />
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
                      <button type="button" aria-pressed={selected} onClick={() => onSelect(p.id)} className={cn('flex w-full flex-col gap-1 px-4 py-2 text-left hover:bg-bg-muted', selected && 'bg-bg-muted')}>
                        <span className="flex w-full items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {patientName(p)} <span className="font-normal text-text-secondary tabular">{p.age}</span>
                          </span>
                          <StatusChip status={p.stability} label={STABILITY_LABELS[p.stability]} />
                        </span>
                        <span className="flex w-full items-center gap-2 text-small">
                          <span className="text-text-secondary">{TRANSPORT_LABELS[p.transport]}</span>
                          {p.equipment.length ? <span className="text-text-muted">{p.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}</span> : null}
                          <span className="ml-auto">
                            {p.move ? (
                              p.move.suggested ? (
                                <StatusChip status="Suggested" label={EVAC.suggested} />
                              ) : (
                                <StatusChip status={p.move.status} label={MOVE_STATUS_LABELS[p.move.status]} />
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
