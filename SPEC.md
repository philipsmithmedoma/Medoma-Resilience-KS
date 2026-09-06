# SPEC.md – Medoma Resilient Operations prototype

This document defines everything the prototype contains. Labels in `code` or quotes are the exact UI strings. Numbers are the exact mock values. Read CLAUDE.md for rules and DESIGN.md for appearance.

## 0. Purpose and story

The presenter opens the app on the **Command Center** for the fictional hospital *Vikby sjukhus* on Friday 4 September 2026 at 14:40. The hospital is running normally but tight: surgery is limited by post-operative beds, one CT scanner is down, and ambulances are scarce. The presenter then activates the playbook **Mass casualty – Level 2**, which turns on incident mode, creates roles, tasks, channels and capacity targets, and drives the story through:

1. **Command Center** – capacity now, bottlenecks, what limits what, and what would unlock more.
2. **Incident** – an executable playbook instead of a PDF: roles, tasks, channels, targets, an append-only log.
3. **Evacuation** – freeing acute beds by moving patients to other nodes, with system suggestions that a human authorises.
4. **Resources** – a message becomes a structured request that moves requested → received.
5. **Network** – the hospital as a network of nodes, standing up a new node, and what each node shares.

A second, shorter story: the presenter turns on **Simulate EHR outage** in the demo controls (or activates the *IT outage* playbook) and the Command Center keeps working on the operational mirror, showing estimated figures and their age instead of failing.

Everything is mock. Nothing is persisted. The demo clock is fixed at 14:40 and advances one minute per user action so the log stays readable.

## 1. Stack

- Vite + React 18 + TypeScript (strict).
- Tailwind CSS with shadcn/ui (initialise with the shadcn CLI; use whichever Tailwind version it installs). Components used: button, dialog, sheet, dropdown-menu, select, tabs, table, input, textarea, checkbox, switch, tooltip, popover, progress, toast (sonner or the shadcn toast).
- `lucide-react` for icons.
- `react-router-dom` with **HashRouter** (so GitHub Pages refreshes work without server config).
- `zustand` for in-memory state.
- `react-leaflet` + `leaflet` with OpenStreetMap standard tiles.
- `@fontsource-variable/inter`.
- `vitest` for unit tests of `src/lib/`.
- Deployment: GitHub Actions workflow `.github/workflows/deploy.yml` that builds on push to `main` and deploys to GitHub Pages (the `actions/deploy-pages` flow). Set Vite `base` to `'/<repository-name>/'` read from the `GITHUB_REPOSITORY` environment variable at build time, falling back to `'/'` locally.
- `README.md`: one paragraph on what this is, how to run (`npm install`, `npm run dev`), how to run tests, and where the deployed URL is once Pages is enabled.

No other runtime dependencies without a DECISIONS.md entry.

## 2. App shell

### 2.1 Navigation

Modules in order, left to right: `Patients`, `Activities`, `Planning`, `Employees`, `Reporting` (existing, rendered as stubs, § 8), divider, `Command Center`, `Incident`, `Evacuation`, `Resources`, `Network`.

Routes (hash-based):

| Route | Module |
|---|---|
| `/` | redirects to `/command-center` |
| `/patients`, `/activities`, `/planning`, `/employees`, `/reporting` | existing-module stubs |
| `/command-center` | Command Center |
| `/incident` | Incident (state decides whether the playbook list or the active incident is shown) |
| `/incident/channels/:channelId` | Channel thread |
| `/evacuation` | Evacuation |
| `/resources` | Resources, default tab Requests |
| `/resources/inventory`, `/resources/from-message` | Resources tabs |
| `/network` | Network |
| `/network/:nodeId` | Node detail |

Every route renders something meaningful. There are no dead links or buttons anywhere: every clickable element changes state, navigates, or opens a dialog/drawer/popover.

### 2.2 Scope selector

The scope name at the top-left (where the platform shows "Sollentuna") is a dropdown listing `Region Nord` followed by every node (§ 5.2), including nodes stood up during the session. Default scope: **Vikby sjukhus**.

Scope affects: Command Center (node view vs region view), Resources → Inventory (filtered to scope; region = all). Scope does not affect Incident, Evacuation (always planned from Vikby sjukhus), Requests or Network.

### 2.3 Current user

`Eva Lind`, initials `EL`, role `Operations manager`. All actions in the app are attributed to her in the audit log.

### 2.4 Demo controls

A secondary button `Demo` in the nav's right cluster opens a popover:

- Switch `Simulate EHR outage` – see § 7.2.
- Button `Reset demo data` – restores the initial dataset, clears the incident, resets the clock to 14:40, then shows toast "Demo data reset".
- Text: "Demo clock: {HH:MM}, Friday 4 September 2026. Advances one minute per action."

### 2.5 Incident banner

Shown under the nav whenever an incident is active (§ 6.2). `Open incident` navigates to `/incident`; `Close incident` opens the close dialog (§ 6.2.5).

## 3. Domain model (`src/data/types.ts`)

