# Tech Stack — Trip Planner v4

Single Node.js app. No Python. Next.js Route Handlers replace FastAPI.

> shadcn/ui + Framer Motion + glass cards for the polish.

---

## Core

| Layer | Choice | Version | Why |
|-------|--------|---------|-----|
| Runtime | Node.js | 22 (alpine) | LTS, native `fetch` + `zlib`, fast |
| Framework | Next.js | ^15.5 | App Router, RSC, Route Handlers = backend in same repo |
| Language | TypeScript | ^5.7 | End-to-end types with Zod |
| UI lib | React | ^19 | Server Components + hooks |
| Styling | Tailwind CSS | ^3.4 | Token-driven theme, dark mode for free |
| Component primitives | shadcn/ui (Radix) | latest | Headless, accessible, copy-in source |
| Theme switch | next-themes | ^0.4 | OS-aware dark/light, no FOUC |
| Animation | Framer Motion | ^11 | Card stagger, weather background, marker pulse |
| Font | Geist Sans + Mono | ^1.3 | Sharp UI, monospace coords |
| Icons | lucide-react + react-icons | latest | Lucide for UI, react-icons for weather glyphs |

---

## Data + APIs

| Concern | Choice | Version | Notes |
|---------|--------|---------|-------|
| Forecast | `openmeteo` (npm) | ^1.1 | Official SDK, FlatBuffers decode — faster than JSON |
| Historical weather | Meteostat bulk JSON/CSV via `fetch` + `zlib.gunzip` | — | No Python `meteostat` needed; bulk endpoints + cache |
| Geocoding | Nominatim (proxied) | — | Free, no token, custom UA header |
| Tile basemaps | OSM, CARTO Voyager, CARTO Dark Matter | — | All free, no API key |
| Cache | `lru-cache` | ^11 | In-memory, 24 h stations, 6 h daily |
| Validation | `zod` | ^3 | Query params + upstream payload parsing |
| URL state | `nuqs` | ^2 | Shareable links: sid, lat, lon, dates, var |

---

## Map + Charts

| Use | Library | Version | Why |
|-----|---------|---------|-----|
| Map | `react-map-gl` + `maplibre-gl` | ^7 / ^4 | WebGL, GeoJSON clustering, no token |
| Area / line / composed charts | Recharts | ^2.14 | Tmin/Tmax gradient area, dual-axis forecast |
| Box plot | `@nivo/boxplot` | ^0.99 | Only React-first lib with native production boxplot |
| Color scale | `d3-scale` + `d3-scale-chromatic` | ^4 / ^3 | Temperature → color gradient |
| Date picker | `react-day-picker` + `date-fns` | ^9 / ^4 | shadcn-style range picker |
| PNG export | `html-to-image` | ^1.11 | One call, captures whole chart card |

---

## Backend (Route Handlers, not a separate process)

| Endpoint | Source |
|----------|--------|
| `GET /api/stations` | Meteostat bulk catalogue → GeoJSON, gzipped, 24 h LRU |
| `GET /api/stations/[id]` | Catalogue lookup |
| `GET /api/stations/nearest` | Haversine on cached catalogue |
| `GET /api/weather/historical` | Meteostat daily CSV.gz, range filter |
| `GET /api/weather/historical/csv` | Same, streamed as text/csv attachment |
| `GET /api/weather/forecast` | `openmeteo` SDK, 7-day, FlatBuffers |
| `GET /api/geocode` | Nominatim proxy with custom UA |

---

## Deploy

| Piece | Choice |
|-------|--------|
| Container | Multi-stage `node:22-alpine`, Next `output: "standalone"` |
| Orchestration | `docker compose up --build` |
| Port | 3000 |
| Env | none required |
| CI | (TODO) GitHub Actions, multi-arch GHCR build |

---

## Python → Node mapping (vs v3)

| v3 (Python) | v4 (Node) |
|-------------|-----------|
| FastAPI | Next.js Route Handlers |
| `openmeteo-py` | `openmeteo` (FlatBuffers) |
| `meteostat` | Meteostat bulk via `fetch` + `zlib.gunzip` |
| Pydantic | `zod` |
| `httpx` | native `fetch` (undici under the hood) |
| `pandas` | (none needed — JS array filter / map covers it) |
| in-process dict cache | `lru-cache` |
| `GZipMiddleware` | Next built-in compression + `Content-Encoding` |

One language. One container. Same features, prettier UI.