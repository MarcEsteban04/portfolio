import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePost } from "./blog.ts";
import {
  buildPrompt,
  buildTopicPrompt,
  daysBefore,
  isSunday,
  manilaDate,
  postFile,
  readDraft,
  slugify,
  worthWriting,
  type Commit,
} from "./blog-writer.ts";
import { nextTopic, topics } from "./blog-topics.ts";

const commit = (message: string, sha: string, repo = "MarcEsteban04/portfolio", hidden = false): Commit => ({
  repo,
  private: hidden,
  message,
  sha,
});

test("writes about the Manila day", () => {
  assert.equal(manilaDate(new Date("2026-10-08T17:30:00Z")), "2026-10-09");
});

test("skips merges, the blog's own commits and duplicates", () => {
  const kept = worthWriting([
    commit("Office: cats walk to their bowls", "a"),
    commit("Merge pull request #4 from x/y", "b"),
    commit("Blog: Teaching cats to walk", "c"),
    commit("Office: cats walk to their bowls", "a"),
  ]);
  assert.deepEqual(kept.map((c) => c.sha), ["a"]);
});

test("keeps private projects anonymous in the prompt", () => {
  const { user } = buildPrompt("Marc", "2026-10-08", [commit("Add invoices", "d", "acme/secret-pos", true)]);
  assert.doesNotMatch(user, /secret-pos/);
  assert.match(user, /private client project/);
});

const body = "I spent the day on the office cats. ".repeat(20);

test("accepts a good draft and cleans it", () => {
  const draft = readDraft(
    JSON.stringify({ title: 'Cats that "walk" 🐱', summary: "They walk now.", tags: ["Three.js", "portfolio"], body: `# Heading\n${body}` }),
  );
  assert.equal(draft?.title, "Cats that 'walk'");
  assert.deepEqual(draft?.tags, ["three.js", "portfolio"]);
  assert.doesNotMatch(draft!.body, /^# Heading/);
});

test("rejects replies that aren't usable", () => {
  assert.equal(readDraft("not json"), null);
  assert.equal(readDraft(JSON.stringify({ title: "Short", body: "Too short." })), null);
});

test("makes a file the blog can read back", () => {
  const draft = readDraft(JSON.stringify({ title: "Cats that walk", summary: "They walk now.", tags: ["cats"], body }))!;
  const { name, text } = postFile("2026-10-08", draft, { category: "AI", topic: "ai-pair" });
  assert.equal(name, "2026-10-08-cats-that-walk.md");
  const post = parsePost(name.replace(/\.md$/, ""), text);
  assert.equal(post?.title, "Cats that walk");
  assert.deepEqual(post?.tags, ["cats"]);
  assert.equal(post?.category, "AI");
  assert.equal(post?.topic, "ai-pair");
  assert.equal(slugify("Hello, World!"), "hello-world");
});

test("Sundays are build logs, and a week runs back six days", () => {
  assert.equal(isSunday("2026-10-11"), true);
  assert.equal(isSunday("2026-10-08"), false);
  assert.equal(daysBefore("2026-10-11", 6), "2026-10-05");
});

test("build logs always speak as Marc, and only of what stuck", () => {
  const { system, user } = buildPrompt("Marc", "2026-10-11", [commit("Add cats", "e")], "2026-10-05");
  assert.match(system, /always write as "I"/);
  assert.match(system, /Later commits win/);
  assert.match(user, /from 2026-10-05 to 2026-10-11/);
});

test("topic posts stay evergreen", () => {
  const { system, user } = buildTopicPrompt("Marc", ["Next.js", "Supabase"], "Server Components explained", "Web development");
  assert.match(system, /no news/);
  assert.match(user, /Server Components/);
});

test("topics go in order and never repeat until all are used", () => {
  assert.equal(nextTopic([]).id, topics[0].id);
  assert.equal(nextTopic([topics[0].id]).id, topics[1].id);
  assert.equal(new Set(topics.map((topic) => topic.id)).size, topics.length);
  const everything = topics.map((topic) => topic.id);
  assert.ok(topics.some((topic) => topic.id === nextTopic(everything).id));
});

test("build logs show each commit's date, so there's no invented timeline", () => {
  const { system, user } = buildPrompt("Marc", "2026-10-08", [{ ...commit("Add cats", "f"), day: "2026-10-08" }]);
  assert.match(user, /\[2026-10-08\] Add cats/);
  assert.match(system, /not as a day-by-day diary/);
});
