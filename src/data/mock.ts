// Mock dataset – SPEC.md § 5. All values are exactly as specified; nothing here is computed.
import type {
  AuditEntry,
  Bottleneck,
  Capability,
  CareNode,
  Message,
  Patient,
  Playbook,
  Resource,
  ResourceRequest,
  Site,
  SourceEntry,
  Staff,
} from './types';
import { PATIENTS } from './patients';

// ---------------------------------------------------------------------------
// § 5.1 Staff
export const STAFF: Staff[] = [
  { name: 'Eva Lind', title: 'Operations manager', profession: 'Supp', nodeId: 'vikby' },
  { name: 'Johan Ek', title: 'Chief surgeon', profession: 'Doc', nodeId: 'vikby' },
  { name: 'Maria Holm', title: 'Intensive care lead', profession: 'Doc', nodeId: 'vikby' },
  { name: 'Omar Haddad', title: 'Anaesthesiologist', profession: 'Doc', nodeId: 'vikby' },
  { name: 'Peter Nord', title: 'Head nurse, emergency department', profession: 'Nrs', nodeId: 'vikby' },
  { name: 'Sara Lund', title: 'Nurse', profession: 'Nrs', nodeId: 'vikby' },
  { name: 'Karin Sjö', title: 'Logistics coordinator', profession: 'Supp', nodeId: 'vikby' },
  { name: 'Erik Falk', title: 'Ambulance coordinator', profession: 'Supp', nodeId: 'vikby' },
  { name: 'Lena Åkesson', title: 'Communications officer', profession: 'Supp', nodeId: 'vikby' },
  { name: 'Helena Berg', title: 'Chief physician', profession: 'Doc', nodeId: 'sjoberga' },
  { name: 'Mats Öberg', title: 'Care hub lead', profession: 'Nrs', nodeId: 'ekhaga' },
  { name: 'Jonas Vik', title: 'Field hospital lead', profession: 'Doc', nodeId: 'falt-alfa' },
  { name: 'Anna Ek', title: 'Home care lead', profession: 'Nrs', nodeId: 'hemsjukvard' },
];

// ---------------------------------------------------------------------------
// § 5.2 Nodes
export const NODES: CareNode[] = [
  {
    id: 'vikby',
    name: 'Vikby sjukhus',
    type: 'Hospital',
    status: 'Operational',
    lead: 'Eva Lind',
    place: 'Sollentuna',
    lat: 59.4286,
    lng: 17.9509,
    sharing: 'Full',
    sync: 'Synced',
    lastSync: '14:37',
    acuteBeds: { total: 320, free: { value: 16, verified: 14, estimated: 2, source: 'EHR', lastConfirmed: '14:32' } },
    intensiveCare: { physical: 24, usable: 14, free: { value: 3, verified: 3, estimated: 0, source: 'EHR', lastConfirmed: '14:35' } },
    staffOnDuty: { value: 253, verified: 253, estimated: 0, source: 'HR', lastConfirmed: '14:00' },
    staffBreakdown: { doctors: 38, nurses: 112, assistantNurses: 96, other: 7 },
    emergencyDepartment: { slots: 40, inUse: { value: 31, verified: 31, estimated: 0, source: 'EHR', lastConfirmed: '14:38' } },
    accepts: ['Ward', 'Monitored', 'Intensive'],
  },
  {
    id: 'sjoberga',
    name: 'Sjöberga sjukhus',
    type: 'Hospital',
    status: 'Operational',
    lead: 'Helena Berg',
    place: 'Märsta',
    lat: 59.6206,
    lng: 17.8555,
    sharing: 'Capacity only',
    sync: 'Synced',
    lastSync: '14:30',
    acuteBeds: { total: 180, free: { value: 12, verified: 12, estimated: 0, source: 'EHR', lastConfirmed: '14:30' } },
    intensiveCare: { physical: 8, usable: 8, free: { value: 2, verified: 2, estimated: 0, source: 'EHR', lastConfirmed: '14:30' } },
    staffOnDuty: { value: 140, verified: 140, estimated: 0, source: 'HR', lastConfirmed: '13:00' },
    accepts: ['Ward', 'Monitored', 'Intensive'],
  },
  {
    id: 'ekhaga',
    name: 'Ekhaga vårdhubb',
    type: 'Care hub',
    status: 'Operational',
    lead: 'Mats Öberg',
    place: 'Kista',
    lat: 59.4033,
    lng: 17.9424,
    sharing: 'Full',
    sync: 'Manual',
    lastSync: '14:10',
    acuteBeds: { total: 20, free: { value: 14, verified: 14, estimated: 0, source: 'Manual', lastConfirmed: '14:10' } },
    plannedBeds: 40,
    staffOnDuty: { value: 12, verified: 12, estimated: 0, source: 'Manual', lastConfirmed: '14:10' },
    accepts: ['Ward', 'Monitored'],
  },
  {
    id: 'falt-alfa',
    name: 'Fältsjukhus Alfa',
    type: 'Field hospital',
    status: 'Standing up',
    lead: 'Jonas Vik',
    place: 'Rosersberg',
    lat: 59.5836,
    lng: 17.8757,
    sharing: 'Full',
    sync: 'Manual',
    lastSync: '13:55',
    acuteBeds: { total: 12, free: { value: 12, verified: 0, estimated: 12, source: 'Manual', lastConfirmed: '13:55' } },
    plannedBeds: 30,
    staffOnDuty: { value: 9, verified: 9, estimated: 0, source: 'Manual', lastConfirmed: '13:55' },
    accepts: ['Ward'],
  },
  {
    id: 'hemsjukvard',
    name: 'Hemsjukvård Sollentuna',
    type: 'Home care',
    status: 'Operational',
    lead: 'Anna Ek',
    place: 'Sollentuna',
    lat: 59.43,
    lng: 17.945,
    sharing: 'Full',
    sync: 'Synced',
    lastSync: '14:37',
    homeCarePlaces: { total: 30, free: { value: 8, verified: 8, estimated: 0, source: 'Medoma', lastConfirmed: '14:37' } },
    staffOnDuty: { value: 22, verified: 22, estimated: 0, source: 'Medoma', lastConfirmed: '14:37' },
    accepts: ['Home'],
  },
];

