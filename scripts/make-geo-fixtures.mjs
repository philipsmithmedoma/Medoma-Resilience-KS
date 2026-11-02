// Writes the hand-designed fallback geometry used when the OpenStreetMap files in src/data/packs/geo/ are absent
// (SPEC.md § 12.4): fixture.json (roads), fixture-streets.json, fixture-power.json and fixture-water.json, all with the
// same schema as the files scripts/fetch-osm.mjs writes. The road topology is designed by hand to mirror the
// crossings of the real network (the north and the south of Stockholm meet only at the named crossings); the
// numbers are invented, the names are the real ones. Run: node scripts/make-geo-fixtures.mjs
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/packs/geo');
const r5 = (n) => Math.round(n * 1e5) / 1e5;
const P = (lat, lng) => [r5(lng), r5(lat)]; // GeoJSON order

// Vertices shared between ways (written once so that they are identical).
const SOLNA_Z = P(59.3597, 18.0005);
const BROMMA_Z = P(59.3383, 17.9401);
const INNER_Z = P(59.3312, 18.0407);
const SODERMALM_Z = P(59.3125, 18.0616);
const SODERORT_Z = P(59.2986, 18.0459);
const HUDDINGE_Z = P(59.2365, 17.9818);
const BOTKYRKA_Z = P(59.1988, 17.8332);
const NACKA_Z = P(59.31, 18.1648);
const LIDINGO_Z = P(59.3661, 18.1352);
const TABY_Z = P(59.4451, 18.0717);
const HUDDINGE_SITE = P(59.2215, 17.939);
const J1 = P(59.356, 18.0335); // beside Karolinska Solna
const J_E = P(59.358, 18.02); // where Essingeleden leaves Solnavägen
const J2 = P(59.342, 18.07);
const J3 = P(59.329, 18.03);
const K1 = P(59.3165, 18.025);
const K2 = P(59.319, 18.064);
const K3 = P(59.3195, 18.07);
const L1 = P(59.305, 18.035);
const L2 = P(59.301, 18.09);
const SKANSTULL = P(59.3029, 18.0795);
const J5 = P(59.298, 18.015);

// id, name, ref, highway, bridge, tunnel, oneway, points
const W = (id, name, ref, highway, bridge, tunnel, points) => ({ id, name, ref, highway, bridge, tunnel, oneway: false, points });
const corridors = [
  W(9000001, 'Uppsalavägen', 'E4', 'trunk', false, false, [TABY_Z, P(59.41, 18.045), J1]),
  W(9000002, 'Solnavägen', null, 'primary', false, false, [SOLNA_Z, J_E, J1]),
  W(9000003, 'Sundbybergsvägen', null, 'secondary', false, false, [BROMMA_Z, P(59.35, 17.97), SOLNA_Z]),
  W(9000004, 'Norra länken', 'E4', 'motorway', false, true, [J1, P(59.35, 18.05), J2]),
  W(9000005, 'Valhallavägen', null, 'primary', false, false, [J2, P(59.338, 18.055), INNER_Z, J3]),
  W(9000006, 'Lidingövägen', null, 'primary', true, false, [J2, P(59.355, 18.1), LIDINGO_Z]),
  W(9000007, 'Essingeleden', 'E4', 'trunk', true, false, [J_E, P(59.34, 18.01), P(59.3257, 18.0045), P(59.31, 18.01), J5]),
  W(9000008, 'Västerbron', null, 'primary', true, false, [J3, P(59.3243, 18.0275), K1]),
  W(9000009, 'Centralbron', null, 'primary', true, false, [INNER_Z, P(59.3264, 18.0635), K2]),
  W(9000010, 'Munkbroleden', null, 'primary', false, false, [INNER_Z, P(59.325, 18.056), K3]),
  W(9000011, 'Skeppsbron', null, 'secondary', false, false, [P(59.338, 18.055), P(59.33, 18.07), K3]),
  W(9000012, 'Katarinavägen', null, 'secondary', false, false, [K3, P(59.32, 18.08)]),
  W(9000013, 'Stadsgårdsleden', null, 'primary', false, false, [K3, P(59.318, 18.09), L2]),
  W(9000014, 'Liljeholmsbron', null, 'primary', true, false, [K1, P(59.3134, 18.0319), L1]),
  W(9000015, 'Skanstullsbron', null, 'primary', true, false, [K2, SKANSTULL, L2]),
  W(9000016, 'Södra länken', 'E4', 'motorway', false, true, [L2, P(59.301, 18.1054), NACKA_Z]),
  W(9000017, 'Götgatan', null, 'secondary', false, false, [K3, SODERMALM_Z, SKANSTULL]),
  W(9000018, 'Söderledstunneln', null, 'trunk', false, true, [K1, P(59.31, 18.04), SODERORT_Z]),
  W(9000019, 'Södertäljevägen', 'E4', 'trunk', false, false, [J5, P(59.27, 17.99), P(59.25, 17.97), HUDDINGE_Z, HUDDINGE_SITE]),
  W(9000021, 'Södertäljevägen', 'E4', 'trunk', false, false, [HUDDINGE_SITE, P(59.2, 17.88), BOTKYRKA_Z]),
  W(9000020, 'Västberga allé', null, 'secondary', false, false, [J5, L1, SODERORT_Z]),
];

