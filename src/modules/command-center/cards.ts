// Card models for the Command Center – SPEC.md § 6.1.1 (node scope) and the region cards.
import { BedIcon, HeartPulseIcon, HouseIcon, ScanIcon, ScissorsIcon, SirenIcon, TruckIcon, UsersIcon } from 'lucide-react';
import type { Capability, CareNode, Figure, Resource } from '@/data/types';
import { CT_QUEUE, VIKBY_SOURCES } from '@/data/mock';
import { CC, ICON_TINTS, LABELS } from '@/data/vocab';
import { computeCapacity } from '@/lib/capacity';
import { sumFigures, viewFigure, type OutageView } from '@/lib/figure';
import type { IconTileProps } from '@/components/Card';

export type CardDetail =
  | { kind: 'capability'; capabilityId: string }
  | { kind: 'popover'; text: string }
  | { kind: 'nodes' }
  | { kind: 'vikby-capability'; capabilityId: string };

export interface CardModel {
  key: string;
  title: string;
  subtitle?: string;
  tile: IconTileProps;
  figure?: Figure; // displayed figure (already outage-adjusted)
  value?: number;
  unit?: string;
  confidence?: string; // overrides the "{verified} verified + {estimated} estimated" line
  notAvailable?: boolean;
  notShared?: boolean;
  detail?: CardDetail;
}

const tile = (icon: IconTileProps['icon'], tint: keyof typeof ICON_TINTS): IconTileProps => ({
  icon,
  iconClass: ICON_TINTS[tint].icon,
  tileClass: ICON_TINTS[tint].tile,
});

function sourceFigure(source: Figure['source']): Figure {
  const s = VIKBY_SOURCES.find((e) => e.source === source);
  return { value: 0, verified: 0, estimated: 0, source, lastConfirmed: s?.lastSync ?? '' };
}

export function nodeCards(node: CareNode, capabilities: Capability[], outage: OutageView): CardModel[] {
  const caps = capabilities.filter((c) => c.nodeId === node.id);
  const findCap = (name: string) => caps.find((c) => c.name === name);
  const cards: CardModel[] = [];

  // 1. Acute beds (or Home care places for a home care node)
  if (node.acuteBeds) {
    const cap = findCap('Acute beds');
    cards.push({
      key: 'acute-beds',
      title: CC.cards.acuteBeds,
      tile: tile(BedIcon, 'beds'),
      figure: viewFigure(node.acuteBeds.free, outage),
      unit: CC.units.availableOf(node.acuteBeds.total),
      detail: cap ? { kind: 'capability', capabilityId: cap.id } : undefined,
    });
  } else if (node.homeCarePlaces) {
    cards.push({
      key: 'acute-beds',
      title: CC.cards.homeCarePlaces,
      tile: tile(HouseIcon, 'beds'),
      figure: viewFigure(node.homeCarePlaces.free, outage),
      unit: CC.units.availableOf(node.homeCarePlaces.total),
    });
  } else {
    cards.push({ key: 'acute-beds', title: CC.cards.acuteBeds, tile: tile(BedIcon, 'beds'), notAvailable: true });
  }

  // 2. Intensive care
  if (node.intensiveCare) {
    const cap = findCap('Intensive care');
    cards.push({
      key: 'intensive-care',
      title: CC.cards.intensiveCare,
      tile: tile(HeartPulseIcon, 'intensive'),
      figure: viewFigure(node.intensiveCare.free, outage),
      unit: CC.units.availableOfUsable(node.intensiveCare.usable),
      detail: cap ? { kind: 'capability', capabilityId: cap.id } : undefined,
    });
  } else {
    cards.push({ key: 'intensive-care', title: CC.cards.intensiveCare, tile: tile(HeartPulseIcon, 'intensive'), notAvailable: true });
  }

  // 3. Operating theatres (from the Emergency surgery capability)
  const surgery = findCap('Emergency surgery');
  if (surgery) {
    const r = computeCapacity(surgery);
    const theatres = r.components.find((c) => c.name === 'Operating theatres')?.available ?? 0;
    cards.push({
      key: 'theatres',
      title: CC.cards.theatres,
      tile: tile(ScissorsIcon, 'theatres'),
      value: r.capacity,
      unit: CC.units.surgeries(theatres),
      figure: { ...sourceFigure('OR planning'), value: r.capacity, verified: r.capacity },
      detail: { kind: 'capability', capabilityId: surgery.id },
    });
  } else {
    cards.push({ key: 'theatres', title: CC.cards.theatres, tile: tile(ScissorsIcon, 'theatres'), notAvailable: true });
  }

  // 4. Imaging (from the CT imaging capability)
  const ct = findCap('CT imaging');
  if (ct) {
    const r = computeCapacity(ct);
    const scanners = r.components.find((c) => c.name === 'CT scanners');
    cards.push({
      key: 'imaging',
      title: CC.cards.imaging,
      tile: tile(ScanIcon, 'imaging'),
      value: r.capacity,
      unit: CC.units.scanners(scanners?.total ?? 0, CT_QUEUE.waiting),
      figure: { ...sourceFigure('RIS'), value: r.capacity, verified: r.capacity },
      detail: { kind: 'capability', capabilityId: ct.id },
    });
  } else {
    cards.push({ key: 'imaging', title: CC.cards.imaging, tile: tile(ScanIcon, 'imaging'), notAvailable: true });
  }

  // 5. Emergency department
  if (node.emergencyDepartment) {
    const inUse = viewFigure(node.emergencyDepartment.inUse, outage);
    cards.push({
      key: 'ed',
      title: CC.cards.ed,
      tile: tile(SirenIcon, 'ed'),
      figure: inUse,
      unit: CC.units.edSlots(node.emergencyDepartment.slots),
      detail: { kind: 'popover', text: CC.units.edBreakdown(inUse.value, node.emergencyDepartment.slots) },
    });
  } else {
    cards.push({ key: 'ed', title: CC.cards.ed, tile: tile(SirenIcon, 'ed'), notAvailable: true });
  }

  // 6. Staff on duty
  if (node.sharing === 'Capacity only') {
    cards.push({ key: 'staff', title: CC.cards.staff, tile: tile(UsersIcon, 'staff'), notShared: true });
  } else {
    const breakdown = node.staffBreakdown ? CC.units.staffBreakdown(node.staffBreakdown) : undefined;
    cards.push({
      key: 'staff',
      title: CC.cards.staff,
      tile: tile(UsersIcon, 'staff'),
      figure: viewFigure(node.staffOnDuty, outage),
      unit: breakdown,
      detail: breakdown ? { kind: 'popover', text: breakdown } : undefined,
    });
  }

  return cards;
}

