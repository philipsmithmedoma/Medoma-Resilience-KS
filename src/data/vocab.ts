// Every enum value, label and colour key used in the UI lives here (CLAUDE.md § Conventions).
import type {
  AcceptsLevel,
  CareLevel,
  Equipment,
  MoveStatus,
  NodeStatus,
  NodeType,
  Priority,
  Profession,
  RequestStatus,
  ResourceCategory,
  SharingLevel,
  Source,
  Stability,
  SyncState,
  TaskStatus,
  TransportNeed,
} from './types';

// ---------------------------------------------------------------------------
// Current user (SPEC.md § 2.3)
export const CURRENT_USER = { name: 'Eva Lind', initials: 'EL', role: 'Operations manager' } as const;
export const SYSTEM_ACTOR = 'System';

// ---------------------------------------------------------------------------
// Navigation (SPEC.md § 2.1)
export interface ModuleDef {
  key: string;
  label: string;
  path: string;
  existing: boolean;
}
export const MODULES: ModuleDef[] = [
  { key: 'patients', label: 'Patients', path: '/patients', existing: true },
  { key: 'activities', label: 'Activities', path: '/activities', existing: true },
  { key: 'planning', label: 'Planning', path: '/planning', existing: true },
  { key: 'employees', label: 'Employees', path: '/employees', existing: true },
  { key: 'reporting', label: 'Reporting', path: '/reporting', existing: true },
  { key: 'command-center', label: 'Command Center', path: '/command-center', existing: false },
  { key: 'incident', label: 'Incident', path: '/incident', existing: false },
  { key: 'evacuation', label: 'Evacuation', path: '/evacuation', existing: false },
  { key: 'resources', label: 'Resources', path: '/resources', existing: false },
  { key: 'network', label: 'Network', path: '/network', existing: false },
];

export const REGION_ID = 'region';
export const REGION_NAME = 'Region Nord';
export const HOME_NODE_ID = 'vikby';
export const DEMO_DATE = 'Friday 4 September 2026';
export const DEMO_DATE_SHORT = 'Friday 4 September';

// ---------------------------------------------------------------------------
// Enum value lists (order matters where the UI shows chains or filters)
export const NODE_TYPES: NodeType[] = ['Hospital', 'Care hub', 'Field hospital', 'Home care'];
export const NODE_STATUSES: NodeStatus[] = ['Operational', 'Degraded', 'Standing up', 'Offline'];
export const SHARING_LEVELS: SharingLevel[] = ['Full', 'Capacity only', 'None'];
export const SOURCES: Source[] = ['EHR', 'HR', 'RIS', 'OR planning', 'Logistics', 'Manual', 'Medoma', 'Mirror'];
export const SYNC_STATES: SyncState[] = ['Synced', 'Delayed', 'Manual', 'Offline'];
export const STABILITIES: Stability[] = ['Stable', 'Monitor', 'Critical'];
export const CARE_LEVELS: CareLevel[] = ['Ward', 'Monitored', 'Intensive'];
export const ACCEPTS_LEVELS: AcceptsLevel[] = ['Ward', 'Monitored', 'Intensive', 'Home'];
export const TRANSPORT_NEEDS: TransportNeed[] = ['Walking', 'Wheelchair', 'Stretcher', 'Ambulance', 'Intensive care transport'];
export const EQUIPMENT: Equipment[] = ['Oxygen', 'IV infusion', 'Monitoring'];
export const MOVE_STATUSES: MoveStatus[] = ['Planned', 'Accepted', 'Transport assigned', 'Departed', 'Arrived', 'Handed over'];
export const PRIORITIES: Priority[] = ['Low', 'Normal', 'High', 'Critical'];
export const REQUEST_STATUSES: RequestStatus[] = ['Requested', 'Accepted', 'Allocated', 'Dispatched', 'Received', 'Rejected'];
export const REQUEST_CHAIN: RequestStatus[] = ['Requested', 'Accepted', 'Allocated', 'Dispatched', 'Received'];
export const TASK_STATUSES: TaskStatus[] = ['Not started', 'In progress', 'Done'];
export const RESOURCE_CATEGORIES: ResourceCategory[] = ['Equipment', 'Transport', 'Team', 'Supply'];
export const PROFESSIONS: Profession[] = ['Doc', 'Nrs', 'AsPr', 'Supp'];

export const STABILITY_TO_CARE_LEVEL: Record<Stability, CareLevel> = {
  Stable: 'Ward',
  Monitor: 'Monitored',
  Critical: 'Intensive',
};

