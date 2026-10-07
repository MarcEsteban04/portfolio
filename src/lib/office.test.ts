import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activities,
  blockAt,
  daylight,
  describe,
  formatMinutes,
  manilaMinutes,
  manilaTimeToday,
  schedule,
} from "./office.ts";

const manila = (time: string) => new Date(`2026-10-08T${time}:00+08:00`);

test("reads the clock in Manila, not UTC", () => {
  assert.equal(manilaMinutes(manila("00:30")), 30);
  assert.equal(manilaMinutes(new Date("2026-10-08T16:00:00Z")), 0); // midnight in Manila
});

test("follows the daily routine", () => {
  const cases: [string, string][] = [
    ["00:15", "coding-late"],
    ["03:00", "sleeping"],
    ["08:10", "coffee"],
    ["10:00", "working"],
    ["12:30", "eating"],
    ["15:45", "coffee"],
    ["19:30", "eating"],
    ["21:00", "gaming"],
    ["23:30", "coding-late"],
  ];
  for (const [time, activity] of cases) {
    assert.equal(blockAt(manila(time)).activity, activity, time);
  }
});

test("knows what comes next, wrapping past midnight", () => {
  assert.equal(blockAt(manila("21:00")).next.label, "Coding late");
  assert.equal(blockAt(manila("23:30")).next.from, schedule[0].from);
});

test("the sky is dark at night, bright at midday and in between at dawn", () => {
  assert.equal(daylight(manila("02:00")), 0);
  assert.equal(daylight(manila("12:00")), 1);
  assert.ok(daylight(manila("06:15")) > 0 && daylight(manila("06:15")) < 1);
  assert.equal(daylight(manila("21:00")), 0);
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
