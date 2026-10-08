import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCare, fullness, happiness, parseCareRequest, timeAgo, type CareState } from "./cats.ts";

const now = new Date("2026-10-09T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

test("fullness and happiness wear off over hours", () => {
  assert.equal(fullness(hoursAgo(0), now), 100);
  assert.equal(fullness(hoursAgo(3), now), 50);
  assert.equal(fullness(hoursAgo(9), now), 0);
  assert.equal(happiness(hoursAgo(1), now), 75);
  assert.equal(happiness(hoursAgo(5), now), 0);
});

test("says how long ago, plainly", () => {
  assert.equal(timeAgo(hoursAgo(0), now), "just now");
  assert.equal(timeAgo(hoursAgo(0.25), now), "15 min ago");
  assert.equal(timeAgo(hoursAgo(3), now), "3 h ago");
  assert.equal(timeAgo(hoursAgo(49), now), "2 days ago");
});

test("only accepts care that makes sense", () => {
  assert.deepEqual(parseCareRequest({ action: "feed", cat: "both" }), { ok: true, action: "feed", cat: "both" });
  assert.deepEqual(parseCareRequest({ action: "pet", cat: "mochi" }), { ok: true, action: "pet", cat: "mochi" });
  assert.deepEqual(parseCareRequest({ action: "visit" }), { ok: true, action: "visit", cat: "both" });
  assert.equal(parseCareRequest({ action: "pet", cat: "both" }).ok, false);
  assert.equal(parseCareRequest({ action: "feed", cat: "garfield" }).ok, false);
  assert.equal(parseCareRequest({ action: "drop table" }).ok, false);
});

test("care updates the cats and the counters", () => {
  const start: CareState = {
    cats: { mochi: { fedAt: hoursAgo(5), playedAt: hoursAgo(5) }, tilapya: { fedAt: hoursAgo(5), playedAt: hoursAgo(5) } },
    counters: { visits: 1, pets_mochi: 0, pets_tilapya: 0, treats: 0, lasers: 0 },
  };
  const fed = applyCare(start, "feed", "both", now);
  assert.equal(fed.cats.mochi.fedAt, now.toISOString());
  assert.equal(fed.cats.tilapya.fedAt, now.toISOString());
  assert.equal(fed.counters.treats, 1);
  const petted = applyCare(fed, "pet", "tilapya", now);
  assert.equal(petted.counters.pets_tilapya, 1);
  assert.equal(petted.cats.mochi.playedAt, hoursAgo(5));
  assert.equal(start.counters.treats, 0);
});