// One ring road of 0.9 km radius per zone, so that every street of the fixture is close to a vertex of its own zone. Only junctions
// and way ends are vertices, so each ring is eight short ways (and a spoke to the zone centre), not one long way.
const zones = [
  ['Solna', SOLNA_Z], ['Innerstaden', INNER_Z], ['Bromma', BROMMA_Z], ['Södermalm', SODERMALM_Z], ['Söderort', SODERORT_Z],
  ['Huddinge', HUDDINGE_Z], ['Botkyrka', BOTKYRKA_Z], ['Nacka', NACKA_Z], ['Lidingö', LIDINGO_Z], ['Täby', TABY_Z],
];
const RING_POINTS = 8;
const ringPoints = (c) => {
  const pts = [];
  for (let i = 0; i < RING_POINTS; i++) {
    const a = (i * 2 * Math.PI) / RING_POINTS;
    pts.push([r5(c[0] + (0.9 * Math.sin(a)) / (111.32 * Math.cos((c[1] * Math.PI) / 180))), r5(c[1] + (0.9 * Math.cos(a)) / 111.32)]);
  }
  return pts;
};
const rings = zones.flatMap(([name, c], zi) => {
  const ring = ringPoints(c);
  const segments = ring.map((pt, i) => [pt, ring[(i + 1) % RING_POINTS]]);
  return [[c, ring[0]], ...segments].map((pts, i) => W(9000100 + zi * 20 + i, `${name} ringväg`, null, 'secondary', false, false, pts));
});

const lineFeature = (w) => ({
  type: 'Feature',
  properties: { id: w.id, highway: w.highway, name: w.name, ref: w.ref, bridge: w.bridge, tunnel: w.tunnel, oneway: w.oneway, lanes: null },
  geometry: { type: 'LineString', coordinates: w.points },
});
const collection = (features) => ({ type: 'FeatureCollection', features });

// Streets: ten short residential streets per zone, each within 120 m of a vertex of the zone's own ring road, so that a
// patient placed on one snaps to its own zone's vertex and not across the water to a neighbouring zone's.
let seed = 20261103;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const STREET_NAMES = ['Provgatan', 'Testvägen', 'Fixturgränd', 'Exempelstigen', 'Modellvägen', 'Provbacken', 'Testgatan', 'Fixturvägen', 'Exempelgatan', 'Modellgränd'];
const streets = [];
zones.forEach(([zoneName, c], zi) => {
  const ring = ringPoints(c);
  for (let i = 0; i < 10; i++) {
    const anchor = ring[Math.floor(rnd() * ring.length)];
    const d = 0.12 * Math.sqrt(rnd());
    const b = rnd() * 2 * Math.PI;
    const a = P(anchor[1] + (d * Math.cos(b)) / 111.32, anchor[0] + (d * Math.sin(b)) / (111.32 * Math.cos((anchor[1] * Math.PI) / 180)));
    const dir = rnd() * 2 * Math.PI;
    const step = 0.04;
    const m = P(a[1] + (step * Math.cos(dir)) / 111.32, a[0] + (step * Math.sin(dir)) / (111.32 * Math.cos((a[1] * Math.PI) / 180)));
    const e = P(m[1] + (step * Math.cos(dir)) / 111.32, m[0] + (step * Math.sin(dir)) / (111.32 * Math.cos((m[1] * Math.PI) / 180)));
    streets.push({ type: 'Feature', properties: { id: 9100000 + zi * 100 + i, name: `${STREET_NAMES[i]} i ${zoneName}` }, geometry: { type: 'LineString', coordinates: [a, m, e] } });
  }
});

// Power: the substations the pack looks for, a few 400 and 220 kV lines. Positions differ slightly from the
// estimates in DATA.md § 11.2 so that a test can tell that the OSM position was taken.
const sub = (id, name, lat, lng, voltage) => ({ type: 'Feature', properties: { id, power: 'substation', name, operator: 'Svenska kraftnät', voltage }, geometry: { type: 'Point', coordinates: P(lat, lng) } });
const line = (id, voltage, pts) => ({ type: 'Feature', properties: { id, power: 'line', name: null, operator: 'Svenska kraftnät', voltage }, geometry: { type: 'LineString', coordinates: pts.map(([a, b]) => P(a, b)) } });
const power = collection([
  sub(9200001, 'Överby', 59.4761, 17.8851, '400000'),
  sub(9200002, 'Beckomberga ställverk', 59.3566, 17.9011, '220000'),
  sub(9200003, 'Hagby', 59.4718, 18.0226, '400000'),
  sub(9200004, 'Skanstull', 59.3031, 18.0788, '400000'),
  sub(9200005, 'Kolbotten', 59.2662, 17.8946, '220000'),
  sub(9200006, 'Annan station', 59.5, 18.3, '400000'),
  line(9200101, '220000', [[59.4761, 17.8851], [59.42, 17.89], [59.3566, 17.9011]]),
  line(9200102, '400000', [[59.4761, 17.8851], [59.4742, 17.95], [59.4718, 18.0226]]),
  line(9200103, '220000', [[59.3566, 17.9011], [59.31, 17.9], [59.2662, 17.8946]]),
]);
const water = collection([
  { type: 'Feature', properties: { id: 9300001, name: 'Görvälnverket', operator: 'Norrvatten' }, geometry: { type: 'Point', coordinates: P(59.4331, 17.7819) } },
  { type: 'Feature', properties: { id: 9300002, name: 'Lovö vattenverk', operator: 'SVOA' }, geometry: { type: 'Point', coordinates: P(59.3307, 17.8093) } },
]);

writeFileSync(path.join(out, 'fixture.json'), JSON.stringify(collection([...corridors, ...rings].map(lineFeature))));
writeFileSync(path.join(out, 'fixture-streets.json'), JSON.stringify(collection(streets)));
writeFileSync(path.join(out, 'fixture-power.json'), JSON.stringify(power));
writeFileSync(path.join(out, 'fixture-water.json'), JSON.stringify(water));
console.log(`fixture: ${corridors.length} corridor ways + ${rings.length} zone ring segments, ${streets.length} streets`);
