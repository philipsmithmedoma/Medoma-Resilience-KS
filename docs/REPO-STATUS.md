# Repo status – Medoma-Resilience-KS

Status description only. Every claim cites the file, line or config value it was taken from; anything the repo cannot answer is written as "unknown". Snapshot of `main` at `0b9c8ca`. Line counts are raw `wc -l` over `.ts`, `.tsx` and `.css` (blank lines and comments included).

Note on scope: the repo is a hospital capacity and flow prototype for Karolinska (`README.md`, `CLAUDE.md`). It has no home-care visits, addresses, road network or infrastructure assets. Where the requested sections ask for those, the answer is "not present".

## 1. Identity

| Item | Value | Source |
|---|---|---|
| Repo name | `Medoma-Resilience-KS` (owner `philipsmithmedoma`) | `git remote -v` |
| Package name | `medoma-resilience` 0.1.0, private | `package.json` |
| Default branch | `main` (the only branch besides session branches); `origin/HEAD` is not set locally, so unknown from git config alone | `git branch -r`; deploy trigger `branches: [main]` in `.github/workflows/deploy.yml:5` |
| Last commit on main | 2026-09-07T22:10:30+02:00, `0b9c8ca` "Merge pull request #2 …batches-1-2-3-4-wnl5xt" | `git log main -1` |
| Commits on main | 11 | `git log \| wc -l` |
| Deploy target | GitHub Pages, workflow "Deploy to GitHub Pages", job `deploy` using `actions/deploy-pages@v4` | `.github/workflows/deploy.yml:1,36-44` |
| Deploy URL | unknown: the workflow only reads `steps.deployment.outputs.page_url` at runtime (`deploy.yml:41`); no URL is written in config. The base path is `/<repo-name>/` when `GITHUB_REPOSITORY` is set | `vite.config.ts:9-10` |
| Routing mode | hash routing, so no server rewrite is needed | `src/app/App.tsx:1,9` |

## 2. Stack

| Item | Value | Source |
|---|---|---|
| Framework / language | React 18.3.1, TypeScript 5.9.3 (`strict`, `noUnusedLocals`, `noUnusedParameters`) | `package.json`, `tsconfig.app.json` |
| Build tool | Vite 7.3.6 with `@vitejs/plugin-react`, `@tailwindcss/vite` | `vite.config.ts` |
| Package manager | npm (`package-lock.json`; CI uses `npm ci`, Node 22) | `deploy.yml:22-26` |
| UI library | shadcn/ui components vendored in `src/components/ui/` (15 files) on `radix-ui` 1.6.7, `class-variance-authority`, `tailwind-merge`, `clsx`; Tailwind CSS 4.3.3; `lucide-react` 0.544.0; `sonner` 2.0.8 (toasts); Inter variable font | `package.json`, `DECISIONS.md` (Batch 1, vendored shadcn) |
| State handling | zustand 5.0.15, one store composed of six slices; theme and locale in two separate small stores | `src/data/store.ts`, `src/lib/theme.ts`, `src/lib/i18n.ts` |
| Map | leaflet 1.9.4 with react-leaflet 4.2.1 | `package.json`, `src/components/NodeMap.tsx` |
| Routing | react-router-dom 6.30.6 (`HashRouter`) | `src/app/App.tsx` |
| Charting | no charting library; the forecast chart is hand-written SVG | `package.json`, `src/modules/flow/ForecastChart.tsx`, `DECISIONS.md` (Batch 2, "chart is plain SVG") |
| Testing | vitest 3.2.7, `environment: 'node'`, only `src/**/*.test.ts` (no component or DOM tests) | `vite.config.ts:18-21` |
| Lint / format | none configured: no ESLint or Prettier config, no `lint` script | `package.json`, repo root listing |

Install and run (from `package.json` scripts and `README.md` "Köra"):

```bash
npm ci
npm run dev         # vite
npm run typecheck   # tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json
npm test            # vitest run
npm run build       # vite build -> dist/
npm run preview     # vite preview
```

