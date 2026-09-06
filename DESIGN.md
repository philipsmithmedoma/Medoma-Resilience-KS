# DESIGN.md – look and feel

The prototype must be indistinguishable in style from the existing Medoma care platform. Everything below was derived from screenshots of that platform. Colour values marked *(exact)* were sampled from flat fills; values marked *(estimate)* were sampled from anti-aliased text or edges and may be off by a few steps. Estimates are good enough – do not "improve" them. Where this document is silent, choose the quietest option that matches the surrounding chrome and log it in DECISIONS.md.

## 1. Tokens

Implement as CSS variables on `:root` and expose them in the Tailwind theme with the same names. All colours are light-theme only.

### Core

| Token | Value | Notes |
|---|---|---|
| `--color-primary` | `#186CE9` *(exact)* | Links, active tab text, primary button fill, active segmented control, selected map marker |
| `--color-primary-hover` | 8 % darker than primary | Derived; hover/pressed on primary buttons and links |
| `--color-text` | `#000000` *(exact)* | Body text, headings, table cells, pill text |
| `--color-text-secondary` | `#5A5A5A` *(estimate)* | Table column headers, field labels, helper text |
| `--color-text-muted` | `#8B8B8B` *(estimate)* | Timestamps, "Start yesterday"-style secondary lines |
| `--color-bg` | `#FFFFFF` | Page and nav background |
| `--color-bg-muted` | `#F5F6F7` *(exact)* | Label column in key–value tables, chat input area, table row hover, page background behind detail cards |
| `--color-border` | `#EAECED` *(exact)* | All dividers: nav bottom border, table row lines, card borders, inactive tab underline, received-message bubble fill |
| `--color-border-input` | `#CCCCCC` *(exact)* | Input, select and textarea borders; disabled button fill |
| `--color-badge` | `#000000` | Count badge fill (white text), e.g. "To plan 5" |

### Semantic

| Token | Value | Use |
|---|---|---|
| `--color-red` | `#E33026` *(exact)* | Notification dots, unread badges, "Critical" text |
| `--color-red-icon` | `#EB5757` *(exact)* | Red icons and status glyphs |
| `--color-red-light` | `#FDEEEE` *(exact)* | Tinted background behind red icons |
| `--color-red-pill` | `#FAC4C4` *(exact)* | Role pill fill, `Doc` |
| `--color-orange` | `#F2994A` *(exact)* | Warning icons, warning chip border |
| `--color-orange-light` | `#FEF5ED` *(exact)* | Warning chip fill, tinted icon background, avatar fill |
| `--color-orange-pill` | `#FFCF99` *(exact)* | Role pill fill, `Supp` |
| `--color-orange-text` | `#9A7040` *(estimate)* | Warning chip text |
| `--color-brown` | `#7B460A` *(exact)* | Avatar initials |
| `--color-green` | `#1AA339` *(exact)* | Positive icons, "Ok" text, done checks |
| `--color-green-text` | `#2C872B` *(exact)* | Duration pill text ("~30 min"), positive chip text |
| `--color-green-light` | `#E8F6EB` *(exact)* | Positive chip fill, duration pill fill |
| `--color-green-pill` | `#CBE8C0` *(exact)* | Role pill fill, `AsPr` |
| `--color-blue-pill` | `#CDDFFF` *(exact)* | Role pill fill, `Nrs` |
| `--color-indigo` | `#7488ED` *(exact)* | Video/imaging icons |
| `--color-indigo-light` | `#F1F3FD` *(exact)* | Tinted background behind indigo icons |
| `--color-purple` | `#BB6BD9` *(exact)* | Surgery/oxygen-type icons |
| `--color-purple-light` | `#F8F0FB` *(exact)* | Tinted background behind purple icons |
| `--color-teal` | `#13A0B9` *(exact)* | Team glyph "△Blå" |
| `--color-olive` | `#B9AB41` *(estimate)* | Team glyph "◇Gul" |

### Semantic mapping used by the prototype

