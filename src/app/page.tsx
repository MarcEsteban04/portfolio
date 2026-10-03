import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProjectScreenshot, RepoLink } from "@/app/projects/project-parts";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import {
  education,
  experience,
  languages,
  profile,
  skills,
  stats,
} from "@/lib/profile";
import { projects } from "@/lib/projects";

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-16 border-t border-white/10 py-20 sm:py-28"
    >
      <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          <span className="text-zinc-300">{index}</span> / {title}
        </h2>
        <div>{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="top" className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="flex min-h-[90svh] flex-col justify-center pt-32 pb-20">
          <p className="mb-10 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-zinc-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Available for freelance work
          </p>
          <h1 className="text-[2.625rem] font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {profile.name}
            <span className="block text-zinc-500">{profile.role}.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            {profile.summary}
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Get in touch
            </a>
            <a
              href="#experience"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium transition-colors hover:border-white/40"
            >
              View experience
            </a>
            <span className="font-mono text-xs text-zinc-500 sm:ml-4">
              {profile.location}
            </span>
          </div>

          <dl className="mt-24 grid border-y border-white/10 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse border-white/10 py-8 not-last:border-b sm:px-8 sm:not-last:border-r sm:not-last:border-b-0 sm:first:pl-0"
              >
                <dt className="mt-2 text-sm text-zinc-500">{stat.label}</dt>
                <dd className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <Section id="about" index="01" title="About">
          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-zinc-300 sm:text-2xl">
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Section>

        <Section id="projects" index="02" title="Projects">
          <div className="divide-y divide-white/10">
            {projects.map((project) => (
              <article
                key={project.slug}
                className="py-14 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={project.icon}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 rounded-2xl"
                    />
                    <div>
                      <h3 className="text-xl font-medium tracking-tight">
                        <Link
                          href={`/projects/${project.slug}`}
                          className="transition-colors hover:text-zinc-300"
                        >
                          {project.name}
                        </Link>
                      </h3>
                      <p className="mt-1 font-mono text-xs text-zinc-500">
                        {project.platform} · {project.year}
                      </p>
                    </div>
                  </div>
                  <RepoLink project={project} />
                </div>
                <p className="mt-6 max-w-2xl leading-relaxed text-zinc-400">
                  {project.summary}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/projects/${project.slug}`}
                  aria-label={`${project.name}: screens and full details`}
                  className="-mx-6 mt-10 flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0"
                >
                  {project.screenshots.slice(0, 4).map((shot) => (
                    <span
                      key={shot.src}
                      className="w-[42%] shrink-0 snap-start transition-transform duration-300 hover:-translate-y-1 sm:w-auto"
                    >
                      <ProjectScreenshot
                        project={project}
                        shot={shot}
                        sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 42vw"
                      />
                    </span>
                  ))}
                </Link>
                <Link
                  href={`/projects/${project.slug}`}
                  className="group mt-8 inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-white"
                >
                  Screens and full details
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </Section>

        <Section id="experience" index="03" title="Experience">
          <ol className="divide-y divide-white/10">
            {experience.map((job) => (
              <li
                key={job.company}
                className="grid gap-4 py-10 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:gap-x-10"
              >
                <div>
                  <h3 className="text-xl font-medium tracking-tight">
                    {job.company}
                  </h3>
                  <p className="mt-1 text-zinc-400">{job.role}</p>
                </div>
                <p className="font-mono text-xs text-zinc-500 sm:pt-2 sm:text-right">
                  {job.period}
                </p>
                <ul className="space-y-3 text-zinc-400 sm:col-span-2">
                  {job.points.map((point) => (
                    <li key={point} className="flex gap-4 leading-relaxed">
                      <span className="mt-3 h-px w-4 shrink-0 bg-zinc-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="skills" index="04" title="Skills">
          <div className="divide-y divide-white/10">
            {skills.map((skill) => (
              <div
                key={skill.group}
                className="grid gap-4 py-6 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr]"
              >
                <h3 className="text-sm text-zinc-500">{skill.group}</h3>
                <ul className="flex flex-wrap gap-2">
                  {skill.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-zinc-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="education" index="05" title="Education">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <p className="font-mono text-xs text-zinc-500">
                {education.period}
              </p>
              <h3 className="mt-3 text-xl font-medium tracking-tight">
                {education.degree}
              </h3>
              <p className="mt-1 text-zinc-400">{education.school}</p>
              <p className="mt-1 text-zinc-500">{education.detail}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-zinc-500">
                Award · {education.award.year}
              </p>
              <h3 className="mt-3 text-xl font-medium tracking-tight">
                {education.award.title}
              </h3>
              <p className="mt-1 text-zinc-400">{education.school}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="font-mono text-xs text-zinc-500">Languages</p>
              <p className="mt-3 text-zinc-300">{languages.join(" · ")}</p>
            </div>
          </div>
        </Section>

        <section
          id="contact"
          className="scroll-mt-16 border-t border-white/10 py-24 sm:py-36"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            <span className="text-zinc-300">06</span> / Contact
          </p>
          <h2 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Have a project in mind? Let&apos;s build it.
          </h2>
          <a
            href={`mailto:${profile.email}`}
            className="group mt-10 inline-flex items-center gap-3 text-lg text-zinc-300 transition-colors hover:text-white sm:text-2xl"
          >
            <span className="break-all border-b border-white/20 pb-1 group-hover:border-white">
              {profile.email}
            </span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
