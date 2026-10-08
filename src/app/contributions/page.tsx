import type { Metadata } from "next";
import { ContributionGraph } from "@/app/contributions/calendar";
import {
  LanguageBars,
  MonthChart,
  RepoList,
  WeekdayChart,
} from "@/app/contributions/charts";
import { contributionStats, plural } from "@/app/contributions/contribution-stats";
import { PanelHeader, StatTile, TextLink } from "@/app/ui/panel";
import {
  getContributions,
  getRepos,
  insights,
  languageCounts,
  monthlyTotals,
  summarize,
  weekdayTotals,
  type ContributionCalendar,
} from "@/lib/github";
import { profile } from "@/lib/profile";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `GitHub contributions | ${profile.name}`,
  description: `${profile.name}'s GitHub contributions over the last year: a day-by-day calendar, streaks and busiest day.`,
  path: "/contributions",
});

export default async function ContributionsPage() {
  const [calendar, repos] = await Promise.all([
    getContributions(profile.github),
    getRepos(profile.github),
  ]);
  const now = new Date();
  const profileUrl = `https://github.com/${profile.github}`;
  const summary = calendar && summarize(calendar);

  return (
    <div className="space-y-4">
      <header className="animate-rise px-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              GitHub · @{profile.github}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
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

          <Breakdown calendar={calendar} />
        </>
      ) : (
        <section className="panel p-6 sm:p-7">
          <p className="max-w-2xl leading-relaxed text-zinc-400">
            The contribution calendar couldn&apos;t be loaded from GitHub right
            now. You can see it on my GitHub profile instead.
          </p>
        </section>
      )}

      {repos && repos.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-12">
          <section
            aria-labelledby="repos-title"
            className="panel p-6 sm:p-7 lg:col-span-8"
          >
            <PanelHeader
              id="repos-title"
              icon="folder"
              tone="violet"
              title="Recently updated repositories"
              description={`${repos.length} public ${repos.length === 1 ? "repository" : "repositories"} · most of the year's work is private`}
              action={
                <span className="hidden sm:block">
                  <TextLink href={`${profileUrl}?tab=repositories`} external>
                    All repositories
                  </TextLink>
                </span>
              }
            />
            <div className="mt-4">
              <RepoList repos={repos.slice(0, 6)} now={now} />
            </div>
          </section>
          <section
            aria-labelledby="languages-title"
            className="panel p-6 sm:p-7 lg:col-span-4"
          >
            <PanelHeader
              id="languages-title"
              icon="code"
              tone="sky"
              title="Languages"
              description="Main language of each public repository"
            />
            <div className="mt-6">
              <LanguageBars languages={languageCounts(repos)} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const shortNumber = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 1 });

// Charts and figures drawn from the same calendar as the grid above.
function Breakdown({ calendar }: { calendar: ContributionCalendar }) {
  const facts = insights(calendar);
  const tiles = [
    {
      icon: "activity" as const,
      tone: "sky" as const,
      value: shortNumber(facts.averagePerActiveDay),
      label: "Contributions on an average active day",
    },
    {
      icon: "calendar" as const,
      tone: "emerald" as const,
      value: facts.busiestMonth
        ? `${facts.busiestMonth.label} ${facts.busiestMonth.year}`
        : "—",
      label: facts.busiestMonth
        ? `Busiest month, ${facts.busiestMonth.count.toLocaleString("en-US")} contributions`
        : "Busiest month",
    },
    {
      icon: "clock" as const,
      tone: "amber" as const,
      value: facts.busiestWeekday?.name ?? "—",
      label: "Most active day of the week",
    },
    {
      icon: "sun" as const,
      tone: "violet" as const,
      value: `${Math.round(facts.weekendShare * 100)}%`,
      label: "Of contributions made on weekends",
    },
  ];

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-12">
        <section
          aria-labelledby="months-title"
          className="panel p-6 sm:p-7 lg:col-span-8"
        >
          <PanelHeader
            id="months-title"
            icon="trendingUp"
            tone="emerald"
            title="Contributions by month"
            description="Hover a month for its total"
          />
          <div className="mt-8">
            <MonthChart months={monthlyTotals(calendar)} />
          </div>
        </section>
        <section
          aria-labelledby="weekdays-title"
          className="panel p-6 sm:p-7 lg:col-span-4"
        >
          <PanelHeader
            id="weekdays-title"
            icon="calendar"
            tone="emerald"
            title="By day of the week"
            description="Total contributions on each weekday"
          />
          <div className="mt-6">
            <WeekdayChart totals={weekdayTotals(calendar)} />
          </div>
        </section>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <StatTile key={tile.label} index={i} {...tile} />
        ))}
      </dl>
    </>
  );
}
