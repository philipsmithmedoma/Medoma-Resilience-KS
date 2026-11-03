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

## 2026-09-07 – Batch 5 – t() over nested tables with dotted keys; tm() for label maps; tn() for plurals
Decision: `vocab.ts` exports two tables, `sv` and `en`, with the same nested shape (`Vocab = typeof sv`, `en: Vocab`), string leaves with `{name}` placeholders and no functions. `t('FLOW.placement.audit.placed', { ward })` resolves a dotted key in the current locale and interpolates; `tm('NODE_STATUS_LABELS')` returns a branch (enum label maps, the chapter list, the recommendation table) typed from the table; `tn('FLOW.discharge.days', n)` picks `_one`/`_other`. Keys are typed as the union of leaf paths, so a wrong key fails the type check. The unit test asserts key parity in both directions, identical placeholder sets per key, and the plural pairs. Non-linguistic constants (ids, enum lists, chip tones, tile tokens, vehicle names) stay exported from `vocab.ts` beside the tables. The locale is read at call time from the i18n store; the app shell reads it with a hook and keys the page content on it, so every string re-renders on a switch.
Rejected: A flat key file – hundreds of keys lose the module grouping the components already use; per-component hooks – pure helpers in `src/lib` build strings too.
Spec: DESIGN-LANG.md § 1

## 2026-09-07 – Batch 5 – Pack texts are { sv, en } objects whose Swedish form is the key
Decision: Playbook names, triggers, summaries, roles, task titles, areas, owner roles, channel names and target labels, scenario preset names and parameter labels, flow metric labels and ladder step labels are `LocalizedText` in the pack; the vocab entries are reused through `both()` where the label already existed in the tables. Matching (role assignment, channel membership, `markTaskDoneByTitle`, the target measures) uses the Swedish form as the key, so store actions keep their string signatures and the Batch 1–3 tests keep their Swedish titles. User-typed task titles get the same text in both languages. Capacity classes and the transport node carry `descriptorEn`, rendered by `nodeLabel()` in English mode only.
Rejected: Numeric ids for roles and tasks – a wider change than the addendum allows and no gain for the demo.
Spec: DESIGN-LANG.md § 3–4

## 2026-09-07 – Batch 5 – What stays Swedish in English mode
Decision: Beyond DESIGN-LANG.md § 4, the following pack data stays Swedish because § 3 does not list it: bottleneck narratives, capability units and component names, resource names, figure labels and basis texts on Källor and node detail, the site-specific cancelled-surgery notes, and the audit log and scenario events already written (they are stored as text when they happen). These regions carry `lang="sv"` so screen readers and the sweep can tell them apart. The English sentence frames wrap the Swedish data (e.g. "Capacity now: 2 akuta operationer möjliga nu, limited by postop-platser"). Recommendation labels and effects stay in the vocab tables (there is no recommendation table in the pack) and are rendered from the key.
Rejected: Translating the bottleneck narratives – data values that the addendum does not ask for.
Spec: DESIGN-LANG.md § 3–4

## 2026-09-07 – Batch 5 – Formatting by locale
Decision: `format.ts` reads the locale on every call: `Intl.NumberFormat('sv-SE')` or `('en-GB')` for numbers, "95,6 %" (no-break space) or "95.6%" for percent, "dag n"/"day n" and "dygn"/"days" from the tables, "Okänt"/"Unknown" for null, and the demo date from `LABELS.demoDate`. Durations and clock times are identical in both languages. Tests set the locale explicitly.
Rejected: Formatting at the component level – dozens of call sites.
Spec: DESIGN-LANG.md § 2

## Hospital at Home build

## 2026-11-02 – Batch 0 – Work on branch home-module, not the session's default branch
Decision: The prompt names the branch `home-module`, created from main; all six batches are committed and pushed there. The session's pre-assigned branch is not used for pushes.
Rejected: Pushing to the pre-assigned branch – the user's explicit instruction names another one.
Spec: SPEC.md § 11.7

## 2026-11-02 – Batch 0 – PROMPTS.md holds the instruction text; the two embedded documents are referenced
Decision: The new PROMPTS.md section reproduces the prose of the prompt and points at SPEC.md § 11 and DATA.md § 11 for the two documents it embeds, which batch 0 appends verbatim to those files.
Rejected: Pasting both documents a second time into PROMPTS.md – three copies that must be kept in step.
Spec: SPEC.md § 11.7 (batch 0)

## 2026-11-02 – Batch 1 – Zone vertices are written `zone:<id>`; sites keep their plain ids
Decision: Zone ids `solna` and `huddinge` are also the site ids, so a road-graph vertex for a zone is `zone:<ZoneId>` (also `HomeZone.graphNode`, "usually itself") while the sites stay `solna` and `huddinge` as SPEC.md § 11.3 says. Every link endpoint in the pack uses these forms; `GraphNodeId` is documented accordingly.
Rejected: Plain zone ids everywhere – "site solna – zone solna" would be a self-loop on one vertex and the Solna site would be reachable from itself through its own neighbourhood; a prefix on the sites – contradicts the spec's vertex names.
Spec: SPEC.md § 11.3

## 2026-11-02 – Batch 1 – Home sources, presets and `noMarker` are additive members
Decision: `DataPack` also gains `homeSources` (S-H1…S-H14, DATA.md § 11.4) and `homePresets` (the three flag presets of § 11.5); `InfraNode` gains optional `noMarker` (for `w-norrvatten-reserve` and `w-malaren`, which the data says have no marker of their own) and `figures` is typed `InfraFigure[]` (a `Figure` with `label`, `unit` and optional `valueMax` for a range). The S-H keys are kept out of `sources` because the existing pack test pins that list to S1–S22.
Rejected: Appending S-H keys to `sources` – breaks an existing test the batch must leave unchanged; a second figure type unrelated to `Figure` – the confidence and source rendering is shared.
Spec: SPEC.md § 11.3 ("additive only"), DATA.md § 11.4

## 2026-11-02 – Batch 1 – Ranges and section totals in infrastructure figures
Decision: Essingeleden's "140 000–170 000 vehicles/day" is one verified figure with `value` 140 000 and `valueMax` 170 000 (S-H12, 2026-08); the section total of about 309 000 vehicles/day (reported, S-H13, 2019) is carried as a second figure on Essingeleden because the data gives no node of its own for it. Liljeholmsbron's 37 000 has no year, so it carries a `basis` text saying so and no `asOf`.
Rejected: Storing the range's midpoint – an invented number; dropping the section total – it is the figure that explains why the five bridges matter.
Spec: DATA.md § 11.3

## 2026-11-02 – Batch 1 – Link verification flags follow what the sources establish
Decision: A link is `verified` only where DATA.md says the connection exists: Norrvatten–Solna and the Norrvatten–SVOA interconnection (S-H3), the existing 400 kV lines, and every road link; supply links from Lovö and Norsborg, Täby, Lidingö, Södermalm and Nacka, all planned lines (400 kV, the Anneberg cable) and both regional-grid links are `verified: false`. The reserve supply from Görvälnverket is a verified dotted link with an off-map arrow N whose `b` is the reserve node; every other off-map link has `b` equal to `a`. Links the data gives no label for carry an empty label rather than an invented one.
Rejected: Marking all dashed links verified – the data says the supply areas of Lovö and Norsborg are not verified.
Spec: DATA.md § 11 intro, § 11.1–11.3

## 2026-11-02 – Batch 1 – Generator details the spec leaves open
Decision: A patient's distance from the zone centre is the mean of two uniforms times the radius (a triangular spread, never outside the zone) at a uniform bearing; age is 24–91 like the hospital patients; names are drawn from the existing lists, unique across the 150 and distinct from staff and hospital patients; Home dialysis alone gives `batteryHours: null` because the spec lists no battery range for it; `elCritical` is Oxygen, IV infusion or Home ventilator only (Monitoring is not critical). The second generator has its own random stream, so regenerating leaves `patients.ts` byte-identical.
Rejected: A single shared stream – extending the generator would silently change the 80 hospital patients and the tests pinned to them.
Spec: SPEC.md § 11.4

## 2026-11-02 – Batch 2 – View state lives under `home` in the store and is not logged
Decision: `store-home.ts` is a slice whose state sits in one `home` object (`home.layers` now; mode, selection and disruptions follow in later batches) so that names like `mode` and `layers` cannot collide with the other slices. Layer visibility is view state like theme and locale: toggling a layer is not written to the audit log and does not advance the clock; only state changes that alter the picture of the care (blocking, outages, reset) are logged. "Återställ demo" restores the defaults (patients and roads on, el and water off) because the slice is part of `initialData()`.
Rejected: Logging every toggle – a presenter flipping layers would push the scenario clock forward and fill the log with noise; top-level `layers`/`mode` keys – ambiguous in a store with nine slices.
Spec: SPEC.md § 11.5

