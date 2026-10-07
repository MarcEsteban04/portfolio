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
  manilaClock,
  manilaMinutes,
  manilaTimeToday,
  type Activity,
} from "@/lib/office";
import { NAME_MAX, NOTE_MAX, type Note } from "@/lib/notes";
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

  const block = time ? blockAt(time) : null;
  const activity = picked ?? block?.activity ?? null;
  // The light always follows the real time in Manila (and the weather),
  // whatever a visitor has him doing.
  const light = time ? daylight(time) : 0;

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
          },
          onBoard: () => {
            setBoardOpen(true);
            setBook(null);
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
    office.current.setDaylight(light);
  }, [state, activity, light]);

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
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { error?: string; name?: string; body?: string };
      if (!res.ok || !data.body || !data.name) throw new Error(data.error ?? "Couldn't pin that, try again.");
      const fresh = { id: Date.now(), name: data.name, body: data.body, created_at: new Date().toISOString() };
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
        className={`w-full cursor-grab touch-pan-y active:cursor-grabbing ${full ? "h-dvh" : "h-[clamp(460px,calc(100dvh-10rem),900px)]"}`}
      />
      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
          {state === "failed"
            ? "The 3D office couldn't load in this browser."
            : "Setting up the office…"}
        </div>
      )}
      {/* Time and weather in Bulacan, with buttons to change the weather. */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 rounded-2xl bg-background/80 p-1.5 pl-3 ring-1 ring-white/10 backdrop-blur-md sm:top-4 sm:left-4">
        <p className="text-xs text-zinc-300">
          <span className="font-medium tabular-nums text-zinc-100">{time ? manilaClock.format(time) : "--:--"}</span>
          <span className="text-zinc-600"> · </span>
          <Icon name={weatherIcons[weatherKind]} className="inline size-3.5 -translate-y-px text-zinc-400" /> {weatherLine}
        </p>
        <div role="group" aria-label="Change the weather" className="flex gap-0.5">
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
              className="rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-white/[0.06] aria-pressed:bg-white/[0.1]"
            >
              <Icon name={weatherIcons[kind]} className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 sm:top-4 sm:right-4">
        <button
          type="button"
          onClick={() => {
            setBoardOpen((open) => !open);
            setBook(null);
          }}
          aria-expanded={boardOpen}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-background/80 px-3 text-xs font-medium text-zinc-200 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:text-white aria-expanded:bg-white aria-expanded:text-black"
        >
          <Icon name="stickyNote" className="size-3.5" />
          Notes{notes.length > 0 && <span className="tabular-nums text-zinc-500">{notes.length}</span>}
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
              className="w-full rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 ring-1 ring-white/10 outline-none placeholder:text-zinc-600 focus:ring-white/25"
            />
            <textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              maxLength={NOTE_MAX}
              rows={2}
              required
              placeholder="Say hi, or tell me where you're visiting from…"
              aria-label="Your note"
              className="w-full resize-none rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 ring-1 ring-white/10 outline-none placeholder:text-zinc-600 focus:ring-white/25"
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
              <li key={note.id} className="rounded-lg bg-white/[0.04] px-3 py-2">
                <p className="text-sm text-zinc-200">{note.body}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">— {note.name}</p>
              </li>
            ))}
          </ul>
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
              <Icon name={entry.icon} className="size-3.5" />
              {entry.action}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
