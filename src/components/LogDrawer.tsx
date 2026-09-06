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

/** SPEC.md § 7.3 – the audit log in a side drawer. */
export function LogDrawer({ open, onOpenChange, entries, title = LABELS.auditLog, description }: LogDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[640px] sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description ?? `${entries.length} entries, newest first.`}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <AuditTable entries={entries} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
