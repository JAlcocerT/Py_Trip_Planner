import { NextResponse } from "next/server";
import { loadStationsGeoJSON } from "@/lib/meteostat";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET() {
  try {
    const fc = await loadStationsGeoJSON();
    return NextResponse.json(fc, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to load stations: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