Other facts: viewport meta is fixed `width=1280` (`index.html:6`), minimum viewport 1280 px (`CLAUDE.md`). Map tiles come from `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (`NodeMap.tsx:59`); no other network access is coded.

## 3. Structure

Depth 2, one line per directory.

| Path | Purpose |
|---|---|
| `.github/workflows/` | the single workflow `deploy.yml` |
| `assets/` | `logo-full.svg`, `logo-symbol.svg` (source logos, `DESIGN.md` § 6) |
| `public/` | copies of the two logos served by Vite (`index.html:5` favicon) |
| `docs/screenshots/batch5/` | 14 PNGs of six pages in light/dark, plus two English-mode shots (`DECISIONS.md`, Batch 5) |
| `scripts/` | `generate-patients.mjs`, the seeded generator of `packs/patients.ts` |
| `src/app/` | shell: `App`, `Layout`, `Nav`, `ScopeSelector`, `ClockControl`, `DemoControls`, `IncidentBanner`, `ThemeToggle`, `LocaleToggle`, `routes.tsx` |
| `src/components/` | 20 shared components plus `ui/` (15 vendored shadcn primitives) |
| `src/data/` | zustand store and slices, `vocab.ts` (sv/en tables), `types.ts` (re-export) |
| `src/data/packs/` | the data pack: `karolinska.ts`, `patients.ts` (generated), `types.ts` (domain model) |
| `src/lib/` | pure logic and helpers (capacity, flow, forecast, placement, scenario, suggest, parse, figure, format, i18n, theme, time, scope, sources, targets, incident, inventory, evacuation, utils) |
| `src/modules/capacity/` | Kapacitet page, ladder, cards, bottlenecks, what-limits-what |
| `src/modules/evacuation/` | Evakuering: patient list, planning pane, map |
| `src/modules/flow/` | Läget nu: overview, placement, forecast, discharge tabs |
| `src/modules/incident/` | Incident: playbooks, tasks, channels, dialogs |
| `src/modules/network/` | Nätverk: node table, node detail, stand-up dialog |
| `src/modules/resources/` | Resurser: requests, inventory, from-message |
| `src/modules/scenario/` | scenario panel and strip |
| `src/modules/sources/` | Källor page |
| `src/modules/start/` | Start page and chapters |

Lines of code (all `src` totals 15 283):

| Top-level directory | Lines | Of which tests |
|---|---|---|
| `src/modules` | 4 623 | 0 |
| `src/data` | 5 312 (`karolinska.ts` 1 192, `vocab.ts` 1 781, `types.ts` 521, `patients.ts` 89) | 643 |
| `src/lib` | 2 289 | 488 |
| `src/components` | 2 245 | 0 |
| `src/app` | 444 | 0 |
| `src/` root (`main.tsx`, `index.css`) | 370 | 0 |
| `scripts` | 128 | 0 |
| `.github` | 44 | 0 |

Counts: 15 route entries mapping to 10 page components, plus 13 redirects (`src/app/routes.tsx`); 9 module directories (`src/modules`); 35 shared components (20 + 15 in `ui/`); 42 `.tsx` files under `src/modules`; 10 under `src/app`. Six of the modules are in the nav (`README.md`, `routes.tsx`); Start, Källor and the scenario panel are reached by logo, link and button.

## 4. UI inherited from the Medoma platform

Evidence in the repo is documentation, not shared code. `DESIGN.md:3` states the look "was derived from screenshots of that platform", and colour values are marked exact or estimate. `package.json` has no dependency on a platform package, so no code is imported from it. Whether any file was copied from the platform's source is unknown.

| Area | Evidence of platform origin | Implemented in |
|---|---|---|
| Colour tokens (primary `#186CE9`, greys, semantic set) | `DESIGN.md` § 1, sampled from screenshots; dark values are new in `DESIGN-DARK.md` | `src/index.css` (`@theme`, `.dark`) |
| Typography (Inter, 400/500/600, scale) | `DESIGN.md` § 2 | `src/index.css`, `src/lib/utils.ts` (`extendTailwindMerge`) |
| Logo symbol | `assets/logo-symbol.svg`, aria-label "Medoma" | `src/components/Logo.tsx` (inline copy, `DESIGN-DARK.md` § 4) |
| Top nav, top bar marks the active module | comment "The platform marks the active module…" `src/app/Nav.tsx:20`; `DESIGN.md` § 3 | `src/app/Nav.tsx`, `Layout.tsx` |
| Sub-tabs | `DESIGN.md` § 3 "as in Patients → Activities" | `src/components/SubTabs.tsx` |
| Role pills Doc/Nrs/AsPr/Supp | `DESIGN.md` § 4 "exactly as the platform" | `src/components/RolePill.tsx` |
| Status glyphs | `DESIGN.md` § 4 "as the platform's Activities rows" | `src/components/StatusGlyph.tsx` |
| Key-value table | `DESIGN.md` § 4 "as the platform's Information tab" | `src/components/KeyValueTable.tsx` |
| Message thread | `DESIGN.md` § 4 "as the platform's Communication tab" | `src/components/MessageThread.tsx` |
| Three-pane layout (380 px list, 320 px, map) | `DESIGN.md` § 4 "as the platform's Planning view" | `src/modules/evacuation/EvacuationPage.tsx` (only file with `380px`) |
| Cards, chips, segmented control, tables, buttons, dialogs, sheet | `DESIGN.md` § 4; dialogs and sheet are shadcn | `Card.tsx`, `Chip.tsx`, `SegmentedControl.tsx`, `ui/*` |
| Map | the platform uses Mapbox; this repo uses OSM without a key | `DECISIONS.md` (2026-09-04, OSM) |

