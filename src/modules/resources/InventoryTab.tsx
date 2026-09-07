import { useMemo, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import type { Resource, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { DATA_SOURCE_LABELS, INVENTORY_STATUS_LABELS, INVENTORY_STATUS_OUT_OF_SERVICE, LABELS, RES, RESOURCE_CATEGORIES, RESOURCE_CATEGORY_LABELS, SUPPLY_STATUSES } from '@/data/vocab';
import { fmt } from '@/lib/format';
import { inventoryStatus, sumColumns } from '@/lib/inventory';
import { isRegion, sitesInScope } from '@/lib/scope';
import { isStale } from '@/lib/time';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/Chip';
import { TimeStamp } from '@/components/FigureLines';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type SortKey = 'name' | 'available';
const STATUS_VALUES = [...SUPPLY_STATUSES, INVENTORY_STATUS_OUT_OF_SERVICE];

function HeaderFilter({ label, values, labels, selected, onToggle }: { label: string; values: string[]; labels?: Record<string, string>; selected: Set<string>; onToggle: (v: string) => void }) {
  const active = selected.size > 0 && selected.size < values.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('inline-flex items-center gap-1 hover:text-text', active && 'text-primary')} aria-label={LABELS.ariaFilter(label)}>
          {label}
          <ChevronDownIcon className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {values.map((v) => (
          <DropdownMenuCheckboxItem key={v} checked={selected.size === 0 || selected.has(v)} onCheckedChange={() => onToggle(v)} onSelect={(e) => e.preventDefault()}>
            {labels?.[v] ?? v}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortHeader({ label, active, direction, onClick, className }: { label: string; active: boolean; direction: 'asc' | 'desc'; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1 hover:text-text', active && 'text-text', className)} aria-label={LABELS.ariaSortBy(label)}>
      {label}
      <span aria-hidden className="text-[10px]">
        {active ? (direction === 'asc' ? '▲' : '▼') : ''}
      </span>
    </button>
  );
}

/** Lager for the scope: filterable, sortable, with the "Ej i tjänst" column and a sum row. */
export function InventoryTab() {
  const resources = useStore((s) => s.resources);
  const nodes = useStore((s) => s.nodes);
  const scope = useStore((s) => s.scope);
  const clock = useStore((s) => s.clock);
  const [nodeFilter, setNodeFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const toggle = (set: Set<string>, all: string[], setter: (s: Set<string>) => void) => (v: string) => {
    const next = new Set(set.size === 0 ? all : set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next.size === all.length ? new Set() : next);
  };
  const nodeName = (id: string) => nodes.find((n) => n.id === id)?.name ?? id;
  const shared = (r: Resource) => (nodes.find((n) => n.id === r.nodeId)?.sharing ?? 'Full') === 'Full';
  const sites = sitesInScope(scope);

  const scoped = useMemo(
    () => (isRegion(scope) ? resources : sites.length ? resources.filter((r) => sites.includes(r.nodeId as SiteId) || r.nodeId === 'ambulans') : resources.filter((r) => r.nodeId === scope)),
    [resources, scope, sites],
  );
  const nodeValues = [...new Set(scoped.map((r) => nodeName(r.nodeId)))];
  const rows = useMemo(() => {
    const filtered = scoped.filter(
      (r) =>
        (nodeFilter.size === 0 || nodeFilter.has(nodeName(r.nodeId))) &&
        (categoryFilter.size === 0 || categoryFilter.has(r.category)) &&
        (statusFilter.size === 0 || statusFilter.has(inventoryStatus(r))),
    );
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => (sort.key === 'name' ? a.name.localeCompare(b.name, 'sv') * dir : (a.available - b.available) * dir || a.name.localeCompare(b.name, 'sv')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, nodeFilter, categoryFilter, statusFilter, sort, nodes]);
  const sums = sumColumns(rows.filter(shared));
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader label={RES.columns.resource} active={sort.key === 'name'} direction={sort.direction} onClick={() => toggleSort('name')} />
          </TableHead>
          <TableHead>
            <HeaderFilter label={RES.columns.node} values={nodeValues} selected={nodeFilter} onToggle={toggle(nodeFilter, nodeValues, setNodeFilter)} />
          </TableHead>
          <TableHead>
            <HeaderFilter label={RES.columns.category} values={RESOURCE_CATEGORIES} labels={RESOURCE_CATEGORY_LABELS} selected={categoryFilter} onToggle={toggle(categoryFilter, RESOURCE_CATEGORIES, setCategoryFilter)} />
          </TableHead>
          <TableHead className="text-right">{RES.columns.total}</TableHead>
          <TableHead className="text-right">
            <SortHeader label={RES.columns.available} active={sort.key === 'available'} direction={sort.direction} onClick={() => toggleSort('available')} />
          </TableHead>
          <TableHead className="text-right">{RES.columns.inUse}</TableHead>
          <TableHead className="text-right">{RES.columns.reserved}</TableHead>
          <TableHead className="text-right">{RES.columns.outOfService}</TableHead>
          <TableHead className="text-right">{RES.columns.notInService}</TableHead>
          <TableHead className="text-right">{RES.columns.inTransit}</TableHead>
          <TableHead>
            <HeaderFilter label={RES.columns.status} values={STATUS_VALUES} labels={INVENTORY_STATUS_LABELS} selected={statusFilter} onToggle={toggle(statusFilter, STATUS_VALUES, setStatusFilter)} />
          </TableHead>
          <TableHead>{RES.columns.lastConfirmed}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const visible = shared(r);
          const dash = <span className="text-text-muted">–</span>;
          const status = inventoryStatus(r);
          return (
            <TableRow key={r.id} className={cn(!visible && 'opacity-50')}>
              <TableCell>
                {r.note ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help underline decoration-dotted underline-offset-2">{r.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>{r.note}</TooltipContent>
                  </Tooltip>
                ) : (
                  r.name
                )}
              </TableCell>
              <TableCell>{nodeName(r.nodeId)}</TableCell>
              <TableCell>{RESOURCE_CATEGORY_LABELS[r.category]}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.total) : dash}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.available) : <StatusChip status="Not shared" label={LABELS.notShared} />}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.inUse) : dash}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.reserved) : dash}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.outOfService) : dash}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.notInService) : dash}</TableCell>
              <TableCell className="text-right tabular">{visible ? fmt(r.inTransit) : dash}</TableCell>
              <TableCell>{visible ? <StatusChip status={status} label={INVENTORY_STATUS_LABELS[status]} /> : dash}</TableCell>
              <TableCell>
                {visible ? (
                  <>
                    <TimeStamp time={r.lastConfirmed} stale={isStale(clock, r.lastConfirmed)} /> <span className="text-small text-text-muted">({DATA_SOURCE_LABELS[r.dataSource]})</span>
                  </>
                ) : (
                  dash
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow className="font-medium hover:bg-transparent">
          <TableCell colSpan={3}>{RES.columns.sum}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.total)}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.available)}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.inUse)}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.reserved)}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.outOfService)}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.notInService)}</TableCell>
          <TableCell className="text-right tabular">{fmt(sums.inTransit)}</TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
