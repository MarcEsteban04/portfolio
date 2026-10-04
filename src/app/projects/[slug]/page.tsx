import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RepoLink } from "@/app/projects/project-parts";
import { ZoomableScreenshot } from "@/app/projects/zoomable-screenshot";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import { profile } from "@/lib/profile";
import { getProject, projects } from "@/lib/projects";

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
  return {
    title: `${project.name} | ${profile.name}`,
    description: `${project.name}: ${project.tagline} ${project.platform}, built by ${profile.name}.`,
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  const facts = [
    { label: "Platform", value: project.platform },
    { label: "Year", value: project.year },
    {
      label: "Source",
      value:
        project.repo.visibility === "private"
          ? "Private repository"
          : "Public on GitHub",
    },
  ];

  return (
    <>
      <SiteHeader current="/#projects" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-32 pb-24 sm:pt-40">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          <Link href="/#projects" className="transition-colors hover:text-white">
            Projects
          </Link>{" "}
          / <span className="text-zinc-300">{project.name}</span>
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <Image
              src={project.icon}
              alt=""
              width={72}
              height={72}
              className="size-16 rounded-2xl sm:size-[72px]"
            />
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              {project.name}
            </h1>
          </div>
          <RepoLink project={project} />
        </div>
        <p className="mt-8 max-w-3xl text-xl leading-relaxed text-zinc-300 text-balance sm:text-2xl">
          {project.tagline}
        </p>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400">
          {project.summary}
        </p>

        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-y border-white/10 py-8 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-sm text-zinc-500">{fact.label}</dt>
              <dd className="text-lg font-medium tracking-tight">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="screens" className="mt-20">
          <h2
            id="screens"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500"
          >
            Screens
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {project.screenshots.map((shot) => (
              <li key={shot.src}>
                <figure>
                  <ZoomableScreenshot
                    project={{
                      framed: project.framed,
                      screenshotSize: project.screenshotSize,
                    }}
                    shot={shot}
                    sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw"
                  />
                  <figcaption className="mt-4 text-sm leading-relaxed text-zinc-400">
                    {shot.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="features"
          className="mt-24 border-t border-white/10 pt-12"
        >
          <h2
            id="features"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500"
          >
            What it does
          </h2>
          <ul className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {project.features.map((feature) => (
              <li key={feature.title}>
                <h3 className="text-lg font-medium tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-zinc-400">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {project.details.map((detail) => (
          <section
            key={detail.title}
            aria-label={detail.title}
            className="mt-24 border-t border-white/10 pt-12"
          >
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              {detail.title}
            </h2>
            <dl className="mt-10 divide-y divide-white/10">
              {detail.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr] sm:gap-8"
                >
                  <dt className="text-sm text-zinc-500">{row.label}</dt>
                  <dd className="leading-relaxed text-zinc-300">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="mt-24 border-t border-white/10 pt-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            Built with
          </h2>
          <ul className="mt-8 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-zinc-200"
              >
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/#projects"
            className="group mt-16 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <span
              aria-hidden
              className="transition-transform group-hover:-translate-x-1"
            >
              ←
            </span>
            All projects
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