New to this repo according to `DESIGN.md` ("prototype-specific") and `DESIGN-KS.md`: capacity card and ladder (`src/modules/capacity/CapacityCard.tsx`, `Ladder.tsx`), confidence chips and source popovers (`ConfidenceChip.tsx`, `FigureLines.tsx`), sync chip (`SyncChip.tsx`), Start page, Läget nu, scenario panel and clock control, forecast chart, Källor, dark mode and language toggle. Origin of `AuditTable`, `LogDrawer`, `NodesTable`, `PageTitle`, `PriorityText`, `StaffSelect`, `StatusChain`: unknown (no comment or doc names them).

## 5. Mock data model

All data is in the pack, `src/data/packs/karolinska.ts` (exports `KAROLINSKA_PACK` at line 1163 and `loadPack()` at 1190) plus generated `patients.ts`; types are in `src/data/packs/types.ts`. `src/data/mock.ts` no longer exists. The pack is hand-written TypeScript constants; only patients are generated (seed 20260904, `scripts/generate-patients.mjs`). Counts below were obtained by loading the pack.

Coordinates: `lat`, `lng` as plain numbers in degrees (WGS84 assumed; the repo does not name a datum) on `CareNode` (`types.ts:59-60`) and `Site`. Patients, wards and requests carry no coordinates. ASIH has the area centre `STOCKHOLM = [59.33, 18.07]` and `radiusKm: 25` (`karolinska.ts:89,249`). Estimated or approximate coordinates are flagged as such in `DATA.md` § 2.

`Figure` (`types.ts:8`) is the base type of most numbers: `{ value: number | null, confidence: 'verified'|'reported'|'estimate'|'illustrative', source?, asOf?, basis?, verified?, estimated?, lastConfirmed?, dataSource? }`. Example: `{"value":18,"confidence":"verified","source":"S5","asOf":"2025-01-27","basis":"utökat från 16 platser 2025-01-27"}` (Solna `intensiveCare.total`).

