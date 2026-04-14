import time
import math
import pandas as pd
from fastapi import APIRouter, HTTPException
from meteostat import Stations

router = APIRouter(prefix="/api/stations", tags=["stations"])

# Simple in-memory cache — single process (uvicorn homelab), no Redis needed
_cache: dict | None = None
_cache_time: float = 0.0
CACHE_TTL = 86400  # 24 hours


def _load_stations() -> pd.DataFrame:
    global _cache, _cache_time
    if _cache is None or time.time() - _cache_time > CACHE_TTL:
        df = Stations().fetch()
        _cache = df
        _cache_time = time.time()
    return _cache


def _df_to_geojson(df: pd.DataFrame) -> dict:
    features = []
    for station_id, row in df.iterrows():
        lat = row.get("latitude")
        lon = row.get("longitude")
        if pd.isna(lat) or pd.isna(lon):
            continue
        elevation = row.get("elevation")
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [round(float(lon), 5), round(float(lat), 5)],
                },
                "properties": {
                    "id": str(station_id),
                    "name": str(row.get("name", "")),
                    "country": str(row.get("country", "")),
                    "elevation": round(float(elevation), 1)
                    if not pd.isna(elevation)
                    else None,
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}


@router.get("")
def get_stations():
    """Return all Meteostat stations as a GeoJSON FeatureCollection (cached 24 h)."""
    try:
        df = _load_stations()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load stations: {exc}")
    return _df_to_geojson(df)


@router.get("/{station_id}")
def get_station(station_id: str):
    """Return metadata for a single station by ID (used to restore URL state)."""
    try:
        df = _load_stations()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load stations: {exc}")

    if station_id not in df.index:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")

    row = df.loc[station_id]
    return {
        "id": station_id,
        "name": str(row.get("name", "")),
        "country": str(row.get("country", "")),
        "latitude": round(float(row["latitude"]), 5),
        "longitude": round(float(row["longitude"]), 5),
        "elevation": round(float(row["elevation"]), 1)
        if not pd.isna(row.get("elevation"))
        else None,
    }


@router.get("/nearest")
def get_nearest_station(lat: float, lon: float):
    """Return the single nearest Meteostat station to the given coordinates."""
    try:
        df = _load_stations()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load stations: {exc}")

    df = df.dropna(subset=["latitude", "longitude"])

    # Haversine distance (fast enough for ~70 k rows in Python)
    R = 6371.0
    lat_r = math.radians(lat)
    df = df.copy()
    df["_dlat"] = df["latitude"].apply(lambda x: math.radians(x) - lat_r)
    df["_dlon"] = df["longitude"].apply(lambda x: math.radians(x) - math.radians(lon))
    df["_dist"] = df.apply(
        lambda r: 2
        * R
        * math.asin(
            math.sqrt(
                math.sin(r["_dlat"] / 2) ** 2
                + math.cos(lat_r)
                * math.cos(math.radians(r["latitude"]))
                * math.sin(r["_dlon"] / 2) ** 2
            )
        ),
        axis=1,
    )
    nearest = df.nsmallest(1, "_dist").iloc[0]
    station_id = df.nsmallest(1, "_dist").index[0]

    return {
        "id": str(station_id),
        "name": str(nearest.get("name", "")),
        "country": str(nearest.get("country", "")),
        "latitude": round(float(nearest["latitude"]), 5),
        "longitude": round(float(nearest["longitude"]), 5),
        "elevation": round(float(nearest["elevation"]), 1)
        if not pd.isna(nearest.get("elevation"))
        else None,
        "distance_km": round(float(nearest["_dist"]), 2),
    }
