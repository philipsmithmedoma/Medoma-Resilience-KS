// Domain model of a data pack – SPEC.md § 4. Every enum value string has a Swedish label in vocab.ts.

// ---------------------------------------------------------------------------
// Figures and confidence (SPEC.md § 4, DATA.md § 0)
export type Confidence = 'verified' | 'reported' | 'estimate' | 'illustrative';
export type DataSource = 'EHR' | 'HR' | 'RIS' | 'OR planning' | 'Logistics' | 'Manual' | 'Medoma' | 'Mirror';

export interface Figure {
  value: number | null; // null = unknown ("Okänt")
  confidence: Confidence;
  source?: string; // key into DataPack.sources (DATA.md § 9)
  asOf?: string; // date string
  basis?: string; // basis of an estimate or an illustrative value
  verified?: number;
  estimated?: number;
  lastConfirmed?: string; // 'HH:MM'
  dataSource?: DataSource;
}

// ---------------------------------------------------------------------------
// Nodes
export type SiteId = 'solna' | 'huddinge';
export type NodeId = string;
export type NodeType = 'Hospital' | 'Care hub' | 'Field hospital' | 'Home care' | 'Capacity class' | 'Transport';
export type NodeStatus = 'Operational' | 'Degraded' | 'Standing up' | 'Offline';
export type SharingLevel = 'Full' | 'Capacity only' | 'None';
export type SyncState = 'Synced' | 'Delayed' | 'Manual' | 'Offline';
export type AcceptsLevel = 'Ward' | 'Monitored' | 'Intensive' | 'Home';
export type CareLevel = 'Ward' | 'Monitored' | 'Intensive';

/** A text the pack carries in both languages (DESIGN-LANG.md § 3); proper nouns stay plain strings. */
export interface LocalizedText {
  sv: string;
  en: string;
}

export type LadderKey = 'fastsallda' | 'disponibla_normal' | 'disponibla_v33' | 'belagda' | 'lediga';
export interface LadderStep {
  key: LadderKey;
  label: LocalizedText;
  figure: Figure;
}

export interface ExtraFigure {
  label: string;
  figure: Figure;
  text?: string; // shown instead of the value when the figure is descriptive
}

export interface CareNode {
  id: NodeId;
  name: string;
  descriptorEn?: string; // English descriptor shown after the Swedish name in English mode (DESIGN-LANG.md § 4)
  shortName: string; // map label
  type: NodeType;
  status: NodeStatus;
  lead: string;
  place: string;
  lat: number;
  lng: number;
  sharing: SharingLevel;
  sync: SyncState;
  lastSync: string;
  site?: SiteId;
  parent?: 'karolinska';
  beds?: { total: Figure; free: Figure }; // disponibla vårdplatser / lediga (or places for a class)
  intensiveCare?: { total: Figure; free: Figure };
  staffOnDuty?: Figure;
  plannedBeds?: number; // Standing up nodes
  accepts: AcceptsLevel[];
  radiusKm?: number; // ASIH: rendered as a circle instead of a marker
  noMarker?: boolean; // capacity classes and the transport node have no single point
  extraFigures?: ExtraFigure[]; // further verified or illustrative figures shown in node detail and Källor
}

// ---------------------------------------------------------------------------
// Capabilities and bottlenecks (as the first prototype, with confidence per component total)
export interface Component {
  name: string;
  total: number;
  available: number;
  confidence?: Confidence; // confidence of the total; available is always the scenario baseline
  source?: string;
  basis?: string;
}

export type CapabilityKind = 'surgery' | 'intensive' | 'ct' | 'beds';

export interface Capability {
  id: string;
  nodeId: NodeId;
  kind: CapabilityKind;
  name: string;
  unit: string;
  components: Component[];
  ladder?: Array<{ label: string; value: number }>;
  note?: string;
}

export interface Bottleneck {
  rank: number;
  nodeId: NodeId;
  capabilityKind?: CapabilityKind;
  capacity: string;
  limitingResource: string;
  impact: string;
  wouldUnlock: string;
}

// ---------------------------------------------------------------------------
// Läget nu (SPEC.md § 6.1, DATA.md § 4)
export type FlowBlock = 'akuten' | 'vardplatser' | 'operation' | 'bild' | 'iva' | 'bemanning';

