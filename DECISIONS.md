# DECISIONS.md – decision log

Append-only. One entry per decision the spec did not make for you. Newest at the bottom. Never edit or remove earlier entries; if a decision is reversed, add a new entry that says so.

Format:

```
## YYYY-MM-DD – Batch N – <short title>
Decision: <what was chosen>
Rejected: <the alternative(s) and why not>
Spec: <section this relates to, e.g. SPEC.md § 6.3>
```

Pre-filled decisions made by the spec author (not by the build agent):

## 2026-09-04 – Spec – Existing modules first in the navigation
Decision: The five existing modules keep the platform's order at the left; the five new modules follow after a divider. The app opens on Command Center.
Rejected: New modules first – would break the "same product, grown" story the nav is meant to tell.
Spec: SPEC.md § 2.1

## 2026-09-04 – Spec – Decorative nav icons are not buttons
Decision: The chat, headset and book icons in the nav are non-focusable spans with titles, so the "no dead buttons" rule holds without inventing behaviour for existing features.
Rejected: Buttons opening "outside scope" popovers – adds clicks that lead nowhere.
Spec: DESIGN.md § 3

## 2026-09-04 – Spec – Fixed demo clock that advances per action
Decision: The clock is fixed at 14:40 and advances one minute per state-changing action, so timestamps in the log stay readable and the demo is deterministic.
Rejected: Wall-clock time – makes screenshots and rehearsals non-reproducible.
Spec: SPEC.md § 0, § 4

## 2026-09-04 – Spec – English UI, Swedish data values, English date words
Decision: All labels English; people, places, hospitals and teams Swedish as given; dates rendered in English ("Friday 4 September") rather than the platform's Swedish locale strings.
Rejected: Mirroring the platform's mixed locale – would require a locale layer the prototype does not need.
Spec: SPEC.md § 5, DESIGN.md § 2

## 2026-09-04 – Spec – OpenStreetMap tiles instead of Mapbox
Decision: Leaflet with OpenStreetMap standard tiles; no API key.
Rejected: Mapbox as in the platform – needs a token and an account; visual difference is acceptable for a prototype.
Spec: DESIGN.md § 4

## 2026-09-04 – Batch 1 – shadcn/ui components vendored from the shadcn repository instead of the CLI
Decision: `npx shadcn init` could not reach `ui.shadcn.com` from the build environment (network policy), so the component files for button, dialog, sheet, dropdown-menu, select, tabs, table, input, textarea, checkbox, switch, tooltip, popover, progress and sonner were fetched from the shadcn/ui repository's `new-york-v4` registry (the same files the CLI would copy) into `src/components/ui/`, with their runtime dependencies `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner` and the dev dependency `tw-animate-css`. Tailwind CSS v4 (the version the current CLI installs) with `@tailwindcss/vite`. The files were then restyled to DESIGN.md (sizes, radii, borders, focus ring) and `next-themes` was dropped from the toaster.
Rejected: Writing the components from scratch – would diverge from shadcn's accessibility behaviour; waiting for network access – nobody will grant it.
Spec: SPEC.md § 1

## 2026-09-04 – Batch 1 – Toolchain versions
Decision: Vite 7, TypeScript 5.9, React 18.3, react-router-dom 6, zustand 5, react-leaflet 4 with leaflet 1.9, vitest 3. Toasts use sonner (the shadcn-recommended option). `npm run typecheck` runs `tsc --noEmit` on both the app and node projects.
Rejected: React 19 / Vite 8 as scaffolded by `create-vite` – SPEC.md § 1 names React 18 and react-leaflet 4 does not support React 19.
Spec: SPEC.md § 1

## 2026-09-04 – Batch 1 – Nav sized to fit 1280 px
Decision: With ten module tabs, the scope selector and the full right cluster, DESIGN.md's 16/500 tabs with a 32 px gap need about 1 530 px. The tabs are rendered 15/500 with a 12 px gap; the scope name is capped at 200 px with an ellipsis (full name in the title); the three decorative icons and the user's name beside the avatar are shown only from 1440 px (the avatar carries the name as its title). Everything else in DESIGN.md § 3 is unchanged.
Rejected: A horizontally scrolling nav or wrapping tabs – both break the platform look; a smaller tab font – harder to read for the audience.
Spec: DESIGN.md § 3, CLAUDE.md § Hard constraints (1280 px)

## 2026-09-04 – Batch 1 – Clock and staleness arithmetic
Decision: The clock is stored as minutes since 00:00. "Older than 30 minutes" means strictly more than 30 minutes between the figure's time and the clock, so Ekhaga vårdhubb (14:10) becomes Delayed at 14:41 and Fältsjukhus Alfa (13:55) is Delayed from 14:40, as SPEC.md § 5.2 describes.
Rejected: "30 minutes or more" – would make Ekhaga Delayed already at 14:40, contradicting § 5.2.
Spec: SPEC.md § 5.2, § 7.1

## 2026-09-04 – Batch 1 – Extra node fields for the Command Center cards
Decision: `CareNode` gains two optional prototype fields: `emergencyDepartment` (slots 40, in use 31 as a Figure from EHR 14:38) and `staffBreakdown` (38 doctors, 112 nurses, 96 assistant nurses, 7 other), both only on Vikby sjukhus. Transport vehicles carry an optional `seats` number. The CT queue (9 waiting, median 95 min) is a constant `CT_QUEUE` in mock.ts and the five Vikby sources are `VIKBY_SOURCES`.
Rejected: Hard-coding these numbers in the card components – SPEC.md § 7.5 forbids hard-coded numbers in components.
Spec: SPEC.md § 3, § 6.1.1

## 2026-09-04 – Batch 1 – Patient generation choices
Decision: Six Critical patients but only two Ambulance and two Intensive care transport slots exist, so the four Ambulance/Intensive care transport needs go to Critical patients and the remaining two Critical patients need a Stretcher. Equipment items (10 + 8 + 6 = 24) over 22 equipped patients: two Critical patients carry Monitoring and Oxygen, every other equipped patient carries one item. Given names cycle through the list offset by 17 positions from the family names so that the pairs do not alliterate; every name in both lists is used exactly once. Seed 20260904; script in `scripts/generate-patients.mjs`.
Rejected: Giving Stretcher to no Critical patient – impossible with the exact transport counts.
Spec: SPEC.md § 5.7

