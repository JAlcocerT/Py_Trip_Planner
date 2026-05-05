"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";
import type { ForecastResponse } from "@/lib/types";

interface Props {
  data: ForecastResponse;
}

function nearestHour(iso: string): string {
  const d = new Date(iso);
  if (d.getMinutes() >= 30) d.setHours(d.getHours() + 1);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function formatHourLabel(timeStr: string) {
  const d = new Date(timeStr);
  const h = d.getHours();
  if (h === 0) return d.toLocaleDateString("default", { weekday: "short", day: "numeric" });
  if (h % 6 === 0) return `${h}:00`;
  return "";
}

function WindArrow({ deg, speed }: { deg: number; speed: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${deg}deg)` }}>
        <line x1="7" y1="12" x2="7" y2="2" stroke="currentColor" strokeWidth="1.5" />
        <polyline points="4,5 7,2 10,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="text-[9px] leading-none text-muted-foreground">{Math.round(speed)}</span>
    </div>
  );
}

export default function ForecastChart({ data }: Props) {
  const { hourly, daily } = data;

  const chartData = hourly
    .filter((_, i) => i % 3 === 0)
    .map((h) => ({
      time: h.time,
      temp: h.temp != null ? Math.round(h.temp * 10) / 10 : null,
      precip: h.precip != null ? Math.round(h.precip * 10) / 10 : null,
    }));

  const times = new Set(chartData.map((d) => d.time));
  const nightRanges: Array<{ x1: string; x2: string }> = [];

  for (let i = 0; i < daily.length; i++) {
    const { date, sunrise, sunset } = daily[i];
    if (!sunrise || !sunset) continue;
    const dayStart = date + "T00:00";
    const sunriseH = nearestHour(sunrise);
    const sunsetH = nearestHour(sunset);
    const nextDayStart = i + 1 < daily.length ? daily[i + 1].date + "T00:00" : null;

    if (times.has(dayStart) && times.has(sunriseH)) {
      nightRanges.push({ x1: dayStart, x2: sunriseH });
    }
    if (times.has(sunsetH)) {
      const x2 = nextDayStart && times.has(nextDayStart)
        ? nextDayStart
        : chartData[chartData.length - 1]?.time;
      if (x2) nightRanges.push({ x1: sunsetH, x2 });
    }
  }

  const windData = hourly.filter((_, i) => i % 6 === 0);

  return (
    <div className="space-y-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            {nightRanges.map((r, i) => (
              <ReferenceArea
                key={i}
                x1={r.x1}
                x2={r.x2}
                fill="hsl(var(--muted))"
                fillOpacity={0.45}
                strokeOpacity={0}
              />
            ))}
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatHourLabel}
              interval={0}
            />
            <YAxis
              yAxisId="temp"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v}°`}
              width={36}
            />
            <YAxis
              yAxisId="precip"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v}mm`}
              width={42}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    new Date(label).toLocaleString("default", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  formatter={(value, name) => (name === "temp" ? `${value}°C` : `${value} mm`)}
                />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
              formatter={(v) => (v === "temp" ? "Feels like (°C)" : "Precip (mm)")}
            />
            <Bar
              yAxisId="precip"
              dataKey="precip"
              fill="#93c5fd"
              fillOpacity={0.7}
              radius={[2, 2, 0, 0]}
              maxBarSize={8}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full overflow-hidden">
        <p className="mb-1 px-1 text-xs text-muted-foreground">Wind (km/h, every 6 h)</p>
        <div className="flex flex-wrap gap-1 text-muted-foreground">
          {windData.map((h) => (
            <div
              key={h.time}
              className="flex min-w-[28px] flex-col items-center"
              title={new Date(h.time).toLocaleString("default", { weekday: "short", hour: "2-digit" })}
            >
              {h.wind_dir != null && h.wind_speed != null ? (
                <WindArrow deg={h.wind_dir} speed={h.wind_speed} />
              ) : (
                <span className="text-[9px]">–</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
