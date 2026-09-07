// The Karolinska data pack – the only dataset in this repository. Every figure carries confidence,
// source (DATA.md § 9 key) or basis. Nothing here is computed from other figures at runtime.
import type {
  AuditEntry,
  BedRequest,
  Bottleneck,
  Capability,
  CareNode,
  Confidence,
  DataPack,
  DischargeReady,
  Figure,
  FlowMetric,
  ForecastProfile,
  LadderStep,
  Message,
  Playbook,
  Resource,
  ResourceRequest,
  ScenarioPreset,
  SiteId,
  SourceRef,
  Staff,
  Ward,
} from './types';
import { PATIENTS_BY_SITE } from './patients';
import { CAP, FLOW_LABELS, SCENARIO_NAMES, VEHICLES } from '../vocab';

// ---------------------------------------------------------------------------
// Figure helpers
type Extra = Partial<Pick<Figure, 'dataSource' | 'lastConfirmed' | 'basis' | 'asOf' | 'verified' | 'estimated' | 'source'>>;
const fig = (value: number | null, confidence: Confidence, rest: Partial<Figure> = {}): Figure => ({ value, confidence, ...rest });
/** Verified public figure. */
const v = (value: number | null, source: string, asOf: string, extra: Extra = {}): Figure => fig(value, 'verified', { source, asOf, ...extra });
/** Reported by Medoma (S21), not verified against a public source. */
const r = (value: number, basis: string, extra: Extra = {}): Figure => fig(value, 'reported', { source: 'S21', asOf: '2026-09-06', basis, ...extra });
/** Estimate derived from verified figures. */
const e = (value: number, basis: string, source?: string, extra: Extra = {}): Figure => fig(value, 'estimate', { basis, source, ...extra });
/** Illustrative scenario value. */
const i = (value: number, basis = 'scenariobaslinje', extra: Extra = {}): Figure => fig(value, 'illustrative', { basis, ...extra });
const ehr = (at = '14:37'): Extra => ({ dataSource: 'EHR', lastConfirmed: at });

const NOW = '14:40';

// ---------------------------------------------------------------------------
// § 3 Capacity ladder
const ladder = (fastsallda: Figure, normal: Figure, v33: Figure, belagda: Figure, lediga: Figure): LadderStep[] => [
  { key: 'fastsallda', label: CAP.ladderSteps.fastsallda, figure: fastsallda },
  { key: 'disponibla_normal', label: CAP.ladderSteps.disponibla_normal, figure: normal },
  { key: 'disponibla_v33', label: CAP.ladderSteps.disponibla_v33, figure: v33 },
  { key: 'belagda', label: CAP.ladderSteps.belagda, figure: belagda },
  { key: 'lediga', label: CAP.ladderSteps.lediga, figure: lediga },
];

const NORMAL_BASIS = 'Karolinskas andel av regionens totala disponibla platser cirka 39 % (915/2 321 i v.33) applicerad på ett regionvärde utanför sommaren på cirka 2 750 (S4a, diagramintervall 2 686–2 798)';

export const LADDERS: DataPack['ladders'] = {
  karolinska: ladder(
    r(1600, 'Fastställda vårdplatser Solna 750–800 och Huddinge 800–850, totalt cirka 1 600; definition att bekräfta'),
    e(1070, NORMAL_BASIS, 'S4a'),
    v(915, 'S4b', '2025-08-13'),
    i(1038, 'summa av siternas scenariobaslinjer', ehr()),
    i(32, 'härlett: disponibla normalvecka minus belagda', ehr()),
  ),
  solna: ladder(
    r(775, 'intervall 750–800; definition att bekräfta (fastställda enligt regionens definition eller fysiska platser)'),
    e(520, 'Karolinska normalvecka cirka 1 070 gånger Solnas andel 775/1 600', 'S4a'),
    e(443, '915 (S4b) gånger 775/1 600', 'S4b'),
    i(497, 'scenariobaslinje', ehr()),
    i(23, 'härlett: 520 minus 497', ehr()),
  ),
  huddinge: ladder(
    r(825, 'intervall 800–850'),
    e(550, '1 070 gånger 825/1 600', 'S4a'),
    e(472, '915 (S4b) gånger 825/1 600', 'S4b'),
    i(541, 'scenariobaslinje', ehr()),
    i(9, 'härlett: 550 minus 541', ehr()),
  ),
};

// ---------------------------------------------------------------------------
// § 2 Nodes
const STOCKHOLM: [number, number] = [59.33, 18.07];

