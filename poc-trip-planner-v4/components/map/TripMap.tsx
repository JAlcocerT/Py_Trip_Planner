"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import StationLayer from "./StationLayer";
import SelectionMarker from "./SelectionMarker";
import BasemapPicker, { BASEMAPS, type BasemapKey } from "./BasemapPicker";
import { nearestStation } from "@/lib/geo";
import type { Station } from "@/lib/types";

export interface FlyToTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

interface TripMapProps {
  onStationSelect: (station: Station) => void;
  selectedStation: Station | null;
  flyTo?: FlyToTarget | null;
}

export default function TripMap({
  onStationSelect,
  selectedStation,
  flyTo,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [basemap, setBasemap] = useState<BasemapKey>("osm");

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 8,
      duration: 800,
    });
    if (geojson) {
      const station = nearestStation(flyTo.lat, flyTo.lng, geojson);
      if (station) onStationSelect(station);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo ? `${flyTo.lat},${flyTo.lng}` : null]);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeojson(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const features = event.features ?? [];

      if (features.length === 0) {
        if (!geojson) return;
        const { lat, lng } = event.lngLat;
        const station = nearestStation(lat, lng, geojson);
        if (station) onStationSelect(station);
        return;
      }

      const feature = features[0];

      if (feature.layer?.id === "clusters") {
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        mapRef.current?.flyTo({
          center: coords,
          zoom: Math.min((mapRef.current.getZoom() ?? 3) + 3, 10),
          duration: 600,
        });
        return;
      }

      if (feature.layer?.id === "station-dots") {
        const p = feature.properties as Record<string, unknown>;
        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        onStationSelect({
          id: String(p.id),
          name: String(p.name ?? ""),
          country: String(p.country ?? ""),
          elevation: p.elevation != null ? Number(p.elevation) : null,
          latitude: coords[1],
          longitude: coords[0],
        });
      }
    },
    [geojson, onStationSelect]
  );

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/60 shadow-lg" style={{ height: "55vh", minHeight: 360 }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 text-sm text-muted-foreground backdrop-blur-sm">
          Loading station catalogue…
        </div>
      )}

      <Map
        ref={mapRef}
        mapStyle={BASEMAPS[basemap]}
        initialViewState={{ longitude: 25, latitude: 35, zoom: 3 }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleClick}
        interactiveLayerIds={["clusters", "station-dots"]}
        cursor="crosshair"
      >
        <NavigationControl position="top-right" />
        {geojson && <StationLayer geojson={geojson} />}
        {selectedStation && <SelectionMarker station={selectedStation} />}
      </Map>

      <div className="absolute left-3 top-3 z-10">
        <BasemapPicker value={basemap} onChange={setBasemap} />
      </div>
    </div>
  );
}
