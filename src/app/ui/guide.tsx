"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { moveGuide, START_TOUR, TOUR_SEEN_KEY } from "@/app/ui/navigation";
import { profile } from "@/lib/profile";

const firstName = profile.name.split(" ")[0];
const greeting = `Hi! I'm ${firstName}, welcome to my dashboard 👋 Let me show you around.`;

type Tip = { title: string; text: string; left: number; top: number };
type Point = { x: number; y: number };
type Cursor = { title: string; text: string; visible: boolean };

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

function canTour() {
  return (
    window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function tipOf(element: Element) {
  const isApple = /Mac|iPhone|iPad/.test(navigator.userAgent);
  const text = element.getAttribute("data-tip") ?? "";
  return {
    title: element.getAttribute("data-tip-title") ?? "",
    text: isApple ? text.replace("Ctrl K", "⌘K") : text,
  };
}

const GLIDE_MS = 850;

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

// Two kinds of help for the sidebar: a tooltip beside any [data-tip] element the
// visitor hovers or tabs to, and a guided cursor that greets first-time visitors
// on the home page and walks through each [data-tour] item. A click, scroll or
// Escape ends the tour, and it runs once per session unless replayed.
export function Guide() {
  const pathname = usePathname();
  const [tip, setTip] = useState<Tip | null>(null);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  // Each tour gets a number, so a stopped tour's pending steps notice and bail.
  const run = useRef(0);
  const active = useRef(false);
  const touring = useRef<Element | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const position = useRef<Point>({ x: 0, y: 0 });

  // Tooltips for the visitor's own pointer and keyboard focus.
  useEffect(() => {
    function show(element: Element) {
      const rect = element.getBoundingClientRect();
      setTip({
        ...tipOf(element),
        left: rect.right + 14,
        top: rect.top + rect.height / 2,
      });
    }
    function onPointerOver(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const element = (event.target as Element).closest?.("[data-tip]");
      if (element) show(element);
      else setTip(null);
    }
    function onFocusIn(event: FocusEvent) {
      const target = event.target as Element;
      const element = target.closest?.("[data-tip]");
      if (element && target.matches(":focus-visible")) show(element);
    }
    const hide = () => setTip(null);

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);

  // The guided tour.
  useEffect(() => {
    function mark(element: Element | null) {
      touring.current?.removeAttribute("data-touring");
      element?.setAttribute("data-touring", "");
      touring.current = element;
    }

    function place(point: Point) {
      position.current = point;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      }
      moveGuide(point);
    }

    // Moves the cursor frame by frame rather than with a CSS transition, so
    // the portrait can follow it the whole way there.
    function glide(to: Point, alive: () => boolean) {
      const from = position.current;
      const startedAt = performance.now();
      return new Promise<void>((done) => {
        function frame(now: number) {
          if (!alive()) return done();
          const t = Math.min(1, (now - startedAt) / GLIDE_MS);
          const k = ease(t);
          place({
            x: from.x + (to.x - from.x) * k,
            y: from.y + (to.y - from.y) * k,
          });
          if (t < 1) requestAnimationFrame(frame);
          else done();
        }
        requestAnimationFrame(frame);
      });
    }

    function stop() {
      if (!active.current) return;
      active.current = false;
      run.current++;
      mark(null);
      moveGuide(null);
      setCursor((current) => current && { ...current, visible: false });
      setTimeout(() => setCursor(null), 400);
    }

    async function start() {
      if (!canTour()) return;
      const id = ++run.current;
      active.current = true;
      const alive = () => run.current === id;
      try {
        sessionStorage.setItem(TOUR_SEEN_KEY, "1");
      } catch {
        // Storage can be blocked; the overview just offers the tour as new.
      }

      const steps: { element: Element; title: string; text: string }[] = [];
      const hello = document.querySelector("[data-tour-greeting]");
      if (hello) steps.push({ element: hello, title: firstName, text: greeting });
      document.querySelectorAll("[data-tour]").forEach((element) => {
        steps.push({ element, ...tipOf(element) });
      });

      setCursor({ title: "", text: "", visible: false });
      await sleep(60);
      if (!alive()) return;
      place({ x: window.innerWidth * 0.55, y: window.innerHeight + 40 });

      for (const [i, step] of steps.entries()) {
        if (!alive()) return;
        step.element.scrollIntoView({ block: "nearest" });
        const rect = step.element.getBoundingClientRect();
        const isGreeting = step.element === hello;
        // The greeting points just beside the portrait's head; sidebar
        // stops point at their label.
        const point = isGreeting
          ? { x: rect.left + rect.width * 0.82, y: rect.top + rect.height * 0.3 }
          : {
              x: rect.left + Math.min(rect.width * 0.6, 130),
              y: rect.top + rect.height * 0.65,
            };
        setCursor({ title: "", text: "", visible: true });
        await glide(point, alive);
        if (!alive()) return;
        // Highlight the item only once the cursor has reached it.
        mark(isGreeting ? null : step.element);
        setCursor({ title: step.title, text: step.text, visible: true });
        await sleep(i === 0 ? 3400 : 2300);
      }
      if (alive()) stop();
    }

    const interrupt = () => stop();
    // Typing doesn't end the tour; only Escape does.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop();
    };
    const onStart = () => {
      stop();
      setTimeout(start, 450);
    };

    // The tour no longer starts by itself: the overview invites visitors to
    // take it (and the sidebar always offers it).

    window.addEventListener(START_TOUR, onStart);
    window.addEventListener("pointerdown", interrupt);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    return () => {
      stop();
      window.removeEventListener(START_TOUR, onStart);
      window.removeEventListener("pointerdown", interrupt);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
    };
  }, [pathname]);

  return (
    <>
      {tip && !cursor && (
        <div
          role="tooltip"
          style={{ left: tip.left, top: tip.top }}
          className="pointer-events-none fixed z-[60] w-max max-w-64 -translate-y-1/2 animate-[pop_160ms_ease-out_both] rounded-xl bg-raised px-3 py-2 shadow-[0_12px_32px_-8px_var(--shadow)] ring-1 ring-white/10"
        >
          <span
            aria-hidden
            className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 bg-raised ring-1 ring-white/10 [clip-path:polygon(0_0,0_100%,100%_100%)]"
          />
          {tip.title && (
            <p className="text-xs font-medium text-zinc-100">{tip.title}</p>
          )}
          <p className="text-xs leading-snug text-zinc-400">{tip.text}</p>
        </div>
      )}

      {cursor && (
        <div
          ref={cursorRef}
          aria-hidden
          // Only place() moves the cursor, so React never writes its transform.
          style={{ opacity: cursor.visible ? 1 : 0 }}
          className="pointer-events-none fixed top-0 left-0 z-[70] transition-opacity duration-300"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6 -translate-x-[3px] -translate-y-[2px] drop-shadow-[0_4px_8px_rgb(0_0_0/0.6)]"
          >
            <path
              d="M4.5 3.2 19 10.4c.9.4.8 1.7-.2 2l-5.9 1.7-2.6 5.6c-.4.9-1.7.9-2-.1L3.1 4.6c-.3-.9.6-1.8 1.4-1.4Z"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {cursor.text && (
            <div
              key={cursor.text}
              className="absolute top-6 left-5 w-max max-w-64 animate-[pop_200ms_ease-out_both] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-zinc-900 shadow-[0_16px_40px_-12px_var(--shadow)]"
            >
              {cursor.title && (
                <p className="text-[11px] font-medium text-zinc-500">
                  {cursor.title}
                </p>
              )}
              <p className="text-[13px] leading-snug font-medium">
                {cursor.text}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
