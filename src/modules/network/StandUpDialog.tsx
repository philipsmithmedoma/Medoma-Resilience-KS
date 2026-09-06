import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { NodeType, SharingLevel } from '@/data/types';
import { SITES } from '@/data/mock';
import { useStore } from '@/data/store';
import { CURRENT_USER, LABELS, NET, SHARING_LEVELS } from '@/data/vocab';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaffSelect } from '@/components/StaffSelect';

interface StandUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** SPEC.md § 6.5 – Stand up dialog: Name, Type, Site, Planned beds (20), Lead, Sharing (Full). */
export function StandUpDialog({ open, onOpenChange }: StandUpDialogProps) {
  const standUpNode = useStore((s) => s.standUpNode);
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>('Care hub');
  const [siteName, setSiteName] = useState(SITES[0].name);
  const [plannedBeds, setPlannedBeds] = useState('20');
  const [lead, setLead] = useState<string>(CURRENT_USER.name);
  const [sharing, setSharing] = useState<SharingLevel>('Full');
  const ids = { name: useId(), type: useId(), site: useId(), beds: useId(), lead: useId(), sharing: useId() };

  useEffect(() => {
    if (open) {
      setName('');
      setType('Care hub');
      setSiteName(SITES[0].name);
      setPlannedBeds('20');
      setLead(CURRENT_USER.name);
      setSharing('Full');
    }
  }, [open]);

  const site = SITES.find((s) => s.name === siteName) ?? SITES[0];
  const valid = name.trim().length > 0 && Number(plannedBeds) > 0;
  const submit = () => {
    if (!valid) return;
    standUpNode({ name, type, site, plannedBeds: Number(plannedBeds), lead, sharing });
    onOpenChange(false);
    toast(NET.nodeCreated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{NET.standUp}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.site}>{NET.fields.site}</label>
            <Select value={siteName} onValueChange={setSiteName}>
              <SelectTrigger id={ids.site} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITES.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}, {s.place}
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
                    {s}
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
