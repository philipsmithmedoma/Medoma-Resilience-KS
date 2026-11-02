// The SUS Lund home pack (SPEC.md § 14.5, DATA.md § 14): one site, seven zones, two ASIH teams, the water, electricity and road
// nodes around the hospital, three illustrative notices and the sources S-L1…S-L5. Coordinates are from Google Places, read
// 2026-10-17 (`reported`) unless a node says otherwise. The 150 patients are synthetic (`home-patients-lund.ts`).
import type { Confidence, HomeDisruptionPreset, HomeSite, HomeTeam, HomeZone, InfraFigure, InfraLayer, InfraLink, InfraNode, LocalizedText, Message, SourceRef } from './types';
import { LUND_PATIENTS } from './home-patients-lund';
import { buildVisits } from './home-visits';

const tx = (sv: string, en: string): LocalizedText => ({ sv, en });
const PLACES = 'Google Places, 2026-10-17';
const noLabel = tx('', '');

export const LUND_SITE: HomeSite = { id: 'suslund', name: 'SUS Lund', lat: 55.7118, lng: 13.1985 };

const zone = (id: string, name: LocalizedText, lat: number, lng: number, radiusKm: number): HomeZone => ({
  id, name, lat, lng, radiusKm, graphNode: `zone:${id}`, coordConfidence: 'reported', coordSource: PLACES,
});

/** DATA.md § 14: the seven zones with their patient counts (60, 15, 15, 15, 15, 20, 10 – 150 in all). */
export const LUND_ZONES: HomeZone[] = [
  zone('lund', tx('Lund', 'Lund'), 55.706, 13.192, 2.5),
  zone('kavlinge', tx('Kävlinge', 'Kävlinge'), 55.792, 13.112, 1.5),
  zone('lomma', tx('Lomma och Bjärred', 'Lomma and Bjärred'), 55.695, 13.055, 2.0),
  zone('staffanstorp', tx('Staffanstorp', 'Staffanstorp'), 55.642, 13.212, 1.5),
  zone('dalby', tx('Dalby', 'Dalby'), 55.666, 13.352, 1.5),
  zone('eslov', tx('Eslöv', 'Eslöv'), 55.838, 13.305, 2.0),
  zone('horby', tx('Hörby', 'Hörby'), 55.851, 13.66, 1.5),
];

const PHONE = '0XX-XXX XX XX';
export const LUND_TEAMS: HomeTeam[] = [
  { id: 'asih-lund-nord', name: 'ASIH Lund Nord', baseLat: 55.704, baseLng: 13.192, baseLabel: tx('Lund centrum', 'Lund centre'), cars: 2, phone: PHONE },
  { id: 'asih-lund-syd', name: 'ASIH Lund Syd', baseLat: 55.644, baseLng: 13.21, baseLabel: tx('Staffanstorp', 'Staffanstorp'), cars: 2, phone: PHONE },
];

export const LUND_VISITS = buildVisits(LUND_PATIENTS, LUND_TEAMS, 20261017 + 2);

type Seed = Omit<InfraNode, 'coordConfidence' | 'coordSource'> & { coord?: [Confidence, string] };
const infra = ({ coord = ['reported', PLACES], ...rest }: Seed): InfraNode => ({ ...rest, coordConfidence: coord[0], coordSource: coord[1] });
const vehicles = tx('fordon per dygn', 'vehicles per day');

