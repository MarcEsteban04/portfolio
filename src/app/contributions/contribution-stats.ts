import type { IconName } from "@/app/ui/icons";
import type { ContributionSummary } from "@/lib/github";

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

export function contributionStats(
  summary: ContributionSummary,
): { icon: IconName; value: string; label: string }[] {
  return [
    {
      icon: "calendar",
      value: plural(summary.activeDays, "day"),
      label: "Active days",
    },
    {
      icon: "flame",
      value: plural(summary.longestStreak, "day"),
      label: "Longest streak",
    },
    {
      icon: "zap",
      value: plural(summary.currentStreak, "day"),
      label: "Current streak",
    },
    {
      icon: "trendingUp",
      value: summary.bestDay
        ? summary.bestDay.count.toLocaleString("en-US")
        : "0",
      label: summary.bestDay
        ? `Most in one day, ${longDate.format(new Date(`${summary.bestDay.date}T00:00:00Z`))}`
        : "Most in one day",
    },
  ];
}
