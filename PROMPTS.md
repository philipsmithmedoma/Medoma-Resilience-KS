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

## Real geography and preparedness mode – bunt 6–10 in one session (branch `real-geo`)

The prompt below was given in Swedish. The two documents it embeds (SPEC.md § 12 and DATA.md § 12) are not repeated here; they are appended verbatim to SPEC.md and DATA.md in batch 6.

Läs först i sin helhet: CLAUDE.md, SPEC.md (särskilt § 11), DATA.md (särskilt § 11), DESIGN.md, DESIGN-KS.md, DESIGN-DARK.md, DESIGN-LANG.md, DECISIONS.md och PROMPTS.md. Läs sedan den faktiska koden på main och återanvänd den – anta aldrig. Ställ inga frågor; beslutsprotokollet i CLAUDE.md gäller och varje val specen inte gör loggas i DECISIONS.md under rubriken "## Real geography build".

Skapa branchen real-geo från main. Bygg buntarna 6–10 i SPEC.md § 12.6 i ordning på den branchen. Varje bunt behandlas som en enhet: färdigställ den, kör npm run typecheck, npm test och npm run build, gå igenom buntens definition of done i den körande appen, committa med ett meddelande som namnger bunten, och börja först därefter på nästa. Alla befintliga tester ska fortsätta gå igenom; de fem testfallen i § 11.7 bunt 4 får skrivas om mot den riktiga grafen enligt § 12.4, inget annat. Avsluta med en pull request vars beskrivning innehåller de fem checklistorna med resultat per punkt, DECISIONS.md-posterna och datafilernas storlekar, och skriv ut PR-länken.

Bunt 6 är dels dokument, dels ett skript. Lägg först till texten under "SPEC.md § 12" ordagrant sist i SPEC.md och texten under "DATA.md § 12" ordagrant sist i DATA.md, och denna prompt i PROMPTS.md; committa som "docs: spec and data for real geography". Bygg sedan skriptet.

Nätverk: skriptet i bunt 6 är det enda som får anropa internet, och bara https://overpass-api.de/api/interpreter. Appen anropar aldrig Overpass; GeoJSON-filerna committas. Om Overpass inte går att nå från sessionen: skriv ändå skriptet, lägg frågorna som filer under scripts/overpass/, skriv i PR-beskrivningen exakt vilket kommando som ska köras lokalt, och bygg buntarna 7–10 mot ett litet handskrivet fixtur-GeoJSON med samma schema så att allt är testat och bara datafilerna saknas.

[SPEC.md § 12 – see SPEC.md § 12]

[DATA.md § 12 – see DATA.md § 12]

## Time, teams and Lund – bunt 11–18 in one session (branch `home-ops`)

The prompt below was given in Swedish. The two documents it embeds (SPEC.md § 13–14 and DATA.md § 13–14) are not repeated here; they are appended verbatim to SPEC.md and DATA.md in batch 11.

Läs först i sin helhet: CLAUDE.md, SPEC.md (särskilt § 11–12), DATA.md (särskilt § 11–12), DESIGN.md, DESIGN-KS.md, DESIGN-DARK.md, DESIGN-LANG.md, DECISIONS.md och PROMPTS.md. Läs sedan den faktiska koden och återanvänd den – anta aldrig. Utgå från branchen real-geo om den finns och inte är mergad, annars från main; säg i PR-beskrivningen vilket. Ställ inga frågor; beslutsprotokollet i CLAUDE.md gäller och varje val specen inte gör loggas i DECISIONS.md under rubriken "## Time, teams and Lund build".

Skapa branchen home-ops från utgångspunkten. Bygg buntarna 11–18 i SPEC.md § 13.6 och § 14.6 i ordning på den branchen. Varje bunt behandlas som en enhet: färdigställ den, kör npm run typecheck, npm test och npm run build, gå igenom buntens definition of done i den körande appen, committa med ett meddelande som namnger bunten, och börja först därefter på nästa. Alla befintliga tester ska fortsätta gå igenom; testerna i § 12.4 får inte ändras. Avsluta med en pull request vars beskrivning innehåller de åtta checklistorna med resultat per punkt, DECISIONS.md-posterna och datafilernas storlekar, och skriv ut PR-länken.

Bunt 11 är bara dokument: lägg till texten under "SPEC.md § 13" och "SPEC.md § 14" ordagrant sist i SPEC.md, texten under "DATA.md § 13" och "DATA.md § 14" sist i DATA.md, och denna prompt i PROMPTS.md. Committa som "docs: spec and data for time, teams and Lund".

Nätverk: bara scripts/fetch-osm.mjs får anropa internet, och bara https://overpass-api.de/api/interpreter, nu även för Lund (§ 14.5). Samma fallback som i § 12 gäller om Overpass inte nås: skript och frågor på plats, kommandot i PR-beskrivningen, fixtur för testerna.

Allt som hamnar i appen går via vocab med engelska nycklar och sv/en-tabeller. Siffror som visas i UI bär konfidens och källa enligt DATA.md. Patienter, team, bilar, besök och meddelanden är syntetiska och märkta som i dag.

[SPEC.md § 13–14 – see SPEC.md § 13 and § 14]

[DATA.md § 13–14 – see DATA.md § 13 and § 14]
