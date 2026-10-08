// Mochi and Tilapya, looked after by everyone who visits the desk: when they
// were last fed and played with is shared (stored in Supabase), and so are a
// few counters of what visitors have done in the room.

export type CatName = "mochi" | "tilapya";
export const catNames: CatName[] = ["mochi", "tilapya"];

export const counterKeys = ["visits", "pets_mochi", "pets_tilapya", "treats", "lasers"] as const;
export type CounterKey = (typeof counterKeys)[number];

export type CareState = {
  cats: Record<CatName, { fedAt: string; playedAt: string }>;
  counters: Record<CounterKey, number>;
};

export type CareAction = "feed" | "pet" | "play" | "visit";

const hoursSince = (iso: string, now: Date) => Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3_600_000);
const percent = (value: number) => Math.round(Math.min(100, Math.max(0, value)));

// Full right after treats, empty six hours later.
export function fullness(fedAt: string, now: Date) {
  return percent(100 - (hoursSince(fedAt, now) / 6) * 100);
}

// Happy right after a pet or a laser chase, bored four hours later.
export function happiness(playedAt: string, now: Date) {
  return percent(100 - (hoursSince(playedAt, now) / 4) * 100);
}

export function timeAgo(iso: string, now: Date) {
  const minutes = Math.floor(Math.max(0, now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// What a visitor did, checked before it's recorded. Feeding and play can be
// for both cats; a pet is always for one.
export function parseCareRequest(input: { action?: unknown; cat?: unknown }):
  | { ok: true; action: CareAction; cat: CatName | "both" }
  | { ok: false } {
  const action = input.action;
  const cat = input.cat;
  if (action === "visit") return { ok: true, action, cat: "both" };
  if (action !== "feed" && action !== "pet" && action !== "play") return { ok: false };
  if (cat !== "mochi" && cat !== "tilapya" && cat !== "both") return { ok: false };
  if (action === "pet" && cat === "both") return { ok: false };
  return { ok: true, action, cat };
}

// The same change, applied locally right away (the server catches up).
export function applyCare(state: CareState, action: CareAction, cat: CatName | "both", now: Date): CareState {
  const at = now.toISOString();
  const cats = { ...state.cats };
  const counters = { ...state.counters };
  const which = cat === "both" ? catNames : [cat];
  if (action === "visit") counters.visits += 1;
  if (action === "feed") {
    for (const name of which) cats[name] = { ...cats[name], fedAt: at };
    counters.treats += 1;
  }
  if (action === "play") {
    for (const name of which) cats[name] = { ...cats[name], playedAt: at };
    counters.lasers += 1;
  }
  if (action === "pet" && cat !== "both") {
    cats[cat] = { ...cats[cat], playedAt: at };
    counters[`pets_${cat}`] += 1;
  }
  return { cats, counters };
}
