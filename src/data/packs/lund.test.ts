import { beforeAll, describe, expect, it } from 'vitest';
import { homePacks, withHomePack } from './home-packs';
import { KAROLINSKA_PACK } from './karolinska';
import { loadGeoData } from '@/lib/geoData';
import { applyOsmNodes } from '@/lib/osmNodes';
import { impact, NO_DISRUPTIONS, type Disruptions } from '@/lib/reachability';
import { loadRoadModel, type RoadModel } from '@/lib/roadModel';
import { haversineM } from '@/lib/roadGraph';
import { parseDisruptionMessage } from '@/lib/disruption-message';

const lund = homePacks.lund;
const pack = withHomePack(KAROLINSKA_PACK, 'lund');
const SITE = ['suslund'];
const inZone = (z: string) => lund.patients.filter((p) => p.zone === z);

describe('the SUS Lund pack (SPEC.md § 14.5, DATA.md § 14)', () => {
  it('has one site, SUS Lund at Entrégatan 7, and the seven zones with the patient counts of DATA.md', () => {
    expect(lund.sites).toEqual([{ id: 'suslund', name: 'SUS Lund', lat: 55.7118, lng: 13.1985 }]);
    expect(lund.zones.map((z) => [z.id, z.radiusKm, inZone(z.id).length])).toEqual([
      ['lund', 2.5, 60], ['kavlinge', 1.5, 15], ['lomma', 2.0, 15], ['staffanstorp', 1.5, 15], ['dalby', 1.5, 15], ['eslov', 2.0, 20], ['horby', 1.5, 10],
    ]);
    expect(lund.patients).toHaveLength(150);
    expect(lund.zones.every((z) => z.coordConfidence === 'reported' && z.coordSource.includes('2026-10-17'))).toBe(true);
  });

  it('has two teams with two cars, bases at Lund centrum and Staffanstorp, and the zone assignment of DATA.md', () => {
    expect(lund.teams.map((t) => [t.name, t.cars, t.baseLat, t.baseLng])).toEqual([['ASIH Lund Nord', 2, 55.704, 13.192], ['ASIH Lund Syd', 2, 55.644, 13.21]]);
    const team = (z: string) => new Set(inZone(z).map((p) => p.team));
    for (const z of ['lund', 'kavlinge', 'lomma', 'eslov', 'horby']) expect(team(z)).toEqual(new Set(['ASIH Lund Nord']));
    for (const z of ['staffanstorp', 'dalby']) expect(team(z)).toEqual(new Set(['ASIH Lund Syd']));
    expect(lund.visits).toHaveLength(lund.patients.filter((p) => p.visitToday).length);
  });

  it('has synthetic patients: unique ids and names, not the Karolinska ones, each on a named street within its zone', () => {
    expect(new Set(lund.patients.map((p) => p.id)).size).toBe(150);
    const names = lund.patients.map((p) => `${p.givenName} ${p.familyName}`);
    expect(new Set(names).size).toBe(150);
    const karolinska = new Set(KAROLINSKA_PACK.homePatients.map((p) => `${p.givenName} ${p.familyName}`));
    expect(names.some((n) => karolinska.has(n))).toBe(false);
    for (const p of lund.patients) {
      const z = lund.zones.find((x) => x.id === p.zone)!;
      expect(haversineM(p.lat, p.lng, z.lat, z.lng)).toBeLessThanOrEqual(z.radiusKm * 1000 + 50);
      expect(p.street.length).toBeGreaterThan(0);
    }
  });

  it('has the nodes of DATA.md § 14: four water, five electricity, four road nodes, each with a coordinate source', () => {
    const by = (layer: string) => lund.infraNodes.filter((n) => n.layer === layer).map((n) => n.id);
    expect(by('water')).toEqual(['w-ringsjo', 'w-ringsjon', 'w-vomb', 'w-kallby']);
    expect(by('el')).toEqual(['e-hurva', 'e-barseback', 'e-sege', 'e-ortofta', 'e-regionnat']);
    expect(by('roads')).toEqual(['r-lund-n', 'r-lund-s', 'r-gardstanga', 'r-hoje']);
    expect(lund.infraNodes.every((n) => n.coordSource.length > 0)).toBe(true);
    expect(lund.infraNodes.filter((n) => !n.verified).map((n) => n.id)).toEqual(['e-regionnat']);
    expect(lund.infraNodes.find((n) => n.id === 'r-lund-n')!.osmWayNames).toEqual(['Trafikplats Lund Norra']);
    expect(lund.infraNodes.find((n) => n.id === 'r-lund-s')!.osmWayNames).toEqual(['Trafikplats Lund Södra']);
    // The coordinates that are not from Google Places say so.
    expect(lund.infraNodes.find((n) => n.id === 'e-sege')!.coordConfidence).toBe('estimate');
    expect(lund.infraNodes.find((n) => n.id === 'w-kallby')!.coordConfidence).toBe('estimate');
  });

  it('every link endpoint resolves to the site, a node or a zone; there are no corridor links; every cited source exists', () => {
    const ids = new Set(['suslund', ...lund.infraNodes.map((n) => n.id), ...lund.zones.map((z) => z.graphNode)]);
    for (const l of lund.infraLinks) {
      expect(ids.has(l.a), `${l.id}.a`).toBe(true);
      expect(ids.has(l.b), `${l.id}.b`).toBe(true);
      expect(l.layer).not.toBe('roads');
    }
    expect(lund.infraLinks.filter((l) => l.layer === 'water' && !l.offmap).map((l) => [l.a, l.b, l.style])).toEqual([
      ['w-ringsjo', 'w-kallby', 'dashed'], ['w-vomb', 'w-kallby', 'dashed'], ['w-ringsjon', 'w-ringsjo', 'dotted'], ['w-kallby', 'suslund', 'dotted'],
    ]);
    expect(lund.infraLinks.find((l) => l.a === 'e-regionnat')).toMatchObject({ b: 'suslund', style: 'dashed', verified: false });
    const keys = new Set(lund.sources.map((s) => s.key));
    expect([...keys]).toEqual(['S-L1', 'S-L2', 'S-L3', 'S-L4', 'S-L5']);
    for (const n of lund.infraNodes) for (const f of n.figures ?? []) expect(keys.has(f.source!)).toBe(true);
    expect(lund.infraNodes.find((n) => n.id === 'r-lund-s')!.figures![0]).toMatchObject({ value: 50000, confidence: 'reported', source: 'S-L3' });
  });

  it('has three illustrative notices of the three kinds with Lund names, and presets that name real nodes and zones', () => {
    expect(lund.messages.map((m) => m.text)).toEqual([
      expect.stringContaining('E22 vid Lund Södra avstängd'),
      expect.stringContaining('Kraftringen: strömavbrott i Dalby'),
      expect.stringContaining('VA SYD: kokningsrekommendation i Kävlinge'),
    ]);
    expect(lund.messages.every((m) => m.textEn && m.roleEn)).toBe(true);
    for (const p of lund.presets) {
      for (const id of p.blockedNodes) expect(lund.infraNodes.some((n) => n.id === id && n.layer === 'roads')).toBe(true);
      for (const z of [...p.powerOutZones, ...p.waterOutZones]) expect(lund.zones.some((x) => x.id === z)).toBe(true);
    }
  });

  it('the Lund notices prefill the right forms (the interchange by its name without "Trafikplats")', () => {
    const roadNames = ['E22', 'Väg 108', 'Trafikplats Lund Norra', 'Trafikplats Lund Södra'];
    const ctx = { roadNames, zones: lund.zones, clock: 14 * 60 + 40 };
    expect(parseDisruptionMessage(lund.messages[0], ctx)).toMatchObject({ kind: 'road', target: 'Trafikplats Lund Södra', durationHours: 3 });
    expect(parseDisruptionMessage(lund.messages[1], ctx)).toMatchObject({ kind: 'power', target: 'dalby' });
    expect(parseDisruptionMessage(lund.messages[2], ctx)).toMatchObject({ kind: 'water', target: 'kavlinge', durationHours: null });
  });

  it('withHomePack swaps only the home members: the hospital data is the same object', () => {
    expect(pack.homePackId).toBe('lund');
    expect(pack.homePatients).toBe(lund.patients);
    expect(pack.nodes).toBe(KAROLINSKA_PACK.nodes);
    expect(pack.ladders).toBe(KAROLINSKA_PACK.ladders);
    expect(KAROLINSKA_PACK.homePackId).toBe('karolinska');
    expect(KAROLINSKA_PACK.homePatients).toHaveLength(150);
  });
});

