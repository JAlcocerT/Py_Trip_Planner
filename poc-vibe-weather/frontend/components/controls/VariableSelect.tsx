"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoxplotVariable } from "@/lib/types";

const OPTIONS: { value: BoxplotVariable; label: string }[] = [
  { value: "tmax", label: "Max temperature (°C)" },
  { value: "tmin", label: "Min temperature (°C)" },
  { value: "wspd", label: "Wind speed (km/h)" },
  { value: "prcp", label: "Precipitation (mm)" },
];

interface VariableSelectProps {
  value: BoxplotVariable;
  onChange: (v: BoxplotVariable) => void;
}

export default function VariableSelect({ value, onChange }: VariableSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">Boxplot variable</label>
      <Select value={value} onValueChange={(v) => onChange(v as BoxplotVariable)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
