# DATA.md – Karolinska data pack

This file is the human-readable source of truth for `src/data/packs/karolinska.ts`. Every figure has a confidence class; the pack must carry it, and the UI must show it (DESIGN-KS.md § 4). When new data arrives, this file and the pack are updated together; components never change.

Confidence classes:

- **verified** – public source, cited by key (§ 9) and date.
- **reported** – supplied by Medoma (Philip Smith, 2026-09-06), not yet verified against a public source.
- **estimate** – derived by the spec author from verified figures; the basis is stated.
- **illustrative** – scenario value invented for the demo; clearly not Karolinska's data.

Where a figure is unknown and no sensible illustrative value exists, the pack stores `null` and the UI shows "Okänt".

## 1. Organisation (verified, S1, S3)

Six teman and three funktioner, organised around the patient's path; funktioner are competence areas that cut across teman.

| key | Name (UI label) | Type | Sites |
|---|---|---|---|
| arm | Tema Akut och Reparativ medicin | tema | Solna, Huddinge |
| barn | Tema Barn – Astrid Lindgrens Barnsjukhus | tema | Solna, Huddinge |
| cancer | Tema Cancer | tema | Solna, Huddinge |
| hkn | Tema Hjärta, Kärl och Neuro | tema | Solna, Huddinge |
| ia | Tema Inflammation och Åldrande | tema | Solna, Huddinge |
| kvh | Tema Kvinnohälsa och Hälsoprofessioner | tema | Solna, Huddinge |
| mdk | Funktion Medicinsk Diagnostik Karolinska | funktion | Solna, Huddinge |
| barnpmi | Funktion Barn Perioperativ medicin, intensivvård och transport | funktion | Solna |
| pmi | Funktion Perioperativ Medicin och Intensivvård | funktion | Solna, Huddinge |

Site assignment per tema is "both" unless verified otherwise; this is a simplification (estimate). Stab Produktion consists of Bemanningscentrum, Produktion och uppföljning, and Vårdadministration (S11).

Hospital-wide figures (S2, statistik 2025, verified): 16 500 medarbetare i cirka 150 yrkeskategorier; 1,6 miljoner öppenvårdsbesök; 89 250 slutenvårdstillfällen; 61 999 operationer; 20 991 patienter från andra regioner; 107,9 % av vårduppdraget. 42 uppdrag inom nationell högspecialiserad vård 2026 (S22).

## 2. Nodes

### 2.1 Karolinska Solna (`solna`, Hospital)

| Figure | Value | Confidence | Source / basis |
|---|---|---|---|
| Fastställda vårdplatser | 775 (750–800) | reported | S21; definition to confirm (fastställda per regionens definition or fysiska platser) |
| Disponibla vårdplatser, normalvecka | 520 | estimate | Karolinska normalvecka ≈ 1 070 (§ 3) × Solna share 775/1 600 |
| Disponibla vårdplatser, vecka 33 2025 | 443 | estimate | 915 (S4b) × 775/1 600 |
| Belagda vårdplatser nu | 497 | illustrative | scenario baseline |
| IVA-platser | 18 | verified | S5 (2025-01-27, utökat från 16) |
| THIVA-platser | null | – | exists (S5), count not public |
| IMA-platser | 12 | illustrative | IMA Solna exists (S7 A–Ö list); count not public |
| Akutmottagning | Intensivakuten Solna – tar endast emot ambulans, helikopter och remitterade patienter | verified | S7 |
| Traumalarm per år | ~1 500 vuxna, ~300 barn, ~350 svårt skadade (ISS>15), ~2 000 traumaoperationer | verified | S8 (series since 2010; flag as older) |
| Helikopterplatta | ESHK | verified | S10 |
| NKS-byggnaden | 550 vårdplatser varav 84 IVA/IMA, 90 dagvårdsplatser, 79 platser patienthotell | verified (planning figures, older) | S10 |
| Operationssalar | 24 | illustrative | count not public |
| CT / MR | 4 / 3 | illustrative | count not public |
| Coordinates | 59.3522, 18.0322 | verified (approx.) | S10 |
| Sharing, sync | Full; Synced (klockan) | – | – |
| Lead (fictional) | Eva Lind | – | § 7 |

### 2.2 Karolinska Huddinge (`huddinge`, Hospital)