```ts
type NodeId = 'region' | 'vikby' | 'sjoberga' | 'ekhaga' | 'falt-alfa' | 'hemsjukvard' | string; // string for stood-up nodes: 'node-<n>'
type NodeType = 'Hospital' | 'Care hub' | 'Field hospital' | 'Home care';
type NodeStatus = 'Operational' | 'Degraded' | 'Standing up' | 'Offline';
type SharingLevel = 'Full' | 'Capacity only' | 'None';
type Source = 'EHR' | 'HR' | 'RIS' | 'OR planning' | 'Logistics' | 'Manual' | 'Medoma' | 'Mirror';
type SyncState = 'Synced' | 'Delayed' | 'Manual' | 'Offline';

interface Figure { value: number; verified: number; estimated: number; source: Source; lastConfirmed: string /* 'HH:MM' */; }

interface CareNode {
  id: NodeId; name: string; type: NodeType; status: NodeStatus; lead: string;
  place: string; lat: number; lng: number; sharing: SharingLevel; sync: SyncState; lastSync: string;
  acuteBeds?: { total: number; free: Figure };        // hospitals, hubs, field hospitals
  homeCarePlaces?: { total: number; free: Figure };  // home care
  intensiveCare?: { physical: number; usable: number; free: Figure };
  staffOnDuty: Figure;
  plannedBeds?: number;                                // Standing up nodes
  accepts: Array<'Ward' | 'Monitored' | 'Intensive' | 'Home'>; // care levels the node can receive
}

interface Component { name: string; total: number; available: number; }
interface Capability { id: string; nodeId: NodeId; name: string; unit: string; components: Component[]; ladder?: Array<{ label: string; value: number }>; }
// capacity = min(available); limiting = every component whose available equals the minimum;
// next = the smallest available strictly greater than the minimum (undefined if none).

interface Bottleneck { rank: number; nodeId: NodeId; capacity: string; limitingResource: string; impact: string; wouldUnlock: string; }

type ResourceCategory = 'Equipment' | 'Transport' | 'Team' | 'Supply';
interface Resource {
  id: string; nodeId: NodeId; name: string; category: ResourceCategory; unit: string;
  total: number; available: number; inUse: number; reserved: number; outOfService: number; inTransit: number; unknown: number;
  criticalBelow?: number; lowBelow?: number; note?: string; source: Source; lastConfirmed: string;
}
// Supply status: Critical if available < criticalBelow, Low if available < lowBelow, else Ok.

type Stability = 'Stable' | 'Monitor' | 'Critical';
type CareLevel = 'Ward' | 'Monitored' | 'Intensive';
type TransportNeed = 'Walking' | 'Wheelchair' | 'Stretcher' | 'Ambulance' | 'Intensive care transport';
type Equipment = 'Oxygen' | 'IV infusion' | 'Monitoring';
type MoveStatus = 'Planned' | 'Accepted' | 'Transport assigned' | 'Departed' | 'Arrived' | 'Handed over';
interface MovePlan { destinationId: NodeId; transportId?: string /* set at the "Transport assigned" step */; status: MoveStatus; suggested: boolean; }
interface Patient {
  id: string; familyName: string; givenName: string; pin: string; age: number; ward: string; nodeId: 'vikby';
  stability: Stability; careLevel: CareLevel; transport: TransportNeed; equipment: Equipment[]; homeCareEligible: boolean;
  move?: MovePlan;
}

type Priority = 'Low' | 'Normal' | 'High' | 'Critical';
type RequestStatus = 'Requested' | 'Accepted' | 'Allocated' | 'Dispatched' | 'Received' | 'Rejected';
interface ResourceRequest {
  id: string; resourceName: string; quantity: number; unit: string; fromNodeId?: NodeId; toNodeId: NodeId;
  priority: Priority; status: RequestStatus; requestedBy: string; requestedAt: string; eta?: string; note?: string;
}

interface PlaybookTask { title: string; area: string; ownerRole: string; dueOffsetMin: number; }
interface Playbook {
  id: string; name: string; level?: 1 | 2 | 3; trigger: string; summary: string;
  roles: string[]; tasks: PlaybookTask[]; channels: string[];
  targets: Array<{ label: string; target: number; unit: string; withinMin: number; measure: TargetMeasure }>;
  setsEhrOutage?: boolean;
}
type TargetMeasure = 'edTriage' | 'theatresAvailable' | 'icuFreed' | 'acuteBedsFreed' | 'wardsOnMirror';

type TaskStatus = 'Not started' | 'In progress' | 'Done';
interface IncidentTask extends PlaybookTask { id: string; status: TaskStatus; due: string; owner?: string; }
interface Channel { id: string; name: string; memberRoles: string[]; messages: Message[]; }
interface Message { id: string; author: string; role: string; at: string; text: string; nodeId?: NodeId; }
interface Incident {
  playbookId: string; name: string; level?: number; activatedAt: string; activatedBy: string; commander: string;
  roles: Record<string, string | undefined>; tasks: IncidentTask[]; channels: Channel[]; note?: string;
  targets: Array<{ label: string; target: number; unit: string; dueAt: string; measure: TargetMeasure }>;
}

interface AuditEntry { id: string; at: string; actor: string; action: string; object: string; detail?: string; }
interface Staff { name: string; title: string; profession: 'Doc' | 'Nrs' | 'AsPr' | 'Supp'; nodeId: NodeId; }
```

Target measures are computed from state: `edTriage` = 40 when the task "Set up triage zones" is Done, else 31; `theatresAvailable` = capacity of *Emergency surgery* + 4 when "Stop elective surgery and release theatres" is Done, else its plain capacity; `icuFreed` = 2 when "Convert post-operative unit to intensive care overflow" is Done, else 0 (what-if values in the Command Center never feed a target); `acuteBedsFreed` = number of patients with move status Departed, Arrived or Handed over; `wardsOnMirror` = 4 when "Switch to operational mirror on all wards" is Done, else 0. Show `current / target` with a progress bar.

## 4. Store (`src/data/store.ts`)

One zustand store holding: `scope`, `clock` (minutes since 00:00; initial 14:40), `ehrOutage`, `nodes`, `capabilities`, `bottlenecks`, `resources`, `patients`, `requests`, `playbooks`, `incident | null`, `closedIncidents`, `log`, `staff`, `messagesFromNodes` (§ 6.4.3), `whatIf` (§ 6.1.3), and actions for every behaviour below. Every state-changing action calls `logEntry(action, object, detail)` which appends an `AuditEntry` with actor "Eva Lind" (or the system actor "System" for automatic effects such as playbook expansion) and then advances the clock by one minute. `reset()` rebuilds everything from `mock.ts`.

## 5. Mock dataset (`src/data/mock.ts`)

All names and places are fictional or generic. Coordinates are approximate town centres north of Stockholm and may be adjusted.

### 5.1 Staff (assignable to incident roles; also authors of messages)

| Name | Title | Profession | Node |
|---|---|---|---|
| Eva Lind | Operations manager | Supp | vikby |
| Johan Ek | Chief surgeon | Doc | vikby |
| Maria Holm | Intensive care lead | Doc | vikby |
| Omar Haddad | Anaesthesiologist | Doc | vikby |
| Peter Nord | Head nurse, emergency department | Nrs | vikby |
| Sara Lund | Nurse | Nrs | vikby |
| Karin Sjö | Logistics coordinator | Supp | vikby |
| Erik Falk | Ambulance coordinator | Supp | vikby |
| Lena Åkesson | Communications officer | Supp | vikby |
| Helena Berg | Chief physician | Doc | sjoberga |
| Mats Öberg | Care hub lead | Nrs | ekhaga |
| Jonas Vik | Field hospital lead | Doc | falt-alfa |
| Anna Ek | Home care lead | Nrs | hemsjukvard |

### 5.2 Nodes

| id | name | type | status | lead | place (lat, lng) | sharing | sync, last | acute beds total / free | intensive care physical / usable / free | staff on duty | accepts |
|---|---|---|---|---|---|---|---|---|---|---|---|
| vikby | Vikby sjukhus | Hospital | Operational | Eva Lind | Sollentuna (59.4286, 17.9509) | Full | Synced 14:37 | 320 / 16 (14 verified + 2 estimated, EHR 14:32) | 24 / 14 / 3 (verified, EHR 14:35) | 253 (HR 14:00) | Ward, Monitored, Intensive |
| sjoberga | Sjöberga sjukhus | Hospital | Operational | Helena Berg | Märsta (59.6206, 17.8555) | Capacity only | Synced 14:30 | 180 / 12 (EHR 14:30) | 8 / 8 / 2 (EHR 14:30) | 140 (HR 13:00) – hidden, see sharing | Ward, Monitored, Intensive |
| ekhaga | Ekhaga vårdhubb | Care hub | Operational | Mats Öberg | Kista (59.4033, 17.9424) | Full | Manual 14:10 | 20 / 14 (Manual 14:10); plannedBeds 40 | – | 12 (Manual 14:10) | Ward, Monitored |
| falt-alfa | Fältsjukhus Alfa | Field hospital | Standing up | Jonas Vik | Rosersberg (59.5836, 17.8757) | Full | Manual 13:55 | 12 / 12 (all estimated, Manual 13:55); plannedBeds 30 | – | 9 (Manual 13:55) | Ward |
| hemsjukvard | Hemsjukvård Sollentuna | Home care | Operational | Anna Ek | Sollentuna (59.4300, 17.9450) | Full | Synced 14:37 (Medoma) | home care places 30 / 8 (Medoma 14:37) | – | 22 (Medoma 14:37) | Home |

