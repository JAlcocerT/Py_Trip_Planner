"use client";

import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// Max selectable end date: yesterday (historical data only)
function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span>Date range</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={value.start}
            min="2000-01-01"
            max={value.end}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={value.end}
            min={value.start}
            max={maxDate()}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}
