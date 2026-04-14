import type { Station } from "./types";

const R = 6371; // Earth radius in km

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Find the nearest station from an already-loaded GeoJSON FeatureCollection.
 * Runs client-side — no extra API call needed since the full GeoJSON is already
 * in memory for the map dot layer.
 */
export function nearestStation(
  lat: number,
  lon: number,
  geojson: GeoJSON.FeatureCollection
): Station | null {
  let best: Station | null = null;
  let bestDist = Infinity;

  for (const feature of geojson.features) {
    if (feature.geometry.type !== "Point") continue;
    const [fLon, fLat] = feature.geometry.coordinates;
    const dist = haversine(lat, lon, fLat, fLon);
    if (dist < bestDist) {
      bestDist = dist;
      const p = feature.properties as Record<string, unknown>;
      best = {
        id: String(p.id),
        name: String(p.name ?? ""),
        country: String(p.country ?? ""),
        elevation: p.elevation != null ? Number(p.elevation) : null,
        latitude: fLat,
        longitude: fLon,
        distance_km: Math.round(dist * 10) / 10,
      };
    }
  }

  return best;
}
