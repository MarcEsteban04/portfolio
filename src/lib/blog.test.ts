import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePost, readingMinutes, renderPost } from "./blog.ts";

const source = `---
title: "Teaching the office cats to walk"
date: 2026-10-08
summary: Cats now walk to their bowls instead of teleporting.
tags: [three.js, portfolio]
---
The cats used to *appear* at their bowls.
`;

test("reads a post's front matter and body", () => {
  const post = parsePost("2026-10-08-cats", source);
  assert.equal(post?.title, "Teaching the office cats to walk");
  assert.equal(post?.date, "2026-10-08");
  assert.deepEqual(post?.tags, ["three.js", "portfolio"]);
  assert.equal(post?.body, "The cats used to *appear* at their bowls.");
});

test("rejects posts without a title or a proper date", () => {
  assert.equal(parsePost("x", "no front matter"), null);
  assert.equal(parsePost("x", "---\ntitle: Hi\ndate: yesterday\n---\nbody"), null);
});

test("renders Markdown but never raw HTML", () => {
  assert.match(renderPost("**bold**"), /<strong>bold<\/strong>/);
  assert.doesNotMatch(renderPost('<script>alert("x")</script>'), /<script>/);
});

test("estimates reading time", () => {
  assert.equal(readingMinutes("word ".repeat(10)), 1);
  assert.equal(readingMinutes("word ".repeat(660)), 3);
});
