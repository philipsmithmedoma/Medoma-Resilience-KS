// Fetches OpenStreetMap geometry for Hospital at Home and writes the GeoJSON files of SPEC.md § 12.2.
//
//   node scripts/fetch-osm.mjs                 fetch all four queries from Overpass and write src/data/packs/geo/*.json
//   node scripts/fetch-osm.mjs --only roads    fetch one query (roads, streets, power or water)
//   node scripts/fetch-osm.mjs --from DIR      convert saved Overpass answers (DIR/roads.json …) instead of fetching
//   node scripts/fetch-osm.mjs --out DIR       write somewhere other than src/data/packs/geo (for trying the script out)
//
// This script is the only code in the repository that talks to the internet, and only to OVERPASS below. The app
// never calls Overpass; the files it writes are committed.
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTPUTS, geoReadme } from './osm-convert.mjs';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const here = path.dirname(fileURLToPath(import.meta.url));
const queryDir = path.join(here, 'overpass');
const arg0 = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const outDir = arg0('--out') ? path.resolve(arg0('--out')) : path.resolve(here, '../src/data/packs/geo');

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = arg('--only');
const fromDir = arg('--from');

async function query(name) {
  const ql = readFileSync(path.join(queryDir, `${name}.overpassql`), 'utf8');
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'medoma-resilience-ks/fetch-osm (https://github.com/philipsmithmedoma/Medoma-Resilience-KS)' },
      body: new URLSearchParams({ data: ql }),
    });
    if (res.ok) return res.json();
    // 429 and 504 mean the public instance is busy: wait and retry.
    if ((res.status === 429 || res.status === 504 || res.status === 502) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 15000 * attempt));
      continue;
    }
    throw new Error(`Overpass ${name}: HTTP ${res.status}`);
  }
  throw new Error(`Overpass ${name}: no answer`);
}

mkdirSync(outDir, { recursive: true });
const date = new Date().toISOString().slice(0, 10);
const sizes = {};
let overBudget = false;
for (const o of OUTPUTS) {
  if (only && only !== o.query) continue;
  const raw = fromDir ? JSON.parse(readFileSync(path.join(fromDir, `${o.query}.json`), 'utf8')) : await query(o.query);
  const geo = o.convert(raw);
  const file = path.join(outDir, o.file);
  writeFileSync(file, JSON.stringify(geo));
  sizes[o.file] = statSync(file).size;
  const ok = sizes[o.file] <= o.budget;
  overBudget ||= !ok;
  console.log(`${o.file}: ${geo.features.length} features, ${(sizes[o.file] / 1024).toFixed(1)} KB${Number.isFinite(o.budget) ? ` of ${(o.budget / 1024).toFixed(0)} KB` : ''}${ok ? '' : '  OVER BUDGET'}`);
}
if (!only) writeFileSync(path.join(outDir, 'README.md'), geoReadme(date, sizes));
if (overBudget) {
  console.error('A file exceeds its budget (SPEC.md § 12.2): tighten the simplification or the query before committing.');
  process.exit(1);
}
