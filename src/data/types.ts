// Domain model – SPEC.md § 3. Every enum value string is also listed in vocab.ts.

export type NodeId = 'region' | 'vikby' | 'sjoberga' | 'ekhaga' | 'falt-alfa' | 'hemsjukvard' | string;
export type NodeType = 'Hospital' | 'Care hub' | 'Field hospital' | 'Home care';
export type NodeStatus = 'Operational' | 'Degraded' | 'Standing up' | 'Offline';
export type SharingLevel = 'Full' | 'Capacity only' | 'None';
export type Source = 'EHR' | 'HR' | 'RIS' | 'OR planning' | 'Logistics' | 'Manual' | 'Medoma' | 'Mirror';
export type SyncState = 'Synced' | 'Delayed' | 'Manual' | 'Offline';

export interface Figure {
  value: number;
  verified: number;
  estimated: number;
  source: Source;
  lastConfirmed: string; // 'HH:MM'
}

export type AcceptsLevel = 'Ward' | 'Monitored' | 'Intensive' | 'Home';

export interface StaffBreakdown {
  doctors: number;
  nurses: number;
  assistantNurses: number;
  other: number;
}

export interface CareNode {
  id: NodeId;
  name: string;
  type: NodeType;
  status: NodeStatus;
  lead: string;
  place: string;
  lat: number;
  lng: number;
  sharing: SharingLevel;
  sync: SyncState;
  lastSync: string;
  acuteBeds?: { total: number; free: Figure }; // hospitals, hubs, field hospitals
  homeCarePlaces?: { total: number; free: Figure }; // home care
  intensiveCare?: { physical: number; usable: number; free: Figure };
  staffOnDuty: Figure;
  plannedBeds?: number; // Standing up nodes
  accepts: AcceptsLevel[]; // care levels the node can receive
  // Prototype additions (see DECISIONS.md): figures needed by the Command Center cards.
  emergencyDepartment?: { slots: number; inUse: Figure };
  staffBreakdown?: StaffBreakdown;
}

export interface Component {
  name: string;
  total: number;
  available: number;
}

export interface Capability {
  id: string;
  nodeId: NodeId;
  name: string;
  unit: string;
  components: Component[];
  ladder?: Array<{ label: string; value: number }>;
  note?: string;
}
// capacity = min(available); limiting = every component whose available equals the minimum;
// next = the smallest available strictly greater than the minimum (undefined if none).

export interface Bottleneck {
  rank: number;
  nodeId: NodeId;
  capacity: string;
  limitingResource: string;
  impact: string;
  wouldUnlock: string;
}

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
  inTransit: number;
  unknown: number;
  criticalBelow?: number;
  lowBelow?: number;
  note?: string;
  seats?: number; // transport vehicles: seat capacity (informative only)
  source: Source;
  lastConfirmed: string;
}
// Supply status: Critical if available < criticalBelow, Low if available < lowBelow, else Ok.

export type Stability = 'Stable' | 'Monitor' | 'Critical';
export type CareLevel = 'Ward' | 'Monitored' | 'Intensive';
export type TransportNeed = 'Walking' | 'Wheelchair' | 'Stretcher' | 'Ambulance' | 'Intensive care transport';
export type Equipment = 'Oxygen' | 'IV infusion' | 'Monitoring';
export type MoveStatus = 'Planned' | 'Accepted' | 'Transport assigned' | 'Departed' | 'Arrived' | 'Handed over';

export interface MovePlan {
  destinationId: NodeId;
  transportId?: string; // set at the "Transport assigned" step
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
  nodeId: 'vikby';
  stability: Stability;
  careLevel: CareLevel;
  transport: TransportNeed;
  equipment: Equipment[];
  homeCareEligible: boolean;
  move?: MovePlan;
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
  incident?: boolean; // created while an incident was active
  rejectReason?: string;
}

export interface PlaybookTask {
  title: string;
  area: string;
  ownerRole: string;
  dueOffsetMin: number;
}

export type TargetMeasure = 'edTriage' | 'theatresAvailable' | 'icuFreed' | 'acuteBedsFreed' | 'wardsOnMirror';

export interface PlaybookTarget {
  label: string;
  target: number;
  unit: string;
  withinMin: number;
  measure: TargetMeasure;
}

export interface Playbook {
  id: string;
  name: string;
  level?: 1 | 2 | 3;
  trigger: string;
  summary: string;
  roles: string[];
  tasks: PlaybookTask[];
  channels: string[];
  targets: PlaybookTarget[];
  setsEhrOutage?: boolean;
}

export type TaskStatus = 'Not started' | 'In progress' | 'Done';

export interface IncidentTask extends PlaybookTask {
  id: string;
  status: TaskStatus;
  due: string;
  owner?: string;
}

export interface Message {
  id: string;
  author: string;
  role: string;
  at: string;
  text: string;
  nodeId?: NodeId;
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
  measure: TargetMeasure;
}

export interface Incident {
  playbookId: string;
  name: string;
  level?: number;
  activatedAt: string;
  activatedBy: string;
  commander: string;
  roles: Record<string, string | undefined>;
  tasks: IncidentTask[];
  channels: Channel[];
  note?: string;
  targets: IncidentTarget[];
  setsEhrOutage?: boolean;
  logStartId?: string; // first audit entry belonging to this incident
}

export interface ClosedIncident {
  incident: Incident;
  closedAt: string;
  log: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
  detail?: string;
  ref?: string; // id of the object the entry is about (e.g. a request), see DECISIONS.md
}

export type Profession = 'Doc' | 'Nrs' | 'AsPr' | 'Supp';

export interface Staff {
  name: string;
  title: string;
  profession: Profession;
  nodeId: NodeId;
}

export interface SourceEntry {
  source: Source;
  state: SyncState;
  lastSync: string;
}

export interface Site {
  name: string;
  place: string;
  lat: number;
  lng: number;
}
