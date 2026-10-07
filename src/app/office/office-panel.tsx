"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { OfficeScene, OfficeView } from "@/app/office/scene";
import { drawPolaroidPhoto } from "@/app/office/screens";
import { discoveries, parseFound, type Discovery } from "@/lib/discoveries";
import { Icon } from "@/app/ui/icons";
import { useTheme } from "@/app/ui/theme";
import {
  activities,
  blockAt,
  daylight,
  isChristmasSeason,
  sunHeight,
  manilaClock,
  manilaMinutes,
  manilaTimeToday,
  type Activity,
} from "@/lib/office";
import { doingLines, NAME_MAX, NOTE_MAX, type Note } from "@/lib/notes";
import { projects } from "@/lib/projects";
import type { Weather, WeatherKind } from "@/lib/weather";

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
const views: { view: OfficeView; label: string }[] = [
  { view: "room", label: "Room" },
  { view: "desk", label: "Desk" },
  { view: "bed", label: "Bed" },
  { view: "cats", label: "Cats" },
];
const weatherIcons = { clear: "sun", cloudy: "cloud", rain: "cloudRain", storm: "cloudLightning" } as const;

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

// What this visitor has found in the room, kept in their own browser.
const FOUND_KEY = "desk-found";
const foundEvent = "desk-found-change";
function readFound() {
  try {
    return localStorage.getItem(FOUND_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function writeFound(list: Discovery[]) {
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event(foundEvent));
}
function subscribeFound(onChange: () => void) {
  window.addEventListener(foundEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(foundEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const discoveryLabels = new Map<string, string>(discoveries.map((entry) => [entry.id, entry.label]));
const noteTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// A note's polaroid: the view from the window when it was left.
function Polaroid({ note }: { note: Note }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (c) drawPolaroidPhoto(c, 0, 0, c.canvas.width, c.canvas.height, new Date(note.created_at), note.weather ?? "clear");
  }, [note.created_at, note.weather]);
  return (
    <div
      className="shrink-0 self-start bg-[#f7f4ec] p-1 pb-3 shadow-md shadow-black/40"
      style={{ rotate: `${(note.id % 5) - 2}deg` }}
    >
      <canvas ref={canvas} width={160} height={110} aria-hidden className="block h-11 w-16" />
    </div>
  );
}

// The full office for the /desk page: a full-width 3D scene (with a
// fullscreen mode) that follows Marc's routine in Philippine time, with
// buttons that let a visitor pick what he's doing instead and the weather
// outside. The light follows the real time either way.
export function DeskOffice() {
  const time = useManilaNow();
  const theme = useTheme();
  const holder = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLElement>(null);
  const [full, setFull] = useState(false);
  // On by default; it starts with the visitor's first click or key press.
  const [soundOn, setSoundOn] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [boardOpen, setBoardOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", body: "" });
  const [posting, setPosting] = useState<"idle" | "sending" | "error">("idle");
  const [postError, setPostError] = useState("");
  const office = useRef<OfficeScene | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [picked, setPicked] = useState<Activity | null>(null);
  const [said, setSaid] = useState("");
  const [book, setBook] = useState<number | null>(null);
  const [liveWeather, setLiveWeather] = useState<Weather | null>(null);
  const [pickedWeather, setPickedWeather] = useState<WeatherKind | null>(null);
  const [camView, setCamView] = useState<OfficeView>("room");
  const [trackerOpen, setTrackerOpen] = useState(false);
  // On phones the weather choices fold into a dropdown.
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [toast, setToast] = useState<{ label: string; count: number } | null>(null);
  const foundRaw = useSyncExternalStore(subscribeFound, readFound, () => "[]");
  const found = useMemo(() => parseFound(foundRaw), [foundRaw]);

  const block = time ? blockAt(time) : null;
  const activity = picked ?? block?.activity ?? null;
  // The light always follows the real time in Manila (and the weather),
  // whatever a visitor has him doing.
  const light = time ? daylight(time) : 0;
  const sun = time ? Math.round(sunHeight(time) * 50) / 50 : 0;

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    let unmounted = false;
    let visible = true;
    import("@/app/office/scene")
      .then(({ createOfficeScene }) => {
        if (unmounted) return;
        office.current = createOfficeScene(element, {
          onSay: setSaid,
          onBook: (index) => {
            setBook(index);
            setBoardOpen(false);
            setTrackerOpen(false);
          },
          onBoard: () => {
            setBoardOpen(true);
            setBook(null);
            setTrackerOpen(false);
          },
          onFind: (id) => {
            const list = parseFound(readFound());
            if (list.includes(id)) return;
            const next = [...list, id];
            writeFound(next);
            setToast({ label: discoveryLabels.get(id) ?? "", count: next.length });
            if (next.length === discoveries.length) office.current?.celebrate();
          },
        });
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
    office.current.setDaylight(light, sun);
  }, [state, activity, light, sun]);

  // The wall clock shows Manila time.
  const clockMinutes = time ? manilaMinutes(time) : 0;
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

  useEffect(() => {
    office.current?.setSound(soundOn);
  }, [state, soundOn]);

  // Christmas decorations from September to December, as in the
  // Philippines. ?season=christmas (or none) pretends, for checking.
  const christmas = time ? isChristmasSeason(time) : false;
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("season");
    office.current?.setFestive(forced === "christmas" || (forced !== "none" && christmas));
  }, [state, christmas]);

  // The cork board's notes.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/notes")
      .then((res) => (res.ok ? (res.json() as Promise<{ notes: Note[] }>) : { notes: [] }))
      .then((data) => {
        if (!cancelled) setNotes(data.notes);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    office.current?.setNotes(notes);
  }, [state, notes]);

  async function pinNote(event: React.FormEvent) {
    event.preventDefault();
    setPosting("sending");
    setPostError("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // With the moment it was left, for its polaroid.
        body: JSON.stringify({ ...draft, weather: weatherKind, activity }),
      });
      const data = (await res.json()) as { error?: string; name?: string; body?: string };
      if (!res.ok || !data.body || !data.name) throw new Error(data.error ?? "Couldn't pin that, try again.");
      const fresh: Note = {
        id: Date.now(),
        name: data.name,
        body: data.body,
        created_at: new Date().toISOString(),
        weather: weatherKind,
        activity,
      };
      const next = [fresh, ...notes].slice(0, 12);
      setNotes(next);
      office.current?.setNotes(next, fresh);
      setDraft({ name: draft.name, body: "" });
      setPosting("idle");
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Couldn't pin that, try again.");
      setPosting("error");
    }
  }

  // A found thing shows for a few seconds.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.count === discoveries.length ? 6000 : 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Fullscreen: the browser's own where it's supported, otherwise the scene
  // simply covers the page (iPhones can't fullscreen an element).
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === frame.current);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) setFull(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  function toggleFull() {
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (full) return setFull(false);
    const element = frame.current;
    if (element && document.fullscreenEnabled) {
      element.requestFullscreen().catch(() => setFull(true));
      // Some embedded browsers never answer; cover the page if nothing happened.
      window.setTimeout(() => {
        if (!document.fullscreenElement) setFull(true);
      }, 700);
      return;
    }
    setFull(true);
  }

  const weatherLine = pickedWeather
    ? `${weatherNames[pickedWeather]}, on your request`
    : liveWeather
      ? `${liveWeather.temperature}°C · ${liveWeather.label}`
      : "Checking the weather…";

  return (
    <section
      ref={frame}
      aria-label="Marc's office in 3D"
      className={`panel overflow-hidden ${full ? "fixed inset-0 z-[60] rounded-none" : "relative"}`}
    >
      <div
        ref={holder}
        className={`w-full cursor-grab touch-pan-y active:cursor-grabbing ${full ? "h-dvh" : "h-[min(500px,calc(100dvh-6rem))] sm:h-[clamp(460px,calc(100dvh-10rem),900px)]"}`}
      />
      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
          {state === "failed"
            ? "The 3D office couldn't load in this browser."
            : "Setting up the office…"}
        </div>
      )}
      {/* Time and weather in Bulacan, with buttons to change the weather. */}
      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-xl bg-background/80 p-1 pl-2.5 ring-1 ring-white/10 backdrop-blur-md sm:top-4 sm:left-4 sm:gap-2 sm:rounded-2xl sm:p-1.5 sm:pl-3">
        <p className="text-xs whitespace-nowrap text-zinc-300">
          <span className="font-medium tabular-nums text-zinc-100">{time ? manilaClock.format(time) : "--:--"}</span>
          <span className="text-zinc-600"> · </span>
          <Icon name={weatherIcons[weatherKind]} className="inline size-3.5 -translate-y-px text-zinc-400" />
          <span className="hidden sm:inline"> {weatherLine}</span>
        </p>
        <button
          type="button"
          onClick={() => setWeatherOpen((open) => !open)}
          aria-expanded={weatherOpen}
          aria-label="Weather"
          className="flex size-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-expanded:bg-white/[0.1] sm:hidden"
        >
          <Icon name="chevronDown" className={`size-3.5 transition-transform ${weatherOpen ? "rotate-180" : ""}`} />
        </button>
        <div
          role="group"
          aria-label="Change the weather"
          className={`${weatherOpen ? "flex" : "hidden"} absolute top-full left-0 mt-2 w-max flex-col gap-1.5 rounded-xl bg-background/95 p-2 ring-1 ring-white/10 backdrop-blur-md sm:static sm:mt-0 sm:flex sm:w-auto sm:flex-row sm:gap-0.5 sm:bg-transparent sm:p-0 sm:ring-0 sm:backdrop-blur-none`}
        >
          <p className="px-1 text-[11px] text-zinc-400 sm:hidden">{weatherLine}</p>
          <div className="flex gap-0.5">
          <button
            type="button"
            aria-pressed={pickedWeather === null}
            onClick={() => setPickedWeather(null)}
            className="rounded-lg px-2.5 py-2 text-[11px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white/[0.1] aria-pressed:text-zinc-50 sm:px-2 sm:py-1"
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
              className="rounded-lg px-2.5 py-2 text-[11px] transition-colors hover:bg-white/[0.06] aria-pressed:bg-white/[0.1] sm:px-2 sm:py-1"
            >
              <Icon name={weatherIcons[kind]} className="size-3.5" />
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 sm:top-4 sm:right-4 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            setTrackerOpen((open) => !open);
            setBoardOpen(false);
            setBook(null);
          }}
          aria-expanded={trackerOpen}
          aria-label={`Found ${found.length} of ${discoveries.length}`}
          title="Found in the room"
          className="flex h-9 items-center gap-1.5 rounded-xl bg-background/80 px-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:text-white aria-expanded:bg-white aria-expanded:text-black sm:px-3"
        >
          <Icon name="trophy" className="size-3.5" />
          <span className="tabular-nums">
            {found.length}
            <span className="text-zinc-500">/{discoveries.length}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setBoardOpen((open) => !open);
            setBook(null);
            setTrackerOpen(false);
          }}
          aria-expanded={boardOpen}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-background/80 px-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:text-white aria-expanded:bg-white aria-expanded:text-black sm:px-3"
        >
          <Icon name="stickyNote" className="size-3.5" />
          <span className="sr-only sm:not-sr-only">Notes</span>
          {notes.length > 0 && <span className="tabular-nums text-zinc-500">{notes.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setSoundOn((on) => !on)}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute the office" : "Turn on sound"}
          title={soundOn ? "Mute" : "Sound on"}
          className="flex size-9 items-center justify-center rounded-xl bg-background/80 text-zinc-300 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:text-white"
        >
          <Icon name={soundOn ? "volume" : "volumeOff"} className="size-4" />
        </button>
        <button
          type="button"
          onClick={toggleFull}
          aria-label={full ? "Exit fullscreen" : "Fullscreen"}
          title={full ? "Exit fullscreen" : "Fullscreen"}
          className="flex size-9 items-center justify-center rounded-xl bg-background/80 text-zinc-300 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:text-white"
        >
          <Icon name={full ? "minimize" : "maximize"} className="size-4" />
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>

      {/* Something just found. */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none absolute top-16 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs whitespace-nowrap text-black shadow-lg shadow-black/30 animate-rise"
        >
          <Icon name="trophy" className="size-3.5 shrink-0" />
          <span className="truncate font-medium">
            {toast.count === discoveries.length ? "Found everything!" : toast.label}
          </span>
          <span className="tabular-nums text-zinc-500">
            {toast.count}/{discoveries.length}
          </span>
        </div>
      )}

      {/* What's been found so far. */}
      {trackerOpen && (
        <div
          role="dialog"
          aria-label="Found in the room"
          className="absolute top-16 right-3 flex max-h-[calc(100%-9rem)] w-[min(18rem,calc(100%-1.5rem))] flex-col rounded-2xl bg-background/95 p-4 ring-1 ring-white/10 backdrop-blur-md animate-rise sm:right-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <Icon name="trophy" className="size-3" />
              Found in the room
            </p>
            <button
              type="button"
              onClick={() => setTrackerOpen(false)}
              aria-label="Close"
              className="-mt-1 -mr-1 rounded-lg px-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
            >
              ×
            </button>
          </div>
          <p className="mt-3 text-sm text-zinc-200">
            <span className="font-semibold tabular-nums text-zinc-50">{found.length}</span> of{" "}
            {discoveries.length} found
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500"
              style={{ width: `${(found.length / discoveries.length) * 100}%` }}
            />
          </div>
          {found.length === discoveries.length ? (
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              All of them. You know this room better than I do.{" "}
              <Link href="/#contact" className="text-zinc-100 underline underline-offset-2">
                Say hi
              </Link>
              ?
            </p>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              {found.length === 0
                ? "Nothing yet. Have a look around."
                : `${discoveries.length - found.length} more hiding in here.`}
            </p>
          )}
          {found.length > 0 && (
            <ul className="mt-3 -mr-2 space-y-1.5 overflow-y-auto pr-2 scrollbar-thin">
              {[...found].reverse().map((id) => (
                <li key={id} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Icon name="check" className="mt-0.5 size-3 shrink-0 text-emerald-400" />
                  {discoveryLabels.get(id)}
                </li>
              ))}
            </ul>
          )}
          {found.length > 0 && (
            <button
              type="button"
              onClick={() => writeFound([])}
              className="mt-3 self-start text-[11px] text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-200 hover:underline"
            >
              Start over
            </button>
          )}
        </div>
      )}

      {/* A book pulled off the shelf. */}
      {card && (
        <div
          role="dialog"
          aria-label={card.title}
          className="absolute top-16 right-3 w-[min(18rem,calc(100%-1.5rem))] sm:right-4 rounded-2xl bg-background/90 p-4 ring-1 ring-white/10 backdrop-blur-md animate-rise"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {card.meta}
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

      {/* The cork board: notes from visitors, and one to pin. */}
      {boardOpen && (
        <div
          role="dialog"
          aria-label="Notes from visitors"
          className="absolute top-16 right-3 flex max-h-[calc(100%-9rem)] w-[min(20rem,calc(100%-1.5rem))] flex-col rounded-2xl bg-background/95 p-4 ring-1 ring-white/10 backdrop-blur-md animate-rise sm:right-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <Icon name="pin" className="size-3" />
              Notes from visitors
            </p>
            <button
              type="button"
              onClick={() => setBoardOpen(false)}
              aria-label="Close the notes"
              className="-mt-1 -mr-1 rounded-lg px-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
            >
              ×
            </button>
          </div>
          <form onSubmit={pinNote} className="mt-3 space-y-2">
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              maxLength={NAME_MAX}
              placeholder="Your name (optional)"
              aria-label="Your name"
              className="w-full rounded-lg bg-white/[0.04] px-3 py-2 text-base text-zinc-100 ring-1 sm:text-sm ring-white/10 outline-none placeholder:text-zinc-600 focus:ring-white/25"
            />
            <textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              maxLength={NOTE_MAX}
              rows={2}
              required
              placeholder="Say hi, or tell me where you're visiting from…"
              aria-label="Your note"
              className="w-full resize-none rounded-lg bg-white/[0.04] px-3 py-2 text-base text-zinc-100 ring-1 sm:text-sm ring-white/10 outline-none placeholder:text-zinc-600 focus:ring-white/25"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] tabular-nums text-zinc-600">
                {draft.body.length}/{NOTE_MAX}
              </span>
              <button
                type="submit"
                disabled={posting === "sending" || !draft.body.trim()}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {posting === "sending" ? "Pinning…" : "Pin it"}
              </button>
            </div>
            {posting === "error" && (
              <p role="alert" className="text-xs text-rose-400">
                {postError}
              </p>
            )}
          </form>
          <ul className="mt-3 -mr-2 space-y-2 overflow-y-auto pr-2 scrollbar-thin">
            {notes.length === 0 && <li className="text-xs text-zinc-500">No notes yet. Be the first!</li>}
            {notes.map((note) => (
              <li key={note.id} className="flex gap-3 rounded-lg bg-white/[0.04] p-2.5">
                <Polaroid note={note} />
                <div className="min-w-0">
                  <p className="text-sm break-words text-zinc-200">{note.body}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">— {note.name}</p>
                  <p className="mt-1 font-mono text-[10px] text-zinc-600">
                    {noteTime.format(new Date(note.created_at))}
                    {note.activity && ` · ${doingLines[note.activity]}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Visitor controls: camera views, then what Marc is doing. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-3 sm:p-5">
        <div
          role="group"
          aria-label="Camera view"
          className="flex max-w-full items-center gap-0.5 rounded-xl bg-background/80 p-1 ring-1 ring-white/10 backdrop-blur-md"
        >
          <Icon name="video" className="mx-1.5 size-3.5 text-zinc-500" />
          {views.map((entry) => (
            <button
              key={entry.view}
              type="button"
              aria-pressed={camView === entry.view}
              onClick={() => {
                setCamView(entry.view);
                office.current?.setView(entry.view);
              }}
              className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white/15 aria-pressed:text-zinc-100"
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Choose what Marc is doing"
          className="flex w-full gap-0.5 rounded-2xl bg-background/80 p-1 ring-1 ring-white/10 backdrop-blur-md sm:w-auto sm:max-w-full sm:gap-1 sm:overflow-x-auto sm:p-1.5 sm:scrollbar-thin"
        >
          <button
            type="button"
            aria-pressed={picked === null}
            onClick={() => setPicked(null)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 text-[10px] font-medium whitespace-nowrap text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white aria-pressed:text-black sm:flex-none sm:shrink-0 sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
          >
            <span className="flex size-3.5 items-center justify-center">
              <span className="size-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </button>
          {activities.map((entry) => (
            <button
              key={entry.activity}
              type="button"
              aria-pressed={picked === entry.activity}
              onClick={() => setPicked(entry.activity)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 text-[10px] font-medium whitespace-nowrap text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 aria-pressed:bg-white aria-pressed:text-black sm:flex-none sm:shrink-0 sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
            >
              <Icon name={entry.icon} className="size-3.5" />
              {entry.action}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
