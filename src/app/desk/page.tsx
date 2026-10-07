import type { Metadata } from "next";
import { DeskOffice } from "@/app/office/office-panel";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `My desk | ${profile.name}`,
  description: `A 3D look into ${profile.name}'s office, following his day in Philippine time: coding, coffee, gaming and sleep. Pick what he's doing.`,
};

export default function DeskPage() {
  return (
    <div className="space-y-3">
      {/* No card: just the heading, so the room gets the space. */}
      <header className="flex animate-rise flex-wrap items-end justify-between gap-x-10 gap-y-2 px-1 pt-1">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Live from my desk
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            Step into my office.
          </h1>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-zinc-400">
          It follows my day in Philippine time, from morning coffee to late-night
          coding. Use the buttons to decide what I&apos;m doing instead.
        </p>
      </header>
      <DeskOffice />
    </div>
  );
}
