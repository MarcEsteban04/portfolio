import type { ContributionCalendar } from "@/lib/github";

// GitHub's own contribution colors, from no contributions to most; the
// variables switch to GitHub's light palette in light mode.
const levels = [0, 1, 2, 3, 4].map((level) => `var(--contrib-${level})`);

const weekdays = ["", "Mon", "", "Wed", "", "Fri", ""];

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const shortMonth = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

function describe(count: number, date: string) {
  const day = longDate.format(new Date(`${date}T00:00:00Z`));
  if (count === 0) return `No contributions on ${day}`;
  return `${count} contribution${count === 1 ? "" : "s"} on ${day}`;
}

// The calendar stretches to fill its container: one grid column per week,
// with square cells sized by the column width. Below a minimum width it
// scrolls instead of shrinking further.
export function ContributionGraph({
  calendar,
}: {
  calendar: ContributionCalendar;
}) {
  // A month that starts in the last two columns has no room for its label.
  const months = calendar.days
    .filter((day) => day.date.endsWith("-01") && day.week < calendar.weeks - 2)
    .map((day) => ({
      week: day.week,
      label: shortMonth.format(new Date(`${day.date}T00:00:00Z`)),
    }));

  // Right-to-left scrolling opens the graph on the latest weeks when it
  // doesn't fit, as GitHub does.
  return (
    <div className="scrollbar-thin w-full overflow-x-auto pb-2 [direction:rtl]">
      <div className="min-w-[640px] [direction:ltr]">
        <div
          role="img"
          aria-label={`GitHub contribution calendar: ${calendar.total.toLocaleString("en-US")} contributions in the last year`}
          className="grid gap-[3px] font-mono text-[10px] text-zinc-500 xl:gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${calendar.weeks}, minmax(0, 1fr))`,
          }}
        >
          {months.map((month) => (
            <span
              key={`${month.week}-${month.label}`}
              className="pb-1 whitespace-nowrap"
              style={{ gridColumn: `${month.week + 2} / span 3`, gridRow: 1 }}
            >
              {month.label}
            </span>
          ))}
          {weekdays.map((label, i) => (
            <span
              key={i}
              className="flex items-center pr-2"
              style={{ gridColumn: 1, gridRow: i + 2 }}
            >
              {label}
            </span>
          ))}
          {calendar.days.map((day) => (
            <span
              key={day.date}
              title={describe(day.count, day.date)}
              className="aspect-square rounded-[2px] xl:rounded-[3px]"
              style={{
                gridColumn: day.week + 2,
                gridRow: day.weekday + 2,
                background: levels[day.level],
              }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1.5 font-mono text-[10px] text-zinc-500">
          Less
          {levels.map((level) => (
            <span
              key={level}
              className="size-[11px] rounded-[2px]"
              style={{ background: level }}
            />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