## 2026-11-02 – Batch 2 – `NodeMap` takes one optional `home` overlay; layers are drawn by `HomeMapLayers`
Decision: `NodeMap` gains the optional prop `home` (layers, zones, infrastructure nodes and links, patients). Its Leaflet children are drawn by `HomeMapLayers` inside the same `MapContainer` and `FitBounds` also fits the overlay's points (zones, markers, arrow tips). Symbols: water circle (teal token), electricity diamond (olive token), bridge square and tunnel circle (text-secondary token); an unverified node is hollow with a question mark; links of verified connections are solid, dashed/dotted styles and unverified links are dashed (`isSchematic`); off-map arrows are a short line with an arrowhead and the pack's text beside it, arrows that leave one node the same way fan out sideways with their labels on alternate sides. Patient dots are 2 px at 30 % opacity in the muted text token and do not take clicks; zones are small hollow points with their name (the translucent circles belong to the outage modes of batch 4). The region's hospitals are not drawn on this map, only Karolinska Solna and Huddinge.
Rejected: A separate map component – the spec says extend, not fork; Leaflet default icons or SVG-only markers – a hollow "?" and the diamond need HTML icons that follow the theme through `var()` without a re-render; colour per layer from new tokens – the existing teal, olive and text-secondary tokens are enough.
Spec: SPEC.md § 11.5–11.6, DESIGN-DARK.md § 3

## 2026-11-02 – Batch 2 – The nav had to give up width for a seventh module; tabs fit by breakpoint
Decision: With "Sjukhus hemma" the header overflowed 1280 px (1385 px in Swedish, wider in English). Below 1536 px the three decorative icons (chat, support, documentation) are hidden and the cluster gap is 4 px; below 1600 px the module gap is 24 px instead of 32 and the nav's left margin is 16 px. Measured with a headless browser, nothing scrolls horizontally in either language at 1280, 1360, 1440, 1536, 1600 and 1920 px. This supersedes the 32 px gap at 1280 px that KS batch 1 required; the batch 3 nav work re-measures with the platform tabs.
Rejected: A horizontal scroll in the nav – violates the minimum-viewport rule; hiding the language or theme toggle – they are features.
Spec: SPEC.md § 11.2 ("all tabs must fit at the 1280 px minimum viewport"), DESIGN-KS.md § 2

## 2026-11-02 – Batch 3 – The five platform tabs collapse into a "Medoma" menu below 2100 px
Decision: SPEC.md § 11.2's fallback applies. With the five platform tabs inline the nav needs about 590 px more than the six prototype tabs; it only fits above 2100 px, so below that the five tabs are one overflow menu labelled "Medoma" (a dropdown of five links; it carries the active top bar while a stub page is open), followed by the 1 px divider and the prototype's modules. To make that fit at the 1280 px minimum in both languages the nav was tightened by breakpoint, superseding batch 2's values: below 1600 px the header padding is 12 px, the module gap 16 px, the left margin 8 px, the clock buttons and theme toggle 28 px and the cluster gap 2 px; the three decorative icons appear from 1680 px, the module gap is 24 px from 1600 px and 32 px from 1760 px. Measured in a headless browser: nothing scrolls horizontally at 1280, 1366, 1440, 1536, 1600, 1680, 1760, 1920, 2100 and 2560 px in Swedish or English. In English at 1280 px the nav has 0 to 2 px to spare.
Rejected: Inline platform tabs with smaller type – DESIGN.md fixes 16/500; hiding the language toggle – it is a feature; a horizontally scrolling nav – violates the minimum-viewport rule.
Spec: SPEC.md § 11.2

## 2026-11-02 – Batch 3 – Stub routes reuse the first prototype's old paths
Decision: The five stubs live at `/patients`, `/activities`, `/planning`, `/employees` and `/reporting`; the first prototype's redirects from those paths to Start are removed because the paths now render a page. The stub text and link come from `STUB` in vocab; the title is the module label.
Rejected: New paths such as `/plattform/patienter` – the old paths are the natural ones and nothing else uses them.
Spec: SPEC.md § 11.2, § 3

## 2026-11-02 – Batch 3 – Selection, dimming and the panel
Decision: Selecting an infrastructure node is view state (`home.selectedNode`, not logged). A click on a marker selects it, a second click or a click on the empty map clears it, and switching off the node's layer clears it. Dimmed: links that do not touch the node (15 % opacity), nodes, zone points and zone labels that are not linked to it (25–35 %), and patient dots in zones that are not linked (10 % instead of 30 %). The panel shows the layer tag and kind, the name, the role, "Kopplad till" (other infrastructure nodes are links that select them, sites and zones are plain text, an off-map arrow reads "Utanför kartan: …", each with the link's label), the status (red and bold when the node is unverified), the node's figures with their confidence chip and source, and the position with its confidence chip and basis. The three works (Görvälnverket, Lovö, Norsborg) also show the common raw-water source (Östra Mälaren) as its own paragraph, as DATA.md § 11.1 says it is "shown as the status text on the three works".
Rejected: Selecting zones and patients as well – the spec selects infrastructure; a marker for Östra Mälaren and the reserve supply – DATA.md gives them no marker of their own.
Spec: SPEC.md § 11.5–11.6, DATA.md § 11.1

## 2026-11-02 – Batch 3 – Position basis texts are shown in the wording of DATA.md
Decision: `coordSource` is one string in the spec and the pack keeps DATA.md's English wording ("Görväln area, Järfälla; Places returned the adjacent Görväln House …"); the panel shows it as written with `lang="en"` under the confidence chip, in Swedish mode as well. The chip and the heading are translated.
Rejected: Translating every basis text into a second string field – the spec types the field as a plain string and the texts are source notes, not UI copy.
Spec: SPEC.md § 11.3, § 11.4

## 2026-11-02 – Batch 3 – Source keys S-H1…S-H14 get their own section on Källor
Decision: Källor gains a section "Sjukhus hemma: infrastruktur" listing S-H1…S-H14 with anchors (`/kallor#S-H12`) and every infrastructure figure under its source; the confidence popover looks a figure's source up in both source lists. `collectFigures` is unchanged, so the existing source test still pins S1–S22.
Rejected: Merging the lists – breaks the existing test and mixes the hospital's figures with the infrastructure's.
Spec: SPEC.md § 11.3, DESIGN-KS.md § 4, § 9

## 2026-11-02 – Batch 3 – List filters are local; "Endast påverkade" waits for batch 4
Decision: The patient list keeps its zone, equipment, visit-today and affected-only filters in component state (they are not scenario state and not logged). The affected-only chip is disabled, with a title explaining why, until a disruption exists (batch 4 passes the affected ids). Rows show name, age, area, team, equipment with battery hours and a "Besök i dag" chip; groups are the zones in pack order and patients are sorted by family and given name.
Rejected: Filters in the store – nothing else reads them, and a demo reset would clear what the presenter set.
Spec: SPEC.md § 11.6

## 2026-11-02 – Batch 4 – Which Hospital at Home actions are logged
Decision: Closing or reopening a road node or link, setting or restoring a power or water outage, and the reset are logged through `logEntry()` as Eva Lind with the object's name and the detail "N av 150 patienter påverkade" for the state after the change and the scope in force; each advances the scenario clock one minute like any action. Picking a mode, selecting a node and switching a layer are view state and are not logged. The reset chip writes one entry ("Återställde alla störningar") and does nothing when nothing is disrupted; it keeps the mode and the selection. A closed link is named by its two ends and its label ("Norra länken (E4/E20) – Lidingö (via Lidingöbron …)").
Rejected: Logging mode changes – they change nothing about the care; one entry per element on reset – a reset of ten disruptions would bury the log.
Spec: SPEC.md § 11.5 ("all writes go through logEntry()")

## 2026-11-02 – Batch 4 – Rows, tiers and the meaning of "affected" and "critical"
Decision: `impact()` returns a row for every patient with any flag, including patients who only have a detour; "affected" (the headline count, the filled dot, the "Påverkade" section and the "affected only" filter) is unreachable, power or water, so a detour-only patient is a row but not affected and is counted separately ("nås via omväg"). `prioritise()` has the spec's five tiers plus one the spec does not name: tier 5 is a patient without power or with a water disruption who is neither el-critical nor on dialysis; it sorts after "unreachable" and before "detour". Ties go by battery hours ascending (no battery last), then by name so the order is stable. The black "Prioritera" badge marks tiers 1–3 (the groups the spec orders first); the hollow ring on the map marks an affected patient who is el- or water-critical (`HomePatient.elCritical`/`waterCritical`), the definition the summary uses. The two are close but not identical: an unreachable patient with a visit today and no powered equipment gets the badge and a filled dot.
Rejected: One flag for both – the spec describes the ring by criticality and the badge by priority; dropping the non-critical power/water patients from the list – they are affected and must be seen.
Spec: SPEC.md § 11.5–11.6