| Figure | Value | Confidence | Source / basis |
|---|---|---|---|
| Fastställda vårdplatser | 825 (800–850) | reported | S21 |
| Disponibla vårdplatser, normalvecka | 550 | estimate | 1 070 × 825/1 600 |
| Disponibla vårdplatser, vecka 33 2025 | 472 | estimate | 915 × 825/1 600 |
| Belagda vårdplatser nu | 541 | illustrative | scenario baseline |
| IVA-platser | 9 | verified | S5 |
| IMA-platser | 8 | illustrative | "Intermediärvårdavdelning Övre buk Huddinge" exists (S7 list); count not public |
| Akutmottagningen Huddinge | kapacitet upp till 70 000 besök/år; 4 akutrum, 25 övervakningsplatser, 25 behandlingsrum, 4 isoleringsrum; invigd 2024-09-17 | verified | S6 (Karolinska/Cision). Mitti reports 50 övervakningsplatser – discrepancy noted |
| Operationssalar (O-huset) | 23 | verified | S9 |
| IVA-expansion 2020 | O-huset byggdes om till 64 IVA-platser på 10 dagar | verified | S9 |
| CT / MR | 3 / 2 | illustrative | count not public |
| Coordinates | 59.2215, 17.9390 | estimate (town centre Flemingsberg) | – |
| Sharing, sync | Full; Synced | – | – |
| Lead (fictional) | Peter Nord | – | § 7 |

### 2.3 Karolinska, both sites (`karolinska`, aggregate scope)

Fastställda 1 600 (reported, S21). Disponibla normalvecka ≈ 1 070 (estimate, § 3). Disponibla v.33 2025: 915 (verified, S4b); v.32 2025: 862 (verified, S4a). IVA 18 + 9 = 27 exklusive THIVA (verified sum); Stockholm har cirka 100 IVA-platser varav ungefär en tredjedel på Karolinskas enhet för Intensivvård och Thoraxoperation (S5). Medarbetare 16 500 (S2).

### 2.4 Region Stockholm – akutsjukhus (disponibla vårdplatser vecka 33 2025, verified S4b)

| key | Name | Disponibla v.33 | IVA | Free beds now (illustrative) | Coordinates (approx., estimate) |
|---|---|---|---|---|---|
| sos | Södersjukhuset | 391 | null | 14 | 59.3100, 18.0530 |
| ds | Danderyds sjukhus | 370 | null | 11 | 59.3925, 18.0390 |
| stgoran | Capio S:t Görans sjukhus | 344 | 8 (research, older) | 9 | 59.3360, 18.0260 |
| sodertalje | Södertälje sjukhus | 170 | null | 6 | 59.1970, 17.6290 |
| norrtalje | Norrtälje sjukhus (Tiohundra) | 90 | null | 4 | 59.7570, 18.6980 |
| ersta | Ersta sjukhus | 41 | null | 2 | 59.3180, 18.0850 |

Total disponibla v.33 2025 incl. Karolinska: 2 321 (S4b). Regionen hade i genomsnitt 4 208 disponibla somatiska vårdplatser 2025; 85,3 disponibla IVA-platser mot Socialstyrelsens riktvärde 87,8 (S18). Sharing for all region hospitals: `Capacity only`. Sync: Synced 14:30 (illustrative).

### 2.5 Capacity classes (receiving capacity outside akutsjukhusen)

| key | Name | Capacity | Confidence | Source |
|---|---|---|---|---|
| geriatrik | Geriatrik (19 kliniker) | 1 092 disponibla platser; 23 lediga 2025-08-06 | verified | S4b (Belport), S4a |
| palliativ | Sluten palliativ vård | ~217 platser (14 vårdgivare) | verified | S4a |
| rehab | Specialiserad rehabilitering | 185 platser | verified | S4a |
| psykiatri | Psykiatri | ~980 regiondrivna + ~120 privata platser | verified | S4a; not an evacuation destination |
| asih | ASIH – avancerad sjukvård i hemmet | ~3 724 inskrivna per dag (v.32 2025); 8 geografiska områden; krav att nå patienten inom 30 min | verified | S4a (inskrivna), research (områden, 30 min) |
| asih capacity for new admissions today | 120 | illustrative | not public |

ASIH accepts care level `Home` for patients with `homeCareEligible`. Its "free places" figure is the illustrative 120 above, shown with its chip.

### 2.6 Ambulanssjukvården Region Stockholm (`ambulans`, Transport node)

Egen förvaltning sedan 2026-01-01 (tidigare AISAB); cirka 100 fordon, cirka 30 stationer, cirka 1 700 anställda; 40–80 ambulanser i drift beroende på tid på dygnet (verified, S12). Uppdrag omfattar akutambulans, transportambulans, IVA-ambulans, psykiatriambulans, läkartjänst i ambulanshelikopter (S12). Availability now (illustrative): akutambulans 12 lediga, transportambulans 6 lediga, IVA-ambulans 2 lediga, ambulanshelikopter 1 (count of helicopters not public – show 1 as illustrative).

### 2.7 Preset sites for "Etablera nod" (fictional names in real areas)

