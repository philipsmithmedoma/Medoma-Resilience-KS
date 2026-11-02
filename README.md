# Medoma Resilience – Karolinska-versionen (KS)

En klickbar prototyp av ett operativt lager för Karolinska Universitetssjukhuset (Solna och Huddinge) i Region Stockholms vårdnätverk: normal drift, störd drift och extrem drift i samma gränssnitt. Byggd på Medoma-plattformens formspråk, helt i webbläsaren, utan backend.

Alla uppgifter i demon är antingen verifierade mot öppna källor, uppgifter från Medoma, estimat med angiven grund eller illustrativa scenariovärden, och gränssnittet visar vilket vid varje siffra. Inget i demon är Karolinskas driftdata. Alla personer är fiktiva.

## Köra

```bash
npm ci
npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build      # dist/
```

Kräver Node 22. Minsta bredd 1280 px. Kartunderlaget hämtas från OpenStreetMap; allt annat ligger i paketet.

## Struktur

| Katalog | Innehåll |
|---|---|
| `src/data/packs/karolinska.ts` | Datapaketet: noder, vårdplatsstege, Läget nu-baslinje, köer, lager, spelböcker, scenarier, källor. Varje siffra bär `confidence`, `source` eller `basis`. |
| `src/data/packs/types.ts` | Domänmodellen och `DataPack`-gränssnittet. |
| `src/data/vocab.ts` | Alla svenska UI-strängar och etiketter för enum-värden. |
| `src/data/store*.ts` | Zustand-store med slices för incident, evakuering, resurser, nätverk, Läget nu och scenario. Varje tillståndsändring loggas med scenarioklockans tid. |
| `src/data/packs/geo/` | OpenStreetMap-data (`roads.json`, `streets.json`, `power.json`, `water.json`) eller, tills de hämtats, fixturen. README där anger källa, datum och ODbL. |
| `scripts/` | `fetch-osm.mjs` (Overpass till GeoJSON, `npm run fetch:osm`), `overpass/*.overpassql`, `generate-patients.mjs`, `make-geo-fixtures.mjs`. |
| `src/lib/` | Rena moduler med tester: `forecast.ts`, `placement.ts`, `scenario.ts`, `flow.ts`, `capacity.ts`, `suggest.ts`, `parse.ts`, `figure.ts`, `format.ts`, `reachability.ts` och `roadGraph.ts` (väggraf, Dijkstra och påverkan för Sjukhus hemma), `osmNodes.ts`. |
| `src/modules/` | Sidorna: `start`, `flow` (Läget nu), `home` (Sjukhus hemma), `capacity`, `incident`, `evacuation`, `resources`, `network`, `sources` (Källor), `scenario` (panelen). |
| `DATA.md` | Läsbar källa för datapaketet med källförteckning (S1–S22). |
| `SPEC.md`, `DESIGN.md`, `DESIGN-KS.md` | Beteende och utseende. |
| `DECISIONS.md` | Varje val som specen inte gör, med avvisat alternativ. |

## Demoklockan

Klockan uppe till höger är enda tidskällan. Den startar 14:40, fredag 4 september 2026, går fram en minut per åtgärd och, när ett scenario spelas, 15 minuter per 2 sekunder (ett dygn per 2 sekunder i pandemiscenariot). Spela/pausa, Stega och Återställ klockan sitter bredvid tiden. Demo-knappen återställer hela demon.

## Mörkt läge

Knappen med måne/sol i navigationsfältet växlar mellan ljust och mörkt läge. Valet sparas i webbläsaren (`localStorage`, nyckeln `theme`) och ljust läge är standard. Kartan får ett inverteringsfilter i mörkt läge; markörer och ASIH-cirkeln påverkas inte.

## Språk

Knappen "EN" i navigationsfältet växlar till engelska, "SV" tillbaka till svenska. Valet sparas i webbläsaren (`localStorage`, nyckeln `locale`) och svenska är standard. Egennamn, avdelningsnamn, förkortningar, beredskapslägena (med svensk term i parentes) och citerade meddelanden översätts inte; på engelska visas en ordlista under ingressen på startsidan. Alla strängar finns i `src/data/vocab.ts` som två tabeller (`sv`, `en`) med identiska nycklar, och datapaketets spelböcker och scenarier bär `{ sv, en }`-texter.

