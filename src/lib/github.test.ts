import assert from "node:assert/strict";
import { test } from "node:test";
import {
  insights,
  languageCounts,
  monthlyTotals,
  parseContributions,
  summarize,
  toRepos,
  weekdayTotals,
} from "./github.ts";

// Trimmed from github.com/users/<user>/contributions. The calendar starts on
// a Tuesday, so the first column has two empty slots.
const html = `
<h2 id="js-contribution-activity-description" class="f4 text-normal mb-2">
  1,234
  contributions
    in the last year
</h2>
<table>
  <tr>
    <td tabindex="0" data-ix="0" style="width: 10px" data-date="2025-09-30" id="contribution-day-component-2-0" data-level="0" role="gridcell" class="ContributionCalendar-day"></td>
    <td tabindex="0" data-ix="1" style="width: 10px" data-date="2025-10-07" id="contribution-day-component-2-1" data-level="4" role="gridcell" class="ContributionCalendar-day"></td>
  </tr>
  <tr>
    <td tabindex="0" data-ix="0" style="width: 10px" data-date="2025-10-01" id="contribution-day-component-3-0" data-level="1" role="gridcell" class="ContributionCalendar-day"></td>
    <td tabindex="0" data-ix="1" style="width: 10px" data-date="2025-10-05" id="contribution-day-component-0-1" data-level="2" role="gridcell" class="ContributionCalendar-day"></td>
  </tr>
</table>
<tool-tip id="tooltip-a" for="contribution-day-component-2-0" popover="manual" class="sr-only position-absolute">No contributions on September 30th.</tool-tip>
<tool-tip id="tooltip-b" for="contribution-day-component-3-0" popover="manual" class="sr-only position-absolute">1 contribution on October 1st.</tool-tip>
<tool-tip id="tooltip-c" for="contribution-day-component-0-1" popover="manual" class="sr-only position-absolute">10 contributions on October 5th.</tool-tip>
<tool-tip id="tooltip-d" for="contribution-day-component-2-1" popover="manual" class="sr-only position-absolute">1,024 contributions on October 7th.</tool-tip>
<td class="ContributionCalendar-label" colspan="4"></td>
`;

test("reads each day's count and level, in date order", () => {
  const calendar = parseContributions(html);
  assert.ok(calendar);
  assert.deepEqual(
    calendar.days.map(({ date, count, level }) => [date, count, level]),
    [
      ["2025-09-30", 0, 0],
      ["2025-10-01", 1, 1],
      ["2025-10-05", 10, 2],
      ["2025-10-07", 1024, 4],
    ],
  );
});

test("places days in Sunday-first week columns", () => {
  const calendar = parseContributions(html);
  assert.ok(calendar);
  assert.deepEqual(
    calendar.days.map(({ week, weekday }) => [week, weekday]),
    [
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 2],
    ],
  );
  assert.equal(calendar.weeks, 2);
});

test("takes the total from the heading", () => {
  assert.equal(parseContributions(html)?.total, 1234);
});

test("sums the days when the heading is missing", () => {
  const calendar = parseContributions(html.replace(/<h2[\s\S]*?<\/h2>/, ""));
  assert.equal(calendar?.total, 1035);
});

test("returns null when the page has no calendar", () => {
  assert.equal(parseContributions("<html><body>Not Found</body></html>"), null);
});

function calendarOf(counts: number[], first = "2026-09-06") {
  const start = Date.parse(`${first}T00:00:00Z`);
  const days = counts.map((count, i) => {
    const date = new Date(start + i * 864e5).toISOString().slice(0, 10);
    return `<td data-date="${date}" id="d${i}" data-level="${count ? 1 : 0}"></td><tool-tip for="d${i}">${count} contributions on a day.</tool-tip>`;
  });
  const calendar = parseContributions(days.join("\n"));
  assert.ok(calendar);
  return calendar;
}

test("summarizes active days, streaks and the best day", () => {
  const summary = summarize(calendarOf([1, 2, 0, 3, 7, 1, 1, 0, 4, 2]));
  assert.deepEqual(summary, {
    activeDays: 8,
    longestStreak: 4,
    currentStreak: 2,
    bestDay: { date: "2026-09-10", count: 7 },
  });
});

test("keeps the current streak through a quiet last day", () => {
  assert.equal(summarize(calendarOf([0, 5, 5, 5, 0])).currentStreak, 3);
  assert.equal(summarize(calendarOf([5, 5, 0, 0])).currentStreak, 0);
});

test("breaks streaks across missing days", () => {
  const calendar = parseContributions(html);
  assert.ok(calendar);
  const summary = summarize(calendar);
  assert.equal(summary.longestStreak, 1);
  assert.equal(summary.currentStreak, 1);
  assert.deepEqual(summary.bestDay, { date: "2025-10-07", count: 1024 });
});

test("has no best day when there were no contributions", () => {
  assert.deepEqual(summarize(calendarOf([0, 0, 0])), {
    activeDays: 0,
    longestStreak: 0,
    currentStreak: 0,
    bestDay: null,
  });
});

test("totals contributions by month and by weekday", () => {
  // 2026-09-27 is a Sunday; four days in September, four in October.
  const calendar = calendarOf([5, 1, 0, 2, 0, 0, 3, 4], "2026-09-27");
  assert.deepEqual(
    monthlyTotals(calendar).map((m) => [m.key, m.label, m.count]),
    [
      ["2026-09", "Sep", 8],
      ["2026-10", "Oct", 7],
    ],
  );
  // Sun 5+4, Mon 1, Tue 0, Wed 2, Thu 0, Fri 0, Sat 3
  assert.deepEqual(weekdayTotals(calendar), [9, 1, 0, 2, 0, 0, 3]);
});

test("finds the busiest month, weekday and weekend share", () => {
  const result = insights(calendarOf([5, 1, 0, 2, 0, 0, 3, 4], "2026-09-27"));
  assert.equal(result.busiestMonth?.label, "Sep");
  assert.deepEqual(result.busiestWeekday, { name: "Sunday", count: 9 });
  assert.equal(result.averagePerActiveDay, 15 / 5);
  assert.equal(result.weekendShare, 12 / 15);
});

test("an empty year has no busiest anything", () => {
  const result = insights(calendarOf([0, 0, 0]));
  assert.equal(result.busiestMonth, null);
  assert.equal(result.busiestWeekday, null);
  assert.equal(result.averagePerActiveDay, 0);
});

test("lists own public repos, newest first, and counts languages", () => {
  const repo = (name: string, pushed: string, language: string | null, extra = {}) => ({
    name,
    html_url: `https://github.com/me/${name}`,
    description: null,
    language,
    stargazers_count: 0,
    pushed_at: pushed,
    fork: false,
    archived: false,
    ...extra,
  });
  const repos = toRepos(
    [
      repo("old", "2026-01-01T00:00:00Z", "PHP"),
      repo("me", "2026-09-01T00:00:00Z", null),
      repo("new", "2026-09-30T00:00:00Z", "TypeScript"),
      repo("forked", "2026-09-29T00:00:00Z", "Go", { fork: true }),
      repo("mid", "2026-05-01T00:00:00Z", "TypeScript"),
    ],
    "Me",
  );
  assert.deepEqual(
    repos.map((r) => r.name),
    ["new", "mid", "old"],
  );
  assert.deepEqual(languageCounts(repos), [
    { language: "TypeScript", count: 2 },
    { language: "PHP", count: 1 },
  ]);
});