## 2026-11-02 – Batch 4 – The five-bridge case leaves Södermalm cut off from both sites
Decision: In the road graph Södermalm's only links are bridge nodes, so blocking Essingeleden, Centralbron, Västerbron, Liljeholmsbron and Skanstullsbron isolates it from Solna and from Huddinge alike. The test for "every zone south of Saltsjö–Mälaren is unreachable from Solna but not from Huddinge" therefore covers Söderort, Huddinge, Botkyrka and Nacka, and asserts separately that Södermalm is unreachable from both and that from Huddinge the northern zones are the unreachable ones. At Karolinska scope (reachable from either site) only Södermalm's 15 patients remain unreachable.
Rejected: Adding a road link to Södermalm so that it stays reachable – DATA.md § 11.3 lists the links exactly.
Spec: SPEC.md § 11.7 batch 4, DATA.md § 11.3

## 2026-11-02 – Batch 4 – Mode behaviour on the map
Decision: Picking a mode also switches on the layer it acts on (roads, el or water). In roads mode a tap on a road marker toggles `blockedNodes`, and every road link has a 14 px transparent hit path over the visible line that toggles `blockedLinks`; in el and water mode the ten zones draw as dashed, translucent circles and a tap toggles that zone's outage of the active kind; outside those modes the circles of zones in outage stay visible. Blocked nodes turn the danger colour with a cross in the marker (not colour alone), blocked links are solid and one weight heavier, outage zones fill the danger colour at 22 %. With a mode active a tap never selects a node and the empty map does not clear the selection. Patient dots: affected 3 px filled danger colour, affected and critical 4 px hollow ring, detour-only 3 px amber, others unchanged; they take no clicks. The middle pane shows the result when there is any disruption, the mode's instruction sentence when there is a mode and none yet, else the selected node's panel.
Rejected: A tap that both selects and blocks – ambiguous; hit areas on the markers only – the spec wants links blockable too.
Spec: SPEC.md § 11.5–11.6

## 2026-11-02 – Batch 4 – The list, the headline and the illustrative chip
Decision: With disruptions the left list shows three sections: "Påverkade" in priority order, "Nås via omväg" and "Övriga" (by zone, then name); without disruptions it is grouped by zone as in batch 3. Rows show their reasons as chips (red for unreachable, power and water; warning for detour) and the badge. The "affected only" chip is enabled while a disruption exists and keeps exactly the affected patients. The headline "N av 150 patienter påverkade" carries the grey "Illustrativt" chip, because the patient count is a synthetic figure; its basis text says the patients were generated for the demo.
Rejected: A single flat list – the spec orders by priority but the unaffected must still be findable; leaving the count without a chip – CLAUDE.md requires the confidence wherever a figure is shown.
Spec: SPEC.md § 11.6, CLAUDE.md

## 2026-11-02 – Batch 4 – Map usability: smaller markers and wheel zoom on this map only
Decision: At the default zoom the inner-city bridges are 15–17 px apart, so the node markers are 18 px (was 20 px) and `NodeMap` gets the optional `scrollWheelZoom` prop, switched on for Hospital at Home (the page does not scroll, and zooming in is how a presenter separates Västerbron from Liljeholmsbron). Other maps are unchanged.
Rejected: Spreading the markers apart – their positions are the sourced coordinates; a higher default zoom – the whole region must be in view at first.
Spec: SPEC.md § 11.5–11.6

## 2026-11-02 – Batch 5 – The three presets sit in the scenario panel, apart from `pack.scenarios`
Decision: "Bro avstängd" / "Bridge closed", "Elavbrott" / "Power outage" and "Vattenstörning" / "Water disruption" are `pack.homePresets` and appear in the scenario panel's select under a group "Sjukhus hemma" after the six existing scenarios. Choosing one shows a sentence about what it does; "Starta" calls `applyHomePreset`, which replaces the current disruptions with the preset's (bridge: Essingeleden and Centralbron closed; power: Söderort and Huddinge; water: Solna och Sundbyberg), clears the mode and the selection, switches on the layer the preset acts on, writes one log entry as Eva Lind ("Aktiverade störningsscenario – {name}, N av 150 patienter påverkade") and navigates to `/home`. No scenario state and no ticks are created. While another scenario is running the panel shows its running view, so a preset is chosen when none runs.
Rejected: Adding the keys to `pack.scenarios` and `ScenarioKey` – an existing test pins that list to six keys and the scenario engine's records are keyed by it; one log entry per closed element – a preset is one decision.
Spec: SPEC.md § 11.5

## 2026-11-02 – Batch 5 – How the vocab parity test covers the new keys
Decision: The existing parity test already compares every key and placeholder of `sv` and `en`, so the new `HOME`, `STUB`, `MODULES` and `AUDIT` keys are covered by it. `vocab-home.test.ts` adds two things the key comparison cannot: it reads the source of every Hospital at Home file, collects each literal key passed to `t()`, `tn()` and `tm()` and asserts that it resolves to a string (or, for `tn`, a `_one`/`_other` pair; for `tm`, a branch with equal keys) in both languages, and it enumerates the keys built from data (modules, equipment, infrastructure kinds, layers, modes, instructions, presets, reasons). It also pins the spec's exact labels.
Rejected: Relying on the generic test alone – a typo in a `t()` call would only show at run time in one language.
Spec: SPEC.md § 11.7 batch 5, DESIGN-LANG.md § 1

## 2026-11-02 – Batch 5 – Screenshots show the page without map tiles; README gets "Steg 6"
Decision: `docs/screenshots/home/` holds seven screenshots of `/home` at 1280 px: layers on with a selected node in light/Swedish, dark/Swedish and light/English, and the three presets (bridge, power, water) in the combinations light/Swedish, dark/Swedish, light/English and dark/English. The build sandbox cannot reach OpenStreetMap, so the tile pane is empty (the map background shows through); markers, lines, circles and dots are drawn as in a live run. The README's presenter script gains "Steg 6 – Sjukhus hemma" after the five chapters; it is not a sixth chapter card on Start because SPEC.md § 8 defines five and § 11.7 asks for a README step only.
Rejected: A sixth chapter on Start – changes SPEC.md § 8 and the Start page's equal-width layout; committing screenshots with fake tiles – nothing in them may look like data that is not there.
Spec: SPEC.md § 11.7 batch 5

## Real geography build

## 2026-11-03 – Batch 6 – Overpass was unreachable, so the fallback of the prompt applies
Decision: From the build session every request to overpass-api.de is refused by the proxy (HTTP 403 on CONNECT), so the four GeoJSON files are not committed. `scripts/fetch-osm.mjs` is written and tested against Overpass-shaped samples (conversion, simplification, budgets, README), the four queries are files under `scripts/overpass/`, and batches 7–10 are built and tested against a fixture with the same schema. The app never calls Overpass; `npm run fetch:osm` (or `node scripts/fetch-osm.mjs`) run locally writes the real files. The PR description gives the command.
Rejected: Hand-typing OSM-looking data into `roads.json` – it would pass for real geometry; skipping the batches – the prompt provides the fallback.
Spec: SPEC.md § 12.2, § 12.4

## 2026-11-03 – Batch 6 – Conversion keeps shared nodes, implies one-way for motorways, and has a pure module
Decision: The conversion lives in `scripts/osm-convert.mjs` (pure, with a `.d.mts` so the tests import it) and the script only fetches and writes. Douglas–Peucker at 8 m always keeps the ends and every node that two ways share (found from the OSM node ids of `out body geom`), otherwise simplification would cut junctions out of the road graph. `oneway` is true for `yes/true/1`, for `-1` (the geometry is reversed), and, as OSM implies, for motorways and roundabouts unless tagged `no`; `bridge` and `tunnel` are true for any value but `no`; coordinates are rounded to five decimals so a shared node has identical coordinates in every way. Substation ways become the mean of their vertices. The script takes `--only`, `--from DIR` (convert saved answers) and `--out DIR`, retries 429/502/504, and exits non-zero when a file exceeds its budget.
Rejected: Simplifying each way on its own – junctions would disappear; a dependency such as osmtogeojson – the spec says no dependencies.
Spec: SPEC.md § 12.2, § 12.3

