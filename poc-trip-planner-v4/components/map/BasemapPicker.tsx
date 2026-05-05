"use client";

import type { StyleSpecification } from "maplibre-gl";

export type BasemapKey = "osm" | "carto-voyager" | "carto-dark";

const osmStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm" }],
};

const cartoStyle = (path: string): StyleSpecification => ({
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        `https://a.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
        `https://b.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
        `https://c.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
        `https://d.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
      maxzoom: 19,
    },
  },
  layers: [{ id: "carto-tiles", type: "raster", source: "carto" }],
});

export const BASEMAPS: Record<BasemapKey, StyleSpecification> = {
  osm: osmStyle,
  "carto-voyager": cartoStyle("rastertiles/voyager"),
  "carto-dark": cartoStyle("rastertiles/dark_all"),
};

const LABELS: Record<BasemapKey, string> = {
  osm: "OSM",
  "carto-voyager": "Voyager",
  "carto-dark": "Dark",
};

interface Props {
  value: BasemapKey;
  onChange: (k: BasemapKey) => void;
}

export default function BasemapPicker({ value, onChange }: Props) {
  return (
    <div className="glass flex gap-1 rounded-md p-1 text-xs shadow-md">
      {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-sm px-2 py-1 font-medium transition-colors ${
            value === k
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABELS[k]}
        </button>
      ))}
    </div>
  );
}
