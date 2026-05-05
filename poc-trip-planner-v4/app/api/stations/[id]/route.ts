import { NextResponse } from "next/server";
import { findStation } from "@/lib/meteostat";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const station = await findStation(id);
    if (!station) {
      return NextResponse.json(
        { error: `Station '${id}' not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(station);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
