import type { ContributionCalendar } from "@/lib/github";

const levels = [
  "bg-white/[0.06]",
  "bg-emerald-900",
  "bg-emerald-700",
  "bg-emerald-500",
  "bg-emerald-300",
];

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
    <div className="w-fit max-w-full overflow-x-auto pb-2 [direction:rtl]">
      <div className="w-max [direction:ltr]">
        <div
          role="img"
          aria-label={`GitHub contribution calendar: ${calendar.total.toLocaleString("en-US")} contributions in the last year`}
          className="grid grid-cols-[auto_1fr] gap-x-3"
        >
          <div />
          <div className="relative h-5 font-mono text-[10px] text-zinc-500">
            {months.map((month) => (
              <span
                key={`${month.week}-${month.label}`}
                className="absolute top-0"
                style={{ left: month.week * 14 }}
              >
                {month.label}
              </span>
            ))}
          </div>

          <div className="grid grid-rows-[repeat(7,11px)] gap-y-[3px] font-mono text-[10px] leading-[11px] text-zinc-500">
            {weekdays.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <div
            className="grid grid-flow-col grid-rows-[repeat(7,11px)] gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${calendar.weeks}, 11px)` }}
          >
            {calendar.days.map((day) => (
              <span
                key={day.date}
                title={describe(day.count, day.date)}
                className={`rounded-[2px] ${levels[day.level]}`}
                style={{ gridColumn: day.week + 1, gridRow: day.weekday + 1 }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-1.5 font-mono text-[10px] text-zinc-500">
          Less
          {levels.map((level) => (
            <span
              key={level}
              className={`size-[11px] rounded-[2px] ${level}`}
            />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
