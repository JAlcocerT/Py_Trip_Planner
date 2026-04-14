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
        tooltip={(datum) => {
          // In @nivo/boxplot 0.87, stats live under datum.data
          // values = [P10, Q1, Median, Q3, P90], extrema = [min, max]
          const f = (datum as Record<string, unknown>).formatted as Record<string, unknown> | undefined;
          const data = (datum as Record<string, unknown>).data as Record<string, unknown> | undefined;
          const fv = Array.isArray(f?.values) ? (f!.values as string[]) : [];
          const fe = Array.isArray(f?.extrema) ? (f!.extrema as string[]) : [];
          const fq = Array.isArray(f?.quantiles) ? (f!.quantiles as string[]) : [];

          const rows: [string, string][] = [
            [`P${fq[4] ?? 90}`,  fv[4] ?? "—"],
            [`Q3 / P${fq[3] ?? 75}`, fv[3] ?? "—"],
            [`Median / P${fq[2] ?? 50}`, fv[2] ?? "—"],
            [`Q1 / P${fq[1] ?? 25}`, fv[1] ?? "—"],
            [`P${fq[0] ?? 10}`,  fv[0] ?? "—"],
            ["Max",              fe[1] ?? "—"],
            ["Min",              fe[0] ?? "—"],
            ["Mean",             String(f?.mean ?? data?.mean ?? "—")],
            ["n",                String(f?.n    ?? data?.n    ?? "—")],
          ];

          return (
            <div
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                minWidth: 160,
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: 6 }}>
                {String((datum as Record<string, unknown>).label ?? (datum as Record<string, unknown>).group ?? "")}
              </p>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  {rows.map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ color: "#94a3b8", paddingRight: 16, paddingBottom: 2 }}>{label}</td>
                      <td style={{ fontWeight: 500, textAlign: "right" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      />
    </div>
  );
}
