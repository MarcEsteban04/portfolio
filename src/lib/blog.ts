// The blog: posts written by AI (see scripts/write-blog-post.ts), on topics
// for developers (AI, web, mobile, databases, freelancing…) and a weekly
// build log from Marc's commits. Kept as Markdown in content/blog with a
// small front matter block, and rendered at build time.
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

export type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  // e.g. "AI", "Web development" or "Build log" (posts without one are build logs).
  category: string;
  // The topic id from blog-topics.ts, for topic posts.
  topic: string;
  body: string;
};

// Reads the "key: value" block between --- lines at the top of a post.
// Values may be quoted, and [a, b] makes a list.
export function parsePost(slug: string, source: string): Post | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const fields: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (!pair) continue;
    const raw = pair[2].trim();
    const unquote = (value: string) => value.trim().replace(/^["']|["']$/g, "");
    fields[pair[1]] = raw.startsWith("[")
      ? raw.slice(1, -1).split(",").map(unquote).filter(Boolean)
      : unquote(raw);
  }
  const { title, date, summary, tags, category, topic } = fields;
  if (typeof title !== "string" || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    slug,
    title,
    date,
    summary: typeof summary === "string" ? summary : "",
    tags: Array.isArray(tags) ? tags : [],
    category: typeof category === "string" && category ? category : "Build log",
    topic: typeof topic === "string" ? topic : "",
    body: match[2].trim(),
  };
}

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).length / 220));
}

const folder = path.join(process.cwd(), "content", "blog");

// Every post, newest first.
export function getPosts(): Post[] {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parsePost(file.replace(/\.md$/, ""), fs.readFileSync(path.join(folder, file), "utf8")))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => (a.date === b.date ? b.slug.localeCompare(a.slug) : b.date.localeCompare(a.date)));
}

export function getPost(slug: string) {
  return getPosts().find((post) => post.slug === slug);
}

// Markdown to HTML. Raw HTML in a post is shown as text, never run, since
// the posts are written by a model.
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
marked.use({ renderer: { html: ({ text }) => escape(text) } });

export function renderPost(body: string) {
  return marked.parse(body, { async: false });
}

export const formatPostDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
