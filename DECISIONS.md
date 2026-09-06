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
