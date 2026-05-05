import { NextResponse } from "next/server";
import { dateRangeSchema } from "@/lib/schemas";
import { findStation, loadDaily, filterDailyRange } from "@/lib/meteostat";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = dateRangeSchema.safeParse({
    station_id: searchParams.get("station_id"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { station_id, start, end } = parsed.data;
  if (start >= end) {
    return NextResponse.json(
      { error: "start must be before end" },
      { status: 400 }
    );
  }

  try {
    const station = await findStation(station_id);
    if (!station) {
      return NextResponse.json(
        { error: `Station '${station_id}' not found` },
        { status: 404 }
      );
    }
    const all = await loadDaily(station_id);
    const daily = filterDailyRange(all, start, end);
    if (daily.length === 0) {
      return NextResponse.json(
        { error: `No data for station '${station_id}' in range ${start} – ${end}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ station, daily });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