| Entity (type, line in `types.ts`) | Fields | Records | Example (verbatim from the pack) |
|---|---|---|---|
| `CareNode` (50) | id, name, shortName, type, status, lead, place, lat, lng, sharing, sync, lastSync, site?, parent?, beds{total,free}?, intensiveCare{total,free}?, staffOnDuty?, plannedBeds?, accepts[], radiusKm?, noMarker?, extraFigures[]? | 14 (2 sites, 6 region hospitals, 4 capacity classes, ASIH, Ambulanssjukvården) | `{"id":"sos","name":"Södersjukhuset","shortName":"SÖS","type":"Hospital","status":"Operational","lead":"Helena Berg","place":"SÖS","lat":59.31,"lng":18.053,"sharing":"Capacity only","sync":"Synced","lastSync":"14:30","beds":{"total":{"value":391,"confidence":"verified","source":"S4b","asOf":"2025-08-13",…},"free":{"value":14,"confidence":"illustrative",…}},…}` (built by `regionHospital()`, `karolinska.ts:283`) |
| `Ward` (136) | id, site, tema, name, total, free | 17 (15 from `DATA.md` § 5.1 + 2 IMA) | `{"id":"solna-hkn-kardiologi","site":"solna","tema":"HKN","name":"HKN Kardiologi","total":32,"free":2}` |
| `Capability` (89) with `Component` (78) | id, nodeId, kind, name, unit, components[{name,total,available,confidence?,source?,basis?}], ladder?, note? | 8 | `{"id":"solna-surgery","nodeId":"solna","kind":"surgery","name":"Akut operation","unit":"akuta operationer möjliga nu","components":[{"name":"Operationssalar","total":24,"available":6,"confidence":"illustrative","basis":"antal ej offentligt"},…]}` |
| `Bottleneck` (100) | rank, nodeId, capabilityKind?, capacity, limitingResource, impact, wouldUnlock | 6 | `{"rank":1,"nodeId":"solna","capabilityKind":"surgery","capacity":"Akut operation","limitingResource":"Postop-platser (2 av 14 lediga)",…}` |
| `FlowMetric` (114) | key, site, block, label{sv,en}, value Figure, qualifier?, unlockRoute? | 60 (30 per site) | `{"key":"akuten.patients","site":"solna","block":"akuten","label":{"sv":"Patienter på akuten nu","en":"Patients in the ED now"},"value":{"value":22,"confidence":"illustrative","basis":"scenariobaslinje","dataSource":"EHR","lastConfirmed":"14:37"},"qualifier":"Solna är Intensivakuten"}` |
| `BedRequest` (124) | id, site, from, patient, age, needs[], waitingMin, suggestedWard?, suggestionNote? | 12 | `{"id":"br-1","site":"huddinge","from":"Akutmottagningen","patient":"Andersson, Anna","age":74,"needs":["Telemetri","HKN"],"waitingMin":340}` |
| `DischargeReady` (147) | id, site, wardId, patient, age, daysWaiting, waitingFor, asihEligible, status, sentAt? | 12 | `{"id":"dr-1","site":"huddinge","wardId":"huddinge-i-internmedicin","patient":"Magnusson, Maria","age":88,"daysWaiting":4,"waitingFor":"Kommunal korttidsplats","asihEligible":false,"status":"Väntar"}` |
| `ForecastProfile` (160) | site, arrivalsPerHour[], admissionShare, plannedDischargesToday, dischargeShareByHour[], electiveAdmissionsTomorrow | 2 | `{"site":"huddinge","arrivalsPerHour":[{"from":6,"to":10,"rate":6},…],"admissionShare":0.32,"plannedDischargesToday":52,…,"electiveAdmissionsTomorrow":24}` |
| `Resource` (173) (equipment, transport, supplies) | id, nodeId, name, category, unit, total, available, inUse, reserved, outOfService, notInService, inTransit, unknown, criticalBelow?, lowBelow?, note?, dataSource, lastConfirmed, confidence | 35 | `{"id":"solna-ventilator-0","nodeId":"solna","name":"Ventilator","category":"Equipment","unit":"st","total":34,"available":4,"inUse":28,"reserved":0,"outOfService":2,"notInService":0,"inTransit":0,"unknown":0,"dataSource":"Logistics","lastConfirmed":"14:15","confidence":"illustrative"}` |
| `ResourceRequest` (198) | id, resourceName, quantity, unit, fromNodeId?, toNodeId, priority, status, requestedBy, requestedAt, eta?, note?, incident?, rejectReason? | 5 | `{"id":"req-1","resourceName":"Ventilator","quantity":2,"unit":"st","toNodeId":"huddinge","priority":"High","status":"Requested","requestedBy":"Peter Nord","requestedAt":"13:52","note":"Två IVA-kandidater på akuten"}` |
| `Message` (215) | id, author, role, at, text, nodeId? | 3 | `{"id":"msg-1","author":"Peter Nord","role":"Chefssjuksköterska akuten Huddinge","nodeId":"huddinge","at":"13:52","text":"Behöver två ventilatorer till akuten Huddinge, …"}` |
| `Patient` (238) (evacuation) | id, familyName, givenName, pin, age, ward, nodeId, stability, careLevel, transport, equipment[], homeCareEligible, move? | 80 (40 per site) | `{"id":"ps-1","familyName":"Andersson","givenName":"Stefan","pin":"19450726-7983","age":81,"ward":"HKN Kardiologi","nodeId":"solna","stability":"Stable","careLevel":"Ward","transport":"Walking","equipment":["Oxygen"],"homeCareEligible":true}` |
| `Playbook` (287) | id, key, code, name, trigger, summary, defaultLage, roles[], tasks[], channels[], targets[], setsEhrOutage?, navigateTo?, tickDays? | 5 (tasks 15/6/5/4/3) | `{"id":"pb1","key":"masskada","code":"PB1","name":{"sv":"Allvarlig händelse: masskada",…},"defaultLage":"Förstärkningsläge",…}` |
| `ScenarioPreset` (364) | key, name, params, paramDefs[], tickMin, horizonTicks | 6 | `{"key":"masskada","name":{"sv":"Masskada",…},"params":{"skadade":60,"rod":20,"gul":40,"gron":40,"fonster":120,"forsta":20,"primar":"solna","sekundar":"huddinge"},…,"tickMin":15,"horizonTicks":16}` |
| `Staff` (444) | name, title, profession, nodeId? | 13 (fictional) | `{"name":"Eva Lind","title":"Kapacitetskoordinator, Stab Produktion","profession":"Supp","nodeId":"karolinska"}` |
| `SourceRef` (451) | key, name, url?, date | 23 | `{"key":"S1","name":"karolinska.se – Teman och funktioner","url":"https://www.karolinska.se/om-oss/organisation/teman-och-funktioner/","date":"sidan ändrad 2026-08-03"}` |
| `AuditEntry` (432) | id, at, actor, action, object, detail?, ref? | 7 seeded | `{"id":"log-1","at":"13:10","actor":"Peter Nord","action":"Begärde","object":"Rullstol × 4","detail":"Till Karolinska Huddinge, akutens triage","ref":"req-5"}` |
| `Site` (458) (stand-up presets) | name, place, lat, lng | 5 | `{"name":"Tillfällig vårdhubb Flemingsberg","place":"Flemingsberg","lat":59.22,"lng":17.945}` |
| `Organisation` (481) | key, name, type, sites[] | 9 | `{"key":"arm","name":"Tema Akut och Reparativ medicin","type":"tema","sites":["solna","huddinge"]}` |

