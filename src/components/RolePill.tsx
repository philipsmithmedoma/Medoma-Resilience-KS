import type { Profession } from '@/data/types';
import { PROFESSION_LABELS } from '@/data/vocab';
import { cn } from '@/lib/utils';

// Fill per profession with a 1 px dashed border in a 20 % darker tint of the fill (DESIGN.md § 4).
const PILL: Record<Profession, { fill: string; border: string }> = {
  Doc: { fill: '#FAC4C4', border: '#C89D9D' },
  Nrs: { fill: '#CDDFFF', border: '#A4B2CC' },
  AsPr: { fill: '#CBE8C0', border: '#A2BA9A' },
  Supp: { fill: '#FFCF99', border: '#CCA67A' },
};

export function RolePill({ profession, className }: { profession: Profession; className?: string }) {
  const p = PILL[profession];
  return (
    <span
      title={PROFESSION_LABELS[profession]}
      className={cn('inline-flex h-[22px] items-center rounded-full border border-dashed px-2 text-small text-text', className)}
      style={{ backgroundColor: p.fill, borderColor: p.border }}
    >
      {profession}
    </span>
  );
}

/** Text pill used for roles that are not professions (e.g. an owner role on a task). */
export function TextPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center rounded-full border border-border bg-bg-muted px-2 text-small text-text', className)}>
      {children}
    </span>
  );
}
