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

const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

export type MonthTotal = { key: string; label: string; year: number; count: number };

// Contributions per calendar month, oldest first. The first and last months
// are usually partial, since the calendar covers a rolling year.
export function monthlyTotals(calendar: ContributionCalendar): MonthTotal[] {
  const months = new Map<string, MonthTotal>();
  for (const day of calendar.days) {
    const key = day.date.slice(0, 7);
    const month = months.get(key) ?? {
      key,
      label: monthLabel.format(new Date(`${key}-01T00:00:00Z`)),
      year: Number(key.slice(0, 4)),
      count: 0,
    };
    month.count += day.count;
    months.set(key, month);
  }
  return [...months.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Contributions per day of the week, indexed Sunday (0) to Saturday (6).
export function weekdayTotals(calendar: ContributionCalendar) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const day of calendar.days) totals[day.weekday] += day.count;
  return totals;
}

export type ContributionInsights = {
  averagePerActiveDay: number;
  busiestMonth: MonthTotal | null;
  busiestWeekday: { name: string; count: number } | null;
  weekendShare: number;
};

export function insights(calendar: ContributionCalendar): ContributionInsights {
  const counted = calendar.days.reduce((sum, day) => sum + day.count, 0);
  const active = calendar.days.filter((day) => day.count > 0).length;
  const months = monthlyTotals(calendar);
  const weekdays = weekdayTotals(calendar);
  const best = weekdays.indexOf(Math.max(...weekdays));
  const busiestMonth = months.reduce<MonthTotal | null>(
    (top, month) => (!top || month.count > top.count ? month : top),
    null,
  );
  return {
    averagePerActiveDay: active ? counted / active : 0,
    busiestMonth: busiestMonth && busiestMonth.count > 0 ? busiestMonth : null,
    busiestWeekday: counted ? { name: WEEKDAYS[best], count: weekdays[best] } : null,
    weekendShare: counted ? (weekdays[0] + weekdays[6]) / counted : 0,
  };
}

export type Repo = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
};

type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

// Own public repositories, most recently pushed first. Forks, archives and the
// profile README repository (named after the user) are left out.
export function toRepos(raw: GitHubRepo[], username: string): Repo[] {
  return raw
    .filter(
      (repo) =>
        !repo.fork &&
        !repo.archived &&
        repo.name.toLowerCase() !== username.toLowerCase(),
    )
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
    }));
}

// How many repositories use each primary language, most used first.
export function languageCounts(repos: Repo[]) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));
}

// Refreshed hourly, like the calendar. The public API allows 60 requests an
// hour without a token, which an hourly refresh stays well inside.
export async function getRepos(username: string) {
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    return toRepos((await res.json()) as GitHubRepo[], username);
  } catch {
    return null;
  }
}
