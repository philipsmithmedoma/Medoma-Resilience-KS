import { useMemo } from 'react';
import { useStore } from '@/data/store';
import { t } from '@/lib/i18n';
import { NodeMap } from '@/components/NodeMap';
import type { HomeOverlay } from '@/components/HomeMapLayers';
import { LayerChips } from './LayerChips';
import { MapLegend } from './MapLegend';

/** Right pane (SPEC.md § 11.6): layer chips above the map, the legend under it. */
export function HomeMap() {
  const pack = useStore((s) => s.pack);
  const nodes = useStore((s) => s.nodes);
  const layers = useStore((s) => s.home.layers);
  const selectedId = useStore((s) => s.home.selectedNode);
  const selectHomeNode = useStore((s) => s.selectHomeNode);
  // Only the two Karolinska sites are care nodes on this map; the region's hospitals are not part of the picture.
  const sites = useMemo(() => nodes.filter((n) => n.id === 'solna' || n.id === 'huddinge'), [nodes]);
  const overlay = useMemo<HomeOverlay>(
    () => ({
      layers,
      zones: pack.homeZones,
      infraNodes: pack.infraNodes,
      infraLinks: pack.infraLinks,
      patients: pack.homePatients,
      selectedId,
      onSelectNode: selectHomeNode,
    }),
    [layers, pack, selectedId, selectHomeNode],
  );
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b border-border px-4 py-2">
        <LayerChips />
      </div>
      <div className="min-h-0 flex-1" role="region" aria-label={t('HOME.mapAria')}>
        <NodeMap nodes={sites} home={overlay} className="h-full" />
      </div>
      <div className="border-t border-border px-4 py-2">
        <MapLegend />
      </div>
    </div>
  );
}
