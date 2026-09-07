import type { ReactNode } from 'react';

export interface KpiItem {
  label: string;
  value: string;
  extra?: ReactNode;
}

/** A compact strip of key figures above a table: label 13 px secondary, value 20/600 tabular. */
export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-2 rounded-lg border border-border bg-bg-muted px-5 py-3">
      {items.map((k) => (
        <div key={k.label} className="flex items-baseline gap-2">
          <span className="text-small text-text-secondary">{k.label}</span>
          <span className="text-[20px] leading-7 font-semibold tabular">{k.value}</span>
          {k.extra}
        </div>
      ))}
    </div>
  );
}
