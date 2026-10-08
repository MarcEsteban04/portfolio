import assert from "node:assert/strict";
import { test } from "node:test";
import { contacts, formatPhone, getStats, summary, yearsShipping } from "./profile.ts";

test("counts five years shipping through 2026", () => {
  assert.equal(yearsShipping(new Date("2026-01-01T00:00:00+08:00")), 5);
  assert.equal(yearsShipping(new Date("2026-10-07T12:00:00+08:00")), 5);
  assert.equal(yearsShipping(new Date("2026-12-31T23:59:00+08:00")), 5);
});

test("goes up at New Year in the Philippines, not in UTC", () => {
  // Half past midnight in Manila is still 31 December in UTC.
  const newYearInManila = new Date("2027-01-01T00:30:00+08:00");
  assert.equal(newYearInManila.getUTCFullYear(), 2026);
  assert.equal(yearsShipping(newYearInManila), 6);
  assert.equal(yearsShipping(new Date("2030-06-01T00:00:00+08:00")), 9);
});

test("the stat tile and summary use the same count", () => {
  assert.equal(getStats(5)[0].value, "5+");
  assert.equal(getStats(5)[0].label, "Years shipping");
  assert.match(summary(5), /^Five years of full-stack work/);
  assert.match(summary(12), /^12 years of/);
});

test("contact links open the right place", () => {
  assert.equal(formatPhone("+639934528204"), "+63 993 452 8204");
  const byKind = Object.fromEntries(contacts.map((contact) => [contact.kind, contact]));
  assert.equal(byKind.whatsapp.href, "https://wa.me/639934528204");
  assert.equal(byKind.gmail.href, "mailto:marcdelacruzesteban@gmail.com");
  assert.equal(byKind.teams.href, "https://teams.microsoft.com/l/chat/0/0?users=marcdelacruzesteban%40gmail.com");
  assert.equal(byKind.github.href, "https://github.com/MarcEsteban04");
});
