import type { Metadata } from "next";
import { ContributionGraph } from "@/app/contributions/calendar";
import { contributionStats, plural } from "@/app/contributions/contribution-stats";
import { PanelHeader, StatTile, TextLink } from "@/app/ui/panel";
import { getContributions, summarize } from "@/lib/github";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `GitHub contributions | ${profile.name}`,
  description: `${profile.name}'s GitHub contributions over the last year: a day-by-day calendar, streaks and busiest day.`,
};

export default async function ContributionsPage() {
  const calendar = await getContributions(profile.github);
  const profileUrl = `https://github.com/${profile.github}`;
  const summary = calendar && summarize(calendar);

  return (
    <div className="space-y-4">
      <header className="panel animate-rise overflow-hidden p-6 sm:p-8">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              GitHub · @{profile.github}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {calendar
                ? `${plural(calendar.total, "contribution")} in the last year.`
                : "Most of my work happens in the open."}
            </h1>
          </div>
          <TextLink href={profileUrl} external>
            Open on GitHub
          </TextLink>
        </div>
      </header>

      {calendar && summary ? (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {contributionStats(summary).map((stat, i) => (
              <StatTile
                key={stat.label}
                icon={stat.icon}
                tone={stat.tone}
                value={stat.value}
                label={stat.label}
                index={i + 1}
              />
            ))}
          </dl>

          <section
            aria-labelledby="calendar-title"
            className="panel p-6 sm:p-7"
          >
            <PanelHeader
              id="calendar-title"
              icon="calendar"
              tone="emerald"
              title="Contribution calendar"
              description="Each square is a day; brighter means more contributions."
            />
            <div className="mt-6">
              <ContributionGraph calendar={calendar} />
            </div>
          </section>
        </>
      ) : (
        <section className="panel p-6 sm:p-7">
          <p className="max-w-2xl leading-relaxed text-zinc-400">
            The contribution calendar couldn&apos;t be loaded from GitHub right
            now. You can see it on my GitHub profile instead.
          </p>
        </section>
      )}
    </div>
  );
}