export function regionCards(nodes: CareNode[], capabilities: Capability[], resources: Resource[], outage: OutageView): CardModel[] {
  const shared = nodes.filter((n) => n.sharing !== 'None');
  const full = nodes.filter((n) => n.sharing === 'Full');
  const notFullNames = shared.filter((n) => n.sharing !== 'Full').map((n) => n.name);
  const cards: CardModel[] = [];

  const bedNodes = shared.filter((n) => n.acuteBeds);
  const beds = sumFigures(bedNodes.map((n) => viewFigure(n.acuteBeds!.free, outage)));
  cards.push({
    key: 'acute-beds',
    title: CC.cards.acuteBeds,
    subtitle: CC.cards.network,
    tile: tile(BedIcon, 'beds'),
    figure: beds,
    unit: CC.units.availableOf(bedNodes.reduce((s, n) => s + n.acuteBeds!.total, 0)),
    detail: { kind: 'nodes' },
  });

  const icuNodes = shared.filter((n) => n.intensiveCare);
  const icu = sumFigures(icuNodes.map((n) => viewFigure(n.intensiveCare!.free, outage)));
  cards.push({
    key: 'intensive-care',
    title: CC.cards.intensiveCare,
    subtitle: CC.cards.network,
    tile: tile(HeartPulseIcon, 'intensive'),
    figure: icu,
    unit: CC.units.availableOfUsable(icuNodes.reduce((s, n) => s + n.intensiveCare!.usable, 0)),
    detail: { kind: 'nodes' },
  });

  const homeNodes = shared.filter((n) => n.homeCarePlaces);
  const home = sumFigures(homeNodes.map((n) => viewFigure(n.homeCarePlaces!.free, outage)));
  cards.push({
    key: 'home-care',
    title: CC.cards.homeCarePlaces,
    tile: tile(HouseIcon, 'beds'),
    figure: home,
    unit: CC.units.availableOf(homeNodes.reduce((s, n) => s + n.homeCarePlaces!.total, 0)),
    notAvailable: !home,
    detail: { kind: 'nodes' },
  });

  const surgery = capabilities.find((c) => c.nodeId === 'vikby' && c.name === 'Emergency surgery');
  if (surgery) {
    const r = computeCapacity(surgery);
    const theatres = r.components.find((c) => c.name === 'Operating theatres')?.available ?? 0;
    cards.push({
      key: 'theatres',
      title: CC.cards.theatres,
      subtitle: CC.cards.vikbyOnly,
      tile: tile(ScissorsIcon, 'theatres'),
      value: r.capacity,
      unit: CC.units.surgeries(theatres),
      figure: { ...sourceFigure('OR planning'), value: r.capacity, verified: r.capacity },
      detail: { kind: 'vikby-capability', capabilityId: surgery.id },
    });
  }

  const ambulances = resources.filter((r) => r.name === 'Ambulance' && full.some((n) => n.id === r.nodeId));
  const hiddenAmbulanceNodes = nodes.filter((n) => n.sharing !== 'Full' && resources.some((r) => r.name === 'Ambulance' && r.nodeId === n.id)).map((n) => n.name);
  const oldestAmbulance = ambulances.reduce<Resource | undefined>((a, b) => (!a || b.lastConfirmed < a.lastConfirmed ? b : a), undefined);
  cards.push({
    key: 'transport',
    title: CC.cards.transport,
    tile: tile(TruckIcon, 'transport'),
    value: ambulances.reduce((s, r) => s + r.available, 0),
    unit: CC.units.ambulances,
    figure: oldestAmbulance
      ? { value: 0, verified: 0, estimated: 0, source: oldestAmbulance.source, lastConfirmed: oldestAmbulance.lastConfirmed }
      : undefined,
    confidence: hiddenAmbulanceNodes.length ? CC.notSharedBy(hiddenAmbulanceNodes) : undefined,
    detail: { kind: 'nodes' },
  });

  const staff = sumFigures(full.map((n) => viewFigure(n.staffOnDuty, outage)));
  cards.push({
    key: 'staff',
    title: CC.cards.staff,
    subtitle: CC.cards.network,
    tile: tile(UsersIcon, 'staff'),
    figure: staff,
    confidence: notFullNames.length ? CC.notSharedBy(notFullNames) : undefined,
    detail: { kind: 'nodes' },
  });

  return cards;
}

export const NOT_AVAILABLE = LABELS.notAvailableAtNode;
