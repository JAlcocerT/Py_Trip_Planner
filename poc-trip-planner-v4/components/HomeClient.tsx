"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useQueryState, parseAsFloat, parseAsString } from "nuqs";
import { DownloadIcon, ImageIcon, CloudSun } from "lucide-react";

import StationInfo from "@/components/StationInfo";
import HistoricalChart from "@/components/charts/HistoricalChart";
import BoxplotChart from "@/components/charts/BoxplotChart";
import ForecastChart from "@/components/charts/ForecastChart";
import DateRangePicker, { type DateRange } from "@/components/controls/DateRangePicker";
import VariableSelect from "@/components/controls/VariableSelect";
import LocationSearch from "@/components/controls/LocationSearch";
import ThemeToggle from "@/components/controls/ThemeToggle";
import WeatherBackground, { moodFromTemp } from "@/components/WeatherBackground";
import { Button } from "@/components/ui/button";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useForecastData } from "@/hooks/useForecastData";
import { exportAsPng, downloadCsv } from "@/lib/exportChart";
import type { Station, BoxplotVariable } from "@/lib/types";
import type { FlyToTarget } from "@/components/map/TripMap";

function defaultDateRange() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - 3);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

const DEFAULT_RANGE = defaultDateRange();

const TripMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
  loading: () => (
    <div
      className="shimmer-bg w-full animate-shimmer rounded-xl"
      style={{ height: "55vh", minHeight: 360 }}
    />
  ),
});

function ChartCard({
  title,
  subtitle,
  loading,
  error,
  actions,
  contentRef,
  children,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  actions?: React.ReactNode;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass space-y-3 rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
      </div>

      {loading ? (
        <div className="shimmer-bg h-64 w-full animate-shimmer rounded-md" />
      ) : error ? (
        <div className="flex h-64 w-full items-center justify-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div ref={contentRef}>{children}</div>
      )}
    </motion.div>
  );
}

export default function HomeClient() {
  const [sid, setSid] = useQueryState("sid", parseAsString);
  const [sLat, setSLat] = useQueryState("lat", parseAsFloat);
  const [sLon, setSLon] = useQueryState("lon", parseAsFloat);
  const [sName, setSName] = useQueryState("name", parseAsString);
  const [sCountry, setSCountry] = useQueryState("country", parseAsString);
  const [startDate, setStartDate] = useQueryState("start", parseAsString.withDefault(DEFAULT_RANGE.start));
  const [endDate, setEndDate] = useQueryState("end", parseAsString.withDefault(DEFAULT_RANGE.end));
  const [varParam, setVarParam] = useQueryState("var", parseAsString.withDefault("tmax"));

  const selectedStation = useMemo<Station | null>(() => {
    if (!sid || sLat == null || sLon == null) return null;
    return {
      id: sid,
      name: sName ?? sid,
      country: sCountry ?? "",
      elevation: null,
      latitude: sLat,
      longitude: sLon,
    };
  }, [sid, sLat, sLon, sName, sCountry]);

  const dateRange: DateRange = { start: startDate, end: endDate };
  const boxplotVar = (varParam as BoxplotVariable) ?? "tmax";
  const [flyTo, setFlyTo] = useState<FlyToTarget | null>(null);

  useEffect(() => {
    if (sid && (!sName || !sCountry)) {
      fetch(`/api/stations/${sid}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setSName(data.name);
          setSCountry(data.country);
          if (sLat == null) setSLat(data.latitude);
          if (sLon == null) setSLon(data.longitude);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStationSelect = useCallback(
    (station: Station) => {
      setSid(station.id);
      setSLat(station.latitude);
      setSLon(station.longitude);
      setSName(station.name);
      setSCountry(station.country);
    },
    [setSid, setSLat, setSLon, setSName, setSCountry]
  );

  const historical = useHistoricalData(selectedStation?.id ?? null, startDate, endDate);
  const forecast = useForecastData(
    selectedStation?.latitude ?? null,
    selectedStation?.longitude ?? null
  );

  const historicalRef = useRef<HTMLDivElement>(null);
  const boxplotRef = useRef<HTMLDivElement>(null);
  const forecastRef = useRef<HTMLDivElement>(null);

  const stationLabel = selectedStation
    ? `${selectedStation.name}_${startDate}_${endDate}`
    : "export";

  const currentTemp = forecast.data?.hourly[0]?.temp ?? null;
  const currentPrecip = forecast.data?.hourly[0]?.precip ?? null;
  const mood = moodFromTemp(currentTemp, currentPrecip);

  return (
    <main className="relative min-h-screen">
      <WeatherBackground mood={mood} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <CloudSun className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Trip Planner</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pick a station on the map. Get history + 7-day forecast.
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="w-full sm:w-72">
              <LocationSearch
                onLocationSelect={(lat, lon) => setFlyTo({ lat, lng: lon, zoom: 8 })}
              />
            </div>
            <ThemeToggle />
          </div>
        </motion.div>

        {/* Map + side panel */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TripMap
              onStationSelect={handleStationSelect}
              selectedStation={selectedStation}
              flyTo={flyTo}
            />
          </div>

          <div className="flex flex-col gap-4">
            {selectedStation ? (
              <>
                <StationInfo station={selectedStation} />
                <div className="glass rounded-xl p-4">
                  <DateRangePicker
                    value={dateRange}
                    onChange={(r) => {
                      setStartDate(r.start);
                      setEndDate(r.end);
                    }}
                  />
                </div>
                <div className="glass rounded-xl p-4">
                  <VariableSelect value={boxplotVar} onChange={(v) => setVarParam(v)} />
                </div>
              </>
            ) : (
              <div className="glass flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-dashed p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No station selected</p>
                <p>Search above, or click any dot on the map</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        {selectedStation && (
          <div className="space-y-4">
            <ChartCard
              title="Daily temperatures"
              subtitle={`${selectedStation.name} · ${startDate} → ${endDate}`}
              loading={historical.loading}
              error={historical.error}
              contentRef={historicalRef}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      historicalRef.current &&
                      exportAsPng(historicalRef.current, `temperatures_${stationLabel}.png`)
                    }
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      selectedStation && downloadCsv(selectedStation.id, startDate, endDate)
                    }
                  >
                    <DownloadIcon className="mr-1 h-3 w-3" />
                    CSV
                  </Button>
                </>
              }
            >
              {historical.data && <HistoricalChart data={historical.data.daily} />}
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Monthly distribution"
                subtitle={`${selectedStation.name} · ${startDate} → ${endDate}`}
                loading={historical.loading}
                error={historical.error}
                contentRef={boxplotRef}
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      boxplotRef.current &&
                      exportAsPng(boxplotRef.current, `boxplot_${stationLabel}.png`)
                    }
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    PNG
                  </Button>
                }
              >
                {historical.data && (
                  <BoxplotChart data={historical.data.daily} variable={boxplotVar} />
                )}
              </ChartCard>

              <ChartCard
                title="7-day forecast"
                subtitle={`${selectedStation.name} · next 7 days`}
                loading={forecast.loading}
                error={forecast.error}
                contentRef={forecastRef}
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      forecastRef.current &&
                      exportAsPng(forecastRef.current, `forecast_${selectedStation.name}.png`)
                    }
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    PNG
                  </Button>
                }
              >
                {forecast.data && <ForecastChart data={forecast.data} />}
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
