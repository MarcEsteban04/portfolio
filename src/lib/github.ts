export type ContributionDay = {
  date: string;
  count: number;
  level: number;
  week: number;
  weekday: number;
};

export type ContributionCalendar = {
  total: number;
  weeks: number;
  days: ContributionDay[];
};

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

function weekdayOf(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// Parses the public calendar at github.com/users/<user>/contributions.
// Each day is a <td data-date data-level id>, and its count lives in a
// <tool-tip for="<id>"> such as "10 contributions on October 5th."
export function parseContributions(html: string): ContributionCalendar | null {
  const counts = new Map<string, number>();
  for (const [, tag, text] of html.matchAll(/(<tool-tip\b[^>]*>)([^<]*)</g)) {
    const id = attr(tag, "for");
    if (!id) continue;
    const count = text.trim().match(/^([\d,]+) contributions?\b/)?.[1];
    counts.set(id, count ? Number(count.replace(/,/g, "")) : 0);
  }

  const cells = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\sdata-date="[^"]*"[^>]*>/g)) {
    const date = attr(tag, "data-date");
    const id = attr(tag, "id");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    cells.push({
      date,
      count: (id && counts.get(id)) || 0,
      level: Math.min(4, Math.max(0, Number(attr(tag, "data-level")) || 0)),
    });
  }
  if (cells.length === 0) return null;

  cells.sort((a, b) => a.date.localeCompare(b.date));
  // Columns are Sunday-first weeks, so a calendar that starts midweek
  // leaves the first column partly empty, as it does on GitHub.
  const offset = weekdayOf(cells[0].date);
  const start = Date.parse(`${cells[0].date}T00:00:00Z`);
  const days = cells.map((cell) => {
    const index = Math.round(
      (Date.parse(`${cell.date}T00:00:00Z`) - start) / 864e5,
    );
    return {
      ...cell,
      week: Math.floor((index + offset) / 7),
      weekday: weekdayOf(cell.date),
    };
  });

  const heading = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  const total = heading
    ? Number(heading[1].replace(/,/g, ""))
    : days.reduce((sum, day) => sum + day.count, 0);

  return { total, weeks: days[days.length - 1].week + 1, days };
}

export type ContributionSummary = {
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  bestDay: { date: string; count: number } | null;
};

// Days since the calendar's first Sunday, so a gap in the data breaks a streak.
function position(day: ContributionDay) {
  return day.week * 7 + day.weekday;
}

// A streak is a run of consecutive days with at least one contribution.
// The current streak survives a quiet last day, since that day (today on
// GitHub) may not be over yet.
export function summarize(calendar: ContributionCalendar): ContributionSummary {
  const { days } = calendar;
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;
  let bestDay: ContributionSummary["bestDay"] = null;

  days.forEach((day, i) => {
    if (day.count === 0) {
      run = 0;
      return;
    }
    activeDays++;
    run = i > 0 && position(days[i - 1]) === position(day) - 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    if (!bestDay || day.count > bestDay.count) {
      bestDay = { date: day.date, count: day.count };
    }
  });

  let currentStreak = 0;
  let end = days.length - 1;
  if (end >= 0 && days[end].count === 0) end--;
  for (let i = end; i >= 0 && days[i].count > 0; i--) {
    if (i < end && position(days[i]) !== position(days[i + 1]) - 1) break;
    currentStreak++;
  }

  return { activeDays, longestStreak, currentStreak, bestDay };
}

// Refreshed hourly, which also sets the page's revalidation: a failed fetch
// renders the fallback, and that stays cached until the next refresh.
export async function getContributions(username: string) {
  try {
    const res = await fetch(
      `https://github.com/users/${encodeURIComponent(username)}/contributions`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    return parseContributions(await res.text());
  } catch {
    return null;
  }
}
