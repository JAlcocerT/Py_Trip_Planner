"use client";

import type { Station } from "@/lib/types";

interface StationInfoProps {
  station: Station;
}

export default function StationInfo({ station }: StationInfoProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-sm space-y-1">
      <p className="font-semibold text-base">{station.name}</p>
      <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span>Country</span>
        <span className="text-foreground">{station.country}</span>

        {station.elevation != null && (
          <>
            <span>Elevation</span>
            <span className="text-foreground">{station.elevation} m</span>
          </>
        )}

        <span>Coordinates</span>
        <span className="text-foreground">
          {station.latitude.toFixed(3)}, {station.longitude.toFixed(3)}
        </span>

        <span>Station ID</span>
        <span className="text-foreground font-mono">{station.id}</span>

        {station.distance_km != null && (
          <>
            <span>Distance</span>
            <span className="text-foreground">{station.distance_km} km</span>
          </>
        )}
      </div>
    </div>
  );
}
