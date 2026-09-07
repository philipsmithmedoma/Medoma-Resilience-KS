// Card models for Kapacitet – SPEC.md § 6.5.
import { BedIcon, HeartPulseIcon, ScanIcon, ScissorsIcon, SirenIcon, UsersIcon } from 'lucide-react';
import type { Capability, CapabilityKind, CareNode, Figure, FlowMetric, NodeId, SiteId } from '@/data/types';
import { CAP, ICON_TINTS } from '@/data/vocab';
import { computeCapacity } from '@/lib/capacity';
import { sumFigures, viewFigure, weakest, type OutageView } from '@/lib/figure';
import { fmt } from '@/lib/format';
import { isRegion, sitesInScope } from '@/lib/scope';
import type { IconTileProps } from '@/components/Card';

export type CardDetail = { kind: 'capability'; capabilityKind: CapabilityKind } | { kind: 'popover'; text: string } | { kind: 'nodes' };

export interface CardModel {
  key: string;
  title: string;
  subtitle?: string;
  tile: IconTileProps;
  figure?: Figure; // displayed figure (already outage-adjusted)
  unit?: string;
  note?: string;
  notAvailable?: boolean;
  detail?: CardDetail;
}

const tile = (icon: IconTileProps['icon'], tint: keyof typeof ICON_TINTS): IconTileProps => ({
  icon,
  iconClass: ICON_TINTS[tint].icon,
  tileClass: ICON_TINTS[tint].tile,
});

export interface CardInputs {
  scope: NodeId;
  nodes: CareNode[];
  capabilities: Capability[];
  flowMetrics: FlowMetric[];
  outage: OutageView;
}

function metric(flow: FlowMetric[], key: string, sites: SiteId[], outage: OutageView): Figure | undefined {
  const parts = flow.filter((m) => m.key === key && sites.includes(m.site)).map((m) => viewFigure(m.value, outage));
  return sumFigures(parts);
}

