# Development Plan — Trip Planner v4

Pure Node port of `poc-vibe-weather`. One Next.js app. No Python. Cooler UI.

---

## Phases

| Phase | Goal | Exit criteria |
|---|---|---|
| 0 | Scaffold | `npm run dev` boots empty page on :3000 |
| 1 | Backend routes | All 7 route handlers return shape-valid JSON |
| 2 | Map + selection | Click station dot → state set, info panel renders |
| 3 | Charts | Historical, boxplot, forecast all render real data |
| 4 | Controls | Date picker, var select, location search, URL state |
| 5 | UI polish | Animated bg, glass cards, motion, theme toggle |
| 6 | Export + extras | PNG, CSV, basemap picker, terrain toggle |
| 7 | Ship | Dockerfile, compose, parity smoke test vs v3 |

---

## Phase 0 — Scaffold (~30 min)

```
poc-trip-planner-v4/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json          # shadcn config
├── app/
│   ├── layout.tsx
│   ├── page.tsx             # placeholder
│   └── globals.css
└── public/
```

- Node 22, Next 15 App Router, React 19, TS strict
- Tailwind 3 + shadcn theme tokens (OKLCH)
- `next-themes` wired in `layout.tsx`
- nuqs `<NuqsAdapter>` provider in layout

Commands:
```sh
npm install
npm run dev   # http://localhost:3000
```

---

## Phase 1 — Route handlers (~1.5 h)

Order:
1. `lib/cache.ts` — `lru-cache` wrapper, 24 h TTL
2. `lib/schemas.ts` — Zod for query params + responses
3. `lib/meteostat.ts` — gunzip bulk catalogue → in-memory map (id → station), GeoJSON builder
4. `app/api/stations/route.ts` — GeoJSON FC, gzipped
5. `app/api/stations/[id]/route.ts` — single station
6. `app/api/stations/nearest/route.ts` — Haversine on cached catalogue
7. `app/api/weather/historical/route.ts` — Meteostat daily JSON API by station_id
8. `app/api/weather/historical/csv/route.ts` — same, stream `text/csv`
9. `app/api/weather/forecast/route.ts` — `openmeteo` npm pkg, FlatBuffers
10. `app/api/geocode/route.ts` — Nominatim proxy, custom UA

Smoke check each via `curl http://localhost:3000/api/...`.

**Risk:** Meteostat bulk catalogue URL availability. Fallback: Open-Meteo geocoding API + manual station seed list.

---

## Phase 2 — Map + selection (~2 h)

Files:
- `lib/types.ts` — Station, DailyRecord, ForecastResponse, BoxplotVariable
- `lib/geo.ts` — `nearestStation(lat, lon, geojson)` Haversine
- `components/map/TripMap.tsx`
- `components/map/StationLayer.tsx` — clustering, ring + dot + outline layers
- `components/map/SelectionMarker.tsx`
- `components/StationInfo.tsx`

Direct port of v3 components. Dynamic import `TripMap` (no SSR).

Verify: click empty area picks nearest, click cluster zooms, click dot selects.

---

## Phase 3 — Charts (~2 h)

Files:
- `hooks/useHistoricalData.ts` — fetch `/api/weather/historical`
- `hooks/useForecastData.ts` — fetch `/api/weather/forecast`
- `components/charts/HistoricalChart.tsx` — Recharts AreaChart, Tmin/Tmax gradients
- `components/charts/BoxplotChart.tsx` — Nivo ResponsiveBoxPlot, monthly groups
- `components/charts/ForecastChart.tsx` — Recharts ComposedChart, night ReferenceArea, wind row
- `components/ui/chart.tsx` — shadcn ChartTooltipContent

Direct port. Cast `nivoTheme as any` (known generic-type bug).

Verify: each chart renders for known station (e.g. Madrid `08221`) over `2021-01-01..2022-12-31`.

---

## Phase 4 — Controls + URL state (~1.5 h)

Files:
- `components/controls/DateRangePicker.tsx` — react-day-picker + shadcn Popover
- `components/controls/VariableSelect.tsx` — shadcn Select
- `components/controls/LocationSearch.tsx` — debounced Nominatim
- `app/page.tsx` — wire nuqs state (`sid, lat, lon, name, country, start, end, var`)

Verify: refresh URL restores full view.

---

## Phase 5 — UI polish (~2 h)

Files:
- `components/WeatherBackground.tsx` — Framer Motion gradient, condition-aware (sunny/cloudy/rainy)
- `components/ui/glass-card.tsx` — backdrop-blur wrapper for `ChartCard`
- `components/controls/ThemeToggle.tsx` — `next-themes` switcher
- `lib/temp-color.ts` — `d3-scale-chromatic` `interpolateRdBu` for line stroke
- Page-load stagger via Framer Motion variants
- Sticky station chip in header on scroll

---

## Phase 6 — Export + extras (~1 h)

- `lib/exportChart.ts` — `html-to-image` PNG
- `lib/downloadCsv.ts` — link to `/api/weather/historical/csv`
- `components/controls/BasemapPicker.tsx` — OSM / Carto Voyager / Stamen Toner
- `components/map/TerrainToggle.tsx` — MapLibre `terrain` source
- Animated number tickers for elevation/temp (`framer-motion` `useMotionValue`)

---

## Phase 7 — Ship (~45 min)

- `Dockerfile` — Node 22 alpine, multi-stage
- `docker-compose.yml` — single service, port 3000
- `README.md` — dev + prod instructions
- `next.config.ts` — `output: "standalone"` for slim image
- Parity smoke vs v3:
  - Same station + range → same daily counts
  - Forecast hourly count matches Open-Meteo response
  - Geocode returns ≥1 hit for "Madrid"

---

## Estimated total

~10–11 h focused work. Solo, no external blockers.

---

## Open risks

| Risk | Mitigation |
|---|---|
| Meteostat bulk catalogue gone or rate-limited | Cache locally on first boot; vendor a stale snapshot if fully unavailable |
| `meteostat-js` thin or stale | Hit their JSON API directly with `undici` — same upstream |
| Nivo BoxPlot generic-type bug | Cast `as any` (already proven in v3) |
| Bundle size with maplibre + recharts + nivo | Dynamic-import map and Nivo chart, lean on tree-shaking |
| `openmeteo` pkg ESM/CJS interop | Use ESM throughout (`"type": "module"` in `package.json`, Next 15 handles it) |

---

## Order of work (today)

1. Phase 0 — scaffold ← starting now
2. Phase 1 — backend routes
3. Phase 2 — map
4. Phase 3 — charts
5. Phase 4 — controls
6. Phase 5–6 — polish + extras
7. Phase 7 — Dockerize