export const NODES: CareNode[] = [
  {
    id: 'solna',
    name: 'Karolinska Solna',
    shortName: 'Solna',
    type: 'Hospital',
    status: 'Operational',
    lead: 'Eva Lind',
    place: 'Solna',
    lat: 59.3522,
    lng: 18.0322,
    sharing: 'Full',
    sync: 'Synced',
    lastSync: '14:37',
    site: 'solna',
    parent: 'karolinska',
    beds: { total: LADDERS.solna[1].figure, free: LADDERS.solna[4].figure },
    intensiveCare: { total: v(18, 'S5', '2025-01-27', { basis: 'utökat från 16 platser 2025-01-27' }), free: i(2, 'scenariobaslinje', ehr('14:35')) },
    staffOnDuty: i(3100, 'illustrativ bemanning i tjänst', { dataSource: 'HR', lastConfirmed: '14:00' }),
    accepts: ['Ward', 'Monitored', 'Intensive'],
    extraFigures: [
      { label: 'Fastställda vårdplatser', figure: LADDERS.solna[0].figure },
      { label: 'THIVA-platser', figure: v(null, 'S5', '2025-01-27', { basis: 'finns, antal ej offentligt' }) },
      { label: 'IMA-platser', figure: i(12, 'IMA Solna finns (S7, A–Ö-lista); antal ej offentligt') },
      { label: 'Akutmottagning', figure: v(null, 'S7', '2026'), text: 'Intensivakuten Solna – tar endast emot ambulans, helikopter och remitterade patienter' },
      { label: 'Traumalarm per år, vuxna', figure: v(1500, 'S8', '2010–', { basis: 'serie sedan 2010, äldre uppgift; cirka 300 barn, cirka 350 svårt skadade (ISS över 15), cirka 2 000 traumaoperationer' }) },
      { label: 'Helikopterplatta', figure: v(null, 'S10', '2026'), text: 'ESHK' },
      { label: 'NKS-byggnaden, vårdplatser', figure: v(550, 'S10', '2026', { basis: 'planeringssiffror, äldre; varav 84 IVA/IMA, 90 dagvårdsplatser, 79 platser patienthotell' }) },
      { label: 'Operationssalar', figure: i(24, 'antal ej offentligt') },
      { label: 'CT-apparater', figure: i(4, 'antal ej offentligt') },
      { label: 'MR-apparater', figure: i(3, 'antal ej offentligt') },
    ],
  },
  {
    id: 'huddinge',
    name: 'Karolinska Huddinge',
    shortName: 'Huddinge',
    type: 'Hospital',
    status: 'Operational',
    lead: 'Peter Nord',
    place: 'Flemingsberg',
    lat: 59.2215,
    lng: 17.939,
    sharing: 'Full',
    sync: 'Synced',
    lastSync: '14:37',
    site: 'huddinge',
    parent: 'karolinska',
    beds: { total: LADDERS.huddinge[1].figure, free: LADDERS.huddinge[4].figure },
    intensiveCare: { total: v(9, 'S5', '2025-01-27'), free: i(0, 'scenariobaslinje', ehr('14:35')) },
    staffOnDuty: i(2800, 'illustrativ bemanning i tjänst', { dataSource: 'HR', lastConfirmed: '14:00' }),
    accepts: ['Ward', 'Monitored', 'Intensive'],
    extraFigures: [
      { label: 'Fastställda vårdplatser', figure: LADDERS.huddinge[0].figure },
      { label: 'IMA-platser', figure: i(8, 'Intermediärvårdavdelning Övre buk Huddinge finns (S7); antal ej offentligt') },
      {
        label: 'Akutmottagningen Huddinge',
        figure: v(70000, 'S6', '2024-09', { basis: 'kapacitet upp till 70 000 besök per år; 4 akutrum, 25 övervakningsplatser, 25 behandlingsrum, 4 isoleringsrum; invigd 2024-09-17. Mitti anger 50 övervakningsplatser – avvikelse noterad' }),
      },
      { label: 'Operationssalar (O-huset)', figure: v(23, 'S9', '2020') },
      { label: 'IVA-expansion 2020', figure: v(64, 'S9', '2020', { basis: 'O-huset byggdes om till 64 IVA-platser på 10 dagar' }) },
      { label: 'CT-apparater', figure: i(3, 'antal ej offentligt') },
      { label: 'MR-apparater', figure: i(2, 'antal ej offentligt') },
      { label: 'Koordinater', figure: e(0, 'centrum Flemingsberg'), text: '59,2215, 17,9390' },
    ],
  },
  ...regionHospital('sos', 'Södersjukhuset', 'SÖS', 391, 14, 59.31, 18.053),
  ...regionHospital('ds', 'Danderyds sjukhus', 'DS', 370, 11, 59.3925, 18.039),
  ...regionHospital('stgoran', 'Capio S:t Görans sjukhus', 'S:t Göran', 344, 9, 59.336, 18.026, e(8, 'forskningsunderlag, äldre uppgift')),
  ...regionHospital('sodertalje', 'Södertälje sjukhus', 'Södertälje', 170, 6, 59.197, 17.629),
  ...regionHospital('norrtalje', 'Norrtälje sjukhus (Tiohundra)', 'Norrtälje', 90, 4, 59.757, 18.698),
  ...regionHospital('ersta', 'Ersta sjukhus', 'Ersta', 41, 2, 59.318, 18.085),
  {
    id: 'geriatrik',
    name: 'Geriatrik (19 kliniker)',
    shortName: 'Geriatrik',
    type: 'Capacity class',
    status: 'Operational',
    lead: 'Anna Ek',
    place: 'Region Stockholm',
    lat: STOCKHOLM[0],
    lng: STOCKHOLM[1],
    sharing: 'Capacity only',
    sync: 'Synced',
    lastSync: '14:30',
    noMarker: true,
    beds: { total: v(1092, 'S4b', '2025-08-13', { basis: 'disponibla platser (Belport)' }), free: v(23, 'S4a', '2025-08-06', { basis: 'lediga 2025-08-06', dataSource: 'Medoma', lastConfirmed: '14:30' }) },
    accepts: ['Ward'],
  },
  {
    id: 'palliativ',
    name: 'Sluten palliativ vård',
    shortName: 'Palliativ',
    type: 'Capacity class',
    status: 'Operational',
    lead: 'Anna Ek',
    place: 'Region Stockholm',
    lat: STOCKHOLM[0],
    lng: STOCKHOLM[1],
    sharing: 'Capacity only',
    sync: 'Synced',
    lastSync: '14:30',
    noMarker: true,
    beds: { total: v(217, 'S4a', '2025-08-07', { basis: 'cirka 217 platser, 14 vårdgivare' }), free: v(null, 'S4a', '2025-08-07', { basis: 'lediga ej offentligt' }) },
    accepts: [],
  },
  {
    id: 'rehab',
    name: 'Specialiserad rehabilitering',
    shortName: 'Rehab',
    type: 'Capacity class',
    status: 'Operational',
    lead: 'Anna Ek',
    place: 'Region Stockholm',
    lat: STOCKHOLM[0],
    lng: STOCKHOLM[1],
    sharing: 'Capacity only',
    sync: 'Synced',
    lastSync: '14:30',
    noMarker: true,
    beds: { total: v(185, 'S4a', '2025-08-07'), free: v(null, 'S4a', '2025-08-07', { basis: 'lediga ej offentligt' }) },
    accepts: [],
  },
  {
    id: 'psykiatri',
    name: 'Psykiatri',
    shortName: 'Psykiatri',
    type: 'Capacity class',
    status: 'Operational',
    lead: 'Anna Ek',
    place: 'Region Stockholm',
    lat: STOCKHOLM[0],
    lng: STOCKHOLM[1],
    sharing: 'Capacity only',
    sync: 'Synced',
    lastSync: '14:30',
    noMarker: true,
    beds: { total: v(1100, 'S4a', '2025-08-07', { basis: 'cirka 980 regiondrivna och cirka 120 privata platser; inte en evakueringsdestination' }), free: v(null, 'S4a', '2025-08-07', { basis: 'lediga ej offentligt' }) },
    accepts: [],
  },
  {
    id: 'asih',
    name: 'ASIH – avancerad sjukvård i hemmet',
    shortName: 'ASIH',
    type: 'Home care',
    status: 'Operational',
    lead: 'Anna Ek',
    place: 'Region Stockholm, 8 geografiska områden',
    lat: STOCKHOLM[0],
    lng: STOCKHOLM[1],
    sharing: 'Full',
    sync: 'Synced',
    lastSync: '14:37',
    radiusKm: 25,
    beds: {
      total: v(3724, 'S4a', '2025-08-07', { basis: 'inskrivna per dag v.32 2025; 8 geografiska områden; krav att nå patienten inom 30 min' }),
      free: i(120, 'kapacitet för nya inskrivningar i dag; ej offentligt', { dataSource: 'Medoma', lastConfirmed: '14:37' }),
    },
    staffOnDuty: i(640, 'illustrativ bemanning', { dataSource: 'Medoma', lastConfirmed: '14:37' }),
    accepts: ['Home'],
  },
  {
    id: 'ambulans',
    name: 'Ambulanssjukvården Region Stockholm',
    shortName: 'Ambulans',
    type: 'Transport',
    status: 'Operational',
    lead: 'Erik Falk',
    place: 'Region Stockholm, cirka 30 stationer',
    lat: STOCKHOLM[0],
    lng: STOCKHOLM[1],
    sharing: 'Full',
    sync: 'Synced',
    lastSync: '14:30',
    noMarker: true,
    accepts: [],
    extraFigures: [
      { label: 'Fordon', figure: v(100, 'S12', '2026', { basis: 'cirka 100 fordon; egen förvaltning sedan 2026-01-01, tidigare AISAB' }) },
      { label: 'Stationer', figure: v(30, 'S12', '2026', { basis: 'cirka 30' }) },
      { label: 'Anställda', figure: v(1700, 'S12', '2026', { basis: 'cirka 1 700' }) },
      { label: 'Ambulanser i drift', figure: v(60, 'S12', '2026', { basis: '40–80 beroende på tid på dygnet; 60 visas' }) },
      { label: 'Uppdrag', figure: v(null, 'S12', '2026'), text: 'Akutambulans, transportambulans, IVA-ambulans, psykiatriambulans, läkartjänst i ambulanshelikopter' },
    ],
  },
];

function regionHospital(id: string, name: string, shortName: string, disponibla: number, free: number, lat: number, lng: number, iva?: Figure): CareNode[] {
  return [
    {
      id,
      name,
      shortName,
      type: 'Hospital',
      status: 'Operational',
      lead: id === 'sos' ? 'Helena Berg' : '',
      place: shortName,
      lat,
      lng,
      sharing: 'Capacity only',
      sync: 'Synced',
      lastSync: '14:30',
      beds: {
        total: v(disponibla, 'S4b', '2025-08-13', { basis: 'disponibla vårdplatser vecka 33 2025' }),
        free: i(free, 'lediga platser nu', { dataSource: 'Medoma', lastConfirmed: '14:30' }),
      },
      intensiveCare: {
        total: iva ?? v(null, 'S4b', '2025-08-13', { basis: 'IVA-platser ej offentligt' }),
        free: fig(null, iva ? 'estimate' : 'verified', { source: 'S4b', basis: 'lediga IVA-platser ej delade' }),
      },
      accepts: ['Ward', 'Monitored', 'Intensive'],
      extraFigures: [{ label: 'Koordinater', figure: e(0, 'ungefärlig placering'), text: `${lat}, ${lng}`.replace(/\./g, ',') }],
    },
  ];
}

// ---------------------------------------------------------------------------
// § 1 Organisation and hospital-wide figures
export const ORGANISATION: DataPack['organisation'] = [
  { key: 'arm', name: 'Tema Akut och Reparativ medicin', type: 'tema', sites: ['solna', 'huddinge'] },
  { key: 'barn', name: 'Tema Barn – Astrid Lindgrens Barnsjukhus', type: 'tema', sites: ['solna', 'huddinge'] },
  { key: 'cancer', name: 'Tema Cancer', type: 'tema', sites: ['solna', 'huddinge'] },
  { key: 'hkn', name: 'Tema Hjärta, Kärl och Neuro', type: 'tema', sites: ['solna', 'huddinge'] },
  { key: 'ia', name: 'Tema Inflammation och Åldrande', type: 'tema', sites: ['solna', 'huddinge'] },
  { key: 'kvh', name: 'Tema Kvinnohälsa och Hälsoprofessioner', type: 'tema', sites: ['solna', 'huddinge'] },
  { key: 'mdk', name: 'Funktion Medicinsk Diagnostik Karolinska', type: 'funktion', sites: ['solna', 'huddinge'] },
  { key: 'barnpmi', name: 'Funktion Barn Perioperativ medicin, intensivvård och transport', type: 'funktion', sites: ['solna'] },
  { key: 'pmi', name: 'Funktion Perioperativ Medicin och Intensivvård', type: 'funktion', sites: ['solna', 'huddinge'] },
];

export const HOSPITAL: DataPack['hospital'] = {
  employees: v(16500, 'S2', '2026-03-11', { basis: 'i cirka 150 yrkeskategorier' }),
  outpatientVisits: v(1600000, 'S2', '2026-03-11'),
  inpatientEpisodes: v(89250, 'S2', '2026-03-11'),
  operations: v(61999, 'S2', '2026-03-11'),
  patientsFromOtherRegions: v(20991, 'S2', '2026-03-11', { basis: '107,9 % av vårduppdraget' }),
  nhvAssignments: v(42, 'S22', '2026-06', { basis: 'uppdrag inom nationell högspecialiserad vård 2026' }),
  staffCategories: [
    { label: 'Sjuksköterskor och barnmorskor', figure: v(5132, 'S20', '2025-02') },
    { label: 'Läkare', figure: e(3053, 'två kategorier har samma tal i underlaget (S20); verifiera före användning', 'S20') },
    { label: 'Undersköterskor och barnsköterskor', figure: e(3053, 'två kategorier har samma tal i underlaget (S20); verifiera före användning', 'S20') },
    { label: 'Övriga yrkeskategorier', figure: e(5262, '16 500 minus de tre kategorierna ovan', 'S2') },
  ],
};

