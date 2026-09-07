import type { Priority } from '@/data/types';
import { PRIORITY_LABELS } from '@/data/vocab';
import { cn } from '@/lib/utils';

/** DESIGN.md § 1: priority as text only, Hög in orange, Kritisk in red, weight 500. */
export function PriorityText({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn('font-medium', priority === 'High' && 'text-orange', priority === 'Critical' && 'text-red', className)}>{PRIORITY_LABELS[priority]}</span>
  );
}