// Sources shown in the Command Center sources popover (SPEC.md § 6.1).
export const VIKBY_SOURCES: SourceEntry[] = [
  { source: 'EHR', state: 'Synced', lastSync: '14:37' },
  { source: 'HR', state: 'Synced', lastSync: '14:00' },
  { source: 'RIS', state: 'Synced', lastSync: '14:20' },
  { source: 'OR planning', state: 'Synced', lastSync: '14:30' },
  { source: 'Logistics', state: 'Synced', lastSync: '14:15' },
];

// CT queue shown on the Imaging card and in the CT bottleneck (SPEC.md § 5.3 note, § 6.1.1).
export const CT_QUEUE = { waiting: 9, medianWaitMin: 95 };

// ---------------------------------------------------------------------------
// § 5.3 Capabilities
export const CAPABILITIES: Capability[] = [
  {
    id: 'emergency-surgery',
    nodeId: 'vikby',
    name: 'Emergency surgery',
    unit: 'surgeries possible now',
    components: [
      { name: 'Operating theatres', total: 8, available: 6 },
      { name: 'Surgeons on site', total: 7, available: 5 },
      { name: 'Anaesthesia teams', total: 6, available: 4 },
      { name: 'Instrument sets', total: 10, available: 9 },
      { name: 'Post-operative beds', total: 12, available: 2 },
    ],
    ladder: [
      { label: 'Theatres', value: 8 },
      { label: 'Staffed', value: 6 },
      { label: 'Post-operative capacity', value: 2 },
    ],
    note: 'Intensive care follows its own capability.',
  },
  {
    id: 'intensive-care',
    nodeId: 'vikby',
    name: 'Intensive care',
    unit: 'beds available',
    components: [
      { name: 'Physical beds', total: 24, available: 10 },
      { name: 'Staffed bed slots', total: 18, available: 4 },
      { name: 'Equipped bed slots (ventilator, monitoring)', total: 16, available: 3 },
      { name: 'Medication and material covered', total: 14, available: 3 },
    ],
    ladder: [
      { label: 'Physical', value: 24 },
      { label: 'Staffable', value: 18 },
      { label: 'Equipped', value: 16 },
      { label: 'Usable', value: 14 },
    ],
  },
  {
    id: 'ct-imaging',
    nodeId: 'vikby',
    name: 'CT imaging',
    unit: 'scanners in operation',
    components: [
      { name: 'CT scanners', total: 2, available: 1 },
      { name: 'Radiographers', total: 3, available: 2 },
      { name: 'Radiologists', total: 2, available: 2 },
      { name: 'Porters for imaging transport', total: 2, available: 2 },
    ],
    note: 'CT2 out of service since 14:20 (RIS). Repair ETA 17:00. 9 patients waiting, median wait 95 min.',
  },
  {
    id: 'acute-beds',
    nodeId: 'vikby',
    name: 'Acute beds',
    unit: 'beds available',
    components: [
      { name: 'Physical beds', total: 320, available: 22 },
      { name: 'Staffed beds', total: 302, available: 16 },
    ],
    note: 'Could be freed: 18 discharge-ready patients, 40 patients eligible for transfer (see Evacuation).',
  },
  {
    id: 'sjoberga-acute-beds',
    nodeId: 'sjoberga',
    name: 'Acute beds',
    unit: 'beds available',
    components: [
      { name: 'Physical beds', total: 180, available: 12 },
      { name: 'Staffed beds', total: 172, available: 12 },
    ],
  },
  {
    id: 'sjoberga-intensive-care',
    nodeId: 'sjoberga',
    name: 'Intensive care',
    unit: 'beds available',
    components: [
      { name: 'Physical beds', total: 8, available: 2 },
      { name: 'Staffed beds', total: 8, available: 2 },
    ],
  },
  {
    id: 'ekhaga-monitored-intake',
    nodeId: 'ekhaga',
    name: 'Monitored intake',
    unit: 'monitored patients can be received',
    components: [
      { name: 'Beds', total: 20, available: 14 },
      { name: 'Patient monitors', total: 12, available: 4 },
    ],
    note: 'Patient monitors limit Monitored intake to 4.',
  },
  {
    id: 'falt-alfa-field-beds',
    nodeId: 'falt-alfa',
    name: 'Field beds',
    unit: 'beds available',
    components: [
      { name: 'Field beds assembled', total: 12, available: 12 },
      { name: 'Staffed', total: 12, available: 12 },
    ],
    note: 'All figures estimated.',
  },
];