// ---------------------------------------------------------------------------
// § 5.1 Wards (IMA rows added so that IVA step-down requests have a placement target, see DECISIONS.md)
const ward = (site: SiteId, tema: string, name: string, total: number, free: number): Ward => ({ id: `${site}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, site, tema, name, total, free });

export const WARDS: Ward[] = [
  ward('solna', 'HKN', 'HKN Kardiologi', 32, 2),
  ward('solna', 'HKN', 'HKN Neurologi', 28, 1),
  ward('solna', 'Cancer', 'Cancer Onkologi', 30, 3),
  ward('solna', 'Cancer', 'Cancer Hematologi', 24, 0),
  ward('solna', 'ARM', 'ARM Ortopedi', 28, 2),
  ward('solna', 'ARM', 'ARM Kirurgi', 30, 1),
  ward('solna', 'I&Å', 'I&Å Internmedicin', 34, 2),
  ward('solna', 'KVH', 'KVH Gynekologi', 20, 2),
  ward('solna', 'PMI', 'IMA Solna', 12, 1),
  ward('huddinge', 'I&Å', 'I&Å Internmedicin', 36, 1),
  ward('huddinge', 'ARM', 'ARM Kirurgi', 32, 0),
  ward('huddinge', 'ARM', 'ARM Ortopedi', 30, 2),
  ward('huddinge', 'ARM', 'ARM Infektion', 26, 1),
  ward('huddinge', 'Cancer', 'Cancer Onkologi', 28, 2),
  ward('huddinge', 'HKN', 'HKN Kardiologi', 30, 1),
  ward('huddinge', 'KVH', 'KVH Gynekologi', 18, 1),
  ward('huddinge', 'PMI', 'IMA Huddinge', 8, 0),
];

// ---------------------------------------------------------------------------
// Capabilities (components illustrative unless a verified total is cited)
export const CAPABILITIES: Capability[] = [
  {
    id: 'solna-surgery',
    nodeId: 'solna',
    kind: 'surgery',
    name: 'Akut operation',
    unit: 'akuta operationer möjliga nu',
    components: [
      { name: 'Operationssalar', total: 24, available: 6, confidence: 'illustrative', basis: 'antal ej offentligt' },
      { name: 'Kirurger på plats', total: 12, available: 5, confidence: 'illustrative' },
      { name: 'Anestesiteam', total: 8, available: 4, confidence: 'illustrative' },
      { name: 'Instrumentset', total: 20, available: 12, confidence: 'illustrative' },
      { name: 'Postop-platser', total: 14, available: 2, confidence: 'illustrative' },
    ],
    ladder: [
      { label: 'Salar', value: 24 },
      { label: 'Bemannade', value: 6 },
      { label: 'Postopkapacitet', value: 2 },
    ],
    note: 'Strukna i dag: 3 (postop 2, IVA 1). Intensivvård följer sin egen kapacitet.',
  },
  {
    id: 'huddinge-surgery',
    nodeId: 'huddinge',
    kind: 'surgery',
    name: 'Akut operation',
    unit: 'akuta operationer möjliga nu',
    components: [
      { name: 'Operationssalar (O-huset)', total: 23, available: 5, confidence: 'verified', source: 'S9' },
      { name: 'Kirurger på plats', total: 10, available: 4, confidence: 'illustrative' },
      { name: 'Anestesiteam', total: 6, available: 3, confidence: 'illustrative' },
      { name: 'Instrumentset', total: 18, available: 10, confidence: 'illustrative' },
      { name: 'Postop-platser', total: 12, available: 3, confidence: 'illustrative' },
    ],
    ladder: [
      { label: 'Salar', value: 23 },
      { label: 'Bemannade', value: 5 },
      { label: 'Postopkapacitet', value: 3 },
    ],
    note: 'Strukna i dag: 2 (personal 2).',
  },
  {
    id: 'solna-intensive',
    nodeId: 'solna',
    kind: 'intensive',
    name: 'Intensivvård',
    unit: 'IVA-platser lediga',
    components: [
      { name: 'Fysiska IVA-platser', total: 18, available: 2, confidence: 'verified', source: 'S5' },
      { name: 'Bemannade platser', total: 18, available: 2, confidence: 'illustrative' },
      { name: 'Utrustade platser (ventilator, övervakning)', total: 18, available: 2, confidence: 'illustrative' },
      { name: 'Läkemedel och material', total: 18, available: 2, confidence: 'illustrative' },
    ],
    ladder: [
      { label: 'Fysiska', value: 18 },
      { label: 'Bemannade', value: 18 },
      { label: 'Lediga', value: 2 },
    ],
    note: 'THIVA-platser finns (S5) men ingår inte; antal ej offentligt. IMA Solna 12 platser (illustrativt) kan öppnas som överflöd.',
  },
  {
    id: 'huddinge-intensive',
    nodeId: 'huddinge',
    kind: 'intensive',
    name: 'Intensivvård',
    unit: 'IVA-platser lediga',
    components: [
      { name: 'Fysiska IVA-platser', total: 9, available: 0, confidence: 'verified', source: 'S5' },
      { name: 'Bemannade platser', total: 9, available: 0, confidence: 'illustrative' },
      { name: 'Utrustade platser (ventilator, övervakning)', total: 9, available: 0, confidence: 'illustrative' },
      { name: 'Läkemedel och material', total: 9, available: 1, confidence: 'illustrative' },
    ],
    ladder: [
      { label: 'Fysiska', value: 9 },
      { label: 'Bemannade', value: 9 },
      { label: 'Lediga', value: 0 },
    ],
    note: 'IVA Huddinge fullt: 2 väntar på IVA-plats, 1 väntar på nedflytt. O-huset byggdes om till 64 IVA-platser på 10 dagar 2020 (S9).',
  },
  {
    id: 'solna-ct',
    nodeId: 'solna',
    kind: 'ct',
    name: 'Bilddiagnostik CT',
    unit: 'CT-apparater i drift',
    components: [
      { name: 'CT-apparater', total: 4, available: 3, confidence: 'illustrative', basis: 'antal ej offentligt' },
      { name: 'Röntgensjuksköterskor', total: 6, available: 4, confidence: 'illustrative' },
      { name: 'Radiologer', total: 4, available: 3, confidence: 'illustrative' },
      { name: 'Transportörer', total: 3, available: 3, confidence: 'illustrative' },
    ],
    note: 'CT 1 av 4 ur drift sedan 13:50 (RIS). Reparation beräknad 17:00. 11 inneliggande väntar, median 95 min.',
  },
  {
    id: 'huddinge-ct',
    nodeId: 'huddinge',
    kind: 'ct',
    name: 'Bilddiagnostik CT',
    unit: 'CT-apparater i drift',
    components: [
      { name: 'CT-apparater', total: 3, available: 3, confidence: 'illustrative', basis: 'antal ej offentligt' },
      { name: 'Röntgensjuksköterskor', total: 5, available: 4, confidence: 'illustrative' },
      { name: 'Radiologer', total: 3, available: 3, confidence: 'illustrative' },
      { name: 'Transportörer', total: 3, available: 3, confidence: 'illustrative' },
    ],
    note: '9 inneliggande väntar, median 70 min.',
  },
  {
    id: 'solna-beds',
    nodeId: 'solna',
    kind: 'beds',
    name: 'Vårdplatser',
    unit: 'vårdplatser lediga',
    components: [
      { name: 'Fastställda platser (lokalmässigt)', total: 775, available: 278, confidence: 'reported', source: 'S21' },
      { name: 'Disponibla platser (bemannade och utrustade)', total: 520, available: 23, confidence: 'estimate', source: 'S4a' },
    ],
    ladder: [
      { label: 'Fastställda', value: 775 },
      { label: 'Disponibla', value: 520 },
      { label: 'Lediga', value: 23 },
    ],
    note: 'Kan frigöras: 23 utskrivningsklara (5 ASIH-kandidater), 40 patienter aktuella för överflyttning (se Evakuering).',
  },
  {
    id: 'huddinge-beds',
    nodeId: 'huddinge',
    kind: 'beds',
    name: 'Vårdplatser',
    unit: 'vårdplatser lediga',
    components: [
      { name: 'Fastställda platser (lokalmässigt)', total: 825, available: 284, confidence: 'reported', source: 'S21' },
      { name: 'Disponibla platser (bemannade och utrustade)', total: 550, available: 9, confidence: 'estimate', source: 'S4a' },
    ],
    ladder: [
      { label: 'Fastställda', value: 825 },
      { label: 'Disponibla', value: 550 },
      { label: 'Lediga', value: 9 },
    ],
    note: 'Kan frigöras: 31 utskrivningsklara (8 ASIH-kandidater), 40 patienter aktuella för överflyttning (se Evakuering).',
  },
];

// ---------------------------------------------------------------------------
// Bottlenecks (SPEC.md § 6.5, from DATA.md § 2 and § 4)
export const BOTTLENECKS: Bottleneck[] = [
  {
    rank: 1,
    nodeId: 'solna',
    capabilityKind: 'surgery',
    capacity: 'Akut operation',
    limitingResource: 'Postop-platser (2 av 14 lediga)',
    impact: '2 akuta operationer möjliga nu, 6 salar lediga',
    wouldUnlock: '2 postop-platser till ger 2 operationer till; därefter begränsar anestesiteam vid 4',
  },
  {
    rank: 2,
    nodeId: 'solna',
    capabilityKind: 'surgery',
    capacity: 'Akut operation',
    limitingResource: 'Anestesiteam (4 av 8 tillgängliga)',
    impact: 'Nästa begränsning när postop frigörs',
    wouldUnlock: 'Inkallning av 2 anestesiteam ger 2 operationer till',
  },
  {
    rank: 3,
    nodeId: 'solna',
    capabilityKind: 'ct',
    capacity: 'Bilddiagnostik CT',
    limitingResource: 'CT 1 av 4 ur drift sedan 13:50',
    impact: '11 inneliggande väntar, median 95 min',
    wouldUnlock: 'Reparation beräknad 17:00, eller 4 undersökningar flyttas till Huddinge',
  },
  {
    rank: 4,
    nodeId: 'huddinge',
    capabilityKind: 'intensive',
    capacity: 'Intensivvård',
    limitingResource: 'IVA Huddinge fullt (0 av 9 lediga)',
    impact: '2 väntar på IVA-plats, 1 väntar på nedflytt',
    wouldUnlock: 'Nedflytt av 1 patient till IMA ger 1 plats; IMA som överflöd ger 6',
  },
  {
    rank: 5,
    nodeId: 'ambulans',
    capacity: 'Transport',
    limitingResource: 'Transportambulanser (6 av 20 lediga)',
    impact: 'Utskrivningar till geriatrik och ASIH väntar på transport',
    wouldUnlock: '4 transportambulanser till ger cirka 12 patienter per timme',
  },
  {
    rank: 6,
    nodeId: 'huddinge',
    capabilityKind: 'beds',
    capacity: 'Vårdplatser',
    limitingResource: 'ASIH-flöde (8 ASIH-kandidater väntar på utskrivning)',
    impact: '8 vårdplatser bundna av utskrivningsklara patienter',
    wouldUnlock: 'ASIH-förfrågan för 8 patienter ger 8 vårdplatser',
  },
];

// ---------------------------------------------------------------------------
// § 4 Läget nu baseline
type Row = [key: string, block: FlowMetric['block'], solna: Figure, huddinge: Figure, qualifier?: string];
const rows: Row[] = [
  ['akuten.patients', 'akuten', i(22, 'scenariobaslinje', ehr()), i(84, 'scenariobaslinje', ehr()), 'Solna är Intensivakuten'],
  ['akuten.waitingBed', 'akuten', i(6, 'färdigbedömda', ehr()), i(17, 'färdigbedömda', ehr())],
  ['akuten.longestWait', 'akuten', i(190, 'minuter', ehr()), i(340, 'minuter', ehr())],
  ['akuten.over4h', 'akuten', i(0.34, 'andel', ehr()), i(0.41, 'andel', ehr())],
  ['akuten.timeToDoctor', 'akuten', i(18, 'minuter', ehr()), i(47, 'minuter', ehr())],
  ['akuten.trauma', 'akuten', i(4, 'verifierad årsvolym (S8) ger cirka 4 per dag; dagens antal illustrativt', { ...ehr(), source: 'S8' }), i(0, 'dagens antal illustrativt', ehr())],
  ['beds.disponibla', 'vardplatser', LADDERS.solna[1].figure, LADDERS.huddinge[1].figure],
  ['beds.belagda', 'vardplatser', i(497, 'scenariobaslinje', ehr()), i(541, 'scenariobaslinje', ehr())],
  ['beds.overbelaggning', 'vardplatser', i(4, 'scenariobaslinje', ehr()), i(6, 'scenariobaslinje', ehr())],
  ['beds.utlokaliserade', 'vardplatser', i(7, 'scenariobaslinje', ehr()), i(9, 'scenariobaslinje', ehr())],
  ['beds.utskrivningsklara', 'vardplatser', i(23, 'scenariobaslinje', ehr()), i(31, 'scenariobaslinje', ehr())],
  ['beds.asihEligible', 'vardplatser', i(5, 'scenariobaslinje', ehr()), i(8, 'scenariobaslinje', ehr())],
  ['op.program', 'operation', i(38, 'scenariobaslinje', { dataSource: 'OR planning', lastConfirmed: '14:30' }), i(41, 'scenariobaslinje', { dataSource: 'OR planning', lastConfirmed: '14:30' })],
  ['op.done', 'operation', i(24, 'scenariobaslinje', { dataSource: 'OR planning', lastConfirmed: '14:30' }), i(27, 'scenariobaslinje', { dataSource: 'OR planning', lastConfirmed: '14:30' })],
  ['op.cancelled', 'operation', i(3, 'postop 2, IVA 1', { dataSource: 'OR planning', lastConfirmed: '14:30' }), i(2, 'personal 2', { dataSource: 'OR planning', lastConfirmed: '14:30' })],
  ['op.waiting90', 'operation', i(410, 'vårdgarantin; kö-fritt-målet', { dataSource: 'OR planning', lastConfirmed: '14:30' }), i(520, 'vårdgarantin; kö-fritt-målet', { dataSource: 'OR planning', lastConfirmed: '14:30' })],
  ['ct.waiting', 'bild', i(11, 'scenariobaslinje', { dataSource: 'RIS', lastConfirmed: '14:20' }), i(9, 'scenariobaslinje', { dataSource: 'RIS', lastConfirmed: '14:20' })],
  ['ct.median', 'bild', i(95, 'minuter', { dataSource: 'RIS', lastConfirmed: '14:20' }), i(70, 'minuter', { dataSource: 'RIS', lastConfirmed: '14:20' })],
  ['ct.down', 'bild', i(1, 'CT 1 av 4 ur drift', { dataSource: 'RIS', lastConfirmed: '14:20' }), i(0, 'scenariobaslinje', { dataSource: 'RIS', lastConfirmed: '14:20' })],
  ['ct.total', 'bild', i(4, 'antal ej offentligt'), i(3, 'antal ej offentligt')],
  ['mr.waiting', 'bild', i(6, 'scenariobaslinje', { dataSource: 'RIS', lastConfirmed: '14:20' }), i(4, 'scenariobaslinje', { dataSource: 'RIS', lastConfirmed: '14:20' })],
  ['iva.total', 'iva', v(18, 'S5', '2025-01-27'), v(9, 'S5', '2025-01-27')],
  ['iva.occupied', 'iva', i(16, 'scenariobaslinje', ehr('14:35')), i(9, 'scenariobaslinje', ehr('14:35'))],
  ['iva.waiting', 'iva', i(1, 'scenariobaslinje', ehr('14:35')), i(2, 'scenariobaslinje', ehr('14:35'))],
  ['iva.stepdown', 'iva', i(3, 'scenariobaslinje', ehr('14:35')), i(1, 'scenariobaslinje', ehr('14:35'))],
  ['ima.total', 'iva', i(12, 'antal ej offentligt'), i(8, 'antal ej offentligt')],
  ['ima.occupied', 'iva', i(11, 'scenariobaslinje', ehr('14:35')), i(8, 'scenariobaslinje', ehr('14:35'))],
  ['staff.vacant', 'bemanning', i(9, 'Bemanningscentrum', { dataSource: 'HR', lastConfirmed: '14:00' }), i(12, 'Bemanningscentrum', { dataSource: 'HR', lastConfirmed: '14:00' })],
  ['staff.agency', 'bemanning', i(6, 'scenariobaslinje', { dataSource: 'HR', lastConfirmed: '14:00' }), i(8, 'scenariobaslinje', { dataSource: 'HR', lastConfirmed: '14:00' })],
  ['staff.sick', 'bemanning', i(0.068, 'andel', { dataSource: 'HR', lastConfirmed: '14:00' }), i(0.074, 'andel', { dataSource: 'HR', lastConfirmed: '14:00' })],
];

export const FLOW_METRICS: FlowMetric[] = rows.flatMap(([key, block, solna, huddinge, qualifier]) => [
  { key, site: 'solna' as const, block, label: FLOW_LABELS[key] ?? key, value: solna, qualifier },
  { key, site: 'huddinge' as const, block, label: FLOW_LABELS[key] ?? key, value: huddinge, qualifier },
]);

// ---------------------------------------------------------------------------
// § 5.2 Bed requests
const br = (id: string, site: SiteId, from: string, patient: string, age: number, needs: string[], h: number, m: number): BedRequest => ({
  id,
  site,
  from,
  patient,
  age,
  needs,
  waitingMin: h * 60 + m,
});
export const BED_REQUESTS: BedRequest[] = [
  br('br-1', 'huddinge', 'Akutmottagningen', 'Andersson, Anna', 74, ['Telemetri', 'HKN'], 5, 40),
  br('br-2', 'huddinge', 'Akutmottagningen', 'Bergström, Björn', 58, ['Isolering', 'ARM Infektion'], 4, 15),
  br('br-3', 'huddinge', 'Akutmottagningen', 'Carlsson, Cecilia', 81, ['I&Å'], 3, 50),
  br('br-4', 'huddinge', 'Akutmottagningen', 'Dahl, David', 45, ['ARM Kirurgi'], 3, 5),
  br('br-5', 'huddinge', 'Postop', 'Ekström, Elin', 67, ['ARM Ortopedi'], 1, 20),
  br('br-6', 'huddinge', 'IVA nedflytt', 'Forsberg, Fredrik', 52, ['IMA'], 6, 0),
  br('br-7', 'huddinge', 'Norrtälje sjukhus, remiss', 'Gustafsson, Gunilla', 70, ['HKN'], 2, 30),
  br('br-8', 'solna', 'Intensivakuten', 'Hedlund, Hans', 63, ['Telemetri', 'HKN'], 3, 10),
  br('br-9', 'solna', 'Intensivakuten', 'Isaksson, Ingrid', 77, ['Cancer Onkologi'], 2, 20),
  br('br-10', 'solna', 'Postop', 'Jonsson, Johan', 39, ['ARM Ortopedi'], 0, 50),
  br('br-11', 'solna', 'IVA nedflytt', 'Karlsson, Karin', 55, ['IMA'], 4, 30),
  br('br-12', 'solna', 'Södersjukhuset, remiss', 'Lindqvist, Lars', 61, ['HKN Neurologi'], 1, 45),
];

/** The emergency department name per site – requests from it count in "Väntar på vårdplats". */
export const ED_NAME: Record<SiteId, string> = { solna: 'Intensivakuten', huddinge: 'Akutmottagningen' };

// ---------------------------------------------------------------------------
// § 5.3 Discharge-ready patients
const dr = (id: string, site: SiteId, wardName: string, patient: string, age: number, days: number, waitingFor: string, asih: boolean): DischargeReady => ({
  id,
  site,
  wardId: WARDS.find((w) => w.site === site && w.name === wardName)!.id,
  patient,
  age,
  daysWaiting: days,
  waitingFor,
  asihEligible: asih,
  status: 'Väntar',
});
export const DISCHARGE_READY: DischargeReady[] = [
  dr('dr-1', 'huddinge', 'I&Å Internmedicin', 'Magnusson, Maria', 88, 4, 'Kommunal korttidsplats', false),
  dr('dr-2', 'huddinge', 'I&Å Internmedicin', 'Nyström, Nils', 79, 2, 'ASIH', true),
  dr('dr-3', 'huddinge', 'ARM Ortopedi', 'Olofsson, Olivia', 83, 3, 'Geriatrik', false),
  dr('dr-4', 'huddinge', 'ARM Infektion', 'Persson, Per', 66, 1, 'ASIH (iv-antibiotika)', true),
  dr('dr-5', 'huddinge', 'Cancer Onkologi', 'Qvist, Rebecka', 71, 2, 'ASIH', true),
  dr('dr-6', 'huddinge', 'HKN Kardiologi', 'Rosén, Stefan', 69, 1, 'Hemsjukvård', true),
  dr('dr-7', 'solna', 'HKN Neurologi', 'Sandberg, Tove', 76, 5, 'Rehabilitering', false),
  dr('dr-8', 'solna', 'Cancer Onkologi', 'Törnqvist, Ulf', 64, 2, 'ASIH', true),
  dr('dr-9', 'solna', 'I&Å Internmedicin', 'Ullman, Vera', 91, 6, 'Kommunal korttidsplats', false),
  dr('dr-10', 'solna', 'ARM Kirurgi', 'Vikström, William', 58, 1, 'ASIH', true),
  dr('dr-11', 'solna', 'HKN Kardiologi', 'Wallin, Ylva', 72, 3, 'Geriatrik', false),
  dr('dr-12', 'solna', 'Cancer Hematologi', 'Åberg, Åsa', 60, 2, 'ASIH', true),
];

// ---------------------------------------------------------------------------
// § 5.4 Forecast profiles
const DISCHARGE_SHARES = [
  { from: 10, to: 12, share: 0.25 },
  { from: 12, to: 14, share: 0.3 },
  { from: 14, to: 16, share: 0.25 },
  { from: 16, to: 18, share: 0.15 },
];
export const FORECAST_PROFILES: ForecastProfile[] = [
  {
    site: 'huddinge',
    arrivalsPerHour: [
      { from: 6, to: 10, rate: 6 },
      { from: 10, to: 18, rate: 9 },
      { from: 18, to: 22, rate: 8 },
      { from: 22, to: 30, rate: 4 },
    ],
    admissionShare: 0.32,
    plannedDischargesToday: 52,
    dischargeShareByHour: DISCHARGE_SHARES,
    electiveAdmissionsTomorrow: 24,
  },
  {
    site: 'solna',
    arrivalsPerHour: [
      { from: 7, to: 19, rate: 1.2 },
      { from: 19, to: 31, rate: 0.7 },
    ],
    admissionShare: 0.7,
    plannedDischargesToday: 46,
    dischargeShareByHour: DISCHARGE_SHARES,
    electiveAdmissionsTomorrow: 22,
  },
];

// ---------------------------------------------------------------------------
// § 6.1 Inventory
type ResourceRow = [name: string, category: Resource['category'], unit: string, total: number, available: number, inUse: number, outOfService: number, notInService?: number, extra?: Partial<Resource>];

function resourceRows(nodeId: string, lastConfirmed: string, list: ResourceRow[]): Resource[] {
  return list.map(([name, category, unit, total, available, inUse, outOfService, notInService = 0, extra], idx) => ({
    id: `${nodeId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
    nodeId,
    name,
    category,
    unit,
    total,
    available,
    inUse,
    reserved: 0,
    outOfService,
    notInService,
    inTransit: 0,
    unknown: 0,
    dataSource: 'Logistics',
    lastConfirmed,
    confidence: 'illustrative',
    ...extra,
  }));
}

