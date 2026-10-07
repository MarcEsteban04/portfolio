import type { IconName } from "@/app/ui/icons";
import type { Tone } from "@/app/ui/panel";
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
): { icon: IconName; tone: Tone; value: string; label: string }[] {
  return [
    {
      icon: "calendar",
      tone: "emerald",
      value: plural(summary.activeDays, "day"),
      label: "Active days",
    },
    {
      icon: "flame",
      tone: "amber",
      value: plural(summary.longestStreak, "day"),
      label: "Longest streak",
    },
    {
      icon: "zap",
      tone: "sky",
      value: plural(summary.currentStreak, "day"),
      label: "Current streak",
    },
    {
      icon: "trendingUp",
      tone: "violet",
      value: summary.bestDay
        ? summary.bestDay.count.toLocaleString("en-US")
        : "0",
      label: summary.bestDay
        ? `Most in one day, ${longDate.format(new Date(`${summary.bestDay.date}T00:00:00Z`))}`
        : "Most in one day",
    },
  ];
}