export interface FlowMetric {
  key: string;
  site: SiteId;
  block: FlowBlock;
  label: LocalizedText;
  value: Figure;
  qualifier?: string;
  unlockRoute?: string;
}

export interface BedRequest {
  id: string;
  site: SiteId;
  from: string;
  patient: string;
  age: number;
  needs: string[];
  waitingMin: number;
  suggestedWard?: string;
  suggestionNote?: 'utlokalisering' | 'no-bed';
}

export interface Ward {
  id: string;
  site: SiteId;
  tema: string;
  name: string;
  total: number;
  free: number;
}

export type DischargeStatus = 'Väntar' | 'ASIH-förfrågan skickad' | 'Geriatrik-förfrågan skickad' | 'Utskriven';

export interface DischargeReady {
  id: string;
  site: SiteId;
  wardId: string;
  patient: string;
  age: number;
  daysWaiting: number;
  waitingFor: string;
  asihEligible: boolean;
  status: DischargeStatus;
  sentAt?: number; // clock minute when a request was sent
}

export interface ForecastProfile {
  site: SiteId;
  arrivalsPerHour: Array<{ from: number; to: number; rate: number }>;
  admissionShare: number;
  plannedDischargesToday: number;
  dischargeShareByHour: Array<{ from: number; to: number; share: number }>;
  electiveAdmissionsTomorrow: number;
}

// ---------------------------------------------------------------------------
// Resources and requests
export type ResourceCategory = 'Equipment' | 'Transport' | 'Team' | 'Supply';

export interface Resource {
  id: string;
  nodeId: NodeId;
  name: string;
  category: ResourceCategory;
  unit: string;
  total: number;
  available: number;
  inUse: number;
  reserved: number;
  outOfService: number;
  notInService: number; // vehicles without crew right now (DATA.md § 6.1)
  inTransit: number;
  unknown: number;
  criticalBelow?: number;
  lowBelow?: number;
  note?: string;
  dataSource: DataSource;
  lastConfirmed: string;
  confidence: Confidence;
}

export type Priority = 'Low' | 'Normal' | 'High' | 'Critical';
export type RequestStatus = 'Requested' | 'Accepted' | 'Allocated' | 'Dispatched' | 'Received' | 'Rejected';

export interface ResourceRequest {
  id: string;
  resourceName: string;
  quantity: number;
  unit: string;
  fromNodeId?: NodeId;
  toNodeId: NodeId;
  priority: Priority;
  status: RequestStatus;
  requestedBy: string;
  requestedAt: string;
  eta?: string;
  note?: string;
  incident?: boolean;
  rejectReason?: string;
}

export interface Message {
  id: string;
  author: string;
  role: string;
  at: string;
  text: string;
  nodeId?: NodeId;
}

// ---------------------------------------------------------------------------
// Evacuation
export type Stability = 'Stable' | 'Monitor' | 'Critical';
export type TransportNeed = 'Walking' | 'Wheelchair' | 'Stretcher' | 'Ambulance' | 'Intensive care transport';
export type Equipment = 'Oxygen' | 'IV infusion' | 'Monitoring';
export type MoveStatus = 'Planned' | 'Accepted' | 'Transport assigned' | 'Departed' | 'Arrived' | 'Handed over';

export interface MovePlan {
  destinationId: NodeId;
  transportId?: string;
  status: MoveStatus;
  suggested: boolean;
}

export interface Patient {
  id: string;
  familyName: string;
  givenName: string;
  pin: string;
  age: number;
  ward: string;
  nodeId: SiteId;
  stability: Stability;
  careLevel: CareLevel;
  transport: TransportNeed;
  equipment: Equipment[];
  homeCareEligible: boolean;
  move?: MovePlan;
}

// ---------------------------------------------------------------------------
// Incidents and playbooks (SPEC.md § 6.6, DATA.md § 8)
export type BeredskapsLage = 'Normalläge' | 'Stabsläge' | 'Förstärkningsläge' | 'Katastrofläge';

export interface PlaybookTask {
  title: LocalizedText;
  area: LocalizedText;
  ownerRole: LocalizedText; // its sv form is the role key
  dueOffsetMin: number;
  note?: string;
}

export type TargetMeasure =
  | 'triageSolna'
  | 'theatresAvailable'
  | 'icuAdded'
  | 'bedsFreed'
  | 'wardsOnMirror'
  | 'receivingBeds'
  | 'patientsMoved'
  | 'icuAddedDays';