Tillfällig vårdhubb Flemingsberg (59.2200, 17.9450); Tillfällig vårdhubb Hagastaden (59.3480, 18.0400); Fältsjukhus Norrtälje övningsområde (59.7500, 18.7100); Vårdhubb Kista (59.4033, 17.9424); Vårdhubb Södertälje (59.1950, 17.6300). All illustrative.

## 3. Capacity ladder for vårdplatser (the pitch's central figure)

| Step | Karolinska | Solna | Huddinge | Confidence |
|---|---|---|---|---|
| Fastställda (går att öppna lokalmässigt i extraordinär situation, S4a definition) | 1 600 | 775 | 825 | reported (S21) |
| Disponibla, normalvecka (fysisk utformning, utrustning och bemanning – Socialstyrelsens definition, S4a) | 1 070 | 520 | 550 | estimate: Karolinska share of region total ≈ 39 % (915/2 321 in v.33) applied to a non-summer region total of ~2 750 (S4a chart range 2 686–2 798) |
| Disponibla, vecka 33 2025 | 915 | 443 | 472 | verified total (S4b); split estimate |
| Belagda nu | 1 038 | 497 | 541 | illustrative |
| Lediga nu | 32 | 23 | 9 | illustrative (derived) |

The gap between fastställda and disponibla is the capacity that exists on paper but not in staffing or equipment – the ladder is rendered exactly like the first prototype's, with confidence chips per step.

## 4. Läget nu – baseline values at 14:40 (all illustrative unless noted)

Thresholds for block status: see SPEC.md § 6.1.

| Block | Metric | Solna | Huddinge | Notes |
|---|---|---|---|---|
| Akuten | Patienter på akuten nu | 22 | 84 | Solna = Intensivakuten |
| | Väntar på vårdplats (färdigbedömda) | 6 | 17 | |
| | Längsta väntan på vårdplats | 3 h 10 min | 5 h 40 min | |
| | Vistelsetid över 4 h, andel | 34 % | 41 % | |
| | Tid till läkare, median | 18 min | 47 min | |
| | Traumalarm i dag | 4 | 0 | verified yearly volume S8 gives ~4/day; today's count illustrative |
| Vårdplatser | Disponibla i dag | 520 | 550 | estimate (§ 3) |
| | Belagda | 497 | 541 | |
| | Beläggning | 95,6 % | 98,4 % | derived |
| | Överbeläggningar | 4 | 6 | |
| | Utlokaliserade patienter | 7 | 9 | |
| | Utskrivningsklara som väntar | 23 | 31 | of which ASIH-eligible 5 / 8 |
| Operation | Program i dag | 38 | 41 | |
| | Utförda hittills | 24 | 27 | |
| | Strukna i dag | 3 (postop 2, IVA 1) | 2 (personal 2) | |
| | Väntande över 90 dagar | 410 | 520 | vårdgarantin; kö-fritt-målet |
| Bilddiagnostik | Inneliggande som väntar på CT | 11 | 9 | |
| | Medianväntetid CT, inneliggande | 95 min | 70 min | |
| | Apparater ur drift | CT 1 av 4 | 0 | |
| | Inneliggande som väntar på MR | 6 | 4 | |
| IVA/IMA | IVA-platser / belagda / lediga | 18 / 16 / 2 | 9 / 9 / 0 | IVA totals verified S5 |
| | Väntar på IVA-plats | 1 | 2 | |
| | Väntar på nedflytt från IVA | 3 | 1 | |
| | IMA-platser / belagda | 12 / 11 | 8 / 8 | |
| Bemanning | Vakanta pass kväll/natt | 9 | 12 | Bemanningscentrum |
| | Inhyrda i tjänst | 6 | 8 | |
| | Sjukfrånvaro i dag | 6,8 % | 7,4 % | |

## 5. Placement queue, discharge-ready list, forecast profiles (illustrative)

### 5.1 Wards used for placement (per site; total / free)

Solna: HKN Kardiologi 32/2; HKN Neurologi 28/1; Cancer Onkologi 30/3; Cancer Hematologi 24/0; ARM Ortopedi 28/2; ARM Kirurgi 30/1; I&Å Internmedicin 34/2; KVH Gynekologi 20/2.
Huddinge: I&Å Internmedicin 36/1; ARM Kirurgi 32/0; ARM Ortopedi 30/2; ARM Infektion 26/1; Cancer Onkologi 28/2; HKN Kardiologi 30/1; KVH Gynekologi 18/1.

Ward names are "Tema – enhet" and are illustrative placements of medicinska enheter; they do not claim to be Karolinska's ward list.

### 5.2 Bed requests (Patientplacering)

