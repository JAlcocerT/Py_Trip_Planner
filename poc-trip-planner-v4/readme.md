# poc-trip-planner-v4

Pure Node port of `poc-vibe-weather`. No Python. One Next.js app. Cooler UI.

See `brd.md` + `development-plan.md`.

## Dev

```sh
cd poc-trip-planner-v4
npm install
npm run dev
```

Open http://localhost:3000

## Production (Docker)

```sh
docker compose up --build
```

Single container on `:3000`. No env vars required.

## API

| Route | Purpose |
|---|---|
| `GET /api/stations` | All Meteostat stations as GeoJSON (24h cached) |
| `GET /api/stations/:id` | Single station metadata |
| `GET /api/stations/nearest?lat=&lon=` | Nearest station by Haversine |
| `GET /api/weather/historical?station_id=&start=&end=` | Daily Tmin/Tmax/wspd/prcp |
| `GET /api/weather/historical/csv?...` | Same as CSV download |
| `GET /api/weather/forecast?lat=&lon=` | 7-day Open-Meteo forecast (FlatBuffers) |
| `GET /api/geocode?q=` | Nominatim proxy |

## Stack

- Next.js 15 App Router + React 19 + TypeScript
- Route Handlers (Node runtime) — no FastAPI, no Python
- `openmeteo` npm pkg (FlatBuffers)
- Meteostat bulk JSON/CSV via `undici` `fetch` + `zlib.gunzip`
- `lru-cache` for station catalogue + daily data
- `zod` for input validation
- shadcn/ui + Tailwind, Framer Motion, next-themes
- MapLibre GL via `react-map-gl`
- Recharts (line, area, composed) + Nivo BoxPlot
- nuqs for URL state
- `html-to-image` for PNG export
