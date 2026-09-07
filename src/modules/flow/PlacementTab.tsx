import { useId, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { BedRequest, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { FLOW, LABELS, SITE_LABELS } from '@/data/vocab';
import { fmt, fmtDuration } from '@/lib/format';
import { isImaWard, placeableWards, suggestWard } from '@/lib/placement';
import { INITIAL_CLOCK } from '@/lib/time';
import { sumMetric } from '@/lib/flow';
import { Chip, StatusChip } from '@/components/Chip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSiteValues } from './useSiteValues';
import { KpiStrip } from './KpiStrip';

/** SPEC.md § 6.2 – Patientplacering: KPI strip, requests table sorted by waiting time, ward side panel. */
export function PlacementTab({ sites }: { sites: SiteId[] }) {
  const bedRequests = useStore((s) => s.bedRequests);
  const wards = useStore((s) => s.wards);
  const clock = useStore((s) => s.clock);
  const placePatient = useStore((s) => s.placePatient);
  const rejectPlacement = useStore((s) => s.rejectPlacement);
  const values = useSiteValues(sites);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<BedRequest | null>(null);
  const [reason, setReason] = useState('');
  const reasonId = useId();
  const drift = Math.max(0, clock - INITIAL_CLOCK);

  const requests = useMemo(() => bedRequests.filter((r) => sites.includes(r.site)).sort((a, b) => b.waitingMin - a.waitingMin), [bedRequests, sites]);
  const scopeWards = wards.filter((w) => sites.includes(w.site));
  const freeBeds = scopeWards.filter((w) => !isImaWard(w)).reduce((n, w) => n + w.free, 0);
  const longest = requests.length ? Math.max(...requests.map((r) => r.waitingMin)) + drift : 0;

  const onPlace = (r: BedRequest, wardId: string, relocate: boolean) => {
    placePatient(r.id, wardId, relocate);
    toast(relocate ? FLOW.placement.toasts.relocated : FLOW.placement.toasts.placed);
  };

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: FLOW.waiting, value: fmt(requests.length) },
          { label: FLOW.longestWait, value: fmtDuration(longest) },
          { label: FLOW.freeBeds, value: fmt(freeBeds) },
          { label: FLOW.kpiWaitingBed, value: fmt(sumMetric('akuten.waitingBed', values)) },
        ]}
      />
      <p className="text-small text-text-muted">{LABELS.fictionalPatients}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-8">
        {requests.length === 0 ? (
          <p className="text-text-secondary">{FLOW.placement.empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{FLOW.placement.columns.from}</TableHead>
                <TableHead>{FLOW.placement.columns.patient}</TableHead>
                <TableHead>{FLOW.placement.columns.needs}</TableHead>
                <TableHead className="text-right">{FLOW.placement.columns.waited}</TableHead>
                <TableHead>{FLOW.placement.columns.suggested}</TableHead>
                <TableHead>{FLOW.placement.columns.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const suggestion = suggestWard(r, wards);
                const options = placeableWards(r, wards);
                const chosenId = chosen[r.id] && options.some((w) => w.id === chosen[r.id]) ? chosen[r.id] : suggestion.ward?.id;
                const chosenWard = options.find((w) => w.id === chosenId);
                const relocate = suggestion.note === 'utlokalisering' || (chosenWard !== undefined && !r.needs.some((n) => chosenWard.name.includes(n)) && !isImaWard(chosenWard) && !r.needs.includes('Isolering'));
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-normal">
                      {r.from}
                      {sites.length > 1 ? <span className="block text-small text-text-muted">{SITE_LABELS[r.site]}</span> : null}
                    </TableCell>
                    <TableCell>
                      {r.patient} <span className="text-text-secondary tabular">{r.age}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {r.needs.map((n) => (
                          <Chip key={n} tone="grey">
                            {n}
                          </Chip>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular">{fmtDuration(r.waitingMin + drift)}</TableCell>
                    <TableCell>
                      {options.length === 0 ? (
                        <span className="text-orange-text">{suggestion.label}</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Select value={chosenId ?? ''} onValueChange={(v) => setChosen((c) => ({ ...c, [r.id]: v }))}>
                            <SelectTrigger size="sm" className="w-64" aria-label={`${FLOW.placement.selectWard}, ${r.patient}`}>
                              <SelectValue placeholder={FLOW.placement.selectWard} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                  {w.name} <span className="text-small text-text-muted">{FLOW.placement.freeOf(fmt(w.free), fmt(w.total))}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {relocate ? <StatusChip status="Utlokalisering" label={FLOW.placement.relocation} /> : null}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        {chosenWard && !relocate ? (
                          <Button size="sm" onClick={() => onPlace(r, chosenWard.id, false)}>
                            {FLOW.placement.place}
                          </Button>
                        ) : null}
                        {chosenWard && relocate ? (
                          <Button size="sm" variant="secondary" onClick={() => onPlace(r, chosenWard.id, true)}>
                            {FLOW.placement.relocate}
                          </Button>
                        ) : null}
                        <Button
                          variant="link"
                          onClick={() => {
                            setRejecting(r);
                            setReason('');
                          }}
                        >
                          {FLOW.placement.reject}
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <aside className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-3 text-[18px] leading-7">{FLOW.placement.wards}</h2>
          {sites.map((site) => (
            <div key={site} className="mb-4 last:mb-0">
              {sites.length > 1 ? <h3 className="mb-1 text-small text-text-secondary">{SITE_LABELS[site]}</h3> : null}
              <ul className="divide-y divide-border">
                {scopeWards
                  .filter((w) => w.site === site)
                  .map((w) => (
                    <li key={w.id} className="flex h-9 items-center justify-between gap-3 text-body">
                      <span className="truncate">{w.name}</span>
                      <span className={`tabular ${w.free === 0 ? 'text-red' : ''}`}>
                        {fmt(w.free)} <span className="text-text-muted">/ {fmt(w.total)}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rejecting ? FLOW.placement.rejectTitle(rejecting.patient) : ''}</DialogTitle>
            <DialogDescription>{FLOW.placement.rejectBody}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <label htmlFor={reasonId}>{FLOW.placement.reason}</label>
            <Input id={reasonId} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              {LABELS.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                if (rejecting) rejectPlacement(rejecting.id, reason);
                setRejecting(null);
                toast(FLOW.placement.toasts.rejected);
              }}
            >
              {FLOW.placement.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
