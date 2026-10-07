// Notes visitors pin to the cork board in the 3D office. Kept short and
// plain: no links, no shouting matches, nothing that would look bad on a
// portfolio. Stored in Supabase (see supabase/migrations).

import type { Activity } from "./office.ts";
import type { WeatherKind } from "./weather.ts";

// Each note also keeps the moment it was left: the weather outside and what
// Marc was up to, so the board can show it as a polaroid of that moment.
export type Moment = { weather: WeatherKind | null; activity: Activity | null };
export type Note = { id: number; name: string; body: string; created_at: string } & Partial<Moment>;

export const NOTE_MAX = 80;
export const NAME_MAX = 24;

// A deliberately small list; the board is moderated by hand too (hidden).
const blocked = ["fuck", "shit", "bitch", "cunt", "nigg", "fag", "puta", "gago", "tangina", "kantot", "porn", "sex"];

const tidy = (text: string) => text.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();

export function cleanNote(input: { name?: unknown; body?: unknown }):
  | { ok: true; name: string; body: string }
  | { ok: false; reason: string } {
  const body = tidy(typeof input.body === "string" ? input.body : "");
  const name = tidy(typeof input.name === "string" ? input.name : "") || "A visitor";
  if (!body) return { ok: false, reason: "Write something first." };
  if (body.length > NOTE_MAX) return { ok: false, reason: `Keep it under ${NOTE_MAX} characters.` };
  if (name.length > NAME_MAX) return { ok: false, reason: `Keep your name under ${NAME_MAX} characters.` };
  const both = `${name} ${body}`.toLowerCase();
  if (/https?:|www\.|\.(com|net|org|io|ph|xyz|ru)\b/.test(both)) return { ok: false, reason: "No links, please." };
  if (blocked.some((word) => both.includes(word))) return { ok: false, reason: "Let's keep it friendly." };
  return { ok: true, name, body };
}

const weathers: readonly string[] = ["clear", "cloudy", "rain", "storm"];
const doings: readonly string[] = ["sleeping", "coffee", "working", "eating", "gaming", "coding-late"];

// The moment a note was left; anything unexpected is simply left out.
export function cleanMoment(input: { weather?: unknown; activity?: unknown }): Moment {
  const pick = <T extends string>(value: unknown, allowed: readonly string[]) =>
    typeof value === "string" && allowed.includes(value) ? (value as T) : null;
  return { weather: pick<WeatherKind>(input.weather, weathers), activity: pick<Activity>(input.activity, doings) };
}

// What the polaroid's caption says Marc was up to.
export const doingLines: Record<Activity, string> = {
  sleeping: "Marc was asleep",
  coffee: "Marc was having coffee",
  working: "Marc was working",
  eating: "Marc was eating",
  gaming: "Marc was gaming",
  "coding-late": "Marc was coding late",
};
