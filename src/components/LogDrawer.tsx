import type { AuditEntry } from '@/data/types';
import { LABELS } from '@/data/vocab';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AuditTable } from './AuditTable';

interface LogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: AuditEntry[];
  title?: string;
  description?: string;
}

/** The audit log in a side drawer. */
export function LogDrawer({ open, onOpenChange, entries, title = LABELS.auditLog, description }: LogDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[640px] overflow-y-auto sm:max-w-[640px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description ?? LABELS.entries(entries.length)}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <AuditTable entries={entries} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
