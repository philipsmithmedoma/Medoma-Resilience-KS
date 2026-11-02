# SPEC.md – Medoma Resilience, Karolinska version (KS)

This spec modifies the existing prototype in this repository. Values live in DATA.md; this file defines behaviour. Labels in quotes are exact Swedish UI strings. Where this file says "as before", the first prototype's behaviour stands unchanged apart from language and data.

## 0. Purpose and story

A presenter shows Karolinska Universitetssjukhuset's production director how one operational layer covers normal operations, disturbed operations and extreme operations. The demo date is fredag 4 september 2026, 14:40. The story has five chapters (§ 8), started from the Start page: Vardag → Tryck → Masskada → Journalbortfall → Regional omfördelning. Every number shown is verified, reported, estimated or illustrative, and says which (DESIGN-KS.md § 4). The clock is a scenario clock (§ 7.2).

## 1. Stack

Unchanged. New pure modules: `src/lib/forecast.ts`, `src/lib/scenario.ts`, `src/lib/placement.ts`, each with vitest tests. `Intl.NumberFormat('sv-SE')` for all numbers. Remove `src/data/mock.ts`; add `src/data/packs/types.ts` and `src/data/packs/karolinska.ts`. The store loads the pack through one function `loadPack()`.

## 2. App shell

- Nav per DESIGN-KS.md § 2: six modules "Läget nu", "Kapacitet", "Incident", "Evakuering", "Resurser", "Nätverk"; logo → Start. No stubs.
- Scope selector: "Karolinska" (both sites, `karolinska`), "Karolinska Solna" (`solna`), "Karolinska Huddinge" (`huddinge`), "Region Stockholm" (`region`), plus stood-up nodes. Default `karolinska`. Scope affects Läget nu, Kapacitet, Resurser → Lager, Evakuering (source site: `solna` or `huddinge`; at `karolinska` or `region` scope Evakuering shows a site switch at the top and defaults to Huddinge), and the Start page key figures. Incident, Resurser → Förfrågningar and Nätverk are scope-independent.
- Right cluster: scenario clock control (DESIGN-KS.md § 3), "Demo" button, avatar "EL", "Eva Lind".
- Demo popover: switch "Simulera journalbortfall", button "Återställ demo", text "Demoklocka: {HH:MM}, fredag 4 september 2026." Reset restores the pack, clears incident and scenario, sets the clock to 14:40; toast "Demon återställd".
- Incident banner (Swedish): "Incidentläge aktivt: {playbook}. {Beredskapsläge}. Aktiverat {HH:MM} av {namn}. Sjukvårdsledare: {namn}." Links "Öppna incident" and "Avsluta incident". Colour by beredskapsläge: stabsläge and förstärkningsläge orange-light, katastrofläge red-light.

## 3. Routes

