import { dateRangeSchema } from "@/lib/schemas";
import { loadDaily, filterDailyRange } from "@/lib/meteostat";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = dateRangeSchema.safeParse({
    station_id: searchParams.get("station_id"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });
  if (!parsed.success) {
    return new Response("Invalid query", { status: 400 });
  }
  const { station_id, start, end } = parsed.data;

  try {
    const all = await loadDaily(station_id);
    const daily = filterDailyRange(all, start, end);
    if (daily.length === 0) return new Response("No data", { status: 404 });

    const header = "date,tmin,tmax,wspd,prcp\n";
    const body = daily
      .map(
        (r) =>
          `${r.date},${r.tmin ?? ""},${r.tmax ?? ""},${r.wspd ?? ""},${r.prcp ?? ""}`
      )
      .join("\n");
    const filename = `weather_${station_id}_${start}_${end}.csv`;

    return new Response(header + body, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (e) {
    return new Response((e as Error).message, { status: 500 });
  }
}