export type SupplyStatus = 'Ok' | 'Low' | 'Critical';
export const SUPPLY_STATUSES: SupplyStatus[] = ['Ok', 'Low', 'Critical'];
export const INVENTORY_STATUS_OUT_OF_SERVICE = 'Out of service';

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
  Degraded: 'warning',
  Delayed: 'warning',
  Low: 'warning',
  Estimated: 'warning',
  Monitor: 'warning',
  'Standing up': 'warning',
  Suggested: 'warning',
  'What-if, not saved': 'warning',
  'Operating on mirror': 'warning',
  Offline: 'red',
  Critical: 'red',
  'Out of service': 'red',
  Rejected: 'red',
  Unknown: 'grey',
  'Not started': 'grey',
  'Not shared': 'grey',
  Manual: 'grey',
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
};

export function toneOf(label: string): ChipTone {
  return TONES[label] ?? 'grey';
}

export const PROFESSION_LABELS: Record<Profession, string> = {
  Doc: 'Doctor',
  Nrs: 'Nurse',
  AsPr: 'Assistant nurse',
  Supp: 'Support',
};

// ---------------------------------------------------------------------------
// Transport compatibility (SPEC.md § 6.3)
export const TRANSPORT_COMPATIBILITY: Record<TransportNeed, string[]> = {
  Walking: ['Taxi contract', 'Medical bus', 'Patient transport vehicle', 'Ambulance'],
  Wheelchair: ['Patient transport vehicle', 'Medical bus', 'Ambulance'],
  Stretcher: ['Patient transport vehicle', 'Ambulance'],
  Ambulance: ['Ambulance'],
  'Intensive care transport': ['Ambulance'],
};

export const ACCEPTS_FOR_CARE_LEVEL: Record<CareLevel, AcceptsLevel> = {
  Ward: 'Ward',
  Monitored: 'Monitored',
  Intensive: 'Intensive',
};

// ---------------------------------------------------------------------------
// UI strings shared across modules
export const LABELS = {
  demo: 'Demo',
  simulateEhrOutage: 'Simulate EHR outage',
  resetDemoData: 'Reset demo data',
  demoDataReset: 'Demo data reset',
  demoClock: (hhmm: string) => `Demo clock: ${hhmm}, ${DEMO_DATE}. Advances one minute per action.`,
  comingLater: 'Coming in a later batch',
  stubSentence: 'This module exists in Medoma today and is outside the scope of this prototype.',
  goToCommandCenter: 'Go to Command Center',
  openIncident: 'Open incident',
  closeIncident: 'Close incident',
  incidentBanner: (name: string, at: string, by: string, commander: string) =>
    `Incident mode active: ${name}. Activated ${at} by ${by}. Incident commander: ${commander}.`,
  notShared: 'Not shared',
  notAvailableAtNode: 'Not available at this node',
  estimated: 'Estimated',
  lastConfirmed: (at: string, source: string) => `Last confirmed ${at} (${source})`,
  olderThan30: 'Older than 30 minutes',
  operatingOnMirror: 'Operating on mirror',
  ehrOffline: (since: string) => `EHR offline, operating on mirror since ${since}`,
  showDetail: 'Show detail',
  log: 'Log',
  showLog: 'Show log',
  auditLog: 'Audit log',
  change: 'Change',
  cancel: 'Cancel',
  none: 'None',
} as const;

