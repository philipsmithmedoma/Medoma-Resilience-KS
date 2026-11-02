import { useStore } from '@/data/store';
import { t } from '@/lib/i18n';
import { scopeName } from '@/lib/scope';
import { PageTitle } from '@/components/PageTitle';
import { HomeMap } from './HomeMap';
import { HomePatientList } from './HomePatientList';
import { NodePanel, PanelEmpty } from './NodePanel';

/** SPEC.md § 11.6 – Sjukhus hemma: patient list (380 px), panel (320 px) and the map, as in Evakuering. */
export function HomePage() {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const incident = useStore((s) => s.incident);
  const pack = useStore((s) => s.pack);
  const selectedId = useStore((s) => s.home.selectedNode);
  const selected = pack.infraNodes.find((n) => n.id === selectedId) ?? null;
  return (
    <div className="flex flex-col" style={{ height: incident ? 'calc(100vh - 136px)' : 'calc(100vh - 96px)' }}>
      <div className="mb-4">
        <PageTitle title={t('HOME.title')} scope={scopeName(scope, nodes)} />
      </div>
      <div className="-mx-6 flex min-h-[520px] flex-1 border-t border-border">
        <div className="w-[380px] shrink-0 overflow-y-auto border-r border-border">
          <HomePatientList patients={pack.homePatients} />
        </div>
        <div className="w-[320px] shrink-0 overflow-y-auto border-r border-border">{selected ? <NodePanel node={selected} /> : <PanelEmpty />}</div>
        <div className="min-w-0 flex-1">
          <HomeMap />
        </div>
      </div>
    </div>
  );
}
