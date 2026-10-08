import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activities,
  blockAt,
  daylight,
  describe,
  formatMinutes,
  isChristmasSeason,
  manilaMinutes,
  manilaTimeToday,
  schedule,
  sunElevation,
} from "./office.ts";

const manila = (time: string) => new Date(`2026-10-08T${time}:00+08:00`);

test("reads the clock in Manila, not UTC", () => {
  assert.equal(manilaMinutes(manila("00:30")), 30);
  assert.equal(manilaMinutes(new Date("2026-10-08T16:00:00Z")), 0); // midnight in Manila
});

test("follows the daily routine", () => {
  const cases: [string, string][] = [
    ["00:15", "working"],
    ["07:59", "working"],
    ["08:00", "sleeping"],
    ["14:30", "sleeping"],
    ["15:10", "eating"],
    ["15:30", "gaming"],
    ["20:00", "gaming"],
    ["20:45", "eating"],
    ["21:00", "resting"],
    ["22:59", "resting"],
    ["23:00", "working"],
  ];
  for (const [time, activity] of cases) {
    assert.equal(blockAt(manila(time)).activity, activity, time);
  }
});

test("knows what comes next, wrapping past midnight", () => {
  assert.equal(blockAt(manila("21:00")).next.label, "Working with coffee");
  assert.equal(blockAt(manila("23:30")).next.from, schedule[0].from);
});

test("the sky is dark at night, bright at midday and in between at dawn", () => {
  assert.equal(daylight(manila("02:00")), 0);
  assert.equal(daylight(manila("12:00")), 1);
  assert.ok(daylight(manila("05:30")) > 0 && daylight(manila("05:30")) < 0.5);
  // The sun's up by 6:15 in October.
  assert.ok(daylight(manila("06:15")) > 0.8);
  assert.equal(daylight(manila("21:00")), 0);
});

test("the sun rises and sets when it really does over Bulacan", () => {
  // Sunrise on Oct 8 is about 5:47 and sunset about 5:41 PM.
  assert.ok(Math.abs(sunElevation(manila("05:47"))) < 1.5);
  assert.ok(Math.abs(sunElevation(manila("17:41"))) < 1.5);
  // Midsummer mornings are lighter than midwinter ones at the same time.
  const at6 = (date: string) => sunElevation(new Date(`${date}T06:00:00+08:00`));
  assert.ok(at6("2026-06-21") > at6("2026-12-21") + 5);
});

test("formats schedule times", () => {
  assert.equal(formatMinutes(0), "12:00 AM");
  assert.equal(formatMinutes(90), "1:30 AM");
  assert.equal(formatMinutes(15 * 60 + 30), "3:30 PM");
});

test("every activity in the routine has a control", () => {
  for (const { activity } of schedule) assert.ok(activities.some((entry) => entry.activity === activity), activity);
  assert.equal(describe("sleeping").action, "Sleep");
});

test("manilaTimeToday reads HH:MM in Manila", () => {
  assert.equal(manilaMinutes(manilaTimeToday("03:26")), 3 * 60 + 26);
});

test("Christmas runs through the -ber months, in Manila", () => {
  assert.equal(isChristmasSeason(new Date("2026-08-31T15:59:00Z")), false);
  // Already September 1 in Manila.
  assert.equal(isChristmasSeason(new Date("2026-08-31T16:00:00Z")), true);
  assert.equal(isChristmasSeason(new Date("2026-12-25T00:00:00Z")), true);
  // New Year's Day in Manila.
  assert.equal(isChristmasSeason(new Date("2026-12-31T16:30:00Z")), false);
});