export interface PlaybookTarget {
  label: LocalizedText;
  target: number;
  unit: string;
  withinMin: number;
  withinUnit?: 'min' | 'dygn'; // PB5 counts in days
  measure: TargetMeasure;
}

export type PlaybookKey = 'masskada' | 'journalbortfall' | 'mottagande' | 'evakuering' | 'pandemi';

export interface Playbook {
  id: string;
  key: PlaybookKey;
  code: string; // PB1–PB5
  name: LocalizedText;
  trigger: LocalizedText;
  summary: LocalizedText;
  defaultLage: BeredskapsLage;
  roles: LocalizedText[]; // sv forms are the role keys
  tasks: PlaybookTask[];
  channels: LocalizedText[]; // sv forms are the channel keys
  targets: PlaybookTarget[];
  setsEhrOutage?: boolean;
  navigateTo?: string; // PB4 opens Evakuering
  tickDays?: boolean; // PB5: the scenario clock ticks one day at a time
}

export type TaskStatus = 'Not started' | 'In progress' | 'Done';

export interface IncidentTask extends PlaybookTask {
  id: string;
  status: TaskStatus;
  due: string;
  owner?: string;
}

export interface Channel {
  id: string;
  name: LocalizedText;
  memberRoles: LocalizedText[];
  messages: Message[];
}

export interface IncidentTarget {
  label: LocalizedText;
  target: number;
  unit: string;
  dueAt: string;
  withinUnit?: 'min' | 'dygn';
  measure: TargetMeasure;
}

export interface Incident {
  playbookId: string;
  playbookKey: PlaybookKey;
  name: LocalizedText;
  lage: BeredskapsLage;
  activatedAt: string;
  activatedBy: string;
  commander: string;
  roles: Record<string, string | undefined>;
  tasks: IncidentTask[];
  channels: Channel[];
  note?: string;
  targets: IncidentTarget[];
  setsEhrOutage?: boolean;
  logStartId?: string;
}

export interface ClosedIncident {
  incident: Incident;
  closedAt: string;
  log: AuditEntry[];
}

// ---------------------------------------------------------------------------
// Scenarios (SPEC.md § 7.3)
export type ScenarioKey = 'masskada' | 'tryck' | 'journalbortfall' | 'mottagande' | 'pandemi' | 'siteevac';

export interface ScenarioParam {
  key: string;
  label: LocalizedText;
  type: 'number' | 'select';
  options?: Array<{ value: string; label: string }>;
  unit?: string;
}

export interface ScenarioPreset {
  key: ScenarioKey;
  name: LocalizedText;
  params: Record<string, number | string>;
  paramDefs: ScenarioParam[];
  tickMin: number;
  horizonTicks: number;
}

export interface TickResult {
  tick: number;
  pools: Array<{ pool: string; site: string; demand: number; capacity: number }>;
}

export interface ScenarioEvent {
  tick: number;
  text: string;
}

export interface Recommendation {
  key: string;
  label: string;
  effect: string;
  applicable: boolean;
}

export interface ScenarioState {
  key: ScenarioKey;
  params: Record<string, number | string>;
  startedAt: string;
  startedAtClock: number;
  tick: number;
  running: boolean;
  applied: string[];
  appliedAt: Record<string, number>;
  series: TickResult[];
  events: ScenarioEvent[];
  recommendations: Recommendation[];
  inputs: ScenarioInputs; // baseline captured when the scenario started
  hubNodeId?: string; // node stood up by the vardhubb recommendation
}

/** Baseline the engine simulates against, captured from the store at start (SPEC.md § 7.3). */
export interface ScenarioInputs {
  tickMin: number;
  horizonTicks: number;
  sites: Record<
    SiteId,
    {
      akutrum: number;
      overvakning: number;
      behandlingsrum: number;
      ctScanners: number;
      orSlots: number;
      ivaFree: number;
      imaFree: number;
      bedsFree: number;
      bloodUnits: number;
      edPatients: number;
      asihEligible: number;
    }
  >;
  akutambulans: number;
  regionNodes: Array<{ id: string; name: string; shortName: string; free: number }>;
}

// ---------------------------------------------------------------------------
// Audit log, staff, sources, sites
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
  detail?: string;
  ref?: string;
}