export const RESOURCES: Resource[] = [
  ...resourceRows('solna', '14:15', [
    ['Ventilator', 'Equipment', 'st', 34, 4, 28, 2],
    ['Infusionspump', 'Equipment', 'st', 260, 30, 226, 4],
    ['Patientmonitor', 'Equipment', 'st', 60, 8, 52, 0],
    ['Syrgaskoncentrator', 'Equipment', 'st', 24, 9, 15, 0],
    ['Defibrillator', 'Equipment', 'st', 28, 3, 25, 0],
    ['Mobil ultraljud', 'Equipment', 'st', 8, 2, 6, 0],
    ['Rullstol', 'Equipment', 'st', 70, 10, 60, 0],
    ['Bår', 'Equipment', 'st', 30, 8, 22, 0],
    ['Syrgas (flaskor)', 'Supply', 'flaskor', 160, 160, 0, 0, 0, { lowBelow: 80 }],
    ['Blodprodukter O-negativ', 'Supply', 'enheter', 22, 22, 0, 0, 0, { criticalBelow: 20, lowBelow: 40 }],
    ['Antibiotika iv, bredspektrum', 'Supply', 'dagar', 6, 6, 0, 0, 0, { lowBelow: 3 }],
    ['NaCl 1 000 ml', 'Supply', 'påsar', 900, 900, 0, 0, 0, { lowBelow: 300 }],
    ['Morfin 10 mg', 'Supply', 'ampuller', 160, 160, 0, 0, 0, { lowBelow: 150, criticalBelow: 60 }],
    ['Tourniquet', 'Supply', 'st', 40, 40, 0, 0, 0, { lowBelow: 50 }],
    ['Skyddsutrustning', 'Supply', 'set', 3000, 3000, 0, 0, 0, { lowBelow: 800 }],
  ]),
  ...resourceRows('huddinge', '14:15', [
    ['Ventilator', 'Equipment', 'st', 22, 2, 19, 1],
    ['Infusionspump', 'Equipment', 'st', 220, 24, 192, 4],
    ['Patientmonitor', 'Equipment', 'st', 52, 6, 46, 0],
    ['Syrgaskoncentrator', 'Equipment', 'st', 18, 6, 12, 0],
    ['Defibrillator', 'Equipment', 'st', 24, 2, 22, 0],
    ['Mobil ultraljud', 'Equipment', 'st', 6, 2, 4, 0],
    ['Rullstol', 'Equipment', 'st', 60, 8, 52, 0],
    ['Bår', 'Equipment', 'st', 25, 7, 18, 0],
    ['Syrgas (flaskor)', 'Supply', 'flaskor', 120, 120, 0, 0, 0, { lowBelow: 60 }],
    ['Blodprodukter O-negativ', 'Supply', 'enheter', 16, 16, 0, 0, 0, { criticalBelow: 20, lowBelow: 40 }],
    ['Antibiotika iv, bredspektrum', 'Supply', 'dagar', 5, 5, 0, 0, 0, { lowBelow: 3 }],
    ['NaCl 1 000 ml', 'Supply', 'påsar', 800, 800, 0, 0, 0, { lowBelow: 300 }],
    ['Morfin 10 mg', 'Supply', 'ampuller', 140, 140, 0, 0, 0, { lowBelow: 150, criticalBelow: 60 }],
    ['Tourniquet', 'Supply', 'st', 35, 35, 0, 0, 0, { lowBelow: 50 }],
    ['Skyddsutrustning', 'Supply', 'set', 2400, 2400, 0, 0, 0, { lowBelow: 800 }],
  ]),
  ...resourceRows('ambulans', '14:30', [
    [VEHICLES.akut, 'Transport', 'fordon', 100, 12, 60, 0, 28, { note: 'Ej i tjänst: fordon utan bemanning just nu' }],
    [VEHICLES.transport, 'Transport', 'fordon', 20, 6, 14, 0, 0, { note: 'Liggande sjuktransport' }],
    [VEHICLES.iva, 'Transport', 'fordon', 4, 2, 2, 0],
    [VEHICLES.helicopter, 'Transport', 'fordon', 1, 1, 0, 0, 0, { note: 'Antal helikoptrar ej offentligt; 1 visas illustrativt' }],
    [VEHICLES.bus, 'Transport', 'fordon', 2, 2, 0, 0, 0, { note: 'Sjukvårdsbuss' }],
  ]),
];

