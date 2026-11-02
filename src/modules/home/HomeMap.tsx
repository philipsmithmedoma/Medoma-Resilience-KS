import { useMemo } from 'react';
import { useStore } from '@/data/store';
import { t } from '@/lib/i18n';
import type { Impact } from '@/lib/reachability';
import { NodeMap } from '@/components/NodeMap';
import type { HomeOverlay, PatientMark } from '@/components/HomeMapLayers';
import { LayerChips } from './LayerChips';
import { ModeChips } from './ModeChips';
import { MapLegend } from './MapLegend';

/** Right pane (SPEC.md § 11.6): layer and mode chips above the map, the legend under it. */
export function HomeMap({ impact }: { impact: Impact }) {
  const pack = useStore((s) => s.pack);
  const nodes = useStore((s) => s.nodes);
  const home = useStore((s) => s.home);
  const selectHomeNode = useStore((s) => s.selectHomeNode);
  const toggleBlockedNode = useStore((s) => s.toggleBlockedNode);
  const toggleBlockedLink = useStore((s) => s.toggleBlockedLink);
  const togglePowerOut = useStore((s) => s.togglePowerOut);
  const toggleWaterOut = useStore((s) => s.toggleWaterOut);
  // Only the two Karolinska sites are care nodes on this map; the region's hospitals are not part of the picture.
  const sites = useMemo(() => nodes.filter((n) => n.id === 'solna' || n.id === 'huddinge'), [nodes]);
  // Affected patients are filled, affected and critical ones a hollow ring, detour-only ones amber (SPEC.md § 11.5).
  const patientMarks = useMemo(() => {
    const marks = new Map<string, PatientMark>();
    for (const r of impact.rows) marks.set(r.patient.id, r.critical ? 'critical' : r.affected ? 'affected' : 'detour');
    return marks;
  }, [impact]);
  const overlay = useMemo<HomeOverlay>(
    () => ({
      layers: home.layers,
      zones: pack.homeZones,
      infraNodes: pack.infraNodes,
      infraLinks: pack.infraLinks,
      patients: pack.homePatients,
      selectedId: home.selectedNode,
      onSelectNode: selectHomeNode,
      mode: home.mode,
      blockedNodes: home.blockedNodes,
      blockedLinks: home.blockedLinks,
      powerOutZones: home.powerOutZones,
      waterOutZones: home.waterOutZones,
      patientMarks,
      onToggleNode: toggleBlockedNode,
      onToggleLink: toggleBlockedLink,
      onToggleZone: home.mode === 'el' ? togglePowerOut : toggleWaterOut,
    }),
    [home, pack, patientMarks, selectHomeNode, toggleBlockedNode, toggleBlockedLink, togglePowerOut, toggleWaterOut],
  );
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="space-y-2 border-b border-border px-4 py-2">
        <LayerChips />
        <ModeChips />
      </div>
      <div className="min-h-0 flex-1" role="region" aria-label={t('HOME.mapAria')}>
        <NodeMap nodes={sites} home={overlay} scrollWheelZoom className="h-full" />
      </div>
      <div className="border-t border-border px-4 py-2">
        <MapLegend />
      </div>
    </div>
  );
}
