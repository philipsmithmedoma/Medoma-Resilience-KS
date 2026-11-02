import { useStore } from '@/data/store';
import { t } from '@/lib/i18n';
import { scopeName } from '@/lib/scope';
import { PageTitle } from '@/components/PageTitle';
import { HomeMap } from './HomeMap';

/** SPEC.md § 11 – Sjukhus hemma. Batch 2: the map pane only; the list and the panel follow in batch 3. */
export function HomePage() {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const incident = useStore((s) => s.incident);
  return (
    <div className="flex flex-col" style={{ height: incident ? 'calc(100vh - 136px)' : 'calc(100vh - 96px)' }}>
      <div className="mb-4 space-y-1">
        <PageTitle title={t('HOME.title')} scope={scopeName(scope, nodes)} />
        <p className="text-small text-text-muted">{t('LABELS.fictionalPatients')}</p>
      </div>
      <div className="-mx-6 flex min-h-[520px] flex-1 border-t border-border">
        <div className="min-w-0 flex-1">
          <HomeMap />
        </div>
      </div>
    </div>
  );
}
