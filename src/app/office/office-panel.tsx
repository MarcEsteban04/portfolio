"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { OfficeScene } from "@/app/office/scene";
import { Icon } from "@/app/ui/icons";
import { useTheme } from "@/app/ui/theme";
import {
  activities,
  blockAt,
  daylight,
  describe,
  formatMinutes,
  manilaClock,
  manilaMinutes,
  manilaTimeToday,
  schedule,
  type Activity,
} from "@/lib/office";
import { projects } from "@/lib/projects";
import { weatherEmoji, type Weather, type WeatherKind } from "@/lib/weather";

// What each book on the shelf opens: the three projects, then experience
// and contact.
const bookCards = [
  ...projects.slice(0, 3).map((project) => ({
    title: project.name,
    body: project.tagline,
    meta: project.platform,
    href: `/projects/${project.slug}`,
    action: "Open the project",
  })),
  { title: "Experience", body: "Where I've worked and what I shipped there.", meta: "Career", href: "/#experience", action: "See my experience" },
  { title: "Get in touch", body: "Open for freelance projects and full-time roles.", meta: "Contact", href: "/#contact", action: "Contact me" },
];

const weatherKinds: WeatherKind[] = ["clear", "cloudy", "rain", "storm"];
const weatherNames: Record<WeatherKind, string> = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", storm: "Storm" };

// Ticks every 30 seconds; null on the server, so the prerendered page never
// shows the build's time. For checking the scene, ?at=HH:MM pretends it's
// that time in Manila.
let now: Date | null = null;
function current() {
  const at = new URLSearchParams(window.location.search).get("at");
  return at && /^\d{1,2}:\d{2}$/.test(at)
    ? manilaTimeToday(at.padStart(5, "0"))
    : new Date();
}
function subscribe(onChange: () => void) {
  const id = setInterval(() => {
    now = current();
    onChange();
  }, 30_000);
  return () => clearInterval(id);
}
export function useManilaNow() {
  return useSyncExternalStore(
    subscribe,
    () => (now ??= current()),
    () => null,
  );
}

