"use client";

import { useEffect, useState } from "react";
import type { HistoricalResponse } from "@/lib/types";

interface State {
  data: HistoricalResponse | null;
  loading: boolean;
  error: string | null;
}

export function useHistoricalData(
  stationId: string | null,
  start: string,
  end: string
): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!stationId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    const url = `/api/weather/historical?station_id=${encodeURIComponent(
      stationId
    )}&start=${start}&end=${end}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<HistoricalResponse>;
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
  }, [stationId, start, end]);

  return state;
}
