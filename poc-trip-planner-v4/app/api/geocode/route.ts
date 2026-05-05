import { NextResponse } from "next/server";
import { geocodeSchema } from "@/lib/schemas";
import type { GeocodeResult } from "@/lib/types";

export const runtime = "nodejs";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = geocodeSchema.safeParse({ q: searchParams.get("q") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", parsed.data.q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "poc-trip-planner-v4/0.1 (self-hosted homelab)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const raw = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    const out: GeocodeResult[] = raw.map((r) => ({
      display_name: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
    }));
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: `Geocode failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
