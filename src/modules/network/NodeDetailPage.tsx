import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Figure, NodeStatus, SharingLevel } from '@/data/types';
import { useStore } from '@/data/store';
import { CAP, CARE_LEVEL_LABELS, CONFIDENCE_LABELS, DATA_SOURCE_LABELS, LABELS, NET, NODE_STATUSES, NODE_STATUS_LABELS, NODE_TYPE_LABELS, SHARING_LABELS, SHARING_LEVELS, SYNC_LABELS } from '@/data/vocab';
import { displaySyncState, sourcesForScope, viewFigure } from '@/lib/figure';
import { fmt, fmtDec } from '@/lib/format';
import { isStale } from '@/lib/time';
import { PageTitle, SectionHeading } from '@/components/PageTitle';
import { StatusChip, Chip } from '@/components/Chip';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { FigureLines, FigureText, TimeStamp } from '@/components/FigureLines';
import { KeyValueTable } from '@/components/KeyValueTable';
import { NodeMap } from '@/components/NodeMap';
import { BottleneckTable } from '@/modules/capacity/BottleneckTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** SPEC.md § 6.9 – node detail: key–value table with Ändra on Status and Delning, Källor section, bottlenecks, map. */
export function NodeDetailPage() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const nodes = useStore((s) => s.nodes);
  const bottlenecks = useStore((s) => s.bottlenecks);
  const capabilities = useStore((s) => s.capabilities);
  const hospitalSources = useStore((s) => s.pack.hospitalSources);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  const setNodeStatus = useStore((s) => s.setNodeStatus);
  const setNodeSharing = useStore((s) => s.setNodeSharing);
  const setScope = useStore((s) => s.setScope);
  const [editing, setEditing] = useState<'status' | 'sharing' | null>(null);
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) {
    return (
      <div className="space-y-4">
        <PageTitle title={NET.title} />
        <p>{NET.notFound}</p>
        <Link to="/natverk" className="text-primary-text hover:text-primary-hover hover:underline">
          {NET.back}
        </Link>
      </div>
    );
  }

  const outage = { ehrOutage, ehrOutageSince };
  const systems = sourcesForScope(node.id, nodes, hospitalSources, outage, clock);
  const nodeBottlenecks = bottlenecks.filter((b) => b.nodeId === node.id);
  const stoodUp = node.id.startsWith('node-');
  const change = (field: 'status' | 'sharing') => (
    <button type="button" className="text-primary-text hover:text-primary-hover hover:underline" onClick={() => setEditing(field)}>
      {LABELS.change}
    </button>
  );
  const notShared = node.sharing === 'None';
  const bedsLabel = node.type === 'Hospital' || node.type === 'Care hub' || node.type === 'Field hospital' ? NET.detail.beds : NET.detail.places;

  const figureRows: Array<{ label: string; figure: Figure; text?: string }> = [
    ...(node.beds ? [{ label: `${bedsLabel}, totalt`, figure: node.beds.total }, { label: `${bedsLabel}, lediga`, figure: viewFigure(node.beds.free, outage) }] : []),
    ...(node.intensiveCare ? [{ label: `${NET.detail.intensiveCare}, totalt`, figure: node.intensiveCare.total }, { label: `${NET.detail.intensiveCare}, lediga`, figure: viewFigure(node.intensiveCare.free, outage) }] : []),
    ...(node.staffOnDuty ? [{ label: NET.detail.staff, figure: viewFigure(node.staffOnDuty, outage) }] : []),
    ...(node.extraFigures ?? []),
  ];

  return (
    <div className="space-y-6">
      <Link to="/natverk" className="text-primary-text hover:text-primary-hover hover:underline">
        {NET.back}
      </Link>
      <PageTitle title={node.name}>
        <Chip tone="grey">{NODE_TYPE_LABELS[node.type]}</Chip>
        <StatusChip status={node.status} label={NODE_STATUS_LABELS[node.status]} />
      </PageTitle>

      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8">
        <div className="space-y-8">
          <KeyValueTable
            rows={[
              { label: NET.detail.type, value: NODE_TYPE_LABELS[node.type] },
              {
                label: NET.detail.status,
                value:
                  editing === 'status' ? (
                    <Select
                      value={node.status}
                      defaultOpen
                      onValueChange={(v) => {
                        setNodeStatus(node.id, v as NodeStatus);
                        setEditing(null);
                        toast(NET.toasts.statusChanged);
                      }}
                    >
                      <SelectTrigger className="w-56" aria-label={NET.detail.changeStatus}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {NODE_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusChip status={node.status} label={NODE_STATUS_LABELS[node.status]} />
                  ),
                action: editing === 'status' ? null : change('status'),
              },
              { label: NET.detail.lead, value: node.lead || '–' },
              { label: NET.detail.place, value: node.place },
              {
                label: NET.detail.sharing,
                value:
                  editing === 'sharing' ? (
                    <Select
                      value={node.sharing}
                      defaultOpen
                      onValueChange={(v) => {
                        setNodeSharing(node.id, v as SharingLevel);
                        setEditing(null);
                        toast(NET.toasts.sharingChanged);
                      }}
                    >
                      <SelectTrigger className="w-56" aria-label={NET.detail.changeSharing}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHARING_LEVELS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {SHARING_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    SHARING_LABELS[node.sharing]
                  ),
                action: editing === 'sharing' ? null : change('sharing'),
              },
              {
                label: NET.detail.sync,
                value: (
                  <span className="flex items-center gap-2">
                    <StatusChip status={displaySyncState(node, clock)} label={SYNC_LABELS[displaySyncState(node, clock)]} />
                    <TimeStamp time={node.lastSync} stale={isStale(clock, node.lastSync)} />
                  </span>
                ),
              },
              ...(node.beds
                ? [
                    {
                      label: bedsLabel,
                      value: notShared ? (
                        <span className="text-text-muted">{LABELS.notShared}</span>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 tabular">
                            {NET.detail.freeOf(fmt(viewFigure(node.beds.free, outage).value), fmt(node.beds.total.value))}
                            <ConfidenceChip figure={viewFigure(node.beds.free, outage)} />
                          </div>
                          <FigureLines figure={viewFigure(node.beds.free, outage)} clock={clock} />
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(node.plannedBeds !== undefined ? [{ label: NET.detail.plannedBeds, value: <span className="tabular">{fmt(node.plannedBeds)}</span> }] : []),
              ...(node.intensiveCare
                ? [
                    {
                      label: NET.detail.intensiveCare,
                      value: notShared ? (
                        <span className="text-text-muted">{LABELS.notShared}</span>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 tabular">
                            {node.intensiveCare.free.value === null ? `${LABELS.unknown} ${LABELS.of} ${fmt(node.intensiveCare.total.value)}` : NET.detail.freeOf(fmt(viewFigure(node.intensiveCare.free, outage).value), fmt(node.intensiveCare.total.value))}
                            <ConfidenceChip figure={node.intensiveCare.free.value === null ? node.intensiveCare.total : viewFigure(node.intensiveCare.free, outage)} />
                          </div>
                          <FigureLines figure={viewFigure(node.intensiveCare.free, outage)} clock={clock} />
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(node.staffOnDuty
                ? [
                    {
                      label: NET.detail.staff,
                      value:
                        node.sharing === 'Full' ? (
                          <div>
                            <FigureText figure={viewFigure(node.staffOnDuty, outage)} />
                            <FigureLines figure={viewFigure(node.staffOnDuty, outage)} clock={clock} />
                          </div>
                        ) : (
                          <StatusChip status="Not shared" label={LABELS.notShared} />
                        ),
                    },
                  ]
                : []),
              ...(node.radiusKm ? [{ label: NET.detail.place, value: NET.detail.radius(fmt(node.radiusKm)) }] : []),
              {
                label: NET.detail.accepts,
                value: node.accepts.length ? (
                  <span className="flex flex-wrap gap-1">
                    {node.accepts.map((a) => (
                      <Chip key={a} tone="grey">
                        {CARE_LEVEL_LABELS[a]}
                      </Chip>
                    ))}
                  </span>
                ) : (
                  <span className="text-text-muted">{LABELS.none}</span>
                ),
              },
            ]}
          />

          <section>
            <SectionHeading>{NET.detail.sources}</SectionHeading>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{NET.detail.figure}</TableHead>
                  <TableHead className="text-right">{NET.detail.value}</TableHead>
                  <TableHead>{NET.detail.confidence}</TableHead>
                  <TableHead>{NET.detail.source}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {figureRows.map((row, i) => (
                  <TableRow key={`${row.label}-${i}`}>
                    <TableCell className="whitespace-normal">{row.label}</TableCell>
                    <TableCell className="text-right tabular whitespace-normal">{row.text ?? (row.figure.value === null ? LABELS.unknown : Number.isInteger(row.figure.value) ? fmt(row.figure.value) : fmtDec(row.figure.value))}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        {CONFIDENCE_LABELS[row.figure.confidence]}
                        <ConfidenceChip figure={row.figure} showSource />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal text-text-secondary">{row.figure.source ?? row.figure.basis ?? '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {systems.length ? (
              <table className="mt-4 w-full text-body">
                <thead>
                  <tr className="text-text-secondary">
                    <th className="h-10 px-2 text-left font-normal">{CAP.columns.source}</th>
                    <th className="h-10 px-2 text-left font-normal">{CAP.columns.state}</th>
                    <th className="h-10 px-2 text-right font-normal">{CAP.columns.lastSync}</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.map((s) => (
                    <tr key={s.source} className="h-10 border-t border-border">
                      <td className="px-2">{DATA_SOURCE_LABELS[s.source]}</td>
                      <td className="px-2">
                        <StatusChip status={s.state} label={SYNC_LABELS[s.state]} />
                      </td>
                      <td className="px-2 text-right">
                        <TimeStamp time={s.lastSync} stale={s.state !== 'Offline' && isStale(clock, s.lastSync)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>

          {nodeBottlenecks.length ? (
            <section>
              <SectionHeading>{NET.detail.bottlenecks}</SectionHeading>
              <BottleneckTable bottlenecks={nodeBottlenecks} capabilities={capabilities} nodes={nodes} />
            </section>
          ) : null}

          {stoodUp ? (
            <section>
              <SectionHeading>{NET.detail.resources}</SectionHeading>
              <button
                type="button"
                className="text-primary-text hover:text-primary-hover hover:underline"
                onClick={() => {
                  setScope(node.id);
                  navigate('/resurser/lager');
                }}
              >
                {NET.detail.showInventory}
              </button>
            </section>
          ) : null}
        </div>

        <div className="h-[520px] overflow-hidden rounded-lg border border-border">
          <NodeMap nodes={nodes} selectedId={node.id} center={node.noMarker ? undefined : [node.lat, node.lng]} zoom={node.noMarker ? undefined : node.radiusKm ? 9 : 12} />
        </div>
      </div>
    </div>
  );
}