## 2026-11-03 – Batch 6 – The fixture is 20 named ways plus ten zone ring roads, generated by a script
Decision: `fixture.json` holds the twenty named corridor ways of the real network (Norra länken, Essingeleden, Västerbron, Centralbron, Munkbroleden, Skeppsbron, Katarinavägen, Stadsgårdsleden, Liljeholmsbron, Skanstullsbron, Södra länken, Götgatan, Söderledstunneln, Södertäljevägen and so on) with the same properties as `roads.json`, designed so that the north and the south of the region meet only at the crossing set of SPEC § 12.4 test 3, plus ten ring roads of 1.2 km radius, one per zone, because the 1.5 km snap rule needs a vertex near patients placed anywhere in a zone and twenty corridors alone cannot give that. `scripts/make-geo-fixtures.mjs` writes it (positions invented, names real) together with `fixture-streets.json` (ten short streets per zone), `fixture-power.json` (the substations of § 12.5, deliberately a little off the DATA.md estimates, and three lines) and `fixture-water.json`. The README in `geo/` says the real files are absent.
Rejected: Exactly twenty ways – patients in the outer half of a zone would not snap; typing the fixture by hand – the ring roads are twelve computed points each.
Spec: SPEC.md § 12.4

## 2026-11-03 – Batch 6 – Section 12 headings and a fetch script entry
Decision: § 12 is appended as `## 12.` with `### 12.n` subsections like § 11 (the prompt gave plain numbered lines); the text is unchanged. `package.json` gains the script `fetch:osm`.
Rejected: Leaving the plain numbering – it would not render as headings.
Spec: SPEC.md § 12

## 2026-11-03 – Batch 7 – The generator's street placement is pulled forward from batch 9
Decision: Tests 1–4 of SPEC § 12.4 need patients that lie on the graph, and the old placement (random points within the zone radius, up to 2.5 km from any road) cannot satisfy "95 % snap within 1 500 m" on the fixture. The generator therefore already places patients on streets in this batch: each patient gets a random vertex of a random street (`streets.json`, or `fixture-streets.json` until it is fetched) within the zone's radius, and `street` and `houseNo` (1–60) are added to `HomePatient`. Placement has its own random stream (seed + 1) and the old position draws are still consumed, so equipment, batteries, visits, names and ages are identical to before and the tests that pin them still hold. A street vertex counts for a zone only when that zone's centre is the nearest of the ten centres: Innerstaden and Södermalm are 2.4 km apart and their radii overlap, so without it patients "of" Södermalm lived in Norrmalm and snapped to the north side of the water. Batch 9 keeps the list text, attribution, fit-to-zones and screenshots. After `node scripts/fetch-osm.mjs` the generator must be run again (`node scripts/generate-patients.mjs`) so that the patients lie on the real streets; the PR says so.
Rejected: Loosening test 1 – the spec fixes 95 %; keeping the spec's batch order – the batch's own tests would fail; weighting by population – no data.
Spec: SPEC.md § 12.4, § 12.5

## 2026-11-03 – Batch 7 – Fixture revised: 21 named ways and 90 ring segments of 0.9 km
Decision: Only junctions and way ends are vertices, so the one-way-per-zone ring of batch 6 gave the graph a handful of vertices and left the Huddinge site, which sits in the middle of Södertäljevägen, 3 km from the nearest vertex. The fixture now splits Södertäljevägen at the site (21 corridor ways) and builds each zone's ring from eight short segment ways plus a spoke (90 ring segments); the ring radius is 0.9 km, and each fixture street lies within 120 m of a vertex of its own zone's ring, so patients snap to their own zone and not across the water. This replaces the figures in the batch 6 entry (20 + 10 and 1.2 km).
Rejected: A ring of 1.2 km – it reached the neighbouring zone's streets; adding vertices to the graph rule – the spec defines the vertices.
Spec: SPEC.md § 12.3, § 12.4

## 2026-11-03 – Batch 7 – Reachability on the graph: signatures, state and what counts as affected
Decision: `impact(pack, state, scopeSites, model = getRoadModel())` keeps its three arguments and gains the road model as an optional fourth (the loaded model by default; `null` gives power and water only). The model (`roadModel.ts`) holds the graph, where the two sites and every patient attach, and a baseline per scope computed once and memoised; the geometry loads through dynamic imports (`geoData.ts`, `import.meta.glob`, so a missing `roads.json` is not a build error) when `/home` opens, and the store learns of it through `home.geoReady`, which recomputes the impact. Dijkstra is multi-source: the distance is the minimum over the sites in scope. `delayed` is `d > baseline` and (`d ≥ 1.25 × baseline` or `d ≥ baseline + 3 000 m`). A patient with no road within 1.5 km, or unreachable already at baseline, is a property of the data and not an effect of a closure: it is not a row in `impact`, and the list shows the chip "Ingen väg inom 1,5 km" for the first kind. `zoneStatus` and `roadDistances` are removed as the spec says, and `Impact` no longer has `zoneStates` (`summary.unreachableZones` is derived from the unreachable patients). The state is `blockedWays` (OSM ids as strings), `blockedRoads` (`name` or `name|ref`) and `blockedNodes` (InfraNode ids, expanded to `osmWayNames`); `blockedLinks` and `toggleBlockedLink` are gone with the corridor links. The log names a closed way by name, ref or OSM id.
Rejected: Counting patients without a road as affected by every closure – test 5 requires a Huddinge power outage to flag exactly the Huddinge patients; a global singleton for the graph without a parameter – the tests would depend on load order.
Spec: SPEC.md § 12.3

## 2026-11-03 – Batch 7 – The roads layer, the tap and "Blockera hela vägen"
Decision: `RoadsLayer` draws the roads as one Leaflet GeoJSON layer on a canvas renderer (thousands of ways): motorway and trunk 3 px, primary 2.5 px, secondary 2 px, a second layer under the bridges that is 2 px wider in the muted text colour (a 1 px lighter casing on each side), tunnels dashed, closed ways in the danger colour one weight heavier. In roads mode the layer is interactive with a 6 px tolerance and shows a tooltip with name and ref; a tap closes that way, or, with the switch "Blockera hela vägen" on, every way with the same name (and ref). Outside roads mode the layer takes no clicks. The seven named bridge and tunnel markers stay and close their `osmWayNames`. The switch is view state and is not logged; each closure is. The corridor links are deleted from the pack; water and el links stay.
Rejected: SVG polylines per way – thousands of DOM nodes; a layer that is always interactive – it would swallow the map clicks that clear the selection.
Spec: SPEC.md § 12.4

## 2026-11-03 – Batch 7 – Which existing tests changed, and why
Decision: Only tests that depended on the corridor graph changed. `reachability.test.ts`: the tests of `roadDistances`, `zoneStatus` and the corridor scenarios are replaced by the five cases of § 12.4 (and a few more) on the real graph or the fixture; the `prioritise` tests are untouched apart from two fields the patient helper needs (`street`, `houseNo`). `store-home.test.ts`: the tests that closed corridor links now close a way and a road, the "75 av 150" scope test closes the eight crossings by name, and the file loads the road model first. `home-geo.test.ts`: one assertion used a road link and uses an el link. `karolinska.test.ts`: the road link count is 0 instead of 24. All 96 original tests, and every other test, are unchanged.
Rejected: Keeping the corridor links to keep the tests – § 12.4 deletes them.
Spec: SPEC.md § 12.4

## 2026-11-03 – Batch 8 – OSM positions are applied when the geometry loads, and fixture positions say they are fixtures
Decision: `applyOsmNodes` (pure, `osmNodes.ts`) gives Överby, Beckomberga, Hagby, Skanstull and Görväln the centroid of the matching object of `power.json` or `water.json` (name contains the term, case-insensitive; when several match, the one nearest the old estimate) and adds Kolbotten the same way; the rules are `OSM_MATCHES` in the pack. The result is held in `home.infraNodes` (the pack's nodes until the geometry has loaded, kept across a demo reset) and the map, the panel and the selection read it. A node with no match keeps its fallback estimate, the miss is written with `console.warn` and returned as `missing`, and no Kolbotten is added. With real data the coordinate is `reported` with source "OpenStreetMap, <query date>" (the date is read from `geo/README.md`); while only the fixture exists the positions are `illustrative` with the source "Fixture standing in for OpenStreetMap data that has not been fetched", because showing invented positions as OpenStreetMap's would be false. The pack's five estimate basis texts are deleted: they are now the one string "Fallback estimate, used when OpenStreetMap has no matching object (DATA.md § 12)". `e-regionnat` stays hollow and illustrative.
Rejected: Replacing the coordinates in the pack file by hand – the data is not fetched; marking fixture positions `reported` – dishonest; writing the mismatch into DECISIONS.md at run time – a log line is what a running app can write.
Spec: SPEC.md § 12.5, DATA.md § 12

## 2026-11-03 – Batch 8 – Kolbotten's texts come from the documents the data cites, and the lines replace one link
Decision: Kolbotten's role and status say only what DATA.md § 11.2 and its sources say (the name appears as the destination of the planned 400 kV lines from Beckomberga, S-H7 and S-H9; the station's own role and the timeline are "to verify"); the node is `verified: true` (it is not hollow) and its position carries the confidence of the match. The hand-drawn el link Överby–Beckomberga is deleted and `power.json` lines are drawn in the el layer as polylines (3 px for 400 kV, 2 px otherwise, 30 % opacity while a node is selected) with a permanent label "400 kV", "220 kV" or "400/220 kV"; the off-map arrows and the two `e-regionnat` links stay. DATA.md § 11.1–11.2 is updated in place: the five estimate bases are replaced by the OpenStreetMap matches, the Kolbotten note says it is added from OpenStreetMap, and the intro says what a node without a match and the fixture do.
Rejected: A Kolbotten position typed in from memory – none is established; keeping the hand-drawn link next to the real lines – two lines for one connection.
Spec: SPEC.md § 12.5, DATA.md § 11.2

