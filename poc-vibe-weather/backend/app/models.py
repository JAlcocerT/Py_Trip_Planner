from pydantic import BaseModel
from typing import Optional


class StationInfo(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    elevation: Optional[float] = None


class DailyRecord(BaseModel):
    date: str
    tmin: Optional[float] = None
    tmax: Optional[float] = None
    wspd: Optional[float] = None
    prcp: Optional[float] = None


class HistoricalResponse(BaseModel):
    station: StationInfo
    daily: list[DailyRecord]


class HourlyForecast(BaseModel):
    time: str
    temp: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_dir: Optional[float] = None
    precip: Optional[float] = None


class DailyForecast(BaseModel):
    date: str
    sunrise: Optional[str] = None
    sunset: Optional[str] = None


class ForecastResponse(BaseModel):
    hourly: list[HourlyForecast]
    daily: list[DailyForecast]


class GeocodeResult(BaseModel):
    display_name: str
    lat: float
    lon: float
