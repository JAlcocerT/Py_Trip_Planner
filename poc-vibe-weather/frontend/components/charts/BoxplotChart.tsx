"use client";

import { ResponsiveBoxPlot } from "@nivo/boxplot";
import type { DailyRecord, BoxplotVariable } from "@/lib/types";

interface BoxplotChartProps {
  data: DailyRecord[];
  variable: BoxplotVariable;
}

const MONTH_ORDER = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const VARIABLE_LABELS: Record<BoxplotVariable, string> = {
  tmax: "Max temp (°C)",
  tmin: "Min temp (°C)",
  wspd: "Wind speed (km/h)",
  prcp: "Precipitation (mm)",
};

// Nivo theme mirroring shadcn CSS variable defaults
const nivoTheme = {
  background: "transparent",
  text: { fontSize: 11, fill: "hsl(240, 3.8%, 46.1%)" },
  axis: {
    ticks: {
      line: { stroke: "hsl(240, 5.9%, 90%)" },
      text: { fontSize: 11, fill: "hsl(240, 3.8%, 46.1%)" },
    },
    legend: {
      text: { fontSize: 12, fill: "hsl(240, 3.8%, 46.1%)" },
    },
  },
  grid: {
    line: { stroke: "hsl(240, 5.9%, 90%)", strokeWidth: 1 },
  },
};

export default function BoxplotChart({ data, variable }: BoxplotChartProps) {
  // Transform daily records → flat { group, value } array for Nivo
  const chartData = data
    .filter((d) => d[variable] !== null)
    .map((d) => ({
      group: new Date(d.date + "T00:00").toLocaleString("default", {
        month: "short",
      }),
      value: d[variable] as number,
    }))
    // Only include months present in MONTH_ORDER
    .filter((d) => MONTH_ORDER.includes(d.group));

  // Derive which months actually appear in the data (in order)
  const groups = MONTH_ORDER.filter((m) =>
    chartData.some((d) => d.group === m)
  );

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveBoxPlot
        data={chartData}
        groups={groups}
        theme={nivoTheme}
        margin={{ top: 8, right: 16, bottom: 40, left: 52 }}
        minValue="auto"
        maxValue="auto"
        padding={0.3}
        enableGridX={false}
        colors={["#3b82f6"]}
        medianColor="#1d4ed8"
        medianWidth={2}
        whiskerWidth={2}
        whiskerColor="#3b82f6"
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          legend: "",
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          legend: VARIABLE_LABELS[variable],
          legendPosition: "middle",
          legendOffset: -44,
        }}
        tooltip={({ color, ...datum }) => (
          <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-0.5">
            <p className="font-medium">{datum.group}</p>
            <p>Median: <span className="font-medium">{datum.median?.toFixed(1)}</span></p>
            <p>Q1 / Q3: {datum.quantiles?.[0]?.toFixed(1)} / {datum.quantiles?.[2]?.toFixed(1)}</p>
            <p>Min / Max: {datum.extremes?.[0]?.toFixed(1)} / {datum.extremes?.[1]?.toFixed(1)}</p>
            <p className="text-muted-foreground">n = {datum.n}</p>
          </div>
        )}
      />
    </div>
  );
}