## 2026-09-04 – Batch 1 – Audit entries for the EHR outage are attributed to System
Decision: Toggling the outage (demo switch or IT outage playbook) writes "EHR connection lost, switched to operational mirror" and "EHR connection restored" with actor System, object EHR, detail Vikby sjukhus, because the outage is an automatic effect rather than something Eva Lind does to the hospital.
Rejected: Attributing them to Eva Lind – the demo switch stands in for an external event.
Spec: SPEC.md § 4, § 7.2

## 2026-09-04 – Batch 1 – Close incident from the banner
Decision: The banner's "Close incident" opens the § 6.2.5 dialog from the shell (Layout) so the banner is wired to state in Batch 1; the confirm button is disabled until the Incident module lands in Batch 3.
Rejected: Navigating to /incident first – the spec says the banner link opens the dialog directly.
Spec: SPEC.md § 2.5

## 2026-09-04 – Batch 1 – Unknown routes
Decision: Any unknown hash route redirects to /command-center, the same as `/`.
Rejected: A "not found" page – the spec defines no such page and there are no links to unknown routes.
Spec: SPEC.md § 2.1

## 2026-09-04 – Batch 2 – What-if edits are not audited
Decision: Changing a what-if value or resetting it does not write an audit entry and does not advance the clock, because the what-if is explicitly "not saved" and never touches the store's capability data. Selecting a capability or opening the log drawer are navigation, not state changes, and are not logged either.
Rejected: Logging every keystroke in the what-if inputs – would flood the log with entries about values that were never saved.
Spec: SPEC.md § 6.1.3, § 4

## 2026-09-04 – Batch 2 – Sync chip wording and the Manual state
Decision: The sync chip reads "{state} {HH:MM}" (e.g. "Synced 14:37", "Manual 14:10"); when the last sync is older than 30 minutes it reads "Delayed" as a warning chip with "Last sync HH:MM" in muted text beside it. The Manual sync state uses the grey chip (DESIGN.md does not map it). At region scope the chip and the sources popover reflect Vikby sjukhus, whose systems run the regional command centre; the EHR outage chip therefore shows at Vikby and region scope only, other nodes keep their own sync state.
Rejected: A separate region-wide sync state – there is no such source in the data.
Spec: SPEC.md § 6.1, DESIGN.md § 1

## 2026-09-04 – Batch 2 – Card actions at other scopes
Decision: "Show detail" on a card is rendered only when it leads somewhere: a matching capability at the node, or the breakdown popover (Emergency department, Staff on duty). Cards that read "Not available at this node" or "Not shared" have no action. At region scope the network cards' "Show detail" scrolls to the Nodes table, and "Operating theatres (Vikby sjukhus only)" switches the scope to Vikby sjukhus and selects Emergency surgery. For a Home care node the first card is "Home care places" instead of "Acute beds".
Rejected: A disabled "Show detail" link – DESIGN.md forbids dead links.
Spec: SPEC.md § 6.1.1, § 2.1

## 2026-09-04 – Batch 2 – Aggregated figures at region scope
Decision: Network cards sum the displayed figures of nodes whose sharing is not None (staff and ambulances: Full only) and show the summed verified/estimated split; "Last confirmed" shows the oldest time among the summed figures with that figure's source. The sources listed as not shared are named in the confidence line as text only.
Rejected: Showing the newest time – would hide that part of the figure is stale.
Spec: SPEC.md § 6.1 (region scope), § 7.1

## 2026-09-04 – Batch 2 – Region bottleneck table gets a Node column
Decision: At region scope the bottleneck table has a Node column between Rank and Capacity, so ranks 5 (Ekhaga vårdhubb) and 6 (Fältsjukhus Alfa) are attributable; rows are not clickable there because § 6.1.3 is not shown at region scope. At node scope only rows with a matching capability are clickable (Patient transport has none).
Rejected: Encoding the node in the rank cell ("5 (ekhaga)") – a table column is what the platform does.
Spec: SPEC.md § 5.4, § 6.1.2

## 2026-09-04 – Batch 2 – Node capability sets
Decision: Nodes other than Vikby get the capabilities listed in § 5.3 as their own What-limits-what entries (Sjöberga: Acute beds, Intensive care; Ekhaga: Monitored intake; Fältsjukhus Alfa: Field beds). Hemsjukvård Sollentuna has none and shows "No capability data at this node." Ekhaga's Monitored intake unit is "monitored patients can be received".
Rejected: Showing Vikby's capabilities at every node – wrong figures.
Spec: SPEC.md § 5.3, § 6.1.3

## 2026-09-04 – Batch 3 – Channel member roles
Decision: The Incident command channel has every role of the playbook as members. Any other channel has the Incident commander plus the owner roles of the tasks whose area name appears in the channel name (so "Emergency department" → Medical lead and Intensive care lead; "IT and wards" → IT liaison and Ward runners lead). This is what the "Channel opened at HH:MM for {member roles}" system message lists.
Rejected: A hand-written member list per channel – more data to maintain for the same result.
Spec: SPEC.md § 3 (Channel), § 6.2.3

## 2026-09-04 – Batch 3 – Audit wording for actions the spec does not name
Decision: Assigning a task logs "Assigned task – {title} – {person}"; changing a role logs "Changed role – {role} – {person}" (changing Incident commander also updates the banner); "Clear suggestions" logs one entry "Clear suggestions" with the number rejected in the detail rather than one entry per patient; the suggestion entry "Suggested moves – {n} patients" is attributed to System because it is the system's proposal, while every acceptance is logged as an authorisation by Eva Lind.
Rejected: One "Rejected suggested move" entry per patient for Clear suggestions – up to 32 identical lines in the log.
Spec: SPEC.md § 6.2.3, § 6.3, § 7.4

## 2026-09-04 – Batch 3 – Close time and the incident's log slice
Decision: The closed incident's `closedAt` is the clock at the moment "Closed incident" is logged, and its log slice runs from the "Activated incident" entry to the "Closed incident" entry inclusive (everything logged during the incident, from any module). Activation is logged before the System entries for tasks and channels so that the slice starts with it.
Rejected: Filtering the slice to incident-module entries only – evacuation moves made during the incident are part of its story.
Spec: SPEC.md § 6.2.5