export const LUND_INFRA_NODES: InfraNode[] = [
  // --- Water ---------------------------------------------------------------
  infra({
    id: 'w-ringsjo', layer: 'water', kind: 'waterworks', name: tx('Ringsjöverket (Stehag)', 'Ringsjöverket (Stehag)'),
    lat: 55.8947, lng: 13.3949, verified: true,
    role: tx(
      'Sydvattens verk som renar Bolmenvatten, levererat genom den 80 km långa Bolmentunneln. Försörjer Lund, Lomma, Svalöv och delar av Malmö.',
      "Sydvatten's works treating Bolmen water delivered through the 80 km Bolmentunneln. Serves Lund, Lomma, Svalöv and parts of Malmö.",
    ),
    status: tx('Verifierat: Sydvatten, hållbarhets- och årsredovisningar och kvalitetsrapport 2024 (S-L1).', 'Verified: Sydvatten sustainability and annual reports and quality report 2024 (S-L1).'),
  }),
  infra({
    id: 'w-ringsjon', layer: 'water', kind: 'reserve', name: tx('Ringsjön (reserv)', 'Ringsjön (reserve)'),
    lat: 55.8642, lng: 13.556, verified: true,
    role: tx('Reservråvatten för Ringsjöverket.', 'Reserve raw water for Ringsjöverket.'),
    status: tx('Verifierat: Sydvatten, hållbarhets- och årsredovisningar och kvalitetsrapport 2024 (S-L1).', 'Verified: Sydvatten sustainability and annual reports and quality report 2024 (S-L1).'),
  }),
  infra({
    id: 'w-vomb', layer: 'water', kind: 'waterworks', name: tx('Vombverket', 'Vombverket'),
    lat: 55.6623, lng: 13.5294, verified: true,
    role: tx('Sydvattens andra verk, med råvatten från Vombsjön.', "Sydvatten's second works, with raw water from Vombsjön."),
    status: tx('Verifierat: Sydvatten, hållbarhets- och årsredovisningar och kvalitetsrapport 2024 (S-L1).', 'Verified: Sydvatten sustainability and annual reports and quality report 2024 (S-L1).'),
  }),
  infra({
    id: 'w-kallby', layer: 'water', kind: 'pumping', name: tx('Källby pumpstation', 'Källby pumping station'),
    lat: 55.6887, lng: 13.1717, verified: true,
    coord: ['estimate', 'Läget är hämtat från VA SYD:s närliggande verk (DATA.md § 14) / Position taken from the adjacent VA SYD works (DATA.md § 14)'],
    role: tx(
      'Pumpstation som styr överföringen mellan Ringsjöverkets och Vombverkets system. Den lokala distributionen sköts av VA SYD.',
      'Pumping station that controls the transfer between the Ringsjöverket and Vombverket systems. Local distribution is run by VA SYD.',
    ),
    status: tx('Funktionen verifierad (S-L1); läget är en uppskattning från det intilliggande verket.', 'Function verified (S-L1); the position is an estimate from the adjacent works.'),
  }),
  // --- Electricity ------------------------------------------------------------
  infra({
    id: 'e-hurva', layer: 'el', kind: 'transmission', name: tx('Hurva 400 kV', 'Hurva 400 kV'),
    lat: 55.8313, lng: 13.6034, verified: true,
    role: tx('Landningspunkt för SydVästlänken, 400 kV till Sege och Barsebäck. Hansa PowerBridge är planerad.', 'Landing point of SydVästlänken, 400 kV to Sege and Barsebäck. Hansa PowerBridge is planned.'),
    status: tx('Verifierat: Svenska kraftnät och Energimarknadsinspektionen (S-L2).', 'Verified: Svenska kraftnät and Energimarknadsinspektionen (S-L2).'),
  }),
  infra({
    id: 'e-barseback', layer: 'el', kind: 'transmission', name: tx('Barsebäck 400/130 kV', 'Barsebäck 400/130 kV'),
    lat: 55.7435, lng: 12.9202, verified: true,
    role: tx(
      'Aktiv stamnätsnod efter reaktorernas nedläggning, ny 400 kV-station 2018. 130 kV-sidan matar regionnätet.',
      'Active transmission node after the reactors closed, new 400 kV station in 2018. The 130 kV side feeds the regional grid.',
    ),
    status: tx('Verifierat: Svenska kraftnät och Energimarknadsinspektionen (S-L2).', 'Verified: Svenska kraftnät and Energimarknadsinspektionen (S-L2).'),
  }),
  infra({
    id: 'e-sege', layer: 'el', kind: 'transmission', name: tx('Sege 400 kV (Arlöv)', 'Sege 400 kV (Arlöv)'),
    lat: 55.6171, lng: 13.0839, verified: true,
    coord: ['estimate', 'Läget ska kontrolleras (DATA.md § 14) / The position is to be checked (DATA.md § 14)'],
    role: tx('Södra noden i stamnätet. Ledningarna till Hurva och Barsebäck är verifierade.', 'The southern node of the transmission grid. The lines to Hurva and Barsebäck are verified.'),
    status: tx('Ledningar verifierade (S-L2); läget ska kontrolleras.', 'Lines verified (S-L2); the position is to be checked.'),
  }),
  infra({
    id: 'e-ortofta', layer: 'el', kind: 'generation', name: tx('Örtoftaverket', 'Örtoftaverket'),
    lat: 55.7895, lng: 13.2557, verified: true,
    role: tx(
      'Kraftringens biobränsleeldade kraftvärmeverk, cirka 220 GWh el per år. En ny enhet planeras till 2028.',
      "Kraftringen's biomass combined heat and power plant, about 220 GWh of electricity a year. A new unit is planned for 2028.",
    ),
    status: tx('Verifierat: Kraftringen (S-L4).', 'Verified: Kraftringen (S-L4).'),
    figures: [{ label: tx('Elproduktion', 'Electricity production'), unit: tx('GWh per år', 'GWh per year'), value: 220, confidence: 'reported', source: 'S-L4', basis: 'cirka' } satisfies InfraFigure],
  }),
  infra({
    id: 'e-regionnat', layer: 'el', kind: 'transmission', name: tx('Regionnät 130 kV: ej kartlagt', 'Regional grid 130 kV: not mapped'),
    lat: 55.72, lng: 13.334, verified: false,
    coord: ['illustrative', 'Illustrativ placering mellan noderna / Illustrative placement between the nodes'],
    role: tx(
      'Hur stamnätet når de lokala näten vid SUS Lund är inte kartlagt. Vem som matar sjukhuset är att verifiera.',
      'How the transmission grid reaches the local grids at SUS Lund is not mapped. Which operator feeds the hospital is to verify.',
    ),
    status: tx('Ej verifierat. Luckan att fylla först.', 'Not verified. The gap to fill first.'),
  }),
  // --- Roads ---------------------------------------------------------------------
  infra({
    id: 'r-lund-n', layer: 'roads', kind: 'junction', osmWayNames: ['Trafikplats Lund Norra'], name: tx('Tpl Lund Norra, E22', 'Tpl Lund Norra, E22'),
    lat: 55.717, lng: 13.2225, verified: true,
    role: tx('Sjukhusets närmaste E22-anslutning. En ny anslutning till Ideon byggs 2025–2028.', "The hospital's nearest E22 access. A new access to Ideon is being built 2025–2028."),
    status: tx('Verifierat: Trafikverket (S-L3).', 'Verified: Trafikverket (S-L3).'),
  }),
  infra({
    id: 'r-lund-s', layer: 'roads', kind: 'junction', osmWayNames: ['Trafikplats Lund Södra'], name: tx('Tpl Lund Södra, E22/108', 'Tpl Lund Södra, E22/108'),
    lat: 55.6803, lng: 13.1828, verified: true,
    role: tx('E22:s södra anslutning till Lund, med väg 108. Alla broar byts ut 2024–2026.', "E22's southern access to Lund, with road 108. All bridges are being replaced 2024–2026."),
    status: tx('Verifierat: Trafikverket (S-L3).', 'Verified: Trafikverket (S-L3).'),
    figures: [{ label: tx('Trafik', 'Traffic'), unit: vehicles, value: 50000, confidence: 'reported', source: 'S-L3', basis: 'mer än' } satisfies InfraFigure],
  }),
  infra({
    id: 'r-gardstanga', layer: 'roads', kind: 'junction', osmWayNames: ['Trafikplats Gårdstånga'], name: tx('Tpl Gårdstånga, E22', 'Tpl Gårdstånga, E22'),
    lat: 55.7712, lng: 13.3226, verified: true,
    role: tx('E22:s port i nordost, i Kävlingeådalen.', "E22's gate to the north-east, in the Kävlingeån valley."),
    status: tx('Verifierat: Trafikverket (S-L3). Själva passagen över Kävlingeån är inte verifierad.', 'Verified: Trafikverket (S-L3). The Kävlingeån crossing itself is not verified.'),
  }),
  infra({
    id: 'r-hoje', layer: 'roads', kind: 'bridge', name: tx('E22 över Höje å', 'E22 over Höje å'),
    lat: 55.6895, lng: 13.1975, verified: true,
    role: tx('E22 passerar Höje å söder om centrala Lund.', 'E22 passes Höje å south of central Lund.'),
    status: tx('Verifierad passage: Trafikverket (S-L3).', 'Verified passage: Trafikverket (S-L3).'),
  }),
];

