import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { NodeStatus, SharingLevel } from '@/data/types';
import { useStore } from '@/data/store';
import { CC, LABELS, NET, NODE_STATUSES, SHARING_LEVELS } from '@/data/vocab';
import { displaySyncState, sourcesForScope, viewFigure } from '@/lib/figure';
import { isStale } from '@/lib/time';
import { PageTitle, SectionHeading } from '@/components/PageTitle';
import { StatusChip, Chip } from '@/components/Chip';
import { FigureLines, TimeStamp } from '@/components/FigureLines';
import { KeyValueTable } from '@/components/KeyValueTable';
import { NodeMap } from '@/components/NodeMap';
import { StubPage } from '@/components/StubPage';
import { BottleneckTable } from '@/modules/command-center/BottleneckTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** SPEC.md § 6.5 – node detail: key–value table with Change on Status and Sharing, sources, bottlenecks, map. */
export function NodeDetailPage() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const nodes = useStore((s) => s.nodes);
  const bottlenecks = useStore((s) => s.bottlenecks);
  const capabilities = useStore((s) => s.capabilities);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  const setNodeStatus = useStore((s) => s.setNodeStatus);
  const setNodeSharing = useStore((s) => s.setNodeSharing);
  const setScope = useStore((s) => s.setScope);
  const [editing, setEditing] = useState<'status' | 'sharing' | null>(null);
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) return <StubPage title={NET.title} sentence={LABELS.notAvailableAtNode} linkTo="/network" linkLabel={NET.back} />;

  const outage = { ehrOutage, ehrOutageSince };
  const sources = sourcesForScope(node.id, nodes, outage, clock);
  const nodeBottlenecks = bottlenecks.filter((b) => b.nodeId === node.id);
  const stoodUp = node.id.startsWith('node-');
  const change = (field: 'status' | 'sharing') => (
    <button type="button" className="text-primary hover:text-primary-hover hover:underline" onClick={() => setEditing(field)}>
      {LABELS.change}
    </button>
  );
  const bedsOrPlaces = node.acuteBeds ?? node.homeCarePlaces;
  const bedsLabel = node.homeCarePlaces ? NET.detail.homeCarePlaces : NET.detail.acuteBeds;
  const notShared = node.sharing === 'None';

  return (
    <div className="space-y-6">
      <Link to="/network" className="text-primary hover:text-primary-hover hover:underline">
        {NET.back}
      </Link>
      <PageTitle title={node.name}>
        <Chip tone="grey">{node.type}</Chip>
        <StatusChip status={node.status} />
      </PageTitle>

      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8">
        <div className="space-y-8">
          <KeyValueTable
            rows={[
              { label: NET.detail.type, value: node.type },
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
                      <SelectTrigger className="w-56" aria-label="Change status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusChip status={node.status} />
                  ),
                action: editing === 'status' ? null : change('status'),
              },
              { label: NET.detail.lead, value: node.lead },
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
                      <SelectTrigger className="w-56" aria-label="Change sharing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHARING_LEVELS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    node.sharing
                  ),
                action: editing === 'sharing' ? null : change('sharing'),
              },
              {
                label: NET.detail.sync,
                value: (
                  <span className="flex items-center gap-2">
                    <StatusChip status={displaySyncState(node, clock)} />
                    <TimeStamp time={node.lastSync} stale={isStale(clock, node.lastSync)} />
                  </span>
                ),
              },
              {
                label: bedsLabel,
                value:
                  bedsOrPlaces && !notShared ? (
                    <div>
                      <div className="tabular">{NET.detail.freeOf(viewFigure(bedsOrPlaces.free, outage).value, bedsOrPlaces.total)}</div>
                      <FigureLines figure={viewFigure(bedsOrPlaces.free, outage)} clock={clock} />
                    </div>
                  ) : (
                    <span className="text-text-muted">{notShared ? LABELS.notShared : LABELS.none}</span>
                  ),
              },
              ...(node.plannedBeds !== undefined ? [{ label: NET.detail.plannedBeds, value: <span className="tabular">{node.plannedBeds}</span> }] : []),
              {
                label: NET.detail.intensiveCare,
                value:
                  node.intensiveCare && !notShared ? (
                    <div>
                      <div className="tabular">{NET.detail.freeOfUsable(viewFigure(node.intensiveCare.free, outage).value, node.intensiveCare.usable, node.intensiveCare.physical)}</div>
                      <FigureLines figure={viewFigure(node.intensiveCare.free, outage)} clock={clock} />
                    </div>
                  ) : (
                    <span className="text-text-muted">{notShared ? LABELS.notShared : LABELS.none}</span>
                  ),
              },
              {
                label: NET.detail.staff,
                value:
                  node.sharing === 'Full' ? (
                    <div>
                      <div className="tabular">{viewFigure(node.staffOnDuty, outage).value}</div>
                      <FigureLines figure={viewFigure(node.staffOnDuty, outage)} clock={clock} />
                    </div>
                  ) : (
                    <StatusChip status={LABELS.notShared} />
                  ),
              },
              {
                label: NET.detail.accepts,
                value: (
                  <span className="flex flex-wrap gap-1">
                    {node.accepts.map((a) => (
                      <Chip key={a} tone="grey">
                        {a}
                      </Chip>
                    ))}
                  </span>
                ),
              },
            ]}
          />

          <section>
            <SectionHeading>{NET.detail.sources}</SectionHeading>
            <table className="w-full text-body">
              <thead>
                <tr className="text-text-secondary">
                  <th className="h-10 px-2 text-left font-normal">{CC.columns.source}</th>
                  <th className="h-10 px-2 text-left font-normal">{CC.columns.state}</th>
                  <th className="h-10 px-2 text-right font-normal">{CC.columns.lastSync}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="h-10 border-t border-border">
                    <td className="px-2">{s.source}</td>
                    <td className="px-2">
                      <StatusChip status={s.state} />
                    </td>
                    <td className="px-2 text-right">
                      <TimeStamp time={s.lastSync} stale={s.state !== 'Offline' && isStale(clock, s.lastSync)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                className="text-primary hover:text-primary-hover hover:underline"
                onClick={() => {
                  setScope(node.id);
                  navigate('/resources/inventory');
                }}
              >
                {NET.detail.showInventory}
              </button>
            </section>
          ) : null}
        </div>

        <div className="h-[520px] overflow-hidden rounded-lg border border-border">
          <NodeMap nodes={nodes} selectedId={node.id} center={[node.lat, node.lng]} zoom={12} />
        </div>
      </div>
    </div>
  );
}
