import { describe, expect, it } from 'vitest';
import { MODULE_DEFS, PLATFORM_DEFS, en, sv } from '@/data/vocab';
import { useStore } from '@/data/store';
import { CLOSE_FALLBACK, preparednessTransition, closeBlocked, isResilienceRoute, navModel, preparednessActive, preparednessReason, resiliencePaths, rootTarget, type PreparednessState } from './preparedness';

const off: PreparednessState = { preparednessOn: false, incident: null, scenario: null };

describe('preparednessActive (SPEC.md § 12.7)', () => {
  it('is off with no flag, no incident, no scenario and a platform route', () => {
    expect(preparednessActive(off, '/patients')).toBe(false);
    expect(preparednessReason(off, '/planning')).toBeNull();
    expect(preparednessActive(off, '/kallor')).toBe(false); // Källor belongs to no module
  });

  it('manual: the flag turns it on on any route', () => {
    expect(preparednessReason({ ...off, preparednessOn: true }, '/patients')).toBe('manual');
  });

  it('incident: an active incident turns it on', () => {
    expect(preparednessReason({ ...off, incident: { playbookKey: 'masskada' } }, '/patients')).toBe('incident');
  });

  it('scenario: a scenario in effect turns it on', () => {
    expect(preparednessReason({ ...off, scenario: { key: 'tryck' } }, '/employees')).toBe('scenario');
  });

  it('route: a resilience route alone turns it on, so a reload there keeps the mode', () => {
    expect(preparednessReason(off, '/home')).toBe('route');
    expect(preparednessReason(off, '/start')).toBe('route');
  });

  it('names the first reason when several hold: manual, incident, scenario, route', () => {
    const all = { preparednessOn: true, incident: {}, scenario: {} };
    expect(preparednessReason(all, '/home')).toBe('manual');
    expect(preparednessReason({ ...all, preparednessOn: false }, '/home')).toBe('incident');
    expect(preparednessReason({ ...all, preparednessOn: false, incident: null }, '/home')).toBe('scenario');
    expect(preparednessReason({ ...all, preparednessOn: false, incident: null, scenario: null }, '/home')).toBe('route');
  });
});

describe('resilience routes come from the module list (SPEC.md § 12.7)', () => {
  it('are Start and every module of the nav, with their children', () => {
    expect(resiliencePaths()).toEqual(['/start', ...MODULE_DEFS.map((m) => m.path)]);
    for (const m of MODULE_DEFS) {
      expect(isResilienceRoute(m.path), m.path).toBe(true);
      expect(isResilienceRoute(`${m.path}/child`), `${m.path}/child`).toBe(true);
    }
    expect(isResilienceRoute('/natverk/node-7')).toBe(true);
    expect(isResilienceRoute('/incident/kanaler/lssl')).toBe(true);
    expect(isResilienceRoute('/laget-nu/prognos')).toBe(true);
    expect(isResilienceRoute('/home?x=1')).toBe(true);
  });
  it('are not the platform modules, Källor, the root or a path that only starts with a module path', () => {
    for (const m of PLATFORM_DEFS) expect(isResilienceRoute(m.path), m.path).toBe(false);
    expect(isResilienceRoute('/kallor')).toBe(false);
    expect(isResilienceRoute('/')).toBe(false);
    expect(isResilienceRoute('/homestead')).toBe(false);
  });
});

describe('close control and root route (SPEC.md § 12.7)', () => {
  it('is blocked while an incident is active or a scenario is in effect', () => {
    expect(closeBlocked(off)).toBe(false);
    expect(closeBlocked({ incident: {}, scenario: null })).toBe(true);
    expect(closeBlocked({ incident: null, scenario: {} })).toBe(true);
    expect(CLOSE_FALLBACK).toBe('/planning');
  });
  it('sends the root to Start in preparedness mode and to the first platform module otherwise', () => {
    expect(rootTarget(true)).toBe('/start');
    expect(rootTarget(false)).toBe('/patients');
  });
});

describe('what the navigation shows (SPEC.md § 12.7)', () => {
  it('normal: the five platform tabs, no resilience tab, the outlined button, no scenario controls', () => {
    const m = navModel(false);
    expect(m.platform).toBe('tabs');
    expect(m.platformModules.map((p) => p.key)).toEqual(['patients', 'activities', 'planning', 'employees', 'reporting']);
    expect(m.resilienceTabs).toEqual([]);
    expect(m.button).toBe('enter');
    expect(m.scenarioControls).toBe(false);
  });
  it('preparedness: one Medoma menu, the seven resilience tabs in order, the indicator, the scenario controls', () => {
    const m = navModel(true);
    expect(m.platform).toBe('menu');
    expect(m.resilienceTabs.map((p) => p.key)).toEqual(['flow', 'home', 'capacity', 'incident', 'evacuation', 'resources', 'network']);
    expect(m.button).toBe('indicator');
    expect(m.scenarioControls).toBe(true);
  });
  it('has the labels of the spec in both languages', () => {
    expect([sv.PREP.enter, en.PREP.enter]).toEqual(['Beredskap', 'Preparedness']);
    expect([sv.PREP.active, en.PREP.active]).toEqual(['Beredskapsläge', 'Preparedness mode']);
    expect([sv.PREP.closeBlocked, en.PREP.closeBlocked]).toEqual(['Avsluta incidenten eller scenariot först', 'End the incident or scenario first']);
  });
});

describe('what is logged (SPEC.md § 12.7)', () => {
  it('logs a mode that turns on or off for an incident, a scenario or the route, and not the flag, which logs itself', () => {
    expect(preparednessTransition(null, 'incident')).toEqual({ on: true, reason: 'incident' });
    expect(preparednessTransition(null, 'scenario')).toEqual({ on: true, reason: 'scenario' });
    expect(preparednessTransition(null, 'route')).toEqual({ on: true, reason: 'route' });
    expect(preparednessTransition('route', null)).toEqual({ on: false, reason: 'route' });
    expect(preparednessTransition('incident', null)).toEqual({ on: false, reason: 'incident' });
    expect(preparednessTransition(null, 'manual')).toBeNull();
    expect(preparednessTransition('manual', null)).toBeNull();
    expect(preparednessTransition('route', 'incident')).toBeNull(); // still on
  });

  it('the manual flag changes through logEntry with the reason "manual" and starts off', () => {
    useStore.getState().reset();
    expect(useStore.getState().preparednessOn).toBe(false);
    const n = useStore.getState().log.length;
    useStore.getState().setPreparedness(true);
    expect(useStore.getState().preparednessOn).toBe(true);
    let last = useStore.getState().log[useStore.getState().log.length - 1];
    expect(useStore.getState().log).toHaveLength(n + 1);
    expect(last).toMatchObject({ action: 'Beredskapsläge på', object: 'Navigation', detail: 'Orsak: manuellt', ref: 'manual', actor: 'Eva Lind' });
    useStore.getState().setPreparedness(true); // no change, no entry
    expect(useStore.getState().log).toHaveLength(n + 1);
    useStore.getState().setPreparedness(false);
    last = useStore.getState().log[useStore.getState().log.length - 1];
    expect(last).toMatchObject({ action: 'Beredskapsläge av', ref: 'manual' });
    useStore.getState().logPreparednessChange(true, 'incident');
    expect(useStore.getState().log[useStore.getState().log.length - 1]).toMatchObject({ detail: 'Orsak: incident', ref: 'incident' });
  });

  it('the demo reset turns the manual flag off', () => {
    useStore.getState().setPreparedness(true);
    useStore.getState().reset();
    expect(useStore.getState().preparednessOn).toBe(false);
  });
});
