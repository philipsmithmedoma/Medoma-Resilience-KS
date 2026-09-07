# DESIGN-DARK.md – dark mode (Batch 5)

DESIGN.md and DESIGN-KS.md apply unchanged. This addendum adds a second token set and a theme toggle. Light remains the default; the user's choice is persisted.

## 1. Mechanism

- Theme is a class on `<html>`: none (light) or `dark`. Tailwind `darkMode: 'class'`.
- All colour tokens are defined twice: on `:root` (existing values) and on `.dark` (values below). No component references a colour except through a token. The only files allowed to contain a hex literal are the token stylesheet and the Tailwind theme file; a repo-wide grep for `#[0-9a-fA-F]{6}` outside those two files must return nothing after this batch.
- Toggle: an icon button in the nav's right cluster, left of "Demo": lucide `moon` in light mode ("Mörkt läge"), `sun` in dark mode ("Ljust läge"). Persisted in `localStorage` under `theme`; on load, a stored value wins, otherwise light. Switching is instant and logs nothing.
- Default theme is set in one constant `DEFAULT_THEME = 'light'` in the theme module.

## 2. Dark tokens

| Token | Dark value | Notes |
|---|---|---|
| `--color-bg` | `#15181C` | page |
| `--color-surface` | `#1B1F24` | nav, cards, dialogs, sheets, popovers (new token; in light mode it equals `--color-bg`) |
| `--color-bg-muted` | `#22272E` | label columns, chat input area, row hover, received bubbles |
| `--color-border` | `#2C323A` | all dividers and card borders |
| `--color-border-input` | `#3A414A` | inputs; disabled button fill |
| `--color-text` | `#E6E8EB` | |
| `--color-text-secondary` | `#A0A6AE` | |
| `--color-text-muted` | `#7A8189` | |
| `--color-primary` | `#186CE9` | unchanged for filled buttons (white text) and the active-tab bar |
| `--color-primary-text` | `#4D8EF0` | new token: links, active tab text, secondary-button text and border, focus ring. In light mode it equals `--color-primary`. Components that render primary *text* must use this token |
| `--color-badge` | `#E6E8EB` with text `#15181C` | count badge inverts |
| shadows | none | borders carry separation in dark mode |

Semantic colours keep their light-mode hue but are rendered differently on dark surfaces:

| Use | Dark treatment |
|---|---|
| Icon tiles (`*-light` backgrounds) | `color-mix(in srgb, <semantic> 18%, transparent)`; icon in the semantic colour lightened 15 % |
| Status chips | fill `color-mix(in srgb, <semantic> 16%, transparent)`, 1 px border `color-mix(<semantic> 60%, transparent)`, text: red `#F07470`, orange `#F5A962`, green `#4CC26A`, blue `#4D8EF0`, grey `--color-text-secondary` |
| Role pills (Doc/Nrs/AsPr/Supp) | fills red-mix, primary-mix, green-mix, orange-mix at 22 %; dashed border at 50 %; text `--color-text` |
| Duration pill | green-mix 16 %, text `#4CC26A` |
| Incident banner | stabs-/förstärkningsläge orange-mix 22 % with orange border; katastrofläge red-mix 22 % with red border; text `--color-text` |
| Ladder and scenario bars | primary and semantic colours unchanged; track `--color-bg-muted` |
| Avatar | `--color-bg-muted` fill, initials `#F5A962` |
| Team glyphs teal/olive | teal `#3FC0D8`, olive `#D3C55A` |

Contrast floor: body text on `--color-bg` and `--color-surface` ≥ 7:1; secondary text ≥ 4.5:1; chip text on its fill ≥ 4.5:1. Record the computed ratios for the main pairs in the PR.

## 3. Map

In dark mode the OpenStreetMap tile layer gets a CSS filter on the tile pane: `filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.6)`. Markers, polylines and the ASIH circle are drawn above the tile pane and must not be filtered. Attribution text stays readable (`--color-text-secondary` on a `--color-surface` strip). No new tile provider.

## 4. Logo

Render the nav symbol as an inline SVG component with `fill: currentColor` and `color: var(--color-text)`, so it is black in light mode and light grey in dark mode. The `<img>` rendering is removed.

## 5. Sweep

- Replace every remaining hex literal or Tailwind colour utility (`bg-white`, `text-black`, `bg-gray-100`, `border-gray-200`, …) in components with token classes. Vendored shadcn components included.
- Check every page in both themes at 1280 px and 1440 px; screenshot Start, Läget nu, Kapacitet (with ladder), Incident (active, with banner), Evakuering (map) and Resurser → Lager in both themes and attach them to the PR.
- Dialogs, sheets, popovers, tooltips, selects and toasts must use `--color-surface`, not white.

## 6. Also in this batch

Above the tables on Patientplacering and Utskrivningsklara and above the patient list in Evakuering, one line in `--color-text-muted`, 13 px: "Fiktiva patientuppgifter – inte Karolinskas data."