## 2026-11-03 – Batch 9 – The ODbL attribution appears with OpenStreetMap data, not with the fixture
Decision: The tile layer always carries the OpenStreetMap attribution. On `/home` the text "Väg- och elnätsdata © OpenStreetMap contributors, ODbL" is added after it when at least one of the four geometry files comes from OpenStreetMap; while only the fixture is loaded it is not, because the fixture is not OpenStreetMap's data and claiming it would be false. `geo/README.md` carries the attribution in both states. `NodeMap` gets the optional props `attributionExtra` and `fitPadding`.
Rejected: Showing the ODbL text on the fixture – misattribution; leaving it out when data arrives – the licence requires it.
Spec: SPEC.md § 12.2, § 12.6 batch 9

## 2026-11-03 – Batch 9 – The map fits the zones, with labels placed by hand, and the list shows the street
Decision: On load `/home` fits the box around the ten zone circles (`homeFitPoints`, 24 px padding) and nothing else; sites, markers, lines and arrows outside it are reachable by panning. The zone labels sit on chosen sides of their points (left, right, above, below, with small offsets); at 1 280 px, where the map pane is 580 px wide, the ten labels do not overlap, which fitting alone does not achieve for the dense middle (Solna, Innerstaden, Södermalm, Söderort). A patient row shows "Street 12" followed by the zone's name in muted text, then the team; the zone stays because the list is flat when a disruption is active. The fixture's street names read "Provgatan i Solna" because they are not real streets. Screenshots in `docs/screenshots/home/` are retaken (seven, as before) and show the fixture map without tiles. README step 6 is rewritten for the real map, the fetch and generator commands and the road interaction; it quotes no counts that depend on the road data.
Rejected: A label-collision library – ten labels; quoting counts from the fixture in the README – they change with the real data.
Spec: SPEC.md § 12.6 batch 9

## 2026-11-03 – Batch 10 – Routes: the spec's English names map to the app's routes, and Start moves to /start
Decision: § 12.7 lists `/start`, `/home`, `/capacity`, `/incident`, `/evacuation`, `/resources`, `/network`; the app's routes are Swedish (SPEC.md § 3), so the resilience routes are `/start` plus the paths of `MODULE_DEFS` (`/laget-nu`, `/home`, `/kapacitet`, `/incident`, `/evakuering`, `/resurser`, `/natverk`) and their children, read from the module list as the spec asks. Start page moves from `/` to `/start`; `/` is `RootRedirect`, which goes to `/start` when the mode is active and to `/patients` otherwise, and so does the unknown-route fallback. The logo links to `/`; the demo reset and the story's fallback route go to `/start`. `/kallor` is in neither group: it is linked from every confidence chip and must not switch the nav.
Rejected: Renaming the routes to English – SPEC.md § 3 and the old-route redirects fix them; leaving Start on `/` – the root has to redirect.
Spec: SPEC.md § 12.7, § 3

## 2026-11-03 – Batch 10 – The mode is derived; only the manual flag is state; what "scenario" and "logged" mean
Decision: `preparednessActive(state, route)` (`lib/preparedness.ts`) is the only definition; the nav, the root redirect and the close control all call it. `preparednessOn` is the manual flag in the main store (default false, cleared by the demo reset). "A scenario is running" is read as `scenario !== null`, a scenario in effect until "Stoppa": the state does not end at its horizon, and the figures it drives stay on the pages. Logging: `setPreparedness` writes the entry for a flag change itself (reason "manual"), and a hook in the layout writes one for a change of the derived mode that the flag did not cause, with the reason "incident", "scenario" or "route" (`preparednessTransition`, pure and tested); the first render counts as a change from off, so opening `/home` directly logs "route". An entry's `ref` is the reason token and its detail "Orsak: …"/"Reason: …" in the current language. Closing on a resilience route sets the flag and navigates in one handler, so it logs "off (manual)" once and not again for the route.
Rejected: Storing the derived mode – it would drift from the incident and the route; logging every flag read – only changes matter.
Spec: SPEC.md § 12.7

