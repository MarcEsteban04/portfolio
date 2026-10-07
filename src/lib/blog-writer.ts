// The pieces of scripts/write-blog-post.ts that don't touch the network:
// which day to write about, the prompt, checking the model's answer, and
// the Markdown file it becomes. Kept free of path aliases so the script can
// import it directly.

// `day` is the commit's date in Manila (YYYY-MM-DD), when known.
export type Commit = { repo: string; private: boolean; message: string; sha: string; day?: string };

export type Draft = { title: string; summary: string; tags: string[]; body: string };

// Today's date in Manila, as YYYY-MM-DD.
export function manilaDate(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
}

// The start of the first day and the end of the last, in Manila time, for
// GitHub's commit search.
export function manilaDays(first: string, last: string = first) {
  return { from: `${first}T00:00:00+08:00`, to: `${last}T23:59:59+08:00` };
}

// The date `days` before a YYYY-MM-DD date.
export function daysBefore(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// Sundays are for the week's build log; the other days for topics.
export function isSunday(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay() === 0;
}

// Commits worth writing about: no merges, and not the blog's own posts.
export function worthWriting(commits: Commit[]) {
  const seen = new Set<string>();
  return commits.filter((commit) => {
    if (seen.has(commit.sha)) return false;
    seen.add(commit.sha);
    const subject = commit.message.split("\n")[0];
    return !/^merge (pull request|branch)/i.test(subject) && !/^blog:/i.test(subject);
  });
}

const banned = [
  "delve",
  "game-changer",
  "game changer",
  "seamless",
  "leverage",
  "robust",
  "elevate",
  "unleash",
  "supercharge",
  "cutting-edge",
  "in today's fast-paced",
  "tapestry",
  "journey",
];

const style = `Style: plain, specific and friendly, like a developer's notebook. Short paragraphs. No emoji, no hashtags, no exclamation-mark hype, and none of these words: ${banned.join(", ")}. Don't mention that the post was written by AI.`;
const shape = (words: string) =>
  `Reply with JSON only: {"title": string (under 70 characters, no quotes, sentence case), "summary": string (one sentence, under 160 characters), "tags": string[] (2 to 4 short lowercase tags), "body": string (Markdown, ${words} words, may use ## headings, lists, \`code\` and short fenced code blocks, no title heading)}.`;

// A post on a topic for developers, in Marc's voice and grounded in the
// tools he uses, with nothing time-sensitive the model could get wrong.
export function buildTopicPrompt(name: string, stack: string[], idea: string, category: string) {
  const system = `You write blog posts for ${name}, a freelance full-stack web developer in Bulacan, Philippines, in his own voice (first person, "I").
He builds websites, internal systems and apps for small businesses with ${stack.join(", ")}.
Write a useful ${category} post for other developers and curious clients on the idea given. Give concrete, correct, practical advice, the kind he'd share from his own work; short code examples are welcome if they help, and must be correct.
Keep it evergreen: no news, no claims about recent releases, version numbers, prices or benchmarks, and no invented stories about specific clients, numbers or dates.
When you mention tools or products (Claude, Codex, Gemini and so on), talk about how he uses them and what for; don't state facts about how they are packaged, integrated, priced or which editor or extension provides them. Use his stack for examples (JavaScript or TypeScript, SQL, Dart for Flutter).
${style}
${shape("450 to 750")}`;
  return { system, user: `Topic: ${idea}` };
}

export function buildPrompt(name: string, date: string, commits: Commit[], first: string = date) {
  const byRepo = new Map<string, Commit[]>();
  for (const commit of commits) byRepo.set(commit.repo, [...(byRepo.get(commit.repo) ?? []), commit]);
  const work = [...byRepo.entries()]
    .map(([repo, list]) => {
      const label = list[0].private ? "a private client project (don't name it)" : repo;
      const lines = list.map(
        (commit) => `- ${commit.day ? `[${commit.day}] ` : ""}${commit.message.trim().slice(0, 600).replace(/\n+/g, "\n  ")}`,
      );
      return `Repository: ${label}\n${lines.join("\n")}`;
    })
    .join("\n\n");
  // A busy week shouldn't blow the model's token limit: fall back to
  // commit subjects only.
  const list =
    work.length <= 14_000
      ? work
      : commits.map((commit) => `- ${commit.repo}: ${commit.message.split("\n")[0]}`).join("\n").slice(0, 14_000);
  const span = first === date ? `on ${date}` : `from ${first} to ${date}`;

  const system = `You write a build log for ${name}, a freelance full-stack web developer in Bulacan, Philippines, in his own voice (first person, "I"; commit messages may call him Marc or "he", but always write as "I").
Write about what he actually built ${span}, using only the commits below, in order. Later commits win: if something was added and later removed, replaced or reverted, describe only how it ended up. Never invent features, numbers, clients or results that the commits don't show.
Organise the post by theme (what got better and why), not as a day-by-day diary, and don't invent a timeline: each commit shows its date. Explain why a change matters to the person using the thing, not just what changed. Keep private projects anonymous.
${style}
${shape("250 to 500")}`;

  return { system, user: `Commits ${span}:\n\n${list}` };
}

const pictographs = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
const tidy = (text: string) => text.replace(pictographs, "").replace(/[ \t]+\n/g, "\n").trim();

// Checks the model's reply and cleans it up, or returns null if it's not usable.
export function readDraft(reply: string): Draft | null {
  let data: unknown;
  try {
    data = JSON.parse(reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
  const { title, summary, tags, body } = (data ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || typeof body !== "string" || body.trim().split(/\s+/).length < 80) return null;
  const oneLine = (text: string) => tidy(text).replace(/\s+/g, " ").replace(/["]/g, "'");
  return {
    title: oneLine(title).slice(0, 90),
    summary: typeof summary === "string" ? oneLine(summary).slice(0, 200) : "",
    tags: (Array.isArray(tags) ? tags : [])
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => oneLine(tag).toLowerCase().replace(/[,[\]]/g, ""))
      .filter(Boolean)
      .slice(0, 4),
    body: tidy(body).replace(/^#\s.*\n+/, ""),
  };
}

export function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60)
      .replace(/-+$/, "") || "notes"
  );
}

// The post as a file in content/blog, named after the day and the title.
export function postFile(date: string, draft: Draft, about: { category: string; topic?: string }) {
  const name = `${date}-${slugify(draft.title)}.md`;
  const text = `---
title: "${draft.title}"
date: ${date}
category: ${about.category}
${about.topic ? `topic: ${about.topic}\n` : ""}summary: "${draft.summary}"
tags: [${draft.tags.join(", ")}]
---

${draft.body}
`;
  return { name, text };
}
