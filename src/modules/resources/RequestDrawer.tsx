import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { ResourceRequest } from '@/data/types';
import { useStore } from '@/data/store';
import { LABELS, REQUEST_CHAIN, REQUEST_STATUS_LABELS, RES } from '@/data/vocab';
import { fmt } from '@/lib/format';
import { formatClock, isValidClock } from '@/lib/time';
import { KeyValueTable } from '@/components/KeyValueTable';
import { StatusChain } from '@/components/StatusChain';
import { StatusChip } from '@/components/Chip';
import { PriorityText } from '@/components/PriorityText';
import { AuditTable } from '@/components/AuditTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestDrawerProps {
  request: ResourceRequest | null;
  onOpenChange: (open: boolean) => void;
}

/** Request drawer: key–value table, status chain, audit entries and next-step actions. */
export function RequestDrawer({ request, onOpenChange }: RequestDrawerProps) {
  const nodes = useStore((s) => s.nodes);
  const resources = useStore((s) => s.resources);
  const log = useStore((s) => s.log);
  const clock = useStore((s) => s.clock);
  const acceptRequest = useStore((s) => s.acceptRequest);
  const rejectRequest = useStore((s) => s.rejectRequest);
  const allocateRequest = useStore((s) => s.allocateRequest);
  const dispatchRequest = useStore((s) => s.dispatchRequest);
  const receiveRequest = useStore((s) => s.receiveRequest);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [fromNode, setFromNode] = useState('');
  const [eta, setEta] = useState('');
  const ids = { from: useId(), eta: useId(), reason: useId() };

  useEffect(() => {
    setFromNode(request?.fromNodeId ?? '');
    setEta(formatClock(clock + 30));
    setReason('');
    setRejecting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, request?.status]);

  const nodeName = (id?: string) => nodes.find((n) => n.id === id)?.name ?? id ?? '';
  const r = request;
  const entries = r ? log.filter((e) => e.ref === r.id) : [];
  const sources = r ? nodes.map((n) => ({ node: n, resource: resources.find((x) => x.nodeId === n.id && x.name === r.resourceName) })).filter((x) => x.resource) : [];
  const selectedSource = sources.find((x) => x.node.id === fromNode);
  const canAllocate = Boolean(r && selectedSource && selectedSource.resource!.available >= r.quantity);

  return (
    <>
      <Sheet open={r !== null} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto">
          {r ? (
            <>
              <SheetHeader>
                <SheetTitle>{RES.drawerTitle(r.resourceName, fmt(r.quantity))}</SheetTitle>
                <SheetDescription>{RES.requestedBy(r.requestedBy, r.requestedAt)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <KeyValueTable
                  rows={[
                    { label: RES.fields.resource, value: r.resourceName },
                    { label: RES.fields.quantity, value: `${fmt(r.quantity)} ${r.unit}` },
                    { label: RES.fields.fromNode, value: r.fromNodeId ? nodeName(r.fromNodeId) : <span className="text-text-muted">{RES.notAllocated}</span> },
                    { label: RES.fields.toNode, value: nodeName(r.toNodeId) },
                    { label: RES.fields.priority, value: <PriorityText priority={r.priority} /> },
                    {
                      label: RES.fields.status,
                      value: (
                        <span className="flex items-center gap-2">
                          <StatusChip status={r.status} label={REQUEST_STATUS_LABELS[r.status]} />
                          {r.incident ? <StatusChip status="Incident" label={RES.incident} /> : null}
                        </span>
                      ),
                    },
                    { label: RES.fields.requestedBy, value: r.requestedBy },
                    { label: RES.fields.requestedAt, value: r.requestedAt },
                    { label: RES.fields.eta, value: r.eta ?? LABELS.none },
                    { label: RES.fields.note, value: r.note ?? LABELS.none },
                    ...(r.rejectReason ? [{ label: RES.fields.rejectReason, value: r.rejectReason }] : []),
                  ]}
                />

                <section>
                  <h3 className="mb-2 text-body font-medium">{RES.statusChain}</h3>
                  {r.status === 'Rejected' ? <StatusChip status="Rejected" label={REQUEST_STATUS_LABELS.Rejected} /> : <StatusChain steps={REQUEST_CHAIN} labels={REQUEST_STATUS_LABELS} current={r.status} label={RES.statusChain} />}
                </section>

                {r.status === 'Accepted' ? (
                  <div className="space-y-1">
                    <label htmlFor={ids.from}>{RES.fields.fromNode}</label>
                    <Select value={fromNode} onValueChange={setFromNode}>
                      <SelectTrigger id={ids.from} className="w-full">
                        <SelectValue placeholder={sources.length ? RES.fields.fromNode : RES.noSource} />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(({ node, resource }) => {
                          const enough = resource!.available >= r.quantity;
                          return (
                            <SelectItem key={node.id} value={node.id} disabled={!enough}>
                              {RES.allocateOption(node.name, fmt(resource!.available))}
                              {!enough ? <span className="ml-2 text-small text-text-muted">{RES.notEnough(fmt(resource!.available), fmt(r.quantity))}</span> : null}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {r.status === 'Allocated' ? (
                  <div className="space-y-1">
                    <label htmlFor={ids.eta}>{RES.fields.eta}</label>
                    <Input id={ids.eta} value={eta} onChange={(e) => setEta(e.target.value)} placeholder={RES.hhmm} className="w-32" />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  {r.status === 'Requested' ? (
                    <>
                      <Button
                        onClick={() => {
                          acceptRequest(r.id);
                          toast(RES.toasts.accepted);
                        }}
                      >
                        {RES.actions.accept}
                      </Button>
                      <Button variant="destructive" onClick={() => setRejecting(true)}>
                        {RES.actions.reject}
                      </Button>
                    </>
                  ) : null}
                  {r.status === 'Accepted' ? (
                    <Button
                      disabled={!canAllocate}
                      onClick={() => {
                        allocateRequest(r.id, fromNode);
                        toast(RES.toasts.allocated);
                      }}
                    >
                      {RES.actions.allocate}
                    </Button>
                  ) : null}
                  {r.status === 'Allocated' ? (
                    <Button
                      disabled={!isValidClock(eta)}
                      onClick={() => {
                        dispatchRequest(r.id, eta);
                        toast(RES.toasts.dispatched);
                      }}
                    >
                      {RES.actions.dispatch}
                    </Button>
                  ) : null}
                  {r.status === 'Dispatched' ? (
                    <Button
                      onClick={() => {
                        receiveRequest(r.id);
                        toast(RES.toasts.received);
                      }}
                    >
                      {RES.actions.receive}
                    </Button>
                  ) : null}
                </div>

                <section>
                  <h3 className="mb-2 text-body font-medium">{RES.auditEntries}</h3>
                  {entries.length ? <AuditTable entries={entries} /> : <p className="text-text-secondary">{LABELS.nothing}</p>}
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{RES.rejectTitle}</DialogTitle>
            <DialogDescription>{RES.rejectBody}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <label htmlFor={ids.reason}>{RES.fields.reason}</label>
            <Input id={ids.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              {LABELS.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                if (r) rejectRequest(r.id, reason);
                setRejecting(false);
                toast(RES.toasts.rejected);
              }}
            >
              {RES.actions.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