## 2026-11-03 – Batch 10 – The 2 100 px breakpoint and the width-tuned gaps are removed; the two states carry the fit
Decision: Removed: the collapse of the platform tabs at 2 100 px, the breakpoint ladders of batches 2 and 3 (`min-[1440/1536/1600/1680/1760px]` on the nav gap, the header padding, the left margin, the cluster gap, the clock and theme button sizes, the decorative icons and the clock's margin). Normal operation has room and uses the roomy values (24 px between tabs, 12 px padding, the three decorative icons, 28 px buttons); preparedness mode needs the width and compacts through one flag on the header (`data-prep`): tabs 15/500 with 6 px gaps, a 28 px indicator at 13/500, 24 px clock and theme buttons, a 56 px Demo button, 28 px avatar, no decorative icons. The states, not the viewport, decide. Measured in a headless browser: no horizontal scroll in either state, in Swedish or English, at 1280, 1366, 1440 and 1920 px; the tightest case is English preparedness mode at 1280 px with 9 px to spare. DESIGN.md's 16/500 and 32 px gap are kept in normal operation and given up (15/500, 6 px) only in preparedness mode at 1280 px; the compaction is the same at 1920 px, which is the price of having no breakpoint. The scenario chip beside the clock (about 200 px, already overflowing the header on main when a scenario ran at 1280 px) shows from 1700 px; below that the scenario's name is the clock's title and the panel's heading.
Rejected: A viewport-based compaction again – the spec removes it; a second header row – every module's page height assumes a 48 px header; leaving the chip – it made the header scroll at exactly the moment a scenario turns the mode on.
Spec: SPEC.md § 12.6 batch 10, § 12.7, DESIGN.md § 3

## 2026-11-03 – Batch 10 – Button, indicator and close control
Decision: "Beredskap" is the outlined (secondary, small) button after the divider; it sets the flag and opens `/start`. In preparedness mode the indicator is a filled pill in the accent colour (the danger red token, as in § 11.5) reading "Beredskapsläge" with a close control (an X button, `aria-label` "Stäng beredskapsläget"). Closing clears the flag and, on a resilience route, opens `/planning`; with an incident active or a scenario in effect the control is disabled (`aria-disabled`, reduced opacity) and its tooltip, on a focusable wrapper because a disabled button takes no pointer events, reads "Avsluta incidenten eller scenariot först" / "End the incident or scenario first". White text on the red token is 4.45:1, a little under the 4.5:1 that DESIGN-DARK.md asks of chip text; black would be 4.72:1 but reads wrongly on a status fill, and the text is 13/500 beside an icon, so white stays; no new colour is introduced. The scenario controls (play, step, reset) show only in preparedness mode, as does the scenario chip; the decorative icons only in normal operation. The scenario presets open the mode by navigating to `/home`. The nav is tested as a pure model (`navModel`: platform tabs and no resilience tab when inactive, the reverse when active) because the test setup has no DOM; the rendering is checked in the browser.
Rejected: Hiding the close control while blocked – the tooltip explains why it is unavailable; black text on red – wrong register for a status.
Spec: SPEC.md § 12.7

## Time, teams and Lund build

## 2026-11-04 – Batch 11 – Base branch, headings and the prompt
Decision: `real-geo` exists on the remote and is not merged into `main`, so `home-ops` starts from `origin/real-geo` (the PR description says so). The embedded SPEC.md § 13–14 and DATA.md § 13–14 are appended verbatim; only Markdown heading marks (`##`, `###`) were added to the section titles, as § 11 and § 12 have them, and the bullet list of § 13.3 keeps its `*` markers. PROMPTS.md holds the instruction text and refers to the two documents, as for § 11 and § 12. The session was started on `claude/busy-sagan-webptf`; the prompt names `home-ops`, which wins.
Rejected: Starting from `main` – it lacks § 12 and the geometry the new sections build on; rewriting the headings to match the prompt's plain numbering – the file's own style is Markdown.
Spec: SPEC.md § 13.6 batch 11, § 14.6

## 2026-11-04 – Batch 12 – A record carries `targetKind`, `endedAt` and `endReason`; the sets stay in the state
Decision: `HomeDisruption` has the fields of § 13.2 plus `targetKind` (`way` | `road` | `node` | `zone`, because the spec's single `target` string cannot tell an OSM way id from a road name), and `endedAt` / `endReason` (`manual` | `expected` | `reset` | `replaced`) so an ended record stays as history. `blockedWays`, `blockedRoads`, `blockedNodes`, `powerOutZones` and `waterOutZones` remain fields of the home state, recomputed by `deriveSets` whenever the records change, so every § 11–12 reader and test works untouched; the spec's `blockedLinks` is these road sets. A map tap on something already disrupted ends its record, else starts one with `source: 'map'`; presets replace the active records and create `source: 'preset'` ones without an end time.
Rejected: Selectors computing the sets on every read – every existing call site passes `home` as a `Disruptions`; inferring the target kind from the string – a road named "123" would be a way.
Spec: SPEC.md § 13.2

## 2026-11-04 – Batch 12 – The "+1 h" control, expiry and where the clock moves
Decision: `advanceClock(minutes)` is a store action next to `stepClock`: it moves the shared clock, settles discharges, writes one log entry ("Flyttade fram klockan", "+60 min", stamped with the new time, no extra minute) and lets expired records end. It does not run scenario ticks; a running scenario is advanced by its own controls as before. Expiry (`settleHomeDisruptions`) runs after every log entry and every `stepClock`, like the discharge settling, and logs "Störning avslutad (beräknad tid nådd)" attributed to System. A record is expired when `clock >= expectedEnd`.
Rejected: Running scenario ticks for the 60 minutes – the spec keeps the scenario controls separate; a timer – the clock is state, not wall time.
Spec: SPEC.md § 13.2

## 2026-11-04 – Batch 12 – Battery fields are optional on `ImpactRow`; "within 2 h" includes the empty
Decision: `impact` takes the clock as an optional fifth argument and `Disruptions` an optional `powerStart` map, so callers and tests that pass neither (the 201 earlier tests) get no battery figures and unchanged results. `batteryEmptyAt` and `batteryEmpty` are optional on `ImpactRow` for the same reason. A row whose battery is empty is critical regardless of equipment and sits in priority tier 2. "N run out within 2 h" counts power-out patients whose `batteryEmptyAt <= clock + 120`, which includes those already empty. `prioritise` sorts by tier, then `batteryEmptyAt`, then battery hours for rows without a deadline, then name.
Rejected: Counting only the not-yet-empty – a patient with an empty battery is the worst case of "runs out within 2 h"; requiring the new fields – it would change the earlier tests.
Spec: SPEC.md § 13.2

## 2026-11-04 – Batch 13 – Teams and visits are pulled forward from § 14 as data; Send team offers all four teams for now
Decision: Move visit needs the team's free slots (§ 14.3) and Send team needs teams (§ 14.2), which batches 15 and 16 define. Batch 13 therefore adds the data only: `homeTeams` (`home-teams.ts`) and `homeVisits` (built by the pure, seeded `buildVisits`, seed 20261104, one visit per patient with `visitToday`), plus the slot helpers in `home-visits.ts`. Send team lists all four teams in this batch; batch 15 restricts the list to the teams that can reach the patient (`reachableBy`). Reachability, markers and the Planning page stay in their own batches.
Rejected: Stubbing Move visit and Send team until batches 15–16 – the batch's definition of done needs a working chain; generating visits in `scripts/generate-patients.mjs` – the spec asks for "deterministic from the seed", and a pure function is testable without a script run.
Spec: SPEC.md § 13.3, § 14.2, § 14.3

## 2026-11-04 – Batch 13 – A team may start as many visits per slot as it has cars; slots before the clock are not offered
Decision: With four teams and 60 visits today one team has more visits than there are slots between 08:00 and 17:00, so "free slots not used by its visits" cannot hold with one visit per slot. A slot is free for a team while fewer of its live (not cancelled) visits start there than it has cars (two); the generator respects the same limit. Move visit offers free slots from the clock onwards (a slot in the past cannot be booked), plus "inget besök i dag", which cancels the visit. A planned or moved visit whose end the clock has passed reads as done (`visitStatusAt`), so the stored status does not depend on the clock. Send team makes the sent team the patient's serving team for the visit (`effectiveVisits`) without rewriting the visit.
Rejected: One visit per slot – impossible for ASIH Nord; offering past slots – the clock is the only time; storing `done` – it would go stale when the clock moves.
Spec: SPEC.md § 14.3, § 13.3

## 2026-11-04 – Batch 13 – Status chain: never backwards, reset on the affected set, work lives in the home slice
Decision: The work on a patient is `home.work[patientId] = { status, note, assignedTeam, bringInSite }`; a patient with no entry is Unhandled. An action sets its status only when that is further along the chain (Contact on a Confirmed patient stores the note and logs, the status stays Confirmed). "Status resets only when the disruption that affected the patient ends" is implemented as: after every change that can end a disruption (map toggle, end now, expected end, reset, a preset replacing the others) a patient with work who is no longer affected from the sites in scope loses the entry; one System log entry names the count and carries the ids in `ref`. Every action logs one entry attributed to the current user with the patient id as `ref`. "Contact all critical" is one entry with the count and ids, not one per patient, so one click does not move the clock by 17 minutes; its note is the vocab text "samlad kontakt" / "bulk contact".
Rejected: A reset per disruption record – a patient hit by two disruptions would lose the work when the first ends; one log entry per bulk patient – it floods the log and the clock.
Spec: SPEC.md § 13.3, § 14.4

## 2026-11-04 – Batch 13 – Bring in: nearest site in scope, an inbound line, no move record
Decision: "Ta in" marks the patient for the nearest site in scope by straight-line distance (both sites when the scope has none) and sets Planned. In Evakuering the patient appears in a section "Från hemmet (N)" above the wards, with an "Från hemmet" chip, street and equipment; it is not selectable, has no move record, is not counted in "flyttade" and is not filtered by the stability, transport and status filters. It disappears when the status resets with the disruption.
Rejected: A move record with a "home" origin – the spec says none; counting it in the evacuation target – it would present a transfer that has no transport.
Spec: SPEC.md § 13.3

## 2026-11-04 – Batch 13 – The call list is a route; actions are offered on affected rows
Decision: "Ringlista" opens `/home/ringlista`, a plain page inside the app shell whose nav, banner and scenario panel are `print:hidden`, with `@page { size: A4 }`; it has a Print button and a link back. It lists the prioritised affected rows (detour-only rows are not affected and not listed). The row's expanded view with the status chain and the five buttons exists for affected rows; a detour-only or unaffected row expands to nothing. The route belongs to the resilience routes because it starts with `/home/`.
Rejected: A new window with hand-written HTML – no vocab, no theme; actions on every row – the spec says "each affected patient".
Spec: SPEC.md § 13.3

## 2026-11-04 – Batch 14 – Messages carry both languages as optional `textEn` and `roleEn`; the thread can be read-only
Decision: `Message` is reused with two optional fields, `textEn` and `roleEn`; `MessageThread` shows them in English mode and keeps the Swedish text for every message that has none (the node messages stay Swedish, DESIGN-LANG.md § 4). The thread gets two optional props, `readOnly` (no input row, the list is a set of notices) and `createLabel` ("Skapa störning"). The three notices are the texts of § 13.4 verbatim; the senders are invented names (Gunnar Salo, Irene Falkman, Bo Strandman), none of them a Karolinska employee, and the pack and the tab say the events never happened.
Rejected: A second message type – the spec says reuse; English-only translation of the whole thread – out of scope.
Spec: SPEC.md § 13.4, DATA.md § 13

## 2026-11-04 – Batch 14 – How a notice is read, and what the form does
Decision: `parseDisruptionMessage` (pure) decides the kind from words (power: strömavbrott, elavbrott, power outage; water: kokningsrekommendation, vattenstörning, boil-water; otherwise road), so the organisation name "Stockholm Vatten och Avfall" does not make a road notice a water one. The target is the longest road name of `roads.json` found in the text, or the zone whose full name or first words ("Solna" for "Solna och Sundbyberg") occur. The duration is "N timmar/hours", or the time from the clock to the next occurrence of a "HH:MM" in the text (20:30 at 14:41 gives 5.82 h, rounded to two decimals; the record ends at start plus the rounded minutes). A road is closed by name, so every way of "Essingeleden" closes; when the road names have not loaded the target stays empty and the user types one (the field has a datalist of the names). The note is "Meddelande <id>" and is stored on the record (`note`) and written to the log detail with the source. Creating a disruption that is already active is ignored with a toast.
Rejected: A select with every road name – the real data has hundreds; creating from the notice without a form – the spec says the user confirms.
Spec: SPEC.md § 13.4

## 2026-11-04 – Batch 14 – "Från meddelande" is a tab of the middle panel; the card sits under the key figures
Decision: The middle panel of `/home` gets two sub-tabs, "Läge" (the existing panel) and "Från meddelande"; creating a disruption switches back to "Läge". The "Sjukhus hemma" card is a full-width `Card` under "Nyckeltal" on the start page, with the four figures as `FigureText` with confidence `illustrative` (basis: the patient-data marking) and a link to `/home`. It renders only when `preparednessActive` is true. The road graph is loaded by the card only while a road is closed, since "unreachable" needs it and nothing else on the start page does; the geometry files stay out of the first load. "Battery empty within 2 h" is the summary's `runOutWithin2h`.
Rejected: Loading the geometry on every start page visit – § 12.2 keeps it to `/home`; a card per figure – the spec says one card.
Spec: SPEC.md § 13.5, § 12.2

## 2026-11-04 – Batch 14 – The store is on `window` in development only
Decision: `main.tsx` assigns the zustand store to `window.__store` when `import.meta.env.DEV`, so a browser script can set and read the demo state while the definition of done is checked. It is absent from the production build.
Rejected: Importing the store from the script – the dev server serves a second module instance after an edit, and the script then reads another store than the page.
Spec: CLAUDE.md "A batch is done when ... checked in the running app"

## 2026-11-04 – Batch 15 – Team reach is computed for every patient; "own team cannot reach" is relative to the baseline
Decision: `impact` returns `teamReach` (a map from patient id to `reachableBy`, `nearestTeam` and the road length from each team) for every patient with a road, and rows carry the same two fields, because a patient whose own team is cut off need not be an affected row (a site can still reach them). `teamDistances(graph, team, blocked)` snaps the base like a site and runs Dijkstra; the road model snaps every base once and memoises the baseline distances of all teams. "N patients whose own team cannot reach them" counts patients whose own team reached them with nothing closed and does not now (a patient the own team never reached, or with no road within 1.5 km, is a property of the data and not counted); "M of them reachable by another team" are those with a nearest team now. `reassignments` lists those M, each with the nearest team as the suggestion. The fields are optional on `ImpactRow` so the earlier tests, which build rows by hand, are unchanged.
Rejected: Counting a team that cannot reach a patient at baseline – it would show a cut that was never caused by a disruption; a row only for team-cut patients – the spec's "affected" does not include them.
Spec: SPEC.md § 14.2

## 2026-11-04 – Batch 15 – Map markers, colours and the Send team list
Decision: Team markers are 10 px squares in colours taken from the icon tokens of the node palette by the team's place in the pack (primary, purple, indigo, orange), with a permanent label of the team name; the base label, the cars and the name are in the marker's title (browser tooltip). The tokens avoid the danger red (blocked and affected), green (operational) and the layer colours teal and olive. Two Leaflet tooltips on one marker replace each other, so there is one. Markers show in every mode and at every scope; the scope selector does not filter teams. Send team now offers only the teams in `reachableBy` for the patient, and says so when none reaches them; without road data all four are offered. "Flytta till <team>" is `sendTeam` for the nearest reaching team and disappears once that team is recorded.
Rejected: Colours outside the palette – DESIGN.md allows tokens only; a permanent label with the base label – it repeats the zone label printed at the same place.
Spec: SPEC.md § 14.2, § 13.3

## 2026-11-04 – Batch 16 – Planning and Patients: layout, the shared detail pane and what normal mode keeps
Decision: `/planning` is list (380 px, visits grouped by the serving team with the base label, sorted by start), pane (320 px) and map; the map shows the team of the selected visit, else the team chosen with the four team chips above it, else the first team with visits, as numbered stops (circles in the team's colour, a dashed line from the base in driving order) over the road layer; a cancelled visit is not a stop. A team sent to a patient takes the visit over in the groups (`planningGroups`). `/patients` is a 380 px list of the 150 patients (name, age, team, street, equipment, sorted by name) with the detail pane beside it. Both panes are `PatientDetail`: name, address, team, equipment, battery, today's visit, and in preparedness mode the disruption flags, the teams that reach the patient and, for an affected patient, the status chain and the five actions (`PatientActions`); /home's expanded row uses the same `PatientActions`. Without preparedness mode the pane offers only Move visit, which is plain planning and the only way to change a slot; a move outside a disruption changes the slot and is logged but creates no status entry (status moves only for an affected patient).
Rejected: Hiding Move visit in normal mode – the page would then have no way to change a slot, which is its purpose; a second map component – `NodeMap` with the overlay gained a `sequence` and `fitPoints`; dragging – the spec says it is not required.
Spec: SPEC.md § 14.3, § 13.3

## 2026-11-04 – Batch 16 – The geometry loads on Planning, and flags use the same impact as /home
Decision: Planning needs the road layer in every mode, so `useHomeGeo` runs on `/planning` (a dynamic import, as on `/home`); `/patients` loads it only in preparedness mode, where the flags need the road graph. The flags are the rows of `useHomeImpact`, so Planning, Patients, Home and Start can never disagree. `usePreparednessActive` reads the same state and route as the nav.
Rejected: A copy of the impact for Planning – it would drift; geometry on Patients in normal mode – nothing there uses it.
Spec: SPEC.md § 12.2, § 14.3

## 2026-11-04 – Batch 16 – The log drawer filter: entries carry an `area`
Decision: `AuditEntry` gets an optional `area: 'home'`, set by the module's `logHome` wrapper in `store-home.ts` (every log call of the slice, including System entries such as expiry and status reset). The log drawer has one toggle chip "Sjukhus hemma" that shows only those entries; older entries and the pack's initial log have no area. Matching on the object text was rejected: most entries name a patient or a road.
Rejected: Filtering by object or action text; a new log store – § 14.4 asks only for a filter.
Spec: SPEC.md § 14.4

## 2026-11-04 – Batch 17 – The pack switch swaps the home members of `pack`; `homePacks` is the registry
Decision: `homePacks: Record<HomePackId, HomePack>` (`packs/home-packs.ts`) holds the data of each home pack in the shape of § 14.5 (id, name, sites, zones, patients, teams, visits, infraNodes, infraLinks, messages, geo as dynamic-import loaders), with four additions the spec does not list: `presets` (the scenario presets name nodes and zones, so each pack needs its own), `sources` (S-H1…S-H14 and S-L1…S-L5), `osmMatches` and `osmExtra` (how nodes find their OpenStreetMap object; Kolbotten for Karolinska). The data stays where it was written (`karolinska.ts`, `lund.ts`, the generated patient files). `DataPack` keeps its home members and gains `homePackId`; they are the active home pack's, and `setHomePack` replaces them with `withHomePack(pack, id)`, so every reader of `pack.homeZones`, `pack.homePatients` and the rest, and every test written against them, works for either pack without a change. The hospital members are the same objects. Switching resets disruptions, work and visits (they belong to a pack's patients), keeps the map layers, writes one log entry ("Bytte sjukhus för Sjukhus hemma till …", area home), and a demo reset returns to Karolinska. The scope selector is ignored for `/home`, `/planning` and `/home/ringlista` with the Lund pack: reachability runs from `suslund` (`homeSitesInScope`), the selector is disabled and dimmed with the title "Gäller inte SUS Lund".
Rejected: A second store field with every consumer reading `homePacks[id]` – a hundred call sites and all the earlier tests would change; rewriting `karolinska.ts` into the new shape – the data did not need to move.
Spec: SPEC.md § 14.5

## 2026-11-04 – Batch 17 – Geometry per pack, models per pack, Karolinska files moved
Decision: The Karolinska geometry files moved with `git mv` to `src/data/packs/geo/karolinska/` (fixtures and README); the Lund fixture is in `geo/lund/`. `loadGeoData(packId)`, `loadRoadModel(pack)`, `applyOsmNodes(…, packId)`, `getAppliedNodes(packId)` and `loadQueryDate(packId)` are per pack and cached per pack; `getRoadModel()` returns the model of the pack the store has switched to (`setActiveRoadPack`). Road-graph site ids are plain strings (`suslund`), so `impact` takes `string[]` as scope sites; a scope that yields none still falls back to Solna and Huddinge, which only Karolinska can produce. The Karolinska behaviour is unchanged: every test from before batch 17 passes untouched.
Rejected: One road model with both packs in one graph – the two regions are 500 km apart; leaving the files at `geo/` – § 14.5 moves them.
Spec: SPEC.md § 14.5, § 12.2

## 2026-11-04 – Batch 17 – Overpass was unreachable again; the fetch script takes a pack, the Lund fixture stands in
Decision: `curl` to `https://overpass-api.de/api/interpreter` is refused by the session's proxy (HTTP 403 on CONNECT), so the fallback of § 12 applies for Lund too. `scripts/fetch-osm.mjs [pack] [--bbox s,w,n,e]` writes `geo/<pack>/*.json` and its README; Karolinska's queries stay the verbatim files of § 12.2, Lund's are generated from `osm-convert.mjs` (`PACKS`, `buildQuery`) and committed under `scripts/overpass/lund/` (`--write-queries` regenerates them without network). `scripts/make-geo-fixtures.mjs [karolinska|lund]` writes the Lund fixture: 12 named ways (the two interchanges are the ways "Trafikplats Lund Norra" and "Trafikplats Lund Södra", the only exits from the city to E22, väg 108 and väg 102), 63 ring segments for the seven zones, 112 street segments, three 400 kV substations (Hurva, Barsebäck, Sege) and two water works (Ringsjöverket, Vombverket) at positions a little off DATA.md § 14's so a test can tell that the file's position was taken. The command for the real data is `node scripts/fetch-osm.mjs lund`. The Lund patients are generated by `scripts/generate-patients.mjs` (seed 20261017, own random streams) on the streets of that fixture, 150 in the zone counts of DATA.md § 14; the Karolinska output is byte-identical to before.
Rejected: Fetching through another route – CLAUDE.md allows only the Overpass endpoint from the script; dropping the Lund tests until real data exists – the fixture is the agreed fallback.
Spec: SPEC.md § 14.5, § 12.2

## 2026-11-04 – Batch 17 – Lund nodes, links and the interchange test
Decision: DATA.md § 14's nodes are in `lund.ts` with sv/en texts that say what DATA.md says: `reported` Places positions (read 2026-10-17) except Sege ("coordinate to check") and Källby ("coordinate from the adjacent VA SYD works"), which are `estimate` with that basis, and Regionnät 130 kV, which is `illustrative` and hollow. The three hand-drawn links between the 400 kV nodes are not in the pack: the lines come from `power.json` as in § 12.5 (as Karolinska's el links were removed in batch 8), the off-map arrows stay. `r-lund-s` carries "mer än 50 000 fordon per dygn" (`reported`, S-L3). `r-hoje` has no `osmWayNames`: its OpenStreetMap way name is not established, so tapping it selects it and blocks nothing. Test 3 of § 14.5 blocks the way names of the two InfraNodes; when the data has no way of that name the test prints the ways within 300 m of the node and uses their names, as the spec says (the fixture has both names, so nothing was printed). In the fixture every patient outside Lund is unreachable with both closed, and the city stays reachable. The Lund notices are written like the Karolinska ones (author, role, both languages); the road notice names "E22 vid Lund Södra", which the parser matches to "Trafikplats Lund Södra" by the part after "Trafikplats". The Lund presets are "Trafikplatser avstängda" (both interchanges), "Elavbrott" (Dalby) and "Vattenstörning" (Kävlinge), with their own sentence in the scenario panel.
Rejected: Hand-drawn lines next to the real ones; a Lund road corridor graph – DATA.md says there are none.
Spec: DATA.md § 14, SPEC.md § 14.5

## 2026-11-04 – Batch 17 – Källor, the marking and Bring in follow the pack
Decision: Källor lists the infrastructure sources of every home pack (a second table "Sjukhus hemma: infrastruktur, SUS Lund" with S-L1…S-L5 and the figures that cite them), and the confidence popover finds a source in any of them. The patient marking names the pack's hospital ("Fiktiva patientuppgifter – inte SUS Lunds data."). "Ta in" brings a patient to the nearest site of the pack; for Lund that is `suslund`, which has no Evakuering page, so the patient appears in no inbound list there (Evakuering is Karolinska's).
Rejected: Showing only the active pack's sources – a Källor visitor should see all of them; reusing the Karolinska marking – it would name the wrong hospital.
Spec: SPEC.md § 14.5, DATA.md § 9, § 14

