# DESIGN-LANG.md – language toggle sv/en (Batch 5)

DESIGN.md, DESIGN-KS.md and DESIGN-DARK.md apply unchanged. Swedish remains the default; English is a toggle. Nothing about layout, behaviour or data values changes with the language.

## 1. Mechanism

- A locale `'sv' | 'en'` held in a small i18n module with `t(key, params?)`, interpolating `{name}` placeholders. `vocab.ts` becomes two tables with identical key sets, `sv` and `en`. A unit test asserts key parity in both directions and fails on any missing or extra key.
- The English strings for everything that existed in the first prototype are in this repository's initial commit (the English `vocab.ts` and component strings); reuse them rather than retranslating.
- Toggle: a tertiary text button in the nav's right cluster, left of the theme toggle, showing the *other* language's code: "EN" in Swedish mode, "SV" in English mode (13/500, tooltip "Switch to English" / "Byt till svenska"). Persisted in `localStorage` under `locale`; a stored value wins, otherwise `DEFAULT_LOCALE = 'sv'`.
- Every component string goes through `t()`. Pluralisation uses explicit keys (`patients_one`, `patients_other`), never string concatenation. A grep of `src/` outside `vocab.ts` and the data pack for the Swedish words " och ", " på ", " för ", "platser", "väntar" inside JSX must return nothing after this batch.

## 2. Formatting by locale

| | sv | en |
|---|---|---|
| Numbers | `Intl.NumberFormat('sv-SE')` → 16 500 | `Intl.NumberFormat('en-GB')` → 16,500 |
| Percent | 95,6 % (space before %) | 95.6% |
| Dates | fredag 4 september 2026 | Friday 4 September 2026 |
| Times | 14:40 | 14:40 |
| Durations | 3 h 10 min · 45 min | 3 h 10 min · 45 min |
| Relative | +30 min | +30 min |

## 3. What is translated

All of `vocab.ts`: module names, sub-tabs, block and metric labels, qualifiers, statuses, chips, buttons, dialogs, toasts, empty states, confidence popover texts, Start chapter titles and descriptions, key-figure labels, Källor intro and table headers, Demo popover, scenario clock tooltips. Also, via `{ sv, en }` label objects in the data pack: playbook names, triggers, summaries, role names, task titles, channel names, target labels; scenario preset names and parameter labels; recommendation labels and effects; flow metric labels; ward names' generic part is not translated (see § 4); capacity class descriptors get an English descriptor in parentheses (see § 4).

English module names: Läget nu → "Live status", Kapacitet → "Capacity", Incident → "Incident", Evakuering → "Evacuation", Resurser → "Resources", Nätverk → "Network", Källor → "Sources", Start → "Start". Sub-tabs: Patientplacering → "Bed placement", Prognos → "Forecast", Utskrivningsklara → "Ready for discharge". Beredskapslägen: Normalläge → "Normal operations", Stabsläge → "Staff mode (stabsläge)", Förstärkningsläge → "Reinforcement mode (förstärkningsläge)", Katastrofläge → "Disaster mode (katastrofläge)" – the Swedish term is kept in parentheses because it is the region's legal term.

## 4. What is not translated (in either language)

- Proper nouns and organisational names: Karolinska Universitetssjukhuset, Karolinska Solna, Karolinska Huddinge, Tema Akut och Reparativ medicin and the other teman and funktioner, Södersjukhuset, Danderyds sjukhus, Capio S:t Görans sjukhus, Södertälje sjukhus, Norrtälje sjukhus, Ersta sjukhus, Ambulanssjukvården Region Stockholm, Stab Produktion, Bemanningscentrum, Traumacentrum Karolinska, Intensivakuten.
- Ward names ("HKN Kardiologi", "ARM Infektion").
- Abbreviations: IVA, IMA, THIVA, ASIH, TCK, TiB, RSSL, LSSL, EKMB, SSR, KiB, PKL, CT, MR, PMI, MDK.
- Staff messages (msg-1..3) and channel messages – they are quotes; the parser stays Swedish.
- Patient names, place names, source names and URLs in Källor.
- README (Swedish presenter script).

Capacity classes and the transport node get an English descriptor shown after the Swedish name in English mode only: Geriatrik → "Geriatrik (geriatric care)", Sluten palliativ vård → "Sluten palliativ vård (palliative inpatient care)", Specialiserad rehabilitering → "(specialised rehabilitation)", Psykiatri → "(psychiatry)", ASIH → "ASIH (advanced home care)", Ambulanssjukvården → "(ambulance service)".

## 5. Glossary on Start (English mode only)

Under the disclaimer line on Start, one line in `--color-text-muted`, 13 px: "Swedish terms kept as in the region's own documents: IVA = ICU · IMA = intermediate care · ASIH = advanced home care · TiB / RSSL / LSSL = regional and local medical command · stabsläge / förstärkningsläge / katastrofläge = the three preparedness levels."

## 6. Definition of done additions

- [ ] Key-parity test passes; the Swedish-word grep returns nothing outside `vocab.ts` and the pack.
- [ ] Toggle switches instantly, persists across reload, and the document `lang` attribute follows the locale.
- [ ] In English mode: Start, Läget nu (all four views), Kapacitet, Incident (with an active PB1), Evakuering, Resurser (all three tabs), Nätverk, Källor and every dialog, sheet, toast and empty state show no Swedish UI strings except the § 4 exceptions.
- [ ] Number, percent and date formats follow § 2 on every page (spot-check Start key figures, Läget nu Vårdplatser block, Prognos table).
- [ ] Screenshots of Start and Läget nu in English mode, light theme, attached to the PR.
