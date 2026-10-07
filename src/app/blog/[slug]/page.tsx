import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/app/ui/icons";
import { formatPostDate, getPost, getPosts, readingMinutes, renderPost } from "@/lib/blog";
import { profile } from "@/lib/profile";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: `${post.title} | ${profile.name}`, description: post.summary };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="panel animate-rise p-6 sm:p-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-200"
      >
        <Icon name="arrowLeft" className="size-3.5" />
        All posts
      </Link>
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-[11px] tabular-nums text-zinc-500">
          {post.category} · <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {readingMinutes(post.body)} min read
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{post.title}</h1>
        {post.summary && <p className="mt-3 text-zinc-400 sm:text-lg">{post.summary}</p>}
      </header>
      {/* Rendered from Markdown with raw HTML escaped (see renderPost). */}
      <div className="post-body mt-8 max-w-3xl" dangerouslySetInnerHTML={{ __html: renderPost(post.body) }} />
      <footer className="mt-10 flex max-w-3xl flex-wrap items-center gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-zinc-500">
        <Icon name="pen" className="size-3.5" />
        {post.category === "Build log" ? "Written with AI from my commits." : "Written with AI."}
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-white/[0.08] px-1.5 py-0.5">
            {tag}
          </span>
        ))}
      </footer>
    </article>
  );
}
