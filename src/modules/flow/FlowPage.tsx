import { Link } from 'react-router-dom';
import { useStore } from '@/data/store';
import { FLOW } from '@/data/vocab';
import { scopeName } from '@/lib/scope';
import { PageTitle } from '@/components/PageTitle';

export type FlowTab = 'overview' | 'placement' | 'forecast' | 'discharge';

/** SPEC.md § 6.1–6.4 – Läget nu. The six blocks and the three tiles are built in Batch 2. */
export function FlowPage({ tab }: { tab: FlowTab }) {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  return (
    <div className="space-y-4">
      <PageTitle title={FLOW.title} scope={scopeName(scope, nodes)} />
      <p className="text-text-secondary">{tab === 'overview' ? FLOW.tabs.overview : tab === 'placement' ? FLOW.placement.title : tab === 'forecast' ? FLOW.forecast.title : FLOW.discharge.title}</p>
      <Link to="/kapacitet" className="text-primary hover:text-primary-hover hover:underline">
        {FLOW.goToCapacity}
      </Link>
    </div>
  );
}