// ---------------------------------------------------------------------------
// § 5.4 Bottlenecks
export const BOTTLENECKS: Bottleneck[] = [
  {
    rank: 1,
    nodeId: 'vikby',
    capacity: 'Emergency surgery',
    limitingResource: 'Post-operative beds (2 of 12 available)',
    impact: '2 surgeries possible now, 6 theatres ready',
    wouldUnlock: '+2 post-operative beds → +2 surgeries; then anaesthesia teams limit at 4',
  },
  {
    rank: 2,
    nodeId: 'vikby',
    capacity: 'CT imaging',
    limitingResource: 'CT2 out of service (1 of 2 scanners)',
    impact: '9 patients waiting, median wait 95 min',
    wouldUnlock: 'Repair ETA 17:00, or transfer 4 patients to Sjöberga sjukhus',
  },
  {
    rank: 3,
    nodeId: 'vikby',
    capacity: 'Intensive care',
    limitingResource: 'Equipped and staffed slots (3 of 14 usable beds free)',
    impact: 'Next two admissions fill intensive care',
    wouldUnlock: '+2 intensive care nurses per shift → +2 beds',
  },
  {
    rank: 4,
    nodeId: 'vikby',
    capacity: 'Patient transport',
    limitingResource: 'Ambulances (2 of 6 available)',
    impact: 'Evacuation throughput about 4 patients per hour',
    wouldUnlock: 'Add bus and 2 transport vehicles → about 12 per hour',
  },
  {
    rank: 5,
    nodeId: 'ekhaga',
    capacity: 'Monitored intake',
    limitingResource: 'Patient monitors (4 of 12 available)',
    impact: 'Only 4 monitored patients can be received',
    wouldUnlock: '8 monitors from Vikby sjukhus → 12',
  },
  {
    rank: 6,
    nodeId: 'falt-alfa',
    capacity: 'Field beds',
    limitingResource: 'Staff (9 on site)',
    impact: '12 of 30 planned beds open',
    wouldUnlock: 'Mobile team of 1 doctor + 2 nurses → 24 beds',
  },
];