// ---------------------------------------------------------------------------
// § 6.2 Requests
export const REQUESTS: ResourceRequest[] = [
  { id: 'req-1', resourceName: 'Ventilator', quantity: 2, unit: 'st', toNodeId: 'huddinge', priority: 'High', status: 'Requested', requestedBy: 'Peter Nord', requestedAt: '13:52', note: 'Två IVA-kandidater på akuten' },
  { id: 'req-2', resourceName: 'Syrgaskoncentrator', quantity: 6, unit: 'st', fromNodeId: 'solna', toNodeId: 'huddinge', priority: 'Normal', status: 'Accepted', requestedBy: 'Peter Nord', requestedAt: '14:05' },
  { id: 'req-3', resourceName: VEHICLES.transport, quantity: 2, unit: 'fordon', fromNodeId: 'ambulans', toNodeId: 'huddinge', priority: 'High', status: 'Dispatched', requestedBy: 'Karin Sjö', requestedAt: '14:07', eta: '15:10', note: 'Utskrivningsklara till geriatrik' },
  { id: 'req-4', resourceName: 'NaCl 1 000 ml', quantity: 100, unit: 'påsar', fromNodeId: 'solna', toNodeId: 'huddinge', priority: 'Normal', status: 'Dispatched', requestedBy: 'Karin Sjö', requestedAt: '13:30', eta: '14:50' },
  { id: 'req-5', resourceName: 'Rullstol', quantity: 4, unit: 'st', fromNodeId: 'huddinge', toNodeId: 'huddinge', priority: 'Normal', status: 'Received', requestedBy: 'Peter Nord', requestedAt: '13:10', note: 'Till akutens triage' },
];

