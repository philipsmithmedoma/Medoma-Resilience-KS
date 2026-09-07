// Every user-visible string, enum label and colour key lives here (CLAUDE.md § Hard constraints).
// Keys, enum values and types stay English; labels are Swedish in sentence case (DESIGN-KS.md § 1).
import type {
  AcceptsLevel,
  BeredskapsLage,
  CareLevel,
  Confidence,
  DataSource,
  DischargeStatus,
  Equipment,
  FlowBlock,
  LadderKey,
  MoveStatus,
  NodeStatus,
  NodeType,
  Priority,
  Profession,
  RequestStatus,
  ResourceCategory,
  ScenarioKey,
  SharingLevel,
  Stability,
  SyncState,
  TaskStatus,
  TransportNeed,
} from './types';

// ---------------------------------------------------------------------------
// Current user and constants
export const CURRENT_USER = { name: 'Eva Lind', initials: 'EL', role: 'Kapacitetskoordinator, Stab Produktion' } as const;
export const SYSTEM_ACTOR = 'System';
export const COMMANDER_ROLE = 'Sjukvårdsledare LSSL';
export const LSSL_CHANNEL = 'LSSL';

export const KAROLINSKA_ID = 'karolinska';
export const REGION_ID = 'region';
export const AMBULANCE_NODE_ID = 'ambulans';
export const ASIH_ID = 'asih';
export const GERIATRIK_ID = 'geriatrik';
export const DEFAULT_SCOPE = KAROLINSKA_ID;

export const DEMO_DATE = 'fredag 4 september 2026';
export const CUSTOMER_NAME = 'Karolinska Universitetssjukhuset';
export const REGION_NAME = 'Region Stockholm';

// ---------------------------------------------------------------------------
// Navigation (DESIGN-KS.md § 2)
export interface ModuleDef {
  key: string;
  label: string;
  path: string;
}
export const MODULES: ModuleDef[] = [
  { key: 'flow', label: 'Läget nu', path: '/laget-nu' },
  { key: 'capacity', label: 'Kapacitet', path: '/kapacitet' },
  { key: 'incident', label: 'Incident', path: '/incident' },
  { key: 'evacuation', label: 'Evakuering', path: '/evakuering' },
  { key: 'resources', label: 'Resurser', path: '/resurser' },
  { key: 'network', label: 'Nätverk', path: '/natverk' },
];

export const SCOPE_LABELS = {
  karolinska: 'Karolinska',
  karolinskaLong: 'Karolinska (båda siter)',
  solna: 'Karolinska Solna',
  huddinge: 'Karolinska Huddinge',
  region: 'Region Stockholm',
  menuLabel: 'Omfattning',
} as const;

export const SITE_LABELS = { solna: 'Solna', huddinge: 'Huddinge' } as const;

// ---------------------------------------------------------------------------
// Enum value lists and labels
export const NODE_TYPES: NodeType[] = ['Hospital', 'Care hub', 'Field hospital', 'Home care', 'Capacity class', 'Transport'];
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  Hospital: 'Sjukhus',
  'Care hub': 'Vårdhubb',
  'Field hospital': 'Fältsjukhus',
  'Home care': 'Hemsjukvård',
  'Capacity class': 'Kapacitetsklass',
  Transport: 'Transport',
};
export const NODE_STATUSES: NodeStatus[] = ['Operational', 'Degraded', 'Standing up', 'Offline'];
export const NODE_STATUS_LABELS: Record<NodeStatus, string> = { Operational: 'I drift', Degraded: 'Nedsatt', 'Standing up': 'Under uppstart', Offline: 'Ur drift' };
export const SHARING_LEVELS: SharingLevel[] = ['Full', 'Capacity only', 'None'];
export const SHARING_LABELS: Record<SharingLevel, string> = { Full: 'Full', 'Capacity only': 'Endast kapacitet', None: 'Ingen' };
export const SYNC_STATES: SyncState[] = ['Synced', 'Delayed', 'Manual', 'Offline'];
export const SYNC_LABELS: Record<SyncState, string> = { Synced: 'Synkad', Delayed: 'Fördröjd', Manual: 'Manuell', Offline: 'Frånkopplad' };
export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  EHR: 'Journalsystem',
  HR: 'HR',
  RIS: 'RIS',
  'OR planning': 'Operationsplanering',
  Logistics: 'Logistik',
  Manual: 'Manuell',
  Medoma: 'Medoma',
  Mirror: 'Spegel',
};
export const STABILITIES: Stability[] = ['Stable', 'Monitor', 'Critical'];
export const STABILITY_LABELS: Record<Stability, string> = { Stable: 'Stabil', Monitor: 'Övervakning', Critical: 'Kritisk' };
export const CARE_LEVELS: CareLevel[] = ['Ward', 'Monitored', 'Intensive'];
export const CARE_LEVEL_LABELS: Record<AcceptsLevel, string> = { Ward: 'Vårdavdelning', Monitored: 'Övervakad', Intensive: 'Intensivvård', Home: 'Hemmet' };
export const ACCEPTS_LEVELS: AcceptsLevel[] = ['Ward', 'Monitored', 'Intensive', 'Home'];
export const TRANSPORT_NEEDS: TransportNeed[] = ['Walking', 'Wheelchair', 'Stretcher', 'Ambulance', 'Intensive care transport'];
export const TRANSPORT_LABELS: Record<TransportNeed, string> = {
  Walking: 'Gående',
  Wheelchair: 'Rullstol',
  Stretcher: 'Bår',
  Ambulance: 'Ambulans',
  'Intensive care transport': 'Intensivvårdstransport',
};
export const EQUIPMENT: Equipment[] = ['Oxygen', 'IV infusion', 'Monitoring'];
export const EQUIPMENT_LABELS: Record<Equipment, string> = { Oxygen: 'Syrgas', 'IV infusion': 'Infusion', Monitoring: 'Övervakning' };
export const MOVE_STATUSES: MoveStatus[] = ['Planned', 'Accepted', 'Transport assigned', 'Departed', 'Arrived', 'Handed over'];
export const MOVE_STATUS_LABELS: Record<MoveStatus, string> = {
  Planned: 'Planerad',
  Accepted: 'Accepterad',
  'Transport assigned': 'Transport tilldelad',
  Departed: 'Avrest',
  Arrived: 'Ankommen',
  'Handed over': 'Överlämnad',
};
export const PRIORITIES: Priority[] = ['Low', 'Normal', 'High', 'Critical'];
export const PRIORITY_LABELS: Record<Priority, string> = { Low: 'Låg', Normal: 'Normal', High: 'Hög', Critical: 'Kritisk' };
export const REQUEST_STATUSES: RequestStatus[] = ['Requested', 'Accepted', 'Allocated', 'Dispatched', 'Received', 'Rejected'];
export const REQUEST_CHAIN: RequestStatus[] = ['Requested', 'Accepted', 'Allocated', 'Dispatched', 'Received'];
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  Requested: 'Begärd',
  Accepted: 'Accepterad',
  Allocated: 'Tilldelad',
  Dispatched: 'Utsänd',
  Received: 'Mottagen',
  Rejected: 'Avvisad',
};
export const TASK_STATUSES: TaskStatus[] = ['Not started', 'In progress', 'Done'];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { 'Not started': 'Ej påbörjad', 'In progress': 'Pågår', Done: 'Klar' };
export const RESOURCE_CATEGORIES: ResourceCategory[] = ['Equipment', 'Transport', 'Team', 'Supply'];
export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = { Equipment: 'Utrustning', Transport: 'Transport', Team: 'Team', Supply: 'Förbrukning' };
export const PROFESSIONS: Profession[] = ['Doc', 'Nrs', 'AsPr', 'Supp'];
export const PROFESSION_LABELS: Record<Profession, string> = { Doc: 'Läkare', Nrs: 'Sjuksköterska', AsPr: 'Undersköterska', Supp: 'Stödfunktion' };
export const LAGEN: BeredskapsLage[] = ['Normalläge', 'Stabsläge', 'Förstärkningsläge', 'Katastrofläge'];
export const DISCHARGE_STATUSES: DischargeStatus[] = ['Väntar', 'ASIH-förfrågan skickad', 'Geriatrik-förfrågan skickad', 'Utskriven'];

