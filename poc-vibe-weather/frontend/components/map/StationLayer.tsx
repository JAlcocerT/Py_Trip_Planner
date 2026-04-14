"use client";

import { Source, Layer } from "react-map-gl/maplibre";
import type { CircleLayerSpecification } from "maplibre-gl";

interface StationLayerProps {
  geojson: GeoJSON.FeatureCollection;
}

// Outer ring — size encodes cluster magnitude, no text needed
const clusterRing: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: "stations",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#3b82f6",
    "circle-radius": ["step", ["get", "point_count"], 14, 100, 20, 750, 28],
    "circle-opacity": 0.25,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#3b82f6",
  },
};

// Inner dot for clusters
const clusterDot: CircleLayerSpecification = {
  id: "cluster-dot",
  type: "circle",
  source: "stations",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#3b82f6",
    "circle-radius": ["step", ["get", "point_count"], 6, 100, 9, 750, 13],
    "circle-opacity": 0.9,
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
      <Layer {...clusterRing} />
      <Layer {...clusterDot} />
      <Layer {...stationDots} />
    </Source>
  );
}
