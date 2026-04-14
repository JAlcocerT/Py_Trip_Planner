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
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!stationId || !start || !end) return;

    setState({ data: null, loading: true, error: null });

    const params = new URLSearchParams({ station_id: stationId, start, end });

    fetch(`/api/weather/historical?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<HistoricalResponse>;
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e: Error) =>
        setState({ data: null, loading: false, error: e.message })
      );
  }, [stationId, start, end]);

  return state;
}