// ---------------------------------------------------------------------------
// § 6.3 Messages
export const MESSAGES: Message[] = [
  { id: 'msg-1', author: 'Peter Nord', role: 'Chefssjuksköterska akuten Huddinge', nodeId: 'huddinge', at: '13:52', text: 'Behöver två ventilatorer till akuten Huddinge, två patienter kan behöva andningsstöd innan IVA-plats finns.' },
  { id: 'msg-2', author: 'Maria Holm', role: 'Verksamhetschef IVA Solna', nodeId: 'solna', at: '14:05', text: 'Vi saknar syrgas till IMA – sex koncentratorer räcker för kvällen.' },
  { id: 'msg-3', author: 'Karin Sjö', role: 'Logistiksamordnare', nodeId: 'huddinge', at: '14:20', text: 'Akuten behöver fyra rullstolar och två bårar till triagen.' },
];

// ---------------------------------------------------------------------------
// § 7 People (all fictional)
export const STAFF: Staff[] = [
  { name: 'Eva Lind', title: 'Kapacitetskoordinator, Stab Produktion', profession: 'Supp', nodeId: 'karolinska' },
  { name: 'Johan Ek', title: 'Överläkare, PMI', profession: 'Doc', nodeId: 'solna' },
  { name: 'Maria Holm', title: 'Verksamhetschef IVA Solna', profession: 'Doc', nodeId: 'solna' },
  { name: 'Omar Haddad', title: 'Anestesiläkare, PMI', profession: 'Doc', nodeId: 'huddinge' },
  { name: 'Peter Nord', title: 'Chefssjuksköterska, Akutmottagningen Huddinge', profession: 'Nrs', nodeId: 'huddinge' },
  { name: 'Sara Lund', title: 'Sjuksköterska, Intensivakuten', profession: 'Nrs', nodeId: 'solna' },
  { name: 'Karin Sjö', title: 'Logistiksamordnare, Stab Produktion', profession: 'Supp', nodeId: 'huddinge' },
  { name: 'Erik Falk', title: 'Samordnare, Ambulanssjukvården', profession: 'Supp', nodeId: 'ambulans' },
  { name: 'Lena Åkesson', title: 'Kommunikatör (KiB)', profession: 'Supp', nodeId: 'karolinska' },
  { name: 'Helena Berg', title: 'Chefläkare, Södersjukhuset', profession: 'Doc', nodeId: 'sos' },
  { name: 'Mats Öberg', title: 'Vårdhubbsansvarig', profession: 'Nrs' },
  { name: 'Jonas Vik', title: 'Fältsjukhuschef', profession: 'Doc' },
  { name: 'Anna Ek', title: 'Verksamhetschef ASIH', profession: 'Nrs', nodeId: 'asih' },
];

// ---------------------------------------------------------------------------
// § 8.2 Playbooks
const t = (area: string, title: string, ownerRole: string, dueOffsetMin: number, note?: string): Playbook['tasks'][number] => ({ area, title, ownerRole, dueOffsetMin, note });

export const PLAYBOOKS: Playbook[] = [
  {
    id: 'pb1',
    key: 'masskada',
    code: 'PB1',
    name: 'Allvarlig händelse: masskada',
    trigger: 'Larm från TiB eller TCK om många skadade',
    summary: 'Etablerar LSSL, frigör operations- och intensivvårdskapacitet, startar överföringar till region och ASIH och säkrar förråd och transport.',
    defaultLage: 'Förstärkningsläge',
    roles: ['Sjukvårdsledare LSSL', 'Medicinskt ansvarig', 'Akutansvarig', 'Operationsansvarig (PMI)', 'IVA-ansvarig', 'Logistikansvarig', 'Kommunikationsansvarig (KiB)', 'Krisstödsansvarig (PKL)'],
    channels: ['LSSL', 'Akuten', 'Operation och IVA', 'Logistik och transport', 'Samverkan RSSL'],
    targets: [
      { label: 'Triagekapacitet akuten Solna', target: 40, unit: 'patienter', withinMin: 30, measure: 'triageSolna' },
      { label: 'Operationssalar tillgängliga', target: 8, unit: 'salar', withinMin: 60, measure: 'theatresAvailable' },
      { label: 'IVA-platser tillkomna', target: 6, unit: 'platser', withinMin: 120, measure: 'icuAdded' },
      { label: 'Vårdplatser frigjorda', target: 40, unit: 'platser', withinMin: 240, measure: 'bedsFreed' },
    ],
    tasks: [
      t('Akuten', 'Upprätta triagezoner röd/gul/grön', 'Akutansvarig', 15),
      t('Akuten', 'Töm akuten på färdigbedömda patienter', 'Akutansvarig', 20),
      t('Akuten', 'Öppna andra traumabayen', 'Medicinskt ansvarig', 30),
      t('Operation och IVA', 'Stryk elektiv operation och frigör salar', 'Operationsansvarig (PMI)', 30),
      t('Operation och IVA', 'Kalla in anestesiteam', 'Operationsansvarig (PMI)', 45),
      t('Operation och IVA', 'Öppna IMA som IVA-överflöd', 'IVA-ansvarig', 90),
      t('Vårdavdelningar', 'Identifiera patienter för tidigare utskrivning', 'Medicinskt ansvarig', 45),
      t('Vårdavdelningar', 'Starta överföringsplanering till region och ASIH', 'Medicinskt ansvarig', 60),
      t('Vårdavdelningar', 'Frigör 40 vårdplatser', 'Medicinskt ansvarig', 240),
      t('Logistik och transport', 'Begär ventilatorer till Huddinge', 'Logistikansvarig', 30),
      t('Logistik och transport', 'Begär transportresurser från Ambulanssjukvården', 'Logistikansvarig', 45),
      t('Logistik och transport', 'Kontrollera blodprodukter och syrgas', 'Logistikansvarig', 30),
      t('Samverkan och kommunikation', 'Anmäl läget till TiB och RSSL', 'Sjukvårdsledare LSSL', 10),
      t('Samverkan och kommunikation', 'Öppna kanaler och starta inkallning', 'Kommunikationsansvarig (KiB)', 15),
      t('Samverkan och kommunikation', 'Aktivera PKL', 'Krisstödsansvarig (PKL)', 30),
    ],
  },
  {
    id: 'pb2',
    key: 'journalbortfall',
    code: 'PB2',
    name: 'Journalsystem otillgängligt',
    trigger: 'Journalsystemet eller sjukhusets nät otillgängligt',
    summary: 'Växlar sjukhuset till den operativa spegeln och manuella reservrutiner, som i juni 2022 (S16) när RSSL gick till stabsläge.',
    defaultLage: 'Stabsläge',
    setsEhrOutage: true,
    roles: ['Sjukvårdsledare LSSL', 'IT-kontakt', 'Ansvarig reservrutiner'],
    channels: ['LSSL', 'IT och avdelningar'],
    targets: [{ label: 'Avdelningar bekräftade på reservrutin', target: 4, unit: 'avdelningar', withinMin: 30, measure: 'wardsOnMirror' }],
    tasks: [
      t('IT', 'Bekräfta störningens omfattning med IT', 'IT-kontakt', 10),
      t('Avdelningar', 'Gå över till operativ spegel och läskopia på alla avdelningar', 'Ansvarig reservrutiner', 30),
      t('Avdelningar', 'Utse avdelningsrunners för pappersordinationer', 'Ansvarig reservrutiner', 20),
      t('Avdelningar', 'Frys icke-akuta överflyttningar', 'Sjukvårdsledare LSSL', 15),
      t('Avdelningar', 'Verifiera kritiska läkemedelslistor mot senaste spegling', 'Ansvarig reservrutiner', 45),
      t('IT', 'Förbered återsynkronisering', 'IT-kontakt', 60),
    ],
  },
  {
    id: 'pb3',
    key: 'mottagande',
    code: 'PB3',
    name: 'Mottagande av evakuerade patienter',
    trigger: 'RSSL fördelar patienter från annan region eller annat land',
    summary: 'Tar emot patienter som RSSL fördelar till Karolinska, som övat i Sjukvårdsövning 26 (S15) med ett scenario på cirka 260 patienter.',
    defaultLage: 'Stabsläge',
    roles: ['Sjukvårdsledare LSSL', 'Medicinskt ansvarig', 'Logistikansvarig'],
    channels: ['LSSL', 'Samverkan RSSL'],
    targets: [{ label: 'Mottagningsplatser bekräftade', target: 60, unit: 'platser', withinMin: 120, measure: 'receivingBeds' }],
    tasks: [
      t('Samverkan', 'Bekräfta tilldelning från RSSL', 'Sjukvårdsledare LSSL', 10),
      t('Vårdavdelningar', 'Reservera mottagningsplatser per tema', 'Medicinskt ansvarig', 30),
      t('Logistik', 'Ordna mottagningsplats vid ambulanshallen Huddinge', 'Logistikansvarig', 45),
      t('Vårdavdelningar', 'Aktivera ASIH för utskrivningsklara', 'Medicinskt ansvarig', 60),
      t('Samverkan', 'Rapportera läge till RSSL', 'Sjukvårdsledare LSSL', 90),
    ],
  },
  {
    id: 'pb4',
    key: 'evakuering',
    code: 'PB4',
    name: 'Evakuering av sjukvårdsinrättning',
    trigger: 'Del av sjukhuset måste utrymmas',
    summary: 'Klassificerar patienter för flytt, begär mottagningskapacitet via RSSL och transport, och startar evakueringsplaneringen.',
    defaultLage: 'Förstärkningsläge',
    navigateTo: '/evakuering',
    roles: ['Sjukvårdsledare LSSL', 'Medicinskt ansvarig', 'Logistikansvarig'],
    channels: ['LSSL', 'Logistik och transport'],
    targets: [{ label: 'Patienter flyttade', target: 60, unit: 'patienter', withinMin: 240, measure: 'patientsMoved' }],
    tasks: [
      t('Vårdavdelningar', 'Klassificera patienter för flytt', 'Medicinskt ansvarig', 20),
      t('Samverkan', 'Begär mottagningskapacitet via RSSL', 'Sjukvårdsledare LSSL', 20),
      t('Logistik och transport', 'Begär transportresurser', 'Logistikansvarig', 30),
      t('Vårdavdelningar', 'Starta evakueringsplanering', 'Medicinskt ansvarig', 30),
    ],
  },
  {
    id: 'pb5',
    key: 'pandemi',
    code: 'PB5',
    name: 'Pandemisk våg',
    trigger: 'Snabbt ökande behov av intensivvård',
    summary: 'Bygger ut intensivvården stegvis och stryker elektiv verksamhet; referensen är ombyggnaden av O-huset till 64 IVA-platser på 10 dagar 2020 (S9).',
    defaultLage: 'Förstärkningsläge',
    tickDays: true,
    roles: ['Sjukvårdsledare LSSL', 'IVA-ansvarig', 'Logistikansvarig'],
    channels: ['LSSL', 'Operation och IVA'],
    targets: [{ label: 'IVA-platser tillkomna', target: 20, unit: 'platser', withinMin: 10 * 1440, withinUnit: 'dygn', measure: 'icuAddedDays' }],
    tasks: [
      t('Operation och IVA', 'Aktivera plan för IVA-utbyggnad i O-huset', 'IVA-ansvarig', 60, 'Referens: O-huset Huddinge byggdes om till 64 IVA-platser på 10 dagar 2020 (S9).'),
      t('Operation och IVA', 'Stryk elektiv verksamhet stegvis', 'Sjukvårdsledare LSSL', 120),
      t('Logistik', 'Säkra ventilatorer och syrgas', 'Logistikansvarig', 120),
    ],
  },
];

