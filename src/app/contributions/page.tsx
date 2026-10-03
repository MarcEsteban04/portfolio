import type { Metadata } from "next";
import { ContributionGraph } from "@/app/contributions/calendar";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import { getContributions, summarize } from "@/lib/github";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `GitHub contributions | ${profile.name}`,
  description: `${profile.name}'s GitHub contributions over the last year: a day-by-day calendar, streaks and busiest day.`,
};

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

export default async function ContributionsPage() {
  const calendar = await getContributions(profile.github);
  const profileUrl = `https://github.com/${profile.github}`;
  const summary = calendar && summarize(calendar);

  const stats = summary && [
    { value: plural(summary.activeDays, "day"), label: "Active days" },
    { value: plural(summary.longestStreak, "day"), label: "Longest streak" },
    { value: plural(summary.currentStreak, "day"), label: "Current streak" },
    {
      value: summary.bestDay
        ? summary.bestDay.count.toLocaleString("en-US")
        : "0",
      label: summary.bestDay
        ? `Most in one day, ${longDate.format(new Date(`${summary.bestDay.date}T00:00:00Z`))}`
        : "Most in one day",
    },
  ];

  return (
    <>
      <SiteHeader current="/contributions" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-32 pb-24 sm:pt-40">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          <span className="text-zinc-300">GitHub</span> / Contributions
        </p>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {calendar
              ? `${plural(calendar.total, "contribution")} in the last year.`
              : "Most of my work happens in the open."}
          </h1>
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            @{profile.github} on GitHub
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </div>

        {calendar && stats ? (
          <>
            <section
              aria-label="Contribution calendar"
              className="mt-16 border-t border-white/10 pt-12"
            >
              <ContributionGraph calendar={calendar} />
            </section>

            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 border-y border-white/10 py-10 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="mt-2 text-sm text-zinc-500">{stat.label}</dt>
                  <dd className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-zinc-400">
            The contribution calendar couldn&apos;t be loaded from GitHub right
            now. You can see it on my GitHub profile instead.
          </p>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
