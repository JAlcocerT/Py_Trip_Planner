"use client";

import * as React from "react";

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string | number;
  labelFormatter?: (label: string | number) => React.ReactNode;
  formatter?: (value: number | undefined, name: string | undefined) => React.ReactNode;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: ChartTooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border bg-popover/95 px-3 py-2 text-xs shadow-md backdrop-blur">
      {label != null && (
        <p className="mb-1 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground">{p.name ?? p.dataKey}</span>
            <span className="ml-auto font-medium text-foreground">
              {formatter ? formatter(p.value, p.name ?? p.dataKey) : p.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
