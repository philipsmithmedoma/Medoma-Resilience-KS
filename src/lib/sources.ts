// Collects every Figure of the pack with its label and DATA.md section for the Källor page (SPEC.md § 6.10).
import type { DataPack, Figure } from '@/data/types';
import { REGION_FIGURES } from '@/data/packs/karolinska';
import { SCOPE_LABELS, SOURCES } from '@/data/vocab';

export interface FigureEntry {
  label: string;
  figure: Figure;
  section: string;
  text?: string;
}

export function collectFigures(pack: DataPack): FigureEntry[] {
  const out: FigureEntry[] = [];
  const s = SOURCES.sections;
  const h = pack.hospital;
  out.push({ label: 'Medarbetare', figure: h.employees, section: s.org });
  out.push({ label: 'Öppenvårdsbesök 2025', figure: h.outpatientVisits, section: s.org });
  out.push({ label: 'Slutenvårdstillfällen 2025', figure: h.inpatientEpisodes, section: s.org });
  out.push({ label: 'Operationer 2025', figure: h.operations, section: s.org });
  out.push({ label: 'Patienter från andra regioner 2025', figure: h.patientsFromOtherRegions, section: s.org });
  out.push({ label: 'Uppdrag inom nationell högspecialiserad vård 2026', figure: h.nhvAssignments, section: s.org });
  for (const c of h.staffCategories) out.push({ label: c.label, figure: c.figure, section: s.org });

  for (const [scope, steps] of Object.entries(pack.ladders)) {
    const name = SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS] ?? scope;
    for (const step of steps) out.push({ label: `${step.label}, ${name}`, figure: step.figure, section: s.ladder });
  }

  for (const n of pack.nodes) {
    if (n.beds) {
      out.push({ label: `${n.name}: disponibla platser`, figure: n.beds.total, section: s.nodes });
      out.push({ label: `${n.name}: lediga platser nu`, figure: n.beds.free, section: s.nodes });
    }
    if (n.intensiveCare) {
      out.push({ label: `${n.name}: IVA-platser`, figure: n.intensiveCare.total, section: s.nodes });
      if (n.intensiveCare.free.value !== null) out.push({ label: `${n.name}: IVA-platser lediga nu`, figure: n.intensiveCare.free, section: s.nodes });
    }
    if (n.staffOnDuty) out.push({ label: `${n.name}: personal i tjänst`, figure: n.staffOnDuty, section: s.nodes });
    for (const e of n.extraFigures ?? []) out.push({ label: `${n.name}: ${e.label}`, figure: e.figure, section: s.nodes, text: e.text });
  }

  for (const [site, rooms] of Object.entries(pack.edRooms)) {
    out.push({ label: `Akutrum, ${SCOPE_LABELS[site as 'solna' | 'huddinge']}`, figure: rooms.akutrum, section: s.nodes });
    out.push({ label: `Övervakningsplatser akuten, ${SCOPE_LABELS[site as 'solna' | 'huddinge']}`, figure: rooms.overvakning, section: s.nodes });
    out.push({ label: `Behandlingsrum akuten, ${SCOPE_LABELS[site as 'solna' | 'huddinge']}`, figure: rooms.behandlingsrum, section: s.nodes });
  }
  for (const m of pack.flowMetrics) out.push({ label: `${m.label}, ${SCOPE_LABELS[m.site]}`, figure: m.value, section: s.flow });

  for (const c of pack.capabilities) {
    for (const comp of c.components) {
      const node = pack.nodes.find((n) => n.id === c.nodeId);
      out.push({ label: `${c.name} ${node?.shortName ?? ''}: ${comp.name}`, figure: { value: comp.total, confidence: comp.confidence ?? 'illustrative', source: comp.source, basis: comp.basis ?? 'scenariobaslinje' }, section: s.capabilities });
    }
  }

  out.push({ label: 'Lager per site och Ambulanssjukvårdens fordonspooler', figure: { value: null, confidence: 'illustrative', basis: 'DATA.md § 6.1; verifierade fordonsantal från S12 visas som noduppgifter' }, section: s.resources, text: 'Se Resurser → Lager' });
  out.push({ label: 'Förfrågningar och meddelanden', figure: { value: null, confidence: 'illustrative', basis: 'DATA.md § 6.2–6.3' }, section: s.resources, text: 'Se Resurser' });
  out.push({ label: 'Patientplaceringskö, utskrivningsklara och prognosprofiler', figure: { value: null, confidence: 'illustrative', basis: 'DATA.md § 5' }, section: s.flow, text: 'Se Läget nu' });
  out.push({ label: 'Patienter för evakuering (40 per site)', figure: { value: 80, confidence: 'illustrative', basis: 'genererade fiktiva patienter, scripts/generate-patients.mjs' }, section: s.flow });
  out.push({ label: 'Scenarioparametrar', figure: { value: null, confidence: 'illustrative', basis: 'DATA.md § 8.3' }, section: s.beredskap, text: 'Masskada 60 skadade; Ordinärt högtryck faktor 1,3; Journalsystem otillgängligt 6 h; Mottagande 260 patienter; Pandemisk våg +3 IVA per dygn; Evakuering 60 patienter' });
  out.push({ label: 'Personer i demon', figure: { value: 13, confidence: 'illustrative', basis: 'alla personer är fiktiva (DATA.md § 7)' }, section: s.other });

  for (const r of REGION_FIGURES) out.push({ label: r.label, figure: r.figure, section: r.figure.source && ['S13', 'S14', 'S15', 'S16', 'S17', 'S19'].includes(r.figure.source) ? s.beredskap : s.other, text: r.text });

  return out;
}
