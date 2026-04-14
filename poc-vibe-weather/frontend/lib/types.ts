export interface Station {
  id: string;
  name: string;
  country: string;
  elevation: number | null;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export interface DailyRecord {
  date: string;
  tmin: number | null;
  tmax: number | null;
  wspd: number | null;
  prcp: number | null;
}

export interface HistoricalResponse {
  station: Station;
  daily: DailyRecord[];
}

export interface HourlyForecast {
  time: string;
  temp: number | null;
  wind_speed: number | null;
  wind_dir: number | null;
  precip: number | null;
}

export interface DailyForecast {
  date: string;
  sunrise: string | null;
  sunset: string | null;
}

export interface ForecastResponse {
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export type BoxplotVariable = "tmax" | "tmin" | "wspd" | "prcp";
