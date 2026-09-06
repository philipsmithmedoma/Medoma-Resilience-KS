import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CareNode } from '@/data/types';
import { EVAC, NODE_STATUS_COLOURS } from '@/data/vocab';
import { relevantFree } from '@/lib/evacuation';
import { cn } from '@/lib/utils';

const PRIMARY = '#186CE9';

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

/** DESIGN.md § 4 maps: OpenStreetMap tiles, circle markers (radius 10) coloured by status, primary when selected. */
export function NodeMap({ nodes, selectedId, lineFrom, center, zoom, className, onSelect }: NodeMapProps) {
  const selected = nodes.find((n) => n.id === selectedId);
  const from = nodes.find((n) => n.id === lineFrom);
  return (
    <MapContainer
      center={center ?? [59.5, 17.9]}
      zoom={zoom ?? 10}
      scrollWheelZoom={false}
      className={cn('h-full w-full', className)}
      attributionControl
    >
      <TileLayer attribution={EVAC.map.attribution} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds nodes={nodes} center={center} zoom={zoom} />
      {from && selected ? (
        <Polyline
          positions={[
            [from.lat, from.lng],
            [selected.lat, selected.lng],
          ]}
          pathOptions={{ color: PRIMARY, weight: 2 }}
        />
      ) : null}
      {nodes.map((n) => {
        const isSelected = n.id === selectedId;
        const free = n.homeCarePlaces ? relevantFree(n, { careLevel: 'Ward' }) : relevantFree(n, { careLevel: 'Ward' });
        return (
          <CircleMarker
            key={n.id}
            center={[n.lat, n.lng]}
            radius={10}
            pathOptions={{
              color: isSelected ? PRIMARY : NODE_STATUS_COLOURS[n.status],
              fillColor: isSelected ? PRIMARY : NODE_STATUS_COLOURS[n.status],
              fillOpacity: 0.9,
              weight: 2,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(n.id) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {n.name}
            </Tooltip>
            <Popup>
              <span className="font-medium">{n.name}</span>
              <br />
              {free ? EVAC.map.freePlaces(free.free) : n.status}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
