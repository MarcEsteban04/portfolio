// What Marc is (probably) doing at his desk right now, by the time in the
// Philippines. It drives the 3D office on the home page; the times are an
// illustrative daily routine, not a live status.

export type Activity =
  | "sleeping"
  | "coffee"
  | "working"
  | "eating"
  | "gaming"
  | "resting"
  | "coding-late";

type Block = { from: number; activity: Activity; label: string };

// Minutes after midnight when each block starts, in order.
const at = (hour: number, minute = 0) => hour * 60 + minute;

// Night shift: work from 11 PM to 8 AM with coffee, sleep through the
// morning, then lunch, games with the cats about, dinner, and a rest.
export const schedule: Block[] = [
  { from: at(0), activity: "working", label: "Working with coffee" },
  { from: at(8), activity: "sleeping", label: "Sleeping" },
  { from: at(15), activity: "eating", label: "Lunch" },
  { from: at(15, 30), activity: "gaming", label: "Gaming with the cats" },
  { from: at(20, 30), activity: "eating", label: "Dinner" },
  { from: at(21), activity: "resting", label: "Resting with the cats" },
  { from: at(23), activity: "working", label: "Working with coffee" },
];

const manila = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

export const manilaClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});

// The "-ber" months, September to December in Manila, when Filipino
// Christmas starts.
export function isChristmasSeason(now: Date) {
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "numeric" }).format(now));
  return month >= 9;
}

// Minutes after midnight in Manila.
export function manilaMinutes(now: Date) {
  const parts = Object.fromEntries(
    manila.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function blockAt(now: Date) {
  const minutes = manilaMinutes(now);
  let index = 0;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].from <= minutes) index = i;
  }
  const next = schedule[(index + 1) % schedule.length];
  return { ...schedule[index], index, next };
}

// Bocaue, Bulacan.
const LATITUDE = 14.8;
const LONGITUDE = 120.93;
const rad = Math.PI / 180;

// How high the sun is over Bulacan, in degrees (below zero once it's set),
// from NOAA's approximate solar position equations.
export function sunElevation(now: Date) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (day + (hours - 12) / 24);
  const equation =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const declination =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const solarMinutes = hours * 60 + equation + 4 * LONGITUDE;
  const hourAngle = (solarMinutes / 4 - 180) * rad;
  const cosZenith =
    Math.sin(LATITUDE * rad) * Math.sin(declination) +
    Math.cos(LATITUDE * rad) * Math.cos(declination) * Math.cos(hourAngle);
  return 90 - Math.acos(Math.max(-1, Math.min(1, cosZenith))) / rad;
}

// 0 at night, 1 in daylight: how bright the sky outside the window is. It
// follows the real sun over Bulacan, so dawn and dusk shift with the
// seasons: light starts in twilight (6° below the horizon) and is full day
// once the sun is 8° up.
export function daylight(now: Date) {
  const k = Math.min(1, Math.max(0, (sunElevation(now) + 6) / 14));
  return k * k * (3 - 2 * k);
}

// Where the moon is in its cycle: 0 new, 0.25 first quarter, 0.5 full,
// 0.75 last quarter, counted from a known new moon (6 Jan 2000, 18:14 UTC).
export function moonPhase(now: Date) {
  const synodic = 29.530588853;
  const days = (now.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86_400_000;
  return (((days / synodic) % 1) + 1) % 1;
}

// 0 with the sun on the horizon, 1 once it's high (50° up, late morning to
// early afternoon): how strong and white the daylight in the room is, so
// mornings and late afternoons are softer and warmer than midday.
export function sunHeight(now: Date) {
  return Math.min(1, Math.max(0, sunElevation(now) / 50));
}

export function formatMinutes(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${String(minute).padStart(2, "0")} ${suffix}`;
}

// What each activity looks like to visitors.
// The icon each activity is shown with (names from the site's icon set).
export type ActivityIcon = "laptop" | "coffee" | "utensils" | "gamepad" | "cat" | "moon" | "bed";

export const activities: {
  activity: Activity;
  icon: ActivityIcon;
  action: string;
  caption: string;
}[] = [
  { activity: "working", icon: "laptop", action: "Work", caption: "Heads down, shipping." },
  { activity: "coffee", icon: "coffee", action: "Coffee", caption: "Fuelling up before the next feature." },
  { activity: "eating", icon: "utensils", action: "Eat", caption: "Away from the keyboard for a bit." },
  { activity: "gaming", icon: "gamepad", action: "Game", caption: "Off the clock and in a match." },
  { activity: "resting", icon: "cat", action: "Rest", caption: "Feet up, a cat on my lap." },
  { activity: "coding-late", icon: "moon", action: "Code late", caption: "Burning the midnight oil on side projects." },
  { activity: "sleeping", icon: "bed", action: "Sleep", caption: "Recharging for tomorrow's commits." },
];

export function describe(activity: Activity) {
  return activities.find((entry) => entry.activity === activity)!;
}

// A Date for HH:MM today in Manila (for ?at= when checking the scene).
export function manilaTimeToday(time: string, now: Date = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
  return new Date(`${today}T${time}:00+08:00`);
}
