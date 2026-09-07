import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Patient, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { CARE_LEVEL_LABELS, EVAC, MOVE_STATUSES, MOVE_STATUS_LABELS, NODE_STATUS_LABELS, NODE_TYPE_LABELS, TRANSPORT_LABELS } from '@/data/vocab';
import { canCancel, destinationReason, evacuationDestinations, evacuationVehicles, patientName, relevantFree, vehicleReason } from '@/lib/evacuation';
import { distanceKm } from '@/lib/figure';
import { fmt } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatusChip, Chip } from '@/components/Chip';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { StatusChain } from '@/components/StatusChain';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Middle pane – Destinationer, Transport and the Planera flytt panel. */
export function PlanningPane({ patient, site }: { patient: Patient | null; site: SiteId }) {
  const nodes = useStore((s) => s.nodes);
  const resources = useStore((s) => s.resources);
  const source = nodes.find((n) => n.id === site)!;
  const destinations = evacuationDestinations(nodes, site);
  const vehicles = evacuationVehicles(resources);

  return (
    <div className="divide-y divide-border">
      <section className="px-4 py-3">
        <h2 className="mb-2 text-heading">{EVAC.destinations}</h2>
        <ul className="space-y-2">
          {destinations.map((n) => {
            const free = patient ? relevantFree(n, patient) : relevantFree(n, { careLevel: 'Ward' });
            const reason = patient ? destinationReason(patient, n) : undefined;
            const freeFigure = patient?.careLevel === 'Intensive' ? n.intensiveCare?.free : n.beds?.free;
            return (
              <li key={n.id} className={cn('rounded-md border border-border p-2 text-small', reason && 'opacity-50')} aria-disabled={Boolean(reason)}>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-body font-medium">{n.name}</span>
                  <StatusChip status={n.status} label={NODE_STATUS_LABELS[n.status]} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-text-secondary">
                  <span>{NODE_TYPE_LABELS[n.type]}</span>
                  <span className="tabular">{free && free.free !== null ? EVAC.freeOf(fmt(free.free), fmt(free.total)) : EVAC.freeUnknown}</span>
                  {freeFigure ? <ConfidenceChip figure={freeFigure} /> : null}
                  {!n.radiusKm && !n.noMarker ? <span className="tabular">{EVAC.km(fmt(distanceKm(source, n)))}</span> : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {n.accepts.map((a) => (
                    <Chip key={a} tone="grey">
                      {CARE_LEVEL_LABELS[a]}
                    </Chip>
                  ))}
                </div>
                {reason ? <div className="mt-1 text-orange-text">{reason}</div> : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 py-3">
        <h2 className="mb-2 text-heading">{EVAC.transport}</h2>
        <ul className="space-y-1">
          {vehicles.map((v) => {
            const reason = patient ? vehicleReason(patient, v) : undefined;
            return (
              <li key={v.id} className={cn('flex items-center gap-2 text-body', reason && 'text-text-muted')} title={reason}>
                <span className="min-w-0 flex-1 truncate">{v.name}</span>
                <span className="tabular text-text-secondary">{EVAC.available(fmt(v.available))}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {patient ? <PlanMovePanel patient={patient} site={site} /> : null}
    </div>
  );
}

function PlanMovePanel({ patient, site }: { patient: Patient; site: SiteId }) {
  const nodes = useStore((s) => s.nodes);
  const resources = useStore((s) => s.resources);
  const planMove = useStore((s) => s.planMove);
  const acceptMove = useStore((s) => s.acceptMove);
  const assignTransport = useStore((s) => s.assignTransport);
  const markDeparted = useStore((s) => s.markDeparted);
  const markArrived = useStore((s) => s.markArrived);
  const markHandedOver = useStore((s) => s.markHandedOver);
  const cancelMove = useStore((s) => s.cancelMove);
  const acceptSuggestion = useStore((s) => s.acceptSuggestion);
  const rejectSuggestion = useStore((s) => s.rejectSuggestion);
  const [destination, setDestination] = useState<string>('');
  const [vehicle, setVehicle] = useState<string>('');

  useEffect(() => {
    setDestination('');
    setVehicle('');
  }, [patient.id]);

  const destinations = evacuationDestinations(nodes, site);
  const vehicles = evacuationVehicles(resources);
  const move = patient.move;
  const destName = (id: string) => nodes.find((n) => n.id === id)?.name ?? id;
  const name = patientName(patient);

  return (
    <section className="px-4 py-3">
      <h2 className="mb-1 text-heading">{EVAC.planMove}</h2>
      <p className="mb-3 text-small text-text-secondary">
        {name}. {EVAC.needs(TRANSPORT_LABELS[patient.transport])}
      </p>

      {!move ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="destination-select">{EVAC.destination}</label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger id="destination-select" className="w-full">
                <SelectValue placeholder={EVAC.selectDestination} />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((n) => {
                  const reason = destinationReason(patient, n);
                  return (
                    <SelectItem key={n.id} value={n.id} disabled={Boolean(reason)}>
                      {n.name}
                      {reason ? <span className="ml-2 text-small text-text-muted">{reason}</span> : null}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!destination}
            onClick={() => {
              planMove(patient.id, destination);
              toast(EVAC.movePlanned);
            }}
          >
            {EVAC.planMove}
          </Button>
        </div>
      ) : move.suggested ? (
        <div className="space-y-3">
          <p>
            <StatusChip status="Suggested" label={EVAC.suggested} /> <span className="ml-1">{destName(move.destinationId)}</span>
          </p>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                acceptSuggestion(patient.id);
                toast(EVAC.toasts.suggestionAccepted);
              }}
            >
              {EVAC.steps.acceptSuggestion}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                rejectSuggestion(patient.id);
                toast(EVAC.toasts.suggestionRejected);
              }}
            >
              {EVAC.steps.reject}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-body">
            {EVAC.destination}: <span className="font-medium">{destName(move.destinationId)}</span>
            {move.transportId ? <span className="text-text-secondary">, {resources.find((r) => r.id === move.transportId)?.name}</span> : null}
          </p>
          <StatusChain steps={MOVE_STATUSES} labels={MOVE_STATUS_LABELS} current={move.status} label={EVAC.moveStatusLabel} />
          {move.status === 'Accepted' ? (
            <div className="space-y-1">
              <label htmlFor="vehicle-select">{EVAC.transport}</label>
              <Select value={vehicle} onValueChange={setVehicle}>
                <SelectTrigger id="vehicle-select" className="w-full">
                  <SelectValue placeholder={EVAC.selectVehicle} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => {
                    const reason = vehicleReason(patient, v);
                    return (
                      <SelectItem key={v.id} value={v.id} disabled={Boolean(reason)}>
                        {v.name}: {EVAC.available(fmt(v.available))}
                        {reason ? <span className="ml-2 text-small text-text-muted">{reason}</span> : null}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            {move.status === 'Planned' ? (
              <Button
                onClick={() => {
                  acceptMove(patient.id);
                  toast(EVAC.toasts.accepted);
                }}
              >
                {EVAC.steps.accept}
              </Button>
            ) : null}
            {move.status === 'Accepted' ? (
              <Button
                disabled={!vehicle}
                onClick={() => {
                  assignTransport(patient.id, vehicle);
                  setVehicle('');
                  toast(EVAC.toasts.assigned);
                }}
              >
                {EVAC.steps.assign}
              </Button>
            ) : null}
            {move.status === 'Transport assigned' ? (
              <Button
                onClick={() => {
                  markDeparted(patient.id);
                  toast(EVAC.toasts.departed);
                }}
              >
                {EVAC.steps.departed}
              </Button>
            ) : null}
            {move.status === 'Departed' ? (
              <Button
                onClick={() => {
                  markArrived(patient.id);
                  toast(EVAC.toasts.arrived);
                }}
              >
                {EVAC.steps.arrived}
              </Button>
            ) : null}
            {move.status === 'Arrived' ? (
              <Button
                onClick={() => {
                  markHandedOver(patient.id);
                  toast(EVAC.toasts.handedOver);
                }}
              >
                {EVAC.steps.handedOver}
              </Button>
            ) : null}
            {canCancel(move.status) ? (
              <Button
                variant="link"
                onClick={() => {
                  cancelMove(patient.id);
                  toast(EVAC.toasts.cancelled);
                }}
              >
                {EVAC.steps.cancel}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
