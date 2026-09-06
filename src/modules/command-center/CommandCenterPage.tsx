import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/data/store';
import { CC, LABELS } from '@/data/vocab';
import { isRegion, scopeName } from '@/lib/scope';
import { sourcesForScope } from '@/lib/figure';
import { PageTitle, SectionHeading } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
import { SyncChip } from '@/components/SyncChip';
import { NodesTable } from '@/components/NodesTable';
import { LogDrawer } from '@/components/LogDrawer';
import { Button } from '@/components/ui/button';
import { nodeCards, regionCards, type CardModel } from './cards';
import { CapacityCard } from './CapacityCard';
import { BottleneckTable } from './BottleneckTable';
import { WhatLimitsWhat } from './WhatLimitsWhat';
import { SourcesPopover } from './SourcesPopover';
import { ObjectivesStrip } from './ObjectivesStrip';

const WLW_ID = 'what-limits-what';
const NODES_ID = 'nodes-table';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** SPEC.md § 6.1 – Command Center, node scope and region scope. */
export function CommandCenterPage() {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const capabilities = useStore((s) => s.capabilities);
  const bottlenecks = useStore((s) => s.bottlenecks);
  const resources = useStore((s) => s.resources);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  const log = useStore((s) => s.log);
  const incident = useStore((s) => s.incident);
  const whatIf = useStore((s) => s.whatIf);
  const setWhatIf = useStore((s) => s.setWhatIf);
  const clearWhatIf = useStore((s) => s.clearWhatIf);
  const setScope = useStore((s) => s.setScope);

  const outage = { ehrOutage, ehrOutageSince };
  const region = isRegion(scope);
  const node = nodes.find((n) => n.id === scope);
  const scopeCaps = useMemo(() => capabilities.filter((c) => c.nodeId === scope), [capabilities, scope]);
  const [selectedCap, setSelectedCap] = useState<string>(scopeCaps[0]?.id ?? '');
  const [whatIfOn, setWhatIfOn] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    if (!scopeCaps.some((c) => c.id === selectedCap)) setSelectedCap(scopeCaps[0]?.id ?? '');
  }, [scopeCaps, selectedCap]);

  const cards = region ? regionCards(nodes, capabilities, resources, outage) : node ? nodeCards(node, capabilities, outage) : [];
  const scopeBottlenecks = region ? bottlenecks : bottlenecks.filter((b) => b.nodeId === scope);
  const sources = sourcesForScope(scope, nodes, outage, clock);
  const syncNode = region ? nodes.find((n) => n.id === 'vikby') : node;

  const selectCapability = (id: string) => {
    setSelectedCap(id);
    scrollTo(WLW_ID);
  };

  const onShowDetail = (card: CardModel) => {
    const d = card.detail;
    if (!d) return;
    if (d.kind === 'capability') selectCapability(d.capabilityId);
    else if (d.kind === 'nodes') scrollTo(NODES_ID);
    else if (d.kind === 'vikby-capability') {
      setScope('vikby');
      setSelectedCap(d.capabilityId);
      window.setTimeout(() => scrollTo(WLW_ID), 50);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <PageTitle title={CC.title} scope={scopeName(scope, nodes)}>
          {syncNode ? (
            <SourcesPopover sources={sources} clock={clock}>
              <SyncChip node={syncNode} clock={clock} outage={outage} ehrScope={region || scope === 'vikby'} />
            </SourcesPopover>
          ) : null}
          {ehrOutage ? <StatusChip status={LABELS.operatingOnMirror} /> : null}
          <Button variant="link" onClick={() => setLogOpen(true)}>
            {LABELS.log}
          </Button>
        </PageTitle>
        {incident ? <ObjectivesStrip /> : null}
      </div>

      <section>
        <SectionHeading>{CC.capacityNow}</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <CapacityCard key={card.key} card={card} clock={clock} onShowDetail={onShowDetail} />
          ))}
        </div>
      </section>

      {region ? (
        <section id={NODES_ID} className="scroll-mt-4">
          <SectionHeading>{CC.nodes}</SectionHeading>
          <NodesTable nodes={nodes} clock={clock} outage={outage} />
        </section>
      ) : null}

      <section>
        <SectionHeading>{CC.bottlenecks}</SectionHeading>
        <BottleneckTable
          bottlenecks={scopeBottlenecks}
          capabilities={capabilities}
          nodes={nodes}
          showNode={region}
          onSelectCapability={region ? undefined : selectCapability}
        />
      </section>

      {region ? (
        <p className="text-text-secondary">{CC.selectNode}</p>
      ) : (
        <WhatLimitsWhat
          capabilities={scopeCaps}
          selectedId={selectedCap}
          onSelect={setSelectedCap}
          whatIfOn={whatIfOn}
          onWhatIfToggle={setWhatIfOn}
          overrides={whatIf[selectedCap]}
          onOverride={(component, value) => setWhatIf(selectedCap, component, value)}
          onResetWhatIf={() => clearWhatIf(selectedCap)}
          headingId={WLW_ID}
        />
      )}

      <LogDrawer open={logOpen} onOpenChange={setLogOpen} entries={log} />
    </div>
  );
}