## 2026-11-04 – Batch 18 – The story needs the power notice, and which screenshots exist
Decision: § 14.6 batch 18 lists "create the road disruption from the message, press +1 h twice, contact the critical". With the Essingeleden notice alone nobody is affected (a closed Essingeleden gives detours, not unreachable patients, and "affected" is what makes a row critical), so "Kontakta alla kritiska" would have nothing to act on. The story in the README therefore creates the Ellevio power notice as well, in the same step 5, and every step has been run in the app from `/` to the pack switch (checked with a browser script: Beredskap → Start card → Läget nu → Sjukhus hemma → both notices → +1 h twice, the clock 120 minutes on → bulk contact, 11 critical patients contacted → Planering, a visit moved → SUS Lund). The screenshots (17, `docs/screenshots/ops/`) are `/planning` in normal operation, `/planning`, `/home` and `/start` in preparedness mode, each in Swedish and English, light and dark, plus `/home` with the Lund pack in Swedish and light. `/start` and `/home` are resilience routes, so the mode is on whenever they show; they have no normal-mode state to photograph. The pictures are taken offline, so the map has no tiles. The previous Steg 6 text is kept as "Bakom kartan" under the story, with the fetch command per pack.
Rejected: Pretending that Essingeleden alone produces critical rows; screenshots of `/home` in "normal mode" – the route makes the mode.
Spec: SPEC.md § 14.6 batch 18, § 12.7

