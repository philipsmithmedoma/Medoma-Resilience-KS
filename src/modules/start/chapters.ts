// Story chapters – SPEC.md § 8. Each chapter first resets the demo so chapters are independent.
import type { AppStore } from '@/data/store';
import { KAROLINSKA_ID, REGION_ID } from '@/data/vocab';

export interface ChapterEffect {
  route: string;
}

/**
 * Applies a chapter to the store and returns the route to open. Scenario arming (chapters 2–5) is wired to
 * the engine in Batch 3; until then the chapter sets scope, route, panel and clock state only.
 */
export function startChapter(n: number, store: AppStore): ChapterEffect {
  store.reset();
  switch (n) {
    case 1:
      store.setScope(KAROLINSKA_ID);
      return { route: '/laget-nu' };
    case 2:
      store.setScope('huddinge');
      store.armScenario('tryck', true);
      return { route: '/laget-nu/prognos' };
    case 3:
      store.setScope('solna');
      store.openScenarioPanel('masskada');
      return { route: '/kapacitet' };
    case 4:
      store.setScope(KAROLINSKA_ID);
      store.armScenario('journalbortfall', true);
      return { route: '/kapacitet' };
    case 5:
      store.setScope(REGION_ID);
      store.openScenarioPanel('mottagande');
      return { route: '/natverk' };
    default:
      return { route: '/' };
  }
}
