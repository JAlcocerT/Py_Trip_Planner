import httpx
from fastapi import APIRouter, HTTPException, Query
from app.models import GeocodeResult

router = APIRouter(prefix="/api/geocode", tags=["geocode"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "poc-vibe-weather/3.0 (self-hosted homelab)"}


@router.get("", response_model=list[GeocodeResult])
def geocode(q: str = Query(..., min_length=2, description="Place name to search")):
    """Proxy to Nominatim so the browser never hits the OSM servers directly."""
    params = {"q": q, "format": "json", "limit": 5, "addressdetails": 0}
    try:
        resp = httpx.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=8)
        resp.raise_for_status()
        results = resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Nominatim request failed: {exc}")

    return [
        GeocodeResult(
            display_name=r["display_name"],
            lat=float(r["lat"]),
            lon=float(r["lon"]),
        )
        for r in results
    ]