## 2026-11-04 – Time, teams and Lund – What was not changed
Decision: No test written before this build was edited (the 201 tests of the base branch are byte-identical, § 12.4's among them); the new tests are in new files. `SPEC.md`, `DATA.md` and `PROMPTS.md` changed only in batch 11. The Overpass data for Karolinska and Lund is still not fetched; the PR description carries `node scripts/fetch-osm.mjs karolinska` and `node scripts/fetch-osm.mjs lund` for a local run, followed by `node scripts/generate-patients.mjs`.
Rejected: Hand-editing the generated files.
Spec: Prompt for batches 11–18

## OpenStreetMap data

## 2026-11-02 – The Overpass endpoint is configurable
Decision: `scripts/fetch-osm.mjs` reads the Overpass endpoint from the environment variable `OVERPASS_URL` and uses `https://overpass-api.de/api/interpreter` when it is not set, so a mirror can be used when the main instance answers 503 or not at all. The container that ran the first fetches could not reach overpass-api.de (HTTP 503, connection reset) or overpass.kumi.systems (no answer). The app still never calls Overpass; only this script does, and the files it writes are committed.
Rejected: Hard-coding a mirror – the default stays the public main instance; a command-line flag – an environment variable also works through `npm run fetch:osm`.
Spec: SPEC.md § 12.2

## 2026-11-02 – The fetch script tiles its queries and tries three endpoints
Decision: `scripts/fetch-osm.mjs` splits the bounding box of roads, power and water into four equal tiles (2 × 2), fetches one tile at a time with a 20 s pause between requests and merges the answers, dropping repeats on OSM type and id (a road that crosses a tile edge is returned by both tiles with its full geometry). A 503 or 429 waits 90 s and repeats the same tile, at most three attempts per endpoint; any other failure moves on to the next endpoint. The endpoints are tried in order: `OVERPASS_URL` when set, then overpass-api.de, lz4.overpass-api.de and z.overpass-api.de; the one that answers is used for the following tiles. The street query is built around zone centres, has no bounding box and is sent as one query. The tile query text comes from `buildQuery`, which for Karolinska gives the same query as the SPEC.md § 12.2 files with the tile's box. `TILE_PAUSE_MS` shortens the pause for a test against a local stand-in server; the default is 20 s. Supersedes the default stated in the entry above, which is now the first of the three.
Rejected: Tiling the street query – it has no box to split; one request for the whole box – the public instances time out or answer 503 on the largest road query.
Spec: SPEC.md § 12.2, § 14.5

## 2026-11-03 – A manual workflow fetches the OpenStreetMap data
Decision: `.github/workflows/fetch-osm.yml` runs by hand (`workflow_dispatch`, input `pack`: karolinska, lund or both, default both) on ubuntu-latest with Node 22, the version of `deploy.yml`. It runs `npm ci`, `scripts/fetch-osm.mjs` for the chosen packs, `scripts/generate-patients.mjs` and `npm test`. The tests may fail without stopping the job; their output is saved as the artifact `test-output` and its last 60 lines go in the pull request description, together with the size in bytes of every changed data file. All changed files under `src/data/packs/` are committed as "data: OpenStreetMap geometry <date>" on the branch `osm-data-run`, force-pushed, and a pull request against main is opened with `gh pr create`. The workflow has `contents: write` and `pull-requests: write`. The reason is that the Claude Code container cannot reach Overpass (HTTP 503, connection reset), while a GitHub runner can. If the pull request cannot be opened (for example when the repository setting "Allow GitHub Actions to create and approve pull requests" is off) the branch name is written to the log as a warning and the job still ends without error; if one is already open for the branch, its description is updated. With no changed file nothing is committed. The workflow itself does not run in this repository's tests.
Rejected: Failing the job when the tests fail – the output is the point of a data run; a personal access token – the built-in token with the two permissions is enough.
Spec: SPEC.md § 12.2, § 14.5
