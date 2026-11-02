import { useEffect, useState } from 'react';
import { useStore } from '@/data/store';
import { loadGeoData, type GeoData } from '@/lib/geoData';
import { loadRoadModel } from '@/lib/roadModel';

/**
 * Loads the OpenStreetMap geometry (dynamic imports, SPEC.md § 12.2) and builds the road model when Hospital at Home
 * opens; the store is told when the graph is ready so the impact is computed again. Null while loading.
 */
export function useHomeGeo(): GeoData | null {
  const pack = useStore((s) => s.pack);
  const setHomeGeoReady = useStore((s) => s.setHomeGeoReady);
  const [geo, setGeo] = useState<GeoData | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all([loadGeoData(), loadRoadModel(pack)]).then(([g]) => {
      if (!alive) return;
      setGeo(g);
      setHomeGeoReady();
    });
    return () => {
      alive = false;
    };
  }, [pack, setHomeGeoReady]);
  return geo;
}