const link = (id: string, layer: InfraLayer, a: string, b: string, style: InfraLink['style'], verified: boolean, label: LocalizedText = noLabel, offmap?: InfraLink['offmap']): InfraLink => ({
  id, layer, a, b, label, style, verified, ...(offmap ? { offmap } : {}),
});
const SITE = LUND_SITE.id;

/**
 * The roads come from OpenStreetMap, so there are no corridor links (DATA.md § 14). The three transmission lines between the
 * 400 kV nodes are drawn from power.json, as in § 12.5, and are not repeated here; the off-map arrows stay.
 */
export const LUND_INFRA_LINKS: InfraLink[] = [
  link('wl-ringsjo-kallby', 'water', 'w-ringsjo', 'w-kallby', 'dashed', true, tx('Överföring mellan systemen, schematisk dragning', 'Transfer between the systems, schematic routing')),
  link('wl-vomb-kallby', 'water', 'w-vomb', 'w-kallby', 'dashed', true, tx('Överföring mellan systemen, schematisk dragning', 'Transfer between the systems, schematic routing')),
  link('wl-ringsjon-ringsjo', 'water', 'w-ringsjon', 'w-ringsjo', 'dotted', true, tx('Reservråvatten', 'Reserve raw water')),
  link('wl-kallby-site', 'water', 'w-kallby', SITE, 'dotted', false, tx('lokal distribution VA SYD: ska verifieras', 'local distribution VA SYD: to verify')),
  link('wl-ringsjo-bolmen', 'water', 'w-ringsjo', 'w-ringsjo', 'solid', true, noLabel, { dir: 'N', text: tx('Bolmentunneln till Bolmen, 80 km', 'Bolmentunneln to Bolmen, 80 km') }),
  link('el-regionnat-site', 'el', 'e-regionnat', SITE, 'dashed', false, tx('regionnät, ej kartlagt', 'regional grid, not mapped')),
  link('el-ortofta-site', 'el', 'e-ortofta', SITE, 'dashed', false),
  link('el-hurva-sydvastlanken', 'el', 'e-hurva', 'e-hurva', 'solid', true, noLabel, { dir: 'N', text: tx('SydVästlänken', 'SydVästlänken') }),
  link('el-barseback-soderasen', 'el', 'e-barseback', 'e-barseback', 'solid', true, noLabel, { dir: 'N', text: tx('mot Söderåsen', 'to Söderåsen') }),
  link('el-hurva-hansa', 'el', 'e-hurva', 'e-hurva', 'dashed', false, tx('planerad', 'planned'), { dir: 'S', text: tx('Hansa PowerBridge, planerad', 'Hansa PowerBridge, planned') }),
];