| id | Site | From | Patient (fictional) | Needs | Waiting | Suggested |
|---|---|---|---|---|---|---|
| br-1 | huddinge | Akutmottagningen | Andersson, Anna, 74 | Telemetri, HKN | 5 h 40 min | HKN Kardiologi |
| br-2 | huddinge | Akutmottagningen | Bergström, Björn, 58 | Isolering, ARM Infektion | 4 h 15 min | ARM Infektion |
| br-3 | huddinge | Akutmottagningen | Carlsson, Cecilia, 81 | I&Å | 3 h 50 min | I&Å Internmedicin |
| br-4 | huddinge | Akutmottagningen | Dahl, David, 45 | ARM Kirurgi | 3 h 05 min | ARM Kirurgi – no free bed: utlokalisering |
| br-5 | huddinge | Postop | Ekström, Elin, 67 | ARM Ortopedi | 1 h 20 min | ARM Ortopedi |
| br-6 | huddinge | IVA nedflytt | Forsberg, Fredrik, 52 | IMA | 6 h 00 min | IMA Huddinge – no free bed |
| br-7 | huddinge | Norrtälje sjukhus, remiss | Gustafsson, Gunilla, 70 | HKN | 2 h 30 min | HKN Kardiologi |
| br-8 | solna | Intensivakuten | Hedlund, Hans, 63 | Telemetri, HKN | 3 h 10 min | HKN Kardiologi |
| br-9 | solna | Intensivakuten | Isaksson, Ingrid, 77 | Cancer Onkologi | 2 h 20 min | Cancer Onkologi |
| br-10 | solna | Postop | Jonsson, Johan, 39 | ARM Ortopedi | 0 h 50 min | ARM Ortopedi |
| br-11 | solna | IVA nedflytt | Karlsson, Karin, 55 | IMA | 4 h 30 min | IMA Solna |
| br-12 | solna | Södersjukhuset, remiss | Lindqvist, Lars, 61 | HKN Neurologi | 1 h 45 min | HKN Neurologi |

### 5.3 Discharge-ready patients waiting (Utskrivningsklara)

| id | Site | Ward | Patient (fictional) | Days waiting | Waiting for | ASIH-eligible |
|---|---|---|---|---|---|---|
| dr-1 | huddinge | I&Å Internmedicin | Magnusson, Maria, 88 | 4 | Kommunal korttidsplats | no |
| dr-2 | huddinge | I&Å Internmedicin | Nyström, Nils, 79 | 2 | ASIH | yes |
| dr-3 | huddinge | ARM Ortopedi | Olofsson, Olivia, 83 | 3 | Geriatrik | no |
| dr-4 | huddinge | ARM Infektion | Persson, Per, 66 | 1 | ASIH (iv-antibiotika) | yes |
| dr-5 | huddinge | Cancer Onkologi | Qvist, Rebecka, 71 | 2 | ASIH | yes |
| dr-6 | huddinge | HKN Kardiologi | Rosén, Stefan, 69 | 1 | Hemsjukvård | yes |
| dr-7 | solna | HKN Neurologi | Sandberg, Tove, 76 | 5 | Rehabilitering | no |
| dr-8 | solna | Cancer Onkologi | Törnqvist, Ulf, 64 | 2 | ASIH | yes |
| dr-9 | solna | I&Å Internmedicin | Ullman, Vera, 91 | 6 | Kommunal korttidsplats | no |
| dr-10 | solna | ARM Kirurgi | Vikström, William, 58 | 1 | ASIH | yes |
| dr-11 | solna | HKN Kardiologi | Wallin, Ylva, 72 | 3 | Geriatrik | no |
| dr-12 | solna | Cancer Hematologi | Åberg, Åsa, 60 | 2 | ASIH | yes |

Beyond these 12 named rows, the counts in § 4 (23 + 31) are shown as totals; the list shows the 12 with a line "och ytterligare {n} patienter".

### 5.4 Forecast profiles (arrivals per hour, illustrative)

