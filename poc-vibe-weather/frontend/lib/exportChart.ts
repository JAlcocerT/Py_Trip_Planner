/**
 * Export a chart container's SVG as a PNG file download.
 * Works with both Recharts and Nivo (both render SVG).
 */
export function exportAsPng(container: HTMLElement, filename: string) {
  const svgEl = container.querySelector("svg");
  if (!svgEl) return;

  const { width, height } = svgEl.getBoundingClientRect();
  const scale = 2; // retina quality

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(svgUrl);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    }, "image/png");
  };
  img.src = svgUrl;
}

/**
 * Trigger a CSV download for historical weather data via the backend endpoint.
 */
export function downloadCsv(
  stationId: string,
  start: string,
  end: string
) {
  const params = new URLSearchParams({ station_id: stationId, start, end });
  const a = document.createElement("a");
  a.href = `/api/weather/historical/csv?${params}`;
  a.click();
}
