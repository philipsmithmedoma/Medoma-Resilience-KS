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
