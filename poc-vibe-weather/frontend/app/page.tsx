"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import StationInfo from "@/components/StationInfo";
import HistoricalChart from "@/components/charts/HistoricalChart";
import BoxplotChart from "@/components/charts/BoxplotChart";
import ForecastChart from "@/components/charts/ForecastChart";
import DateRangePicker, { type DateRange } from "@/components/controls/DateRangePicker";
import VariableSelect from "@/components/controls/VariableSelect";
import LocationSearch from "@/components/controls/LocationSearch";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useForecastData } from "@/hooks/useForecastData";
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

function ChartCard({
  title,
  subtitle,
  loading,
  error,
  children,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {loading ? (
        <div className="w-full h-64 bg-muted animate-pulse rounded-md" />
      ) : error ? (
        <div className="w-full h-64 flex items-center justify-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: "2021-01-01",
    end: "2022-12-31",
  });
  const [boxplotVar, setBoxplotVar] = useState<BoxplotVariable>("tmax");
  const [flyTo, setFlyTo] = useState<FlyToTarget | null>(null);

  const historical = useHistoricalData(
    selectedStation?.id ?? null,
    dateRange.start,
    dateRange.end
  );
  const forecast = useForecastData(
    selectedStation?.latitude ?? null,
    selectedStation?.longitude ?? null
  );

  function handleLocationSelect(lat: number, lon: number) {
    setFlyTo({ lat, lng: lon, zoom: 8 });
  }

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

          {/* Map — 2/3 width */}
          <div className="lg:col-span-2">
            <TripMap
              onStationSelect={setSelectedStation}
              selectedStation={selectedStation}
              flyTo={flyTo}
            />
          </div>

          {/* Right panel — station info + controls */}
          <div className="flex flex-col gap-4">
            {selectedStation ? (
              <>
                <StationInfo station={selectedStation} />
                <div className="rounded-lg border bg-card p-4">
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <VariableSelect
                    value={boxplotVar}
                    onChange={setBoxplotVar}
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

            {/* Historical — full width */}
            <ChartCard
              title="Daily temperatures"
              subtitle={`${selectedStation.name} · ${dateRange.start} → ${dateRange.end}`}
              loading={historical.loading}
              error={historical.error}
            >
              {historical.data && (
                <HistoricalChart data={historical.data.daily} />
              )}
            </ChartCard>

            {/* Boxplot + Forecast — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <ChartCard
                title="Monthly distribution"
                subtitle={`${selectedStation.name} · ${dateRange.start} → ${dateRange.end}`}
                loading={historical.loading}
                error={historical.error}
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