## 2026-09-04 – Batch 3 – Summary counts and status filter mapping
Decision: On the Evacuation summary row, "Planned" counts accepted plans in status Planned only (suggested plans are not counts until authorised); the Status filter maps "Not planned" to patients without a plan or with an unaccepted suggestion, "Planned" to Planned and Accepted, "In transit" to Transport assigned and Departed, "Arrived" to Arrived and Handed over.
Rejected: Counting suggestions as planned – would contradict "suggestions do not take any counts until accepted".
Spec: SPEC.md § 6.3

## 2026-09-04 – Batch 3 – Free counts decrement verified first
Decision: When a plan takes a bed, place or intensive care bed, the Figure's value decreases by one and the verified part is consumed first; the estimated part only when no verified beds remain. Cancelling adds the bed back as verified.
Rejected: Proportional split – needless arithmetic for a demo figure.
Spec: SPEC.md § 6.3 rules, § 7.1

## 2026-09-04 – Batch 3 – Transport selection is inline
Decision: At the Accepted step the plan panel shows the vehicle select directly, with "{name}: {available} available" per option and incompatible or exhausted vehicles disabled with the reason; the primary "Assign transport" button is enabled once a vehicle is chosen. The destination select in "Plan move" works the same way (disabled options carry the reason).
Rejected: A separate dialog for the vehicle – an extra click in a 320 px pane that has room for the select.
Spec: SPEC.md § 6.3, § 7.5

## 2026-09-04 – Batch 3 – Target progress and Evacuation target line
Decision: Target rows show "{current} / {target} {unit}, due HH:MM" with a progress bar clamped at 100 %. The Evacuation summary shows "Target: free 30 acute beds" followed by "{n} freed" in secondary text so the presenter sees the current value without opening the incident.
Rejected: Showing only the target – the number that changes as patients depart is the point of the demo.
Spec: SPEC.md § 3, § 6.2.3, § 6.3

## 2026-09-04 – Batch 3 – Map behaviour in the prototype
Decision: The map fits all nodes on load and re-fits when a node is added; scroll-wheel zoom is off so that scrolling the page does not zoom the map; markers show the node name on hover and name plus free places in the popup. Level chip on the active incident header is grey ("Level 2"); the "Active" chip is blue.
Rejected: Scroll-wheel zoom – hijacks page scrolling in the three-pane layout.
Spec: DESIGN.md § 4 Maps, SPEC.md § 6.2.3

## 2026-09-05 – Batch 4 – Quantity is the number nearest before the resource term
Decision: The parser takes the number (integer or number word) closest before the matched resource stem, falling back to the first number in the text; without a resource match it takes the first number. "Vi har 12 sängar uppe. Saknar syrgas – tio koncentratorer räcker för kvällen." therefore yields 10 Oxygen concentrator, as § 6.4.3 expects, although 12 is the first integer.
Rejected: "The first integer in the text" read literally – gives 12 for msg-2, contradicting the expected result in the same section.
Spec: SPEC.md § 6.4.3

## 2026-09-05 – Batch 4 – Audit entries carry a reference to their object
Decision: `AuditEntry` gains an optional `ref` (the id of the object the entry is about). Request actions set it, the four seeded "Requested" entries reference req-1, req-2, req-4 and req-5, and the request drawer shows the entries whose `ref` is the request's id. The Resources-page message input logs "Sent message" with object Resources.
Rejected: Matching entries by object text ("Ventilator × 2") – ambiguous once two requests for the same resource and quantity exist.
Spec: SPEC.md § 6.4.1, § 7.3

## 2026-09-05 – Batch 4 – Request audit wording
Decision: Creating a request logs action "Requested" with object "{resource} × {quantity}" and detail "To {node}", the same shape as the seeded entries. Transitions log the full spec string as the action ("Accepted request – Ventilator × 2 – to Ekhaga vårdhubb"), with the reject reason, the source node or the ETA in the detail column.
Rejected: Splitting the spec string over Action/Object/Detail – the spec defines it as one string.
Spec: SPEC.md § 5.10, § 6.4.1