export type Profession = 'Doc' | 'Nrs' | 'AsPr' | 'Supp';

export interface Staff {
  name: string;
  title: string;
  profession: Profession;
  nodeId?: NodeId;
}

export interface SourceRef {
  key: string;
  name: string;
  url?: string;
  date: string;
}

export interface Site {
  name: string;
  place: string;
  lat: number;
  lng: number;
}

export interface SourceEntry {
  source: DataSource;
  state: SyncState;
  lastSync: string;
}

export interface HospitalFigures {
  employees: Figure;
  outpatientVisits: Figure;
  inpatientEpisodes: Figure;
  operations: Figure;
  patientsFromOtherRegions: Figure;
  nhvAssignments: Figure;
  staffCategories: Array<{ label: string; figure: Figure }>;
}

export interface Organisation {
  key: string;
  name: string;
  type: 'tema' | 'funktion';
  sites: SiteId[];
}

// ---------------------------------------------------------------------------
// Hospital at Home (SPEC.md § 11.3, DATA.md § 11) – additive
export type HomeEquipment = 'Oxygen' | 'IV infusion' | 'Monitoring' | 'Home ventilator' | 'Home dialysis';
export type ZoneId = string;

/**
 * A vertex of the road graph: a SiteId ('solna', 'huddinge'), a road InfraNode id, or a zone vertex written
 * `zone:<ZoneId>` (zone ids 'solna' and 'huddinge' would otherwise collide with the sites).
 */
export type GraphNodeId = string;

/** A locality that patients live in and that outages are reported per. */
export interface HomeZone {
  id: ZoneId;
  name: LocalizedText;
  lat: number;
  lng: number;
  radiusKm: number;
  graphNode: GraphNodeId; // the road-graph vertex the zone hangs on (usually itself: `zone:<id>`)
  coordConfidence: Confidence;
  coordSource: string;
}

export interface HomePatient {
  id: string;
  familyName: string;
  givenName: string;
  age: number;
  zone: ZoneId;
  street: string; // the street the patient lives on (OpenStreetMap, or the fixture's) – SPEC.md § 12.5
  houseNo: number; // illustrative, 1–60
  lat: number; // synthetic, a vertex of a street within the zone radius
  lng: number;
  team: string; // illustrative ASIH team name
  equipment: HomeEquipment[];
  batteryHours: number | null; // null when no powered equipment
  visitToday: boolean;
  elCritical: boolean; // derived: Oxygen, IV infusion or Home ventilator
  waterCritical: boolean; // derived: Home dialysis
}

export type InfraLayer = 'water' | 'el' | 'roads';
export type InfraKind = 'waterworks' | 'reserve' | 'pumping' | 'transmission' | 'generation' | 'junction' | 'bridge' | 'tunnel';

/** A figure on an infrastructure node with its label and unit; a range keeps its upper bound in valueMax. */
export interface InfraFigure extends Figure {
  label: LocalizedText;
  unit: LocalizedText;
  valueMax?: number;
}

export interface InfraNode {
  id: string;
  layer: InfraLayer;
  kind: InfraKind;
  name: LocalizedText;
  lat: number;
  lng: number;
  role: LocalizedText; // two or three sentences
  status: LocalizedText; // verification status text shown in the panel
  verified: boolean; // false renders the node hollow with a question mark
  coordConfidence: Confidence;
  coordSource: string;
  figures?: InfraFigure[]; // e.g. vehicles per day, each with confidence and source
  noMarker?: boolean; // drawn as an arrow or as status text on other nodes, not as a marker
  /** Road nodes: the OpenStreetMap way names this node blocks when it is closed (SPEC.md § 12.5). */
  osmWayNames?: string[];
}

export interface InfraLink {
  id: string;
  layer: InfraLayer;
  a: GraphNodeId;
  b: GraphNodeId; // for an off-map arrow: the node the arrow stands for, else equal to a
  label: LocalizedText; // empty when the source gives no label
  style: 'solid' | 'dashed' | 'dotted' | 'road' | 'street';
  verified: boolean; // the connection exists per the source; dashed/dotted or verified=false renders as schematic
  offmap?: { dir: 'N' | 'S' | 'E' | 'W'; text: LocalizedText }; // an arrow leaving the map instead of a second node
}

