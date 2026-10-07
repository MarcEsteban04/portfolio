import type { MonthTotal, Repo } from "@/lib/github";
import { WEEKDAYS } from "@/lib/github";

// Rounds a maximum up to a clean axis value: 1, 2 or 5 times a power of ten.
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
}

const number = (value: number) => value.toLocaleString("en-US");

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-raised px-2.5 py-1.5 text-[11px] whitespace-nowrap text-zinc-200 opacity-0 shadow-[0_8px_24px_-8px_var(--shadow)] ring-1 ring-white/10 transition-opacity group-hover:opacity-100"
    >
      {children}
    </span>
  );
}

// Columns for each month of the rolling year, in GitHub's green. The busiest
// month is labelled and every column shows its exact count on hover; a
// hidden table carries the same numbers for screen readers.
export function MonthChart({ months }: { months: MonthTotal[] }) {
  const top = niceCeil(Math.max(...months.map((m) => m.count)));
  const busiest = months.reduce((a, b) => (b.count > a.count ? b : a), months[0]);
  const ticks = [top, top / 2, 0];

  return (
    <figure>
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="relative h-52 font-mono text-[10px] text-zinc-500" aria-hidden>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(1 - tick / top) * 100}%` }}
            >
              {number(tick)}
            </span>
          ))}
        </div>
        <div className="relative h-52">
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden
              className="absolute inset-x-0 h-px bg-white/[0.06]"
              style={{ top: `${(1 - tick / top) * 100}%` }}
            />
          ))}
          <ol className="absolute inset-0 flex items-end gap-[2px]" aria-hidden>
            {months.map((month) => (
              <li
                key={month.key}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <Tooltip>
                  {month.label} {month.year} ·{" "}
                  <span className="font-medium text-zinc-50">
                    {number(month.count)}
                  </span>{" "}
                  contributions
                </Tooltip>
                {month === busiest && month.count > 0 && (
                  <span className="mb-1 font-mono text-[10px] text-zinc-300">
                    {number(month.count)}
                  </span>
                )}
                <span
                  className="w-full max-w-6 rounded-t-[4px] bg-[var(--contrib-3)] transition-opacity group-hover:opacity-75"
                  style={{ height: `${(month.count / top) * 100}%` }}
                />
              </li>
            ))}
          </ol>
        </div>
        <div />
        <ol className="mt-2 flex gap-[2px] font-mono text-[10px] text-zinc-500" aria-hidden>
          {months.map((month) => (
            <li key={month.key} className="flex-1 text-center">
              {month.label === "Jan" ? `Jan ’${String(month.year).slice(2)}` : month.label}
            </li>
          ))}
        </ol>
      </div>

      <table className="sr-only">
        <caption>Contributions by month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Contributions</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.key}>
              <td>
                {month.label} {month.year}
              </td>
              <td>{month.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// Horizontal bars for each day of the week, Monday first, values at the tips.
export function WeekdayChart({ totals }: { totals: number[] }) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const max = Math.max(...totals, 1);
  const best = totals.indexOf(Math.max(...totals));

  return (
    <ul className="space-y-2.5">
      {order.map((weekday) => (
        <li
          key={weekday}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem] items-center gap-3"
        >
          <span className="font-mono text-[11px] text-zinc-500">
            {WEEKDAYS[weekday].slice(0, 3)}
          </span>
          <span className="h-3 overflow-hidden rounded-r-[4px] bg-white/[0.04]">
            <span
              className={`block h-full rounded-r-[4px] ${
                weekday === best ? "bg-[var(--contrib-4)]" : "bg-[var(--contrib-3)]"
              }`}
              style={{ width: `${(totals[weekday] / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-mono text-[11px] text-zinc-300 tabular-nums">
            {number(totals[weekday])}
          </span>
        </li>
      ))}
    </ul>
  );
}

// GitHub's own language colors, for the dot beside each language's name.
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Dart: "#00b4ab",
  PHP: "#4f5d95",
  Vue: "#41b883",
  Python: "#3572a5",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Swift: "#f05138",
  Go: "#00add8",
  HTML: "#e34c26",
  CSS: "#663399",
};

export function LanguageDot({ language }: { language: string | null }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full ring-1 ring-white/10"
      style={{ background: (language && languageColors[language]) || "#71717a" }}
    />
  );
}

export function LanguageBars({
  languages,
}: {
  languages: { language: string; count: number }[];
}) {
  const max = Math.max(...languages.map((l) => l.count), 1);
  return (
    <ul className="space-y-3">
      {languages.map(({ language, count }) => (
        <li key={language}>
          <div className="mb-1.5 flex items-center gap-2 text-sm text-zinc-200">
            <LanguageDot language={language} />
            {language}
            <span className="ml-auto font-mono text-[11px] text-zinc-500">
              {count} {count === 1 ? "repo" : "repos"}
            </span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <span
              className="block h-full rounded-full bg-zinc-400"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

function updatedAgo(iso: string, now: Date) {
  const days = Math.round((Date.parse(iso) - now.getTime()) / 864e5);
  if (days > -1) return "today";
  if (days > -30) return relative.format(days, "day");
  if (days > -365) return relative.format(Math.round(days / 30), "month");
  return relative.format(Math.round(days / 365), "year");
}

export function RepoList({ repos, now }: { repos: Repo[]; now: Date }) {
  return (
    <ul className="divide-y divide-white/[0.06]">
      {repos.map((repo) => (
        <li key={repo.name}>
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="group -mx-3 flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.03]"
          >
            <LanguageDot language={repo.language} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-zinc-100 group-hover:text-white">
                {repo.name}
              </span>
              <span className="block truncate text-xs text-zinc-500">
                {repo.description ?? repo.language ?? "No description"}
              </span>
            </span>
            <span className="shrink-0 text-right font-mono text-[11px] text-zinc-500">
              {repo.description && repo.language ? (
                <span className="block text-zinc-400">{repo.language}</span>
              ) : null}
              Updated {updatedAgo(repo.pushedAt, now)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
