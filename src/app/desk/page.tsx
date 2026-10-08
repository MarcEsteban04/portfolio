import { DeskOffice } from "@/app/office/office-panel";
import { monthCalendar } from "@/lib/calendar";
import { getContributions } from "@/lib/github";
import { profile } from "@/lib/profile";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: `My desk | ${profile.name}`,
  description: `A 3D look into ${profile.name}'s office, following his day in Philippine time: coding, coffee, gaming and sleep. Pick what he's doing.`,
  path: "/desk",
});

export default async function DeskPage() {
  // This month's real GitHub contributions, for the calendar on the wall.
  const contributions = await getContributions(profile.github);
  const calendar = contributions ? monthCalendar(contributions.days, new Date()) : null;
  return (
    <div className="space-y-3">
      {/* No card: just the heading, so the room gets the space. */}
      <header className="animate-rise px-1 pt-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Live from my desk
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          Step into my office.
        </h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
          It follows my day in Philippine time, from night shifts with coffee to
          evenings gaming with the cats. Use the buttons to decide what I&apos;m doing instead, or poke
          around: more than a few things in here react when you click them. See
          how many you can find.
        </p>
      </header>
      <DeskOffice calendar={calendar} />
    </div>
  );
}