`Region Nord` is the aggregate of all nodes whose sharing is not `None`. For a node with sharing `Capacity only`, staff figures show as the grey chip "Not shared". A sync older than 30 minutes relative to the clock is displayed as `Delayed` (this makes falt-alfa and ekhaga Delayed at 14:40 and 14:41 respectively; recompute as the clock advances).

### 5.3 Capabilities (Vikby unless stated)

Emergency surgery (unit: "surgeries possible now"):

| Component | Total | Available |
|---|---|---|
| Operating theatres | 8 | 6 |
| Surgeons on site | 7 | 5 |
| Anaesthesia teams | 6 | 4 |
| Instrument sets | 10 | 9 |
| Post-operative beds | 12 | 2 |

Ladder: Theatres 8 → Staffed 6 → Post-operative capacity 2. Note: "Intensive care follows its own capability."

Intensive care (unit: "beds available"):

| Component | Total | Available |
|---|---|---|
| Physical beds | 24 | 10 |
| Staffed bed slots | 18 | 4 |
| Equipped bed slots (ventilator, monitoring) | 16 | 3 |
| Medication and material covered | 14 | 3 |

Ladder: Physical 24 → Staffable 18 → Equipped 16 → Usable 14.

CT imaging (unit: "scanners in operation"):

| Component | Total | Available |
|---|---|---|
| CT scanners | 2 | 1 |
| Radiographers | 3 | 2 |
| Radiologists | 2 | 2 |
| Porters for imaging transport | 2 | 2 |

Note on the capability: "CT2 out of service since 14:20 (RIS). Repair ETA 17:00. 9 patients waiting, median wait 95 min."

Acute beds (unit: "beds available"):

| Component | Total | Available |
|---|---|---|
| Physical beds | 320 | 22 |
| Staffed beds | 302 | 16 |

Note: "Could be freed: 18 discharge-ready patients, 40 patients eligible for transfer (see Evacuation)."

Sjöberga: Acute beds Physical 180/12, Staffed 172/12; Intensive care Physical 8/2, Staffed 8/2. Ekhaga: Beds 20/14, Patient monitors 12/4 (limits Monitored intake to 4). Fältsjukhus Alfa: Field beds assembled 12/12, Staffed 12/12 (estimated).

### 5.4 Bottlenecks (ranked; vikby unless stated)

| Rank | Capacity | Limiting resource | Impact | Would unlock |
|---|---|---|---|---|
| 1 | Emergency surgery | Post-operative beds (2 of 12 available) | 2 surgeries possible now, 6 theatres ready | +2 post-operative beds → +2 surgeries; then anaesthesia teams limit at 4 |
| 2 | CT imaging | CT2 out of service (1 of 2 scanners) | 9 patients waiting, median wait 95 min | Repair ETA 17:00, or transfer 4 patients to Sjöberga sjukhus |
| 3 | Intensive care | Equipped and staffed slots (3 of 14 usable beds free) | Next two admissions fill intensive care | +2 intensive care nurses per shift → +2 beds |
| 4 | Patient transport | Ambulances (2 of 6 available) | Evacuation throughput about 4 patients per hour | Add bus and 2 transport vehicles → about 12 per hour |
| 5 (ekhaga) | Monitored intake | Patient monitors (4 of 12 available) | Only 4 monitored patients can be received | 8 monitors from Vikby sjukhus → 12 |
| 6 (falt-alfa) | Field beds | Staff (9 on site) | 12 of 30 planned beds open | Mobile team of 1 doctor + 2 nurses → 24 beds |

### 5.5 Resources

Vikby sjukhus (source Logistics 14:15 unless stated):

| Name | Category | Unit | Total | Available | In use | Reserved | Out of service | In transit | Unknown | Thresholds / note |
|---|---|---|---|---|---|---|---|---|---|---|
| Ventilator | Equipment | units | 30 | 4 | 24 | 0 | 2 | 0 | 0 | |
| Infusion pump | Equipment | units | 210 | 26 | 180 | 0 | 4 | 0 | 0 | |
| Patient monitor | Equipment | units | 45 | 7 | 38 | 0 | 0 | 0 | 0 | |
| Oxygen concentrator | Equipment | units | 20 | 8 | 12 | 0 | 0 | 0 | 0 | |
| Defibrillator | Equipment | units | 22 | 2 | 20 | 0 | 0 | 0 | 0 | |
| Portable ultrasound | Equipment | units | 6 | 2 | 4 | 0 | 0 | 0 | 0 | |
| Wheelchair | Equipment | units | 60 | 8 | 52 | 0 | 0 | 0 | 0 | |
| Stretcher | Equipment | units | 25 | 7 | 18 | 0 | 0 | 0 | 0 | |
| Ambulance | Transport | vehicles | 6 | 2 | 4 | 0 | 0 | 0 | 0 | |
| Patient transport vehicle | Transport | vehicles | 5 | 3 | 2 | 0 | 0 | 0 | 0 | capacity 2 seated |
| Medical bus | Transport | vehicles | 1 | 1 | 0 | 0 | 0 | 0 | 0 | capacity 12 seated |
| Taxi contract | Transport | vehicles | 4 | 4 | 0 | 0 | 0 | 0 | 0 | capacity 1 seated |
| Helicopter | Transport | vehicles | 1 | 0 | 0 | 0 | 0 | 0 | 1 | regional resource, status unknown |
| Mobile care team | Team | teams | 3 | 2 | 0 | 0 | 0 | 1 | 0 | 1 in transit to Fältsjukhus Alfa |
| Oxygen cylinder | Supply | cylinders | 120 | 120 | 0 | 0 | 0 | 0 | 0 | lowBelow 60; note "about 48 h at current use" |
| Blood products O-negative | Supply | units | 18 | 18 | 0 | 0 | 0 | 0 | 0 | criticalBelow 20, lowBelow 40 |
| Antibiotics IV, broad spectrum | Supply | days of use | 5 | 5 | 0 | 0 | 0 | 0 | 0 | lowBelow 3 |
| Saline 1000 ml | Supply | bags | 800 | 750 | 0 | 0 | 0 | 50 | 0 | lowBelow 300; 50 in transit to Ekhaga vårdhubb (req-4) |
| Morphine 10 mg | Supply | ampoules | 140 | 140 | 0 | 0 | 0 | 0 | 0 | lowBelow 150, criticalBelow 60 |
| Tourniquet | Supply | units | 35 | 35 | 0 | 0 | 0 | 0 | 0 | lowBelow 50 |
| Protective equipment set | Supply | sets | 2400 | 2400 | 0 | 0 | 0 | 0 | 0 | lowBelow 800 |

