"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";
import type { DailyRecord } from "@/lib/types";

interface Props {
  data: DailyRecord[];
}

function formatXLabel(dateStr: string, index: number, total: number) {
  const step = Math.max(1, Math.floor(total / 12));
  if (index % step !== 0) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("default", { month: "short", year: "2-digit" });
}

export default function HistoricalChart({ data }: Props) {
  const chartData = data.filter((d) => d.tmin !== null || d.tmax !== null);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTmax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradTmin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v, i) => formatXLabel(v, i, chartData.length)}
            interval={0}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `${v}°`}
            width={36}
          />

          <Tooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("default", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                }
                formatter={(value) => `${value?.toFixed(1)}°C`}
              />
            }
          />

          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (value === "tmax" ? "Max temp" : "Min temp")}
          />

          <Area
            type="monotone"
            dataKey="tmax"
            stroke="#f97316"
            strokeWidth={1.5}
            fill="url(#gradTmax)"
            dot={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="tmin"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#gradTmin)"
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
