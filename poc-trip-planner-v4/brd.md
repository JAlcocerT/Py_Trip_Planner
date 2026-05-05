# Business Requirements Document — Trip Planner v4

Port `poc-vibe-weather` (Next.js + FastAPI/Python) to a **single Node.js stack** with no Python runtime, and lift the UI to a richer, more polished feel. Feature parity with v3 plus a meaningful visual upgrade. AI/LLM features stay out of scope.

---

## Goals

| Goal | Why |
|------|-----|
| Drop Python entirely | One language, one runtime, one container, simpler ops on homelab |
| Same features as v3 | No regression — map, historical chart, monthly boxplot, 7-day forecast, geocoding, URL state, exports |
| Cooler UI | v3 is functional but flat — v4 should feel modern: motion, depth, glassmorphism, dark mode polish, animated weather backgrounds |
| Same deploy story | One `docker compose up`, optionally split into `web` + `api` services |

---

## Architecture

```
Browser (Next.js 15 App Router, RSC + client islands)
        │
        ├── Map interaction          → MapLibre GL JS (client only)
        ├── Charts                   → Recharts + Nivo + Visx (client only)
        ├── Motion / transitions     → Framer Motion
        └── Data fetching            → Next.js Route Handlers (Node runtime)
                                        ├── /api/stations
                                        ├── /api/stations/[id]
                                        ├── /api/stations/nearest
                                        ├── /api/weather/historical
                                        ├── /api/weather/historical/csv
                                        ├── /api/weather/forecast
                                        └── /api/geocode
```

**One Next.js app.** Route Handlers replace FastAPI. No separate backend process. Optional split into a Fastify worker only if the cold start hurts on the homelab — default is single container.

---

## Stack — Python → Node mapping

| Concern | v3 (Python) | v4 (Node) | Notes |
|---|---|---|---|
| Web framework | FastAPI | **Next.js 15 Route Handlers** | RSC for static shell, client islands for map/charts |
| Forecast API client | `openmeteo-py` | **`openmeteo`** (npm) | Official SDK, FlatBuffers decode, faster than JSON |
| Historical weather | `meteostat` (Python) | **`meteostat-js`** + raw `fetch` to Meteostat JSON API | No 1:1 Node port of the full Python lib; JSON API covers stations/daily |
| DataFrame ops | `pandas` | **`arquero`** (Tableau) or **`danfo.js`** | Arquero is lighter, faster, more pandas-like for grouping/aggregation |
| Numeric / stats | `numpy` | **`@stdlib/stats`** + **`mathjs`** for matrix bits | `numjs` only if true ndarray slicing is needed; not required for box-plot percentiles |
| Geocoding proxy | `httpx` → Nominatim | `fetch` → Nominatim | Same upstream, server-side proxy to keep CORS happy and add UA header |
| Schema validation | Pydantic | **Zod** | Validate request params + parse upstream payloads |
| HTTP client | `httpx` | **`undici`** (built into Node) | Native, fast, cancellable |
| Caching (stations 24 h) | in-process dict | **`lru-cache`** in module scope, optional **Upstash Redis** for multi-instance | Single homelab container = in-memory is fine |
| Compression | `GZipMiddleware` | Next.js built-in / `compression` middleware | Gzip on `/api/stations` (~1 MB gzipped) |
| Type safety | Pydantic | TypeScript + Zod | End-to-end types via inferred Zod schemas |

---

## Feature Parity (v3 → v4)

### Map
- MapLibre GL JS via `react-map-gl/maplibre` (same as v3)
- OSM raster tiles, no token
- Station GeoJSON loaded once, clustered (`cluster: true`, `clusterMaxZoom: 6`, `clusterRadius: 50`)
- Click empty area → nearest-station lookup (Haversine on the loaded GeoJSON, **client-side** — no server roundtrip)
- Click cluster → flyTo zoom-in
- Click station dot → select + fetch weather

### Historical chart
- Recharts `<AreaChart>` — Tmin / Tmax dual area with gradient fills
- ~12 X-axis ticks across any date range
- Tooltip with formatted date + °C

### Monthly distribution boxplot
- Nivo `<ResponsiveBoxPlot>` — only React-first lib with a production boxplot
- Variable selector: `tmax` | `tmin` | `wspd` | `prcp`
- Custom tooltip with P10/Q1/Median/Q3/P90/min/max/mean/n
- Cast `theme as any` to dodge the known Nivo generic-type bug (already done in v3)

