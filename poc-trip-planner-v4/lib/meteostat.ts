import { gunzipSync } from "node:zlib";
import { stationCache, dailyCache } from "./cache";
import type { DailyRecord, Station } from "./types";

const STATIONS_URL = "https://bulk.meteostat.net/v2/stations/lite.json.gz";
const DAILY_URL = (id: string) => `https://bulk.meteostat.net/v2/daily/${id}.csv.gz`;

interface RawStation {
  id: string;
  country: string;
  region?: string;
  name: { en?: string } & Record<string, string>;
  location: { latitude: number; longitude: number; elevation: number | null };
  identifiers?: { wmo?: string; icao?: string };
  inventory?: { daily?: { start?: string; end?: string } };
}

const STATIONS_KEY = "stations:lite";
const STATIONS_GEOJSON_KEY = "stations:geojson";

async function fetchGz(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return gunzipSync(Buffer.from(ab));
}

export async function loadStations(): Promise<RawStation[]> {
  const cached = stationCache.get(STATIONS_KEY) as RawStation[] | undefined;
  if (cached) return cached;
  const buf = await fetchGz(STATIONS_URL);
  const data = JSON.parse(buf.toString("utf8")) as RawStation[];
  stationCache.set(STATIONS_KEY, data);
  return data;
}

export async function loadStationsGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const cached = stationCache.get(STATIONS_GEOJSON_KEY) as
    | GeoJSON.FeatureCollection
    | undefined;
  if (cached) return cached;

  const stations = await loadStations();
  const features: GeoJSON.Feature[] = [];
  for (const s of stations) {
    const lat = s.location?.latitude;
    const lon = s.location?.longitude;
    if (lat == null || lon == null) continue;
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5],
      },
      properties: {
        id: s.id,
        name: s.name?.en ?? s.id,
        country: s.country,
        elevation:
          s.location?.elevation != null
            ? Math.round(s.location.elevation * 10) / 10
            : null,
      },
    });
  }
  const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
  stationCache.set(STATIONS_GEOJSON_KEY, fc);
  return fc;
}

export async function findStation(id: string): Promise<Station | null> {
  const stations = await loadStations();
  const s = stations.find((x) => x.id === id);
  if (!s) return null;
  return {
    id: s.id,
    name: s.name?.en ?? s.id,
    country: s.country,
    latitude: s.location.latitude,
    longitude: s.location.longitude,
    elevation:
      s.location.elevation != null
        ? Math.round(s.location.elevation * 10) / 10
        : null,
  };
}

// Daily CSV columns per Meteostat bulk format:
// date, tavg, tmin, tmax, prcp, snow, wdir, wspd, wpgt, pres, tsun
export async function loadDaily(stationId: string): Promise<DailyRecord[]> {
  const key = `daily:${stationId}`;
  const cached = dailyCache.get(key) as DailyRecord[] | undefined;
  if (cached) return cached;

  const res = await fetch(DAILY_URL(stationId), { cache: "no-store" });
  if (res.status === 404) {
    dailyCache.set(key, []);
    return [];
  }
  if (!res.ok) throw new Error(`Fetch daily failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  const csv = gunzipSync(Buffer.from(ab)).toString("utf8");

  const rows: DailyRecord[] = [];
  for (const line of csv.split("\n")) {
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 11) continue;
    const [date, , tmin, tmax, prcp, , , wspd] = parts;
    rows.push({
      date,
      tmin: tmin === "" ? null : Number(tmin),
      tmax: tmax === "" ? null : Number(tmax),
      wspd: wspd === "" ? null : Number(wspd),
      prcp: prcp === "" ? null : Number(prcp),
    });
  }

  dailyCache.set(key, rows);
  return rows;
}

export function filterDailyRange(
  rows: DailyRecord[],
  start: string,
  end: string
): DailyRecord[] {
  return rows.filter((r) => r.date >= start && r.date <= end);
}
