"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { OfficeScene } from "@/app/office/scene";
import { PanelHeader } from "@/app/ui/panel";
import { useTheme } from "@/app/ui/theme";
import {
  blockAt,
  daylight,
  formatMinutes,
  manilaClock,
  schedule,
  type Activity,
} from "@/lib/office";

const emoji: Record<Activity, string> = {
  sleeping: "😴",
  coffee: "☕",
  working: "💻",
  eating: "🍜",
  gaming: "🎮",
  "coding-late": "🌙",
};

const caption: Record<Activity, string> = {
  sleeping: "Recharging for tomorrow's commits.",
  coffee: "Fuelling up before the next feature.",
  working: "Heads down, shipping.",
  eating: "Away from the keyboard for a bit.",
  gaming: "Off the clock and in a match.",
  "coding-late": "Burning the midnight oil on side projects.",
};

// Ticks every 30 seconds; null on the server, so the prerendered page never
// shows the build's time. For checking the scene, ?at=HH:MM pretends it's
// that time in Manila.
let now: Date | null = null;
function current() {
  const at = new URLSearchParams(window.location.search).get("at");
  const match = at?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return new Date();
  const [, hour, minute] = match;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  return new Date(`${today}T${hour.padStart(2, "0")}:${minute}:00+08:00`);
}
function subscribe(onChange: () => void) {
  const id = setInterval(() => {
    now = current();
    onChange();
  }, 30_000);
  return () => clearInterval(id);
}
function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => (now ??= current()),
    () => null,
  );
}

// "Live from my desk": a 3D office whose scene follows the time in the
// Philippines, beside today's routine with the current block highlighted.
export function OfficePanel() {
  const time = useNow();
  const theme = useTheme();
  const holder = useRef<HTMLDivElement>(null);
  const office = useRef<OfficeScene | null>(null);
  const [state, setState] = useState<"waiting" | "loading" | "ready" | "failed">(
    "waiting",
  );

  const block = time ? blockAt(time) : null;
  const light = time ? daylight(time) : 0;

  // Load three.js only once the panel is near the screen, then keep the
  // animation running only while it's visible.
  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    let unmounted = false;
    let loading = false;
    let visible = false;
    const watch = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        office.current?.setRunning(visible);
        if (!visible || loading || office.current) return;
        loading = true;
        setState("loading");
        import("@/app/office/scene")
          .then(({ createOfficeScene }) => {
            if (unmounted) return;
            office.current = createOfficeScene(element);
            office.current.setRunning(visible);
            setState("ready");
          })
          .catch(() => {
            if (!unmounted) setState("failed");
          });
      },
      { rootMargin: "200px" },
    );
    watch.observe(element);
    return () => {
      unmounted = true;
      watch.disconnect();
      office.current?.dispose();
      office.current = null;
    };
  }, []);

  useEffect(() => {
    if (!office.current || !block) return;
    office.current.setActivity(block.activity);
    office.current.setDaylight(light);
  }, [state, block?.activity, light]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    office.current?.setSunglasses(theme === "light");
  }, [state, theme]);

  return (
    <section
      id="desk"
      aria-labelledby="desk-title"
      className="panel scroll-mt-20 overflow-hidden"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative">
          <div className="relative z-10 px-6 pt-5 sm:absolute sm:top-6 sm:left-7 sm:p-0">
            <PanelHeader
              id="desk-title"
              icon="monitor"
              tone="amber"
              title="Live from my desk"
              description="A 3D look at what I'm probably up to right now"
            />
          </div>
          <div
            ref={holder}
            className="h-[380px] w-full cursor-grab touch-pan-y active:cursor-grabbing sm:h-[440px]"
          />
          {state !== "ready" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
              {state === "failed"
                ? "The 3D office couldn't load in this browser."
                : "Setting up the office…"}
            </div>
          )}
          {state === "ready" && (
            <p className="pointer-events-none absolute right-5 bottom-4 font-mono text-[10px] text-zinc-600">
              Drag to look around
            </p>
          )}
        </div>

        <aside
          aria-label="Today's routine"
          className="border-t border-white/[0.06] p-6 sm:p-7 lg:border-t-0 lg:border-l"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Right now in Bulacan
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-zinc-50">
            {time ? manilaClock.format(time) : "--:--"}
          </p>
          {block && (
            <>
              <p className="mt-3 flex items-center gap-2 text-zinc-100">
                <span aria-hidden className="text-lg">
                  {emoji[block.activity]}
                </span>
                {block.label}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{caption[block.activity]}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Next: {block.next.label.toLowerCase()} at{" "}
                {formatMinutes(block.next.from)}
              </p>
            </>
          )}

          <ol className="mt-6 space-y-1 border-t border-white/[0.06] pt-5">
            {schedule.map((item, i) => {
              const current = block?.index === i;
              return (
                <li
                  key={item.from}
                  aria-current={current ? "time" : undefined}
                  className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm text-zinc-500 aria-[current]:bg-white/[0.05] aria-[current]:text-zinc-100"
                >
                  <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums">
                    {formatMinutes(item.from)}
                  </span>
                  <span aria-hidden>{emoji[item.activity]}</span>
                  {item.label}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
            An illustrative routine, not a live status.
          </p>
        </aside>
      </div>
    </section>
  );
}
