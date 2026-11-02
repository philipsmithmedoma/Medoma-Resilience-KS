import { Fragment, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import type { CareNode, HomePatient, HomeZone, InfraLayer, InfraLink, InfraNode } from '@/data/types';
import type { HomeLayerKey } from '@/data/store-home';
import { lt, t, tm } from '@/lib/i18n';
import { isSchematic, linkedVertices, offmapEnd, offmapRotation, offmapSlots, vertexPositions, type LatLng } from '@/lib/home-geo';
import { cssColor } from '@/lib/theme';

/** What the Hospital at Home page hands to NodeMap (SPEC.md § 11.6): layers, zones, infrastructure and patient dots. */
export interface HomeOverlay {
  layers: Record<HomeLayerKey, boolean>;
  zones: HomeZone[];
  infraNodes: InfraNode[];
  infraLinks: InfraLink[];
  patients: HomePatient[];
  /** The selected infrastructure node: everything it is not linked to is dimmed. */
  selectedId?: string | null;
  /** Click on a node (selects it) or on the empty map (null). Without it the nodes take no clicks. */
  onSelectNode?: (id: string | null) => void;
}

/** Layer colours are design tokens: water teal, electricity olive, roads text-secondary. */
export const LAYER_TOKEN: Record<InfraLayer, string> = {
  water: '--color-teal',
  el: '--color-olive',
  roads: '--color-text-secondary',
};

const DASH_SCHEMATIC = '8 6';
const DASH_DOTTED = '2 6';

/** Every point the page should fit in view: zones with their radius, infrastructure markers, sites and arrow ends. */
export function homeFitPoints(overlay: HomeOverlay, sites: CareNode[]): LatLng[] {
  const points: LatLng[] = sites.map((s) => [s.lat, s.lng]);
  for (const z of overlay.zones) points.push([z.lat, z.lng]);
  for (const n of overlay.infraNodes) if (!n.noMarker) points.push([n.lat, n.lng]);
  const positions = vertexPositions(sites, overlay.zones, overlay.infraNodes);
  const slots = offmapSlots(overlay.infraLinks);
  for (const l of overlay.infraLinks) {
    const from = positions.get(l.a);
    const slot = slots.get(l.id);
    if (l.offmap && from && slot) points.push(offmapEnd(from, l.offmap.dir, slot.k, slot.n));
  }
  return points;
}

const iconCache = new Map<string, L.DivIcon>();

/** Marker shapes: water circle, electricity diamond, bridge square, tunnel circle; unverified nodes are hollow with a question mark. */
function nodeIcon(node: InfraNode, selected: boolean, dim: boolean): L.DivIcon {
  const shape = node.layer === 'el' ? 'diamond' : node.kind === 'bridge' ? 'square' : 'circle';
  const key = `${node.layer}|${shape}|${node.verified}|${selected}|${dim}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const colour = `var(${LAYER_TOKEN[node.layer]})`;
    const open = (node.verified ? '' : ' home-node-open') + (selected ? ' home-node-selected' : '') + (dim ? ' home-node-dim' : '');
    icon = L.divIcon({
      className: 'home-node-wrap',
      html: `<span class="home-node home-node-${shape}${open}" style="--node-colour:${colour}">${node.verified ? '' : '<span aria-hidden="true">?</span>'}</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

function arrowIcon(layer: InfraLayer, rotation: number, dim = false): L.DivIcon {
  const key = `arrow|${layer}|${rotation}|${dim}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: 'home-node-wrap',
      html: `<span class="home-arrow${dim ? ' home-node-dim' : ''}" style="--node-colour:var(${LAYER_TOKEN[layer]});transform:rotate(${rotation}deg)"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

/** Label placement for an off-map arrow: beyond its tip, or to alternate sides when several arrows leave one node the same way. */
function arrowLabel(dir: 'N' | 'S' | 'E' | 'W', k: number, n: number): { direction: 'top' | 'bottom' | 'left' | 'right'; offset: [number, number] } {
  if (n > 1 && (dir === 'N' || dir === 'S')) return k % 2 === 0 ? { direction: 'left', offset: [-8, 0] } : { direction: 'right', offset: [8, 0] };
  if (dir === 'N') return { direction: 'top', offset: [0, -6] };
  if (dir === 'S') return { direction: 'bottom', offset: [0, 6] };
  return dir === 'E' ? { direction: 'right', offset: [6, 0] } : { direction: 'left', offset: [-6, 0] };
}

interface HomeMapLayersProps {
  overlay: HomeOverlay;
  sites: CareNode[];
}

/** A click on the empty map clears the selection. */
function ClearOnMapClick({ onClear }: { onClear: () => void }) {
  useMapEvents({ click: onClear });
  return null;
}

/** Leaflet children of NodeMap: zone points, infrastructure links and nodes per layer, off-map arrows and the patient dots. */
export function HomeMapLayers({ overlay, sites }: HomeMapLayersProps) {
  const { layers, zones, infraNodes, infraLinks, patients, selectedId = null, onSelectNode } = overlay;
  const positions = useMemo(() => vertexPositions(sites, zones, infraNodes), [sites, zones, infraNodes]);
  const slots = useMemo(() => offmapSlots(infraLinks), [infraLinks]);
  // With a node selected, everything that is not linked to it is dimmed (SPEC.md § 11.5).
  const linked = useMemo(() => (selectedId ? linkedVertices(selectedId, infraLinks) : null), [selectedId, infraLinks]);
  const kinds = tm('HOME.kinds');
  const NEUTRAL = cssColor('--color-text-secondary');
  const MUTED = cssColor('--color-text-muted');
  const SURFACE = cssColor('--color-surface');
  const linkDim = (l: InfraLink) => linked !== null && l.a !== selectedId && l.b !== selectedId;
  const vertexDim = (id: string) => linked !== null && !linked.has(id);

  return (
    <>
      {onSelectNode ? <ClearOnMapClick onClear={() => selectedId && onSelectNode(null)} /> : null}
      {infraLinks
        .filter((l) => layers[l.layer])
        .map((l) => {
          const colour = cssColor(LAYER_TOKEN[l.layer]);
          const label = lt(l.label);
          const schematic = isSchematic(l);
          const dashArray = !schematic ? undefined : l.style === 'dotted' ? DASH_DOTTED : DASH_SCHEMATIC;
          const weight = l.style === 'road' ? 3 : 2;
          const opacity = linkDim(l) ? 0.15 : l.style === 'street' ? 0.7 : 0.9;
          const from = positions.get(l.a);
          if (!from) return null;
          if (l.offmap) {
            const slot = slots.get(l.id) ?? { k: 0, n: 1 };
            const end = offmapEnd(from, l.offmap.dir, slot.k, slot.n);
            const place = arrowLabel(l.offmap.dir, slot.k, slot.n);
            return (
              <Fragment key={`${l.id}-${linkDim(l)}`}>
                <Polyline positions={[from, end]} pathOptions={{ color: colour, weight, dashArray, opacity }} interactive={false} />
                <Marker position={end} icon={arrowIcon(l.layer, offmapRotation(l.offmap.dir), linkDim(l))} interactive={false} keyboard={false}>
                  <Tooltip permanent direction={place.direction} offset={place.offset} className={linkDim(l) ? 'home-map-label home-map-label-dim' : 'home-map-label'}>
                    {lt(l.offmap.text)}
                  </Tooltip>
                </Marker>
              </Fragment>
            );
          }
          const to = positions.get(l.b);
          if (!to) return null;
          return (
            <Polyline key={l.id} positions={[from, to]} pathOptions={{ color: colour, weight, dashArray, opacity }}>
              {label ? <Tooltip sticky>{label}</Tooltip> : null}
            </Polyline>
          );
        })}

      {zones.map((z) => {
        const dim = vertexDim(z.graphNode);
        return (
          <CircleMarker
            key={`${z.id}-${dim}`}
            center={[z.lat, z.lng]}
            radius={4}
            pathOptions={{ color: NEUTRAL, weight: 1.5, fillColor: SURFACE, fillOpacity: dim ? 0.3 : 1, opacity: dim ? 0.3 : 1 }}
            interactive={false}
          >
            <Tooltip permanent direction="bottom" offset={[0, 4]} className={dim ? 'home-map-label home-map-label-dim' : 'home-map-label'}>
              {lt(z.name)}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {infraNodes
        .filter((n) => layers[n.layer] && !n.noMarker)
        .map((n) => (
          <Marker
            key={n.id}
            position={[n.lat, n.lng]}
            icon={nodeIcon(n, n.id === selectedId, vertexDim(n.id))}
            title={lt(n.name)}
            alt={lt(n.name)}
            eventHandlers={onSelectNode ? { click: () => onSelectNode(n.id) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {lt(n.name)}
              <br />
              <span className="text-text-secondary">{kinds[n.kind]}</span>
              {n.verified ? null : (
                <>
                  <br />
                  <span className="text-red">{t('HOME.unverified')}</span>
                </>
              )}
            </Tooltip>
          </Marker>
        ))}

      {layers.patients
        ? patients.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={2}
              pathOptions={{ stroke: false, fillColor: MUTED, fillOpacity: vertexDim(`zone:${p.zone}`) ? 0.1 : 0.3 }}
              interactive={false}
            />
          ))
        : null}
    </>
  );
}
