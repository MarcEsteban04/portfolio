import assert from "node:assert/strict";
import { test } from "node:test";
import { monthCalendar } from "./calendar.ts";

const day = (date: string, count: number, level: number) => ({ date, count, level, week: 0, weekday: 0 });

test("lays out this month in Manila, with its busiest day", () => {
  const days = [day("2026-09-30", 40, 4), day("2026-10-01", 3, 1), day("2026-10-07", 25, 4), day("2026-10-08", 9, 2)];
  // Already 9 October in Manila.
  const month = monthCalendar(days, new Date("2026-10-08T17:00:00Z"));
  assert.equal(month.label, "October 2026");
  assert.equal(month.length, 31);
  assert.equal(month.startWeekday, 4); // 1 October 2026 is a Thursday
  assert.equal(month.today, 9);
  assert.equal(month.total, 37);
  assert.equal(month.best, 7);
  assert.deepEqual(month.days[6], { day: 7, count: 25, level: 4 });
});

test("an empty month has no busiest day", () => {
  assert.equal(monthCalendar([], new Date("2026-02-10T00:00:00Z")).best, null);
  assert.equal(monthCalendar([], new Date("2026-02-10T00:00:00Z")).length, 28);
});
