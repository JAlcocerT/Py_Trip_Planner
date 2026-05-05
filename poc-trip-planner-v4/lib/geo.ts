import type { Station } from "./types";

const R = 6371.0;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearestStation(
  lat: number,
  lon: number,
  geojson: GeoJSON.FeatureCollection
): Station | null {
  let best: Station | null = null;
  let bestDist = Infinity;

  for (const f of geojson.features) {
    if (f.geometry.type !== "Point") continue;
    const [flon, flat] = (f.geometry as GeoJSON.Point).coordinates;
    const d = haversineKm(lat, lon, flat, flon);
    if (d < bestDist) {
      bestDist = d;
      const p = f.properties as Record<string, unknown>;
      best = {
        id: String(p.id),
        name: String(p.name ?? ""),
        country: String(p.country ?? ""),
        elevation: p.elevation != null ? Number(p.elevation) : null,
        latitude: flat,
        longitude: flon,
        distance_km: Math.round(d * 100) / 100,
      };
    }
  }

  return best;
}
