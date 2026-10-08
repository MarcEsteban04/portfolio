import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ContributionGraph } from "@/app/contributions/calendar";
import { contributionStats, plural } from "@/app/contributions/contribution-stats";
import { ProjectCard } from "@/app/projects/project-parts";
import { Icon, type IconName } from "@/app/ui/icons";
import {
  IconBadge,
  PanelHeader,
  StatTile,
  TextLink,
  type Tone,
} from "@/app/ui/panel";
import { AskPrompt } from "@/app/ui/ask";
import { ContactCards, ContactChips } from "@/app/ui/contacts";
import { HeroInvites } from "@/app/ui/invites";
import { Lanyard } from "@/app/ui/lanyard";
import { StatusDot } from "@/app/ui/sidebar";
import { CommandTrigger, CopyButton, LocalTime, ShortcutHint } from "@/app/ui/widgets";
import { getContributions, summarize } from "@/lib/github";
import {
  coreStack,
  education,
  experience,
  languages,
  getStats,
  profile,
  services,
  skills,
  summary as summaryFor,
  yearsShipping,
} from "@/lib/profile";
import { projects } from "@/lib/projects";

const statIcons: IconName[] = ["clock", "check", "zap"];
const statTones: Tone[] = ["sky", "emerald", "amber"];

const serviceIcons: IconName[] = ["monitor", "database", "code", "zap"];
const serviceTones: Tone[] = ["sky", "emerald", "violet", "amber"];

const skillTones: Record<string, Tone> = {
  Frontend: "sky",
  Backend: "violet",
  Data: "amber",
  Practice: "emerald",
};

const skillIcons: Record<string, IconName> = {
  Frontend: "code",
  Backend: "server",
  Data: "database",
  Practice: "sparkles",
};


function rise(index: number) {
  return { "--i": index } as CSSProperties;
}

function parseGpa(detail: string) {
  const match = detail.match(/([\d.]+)\s*\/\s*([\d.]+)/);
  return match ? { score: match[1], scale: match[2] } : null;
}

