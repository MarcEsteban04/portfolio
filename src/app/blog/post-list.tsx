"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/app/ui/icons";

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  when: string;
  summary: string;
  category: string;
  minutes: number;
};

// The posts, newest first, with a row of categories to narrow them down.
export function PostList({ posts, categories }: { posts: PostSummary[]; categories: string[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const shown = category ? posts.filter((post) => post.category === category) : posts;
  const chip =
    "rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white aria-pressed:text-black";

  return (
    <div className="space-y-3">
      {categories.length > 1 && (
        <div role="group" aria-label="Filter posts by category" className="flex flex-wrap gap-1 px-1">
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip}>
            All
          </button>
          {categories.map((name) => (
            <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)} className={chip}>
              {name}
            </button>
          ))}
        </div>
      )}

      <ol className="panel divide-y divide-white/[0.06] overflow-hidden">
        {shown.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-1.5 p-5 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-baseline sm:gap-8 sm:p-6"
            >
              <span className="w-36 shrink-0">
                <time dateTime={post.date} className="block font-mono text-[11px] tabular-nums text-zinc-500">
                  {post.when}
                </time>
                <span className="mt-1 block text-[11px] text-zinc-600">{post.category}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-zinc-100 group-hover:text-white">{post.title}</span>
                {post.summary && <span className="mt-1 block text-sm text-zinc-400">{post.summary}</span>}
                <span className="mt-2 block text-[11px] text-zinc-500">{post.minutes} min read</span>
              </span>
              <Icon
                name="arrowRight"
                className="hidden size-3.5 shrink-0 self-center text-zinc-600 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-zinc-300 sm:block"
              />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
