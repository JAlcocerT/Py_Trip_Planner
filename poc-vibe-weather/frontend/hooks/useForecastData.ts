"use client";

import { useEffect, useState } from "react";
import type { ForecastResponse } from "@/lib/types";

interface State {
  data: ForecastResponse | null;
  loading: boolean;
  error: string | null;
}

export function useForecastData(
  lat: number | null,
  lon: number | null
): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (lat == null || lon == null) return;

    setState({ data: null, loading: true, error: null });

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
    });

    fetch(`/api/weather/forecast?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ForecastResponse>;
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e: Error) =>
        setState({ data: null, loading: false, error: e.message })
      );
  }, [lat, lon]);

  return state;
}