// The full office for the /desk page: a large 3D scene that follows Marc's
// routine in Philippine time, with buttons that let a visitor pick what he's
// doing instead (lit for that activity's usual time of day).
export function DeskOffice() {
  const time = useManilaNow();
  const theme = useTheme();
  const holder = useRef<HTMLDivElement>(null);
  const office = useRef<OfficeScene | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [picked, setPicked] = useState<Activity | null>(null);
  const [said, setSaid] = useState("");
  const [book, setBook] = useState<number | null>(null);
  const [liveWeather, setLiveWeather] = useState<Weather | null>(null);
  const [pickedWeather, setPickedWeather] = useState<WeatherKind | null>(null);

  const block = time ? blockAt(time) : null;
  const activity = picked ?? block?.activity ?? null;
  const light = picked
    ? daylight(manilaTimeToday(describe(picked).litAt))
    : time
      ? daylight(time)
      : 0;

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    let unmounted = false;
    let visible = true;
    import("@/app/office/scene")
      .then(({ createOfficeScene }) => {
        if (unmounted) return;
        office.current = createOfficeScene(element, { onSay: setSaid, onBook: setBook });
        office.current.setRunning(visible);
        setState("ready");
      })
      .catch(() => {
        if (!unmounted) setState("failed");
      });
    // Animate only while the scene is on screen.
    const watch = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      office.current?.setRunning(visible);
    });
    watch.observe(element);
    return () => {
      unmounted = true;
      watch.disconnect();
      office.current?.dispose();
      office.current = null;
    };
  }, []);

  useEffect(() => {
    if (!office.current || !activity) return;
    office.current.setActivity(activity);
    office.current.setDaylight(light);
  }, [state, activity, light]);

  // The wall clock shows Manila time, or the picked activity's usual time.
  const clockMinutes = picked
    ? manilaMinutes(manilaTimeToday(describe(picked).litAt))
    : time
      ? manilaMinutes(time)
      : 0;
  useEffect(() => {
    office.current?.setClock(clockMinutes);
  }, [state, clockMinutes]);

  useEffect(() => {
    office.current?.setSunglasses(theme === "light");
  }, [state, theme]);

  // Bulacan's weather, through our own cached endpoint. ?weather=rain (or
  // clear, cloudy, storm) pretends, for checking the scene.
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("weather");
    let cancelled = false;
    fetch("/api/weather")
      .then((res) => (res.ok ? (res.json() as Promise<Weather>) : null))
      .then((data) => {
        if (!cancelled && data) setLiveWeather(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled && forced && (weatherKinds as string[]).includes(forced)) {
          setPickedWeather(forced as WeatherKind);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const weatherKind = pickedWeather ?? liveWeather?.kind ?? "clear";
  const degrees = liveWeather?.temperature ?? null;
  useEffect(() => {
    office.current?.setWeather(weatherKind, degrees);
  }, [state, weatherKind, degrees]);

  const card = book === null ? null : bookCards[book];

  const shown = activity ? describe(activity) : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="Marc's office in 3D" className="panel relative overflow-hidden">
        <div
          ref={holder}
          className="h-[clamp(420px,calc(100dvh-20rem),760px)] w-full cursor-grab touch-pan-y active:cursor-grabbing"
        />
        {state !== "ready" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            {state === "failed"
              ? "The 3D office couldn't load in this browser."
              : "Setting up the office…"}
          </div>
        )}
        <p className="pointer-events-none absolute top-4 right-5 text-right font-mono text-[10px] text-zinc-600">
          Drag to look around
          <br />
          Click things to mess with me
        </p>
        <p aria-live="polite" className="sr-only">
          {said}
        </p>

        {/* A book pulled off the shelf. */}
        {card && (
          <div
            role="dialog"
            aria-label={card.title}
            className="absolute top-14 right-4 w-[min(18rem,calc(100%-2rem))] rounded-2xl bg-background/90 p-4 ring-1 ring-white/10 backdrop-blur-md animate-rise"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                📚 {card.meta}
              </p>
              <button
                type="button"
                onClick={() => setBook(null)}
                aria-label="Put the book back"
                className="-mt-1 -mr-1 rounded-lg px-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
              >
                ×
              </button>
            </div>
            <p className="mt-2 font-semibold text-zinc-50">{card.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{card.body}</p>
            <Link
              href={card.href}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90"
            >
              {card.action}
              <Icon name="arrowRight" className="size-3" />
            </Link>
          </div>
        )}

        {/* Visitor controls. */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-5">
          <div
            role="group"
            aria-label="Choose what Marc is doing"
            className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-background/80 p-1.5 ring-1 ring-white/10 backdrop-blur-md scrollbar-thin"
          >
            <button
              type="button"
              aria-pressed={picked === null}
              onClick={() => setPicked(null)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white aria-pressed:text-black"
            >
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Live
            </button>
            {activities.map((entry) => (
              <button
                key={entry.activity}
                type="button"
                aria-pressed={picked === entry.activity}
                onClick={() => setPicked(entry.activity)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white aria-pressed:text-black"
              >
                <span aria-hidden>{entry.emoji}</span>
                {entry.action}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside aria-label="What Marc is doing" className="panel p-6 sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Right now in Bulacan
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-zinc-50">
          {time ? manilaClock.format(time) : "--:--"}
        </p>
        {shown && (
          <div aria-live="polite">
            <p className="mt-3 flex items-center gap-2 text-zinc-100">
              <span aria-hidden className="text-lg">
                {shown.emoji}
              </span>
              {picked ? `${shown.action}, on your request` : block?.label}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{shown.caption}</p>
            {picked ? (
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="mt-2 text-xs text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                Back to what he&apos;s really doing
              </button>
            ) : (
              block && (
                <p className="mt-1 text-xs text-zinc-500">
                  Next: {block.next.label.toLowerCase()} at{" "}
                  {formatMinutes(block.next.from)}
                </p>
              )
            )}
          </div>
        )}

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="text-sm text-zinc-300">
            <span aria-hidden>{weatherEmoji[weatherKind]}</span>{" "}
            {pickedWeather
              ? `${weatherNames[pickedWeather]}, on your request`
              : liveWeather
                ? `${liveWeather.temperature}°C · ${liveWeather.label} outside`
                : "Checking the weather…"}
          </p>
          <div role="group" aria-label="Change the weather" className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              aria-pressed={pickedWeather === null}
              onClick={() => setPickedWeather(null)}
              className="rounded-lg px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white/[0.1] aria-pressed:text-zinc-50"
            >
              Live
            </button>
            {weatherKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={pickedWeather === kind}
                aria-label={weatherNames[kind]}
                title={weatherNames[kind]}
                onClick={() => setPickedWeather(kind)}
                className="rounded-lg px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white/[0.1] aria-pressed:text-zinc-50"
              >
                <span aria-hidden>{weatherEmoji[kind]}</span>
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-5 space-y-1 border-t border-white/[0.06] pt-5">
          {schedule.map((item, i) => {
            const isNow = !picked && block?.index === i;
            return (
              <li
                key={item.from}
                aria-current={isNow ? "time" : undefined}
                className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm text-zinc-500 aria-[current]:bg-white/[0.05] aria-[current]:text-zinc-100"
              >
                <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums">
                  {formatMinutes(item.from)}
                </span>
                <span aria-hidden>{describe(item.activity).emoji}</span>
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
  );
}

// A light card for the home page: what Marc is doing now, linking to the
// full office. It doesn't load the 3D scene.
export function DeskTeaser() {
  const time = useManilaNow();
  const block = time ? blockAt(time) : null;
  const shown = block ? describe(block.activity) : null;

  return (
    <Link
      id="desk"
      href="/desk"
      className="panel group flex scroll-mt-20 flex-wrap items-center gap-x-6 gap-y-3 p-5 transition-shadow hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-white)_22%,transparent)] sm:p-6"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-amber-400/10 text-2xl ring-1 ring-amber-400/20 ring-inset">
        <span aria-hidden>{shown?.emoji ?? "🖥️"}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Live from my desk · {time ? manilaClock.format(time) : "--:--"} in Bulacan
        </span>
        <span className="mt-1 block font-medium text-zinc-100">
          {block ? `${block.label}. ${shown?.caption}` : "Peek into my office."}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300 transition-colors group-hover:text-white">
        Step into my 3D office
        <Icon
          name="arrowRight"
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
