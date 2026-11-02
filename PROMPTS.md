# PROMPTS.md – Karolinska version

Setup: upload CLAUDE.md, SPEC.md, DATA.md, DESIGN-KS.md and this file to the root of the KS repository on `main`, overwriting the first prototype's CLAUDE.md, SPEC.md and PROMPTS.md. Keep DESIGN.md, DECISIONS.md, assets/ and all code as they are. Enable Pages (Settings → Pages → Source: GitHub Actions) if not inherited. Then start one Claude Code session on the repository with the prompt below, mode Accept edits.

## All four batches in one session

Read CLAUDE.md, SPEC.md, DATA.md, DESIGN.md and DESIGN-KS.md in full before doing anything else. This repository already contains the complete first prototype; inspect the actual code on main (routes, store, mock data, components, tests) before changing anything, and reuse it. Then implement Batches 1, 2, 3 and 4 in that order, exactly as defined in SPEC.md § 9, on one new branch. Treat each batch as a unit: complete it, run the build, the type check and the tests, work through that batch's definition-of-done checklist in the running app, commit with a message naming the batch, and only then start the next. Do not ask questions; follow the decision protocol in CLAUDE.md and append every choice the spec does not make to DECISIONS.md under a heading "## KS build", keeping the existing entries. Every figure shown in the UI must carry the confidence and source defined in DATA.md; never present an illustrative value as verified. Finish by opening a pull request whose description contains all four checklists with a result per item, the dead-link sweep table, and the DECISIONS.md entries you added.

## If the session stops before all four batches are done

Reply: "Continue with the next batch as instructed."

## If the session asks a question

Reply: "Do not ask. Apply the decision protocol in CLAUDE.md, log the decision in DECISIONS.md under KS build, and finish the batch."

## Hospital at Home – bunt 0–5 in one session (branch `home-module`)

The prompt below was given in Swedish. The two documents it embeds (SPEC.md § 11 and DATA.md § 11) are not repeated here; they are appended verbatim to SPEC.md and DATA.md in batch 0.

Läs först i sin helhet: CLAUDE.md, SPEC.md, DATA.md, DESIGN.md, DESIGN-KS.md, DESIGN-DARK.md, DESIGN-LANG.md, DECISIONS.md och PROMPTS.md. Läs sedan den faktiska koden på main och återanvänd den – anta aldrig. Ställ inga frågor; beslutsprotokollet i CLAUDE.md gäller och varje val specen inte gör loggas i DECISIONS.md under en ny rubrik "## Hospital at Home build", med alla befintliga poster kvar.

Skapa branchen home-module från main. Bygg buntarna 0–5 i SPEC.md § 11.7 (texten nedan) i ordning på den branchen. Varje bunt behandlas som en enhet: färdigställ den, kör npm run typecheck, npm test och npm run build, gå igenom buntens definition of done i den körande appen, committa med ett meddelande som namnger bunten, och börja först därefter på nästa. En senare bunt får ändra något från en tidigare om det loggas. De befintliga 96 testerna ska fortsätta gå igenom oförändrade. Avsluta med att öppna en pull request vars beskrivning innehåller alla sex checklistorna med resultat per punkt samt de tillagda DECISIONS.md-posterna, och skriv ut PR-länken.

Allt som hamnar i appen går via vocab med engelska nycklar och sv/en-tabeller som i dag; ingen sträng utanför vocab, och vocab-paritetstestet ska täcka de nya nycklarna. Siffror som visas i UI bär konfidens och källa enligt DATA.md; ett illustrativt värde presenteras aldrig som verifierat. Inga nya nätverksanrop utöver OSM-plattorna som redan finns; all geodata nedan läggs inline i datapacket.

Bunt 0 är bara dokument: lägg till texten under "SPEC.md § 11" ordagrant sist i SPEC.md och texten under "DATA.md § 11" ordagrant sist i DATA.md. Committa som "docs: spec and data for Hospital at Home". Lägg också till prompten du fick (denna text) i PROMPTS.md under egen rubrik.

[SPEC.md § 11 – see SPEC.md § 11]

[DATA.md § 11 – see DATA.md § 11]