export type SupplyStatus = 'Ok' | 'Low' | 'Critical';
export const SUPPLY_STATUSES: SupplyStatus[] = ['Ok', 'Low', 'Critical'];
export const SUPPLY_STATUS_LABELS: Record<SupplyStatus, string> = { Ok: 'Ok', Low: 'Låg', Critical: 'Kritisk' };
export const INVENTORY_STATUS_OUT_OF_SERVICE = 'Out of service';
export const INVENTORY_STATUS_LABELS: Record<string, string> = { ...SUPPLY_STATUS_LABELS, [INVENTORY_STATUS_OUT_OF_SERVICE]: 'Ur funktion' };

export const STABILITY_TO_CARE_LEVEL: Record<Stability, CareLevel> = { Stable: 'Ward', Monitor: 'Monitored', Critical: 'Intensive' };
export const ACCEPTS_FOR_CARE_LEVEL: Record<CareLevel, AcceptsLevel> = { Ward: 'Ward', Monitored: 'Monitored', Intensive: 'Intensive' };

// Vehicle compatibility (DATA.md § 6.1)
export const VEHICLES = {
  akut: 'Akutambulans',
  transport: 'Transportambulans',
  iva: 'IVA-ambulans',
  helicopter: 'Ambulanshelikopter',
  bus: 'Buss',
} as const;
export const TRANSPORT_COMPATIBILITY: Record<TransportNeed, string[]> = {
  Walking: [VEHICLES.transport, VEHICLES.bus, VEHICLES.akut],
  Wheelchair: [VEHICLES.transport, VEHICLES.bus, VEHICLES.akut],
  Stretcher: [VEHICLES.transport, VEHICLES.akut],
  Ambulance: [VEHICLES.akut],
  'Intensive care transport': [VEHICLES.iva],
};

// ---------------------------------------------------------------------------
// Confidence (DESIGN-KS.md § 4)
export const CONFIDENCE_CHIPS: Record<Confidence, string | null> = {
  verified: null,
  reported: 'Uppgift',
  estimate: 'Estimat',
  illustrative: 'Illustrativt',
};
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  verified: 'Verifierad',
  reported: 'Uppgift',
  estimate: 'Estimat',
  illustrative: 'Illustrativt',
};
export const CONFIDENCE_TEXT = {
  verified: 'Verifierad uppgift',
  reported: 'Uppgift från Medoma, ej verifierad mot öppen källa',
  estimate: 'Estimat',
  illustrative: 'Illustrativt scenariovärde, inte Karolinskas data',
  mirror: 'Spegel',
  mirrorText: (since: string) => `Journalsystemet är frånkopplat sedan ${since}. Värdet kommer från den operativa spegeln och visas som estimat.`,
  showInSources: 'Visa i Källor',
  source: 'Källa',
  unknown: 'Okänt',
  basis: 'Grund',
} as const;

// ---------------------------------------------------------------------------
// Chip tones (DESIGN.md § 1 semantic mapping)
export type ChipTone = 'green' | 'warning' | 'red' | 'grey' | 'blue';

const TONES: Record<string, ChipTone> = {
  Operational: 'green',
  Synced: 'green',
  Ok: 'green',
  Done: 'green',
  Stable: 'green',
  Received: 'green',
  'Handed over': 'green',
  Normalläge: 'green',
  Normalt: 'green',
  Utskriven: 'green',
  Degraded: 'warning',
  Delayed: 'warning',
  Low: 'warning',
  Estimat: 'warning',
  Spegel: 'warning',
  Monitor: 'warning',
  'Standing up': 'warning',
  Suggested: 'warning',
  Ansträngt: 'warning',
  Stabsläge: 'warning',
  Förstärkningsläge: 'warning',
  Utlokalisering: 'warning',
  Offline: 'red',
  Critical: 'red',
  'Out of service': 'red',
  Rejected: 'red',
  Kritiskt: 'red',
  Katastrofläge: 'red',
  Brist: 'red',
  Unknown: 'grey',
  'Not started': 'grey',
  'Not shared': 'grey',
  Manual: 'grey',
  Uppgift: 'grey',
  Illustrativt: 'grey',
  Väntar: 'grey',
  'In progress': 'blue',
  Planned: 'blue',
  Requested: 'blue',
  Accepted: 'blue',
  Allocated: 'blue',
  Dispatched: 'blue',
  'Transport assigned': 'blue',
  Departed: 'blue',
  Arrived: 'blue',
  Active: 'blue',
  Incident: 'blue',
  Limiting: 'red',
  'ASIH-förfrågan skickad': 'blue',
  'Geriatrik-förfrågan skickad': 'blue',
};

export function toneOf(key: string): ChipTone {
  return TONES[key] ?? 'grey';
}

