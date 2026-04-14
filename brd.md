# Business Requirements Document — Trip Planner v3

Modernise the existing Dash application with a proper frontend/backend split and current UI tooling, while keeping every user-facing feature intact. AI/LLM features are out of scope for this version.

---

## Problem with the Current Stack

| Pain point | Detail |
|-----------|--------|
| Dash is a bottleneck | Every UI interaction roundtrips to the Python server; no client-side reactivity |
| Plotly charts feel dated | Heavy bundle, limited theming, poor mobile behaviour |
| Blind map clicks | Users cannot tell where historical data actually exists before clicking |
| Single-process server | Dash dev server is not production-grade |
| No type safety | Python callbacks are stringly-typed; refactoring is fragile |

---

## Proposed Architecture

```
Browser (Next.js + shadcn/ui)
        │
        ├── Map interaction  →  client-side only (MapLibre GL)
        ├── Chart rendering  →  client-side only (shadcn / Nivo)
        └── API calls
              ├── /api/stations              ─┐
              ├── /api/weather/historical    ├── FastAPI (Python)
              └── /api/weather/forecast     ─┘
```

**Frontend:** Next.js 15 (App Router) + TypeScript  
**UI system:** shadcn/ui + Tailwind CSS  
**Backend:** FastAPI — thin layer over Meteostat and OpenMeteo  
**Deployment:** Vercel (frontend) + Railway / Fly.io / Docker (backend)

---

## Feature Parity Requirements

### Map
- **Current:** dash-leaflet, click to select location, marker + nearest station circle
- **v3:** MapLibre GL JS via `react-map-gl`
  - Marker at clicked point; secondary marker at nearest station
  - Client-side — no server roundtrip for map interaction
  - OpenStreetMap tiles (free, no token needed)

### Historical Weather Chart
- **Current:** Plotly line chart, Tmin/Tmax over selected date range
- **v3:** shadcn `<AreaChart>` (Recharts-based)
  - Dual-line Tmin / Tmax with a fill band between them
  - Tooltip on hover with exact values + date
  - Theming via Tailwind CSS variables — dark mode for free
  - https://ui.shadcn.com/charts/area#charts

### Boxplot / Distribution Chart
- **Current:** Plotly `px.box()` grouped by month, dropdown to switch variable
- **v3:** **Nivo `<ResponsiveBoxPlot>`** (`@nivo/boxplot`)
  - Nivo is chosen because it is the only React-first charting library with a native, production-ready BoxPlot component — Recharts does not have one and Observable Plot requires a manual React wrapper
  - Groups by month, same as today
  - Variable selector becomes a shadcn `<Select>` component (tmax, tmin, wspd, prcp)
  - Nivo theme tokens map cleanly to Tailwind CSS variables so it stays visually consistent with the rest of the UI

### Forecast Chart
- **Current:** Plotly dual-axis (temperature + wind, 7-day hourly)
- **v3:** shadcn `<ComposedChart>`
  - Bar series for precipitation, line for temperature
  - Wind direction + speed as an icon row below the chart (arrow rotated by `winddirection_10m`)
  - Day/night shading using sunrise/sunset times (OpenMeteo provides these in the daily response)

### Date Picker
- **Current:** `dcc.DatePickerRange`
- **v3:** shadcn `<DatePickerWithRange>` (wraps react-day-picker)
  - Future dates disabled for the historical picker
  - Forecast section has no date picker — always "next 7 days"

---

## New Features

### Station Coverage Map

**Problem:** In v2, users click anywhere on the map hoping data exists nearby. There is no visual indication of where Meteostat has historical coverage.

**Solution:** On app load, render all Meteostat stations as a dot layer on the map. Clicking any dot selects that station directly — no nearest-station lookup needed.

**How it works:**

```
GET /api/stations
    → GeoJSON FeatureCollection
      each Feature: { geometry: Point, properties: { id, name, country, elevation, lat, lon } }
```

