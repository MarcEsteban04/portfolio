// Writes the day's blog post and saves it to content/blog, using Groq (or
// OpenAI as a fallback). Monday to Saturday it's a post on the next topic in
// src/lib/blog-topics.ts (AI, web, mobile, databases, freelancing…); on
// Sunday it's a build log of the week's commits from GitHub, or a topic post
// if there weren't any. Run by .github/workflows/daily-blog.yml, or by hand:
//
//   npm run blog:write
//
// Env: GROQ_AI_API_KEY and/or OPENAI_API_KEY; GITHUB_TOKEN (optional; a
// personal token also includes private repos, kept anonymous); BLOG_DATE
// (YYYY-MM-DD, defaults to today in Manila); BLOG_KIND=topic|build to choose;
// BLOG_FORCE=1 to write even if the day already has a post; BLOG_DRY_RUN=1
// to print the post instead of saving it.
import fs from "node:fs";
import path from "node:path";
import { getPosts } from "../src/lib/blog.ts";
import { nextTopic } from "../src/lib/blog-topics.ts";
import {
  buildPrompt,
  buildTopicPrompt,
  daysBefore,
  isSunday,
  manilaDate,
  manilaDays,
  postFile,
  readDraft,
  worthWriting,
  type Commit,
} from "../src/lib/blog-writer.ts";
import { coreStack } from "../src/lib/profile.ts";

const user = process.env.GITHUB_USER || "MarcEsteban04";
const author = process.env.BLOG_AUTHOR || "Marc Esteban";
const date = process.env.BLOG_DATE?.trim() || manilaDate();
const folder = path.join(process.cwd(), "content", "blog");
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

function output(values: Record<string, string>) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) fs.appendFileSync(file, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(""));
}

async function commitsBetween(first: string, last: string): Promise<Commit[]> {
  const { from, to } = manilaDays(first, last);
  const query = new URLSearchParams({
    q: `author:${user} author-date:${from}..${to}`,
    sort: "author-date",
    order: "asc",
    per_page: "100",
  });
  const res = await fetch(`https://api.github.com/search/commits?${query}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "portfolio-blog-writer",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub search failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    items: {
      sha: string;
      commit: { message: string; author: { date: string } };
      repository: { full_name: string; private: boolean };
    }[];
  };
  return data.items.map((item) => ({
    sha: item.sha,
    message: item.commit.message,
    repo: item.repository.full_name,
    private: item.repository.private,
    day: manilaDate(new Date(item.commit.author.date)),
  }));
}

const providers = [
  {
    name: "Groq",
    key: process.env.GROQ_AI_API_KEY,
    url: "https://api.groq.com/openai/v1/chat/completions",
    body: { model: "openai/gpt-oss-120b", reasoning_effort: "medium", include_reasoning: false },
  },
  {
    name: "OpenAI",
    key: process.env.OPENAI_API_KEY,
    url: "https://api.openai.com/v1/chat/completions",
    body: { model: "gpt-5.4-mini", reasoning_effort: "low" },
  },
];

async function write(system: string, prompt: string) {
  for (const provider of providers) {
    if (!provider.key) continue;
    // A few tries each: rate limits get a pause, and an unusable reply
    // gets another go.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(provider.url, {
          method: "POST",
          headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            ...provider.body,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ],
          }),
          signal: AbortSignal.timeout(120_000),
        });
        if (res.status === 429) {
          const wait = Number(res.headers.get("retry-after")) || 15;
          console.warn(`${provider.name} is rate-limiting; waiting ${wait}s.`);
          await sleep(Math.min(wait, 60) * 1000);
          continue;
        }
        if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
        const data = (await res.json()) as { choices: { message: { content: string } }[] };
        const draft = readDraft(data.choices[0]?.message?.content ?? "");
        if (draft) return { draft, provider: provider.name };
        console.warn(`${provider.name} gave an unusable draft (attempt ${attempt}).`);
      } catch (error) {
        console.warn(`${provider.name} failed (attempt ${attempt}):`, error instanceof Error ? error.message : error);
      }
    }
  }
  throw new Error("No provider wrote a usable post. Is GROQ_AI_API_KEY or OPENAI_API_KEY set?");
}

// What to write today: the week's build log on Sundays (if there's any work
// to show), otherwise the next topic.
async function plan() {
  const kind = process.env.BLOG_KIND || (isSunday(date) ? "build" : "topic");
  if (kind === "build") {
    const first = daysBefore(date, 6);
    const commits = worthWriting(await commitsBetween(first, date));
    if (commits.length > 0) {
      console.log(`Build log: ${commits.length} commits from ${first} to ${date}.`);
      return { prompt: buildPrompt(author, date, commits, first), about: { category: "Build log" } };
    }
    console.log(`No commits from ${first} to ${date}; writing a topic post instead.`);
  }
  const topic = nextTopic(getPosts().map((post) => post.topic).filter(Boolean));
  console.log(`Topic (${topic.category}): ${topic.idea}`);
  return {
    prompt: buildTopicPrompt(author, coreStack, topic.idea, topic.category),
    about: { category: topic.category, topic: topic.id },
  };
}

async function main() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`BLOG_DATE must be YYYY-MM-DD, got "${date}"`);
  const already = fs.existsSync(folder) && fs.readdirSync(folder).some((file) => file.startsWith(`${date}-`));
  if (already && !process.env.BLOG_FORCE) {
    console.log(`There's already a post for ${date}; skipping.`);
    return;
  }

  const { prompt, about } = await plan();
  const { draft, provider } = await write(prompt.system, prompt.user);
  const { name, text } = postFile(date, draft, about);

  if (process.env.BLOG_DRY_RUN) {
    console.log(`\n--- ${name} (by ${provider}) ---\n${text}`);
    return;
  }
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, name), text);
  console.log(`Wrote content/blog/${name} with ${provider}.`);
  output({ file: `content/blog/${name}`, title: draft.title, date });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
