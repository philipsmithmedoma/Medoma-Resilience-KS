import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CareNode } from '@/data/types';
import { NODE_STATUS_COLOURS } from '@/data/vocab';
import { t, tm } from '@/lib/i18n';
import { fmt } from '@/lib/format';
import { cssColor, useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface NodeMapProps {
  nodes: CareNode[];
  selectedId?: string;
  lineFrom?: string; // draw a polyline from this node to the selected one
  center?: [number, number];
  zoom?: number;
  className?: string;
  onSelect?: (nodeId: string) => void;
}

function FitBounds({ nodes, center, zoom }: { nodes: CareNode[]; center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? 12, { animate: false });
      return;
    }
    if (nodes.length === 0) return;
    const lats = nodes.map((n) => n.lat);
    const lngs = nodes.map((n) => n.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], animate: false },
    );
    // Fit once per node set size; later node additions re-fit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, nodes.length, center?.[0], center?.[1], zoom]);
  return null;
}

/**
 * DESIGN-KS.md § 8 maps: OpenStreetMap tiles, circle markers (radius 10) coloured by status and labelled
 * with the short name; ASIH as a soft 25 km circle centred on Stockholm with its label at the top.
 */
export function NodeMap({ nodes, selectedId, lineFrom, center, zoom, className, onSelect }: NodeMapProps) {
  // Leaflet paints SVG paths with literal colours: resolve the tokens for the current theme.
  useTheme((s) => s.theme);
  const PRIMARY = cssColor('--color-primary');
  const statusColour = (status: CareNode['status']) => cssColor(NODE_STATUS_COLOURS[status]);
  const markers = nodes.filter((n) => !n.noMarker && n.radiusKm === undefined);
  const areas = nodes.filter((n) => n.radiusKm !== undefined);
  const selected = nodes.find((n) => n.id === selectedId);
  const from = nodes.find((n) => n.id === lineFrom);
  return (
    <MapContainer center={center ?? [59.35, 18.0]} zoom={zoom ?? 9} scrollWheelZoom={false} className={cn('h-full w-full', className)} attributionControl>
      <TileLayer attribution={t('EVAC.map.attribution')} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds nodes={markers} center={center} zoom={zoom} />
      {areas.map((n) => {
        const isSelected = n.id === selectedId;
        return (
          <Circle
            key={n.id}
            center={[n.lat, n.lng]}
            radius={(n.radiusKm ?? 0) * 1000}
            pathOptions={{ color: PRIMARY, weight: isSelected ? 2 : 1, fillColor: PRIMARY, fillOpacity: isSelected ? 0.18 : 0.1 }}
            eventHandlers={onSelect ? { click: () => onSelect(n.id) } : undefined}
          >
            <Tooltip permanent direction="top" offset={[0, -((n.radiusKm ?? 0) * 3)]} className="node-map-label">
              {n.shortName}
            </Tooltip>
          </Circle>
        );
      })}
      {from && selected ? (
        <Polyline
          positions={[
            [from.lat, from.lng],
            [selected.lat, selected.lng],
          ]}
          pathOptions={{ color: PRIMARY, weight: 2 }}
        />
      ) : null}
      {markers.map((n) => {
        const isSelected = n.id === selectedId;
        const free = n.beds?.free.value;
        return (
          <CircleMarker
            key={n.id}
            center={[n.lat, n.lng]}
            radius={10}
            pathOptions={{
              color: isSelected ? PRIMARY : statusColour(n.status),
              fillColor: isSelected ? PRIMARY : statusColour(n.status),
              fillOpacity: 0.9,
              weight: 2,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(n.id) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {n.shortName}
            </Tooltip>
            <Popup>
              <span className="font-medium">{n.name}</span>
              <br />
              {free !== undefined && free !== null ? t('EVAC.map.freePlaces', { n: fmt(free) }) : tm('NODE_STATUS_LABELS')[n.status]}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