| Meaning | Treatment |
|---|---|
| Operational, Synced, Ok, Done, Stable, Received, Handed over | green chip (green-light fill, green border, green-text) |
| Degraded, Delayed, Low, Estimated, Monitor, Standing up | warning chip (orange-light fill, orange border, orange-text) |
| Offline, Critical, Out of service, Rejected | red chip (red-light fill, red-icon border, red text) |
| Unknown, Not started, Not shared | grey chip (bg-muted fill, border, text-secondary) |
| In progress, Planned, Requested, Accepted, Allocated, Dispatched, Transport assigned, Departed, Arrived | blue chip (blue-pill fill, primary border, text) |
| Professions | role pills exactly as the platform: `Doc` red-pill, `Nrs` blue-pill, `AsPr` green-pill, `Supp` orange-pill |
| Priority | text only: Low/Normal in text, High in orange, Critical in red, all weight 500 |
| Incident banner, Level 1–2 and IT outage | orange-light fill, 1 px orange top and bottom border, black text |
| Incident banner, Level 3 | red-light fill, red-icon borders, black text |

Colour never carries meaning alone: every chip has its label text.

## 2. Typography

- Family: Inter (variable), via `@fontsource-variable/inter`. No second family.
- Weights: 400 body, 500 nav labels and emphasis, 600 headings and large figures. Nothing bolder.
- Scale (px / line-height): page title 24/32 (600); section heading 18/28 (600); nav and sub-tabs 16/24 (500); body, tables, forms 15/22 (400); small (pills, chips, timestamps, helper text) 13/18 (400); large figure on capacity cards 32/40 (600).
- Numbers in tables and figures use `font-variant-numeric: tabular-nums`. No monospace anywhere.
- Sentence case everywhere. No all-caps, no tracked-out eyebrow labels, no single accented word in a heading.
- Times as `HH:MM` (24 h). Dates as "Friday 4 September". Relative offsets as "+30 min".

## 3. Chrome

**Top navigation** (48 px high, white, 1 px bottom border `--color-border`, no shadow):
- Left, 16 px padding: the logo symbol (`assets/logo-symbol.svg`, 24 × 24, black), then the scope selector rendered as the scope name at 18/600 followed by a chevron; it opens a dropdown listing all nodes (SPEC.md § Scope).
- Module tabs: 16/500 text, 32 px gap, `--color-text`; the active tab is `--color-primary` with a 3 px primary bar along the very top edge of the nav spanning the tab's width (this is how the platform marks the active module – a top bar, not an underline). Existing modules first, then a 1 px vertical divider (`--color-border`, 20 px tall), then the new modules.
- Right cluster: three decorative 20 px line icons (message-square, headphones, book-open) rendered as non-focusable `<span>`s with `title` attributes "Chat", "Support", "Documentation"; the "Demo" button (secondary, small); the avatar – 32 px circle, `--color-orange-light` fill, initials 14/600 in `--color-brown`; the user's name 16/400.

**Incident banner** (only when an incident is active): full width directly under the nav, 40 px, fill and borders per the mapping above, text 15/500: "Incident mode active: {playbook name}. Activated {HH:MM} by {name}. Incident commander: {name}." with two links on the right: "Open incident" and "Close incident".

**Sub-tabs** (second-level navigation inside a module, as in Patients → Activities/Measurements/…): 16/500, 12 px vertical padding, 2 px underline – primary for the active tab, `--color-border` for inactive; counts in parentheses after the label, e.g. "Requested (3)".

**Content area**: full width, 24 px horizontal padding, 16 px top padding, no max-width container, sections separated by 32 px. Page title 24/600 with the scope name after it in `--color-text-secondary` where the module is scoped.

## 4. Components