## Beredskapsläge och navigation

Navigationen har två lägen. I normal drift visas Medomas fem plattformsflikar, en skiljelinje och knappen **Beredskap**; inga resiliensmoduler syns, scenariokontrollerna (spela, stega, återställ) är dolda och roten (`/`) går till `/patients`. Klicka **Beredskap** för beredskapsläget: menyn Medoma, skiljelinjen och flikarna Läget nu, Sjukhus hemma, Kapacitet, Incident, Evakuering, Resurser och Nätverk, en röd indikator **Beredskapsläge** med ett stängkryss, och scenariokontrollerna; roten går då till `/start`. Läget slås också på av en aktiv incident, ett pågående scenario och av att öppna en resiliensrutt direkt (en omladdning på `/home` behåller det). Stängkorset är avstängt medan en incident eller ett scenario pågår och går annars till `/planning` från en resiliensrutt. Varje ändring loggas med orsak (manuellt, incident, scenario, sida). Startsidan med de fem kapitlen ligger på `/start`.

## Presentatörsmanus

Startsidan (logotypen) har fem kapitel, och Sjukhus hemma visas som steg 6 nedan. Varje kapitel återställer demon, sätter omfattning och sida och startar vid behov ett scenario, så kapitlen kan visas i valfri ordning.

### Vad man säger om chipen

Chipen bredvid siffrorna är produktens ärlighet, inte en friskrivning. Peka på dem tidigt:

- Ingen chip: verifierad öppen uppgift. Länken "Källa S5" öppnar källan. Exempel: IVA-platser 18 + 9 (S5), operationer 2025 (S2).
- **Uppgift**: uppgift från Medoma, ännu inte verifierad mot öppen källa. Exempel: fastställda vårdplatser 1 600.
- **Estimat**: härlett ur verifierade uppgifter med angiven grund. Exempel: disponibla vårdplatser normalvecka 1 070.
- **Illustrativt**: scenariovärde för demon, inte Karolinskas data. Exempel: allt i Läget nu utom disponibla och IVA-platser.
- **Spegel**: värdet kommer från den operativa spegeln under journalbortfall.

Varje chip öppnar en popover med källa, datum, grund och länken "Visa i Källor" som landar på rätt rad på sidan Källor.

### Kapitel 1 – Vardag

Klicka **Starta kapitel** på Vardag. Läget nu öppnas för Karolinska med Solna, Huddinge och summa.

- Gå igenom de sex blocken uppifrån. Statuschipen (Normalt, Ansträngt, Kritiskt) följer trösklarna i SPEC.md § 6.1 per site, aldrig på summan.
- Peka på Vårdplatser: beläggning 95,6 % och 98,4 %, överbeläggningar 6 i Huddinge ger Kritiskt. Peka på IVA/IMA: 0 lediga och 2 väntar i Huddinge.
- Byt omfattning till Karolinska Solna uppe till vänster: Akuten blir Normalt.
- Klicka **Vad frigör** vid Akuten: Patientplacering. Placera Andersson, Anna (br-1) i HKN Kardiologi: avdelningen går till 0 lediga och "Väntar på vårdplats" i Huddinge till 16. Visa att Dahl, David (br-4) bara kan utlokaliseras.
- Öppna Utskrivningsklara: klicka **Till ASIH** på Nyström, Nils, bekräfta. Vid nästa åtgärd blir patienten utskriven, avdelningen får en plats och ASIH-kapaciteten i Nätverk går till 119. Detta är Medoma-bryggan.

### Kapitel 2 – Tryck

Klicka **Starta kapitel** på Tryck. Prognosen för Huddinge öppnas med scenariot Ordinärt högtryck igång (faktor 1,3 i 6 h).

- Linjen är lediga vårdplatser, staplarna ankomster, inläggningar, utskrivningar och elektiva inläggningar i morgon. Hela prognosen är illustrativ, chipet står i rubriken.
- Läs meningen: "Beräknad brist: 1 platser kl 23:40 (Huddinge)". Utan trycket ligger bristen kl 03:40; Solna får ingen brist.
- Pausa klockan, gå till Utskrivningsklara och skicka två ASIH-förfrågningar. Tillbaka i Prognos flyttas bristen senare.

