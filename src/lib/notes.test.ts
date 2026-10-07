import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanNote } from "./notes.ts";

test("tidies a note and fills in a name", () => {
  assert.deepEqual(cleanNote({ body: "  nice   room!  " }), { ok: true, name: "A visitor", body: "nice room!" });
  assert.deepEqual(cleanNote({ name: " Jo ", body: "hi from Cebu" }), { ok: true, name: "Jo", body: "hi from Cebu" });
});

test("turns away empty, long, linky or rude notes", () => {
  assert.equal(cleanNote({ body: "   " }).ok, false);
  assert.equal(cleanNote({ body: "x".repeat(81) }).ok, false);
  assert.equal(cleanNote({ body: "visit https://spam.example" }).ok, false);
  assert.equal(cleanNote({ body: "buy at cheap.com" }).ok, false);
  assert.equal(cleanNote({ body: "shit room" }).ok, false);
  assert.equal(cleanNote({ body: 42 }).ok, false);
});