/** A scenario preset of the flag-setting kind (SPEC.md § 11.5). */
export interface HomeDisruptionPreset {
  key: 'bridge' | 'power' | 'water';
  name: LocalizedText;
  blockedNodes: string[];
  powerOutZones: ZoneId[];
  waterOutZones: ZoneId[];
}

/** A disruption as a record in time (SPEC.md § 13.2); the blocked and outage sets are derived from the active ones. */
export type HomeDisruptionKind = 'road' | 'power' | 'water';
export type HomeDisruptionSource = 'map' | 'preset' | 'message';
/** What `target` names: an OSM way id, a road key (`name` or `name|ref`), a road InfraNode id, or a ZoneId. */
export type HomeDisruptionTargetKind = 'way' | 'road' | 'node' | 'zone';
export type HomeDisruptionEnd = 'manual' | 'expected' | 'reset' | 'replaced';
export interface HomeDisruption {
  id: string;
  kind: HomeDisruptionKind;
  target: string;
  targetKind: HomeDisruptionTargetKind;
  label: LocalizedText;
  startedAt: number; // clock minutes
  expectedEnd: number | null; // clock minutes
  source: HomeDisruptionSource;
  createdBy: string;
  /** Set when the record stops being active; the record stays as history. */
  endedAt: number | null;
  endReason: HomeDisruptionEnd | null;
}

// Teams, visits and the work on affected patients (SPEC.md § 13.3, § 14.2, § 14.3)
export type TeamId = string;
export interface HomeTeam {
  id: TeamId;
  name: string; // "ASIH Nord"; HomePatient.team carries the same string
  baseLat: number;
  baseLng: number;
  baseLabel: LocalizedText;
  cars: number;
  phone: string; // placeholder "0XX-XXX XX XX"
}

export type HomeVisitStatus = 'planned' | 'moved' | 'cancelled' | 'done';
export interface HomeVisit {
  id: string;
  patientId: string;
  teamId: TeamId;
  start: number; // minutes since 00:00 of the demo day, 08:00–17:00 in 30-minute steps
  durationMin: number;
  status: HomeVisitStatus;
}

/** The status chain of an affected patient (SPEC.md § 13.3): Ohanterad, Kontaktad, Planerad, Bekräftad. */
export type HomeWorkStatus = 'Unhandled' | 'Contacted' | 'Planned' | 'Confirmed';
export interface HomeWork {
  status: HomeWorkStatus;
  note: string | null;
  assignedTeam: TeamId | null;
  /** The site the patient is brought in to ("Ta in"); shown in Evakuering as an inbound line, without a move record. */
  bringInSite: SiteId | null;
}

// ---------------------------------------------------------------------------
// The pack
export interface EdRooms {
  akutrum: Figure;
  overvakning: Figure;
  behandlingsrum: Figure;
}

export interface DataPack {
  nodes: CareNode[];
  edRooms: Record<SiteId, EdRooms>;
  ladders: Record<'karolinska' | SiteId, LadderStep[]>;
  hospital: HospitalFigures;
  organisation: Organisation[];
  wards: Ward[];
  capabilities: Capability[];
  bottlenecks: Bottleneck[];
  flowMetrics: FlowMetric[];
  bedRequests: BedRequest[];
  dischargeReady: DischargeReady[];
  forecastProfiles: ForecastProfile[];
  resources: Resource[];
  requests: ResourceRequest[];
  messages: Message[];
  staff: Staff[];
  playbooks: Playbook[];
  scenarios: ScenarioPreset[];
  sources: SourceRef[];
  hospitalSources: SourceEntry[];
  patientsBySite: Record<SiteId, Patient[]>;
  presetSites: Site[];
  initialLog: AuditEntry[];
  demoNow: '14:40';
  // Hospital at Home (SPEC.md § 11.3)
  homeZones: HomeZone[];
  homePatients: HomePatient[];
  infraNodes: InfraNode[];
  infraLinks: InfraLink[];
  homeSources: SourceRef[]; // DATA.md § 11.4 (S-H1…S-H14), kept apart from `sources` (DATA.md § 9)
  homePresets: HomeDisruptionPreset[];
  // Teams and today's visits (SPEC.md § 14.2, § 14.3)
  homeTeams: HomeTeam[];
  homeVisits: HomeVisit[];
}