Other nodes:

| Node | Name | Category | Unit | Total | Available | In use | Reserved | Out of service | In transit | Unknown | Source, last |
|---|---|---|---|---|---|---|---|---|---|---|---|
| sjoberga | Ventilator | Equipment | units | 10 | 2 | 8 | 0 | 0 | 0 | 0 | Logistics 14:30 |
| sjoberga | Ambulance | Transport | vehicles | 3 | 1 | 2 | 0 | 0 | 0 | 0 | Logistics 14:30 |
| ekhaga | Patient monitor | Equipment | units | 12 | 4 | 8 | 0 | 0 | 0 | 0 | Manual 14:10 |
| ekhaga | Oxygen concentrator | Equipment | units | 6 | 2 | 4 | 0 | 0 | 0 | 0 | Manual 14:10 |
| ekhaga | Ventilator | Equipment | units | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Manual 14:10 |
| falt-alfa | Field bed | Equipment | units | 30 | 12 | 0 | 0 | 0 | 0 | 18 | Manual 13:55; "18 not yet assembled" |
| falt-alfa | Ventilator | Equipment | units | 2 | 0 | 0 | 0 | 0 | 2 | 0 | Manual 13:55 |
| falt-alfa | Generator | Equipment | units | 2 | 2 | 0 | 0 | 0 | 0 | 0 | Manual 13:55 |

Unit-in-transit and unknown counts are shown in their own columns – nothing is silently dropped.

### 5.6 Resource requests (initial)

| id | Resource | Qty | From | To | Priority | Status | Requested by | At | Note / ETA |
|---|---|---|---|---|---|---|---|---|---|
| req-1 | Ventilator | 2 | – | ekhaga | High | Requested | Mats Öberg | 13:52 | "Three patients on the way who may need respiratory support" |
| req-2 | Oxygen concentrator | 10 | vikby | falt-alfa | Normal | Accepted | Jonas Vik | 14:05 | |
| req-3 | Mobile care team | 1 | vikby | falt-alfa | High | Dispatched | Jonas Vik | 14:07 | ETA 15:10; "1 doctor + 2 nurses" |
| req-4 | Saline 1000 ml | 50 | vikby | ekhaga | Normal | Dispatched | Mats Öberg | 13:30 | ETA 14:50 |
| req-5 | Wheelchair | 4 | vikby | vikby | Normal | Received | Peter Nord | 13:10 | "To the emergency department triage" |

### 5.7 Patients (40 inpatients at Vikby sjukhus, candidates for transfer)

Generate the list once with a script (seeded, deterministic) and commit it as a literal array – the dataset must be identical on every load. Constraints:

- Wards: `Medicin A` 12, `Medicin B` 10, `Kirurgi` 10, `Ortopedi` 8.
- Stability: 22 Stable, 12 Monitor, 6 Critical. Care level follows stability: Stable → Ward, Monitor → Monitored, Critical → Intensive.
- Transport need: 14 Walking, 10 Wheelchair, 12 Stretcher, 2 Ambulance, 2 Intensive care transport. Critical patients get Ambulance or Intensive care transport; Walking only for Stable.
- Equipment: 18 none, 10 Oxygen, 8 IV infusion, 6 Monitoring (assign so that every Critical patient has Monitoring and no Stable patient has more than one item).
- `homeCareEligible`: exactly 12, all Stable, all Walking or Wheelchair.
- Ages 24–91. `pin` is `YYYYMMDD-XXXX` built from a birth date consistent with the age and a fictional four-digit suffix; do not attempt a valid checksum.
- Family names, cycle through: Andersson, Bergström, Carlsson, Dahl, Ekström, Forsberg, Gustafsson, Hedlund, Isaksson, Jonsson, Karlsson, Lindqvist, Magnusson, Nyström, Olofsson, Persson, Qvist, Rosén, Sandberg, Törnqvist, Ullman, Vikström, Wallin, Åberg, Öhman, Blomkvist, Cederholm, Engström, Fransson, Grahn, Hallberg, Ivarsson, Järvinen, Klingberg, Lundmark, Molin, Norén, Odén, Palm, Runesson.
- Given names, cycle through: Anna, Björn, Cecilia, David, Elin, Fredrik, Gunilla, Hans, Ingrid, Johan, Karin, Lars, Maria, Nils, Olivia, Per, Rebecka, Stefan, Tove, Ulf, Vera, William, Ylva, Åsa, Örjan, Birgitta, Christer, Daniel, Eva, Filip, Gustav, Helena, Isak, Jenny, Klara, Leif, Monika, Noah, Oskar, Pia.

Names are displayed as `Family name, Given name` as in the platform.

### 5.8 Playbooks

**Mass casualty – Level 2** (`mc-2`, level 2). Trigger: "40–100 casualties expected within two hours". Summary: "Opens incident command, releases surgical and intensive care capacity, starts transfers to network nodes and secures supplies and transport." Roles: Incident commander, Medical lead, Surgery lead, Intensive care lead, Logistics lead, Communications lead. Channels: Incident command, Emergency department, Surgery and intensive care, Logistics and transport.

Targets:

| Label | Target | Unit | Within | Measure |
|---|---|---|---|---|
| Emergency department triage capacity | 40 | patients | 30 min | edTriage |
| Operating theatres available | 6 | theatres | 60 min | theatresAvailable |
| Intensive care beds added | 2 | beds | 120 min | icuFreed |
| Acute beds freed | 30 | beds | 240 min | acuteBedsFreed |

Tasks (area, title, owner role, due offset):

| Area | Title | Owner role | Due |
|---|---|---|---|
| Emergency department | Set up triage zones | Medical lead | +15 |
| Emergency department | Fast-track current patients out of the waiting room | Medical lead | +20 |
| Emergency department | Open second resuscitation bay | Intensive care lead | +30 |
| Surgery and intensive care | Stop elective surgery and release theatres | Surgery lead | +30 |
| Surgery and intensive care | Call in off-duty anaesthesia teams | Surgery lead | +45 |
| Surgery and intensive care | Convert post-operative unit to intensive care overflow | Intensive care lead | +90 |
| Wards | Identify patients for early discharge | Medical lead | +45 |
| Wards | Start transfer planning to network nodes | Medical lead | +60 |
| Wards | Prepare 30 acute beds | Medical lead | +240 |
| Logistics and transport | Request additional ventilators for Ekhaga vårdhubb | Logistics lead | +30 |
| Logistics and transport | Activate Fältsjukhus Alfa | Logistics lead | +60 |
| Logistics and transport | Assemble transport pool | Logistics lead | +45 |
| Logistics and transport | Check blood products and oxygen supply | Logistics lead | +30 |
| Communication | Notify regional command and neighbouring hospitals | Communications lead | +10 |
| Communication | Open incident channels and start staff call-in | Communications lead | +15 |

**IT outage – operational mirror** (`it-outage`). Trigger: "EHR or hospital network unavailable". Summary: "Switches the hospital to the operational mirror so that patients, placements, plans and capacity can keep being managed while the EHR is down." `setsEhrOutage: true`. Roles: Incident commander, IT liaison, Ward runners lead. Channels: Incident command, IT and wards. Target: Wards confirmed on mirror, 4, wards, 30 min, wardsOnMirror. Tasks:

