import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { NodeType, SharingLevel } from '@/data/types';
import { useStore } from '@/data/store';
import { CURRENT_USER, LABELS, NET, NODE_TYPE_LABELS, SHARING_LABELS, SHARING_LEVELS } from '@/data/vocab';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaffSelect } from '@/components/StaffSelect';

interface StandUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (nodeId: string) => void;
}

/** SPEC.md § 6.9 – Etablera nod: Namn, Typ, Plats (DATA.md § 2.7 presets), Planerade platser, Ansvarig, Delning. */
export function StandUpDialog({ open, onOpenChange, onCreated }: StandUpDialogProps) {
  const standUpNode = useStore((s) => s.standUpNode);
  const sites = useStore((s) => s.pack.presetSites);
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>('Care hub');
  const [siteName, setSiteName] = useState(sites[0].name);
  const [plannedBeds, setPlannedBeds] = useState('20');
  const [lead, setLead] = useState<string>(CURRENT_USER.name);
  const [sharing, setSharing] = useState<SharingLevel>('Full');
  const ids = { name: useId(), type: useId(), site: useId(), beds: useId(), lead: useId(), sharing: useId() };

  useEffect(() => {
    if (open) {
      setName(sites[0].name);
      setType('Care hub');
      setSiteName(sites[0].name);
      setPlannedBeds('20');
      setLead(CURRENT_USER.name);
      setSharing('Full');
    }
  }, [open, sites]);

  const site = sites.find((s) => s.name === siteName) ?? sites[0];
  const valid = name.trim().length > 0 && Number(plannedBeds) > 0;
  const submit = () => {
    if (!valid) return;
    const id = standUpNode({ name, type, site, plannedBeds: Number(plannedBeds), lead, sharing });
    onOpenChange(false);
    toast(NET.nodeCreated);
    onCreated?.(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{NET.standUp}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor={ids.site}>{NET.fields.site}</label>
            <Select
              value={siteName}
              onValueChange={(v) => {
                setSiteName(v);
                if (!name.trim() || sites.some((s) => s.name === name)) setName(v);
                setType(v.startsWith('Fältsjukhus') ? 'Field hospital' : 'Care hub');
              }}
            >
              <SelectTrigger id={ids.site} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}, {s.place}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.name}>{NET.fields.name}</label>
            <Input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.type}>{NET.fields.type}</label>
            <Select value={type} onValueChange={(v) => setType(v as NodeType)}>
              <SelectTrigger id={ids.type} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NET.standUpTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {NODE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.beds}>{NET.fields.plannedBeds}</label>
            <Input id={ids.beds} type="number" min={1} value={plannedBeds} onChange={(e) => setPlannedBeds(e.target.value)} className="w-32" />
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.lead}>{NET.fields.lead}</label>
            <StaffSelect id={ids.lead} value={lead} onChange={setLead} />
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.sharing}>{NET.fields.sharing}</label>
            <Select value={sharing} onValueChange={(v) => setSharing(v as SharingLevel)}>
              <SelectTrigger id={ids.sharing} className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHARING_LEVELS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SHARING_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {LABELS.cancel}
          </Button>
          <Button onClick={submit} disabled={!valid}>
            {NET.standUp}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