export function scopeCards({ scope, nodes, capabilities, flowMetrics, outage }: CardInputs): CardModel[] {
  const sites = sitesInScope(scope);
  const region = isRegion(scope);
  const siteNodes = nodes.filter((n) => n.site && sites.includes(n.site));

  if (sites.length === 0) {
    // A stood-up node: places and staff only.
    const node = nodes.find((n) => n.id === scope);
    if (!node) return [];
    return [
      {
        key: 'beds',
        title: CAP.cards.places,
        tile: tile(BedIcon, 'beds'),
        figure: node.beds ? viewFigure(node.beds.free, outage) : undefined,
        unit: node.beds ? CAP.units.ofTotal(fmt(node.beds.total.value)) : undefined,
        notAvailable: !node.beds,
      },
      { key: 'intensive', title: CAP.cards.intensive, tile: tile(HeartPulseIcon, 'intensive'), notAvailable: true },
      { key: 'theatres', title: CAP.cards.theatres, tile: tile(ScissorsIcon, 'theatres'), notAvailable: true },
      { key: 'imaging', title: CAP.cards.imaging, tile: tile(ScanIcon, 'imaging'), notAvailable: true },
      { key: 'ed', title: CAP.cards.ed, tile: tile(SirenIcon, 'ed'), notAvailable: true },
      { key: 'staff', title: CAP.cards.staff, tile: tile(UsersIcon, 'staff'), figure: node.staffOnDuty ? viewFigure(node.staffOnDuty, outage) : undefined, unit: CAP.units.staff, notAvailable: !node.staffOnDuty },
    ];
  }

  const bedNodes = region ? nodes.filter((n) => n.type === 'Hospital' && n.beds) : siteNodes.filter((n) => n.beds);
  const beds = sumFigures(bedNodes.map((n) => viewFigure(n.beds!.free, outage)));
  const bedsTotal = sumFigures(bedNodes.map((n) => n.beds!.total));
  const icuNodes = siteNodes.filter((n) => n.intensiveCare);
  const icu = sumFigures(icuNodes.map((n) => viewFigure(n.intensiveCare!.free, outage)));
  const icuTotal = sumFigures(icuNodes.map((n) => n.intensiveCare!.total));

  const caps = (kind: CapabilityKind) => capabilities.filter((c) => c.kind === kind && sites.includes(c.nodeId as SiteId));
  const surgery = caps('surgery');
  const surgeryCapacity = surgery.reduce((s, c) => s + computeCapacity(c).capacity, 0);
  const theatresFree = surgery.reduce((s, c) => s + (c.components[0]?.available ?? 0), 0);
  const ct = caps('ct');
  const ctCapacity = ct.reduce((s, c) => s + computeCapacity(c).capacity, 0);
  const ctTotal = ct.reduce((s, c) => s + (c.components[0]?.total ?? 0), 0);
  const ctWaiting = metric(flowMetrics, 'ct.waiting', sites, outage);
  const ed = metric(flowMetrics, 'akuten.patients', sites, outage);
  const edWaiting = metric(flowMetrics, 'akuten.waitingBed', sites, outage);
  const staff = sumFigures(siteNodes.filter((n) => n.staffOnDuty).map((n) => viewFigure(n.staffOnDuty!, outage)));
  const subtitle = region ? CAP.cards.network : undefined;
  const karolinskaOnly = region ? `(${'Karolinska'})` : undefined;

  return [
    {
      key: 'beds',
      title: CAP.cards.beds,
      subtitle,
      tile: tile(BedIcon, 'beds'),
      figure: beds,
      unit: CAP.units.ofDisponibla(fmt(bedsTotal?.value ?? null)),
      detail: region ? { kind: 'nodes' } : { kind: 'capability', capabilityKind: 'beds' },
    },
    {
      key: 'intensive',
      title: CAP.cards.intensive,
      subtitle: karolinskaOnly,
      tile: tile(HeartPulseIcon, 'intensive'),
      figure: icu,
      unit: CAP.units.ofTotal(fmt(icuTotal?.value ?? null)),
      detail: { kind: 'capability', capabilityKind: 'intensive' },
    },
    {
      key: 'theatres',
      title: CAP.cards.theatres,
      subtitle: karolinskaOnly,
      tile: tile(ScissorsIcon, 'theatres'),
      figure: { value: surgeryCapacity, confidence: 'illustrative', basis: 'beräknad ur kapacitetens komponenter', dataSource: 'OR planning', lastConfirmed: '14:30' },
      unit: CAP.units.surgeries(fmt(theatresFree)),
      detail: { kind: 'capability', capabilityKind: 'surgery' },
    },
    {
      key: 'imaging',
      title: CAP.cards.imaging,
      subtitle: karolinskaOnly,
      tile: tile(ScanIcon, 'imaging'),
      figure: { value: ctCapacity, confidence: 'illustrative', basis: 'antal CT-apparater ej offentligt', dataSource: 'RIS', lastConfirmed: '14:20' },
      unit: CAP.units.scanners(fmt(ctTotal), fmt(ctWaiting?.value ?? null)),
      detail: { kind: 'capability', capabilityKind: 'ct' },
    },
    {
      key: 'ed',
      title: CAP.cards.ed,
      subtitle: karolinskaOnly,
      tile: tile(SirenIcon, 'ed'),
      figure: ed,
      unit: CAP.units.edPatients(fmt(edWaiting?.value ?? null)),
      detail: { kind: 'popover', text: `${CAP.cards.ed}: ${fmt(ed?.value ?? null)}, ${CAP.units.edPatients(fmt(edWaiting?.value ?? null))}.` },
    },
    {
      key: 'staff',
      title: CAP.cards.staff,
      subtitle: karolinskaOnly,
      tile: tile(UsersIcon, 'staff'),
      figure: staff ? { ...staff, confidence: weakest(staff.confidence, 'illustrative') } : undefined,
      unit: CAP.units.staff,
    },
  ];
}
