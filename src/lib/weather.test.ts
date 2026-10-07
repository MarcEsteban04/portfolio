import assert from "node:assert/strict";
import { test } from "node:test";
import { describeWeather, toWeather } from "./weather.ts";

test("maps weather codes to what the window can show", () => {
  assert.equal(describeWeather(0).kind, "clear");
  assert.equal(describeWeather(3).kind, "cloudy");
  assert.equal(describeWeather(61).label, "Light rain");
  assert.equal(describeWeather(81).kind, "rain");
  assert.equal(describeWeather(95).kind, "storm");
});

test("reads Open-Meteo's current conditions, and rejects anything else", () => {
  assert.deepEqual(toWeather({ current: { temperature_2m: 31.6, weather_code: 63 } }), {
    kind: "rain",
    label: "Rain",
    temperature: 32,
  });
  assert.equal(toWeather({ current: {} }), null);
  assert.equal(toWeather(null), null);
});
