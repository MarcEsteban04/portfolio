import type { Metadata } from "next";
import { DeskOffice } from "@/app/office/office-panel";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `My desk | ${profile.name}`,
  description: `A 3D look into ${profile.name}'s office, following his day in Philippine time: coding, coffee, gaming and sleep. Pick what he's doing.`,
};

export default function DeskPage() {
  return (
    <div className="space-y-4">
      <header className="panel animate-rise p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Live from my desk
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Step into my office.
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          It follows my day in Philippine time, from morning coffee to late-night
          coding. Use the buttons to decide what I&apos;m doing instead, or click
          things in the room (my PC, the lamp, the speakers, my chair, me) and see
          how I react.
        </p>
      </header>
      <DeskOffice />
    </div>
  );
}
