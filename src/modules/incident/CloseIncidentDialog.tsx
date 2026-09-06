import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/data/store';
import { INCIDENT, LABELS } from '@/data/vocab';

interface CloseIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** SPEC.md § 6.2.5 – close dialog, opened from the banner and from the active incident. */
export function CloseIncidentDialog({ open, onOpenChange }: CloseIncidentDialogProps) {
  const closeIncident = useStore((s) => s.closeIncident);
  const close = () => {
    closeIncident();
    onOpenChange(false);
    toast(INCIDENT.incidentClosed);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{INCIDENT.closeTitle}</DialogTitle>
          <DialogDescription>{INCIDENT.closeBody}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {LABELS.cancel}
          </Button>
          <Button variant="destructive" onClick={close}>
            {LABELS.closeIncident}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