Further pack members (same file): `ladders` (3 × 5 `LadderStep`), `hospital` (`HospitalFigures`), `edRooms` (2), `hospitalSources` (5 `SourceEntry`), `demoNow: '14:40'`. Not present as entities: address, visit, home-care team, infrastructure asset (road, power, water) and disruption as a stored record. A "disruption" exists only as a scenario preset (`ScenarioPreset`) and the EHR outage flag (`ehrOutage` in `store.ts`).

`patients.ts` pins have the shape `YYYYMMDD-NNNN` with a random 4-digit suffix (`scripts/generate-patients.mjs:59-69`); the generator contains no check-digit logic, so whether they are valid personnummer is unknown.

## 6. Preparedness functionality

| Feature | Status | Implemented in |
|---|---|---|
| Map | implemented: Leaflet, tiles `tile.openstreetmap.org` (raster), default Leaflet CRS (EPSG:3857; `crs` is not set in the code), scroll-wheel zoom off, fit to nodes | `src/components/NodeMap.tsx`, used by `EvacuationMap.tsx`, `NetworkPage.tsx`, `NodeDetailPage.tsx` |
| Layers | stub: no layer control or toggles (`LayersControl` not used); one tile layer, circle markers, one `Circle` (ASIH, 25 km) and an optional `Polyline` source→destination | `NodeMap.tsx:2,59-110` |
| Disruption simulation | implemented: six presets; masskada, mottagande and pandemi run a tick-based pool simulation; tryck, journalbortfall and siteevac only set flags or navigate; EHR outage flips EHR figures to "Mirror" | `src/lib/scenario.ts`, `src/data/store-scenario.ts`, `src/lib/figure.ts:19-40` |
| Reachability / routing | not present: no isochrone, road network, routing or travel-time code (grep for isochrone, reachab, routing, osrm, directions, geojson, turf returns nothing). The only geography is haversine distance used to order evacuation destinations | `src/lib/figure.ts:106` (`distanceKm`), `src/lib/suggest.ts:54` |
| Patient lists and filters | implemented: grouped by ward, filters stability, transport need and move status | `src/modules/evacuation/PatientList.tsx:56-67` |
| Prioritisation | implemented in three places: evacuation suggestion order Kritisk → Övervakning → Stabil with destination rules; bed-request placement rule; bed requests sorted by waiting time | `src/lib/suggest.ts:21-92`, `src/lib/placement.ts`, `src/modules/flow/PlacementTab.tsx:33` |
| Inflow forecast, 24 h | implemented | `src/lib/forecast.ts` |
| Capacity dependency ("what limits what", what-if) | implemented: capability = minimum of component availability | `src/lib/capacity.ts` |
| Block status thresholds (Läget nu) | implemented, per site, worst of sites at Karolinska scope | `src/lib/flow.ts:68-120` |
| Incident playbooks, tasks, channels | implemented | `src/modules/incident/*`, `src/data/store-incident.ts` |
| Export (CSV, print, download) | not present: no matching code found | `src/` |
| Backend, persistence, live data | not present by design | `CLAUDE.md` hard constraints |

