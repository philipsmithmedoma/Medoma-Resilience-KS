import { useMemo } from 'react';
import { useStore } from '@/data/store';
import { sitesInScope } from '@/lib/scope';
import { disruptionCount, impact, type Impact } from '@/lib/reachability';

/** The impact of the current disruptions on the patients, from the sites in the selected scope (SPEC.md § 11.1, § 11.5). */
export function useHomeImpact(): { impact: Impact; active: boolean } {
  const pack = useStore((s) => s.pack);
  const scope = useStore((s) => s.scope);
  const blockedLinks = useStore((s) => s.home.blockedLinks);
  const blockedNodes = useStore((s) => s.home.blockedNodes);
  const powerOutZones = useStore((s) => s.home.powerOutZones);
  const waterOutZones = useStore((s) => s.home.waterOutZones);
  return useMemo(() => {
    const state = { blockedLinks, blockedNodes, powerOutZones, waterOutZones };
    return { impact: impact(pack, state, sitesInScope(scope)), active: disruptionCount(state) > 0 };
  }, [pack, scope, blockedLinks, blockedNodes, powerOutZones, waterOutZones]);
}
