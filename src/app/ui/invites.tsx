"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useManilaNow } from "@/app/office/office-panel";
import { Icon } from "@/app/ui/icons";
import { startTour, TOUR_SEEN_KEY } from "@/app/ui/navigation";
import { blockAt, describe, manilaClock } from "@/lib/office";

const tourSeen = () => {
  try {
    return sessionStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

// Two invitations in the hero, under the buttons: the guided tour and a
// live peek at Marc's desk. They fade in a few seconds after the page does,
// once the visitor has had a look, and nudge once more after that.
export function HeroInvites() {
  const time = useManilaNow();
  const seen = useSyncExternalStore(
    () => () => {},
    tourSeen,
    () => false,
  );
  const block = time ? blockAt(time) : null;
  const shown = block ? describe(block.activity) : null;

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={startTour}
        style={{ animationDelay: "2.6s" }}
        className="group relative animate-rise overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full animate-shine bg-linear-to-r from-transparent via-white/[0.08] to-transparent"
        />
        <span className="relative flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 ring-1 ring-violet-400/20 ring-inset">
            <Icon name="sparkles" className="size-5 animate-nudge text-violet-300" />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {seen ? "Missed something?" : "New here?"}
            </span>
            <span className="mt-0.5 block font-medium text-zinc-100">
              {seen ? "Take the tour again" : "Take the 60-second tour"}
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              I&apos;ll show you around, cursor and all.
            </span>
          </span>
        </span>
      </button>

      <Link
        id="desk"
        href="/desk"
        style={{ animationDelay: "3.1s" }}
        className="group relative animate-rise overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      >
        <span className="relative flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-2xl ring-1 ring-amber-400/20 ring-inset">
            <span aria-hidden className="inline-block animate-nudge [animation-delay:5s]">
              {shown?.emoji ?? "🖥️"}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live · {time ? manilaClock.format(time) : "--:--"}
            </span>
            <span className="mt-0.5 block truncate font-medium text-zinc-100">
              {block ? `I'm ${block.label.toLowerCase()} right now` : "Peek into my office"}
            </span>
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors group-hover:text-zinc-300">
              Step into my 3D office
              <Icon name="arrowRight" className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </span>
      </Link>
    </div>
  );
}
