// Fetches OpenStreetMap geometry for Hospital at Home and writes the GeoJSON files of SPEC.md § 12.2 for one home pack
// (SPEC.md § 14.5).
//
//   node scripts/fetch-osm.mjs [pack]            pack karolinska (default) or lund: fetch all four queries from Overpass and
//                                                write src/data/packs/geo/<pack>/*.json and its README.md
//   node scripts/fetch-osm.mjs lund --bbox 55.58,12.84,55.93,13.74
//                                                use another bounding box (south,west,north,east) for roads, power and water
//   node scripts/fetch-osm.mjs [pack] --only roads   fetch one query (roads, streets, power or water)
//   node scripts/fetch-osm.mjs [pack] --from DIR     convert saved Overpass answers (DIR/roads.json …) instead of fetching
//   node scripts/fetch-osm.mjs [pack] --out DIR      write somewhere other than src/data/packs/geo/<pack> (to try the script out)
//   node scripts/fetch-osm.mjs [pack] --write-queries   write the query files under scripts/overpass/ and stop (no network)
//
// This script is the only code in the repository that talks to the internet, and only to the Overpass endpoints below (ENDPOINTS; OVERPASS_URL goes first). The app
// never calls Overpass; the files it writes are committed.
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTPUTS, PACKS, buildQuery, geoReadme } from './osm-convert.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const queryDir = path.join(here, 'overpass');
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const pack = args[0] && !args[0].startsWith('--') ? args[0] : 'karolinska';
if (!PACKS[pack]) {
  console.error(`Unknown pack "${pack}". Known packs: ${Object.keys(PACKS).join(', ')}`);
  process.exit(2);
}
const outDir = arg('--out') ? path.resolve(arg('--out')) : path.resolve(here, '../src/data/packs/geo', pack);
const only = arg('--only');
const fromDir = arg('--from');
const bbox = arg('--bbox')?.split(',').map(Number);
if (bbox && (bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n)))) {
  console.error('--bbox takes four numbers: south,west,north,east');
  process.exit(2);
}

// Karolinska's queries are the verbatim files of SPEC.md § 12.2; another pack, or another bounding box, builds them from osm-convert.mjs.
const queryText = (name) => (pack === 'karolinska' && !bbox ? readFileSync(path.join(queryDir, `${name}.overpassql`), 'utf8') : buildQuery(pack, name, name === 'streets' ? undefined : bbox));

if (args.includes('--write-queries')) {
  const dir = pack === 'karolinska' ? queryDir : path.join(queryDir, pack);
  mkdirSync(dir, { recursive: true });
  for (const o of OUTPUTS) writeFileSync(path.join(dir, `${o.query}.overpassql`), queryText(o.query));
  console.log(`Wrote the ${OUTPUTS.length} query files of ${pack} to ${dir}`);
  process.exit(0);
}

// Endpoints are tried in order until one answers; OVERPASS_URL, when set, goes first.
const ENDPOINTS = [...new Set([process.env.OVERPASS_URL, 'https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://z.overpass-api.de/api/interpreter'].filter(Boolean))];
const TILE_PAUSE_MS = Number(process.env.TILE_PAUSE_MS ?? 20_000);
const BUSY_WAIT_MS = 90_000;
const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let endpointIndex = 0; // the endpoint that last answered; later tiles start there
let firstRequest = true;

// A bounding box (south, west, north, east) split into four equal tiles (2 x 2).
function tiles([s, w, n, e]) {
  const mLat = (s + n) / 2;
  const mLon = (w + e) / 2;
  return [[s, w, mLat, mLon], [s, mLon, mLat, e], [mLat, w, n, mLon], [mLat, mLon, n, e]];
}

// One query text against the endpoints: 503 and 429 wait 90 s and retry the same query (at most three attempts per
// endpoint); any other failure moves on to the next endpoint.
async function post(label, ql) {
  const failures = [];
  for (let k = 0; k < ENDPOINTS.length; k++) {
    const idx = (endpointIndex + k) % ENDPOINTS.length;
    const url = ENDPOINTS[idx];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let status;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'medoma-resilience-ks/fetch-osm (https://github.com/philipsmithmedoma/Medoma-Resilience-KS)' },
          body: new URLSearchParams({ data: ql }),
          signal: AbortSignal.timeout(240_000),
        });
        if (res.ok) {
          endpointIndex = idx;
          return await res.json();
        }
        status = res.status;
      } catch (err) {
        failures.push(`${url}: ${err.cause?.code ?? err.name}`);
        break;
      }
      if ((status === 503 || status === 429) && attempt < MAX_ATTEMPTS) {
        console.log(`${label}: HTTP ${status} from ${url}, waiting ${BUSY_WAIT_MS / 1000} s (attempt ${attempt} of ${MAX_ATTEMPTS})`);
        await sleep(BUSY_WAIT_MS);
        continue;
      }
      failures.push(`${url}: HTTP ${status}`);
      break;
    }
  }
  throw new Error(`Overpass ${label}: no endpoint answered (${failures.join('; ')})`);
}

// Fetches one output: bounding-box queries tile by tile (20 s apart), merged with de-duplication on OSM type and id.
async function query(name) {
  const parts = name === 'streets' ? [{ label: name, ql: queryText(name) }] : tiles(bbox ?? PACKS[pack].bbox[name]).map((t, i) => ({ label: `${name} tile ${i + 1}/4`, ql: buildQuery(pack, name, t) }));
  const merged = new Map();
  let base;
  for (const part of parts) {
    if (!firstRequest) await sleep(TILE_PAUSE_MS);
    firstRequest = false;
    const raw = await post(part.label, part.ql);
    base ??= raw;
    let added = 0;
    for (const el of raw.elements ?? []) {
      const key = `${el.type}/${el.id}`;
      if (!merged.has(key)) {
        merged.set(key, el);
        added++;
      }
    }
    console.log(`${part.label}: ${(raw.elements ?? []).length} elements, ${added} new`);
  }
  return { ...base, elements: [...merged.values()] };
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
if (!only) writeFileSync(path.join(outDir, 'README.md'), geoReadme(date, sizes, pack));
if (overBudget) {
  console.error('A file exceeds its budget (SPEC.md § 12.2): tighten the simplification or the query before committing.');
  process.exit(1);
}