// ---------------------------------------------------------------------------
// § 8.3 Scenario presets (illustrative)
export const SCENARIOS: ScenarioPreset[] = [
  {
    key: 'masskada',
    name: SCENARIO_NAMES.masskada,
    params: { skadade: 60, rod: 20, gul: 40, gron: 40, fonster: 120, forsta: 20, primar: 'solna', sekundar: 'huddinge' },
    paramDefs: [
      { key: 'skadade', label: 'Skadade', type: 'number' },
      { key: 'rod', label: 'Röd, andel', type: 'number', unit: '%' },
      { key: 'gul', label: 'Gul, andel', type: 'number', unit: '%' },
      { key: 'gron', label: 'Grön, andel', type: 'number', unit: '%' },
      { key: 'fonster', label: 'Ankomstfönster', type: 'number', unit: 'min' },
      { key: 'forsta', label: 'Första ankomst', type: 'number', unit: 'min' },
      {
        key: 'primar',
        label: 'Primär mottagare',
        type: 'select',
        options: [
          { value: 'solna', label: 'Karolinska Solna (TCK)' },
          { value: 'huddinge', label: 'Karolinska Huddinge' },
        ],
      },
      {
        key: 'sekundar',
        label: 'Sekundär mottagare',
        type: 'select',
        options: [
          { value: 'huddinge', label: 'Karolinska Huddinge' },
          { value: 'solna', label: 'Karolinska Solna' },
        ],
      },
    ],
    tickMin: 15,
    horizonTicks: 16,
  },
  {
    key: 'tryck',
    name: SCENARIO_NAMES.tryck,
    params: { faktor: 1.3, timmar: 6, site: 'huddinge' },
    paramDefs: [
      { key: 'faktor', label: 'Inflödesfaktor', type: 'number' },
      { key: 'timmar', label: 'Varaktighet', type: 'number', unit: 'h' },
    ],
    tickMin: 15,
    horizonTicks: 24,
  },
  {
    key: 'journalbortfall',
    name: SCENARIO_NAMES.journalbortfall,
    params: { timmar: 6 },
    paramDefs: [{ key: 'timmar', label: 'Varaktighet', type: 'number', unit: 'h' }],
    tickMin: 15,
    horizonTicks: 24,
  },
  {
    key: 'mottagande',
    name: SCENARIO_NAMES.mottagande,
    params: { patienter: 260, timmar: 12, andel: 35 },
    paramDefs: [
      { key: 'patienter', label: 'Patienter', type: 'number' },
      { key: 'timmar', label: 'Varaktighet', type: 'number', unit: 'h' },
      { key: 'andel', label: 'Karolinskas andel', type: 'number', unit: '%' },
    ],
    tickMin: 15,
    horizonTicks: 48,
  },
  {
    key: 'pandemi',
    name: SCENARIO_NAMES.pandemi,
    params: { ivaPerDygn: 3, dygn: 14 },
    paramDefs: [
      { key: 'ivaPerDygn', label: 'IVA-behov per dygn', type: 'number' },
      { key: 'dygn', label: 'Antal dygn', type: 'number', unit: 'dygn' },
    ],
    tickMin: 1440,
    horizonTicks: 14,
  },
  {
    key: 'siteevac',
    name: SCENARIO_NAMES.siteevac,
    params: { site: 'huddinge', patienter: 60 },
    paramDefs: [
      {
        key: 'site',
        label: 'Site',
        type: 'select',
        options: [
          { value: 'huddinge', label: 'Karolinska Huddinge' },
          { value: 'solna', label: 'Karolinska Solna' },
        ],
      },
      { key: 'patienter', label: 'Patienter', type: 'number' },
    ],
    tickMin: 15,
    horizonTicks: 0,
  },
];

// ---------------------------------------------------------------------------
// § 9 Sources
export const SOURCES: SourceRef[] = [
  { key: 'S1', name: 'karolinska.se – Teman och funktioner', url: 'https://www.karolinska.se/om-oss/organisation/teman-och-funktioner/', date: 'sidan ändrad 2026-08-03' },
  { key: 'S2', name: 'karolinska.se – Fakta om sjukhuset (statistik 2025)', url: 'https://www.karolinska.se/om-oss/fakta-om-sjukhuset/', date: '2026-03-11' },
  { key: 'S3', name: 'karolinska.se – Sjukhusets organisation', url: 'https://www.karolinska.se/om-oss/organisation/', date: '2026' },
  { key: 'S4a', name: 'Region Stockholm – Vårdplatsrapport vecka 32 2025', url: 'https://www.regionstockholm.se/4a2404/contentassets/8b5c3bf15757467c8a6fd7078ef39625/vardplatsrapport-v32-2025.pdf', date: '2025-08-07' },
  { key: 'S4b', name: 'Region Stockholm – Vårdplatsrapport vecka 33 2025', url: 'https://www.regionstockholm.se/4a314e/contentassets/844e94c11f884b0982a5446da9fe6d9b/vardplatsrapport-v33-2025.pdf', date: '2025-08-13' },
  { key: 'S5', name: 'karolinska.se – Fler svårt sjuka kan få vård när Karolinska öppnar fler IVA-platser', url: 'https://www.karolinska.se/om-oss/centrala-nyheter/2025/01/fler-svart-sjuka-kan-fa-vard-nar-karolinska-universitetssjukhuset-oppnar-fler-iva-platser/', date: '2025-01-27' },
  { key: 'S6', name: 'Karolinska/Cision – Nya akutmottagningen Huddinge (2024-09); Mitti 2024-09-16', url: 'https://www.mitti.se/nyheter/nya-akutmottagningen-pa-karolinska-i-huddinge-invigd-6.3.246216.07c6c1df22', date: '2024-09' },
  { key: 'S7', name: 'karolinska.se – Intensivakuten Solna; Mottagningar och avdelningar A–Ö', url: 'https://www.karolinska.se/vard/tema/tema-akut-och-reparativ-medicin/akut/intensivakuten-solna/', date: '2026' },
  { key: 'S8', name: 'karolinska.se – Traumacentrum Karolinska (TCK)', date: 'serie sedan 2010 (äldre)' },
  { key: 'S9', name: 'SVT / White Arkitekter – O-huset Huddinge, 23 operationssalar, 64 IVA-platser 2020', date: '2020 (äldre)' },
  { key: 'S10', name: 'sv.wikipedia.org – Nya Karolinska Solna; en.wikipedia.org – Karolinska University Hospital (koordinater, ESHK)', date: '2026 (planeringssiffror äldre)' },
  { key: 'S11', name: 'karolinska.se – Stab Produktion', url: 'https://www.karolinska.se/om-oss/organisation/Administrativa-verksamheter/central-produktionsstyrning/', date: '2026-07-29' },
  { key: 'S12', name: 'regionstockholm.se – Ambulanssjukvården (förvaltning från 2026-01-01; fordon, stationer, anställda)', date: '2025–2026' },
  { key: 'S13', name: 'Region Stockholm – Regionala riktlinjer för katastrofmedicinsk beredskap (HSN)', url: 'https://www.regionstockholm.se/4a74e8/siteassets/om-region-stockholm/om-region-stockholm/styrande-dokument/sakerhet-och-krisberedskap/regionala-riktlinjer-for-katastrofmedicinsk-beredskap-for-region-stockholm.pdf', date: '2022-10' },
  { key: 'S14', name: 'Socialstyrelsen – Nya regler från 2026 (HSL-beredskap; lagerhållning 2027); prop. 2024/25:167', url: 'https://www.socialstyrelsen.se/aktuellt/nya-regler-fran-2026-halso--och-sjukvardens-beredskap-starks-vid-kris-och-krig/', date: '2025-11-24' },
  { key: 'S15', name: 'regionstockholm.se – Region Stockholm deltar i totalförsvarsövning Aurora (Sjukvårdsövning 26, 4–8 maj 2026); SOS Alarm/SR om scenariot med cirka 260 patienter', url: 'https://www.regionstockholm.se/nyheter/2026/05/region-stockholm-deltar-i-totalforsvarsovning-aurora/', date: '2026-05' },
  { key: 'S16', name: 'regionstockholm.se – It-störning i journalsystemet TakeCare', url: 'https://www.regionstockholm.se/nyheter/2022/06/it-storning-i-journalsystemet-takecare/', date: '2022-06' },
  { key: 'S17', name: 'regionstockholm.se – Beslut om nytt huvudjournalsystem (Cambio Cosmic)', url: 'https://www.regionstockholm.se/nyheter/2025/02/beslut-om-nytt-huvudjournalsystem-for-region-stockholm/', date: '2025-02 / 2025-11' },
  { key: 'S18', name: 'regionstockholm.se / Socialstyrelsen – vårdplatser 2025 (4 208 somatiska; IVA 85,3 mot riktvärde 87,8)', date: '2026-06' },
  { key: 'S19', name: 'GE HealthCare – Command Center at Alfred Health (ORA)', url: 'https://www.gehealthcare.com/en-us/about/newsroom/press-releases/ge-healthcare-s-command-center-moves-from-concept-to-reality-at-three-melbourne-hospitals', date: '2026-03-19' },
  { key: 'S20', name: 'karolinska.se – personalsiffror 2024 (5 132 sjuksköterskor/barnmorskor, 3 053 läkare, 3 053 undersköterskor) – två kategorier har samma tal; verifiera före användning', date: '2025-02' },
  { key: 'S21', name: 'Medoma (Philip Smith) – fastställda vårdplatser Huddinge 800–850, Solna 750–800, totalt cirka 1 600', date: '2026-09-06' },
  { key: 'S22', name: 'sv.wikipedia.org – Karolinska universitetssjukhuset (42 NHV-uppdrag 2026)', date: '2026-06' },
];

