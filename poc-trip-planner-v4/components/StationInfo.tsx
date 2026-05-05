"use client";

import { motion } from "framer-motion";
import { MapPin, Globe2, Mountain } from "lucide-react";
import type { Station } from "@/lib/types";

export default function StationInfo({ station }: { station: Station }) {
  return (
    <motion.div
      key={station.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass space-y-2 rounded-xl p-4"
    >
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{station.name}</p>
          <p className="text-xs text-muted-foreground">ID: {station.id}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe2 className="h-3.5 w-3.5" />
          <span>{station.country || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mountain className="h-3.5 w-3.5" />
          <span>{station.elevation != null ? `${station.elevation} m` : "—"}</span>
        </div>
        <div className="col-span-2 font-mono text-[10px] text-muted-foreground">
          {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
          {station.distance_km != null && ` · ${station.distance_km} km away`}
        </div>
      </div>
    </motion.div>
  );
}