// ---------------------------------------------------------------------------
// § 5.5 Resources
type ResourceRow = [
  name: string,
  category: Resource['category'],
  unit: string,
  total: number,
  available: number,
  inUse: number,
  reserved: number,
  outOfService: number,
  inTransit: number,
  unknown: number,
  extra?: Partial<Resource>,
];

function rows(nodeId: string, source: Resource['source'], lastConfirmed: string, list: ResourceRow[]): Resource[] {
  return list.map(([name, category, unit, total, available, inUse, reserved, outOfService, inTransit, unknown, extra], i) => ({
    id: `${nodeId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
    nodeId,
    name,
    category,
    unit,
    total,
    available,
    inUse,
    reserved,
    outOfService,
    inTransit,
    unknown,
    source,
    lastConfirmed,
    ...extra,
  }));
}

export const RESOURCES: Resource[] = [
  ...rows('vikby', 'Logistics', '14:15', [
    ['Ventilator', 'Equipment', 'units', 30, 4, 24, 0, 2, 0, 0],
    ['Infusion pump', 'Equipment', 'units', 210, 26, 180, 0, 4, 0, 0],
    ['Patient monitor', 'Equipment', 'units', 45, 7, 38, 0, 0, 0, 0],
    ['Oxygen concentrator', 'Equipment', 'units', 20, 8, 12, 0, 0, 0, 0],
    ['Defibrillator', 'Equipment', 'units', 22, 2, 20, 0, 0, 0, 0],
    ['Portable ultrasound', 'Equipment', 'units', 6, 2, 4, 0, 0, 0, 0],
    ['Wheelchair', 'Equipment', 'units', 60, 8, 52, 0, 0, 0, 0],
    ['Stretcher', 'Equipment', 'units', 25, 7, 18, 0, 0, 0, 0],
    ['Ambulance', 'Transport', 'vehicles', 6, 2, 4, 0, 0, 0, 0],
    ['Patient transport vehicle', 'Transport', 'vehicles', 5, 3, 2, 0, 0, 0, 0, { seats: 2, note: 'capacity 2 seated' }],
    ['Medical bus', 'Transport', 'vehicles', 1, 1, 0, 0, 0, 0, 0, { seats: 12, note: 'capacity 12 seated' }],
    ['Taxi contract', 'Transport', 'vehicles', 4, 4, 0, 0, 0, 0, 0, { seats: 1, note: 'capacity 1 seated' }],
    ['Helicopter', 'Transport', 'vehicles', 1, 0, 0, 0, 0, 0, 1, { note: 'regional resource, status unknown' }],
    ['Mobile care team', 'Team', 'teams', 3, 2, 0, 0, 0, 1, 0, { note: '1 in transit to Fältsjukhus Alfa' }],
    ['Oxygen cylinder', 'Supply', 'cylinders', 120, 120, 0, 0, 0, 0, 0, { lowBelow: 60, note: 'about 48 h at current use' }],
    ['Blood products O-negative', 'Supply', 'units', 18, 18, 0, 0, 0, 0, 0, { criticalBelow: 20, lowBelow: 40 }],
    ['Antibiotics IV, broad spectrum', 'Supply', 'days of use', 5, 5, 0, 0, 0, 0, 0, { lowBelow: 3 }],
    ['Saline 1000 ml', 'Supply', 'bags', 800, 750, 0, 0, 0, 50, 0, { lowBelow: 300, note: '50 in transit to Ekhaga vårdhubb (req-4)' }],
    ['Morphine 10 mg', 'Supply', 'ampoules', 140, 140, 0, 0, 0, 0, 0, { lowBelow: 150, criticalBelow: 60 }],
    ['Tourniquet', 'Supply', 'units', 35, 35, 0, 0, 0, 0, 0, { lowBelow: 50 }],
    ['Protective equipment set', 'Supply', 'sets', 2400, 2400, 0, 0, 0, 0, 0, { lowBelow: 800 }],
  ]),
  ...rows('sjoberga', 'Logistics', '14:30', [
    ['Ventilator', 'Equipment', 'units', 10, 2, 8, 0, 0, 0, 0],
    ['Ambulance', 'Transport', 'vehicles', 3, 1, 2, 0, 0, 0, 0],
  ]),
  ...rows('ekhaga', 'Manual', '14:10', [
    ['Patient monitor', 'Equipment', 'units', 12, 4, 8, 0, 0, 0, 0],
    ['Oxygen concentrator', 'Equipment', 'units', 6, 2, 4, 0, 0, 0, 0],
    ['Ventilator', 'Equipment', 'units', 0, 0, 0, 0, 0, 0, 0],
  ]),
  ...rows('falt-alfa', 'Manual', '13:55', [
    ['Field bed', 'Equipment', 'units', 30, 12, 0, 0, 0, 0, 18, { note: '18 not yet assembled' }],
    ['Ventilator', 'Equipment', 'units', 2, 0, 0, 0, 0, 2, 0],
    ['Generator', 'Equipment', 'units', 2, 2, 0, 0, 0, 0, 0],
  ]),
];

// ---------------------------------------------------------------------------
// § 5.6 Resource requests
export const REQUESTS: ResourceRequest[] = [
  {
    id: 'req-1',
    resourceName: 'Ventilator',
    quantity: 2,
    unit: 'units',
    toNodeId: 'ekhaga',
    priority: 'High',
    status: 'Requested',
    requestedBy: 'Mats Öberg',
    requestedAt: '13:52',
    note: 'Three patients on the way who may need respiratory support',
  },
  {
    id: 'req-2',
    resourceName: 'Oxygen concentrator',
    quantity: 10,
    unit: 'units',
    fromNodeId: 'vikby',
    toNodeId: 'falt-alfa',
    priority: 'Normal',
    status: 'Accepted',
    requestedBy: 'Jonas Vik',
    requestedAt: '14:05',
  },
  {
    id: 'req-3',
    resourceName: 'Mobile care team',
    quantity: 1,
    unit: 'teams',
    fromNodeId: 'vikby',
    toNodeId: 'falt-alfa',
    priority: 'High',
    status: 'Dispatched',
    requestedBy: 'Jonas Vik',
    requestedAt: '14:07',
    eta: '15:10',
    note: '1 doctor + 2 nurses',
  },
  {
    id: 'req-4',
    resourceName: 'Saline 1000 ml',
    quantity: 50,
    unit: 'bags',
    fromNodeId: 'vikby',
    toNodeId: 'ekhaga',
    priority: 'Normal',
    status: 'Dispatched',
    requestedBy: 'Mats Öberg',
    requestedAt: '13:30',
    eta: '14:50',
  },
  {
    id: 'req-5',
    resourceName: 'Wheelchair',
    quantity: 4,
    unit: 'units',
    fromNodeId: 'vikby',
    toNodeId: 'vikby',
    priority: 'Normal',
    status: 'Received',
    requestedBy: 'Peter Nord',
    requestedAt: '13:10',
    note: 'To the emergency department triage',
  },
];

// ---------------------------------------------------------------------------
// § 5.7 Patients (generated once, committed as a literal)
export { PATIENTS };
export const INITIAL_PATIENTS: Patient[] = PATIENTS;

// ---------------------------------------------------------------------------
// § 5.8 Playbooks
const SMALL_PLAYBOOK_TASKS: Playbook['tasks'] = [
  { area: 'Incident command', title: 'Confirm activation with regional command', ownerRole: 'Incident commander', dueOffsetMin: 10 },
  { area: 'Incident command', title: 'Brief the incident team', ownerRole: 'Incident commander', dueOffsetMin: 15 },
  { area: 'Incident command', title: 'Review capacity targets', ownerRole: 'Medical lead', dueOffsetMin: 30 },
];

function smallPlaybook(id: string, name: string, trigger: string, summary: string, level: Playbook['level'], targetBeds: number, withinMin: number): Playbook {
  return {
    id,
    name,
    level,
    trigger,
    summary,
    roles: ['Incident commander', 'Medical lead', 'Logistics lead'],
    channels: ['Incident command'],
    targets: [{ label: 'Acute beds freed', target: targetBeds, unit: 'beds', withinMin, measure: 'acuteBedsFreed' }],
    tasks: SMALL_PLAYBOOK_TASKS,
  };
}

export const PLAYBOOKS: Playbook[] = [
  smallPlaybook('mc-1', 'Mass casualty – Level 1', '20–40 casualties', 'Opens incident command and prepares surgical capacity and acute beds for a limited influx of casualties.', 1, 10, 120),
  {
    id: 'mc-2',
    name: 'Mass casualty – Level 2',
    level: 2,
    trigger: '40–100 casualties expected within two hours',
    summary: 'Opens incident command, releases surgical and intensive care capacity, starts transfers to network nodes and secures supplies and transport.',
    roles: ['Incident commander', 'Medical lead', 'Surgery lead', 'Intensive care lead', 'Logistics lead', 'Communications lead'],
    channels: ['Incident command', 'Emergency department', 'Surgery and intensive care', 'Logistics and transport'],
    targets: [
      { label: 'Emergency department triage capacity', target: 40, unit: 'patients', withinMin: 30, measure: 'edTriage' },
      { label: 'Operating theatres available', target: 6, unit: 'theatres', withinMin: 60, measure: 'theatresAvailable' },
      { label: 'Intensive care beds added', target: 2, unit: 'beds', withinMin: 120, measure: 'icuFreed' },
      { label: 'Acute beds freed', target: 30, unit: 'beds', withinMin: 240, measure: 'acuteBedsFreed' },
    ],
    tasks: [
      { area: 'Emergency department', title: 'Set up triage zones', ownerRole: 'Medical lead', dueOffsetMin: 15 },
      { area: 'Emergency department', title: 'Fast-track current patients out of the waiting room', ownerRole: 'Medical lead', dueOffsetMin: 20 },
      { area: 'Emergency department', title: 'Open second resuscitation bay', ownerRole: 'Intensive care lead', dueOffsetMin: 30 },
      { area: 'Surgery and intensive care', title: 'Stop elective surgery and release theatres', ownerRole: 'Surgery lead', dueOffsetMin: 30 },
      { area: 'Surgery and intensive care', title: 'Call in off-duty anaesthesia teams', ownerRole: 'Surgery lead', dueOffsetMin: 45 },
      { area: 'Surgery and intensive care', title: 'Convert post-operative unit to intensive care overflow', ownerRole: 'Intensive care lead', dueOffsetMin: 90 },
      { area: 'Wards', title: 'Identify patients for early discharge', ownerRole: 'Medical lead', dueOffsetMin: 45 },
      { area: 'Wards', title: 'Start transfer planning to network nodes', ownerRole: 'Medical lead', dueOffsetMin: 60 },
      { area: 'Wards', title: 'Prepare 30 acute beds', ownerRole: 'Medical lead', dueOffsetMin: 240 },
      { area: 'Logistics and transport', title: 'Request additional ventilators for Ekhaga vårdhubb', ownerRole: 'Logistics lead', dueOffsetMin: 30 },
      { area: 'Logistics and transport', title: 'Activate Fältsjukhus Alfa', ownerRole: 'Logistics lead', dueOffsetMin: 60 },
      { area: 'Logistics and transport', title: 'Assemble transport pool', ownerRole: 'Logistics lead', dueOffsetMin: 45 },
      { area: 'Logistics and transport', title: 'Check blood products and oxygen supply', ownerRole: 'Logistics lead', dueOffsetMin: 30 },
      { area: 'Communication', title: 'Notify regional command and neighbouring hospitals', ownerRole: 'Communications lead', dueOffsetMin: 10 },
      { area: 'Communication', title: 'Open incident channels and start staff call-in', ownerRole: 'Communications lead', dueOffsetMin: 15 },
    ],
  },
  smallPlaybook('mc-3', 'Mass casualty – Level 3', 'more than 100 casualties', 'Opens full incident command, clears all elective activity and mobilises every network node and the regional transport pool.', 3, 50, 240),
  {
    id: 'it-outage',
    name: 'IT outage – operational mirror',
    trigger: 'EHR or hospital network unavailable',
    summary: 'Switches the hospital to the operational mirror so that patients, placements, plans and capacity can keep being managed while the EHR is down.',
    setsEhrOutage: true,
    roles: ['Incident commander', 'IT liaison', 'Ward runners lead'],
    channels: ['Incident command', 'IT and wards'],
    targets: [{ label: 'Wards confirmed on mirror', target: 4, unit: 'wards', withinMin: 30, measure: 'wardsOnMirror' }],
    tasks: [
      { area: 'IT', title: 'Confirm scope of the outage with IT', ownerRole: 'IT liaison', dueOffsetMin: 10 },
      { area: 'Wards', title: 'Switch to operational mirror on all wards', ownerRole: 'Ward runners lead', dueOffsetMin: 30 },
      { area: 'Wards', title: 'Appoint ward runners for paper orders', ownerRole: 'Ward runners lead', dueOffsetMin: 20 },
      { area: 'Wards', title: 'Freeze non-urgent transfers', ownerRole: 'Incident commander', dueOffsetMin: 15 },
      { area: 'Wards', title: 'Verify critical medication lists against last mirror sync', ownerRole: 'Ward runners lead', dueOffsetMin: 45 },
      { area: 'IT', title: 'Prepare resynchronisation checklist', ownerRole: 'IT liaison', dueOffsetMin: 60 },
    ],
  },
  smallPlaybook('evac-partial', 'Hospital evacuation – partial', 'part of the hospital must be emptied', 'Opens incident command and moves patients from the affected part of the hospital to other wards and network nodes.', undefined, 10, 120),
  smallPlaybook('regional-surge', 'Regional surge support', 'another hospital in the region requests support', 'Opens incident command and frees acute beds and transport so that patients from the requesting hospital can be received.', undefined, 10, 120),
];

// ---------------------------------------------------------------------------
// § 5.9 Messages from nodes
export const MESSAGES_FROM_NODES: Message[] = [
  { id: 'msg-1', author: 'Mats Öberg', role: 'Care hub lead', nodeId: 'ekhaga', at: '13:52', text: 'Behöver två ventilatorer till Ekhaga, har tre patienter på väg som kan behöva andningsstöd.' },
  { id: 'msg-2', author: 'Jonas Vik', role: 'Field hospital lead', nodeId: 'falt-alfa', at: '14:05', text: 'Vi har 12 sängar uppe. Saknar syrgas – tio koncentratorer räcker för kvällen.' },
  { id: 'msg-3', author: 'Peter Nord', role: 'Head nurse, emergency department', nodeId: 'vikby', at: '14:20', text: 'Akuten behöver fyra rullstolar och två bårar till triagen.' },
];

// ---------------------------------------------------------------------------
// § 5.10 Initial audit log
export const INITIAL_LOG: AuditEntry[] = [
  { id: 'log-1', at: '13:10', actor: 'Peter Nord', action: 'Requested', object: 'Wheelchair × 4', detail: 'To Vikby sjukhus, emergency department', ref: 'req-5' },
  { id: 'log-2', at: '13:30', actor: 'Mats Öberg', action: 'Requested', object: 'Saline 1000 ml × 50', detail: 'To Ekhaga vårdhubb', ref: 'req-4' },
  { id: 'log-3', at: '13:52', actor: 'Mats Öberg', action: 'Requested', object: 'Ventilator × 2', detail: 'To Ekhaga vårdhubb', ref: 'req-1' },
  { id: 'log-4', at: '14:05', actor: 'Jonas Vik', action: 'Requested', object: 'Oxygen concentrator × 10', detail: 'To Fältsjukhus Alfa', ref: 'req-2' },
  { id: 'log-5', at: '14:20', actor: 'System', action: 'Marked out of service', object: 'CT2', detail: 'Reported by RIS' },
  { id: 'log-6', at: '14:37', actor: 'System', action: 'Sync completed', object: 'EHR', detail: 'Vikby sjukhus' },
];

// ---------------------------------------------------------------------------
// § 6.5 Preset sites for standing up nodes
export const SITES: Site[] = [
  { name: 'Vikby idrottshall', place: 'Sollentuna', lat: 59.432, lng: 17.96 },
  { name: 'Ekebo skola', place: 'Upplands Väsby', lat: 59.5186, lng: 17.911 },
  { name: 'Mälarhallen', place: 'Sigtuna', lat: 59.6173, lng: 17.7234 },
  { name: 'Kista terminal', place: 'Kista', lat: 59.405, lng: 17.94 },
  { name: 'Rosersbergs kaserner', place: 'Rosersberg', lat: 59.58, lng: 17.87 },
];
