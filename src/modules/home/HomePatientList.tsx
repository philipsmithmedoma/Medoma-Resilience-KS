import { useMemo, useState } from 'react';
import type { HomeEquipment, HomePatient } from '@/data/types';
import { useStore } from '@/data/store';
import { HOME_EQUIPMENT } from '@/data/vocab';
import { t, tm, lt } from '@/lib/i18n';
import { NO_FILTERS, filterPatients, groupByZone, hasFilters, type HomeFilters } from '@/lib/home-list';
import { isPrioritised, prioritise, type Impact, type ImpactReason, type ImpactRow } from '@/lib/reachability';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/Chip';
import { getRoadModel } from '@/lib/roadModel';
import { formatClock } from '@/lib/time';
import type { ChipTone } from '@/data/vocab';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ToggleChip({ pressed, onClick, children, disabled, title }: { pressed: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        'h-[22px] rounded-full border px-2 text-small transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        pressed ? 'border-primary-text bg-primary text-primary-foreground' : 'border-border bg-surface text-text hover:bg-bg-muted',
      )}
    >
      {children}
    </button>
  );
}

const REASON_TONE: Record<ImpactReason, ChipTone> = { unreachable: 'red', detour: 'warning', power: 'red', water: 'red' };

function PatientRow({ p, row }: { p: HomePatient; row?: ImpactRow }) {
  const reasons = tm('HOME.impact.reasons');
  useStore((s) => s.home.geoReady); // the snap result exists once the geometry has loaded
  const noRoad = getRoadModel()?.patients.get(p.id)?.unsnapped === true;
  const equipment = tm('HOME.equipment');
  const zones = useStore((s) => s.pack.homeZones);
  const zone = zones.find((z) => z.id === p.zone)!;
  useStore((s) => s.clock); // the row's battery status is recomputed on every clock change
  return (
    <li className="space-y-1 border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">
          {p.familyName}, {p.givenName} <span className="font-normal text-text-secondary tabular">{p.age}</span>
        </span>
        {row && isPrioritised(row) ? <Chip tone="grey" className="border-transparent bg-badge font-medium text-badge-text">{t('HOME.impact.prioritise')}</Chip> : null}
        {p.visitToday ? <Chip tone="blue">{t('HOME.list.visitToday')}</Chip> : null}
      </div>
      {noRoad ? (
        <div className="flex flex-wrap gap-1">
          <Chip tone="warning">{reasons.noRoad}</Chip>
        </div>
      ) : null}
      {row ? (
        <div className="flex flex-wrap gap-1">
          {row.reasons.map((r) => (
            <Chip key={r} tone={REASON_TONE[r]}>
              {reasons[r]}
            </Chip>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-3 text-small text-text-secondary">
        <span className="truncate">
          {p.street} {p.houseNo}
          <span className="text-text-muted"> {lt(zone.name)}</span>
        </span>
        <span className="ml-auto whitespace-nowrap">{p.team}</span>
      </div>
      <div className="text-small text-text-muted">
        {p.equipment.length ? p.equipment.map((e) => equipment[e]).join(', ') : t('HOME.list.noEquipment')}
        {p.batteryHours !== null ? <span className="ml-3 tabular text-text-secondary">{t('HOME.list.battery', { n: p.batteryHours })}</span> : null}
        {row?.power && row.batteryEmptyAt != null ? (
          row.batteryEmpty ? (
            <Chip tone="red" className="ml-2">{t('HOME.time.batteryEmpty')}</Chip>
          ) : (
            <span className="ml-2 tabular font-medium text-text">{t('HOME.time.batteryUntil', { hhmm: formatClock(row.batteryEmptyAt) })}</span>
          )
        ) : null}
      </div>
    </li>
  );
}

interface HomePatientListProps {
  patients: HomePatient[];
  /** The impact of the current disruptions; with `active` the list is ordered by priority and rows show their reasons. */
  impact: Impact;
  active: boolean;
}

function SectionList({ title, rows, patients }: { title: string; rows?: ImpactRow[]; patients?: HomePatient[] }) {
  if ((rows ?? patients ?? []).length === 0) return null;
  return (
    <section>
      <h3 className="bg-bg-muted px-4 py-1.5 text-body font-medium">{title}</h3>
      <ul>{rows ? rows.map((r) => <PatientRow key={r.patient.id} p={r.patient} row={r} />) : patients!.map((p) => <PatientRow key={p.id} p={p} />)}</ul>
    </section>
  );
}

/** Left pane (SPEC.md § 11.6): one row per patient grouped by zone, with the zone, equipment, visit-today and affected-only filters. */
export function HomePatientList({ patients, impact, active }: HomePatientListProps) {
  const zones = useStore((s) => s.pack.homeZones);
  const [filters, setFilters] = useState<HomeFilters>(NO_FILTERS);
  const set = (patch: Partial<HomeFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const affected = useMemo(() => new Set(impact.rows.filter((r) => r.affected).map((r) => r.patient.id)), [impact]);
  const filtered = useMemo(() => filterPatients(patients, filters, affected), [patients, filters, affected]);
  const groups = useMemo(() => groupByZone(filtered, zones), [filtered, zones]);
  // With disruptions: affected patients in priority order, then those reached via a detour, then everyone else (SPEC.md § 11.6).
  const sections = useMemo(() => {
    if (!active) return null;
    const keep = new Set(filtered.map((p) => p.id));
    const ordered = prioritise(impact.rows).filter((r) => keep.has(r.patient.id));
    const flagged = new Set(impact.rows.map((r) => r.patient.id));
    const others = groupByZone(filtered.filter((p) => !flagged.has(p.id)), zones).flatMap((g) => g.patients);
    return { affected: ordered.filter((r) => r.affected), detour: ordered.filter((r) => !r.affected), others };
  }, [active, filtered, impact, zones]);
  const equipment = tm('HOME.equipment');

  return (
    <div>
      <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-surface px-4 py-3">
        <h2 className="text-heading">{t('HOME.list.title', { n: filtered.length })}</h2>
        <p className="text-small text-text-muted">{t('LABELS.fictionalPatients')}</p>
        <div className="flex gap-2">
          <Select value={filters.zone} onValueChange={(v) => set({ zone: v })}>
            <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label={t('HOME.list.filters.zone')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('HOME.list.filters.zone')}: {t('HOME.list.filters.all')}
              </SelectItem>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {lt(z.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.equipment} onValueChange={(v) => set({ equipment: v as HomeEquipment | 'all' })}>
            <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label={t('HOME.list.filters.equipment')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('HOME.list.filters.equipment')}: {t('HOME.list.filters.all')}
              </SelectItem>
              {HOME_EQUIPMENT.map((e) => (
                <SelectItem key={e} value={e}>
                  {equipment[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ToggleChip pressed={filters.visitToday} onClick={() => set({ visitToday: !filters.visitToday })}>
            {t('HOME.list.filters.visitToday')}
          </ToggleChip>
          <ToggleChip
            pressed={filters.affectedOnly}
            disabled={!active}
            title={active ? undefined : t('HOME.list.affectedOnlyHint')}
            onClick={() => set({ affectedOnly: !filters.affectedOnly })}
          >
            {t('HOME.list.filters.affectedOnly')}
          </ToggleChip>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="space-y-2 px-4 py-6">
          <p>{t('HOME.list.noMatch')}</p>
          {hasFilters(filters) ? (
            <Button variant="link" onClick={() => setFilters(NO_FILTERS)}>
              {t('HOME.list.clearFilters')}
            </Button>
          ) : null}
        </div>
      ) : (
        sections ? (
          <>
            <SectionList title={t('HOME.impact.groups.affected', { n: sections.affected.length })} rows={sections.affected} />
            <SectionList title={t('HOME.impact.groups.detour', { n: sections.detour.length })} rows={sections.detour} />
            <SectionList title={t('HOME.impact.groups.others', { n: sections.others.length })} patients={sections.others} />
          </>
        ) : (
          groups.map((g) => (
            <section key={g.zone.id}>
              <h3 className="bg-bg-muted px-4 py-1.5 text-body font-medium">
                {lt(g.zone.name)} <span className="font-normal text-text-secondary">({g.patients.length})</span>
              </h3>
              <ul>
                {g.patients.map((p) => (
                  <PatientRow key={p.id} p={p} />
                ))}
              </ul>
            </section>
          ))
        )
      )}
    </div>
  );
}
