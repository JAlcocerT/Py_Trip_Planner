"use client";

import { Source, Layer } from "react-map-gl/maplibre";
import type { CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";

interface StationLayerProps {
  geojson: GeoJSON.FeatureCollection;
}

const clusterCircle: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: "stations",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#3b82f6",
    "circle-radius": ["step", ["get", "point_count"], 16, 100, 22, 750, 30],
    "circle-opacity": 0.85,
  },
};

const clusterCount: SymbolLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: "stations",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Open Sans Bold"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const stationDots: CircleLayerSpecification = {
  id: "station-dots",
  type: "circle",
  source: "stations",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": 4,
    "circle-color": "#64748b",
    "circle-stroke-width": 1,
    "circle-stroke-color": "#ffffff",
    "circle-opacity": 0.7,
  },
};

export default function StationLayer({ geojson }: StationLayerProps) {
  return (
    <Source
      id="stations"
      type="geojson"
      data={geojson}
      cluster
      clusterMaxZoom={6}
      clusterRadius={50}
    >
      <Layer {...clusterCircle} />
      <Layer {...clusterCount} />
      <Layer {...stationDots} />
    </Source>
  );
}