describe('SUS Lund on the road graph (SPEC.md § 14.5)', () => {
  let model: RoadModel;
  beforeAll(async () => {
    model = await loadRoadModel(pack);
  });
  const run = (d: Partial<Disruptions>) => impact(pack, { ...NO_DISRUPTIONS, ...d }, SITE, model);

  it('uses OpenStreetMap data or the Lund fixture, and the site and both team bases snap to the graph', () => {
    expect(['osm', 'fixture']).toContain(model.source);
    expect(model.sites.suslund.unsnapped).toBe(false);
    for (const t of lund.teams) expect(model.teams[t.id].unsnapped, t.id).toBe(false);
  });

  it('1. at baseline at least 95 % of the Lund patients snap within 1 500 m and have a path from SUS Lund', () => {
    const base = model.baseline(SITE);
    const ok = lund.patients.filter((p) => {
      const snap = model.patients.get(p.id)!;
      return !snap.unsnapped && Number.isFinite(base[snap.vertex]);
    });
    expect(ok.length / lund.patients.length).toBeGreaterThanOrEqual(0.95);
  });

  it('2. a power outage in Dalby flags exactly the Dalby patients', () => {
    const r = run({ powerOutZones: new Set(['dalby']) });
    expect(r.rows.map((x) => x.patient.id).sort()).toEqual(inZone('dalby').map((p) => p.id).sort());
    expect(r.rows.every((x) => x.power)).toBe(true);
  });

  /**
   * The ways to block for an interchange: those named as its InfraNode says; when the data has no way of that name the ways
   * within 300 m of the node are printed and their names used (SPEC.md § 14.5), which is logged in DECISIONS.md.
   */
  function wayNamesFor(nodeId: string): string[] {
    const node = lund.infraNodes.find((n) => n.id === nodeId)!;
    const wanted = node.osmWayNames!;
    const g = model.graph;
    if (wanted.every((n) => g.ways.some((w) => w.name === n))) return wanted;
    const near = new Set<string>();
    for (let e = 0; e < g.edgeFrom.length; e++) {
      const v = g.edgeFrom[e];
      const name = g.ways[g.edgeWay[e]].name;
      if (name && haversineM(node.lat, node.lng, g.lat[v], g.lng[v]) <= 300) near.add(name);
    }
    console.log(`No way named ${wanted.join(', ')} in the data; ways within 300 m of ${nodeId}: ${[...near].join(', ')}`);
    return [...near];
  }

  it('3. blocking Trafikplats Lund Norra and Södra makes every patient outside Lund that depends on them delayed or unreachable', () => {
    const names = [...wayNamesFor('r-lund-n'), ...wayNamesFor('r-lund-s')];
    const r = run({ blockedRoads: new Set(names) });
    const hit = new Map(r.rows.map((x) => [x.patient.id, x]));
    const outside = lund.patients.filter((p) => p.zone !== 'lund' && !model.patients.get(p.id)!.unsnapped);
    expect(outside.length).toBeGreaterThan(80);
    const affected = (p: { id: string }) => hit.get(p.id)?.unreachable || hit.get(p.id)?.delayed;
    if (model.source === 'fixture') {
      // In the fixture the interchanges are the only way out, so everybody outside is unreachable, not just delayed.
      expect(outside.every((p) => hit.get(p.id)?.unreachable)).toBe(true);
    } else {
      // In the real data the interchange names are the ways within 300 m of the nodes (Autostradan, Malmövägen, Norra Ringen,
      // Solbjersvägen). Kävlinge, Lomma and Dalby are served by Norra Västkustvägen, Lundavägen and Dalbyvägen, which are not among
      // them, so blocking the interchanges does not affect them (DECISIONS.md, "## OpenStreetMap data"). Staffanstorp, Eslöv and Höör
      // all depend on the closed ways.
      const dependent = outside.filter((p) => ['staffanstorp', 'eslov', 'horby'].includes(p.zone));
      expect(dependent.length).toBeGreaterThan(30);
      expect(dependent.filter((p) => !affected(p)).map((p) => `${p.id} ${p.zone}`)).toEqual([]);
    }
    // Most of the city stays reachable. In the fixture the ways are only the exits; in the real data Malmövägen, Norra Ringen and
    // Solbjersvägen are also streets inside Lund, so a few city patients lose their road too.
    const cityOk = inZone('lund').filter((p) => !hit.get(p.id)?.unreachable).length / inZone('lund').length;
    console.log(`Lund patients still reachable: ${(cityOk * 100).toFixed(0)} %`);
    expect(cityOk).toBeGreaterThanOrEqual(model.source === 'fixture' ? 1 : 0.8);
  });

  it('closing one interchange leaves the others reachable', () => {
    const r = run({ blockedRoads: new Set(wayNamesFor('r-lund-s')) });
    const unreachable = new Set(r.rows.filter((x) => x.unreachable).map((x) => x.patient.zone));
    expect(unreachable.has('kavlinge')).toBe(false);
  });

  it('at baseline the nearest team of a Lund patient is the team based in or beside their zone', () => {
    const base = impact(pack, NO_DISRUPTIONS, SITE, model);
    const nearest = (z: string) => new Set(inZone(z).map((p) => base.teamReach.get(p.id)?.nearestTeam));
    expect(nearest('lund')).toEqual(new Set(['asih-lund-nord']));
    expect(nearest('staffanstorp')).toEqual(new Set(['asih-lund-syd']));
  });
});

