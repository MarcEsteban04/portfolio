// The weather outside Marc's window: Bulacan's current conditions from
// Open-Meteo (free, no key), boiled down to what the 3D office can show.

export type WeatherKind = "clear" | "cloudy" | "rain" | "storm";

export type Weather = {
  kind: WeatherKind;
  label: string;
  temperature: number;
};

// Malolos, Bulacan.
export const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=14.84&longitude=120.81&current=temperature_2m,weather_code&timezone=Asia%2FManila";

// WMO weather codes, as Open-Meteo reports them.
export function describeWeather(code: number): { kind: WeatherKind; label: string } {
  if (code === 0) return { kind: "clear", label: "Clear skies" };
  if (code === 1) return { kind: "clear", label: "Mostly clear" };
  if (code === 2) return { kind: "cloudy", label: "Partly cloudy" };
  if (code === 3) return { kind: "cloudy", label: "Overcast" };
  if (code === 45 || code === 48) return { kind: "cloudy", label: "Foggy" };
  if (code >= 51 && code <= 57) return { kind: "rain", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { kind: "rain", label: code === 61 ? "Light rain" : "Rain" };
  if (code >= 80 && code <= 82) return { kind: "rain", label: "Rain showers" };
  if (code >= 95) return { kind: "storm", label: "Thunderstorm" };
  return { kind: "cloudy", label: "Cloudy" };
}

export function toWeather(data: unknown): Weather | null {
  const current = (data as { current?: { temperature_2m?: unknown; weather_code?: unknown } })?.current;
  if (typeof current?.temperature_2m !== "number" || typeof current.weather_code !== "number") return null;
  return { ...describeWeather(current.weather_code), temperature: Math.round(current.temperature_2m) };
}

export const weatherEmoji: Record<WeatherKind, string> = {
  clear: "☀️",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
};