Impact algorithm (mass-casualty scenario), from `src/lib/scenario.ts`:
1. `masskadaCasualties()` splits the casualty count into red, yellow and green by integer distribution, gives each patient an arrival minute `first + floor(j × window / n)`, routes it to a site (yellow 50/50, green 30/40/30 including `region`) and sets the needs CT, operation, IVA, bed and blood with `crosses(j, share)`.
2. `simulateMasskada()` builds one pool per site for akutrum, övervakning, behandlingsrum, ct_slots, or_slots, iva, ima, vardplatser and blod_oneg, plus a region-level akutambulans pool, each with a `capacity(t)` and a `demand(t)` function.
3. Demand counts the casualties whose occupancy window covers the tick (for example red akutrum from arrival to +60 min, IVA from arrival +30 min onwards), while capacity starts from the baseline in `ScenarioInputs` and is raised from the tick a recommendation was applied (for example `ima_overflow` +6 IVA at the primary site, `asih` adds the ASIH-eligible beds).
4. `run()` evaluates every pool at every tick up to the horizon, stores demand and capacity, and emits one event the first tick demand exceeds capacity; recommendations are marked applicable from that series (for example `ima_overflow` only when IVA at the primary site has a shortfall).
5. `store-scenario.ts` re-runs `simulate()` with the map of applied recommendations (line 58) and projects the current tick onto live figures as `max(0, capacity − demand)` (line 68), so Läget nu, Kapacitet and Nätverk change with the scenario clock.

## 7. Integration points

Where mock data enters:
- `loadPack()` (`src/data/packs/karolinska.ts:1190`) is called once, in `initialData()` (`src/data/store.ts:97`), which is synchronous. The pack is then copied with `structuredClone` into store fields (`store.ts:102-`) and into `ScenarioInputs` when a scenario starts.
- Direct imports of pack constants outside the store: `ED_NAME` in `src/data/store-flow.ts:5` and `src/modules/flow/useSiteValues.ts:4`; `REGION_FIGURES` in `src/lib/sources.ts:3`.
- Components read through `useStore(...)` (171 call sites in 39 files); pure functions in `src/lib/` take plain data and do not touch the store.
- All writes stay in memory; every action goes through `logEntry()` (`store.ts`). There is no write-back path.

What an adapter would have to provide, as the code is written: a synchronous function returning a `DataPack` (24 top-level members, `packs/types.ts:496-521`), or a store refactor to load asynchronously (not present today). Minimum content per `types.ts`: nodes with `beds` and `intensiveCare` Figures, wards with `free`, flow metrics keyed as in `src/lib/flow.ts` (for example `akuten.waitingBed`, `beds.belaggning`, `iva.free`, `staff.vacant`), bed requests, discharge-ready patients, forecast profiles, resources, patients per site, and the source list.

