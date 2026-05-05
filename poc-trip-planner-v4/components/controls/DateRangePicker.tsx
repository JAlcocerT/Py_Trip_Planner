"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { DayPicker, type DateRange as DPRange } from "react-day-picker";
import "react-day-picker/style.css";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
  start: string;
  end: string;
}

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const dpValue: DPRange = {
    from: parseISO(value.start),
    to: parseISO(value.end),
  };
  const maxDate = subDays(new Date(), 7);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">Date range</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(parseISO(value.start), "MMM d, yyyy")} → {format(parseISO(value.end), "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <DayPicker
            mode="range"
            selected={dpValue}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                onChange({
                  start: format(r.from, "yyyy-MM-dd"),
                  end: format(r.to, "yyyy-MM-dd"),
                });
              }
            }}
            disabled={{ after: maxDate }}
            numberOfMonths={2}
            defaultMonth={parseISO(value.start)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
