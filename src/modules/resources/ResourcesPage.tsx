import { useStore } from '@/data/store';
import { t } from '@/lib/i18n';
import { scopeName } from '@/lib/scope';
import { PageTitle } from '@/components/PageTitle';
import { SubTabs } from '@/components/SubTabs';
import { RequestsTab } from './RequestsTab';
import { InventoryTab } from './InventoryTab';
import { FromMessageTab } from './FromMessageTab';

export type ResourcesTab = 'requests' | 'inventory' | 'from-message';

/** SPEC.md § 6.8 – Resurser with route-based sub-tabs: Förfrågningar, Lager, Från meddelande. */
export function ResourcesPage({ tab }: { tab: ResourcesTab }) {
  const requests = useStore((s) => s.requests);
  const messages = useStore((s) => s.messagesFromNodes);
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const open = requests.filter((r) => r.status !== 'Received' && r.status !== 'Rejected').length;
  const tabs = [
    { key: 'requests', label: t('RES.tabs.requests', { open }), to: '/resurser' },
    { key: 'inventory', label: t('RES.tabs.inventory'), to: '/resurser/lager' },
    { key: 'from-message', label: t('RES.tabs.fromMessage', { n: messages.length }), to: '/resurser/meddelanden' },
  ];
  return (
    <div className="space-y-6">
      <PageTitle title={t('RES.title')} scope={tab === 'inventory' ? scopeName(scope, nodes) : undefined} />
      <SubTabs tabs={tabs} active={tab} label={t('RES.title')} />
      {tab === 'requests' ? <RequestsTab /> : null}
      {tab === 'inventory' ? <InventoryTab /> : null}
      {tab === 'from-message' ? <FromMessageTab /> : null}
    </div>
  );
}
