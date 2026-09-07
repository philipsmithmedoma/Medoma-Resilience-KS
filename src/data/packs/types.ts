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

export type LadderKey = 'fastsallda' | 'disponibla_normal' | 'disponibla_v33' | 'belagda' | 'lediga';
export interface LadderStep {
  key: LadderKey;
  label: string;
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
  label: string;
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
  title: string;
  area: string;
  ownerRole: string;
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
  label: string;
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
  name: string;
  trigger: string;
  summary: string;
  defaultLage: BeredskapsLage;
  roles: string[];
  tasks: PlaybookTask[];
  channels: string[];
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
  name: string;
  memberRoles: string[];
  messages: Message[];
}

export interface IncidentTarget {
  label: string;
  target: number;
  unit: string;
  dueAt: string;
  withinUnit?: 'min' | 'dygn';
  measure: TargetMeasure;
}

export interface Incident {
  playbookId: string;
  playbookKey: PlaybookKey;
  name: string;
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
  label: string;
  type: 'number' | 'select';
  options?: Array<{ value: string; label: string }>;
  unit?: string;
}

export interface ScenarioPreset {
  key: ScenarioKey;
  name: string;
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
}