export default async function Home() {
  const years = yearsShipping();
  const stats = getStats(years);
  const calendar = await getContributions(profile.github);
  const summary = calendar && summarize(calendar);
  const current = experience[0];
  const gpa = parseGpa(education.detail);
  const skillCount = skills.reduce((sum, group) => sum + group.items.length, 0);

  const latest = projects[0];

  return (
    <div className="space-y-4">
      {/* Overview */}
      <section
        id="overview"
        aria-labelledby="overview-title"
        className="grid scroll-mt-20 gap-4 lg:grid-cols-12"
      >
        <div className="flex flex-col gap-4 lg:col-span-8 2xl:col-span-9">
        <div
          style={rise(0)}
          className="panel flex-1 animate-rise overflow-hidden p-6 stagger sm:p-8"
        >
          <div className="relative grid h-full gap-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8 xl:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)] 2xl:gap-12">
          <div className="flex flex-col">
            <p className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
              <StatusDot />
              Available for freelance work
            </p>
            <h1
              id="overview-title"
              className="mt-6 text-[2.5rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-[2.75rem] 2xl:text-[3.25rem]"
            >
              {profile.name}
              <span className="block text-zinc-500">
                {profile.role}
              </span>
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400 sm:text-lg">
              {summaryFor(years)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black transition-[background-color,transform] hover:bg-zinc-200 active:scale-[0.98]"
              >
                Start a project
                <Icon name="arrowRight" />
              </a>
              <Link
                href="/#projects"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-zinc-100 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
              >
                Browse projects
              </Link>
              <CommandTrigger className="hidden items-center gap-2 px-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:inline-flex">
                <ShortcutHint />
                to explore
              </CommandTrigger>
            </div>

            <HeroInvites />
            <ContactChips />

            <div className="mt-auto pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Core stack
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {coreStack.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-1 text-xs text-zinc-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="order-first -mt-6 sm:-mt-8 sm:self-start">
            <Lanyard years={years} />
          </div>
          </div>
        </div>

        </div>

        <aside
          aria-labelledby="work-title"
          style={rise(1)}
          className="panel flex animate-rise flex-col p-6 stagger lg:col-span-4 2xl:col-span-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="work-title"
              className="text-[15px] font-medium tracking-tight text-zinc-100"
            >
              Work with me
            </h2>
            <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <StatusDot />
              Taking projects
            </span>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-3.5" />
              {profile.location.split(", ").slice(0, 2).join(", ")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="size-3.5" />
              <LocalTime /> GMT+8
            </span>
          </p>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            I can help with
          </p>
          <ul className="mt-3 space-y-3">
            {services.map((service, i) => (
              <li key={service.title} className="flex gap-3">
                <IconBadge
                  icon={serviceIcons[i] ?? "code"}
                  tone={serviceTones[i]}
                  className="size-7"
                  iconClassName="size-3.5"
                />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-100">{service.title}</p>
                  <p className="text-xs leading-snug text-zinc-500">
                    {service.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="my-6">
            <AskPrompt
              questions={[
                "Are you available for a project?",
                "What's your tech stack?",
                "Show me your best project",
              ]}
            />
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-5">
            <Link
              href={`/projects/${latest.slug}`}
              className="group rounded-xl border border-white/[0.06] bg-black/20 p-3 transition-colors hover:border-white/15"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Latest project
              </span>
              <span className="mt-2 flex items-center gap-2">
                <Image
                  src={latest.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 rounded-md"
                />
                <span className="truncate text-sm text-zinc-100">
                  {latest.name}
                </span>
                <Icon
                  name="arrowRight"
                  className="ml-auto size-3.5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Currently
              </span>
              <span className="mt-2 block truncate text-sm text-zinc-100">
                {current.company}
              </span>
              <span className="block truncate text-xs text-zinc-500">
                {current.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-5">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              <Icon name="mail" />
              Email me
            </a>
            <CopyButton
              value={profile.email}
              label="Copy email"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
            />
          </div>
        </aside>
      </section>

      {/* Key numbers */}
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <StatTile
            key={stat.label}
            icon={statIcons[i] ?? "trendingUp"}
            tone={statTones[i]}
            value={stat.value}
            label={stat.label}
            index={i + 2}
          />
        ))}
        <StatTile
          icon="folder"
          tone="violet"
          value={projects.length}
          label="Apps shipped and documented below"
          index={stats.length + 2}
        />
      </dl>

      {/* Projects */}
      <section
        id="projects"
        aria-labelledby="projects-title"
        className="scroll-mt-20 pt-8"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Selected work
            </p>
            <h2
              id="projects-title"
              className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Projects
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {projects.length} case studies with screens, features and the
              stack behind each one.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      </section>

      {/* Activity */}
      <section
        id="activity"
        aria-labelledby="activity-title"
        className="panel scroll-mt-20 p-6 sm:p-7"
      >
        <PanelHeader
          id="activity-title"
          icon="activity"
          tone="emerald"
          title="GitHub activity"
          description={
            calendar
              ? `${plural(calendar.total, "contribution")} in the last year`
              : "Contributions over the last year"
          }
          action={
            <span className="hidden sm:block">
              <TextLink href="/contributions">Full calendar</TextLink>
            </span>
          }
        />
        {calendar && summary ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center xl:gap-8">
            <ContributionGraph calendar={calendar} />
            <dl className="grid grid-cols-2 gap-3">
              {contributionStats(summary).map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col-reverse rounded-xl border border-white/[0.06] bg-black/20 p-3"
                >
                  <dt className="mt-1 text-xs leading-snug text-zinc-500">
                    {stat.label}
                  </dt>
                  <dd className="flex items-center gap-2 text-base font-semibold whitespace-nowrap tracking-tight tabular-nums">
                    <IconBadge
                      icon={stat.icon}
                      tone={stat.tone}
                      className="size-6 rounded-md"
                      iconClassName="size-3.5"
                    />
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-400">
            The contribution calendar couldn&apos;t be loaded from GitHub right
            now.{" "}
            <a
              href={`https://github.com/${profile.github}`}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white"
            >
              See it on GitHub
            </a>{" "}
            instead.
          </p>
        )}
        <div className="mt-5 sm:hidden">
          <TextLink href="/contributions">Full calendar</TextLink>
        </div>
      </section>

      {/* About and skills */}
      <div className="grid gap-4 lg:grid-cols-12">
        <section
          id="about"
          aria-labelledby="about-title"
          className="panel scroll-mt-20 p-6 sm:p-7 lg:col-span-5 2xl:col-span-4"
        >
          <PanelHeader id="about-title" icon="user" tone="sky" title="About" />
          <div className="mt-5 space-y-4 leading-relaxed text-zinc-300">
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section
          id="skills"
          aria-labelledby="skills-title"
          className="panel scroll-mt-20 p-6 sm:p-7 lg:col-span-7 2xl:col-span-8"
        >
          <PanelHeader
            id="skills-title"
            icon="layers"
            tone="violet"
            title="Skills"
            description={`${skillCount} tools across ${skills.length} areas`}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {skills.map((skill) => (
              <div
                key={skill.group}
                className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
              >
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <IconBadge
                    icon={skillIcons[skill.group] ?? "code"}
                    tone={skillTones[skill.group]}
                    className="size-6 rounded-md"
                    iconClassName="size-3.5"
                  />
                  {skill.group}
                  <span className="ml-auto font-mono text-[11px] font-normal text-zinc-500">
                    {skill.items.length}
                  </span>
                </h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {skill.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-zinc-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Experience and education */}
      <div className="grid gap-4 lg:grid-cols-12">
        <section
          id="experience"
          aria-labelledby="experience-title"
          className="panel scroll-mt-20 p-6 sm:p-7 lg:col-span-8 2xl:col-span-9"
        >
          <PanelHeader
            id="experience-title"
            icon="briefcase"
            tone="amber"
            title="Experience"
            description={`${experience.length} roles, most recent first`}
          />
          <ol className="relative mt-7 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-white/10 2xl:grid 2xl:grid-cols-2 2xl:gap-x-10 2xl:gap-y-8 2xl:space-y-0 2xl:before:hidden">
            {experience.map((job) => {
              const isCurrent = job.period === "Present";
              return (
                <li key={job.company} className="relative pl-9">
                  <span
                    aria-hidden
                    className={`absolute top-1 left-0 flex size-[15px] items-center justify-center rounded-full ring-4 ring-panel ${
                      isCurrent ? "bg-emerald-400/20" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`size-[7px] rounded-full ${isCurrent ? "bg-emerald-400" : "bg-zinc-600"}`}
                    />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-medium tracking-tight text-zinc-50">
                      {job.company}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                        isCurrent
                          ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20 ring-inset"
                          : "text-zinc-500"
                      }`}
                    >
                      {job.period}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-400">{job.role}</p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                    {job.points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-[9px] h-px w-3 shrink-0 bg-zinc-600"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          id="education"
          aria-labelledby="education-title"
          className="panel flex scroll-mt-20 flex-col p-6 sm:p-7 lg:col-span-4 2xl:col-span-3"
        >
          <PanelHeader
            id="education-title"
            icon="graduation"
            tone="rose"
            title="Education"
            description={education.period}
          />
          <h3 className="mt-6 font-medium leading-snug tracking-tight text-zinc-50">
            {education.degree}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">{education.school}</p>

          {gpa ? (
            <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-500">GPA</span>
                <span className="font-mono text-xs text-zinc-500">
                  of {gpa.scale}
                </span>
              </div>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {gpa.score}
              </p>
              <div
                role="meter"
                aria-label="GPA"
                aria-valuenow={Number(gpa.score)}
                aria-valuemin={0}
                aria-valuemax={Number(gpa.scale)}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
              >
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${(Number(gpa.score) / Number(gpa.scale)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">{education.detail}</p>
          )}

          <div className="mt-3 flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <IconBadge
              icon="trophy"
              tone="amber"
              className="size-7"
              iconClassName="size-3.5"
            />
            <div>
              <p className="font-mono text-[11px] text-zinc-500">
                Award · {education.award.year}
              </p>
              <p className="mt-1 text-sm leading-snug text-zinc-200">
                {education.award.title}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Languages
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {languages.map((language) => (
                <li key={language}>{language}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Contact */}
      <section
        id="contact"
        aria-labelledby="contact-title"
        className="panel scroll-mt-20 overflow-hidden p-6 sm:p-10"
      >
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Contact
            </p>
            <h2
              id="contact-title"
              className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Have a project in mind? Let&apos;s build it.
            </h2>
            <p className="mt-4 max-w-xl text-zinc-400">
              Tell me what you&apos;re building and when you need it, and
              I&apos;ll get back to you.
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-4 inline-flex max-w-full items-center gap-2 font-mono text-sm text-zinc-200 transition-colors hover:text-white"
            >
              <Icon name="mail" className="size-4 shrink-0 text-zinc-500" />
              <span className="truncate underline decoration-white/20 underline-offset-4">
                {profile.email}
              </span>
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black transition-[background-color,transform] hover:bg-zinc-200 active:scale-[0.98]"
            >
              <Icon name="mail" />
              Send an email
            </a>
            <CopyButton
              value={profile.email}
              label="Copy address"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-zinc-100 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            />
          </div>
        </div>
        <ContactCards />
      </section>
    </div>
  );
}
