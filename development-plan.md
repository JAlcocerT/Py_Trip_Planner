# Development Plan — Trip Planner v3

## Repository Location

New project lives **inside** the current repo as a subfolder:

```
C:\Users\j--e-\Desktop\Py_Trip_Planner\
├── app/                        ← existing Dash app (v2, untouched)
├── poc-vibe-weather/           ← new project (this plan)
├── brd.md
├── development-plan.md
└── tech-stack.md
```

Internal folder structure of `poc-vibe-weather/`:

```
poc-vibe-weather/
├── frontend/               # Next.js 15 app
├── backend/                # FastAPI app
├── docker-compose.yml      # runs both containers together
└── .env.example            # documents required env vars
```

---

## Phase 1 — Project Scaffolding

**Goal:** Empty but runnable skeleton for both services, wired together in Docker Compose.

### 1.1 — Backend skeleton

```
backend/
├── app/
│   ├── main.py             # FastAPI app, CORS, GZipMiddleware
│   └── routers/
│       └── __init__.py
├── requirements.txt
└── Dockerfile
```

- `main.py` exposes a single `GET /health` → `{ "status": "ok" }`
- `Dockerfile`: `python:3.11-slim`, installs requirements, runs with `uvicorn`
- Dependencies: `fastapi`, `uvicorn[standard]`, `httpx`, `pydantic`

### 1.2 — Frontend skeleton

```
frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx            # placeholder "Trip Planner v3"
├── components/
├── lib/
├── public/
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── Dockerfile
```

- Bootstrapped with `create-next-app` (App Router, TypeScript, Tailwind)
- shadcn/ui initialised: `npx shadcn@latest init`
- `Dockerfile`: Node 20 builder → `node:20-alpine` runner

### 1.3 — Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
```

**Exit criteria:** `docker compose up` → frontend renders placeholder at `:3000`, backend returns `{ "status": "ok" }` at `:8000/health`.

---

## Phase 2 — Backend: Weather Endpoints

**Goal:** All three data endpoints working and returning correct shaped responses.

### 2.1 — Stations endpoint

File: `backend/app/routers/stations.py`

```
GET /api/stations
→ GeoJSON FeatureCollection
  properties per feature: id, name, country, elevation, lat, lon
```

- Calls `Stations().fetch()` from Meteostat
- Converts DataFrame to GeoJSON in Python
- Cached in-memory for 24 h (`fastapi-cache2` with `InMemoryBackend`)
- `GZipMiddleware` applied globally in `main.py`
- Dependencies added: `meteostat`, `fastapi-cache2`

### 2.2 — Historical weather endpoint

File: `backend/app/routers/weather.py`

```
GET /api/weather/historical
    ?station_id=&start=YYYY-MM-DD&end=YYYY-MM-DD
→ {
    station: { name, country, lat, lon, elevation },
    daily: [{ date, tmin, tmax, wspd, prcp }]
  }
```

- Uses `Daily(station_id, start, end).fetch()`
- Pydantic response models for the full response shape
- Returns 404 if station has no data for the requested range

### 2.3 — Forecast endpoint

File: `backend/app/routers/weather.py`

```
GET /api/weather/forecast
    ?lat=&lon=
→ {
    hourly: [{ time, temp, wind_speed, wind_dir, precip }],
    daily:  [{ date, sunrise, sunset }]
  }
