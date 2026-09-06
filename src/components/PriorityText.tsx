import type { Priority } from '@/data/types';
import { cn } from '@/lib/utils';

/** DESIGN.md § 1: priority as text only, High in orange, Critical in red, weight 500. */
export function PriorityText({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn('font-medium', priority === 'High' && 'text-orange', priority === 'Critical' && 'text-red', className)}>{priority}</span>
  );
}
