import { toWeather, WEATHER_URL } from "@/lib/weather";

// Bulacan's weather for the 3D office's window. Fetched on the server and
// cached for 15 minutes, so visitors never call Open-Meteo themselves.
export async function GET() {
  try {
    const res = await fetch(WEATHER_URL, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8_000),
    });
    const weather = res.ok ? toWeather(await res.json()) : null;
    if (!weather) return Response.json({ error: "unavailable" }, { status: 503 });
    return Response.json(weather, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
