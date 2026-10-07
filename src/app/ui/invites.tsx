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

const card =
  "group flex animate-rise items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]";
const tile =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-200 ring-1 ring-white/10 ring-inset";

// Two invitations in the hero, under the buttons: the guided tour and a
// live look at Marc's desk. They fade in a few seconds after the page does,
// once the visitor has had a look around.
export function HeroInvites() {
  const time = useManilaNow();
  const seen = useSyncExternalStore(
    () => () => {},
    tourSeen,
    () => false,
  );
  const block = time ? blockAt(time) : null;
  const doing = block ? describe(block.activity) : null;

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={startTour} style={{ animationDelay: "2.6s" }} className={card}>
        <span className={tile}>
          <Icon name="pointer" className="size-[18px] animate-nudge" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium text-zinc-100">
            {seen ? "Take the tour again" : "Take the guided tour"}
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500">A one-minute walk through the site</span>
        </span>
        <Icon
          name="arrowRight"
          className="ml-auto size-3.5 shrink-0 text-zinc-600 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-zinc-300"
        />
      </button>

      <Link id="desk" href="/desk" style={{ animationDelay: "3.1s" }} className={card}>
        <span className={tile}>
          <Icon name={doing?.icon ?? "monitor"} className="size-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-zinc-100">
            {block ? `${block.label} right now` : "My desk, live"}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {time ? `${manilaClock.format(time)} in Bulacan · ` : ""}See my 3D office
          </span>
        </span>
        <Icon
          name="arrowRight"
          className="ml-auto size-3.5 shrink-0 text-zinc-600 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-zinc-300"
        />
      </Link>
    </div>
  );
}
