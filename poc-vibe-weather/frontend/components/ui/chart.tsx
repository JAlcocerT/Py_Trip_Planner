"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ChartConfig
// ---------------------------------------------------------------------------

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />");
  return ctx;
}

// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof ResponsiveContainer>["children"];
  }
>(({ className, config, children, id, ...props }, ref) => {
  const uid = React.useId();
  const chartId = `chart-${id ?? uid.replace(/:/g, "")}`;

  // Inject CSS variables for each colour in config
  const styleVars = Object.entries(config)
    .filter(([, v]) => v.color)
    .map(([k, v]) => `[data-chart="${chartId}"] { --color-${k}: ${v.color}; }`)
    .join("\n");

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={cn("w-full", className)}
        {...props}
      >
        {styleVars && (
          <style dangerouslySetInnerHTML={{ __html: styleVars }} />
        )}
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

// ---------------------------------------------------------------------------
// ChartTooltip (re-export Recharts Tooltip for convenience)
// ---------------------------------------------------------------------------

export const ChartTooltip = Tooltip;

// ---------------------------------------------------------------------------
// ChartTooltipContent
// ---------------------------------------------------------------------------

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
    labelFormatter?: (label: string) => React.ReactNode;
    formatter?: (
      value: number,
      name: string,
      color: string
    ) => React.ReactNode;
  }
>(
  (
    { active, payload, label, labelFormatter, formatter, className, ...props },
    ref
  ) => {
    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-background px-3 py-2 shadow-md text-xs",
          className
        )}
        {...props}
      >
        {label && (
          <p className="mb-1.5 font-medium text-foreground">
            {labelFormatter ? labelFormatter(label) : label}
          </p>
        )}
        <div className="space-y-0.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">
                {entry.name}
              </span>
              <span className="ml-auto font-medium text-foreground">
                {formatter
                  ? formatter(entry.value, entry.name, entry.color)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";