| Route | Page |
|---|---|
| `/` | Start |
| `/laget-nu` | Läget nu – Översikt |
| `/laget-nu/placering`, `/laget-nu/prognos`, `/laget-nu/utskrivningsklara` | the three tiles as sub-tabs of Läget nu |
| `/kapacitet` | Kapacitet (the first prototype's Command Center) |
| `/incident`, `/incident/kanaler/:channelId` | Incident |
| `/evakuering` | Evakuering |
| `/resurser`, `/resurser/lager`, `/resurser/meddelanden` | Resurser (Förfrågningar, Lager, Från meddelande) |
| `/natverk`, `/natverk/:nodeId` | Nätverk |
| `/kallor` | Källor |

Any old route (`/command-center`, `/patients`, …) redirects to its new equivalent or to `/`.

## 4. Domain model delta (`src/data/packs/types.ts`)

```ts
type Confidence = 'verified' | 'reported' | 'estimate' | 'illustrative';
interface Figure { value: number | null; confidence: Confidence; source?: string /* DATA.md § 9 key */; asOf?: string; basis?: string; verified?: number; estimated?: number; lastConfirmed?: string; dataSource?: 'EHR' | 'HR' | 'RIS' | 'OR planning' | 'Logistics' | 'Manual' | 'Medoma' | 'Mirror'; }
// All previously numeric capacity fields become Figure. Sums of Figures take the weakest confidence of their parts.

type NodeType = 'Hospital' | 'Care hub' | 'Field hospital' | 'Home care' | 'Capacity class' | 'Transport';
interface CareNode { /* as before */ site?: 'solna' | 'huddinge'; parent?: 'karolinska'; ladder?: LadderStep[]; accepts: CareLevel[]; radiusKm?: number /* ASIH */; }
interface LadderStep { key: 'fastsallda' | 'disponibla_normal' | 'disponibla_v33' | 'belagda' | 'lediga'; label: string; figure: Figure; }

interface FlowMetric { key: string; block: 'akuten' | 'vardplatser' | 'operation' | 'bild' | 'iva' | 'bemanning'; label: string; value: Figure; qualifier?: string; unlockRoute?: string; }
interface BedRequest { id: string; site: 'solna' | 'huddinge'; from: string; patient: string; needs: string[]; waitingMin: number; suggestedWard?: string; suggestionNote?: 'utlokalisering' | 'no-bed'; }
interface Ward { id: string; site: 'solna' | 'huddinge'; tema: string; name: string; total: number; free: number; }
interface DischargeReady { id: string; site: 'solna' | 'huddinge'; wardId: string; patient: string; daysWaiting: number; waitingFor: string; asihEligible: boolean; status: 'Väntar' | 'ASIH-förfrågan skickad' | 'Utskriven'; }
interface ForecastProfile { site: 'solna' | 'huddinge'; arrivalsPerHour: Array<{ from: number; to: number; rate: number }>; admissionShare: number; plannedDischargesToday: number; dischargeShareByHour: Array<{ from: number; to: number; share: number }>; electiveAdmissionsTomorrow: number; }

type BeredskapsLage = 'Normalläge' | 'Stabsläge' | 'Förstärkningsläge' | 'Katastrofläge';
interface Incident { /* as before */ lage: BeredskapsLage; }

interface ScenarioPreset { key: 'masskada' | 'tryck' | 'journalbortfall' | 'mottagande' | 'pandemi' | 'siteevac'; name: string; params: Record<string, number | string>; tickMin: number; horizonTicks: number; }
interface ScenarioState { key: ScenarioPreset['key']; params: Record<string, number | string>; startedAt: string; tick: number; running: boolean; applied: string[] /* recommendation keys executed */; series: TickResult[]; events: Array<{ tick: number; text: string }>; }
interface TickResult { tick: number; pools: Array<{ pool: string; site: string; demand: number; capacity: number }>; }
interface Recommendation { key: string; label: string; effect: string; applicable: boolean; }

interface DataPack { nodes; wards; capabilities; bottlenecks; flowMetrics; bedRequests; dischargeReady; forecastProfiles; resources; requests; messages; staff; playbooks; scenarios; sources: Array<{ key: string; name: string; url?: string; date: string }>; patientsBySite; initialLog; demoNow: '14:40'; }
```

Vocab: every enum value and UI string has a Swedish label in `vocab.ts` (e.g. `MoveStatus` Planned → "Planerad", Accepted → "Accepterad", 'Transport assigned' → "Transport tilldelad", Departed → "Avrest", Arrived → "Ankommen", 'Handed over' → "Överlämnad"; `Stability` Stable → "Stabil", Monitor → "Övervakning", Critical → "Kritisk"; `TransportNeed` Walking → "Gående", Wheelchair → "Rullstol", Stretcher → "Bår", Ambulance → "Ambulans", 'Intensive care transport' → "Intensivvårdstransport"; `TaskStatus` → "Ej påbörjad", "Pågår", "Klar"; `NodeStatus` → "I drift", "Nedsatt", "Under uppstart", "Ur drift"; `SyncState` → "Synkad", "Fördröjd", "Manuell", "Frånkopplad"; `Priority` → "Låg", "Normal", "Hög", "Kritisk"; supply status → "Ok", "Låg", "Kritisk"; sharing → "Full", "Endast kapacitet", "Ingen"). Keep keys English.

## 5. Store delta

Add: `scenario: ScenarioState | null`, `clockRunning: boolean`, `scope` values above, `wards`, `bedRequests`, `dischargeReady`, `flowMetrics` (derived where possible: beläggning, lediga), `lage` on the incident. The clock advances one minute per user action as before, and, when running, 15 minutes every 2 seconds of wall time (scenario ticks) until the scenario horizon or pause. All timestamps use the scenario clock.

## 6. Modules

### 6.0 Start (`/`)

Per DESIGN-KS.md § 5. Chapter cards from § 8. Key figure cards for the current scope: "Fastställda vårdplatser", "Disponibla vårdplatser (normalvecka)", "IVA-platser", "Medarbetare", "Operationer 2025", "Slutenvårdstillfällen 2025", each with its confidence chip and source popover.

### 6.1 Läget nu – Översikt (`/laget-nu`)

Title "Läget nu" + scope. Six blocks per DESIGN-KS.md § 6 with the metrics and values of DATA.md § 4, Solna and Huddinge side by side at Karolinska scope (sum or weighted where meaningful: beläggning as total belagda / total disponibla; median times shown per site only). Block status thresholds:

| Block | Ansträngt when | Kritiskt when |
|---|---|---|
| Akuten | väntar på vårdplats ≥ 10 or vistelsetid över 4 h ≥ 35 % | väntar på vårdplats ≥ 20 or längsta väntan ≥ 6 h |
| Vårdplatser | beläggning ≥ 95 % or utlokaliserade ≥ 5 | beläggning ≥ 100 % or överbeläggningar ≥ 5 |
| Operation | strukna i dag ≥ 2 | strukna i dag ≥ 5 |
| Bilddiagnostik | väntar på CT ≥ 8 or apparat ur drift | väntar på CT ≥ 15 |
| IVA/IMA | lediga IVA ≤ 1 or väntar på IVA ≥ 1 | lediga IVA = 0 and väntar på IVA ≥ 2 |
| Bemanning | vakanta pass ≥ 8 | vakanta pass ≥ 15 |

Thresholds are evaluated per site; at Karolinska scope a block's status is the worse of the two site statuses (never thresholds applied to sums).

"Vad frigör" links: Akuten → `/laget-nu/placering`; Vårdplatser → `/laget-nu/utskrivningsklara`; Operation, Bilddiagnostik, IVA/IMA → `/kapacitet` with that capability selected; Bemanning → a popover "Bemanningscentrum: {vakanta pass} pass att tillsätta i kväll; {inhyrda} inhyrda i tjänst" (no further module). The blocks update live when the scenario, placement or discharge actions change the underlying figures (beläggning, lediga IVA, väntar på vårdplats).

### 6.2 Patientplacering (`/laget-nu/placering`)

Sub-tab label "Patientplacering ({n})". Table of bed requests (DATA.md § 5.2) for the scope: Från, Patient, Behov (chips), Väntat, Föreslagen avdelning (from `placement.ts`), Åtgärd. Sorted by waiting time descending. Side panel "Avdelningar" listing wards with free / total for the site(s). Actions per row: "Placera" (assign to suggested or chosen ward: ward free −1, request removed, akuten "väntar på vårdplats" −1, log "Placerade patient – {ward}"), "Utlokalisera" (only when suggestionNote is `utlokalisering`; same effect plus utlokaliserade +1 and a warning chip), "Avvisa" (removes with a one-line reason). `placement.ts` rule: first ward at the same site whose name contains the tema of the request's needs and has free > 0; if the request needs "Isolering", only ARM Infektion qualifies; if none, any ward at the site with free > 0 → note `utlokalisering`; else `no-bed` with the label "Ingen plats – överväg {other site}". KPI strip above the table: "Väntar {n}", "Längsta väntan {h} h {min} min", "Lediga platser {n}".

### 6.3 Inflödesprognos (`/laget-nu/prognos`)

Sub-tab "Prognos". For each site in scope: a 24-hour bar timeline from 14:40 (hourly buckets): expected arrivals (arrivalsPerHour × scenario multiplier), expected admissions (× admissionShare), expected discharges (plannedDischargesToday × dischargeShareByHour for remaining hours today; tomorrow's planned discharges = same number from 10:00), elective admissions tomorrow 07–09, and the resulting free beds line. Table under it: "+4 h", "+12 h", "+24 h" with free beds and a warning chip "Brist" when negative. A sentence: "Beräknad brist: {n} platser kl {HH:MM} ({site})" for the first hour where free < 0, or "Ingen beräknad brist inom 24 h". All forecast values are `illustrative` (chip on the section heading). `forecast.ts` is pure and tested: with DATA.md profiles and baseline free beds (Solna 23, Huddinge 9), Huddinge goes negative before midnight and Solna does not; with multiplier 1,3 (scenario Tryck) Huddinge's deficit hour moves earlier — assert both in tests with the values the implementation computes.

### 6.4 Utskrivningsklara (`/laget-nu/utskrivningsklara`)

Sub-tab "Utskrivningsklara ({n})". Table (DATA.md § 5.3): Patient, Avdelning, Väntat (dagar), Väntar på, Åtgärd; footer "och ytterligare {total − 12} patienter". KPI strip: "Utskrivningsklara {total}", "Vårdplatser bundna {total}", "ASIH-kandidater {n}". Actions: "Till ASIH" (asihEligible only) → confirm dialog "Skicka ASIH-förfrågan för {patient}?" → status "ASIH-förfrågan skickad", after two clock ticks (or immediately on the next action) → "Utskriven": ward free +1, site lediga +1, utskrivningsklara −1, ASIH capacity −1, log "Utskriven till ASIH – {patient}"; toast "ASIH-förfrågan skickad". "Till geriatrik" (age ≥ 75, waitingFor Geriatrik) → same flow against the geriatrik class capacity (23 lediga, verified). Others: "Avvakta" removes nothing and logs a note. This is the Medoma bridge; the presenter will point at it.

### 6.5 Kapacitet (`/kapacitet`)

The first prototype's Command Center, renamed and rewired:

- Title "Kapacitet" + scope; sync chip and sources popover as before (sources: Journalsystem, HR, RIS, Operationsplanering, Logistik).
- **Vårdplatsstege** first, above the cards: the ladder of DATA.md § 3 for the scope, five horizontal bars proportional to fastställda, each labelled with step name, value and confidence chip, plus the sentence "{gap} platser finns lokalmässigt men saknar bemanning eller utrustning" (fastställda − disponibla normalvecka).
- Capacity cards for the scope: "Vårdplatser lediga", "IVA-platser lediga", "Operation – möjliga akuta operationer nu", "Bilddiagnostik – CT i drift", "Akuten – patienter nu", "Personal i tjänst" (illustrative), each with confidence chips.
- "Flaskhalsar" table from bottlenecks (Swedish rows written from DATA.md § 2 and § 4: postop-platser, anestesiteam, CT ur drift, IVA Huddinge fullt, transport, ASIH-flöde).
- "Vad begränsar vad" with capabilities per site: Akut operation, Intensivvård, Bilddiagnostik CT, Vårdplatser (components in DATA.md § 2 and § 4; the what-if toggle "Vad händer om" and reset as before).
- Region scope: node table (with classes) and a "Välj en nod" sentence as before.
- A button "Scenario" (secondary) at the top right opens the scenario panel (§ 7.3). When a scenario runs, an "Incidentmål" strip (as before) plus a "Scenario" strip showing the current tick's pools with brist in red.

### 6.6 Incident (`/incident`)

As before, in Swedish, with: playbooks PB1–PB5 (DATA.md § 8.2); activation dialog with an added select "Beredskapsläge" (Stabsläge default for PB2/PB3, Förstärkningsläge default for PB1/PB4/PB5); the incident header shows the beredskapsläge chip with a "Ändra" link (select); "Anmäl till TiB/RSSL" is a task, not a button. PB2 sets the EHR outage; PB4 navigates to Evakuering with the target "Patienter flyttade 60"; PB5's target counts in days (tick = 1 dygn when its scenario runs). Log tab label "Logg". Previous incidents "Tidigare incidenter". Channel thread as before; "Skapa förfrågan" link on received messages.

### 6.7 Evakuering (`/evakuering`)

As before, from the selected source site, in Swedish. Patients: 40 per site generated per the first prototype's constraints with wards from DATA.md § 5.1 and Swedish names; ages 24–91; 12 per site `homeCareEligible`. Destinations: the other Karolinska site; the six region hospitals (Capacity only sharing: free beds shown from the pack, IVA null → incompatible for Kritisk); Geriatrik class (Stabil, age ≥ 75); ASIH class (Home level, eligible); stood-up nodes. Transport: the Ambulanssjukvården node's vehicle pools (DATA.md § 6.1). Suggestion order and rules as before with these destinations: Kritisk → other Karolinska site IVA free; Övervakning → region hospitals by distance while free beds last; Stabil eligible → ASIH; Stabil age ≥ 75 → Geriatrik; other Stabil → nearest region hospital, then vårdhubb. Summary target from the incident. Map with ASIH circle.

### 6.8 Resurser (`/resurser`)

As before, Swedish labels, nodes incl. `ambulans`. Transport requests go to `ambulans` as "Från". Inventory shows the "Ej i tjänst" column for vehicles. Parser per DATA.md § 6.3; tests: msg-1 → 2 Ventilator → huddinge; msg-2 → 6 Syrgaskoncentrator → solna (author's node) with note; msg-3 → 4 Rullstol → huddinge.

### 6.9 Nätverk (`/natverk`)

Nodes table: Karolinska Solna, Karolinska Huddinge, the six region hospitals, the classes (Geriatrik, Sluten palliativ vård, Specialiserad rehabilitering, Psykiatri, ASIH), Ambulanssjukvården, stood-up nodes; columns Nod, Typ, Status, Disponibla/kapacitet, Lediga, IVA, Delning, Synk, Källa (chip). Map per DESIGN-KS.md § 8. "Etablera nod" with the preset sites of DATA.md § 2.7. Node detail as before with a "Källor" section listing the node's figures with confidence and source.

### 6.10 Källor (`/kallor`)

Per DESIGN-KS.md § 9, generated from the pack's `sources` and every Figure that references a source or basis. Anchors per source key. A short intro: "Alla uppgifter i demon är antingen verifierade mot öppna källor, rapporterade av Medoma, estimat med angiven grund eller illustrativa scenariovärden."

## 7. Cross-cutting

### 7.1 Confidence

Every Figure renders per DESIGN-KS.md § 4. Aggregates inherit the weakest confidence. The EHR outage flips `dataSource` EHR figures to Mirror and `estimate` as before, with the chip "Spegel".

### 7.2 Scenario clock

Single source of time. Manual: +1 min per user action. Running: +15 min per 2 s wall time while a scenario runs (PB5/pandemi: +1 dygn per 2 s), pausing automatically at the horizon and when a recommendation dialog is open. "Stega 15 min" advances one tick. "Återställ klockan" sets 14:40 and stops the scenario (keeps other state).

### 7.3 Scenario engine (`src/lib/scenario.ts`, pure)

`simulate(pack, state, params, applied) → { series, events, recommendations }` deterministic, tick-based (no randomness; integer distribution with carry).

Pools per site: `akutrum`, `overvakning`, `behandlingsrum`, `ct_slots` (scanners in operation × 2 per hour × tick/60), `or_slots` (capability capacity of Akut operation, per 2-hour slot), `iva`, `ima`, `vardplatser`, `blod_oneg`, and region-level `akutambulans`. Baseline capacity and occupancy from the pack (Solna Intensivakuten rooms illustrative: akutrum 6, övervakning 20, behandlingsrum 16; Huddinge verified 4/25/25).

**Masskada** (defaults DATA.md § 8.3): arrivals uniform over the window from the first arrival; routing red 100 % Solna; yellow 50 % Solna, 50 % Huddinge; green 30 % Solna, 40 % Huddinge, 30 % region (SÖS, DS). Demand per patient: röd → akutrum 60 min, CT 1 within 30 min, operation 50 % (120 min), IVA 60 % for the horizon (others to vårdplats after operation), blod 4 enheter for 50 %; gul → övervakning 120 min, CT 60 %, operation 20 % (90 min), vårdplats 80 %; grön → behandlingsrum 60 min, vårdplats 10 %. Events: first arrivals, each pool's first tick with demand > capacity ("+45 min: akutrum Solna fulla"), and each applied recommendation. Test: with defaults, IVA Solna demand exceeds capacity within 2 h (12 red × 60 % = 7 > 2 free); after applying `ima_overflow` (+6), IVA Solna demand ≤ capacity for the horizon.

**Tryck**: multiplies arrivals for the forecast only.

**Journalbortfall**: sets the outage at start and clears it at the horizon; activates PB2 if no incident is active.

**Mottagande**: 260 patients over 12 h arriving via Norrtälje; Karolinska share per params; the rest distributed to region hospitals by free beds; per tick, vårdplatser demand at each node; events when a node runs out; recommendation "Aktivera ASIH för utskrivningsklara" and "Etablera vårdhubb".

**Pandemi**: IVA demand +3 per day for 14 days across both sites; recommendation `o_huset` adds +64 IVA-platser over 10 days (linear); test that without it the deficit appears by day 3 and with it never.

**Siteevac**: no simulation; opens Evakuering with the target.

### 7.4 Recommendations (buttons in the scenario panel, each logged as authorised by Eva Lind)

| key | Label | Effect |
|---|---|---|
| forstarkning | Aktivera förstärkningsläge | activates PB1 with Förstärkningsläge (or sets the läge if PB1 is active) |
| katastrof | Gå till katastrofläge | sets läge Katastrofläge (only when skadade > 60 or the user chooses) |
| stryk_elektiv | Stryk elektiv operation | or_slots +4 per site; marks PB1 task done |
| ima_overflow | Öppna IMA som IVA-överflöd | iva +6 at the primary site; marks PB1 task done |
| asih | Utskrivningsklara till ASIH | moves all ASIH-eligible discharge-ready patients (13) → vårdplatser +13; ASIH capacity −13 |
| tidig_utskrivning | Tidigarelägg utskrivningar | vårdplatser +8 Solna, +10 Huddinge (illustrative) |
| omfordela | Omfördela gula patienter till SÖS och DS | moves 20 yellow to region nodes' free beds (respecting free counts) |
| transport | Begär transportambulanser | creates a request of 4 Transportambulans from `ambulans` (Hög) |
| vardhubb | Etablera vårdhubb Flemingsberg | stands up the preset node with 40 beds, Under uppstart → I drift after 4 ticks |
| o_huset | Bygg om O-huset till IVA | pandemi only: +64 IVA over 10 days |

Applicability is computed from the current bristar (e.g. `ima_overflow` applicable when IVA demand > capacity). Applied recommendations re-run the simulation from the current tick.

### 7.5 Audit log

As before, Swedish labels; scenario events are logged as actor "System".

## 8. Story chapters (Start page)

Each chapter button first resets the demo (so chapters are independent), then:

| # | Title | Description | Action |
|---|---|---|---|
| 1 | Vardag | "Läget nu på båda siter, i Stab Produktions egna mått." | scope `karolinska`, route `/laget-nu`, clock paused |
| 2 | Tryck | "Akuten i Huddinge går mot brist i kväll. Prognosen visar när, och vad som frigör." | scope `huddinge`, route `/laget-nu/prognos`, scenario `tryck` started, clock running |
| 3 | Masskada | "60 skadade till Traumacentrum Karolinska. Från larm till katastrofläge, med spårbara beslut." | scope `solna`, route `/kapacitet`, scenario panel open with `masskada` defaults, clock paused until "Starta" |
| 4 | Journalbortfall | "Journalsystemet faller. Driften fortsätter på den operativa spegeln." | scope `karolinska`, route `/kapacitet`, scenario `journalbortfall` started |
| 5 | Regional omfördelning | "260 patienter till regionen, som i Sjukvårdsövning 26. Nätverket som en kapacitet." | scope `region`, route `/natverk`, scenario `mottagande` armed with the panel open |

## 9. Batches and definition of done

One session, one branch, one commit per batch, in order.

### Batch 1 – Data pack, Swedish, shell, Start, Källor

Build: `packs/types.ts`, `packs/karolinska.ts` (all of DATA.md § 1–3, § 6–8 plus generated patients), `vocab.ts` in Swedish, number/date formatting, nav and scope per § 2, scenario clock control (manual and play/step/reset without the engine), Start page (chapters render; buttons set scope/route; scenario arming may be a no-op until Batch 3 but must not error), Källor page, confidence rendering everywhere, and rewiring of Kapacitet (with the ladder), Incident (PB1–PB5 activation with beredskapsläge), Evakuering, Resurser and Nätverk to the pack. Remove stubs and `mock.ts`.

DoD:
- [ ] Build, typecheck, tests pass; no English UI string remains (grep the rendered vocab and components for the first prototype's labels).
- [ ] Nav shows six modules at 16/500 with 32 px gap at 1280 px; logo → Start.
- [ ] Start shows five chapters and six key figures with the correct confidence chips (Fastställda → "Uppgift", Disponibla normalvecka → "Estimat", IVA/Medarbetare/Operationer/Slutenvårdstillfällen → none).
- [ ] Kapacitet ladder for Karolinska shows 1 600 / 1 070 / 915 / 1 038 / 32 with chips Uppgift / Estimat / none / Illustrativt / Illustrativt.
- [ ] Källor lists every S-key from DATA.md § 9 with a working anchor; every chip popover's "Visa i Källor" lands on its row.
- [ ] Nätverk shows 2 sites, 6 hospitals, 5 classes, Ambulanssjukvården; ASIH renders as a circle.
- [ ] Incident: activating PB1 shows the banner with "Förstärkningsläge"; PB2 turns on the outage; PB4 navigates to Evakuering.
- [ ] Old routes redirect.

### Batch 2 – Läget nu and the three tiles

Build § 6.1–6.4, `placement.ts` and `forecast.ts` with tests, live coupling to the store.

DoD:
- [ ] Läget nu at Karolinska scope shows the six blocks with Solna, Huddinge and sum; block statuses at baseline: Akuten Ansträngt (Huddinge väntar 17), Vårdplatser Kritiskt (Huddinge överbeläggningar 6), Operation Ansträngt (3 and 2 strukna), Bilddiagnostik Ansträngt, IVA/IMA Kritiskt (Huddinge 0 lediga och 2 väntar), Bemanning Ansträngt. At Solna scope: Akuten Normalt, Vårdplatser Ansträngt, IVA/IMA Ansträngt.
- [ ] Placing br-1 reduces HKN Kardiologi Huddinge free to 0 and "Väntar på vårdplats" Huddinge to 16; br-4 offers "Utlokalisera".
- [ ] Prognos shows a deficit hour for Huddinge and none for Solna; Tryck moves it earlier (values from the implementation, recorded in the PR).
- [ ] "Till ASIH" on dr-2 frees a bed in I&Å Internmedicin Huddinge and reduces ASIH capacity to 119.

### Batch 3 – Scenario engine, panel, recommendations, chapters

Build § 7.2–7.4, the scenario panel (DESIGN-KS.md § 7), chapter wiring (§ 8), Kapacitet scenario strip, PB5 day ticks.

DoD:
- [ ] Chapter 3: panel opens with masskada defaults; "Starta" runs; events list shows first arrivals at +20 min and the first IVA Solna brist within 2 h; `ima_overflow` becomes applicable and resolves it (test asserts the same).
- [ ] `forstarkning` activates PB1 and the banner shows Förstärkningsläge; `katastrof` changes the banner colour.
- [ ] `asih` frees 13 beds and Läget nu's Vårdplatser block reflects it.
- [ ] Chapter 4 turns on the outage, Kapacitet shows "Spegel" chips, and the horizon clears it.
- [ ] Chapter 5 at Region scope distributes 260 patients; the Nätverk table shows nodes running out; `vardhubb` stands up Flemingsberg and it appears in the scope selector.
- [ ] Pandemi test: deficit by day 3 without `o_huset`, none with it.

### Batch 4 – Polish, copy, README

Build: Swedish copy review of every string (sentence case, no English leftovers, correct abbreviations), number/date formatting sweep, empty states, keyboard access, dead-link sweep of every route (recorded in the PR), README in Swedish with the presenter script (five chapters, what to click, what to say about confidence chips), DECISIONS.md complete under "## KS build".

DoD:
- [ ] Build, typecheck, tests pass; sweep table in the PR; README script present; every figure on Start, Läget nu and Kapacitet has a confidence chip or is verified.

## 10. Out of scope

Real integrations, auth, persistence, mobile, the Karolinska logo, real staff names, any claim about Karolinska's internal KPIs beyond DATA.md, English UI toggle, i18n framework.

## 11. Hospital at Home

### 11.1 Purpose and route

A new module, key `home`, route `/home`, nav label "Sjukhus hemma" (sv) / "Hospital at Home" (en), placed in the nav directly after "Läget nu". It shows the patients cared for in their homes (ASIH / hospital at home, under the Karolinska scope) on a map together with the infrastructure they depend on, and answers one question fast: when something breaks – a bridge, a road, the power, the water – which patients are affected, which cannot be reached by car from the hospital, and who must be prioritised. All patient data is synthetic and marked "Fiktiva patientuppgifter" like the rest of the prototype.

The module respects the scope selector: reachability is computed from the sites in scope (`sitesInScope`); at Karolinska or region scope a patient is reachable if reachable from either Solna or Huddinge; if the scope yields no sites, use both.

### 11.2 Platform navigation

The nav gains the five existing Medoma platform modules as tabs before the prototype's modules, separated from them by a 1 px vertical divider, exactly as in the sibling repo Medoma-Resilience (Nav.tsx: `existing` then divider then `added`): keys `patients`, `activities`, `planning`, `employees`, `reporting`; en labels Patients, Activities, Planning, Employees, Reporting; sv labels Patienter, Aktiviteter, Planering, Medarbetare, Rapportering. Each renders a stub page: the page title and the sentence "This module exists in Medoma today and is outside the scope of this prototype." / "Den här modulen finns i Medoma i dag och ligger utanför prototypen." with a link to `/home` labelled "Go to Hospital at Home" / "Gå till Sjukhus hemma". All tabs must fit at the 1280 px minimum viewport without horizontal scroll; if they do not, collapse the five existing tabs into one overflow menu labelled "Medoma" and log the choice.

### 11.3 Data model (additions to `src/data/packs/types.ts`, additive only)

```ts
export type HomeEquipment = 'Oxygen' | 'IV infusion' | 'Monitoring' | 'Home ventilator' | 'Home dialysis';
export type ZoneId = string;

export interface HomeZone {           // a locality that patients live in and that outages are reported per
  id: ZoneId; name: LocalizedText; lat: number; lng: number; radiusKm: number;
  graphNode: GraphNodeId;             // the road-graph node the zone hangs on (usually itself)
  coordConfidence: Confidence; coordSource: string;
}

export interface HomePatient {
  id: string; familyName: string; givenName: string; age: number; zone: ZoneId;
  lat: number; lng: number;           // synthetic, within the zone radius
  team: string;                       // illustrative ASIH team name
  equipment: HomeEquipment[];
  batteryHours: number | null;        // null when no powered equipment
  visitToday: boolean;
  elCritical: boolean;                // derived: Oxygen, IV infusion or Home ventilator
  waterCritical: boolean;             // derived: Home dialysis
}

export type InfraLayer = 'water' | 'el' | 'roads';
export type InfraKind = 'waterworks' | 'reserve' | 'pumping' | 'transmission' | 'generation' | 'junction' | 'bridge' | 'tunnel';

export interface InfraNode {
  id: string; layer: InfraLayer; kind: InfraKind; name: LocalizedText; lat: number; lng: number;
  role: LocalizedText;                // two or three sentences
  status: LocalizedText;              // verification status text shown in the panel
  verified: boolean;                  // false renders the node hollow with a question mark
  coordConfidence: Confidence; coordSource: string;
  figures?: Figure[];                 // e.g. vehicles per day, each with confidence and source
}

export type GraphNodeId = string;     // an InfraNode id of kind junction/bridge/tunnel, a ZoneId, or a SiteId

export interface InfraLink {
  id: string; layer: InfraLayer; a: GraphNodeId; b: GraphNodeId;
  label: LocalizedText; style: 'solid' | 'dashed' | 'dotted' | 'road' | 'street';
  verified: boolean;                  // dashed/dotted or verified=false renders as schematic
  offmap?: { dir: 'N' | 'S' | 'E' | 'W'; text: LocalizedText };  // an arrow leaving the map instead of a second node
}

export interface HomeDisruptionPreset { key: 'bridge' | 'power' | 'water'; ... }  // see 11.5
```

`DataPack` gains `homeZones: HomeZone[]`, `homePatients: HomePatient[]`, `infraNodes: InfraNode[]`, `infraLinks: InfraLink[]`. Existing members are untouched. The road graph is the set of `infraLinks` with `layer: 'roads'`; its vertices are the two sites (`solna`, `huddinge`), the road InfraNodes and the zones.

### 11.4 Mock data

Zones (coordinates from Google Places, 2026-11-02, confidence `reported`; patient counts illustrative):

| id | name sv / en | lat | lng | radiusKm | patients |
|---|---|---|---|---|---|
| solna | Solna och Sundbyberg / Solna and Sundbyberg | 59.3597 | 18.0005 | 2.5 | 25 |
| innerstaden | Innerstaden norr / Inner city north | 59.3312 | 18.0407 | 2.0 | 20 |
| bromma | Bromma / Bromma | 59.3383 | 17.9401 | 2.5 | 15 |
| sodermalm | Södermalm / Södermalm | 59.3125 | 18.0616 | 1.8 | 15 |
| soderort | Söderort / Southern suburbs | 59.2986 | 18.0459 | 2.5 | 20 |
| huddinge | Huddinge / Huddinge | 59.2365 | 17.9818 | 2.5 | 20 |
| botkyrka | Botkyrka / Botkyrka | 59.1988 | 17.8332 | 2.5 | 10 |
| nacka | Nacka / Nacka | 59.3100 | 18.1648 | 2.5 | 10 |
| lidingo | Lidingö / Lidingö | 59.3661 | 18.1352 | 2.0 | 5 |
| taby | Täby / Täby | 59.4451 | 18.0717 | 2.5 | 10 |

Patients: 150, generated by extending `scripts/generate-patients.mjs` with a second seeded generator (seed 20261102) writing `packs/home-patients.ts`. Per patient: zone per the table; position uniform-sum (two uniforms) within the zone radius; equipment drawn with weights none 55 %, Monitoring 25 %, Oxygen 10 %, IV infusion 7 %, Home ventilator 3 %, plus Home dialysis independently 5 %; batteryHours Monitoring 10–24, Oxygen 2–6, IV infusion 6–12, Home ventilator 4–10, rounded; visitToday 40 %; team one of four illustrative names "ASIH Nord", "ASIH City", "ASIH Syd", "ASIH Sydväst" chosen by zone (Solna, Bromma, Lidingö, Täby → Nord; Innerstaden, Södermalm, Nacka → City; Söderort, Huddinge → Syd; Botkyrka → Sydväst). Names reuse the existing name lists. Nothing here is a real person.

Infrastructure nodes and links: exactly the tables in DATA.md § 11, which carry coordinates, confidence and sources. Coordinates marked `estimate` keep their basis text in `coordSource`. Role and status texts in DATA.md § 11 are the panel texts, translated to both languages.

### 11.5 Disruptions and impact

State lives in a new store slice `store-home.ts`: `layers: Record<InfraLayer | 'patients', boolean>` (defaults patients and roads on, el and water off), `mode: null | 'roads' | 'el' | 'water'`, `blockedLinks: Set<string>`, `blockedNodes: Set<string>`, `powerOutZones: Set<ZoneId>`, `waterOutZones: Set<ZoneId>`, `selectedNode: string | null`. All writes go through `logEntry()` like every other action.

Pure functions in `src/lib/reachability.ts`, fully unit-tested:

- `roadDistances(links, blockedLinks, blockedNodes, fromSites)` – breadth-first hop counts from the given sites over road links, skipping blocked links and links touching blocked nodes; returns the minimum hops per vertex.
- `zoneStatus(zones, baseline, current)` – `unreachable` when a zone's vertex has no distance, `delayed` when its distance exceeds the baseline distance computed with nothing blocked, else `ok`.
- `impact(pack, state, scopeSites)` – one row per affected patient with reasons: "cannot be reached by car", "reached via detour", "without power", "water disruption"; flags `unreachable`, `delayed`, `power`, `water`; plus a summary: affected count (unreachable, power or water), detour count, unreachable count and their zones, how many of them have a visit today and how many are el- or water-critical, power-out count and the shortest battery among el-critical patients, water-out count and dialysis count.
- `prioritise(rows)` – order: unreachable with visit today, then power-out el-critical by battery ascending, then water-out dialysis, then unreachable, then detour; ties by battery ascending.

Map interaction by mode: in `roads` mode a tap on a road node (junction, bridge, tunnel) or a road link toggles it blocked (links get a 14 px transparent hit path); in `el` or `water` mode the zones render as translucent circles and a tap toggles the zone's outage; with no mode a tap on any infrastructure node selects it and dims everything it is not linked to. Blocked elements render in the accent (danger) colour; outage zones fill accent at low opacity. Patient dots: 2 px neutral at 30 % opacity; affected filled accent; affected and critical hollow accent ring; detour-only amber. A "Reset" chip clears all disruptions.

Three scenario presets of the flag-setting kind (like tryck and journalbortfall, no ticks) are added to the scenario strip: "Bro avstängd" / "Bridge closed" blocks Essingeleden and Centralbron; "Elavbrott" / "Power outage" sets power out in Söderort and Huddinge; "Vattenstörning" / "Water disruption" sets water out in Solna. Each navigates to `/home`.

### 11.6 Layout and panel

Three-pane layout like Evakuering: left 380 px patient list, middle 320 px panel, right map (`NodeMap` extended, not forked: layer toggles as chips above the map, infrastructure layers as Leaflet layers, zones as circles, patient dots as `CircleMarker`). Legend under the map: patient, affected, affected and critical, detour, verified link, schematic link, bridge.

Left list: one row per patient (name, age, zone, team, equipment with battery, visit-today badge), grouped by zone, filters: zone, equipment, visit today, affected only. When disruptions are active the list is ordered by `prioritise` and rows show their reasons and a "Prioritise" badge for critical rows.

Middle panel: with no disruption and a selected infrastructure node, its layer tag, name, role, "Linked to" list and status (status in danger colour when `verified` is false). With disruptions: active disruptions as text with a reset link, the headline "N of 150 patients affected" (plus ", M reached via detour"), the summary facts as a short list, then nothing else – the ordered patients are in the left list. With a mode selected and no disruption yet: the mode's instruction sentence.

### 11.7 Batches and definition of done

Batch 0 – docs. This section in SPEC.md, § 11 in DATA.md, the prompt in PROMPTS.md. Done when: both files contain the sections verbatim; typecheck, tests and build unaffected.

Batch 1 – data model and mock data (additive). Types in 11.3; generator and `home-patients.ts`; zones, infrastructure nodes and links from DATA.md § 11 in `karolinska.ts`; `loadPack()` returns them; pack test extended: 150 patients, counts per zone as in 11.4, every InfraLink endpoint resolves to a site, a road node or a zone, every node has a coordSource. Done when: tests pass including the new ones; nothing in the UI changes.

Batch 2 – infrastructure layers on the map (additive). `NodeMap` extended with optional props for infrastructure layers, zones and patient dots; layer toggle chips; the `/home` route rendering only the map pane with the three layers and patients, no list and no panel yet; the nav tab for `home`. Done when: all three layers toggle; verified links solid, schematic dashed; unverified nodes hollow with "?"; off-map arrows render with their text; dark mode and both languages correct on this page.

Batch 3 – module and platform navigation (additive). The three-pane layout, the patient list with filters, the node panel on selection, and 11.2 in full. Done when: list filters work; selecting a node dims the rest and shows role, links and status; the five platform tabs and divider render at 1280 px; the stub pages link to `/home`; DESIGN tokens only, no new colours.

Batch 4 – disruptions and reachability (behaviour-changing, own batch). `store-home.ts`, `reachability.ts` with tests for roadDistances, zoneStatus, impact and prioritise (including: blocking Essingeleden alone leaves Söderort reachable via Centralbron or Västerbron; blocking Essingeleden, Centralbron, Västerbron, Liljeholmsbron and Skanstullsbron makes every zone south of Saltsjö–Mälaren unreachable from Solna but not from Huddinge; a power outage in Huddinge flags exactly the Huddinge patients), map interaction by mode, the result panel, the ordered list. Done when: the five test cases above pass; blocking and unblocking on the map updates patients and panel immediately; reset clears everything; audit log records each toggle.

Batch 5 – presets, parity, polish (additive). The three presets in 11.5; vocab parity test covers every new key; screenshots of `/home` in light and dark and in English under `docs/screenshots/home/`; README demo story gains a step 6 for Hospital at Home. Done when: presets navigate and set state; parity test passes; screenshots exist; typecheck, tests and build pass on the branch.

## 12. Real geography and preparedness mode

### 12.1 Purpose

§ 11 drew the road network as a hand-made corridor graph and placed half of the transmission nodes by estimate. This section replaces both with real geometry from OpenStreetMap so that the map, the bridges and the reachability computation match the Stockholm a preparedness officer knows. Patients stay synthetic, but they now live on real residential streets. Nothing in § 11's interaction model changes; what changes is the data underneath and the graph the reachability runs on. § 12.7 then gives the navigation two states, so that the resilience modules are hidden in normal operation and come forward in preparedness mode.

### 12.2 Data files

`scripts/fetch-osm.mjs` (Node, no dependencies beyond the repo's) runs the Overpass queries in `scripts/overpass/*.overpassql`, converts the answers to GeoJSON, simplifies line geometry with Douglas–Peucker at 8 m tolerance, drops every tag not listed below, and writes:

* `src/data/packs/geo/roads.json` – ways with `highway` in motorway, motorway_link, trunk, trunk_link, primary, primary_link, secondary, secondary_link inside bbox 59.15, 17.65, 59.52, 18.30. Properties kept: `id` (OSM way id), `highway`, `name`, `ref`, `bridge` (true/false), `tunnel` (true/false), `oneway` (true/false), `lanes`. Budget 2.5 MB.
* `src/data/packs/geo/streets.json` – ways with `highway` in residential, living_street within 2 500 m of each zone centre in § 11.4 (one query with ten `around` clauses). Properties: `id`, `name`. Used only to place patients. Budget 1.0 MB.
* `src/data/packs/geo/power.json` – `power=substation` nodes and ways (as centroid points) with `voltage` matching 400000 or 220000, and `power=line` ways with `voltage` matching 400000 or 220000, inside bbox 59.10, 17.50, 59.60, 18.40. Properties: `id`, `power`, `name`, `operator`, `voltage`. Budget 0.4 MB.
* `src/data/packs/geo/water.json` – `man_made=water_works` nodes and ways (centroids) in the same bbox. Properties: `id`, `name`, `operator`.
* `src/data/packs/geo/README.md` – source, query date, bbox, simplification, and the ODbL attribution "© OpenStreetMap contributors, ODbL".

The queries, verbatim:

```
// roads.overpassql
[out:json][timeout:180];
way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link)$"](59.15,17.65,59.52,18.30);
out body geom;

```


```
// power.overpassql
[out:json][timeout:120];
(
  node["power"="substation"]["voltage"~"400000|220000"](59.10,17.50,59.60,18.40);
  way["power"="substation"]["voltage"~"400000|220000"](59.10,17.50,59.60,18.40);
  way["power"="line"]["voltage"~"400000|220000"](59.10,17.50,59.60,18.40);
);
out body geom;

```


```
// water.overpassql
[out:json][timeout:60];
(
  node["man_made"="water_works"](59.10,17.50,59.60,18.40);
  way["man_made"="water_works"](59.10,17.50,59.60,18.40);
);
out body geom;

```


```
// streets.overpassql – one around clause per zone, lat/lon from SPEC § 11.4
[out:json][timeout:180];
(
  way["highway"~"^(residential|living_street)$"](around:2500,59.3597,18.0005);
  way["highway"~"^(residential|living_street)$"](around:2500,59.3312,18.0407);
  way["highway"~"^(residential|living_street)$"](around:2500,59.3383,17.9401);
  way["highway"~"^(residential|living_street)$"](around:2500,59.3125,18.0616);
  way["highway"~"^(residential|living_street)$"](around:2500,59.2986,18.0459);
  way["highway"~"^(residential|living_street)$"](around:2500,59.2365,17.9818);
  way["highway"~"^(residential|living_street)$"](around:2500,59.1988,17.8332);
  way["highway"~"^(residential|living_street)$"](around:2500,59.3100,18.1648);
  way["highway"~"^(residential|living_street)$"](around:2500,59.3661,18.1352);
  way["highway"~"^(residential|living_street)$"](around:2500,59.4451,18.0717);
);
out body geom;

```

The files are loaded with dynamic `import()` from the `/home` route only, so the initial bundle does not grow. Map attribution gains the ODbL text beside the tile attribution.

### 12.3 Road graph

`src/lib/roadGraph.ts` builds a graph from `roads.json` at load: a vertex for every coordinate shared by two or more ways and for every way end; an edge per way segment between vertices, weighted by haversine length in metres, with `wayId`, `name`, `ref`, `bridge`, `tunnel`, `oneway`; one-way ways give directed edges, all others two directed edges. The two sites and every patient are attached to the graph by snapping to the nearest vertex within 1 500 m (`snapDistance` stored; a patient beyond that is flagged `unsnapped` and treated as unreachable with reason "no road within 1.5 km"). Patients snap to the nearest vertex of the main-road graph; `streets.json` is not part of the graph.

`src/lib/reachability.ts` is rewritten to run Dijkstra by length from each site in scope. Baseline distances are computed once per pack load and memoised. Blocking removes edges: a blocked way id removes all its edges; a blocked road name removes every way sharing that `name` (and `ref` when both are present); a blocked InfraNode of kind bridge/tunnel/junction removes the ways listed in its new `osmWayNames` field (§ 12.5). Status per patient: `unreachable` when no path from any site in scope; `delayed` when the shortest path is at least 25 % longer or 3 km longer than baseline; else `ok`. Zones keep their role for power and water outages only. `impact` and `prioritise` keep their signatures and semantics from § 11.5; `zoneStatus` is replaced by per-patient status and removed.

### 12.4 Interaction and tests

In `roads` mode the map shows `roads.json` as one Leaflet GeoJSON layer: motorway and trunk 3 px, primary 2.5 px, secondary 2 px, bridges with a 1 px lighter casing, tunnels dashed. A tap on a segment blocks that way; the mode bar gets a switch "Block whole road" / "Blockera hela vägen" which makes a tap block every way sharing the name. Blocked ways render in the accent colour. The named InfraNodes from § 11.3 remain as markers for the panel and block their `osmWayNames` set when tapped. The corridor links of § 11.3 are deleted from the pack; the water and el links stay.

The five test cases of § 11.7 batch 4 are rewritten against the real graph:

1. At baseline from Solna and from Huddinge, at least 95 % of patients snap within 1 500 m and have a path.
2. Blocking every way named "Essingeleden" leaves at least one patient in Söderort reachable from Solna without detour via Huddinge (that is, with scope Solna only).
3. Blocking the crossing set – every way named Essingeleden, Västerbron, Centralbron, Munkbroleden, Skeppsbron, Söderledstunneln, Katarinavägen, Stadsgårdsleden – makes every patient in Södermalm, Söderort, Huddinge, Botkyrka and Nacka unreachable from Solna. If the test finds a remaining path, it must print the way names on that path and fail; the missing crossing is then added to the set in the test and in DECISIONS.md, not worked around.
4. The same crossing set leaves every patient in Huddinge and Botkyrka reachable from Huddinge.
5. A power outage in Huddinge flags exactly the Huddinge patients.

Tests use the committed GeoJSON; if it is absent (Overpass unreachable), they run against `src/data/packs/geo/fixture.json`, a hand-written graph of twenty ways with the same schema, and the PR description says so.

### 12.5 Node coordinates from OSM

`power.json` replaces the estimate coordinates in DATA.md § 11.2: the InfraNodes Överby, Beckomberga, Hagby and Skanstull take the centroid of the OSM substation whose `name` matches (case-insensitive, substring), and a new node Kolbotten is added the same way. Where no match exists the node keeps its estimate and the mismatch is logged. 400 kV and 220 kV lines from `power.json` are drawn in the el layer as polylines labelled by voltage, replacing the hand-drawn el links between nodes (the off-map arrows stay). `water.json` replaces the Görväln estimate with the matched water works centroid. Coordinate confidence for every replaced node becomes `reported` with source "OpenStreetMap, <query date>"; DATA.md § 11 is updated in place and the estimate basis text deleted. InfraNode gains `osmWayNames: string[]` for road nodes (Essingeleden → ["Essingeleden"], Västerbron → ["Västerbron"], Centralbron → ["Centralbron"], Liljeholmsbron → ["Liljeholmsbron"], Skanstullsbron → ["Skanstullsbron"], Norra länken → ["Norra länken"], Södra länken → ["Södra länken"]).

Patients are re-placed by the generator (same seed): each patient lands on a random vertex of a random `streets.json` way within its zone's radius, and gains `street: string` (the way's name) and `houseNo: number` (illustrative, 1–60). The list shows "Street 12" with the existing "Fiktiva patientuppgifter" marking.

### 12.6 Batches and definition of done

Batch 6 – docs, fetch script and data files. Done when: § 12 is in SPEC.md and DATA.md; the script runs end to end and the four GeoJSON files exist within budget, or the fallback in the prompt is in place; README.md in geo/ carries the attribution; typecheck, tests and build pass.

Batch 7 – road graph and reachability (behaviour-changing, own batch). `roadGraph.ts`, the rewritten `reachability.ts`, snapping, the five tests. Done when: tests pass on the real data or on the fixture; a tap on a segment or a named road blocks and unblocks; the panel and list respond as in § 11.6; the corridor links are gone.

Batch 8 – el and water nodes from OSM (additive). § 12.5 for nodes and lines; DATA.md § 11 updated. Done when: no el node renders hollow except e-regionnat; Kolbotten exists; lines render with voltage labels; pack test checks every InfraNode's coordSource.

Batch 9 – patients on streets, polish. Generator change, `street`/`houseNo`, list text, map attribution, the map on `/home` fits its bounds to the zones on load (`fitBounds` with 24 px padding) so zone labels do not collide, screenshots in `docs/screenshots/home/` refreshed, README demo story step 6 updated to mention the real map. Done when: 150 patients lie on streets; the map opens fitted to the zones; parity test passes; typecheck, tests and build pass on the branch.

Batch 10 – preparedness mode (behaviour-changing, own batch, last). § 12.7 in full; the 2 100 px breakpoint and its width-tuned gaps are removed; DECISIONS.md records the removal. Done when: at 1 280 px both nav states fit in sv and en; the button and the close control work with the rules in § 12.7; activating an incident and running a scenario each turn the mode on; opening `/home` directly turns it on; the audit log shows each change with its reason; typecheck, tests and build pass.

### 12.7 Preparedness mode

The navigation has two states instead of a viewport breakpoint. The viewport-based collapse at 2 100 px from § 11.2 is removed.

Normal operation (default): logo, scope selector, the five Medoma platform tabs as tabs, the divider, and one outlined button "Beredskap" / "Preparedness". No resilience module is in the nav. The right cluster keeps the clock, language, theme, Demo and user; the scenario controls (play, step, reset) are hidden. The root route redirects to `/patients`.

Preparedness mode: logo, scope selector, one menu "Medoma" holding the five platform entries, the divider, then Läget nu, Sjukhus hemma, Kapacitet, Incident, Evakuering, Resurser and Nätverk as tabs. The button becomes a filled indicator in the accent colour "Beredskapsläge" / "Preparedness mode" with a close control. The scenario controls are shown. The root route redirects to `/start`. Both states must fit at 1 280 px in both languages without horizontal scroll.

Activation. `preparednessActive(state, route)` is a pure function in `src/lib/preparedness.ts`: true when the manual flag is on, or an incident is active, or a scenario is running, or the current route belongs to a resilience module (`/start`, `/home`, `/capacity`, `/incident`, `/evacuation`, `/resources`, `/network` and their children; use the module list, not a hard-coded set). The manual flag `preparednessOn: boolean` lives in the main store, defaults to false, and every change goes through `logEntry()` with the reason "manual", "incident", "scenario" or "route". The Beredskap button sets the flag on and navigates to `/start`. The close control sets the flag off and, if the current route is a resilience route, navigates to `/planning`; if an incident is active or a scenario is running the close control is disabled with a tooltip "Avsluta incidenten eller scenariot först" / "End the incident or scenario first". The scenario presets of § 11.5 therefore open the mode by navigating. A reload on a resilience route keeps the mode because the route alone makes it active.

Tests: `preparednessActive` for each of the four reasons and for none; the nav renders the platform tabs and no resilience tab when inactive, and the reverse when active; vocab parity for the new keys.

## 13. Time and work in Hospital at Home

### 13.1 Purpose

§ 11–12 answer who is affected right now. This section adds the clock, so that a six-hour power outage changes the picture hour by hour, and the work: what the team does about each affected patient, logged like everything else. A disruption can also be created from an incoming message, as resource requests are today.

### 13.2 Disruptions in time

A disruption is now a record in `store-home.ts`, not only a flag: `{ id, kind: 'road' | 'power' | 'water', target: string (way id, road name, InfraNode id or ZoneId), label: LocalizedText, startedAt: clock minutes, expectedEnd: clock minutes | null, source: 'map' | 'preset' | 'message', createdBy: user }`. The sets `blockedLinks`, `blockedNodes`, `powerOutZones`, `waterOutZones` are derived from the active records, so § 11–12 keep working unchanged. A record whose `expectedEnd` is reached by the clock becomes inactive automatically and is logged as "ended (expected)". Each record shows in the panel with its start time and either "ends about HH:MM" / "slut cirka HH:MM" or "no end time" / "ingen sluttid", and a control to end it now.

The shared store clock (the one in the header) is the only time. The `/home` mode bar gets a "+1 h" / "+1 h" control that advances the shared clock by 60 minutes through the existing clock action and logs it; the scenario controls, when a scenario is running, advance it as they do today, and `/home` recomputes on every change.

Battery: for a patient in a power-out zone with `batteryHours`, `batteryEmptyAt = startedAt + batteryHours × 60` (clock minutes, from the earliest active power disruption covering the zone). Status text: "battery until HH:MM" / "batteri till HH:MM"; when the clock has passed it, "battery empty" / "batteri slut" and the row is treated as critical regardless of equipment. The summary gains "N run out within 2 h" / "N får slut inom 2 h". `prioritise` sorts power-out rows by `batteryEmptyAt` ascending instead of `batteryHours`.

### 13.3 Actions per patient

Each affected patient gets a status chain in the style of Evakuering (`StatusChain`): Unhandled → Contacted → Planned → Confirmed ("Ohanterad", "Kontaktad", "Planerad", "Bekräftad"). Actions, each a button in the row's expanded view and each logged with the user, time and patient id:

* Contact / Kontakta – note field (one line), sets Contacted.
* Move visit / Flytta besök – only for `visitToday`; pick a new slot from the patient's team's free slots (§ 14.3) or "no visit today" / "inget besök i dag"; sets Planned.
* Send team / Skicka team – pick a team that can reach the patient (§ 14.2); sets Planned and records the team on the patient (`assignedTeam`).
* Bring in / Ta in – marks the patient for transfer to the site in scope; sets Planned; appears in the Evakuering module as an inbound line "From home" / "Från hemmet" in the patient list, without a move record (log the decision on how it is shown).
* Confirm / Bekräfta – sets Confirmed.

A bulk control above the list, "Contact all critical" / "Kontakta alla kritiska", sets Contacted on every critical row with the note "bulk contact". Status resets to Unhandled only when the disruption that affected the patient ends; the log keeps the history. A "Call list" / "Ringlista" control opens a print view (plain, A4, @media print) of the prioritised rows with name, street, phone-shaped placeholder "0XX-XXX XX XX", equipment, battery time, status and an empty line for notes; the view carries the fictitious-data marking.

### 13.4 Disruption from message

Like Resources → From message. The pack gains `homeMessages: Message[]` (reuse the existing `Message` type and `MessageThread` component) with three illustrative notices in both languages: a road notice ("Trafikverket: Essingeleden avstängd i båda riktningarna efter olycka vid Fredhäll, beräknad tid 4 timmar"), a power notice ("Ellevio: strömavbrott i delar av Huddinge, beräknad återställning 20:30") and a water notice ("Stockholm Vatten och Avfall: kokningsrekommendation i Solna tills vidare"). Senders are fictitious persons at those organisations; the organisation names are real and the texts are illustrative, which DATA.md § 13 states.

A tab "From message" / "Från meddelande" in the `/home` middle panel lists the messages; opening one prefills a form: kind, target (road name matched against `roads.json` names, zone matched against zone names), start (now), expected duration in hours (parsed when the text contains "N timmar" / "N hours" or a clock time, else empty), and a note with the message id. Create makes a disruption record with `source: 'message'`. Nothing is created automatically; the user confirms.

### 13.5 Läget nu

The start page gets one card "Hospital at Home" / "Sjukhus hemma" in the existing card style: patients at home, affected now, unreachable, battery empty within 2 h, each as a Figure with confidence `illustrative`, and a link to `/home`. Visible only in preparedness mode, like the other resilience content.

### 13.6 Batches and definition of done

Batch 11 – docs (§ 13, § 14 in SPEC.md; § 13, § 14 in DATA.md; the prompt). Done when: present verbatim; nothing else changed.

Batch 12 – disruptions in time (behaviour-changing, own batch). Records, derived sets, expected end, the "+1 h" control, battery deadlines, summary and sorting. Tests: a disruption with expectedEnd ends when the clock passes it; a battery deadline is computed from the earliest covering power disruption; prioritise orders by batteryEmptyAt. Done when: a preset power outage shows battery times; "+1 h" moves them to empty; ending a disruption restores the rows; the audit log shows every step.

Batch 13 – actions (behaviour-changing, own batch). Status chain, the five actions, bulk contact, call list print view, the Evakuering inbound line. Tests: each action sets the right status and logs; status resets when the disruption ends. Done when: a critical row can be taken Unhandled → Confirmed in the app; the print view renders; the inbound line appears in Evakuering.

Batch 14 – from message and Läget nu (additive). § 13.4 and § 13.5. Done when: each of the three messages prefills a correct form; creating from the road message blocks the named road; the Läget nu card shows live figures and links.

## 14. Teams, the platform tabs and a second hospital

### 14.1 Purpose

The question moves from "who can be reached" to "who can reach whom". The Planning tab stops being a stub and shows today's home visits with disruption flags, which is where this function would live in Medoma Center. A second home pack, SUS Lund, shows that nothing is Karolinska-specific.

### 14.2 Teams and cars

The pack gains `homeTeams: HomeTeam[]`: `{ id, name, baseLat, baseLng, baseLabel: LocalizedText, cars: number, phone: string (placeholder) }`. Four teams, bases illustrative at zone centres: ASIH Nord at Solna, ASIH City at Innerstaden norr, ASIH Syd at Söderort, ASIH Sydväst at Botkyrka; two cars each. Bases snap to the road graph like sites. `reachability.ts` gains `teamDistances(graph, team, blocked)` and `impact` gains per patient `reachableBy: TeamId[]` and `nearestTeam: TeamId | null` (by road length). Team markers render on the map in all modes as small squares in the team's colour from the existing node palette, with the base label; blocking updates `reachableBy` live.

The summary gains "N patients whose own team cannot reach them; M of them reachable by another team" / "N patienter som det egna teamet inte når; M av dem nås av annat team". The middle panel, under the summary, lists reassignment suggestions: for each such patient "Reassign to <team>" / "Flytta till <team>", which performs the Send team action from § 13.3. The scope selector does not filter teams; all four are shown at every scope.

### 14.3 Visits and the Planning tab

Patients with `visitToday` get a visit `{ id, patientId, teamId, start: clock minutes (08:00–17:00 in 30-minute steps, deterministic from the seed), durationMin: 45, status: 'planned' | 'moved' | 'cancelled' | 'done' }` in `homeVisits`. Free slots per team are the 30-minute steps 08:00–18:00 not used by its visits; Move visit (§ 13.3) picks among them.

`/planning` becomes a real page in the platform's three-pane style (list 380 px, pane, map): visits grouped by team and sorted by start, each row with time, patient, street, equipment, and when preparedness mode is on, the disruption flag (unreachable, detour, power, water) in the accent colour; selecting a visit shows the patient's details and the actions of § 13.3; the map shows the team's visits as a numbered sequence with the road layer. Without preparedness mode the page is the same minus the flags and the disruption actions, which is the point: the view exists in normal operation and gains the resilience layer when the mode is on. Drag is not required; "Move visit" is the only way to change a slot.

`/patients` becomes a list of the 150 home patients in the platform list style (name, age, street, team, equipment), with the row opening the same detail pane as `/home`; `/activities`, `/employees` and `/reporting` stay stubs.

### 14.4 Audit and roles

Every action from § 13.3 and § 14.2 is attributed to `CURRENT_USER`; the log drawer filters by "Hospital at Home" / "Sjukhus hemma". No new roles.

### 14.5 Second home pack: SUS Lund

Home data is separated from the hospital pack: `homePacks: Record<HomePackId, HomePack>` with `HomePack = { id, name, sites: Array<{ id, name, lat, lng }>, zones, patients, teams, visits, infraNodes, infraLinks, messages, geo: { roads, streets, power, water } (dynamic imports) }`. `karolinska` is the data built so far (sites Solna and Huddinge, reachability sites from scope as before). `lund` is a new pack from DATA.md § 14 with one site, SUS Lund; with the Lund pack active, reachability runs from that site and the scope selector is ignored for `/home` and `/planning` (shown dimmed with a tooltip "Not applicable to SUS Lund" / "Gäller inte SUS Lund"). A pack switch "Hospital" / "Sjukhus" in the `/home` mode bar selects the pack; the choice is in the store and logged. `scripts/fetch-osm.mjs` takes a pack id and bbox and writes under `src/data/packs/geo/<pack>/`; the Karolinska files move there and all imports follow. Lund bbox 55.58, 12.84, 55.93, 13.74; streets around the seven Lund zones. The Lund patients: 150 as in DATA.md § 14, two teams ASIH Lund Nord and ASIH Lund Syd, bases at Lund centrum and Staffanstorp, two cars each.

Lund tests: at baseline at least 95 % of Lund patients snap and have a path from SUS Lund; a power outage in Dalby flags exactly the Dalby patients; blocking every way named "Trafikplats Lund Norra" and "Trafikplats Lund Södra" (OSM names; if those names do not exist in the data, the test prints the ways within 300 m of the two InfraNodes and uses their names, logging it) makes every patient outside Lund delayed or unreachable from SUS Lund.

### 14.6 Batches and definition of done

Batch 15 – teams and cars (behaviour-changing, own batch). § 14.2. Tests: a patient's nearestTeam at baseline; blocking the crossing set of § 12.4 makes Söderort patients reachable only by ASIH Syd and Sydväst from their bases. Done when: team markers render; reassignment suggestions appear and perform Send team; summary line correct.

Batch 16 – visits, Planning and Patients tabs (additive). § 14.3 and § 14.4. Done when: `/planning` shows visits per team with flags in preparedness mode and without them in normal mode; Move visit changes a slot and the sequence on the map; `/patients` lists 150 patients; parity test passes.

Batch 17 – SUS Lund home pack (additive). § 14.5, DATA.md § 14, the fetch script per pack, the switch. Done when: the switch changes patients, infrastructure, teams and map extent; Lund tests pass on real data or fixture; Karolinska behaviour unchanged (all earlier tests pass untouched).

Batch 18 – polish. Screenshots of `/home`, `/planning` and `/start` in both modes, both languages, light and dark under `docs/screenshots/`; README demo story rewritten as one continuous story: open Medoma Center, press Beredskap, see Läget nu, open Sjukhus hemma, create the road disruption from the message, press +1 h twice, contact the critical, move a visit in Planning, switch to SUS Lund; DECISIONS.md complete. Done when: screenshots exist; the story runs end to end in the app; typecheck, tests and build pass.
