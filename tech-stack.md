# Tech Stack

A Dash web application for trip weather planning. Users pick a location on an interactive map, select a date range, and get historical weather data plus a short-term forecast. A chat assistant powered by OpenAI is also embedded in the page.

---

## Application Flow

1. **App starts** — Dash server on port `8050`, map centered on the Mediterranean [35°, 25°].
2. **User clicks the map** — Leaflet captures `click_lat_lng`. A marker appears at the clicked point. Meteostat finds the nearest weather station and places a circle marker there.
3. **User picks a date range** — Combined with the map click, three charts render simultaneously:
   - **Weather plot** — daily Tmin/Tmax line chart over the selected range (Meteostat historical data).
   - **Boxplot** — monthly distribution of a user-selected variable (tmax, tmin, wspd, or prcp).
   - **Forecast plot** — 7-day hourly temperature + wind speed dual-axis chart (OpenMeteo forecast).
4. **User changes the boxplot dropdown** — only the boxplot re-renders.
5. **User sends a chat message** — full conversation history is sent to GPT-4o-mini; reply is shown in the chat UI.

---

## Frontend

| Component | Library | Version | Notes |
|-----------|---------|---------|-------|
| Web framework | Dash | 2.7.0 | Reactive Python → React under the hood |
| Map | dash-leaflet | 0.1.23 | Wraps Leaflet.js; OpenStreetMap tile layer |
| Charts | Plotly / Plotly Express | 5.24.1 | Line charts, box plots, dual-axis scatter |
| Chat UI | dash-chat | 0.1.0 | Embedded chat component |
| Styling | Bootstrap | 4.5.2 (CDN) | Layout and basic styling |

**Map details:**
- `dl.Map` with `dl.TileLayer` (OpenStreetMap)
- Click → `dl.Marker` at clicked coords with a lat/lon tooltip
- Nearest station → `dl.CircleMarker` in blue (`#188399`)
- Initial center `[35, 25]`, zoom 4, height `50vh`

**Date picker:**
- `dcc.DatePickerRange` — range `2000-01-01` to 7 days before today; defaults to 2021–2022.

---

## Backend

| Library | Version | Purpose |
|---------|---------|---------|
| Python | 3.11 (prod) / 3.10 (dev) | Runtime |
| Pandas | 2.2.3 | DataFrames, column ops, monthly aggregation |
| NumPy | 2.2.1 | Numerical support |
| Meteostat | 1.6.8 | Historical daily weather data |
| openmeteo-py | 0.0.1 | Short-term forecast data |
| openai | 1.58.1 | GPT-4o-mini chat completions |
| python-dotenv | 1.0.1 | Loads `OPENAI_API_KEY` from `.env` |
| tabulate | 0.9.0 | Table formatting (used in notebooks/tests) |

---

## Weather Data Sources

### Historical — Meteostat
- Finds the nearest station: `Stations().nearby(lat, lon).fetch(1)`
- Fetches daily data: `Daily(Point, start, end).fetch()`
- Fields used: `tmin`, `tmax`, `wspd`, `prcp`
- The station's own lat/lon is used for the circle marker on the map.

### Forecast — OpenMeteo
- `OWmanager(options, hourly.all(), daily.all()).get_data()`
- Hourly fields: `apparent_temperature`, `windspeed_10m`, `winddirection_10m`, `precipitation`
- Returns ~7 days of hourly data; plotted as temperature + wind dual-axis chart.

---

## AI / Chat

- **Model:** `gpt-4o-mini` via the OpenAI SDK
- **Config:** temperature `1.0`, max tokens `150`
- Full conversation history is passed on every turn.
- API key loaded from environment variable `OPENAI_API_KEY`.

### Experimental (notebooks only, not in production)
- **LangChain** (`0.3.13`) — `create_pandas_dataframe_agent` for natural-language queries on weather DataFrames (`Tests/langchain_pandasDF.ipynb`).
- **LlamaIndex** (`0.12.8`) — `PandasQueryEngine` for the same purpose (`Tests/llamaindex_pandasDF.ipynb`).

---

## Project Structure

```
Py_Trip_Planner/
├── app/
│   ├── app.py                  # Dash app entry point, layout, callbacks
│   ├── helpers/
│   │   ├── plot_weather.py     # Chart-building functions
│   │   └── update_logic.py     # Refactored callback logic
│   └── about.html
├── Tests/
│   ├── app.py                  # Alternative app version
│   ├── langchain_pandasDF.ipynb
│   └── llamaindex_pandasDF.ipynb
├── Deploy/
│   └── Docker-compose.yml
├── .devcontainer/              # VS Code dev container (Python 3.10 + Conda)
├── .github/workflows/          # CI/CD — multi-arch GHCR + DockerHub builds
├── Dockerfile                  # Production image (python:3.11)
├── requirements.txt
└── TripPlanner.ipynb
```

---

## Deployment

**Dockerfile (production):**
- Base: `python:3.11`
- Installs `requirements.txt`, exposes port `8050`
- Entry: `python ./app/app.py`

**Docker Compose:**
- Image: `ghcr.io/jalcocert/py_trip_planner`
- Port mapping: `8051:8050`
- Restart: `unless-stopped`

**CI/CD (GitHub Actions):**
- Multi-arch build (amd64 + arm64) → GitHub Container Registry
- x86-64 build → DockerHub (`fossengineer/jalcocert`)
- Both triggered manually via `workflow_dispatch`

**Required environment variable:** `OPENAI_API_KEY`
