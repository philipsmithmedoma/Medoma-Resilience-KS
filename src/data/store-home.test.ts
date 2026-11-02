import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';

describe('Hospital at Home view state (SPEC.md § 11.5)', () => {
  beforeEach(() => useStore.getState().reset());

  it('starts with patients and roads on, electricity and water off, nothing selected', () => {
    expect(useStore.getState().home).toEqual({ layers: { patients: true, roads: true, el: false, water: false }, selectedNode: null });
  });

  it('toggles layers without touching the audit log or the clock', () => {
    const before = useStore.getState();
    useStore.getState().setHomeLayer('el', true);
    useStore.getState().setHomeLayer('water', true);
    const after = useStore.getState();
    expect(after.home.layers).toMatchObject({ el: true, water: true });
    expect(after.log).toHaveLength(before.log.length);
    expect(after.clock).toBe(before.clock);
  });

  it('selects a node, clears it when selected again and when its layer is switched off', () => {
    const { selectHomeNode, setHomeLayer } = useStore.getState();
    selectHomeNode('r-essingeleden');
    expect(useStore.getState().home.selectedNode).toBe('r-essingeleden');
    selectHomeNode('r-essingeleden');
    expect(useStore.getState().home.selectedNode).toBeNull();
    selectHomeNode('r-vasterbron');
    setHomeLayer('patients', false);
    expect(useStore.getState().home.selectedNode).toBe('r-vasterbron');
    setHomeLayer('roads', false);
    expect(useStore.getState().home.selectedNode).toBeNull();
  });

  it('is restored by the demo reset', () => {
    useStore.getState().setHomeLayer('water', true);
    useStore.getState().selectHomeNode('r-vasterbron');
    useStore.getState().reset();
    expect(useStore.getState().home.layers.water).toBe(false);
    expect(useStore.getState().home.selectedNode).toBeNull();
  });
});