**Tables**: column headers 15/400 `--color-text-secondary`, sortable header shows a small ▲/▼; rows 40 px, 1 px `--color-border` between rows, no outer border, no zebra, hover `--color-bg-muted`; first column may carry row-state icons (as the platform's chat/ECG icons). Filterable tables use a dropdown in the column header (a chevron beside the header label opening a checklist of values) rather than a separate filter bar.

**Grouped lists** (as the platform's Activities view): group heading 18/600 with count in parentheses, then rows with a 40 px tinted icon tile at the left, main text, secondary columns, and pills at the right.

**Cards**: white, 1 px `--color-border`, radius 8 px, padding 20 px, shadow `0 1px 2px rgba(0,0,0,0.04)`. Card header: 40 px icon tile (radius 8, tinted background, 20 px coloured icon) followed by the title 18/400. A card's action is a text link at the bottom ("Show detail").

**Capacity card** (prototype-specific, built from Card): title row as above; the figure 32/600 with its unit 15/400 beside it; a 13 px line "12 verified + 2 estimated" (omit when all verified); a 13 px line "Last confirmed 14:32 (EHR)" in `--color-text-muted`; an "Estimated" warning chip on the title row when the figure is not verified; link "Show detail".

**Buttons**: height 36 px, radius 6 px, 16 px horizontal padding, 15/500. Primary: primary fill, white text. Secondary: white fill, 1 px primary border, primary text. Tertiary/create: text link in primary with a leading plus icon, e.g. "+ New request", "+ Add task". Destructive actions use secondary styling with the red text and border. Disabled: `--color-border-input` fill, white text. Labels name the action: "Activate incident", "Plan move", "Mark received" – never "Submit" or "OK".

**Segmented control** (view switch): pill group, active segment primary fill with white text, inactive white with primary text.

**Pills and chips**: height 22 px, radius 999, 13/400, 8 px horizontal padding. Role pill: fill per profession, 1 px dashed border in a 20 % darker tint of the fill, black text. Status chip: light fill, 1 px solid semantic border, semantic text. Duration pill: green-light fill, green-text, no border. Count badge: 16 px black circle, white 11/600 text.

**Status glyphs in lists** (as the platform's Activities rows): Not started = 16 px dotted circle in `--color-text-muted`; In progress = 16 px primary ring with a primary dot; Done = 16 px green circle with a white check.

**Forms**: labels 15/400 above the field; inputs, selects and textareas 36 px, radius 6, 1 px `--color-border-input`, focus ring 2 px primary; helper text 13 px muted below.

**Dialogs**: shadcn Dialog, 520 px wide, title 18/600, body 15, buttons right-aligned with the primary action rightmost; Escape closes.

**Side drawer** (detail panels): shadcn Sheet from the right, 480 px, same title and body styles as dialogs.

**Key–value table** (detail pages, as the platform's Information tab): two columns, label cell `--color-bg-muted` fill 15/400, value cell white; rows divided by `--color-border`; an editable row ends with a "Change" text link.

**Message thread** (as the platform's Communication tab): sent messages right-aligned in primary bubbles with white text, received messages left-aligned in `--color-border` bubbles; sender line "Name, Role, HH:MM" 13 px above each bubble; input area `--color-bg-muted` with a 36 px text field and a square send button.

**Three-pane layout** (as the platform's Planning view): left list pane 380 px, middle pane 320 px, map filling the rest; 1 px `--color-border` between panes; each pane scrolls independently.

**Maps**: react-leaflet with OpenStreetMap standard tiles and the required attribution. Nodes as circle markers (radius 10): primary fill when selected, otherwise fill by node status colour; labels on hover; a 2 px primary polyline between source and destination for the selected patient in Evacuation.

**Icons**: lucide-react, 20 px, stroke 1.5, never filled. Fixed choices: acute beds `bed`, intensive care `heart-pulse`, operating theatres `scissors`, imaging `scan`, emergency department `siren`, staff `users`, transport `truck`, supplies `package`, home care `house`, care hub `building`, field hospital `tent`, hospital `hospital`, incident `triangle-alert`, evacuation `move-right`, requests `arrow-left-right`, network `network`, sync ok `refresh-cw`, sync off `cloud-off`. Tint tiles: beds primary/indigo-light, intensive care red-icon/red-light, theatres purple/purple-light, imaging indigo/indigo-light, ED orange/orange-light, staff green/green-light, transport teal/indigo-light, supplies olive/orange-light.

## 5. Behaviour and copy

- No motion on load. Transitions only in response to a user action, at most 150 ms (dialogs, drawers, status changes).
- Empty states are one plain sentence plus the one action that fills the state, e.g. "No active incident." with "Activate a playbook".
- Errors state what happened and what to do, in the interface's voice. The prototype should have almost none.
- Toasts (bottom-right, 3 s) confirm state changes with the same verb as the button: "Incident activated", "Move planned", "Request dispatched".
- Never decorate: no gradients, no illustration, no numbered markers except for real sequences (status chains are sequences), no middle-dot meta strings, no arrows appended to link text.

## 6. Assets

- `assets/logo-symbol.svg` – the symbol used alone in the nav (24 px). It has no fill attribute and inherits colour; render black.
- `assets/logo-full.svg` – the full lockup (symbol + wordmark), black. Not used in the nav; use only if a start/about page is added, which the spec does not require.
- Favicon: `logo-symbol.svg`.