Fields in the mock data that may not exist in platform data, all "to verify" (nothing is known about the platform's schema from this repo):
- `Patient.pin`, `stability`, `careLevel`, `transport`, `equipment`, `homeCareEligible` (`types.ts:238-252`).
- `BedRequest.needs`, `waitingMin`, `suggestedWard`; `Ward.free`; `DischargeReady.waitingFor`, `asihEligible` (`types.ts:124-158`).
- `Figure.confidence`, `source`, `basis`, `dataSource`, `lastConfirmed` (`types.ts:8-18`).
- `CareNode.sharing`, `sync`, `lastSync`, `accepts`, `radiusKm`; `Resource.notInService`, `reserved`, `unknown` (`types.ts:50-74,173-193`).
- `ForecastProfile` rates and shares; `ScenarioInputs` baselines (room counts, scanners, OR slots): in the pack these are illustrative values, not measured ones (`DATA.md` § 4-5).

## 8. Spec versus code

Precedence in `CLAUDE.md`: `SPEC.md` > `DATA.md` > `DESIGN-KS.md` > `DESIGN.md` > code.

In `SPEC.md` but not (fully) in code, or deviating:
- `SPEC.md` § 6.3 says Huddinge goes negative "before midnight" at baseline. The code gives the first deficit at 03:40 and 23:40 only under Tryck; tests assert those values (`src/lib/forecast.test.ts:24-37`; `DECISIONS.md` Batch 2 "Forecast model details").
- `SPEC.md` § 2 / `DESIGN-KS.md` § 2 require the user name always visible and 16/500 tabs with 32 px gap. Code hides the name below 1 360 px (`DECISIONS.md` Batch 5 "Nav name hidden").
- `SPEC.md` § 9 Batch 4 requires the dead-link sweep table in the PR. The sweep script is not in the repo (`DECISIONS.md`, Batch 4 "Dead-link sweep method"); whether the PR table exists is unknown from the repo.
- `SPEC.md` § 4 and § 6.4 define three discharge statuses (Väntar, ASIH-förfrågan skickad, Utskriven); the code has four, adding "Geriatrik-förfrågan skickad" (`types.ts:145`).
- `SPEC.md` § 10 lists "English UI toggle" as out of scope; the code has it (`src/lib/i18n.ts`, `LocaleToggle.tsx`) per `DESIGN-LANG.md`.
- `SPEC.md` § 6.8 "Allocate" and § 6.9 stand-up details are implemented as in the first prototype; this review did not re-verify each sentence of `SPEC.md` § 6 line by line.

In code but not in `SPEC.md`:
- Dark mode (`ThemeToggle.tsx`, `src/lib/theme.ts`, `.dark` block in `src/index.css`), specified only in `DESIGN-DARK.md`.
- Language toggle sv/en and the two-table vocab (`vocab.ts`, `i18n.ts`), specified only in `DESIGN-LANG.md`.
- Two IMA rows in the ward list (`DECISIONS.md` Batch 1 "IMA as placement wards"); the notice "Fiktiva patientuppgifter" (`DESIGN-DARK.md` § 6).
- `docs/screenshots/batch5/` (`DECISIONS.md` Batch 5).
- Further choices listed in `DECISIONS.md` "## KS build" (47 dated entries after the heading at line 196).

## 9. Quality

| Item | Result | Source |
|---|---|---|
| Tests present | 16 files, 96 tests, all in `src/data` and `src/lib` (pack, store slices, scenario, forecast, placement, flow, capacity, suggest, parse, figure, format, vocab key parity). No UI or component tests | `src/**/*.test.ts` |
| Tests pass | yes: `npm test` on `main` → "Test Files 16 passed, Tests 96 passed" (run in this session, vitest 3.2.7) | command output |
| Type check | passes: `npm run typecheck` exits clean on `main` (run in this session) | command output |
| Build | passes: `npm run build` ok in 5.6 s; warning that one JS chunk is 853.96 kB (> 500 kB) | command output |
| Lint | none configured (see § 2) | repo root |
| CI | one workflow, `deploy.yml`: on push to `main` and manual dispatch it runs `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, then deploys to Pages. There is no `pull_request` trigger, so PRs are not checked | `.github/workflows/deploy.yml:3-6,21-32` |
| TODO / FIXME in code | none found in `src`, `scripts`, `.github`; the only hit for "TODO" is the sentence "never leave a TODO" in `CLAUDE.md:21` | `grep -rnE 'TODO\|FIXME\|XXX\|HACK'` |
| Open items in `DECISIONS.md` | the file is an append-only log (`DECISIONS.md:3`) with no open/closed status; no entry is marked open or unresolved. Two items the log itself leaves open: fastställda vårdplatser definition "att bekräfta" (`DATA.md` § 2.1, in the pack basis text), and S20 staff counts "verify before use" (`DATA.md` § 9) | `DECISIONS.md`, `DATA.md` |
| Known data caveats in the pack | many figures are `illustrative` or `estimate` by design; the count per class is rendered on the Källor page (`src/lib/sources.ts`) | `DATA.md`, `src/lib/sources.ts` |
