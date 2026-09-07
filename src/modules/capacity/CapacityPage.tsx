import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { CapabilityKind, LadderStep, SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { CAP, LABELS } from '@/data/vocab';
import { isHospitalScope, isRegion, scopeName, sitesInScope } from '@/lib/scope';
import { sourcesForScope, sumFigures, viewFigure, withValue } from '@/lib/figure';
import { PageTitle, SectionHeading } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
import { SyncChip } from '@/components/SyncChip';
import { NodesTable } from '@/components/NodesTable';
import { LogDrawer } from '@/components/LogDrawer';
import { Button } from '@/components/ui/button';
import { scopeCards, type CardModel } from './cards';
import { CapacityCard } from './CapacityCard';
import { BottleneckTable } from './BottleneckTable';
import { WhatLimitsWhat } from './WhatLimitsWhat';
import { SourcesPopover } from './SourcesPopover';
import { ObjectivesStrip } from './ObjectivesStrip';
import { Ladder } from './Ladder';
import { ScenarioStrip } from '@/modules/scenario/ScenarioStrip';

const WLW_ID = 'what-limits-what';
const NODES_ID = 'nodes-table';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** SPEC.md § 6.5 – Kapacitet: ladder, cards, bottlenecks, what limits what; node table at region scope. */
export function CapacityPage() {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const ladders = useStore((s) => s.pack.ladders);
  const hospitalSources = useStore((s) => s.pack.hospitalSources);
  const capabilities = useStore((s) => s.capabilities);
  const bottlenecks = useStore((s) => s.bottlenecks);
  const flowMetrics = useStore((s) => s.flowMetrics);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  const log = useStore((s) => s.log);
  const incident = useStore((s) => s.incident);
  const scenario = useStore((s) => s.scenario);
  const openScenarioPanel = useStore((s) => s.openScenarioPanel);
  const whatIf = useStore((s) => s.whatIf);
  const setWhatIf = useStore((s) => s.setWhatIf);
  const clearWhatIf = useStore((s) => s.clearWhatIf);
  const location = useLocation();

  const outage = { ehrOutage, ehrOutageSince };
  const region = isRegion(scope);
  const sites = sitesInScope(scope);
  const hospital = isHospitalScope(scope);
  const scopeCaps = useMemo(() => capabilities.filter((c) => (sites.length ? sites.includes(c.nodeId as SiteId) : c.nodeId === scope)), [capabilities, scope, sites]);
  const [selectedCap, setSelectedCap] = useState<string>(scopeCaps[0]?.id ?? '');
  const [whatIfOn, setWhatIfOn] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    if (!scopeCaps.some((c) => c.id === selectedCap)) setSelectedCap(scopeCaps[0]?.id ?? '');
  }, [scopeCaps, selectedCap]);

  // "Vad frigör" links from Läget nu arrive as /kapacitet?kapacitet=<kind>.
  useEffect(() => {
    const kind = new URLSearchParams(location.search).get('kapacitet') as CapabilityKind | null;
    if (kind) {
      const cap = scopeCaps.find((c) => c.kind === kind);
      if (cap) {
        setSelectedCap(cap.id);
        window.setTimeout(() => scrollTo(WLW_ID), 50);
      }
    }
  }, [location.search, scopeCaps]);

  const cards = scopeCards({ scope, nodes, capabilities, flowMetrics, outage });
  const scopeBottlenecks = region ? bottlenecks : bottlenecks.filter((b) => (sites.length ? sites.includes(b.nodeId as SiteId) : b.nodeId === scope));
  const sources = sourcesForScope(scope, nodes, hospitalSources, outage, clock);
  const syncNode = hospital ? nodes.find((n) => n.id === 'solna') : nodes.find((n) => n.id === scope);

  // The ladder: static steps from the pack, belagda and lediga from the live node figures.
  const ladderSteps: LadderStep[] | null = useMemo(() => {
    if (!hospital) return null;
    const base = ladders[region ? 'karolinska' : (scope as 'karolinska' | SiteId)];
    const siteNodes = nodes.filter((n) => n.site && (region ? true : sites.includes(n.site)) && n.beds);
    const lediga = sumFigures(siteNodes.map((n) => viewFigure(n.beds!.free, outage)));
    const normal = base.find((s) => s.key === 'disponibla_normal')!.figure.value ?? 0;
    return base.map((s) => {
      if (s.key === 'lediga' && lediga) return { ...s, figure: { ...s.figure, value: lediga.value, dataSource: lediga.dataSource, lastConfirmed: lediga.lastConfirmed } };
      if (s.key === 'belagda' && lediga) return { ...s, figure: withValue({ ...s.figure, dataSource: lediga.dataSource, lastConfirmed: lediga.lastConfirmed }, lediga.value === null ? null : normal - lediga.value) };
      return s;
    });
  }, [hospital, ladders, nodes, outage, region, scope, sites]);

  const selectCapability = (id: string) => {
    setSelectedCap(id);
    scrollTo(WLW_ID);
  };

  const onShowDetail = (card: CardModel) => {
    const d = card.detail;
    if (!d) return;
    if (d.kind === 'capability') {
      const cap = scopeCaps.find((c) => c.kind === d.capabilityKind);
      if (cap) selectCapability(cap.id);
      else scrollTo(NODES_ID);
    } else if (d.kind === 'nodes') scrollTo(NODES_ID);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <PageTitle title={CAP.title} scope={scopeName(scope, nodes)}>
            {syncNode ? (
              <SourcesPopover sources={sources} clock={clock}>
                <SyncChip node={syncNode} clock={clock} outage={outage} ehrScope={hospital} />
              </SourcesPopover>
            ) : null}
            {ehrOutage && hospital ? <StatusChip status="Spegel" label={LABELS.operatingOnMirror} /> : null}
            <Button variant="link" onClick={() => setLogOpen(true)}>
              {LABELS.log}
            </Button>
          </PageTitle>
          <Button variant="secondary" onClick={() => openScenarioPanel(scenario?.key ?? null)}>
            {CAP.scenario}
          </Button>
        </div>
        {incident ? <ObjectivesStrip /> : null}
        {scenario ? <ScenarioStrip /> : null}
      </div>

      {ladderSteps ? <Ladder steps={ladderSteps} /> : null}

      <section>
        <SectionHeading>{CAP.capacityNow}</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <CapacityCard key={card.key} card={card} clock={clock} onShowDetail={onShowDetail} />
          ))}
        </div>
      </section>

      {region ? (
        <section id={NODES_ID} className="scroll-mt-4">
          <SectionHeading>{CAP.nodes}</SectionHeading>
          <NodesTable nodes={nodes} clock={clock} outage={outage} />
          <p className="mt-3 text-text-secondary">{CAP.selectNode}</p>
        </section>
      ) : null}

      {scopeBottlenecks.length ? (
        <section>
          <SectionHeading>{CAP.bottlenecks}</SectionHeading>
          <BottleneckTable bottlenecks={scopeBottlenecks} capabilities={capabilities} nodes={nodes} showNode={region || sites.length > 1} onSelectCapability={region ? undefined : selectCapability} />
        </section>
      ) : null}

      {!region ? (
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
      ) : null}

      <LogDrawer open={logOpen} onOpenChange={setLogOpen} entries={log} />
    </div>
  );
}
