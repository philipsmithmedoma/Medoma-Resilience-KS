import { Link } from 'react-router-dom';
import { useStore } from '@/data/store';
import { FLOW } from '@/data/vocab';
import { isHospitalScope, scopeName, sitesInScope } from '@/lib/scope';
import { PageTitle } from '@/components/PageTitle';
import { SubTabs } from '@/components/SubTabs';
import { OverviewTab } from './OverviewTab';
import { PlacementTab } from './PlacementTab';
import { ForecastTab } from './ForecastTab';
import { DischargeTab } from './DischargeTab';

export type FlowTab = 'overview' | 'placement' | 'forecast' | 'discharge';

/** SPEC.md § 6.1–6.4 – Läget nu with its three tiles as route-based sub-tabs. */
export function FlowPage({ tab }: { tab: FlowTab }) {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const bedRequests = useStore((s) => s.bedRequests);
  const dischargeReady = useStore((s) => s.dischargeReady);
  const sites = sitesInScope(scope);

  if (!isHospitalScope(scope)) {
    return (
      <div className="space-y-4">
        <PageTitle title={FLOW.title} scope={scopeName(scope, nodes)} />
        <p>{FLOW.notForScope}</p>
        <Link to="/kapacitet" className="text-primary hover:text-primary-hover hover:underline">
          {FLOW.goToCapacity}
        </Link>
      </div>
    );
  }

  const placementCount = bedRequests.filter((r) => sites.includes(r.site)).length;
  const dischargeCount = dischargeReady.filter((d) => sites.includes(d.site) && d.status !== 'Utskriven').length;
  const tabs = [
    { key: 'overview', label: FLOW.tabs.overview, to: '/laget-nu' },
    { key: 'placement', label: FLOW.tabs.placement(placementCount), to: '/laget-nu/placering' },
    { key: 'forecast', label: FLOW.tabs.forecast, to: '/laget-nu/prognos' },
    { key: 'discharge', label: FLOW.tabs.discharge(dischargeCount), to: '/laget-nu/utskrivningsklara' },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title={FLOW.title} scope={scopeName(scope, nodes)} />
      <SubTabs tabs={tabs} active={tab} label={FLOW.title} />
      {tab === 'overview' ? <OverviewTab sites={sites} /> : null}
      {tab === 'placement' ? <PlacementTab sites={sites} /> : null}
      {tab === 'forecast' ? <ForecastTab sites={sites} /> : null}
      {tab === 'discharge' ? <DischargeTab sites={sites} /> : null}
    </div>
  );
}
