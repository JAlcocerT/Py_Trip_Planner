"use client";

import { useEffect, useState } from "react";
import type { ForecastResponse } from "@/lib/types";

interface State {
  data: ForecastResponse | null;
  loading: boolean;
  error: string | null;
}

export function useForecastData(lat: number | null, lon: number | null): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  useEffect(() => {
    if (lat == null || lon == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<ForecastResponse>;
      })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: (e as Error).message });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return state;
}
