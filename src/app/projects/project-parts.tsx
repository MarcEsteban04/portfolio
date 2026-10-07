import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/app/ui/icons";
import type { Project, Screenshot } from "@/lib/projects";

// Each project's brand color, taken from its icon, as "r g b" for rgb(var() / a).
const accents: Record<string, string> = {
  obsidian: "139 92 246",
  velora: "249 115 22",
  shipwright: "129 140 248",
};

export function accentStyle(slug: string) {
  return { "--project": accents[slug] ?? "161 161 170" } as CSSProperties;
}

export function ProjectScreenshot({
  project,
  shot,
  sizes,
  className = "",
}: {
  project: Pick<Project, "framed" | "screenshotSize">;
  shot: Screenshot;
  sizes: string;
  className?: string;
}) {
  return (
    <Image
      src={shot.src}
      alt={shot.alt}
      width={project.screenshotSize.width}
      height={project.screenshotSize.height}
      sizes={sizes}
      className={`h-auto w-full ${project.framed ? "" : "rounded-[1rem] ring-1 ring-white/10"} ${className}`}
    />
  );
}

export function isLandscape(project: Pick<Project, "screenshotSize">) {
  return project.screenshotSize.width > project.screenshotSize.height;
}

export function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#111216] ring-1 ring-white/10 shadow-2xl shadow-black/60">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
      </div>
      {children}
    </div>
  );
}

// A glimpse of the app for its card: a browser window for web apps, a fan of
// three phones for mobile ones. Screenshots here are decorative, since the card
// links to the full gallery.
export function ProjectPreview({ project }: { project: Project }) {
  const [first, second, third] = project.screenshots;

  return (
    <div className="relative h-60 overflow-hidden rounded-t-[1.25rem] bg-[radial-gradient(120%_90%_at_50%_0%,rgb(var(--project)/0.12),transparent_70%)]">
      <div className="bg-dots absolute inset-0" />
      {isLandscape(project) ? (
        <div className="absolute inset-x-6 top-8 transition-transform duration-500 ease-out group-hover:-translate-y-2">
          <BrowserFrame>
            <Image
              src={first.src}
              alt=""
              width={project.screenshotSize.width}
              height={project.screenshotSize.height}
              sizes="(min-width: 1024px) 360px, 90vw"
              className="h-auto w-full"
            />
          </BrowserFrame>
        </div>
      ) : (
        <div className="absolute inset-x-0 top-7 flex justify-center gap-3 px-6">
          {[second, first, third].filter(Boolean).map((shot, i) => (
            <div
              key={shot.src}
              className={`w-[30%] max-w-32 shrink-0 transition-transform duration-500 ease-out ${
                i === 1
                  ? "z-10 group-hover:-translate-y-2"
                  : "mt-6 opacity-80 group-hover:-translate-y-1 group-hover:opacity-100"
              }`}
            >
              <Image
                src={shot.src}
                alt=""
                width={project.screenshotSize.width}
                height={project.screenshotSize.height}
                sizes="128px"
                className={`h-auto w-full shadow-2xl shadow-black/60 ${project.framed ? "" : "rounded-xl ring-1 ring-white/10"}`}
              />
            </div>
          ))}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0c0d10] to-transparent" />
    </div>
  );
}

export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const extra = project.stack.length - 4;
  return (
    <article
      style={{ ...accentStyle(project.slug), "--i": index } as CSSProperties}
      className="panel group flex animate-rise flex-col bg-[#0c0d10] transition-shadow duration-300 stagger hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(255_255_255/0.18)]"
    >
      <ProjectPreview project={project} />
      <div className="flex flex-1 flex-col p-5 pt-1">
        <div className="flex items-center gap-3">
          <Image
            src={project.icon}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl"
          />
          <div className="min-w-0">
            <h3 className="font-medium tracking-tight text-zinc-50">
              <Link
                href={`/projects/${project.slug}`}
                className="outline-none after:absolute after:inset-0 after:rounded-[1.25rem] focus-visible:after:ring-2 focus-visible:after:ring-[rgb(var(--project))]"
              >
                {project.name}
              </Link>
            </h3>
            <p className="font-mono text-[11px] text-zinc-500">
              {project.platform} · {project.year}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          {project.tagline}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((item) => (
            <li
              key={item}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-300"
            >
              {item}
            </li>
          ))}
          {extra > 0 && (
            <li className="rounded-md px-1.5 py-0.5 text-[11px] text-zinc-500">
              +{extra} more
            </li>
          )}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300 transition-colors group-hover:text-white">
            View case study
            <Icon
              name="arrowRight"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <RepoBadge project={project} />
        </div>
      </div>
    </article>
  );
}

// A small status badge for cards, where a nested link would fight the card's own.
export function RepoBadge({ project }: { project: Project }) {
  const isPrivate = project.repo.visibility === "private";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
      <Icon name={isPrivate ? "lock" : "github"} className="size-3" />
      {isPrivate ? "Private" : "Open source"}
    </span>
  );
}

export function RepoLink({ project }: { project: Project }) {
  if (project.repo.visibility === "private") {
    return (
      <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-zinc-400">
        <Icon name="lock" className="size-3.5" />
        Private repository
      </span>
    );
  }

  return (
    <a
      href={project.repo.url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
    >
      <Icon name="github" className="size-3.5" />
      Source on GitHub
      <Icon
        name="arrowUpRight"
        className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
}
