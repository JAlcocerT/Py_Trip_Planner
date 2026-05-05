"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoxplotVariable } from "@/lib/types";

interface Props {
  value: BoxplotVariable;
  onChange: (v: BoxplotVariable) => void;
}

const OPTIONS: Array<{ value: BoxplotVariable; label: string }> = [
  { value: "tmax", label: "Max temp (°C)" },
  { value: "tmin", label: "Min temp (°C)" },
  { value: "wspd", label: "Wind speed (km/h)" },
  { value: "prcp", label: "Precipitation (mm)" },
];

export default function VariableSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">Boxplot variable</label>
      <Select value={value} onValueChange={(v) => onChange(v as BoxplotVariable)}>
        <SelectTrigger>
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
