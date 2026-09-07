import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { DischargeReady, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { t, tm } from '@/lib/i18n';
import { GERIATRIK_MIN_AGE } from '@/lib/evacuation';
import { sumMetric } from '@/lib/flow';
import { fmt } from '@/lib/format';
import { StatusChip } from '@/components/Chip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSiteValues } from './useSiteValues';
import { KpiStrip } from './KpiStrip';

type Pending = { d: DischargeReady; kind: 'asih' | 'geriatrik' } | null;

/** SPEC.md § 6.4 – Utskrivningsklara: the Medoma bridge. KPI strip, table, ASIH and geriatrik flows. */
export function DischargeTab({ sites }: { sites: SiteId[] }) {
  const dischargeReady = useStore((s) => s.dischargeReady);
  const wards = useStore((s) => s.wards);
  const sendToAsih = useStore((s) => s.sendToAsih);
  const sendToGeriatrik = useStore((s) => s.sendToGeriatrik);
  const waitDischarge = useStore((s) => s.waitDischarge);
  const holdClock = useStore((s) => s.holdClock);
  const values = useSiteValues(sites);
  const [pending, setPending] = useState<Pending>(null);

  // A confirmation dialog pauses a running scenario clock (SPEC.md § 7.2).
  useEffect(() => {
    if (!pending) return;
    holdClock(true);
    return () => holdClock(false);
  }, [pending, holdClock]);

  const rows = useMemo(() => dischargeReady.filter((d) => sites.includes(d.site)), [dischargeReady, sites]);
  const waiting = rows.filter((d) => d.status !== 'Utskriven');
  const total = sumMetric('beds.utskrivningsklara', values);
  const asih = sumMetric('beds.asihEligible', values);
  const more = Math.max(0, total - waiting.length);
  const wardName = (id: string) => wards.find((w) => w.id === id)?.name ?? id;

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'asih') {
      sendToAsih(pending.d.id);
      toast(t('FLOW.discharge.toasts.asihSent'));
    } else {
      sendToGeriatrik(pending.d.id);
      toast(t('FLOW.discharge.toasts.geriatrikSent'));
    }
    setPending(null);
  };

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: t('FLOW.discharge.kpi.ready'), value: fmt(total) },
          { label: t('FLOW.discharge.kpi.bedsBound'), value: fmt(total) },
          { label: t('FLOW.discharge.kpi.asih'), value: fmt(asih) },
        ]}
      />
      <p className="text-small text-text-muted">{t('LABELS.fictionalPatients')}</p>
      {rows.length === 0 ? (
        <p className="text-text-secondary">{t('FLOW.discharge.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('FLOW.discharge.columns.patient')}</TableHead>
              <TableHead>{t('FLOW.discharge.columns.ward')}</TableHead>
              <TableHead className="text-right">{t('FLOW.discharge.columns.waited')}</TableHead>
              <TableHead>{t('FLOW.discharge.columns.waitingFor')}</TableHead>
              <TableHead>{t('FLOW.discharge.columns.status')}</TableHead>
              <TableHead>{t('FLOW.discharge.columns.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => {
              const open = d.status === 'Väntar';
              const geriatrik = d.age >= GERIATRIK_MIN_AGE && d.waitingFor === 'Geriatrik';
              return (
                <TableRow key={d.id} className={d.status === 'Utskriven' ? 'text-text-muted' : undefined}>
                  <TableCell>
                    {d.patient} <span className="text-text-secondary tabular">{d.age}</span>
                  </TableCell>
                  <TableCell>
                    {wardName(d.wardId)}
                    {sites.length > 1 ? <span className="ml-2 text-small text-text-muted">{tm('SITE_LABELS')[d.site]}</span> : null}
                  </TableCell>
                  <TableCell className="text-right tabular">{fmt(d.daysWaiting)}</TableCell>
                  <TableCell>{d.waitingFor}</TableCell>
                  <TableCell>
                    <StatusChip status={d.status} label={tm('DISCHARGE_STATUS_LABELS')[d.status]} />
                  </TableCell>
                  <TableCell>
                    {open ? (
                      <span className="flex items-center gap-3">
                        {d.asihEligible ? (
                          <Button size="sm" onClick={() => setPending({ d, kind: 'asih' })}>
                            {t('FLOW.discharge.toAsih')}
                          </Button>
                        ) : null}
                        {geriatrik ? (
                          <Button size="sm" onClick={() => setPending({ d, kind: 'geriatrik' })}>
                            {t('FLOW.discharge.toGeriatrik')}
                          </Button>
                        ) : null}
                        <Button
                          variant="link"
                          onClick={() => {
                            waitDischarge(d.id);
                            toast(t('FLOW.discharge.toasts.waited'));
                          }}
                        >
                          {t('FLOW.discharge.wait')}
                        </Button>
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {more > 0 ? <p className="text-text-secondary">{t('FLOW.discharge.more', { n: fmt(more) })}</p> : null}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending ? (pending.kind === 'asih' ? t('FLOW.discharge.confirmAsih', { patient: pending.d.patient }) : t('FLOW.discharge.confirmGeriatrik', { patient: pending.d.patient })) : ''}</DialogTitle>
            <DialogDescription>{t('FLOW.discharge.confirmBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t('LABELS.cancel')}
            </Button>
            <Button onClick={confirm}>{t('FLOW.discharge.send')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