### Kapitel 3 – Masskada

Klicka **Starta kapitel** på Masskada. Kapacitet öppnas för Solna med scenariopanelen till höger och 60 skadade förifyllda (röd 20 %, gul 40 %, grön 40 %, ankomstfönster 120 min, första ankomst +20 min, primär mottagare Solna).

- Visa vårdplatsstegen: 775 fastställda (Uppgift), 520 disponibla (Estimat), 23 lediga (Illustrativt), och meningen om de 255 platser som finns lokalmässigt men saknar bemanning.
- Klicka **Starta**. Klockan går. Händelserna kommer i panelen: "+20 min: Första skadade anländer till Solna", CT-brist, "+1 h 30 min: IVA-platser Solna: brist". Kapacitet-sidans scenariorad och korten följer med.
- Pausa vid +2 h. Klicka **Utför** på Öppna IMA som IVA-överflöd: bristen försvinner ur serien och rekommendationen markeras Utförd. Varje rekommendation loggas som utförd av Eva Lind.
- Klicka Aktivera förstärkningsläge: PB1 aktiveras, banderollen visar Förstärkningsläge. Klicka Gå till katastrofläge: dialogen påpekar att 60 skadade ligger under gränsen; bekräfta, banderollen blir röd.
- Klicka Utskrivningsklara till ASIH: 13 platser frigörs (5 Solna, 8 Huddinge); byt till Läget nu och peka på Vårdplatser.
- Öppna Incident: uppgifterna Stryk elektiv operation och Öppna IMA är avbockade av rekommendationerna; "Anmäl läget till TiB och RSSL" är en uppgift, inte en knapp. Loggen visar hela kedjan med tider.

### Kapitel 4 – Journalbortfall

Klicka **Starta kapitel** på Journalbortfall. Kapacitet öppnas för Karolinska med PB2 aktiverad och journalsystemet frånkopplat.

- Synkchipet säger "Journalsystem frånkopplat, spegel sedan 14:40". Varje siffra från journalsystemet bär chipet **Spegel** och räknas som estimat. Personal (HR) och operationsplanering påverkas inte.
- Läget nu och Nätverk fungerar som vanligt på spegeln; placeringar och utskrivningar går att göra.
- Låt klockan gå (eller stega 24 gånger): vid horisonten 6 h återansluts journalsystemet, chipen försvinner och klockan stannar.

### Kapitel 5 – Regional omfördelning

Klicka **Starta kapitel** på Regional omfördelning. Nätverk öppnas för Region Stockholm med scenariot Mottagande av evakuerade förberett (260 patienter över 12 h via Norrtälje, Karolinskas andel 35 %), som i Sjukvårdsövning 26.

- Visa tabellen: två siter, sex akutsjukhus med disponibla platser vecka 33 2025 (S4b) och illustrativa lediga platser, fem kapacitetsklasser och Ambulanssjukvården. ASIH ritas som en cirkel på kartan.
- Klicka **Starta** i panelen. Efter cirka 3 h 30 min tar Södersjukhuset, Danderyd och S:t Göran slut på platser; tabellen visar 0 lediga och händelserna listar "vårdplatser slut".
- Klicka **Utför** på Etablera vårdhubb Flemingsberg: noden dyker upp i tabellen som Under uppstart, i omfattningsväljaren och på kartan, och går i drift efter fyra tick med 40 platser som tar emot patienter.
- Peka på Utskrivningsklara till ASIH och Tidigarelägg utskrivningar som Karolinskas egna bidrag.

### Steg 6 – Sjukhus hemma

Sjukhus hemma ligger i navigationen direkt efter Läget nu (`/home`). Det är inget kapitel på startsidan utan ett sjätte steg som visas efter de fem, eller på egen hand. De 150 patienterna är fiktiva och märkta så, de bor på gator (gatunamn och husnummer är illustrativa) och antalet bär chipet Illustrativt.

