import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { NO_DISRUPTIONS, disruptionCount, impact } from '@/lib/reachability';

const s = () => useStore.getState();

describe('Hospital at Home view state (SPEC.md § 11.5)', () => {
  beforeEach(() => s().reset());

  it('starts with patients and roads on, electricity and water off, no mode, nothing selected or disrupted', () => {
    expect(s().home.layers).toEqual({ patients: true, roads: true, el: false, water: false });
    expect(s().home).toMatchObject({ mode: null, selectedNode: null });
    expect(disruptionCount(s().home)).toBe(0);
  });

  it('toggles layers without touching the audit log or the clock', () => {
    const before = s();
    s().setHomeLayer('el', true);
    s().setHomeLayer('water', true);
    expect(s().home.layers).toMatchObject({ el: true, water: true });
    expect(s().log).toHaveLength(before.log.length);
    expect(s().clock).toBe(before.clock);
  });

  it('selects a node, clears it when selected again and when its layer is switched off', () => {
    s().selectHomeNode('r-essingeleden');
    expect(s().home.selectedNode).toBe('r-essingeleden');
    s().selectHomeNode('r-essingeleden');
    expect(s().home.selectedNode).toBeNull();
    s().selectHomeNode('r-vasterbron');
    s().setHomeLayer('patients', false);
    expect(s().home.selectedNode).toBe('r-vasterbron');
    s().setHomeLayer('roads', false);
    expect(s().home.selectedNode).toBeNull();
  });

  it('picks a mode, switches on its layer and clears the mode when picked again, without logging', () => {
    const logLength = s().log.length;
    s().setHomeMode('water');
    expect(s().home.mode).toBe('water');
    expect(s().home.layers.water).toBe(true);
    s().setHomeMode('water');
    expect(s().home.mode).toBeNull();
    expect(s().log).toHaveLength(logLength);
  });
});

describe('Hospital at Home disruptions (SPEC.md § 11.5)', () => {
  beforeEach(() => s().reset());
  const last = () => s().log[s().log.length - 1];

  it('blocks and unblocks a road node, logging each toggle with the number of affected patients', () => {
    const n = s().log.length;
    const t0 = s().clock;
    s().toggleBlockedNode('r-essingeleden');
    expect(s().home.blockedNodes.has('r-essingeleden')).toBe(true);
    expect(s().log).toHaveLength(n + 1);
    expect(last()).toMatchObject({ action: 'Stängde', object: 'Essingeleden (E4)', actor: 'Eva Lind' });
    expect(last().detail).toBe('0 av 150 patienter påverkade'); // only a detour, nobody unreachable
    expect(s().clock).toBe(t0 + 1);
    s().toggleBlockedNode('r-essingeleden');
    expect(s().home.blockedNodes.size).toBe(0);
    expect(s().log).toHaveLength(n + 2);
    expect(last().action).toBe('Öppnade');
  });

  it('blocks a road link and ignores ids that are not road nodes or links', () => {
    const n = s().log.length;
    s().toggleBlockedLink('rl-norra-lanken-lidingo');
    expect(s().home.blockedLinks.has('rl-norra-lanken-lidingo')).toBe(true);
    expect(last().detail).toBe('5 av 150 patienter påverkade');
    s().toggleBlockedNode('w-gorvaln'); // a water node
    s().toggleBlockedLink('wl-gorvaln-solna'); // a water link
    s().togglePowerOut('atlantis');
    expect(s().log).toHaveLength(n + 1);
  });

  it('sets and restores power and water outages per zone and logs them', () => {
    s().togglePowerOut('huddinge');
    expect(last()).toMatchObject({ action: 'Slog ut elen i', object: 'Huddinge', detail: '20 av 150 patienter påverkade' });
    s().toggleWaterOut('solna');
    expect(last()).toMatchObject({ action: 'Störde vattnet i', object: 'Solna och Sundbyberg', detail: '45 av 150 patienter påverkade' });
    expect(s().home.powerOutZones.has('huddinge') && s().home.waterOutZones.has('solna')).toBe(true);
    s().togglePowerOut('huddinge');
    s().toggleWaterOut('solna');
    expect(disruptionCount(s().home)).toBe(0);
    expect(last().action).toBe('Återställde vattnet i');
  });

  it('reset clears everything with one log entry and does nothing when nothing is disrupted', () => {
    const n = s().log.length;
    s().resetHomeDisruptions();
    expect(s().log).toHaveLength(n);
    s().toggleBlockedNode('r-centralbron');
    s().toggleBlockedLink('rl-norra-lanken-lidingo');
    s().togglePowerOut('soderort');
    s().toggleWaterOut('solna');
    expect(disruptionCount(s().home)).toBe(4);
    s().resetHomeDisruptions();
    expect(disruptionCount(s().home)).toBe(0);
    expect(last()).toMatchObject({ action: 'Återställde alla störningar', object: 'Sjukhus hemma', detail: '0 av 150 patienter påverkade' });
    expect(impact(s().pack, s().home, ['solna', 'huddinge']).rows).toHaveLength(0);
    expect(NO_DISRUPTIONS.blockedNodes.size).toBe(0);
  });

  it('computes the affected count for the scope', () => {
    s().setScope('solna');
    s().toggleBlockedNode('r-essingeleden');
    s().toggleBlockedNode('r-centralbron');
    s().toggleBlockedNode('r-vasterbron');
    // From Solna alone Söderort, Huddinge, Botkyrka, Nacka and Södermalm are cut off: 20 + 20 + 10 + 10 + 15.
    expect(last().detail).toBe('75 av 150 patienter påverkade');
  });

  it('the demo reset restores the defaults', () => {
    s().setHomeLayer('water', true);
    s().selectHomeNode('r-vasterbron');
    s().toggleBlockedNode('r-centralbron');
    s().setHomeMode('roads');
    s().reset();
    expect(s().home.layers.water).toBe(false);
    expect(s().home).toMatchObject({ selectedNode: null, mode: null });
    expect(disruptionCount(s().home)).toBe(0);
  });
});