```

- Uses `openmeteo-py` for hourly data + sunrise/sunset from the daily response
- Dependencies added: `openmeteo-py`

**Exit criteria:** All three endpoints return correct JSON when called with `curl` or the FastAPI docs at `:8000/docs`.

---

## Phase 3 — Frontend: Map

**Goal:** Interactive map where users can click to select a location or click a station dot.

### 3.1 — Base map

File: `frontend/components/map/TripMap.tsx`

- `react-map-gl` with MapLibre GL JS
- Tile source: OpenStreetMap (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Initial view: center `[25, 35]` (lon, lat), zoom 3
- Dependencies: `react-map-gl`, `maplibre-gl`

### 3.2 — Station coverage layer

File: `frontend/components/map/StationLayer.tsx`

- On mount, fetches `GET /api/stations` and loads the GeoJSON as a MapLibre source
- Renders as a `circle` paint layer (small dots, muted colour)
- Clustering enabled on the source (`cluster: true`, `clusterMaxZoom: 6`)
  - Clustered dots: larger circle + count label
  - Individual dots: smaller circle, highlights on hover
- Clicking a cluster → map flies and zooms to it
- Clicking an individual station dot → emits selected station up to page state

### 3.3 — Selection markers

File: `frontend/components/map/SelectionMarkers.tsx`

- When a station is selected (via dot click or free map click):
  - Primary marker at the station's exact lat/lon
  - Tooltip shows station name + coordinates
- Free click on the map (not on a dot) → calls the nearest-station lookup via the stations GeoJSON client-side (find closest Feature by Haversine distance — no extra API call needed since the full GeoJSON is already loaded)

**Exit criteria:** Map loads with station dots, clusters at low zoom, clicking a dot selects it with a marker.

---

## Phase 4 — Frontend: Charts

**Goal:** All three charts rendering real data from the backend.

### 4.1 — Historical weather chart

File: `frontend/components/charts/HistoricalChart.tsx`

- shadcn `<AreaChart>` (Recharts-based)
- Two area series: Tmin (cool colour) and Tmax (warm colour), filled between
- X-axis: date, Y-axis: °C
- Tooltip: date + Tmin + Tmax values
- shadcn components to add: `npx shadcn@latest add chart`

### 4.2 — Boxplot

File: `frontend/components/charts/BoxplotChart.tsx`

- Nivo `<ResponsiveBoxPlot>` (`@nivo/boxplot`)
- Groups by month name (Jan–Dec)
- Variable switchable via a shadcn `<Select>` (tmax, tmin, wspd, prcp)
- Nivo theme object derived from Tailwind CSS variables so colours stay consistent
- Dependencies: `@nivo/boxplot`, `@nivo/core`

### 4.3 — Forecast chart

File: `frontend/components/charts/ForecastChart.tsx`

- shadcn `<ComposedChart>` (Recharts)
- Bar series: precipitation
- Line series: apparent temperature
- Below the chart: a wind row — one cell per hour with an SVG arrow rotated by `wind_dir` and a speed label
- Day/night shading: grey background bands between sunset and sunrise using the `daily` response

**Exit criteria:** All three charts render with real data after selecting a station and date range.

---

## Phase 5 — Frontend: Controls & Layout

**Goal:** Date picker, variable selector, and station info panel wired up; full page layout matching the intended UX.

### 5.1 — Date picker

File: `frontend/components/controls/DateRangePicker.tsx`

- shadcn `<DatePickerWithRange>` (wraps `react-day-picker`)
- Max end date: today − 1 day
- On change → triggers historical data fetch

### 5.2 — Station info panel

File: `frontend/components/StationInfo.tsx`

- Shown when a station is selected
- Displays: station name, country, elevation (m), lat/lon
- Replaces the silent nearest-station lookup of v2 with visible feedback

### 5.3 — Page layout

File: `frontend/app/page.tsx`

```
┌─────────────────────────────────────────┐
│  Trip Planner                           │
├──────────────────┬──────────────────────┤
│                  │  Date range picker   │
│    Map           │  Variable selector   │
│  (station dots)  │  Station info panel  │
│                  │                      │
├──────────────────┴──────────────────────┤
│  Historical chart (area, Tmin/Tmax)     │
├──────────────────┬──────────────────────┤
│  Boxplot         │  Forecast chart      │
└──────────────────┴──────────────────────┘
```

- Responsive grid via Tailwind (`grid-cols-1` on mobile, `grid-cols-2` on desktop)
- shadcn `<Skeleton>` placeholders shown while data is fetching

### 5.4 — Location search

File: `frontend/components/controls/LocationSearch.tsx`

- shadcn `<Input>` with a floating suggestion list
- Calls Nominatim via the FastAPI backend proxy (avoids browser CORS with Nominatim)
- Backend route: `GET /api/geocode?q=` → proxies to `nominatim.openstreetmap.org`
- Selecting a result flies the map to those coordinates

**Exit criteria:** Full page is usable end-to-end — search a city, see stations, click one, pick dates, see all three charts.

---

## Phase 6 — URL State & Export

**Goal:** Views are shareable and data is downloadable.

### 6.1 — URL state

- Library: `nuqs`
- Encoded params: `station_id`, `start`, `end`, `variable`
- On load, if params present → restore selection and trigger data fetch automatically

### 6.2 — Export

- **Chart PNG:** Recharts `<ResponsiveContainer>` ref → `toBlob()` → download. Nivo boxplot uses SVG → `new XMLSerializer().serializeToString()` → download as `.svg`
- **CSV:** `GET /api/weather/historical` accepts `?format=csv` → FastAPI returns `StreamingResponse` with `text/csv` content type

---

## Phase 7 — Docker Compose & Homelab Deployment

**Goal:** Single `docker compose up` from `Trip_Planner_v3/` starts both services.

### 7.1 — Final Docker Compose

```yaml
services:
  backend:
    build: ./backend
    restart: unless-stopped
    ports: ["8000:8000"]

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on: [backend]
```

### 7.2 — Frontend production build

- `next build` + `next start` in the frontend Dockerfile (not dev server)
- Multi-stage build: Node 20 builder → `node:20-alpine` runner

### 7.3 — Environment

`.env.example`:
```
# No API keys required — all data sources are free and open
# Optionally override the internal API URL if using a reverse proxy
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Exit criteria:** `docker compose up --build` from a clean clone → both services healthy, full app usable in browser at `:3000`.

---

## Phase Summary

| Phase | Scope | Key deliverable |
|-------|-------|----------------|
| 1 | Scaffolding | Both containers running, Docker Compose wired |
| 2 | Backend endpoints | `/stations`, `/historical`, `/forecast` returning real data |
| 3 | Map | Station dot layer with clustering, click-to-select |
| 4 | Charts | Historical area chart, Nivo boxplot, forecast chart |
| 5 | Controls & layout | Date picker, station panel, location search, full page |
| 6 | URL state & export | Shareable URLs, PNG/SVG/CSV download |
| 7 | Deployment | Production Docker Compose for homelab |