// ---------------------------------------------------------------------------
// Shared UI strings
export const LABELS = {
  demo: 'Demo',
  simulateEhrOutage: 'Simulera journalbortfall',
  resetDemo: 'Återställ demo',
  demoReset: 'Demon återställd',
  demoClock: (hhmm: string) => `Demoklocka: ${hhmm}, ${DEMO_DATE}.`,
  openIncident: 'Öppna incident',
  closeIncident: 'Avsluta incident',
  incidentBanner: (name: string, lage: string, at: string, by: string, commander: string) =>
    `Incidentläge aktivt: ${name}. ${lage}. Aktiverat ${at} av ${by}. Sjukvårdsledare: ${commander}.`,
  notShared: 'Delas inte',
  notAvailableAtNode: 'Finns inte vid denna nod',
  unknown: 'Okänt',
  lastConfirmed: (at: string, source: string) => `Senast bekräftad ${at} (${source})`,
  lastConfirmedLabel: 'Senast bekräftad',
  olderThan30: 'Äldre än 30 minuter',
  operatingOnMirror: 'Arbetar på spegel',
  ehrOffline: (since: string) => `Journalsystem frånkopplat, spegel sedan ${since}`,
  showDetail: 'Visa detalj',
  log: 'Logg',
  showLog: 'Visa logg',
  auditLog: 'Händelselogg',
  change: 'Ändra',
  cancel: 'Avbryt',
  close: 'Stäng',
  none: 'Ingen',
  nothing: 'Inget',
  yes: 'Ja',
  no: 'Nej',
  sources: 'Källor',
  sum: 'Summa',
  of: 'av',
  entries: (n: number) => `${n} poster, senaste först.`,
  backToStart: 'Till start',
  selectPerson: 'Välj person',
  scopeAria: (name: string) => `Omfattning: ${name}`,
  chat: 'Chatt',
  support: 'Support',
  documentation: 'Dokumentation',
  ariaExpand: (name: string) => `Visa ${name}`,
  ariaCollapse: (name: string) => `Dölj ${name}`,
  ariaOpen: (name: string) => `Öppna ${name}`,
  ariaSortBy: (label: string) => `Sortera efter ${label}`,
  ariaFilter: (label: string) => `Filtrera ${label}`,
  ariaProgress: (label: string) => `${label}, förlopp`,
} as const;

export const CLOCK = {
  play: 'Spela',
  pause: 'Pausa',
  step: 'Stega 15 min',
  stepDay: 'Stega 1 dygn',
  reset: 'Återställ klockan',
  clockReset: 'Klockan återställd',
  running: 'Scenario pågår',
  ariaClock: (hhmm: string) => `Scenarioklocka ${hhmm}`,
  day: (n: number) => `dag ${n}`,
} as const;

export const AUDIT = {
  ehrLost: 'Journalsystemet frånkopplat, drift på operativ spegel',
  ehrRestored: 'Journalsystemet återanslutet',
  ehrObject: 'Journalsystem',
  clockReset: 'Återställde klockan',
  clockObject: 'Scenarioklocka',
  demoReset: 'Återställde demon',
  columns: { time: 'Tid', actor: 'Aktör', action: 'Åtgärd', object: 'Objekt', detail: 'Detalj' },
} as const;

export const ICON_TINTS = {
  beds: { icon: 'text-primary', tile: 'bg-indigo-light' },
  intensive: { icon: 'text-red-icon', tile: 'bg-red-light' },
  theatres: { icon: 'text-purple', tile: 'bg-purple-light' },
  imaging: { icon: 'text-indigo', tile: 'bg-indigo-light' },
  ed: { icon: 'text-orange', tile: 'bg-orange-light' },
  staff: { icon: 'text-green', tile: 'bg-green-light' },
  transport: { icon: 'text-teal', tile: 'bg-indigo-light' },
  supplies: { icon: 'text-olive', tile: 'bg-orange-light' },
} as const;

