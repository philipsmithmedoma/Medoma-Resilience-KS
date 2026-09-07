// Generates src/data/packs/patients.ts once, deterministically (SPEC.md § 6.7): 40 patients per site,
// wards from DATA.md § 5.1, the first prototype's distribution constraints, ages 24–91, 12 home care
// eligible per site. Run: node scripts/generate-patients.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SEED = 20260904;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const repeat = (value, n) => Array.from({ length: n }, () => value);

// 80 family names and 40 given names; no name coincides with a person in DATA.md § 7.
const FAMILY = [
  'Andersson', 'Bergström', 'Carlsson', 'Dahl', 'Ekström', 'Forsberg', 'Gustafsson', 'Hedlund', 'Isaksson', 'Jonsson',
  'Karlsson', 'Lindqvist', 'Magnusson', 'Nyström', 'Olofsson', 'Persson', 'Qvist', 'Rosén', 'Sandberg', 'Törnqvist',
  'Ullman', 'Vikström', 'Wallin', 'Åberg', 'Öhman', 'Blomkvist', 'Cederholm', 'Engström', 'Fransson', 'Grahn',
  'Hallberg', 'Ivarsson', 'Järvinen', 'Klingberg', 'Lundmark', 'Molin', 'Norén', 'Odén', 'Palm', 'Runesson',
  'Sjögren', 'Thorell', 'Uddén', 'Vinter', 'Wikander', 'Axelsson', 'Brandt', 'Collin', 'Danielsson', 'Edlund',
  'Fagerström', 'Gyllenhammar', 'Holmgren', 'Ingesson', 'Jakobsson', 'Kjellberg', 'Lindahl', 'Malmqvist', 'Nordlund', 'Oskarsson',
  'Pettersson', 'Rehn', 'Sundin', 'Tegnér', 'Ulvsköld', 'Viklund', 'Westin', 'Ytterberg', 'Zetterlund', 'Ahlgren',
  'Björk', 'Claesson', 'Dahlberg', 'Eliasson', 'Friberg', 'Granlund', 'Hägglund', 'Isberg', 'Johannesson', 'Kron',
];
const GIVEN = ['Anna', 'Björn', 'Cecilia', 'David', 'Elin', 'Fredrik', 'Gunilla', 'Hans', 'Ingrid', 'Johan', 'Karin', 'Lars', 'Maria', 'Nils', 'Olivia', 'Per', 'Rebecka', 'Stefan', 'Tove', 'Ulf', 'Vera', 'William', 'Ylva', 'Åsa', 'Örjan', 'Birgitta', 'Christer', 'Daniel', 'Eva', 'Filip', 'Gustav', 'Helena', 'Isak', 'Jenny', 'Klara', 'Leif', 'Monika', 'Noah', 'Oskar', 'Pia'];

// Wards per site (DATA.md § 5.1), 40 patients per site.
const WARDS = {
  solna: [
    ['HKN Kardiologi', 6], ['HKN Neurologi', 5], ['Cancer Onkologi', 5], ['Cancer Hematologi', 4],
    ['ARM Ortopedi', 5], ['ARM Kirurgi', 5], ['I&Å Internmedicin', 6], ['KVH Gynekologi', 4],
  ],
  huddinge: [
    ['I&Å Internmedicin', 7], ['ARM Kirurgi', 6], ['ARM Ortopedi', 6], ['ARM Infektion', 5],
    ['Cancer Onkologi', 6], ['HKN Kardiologi', 6], ['KVH Gynekologi', 4],
  ],
};

const careLevel = { Stable: 'Ward', Monitor: 'Monitored', Critical: 'Intensive' };
const TODAY = new Date(Date.UTC(2026, 8, 4));
function pin(age) {
  const daysBack = randInt(0, 364);
  const birth = new Date(Date.UTC(TODAY.getUTCFullYear() - age, TODAY.getUTCMonth(), TODAY.getUTCDate()));
  birth.setUTCDate(birth.getUTCDate() - daysBack);
  const y = birth.getUTCFullYear();
  const m = String(birth.getUTCMonth() + 1).padStart(2, '0');
  const d = String(birth.getUTCDate()).padStart(2, '0');
  const suffix = String(randInt(0, 9999)).padStart(4, '0');
  return `${y}${m}${d}-${suffix}`;
}

function generateSite(site, offset) {
  const wards = WARDS[site].flatMap(([name, n]) => repeat(name, n));
  // Stability 22 / 12 / 6, shuffled across the wards.
  const stability = shuffle([...repeat('Stable', 22), ...repeat('Monitor', 12), ...repeat('Critical', 6)]);
  // Transport per stability group (totals: 14 Walking, 10 Wheelchair, 12 Stretcher, 2 Ambulance, 2 ICT).
  const transportPools = {
    Stable: shuffle([...repeat('Walking', 14), ...repeat('Wheelchair', 6), ...repeat('Stretcher', 2)]),
    Monitor: shuffle([...repeat('Wheelchair', 4), ...repeat('Stretcher', 8)]),
    Critical: shuffle([...repeat('Stretcher', 2), ...repeat('Ambulance', 2), ...repeat('Intensive care transport', 2)]),
  };
  // Equipment: 18 none, 10 Oxygen, 8 IV infusion, 6 Monitoring (24 items over 22 patients).
  const equipmentPools = {
    Stable: shuffle([...repeat(['Oxygen'], 4), ...repeat(['IV infusion'], 2), ...repeat([], 16)]),
    Monitor: shuffle([...repeat(['Oxygen'], 4), ...repeat(['IV infusion'], 6), ...repeat([], 2)]),
    Critical: shuffle([...repeat(['Monitoring', 'Oxygen'], 2), ...repeat(['Monitoring'], 4)]),
  };
  const patients = [];
  for (let i = 0; i < 40; i++) {
    const st = stability[i];
    const age = randInt(24, 91);
    patients.push({
      id: `${site === 'solna' ? 'ps' : 'ph'}-${i + 1}`,
      familyName: FAMILY[offset + i],
      givenName: GIVEN[(i + (site === 'solna' ? 17 : 29)) % 40],
      pin: pin(age),
      age,
      ward: wards[i],
      nodeId: site,
      stability: st,
      careLevel: careLevel[st],
      transport: transportPools[st].pop(),
      equipment: equipmentPools[st].pop(),
      homeCareEligible: false,
    });
  }
  const candidates = shuffle(patients.filter((p) => p.stability === 'Stable' && (p.transport === 'Walking' || p.transport === 'Wheelchair')));
  candidates.slice(0, 12).forEach((p) => (p.homeCareEligible = true));
  return patients;
}

const all = { solna: generateSite('solna', 0), huddinge: generateSite('huddinge', 40) };

const line = (p) => `  ${JSON.stringify(p).replace(/"([a-zA-Z]+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ').replace(/\{/g, '{ ').replace(/\}/g, ' }')},`;
const out = `// Generated by scripts/generate-patients.mjs (seed ${SEED}). Do not edit by hand.
import type { Patient, SiteId } from './types';

export const PATIENTS_BY_SITE: Record<SiteId, Patient[]> = {
  solna: [
${all.solna.map(line).join('\n')}
  ],
  huddinge: [
${all.huddinge.map(line).join('\n')}
  ],
};
`;

const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/packs/patients.ts');
writeFileSync(target, out);
console.log(`Wrote ${all.solna.length + all.huddinge.length} patients to ${target}`);
