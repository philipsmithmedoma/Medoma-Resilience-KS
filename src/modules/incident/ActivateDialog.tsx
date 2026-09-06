import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Playbook } from '@/data/types';
import { useStore } from '@/data/store';
import { CURRENT_USER, INCIDENT, LABELS } from '@/data/vocab';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StaffSelect } from '@/components/StaffSelect';

interface ActivateDialogProps {
  playbook: Playbook | null;
  onOpenChange: (open: boolean) => void;
}

/** SPEC.md § 6.2.2 – "Activate {playbook}?" with commander select and optional note. */
export function ActivateDialog({ playbook, onOpenChange }: ActivateDialogProps) {
  const activatePlaybook = useStore((s) => s.activatePlaybook);
  const navigate = useNavigate();
  const [commander, setCommander] = useState<string>(CURRENT_USER.name);
  const [note, setNote] = useState('');
  const commanderId = useId();
  const noteId = useId();

  useEffect(() => {
    if (playbook) {
      setCommander(CURRENT_USER.name);
      setNote('');
    }
  }, [playbook]);

  const activate = () => {
    if (!playbook) return;
    activatePlaybook(playbook.id, commander, note);
    onOpenChange(false);
    toast(INCIDENT.incidentActivated);
    navigate('/incident');
  };

  return (
    <Dialog open={playbook !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {playbook ? (
          <>
            <DialogHeader>
              <DialogTitle>{INCIDENT.activateTitle(playbook.name)}</DialogTitle>
              <DialogDescription>
                {INCIDENT.activateBody(playbook.roles.length, playbook.tasks.length, playbook.channels.length, playbook.targets.length)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor={commanderId}>{INCIDENT.fields.commander}</label>
                <StaffSelect id={commanderId} value={commander} onChange={setCommander} />
              </div>
              <div className="space-y-1">
                <label htmlFor={noteId}>{INCIDENT.fields.note}</label>
                <Textarea id={noteId} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {LABELS.cancel}
              </Button>
              <Button onClick={activate}>{INCIDENT.activateIncident}</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