// ---------------------------------------------------------------------------
// Start page (DESIGN-KS.md § 5, SPEC.md § 8)
export const START = {
  title: 'Medoma Resilience – Karolinska Universitetssjukhuset',
  subtitle: 'Demonstration med öppna uppgifter, uppgifter från Medoma och illustrativa scenariovärden. Inte Karolinskas driftdata.',
  sourcesLink: 'Källor',
  chapters: 'Berättelsen i fem kapitel',
  startChapter: 'Starta kapitel',
  keyFigures: 'Nyckeltal',
  keyFigureScope: (scope: string) => `för ${scope}`,
  wholeHospital: 'hela Karolinska',
  footer: 'Byggd på Medoma-plattformen. Kartunderlag © OpenStreetMap.',
  cards: {
    fastsallda: 'Fastställda vårdplatser',
    disponibla: 'Disponibla vårdplatser (normalvecka)',
    iva: 'IVA-platser',
    employees: 'Medarbetare',
    operations: 'Operationer 2025',
    inpatient: 'Slutenvårdstillfällen 2025',
  },
  units: { beds: 'platser', people: 'personer', operations: 'operationer', episodes: 'vårdtillfällen' },
  chapterList: [
    { n: 1, title: 'Vardag', description: 'Läget nu på båda siter, i Stab Produktions egna mått.' },
    { n: 2, title: 'Tryck', description: 'Akuten i Huddinge går mot brist i kväll. Prognosen visar när, och vad som frigör.' },
    { n: 3, title: 'Masskada', description: '60 skadade till Traumacentrum Karolinska (TCK). Från larm till katastrofläge, med spårbara beslut.' },
    { n: 4, title: 'Journalbortfall', description: 'Journalsystemet faller. Driften fortsätter på den operativa spegeln.' },
    { n: 5, title: 'Regional omfördelning', description: '260 patienter till regionen, som i Sjukvårdsövning 26. Nätverket som en kapacitet.' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Läget nu (SPEC.md § 6.1–6.4)
export const FLOW_BLOCK_LABELS: Record<FlowBlock, string> = {
  akuten: 'Akuten',
  vardplatser: 'Vårdplatser',
  operation: 'Operation',
  bild: 'Bilddiagnostik',
  iva: 'IVA/IMA',
  bemanning: 'Bemanning',
};

export const FLOW_LABELS: Record<string, string> = {
  'akuten.patients': 'Patienter på akuten nu',
  'akuten.waitingBed': 'Väntar på vårdplats',
  'akuten.longestWait': 'Längsta väntan på vårdplats',
  'akuten.over4h': 'Vistelsetid över 4 h',
  'akuten.timeToDoctor': 'Tid till läkare, median',
  'akuten.trauma': 'Traumalarm i dag',
  'beds.disponibla': 'Disponibla i dag',
  'beds.belagda': 'Belagda',
  'beds.belaggning': 'Beläggning',
  'beds.lediga': 'Lediga',
  'beds.overbelaggning': 'Överbeläggningar',
  'beds.utlokaliserade': 'Utlokaliserade patienter',
  'beds.utskrivningsklara': 'Utskrivningsklara som väntar',
  'beds.asihEligible': 'varav ASIH-kandidater',
  'op.program': 'Program i dag',
  'op.done': 'Utförda hittills',
  'op.cancelled': 'Strukna i dag',
  'op.waiting90': 'Väntande över 90 dagar',
  'ct.waiting': 'Inneliggande som väntar på CT',
  'ct.median': 'Medianväntetid CT, inneliggande',
  'ct.down': 'Apparater ur drift',
  'ct.total': 'CT-apparater',
  'mr.waiting': 'Inneliggande som väntar på MR',
  'iva.total': 'IVA-platser',
  'iva.occupied': 'IVA belagda',
  'iva.free': 'IVA lediga',
  'iva.waiting': 'Väntar på IVA-plats',
  'iva.stepdown': 'Väntar på nedflytt från IVA',
  'ima.total': 'IMA-platser',
  'ima.occupied': 'IMA belagda',
  'staff.vacant': 'Vakanta pass kväll/natt',
  'staff.agency': 'Inhyrda i tjänst',
  'staff.sick': 'Sjukfrånvaro i dag',
};

export const FLOW = {
  title: 'Läget nu',
  status: { Normalt: 'Normalt', Ansträngt: 'Ansträngt', Kritiskt: 'Kritiskt' },
  columns: { metric: 'Mått', solna: 'Solna', huddinge: 'Huddinge', sum: 'Karolinska' },
  whatFrees: 'Vad frigör',
  perSiteOnly: 'per site',
  blocksQualifier: { ofWhich: 'varav', asih: 'ASIH-kandidater' },
  kpiWaitingBed: 'Väntar på vårdplats (akuten)',
  tabs: {
    overview: 'Översikt',
    placement: (n: number) => `Patientplacering (${n})`,
    forecast: 'Prognos',
    discharge: (n: number) => `Utskrivningsklara (${n})`,
  },
  notForScope: 'Läget nu finns för Karolinska Solna och Karolinska Huddinge. Välj en av dem, eller Karolinska för båda.',
  goToCapacity: 'Gå till Kapacitet',
  staffingPopover: (vacant: string, agency: string) => `Bemanningscentrum: ${vacant} pass att tillsätta i kväll; ${agency} inhyrda i tjänst`,
  staffingTitle: 'Bemanningscentrum',
  waiting: 'Väntar',
  longestWait: 'Längsta väntan',
  freeBeds: 'Lediga platser',
  iva: { free: (free: string, total: string) => `${free} lediga av ${total}`, occupied: (occ: string, total: string) => `${occ} av ${total} belagda` },
  ctDown: (down: string, total: string) => `CT ${down} av ${total}`,
  cancelledNote: { solna: 'postop 2, IVA 1', huddinge: 'personal 2' },
  placement: {
    title: 'Patientplacering',
    columns: { from: 'Från', patient: 'Patient', needs: 'Behov', waited: 'Väntat', suggested: 'Föreslagen avdelning', action: 'Åtgärd' },
    wards: 'Avdelningar',
    place: 'Placera',
    relocate: 'Utlokalisera',
    reject: 'Avvisa',
    noBed: (other: string) => `Ingen plats – överväg ${other}`,
    relocation: 'Utlokalisering',
    empty: 'Inga patienter väntar på placering.',
    rejectTitle: (patient: string) => `Avvisa placering för ${patient}?`,
    rejectBody: 'Ange en kort anledning. Förfrågan tas bort från listan.',
    reason: 'Anledning',
    confirmReject: 'Avvisa förfrågan',
    toasts: { placed: 'Patient placerad', relocated: 'Patient utlokaliserad', rejected: 'Förfrågan avvisad' },
    audit: {
      placed: (ward: string) => `Placerade patient – ${ward}`,
      relocated: (ward: string) => `Utlokaliserade patient – ${ward}`,
      rejected: (patient: string) => `Avvisade placering – ${patient}`,
    },
    selectWard: 'Välj avdelning',
    freeOf: (free: string, total: string) => `${free} av ${total} lediga`,
  },
  forecast: {
    title: 'Inflödesprognos',
    heading: (site: string) => `Akuten ${site}, 24 timmar från 14:40`,
    legend: { arrivals: 'Förväntade ankomster', admissions: 'Förväntade inläggningar', discharges: 'Förväntade utskrivningar', elective: 'Elektiva inläggningar', free: 'Lediga vårdplatser' },
    columns: { horizon: 'Horisont', free: 'Lediga vårdplatser', status: 'Status' },
    horizons: { h4: '+4 h', h12: '+12 h', h24: '+24 h' },
    shortage: 'Brist',
    deficit: (n: string, time: string, site: string) => `Beräknad brist: ${n} platser kl ${time} (${site})`,
    noDeficit: 'Ingen beräknad brist inom 24 h',
    multiplier: (factor: string, hours: string) => `Inflödesfaktor ${factor} på akuten i ${hours} h (scenario Tryck)`,
    now: 'nu',
    basis: 'Prognosen bygger på illustrativa ankomstprofiler och dagens planerade utskrivningar (DATA.md § 5.4).',
  },
  discharge: {
    title: 'Utskrivningsklara',
    columns: { patient: 'Patient', ward: 'Avdelning', waited: 'Väntat (dagar)', waitingFor: 'Väntar på', status: 'Status', action: 'Åtgärd' },
    kpi: { ready: 'Utskrivningsklara', bedsBound: 'Vårdplatser bundna', asih: 'ASIH-kandidater' },
    toAsih: 'Till ASIH',
    toGeriatrik: 'Till geriatrik',
    wait: 'Avvakta',
    more: (n: string) => `och ytterligare ${n} patienter`,
    confirmAsih: (patient: string) => `Skicka ASIH-förfrågan för ${patient}?`,
    confirmGeriatrik: (patient: string) => `Skicka förfrågan till geriatrik för ${patient}?`,
    confirmBody: 'Förfrågan skickas via Medoma-plattformen. Statusen uppdateras när mottagaren bekräftat.',
    send: 'Skicka förfrågan',
    toasts: { asihSent: 'ASIH-förfrågan skickad', geriatrikSent: 'Förfrågan till geriatrik skickad', waited: 'Noterat' },
    audit: {
      asihSent: (patient: string) => `Skickade ASIH-förfrågan – ${patient}`,
      geriatrikSent: (patient: string) => `Skickade förfrågan till geriatrik – ${patient}`,
      dischargedAsih: (patient: string) => `Utskriven till ASIH – ${patient}`,
      dischargedGeriatrik: (patient: string) => `Utskriven till geriatrik – ${patient}`,
      waited: (patient: string) => `Avvaktar – ${patient}`,
    },
    empty: 'Inga utskrivningsklara patienter väntar.',
    days: (n: number) => `${n} ${n === 1 ? 'dag' : 'dagar'}`,
  },
} as const;

// ---------------------------------------------------------------------------
// Kapacitet (SPEC.md § 6.5)
export const CAP = {
  title: 'Kapacitet',
  ladder: 'Vårdplatsstege',
  ladderGap: (gap: string) => `${gap} platser finns lokalmässigt men saknar bemanning eller utrustning`,
  capacityNow: 'Kapacitet nu',
  bottlenecks: 'Flaskhalsar',
  whatLimitsWhat: 'Vad begränsar vad',
  nodes: 'Noder',
  sources: 'Källor',
  selectNode: 'Välj en nod i tabellen för att se vad som begränsar dess kapacitet.',
  noCapabilities: 'Inga kapacitetsdata vid denna nod.',
  whatIf: 'Vad händer om',
  whatIfNotSaved: 'Vad händer om, ej sparat',
  reset: 'Återställ',
  limiting: 'Begränsar',
  scenario: 'Scenario',
  scenarioStrip: 'Scenario',
  objectives: 'Incidentmål',
  cards: {
    beds: 'Vårdplatser lediga',
    intensive: 'IVA-platser lediga',
    theatres: 'Operation – möjliga akuta operationer nu',
    imaging: 'Bilddiagnostik – CT i drift',
    ed: 'Akuten – patienter nu',
    staff: 'Personal i tjänst',
    network: '(nätverk)',
    places: 'Platser lediga',
  },
  units: {
    ofDisponibla: (total: string) => `av ${total} disponibla`,
    ofTotal: (total: string) => `av ${total}`,
    surgeries: (theatres: string) => `möjliga nu, ${theatres} salar lediga`,
    scanners: (total: string, waiting: string) => `av ${total} CT-apparater, ${waiting} väntar`,
    edPatients: (waiting: string) => `varav ${waiting} väntar på vårdplats`,
    staff: 'personer',
    ambulances: 'lediga ambulanser',
  },
  notSharedBy: (names: string[]) => `${names.join(', ')} delar inte`,
  columns: {
    rank: 'Rang',
    node: 'Nod',
    capacity: 'Kapacitet',
    limitingResource: 'Begränsande resurs',
    impact: 'Effekt',
    wouldUnlock: 'Skulle frigöra',
    component: 'Komponent',
    total: 'Totalt',
    available: 'Tillgängligt',
    confidence: 'Uppgift',
    source: 'Källa',
    state: 'Status',
    lastSync: 'Senaste synk',
  },
  capacitySentence: (capacity: string, unit: string, limiting: string, available: string) =>
    `Kapacitet nu: ${capacity} ${unit}, begränsas av ${limiting} (${available} tillgängliga).`,
  nextSentence: (gap: string, limiting: string, more: string, next: string, available: string) =>
    `Om ${gap} ${limiting} frigörs möjliggörs ${more} till; nästa begränsning är ${next} (${available}).`,
  and: 'och',
  ladderLabel: 'Stege',
  ladderSteps: {
    fastsallda: 'Fastställda',
    disponibla_normal: 'Disponibla, normalvecka',
    disponibla_v33: 'Disponibla, vecka 33 2025',
    belagda: 'Belagda nu',
    lediga: 'Lediga nu',
  } satisfies Record<LadderKey, string>,
  objective: (label: string, current: string, target: string, unit: string, due: string) => `${label}: ${current} / ${target} ${unit}, ${due}`,
  dueAt: (at: string) => `senast ${at}`,
  dueDay: (d: string) => `senast dag ${d}`,
  capabilitySwitch: 'Kapacitet',
  chooseNode: 'Välj en nod',
} as const;

// ---------------------------------------------------------------------------
// Incident (SPEC.md § 6.6)
export const INCIDENT = {
  title: 'Incident',
  noActive: 'Ingen aktiv incident.',
  activateAPlaybook: 'Aktivera en spelbok',
  playbooks: 'Spelböcker',
  previous: 'Tidigare incidenter',
  activate: 'Aktivera',
  activateTitle: (name: string) => `Aktivera ${name}?`,
  activateBody: (roles: number, tasks: number, channels: number, targets: number) =>
    `Aktivering skapar ${roles} roller, ${tasks} uppgifter, ${channels} kanaler och ${targets} kapacitetsmål och växlar Kapacitet till incidentvy.`,
  activateIncident: 'Aktivera incident',
  incidentActivated: 'Incident aktiverad',
  incidentClosed: 'Incident avslutad',
  closeTitle: 'Avsluta incident?',
  closeBody: 'Incidentloggen sparas under Tidigare incidenter. Öppna uppgifter lämnas som de är.',
  addTask: 'Lägg till uppgift',
  taskAdded: 'Uppgift tillagd',
  active: 'Aktiv',
  lage: 'Beredskapsläge',
  lageChanged: 'Beredskapsläge ändrat',
  activatedLine: (at: string, by: string, commander: string) => `Aktiverat ${at} av ${by}. Sjukvårdsledare: ${commander}.`,
  tabs: { overview: 'Översikt', tasks: 'Uppgifter', channels: 'Kanaler', log: 'Logg' },
  targets: 'Mål',
  roles: 'Roller',
  unassigned: 'Ej tilldelad',
  assign: 'Tilldela',
  summary: (notStarted: number, inProgress: number, done: number) => `${notStarted} ej påbörjade, ${inProgress} pågår, ${done} klara`,
  due: (at: string) => `Senast ${at}`,
  dueDay: (d: string) => `Senast dag ${d}`,
  members: (roles: string[]) => roles.join(', '),
  messages: (n: number) => `${n} ${n === 1 ? 'meddelande' : 'meddelanden'}`,
  noMessages: 'Inga meddelanden ännu.',
  send: 'Skicka',
  messagePlaceholder: 'Skriv ett meddelande',
  messageSent: 'Meddelande skickat',
  backToIncident: 'Tillbaka till incidenten',
  createRequest: 'Skapa förfrågan',
  changeStatus: 'Ändra status',
  fields: { commander: 'Sjukvårdsledare LSSL', note: 'Anteckning', title: 'Titel', area: 'Område', ownerRole: 'Ansvarig roll', dueIn: 'Klar inom minuter', lage: 'Beredskapsläge' },
  columns: { code: 'Kod', name: 'Namn', trigger: 'Utlösare', roles: 'Roller', tasks: 'Uppgifter', channels: 'Kanaler', targets: 'Mål', activated: 'Aktiverad', closed: 'Avslutad', tasksDone: 'Uppgifter klara', lage: 'Beredskapsläge' },
  systemActivated: (name: string, at: string, lage: string) => `Incident ${name} aktiverad ${at}. ${lage}.`,
  systemChannelOpened: (at: string, roles: string[]) => `Kanal öppnad ${at} för ${roles.join(', ')}.`,
  referenceNote: 'Referens',
  audit: {
    activated: (name: string) => `Aktiverade incident – ${name}`,
    createdTask: (title: string) => `Skapade uppgift – ${title}`,
    openedChannel: (name: string) => `Öppnade kanal – ${name}`,
    closed: 'Avslutade incident',
    taskStatus: (title: string, status: string) => `Ändrade uppgiftsstatus – ${title} – ${status}`,
    addedTask: 'Lade till uppgift',
    assignedTask: (title: string, person: string) => `Tilldelade uppgift – ${title} – ${person}`,
    changedRole: (role: string, person: string) => `Ändrade roll – ${role} – ${person}`,
    changedLage: (lage: string) => `Ändrade beredskapsläge – ${lage}`,
    sentMessage: (channel: string) => `Skickade meddelande – ${channel}`,
    dueDetail: (role: string, due: string) => `${role}, senast ${due}`,
  },
  targetUnits: { patients: 'patienter', theatres: 'salar', beds: 'platser', wards: 'avdelningar' },
  withinMin: (n: string) => `inom ${n} min`,
  withinDays: (n: string) => `inom ${n} dygn`,
} as const;

// ---------------------------------------------------------------------------
// Evakuering (SPEC.md § 6.7)
export const EVAC = {
  title: 'Evakuering',
  from: (site: string) => `från ${site}`,
  siteSwitch: 'Källsite',
  target: (n: string) => `Mål: ${n} patienter flyttade`,
  moved: (n: string) => `${n} flyttade`,
  noTarget: 'Inget mål satt',
  counts: { planned: 'Planerade', accepted: 'Accepterade', inTransit: 'Under transport', arrived: 'Ankomna', handedOver: 'Överlämnade' },
  suggestPlan: 'Föreslå plan',
  clearSuggestions: 'Rensa förslag',
  patients: (n: number) => `Patienter (${n})`,
  destinations: 'Destinationer',
  transport: 'Transport',
  planMove: 'Planera flytt',
  movePlanned: 'Flytt planerad',
  destination: 'Destination',
  selectDestination: 'Välj destination',
  selectVehicle: 'Välj fordon',
  needs: (need: string) => `Behov: ${need}`,
  notPlanned: 'Ej planerad',
  suggested: 'Föreslagen',
  freeOf: (free: string, total: string) => `Lediga ${free} av ${total}`,
  freeUnknown: 'Lediga okänt',
  available: (n: string) => `${n} lediga`,
  km: (n: string) => `${n} km`,
  filters: { stability: 'Stabilitet', transport: 'Transport', status: 'Status', all: 'Alla' },
  statusFilters: [
    { key: 'all', label: 'Alla' },
    { key: 'notPlanned', label: 'Ej planerad' },
    { key: 'planned', label: 'Planerad' },
    { key: 'inTransit', label: 'Under transport' },
    { key: 'arrived', label: 'Ankommen' },
  ] as const,
  noMatch: 'Inga patienter matchar filtren.',
  clearFilters: 'Rensa filter',
  steps: {
    accept: 'Acceptera vid destination',
    assign: 'Tilldela transport',
    departed: 'Markera avrest',
    arrived: 'Markera ankommen',
    handedOver: 'Markera överlämnad',
    cancel: 'Avbryt flytt',
    acceptSuggestion: 'Acceptera förslag',
    reject: 'Avvisa',
  },
  toasts: {
    accepted: 'Accepterad vid destination',
    assigned: 'Transport tilldelad',
    departed: 'Markerad avrest',
    arrived: 'Markerad ankommen',
    handedOver: 'Markerad överlämnad',
    cancelled: 'Flytt avbruten',
    suggestionAccepted: 'Förslag accepterat',
    suggestionRejected: 'Förslag avvisat',
    suggestionsCleared: 'Förslag rensade',
    suggested: (n: string, m: string) => `Föreslog ${n} flyttar, ${m} kunde inte placeras`,
  },
  reasons: {
    doesNotAccept: (level: string) => `Tar inte emot ${level.toLowerCase()}`,
    noFreePlaces: 'Inga lediga platser',
    ivaUnknown: 'IVA-kapacitet okänd',
    ageLimit: 'Endast 75 år och äldre',
    notEligible: 'Ej ASIH-kandidat',
    notSuitable: (need: string) => `Passar inte ${need.toLowerCase()}`,
    noneAvailable: 'Inga lediga',
  },
  audit: {
    planned: (patient: string, node: string) => `Planerade flytt – ${patient} – till ${node}`,
    accepted: (patient: string) => `Accepterad vid destination – ${patient}`,
    assigned: (patient: string, vehicle: string) => `Tilldelade transport – ${patient} – ${vehicle}`,
    departed: (patient: string) => `Avrest – ${patient}`,
    arrived: (patient: string, node: string) => `Ankommen – ${patient} – ${node}`,
    handedOver: (patient: string, node: string) => `Överlämnad – ${patient} – ${node}`,
    cancelled: (patient: string) => `Avbröt flytt – ${patient}`,
    suggested: (n: number) => `Föreslog flyttar – ${n} patienter`,
    suggestedDetail: (n: number) => `${n} kunde inte placeras`,
    authorised: (patient: string, node: string) => `Godkände föreslagen flytt – ${patient} – till ${node}`,
    rejected: (patient: string) => `Avvisade föreslagen flytt – ${patient}`,
    cleared: 'Rensade förslag',
    clearedDetail: (n: number) => `${n} förslag avvisade`,
  },
  map: { freePlaces: (n: string) => `${n} lediga platser`, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  moveStatusLabel: 'Flyttstatus',
} as const;

export const NODE_STATUS_COLOURS: Record<NodeStatus, string> = {
  Operational: '#1AA339',
  Degraded: '#F2994A',
  'Standing up': '#F2994A',
  Offline: '#EB5757',
};

// ---------------------------------------------------------------------------
// Resurser (SPEC.md § 6.8)
export const RES = {
  title: 'Resurser',
  tabs: { requests: (open: number) => `Förfrågningar (${open})`, inventory: 'Lager', fromMessage: (n: number) => `Från meddelande (${n})` },
  newRequest: 'Ny förfrågan',
  requestCreated: 'Förfrågan skapad',
  noOpenRequests: 'Inga öppna förfrågningar.',
  notAllocated: 'Ej tilldelad',
  incident: 'Incident',
  requestedBy: (by: string, at: string) => `Begärd av ${by}, ${at}`,
  eta: (at: string) => `Beräknad ankomst ${at}`,
  quantityUnit: (name: string, qty: string, unit: string) => `${name} × ${qty} ${unit}`,
  drawerTitle: (name: string, qty: string) => `${name} × ${qty}`,
  statusChain: 'Status',
  auditEntries: 'Loggposter',
  actions: { accept: 'Acceptera', reject: 'Avvisa', allocate: 'Tilldela', dispatch: 'Sänd', receive: 'Markera mottagen', create: 'Skapa förfrågan', confirmReject: 'Avvisa förfrågan' },
  toasts: { accepted: 'Förfrågan accepterad', rejected: 'Förfrågan avvisad', allocated: 'Förfrågan tilldelad', dispatched: 'Förfrågan utsänd', received: 'Förfrågan mottagen' },
  rejectTitle: 'Avvisa förfrågan?',
  rejectBody: 'Ange en kort anledning. Förfrågan ligger kvar i listan som avvisad.',
  fields: {
    resource: 'Resurs',
    quantity: 'Antal',
    fromNode: 'Från nod',
    toNode: 'Till nod',
    priority: 'Prioritet',
    status: 'Status',
    requestedBy: 'Begärd av',
    requestedAt: 'Begärd kl',
    eta: 'Beräknad ankomst',
    note: 'Not',
    reason: 'Anledning',
    rejectReason: 'Anledning till avvisning',
  },
  allocateOption: (node: string, available: string) => `${node}: ${available} tillgängliga`,
  notEnough: (available: string, qty: string) => `${available} tillgängliga, ${qty} behövs`,
  noSource: 'Ingen nod har denna resurs',
  suggestedPrefill: 'Föreslagen utifrån meddelandet',
  columns: {
    resource: 'Resurs',
    node: 'Nod',
    category: 'Kategori',
    total: 'Totalt',
    available: 'Lediga',
    inUse: 'I drift',
    reserved: 'Reserverade',
    outOfService: 'Ur funktion',
    notInService: 'Ej i tjänst',
    inTransit: 'Under transport',
    unknown: 'Okänt',
    status: 'Status',
    lastConfirmed: 'Senast bekräftad',
    sum: 'Summa',
  },
  filterAll: 'Alla',
  audit: {
    requested: 'Begärde',
    object: (name: string, qty: number) => `${name} × ${qty}`,
    toNode: (node: string) => `Till ${node}`,
    fromNode: (node: string) => `Från ${node}`,
    transition: (action: string, name: string, qty: number, node: string) => `${action} förfrågan – ${name} × ${qty} – till ${node}`,
    actions: { Accepted: 'Accepterade', Rejected: 'Avvisade', Allocated: 'Tilldelade', Dispatched: 'Sände', Received: 'Tog emot' } as Record<string, string>,
    sentMessage: 'Skickade meddelande',
  },
  hhmm: 'HH:MM',
} as const;

// ---------------------------------------------------------------------------
// Nätverk (SPEC.md § 6.9)
export const NET = {
  title: 'Nätverk',
  standUp: 'Etablera nod',
  nodeCreated: 'Nod etablerad',
  back: 'Tillbaka till nätverket',
  fields: { name: 'Namn', type: 'Typ', site: 'Plats', plannedBeds: 'Planerade platser', lead: 'Ansvarig', sharing: 'Delning' },
  standUpTypes: ['Care hub', 'Field hospital'] as const,
  columns: { node: 'Nod', type: 'Typ', status: 'Status', capacity: 'Disponibla/kapacitet', free: 'Lediga', iva: 'IVA', sharing: 'Delning', sync: 'Synk', source: 'Källa', lead: 'Ansvarig', place: 'Plats' },
  detail: {
    type: 'Typ',
    status: 'Status',
    lead: 'Ansvarig',
    place: 'Plats',
    sharing: 'Delning',
    sync: 'Synk',
    beds: 'Vårdplatser',
    places: 'Platser',
    intensiveCare: 'IVA-platser',
    staff: 'Personal i tjänst',
    accepts: 'Tar emot',
    plannedBeds: 'Planerade platser',
    sources: 'Källor',
    bottlenecks: 'Flaskhalsar',
    resources: 'Resurser',
    showInventory: 'Visa lager',
    freeOf: (free: string, total: string) => `${free} lediga av ${total}`,
    figure: 'Uppgift',
    value: 'Värde',
    confidence: 'Klass',
    source: 'Källa',
    changeStatus: 'Ändra status',
    changeSharing: 'Ändra delning',
    radius: (km: string) => `Täcker Stockholm inom ${km} km`,
  },
  toasts: { statusChanged: 'Nodstatus ändrad', sharingChanged: 'Noddelning ändrad' },
  audit: {
    stoodUp: (name: string) => `Etablerade nod – ${name}`,
    changedStatus: (node: string, value: string) => `Ändrade nodstatus – ${node} – ${value}`,
    changedSharing: (node: string, value: string) => `Ändrade noddelning – ${node} – ${value}`,
    detail: (type: string, site: string, beds: string) => `${type}, ${site}, ${beds} planerade platser`,
  },
  notFound: 'Noden finns inte.',
  asihLabel: 'ASIH',
} as const;

// ---------------------------------------------------------------------------
// Källor (SPEC.md § 6.10)
export const SOURCES = {
  title: 'Källor',
  intro: 'Alla uppgifter i demon är antingen verifierade mot öppna källor, rapporterade av Medoma, estimat med angiven grund eller illustrativa scenariovärden.',
  verifiedTable: 'Verifierade och rapporterade uppgifter',
  estimatesTable: 'Estimat och illustrativa värden',
  columns: { figure: 'Uppgift', value: 'Värde', source: 'Källa', date: 'Datum', link: 'Länk', basis: 'Grund', confidence: 'Klass' },
  open: 'Öppna',
  noLink: 'Ingen länk',
  noFigures: 'Inga uppgifter i demon hänvisar till denna källa ännu.',
  sections: {
    org: 'Organisation och sjukhusfakta',
    nodes: 'Noder',
    ladder: 'Vårdplatsstege',
    flow: 'Läget nu',
    capabilities: 'Kapacitet',
    resources: 'Resurser',
    beredskap: 'Beredskap',
    other: 'Övrigt',
  },
  anchors: { estimate: 'estimat', illustrative: 'illustrativt', reported: 'S21' },
} as const;

// ---------------------------------------------------------------------------
// Scenario (SPEC.md § 7.3–7.4, DESIGN-KS.md § 7)
export const SCENARIO_NAMES: Record<ScenarioKey, string> = {
  masskada: 'Masskada',
  tryck: 'Ordinärt högtryck',
  journalbortfall: 'Journalsystem otillgängligt',
  mottagande: 'Mottagande av evakuerade',
  pandemi: 'Pandemisk våg',
  siteevac: 'Evakuering av del av sjukhus',
};

export const SCENARIO = {
  title: 'Scenario',
  choose: 'Välj scenario',
  start: 'Starta',
  stop: 'Stoppa',
  restart: 'Starta om',
  params: 'Parametrar',
  events: 'Händelser',
  pools: 'Belastning per resurs',
  recommendations: 'Rekommendationer',
  noEvents: 'Inga händelser ännu.',
  notStarted: 'Scenariot är inte startat.',
  finished: 'Scenariot har nått sin horisont.',
  tick: (t: string) => `tick ${t}`,
  offset: (min: number) => `+${min} min`,
  offsetDay: (d: number) => `dag ${d}`,
  demandCapacity: (demand: string, capacity: string) => `${demand} / ${capacity}`,
  shortage: 'Brist',
  chip: (name: string, detail: string) => `${name} · ${detail}`,
  chipDetail: {
    masskada: (n: string) => `${n} skadade`,
    tryck: (f: string) => `faktor ${f}`,
    journalbortfall: (h: string) => `${h} h`,
    mottagande: (n: string) => `${n} patienter`,
    pandemi: (d: string) => `${d} dygn`,
    siteevac: (n: string) => `${n} patienter`,
  },
  applied: 'Utförd',
  execute: 'Utför',
  scenarioStrip: 'Scenario',
  notApplicable: 'Ej tillämplig just nu',
  authorised: (label: string) => `Utförde rekommendation – ${label}`,
  eventObject: 'Scenario',
  started: (name: string) => `Startade scenario – ${name}`,
  stopped: (name: string) => `Stoppade scenario – ${name}`,
  horizonReached: (name: string) => `Scenario ${name} nådde horisonten`,
  armed: (name: string) => `Scenario ${name} förberett`,
  katastrofConfirmTitle: 'Gå till katastrofläge?',
  katastrofConfirmBody: (n: string) => `Antalet skadade (${n}) ligger under den illustrativa gränsen 60 för katastrofläge. Vill du ändå gå till katastrofläge?`,
  confirmKatastrof: 'Gå till katastrofläge',
  poolLabels: {
    akutrum: 'Akutrum',
    overvakning: 'Övervakningsplatser',
    behandlingsrum: 'Behandlingsrum',
    ct_slots: 'CT per tick',
    or_slots: 'Akuta operationer',
    iva: 'IVA-platser',
    ima: 'IMA-platser',
    vardplatser: 'Vårdplatser',
    blod_oneg: 'Blodprodukter O-negativ',
    akutambulans: 'Akutambulanser',
  } as Record<string, string>,
  paramLabels: {
    skadade: 'Skadade',
    rod: 'Röd, andel',
    gul: 'Gul, andel',
    gron: 'Grön, andel',
    fonster: 'Ankomstfönster',
    forsta: 'Första ankomst',
    primar: 'Primär mottagare',
    sekundar: 'Sekundär mottagare',
    faktor: 'Inflödesfaktor',
    timmar: 'Varaktighet',
    patienter: 'Patienter',
    andel: 'Karolinskas andel',
    ivaPerDygn: 'IVA-behov per dygn',
    dygn: 'Antal dygn',
    site: 'Site',
  } as Record<string, string>,
  units: { pct: '%', min: 'min', h: 'h', dygn: 'dygn', patients: 'patienter' },
  eventText: {
    firstArrivals: (site: string) => `Första skadade anländer till ${site}`,
    poolFull: (pool: string, site: string) => `${pool} ${site}: brist`,
    applied: (label: string) => `Rekommendation utförd: ${label}`,
    nodeOut: (node: string) => `${node}: vårdplatser slut`,
    outageStart: 'Journalsystemet frånkopplat, drift på spegel',
    outageEnd: 'Journalsystemet återanslutet',
    pressure: (factor: string, hours: string) => `Inflödesfaktor ${factor} på Akutmottagningen Huddinge i ${hours} h`,
    receiving: (n: string) => `${n} patienter fördelas till regionen via Norrtälje`,
    pandemic: (n: string) => `IVA-behovet ökar med ${n} per dygn`,
    vardhubbOpen: (name: string) => `${name} i drift`,
  },
  recs: {
    forstarkning: { label: 'Aktivera förstärkningsläge', effect: 'Aktiverar PB1 med förstärkningsläge' },
    katastrof: { label: 'Gå till katastrofläge', effect: 'Sätter beredskapsläge katastrofläge' },
    stryk_elektiv: { label: 'Stryk elektiv operation', effect: '+4 akuta operationssalar per site' },
    ima_overflow: { label: 'Öppna IMA som IVA-överflöd', effect: '+6 IVA-platser vid primär mottagare' },
    asih: { label: 'Utskrivningsklara till ASIH', effect: '+13 vårdplatser, ASIH-kapacitet −13' },
    tidig_utskrivning: { label: 'Tidigarelägg utskrivningar', effect: '+8 vårdplatser Solna, +10 Huddinge (illustrativt)' },
    omfordela: { label: 'Omfördela gula patienter till SÖS och DS', effect: 'Flyttar 20 gula patienter till regionens lediga platser' },
    transport: { label: 'Begär transportambulanser', effect: 'Skapar förfrågan om 4 transportambulanser (hög prioritet)' },
    vardhubb: { label: 'Etablera vårdhubb Flemingsberg', effect: 'Etablerar vårdhubb med 40 platser, i drift efter 4 tick' },
    o_huset: { label: 'Bygg om O-huset till IVA', effect: '+64 IVA-platser över 10 dygn' },
  } as Record<string, { label: string; effect: string }>,
} as const;
