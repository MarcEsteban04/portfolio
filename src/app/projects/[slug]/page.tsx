import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  accentStyle,
  isLandscape,
  RepoLink,
} from "@/app/projects/project-parts";
import { ZoomableScreenshot } from "@/app/projects/zoomable-screenshot";
import { Icon, type IconName } from "@/app/ui/icons";
import { PanelHeader } from "@/app/ui/panel";
import { profile } from "@/lib/profile";
import { getProject, projects } from "@/lib/projects";
import { pageMetadata } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) return {};
  return pageMetadata({
    title: `${project.name} | ${profile.name}`,
    description: project.organization
      ? `${project.name}: ${project.tagline} ${profile.name}'s work at ${project.organization}.`
      : `${project.name}: ${project.tagline} ${project.platform}, built by ${profile.name}.`,
    path: `/projects/${project.slug}`,
  });
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  const position = projects.indexOf(project);
  const previous = projects[(position - 1 + projects.length) % projects.length];
  const next = projects[(position + 1) % projects.length];
  const landscape = isLandscape(project);

  const facts: { icon: IconName; label: string; value: string }[] = [
    {
      icon: landscape ? "monitor" : "smartphone",
      label: "Platform",
      value: project.platform,
    },
    { icon: "calendar", label: "Year", value: project.year },
    {
      icon: project.repo.visibility === "private" ? "lock" : "github",
      label: "Source",
      value:
        project.repo.visibility === "private"
          ? "Private repository"
          : "Public on GitHub",
    },
    {
      icon: "layers",
      label: "Stack",
      value: `${project.stack.length} technologies`,
    },
  ];

  return (
    <article style={accentStyle(project.slug)} className="space-y-4">
      <header className="panel animate-rise overflow-hidden p-5 sm:p-8">
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <Image
                src={project.icon}
                alt=""
                width={72}
                height={72}
                loading="eager"
                className="size-16 rounded-2xl sm:size-[72px]"
              />
              <div>
                <p className="font-mono text-[11px] text-zinc-500">
                  {project.platform} · {project.year}
                </p>
                <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                  {project.name}
                </h1>
              </div>
            </div>
            <RepoLink project={project} />
          </div>
          <p className="mt-8 max-w-3xl text-xl leading-relaxed text-balance text-zinc-200 sm:text-2xl">
            {project.tagline}
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-zinc-400">
            {project.summary}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex min-w-0 flex-col-reverse rounded-xl border border-white/[0.06] bg-black/25 p-3.5 sm:p-4"
              >
                <dt className="mt-1 text-xs text-zinc-500">{fact.label}</dt>
                <dd className="flex flex-col items-start gap-1.5 text-sm font-medium break-words text-zinc-100 sm:flex-row sm:items-center sm:gap-2">
                  <Icon
                    name={fact.icon}
                    className="size-4 shrink-0 text-[rgb(var(--project))]"
                  />
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section aria-labelledby="screens" className="panel p-6 sm:p-7">
        <PanelHeader
          id="screens"
          icon={landscape ? "monitor" : "smartphone"}
          title="Screens"
          description={`${project.screenshots.length} screens · select one to enlarge`}
        />
        <ul
          className={`mt-6 grid gap-x-5 gap-y-8 ${
            landscape
              ? "sm:grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {project.screenshots.map((shot) => (
            <li key={shot.src}>
              <figure>
                <ZoomableScreenshot
                  project={{
                    framed: project.framed,
                    screenshotSize: project.screenshotSize,
                  }}
                  shot={shot}
                  sizes={
                    landscape
                      ? "(min-width: 640px) 460px, 100vw"
                      : "(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
                  }
                />
                <figcaption className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {shot.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="features" className="panel p-6 sm:p-7">
        <PanelHeader
          id="features"
          icon="sparkles"
          title="What it does"
          description={`${project.features.length} key features`}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {project.features.map((feature, i) => (
            <li
              key={feature.title}
              className="rounded-xl border border-white/[0.06] bg-black/20 p-5 transition-colors hover:border-[rgb(var(--project)/0.35)]"
            >
              <p className="font-mono text-[11px] text-[rgb(var(--project))]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-medium tracking-tight text-zinc-50">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {project.details.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {project.details.map((detail) => (
            <section
              key={detail.title}
              aria-label={detail.title}
              className="panel p-6 sm:p-7"
            >
              <PanelHeader icon="code" title={detail.title} />
              <dl className="mt-5 divide-y divide-white/[0.06]">
                {detail.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-1 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr] sm:gap-6"
                  >
                    <dt className="text-sm text-zinc-500">{row.label}</dt>
                    <dd className="text-sm leading-relaxed text-zinc-300">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}

      <section aria-labelledby="stack" className="panel p-6 sm:p-7">
        <PanelHeader id="stack" icon="layers" title="Built with" />
        <ul className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="More projects" className="grid gap-4 sm:grid-cols-2">
        {[
          { project: previous, label: "Previous", icon: "arrowLeft" as const },
          { project: next, label: "Next", icon: "arrowRight" as const },
        ].map(({ project: other, label, icon }) => (
          <Link
            key={label}
            href={`/projects/${other.slug}`}
            style={accentStyle(other.slug)}
            className={`panel group flex items-center gap-4 p-5 transition-shadow hover:shadow-[0_0_0_1px_rgb(var(--project)/0.4)] ${
              label === "Next" ? "sm:flex-row-reverse sm:text-right" : ""
            }`}
          >
            <Icon
              name={icon}
              className="size-4 shrink-0 text-zinc-500 transition-colors group-hover:text-white"
            />
            <Image
              src={other.icon}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-xl"
            />
            <span className="min-w-0">
              <span className="block font-mono text-[11px] text-zinc-500">
                {label} project
              </span>
              <span className="block truncate font-medium text-zinc-100">
                {other.name}
              </span>
            </span>
          </Link>
        ))}
      </nav>
    </article>
  );
}
