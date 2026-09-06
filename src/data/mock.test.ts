import { describe, expect, it } from 'vitest';
import { BOTTLENECKS, CAPABILITIES, NODES, PATIENTS, PLAYBOOKS, REQUESTS, RESOURCES, STAFF } from './mock';

const count = <T,>(list: T[], pred: (t: T) => boolean) => list.filter(pred).length;

describe('mock patients (SPEC.md § 5.7)', () => {
  it('has exactly 40 patients at Vikby with unique ids and pins', () => {
    expect(PATIENTS).toHaveLength(40);
    expect(new Set(PATIENTS.map((p) => p.id)).size).toBe(40);
    expect(new Set(PATIENTS.map((p) => p.pin)).size).toBe(40);
    expect(PATIENTS.every((p) => p.nodeId === 'vikby')).toBe(true);
  });

  it('distributes wards 12 / 10 / 10 / 8', () => {
    expect(count(PATIENTS, (p) => p.ward === 'Medicin A')).toBe(12);
    expect(count(PATIENTS, (p) => p.ward === 'Medicin B')).toBe(10);
    expect(count(PATIENTS, (p) => p.ward === 'Kirurgi')).toBe(10);
    expect(count(PATIENTS, (p) => p.ward === 'Ortopedi')).toBe(8);
  });

  it('distributes stability 22 / 12 / 6 and care level follows stability', () => {
    expect(count(PATIENTS, (p) => p.stability === 'Stable')).toBe(22);
    expect(count(PATIENTS, (p) => p.stability === 'Monitor')).toBe(12);
    expect(count(PATIENTS, (p) => p.stability === 'Critical')).toBe(6);
    for (const p of PATIENTS) {
      const expected = { Stable: 'Ward', Monitor: 'Monitored', Critical: 'Intensive' }[p.stability];
      expect(p.careLevel).toBe(expected);
    }
  });

  it('distributes transport 14 / 10 / 12 / 2 / 2 with the stability rules', () => {
    expect(count(PATIENTS, (p) => p.transport === 'Walking')).toBe(14);
    expect(count(PATIENTS, (p) => p.transport === 'Wheelchair')).toBe(10);
    expect(count(PATIENTS, (p) => p.transport === 'Stretcher')).toBe(12);
    expect(count(PATIENTS, (p) => p.transport === 'Ambulance')).toBe(2);
    expect(count(PATIENTS, (p) => p.transport === 'Intensive care transport')).toBe(2);
    // Ambulance and intensive care transport only go to Critical patients; Walking only to Stable.
    expect(PATIENTS.filter((p) => p.transport === 'Ambulance' || p.transport === 'Intensive care transport').every((p) => p.stability === 'Critical')).toBe(true);
    expect(PATIENTS.filter((p) => p.transport === 'Walking').every((p) => p.stability === 'Stable')).toBe(true);
  });

  it('distributes equipment 18 none / 10 Oxygen / 8 IV infusion / 6 Monitoring', () => {
    expect(count(PATIENTS, (p) => p.equipment.length === 0)).toBe(18);
    expect(count(PATIENTS, (p) => p.equipment.includes('Oxygen'))).toBe(10);
    expect(count(PATIENTS, (p) => p.equipment.includes('IV infusion'))).toBe(8);
    expect(count(PATIENTS, (p) => p.equipment.includes('Monitoring'))).toBe(6);
    expect(PATIENTS.filter((p) => p.stability === 'Critical').every((p) => p.equipment.includes('Monitoring'))).toBe(true);
    expect(PATIENTS.filter((p) => p.stability === 'Stable').every((p) => p.equipment.length <= 1)).toBe(true);
  });

  it('marks exactly 12 Stable walking or wheelchair patients as home care eligible', () => {
    const eligible = PATIENTS.filter((p) => p.homeCareEligible);
    expect(eligible).toHaveLength(12);
    expect(eligible.every((p) => p.stability === 'Stable' && (p.transport === 'Walking' || p.transport === 'Wheelchair'))).toBe(true);
  });

  it('has ages 24–91 and pins consistent with the age on 4 September 2026', () => {
    for (const p of PATIENTS) {
      expect(p.age).toBeGreaterThanOrEqual(24);
      expect(p.age).toBeLessThanOrEqual(91);
      expect(p.pin).toMatch(/^\d{8}-\d{4}$/);
      const y = Number(p.pin.slice(0, 4));
      const m = Number(p.pin.slice(4, 6));
      const d = Number(p.pin.slice(6, 8));
      const birth = Date.UTC(y, m - 1, d);
      const today = Date.UTC(2026, 8, 4);
      const ageAtToday = 2026 - y - (Date.UTC(2026, m - 1, d) > today ? 1 : 0);
      expect(birth).toBeLessThan(today);
      expect(ageAtToday).toBe(p.age);
    }
  });
});

describe('mock dataset shape', () => {
  it('has the five nodes, 13 staff, six playbooks, five requests and six bottlenecks', () => {
    expect(NODES.map((n) => n.id)).toEqual(['vikby', 'sjoberga', 'ekhaga', 'falt-alfa', 'hemsjukvard']);
    expect(STAFF).toHaveLength(13);
    expect(PLAYBOOKS.map((p) => p.id)).toEqual(['mc-1', 'mc-2', 'mc-3', 'it-outage', 'evac-partial', 'regional-surge']);
    expect(REQUESTS).toHaveLength(5);
    expect(BOTTLENECKS).toHaveLength(6);
  });

  it('Mass casualty – Level 2 has 6 roles, 15 tasks in 5 areas, 4 channels and 4 targets', () => {
    const mc2 = PLAYBOOKS.find((p) => p.id === 'mc-2')!;
    expect(mc2.roles).toHaveLength(6);
    expect(mc2.tasks).toHaveLength(15);
    expect(new Set(mc2.tasks.map((t) => t.area)).size).toBe(5);
    expect(mc2.channels).toHaveLength(4);
    expect(mc2.targets).toHaveLength(4);
  });

  it('resource counts add up to the total for every row', () => {
    for (const r of RESOURCES) {
      expect(r.available + r.inUse + r.reserved + r.outOfService + r.inTransit + r.unknown).toBe(r.total);
    }
  });

  it('every capability belongs to a known node', () => {
    const ids = new Set(NODES.map((n) => n.id));
    expect(CAPABILITIES.every((c) => ids.has(c.nodeId))).toBe(true);
  });
});
