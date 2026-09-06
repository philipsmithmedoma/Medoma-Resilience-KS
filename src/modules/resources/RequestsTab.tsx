import { useState } from 'react';
import { ArrowLeftRightIcon } from 'lucide-react';
import type { ResourceRequest } from '@/data/types';
import { useStore } from '@/data/store';
import { REQUEST_STATUSES, RES } from '@/data/vocab';
import { IconTile } from '@/components/Card';
import { StatusChip } from '@/components/Chip';
import { PriorityText } from '@/components/PriorityText';
import { Button } from '@/components/ui/button';
import { RequestDrawer } from './RequestDrawer';
import { NewRequestDialog } from './NewRequestDialog';

/** SPEC.md § 6.4.1 – requests grouped by status in chain order; row click opens the drawer. */
export function RequestsTab() {
  const requests = useStore((s) => s.requests);
  const nodes = useStore((s) => s.nodes);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const nodeName = (id?: string) => nodes.find((n) => n.id === id)?.name;
  const openCount = requests.filter((r) => r.status !== 'Received' && r.status !== 'Rejected').length;
  const current = requests.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <Button variant="tertiary" onClick={() => setCreating(true)}>
          {RES.newRequest}
        </Button>
      </div>
      {openCount === 0 ? (
        <div className="space-y-2">
          <p>{RES.noOpenRequests}</p>
          <Button variant="tertiary" onClick={() => setCreating(true)}>
            {RES.newRequest}
          </Button>
        </div>
      ) : null}
      {REQUEST_STATUSES.map((status) => {
        const group = requests.filter((r) => r.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status}>
            <h2 className="mb-2 text-heading">
              {status} <span className="font-normal text-text-secondary">({group.length})</span>
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {group.map((r) => (
                <li key={r.id}>
                  <RequestRow request={r} from={nodeName(r.fromNodeId)} to={nodeName(r.toNodeId) ?? r.toNodeId} onClick={() => setOpenId(r.id)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <RequestDrawer request={current} onOpenChange={(open) => !open && setOpenId(null)} />
      <NewRequestDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function RequestRow({ request: r, from, to, onClick }: { request: ResourceRequest; from?: string; to: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 py-2 text-left hover:bg-bg-muted" aria-label={`Open request ${r.resourceName} × ${r.quantity}`}>
      <IconTile icon={ArrowLeftRightIcon} iconClass="text-teal" tileClass="bg-indigo-light" />
      <span className="w-16 shrink-0">
        <PriorityText priority={r.priority} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{RES.quantityUnit(r.resourceName, r.quantity, r.unit)}</span>
        <span className="block text-small text-text-secondary">
          {from ?? <span className="text-text-muted">{RES.notAllocated}</span>} → {to}
        </span>
      </span>
      <span className="text-small text-text-secondary">{RES.requestedBy(r.requestedBy, r.requestedAt)}</span>
      {r.eta ? <span className="w-20 text-small tabular text-text-secondary">{RES.eta(r.eta)}</span> : null}
      {r.incident ? <StatusChip status={RES.incident} /> : null}
    </button>
  );
}
