import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { Priority } from '@/data/types';
import { useStore } from '@/data/store';
import { LABELS, PRIORITIES, RES } from '@/data/vocab';
import { distinctResourceNames } from '@/lib/inventory';
import type { ParsedRequest } from '@/lib/parse';
import { StatusChip } from '@/components/Chip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: ParsedRequest | null; // from the message parser (§ 6.4.3); labelled Suggested until created
}

/** SPEC.md § 6.4.1 – "+ New request": Resource, Quantity, To node, Priority (default Normal), Note. */
export function NewRequestDialog({ open, onOpenChange, prefill }: NewRequestDialogProps) {
  const resources = useStore((s) => s.resources);
  const nodes = useStore((s) => s.nodes);
  const createRequest = useStore((s) => s.createRequest);
  const names = distinctResourceNames(resources);
  const [resourceName, setResourceName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [toNodeId, setToNodeId] = useState('');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [note, setNote] = useState('');
  const ids = { resource: useId(), quantity: useId(), to: useId(), priority: useId(), note: useId() };

  useEffect(() => {
    if (!open) return;
    setResourceName(prefill?.resourceName ?? '');
    setQuantity(prefill?.quantity !== undefined ? String(prefill.quantity) : '');
    setToNodeId(prefill?.toNodeId ?? '');
    setPriority(prefill?.priority ?? 'Normal');
    setNote(prefill?.note ?? '');
  }, [open, prefill]);

  const valid = resourceName && Number(quantity) > 0 && toNodeId;
  const submit = () => {
    if (!valid) return;
    createRequest({ resourceName, quantity: Number(quantity), toNodeId, priority, note });
    onOpenChange(false);
    toast(RES.requestCreated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {RES.newRequest}
            {prefill ? <StatusChip status="Suggested" /> : null}
          </DialogTitle>
          {prefill ? <DialogDescription>{RES.suggestedPrefill}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor={ids.resource}>{RES.fields.resource}</label>
            <Select value={resourceName} onValueChange={setResourceName}>
              <SelectTrigger id={ids.resource} className="w-full">
                <SelectValue placeholder={RES.fields.resource} />
              </SelectTrigger>
              <SelectContent>
                {names.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.quantity}>{RES.fields.quantity}</label>
            <Input id={ids.quantity} type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-32" />
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.to}>{RES.fields.toNode}</label>
            <Select value={toNodeId} onValueChange={setToNodeId}>
              <SelectTrigger id={ids.to} className="w-full">
                <SelectValue placeholder={RES.fields.toNode} />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.priority}>{RES.fields.priority}</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger id={ids.priority} className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.note}>{RES.fields.note}</label>
            <Textarea id={ids.note} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {LABELS.cancel}
          </Button>
          <Button onClick={submit} disabled={!valid}>
            {RES.actions.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