| Area | Title | Owner role | Due |
|---|---|---|---|
| IT | Confirm scope of the outage with IT | IT liaison | +10 |
| Wards | Switch to operational mirror on all wards | Ward runners lead | +30 |
| Wards | Appoint ward runners for paper orders | Ward runners lead | +20 |
| Wards | Freeze non-urgent transfers | Incident commander | +15 |
| Wards | Verify critical medication lists against last mirror sync | Ward runners lead | +45 |
| IT | Prepare resynchronisation checklist | IT liaison | +60 |

**Mass casualty – Level 1** (`mc-1`, level 1; trigger "20–40 casualties"), **Mass casualty – Level 3** (`mc-3`, level 3; trigger "more than 100 casualties"), **Hospital evacuation – partial** (`evac-partial`; trigger "part of the hospital must be emptied"), **Regional surge support** (`regional-surge`; trigger "another hospital in the region requests support"). Each: summary one sentence in the same style; roles Incident commander, Medical lead, Logistics lead; channel Incident command; one target "Acute beds freed" 10 beds within 120 min (acuteBedsFreed) except mc-3 which uses 50 beds within 240 min; three tasks: "Confirm activation with regional command" (Incident commander, +10), "Brief the incident team" (Incident commander, +15), "Review capacity targets" (Medical lead, +30).

### 5.9 Messages from nodes (Resources → From message)

| id | Author | Role | Node | At | Text |
|---|---|---|---|---|---|
| msg-1 | Mats Öberg | Care hub lead | ekhaga | 13:52 | Behöver två ventilatorer till Ekhaga, har tre patienter på väg som kan behöva andningsstöd. |
| msg-2 | Jonas Vik | Field hospital lead | falt-alfa | 14:05 | Vi har 12 sängar uppe. Saknar syrgas – tio koncentratorer räcker för kvällen. |
| msg-3 | Peter Nord | Head nurse, emergency department | vikby | 14:20 | Akuten behöver fyra rullstolar och två bårar till triagen. |

### 5.10 Initial audit log

| At | Actor | Action | Object | Detail |
|---|---|---|---|---|
| 13:10 | Peter Nord | Requested | Wheelchair × 4 | To Vikby sjukhus, emergency department |
| 13:30 | Mats Öberg | Requested | Saline 1000 ml × 50 | To Ekhaga vårdhubb |
| 13:52 | Mats Öberg | Requested | Ventilator × 2 | To Ekhaga vårdhubb |
| 14:05 | Jonas Vik | Requested | Oxygen concentrator × 10 | To Fältsjukhus Alfa |
| 14:20 | System | Marked out of service | CT2 | Reported by RIS |
| 14:37 | System | Sync completed | EHR | Vikby sjukhus |

## 6. Modules

### 6.1 Command Center (`/command-center`)

Page title "Command Center" with the scope name. Right of the title: the **sync chip** – `Synced 14:37` (green), `Delayed` (warning) when the scope node's last sync is older than 30 minutes, `EHR offline, operating on mirror since {HH:MM}` (red) when the outage is on. Clicking it opens a popover listing sources for the scope: EHR, HR, RIS, OR planning, Logistics – each with a state chip and last sync time (EHR 14:37, HR 14:00, RIS 14:20, OR planning 14:30, Logistics 14:15; when the outage is on, EHR shows Offline).

When an incident is active, an **objectives strip** sits under the title: one compact progress row per target, "{label}: {current} / {target} {unit}, due {HH:MM}".

**Node scope** (Vikby sjukhus shown; other nodes use their own figures where they exist and show "Not available at this node" cards otherwise):

6.1.1 "Capacity now" – six capacity cards in a 3 × 2 grid:

| Card | Figure | Unit | Confidence line | Last confirmed |
|---|---|---|---|---|
| Acute beds | 16 | available of 320 | 14 verified + 2 estimated | 14:32 (EHR) |
| Intensive care | 3 | available of 14 usable | – | 14:35 (EHR) |
| Operating theatres | 2 | surgeries possible now, 6 theatres free | – | 14:30 (OR planning) |
| Imaging | 1 | of 2 CT scanners, 9 waiting | – | 14:20 (RIS) |
| Emergency department | 31 | of 40 slots in use | – | 14:38 (EHR) |
| Staff on duty | 253 | 38 doctors, 112 nurses, 96 assistant nurses, 7 other | – | 14:00 (HR) |

"Show detail" on a card selects the matching capability in 6.1.3 and scrolls to it (Acute beds → Acute beds; Intensive care → Intensive care; Operating theatres → Emergency surgery; Imaging → CT imaging; Emergency department and Staff on duty → open a popover with the breakdown text instead).

6.1.2 "Bottlenecks" – a table of the ranked bottlenecks for the scope (§ 5.4), columns Rank, Capacity, Limiting resource, Impact, Would unlock. Clicking a row selects the matching capability in 6.1.3 if one exists.

6.1.3 "What limits what" – a segmented control selecting a capability (Emergency surgery, Intensive care, CT imaging, Acute beds). Shows:

- The dependency table: Component, Total, Available, and a "Limiting" chip on the row(s) with the smallest available value.
- The capacity sentence: "Capacity now: {capacity} {unit}, limited by {limiting component} ({available} available)." followed, when a next constraint exists, by "Freeing {gap} {limiting component} would allow {gap} more; the next constraint is {next component} ({next available})." where gap = next available − limiting available. With several limiting components, list them joined by "and".
- The ladder (when defined): horizontal bars, one per step, proportional to the first step, labelled with the step name and value.
- A toggle `What-if` that turns the Available cells into number inputs (0–Total). Changes update the sentence and chips live, show a warning chip "What-if, not saved" next to the heading, and never touch the store's capability data; `Reset` clears them. The what-if is per capability and survives navigation within the session.
- The capability note, if any, in muted text.

**Region scope**: the cards become Acute beds (network), Intensive care (network), Home care places, Operating theatres (Vikby sjukhus only, labelled so), Transport (ambulances available at nodes with Full sharing: 2, confidence line "Sjöberga sjukhus not shared"), Staff on duty (network, excluding nodes with Capacity only sharing – say so in the confidence line: "Sjöberga sjukhus not shared"). Then a "Nodes" table: Node, Type, Status, Acute beds free / total, Intensive care free / usable, Staff on duty, Sync, Sharing; row click → `/network/:nodeId`. Then the bottleneck table for all nodes. 6.1.3 is not shown at region scope; instead a sentence: "Select a node to see what limits its capacity."

### 6.2 Incident (`/incident`)

6.2.1 **No active incident** – title "Incident", sentence "No active incident.", then the **Playbooks** table: Name, Level, Trigger, Roles, Tasks, Channels, Targets (counts) and an `Activate` button per row. A chevron expands the row to list its tasks (area, title, owner role, due offset) and targets. Below the table, "Previous incidents" lists closed incidents this session (name, activated, closed, tasks done / total) with a `Show log` link that opens the log drawer; it is hidden when empty.