### Forecast chart
- Recharts `<ComposedChart>` — temperature line + precipitation bar, dual Y-axis
- Night shading via `<ReferenceArea>` between sunset → sunrise
- Wind arrow row (every 6 h) below the chart, rotated by `winddirection_10m`

### Date range picker
- shadcn `<DatePickerWithRange>` (react-day-picker under the hood)
- Future dates disabled

### Location search
- Debounced (350 ms) input → Nominatim via `/api/geocode` proxy
- Floating suggestion list, flyTo on select, auto-pick nearest station

### URL state
- `nuqs` — `sid`, `lat`, `lon`, `name`, `country`, `start`, `end`, `var`
- Shareable links restore full view

### Exports
- PNG: `html-to-image` (replaces v3's chart export)
- CSV: `/api/weather/historical/csv` route handler streaming `text/csv`

---

## UI Upgrades (the "cooler" part)

| Upgrade | What | Library |
|---|---|---|
| Animated weather background | Subtle gradient that shifts based on selected station's current condition (sunny → warm gradient, rainy → cool blue with drifting droplets) | Framer Motion + canvas |
| Glass cards | Frosted-glass chart cards with backdrop blur, soft shadow, 1 px border | Tailwind `backdrop-blur` + custom shadow tokens |
| Motion | Page-load stagger on cards, smooth chart mount, flyTo with eased pan | Framer Motion |
| Theme | Dark by default with system toggle; OKLCH color tokens for richer accents | shadcn theme + `next-themes` |
| Typography | Geist Sans + Geist Mono (already shipped with Next 15) | `geist` package |
| Map skin | Switchable basemap: OSM (default), Carto Voyager, Stadia Stamen Toner — picker top-right | MapLibre style swap |
| 3D terrain toggle | MapLibre `terrain` source using AWS open elevation tiles when zoomed in | Built-in MapLibre |
| Hero radial loader | Replace plain skeleton with shimmering radial pulse | CSS keyframes |
| Sticky station chip | When scrolling past the map, station name + temp pin to the top bar | `position: sticky` |
| Weather icons | Lucide icons swapped for `react-icons/wi` (Weather Icons) on the forecast row | `react-icons` |
| Number tickers | Animated count-up on temperature/elevation values | `framer-motion` `useMotionValue` |
| Color scale | Temperature-aware line colors (cold blue → hot red gradient on the area stroke) | D3 `scaleSequential` + `interpolateRdBu` |
| Sound toggle (optional) | Subtle ambient loop matching weather (off by default) | `<audio>` |

---

## Route Handlers

```ts
// app/api/stations/route.ts
GET /api/stations
  → GeoJSON FeatureCollection (cached 24 h, gzipped)

GET /api/stations/[id]
  → { id, name, country, latitude, longitude, elevation }

GET /api/stations/nearest?lat=&lon=
  → nearest station + distance_km (Haversine)

GET /api/weather/historical?station_id=&start=&end=
  → { station, daily: [{date, tmin, tmax, wspd, prcp}] }

GET /api/weather/historical/csv?station_id=&start=&end=
  → text/csv stream, Content-Disposition: attachment

GET /api/weather/forecast?lat=&lon=
  → { hourly: [{time, temp, wind_speed, wind_dir, precip}], daily: [{date, sunrise, sunset}] }
  // Uses `openmeteo` npm pkg with FlatBuffers

GET /api/geocode?q=
  → [{ display_name, lat, lon }]  // Nominatim proxy, custom UA
```

All inputs validated with Zod. All responses typed via inferred Zod schemas, shared with the client through a `lib/types.ts` re-export.

---

## Open-Meteo usage (Node)

```ts
import { fetchWeatherApi } from "openmeteo";

const params = {
  latitude: lat,
  longitude: lon,
  hourly: ["apparent_temperature", "precipitation", "windspeed_10m", "winddirection_10m"],
  daily: ["sunrise", "sunset"],
  timezone: "auto",
  forecast_days: 7,
};

const responses = await fetchWeatherApi("https://api.open-meteo.com/v1/forecast", params);
const response = responses[0];
const hourly = response.hourly()!;
// FlatBuffers decode — pull typed arrays directly, no JSON parse cost
```

---

## Meteostat usage (Node)

No full Node port of the Python `meteostat` library. Two paths:

1. **`meteostat-js`** for the JSON API endpoints we need (stations metadata, daily by station).
2. **Direct `fetch`** to Meteostat's bulk station catalogue (`https://bulk.meteostat.net/v2/stations/full.json.gz`) for the one-shot 24 h cache. Gunzip with Node's `zlib`, parse, transform to GeoJSON in-memory, hold in `lru-cache`.

This avoids the FastAPI round-trip in v3 entirely.

---

## Project layout

```
poc-trip-planner-v4/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       ├── stations/route.ts
│       ├── stations/[id]/route.ts
│       ├── stations/nearest/route.ts
│       ├── weather/
│       │   ├── historical/route.ts
│       │   ├── historical/csv/route.ts
│       │   └── forecast/route.ts
│       └── geocode/route.ts
├── components/
│   ├── charts/        (HistoricalChart, BoxplotChart, ForecastChart)
│   ├── controls/      (DateRangePicker, VariableSelect, LocationSearch, BasemapPicker, ThemeToggle)
│   ├── map/           (TripMap, StationLayer, SelectionMarker, TerrainToggle)
│   ├── ui/            (shadcn primitives)
│   ├── StationInfo.tsx
│   └── WeatherBackground.tsx     (animated gradient + particles)
├── hooks/             (useHistoricalData, useForecastData, useStations)
├── lib/
│   ├── types.ts
│   ├── schemas.ts     (Zod)
│   ├── geo.ts         (Haversine, nearestStation)
│   ├── cache.ts       (lru-cache wrappers)
│   ├── meteostat.ts   (station catalogue loader)
│   └── exportChart.ts
├── public/
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Dependencies (package.json highlights)

```json
{
  "dependencies": {
    "next": "15.x",
    "react": "^19",
    "react-dom": "^19",
    "openmeteo": "^1",
    "meteostat-js": "^0",
    "arquero": "^7",
    "@stdlib/stats": "^0",
    "lru-cache": "^11",
    "undici": "^6",
    "zod": "^3",
    "nuqs": "^2",
    "react-map-gl": "^7",
    "maplibre-gl": "^4",
    "recharts": "^2",
    "@nivo/core": "^0.87",
    "@nivo/boxplot": "^0.87",
    "framer-motion": "^11",
    "next-themes": "^0.4",
    "react-day-picker": "^9",
    "date-fns": "^4",
    "lucide-react": "^0.469",
    "react-icons": "^5",
    "html-to-image": "^1",
    "d3-scale": "^4",
    "d3-scale-chromatic": "^3",
    "geist": "^1",
    "tailwindcss": "^3",
    "tailwindcss-animate": "^1",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2"
  }
}
```

---

## Deployment

```sh
docker compose up --build
```

- Single Node 22 alpine image, multi-stage build (`next build` → `next start`)
- Port `3000`
- No `.env` needed for core features (no API keys for OSM/Meteostat/Open-Meteo)
- Optional: `REDIS_URL` if multi-instance caching ever needed

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

One container. No Python. No FastAPI. No `uv sync`.

---

## Migration checklist (v3 → v4)

- [ ] Scaffold Next.js 15 app in `poc-trip-planner-v4/`
- [ ] Port shadcn primitives + Tailwind config from v3
- [ ] Port chart components 1:1 (`HistoricalChart`, `BoxplotChart`, `ForecastChart`)
- [ ] Port map components 1:1 (`TripMap`, `StationLayer`, `SelectionMarker`)
- [ ] Replace FastAPI routers with Route Handlers (`app/api/.../route.ts`)
- [ ] Implement Meteostat station catalogue loader (gunzip + cache)
- [ ] Wire `openmeteo` npm pkg in `/api/weather/forecast`
- [ ] Add Zod schemas + shared types
- [ ] Add Framer Motion page transitions + card stagger
- [ ] Add `WeatherBackground` animated gradient
- [ ] Add basemap picker + terrain toggle
- [ ] Add temperature-scale color line on historical chart
- [ ] Dark-mode polish + theme toggle
- [ ] Dockerfile + compose
- [ ] Smoke test parity vs v3

---

## Out of scope for v4

- Chat assistant / LLM features
- Auth / user accounts
- Saved trips / persistence
- Native mobile app
- Multi-station comparison view (candidate for v5)
