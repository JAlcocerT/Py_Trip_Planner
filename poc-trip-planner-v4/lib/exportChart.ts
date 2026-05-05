import { toPng } from "html-to-image";

export async function exportAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadCsv(stationId: string, start: string, end: string) {
  const url = `/api/weather/historical/csv?station_id=${encodeURIComponent(
    stationId
  )}&start=${start}&end=${end}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  a.click();
}
