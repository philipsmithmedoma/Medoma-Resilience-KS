import { beforeAll, describe, expect, it } from 'vitest';
import { KAROLINSKA_PACK as pack } from '@/data/packs/karolinska';
import { loadGeoData, type GeoData, type PointFeature } from './geoData';
import { applyOsmNodes, osmCoordSource, powerLines, voltageLabel } from './osmNodes';

let geo: GeoData;
beforeAll(async () => {
  geo = await loadGeoData();
});

const point = (id: number, name: string, lat: number, lng: number): PointFeature => ({ type: 'Feature', properties: { id, name, power: 'substation' }, geometry: { type: 'Point', coordinates: [lng, lat] } });
const withPower = (features: GeoData['power']['features']): GeoData => ({ ...geo, power: { type: 'FeatureCollection', features } });

describe('nodes from OpenStreetMap (SPEC.md § 12.5)', () => {
  it('gives Överby, Beckomberga, Hagby, Skanstull and Görväln the position of the matching object and adds Kolbotten', () => {
    const r = applyOsmNodes(pack.infraNodes, geo, null);
    expect(r.missing).toEqual([]);
    expect(r.matched.sort()).toEqual(['e-beckomberga', 'e-hagby', 'e-kolbotten', 'e-overby', 'e-skanstull', 'w-gorvaln']);
    const node = (id: string) => r.nodes.find((n) => n.id === id)!;
    const sub = (name: string) => geo.power.features.find((f) => f.properties.name?.includes(name))!.geometry.coordinates as [number, number];
    expect([node('e-overby').lng, node('e-overby').lat]).toEqual(sub('Överby'));
    expect([node('e-beckomberga').lng, node('e-beckomberga').lat]).toEqual(sub('Beckomberga')); // "Beckomberga ställverk": a substring match
    expect([node('w-gorvaln').lng, node('w-gorvaln').lat]).toEqual(geo.water.features.find((f) => f.properties.name === 'Görvälnverket')!.geometry.coordinates);
    expect(node('e-kolbotten')).toMatchObject({ layer: 'el', kind: 'transmission', verified: true });
    expect(r.nodes).toHaveLength(pack.infraNodes.length + 1);
  });

  it('leaves the other nodes as they were and does not change the pack', () => {
    const before = JSON.stringify(pack.infraNodes);
    const r = applyOsmNodes(pack.infraNodes, geo, null);
    expect(JSON.stringify(pack.infraNodes)).toBe(before);
    expect(r.nodes.find((n) => n.id === 'r-essingeleden')).toEqual(pack.infraNodes.find((n) => n.id === 'r-essingeleden'));
  });

  it('marks real OpenStreetMap positions reported with the query date and fixture positions illustrative', () => {
    expect(osmCoordSource('osm', '2026-11-03')).toEqual({ confidence: 'reported', source: 'OpenStreetMap, 2026-11-03' });
    const fixture = osmCoordSource('fixture', null);
    expect(fixture.confidence).toBe('illustrative');
    expect(fixture.source).toContain('not been fetched');
    const real = applyOsmNodes(pack.infraNodes, { ...geo, source: { ...geo.source, power: 'osm', water: 'osm' } }, '2026-11-03');
    expect(real.nodes.find((n) => n.id === 'e-hagby')).toMatchObject({ coordConfidence: 'reported', coordSource: 'OpenStreetMap, 2026-11-03' });
    expect(real.nodes.find((n) => n.id === 'e-kolbotten')).toMatchObject({ coordConfidence: 'reported', coordSource: 'OpenStreetMap, 2026-11-03' });
  });

  it('keeps the estimate of a node with no match, reports it as missing and adds no Kolbotten', () => {
    const only = geo.power.features.filter((f) => !/hagby|kolbotten/i.test(f.properties.name ?? ''));
    const r = applyOsmNodes(pack.infraNodes, withPower(only), null);
    expect(r.missing.sort()).toEqual(['e-hagby', 'e-kolbotten']);
    expect(r.nodes.find((n) => n.id === 'e-hagby')).toEqual(pack.infraNodes.find((n) => n.id === 'e-hagby'));
    expect(r.nodes.some((n) => n.id === 'e-kolbotten')).toBe(false);
  });

  it('matches case-insensitively and takes the object nearest the old estimate when several match', () => {
    const near = point(1, 'ÖVERBY stn', 59.476, 17.885);
    const far = point(2, 'Överby (annan)', 59.2, 17.7);
    const r = applyOsmNodes(pack.infraNodes, withPower([far, near]), null);
    expect(r.nodes.find((n) => n.id === 'e-overby')).toMatchObject({ lat: 59.476, lng: 17.885 });
  });

  it('every node has a coordSource, and only the regional grid renders hollow', () => {
    const r = applyOsmNodes(pack.infraNodes, geo, null);
    for (const n of r.nodes) expect(n.coordSource.length, n.id).toBeGreaterThan(0);
    expect(r.nodes.filter((n) => !n.verified).map((n) => n.id)).toEqual(['e-regionnat']);
    // The estimate basis texts of DATA.md § 11 are gone from the pack.
    for (const n of pack.infraNodes.filter((x) => x.coordConfidence === 'estimate' && x.id !== 'w-norrvatten-reserve' && x.id !== 'w-malaren')) {
      expect(n.coordSource, n.id).toBe('Fallback estimate, used when OpenStreetMap has no matching object (DATA.md § 12)');
    }
  });
});

describe('power lines (SPEC.md § 12.5)', () => {
  it('labels voltages: 400000 → 400 kV, 400000;220000 → 400/220 kV, nothing → empty', () => {
    expect(voltageLabel('400000')).toBe('400 kV');
    expect(voltageLabel('220000')).toBe('220 kV');
    expect(voltageLabel('400000;220000')).toBe('400/220 kV');
    expect(voltageLabel(null)).toBe('');
  });
  it('turns the lines of power.json into labelled polylines in [lat, lng] order', () => {
    const lines = powerLines(geo);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((l) => l.label.endsWith('kV') && l.positions.length >= 2 && l.positions[0][0] > 50 && l.positions[0][0] < 70)).toBe(true);
    expect(lines.find((l) => l.label === '400 kV')!.highest).toBe(400);
  });
  it('the hand-drawn el link between nodes is gone; the off-map arrows stay', () => {
    const el = pack.infraLinks.filter((l) => l.layer === 'el');
    expect(el.every((l) => l.offmap || l.a === 'e-regionnat')).toBe(true);
    expect(el.filter((l) => l.offmap)).toHaveLength(5);
  });
});