Huddinge Akutmottagningen: 06–10 6/h, 10–18 9/h, 18–22 8/h, 22–06 4/h (≈ 170 per day, consistent with 55 000–70 000 per year, S6). Admission share 32 %. Solna Intensivakuten: 07–19 1,2/h, 19–07 0,7/h; admission share 70 %. Expected discharges per hour (both sites, share of today's planned discharges): 10–12 25 %, 12–14 30 %, 14–16 25 %, 16–18 15 %, other 5 %. Planned discharges today: Solna 46, Huddinge 52. Elective admissions tomorrow 07–09: Solna 22, Huddinge 24.

## 6. Resources, requests, messages (illustrative)

### 6.1 Inventory (per site unless stated)

Solna: Ventilator 34 total / 4 lediga / 28 i drift / 2 ur funktion; Infusionspump 260/30/226/4; Patientmonitor 60/8/52/0; Syrgaskoncentrator 24/9/15/0; Defibrillator 28/3/25/0; Mobil ultraljud 8/2/6/0; Rullstol 70/10/60/0; Bår 30/8/22/0. Supplies: Syrgas (flaskor) 160 (lowBelow 80); Blodprodukter O-negativ 22 enheter (criticalBelow 20, lowBelow 40); Antibiotika iv, bredspektrum 6 dagar (lowBelow 3); NaCl 1 000 ml 900 påsar (lowBelow 300); Morfin 10 mg 160 ampuller (lowBelow 150, criticalBelow 60); Tourniquet 40 (lowBelow 50); Skyddsutrustning 3 000 set (lowBelow 800).
Huddinge: Ventilator 22/2/19/1; Infusionspump 220/24/192/4; Patientmonitor 52/6/46/0; Syrgaskoncentrator 18/6/12/0; Defibrillator 24/2/22/0; Mobil ultraljud 6/2/4/0; Rullstol 60/8/52/0; Bår 25/7/18/0. Supplies: Syrgas 120 (lowBelow 60); Blodprodukter O-negativ 16 (Critical); Antibiotika iv 5 dagar; NaCl 800; Morfin 140 (Low); Tourniquet 35 (Low); Skyddsutrustning 2 400.
Ambulanssjukvården (transport node): Akutambulans 100 total / 12 lediga / 60 i drift / 28 ej i tjänst (fordon utan bemanning just nu); Transportambulans (liggande sjuktransport) 20/6/14/0; IVA-ambulans 4/2/2/0; Ambulanshelikopter 1/1/0/0; Buss (sjukvårdsbuss) 2/2/0/0. "Ej i tjänst" is shown in its own column, never dropped.

Vehicle compatibility as in the first prototype: Gående → Transportambulans, Buss, Akutambulans; Rullstol → Transportambulans, Buss, Akutambulans; Bår → Transportambulans, Akutambulans; Ambulans → Akutambulans; Intensivvårdstransport → IVA-ambulans.

### 6.2 Seeded requests

| id | Resurs | Antal | Från | Till | Prioritet | Status | Begärd av | Kl | Not |
|---|---|---|---|---|---|---|---|---|---|
| req-1 | Ventilator | 2 | – | huddinge | Hög | Begärd | Peter Nord | 13:52 | Två IVA-kandidater på akuten |
| req-2 | Syrgaskoncentrator | 6 | solna | huddinge | Normal | Accepterad | Peter Nord | 14:05 | |
| req-3 | Transportambulans | 2 | ambulans | huddinge | Hög | Utsänd | Karin Sjö | 14:07 | ETA 15:10; utskrivningsklara till geriatrik |
| req-4 | NaCl 1 000 ml | 100 | solna | huddinge | Normal | Utsänd | Karin Sjö | 13:30 | ETA 14:50 |
| req-5 | Rullstol | 4 | huddinge | huddinge | Normal | Mottagen | Peter Nord | 13:10 | Till akutens triage |

Statuses (keys → Swedish labels): Requested → Begärd, Accepted → Accepterad, Allocated → Tilldelad, Dispatched → Utsänd, Received → Mottagen, Rejected → Avvisad.

### 6.3 Messages (Resurser → Från meddelande)

| id | Author | Role | Node | Kl | Text |
|---|---|---|---|---|---|
| msg-1 | Peter Nord | Chefssjuksköterska akuten Huddinge | huddinge | 13:52 | Behöver två ventilatorer till akuten Huddinge, två patienter kan behöva andningsstöd innan IVA-plats finns. |
| msg-2 | Maria Holm | Verksamhetschef IVA Solna | solna | 14:05 | Vi saknar syrgas till IMA – sex koncentratorer räcker för kvällen. |
| msg-3 | Karin Sjö | Logistiksamordnare | huddinge | 14:20 | Akuten behöver fyra rullstolar och två bårar till triagen. |

Parser synonyms as in the first prototype plus: koncentrator → Syrgaskoncentrator; rullstol → Rullstol; bår → Bår; ventilator → Ventilator; transportambulans, liggande → Transportambulans; ambulans → Akutambulans. Node synonyms: huddinge, akuten huddinge → huddinge; solna, intensivakuten → solna; sös, södersjukhuset → sos; ambulans → ambulans.

## 7. People (all fictional; if any name coincides with a real Karolinska employee, rename)

| Name | Title (UI) | Profession pill | Node |
|---|---|---|---|
| Eva Lind | Kapacitetskoordinator, Stab Produktion (current user, initials EL) | Supp | karolinska |
| Johan Ek | Överläkare, PMI | Doc | solna |
| Maria Holm | Verksamhetschef IVA Solna | Doc | solna |
| Omar Haddad | Anestesiläkare, PMI | Doc | huddinge |
| Peter Nord | Chefssjuksköterska, Akutmottagningen Huddinge | Nrs | huddinge |
| Sara Lund | Sjuksköterska, Intensivakuten | Nrs | solna |
| Karin Sjö | Logistiksamordnare, Stab Produktion | Supp | huddinge |
| Erik Falk | Samordnare, Ambulanssjukvården | Supp | ambulans |
| Lena Åkesson | Kommunikatör (KiB) | Supp | karolinska |
| Helena Berg | Chefläkare, Södersjukhuset | Doc | sos |
| Mats Öberg | Vårdhubbsansvarig | Nrs | – (assigned when a node is stood up) |
| Jonas Vik | Fältsjukhuschef | Doc | – |
| Anna Ek | Verksamhetschef ASIH | Nrs | asih |

Profession pill labels stay as in the platform: Doc, Nrs, AsPr, Supp.

## 8. Beredskap: terms, playbooks, scenarios

### 8.1 Regional terms (verified, S13; use exactly these labels)

- **TiB** – tjänsteman i beredskap (regional, tar emot larm dygnet runt, kan besluta om mottagande enheter).
- **RSSL** – regional särskild sjukvårdsledning.
- **LSSL** – lokal särskild sjukvårdsledning (sjukhuset).
- **EKMB** – enheten för katastrofmedicinsk beredskap.
- **SSR** – Samverkan Stockholmsregionen ("den gröna knappen").
- **KiB** – kommunikation i beredskap. **PKL** – psykologiskt krisstöd.
- **Beredskapslägen:** stabsläge, förstärkningsläge, katastrofläge.

Level thresholds used by the scenario engine (20–60 skadade → förstärkningsläge, > 60 → katastrofläge) are illustrative and labelled so.

### 8.2 Playbooks (Swedish labels; structure as the first prototype)

**PB1 – Allvarlig händelse: masskada** (`masskada`). Utlösare: "Larm från TiB eller TCK om många skadade". Roller: Sjukvårdsledare LSSL, Medicinskt ansvarig, Akutansvarig, Operationsansvarig (PMI), IVA-ansvarig, Logistikansvarig, Kommunikationsansvarig (KiB), Krisstödsansvarig (PKL). Kanaler: LSSL, Akuten, Operation och IVA, Logistik och transport, Samverkan RSSL.
Mål: Triagekapacitet akuten Solna 40 patienter inom 30 min; Operationssalar tillgängliga 8 inom 60 min; IVA-platser tillkomna 6 inom 120 min; Vårdplatser frigjorda 40 inom 240 min.
Uppgifter (område, titel, roll, tid):
- Akuten: Upprätta triagezoner röd/gul/grön (Akutansvarig, +15); Töm akuten på färdigbedömda patienter (Akutansvarig, +20); Öppna andra traumabayen (Medicinskt ansvarig, +30).
- Operation och IVA: Stryk elektiv operation och frigör salar (Operationsansvarig, +30); Kalla in anestesiteam (Operationsansvarig, +45); Öppna IMA som IVA-överflöd (IVA-ansvarig, +90).
- Vårdavdelningar: Identifiera patienter för tidigare utskrivning (Medicinskt ansvarig, +45); Starta överföringsplanering till region och ASIH (Medicinskt ansvarig, +60); Frigör 40 vårdplatser (Medicinskt ansvarig, +240).
- Logistik och transport: Begär ventilatorer till Huddinge (Logistikansvarig, +30); Begär transportresurser från Ambulanssjukvården (Logistikansvarig, +45); Kontrollera blodprodukter och syrgas (Logistikansvarig, +30).
- Samverkan och kommunikation: Anmäl läget till TiB och RSSL (Sjukvårdsledare LSSL, +10); Öppna kanaler och starta inkallning (Kommunikationsansvarig, +15); Aktivera PKL (Krisstödsansvarig, +30).

**PB2 – Journalsystem otillgängligt** (`journalbortfall`, `setsEhrOutage: true`). Utlösare: "Journalsystemet eller sjukhusets nät otillgängligt" (as in June 2022, S16, when RSSL went to stabsläge and care switched to manuella reservrutiner). Roller: Sjukvårdsledare LSSL, IT-kontakt, Ansvarig reservrutiner. Kanaler: LSSL, IT och avdelningar. Mål: Avdelningar bekräftade på reservrutin 4 inom 30 min. Uppgifter: Bekräfta störningens omfattning med IT (IT-kontakt, +10); Gå över till operativ spegel och läskopia på alla avdelningar (Ansvarig reservrutiner, +30); Utse avdelningsrunners för pappersordinationer (Ansvarig reservrutiner, +20); Frys icke-akuta överflyttningar (Sjukvårdsledare LSSL, +15); Verifiera kritiska läkemedelslistor mot senaste spegling (Ansvarig reservrutiner, +45); Förbered återsynkronisering (IT-kontakt, +60).

**PB3 – Mottagande av evakuerade patienter** (`mottagande`). Utlösare: "RSSL fördelar patienter från annan region eller annat land" (as exercised in Sjukvårdsövning 26, S15, with a scenario of about 260 patients). Roller: Sjukvårdsledare LSSL, Medicinskt ansvarig, Logistikansvarig. Kanaler: LSSL, Samverkan RSSL. Mål: Mottagningsplatser bekräftade 60 inom 120 min. Uppgifter: Bekräfta tilldelning från RSSL (Sjukvårdsledare LSSL, +10); Reservera mottagningsplatser per tema (Medicinskt ansvarig, +30); Ordna mottagningsplats vid ambulanshallen Huddinge (Logistikansvarig, +45); Aktivera ASIH för utskrivningsklara (Medicinskt ansvarig, +60); Rapportera läge till RSSL (Sjukvårdsledare LSSL, +90).

**PB4 – Evakuering av sjukvårdsinrättning** (`evakuering`). Utlösare: "Del av sjukhuset måste utrymmas". Roller: Sjukvårdsledare LSSL, Medicinskt ansvarig, Logistikansvarig. Kanaler: LSSL, Logistik och transport. Mål: Patienter flyttade 60 inom 240 min. Uppgifter: Klassificera patienter för flytt (Medicinskt ansvarig, +20); Begär mottagningskapacitet via RSSL (Sjukvårdsledare LSSL, +20); Begär transportresurser (Logistikansvarig, +30); Starta evakueringsplanering (Medicinskt ansvarig, +30). Activation navigates to Evakuering with the target set.

**PB5 – Pandemisk våg** (`pandemi`). Utlösare: "Snabbt ökande behov av intensivvård". Roller: Sjukvårdsledare LSSL, IVA-ansvarig, Logistikansvarig. Kanaler: LSSL, Operation och IVA. Mål: IVA-platser tillkomna 20 inom 10 dygn (rendered as days). Uppgifter: Aktivera plan för IVA-utbyggnad i O-huset (IVA-ansvarig, +60) – the 2020 conversion to 64 platser på 10 dagar (S9) is shown as the reference in the task note; Stryk elektiv verksamhet stegvis (Sjukvårdsledare LSSL, +120); Säkra ventilatorer och syrgas (Logistikansvarig, +120).

### 8.3 Scenario presets (engine parameters, illustrative)

| key | Name | Parameters (defaults) | Effects |
|---|---|---|---|
| masskada | Masskada | skadade 60; fördelning röd 20 % gul 40 % grön 40 %; ankomstfönster 120 min, första ankomst +20 min; primär mottagare Solna (TCK); sekundär Huddinge | SPEC.md § 7.3 |
| tryck | Ordinärt högtryck | inflödesfaktor 1,3 på akuten Huddinge i 6 h | forecast only |
| journalbortfall | Journalsystem otillgängligt | start nu, varaktighet 6 h | EHR outage + PB2 |
| mottagande | Mottagande av evakuerade | 260 patienter till regionen över 12 h via Norrtälje; Karolinskas andel 35 % (91) | inflow to nodes by free capacity |
| pandemi | Pandemisk våg | IVA-behov +3 per dygn i 14 dygn | IVA demand ramp; expansion option +64 (O-huset) |
| siteevac | Evakuering av del av sjukhus | site Huddinge, 60 patienter | opens Evakuering with target |

## 9. Sources

| key | Source | Date |
|---|---|---|
| S1 | karolinska.se – Teman och funktioner, https://www.karolinska.se/om-oss/organisation/teman-och-funktioner/ | page modified 2026-08-03 |
| S2 | karolinska.se – Fakta om sjukhuset (statistik 2025), https://www.karolinska.se/om-oss/fakta-om-sjukhuset/ | 2026-03-11 |
| S3 | karolinska.se – Sjukhusets organisation, https://www.karolinska.se/om-oss/organisation/ | 2026 |
| S4a | Region Stockholm – Vårdplatsrapport vecka 32 2025, https://www.regionstockholm.se/4a2404/contentassets/8b5c3bf15757467c8a6fd7078ef39625/vardplatsrapport-v32-2025.pdf | 2025-08-07 |
| S4b | Region Stockholm – Vårdplatsrapport vecka 33 2025, https://www.regionstockholm.se/4a314e/contentassets/844e94c11f884b0982a5446da9fe6d9b/vardplatsrapport-v33-2025.pdf | 2025-08-13 |
| S5 | karolinska.se – Fler svårt sjuka kan få vård när Karolinska öppnar fler IVA-platser, https://www.karolinska.se/om-oss/centrala-nyheter/2025/01/fler-svart-sjuka-kan-fa-vard-nar-karolinska-universitetssjukhuset-oppnar-fler-iva-platser/ | 2025-01-27 |
| S6 | Karolinska/Cision – Nya akutmottagningen Huddinge (2024-09); Mitti 2024-09-16, https://www.mitti.se/nyheter/nya-akutmottagningen-pa-karolinska-i-huddinge-invigd-6.3.246216.07c6c1df22 | 2024-09 |
| S7 | karolinska.se – Intensivakuten Solna, https://www.karolinska.se/vard/tema/tema-akut-och-reparativ-medicin/akut/intensivakuten-solna/ ; Mottagningar och avdelningar A–Ö | 2026 |
| S8 | karolinska.se – Traumacentrum Karolinska (TCK) | series since 2010 (older) |
| S9 | SVT / White Arkitekter – O-huset Huddinge, 23 operationssalar, 64 IVA-platser 2020 | 2020 (older) |
| S10 | sv.wikipedia.org – Nya Karolinska Solna; en.wikipedia.org – Karolinska University Hospital (coordinates, ESHK) | 2026 (planning figures older) |
| S11 | karolinska.se – Stab Produktion, https://www.karolinska.se/om-oss/organisation/Administrativa-verksamheter/central-produktionsstyrning/ | 2026-07-29 |
| S12 | regionstockholm.se – Ambulanssjukvården (förvaltning från 2026-01-01; fordon, stationer, anställda) | 2025–2026 |
| S13 | Region Stockholm – Regionala riktlinjer för katastrofmedicinsk beredskap (HSN), https://www.regionstockholm.se/4a74e8/siteassets/om-region-stockholm/om-region-stockholm/styrande-dokument/sakerhet-och-krisberedskap/regionala-riktlinjer-for-katastrofmedicinsk-beredskap-for-region-stockholm.pdf | 2022-10 |
| S14 | Socialstyrelsen – Nya regler från 2026 (HSL-beredskap; lagerhållning 2027), https://www.socialstyrelsen.se/aktuellt/nya-regler-fran-2026-halso--och-sjukvardens-beredskap-starks-vid-kris-och-krig/ ; prop. 2024/25:167 | 2025-11-24 |
| S15 | regionstockholm.se – Region Stockholm deltar i totalförsvarsövning Aurora (Sjukvårdsövning 26, 4–8 maj 2026), https://www.regionstockholm.se/nyheter/2026/05/region-stockholm-deltar-i-totalforsvarsovning-aurora/ ; SOS Alarm/SR on the ~260-patient scenario | 2026-05 |
| S16 | regionstockholm.se – It-störning i journalsystemet TakeCare, https://www.regionstockholm.se/nyheter/2022/06/it-storning-i-journalsystemet-takecare/ | 2022-06 |
| S17 | regionstockholm.se – Beslut om nytt huvudjournalsystem (Cambio Cosmic), https://www.regionstockholm.se/nyheter/2025/02/beslut-om-nytt-huvudjournalsystem-for-region-stockholm/ | 2025-02 / 2025-11 |
| S18 | regionstockholm.se / Socialstyrelsen – vårdplatser 2025 (4 208 somatiska; IVA 85,3 mot riktvärde 87,8) | 2026-06 |
| S19 | GE HealthCare – Command Center at Alfred Health ("ORA"), https://www.gehealthcare.com/en-us/about/newsroom/press-releases/ge-healthcare-s-command-center-moves-from-concept-to-reality-at-three-melbourne-hospitals | 2026-03-19 |
| S20 | karolinska.se – personalsiffror 2024 (5 132 sjuksköterskor/barnmorskor, 3 053 läkare, 3 053 undersköterskor) – **two categories carry the same number in the research output; verify before use**; until verified, show läkare and undersköterskor as `estimate` | 2025-02 |
| S21 | Medoma (Philip Smith) – fastställda vårdplatser Huddinge 800–850, Solna 750–800, totalt ~1 600 | 2026-09-06 |
| S22 | sv.wikipedia.org – Karolinska universitetssjukhuset (42 NHV-uppdrag 2026) | 2026-06 |

Staff categories for the Bemanning block: Sjuksköterskor och barnmorskor 5 132 (verified S20, 2024); Läkare 3 053 (estimate, S20 flag); Undersköterskor och barnsköterskor 3 053 (estimate, S20 flag); Övriga yrkeskategorier 5 262 (derived: 16 500 − the three above; estimate).
