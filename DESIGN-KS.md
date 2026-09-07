# DESIGN-KS.md – addendum to DESIGN.md for the Karolinska version

DESIGN.md still applies in full (tokens, typography, chrome, components). This addendum changes or adds the following.

## 1. Language and locale

- All UI strings Swedish, sentence case ("Läget nu", "Väntar på vårdplats", "Aktivera förstärkningsläge"). Never capitalise every word.
- Numbers in Swedish format: thousands separated by a thin space or normal space (16 500), decimal comma (95,6 %), a space before %. Use `Intl.NumberFormat('sv-SE')`.
- Dates: "fredag 4 september 2026" (weekday and month lowercase). Times: `HH:MM`. Durations: "3 h 10 min", "45 min". Relative: "+30 min".
- Swedish quotation marks are not needed in UI strings; avoid quotation marks altogether.
- Abbreviations that are standard in Swedish hospital operations are allowed in labels and chips: IVA, IMA, THIVA, ASIH, TCK, RSSL, LSSL, TiB, EKMB, SSR, CT, MR, PMI, MDK. Spell out the first time they appear on the Start page's story text.

## 2. Navigation

- The five existing-module stubs (Patients, Activities, …) are removed. The nav shows six modules, in this order: **Läget nu · Kapacitet · Incident · Evakuering · Resurser · Nätverk**. The logo symbol links to Start (`/`). Källor is linked from Start and from every confidence chip's popover, not from the nav.
- With six tabs the platform's sizes are restored: 16/500 text, 32 px gap. Minimum viewport 1280 px; the right cluster (scenario clock, Demo, avatar, name) is always visible. Remove the 1440 px breakpoint behaviour from the first build.
- Scope selector (top-left, 18/600): default label "Karolinska"; dropdown items: Karolinska (båda siter), Karolinska Solna, Karolinska Huddinge, Region Stockholm, and any node stood up during the session.
- Active-module top bar, sub-tabs, chips, pills and cards exactly as DESIGN.md.

## 3. Scenario clock (right cluster)

A compact control left of the Demo button: the time `14:40` in 15/500 tabular figures, then three icon buttons (lucide `play`/`pause`, `skip-forward`, `rotate-ccw`) with tooltips "Spela", "Stega 15 min", "Återställ klockan". When a scenario is running, a small blue-pill chip shows its name beside the clock ("Masskada · 60 skadade"), and the play button is primary. The clock is the single source of time for every timestamp in the app.

## 4. Confidence rendering (applies everywhere a figure is shown)

Every figure carries `confidence`. Render:

| confidence | Chip | Meaning shown in the popover |
|---|---|---|
| `verified` | none (default) | "Verifierad uppgift" + source name, date, link |
| `reported` | grey chip "Uppgift" | "Uppgift från Medoma, ej verifierad mot öppen källa" + note |
| `estimate` | warning chip "Estimat" | "Estimat" + the basis text |
| `illustrative` | grey chip "Illustrativt" | "Illustrativt scenariovärde, inte Karolinskas data" |

Clicking a chip opens a popover with the text above and a link "Visa i Källor" to `/kallor#<sourceKey>`. On dense tables, show the chip only on the column header when every value in the column shares a confidence, otherwise per cell.

## 5. Start page (presenter layer)

Full-width page, no cards grid on top. Layout, top to bottom:

1. Title 24/600 "Medoma Resilience – Karolinska Universitetssjukhuset", one line 15/400 under it: "Demonstration med öppna uppgifter, uppgifter från Medoma och illustrativa scenariovärden. Inte Karolinskas driftdata." with a link "Källor".
2. The story as five chapters in a horizontal row of cards (DESIGN.md card style, equal width): number, title 18/600, two-line description 15/400, a primary button. Chapters are defined in SPEC.md § 8. The button starts the chapter: sets scope and route, arms the scenario, and starts the clock where the chapter says so.
3. A "Nyckeltal" strip (six capacity cards from DESIGN.md) for scope Karolinska: fastställda vårdplatser, disponibla vårdplatser, IVA-platser, medarbetare, operationer 2025, slutenvårdstillfällen 2025 – each with its confidence chip.
4. A one-line footer: "Byggd på Medoma-plattformen. Kartunderlag © OpenStreetMap."

## 6. Läget nu

A dashboard page, not a card grid. Six sections stacked with 32 px spacing, each a table-like block with a section heading 18/600, a status chip for the block (green "Normalt", warning "Ansträngt", red "Kritiskt" – thresholds in SPEC.md § 6.1) and 3–6 metric rows: label 15/400 secondary, value 20/600 tabular, a short qualifier 13/400 muted ("längst 3 h 10 min"), and, where defined, a "Vad frigör" link that navigates to the relevant module. At Karolinska scope, each row shows Solna and Huddinge side by side with the sum; at site scope only that site.

## 7. Scenario panel

A right-hand Sheet (480 px) opened from the Kapacitet page and from Start: scenario name, parameters as labelled inputs (number, select), a "Starta" primary button, and while running: a timeline list of events with time and text, a bar per resource showing demand vs capacity per tick (DESIGN.md ladder bars, red when demand > capacity), and the recommendation list (SPEC.md § 7.4) where each recommendation is a secondary button that executes it and logs it.

## 8. Maps

Same as DESIGN.md. Node markers labelled with the short name (Solna, Huddinge, SÖS, DS, S:t Göran, Södertälje, Norrtälje, Ersta, ASIH). ASIH has no single point: render it as a soft circle (radius 25 km, fill 10 % primary) centred on Stockholm with the label at its top.

## 9. Källor page

Two tables: "Verifierade och rapporterade uppgifter" (figure, value, source, date, link) and "Estimat och illustrativa värden" (figure, value, basis). Grouped by DATA.md section. Each row has an anchor id equal to its source key.