- Backend calls `Stations().fetch()` once and returns the full station list as GeoJSON.
- Response is cached (e.g. 24 h) — the station catalogue changes rarely.
- Frontend loads the GeoJSON into a MapLibre `circle` layer.
- **Clustering** via MapLibre's built-in `cluster: true` source option — at low zoom levels dots merge into numbered clusters; they split into individual dots as the user zooms in.
- Clicking a cluster zooms to it; clicking an individual station dot:
  - Places the selection marker at that station's exact lat/lon
  - Populates a station info panel (name, country, elevation, distance)
  - Triggers the weather data fetch immediately

**Station info panel** (currently hidden in v2):
- Station name and country
- Elevation (m)
- WMO / ICAO identifiers if available
- Distance from the originally clicked point

**Benefit:** Users can visually scan for coverage before committing to a location. Sparse regions (open ocean, polar areas) are immediately obvious.

### Location Search
Type a city name to fly the map to that location, then pick a nearby station dot.
- Geocoder: Nominatim (free, no token) via a backend proxy to avoid CORS
- Renders as a shadcn `<Input>` with a floating suggestion list

### URL State
Encode selected station, date range, and active variable in the URL query string.
- A specific view is shareable and survives a browser refresh
- Implemented with `nuqs` (Next.js URL state library)

### Export
- Download active chart as PNG (Recharts / Nivo both support canvas export)
- Download raw data as CSV from the backend endpoint

### Progressive Loading
Skeleton placeholders for each chart while data fetches — no blank space.

---

## Backend (FastAPI)

```
GET /api/stations
    → GeoJSON FeatureCollection of all Meteostat stations
      (cached 24 h, ~70 k features, ~8 MB uncompressed / ~1 MB gzipped)

GET /api/weather/historical
    ?station_id=&start=&end=
    → { station: { name, lat, lon, elevation }, daily: [{date, tmin, tmax, wspd, prcp}] }

GET /api/weather/forecast
    ?lat=&lon=
    → { hourly: [{time, temp, wind_speed, wind_dir, precip}], daily: [{sunrise, sunset}] }
```

- Pydantic models for all request/response shapes
- `httpx.AsyncClient` for async calls to Meteostat and OpenMeteo
- GeoJSON station response cached with `fastapi-cache2` (Redis or in-memory)
- CORS configured for the Next.js origin
- Gzip compression on the stations endpoint

---

## Tech Stack Summary

| Layer | Current | v3 |
|-------|---------|-----|
| Frontend framework | Dash 2.7 | Next.js 15 (App Router) |
| Language | Python only | TypeScript (FE) + Python (BE) |
| UI components | Bootstrap + Dash components | shadcn/ui + Tailwind CSS |
| Line / area charts | Plotly | shadcn charts (Recharts) |
| Box plot | Plotly | Nivo `@nivo/boxplot` |
| Map | dash-leaflet (Leaflet.js) | react-map-gl (MapLibre GL) |
| Station coverage | None | MapLibre GeoJSON layer + clustering |
| Backend | Dash server (callbacks) | FastAPI |
| Historical weather | Meteostat 1.6.8 | Meteostat (same) |
| Forecast weather | openmeteo-py | openmeteo-py (same) |
| URL state | None | nuqs |
| Deployment | Docker (single container) | Vercel + Docker (backend only) |
| Type safety | None | TypeScript + Pydantic |

---

## Decisions

| Topic | Decision |
|-------|----------|
| Station payload | Accepted as-is. ~8 MB uncompressed is fine for a personal homelab instance with infrequent use. Serve gzipped by default (FastAPI does this automatically with `GZipMiddleware`). |
| Map tiles | OpenStreetMap. No API key, no token, no third-party dependency. |
| Backend hosting | Self-hosted containers on the homelab. Docker Compose, same pattern as the current deployment. No external cloud hosting needed. |
| Folder / repo name | **`Trip_Planner_v3`** — drops the `Py_` prefix (no longer Python-only) and makes the lineage clear. |

---

## Out of Scope for v3

- Chat assistant and all LLM/AI features
- LangChain / LlamaIndex DataFrame agents
- Authentication / user accounts
- Persisting saved locations
- Mobile-native app
