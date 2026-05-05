"use client";

import { Marker } from "react-map-gl/maplibre";
import { MapPin } from "lucide-react";
import type { Station } from "@/lib/types";

export default function SelectionMarker({ station }: { station: Station }) {
  return (
    <Marker
      longitude={station.longitude}
      latitude={station.latitude}
      anchor="bottom"
    >
      <div className="relative">
        <div className="absolute inset-0 -translate-y-1 animate-ping rounded-full bg-primary/40 blur-sm" />
        <MapPin className="relative h-8 w-8 fill-primary stroke-background drop-shadow-md" />
      </div>
    </Marker>
  );
}
