"use client";

import { Marker, Popup } from "react-map-gl/maplibre";
import { useState } from "react";
import type { Station } from "@/lib/types";

interface SelectionMarkerProps {
  station: Station;
}

export default function SelectionMarker({ station }: SelectionMarkerProps) {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <>
      <Marker
        longitude={station.longitude}
        latitude={station.latitude}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup((v) => !v);
        }}
      >
        {/* Custom pin */}
        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-pointer" />
      </Marker>

      {showPopup && (
        <Popup
          longitude={station.longitude}
          latitude={station.latitude}
          anchor="bottom"
          offset={24}
          closeOnClick={false}
          onClose={() => setShowPopup(false)}
          className="text-sm"
        >
          <div className="p-1 space-y-0.5">
            <p className="font-semibold">{station.name}</p>
            <p className="text-muted-foreground text-xs">{station.country}</p>
            {station.elevation != null && (
              <p className="text-xs">{station.elevation} m</p>
            )}
            {station.distance_km != null && (
              <p className="text-xs text-muted-foreground">
                {station.distance_km} km away
              </p>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