6.2.2 **Activate dialog** – title "Activate {playbook name}?"; body: "Activating creates {n} roles, {n} tasks, {n} channels and {n} capacity targets, and switches the Command Center to incident view."; select `Incident commander` (all staff, default Eva Lind); textarea `Note` (optional); buttons `Cancel`, `Activate incident`. On activation: build the incident (tasks get ids and `due = clock + offset`, status Not started; commander assigned; other roles unassigned), set the banner, log "Activated incident – {name}", and for each created object a System entry ("Created task – {title}", "Opened channel – {name}"). If `setsEhrOutage`, turn the outage on. Toast "Incident activated". Navigate to the active view.

6.2.3 **Active incident** – header: playbook name (title), chips for level and status "Active", line "Activated {HH:MM} by {name}. Incident commander: {name}."; buttons `+ Add task`, `Close incident`. Sub-tabs: `Overview`, `Tasks ({done}/{total})`, `Channels ({n})`, `Log ({n})`.

- **Overview**: targets as progress rows with current/target and due time; "Roles" as a key–value table (role → assigned person, `Change` opens a select of staff); a summary line "{n} not started, {n} in progress, {n} done".
- **Tasks**: grouped list by area in the playbook's order; each row: status glyph (click cycles Not started → In progress → Done → Not started), title, owner role pill (text of the role, plus the assigned person's profession pill when assigned), due `HH:MM`, and a `Assign` link opening a select of staff. Every status change logs "Changed task status – {title} – {status}". `+ Add task` dialog: `Title`, `Area` (select of the playbook's areas), `Owner role` (select of roles), `Due in minutes` (number, default 30); logs "Added task".
- **Channels**: list of channels with member roles and message count; click → `/incident/channels/:channelId`. The thread view uses the message-thread component. At activation every channel gets one System message: Incident command "Incident {name} activated at {HH:MM}.", the others "Channel opened at {HH:MM} for {member roles}." Sending a message appends it (author Eva Lind) and logs "Sent message – {channel}". Messages authored by anyone other than Eva Lind or System carry a link `Create request` that opens the new-request dialog prefilled by the parser (§ 6.4.3); with the seeded data no such messages exist in channels, which is acceptable.
- **Log**: the audit log, newest first, columns Time, Actor, Action, Object, Detail. The same table is used in the log drawer.

6.2.4 **Effects elsewhere** while active: the banner; the objectives strip in Command Center; Evacuation shows the acute-beds target; the Resources request list shows a chip "Incident" on requests created during the incident.

6.2.5 **Close dialog** – title "Close incident?"; body "The incident log is kept under Previous incidents. Open tasks are left as they are."; buttons `Cancel`, `Close incident`. Closing moves the incident to `closedIncidents` (with its log slice), clears the banner, turns the EHR outage off if the playbook set it, logs "Closed incident", toast "Incident closed".

### 6.3 Evacuation (`/evacuation`)

Title "Evacuation" with "from Vikby sjukhus". Under it a summary row: `Target: free 30 acute beds` (from the active incident's acuteBedsFreed target; otherwise "No target set") and counts `Planned {n}`, `Accepted {n}`, `In transit {n}` (Transport assigned + Departed), `Arrived {n}`, `Handed over {n}`. Buttons: `Suggest plan` (secondary), `Clear suggestions` (tertiary, only when suggestions exist).

Three panes:

**Left – "Patients ({n})"**: filter chips row (Stability: All/Stable/Monitor/Critical; Transport: All/Walking/Wheelchair/Stretcher/Ambulance/Intensive care transport; Status: All/Not planned/Planned/In transit/Arrived); grouped by ward with counts; each row: name, age, stability chip, transport need, equipment as small text, and the move status chip or muted "Not planned". A suggested-but-unaccepted plan shows a warning chip `Suggested`. Clicking a row selects the patient (highlighted with `--color-bg-muted`).

**Middle** – two sections:

- "Destinations": one row per node except Vikby: name, type, status chip, `Free {n} of {total}` (beds or home care places; for Intensive care level the node's intensive care free/usable is shown instead), accepts (chips), distance from Vikby sjukhus in km (computed from coordinates, rounded). A node is incompatible for the selected patient when its `accepts` does not include the patient's care level (Home requires `homeCareEligible`), when it is not Operational, when its relevant free count is 0, or – for a Monitored patient going to Ekhaga vårdhubb – when Ekhaga's Patient monitor available count is 0; incompatible rows are dimmed with the reason as helper text ("Does not accept Intensive", "Standing up", "No free places", "No free monitors").
- "Transport": one row per Transport resource at Vikby except Helicopter: name, `{available} available`, and the vehicle's seat capacity as informative text. Compatibility by transport need: Walking → Taxi contract, Medical bus, Patient transport vehicle, Ambulance; Wheelchair → Patient transport vehicle, Medical bus, Ambulance; Stretcher → Patient transport vehicle, Ambulance; Ambulance and Intensive care transport → Ambulance only. Every move occupies one vehicle unit regardless of seat capacity (seat capacity is informative only).
- When a patient is selected, a "Plan move" panel below: `Destination` select (compatible only) and button `Plan move`. When the patient already has a plan: the status chain (six steps rendered as a numbered sequence, done steps green, current primary) and one primary button for the next step: `Accept at destination`, `Assign transport` (opens a select of compatible vehicles with available > 0, showing "{name}: {available} available"), `Mark departed`, `Mark arrived`, `Mark handed over`; a tertiary `Cancel move` (allowed until Departed). The patient's transport need is shown in the panel as "Needs: {need}". For a suggested plan: `Accept suggestion` (primary) and `Reject` (tertiary).

**Right – map**: all nodes as markers; the selected patient's destination highlighted and joined to Vikby with a polyline; a marker popup shows name and free places.

Rules:

- Planning (or accepting a suggestion) decrements the destination's relevant free count (acute beds, home care places, or intensive care free for Intensive; a Monitored patient to Ekhaga vårdhubb also takes one Patient monitor: available −1, reserved +1). Assigning transport reserves one vehicle unit (available −1, reserved +1); Departed moves it to in use (reserved −1, in use +1); Arrived releases it (in use −1, available +1); Handed over changes no counts. Cancelling a move reverses every count it has taken. Log every step: "Planned move – {patient} – to {node}", "Accepted at destination – {patient}", "Assigned transport – {patient} – {vehicle}", "Departed – {patient}", "Arrived – {patient} – {node}", "Handed over – {patient} – {node}", "Cancelled move – {patient}".
- `Suggest plan` runs `src/lib/suggest.ts` over all patients without a plan, in priority order Critical, Monitor, Stable, and proposes destinations only (transport is chosen at the Assign transport step): Critical → Sjöberga sjukhus while its intensive care free count lasts; Monitor → Ekhaga vårdhubb while its Patient monitor available count lasts, then Sjöberga sjukhus acute beds; Stable and homeCareEligible → Hemsjukvård Sollentuna while its free places last, then as other Stable; other Stable → Fältsjukhus Alfa when Operational, else Ekhaga vårdhubb; each choice respects the remaining free counts (decrementing as it goes, without touching the store until accepted). With the initial dataset this places 32 patients and leaves 8 (4 Critical, 4 Stable) unplaced – assert this in a test. Patients that cannot be placed stay unplanned and are counted in a toast: "Suggested {n} moves, {m} could not be placed". Suggestions are marked `suggested: true`, do not take any counts until accepted, and log one entry "Suggested moves – {n} patients". `Accept suggestion` takes the counts as a normal plan and logs "Authorised suggested move – {patient} – to {node}" as Eva Lind – this is the "system recommends, human authorises" principle and the presenter will point at it. `Reject` clears the suggestion and logs "Rejected suggested move – {patient}". `Clear suggestions` rejects all remaining suggestions in one action.

### 6.4 Resources (`/resources`)

Sub-tabs: `Requests ({n open})`, `Inventory`, `From message ({n})`. Open = not Received and not Rejected. Title "Resources" with the scope name on the Inventory tab only.

6.4.1 **Requests** – `+ New request` (tertiary) at the top right. Grouped list by status in chain order (Requested, Accepted, Allocated, Dispatched, Received, Rejected), each non-empty group with a heading and count (empty groups are not shown); row: priority text, "{resource} × {quantity} {unit}", "{from} → {to}" (from shown as "Not allocated" in muted text when empty), requested by and time, ETA when set, chip `Incident` when created during an active incident. Row click opens the request drawer: key–value table (all fields), the five-step status chain, the request's audit entries, and action buttons for the next step:

- Requested → `Accept` / `Reject` (Reject asks for a one-line reason in a dialog).
- Accepted → `Allocate`: select `From node` listing nodes that have the resource with available ≥ quantity (show "{node}: {available} available"), preselected when the request already names a from node; on confirm, reserve the quantity at that node (available −qty, reserved +qty). The initial Dispatched requests (req-3, req-4) already have their quantities in transit in § 5.5, so no counts are taken for them at load.
- Allocated → `Dispatch`: input `ETA` (HH:MM, default clock + 30); moves the reserved quantity to in transit.
- Dispatched → `Mark received`: at the source, in transit −qty and total −qty; at the destination, available +qty and total +qty on the resource row with the same name (create the row there if missing, copying category and unit, with all other counts 0, source Manual, lastConfirmed = clock).
- Received and Rejected are terminal.

Every transition logs "{Action} request – {resource} × {quantity} – to {node}". `+ New request` dialog: `Resource` (select of distinct resource names across all nodes), `Quantity`, `To node`, `Priority` (default Normal), `Note`; created with status Requested, requestedBy Eva Lind, requestedAt = clock; toast "Request created".

6.4.2 **Inventory** – a filterable table of resources for the scope (region = all): Resource, Node, Category, Total, Available, In use, Reserved, Out of service, In transit, Unknown, Status (Supply status chip for supplies; for other categories a chip `Out of service` when outOfService > 0 else `Ok`), Last confirmed (with source in muted text). Column-header filters on Node, Category and Status; sortable on Resource, Available. Sum row at the bottom for numeric columns. Notes appear as a tooltip on the resource name. Nodes with sharing `Capacity only` or `None` show their rows dimmed with the note "Not shared" in the Available column and dashes elsewhere.

6.4.3 **From message** – the message-thread component with the three seeded messages (§ 5.9) as received bubbles; the input lets the presenter add a message (author Eva Lind) but only received messages carry a `Create request` link. `src/lib/parse.ts` prefills the dialog from the message text:

- Quantity: the first integer, or the first Swedish or English number word (en/ett/två/tre/fyra/fem/sex/sju/åtta/nio/tio; one…ten).
- Resource: first match of a synonym in the text, case-insensitive, on stems: ventilator → Ventilator; koncentrator, syrgaskoncentrator → Oxygen concentrator; rullstol → Wheelchair; bår → Stretcher; monitor → Patient monitor; pump → Infusion pump; syrgas (without "koncentrator") → Oxygen cylinder; blod → Blood products O-negative; ambulans → Ambulance; defibrillator → Defibrillator; team → Mobile care team.
- To node: first match on ekhaga → Ekhaga vårdhubb; alfa, fältsjukhus → Fältsjukhus Alfa; sjöberga → Sjöberga sjukhus; hemsjukvård → Hemsjukvård Sollentuna; akuten, vikby → Vikby sjukhus; otherwise the author's node.
- Priority: High if the text contains "akut", "urgent" or "kritisk"; otherwise Normal.
- Note: the message text.

Unparsed fields are left empty for the user. Unit tests cover the three seeded messages (expected: 2 Ventilator → ekhaga; 10 Oxygen concentrator → falt-alfa; 4 Wheelchair → vikby) and an unparseable message.

### 6.5 Network (`/network`)

Title "Network" with "Region Nord". Top: a Leaflet map with all nodes. Below: the nodes table (same columns as the Command Center region table) plus Lead and Place; `+ Stand up node` (tertiary) top right.

**Stand up dialog**: `Name`, `Type` (Care hub / Field hospital), `Site` (select of preset sites: Vikby idrottshall, Sollentuna (59.4320, 17.9600); Ekebo skola, Upplands Väsby (59.5186, 17.9110); Mälarhallen, Sigtuna (59.6173, 17.7234); Kista terminal, Kista (59.4050, 17.9400); Rosersbergs kaserner, Rosersberg (59.5800, 17.8700)), `Planned beds` (number, default 20), `Lead` (select of staff), `Sharing` (default Full); button `Stand up node`. Creates a node with status Standing up, free = 0 (estimated, Manual, lastSync = clock), `accepts: ['Ward']`, adds it to the scope selector, map, tables and destinations; logs "Stood up node – {name}"; toast "Node created".

**Node detail (`/network/:nodeId`)**: back link, title = node name with type and status chips. Two columns: left, a key–value table – Type, Status (`Change` → select of statuses; setting Operational on a Standing up node sets total = plannedBeds and free = plannedBeds − (previous total − previous free), all estimated, source Manual, lastConfirmed = clock), Lead, Place, Sharing (`Change` → select), Sync (state and time), Acute beds or Home care places (free / total with confidence line), Intensive care (or "None"), Staff on duty (or "Not shared"), Accepts. Then a "Sources" table (source, state, last sync) and, for the node's bottlenecks, the bottleneck rows. Right: the map centred on the node. Changing sharing or status logs "Changed node {field} – {node} – {value}". A stood-up node also gets a "Resources" section with a link "Show inventory" → `/resources/inventory` with scope set to that node.

## 7. Cross-cutting behaviour

### 7.1 Confidence and freshness

Every Figure renders as: value; then, when estimated > 0, "{verified} verified + {estimated} estimated" and a warning chip `Estimated`; then "Last confirmed {HH:MM} ({source})" in muted text. A Figure whose `lastConfirmed` is older than 30 minutes relative to the clock shows its time in `--color-orange-text` with the title "Older than 30 minutes". Sync chips follow § 6.1.

### 7.2 EHR outage (operational mirror)

When `ehrOutage` is true (via the demo switch or the IT outage playbook): every Figure with source EHR displays source `Mirror`, all of its value as estimated (verified 0), and `lastConfirmed` frozen at the time the outage started; the sync chip turns red as in § 6.1; a warning chip `Operating on mirror` appears on the Command Center title row; the Sources popover shows EHR Offline. Nothing else stops working – that is the point. Turning the outage off restores the original figures and lastConfirmed values and logs "EHR connection restored". Turning it on logs "EHR connection lost, switched to operational mirror".

### 7.3 Audit log

Append-only. Never edited or deleted (Reset rebuilds from the initial entries). Available in the Incident → Log tab and in a `Show log` drawer opened from the Incident page and from the Command Center title row (`Log` tertiary link). Columns: Time, Actor, Action, Object, Detail. Newest first, most recent 200.

### 7.4 Suggestions

Anything the system proposes (evacuation suggestions, the prefilled request) is labelled `Suggested` until a person accepts it, and accepting is logged as authorisation by that person. The system never executes a suggestion by itself.

### 7.5 Empty states and edge cases

- No patients match the filters: "No patients match these filters." with `Clear filters`.
- No open requests: "No open requests." with `+ New request`.
- Channel without messages: "No messages yet." above the input.
- Selecting a destination or transport with 0 available is impossible (options disabled with reason).
- All numbers that are computed (capacity, counts, sums) are computed from state, never hard-coded in components.

## 8. Existing-module stubs

`/patients`, `/activities`, `/planning`, `/employees`, `/reporting` each render the page title (module name) and the sentence "This module exists in Medoma today and is outside the scope of this prototype." with a link `Go to Command Center`. They exist so that the navigation is the real navigation.

## 9. Batches and definition of done

Each batch is one pull request. Later batches must not be started before the earlier one is merged.

### Batch 1 – shell, data, deploy (additive only)

Build: repository scaffold and tooling; `DESIGN.md` tokens as CSS variables and Tailwind theme; Inter; logo files copied to `public/` and the symbol extracted into the nav; the app shell (nav with all eleven modules and the divider, scope selector, right cluster, demo controls, incident banner component wired to state); all routes as stub pages – the five existing-module stubs as specified in § 8 and the five new modules as a page title plus "Coming in a later batch"; the complete domain model, vocab, mock dataset (including the generated 40 patients) and store with `reset()`, clock and audit log; `src/lib/capacity.ts` with tests; the deploy workflow; README.

Definition of done:

- [ ] `npm run build`, `npm run typecheck` (tsc --noEmit) and `npm test` pass.
- [ ] All eleven modules are reachable from the nav; the active-module top bar renders correctly; `/` redirects to `/command-center`.
- [ ] The scope selector lists Region Nord and the five nodes and changes the scope name in the nav.
- [ ] Demo popover opens; Reset shows its toast; the EHR outage switch toggles state and writes two log entries.
- [ ] The nav, sub-tab and button styles match DESIGN.md § 3–4 when compared side by side with the description.
- [ ] Mock dataset contains exactly 40 patients meeting § 5.7 constraints (assert in a test).
- [ ] `capacity.ts` tests: Emergency surgery capacity 2 limited by Post-operative beds, next constraint Anaesthesia teams with gap 2.
- [ ] Deploy workflow present; Vite base configured from repository name; HashRouter in use.
- [ ] DECISIONS.md has entries for every choice not covered by the spec.

### Batch 2 – Command Center

Build § 6.1 completely (node and region scope, cards, bottlenecks, what-limits-what with what-if and ladder, sources popover, objectives strip hook, log link), § 7.1 and § 7.2 in full.

Definition of done:

- [ ] Build, typecheck, tests pass.
- [ ] Vikby scope shows the six cards with the exact figures in § 6.1.1; Show detail scrolls to and selects the right capability.
- [ ] What limits what: Emergency surgery shows capacity 2, limiting Post-operative beds, next Anaesthesia teams (4), gap 2; raising Post-operative beds to 6 in what-if shows capacity 4 limited by Anaesthesia teams; Reset restores 2.
- [ ] Region scope shows the nodes table with Sjöberga staff as "Not shared" and row click navigates to `/network/sjoberga` (stub is acceptable in this batch).
- [ ] EHR outage: cards with EHR source switch to Mirror/Estimated, the sync chip turns red, the title shows "Operating on mirror"; turning off restores the figures.
- [ ] Delayed chip logic: Fältsjukhus Alfa scope shows Delayed.

### Batch 3 – Incident and Evacuation

Build § 6.2 and § 6.3 completely, including channels, log tab/drawer, targets, the banner behaviour, `src/lib/suggest.ts` with tests, transport reservation rules, and the map.

Definition of done:

- [ ] Build, typecheck, tests pass.
- [ ] Activating Mass casualty – Level 2 creates 6 roles, 15 tasks in 5 areas, 4 channels and 4 targets; the banner appears on every page; the Command Center shows the objectives strip.
- [ ] Cycling a task's status logs an entry and updates the Tasks tab count; marking "Set up triage zones" Done moves the ED target to 40/40.
- [ ] Suggest plan places patients according to § 6.3 rules; the toast reports counts; suggestions show as Suggested; accepting one reserves capacity and logs "Authorised suggested move".
- [ ] Walking a patient through Plan → Handed over updates the summary counts, the transport availability and the acute-beds target current value.
- [ ] Closing the incident removes the banner and lists it under Previous incidents with its log.
- [ ] Activating IT outage turns the EHR outage on; closing it turns it off.

### Batch 4 – Resources, Network, polish

Build § 6.4 and § 6.5 completely, `src/lib/parse.ts` with tests, the request status flow with inventory side effects, stand-up flow, node detail, then a polish pass over all modules: empty states (§ 7.5), keyboard access, toasts wording, consistency of chips and vocab, dead-link sweep, README final.

Definition of done:

- [ ] Build, typecheck, tests pass, including the three parser cases.
- [ ] `Create request` from msg-1 opens the dialog prefilled with 2 Ventilator to Ekhaga vårdhubb; creating it adds a Requested row.
- [ ] Walking req-1 through Accept → Allocate (from Vikby sjukhus, 4 available) → Dispatch → Mark received moves 2 ventilators from Vikby available to Ekhaga available, visible in Inventory at both scopes.
- [ ] Inventory column filters work on Node, Category and Status; Blood products O-negative shows Critical, Morphine 10 mg and Tourniquet show Low.
- [ ] Stand up node creates a node that appears in the scope selector, the Network map and table, and Evacuation destinations (incompatible while Standing up); setting it Operational in node detail makes it a valid destination with planned beds free.
- [ ] Every clickable element in the app does something (sweep every route and record the result in the PR).
- [ ] DECISIONS.md complete; README describes the demo story from § 0 in five lines for the presenter.

## 10. Out of scope

Real integrations, authentication, persistence, mobile layout, offline-first behaviour, simulation beyond the what-if table, AI beyond the rule-based suggestions, the patient app, any functionality inside the existing modules, printing, i18n. Do not build any of these, even partially.
