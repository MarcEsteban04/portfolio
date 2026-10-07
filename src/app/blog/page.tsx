import type { Metadata } from "next";
import { PostList } from "@/app/blog/post-list";
import { formatPostDate, getPosts, readingMinutes } from "@/lib/blog";
import { categories } from "@/lib/blog-topics";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Blog | ${profile.name}`,
  description: `${profile.name} on AI, web development, mobile, databases, freelancing and what he's building.`,
};

export default function BlogPage() {
  const posts = getPosts();
  // Categories in their usual order, only the ones that have posts.
  const present = categories.filter((name) => posts.some((post) => post.category === name));

  return (
    <div className="space-y-3">
      <header className="animate-rise px-1 pt-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Blog</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">Notes from the build.</h1>
      </header>

      {posts.length === 0 ? (
        <div className="panel p-8 text-sm text-zinc-500">The first post is on its way.</div>
      ) : (
        <PostList
          categories={present}
          posts={posts.map((post) => ({
            slug: post.slug,
            title: post.title,
            date: post.date,
            when: formatPostDate(post.date),
            summary: post.summary,
            category: post.category,
            minutes: readingMinutes(post.body),
          }))}
        />
      )}
    </div>
  );
}