export const LUND_SOURCES: SourceRef[] = [
  { key: 'S-L1', name: 'Sydvatten – hållbarhets- och årsredovisningar och kvalitetsrapport 2024', date: '2024' },
  { key: 'S-L2', name: 'Svenska kraftnät / Energimarknadsinspektionen – Hurva–Sege, Hurva–Barsebäck, Barsebäck–Sege och Barsebäck 400/130 kV-station; Wikipedia om SydVästlänken', date: 'undated' },
  { key: 'S-L3', name: 'Trafikverket – E22 Lund Södra och väg 108; E22 genom Skåne', date: 'undated' },
  { key: 'S-L4', name: 'Kraftringen – Örtoftaverket', date: 'undated' },
  { key: 'S-L5', name: 'Trafikverket – vägnumrering (väg 102, väg 108)', date: 'undated' },
];

/** How the nodes find their OpenStreetMap object (SPEC.md § 12.5 applied to Lund, DATA.md § 14): substations and water works by name. */
export const LUND_OSM_MATCHES: Array<{ nodeId: string; term: string; file: 'power' | 'water' }> = [
  { nodeId: 'e-hurva', term: 'Hurva', file: 'power' },
  { nodeId: 'e-barseback', term: 'Barsebäck', file: 'power' },
  { nodeId: 'e-sege', term: 'Sege', file: 'power' },
  { nodeId: 'w-ringsjo', term: 'Ringsjöverket', file: 'water' },
  { nodeId: 'w-vomb', term: 'Vombverket', file: 'water' },
];

