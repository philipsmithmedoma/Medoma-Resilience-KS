import { useMemo, useState } from 'react';
import type { HomeEquipment, HomePatient } from '@/data/types';
import { useStore } from '@/data/store';
import { HOME_EQUIPMENT } from '@/data/vocab';
import { t, tm, lt } from '@/lib/i18n';
import { NO_FILTERS, filterPatients, groupByZone, hasFilters, type HomeFilters } from '@/lib/home-list';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/Chip';
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

function PatientRow({ p }: { p: HomePatient }) {
  const equipment = tm('HOME.equipment');
  const zones = useStore((s) => s.pack.homeZones);
  const zone = zones.find((z) => z.id === p.zone)!;
  return (
    <li className="space-y-1 border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">
          {p.familyName}, {p.givenName} <span className="font-normal text-text-secondary tabular">{p.age}</span>
        </span>
        {p.visitToday ? <Chip tone="blue">{t('HOME.list.visitToday')}</Chip> : null}
      </div>
      <div className="flex items-center gap-3 text-small text-text-secondary">
        <span className="truncate">{lt(zone.name)}</span>
        <span className="ml-auto whitespace-nowrap">{p.team}</span>
      </div>
      <div className="text-small text-text-muted">
        {p.equipment.length ? p.equipment.map((e) => equipment[e]).join(', ') : t('HOME.list.noEquipment')}
        {p.batteryHours !== null ? <span className="ml-3 tabular text-text-secondary">{t('HOME.list.battery', { n: p.batteryHours })}</span> : null}
      </div>
    </li>
  );
}

interface HomePatientListProps {
  patients: HomePatient[];
  /** Ids of affected patients; the "affected only" filter is available once there are some disruptions. */
  affected?: ReadonlySet<string>;
  disruptionActive?: boolean;
}

/** Left pane (SPEC.md § 11.6): one row per patient grouped by zone, with the zone, equipment, visit-today and affected-only filters. */
export function HomePatientList({ patients, affected, disruptionActive = false }: HomePatientListProps) {
  const zones = useStore((s) => s.pack.homeZones);
  const [filters, setFilters] = useState<HomeFilters>(NO_FILTERS);
  const set = (patch: Partial<HomeFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const filtered = useMemo(() => filterPatients(patients, filters, affected), [patients, filters, affected]);
  const groups = useMemo(() => groupByZone(filtered, zones), [filtered, zones]);
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
            disabled={!disruptionActive}
            title={disruptionActive ? undefined : t('HOME.list.affectedOnlyHint')}
            onClick={() => set({ affectedOnly: !filters.affectedOnly })}
          >
            {t('HOME.list.filters.affectedOnly')}
          </ToggleChip>
        </div>
      </div>
      {groups.length === 0 ? (
        <div className="space-y-2 px-4 py-6">
          <p>{t('HOME.list.noMatch')}</p>
          {hasFilters(filters) ? (
            <Button variant="link" onClick={() => setFilters(NO_FILTERS)}>
              {t('HOME.list.clearFilters')}
            </Button>
          ) : null}
        </div>
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
      )}
    </div>
  );
}
