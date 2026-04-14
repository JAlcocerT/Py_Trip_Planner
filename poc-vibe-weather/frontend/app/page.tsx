"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQueryState, parseAsFloat, parseAsString } from "nuqs";
import { DownloadIcon, ImageIcon } from "lucide-react";

import StationInfo from "@/components/StationInfo";
import HistoricalChart from "@/components/charts/HistoricalChart";
import BoxplotChart from "@/components/charts/BoxplotChart";
import ForecastChart from "@/components/charts/ForecastChart";
import DateRangePicker, { type DateRange } from "@/components/controls/DateRangePicker";
import VariableSelect from "@/components/controls/VariableSelect";
import LocationSearch from "@/components/controls/LocationSearch";
import { Button } from "@/components/ui/button";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useForecastData } from "@/hooks/useForecastData";
import { exportAsPng, downloadCsv } from "@/lib/exportChart";
import type { Station, BoxplotVariable } from "@/lib/types";
import type { FlyToTarget } from "@/components/map/TripMap";

const TripMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-lg bg-muted animate-pulse"
      style={{ height: "50vh", minHeight: 320 }}
    />
  ),
});

// ---------------------------------------------------------------------------
// ChartCard
// ---------------------------------------------------------------------------

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
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-1 shrink-0">{actions}</div>}
      </div>

      {loading ? (
        <div className="w-full h-64 bg-muted animate-pulse rounded-md" />
      ) : error ? (
        <div className="w-full h-64 flex items-center justify-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div ref={contentRef}>{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  // --- URL state (nuqs) ---
  const [sid, setSid] = useQueryState("sid", parseAsString);
  const [sLat, setSLat] = useQueryState("lat", parseAsFloat);
  const [sLon, setSLon] = useQueryState("lon", parseAsFloat);
  const [sName, setSName] = useQueryState("name", parseAsString);
  const [sCountry, setSCountry] = useQueryState("country", parseAsString);
  const [startDate, setStartDate] = useQueryState(
    "start",
    parseAsString.withDefault("2021-01-01")
  );
  const [endDate, setEndDate] = useQueryState(
    "end",
    parseAsString.withDefault("2022-12-31")
  );
  const [varParam, setVarParam] = useQueryState(
    "var",
    parseAsString.withDefault("tmax")
  );

  // --- Derived state ---
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

  // --- Map flyTo (driven by location search, not persisted in URL) ---
  const [flyTo, setFlyTo] = useState<FlyToTarget | null>(null);

  // --- Station metadata refresh on URL load ---
  // If the URL has a station ID but we're missing the name (e.g. shared link),
  // fetch the full metadata from the backend.
  useEffect(() => {
    if (sid && (!sName || !sCountry)) {
      fetch(`/api/stations/${sid}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return;
          setSName(data.name);
          setSCountry(data.country);
          if (sLat == null) setSLat(data.latitude);
          if (sLon == null) setSLon(data.longitude);
        })
        .catch(() => {});
    }
    // Only run on initial mount when sid is already in URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
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

  function handleDateRangeChange(range: DateRange) {
    setStartDate(range.start);
    setEndDate(range.end);
  }

  function handleVariableChange(v: BoxplotVariable) {
    setVarParam(v);
  }

  function handleLocationSelect(lat: number, lon: number) {
    setFlyTo({ lat, lng: lon, zoom: 8 });
  }

  // --- Data ---
  const historical = useHistoricalData(
    selectedStation?.id ?? null,
    startDate,
    endDate
  );
  const forecast = useForecastData(
    selectedStation?.latitude ?? null,
    selectedStation?.longitude ?? null
  );

  // --- Export refs ---
  const historicalRef = useRef<HTMLDivElement>(null);
  const boxplotRef = useRef<HTMLDivElement>(null);
  const forecastRef = useRef<HTMLDivElement>(null);

  const stationLabel = selectedStation
    ? `${selectedStation.name}_${startDate}_${endDate}`
    : "export";

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trip Planner</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Search a location or click a station dot on the map
            </p>
          </div>
          <div className="w-full sm:w-72">
            <LocationSearch onLocationSelect={handleLocationSelect} />
          </div>
        </div>

        {/* Map + controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                <div className="rounded-lg border bg-card p-4">
                  <DateRangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                  />
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <VariableSelect
                    value={boxplotVar}
                    onChange={handleVariableChange}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 h-full min-h-48 text-center">
                <p className="font-medium text-foreground">No station selected</p>
                <p>Search for a place above, or click any dot on the map</p>
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
                    <ImageIcon className="h-3 w-3 mr-1" />
                    PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      selectedStation &&
                      downloadCsv(selectedStation.id, startDate, endDate)
                    }
                  >
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                </>
              }
            >
              {historical.data && (
                <HistoricalChart data={historical.data.daily} />
              )}
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

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
                    <ImageIcon className="h-3 w-3 mr-1" />
                    PNG
                  </Button>
                }
              >
                {historical.data && (
                  <BoxplotChart
                    data={historical.data.daily}
                    variable={boxplotVar}
                  />
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
                    <ImageIcon className="h-3 w-3 mr-1" />
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