export const AUDIT = {
  ehrLost: 'EHR connection lost, switched to operational mirror',
  ehrRestored: 'EHR connection restored',
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
// Tasks whose completion drives a target measure (SPEC.md § 3)
export const MEASURE_TASKS = {
  edTriage: 'Set up triage zones',
  theatresAvailable: 'Stop elective surgery and release theatres',
  icuFreed: 'Convert post-operative unit to intensive care overflow',
  wardsOnMirror: 'Switch to operational mirror on all wards',
} as const;

// ---------------------------------------------------------------------------
// Command Center strings (SPEC.md § 6.1)
export const CC = {
  title: 'Command Center',
  capacityNow: 'Capacity now',
  bottlenecks: 'Bottlenecks',
  whatLimitsWhat: 'What limits what',
  nodes: 'Nodes',
  sources: 'Sources',
  selectNode: 'Select a node to see what limits its capacity.',
  noCapabilities: 'No capability data at this node.',
  whatIf: 'What-if',
  whatIfNotSaved: 'What-if, not saved',
  reset: 'Reset',
  limiting: 'Limiting',
  cards: {
    acuteBeds: 'Acute beds',
    homeCarePlaces: 'Home care places',
    intensiveCare: 'Intensive care',
    theatres: 'Operating theatres',
    imaging: 'Imaging',
    ed: 'Emergency department',
    staff: 'Staff on duty',
    transport: 'Transport',
    network: '(network)',
    vikbyOnly: 'Vikby sjukhus only',
  },
  units: {
    availableOf: (total: number) => `available of ${total}`,
    availableOfUsable: (usable: number) => `available of ${usable} usable`,
    surgeries: (theatres: number) => `surgeries possible now, ${theatres} theatres free`,
    scanners: (total: number, waiting: number) => `of ${total} CT scanners, ${waiting} waiting`,
    edSlots: (slots: number) => `of ${slots} slots in use`,
    ambulances: 'ambulances available',
    staffBreakdown: (b: { doctors: number; nurses: number; assistantNurses: number; other: number }) =>
      `${b.doctors} doctors, ${b.nurses} nurses, ${b.assistantNurses} assistant nurses, ${b.other} other`,
    edBreakdown: (inUse: number, slots: number) => `${inUse} of ${slots} slots in use, ${slots - inUse} free.`,
  },
  notSharedBy: (names: string[]) => `${names.join(', ')} not shared`,
  columns: {
    rank: 'Rank',
    node: 'Node',
    capacity: 'Capacity',
    limitingResource: 'Limiting resource',
    impact: 'Impact',
    wouldUnlock: 'Would unlock',
    component: 'Component',
    total: 'Total',
    available: 'Available',
    type: 'Type',
    status: 'Status',
    acuteBeds: 'Acute beds free / total',
    intensiveCare: 'Intensive care free / usable',
    staff: 'Staff on duty',
    sync: 'Sync',
    sharing: 'Sharing',
    lead: 'Lead',
    place: 'Place',
    source: 'Source',
    state: 'State',
    lastSync: 'Last sync',
  },
  objective: (label: string, current: number, target: number, unit: string, due: string) =>
    `${label}: ${current} / ${target} ${unit}, due ${due}`,
} as const;

export const AUDIT_COLUMNS = { time: 'Time', actor: 'Actor', action: 'Action', object: 'Object', detail: 'Detail' } as const;

// ---------------------------------------------------------------------------
// Incident strings (SPEC.md § 6.2)
export const INCIDENT = {
  title: 'Incident',
  noActive: 'No active incident.',
  activateAPlaybook: 'Activate a playbook',
  playbooks: 'Playbooks',
  previous: 'Previous incidents',
  activate: 'Activate',
  activateTitle: (name: string) => `Activate ${name}?`,
  activateBody: (roles: number, tasks: number, channels: number, targets: number) =>
    `Activating creates ${roles} roles, ${tasks} tasks, ${channels} channels and ${targets} capacity targets, and switches the Command Center to incident view.`,
  activateIncident: 'Activate incident',
  incidentActivated: 'Incident activated',
  incidentClosed: 'Incident closed',
  closeTitle: 'Close incident?',
  closeBody: 'The incident log is kept under Previous incidents. Open tasks are left as they are.',
  addTask: 'Add task',
  taskAdded: 'Task added',
  active: 'Active',
  level: (n: number) => `Level ${n}`,
  activatedLine: (at: string, by: string, commander: string) => `Activated ${at} by ${by}. Incident commander: ${commander}.`,
  tabs: { overview: 'Overview', tasks: 'Tasks', channels: 'Channels', log: 'Log' },
  targets: 'Targets',
  roles: 'Roles',
  unassigned: 'Unassigned',
  assign: 'Assign',
  summary: (notStarted: number, inProgress: number, done: number) => `${notStarted} not started, ${inProgress} in progress, ${done} done`,
  due: (at: string) => `Due ${at}`,
  members: (roles: string[]) => roles.join(', '),
  messages: (n: number) => `${n} ${n === 1 ? 'message' : 'messages'}`,
  noMessages: 'No messages yet.',
  send: 'Send',
  messagePlaceholder: 'Write a message',
  messageSent: 'Message sent',
  backToIncident: 'Back to incident',
  createRequest: 'Create request',
  fields: { commander: 'Incident commander', note: 'Note', title: 'Title', area: 'Area', ownerRole: 'Owner role', dueIn: 'Due in minutes' },
  columns: { name: 'Name', level: 'Level', trigger: 'Trigger', roles: 'Roles', tasks: 'Tasks', channels: 'Channels', targets: 'Targets', activated: 'Activated', closed: 'Closed', tasksDone: 'Tasks done' },
  systemActivated: (name: string, at: string) => `Incident ${name} activated at ${at}.`,
  systemChannelOpened: (at: string, roles: string[]) => `Channel opened at ${at} for ${roles.join(', ')}.`,
  audit: {
    activated: (name: string) => `Activated incident – ${name}`,
    createdTask: (title: string) => `Created task – ${title}`,
    openedChannel: (name: string) => `Opened channel – ${name}`,
    closed: 'Closed incident',
    taskStatus: (title: string, status: string) => `Changed task status – ${title} – ${status}`,
    addedTask: 'Added task',
    assignedTask: (title: string, person: string) => `Assigned task – ${title} – ${person}`,
    changedRole: (role: string, person: string) => `Changed role – ${role} – ${person}`,
    sentMessage: (channel: string) => `Sent message – ${channel}`,
  },
} as const;

// ---------------------------------------------------------------------------
// Evacuation strings (SPEC.md § 6.3)
export const EVAC = {
  title: 'Evacuation',
  from: 'from Vikby sjukhus',
  target: (n: number) => `Target: free ${n} acute beds`,
  freed: (n: number) => `${n} freed`,
  noTarget: 'No target set',
  counts: { planned: 'Planned', accepted: 'Accepted', inTransit: 'In transit', arrived: 'Arrived', handedOver: 'Handed over' },
  suggestPlan: 'Suggest plan',
  clearSuggestions: 'Clear suggestions',
  patients: (n: number) => `Patients (${n})`,
  destinations: 'Destinations',
  transport: 'Transport',
  planMove: 'Plan move',
  movePlanned: 'Move planned',
  destination: 'Destination',
  selectDestination: 'Select destination',
  selectVehicle: 'Select vehicle',
  needs: (need: string) => `Needs: ${need}`,
  notPlanned: 'Not planned',
  suggested: 'Suggested',
  freeOf: (free: number, total: number) => `Free ${free} of ${total}`,
  available: (n: number) => `${n} available`,
  seats: (n: number) => `${n} seated`,
  km: (n: number) => `${n} km`,
  filters: { stability: 'Stability', transport: 'Transport', status: 'Status', all: 'All' },
  statusFilters: ['All', 'Not planned', 'Planned', 'In transit', 'Arrived'] as const,
  noMatch: 'No patients match these filters.',
  clearFilters: 'Clear filters',
  steps: {
    accept: 'Accept at destination',
    assign: 'Assign transport',
    departed: 'Mark departed',
    arrived: 'Mark arrived',
    handedOver: 'Mark handed over',
    cancel: 'Cancel move',
    acceptSuggestion: 'Accept suggestion',
    reject: 'Reject',
  },
  toasts: {
    accepted: 'Accepted at destination',
    assigned: 'Transport assigned',
    departed: 'Marked departed',
    arrived: 'Marked arrived',
    handedOver: 'Marked handed over',
    cancelled: 'Move cancelled',
    suggestionAccepted: 'Suggestion accepted',
    suggestionRejected: 'Suggestion rejected',
    suggestionsCleared: 'Suggestions cleared',
    suggested: (n: number, m: number) => `Suggested ${n} moves, ${m} could not be placed`,
  },
  reasons: {
    doesNotAccept: (level: string) => `Does not accept ${level}`,
    noFreePlaces: 'No free places',
    noFreeMonitors: 'No free monitors',
    notSuitable: (need: string) => `Not suitable for ${need}`,
    noneAvailable: 'None available',
  },
  audit: {
    planned: (patient: string, node: string) => `Planned move – ${patient} – to ${node}`,
    accepted: (patient: string) => `Accepted at destination – ${patient}`,
    assigned: (patient: string, vehicle: string) => `Assigned transport – ${patient} – ${vehicle}`,
    departed: (patient: string) => `Departed – ${patient}`,
    arrived: (patient: string, node: string) => `Arrived – ${patient} – ${node}`,
    handedOver: (patient: string, node: string) => `Handed over – ${patient} – ${node}`,
    cancelled: (patient: string) => `Cancelled move – ${patient}`,
    suggested: (n: number) => `Suggested moves – ${n} patients`,
    authorised: (patient: string, node: string) => `Authorised suggested move – ${patient} – to ${node}`,
    rejected: (patient: string) => `Rejected suggested move – ${patient}`,
  },
  map: { freePlaces: (n: number) => `${n} free places`, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
} as const;

export const NODE_STATUS_COLOURS: Record<NodeStatus, string> = {
  Operational: '#1AA339',
  Degraded: '#F2994A',
  'Standing up': '#F2994A',
  Offline: '#EB5757',
};

// ---------------------------------------------------------------------------
// Resources strings (SPEC.md § 6.4)
export const RES = {
  title: 'Resources',
  tabs: { requests: (open: number) => `Requests (${open})`, inventory: 'Inventory', fromMessage: (n: number) => `From message (${n})` },
  newRequest: 'New request',
  requestCreated: 'Request created',
  noOpenRequests: 'No open requests.',
  notAllocated: 'Not allocated',
  incident: 'Incident',
  requestedBy: (by: string, at: string) => `Requested by ${by}, ${at}`,
  eta: (at: string) => `ETA ${at}`,
  quantityUnit: (name: string, qty: number, unit: string) => `${name} × ${qty} ${unit}`,
  drawerTitle: (name: string, qty: number) => `${name} × ${qty}`,
  statusChain: 'Status',
  auditEntries: 'Audit entries',
  actions: { accept: 'Accept', reject: 'Reject', allocate: 'Allocate', dispatch: 'Dispatch', receive: 'Mark received', create: 'Create request', confirmReject: 'Reject request' },
  toasts: { accepted: 'Request accepted', rejected: 'Request rejected', allocated: 'Request allocated', dispatched: 'Request dispatched', received: 'Request received' },
  rejectTitle: 'Reject request?',
  rejectBody: 'Give a one-line reason. The request stays in the list as Rejected.',
  fields: {
    resource: 'Resource',
    quantity: 'Quantity',
    fromNode: 'From node',
    toNode: 'To node',
    priority: 'Priority',
    status: 'Status',
    requestedBy: 'Requested by',
    requestedAt: 'Requested at',
    eta: 'ETA',
    note: 'Note',
    reason: 'Reason',
    rejectReason: 'Reject reason',
  },
  allocateOption: (node: string, available: number) => `${node}: ${available} available`,
  notEnough: (available: number, qty: number) => `${available} available, ${qty} needed`,
  noSource: 'No node has this resource',
  suggestedPrefill: 'Suggested from the message',
  columns: {
    resource: 'Resource',
    node: 'Node',
    category: 'Category',
    total: 'Total',
    available: 'Available',
    inUse: 'In use',
    reserved: 'Reserved',
    outOfService: 'Out of service',
    inTransit: 'In transit',
    unknown: 'Unknown',
    status: 'Status',
    lastConfirmed: 'Last confirmed',
    sum: 'Sum',
  },
  filterAll: 'All',
  audit: {
    requested: (name: string, qty: number) => `${name} × ${qty}`,
    toNode: (node: string) => `To ${node}`,
    transition: (action: string, name: string, qty: number, node: string) => `${action} request – ${name} × ${qty} – to ${node}`,
  },
} as const;

// ---------------------------------------------------------------------------
// Network strings (SPEC.md § 6.5)
export const NET = {
  title: 'Network',
  standUp: 'Stand up node',
  nodeCreated: 'Node created',
  back: 'Back to network',
  fields: { name: 'Name', type: 'Type', site: 'Site', plannedBeds: 'Planned beds', lead: 'Lead', sharing: 'Sharing' },
  standUpTypes: ['Care hub', 'Field hospital'] as const,
  detail: {
    type: 'Type',
    status: 'Status',
    lead: 'Lead',
    place: 'Place',
    sharing: 'Sharing',
    sync: 'Sync',
    acuteBeds: 'Acute beds',
    homeCarePlaces: 'Home care places',
    intensiveCare: 'Intensive care',
    staff: 'Staff on duty',
    accepts: 'Accepts',
    plannedBeds: 'Planned beds',
    sources: 'Sources',
    bottlenecks: 'Bottlenecks',
    resources: 'Resources',
    showInventory: 'Show inventory',
    freeOf: (free: number, total: number) => `${free} free of ${total}`,
    freeOfUsable: (free: number, usable: number, physical: number) => `${free} free of ${usable} usable (${physical} physical)`,
  },
  toasts: { statusChanged: 'Node status changed', sharingChanged: 'Node sharing changed' },
  audit: {
    stoodUp: (name: string) => `Stood up node – ${name}`,
    changed: (field: string, node: string, value: string) => `Changed node ${field} – ${node} – ${value}`,
  },
} as const;
