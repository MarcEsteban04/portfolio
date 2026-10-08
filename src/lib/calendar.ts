import type { ContributionDay } from "./github.ts";

// This month's GitHub contributions, laid out as a wall calendar in the
// desk: which weekday the month starts on, each day's level, the busiest
// day (circled in red marker) and today.
export type MonthCalendar = {
  label: string;
  startWeekday: number;
  days: { day: number; count: number; level: number }[];
  length: number;
  today: number;
  total: number;
  best: number | null;
};

const manilaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });

export function monthCalendar(days: ContributionDay[], now: Date): MonthCalendar {
  const [year, month, today] = manilaDate.format(now).split("-").map(Number);
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const byDay = new Map(days.filter((d) => d.date.startsWith(prefix)).map((d) => [Number(d.date.slice(8)), d]));
  const monthDays = Array.from({ length }, (_, i) => {
    const found = byDay.get(i + 1);
    return { day: i + 1, count: found?.count ?? 0, level: found?.level ?? 0 };
  });
  const busiest = monthDays.reduce((a, b) => (b.count > a.count ? b : a), monthDays[0]);
  return {
    label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, month - 1, 1)),
    ),
    startWeekday,
    days: monthDays,
    length,
    today,
    total: monthDays.reduce((sum, d) => sum + d.count, 0),
    best: busiest.count > 0 ? busiest.day : null,
  };
}