**Den riktiga kartan.** Vägnätet (motorväg till sekundärväg), broar, tunnlar, 400/220 kV-stationer och -ledningar och vattenverk kommer från OpenStreetMap, inte från handritade korridorer. Datafilerna hämtas lokalt med `npm run fetch:osm` (det enda som anropar internet, och bara Overpass) och checkas in; kör därefter `node scripts/generate-patients.mjs` så att patienterna hamnar på de riktiga gatorna. Tills filerna finns använder appen en handritad fixtur med samma schema: kartan, broarna och beräkningarna fungerar, men positionerna är påhittade och elnodernas lägen står som Illustrativt. Med riktiga data står de som Uppgift med källan "OpenStreetMap, datum", och kartans källrad får ODbL-texten.

- Öppna **Sjukhus hemma**. Kartan passas mot de tio zonerna. Slå på **El** och **Vatten**: heldragna linjer är verifierade förbindelser, streckade är schematiska, elledningarna bär sin spänning (400 kV, 220 kV) och pilar visar vart ledningar fortsätter utanför kartan. Regionnätet (70–220 kV) är det enda ihåliga: det är luckan att fylla först, och panelen säger det med röd text.
- Klicka på en nod, till exempel Essingeleden: allt som inte hänger ihop med den tonas ned, och mittpanelen visar vad noden är, vad den är kopplad till, status och uppgifter med chip och källa (140 000–170 000 fordon per dygn, S-H12). Källorna S-H1–S-H14 finns på Källor.
- Klicka **Stäng vägar** och tryck på ett vägsegment på kartan: det segmentet (en OSM-väg) stängs och ritas i varningsfärg; tryck igen för att öppna det. Slå på **Blockera hela vägen** och tryck på en bro eller en motorväg: alla vägar med samma namn stängs. Namngivna broar och tunnlar (markörerna) stänger sina vägnamn. Patientlistan till vänster och panelen uppdateras direkt, och varje stängning loggas (Kapacitet, Logg) med antalet påverkade. Beräkningen går på vägnätet: en patient är onåbar om ingen väg finns från siten i omfattningen, och försenad om den kortaste vägen blivit minst 25 % eller 3 km längre.
- Välj **Bro avstängd** under Sjukhus hemma i Kapacitet, **Scenario**, **Starta** (Essingeleden och Centralbron), och stäng sedan Västerbron, Munkbroleden, Skeppsbron, Söderledstunneln, Katarinavägen och Stadsgårdsleden. Byt till **Karolinska Solna** uppe till vänster: patienterna söder om Saltsjö–Mälaren blir onåbara med bil och listan sorteras med besök i dag och el-kritiska först, märkta Prioritera. Vid omfattningen Karolinska nås de söderifrån, från Huddinge. Antalen beror på vägdata; läs av dem i appen.
- Välj **Elavbrott** (scenario eller knappen ovanför kartan): Söderort och Huddinge, 40 patienter utan el och kortaste batteritid hos el-kritiska 4 h. Det är batteritiden, inte avståndet, som avgör ordningen. **Vattenstörning** sätter vattnet ur drift i Solna och Sundbyberg (25 patienter). Knappen **Återställ** rensar allt.
- Säg vad som är verifierat och inte: vägar, broar, stationer och verk är OpenStreetMap-data (Uppgift, med datum); fullständigheten är inte kontrollerad mot NVDB eller Svenska kraftnät; trafikuppgifter, patientantal, utrustning, batteritider och gatuplacering är illustrativa.

### Utanför kapitlen

- Evakuering: välj site, klicka Föreslå plan. Kritiska går till den andra siten medan IVA-platser räcker, övervakningspatienter till närmaste akutsjukhus, stabila ASIH-kandidater till ASIH, 75+ till geriatrik. Godkänn ett förslag och följ kedjan Planerad, Accepterad, Transport tilldelad, Avrest, Ankommen, Överlämnad; fordonen kommer från Ambulanssjukvårdens pooler.
- Resurser: Från meddelande tolkar "Behöver två ventilatorer till akuten Huddinge" till en förifylld förfrågan. Lager visar kolumnen Ej i tjänst för fordon.
- Scenario Pandemisk våg (Kapacitet, Scenario): klockan stegar dygn; Bygg om O-huset till IVA lägger 64 platser på 10 dygn, som 2020.
- Källor: hela källförteckningen S1–S22 med varje uppgift som hänvisar till den, samt alla estimat och illustrativa värden med sin grund.

## Deploy

`.github/workflows/deploy.yml` bygger och publicerar `dist/` till GitHub Pages vid push till `main`.
