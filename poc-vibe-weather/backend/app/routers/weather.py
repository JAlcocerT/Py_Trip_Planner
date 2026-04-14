import math
import httpx
import pandas as pd
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from meteostat import Daily, Stations

from app.models import HistoricalResponse, StationInfo, DailyRecord, ForecastResponse

router = APIRouter(prefix="/api/weather", tags=["weather"])

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def _nan_to_none(val):
    if val is None:
        return None
    try:
        return None if math.isnan(val) else val
    except TypeError:
        return val


# ---------------------------------------------------------------------------
# Historical
# ---------------------------------------------------------------------------


@router.get("/historical", response_model=HistoricalResponse)
def get_historical(
    station_id: str = Query(..., description="Meteostat station ID"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
):
    if start >= end:
        raise HTTPException(status_code=400, detail="start must be before end")

    # Station metadata
    try:
        station_df = Stations().fetch()
        if station_id not in station_df.index:
            raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
        meta = station_df.loc[station_id]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Station lookup failed: {exc}")

    # Daily data
    try:
        start_dt = datetime.combine(start, datetime.min.time())
        end_dt = datetime.combine(end, datetime.min.time())
        data = Daily(station_id, start_dt, end_dt).fetch()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Data fetch failed: {exc}")

    if data.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data for station '{station_id}' in range {start} – {end}",
        )

    data = data.reset_index()

    daily = [
        DailyRecord(
            date=str(row["time"].date()),
            tmin=_nan_to_none(row.get("tmin")),
            tmax=_nan_to_none(row.get("tmax")),
            wspd=_nan_to_none(row.get("wspd")),
            prcp=_nan_to_none(row.get("prcp")),
        )
        for _, row in data.iterrows()
    ]

    station_info = StationInfo(
        id=station_id,
        name=str(meta.get("name", "")),
        country=str(meta.get("country", "")),
        latitude=float(meta["latitude"]),
        longitude=float(meta["longitude"]),
        elevation=_nan_to_none(meta.get("elevation")),
    )

    return HistoricalResponse(station=station_info, daily=daily)


@router.get("/historical/csv")
def get_historical_csv(
    station_id: str = Query(...),
    start: date = Query(...),
    end: date = Query(...),
):
    """Same as /historical but returns a CSV file download."""
    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end, datetime.min.time())
    try:
        data = Daily(station_id, start_dt, end_dt).fetch()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if data.empty:
        raise HTTPException(status_code=404, detail="No data for the requested range")

    data = data.reset_index()[["time", "tmin", "tmax", "wspd", "prcp"]]
    data.rename(columns={"time": "date"}, inplace=True)

    csv_content = data.to_csv(index=False)
    filename = f"weather_{station_id}_{start}_{end}.csv"

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# Forecast
# ---------------------------------------------------------------------------


@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "apparent_temperature,precipitation,windspeed_10m,winddirection_10m",
        "daily": "sunrise,sunset",
        "timezone": "auto",
        "forecast_days": 7,
    }

    try:
        resp = httpx.get(OPEN_METEO_URL, params=params, timeout=10)
        resp.raise_for_status()
        payload = resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"OpenMeteo request failed: {exc}")

    hourly_raw = payload.get("hourly", {})
    times = hourly_raw.get("time", [])
    temps = hourly_raw.get("apparent_temperature", [None] * len(times))
    precips = hourly_raw.get("precipitation", [None] * len(times))
    winds = hourly_raw.get("windspeed_10m", [None] * len(times))
    dirs = hourly_raw.get("winddirection_10m", [None] * len(times))

    hourly = [
        {
            "time": t,
            "temp": _nan_to_none(te),
            "wind_speed": _nan_to_none(w),
            "wind_dir": _nan_to_none(d),
            "precip": _nan_to_none(p),
        }
        for t, te, p, w, d in zip(times, temps, precips, winds, dirs)
    ]

    daily_raw = payload.get("daily", {})
    daily_times = daily_raw.get("time", [])
    sunrises = daily_raw.get("sunrise", [None] * len(daily_times))
    sunsets = daily_raw.get("sunset", [None] * len(daily_times))

    daily = [
        {"date": dt, "sunrise": sr, "sunset": ss}
        for dt, sr, ss in zip(daily_times, sunrises, sunsets)
    ]

    return ForecastResponse(hourly=hourly, daily=daily)
