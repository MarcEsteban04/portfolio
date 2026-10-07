import assert from "node:assert/strict";
import { test } from "node:test";
import { discoveries, parseFound } from "./discoveries.ts";

test("every discovery has its own id and a label", () => {
  const ids = discoveries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of discoveries) assert.ok(entry.label.length > 0);
});

test("reads back what was found, ignoring junk", () => {
  assert.deepEqual(parseFound(null), []);
  assert.deepEqual(parseFound("not json"), []);
  assert.deepEqual(parseFound('{"pc":true}'), []);
  assert.deepEqual(parseFound('["pc","lamp","pc","nope",3]'), ["pc", "lamp"]);
});
