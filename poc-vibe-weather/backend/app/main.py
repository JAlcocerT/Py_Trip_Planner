from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.routers import stations, weather, geocode

app = FastAPI(title="Trip Planner API", version="3.0.0")

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(stations.router)
app.include_router(weather.router)
app.include_router(geocode.router)


@app.get("/health")
def health():
    return {"status": "ok"}
