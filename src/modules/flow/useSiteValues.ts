import { useMemo } from 'react';
import type { SiteId } from '@/data/types';
import { useStore } from '@/data/store';
import { ED_NAME } from '@/data/packs/karolinska';
import { siteValues, type SiteValues } from '@/lib/flow';

/** Live Läget nu values for the sites in scope, recomputed whenever the store changes. */
export function useSiteValues(sites: SiteId[]): SiteValues[] {
  const flowMetrics = useStore((s) => s.flowMetrics);
  const nodes = useStore((s) => s.nodes);
  const wards = useStore((s) => s.wards);
  const bedRequests = useStore((s) => s.bedRequests);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  return useMemo(
    () => sites.map((site) => siteValues(site, { flowMetrics, nodes, wards, bedRequests, edName: ED_NAME, clock, outage: { ehrOutage, ehrOutageSince } })),
    [sites, flowMetrics, nodes, wards, bedRequests, clock, ehrOutage, ehrOutageSince],
  );
}