/** SPEC.md § 13.4 for Lund: the same three kinds with Lund names; illustrative, the organisations exist and the senders are fictitious. */
export const LUND_MESSAGES: Message[] = [
  {
    id: 'lmsg-road', author: 'Mats Hallin', role: 'Trafikledare, Trafikverket', roleEn: 'Traffic controller, Trafikverket', at: '14:12',
    text: 'Trafikverket: E22 vid Lund Södra avstängd i båda riktningarna, beräknad tid 3 timmar',
    textEn: 'Trafikverket: E22 at Lund Södra closed in both directions, estimated time 3 hours',
  },
  {
    id: 'lmsg-power', author: 'Pia Norrby', role: 'Driftledare, Kraftringen', roleEn: 'Operations controller, Kraftringen', at: '14:18',
    text: 'Kraftringen: strömavbrott i Dalby, beräknad återställning 19:30',
    textEn: 'Kraftringen: power outage in Dalby, estimated restoration 19:30',
  },
  {
    id: 'lmsg-water', author: 'Ola Sandell', role: 'Driftlarm, VA SYD', roleEn: 'Operations alarm, VA SYD', at: '14:25',
    text: 'VA SYD: kokningsrekommendation i Kävlinge tills vidare',
    textEn: 'VA SYD: boil-water advisory in Kävlinge until further notice',
  },
];

/** The three scenario presets for Lund: the interchanges, the power in Dalby, the water in Kävlinge. */
export const LUND_PRESETS: HomeDisruptionPreset[] = [
  {
    key: 'bridge', name: tx('Trafikplatser avstängda', 'Interchanges closed'), blockedNodes: ['r-lund-n', 'r-lund-s'], powerOutZones: [], waterOutZones: [],
    description: tx('Stänger Trafikplats Lund Norra och Södra och öppnar Sjukhus hemma.', 'Closes Trafikplats Lund Norra and Södra and opens Hospital at Home.'),
  },
  {
    key: 'power', name: tx('Elavbrott', 'Power outage'), blockedNodes: [], powerOutZones: ['dalby'], waterOutZones: [],
    description: tx('Slår ut elen i Dalby och öppnar Sjukhus hemma.', 'Cuts the power in Dalby and opens Hospital at Home.'),
  },
  {
    key: 'water', name: tx('Vattenstörning', 'Water disruption'), blockedNodes: [], powerOutZones: [], waterOutZones: ['kavlinge'],
    description: tx('Stör vattnet i Kävlinge och öppnar Sjukhus hemma.', 'Disrupts the water in Kävlinge and opens Hospital at Home.'),
  },
];
