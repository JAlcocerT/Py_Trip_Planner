"use client";

import { ResponsiveBoxPlot } from "@nivo/boxplot";
import type { DailyRecord, BoxplotVariable } from "@/lib/types";

interface Props {
  data: DailyRecord[];
  variable: BoxplotVariable;
}

const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const VARIABLE_LABELS: Record<BoxplotVariable, string> = {
  tmax: "Max temp (°C)",
  tmin: "Min temp (°C)",
  wspd: "Wind speed (km/h)",
  prcp: "Precipitation (mm)",
};

const nivoTheme = {
  background: "transparent",
  text: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
  axis: {
    ticks: {
      line: { stroke: "hsl(var(--border))" },
      text: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
    },
    legend: {
      text: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
    },
  },
  grid: { line: { stroke: "hsl(var(--border))", strokeWidth: 1 } },
};

export default function BoxplotChart({ data, variable }: Props) {
  const chartData = data
    .filter((d) => d[variable] !== null)
    .map((d) => ({
      group: new Date(d.date + "T00:00").toLocaleString("default", { month: "short" }),
      value: d[variable] as number,
    }))
    .filter((d) => MONTH_ORDER.includes(d.group));

  const groups = MONTH_ORDER.filter((m) => chartData.some((d) => d.group === m));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveBoxPlot
        data={chartData}
        groups={groups}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme={nivoTheme as any}
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
        axisBottom={{ tickSize: 0, tickPadding: 8, legend: "" }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          legend: VARIABLE_LABELS[variable],
          legendPosition: "middle",
          legendOffset: -44,
        }}
      />
    </div>
  );
}