describe('SUS Lund geometry and node positions (DATA.md § 14, SPEC.md § 12.5)', () => {
  it('loads from geo/lund (the fixture until the data is fetched) with named ways, streets, substations and works', async () => {
    const geo = await loadGeoData('lund');
    expect(geo.roads.features.length).toBeGreaterThan(20);
    if (geo.source.roads === 'fixture') {
      expect(geo.roads.features.some((f) => f.properties.name === 'Trafikplats Lund Norra')).toBe(true);
      expect(geo.roads.features.some((f) => f.properties.name === 'Trafikplats Lund Södra')).toBe(true);
    } else {
      // OpenStreetMap has no way named like the interchanges (SPEC.md § 14.5): each node has named ways within 300 m instead.
      for (const id of ['r-lund-n', 'r-lund-s']) {
        const node = lund.infraNodes.find((n) => n.id === id)!;
        const near = geo.roads.features.filter((f) => f.properties.name && f.geometry.coordinates.some(([lng, lat]) => haversineM(node.lat, node.lng, lat, lng) <= 300));
        expect(near.length, id).toBeGreaterThan(0);
      }
    }
    expect(geo.streets.features.length).toBeGreaterThan(50);
    const karolinska = await loadGeoData('karolinska');
    expect(karolinska.roads).not.toBe(geo.roads);
  });

  it('the electricity and water nodes take their positions from the Lund power and water data, Karolinska ones are not touched', async () => {
    const geo = await loadGeoData('lund');
    const r = applyOsmNodes(lund.infraNodes, geo, null, 'lund');
    // The water data has no Vombverket (query 2026-11-03): the node keeps its estimate and is reported missing (SPEC.md § 12.5).
    expect(r.matched.sort()).toEqual(['e-barseback', 'e-hurva', 'e-sege', 'w-ringsjo']);
    expect(r.missing).toEqual(['w-vomb']);
    expect(r.nodes.find((n) => n.id === 'w-vomb')).toEqual(lund.infraNodes.find((n) => n.id === 'w-vomb'));
    const hurva = r.nodes.find((n) => n.id === 'e-hurva')!;
    expect(hurva.lat).not.toBe(lund.infraNodes.find((n) => n.id === 'e-hurva')!.lat);
    expect(haversineM(hurva.lat, hurva.lng, 55.8313, 13.6034)).toBeLessThan(2000);
    expect(r.nodes.find((n) => n.id === 'e-ortofta')!.lat).toBe(55.7895); // a power plant, not a substation: stays as Places has it
    const k = applyOsmNodes(KAROLINSKA_PACK.infraNodes, await loadGeoData('karolinska'), null);
    expect(k.matched).toContain('e-overby');
    expect(k.matched).not.toContain('e-hurva');
  });
});