// Regional and hospital-wide figures that belong to a source but no node (shown on Källor).
export const REGION_FIGURES: Array<{ label: string; figure: Figure; text?: string }> = [
  { label: 'Disponibla vårdplatser akutsjukhus inkl. Karolinska, vecka 33 2025', figure: v(2321, 'S4b', '2025-08-13') },
  { label: 'Disponibla vårdplatser Karolinska, vecka 32 2025', figure: v(862, 'S4a', '2025-08-07') },
  { label: 'Disponibla somatiska vårdplatser i regionen 2025, genomsnitt', figure: v(4208, 'S18', '2026-06') },
  { label: 'Disponibla IVA-platser i regionen', figure: v(85.3, 'S18', '2026-06', { basis: 'mot Socialstyrelsens riktvärde 87,8' }) },
  { label: 'IVA-platser i Stockholm', figure: v(100, 'S5', '2025-01-27', { basis: 'cirka 100, varav ungefär en tredjedel på Karolinskas enhet för Intensivvård och Thoraxoperation' }) },
  { label: 'Stab Produktion', figure: v(null, 'S11', '2026-07-29'), text: 'Bemanningscentrum, Produktion och uppföljning, Vårdadministration' },
  { label: 'Regionala beredskapstermer', figure: v(null, 'S13', '2022-10'), text: 'TiB, RSSL, LSSL, EKMB, SSR, KiB, PKL; beredskapslägen stabsläge, förstärkningsläge, katastrofläge' },
  { label: 'Gränser för beredskapsläge i scenariomotorn', figure: i(60, '20–60 skadade ger förstärkningsläge, över 60 katastrofläge; illustrativt') },
  { label: 'Nya regler för hälso- och sjukvårdens beredskap', figure: v(null, 'S14', '2025-11-24'), text: 'HSL-beredskap från 2026; lagerhållning 2027' },
  { label: 'Sjukvårdsövning 26 (Aurora)', figure: v(260, 'S15', '2026-05', { basis: 'scenario med cirka 260 patienter' }) },
  { label: 'It-störning i journalsystemet TakeCare', figure: v(null, 'S16', '2022-06'), text: 'RSSL gick till stabsläge; vården växlade till manuella reservrutiner' },
  { label: 'Nytt huvudjournalsystem (Cambio Cosmic)', figure: v(null, 'S17', '2025-02'), text: 'Beslut om byte av huvudjournalsystem' },
  { label: 'Command Center vid Alfred Health (ORA)', figure: v(null, 'S19', '2026-03-19'), text: 'Referens för kommandocentral' },
  { label: 'Teman och funktioner', figure: v(9, 'S1', '2026-08-03', { basis: 'sex teman och tre funktioner' }) },
  { label: 'Sjukhusets organisation', figure: v(null, 'S3', '2026'), text: 'Organiserad kring patientens väg; funktioner är kompetensområden som skär genom teman' },
];

// ---------------------------------------------------------------------------
// Sources shown in the Kapacitet sync popover (SPEC.md § 6.5)
export const HOSPITAL_SOURCES: DataPack['hospitalSources'] = [
  { source: 'EHR', state: 'Synced', lastSync: '14:37' },
  { source: 'HR', state: 'Synced', lastSync: '14:00' },
  { source: 'RIS', state: 'Synced', lastSync: '14:20' },
  { source: 'OR planning', state: 'Synced', lastSync: '14:30' },
  { source: 'Logistics', state: 'Synced', lastSync: '14:15' },
];

// ---------------------------------------------------------------------------
// § 2.7 Preset sites and the initial audit log
export const PRESET_SITES: DataPack['presetSites'] = [
  { name: 'Tillfällig vårdhubb Flemingsberg', place: 'Flemingsberg', lat: 59.22, lng: 17.945 },
  { name: 'Tillfällig vårdhubb Hagastaden', place: 'Hagastaden', lat: 59.348, lng: 18.04 },
  { name: 'Fältsjukhus Norrtälje övningsområde', place: 'Norrtälje', lat: 59.75, lng: 18.71 },
  { name: 'Vårdhubb Kista', place: 'Kista', lat: 59.4033, lng: 17.9424 },
  { name: 'Vårdhubb Södertälje', place: 'Södertälje', lat: 59.195, lng: 17.63 },
];

export const INITIAL_LOG: AuditEntry[] = [
  { id: 'log-1', at: '13:10', actor: 'Peter Nord', action: 'Begärde', object: 'Rullstol × 4', detail: 'Till Karolinska Huddinge, akutens triage', ref: 'req-5' },
  { id: 'log-2', at: '13:30', actor: 'Karin Sjö', action: 'Begärde', object: 'NaCl 1 000 ml × 100', detail: 'Till Karolinska Huddinge', ref: 'req-4' },
  { id: 'log-3', at: '13:50', actor: 'System', action: 'Markerade ur drift', object: 'CT 1 Solna', detail: 'Rapporterat av RIS' },
  { id: 'log-4', at: '13:52', actor: 'Peter Nord', action: 'Begärde', object: 'Ventilator × 2', detail: 'Till Karolinska Huddinge', ref: 'req-1' },
  { id: 'log-5', at: '14:05', actor: 'Peter Nord', action: 'Begärde', object: 'Syrgaskoncentrator × 6', detail: 'Till Karolinska Huddinge', ref: 'req-2' },
  { id: 'log-6', at: '14:07', actor: 'Karin Sjö', action: 'Begärde', object: `${VEHICLES.transport} × 2`, detail: 'Till Karolinska Huddinge', ref: 'req-3' },
  { id: 'log-7', at: '14:37', actor: 'System', action: 'Synk klar', object: 'Journalsystem', detail: 'Karolinska Solna och Huddinge' },
];

// ---------------------------------------------------------------------------
export const KAROLINSKA_PACK: DataPack = {
  nodes: NODES,
  ladders: LADDERS,
  hospital: HOSPITAL,
  organisation: ORGANISATION,
  wards: WARDS,
  capabilities: CAPABILITIES,
  bottlenecks: BOTTLENECKS,
  flowMetrics: FLOW_METRICS,
  bedRequests: BED_REQUESTS,
  dischargeReady: DISCHARGE_READY,
  forecastProfiles: FORECAST_PROFILES,
  resources: RESOURCES,
  requests: REQUESTS,
  messages: MESSAGES,
  staff: STAFF,
  playbooks: PLAYBOOKS,
  scenarios: SCENARIOS,
  sources: SOURCES,
  hospitalSources: HOSPITAL_SOURCES,
  patientsBySite: PATIENTS_BY_SITE,
  presetSites: PRESET_SITES,
  initialLog: INITIAL_LOG,
  demoNow: NOW,
};

export function loadPack(): DataPack {
  return KAROLINSKA_PACK;
}
