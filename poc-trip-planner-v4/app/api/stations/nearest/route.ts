import { NextResponse } from "next/server";
import { latLonSchema } from "@/lib/schemas";
import { loadStationsGeoJSON } from "@/lib/meteostat";
import { nearestStation } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = latLonSchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }
  try {
    const fc = await loadStationsGeoJSON();
    const station = nearestStation(parsed.data.lat, parsed.data.lon, fc);
    if (!station) {
      return NextResponse.json({ error: "No stations" }, { status: 404 });
    }
    return NextResponse.json(station);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