## 2026-09-05 – Batch 4 – Allocate lists every node that has the resource
Decision: The "From node" select lists every node that holds a row for the resource as "{node}: {available} available"; nodes with fewer available than the quantity are disabled with "{available} available, {quantity} needed" so the presenter sees why (req-2 for 10 oxygen concentrators cannot be allocated from Vikby's 8). A request that names a from node has it preselected.
Rejected: Listing only nodes with enough available – an empty select gives no explanation.
Spec: SPEC.md § 6.4.1, § 7.5

## 2026-09-05 – Batch 4 – Inventory filters and sums
Decision: Column-header filters are checklists; unticking values narrows the table and unticking the last remaining value resets the filter to all. Rows from nodes whose sharing is Capacity only or None are dimmed, show "Not shared" in Available and dashes elsewhere, and are excluded from the sum row. Notes appear as a tooltip on a dotted-underlined resource name.
Rejected: Including unshared rows in the sums – would leak figures the node does not share.
Spec: SPEC.md § 6.4.2

## 2026-09-05 – Batch 4 – Session ids start at 100
Decision: Ids generated during the session (`req-…`, `node-…`, `task-…`, `channel-…`, `msg-…`) use a counter starting at 100 so they never collide with the seeded ids (req-1…req-5, msg-1…msg-3). Stood-up nodes are recognised by the `node-` prefix.
Rejected: A separate counter per prefix – the same collision with seeded ids.
Spec: SPEC.md § 3 (NodeId), § 4

## 2026-09-05 – Batch 4 – Stood-up nodes and status changes
Decision: A stood-up node starts with acute beds total 0 / free 0 (estimated, Manual, last confirmed = clock), staff on duty 0 and the lead chosen in the dialog (default Eva Lind); the map fits to include it. Setting Operational on a Standing up node applies the § 6.5 formula and stamps lastSync with the clock. Changing status or sharing shows a toast ("Node status changed", "Node sharing changed"). The node detail page keeps the sources list derived from the node's figures; a stood-up node lists Manual.
Rejected: Prompting for staff on duty in the stand-up dialog – not in the spec's field list.
Spec: SPEC.md § 6.5

## 2026-09-05 – Batch 4 – "Create request" from messages
Decision: The prefilled dialog carries a "Suggested" chip and the line "Suggested from the message" until the person creates the request (§ 7.4); the same dialog is used from Requests, From message and channel threads. Messages in channels by anyone other than Eva Lind or System get the link; with the seeded data none exist, as the spec allows.
Rejected: Auto-creating the request from the message – the system never executes a suggestion by itself.
Spec: SPEC.md § 6.4.3, § 7.4

## KS build

## 2026-09-07 – Batch 1 – Domain types live in packs/types.ts; data/types.ts re-exports
Decision: The whole domain model (SPEC.md § 4 delta plus the first prototype's entities) is defined in `src/data/packs/types.ts`; `src/data/types.ts` only re-exports it so the modules' imports stay unchanged. The old `Figure` fields `source`/`lastConfirmed` become `dataSource`/`lastConfirmed`, and `source` now means the DATA.md § 9 key.
Rejected: Keeping two type files with overlapping definitions – two places to change when a pack field changes.
Spec: SPEC.md § 1, § 4

## 2026-09-07 – Batch 1 – Verified figures show a "Källa S5" link instead of a chip
Decision: A verified figure renders no chip (DESIGN-KS.md § 4) but, where the popover is needed (cards, ladder, node tables), a 13 px muted text link "Källa {key}" that opens the same popover with "Verifierad uppgift", source, date, link and "Visa i Källor". Estimates and illustrative values without a source key link to the `estimat` and `illustrativt` anchors on Källor; reported figures link to S21.
Rejected: A grey "Verifierad" chip – DESIGN-KS.md says none; no popover for verified figures – the spec requires a source popover on the Start key figures.
Spec: DESIGN-KS.md § 4, SPEC.md § 6.0

## 2026-09-07 – Batch 1 – IMA as placement wards
Decision: The ward list carries two extra rows, "IMA Solna" 12/1 and "IMA Huddinge" 8/0 (tema PMI, from DATA.md § 4 IMA-platser/belagda), so that the IVA step-down requests br-6 and br-11 have a placement target. A request whose needs contain "IMA" matches only IMA wards and is never utlokaliserad; when the IMA is full the suggestion is "Ingen plats – överväg {other site}" as DATA.md § 5.2 describes for br-6.
Rejected: A separate IMA counter outside the ward list – a second source of truth for the same beds.
Spec: SPEC.md § 6.2, DATA.md § 5.1–5.2

## 2026-09-07 – Batch 1 – Nodes without a single point have no marker
Decision: The capacity classes (Geriatrik, Sluten palliativ vård, Specialiserad rehabilitering, Psykiatri) and Ambulanssjukvården are rendered in the Nätverk table only; ASIH is the 25 km circle centred on 59,33/18,07 with its label at the top. The map fits the point markers (the two sites and six hospitals).
Rejected: Placing the classes at a Stockholm centre marker – a marker suggests a single location that does not exist.
Spec: DESIGN-KS.md § 8, SPEC.md § 6.9

## 2026-09-07 – Batch 1 – Region hospitals' IVA figures
Decision: The six region hospitals carry `intensiveCare` with total `null` (verified S4b: "not public") and free `null`, except Capio S:t Göran with total 8 as an estimate ("forskningsunderlag, äldre uppgift") and free `null`. The Nätverk table shows "Okänt" or "– / 8"; in Evakuering a `null` free count makes the hospital incompatible for Kritisk with the reason "IVA-kapacitet okänd".
Rejected: Omitting `intensiveCare` on those nodes – the table would show a dash that reads as "no IVA" rather than "unknown".
Spec: SPEC.md § 6.7, DATA.md § 2.4

## 2026-09-07 – Batch 1 – Channel member roles match on the area's first word
Decision: As in the first build, LSSL has every role, other channels the Sjukvårdsledare plus the owner roles of tasks whose area matches the channel name – matched on the area's first word so that "Samverkan RSSL" picks up "Samverkan och kommunikation" and "Operation och IVA" its own area.
Rejected: Exact area-in-channel-name matching – would give "Samverkan RSSL" no members beyond the Sjukvårdsledare.
Spec: SPEC.md § 6.6

## 2026-09-07 – Batch 1 – Old routes
Decision: `/command-center` → `/kapacitet`, `/evacuation` → `/evakuering`, `/resources[/…]` → `/resurser[/…]`, `/network` → `/natverk`, `/network/:nodeId` and `/incident/channels/:id` → `/natverk` and `/incident` (the old ids do not exist), the five stub routes and any unknown route → `/`.
Rejected: A "not found" page – the spec defines none.
Spec: SPEC.md § 3

## 2026-09-07 – Batch 1 – Läget nu carries a placeholder page until Batch 2
Decision: Batch 1 ships `/laget-nu` and its three sub-routes as one page with the title, scope and a link to Kapacitet so the six-module nav has no dead tab; Batch 2 replaces it with § 6.1–6.4.
Rejected: Redirecting `/laget-nu` to `/kapacitet` – would light the wrong nav tab.
Spec: SPEC.md § 9 Batch 1 ("No stubs" refers to the five existing-module stubs)

## 2026-09-07 – Batch 1 – Type-scale utilities registered with tailwind-merge
Decision: `cn()` uses `extendTailwindMerge` with `text-title`, `text-heading`, `text-nav`, `text-body`, `text-small` and `text-figure` registered as font-size classes; without it tailwind-merge treated them as colours and dropped `text-nav` when `text-text` followed, rendering the nav at 15/400 instead of 16/500.
Rejected: Replacing the utilities with explicit `text-[16px] leading-6 font-medium` everywhere – the DESIGN.md scale would no longer have one definition.
Spec: DESIGN.md § 2, DESIGN-KS.md § 2

## 2026-09-07 – Batch 1 – Kapacitet cards at Karolinska and region scope
Decision: At Karolinska scope every card sums the two sites (weakest confidence); Operation and CT figures are illustrative because they are computed from the illustrative capability components; Personal i tjänst is illustrative per SPEC.md § 6.5. At region scope "Vårdplatser lediga (nätverk)" sums the eight hospitals' free beds, while IVA, Operation, CT, Akuten and Personal show Karolinska only with the subtitle "(Karolinska)" because the region hospitals do not share those figures.
Rejected: Showing "Delas inte" for the region cards – hides the Karolinska figure the presenter wants to point at.
Spec: SPEC.md § 6.5, § 7.1

## 2026-09-07 – Batch 1 – Ladder belagda and lediga follow the live figures
Decision: The ladder's first three steps come from the pack; "Belagda nu" and "Lediga nu" are computed from the live site free-bed figures (lediga = sum of `beds.free`, belagda = disponibla normalvecka − lediga), so placements, discharges and scenarios move the ladder. The DATA.md § 3 baselines are kept in the pack for the tests.
Rejected: Static ladder values – the ladder would contradict the cards after the first action.
Spec: SPEC.md § 6.5, DATA.md § 3

## 2026-09-07 – Batch 1 – Hospital-wide key figures at site scope
Decision: On Start at Solna or Huddinge scope, Medarbetare, Operationer 2025 and Slutenvårdstillfällen 2025 show the hospital-wide figure with the note "hela Karolinska" (no per-site figure is public). Fastställda, Disponibla and IVA come from the site. At region scope Nyckeltal shows Karolinska.
Rejected: "Okänt" at site scope – three empty cards on the presenter's page.
Spec: SPEC.md § 6.0

## 2026-09-07 – Batch 1 – Källor page structure
Decision: The first table is grouped by source key: one heading row per key (anchor id = key, with name, date and link) followed by every verified or reported figure citing it, or "Inga uppgifter i demon hänvisar till denna källa ännu." The second table has two blocks with anchors `estimat` and `illustrativt`, each grouped by DATA.md section. The figure list is collected by `src/lib/sources.ts` from the pack (hospital figures, ladders, nodes, flow metrics, capability components, region figures) plus one summary row each for the illustrative lists (inventory, requests, queues, patients, scenarios, people).
Rejected: One row per illustrative resource line – hundreds of rows saying "illustrativt".
Spec: SPEC.md § 6.10, DESIGN-KS.md § 9

## 2026-09-07 – Batch 1 – Nätverk table has exactly the nine SPEC columns
Decision: The Nätverk table shows Nod, Typ, Status, Disponibla/kapacitet, Lediga, IVA, Delning, Synk, Källa; the first prototype's Ansvarig and Plats columns moved to the node detail so the table fits 1280 px without scrolling. The Källa chip is that of the node's free figure (or its capacity when no free figure exists).
Rejected: Keeping eleven columns – horizontal scroll at the minimum viewport.
Spec: SPEC.md § 6.9

## 2026-09-07 – Batch 1 – Further data choices
Decision: (a) Personal i tjänst per site is illustrative (Solna 3 100, Huddinge 2 800, ASIH 640) with HR as data source. (b) Region hospitals' free beds are illustrative with data source Medoma and lastConfirmed 14:30; their disponibla is the verified v.33 figure. (c) Psykiatri's total is 1 100 (980 + 120) verified S4a; palliativ, rehab and psykiatri have `accepts: []` so they are never evacuation destinations. (d) Ambulanssjukvården's verified figures (fordon, stationer, anställda, i drift) are node extra figures with S12; its illustrative vehicle pools live in the inventory. (e) S20's läkare and undersköterskor are estimates with the verification flag in the basis. (f) Coordinates are extra figures (Huddinge and the region hospitals as estimates). (g) The discharge status list has a fourth value "Geriatrik-förfrågan skickad" for the geriatrik flow. (h) The initial log has seven entries: the five seeded requests, the CT outage at 13:50 and the 14:37 sync.
Rejected: Inventing per-site staff or IVA figures for region hospitals as "reported" – nobody reported them.
Spec: DATA.md § 2, § 6, § 9

## 2026-09-07 – Batch 1 – Percent formatting uses a normal no-break space
Decision: `fmtPct` replaces the narrow no-break space (U+202F) that ICU emits for sv-SE with U+00A0, so "95,6 %" uses the same space as the thousands separator.
Rejected: Leaving U+202F – invisible in most fonts but breaks text searches for "95,6 %".
Spec: DESIGN-KS.md § 1

## 2026-09-07 – Batch 1 – Stand-up dialog prefilled from the preset
Decision: "Etablera nod" preselects the first preset site, fills the name with the preset's name and picks the type from it (Fältsjukhus → Field hospital, else Care hub); the presenter can still edit all fields. Default planned beds 20, lead Eva Lind, sharing Full as before. The new node appears in the scope selector after a separator.
Rejected: An empty name field – one more thing to type on stage.
Spec: SPEC.md § 6.9, DATA.md § 2.7

## 2026-09-07 – Batch 1 – Demo reset returns to Start; Återställ klockan is logged
Decision: "Återställ demo" restores the pack, clears incident and scenario, sets 14:40, navigates to Start and toasts "Demon återställd". "Återställ klockan" sets 14:40, stops the scenario, keeps everything else and writes a System entry "Återställde klockan" stamped 14:40.
Rejected: Staying on the current page after reset – the page may no longer make sense (an incident channel, a stood-up node).
Spec: SPEC.md § 2, § 7.2

## 2026-09-07 – Batch 2 – Läget nu derives beläggning, lediga, IVA and IMA from live state
Decision: Each site's "Lediga" is the site node's free-bed figure, "Belagda" is disponibla normalvecka minus lediga, beläggning the ratio; IVA lediga/belagda come from the node's IVA figure; IMA-platser/belagda from the IMA ward rows; "Längsta väntan på vårdplats" is the longest wait among bed requests from the site's emergency department (Intensivakuten / Akutmottagningen), growing with the scenario clock. The pack keeps DATA.md § 4's baselines for the tests. A placement therefore lowers lediga and raises belagda; a discharge does the reverse.
Rejected: Keeping belagda as its own stored metric updated in parallel – two sources of truth for the same beds.
Spec: SPEC.md § 5 ("derived where possible"), § 6.1

## 2026-09-07 – Batch 2 – "Väntar på vårdplats" only counts placements from the emergency department
Decision: "Placera" decrements the site's "Väntar på vårdplats" only when the request comes from the site's emergency department (br-1…br-4, br-8, br-9); Postop, IVA nedflytt and remiss placements do not touch the akuten queue. Placing into the IMA does not consume a vårdplats. Utlokalisering adds one to "Utlokaliserade patienter" and is logged as "Utlokaliserade patient – {avdelning}".
Rejected: Decrementing for every placement – the akuten figure would go below the number of akuten patients waiting.
Spec: SPEC.md § 6.2, DATA.md § 4

## 2026-09-07 – Batch 2 – Placement table controls
Decision: "Föreslagen avdelning" is a select preselected with the rule's suggestion and listing every ward at the site with a free bed (IMA only for IMA needs); a chip "Utlokalisering" appears when the chosen ward does not match the request's tema, and the action button is then "Utlokalisera" instead of "Placera". When no ward qualifies the cell shows "Ingen plats – överväg {other site}" and only "Avvisa" remains. The KPI strip adds a fourth figure, "Väntar på vårdplats (akuten)", so the presenter sees the Läget nu figure move; "Lediga platser" is the sum of free beds in the listed wards (IMA excluded).
Rejected: A separate ward picker dialog – one more click on stage.
Spec: SPEC.md § 6.2

## 2026-09-07 – Batch 2 – Forecast model details
Decision: Arrivals are integrated minute by minute over each hourly bucket from 14:40 using the profile's hour ranges; the residual 5 % of discharges is spread evenly over the 16 hours outside the profile's windows; tomorrow's discharges use the same shares from 10:00 and nothing before; elective admissions are spread evenly over 07–09. The deficit time is the end of the first bucket whose free-bed figure is negative. With DATA.md § 5.4 and baseline free beds 23/9 the implementation computes: Huddinge free +4 h 14, +12 h 1, +24 h −16, first deficit 1 plats at 03:40; Solna 34 / 31 / 30, no deficit; Tryck (1,3 for 6 h) moves Huddinge's deficit to 23:40 (+12 h −4). SPEC.md § 6.3's expectation that Huddinge goes negative "before midnight" holds under Tryck; at baseline the data give 03:40, and the tests assert the computed values as the spec instructs.
Rejected: Tuning the profile or counting the färdigbedömda queue as immediate admissions to force a pre-midnight deficit – that would invent data or make Solna negative too.
Spec: SPEC.md § 6.3, DATA.md § 5.4

## 2026-09-07 – Batch 2 – Forecast is anchored at 14:40 and marks "nu"
Decision: The 24-hour window always starts at 14:40 (the demo baseline the free-bed figure belongs to); a dashed "nu" marker shows where the scenario clock is. The chart is plain SVG: grouped bars per hour on the left axis, the free-bed line on the right axis with a zero line, negative points in red.
Rejected: Sliding the window with the clock – the baseline free beds would no longer match the window start, and the deficit hour would drift while the presenter talks.
Spec: SPEC.md § 6.3 ("from 14:40")

## 2026-09-07 – Batch 2 – Discharge settlement and the geriatrik flow
Decision: A sent ASIH or geriatrik request becomes "Utskriven" when the clock has advanced two minutes past the send, which the next logged action (clock +1 after the send's own +1) or one scenario tick always satisfies. Settlement is a System entry "Utskriven till ASIH – {patient}" and frees the ward bed, the site bed, one unit of the ASIH (120 → 119) or Geriatrik (23 → 22) capacity, and lowers utskrivningsklara (and ASIH-kandidater for ASIH). "Till geriatrik" shows for age ≥ 75 with waitingFor Geriatrik (dr-3; dr-11 is 72 and gets "Avvakta" only). The confirmation dialog holds a running scenario clock while open.
Rejected: Settling immediately on confirm – the presenter could not point at the "förfrågan skickad" state.
Spec: SPEC.md § 6.4, § 7.2

## 2026-09-07 – Batch 2 – Läget nu at region scope shows both sites; other nodes get an empty state
Decision: Region scope renders Läget nu exactly like Karolinska scope (the region hospitals share no flow figures); a stood-up node scope shows the sentence "Läget nu finns för Karolinska Solna och Karolinska Huddinge…" with a link to Kapacitet. The status chip at Karolinska scope is the worse of the two site statuses; the sum column never drives a status.
Rejected: Hiding the module at region scope – the presenter's chapter 5 starts at region scope and may click Läget nu.
Spec: SPEC.md § 2, § 6.1

## 2026-09-07 – Batch 3 – Engine timelines and capacities
Decision: Casualties are generated deterministically: category counts by integer distribution with carry (60 → 12/24/24), arrival minute `första + floor(j × fönster / n)` per category, routing by sequential largest-deficit assignment (yellow 50/50, green 30/40/30), and every per-patient attribute (CT, operation, IVA, vårdplats, blod) by whether patient j crosses the next integer at the share. Red: akutrum from arrival for 60 min, one CT in the arrival tick, operation 50 % from +60 for 120 min, IVA 60 % from +30 min (the patient is committed to IVA once assessed) for the horizon, the other 40 % to a vårdplats after operation or akutrum, blod 4 enheter for 50 % at arrival. Yellow: övervakning 120 min, CT 60 %, operation 20 % from +120 for 90 min, vårdplats 80 % afterwards. Green: behandlingsrum 60 min, vårdplats 10 % afterwards. Pool capacities are the baseline free counts where one exists (IVA, vårdplatser, blod, akutambulans) and the room counts for akutrum/övervakning/behandlingsrum (zero baseline occupancy: PB1's "Töm akuten på färdigbedömda patienter"); `ct_slots` capacity is scanners in operation × 2 per hour × tick/60 and may be fractional (1,5 per 15 min); `or_slots` is the Akut operation capability capacity as concurrent operations. Events: the first arrival (from the parameter, "+20 min"), the first tick with demand > capacity per pool, and every applied recommendation; offsets follow DESIGN-KS ("+1 h 30 min").
Rejected: Random arrival jitter – the spec requires determinism; IVA demand only after operation – the DoD's "brist within 2 h" would not occur.
Spec: SPEC.md § 7.3, DATA.md § 8.3

## 2026-09-07 – Batch 3 – The engine projects its current tick onto the live figures
Decision: The store captures a baseline (`ScenarioInputs`) when a scenario starts and re-runs `simulate` from it whenever a recommendation is applied. On every tick the current pools are projected onto the live state: node free beds and free IVA become max(0, capacity − demand), akuten patients become the baseline plus the ED pools' demand, O-negativ stock becomes stock − units used, region nodes' free beds follow their vårdplatser pools. Manual actions during a running scenario (a placement, a discharge) still apply but are overwritten at the next tick; recommendation effects are inside the capacity, so they persist.
Rejected: Incremental deltas per tick – drift after any manual action; keeping the scenario in a parallel read model – Läget nu, Kapacitet and Nätverk would need a second data path.
Spec: SPEC.md § 5, § 6.1 ("update live"), § 7.4 ("re-run the simulation from the current tick")

## 2026-09-07 – Batch 3 – Recommendation applicability
Decision: `ima_overflow` and `stryk_elektiv` are applicable while the IVA (primary site) or or_slots pool shows brist anywhere in the horizon; `vardhubb` while any vårdplatser pool shows brist; `asih`, `tidig_utskrivning` and `omfördela` as soon as the scenario consumes beds or övervakning at all (masskada's 4 h horizon never reaches a vårdplats brist, but the DoD expects `asih` to run in chapter 3); `forstarkning`, `katastrof` and `transport` always. `katastrof` with skadade ≤ 60 opens a confirmation dialog quoting the illustrative threshold; ≥ 60 it applies directly. Applied recommendations show "Utförd" and cannot be applied twice. Store effects: `forstarkning`/`katastrof` activate PB1 with the läge or change it; `stryk_elektiv`, `ima_overflow`, `tidig_utskrivning`, `transport` and `o_huset` mark the matching PB1/PB5 task done; `asih` discharges every ASIH-eligible named row, lowers utskrivningsklara by 5/8 and ASIH-kandidater to 0, ASIH capacity −13, and counts 13 towards "Vårdplatser frigjorda"; `omfördela` takes up to 10 beds each at SÖS and DS; `transport` creates a request of 4 Transportambulans from Ambulanssjukvården to the primary site (Hög); `vardhubb` stands up Tillfällig vårdhubb Flemingsberg (40 platser, Mats Öberg) and sets it "I drift" four ticks later.
Rejected: Brist-only applicability for the bed recommendations – the presenter's chapter 3 would have three permanently grey buttons.
Spec: SPEC.md § 7.4

## 2026-09-07 – Batch 3 – Scenario-driven log entries do not advance the clock
Decision: Entries the scenario writes as actor System (events reaching the current tick, "nådde horisonten") pass `advance: false` to `logEntry`, so a tick is exactly 15 minutes (or a day) on the clock. User-authorised recommendations still advance one minute like any action.
Rejected: Advancing per event – the clock drifted one minute per event and broke the tick arithmetic.
Spec: SPEC.md § 7.2, § 7.5

## 2026-09-07 – Batch 3 – Scenario panel is store-driven, non-modal and sits below the nav
Decision: The panel is one Sheet mounted in the app shell, opened through `scenarioPanel` in the store (Kapacitet and Nätverk both have a "Scenario" button; chapters 3 and 5 open it on their route). It is non-modal, ignores outside clicks (Escape closes) and starts 48 px down so the clock controls stay reachable; it also carries its own Spela/Pausa, Stega and Stoppa buttons. Parameters are editable only before "Starta".
Rejected: A modal sheet – the presenter could not step the clock or read Kapacitet while the panel is open.
Spec: DESIGN-KS.md § 7, SPEC.md § 6.5, § 8

## 2026-09-07 – Batch 3 – Pandemi is one IVA pool at Karolinska level
Decision: IVA demand is `ivaPerDygn × dag` against one pool "IVA-platser Karolinska" whose capacity is the sum of free IVA beds (2) plus O-huset: +6,4 per day from the day the recommendation is applied, capped at 64. Ticks are days (`DAY_MIN`), the clock shows "dag n" and the step button reads "Stega 1 dygn"; the PB5 target "IVA-platser tillkomna" follows the O-huset ramp.
Rejected: Per-site pools – Huddinge's 0 free beds would show brist on day 1 regardless of O-huset, contradicting the required "none with it".
Spec: SPEC.md § 7.3 Pandemi, § 6.6 PB5

## 2026-09-07 – Batch 3 – Mottagande allocation
Decision: 260 patients arrive at `floor(260 × t / 48)` cumulative per tick; each patient goes to Karolinska when it crosses the 35 % share (91), split Solna/Huddinge by free beds (23/9); the rest to the six region hospitals in proportion to their free beds regardless of running out, so SÖS, DS and S:t Göran show "vårdplatser slut" at +3 h 30 min. Once the vårdhubb is open, region-bound patients fill it first (40). Node pools use the node's short name in events.
Rejected: Stopping allocation at zero free beds – the point of the chapter is to show the nodes running out.
Spec: SPEC.md § 7.3 Mottagande, § 9 Batch 3

## 2026-09-07 – Batch 3 – Journalbortfall, Tryck, Siteevac and chapters
Decision: `journalbortfall` activates PB2 when no incident is active (which turns the outage on) or turns the outage on directly, and the horizon (6 h = 24 ticks) turns it off and stops the clock. `tryck` only feeds the Prognos multiplier (1,3 for 6 h at Huddinge) and logs its event. `siteevac` sets the scope to the site, activates PB4 when no incident is active and navigates to Evakuering. Chapters reset the demo, set scope and route; chapters 2 and 4 start their scenario with the clock running, chapters 3 and 5 open the panel with the preset selected and the clock paused. "Återställ klockan" logs which scenario it stopped.
Rejected: Auto-activating PB3 for mottagande – the spec ties only PB2 to a scenario start.
Spec: SPEC.md § 7.3, § 8

## 2026-09-07 – Batch 4 – Close labels of the shared dialog and sheet come from vocab
Decision: The shadcn Dialog and Sheet primitives rendered the English "Close" (visible in `DialogFooter` and as screen-reader text on the X button). Both now render `LABELS.close` ("Stäng") from `vocab.ts`, and the evacuation destination reason for a non-operational node uses `NODE_STATUS_LABELS` instead of the raw enum value ("Degraded").
Rejected: Hard-coding "Stäng" in the two components – CLAUDE.md requires every user-visible string to live in `vocab.ts`.
Spec: CLAUDE.md "UI language is Swedish", SPEC.md § 9 Batch 4

## 2026-09-07 – Batch 4 – The scenario panel closes through a store action
Decision: `closeScenarioPanel` in the store replaces two direct `useStore.setState` calls in the panel; it keeps the selected preset so reopening the panel from Kapacitet or Nätverk shows the same scenario.
Rejected: Clearing the preset on close – the presenter loses the chapter's preset when the panel is closed by mistake.
Spec: SPEC.md § 6.5, § 8

## 2026-09-07 – Batch 4 – Dead-link sweep method
Decision: The sweep is a headless Chromium script over every route in SPEC.md § 4 (including the tab routes, node routes, `/kallor#S5`, an incident channel route opened by activating PB1, the first prototype's old routes and an unknown route). For each route it records where it lands, the page heading, the number of internal and external links, and console/page errors; internal links found on a page are queued and visited too. Map tile requests are ignored because OpenStreetMap is unreachable in the build sandbox. The table is pasted into the pull request as SPEC.md § 9 Batch 4 requires; the script is not part of the repository.
Rejected: A static grep of `href` values – it cannot show that a route renders or that a redirect lands where SPEC.md § 4 says.
Spec: SPEC.md § 4, § 9 Batch 4

## 2026-09-07 – Batch 4 – README is the presenter script
Decision: The README is written in Swedish and carries the whole presenter script: what each confidence chip means and the example figure to point at, the five chapters with what to click and the values to expect (occupancy, deficit time, +20 min, +1 h 30 min, 0 free at SÖS/DS/S:t Göran, the vårdhubb), and the demos outside the chapters (Evakuering, Från meddelande, Pandemi, Källor). Expected values are quoted from the pack so the presenter can check the app against the script.
Rejected: A separate `PRESENTER.md` – one document is easier to keep in step with the pack.
Spec: SPEC.md § 9 Batch 4

## 2026-09-07 – Batch 5 – Dark tokens live in the same stylesheet as the light tokens
Decision: `src/index.css` is both the token stylesheet and the Tailwind theme file: the light values stay in `@theme` (which emits them on `:root` and generates the utilities) and a `.dark` block overrides the same variables, with `@custom-variant dark` on the `html` class. New tokens carry every treatment DESIGN-DARK.md § 2 describes so that no component references a colour except through a token: `surface`, `primary-text`, `badge-text`, `track`, `overlay`, chip fill/border/text per tone, role-pill fill/border, icon-tile background/icon, banner and avatar. Semantic mixes use `color-mix(in srgb, …)` in the dark values. Shadows are `none` in dark mode through `--shadow-card`; the vendored shadcn `shadow-md/lg/xs/sm` classes were replaced by `shadow-card`.
Rejected: A separate `tokens.css` with `@theme inline` – the same names would have been declared twice (raw variable and theme variable) and every utility would have carried an extra `var()` indirection.
Spec: DESIGN-DARK.md § 1–2, § 5

## 2026-09-07 – Batch 5 – Blue chip text lightened to pass the contrast floor
Decision: DESIGN-DARK.md § 2 gives `#4D8EF0` for blue chip text, which measures 4,36:1 on the 16 % primary mix over the surface; the chip text token uses `#66A0F3` (5,34:1) instead. `#4D8EF0` stays for links, active tabs and secondary buttons, where it measures 5,08:1 on the surface. All other pairs pass; the ratios are in the pull request.
Rejected: Keeping `#4D8EF0` and raising the fill mix – the fill would no longer match the other chips.
Spec: DESIGN-DARK.md § 2 (contrast floor)

## 2026-09-07 – Batch 5 – Map colours resolve through the theme at render time
Decision: Leaflet paints SVG paths with literal colours, so `NodeMap` reads the primary and status tokens with `getComputedStyle` (`cssColor`) and re-renders on a theme change; `NODE_STATUS_COLOURS` maps statuses to token names. The tile pane gets the § 3 filter under `.dark`; map surfaces (container, tooltips, popups, zoom bar, attribution) follow the tokens with `html`-prefixed selectors because Leaflet's stylesheet loads after ours.
Rejected: `var()` in SVG presentation attributes – not reliable across the renderers Leaflet uses.
Spec: DESIGN-DARK.md § 3

## 2026-09-07 – Batch 5 – Theme and locale are small zustand stores outside the demo store
Decision: `src/lib/theme.ts` and `src/lib/i18n.ts` hold their state in their own stores with `localStorage` persistence (`theme`, `locale`), applied to `<html>` before the first render from `main.tsx`. They are not part of the demo store, so "Återställ demo" leaves them alone and nothing is logged when they change.
Rejected: Putting them in the app store – a demo reset would flip the presenter's theme and language.
Spec: DESIGN-DARK.md § 1, DESIGN-LANG.md § 1

## 2026-09-07 – Batch 5 – Nav name hidden below 1360 px
Decision: With the language and theme toggles the right cluster no longer fits at 1280 px next to "Eva Lind"; the name text is hidden below 1360 px (the avatar keeps it as a title) and the cluster gap is 8 px. Modules keep their 32 px gap.
Rejected: Narrowing the module gap – a Batch 1 requirement.
Spec: DESIGN-KS.md § 2, DESIGN-DARK.md § 1, DESIGN-LANG.md § 1

## 2026-09-07 – Batch 5 – Screenshots are committed under docs/screenshots/batch5
Decision: The GitHub tools available in the session cannot attach files to a pull request, so the required screenshots (six pages in both themes, Start and Läget nu in English) are committed under `docs/screenshots/batch5/` and embedded in the pull request description from the branch. The 1440 px set was checked but not committed.
Rejected: Uploading elsewhere – nothing outside the repository is allowed.
Spec: DESIGN-DARK.md § 5, DESIGN-LANG.md § 6
