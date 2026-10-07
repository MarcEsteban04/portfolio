// What Marc is (probably) doing at his desk right now, by the time in the
// Philippines. It drives the 3D office on the home page; the times are an
// illustrative daily routine, not a live status.

export type Activity =
  | "sleeping"
  | "coffee"
  | "working"
  | "eating"
  | "gaming"
  | "coding-late";

type Block = { from: number; activity: Activity; label: string };

// Minutes after midnight when each block starts, in order.
const at = (hour: number, minute = 0) => hour * 60 + minute;

export const schedule: Block[] = [
  { from: at(0), activity: "coding-late", label: "Coding late" },
  { from: at(1, 30), activity: "sleeping", label: "Sleeping" },
  { from: at(8), activity: "coffee", label: "Morning coffee" },
  { from: at(8, 45), activity: "working", label: "Working" },
  { from: at(12), activity: "eating", label: "Lunch" },
  { from: at(13), activity: "working", label: "Working" },
  { from: at(15, 30), activity: "coffee", label: "Coffee break" },
  { from: at(16), activity: "working", label: "Working" },
  { from: at(19), activity: "eating", label: "Dinner" },
  { from: at(20), activity: "gaming", label: "Gaming" },
  { from: at(22), activity: "coding-late", label: "Coding late" },
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

// 0 at midnight, 1 at noon: how bright the sky outside the window is.
// Dawn runs 5:30–7:00 and dusk 17:30–19:00.
export function daylight(now: Date) {
  const minutes = manilaMinutes(now);
  const ramp = (start: number, end: number) =>
    Math.min(1, Math.max(0, (minutes - start) / (end - start)));
  return ramp(at(5, 30), at(7)) - ramp(at(17, 30), at(19));
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
export type ActivityIcon = "laptop" | "coffee" | "utensils" | "gamepad" | "moon" | "bed";

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
