import { useStore } from '@/data/store';
import { RES } from '@/data/vocab';
import { scopeName } from '@/lib/scope';
import { PageTitle } from '@/components/PageTitle';
import { SubTabs } from '@/components/SubTabs';
import { RequestsTab } from './RequestsTab';
import { InventoryTab } from './InventoryTab';
import { FromMessageTab } from './FromMessageTab';

export type ResourcesTab = 'requests' | 'inventory' | 'from-message';

/** SPEC.md § 6.4 – Resources with route-based sub-tabs. */
export function ResourcesPage({ tab }: { tab: ResourcesTab }) {
  const requests = useStore((s) => s.requests);
  const messages = useStore((s) => s.messagesFromNodes);
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const open = requests.filter((r) => r.status !== 'Received' && r.status !== 'Rejected').length;
  const tabs = [
    { key: 'requests', label: RES.tabs.requests(open), to: '/resources' },
    { key: 'inventory', label: RES.tabs.inventory, to: '/resources/inventory' },
    { key: 'from-message', label: RES.tabs.fromMessage(messages.length), to: '/resources/from-message' },
  ];
  return (
    <div className="space-y-6">
      <PageTitle title={RES.title} scope={tab === 'inventory' ? scopeName(scope, nodes) : undefined} />
      <SubTabs tabs={tabs} active={tab} label="Resources sections" />
      {tab === 'requests' ? <RequestsTab /> : null}
      {tab === 'inventory' ? <InventoryTab /> : null}
      {tab === 'from-message' ? <FromMessageTab /> : null}
    </div>
  );
}
