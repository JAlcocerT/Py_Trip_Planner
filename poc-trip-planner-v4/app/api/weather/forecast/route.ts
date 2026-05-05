import { NextResponse } from "next/server";
import { fetchWeatherApi } from "openmeteo";
import { latLonSchema } from "@/lib/schemas";
import type { ForecastResponse } from "@/lib/types";

export const runtime = "nodejs";

const URL_FORECAST = "https://api.open-meteo.com/v1/forecast";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = latLonSchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }

  const params = {
    latitude: parsed.data.lat,
    longitude: parsed.data.lon,
    hourly: ["apparent_temperature", "precipitation", "windspeed_10m", "winddirection_10m"],
    daily: ["sunrise", "sunset"],
    timezone: "auto",
    forecast_days: 7,
  };

  try {
    const responses = await fetchWeatherApi(URL_FORECAST, params);
    const r = responses[0];
    const utc = r.utcOffsetSeconds();
    const hourly = r.hourly()!;
    const daily = r.daily()!;

    const hStart = Number(hourly.time());
    const hEnd = Number(hourly.timeEnd());
    const hStep = hourly.interval();
    const hLen = (hEnd - hStart) / hStep;

    const temps = hourly.variables(0)!.valuesArray()!;
    const precs = hourly.variables(1)!.valuesArray()!;
    const wsp = hourly.variables(2)!.valuesArray()!;
    const wdir = hourly.variables(3)!.valuesArray()!;

    const hourlyOut = Array.from({ length: hLen }, (_, i) => {
      const ts = (hStart + i * hStep + utc) * 1000;
      return {
        time: new Date(ts).toISOString().slice(0, 16),
        temp: numOrNull(temps[i]),
        precip: numOrNull(precs[i]),
        wind_speed: numOrNull(wsp[i]),
        wind_dir: numOrNull(wdir[i]),
      };
    });

    const dStart = Number(daily.time());
    const dEnd = Number(daily.timeEnd());
    const dStep = daily.interval();
    const dLen = (dEnd - dStart) / dStep;
    const sunrises = daily.variables(0)!;
    const sunsets = daily.variables(1)!;

    const dailyOut = Array.from({ length: dLen }, (_, i) => {
      const ts = (dStart + i * dStep + utc) * 1000;
      const date = new Date(ts).toISOString().slice(0, 10);
      const sr = sunrises.valuesInt64(i);
      const ss = sunsets.valuesInt64(i);
      return {
        date,
        sunrise: sr ? new Date((Number(sr) + utc) * 1000).toISOString().slice(0, 16) : null,
        sunset: ss ? new Date((Number(ss) + utc) * 1000).toISOString().slice(0, 16) : null,
      };
    });

    const out: ForecastResponse = { hourly: hourlyOut, daily: dailyOut };
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: `OpenMeteo request failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}

function numOrNull(v: number | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 10) / 10;
}
