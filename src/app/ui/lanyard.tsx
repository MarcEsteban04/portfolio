"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Portrait } from "@/app/ui/portrait";
import { experience, profile, stats } from "@/lib/profile";
import {
  badgeAngle,
  createRope,
  fling,
  isResting,
  SEGMENTS,
  STEP,
  stepRope,
  type Rope,
} from "@/lib/rope";

const MAX_FLING = 2600; // px/s
const ANCHOR_Y = -28; // above the panel's top edge, which clips the strap
// How far, in degrees, the badge turns toward the cursor.
const TILT_Y = 9;
const TILT_X = 6;

// Bar widths for the decorative barcode, derived from the name so they stay
// the same on every render.
const bars = Array.from(`${profile.name}${profile.github}`).map(
  (char) => 1 + (char.charCodeAt(0) % 3),
);

const since = Math.min(
  ...experience.flatMap((job) =>
    (job.period.match(/\d{4}/g) ?? []).map(Number),
  ),
);

const strapText = `${profile.name} · Full-Stack · `.repeat(6).toUpperCase();

const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

function Slot() {
  return (
    <div
      aria-hidden
      className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-background shadow-[inset_0_1px_2px_var(--shadow)] ring-1 ring-white/10"
    />
  );
}

function Glare() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,25%),color-mix(in_oklab,var(--color-white)_9%,transparent),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover/badge:opacity-100"
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] tracking-[0.14em] whitespace-nowrap text-zinc-500 uppercase">
      {children}
    </span>
  );
}

// A developer ID badge on a lanyard at the top of the hero. It hangs still
// until grabbed, can be dragged and flung, tilts toward the
// cursor, and flips over on a click, tap or Enter. The photo on the front looks
// at the cursor. One animation loop writes the strap path and the badge's
// transforms straight to the DOM, and only while the badge is on screen.
export function Lanyard() {
  const strapId = useId();
  const [flipped, setFlipped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const tilt = tiltRef.current;
    const strap = strapRef.current;
    const edge = edgeRef.current;
    if (!root || !body || !tilt || !strap || !edge) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = root.clientWidth;
    let rest = body.offsetTop;
    function build(angle: number): Rope {
      return createRope({
        x: width / 2,
        y: ANCHOR_Y,
        length: rest - ANCHOR_Y,
        reach: body!.offsetHeight * 0.6,
        angle,
      });
    }
    // It hangs still until a visitor grabs it.
    let rope = build(0);

    const tiltNow = { x: 0, y: 0 };
    const tiltTarget = { x: 0, y: 0 };
    let drag: {
      offsetX: number;
      offsetY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      time: number;
    } | null = null;
    let press: { x: number; y: number; time: number } | null = null;
    let visible = true;
    let frame = 0;
    let previous = performance.now();
    let carry = 0;

    function local(event: PointerEvent) {
      const rect = root!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function simulate() {
      stepRope(rope, {
        hold: drag ? { x: drag.x + drag.offsetX, y: drag.y + drag.offsetY } : null,
      });
    }

    function render() {
      const { points } = rope;
      const top = points[SEGMENTS];
      const angle = badgeAngle(rope);
      tiltNow.x += (tiltTarget.x - tiltNow.x) * 0.08;
      tiltNow.y += (tiltTarget.y - tiltNow.y) * 0.08;

      body!.style.transform = `translate(${top.x - width / 2}px, ${top.y - rest}px) rotate(${-angle}rad)`;
      tilt!.style.transform = `rotateY(${tiltNow.y}deg) rotateX(${tiltNow.x}deg)`;
      // The foil sticker shifts hue as the badge swings and turns.
      tilt!.style.setProperty("--foil", `${tiltNow.y * 6 + angle * 140}deg`);

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < SEGMENTS; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2;
        const my = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x} ${points[i].y} ${mx} ${my}`;
      }
      d += ` L ${top.x} ${top.y}`;
      strap!.setAttribute("d", d);
      edge!.setAttribute("d", d);
    }

    function tick(now: number) {
      carry += Math.min((now - previous) / 1000, 0.1);
      previous = now;
      while (carry >= STEP) {
        simulate();
        carry -= STEP;
      }
      render();
      const tilting =
        Math.abs(tiltTarget.x - tiltNow.x) > 0.01 ||
        Math.abs(tiltTarget.y - tiltNow.y) > 0.01;
      // Stop once the badge has settled; a pointer move or grab restarts it.
      const busy = drag || tilting || !isResting(rope);
      frame = visible && busy ? requestAnimationFrame(tick) : 0;
    }

    function run() {
      if (still || frame) return;
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }

    // Re-reads the layout. When it changes, the rope is rebuilt hanging
    // straight, which keeps it in step with the new size.
    function measure() {
      const nextWidth = root!.clientWidth;
      const nextRest = body!.offsetTop;
      if (nextWidth !== width || nextRest !== rest) {
        width = nextWidth;
        rest = nextRest;
        rope = build(0);
      }
      render();
    }

    function onPointerMove(event: PointerEvent) {
      const rect = tilt!.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      tiltTarget.y = clamp(dx / 600, 1) * TILT_Y;
      tiltTarget.x = clamp(-dy / 600, 1) * TILT_X;
      tilt!.style.setProperty(
        "--gx",
        `${((event.clientX - rect.left) / rect.width) * 100}%`,
      );
      tilt!.style.setProperty(
        "--gy",
        `${((event.clientY - rect.top) / rect.height) * 100}%`,
      );
      run();

      if (drag) {
        const now = performance.now();
        const { x, y } = local(event);
        const elapsed = Math.max((now - drag.time) / 1000, 1 / 240);
        // Smoothed so one jittery sample doesn't decide the fling.
        drag.vx = drag.vx * 0.5 + ((x - drag.x) / elapsed) * 0.5;
        drag.vy = drag.vy * 0.5 + ((y - drag.y) / elapsed) * 0.5;
        drag.x = x;
        drag.y = y;
        drag.time = now;
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      tilt!.setPointerCapture(event.pointerId);
      press = { x: event.clientX, y: event.clientY, time: performance.now() };
      if (still) return;
      const { x, y } = local(event);
      drag = {
        offsetX: rope.weight.x - x,
        offsetY: rope.weight.y - y,
        x,
        y,
        vx: 0,
        vy: 0,
        time: performance.now(),
      };
      tilt!.dataset.dragging = "";
      run();
    }

    function onPointerUp(event: PointerEvent) {
      // A short press that barely moved is a click: flip the badge.
      if (
        press &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) < 6 &&
        performance.now() - press.time < 500
      ) {
        setFlipped((value) => !value);
      }
      press = null;
      if (!drag) return;
      // The rope steps on the next frame, so release before flinging.
      const { vx, vy } = drag;
      drag = null;
      stepRope(rope);
      fling(rope, clamp(vx, MAX_FLING), clamp(vy, MAX_FLING));
      delete tilt!.dataset.dragging;
    }

    function onLeave() {
      tiltTarget.x = 0;
      tiltTarget.y = 0;
    }

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
    });
    visibility.observe(root);
    const resize = new ResizeObserver(measure);
    resize.observe(root);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    tilt.addEventListener("pointerdown", onPointerDown);
    tilt.addEventListener("pointerup", onPointerUp);
    tilt.addEventListener("pointercancel", onPointerUp);
    render();
    run();

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      tilt.removeEventListener("pointerdown", onPointerDown);
      tilt.removeEventListener("pointerup", onPointerUp);
      tilt.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative mx-auto flow-root w-52 sm:mx-0 sm:w-full">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
      >
        <path ref={edgeRef} fill="none" stroke="#021a12" strokeWidth={17} />
        <path
          ref={strapRef}
          id={strapId}
          fill="none"
          stroke="#064e36"
          strokeWidth={13}
        />
        <text
          className="fill-emerald-200/60 font-mono text-[7px] tracking-[0.25em]"
          dominantBaseline="middle"
        >
          <textPath href={`#${strapId}`}>{strapText}</textPath>
        </text>
      </svg>

      <div
        ref={bodyRef}
        className="relative z-20 mt-24 origin-top will-change-transform sm:mt-28"
      >
        {/* The clip that holds the badge to the strap. */}
        <div
          aria-hidden
          className="absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center"
        >
          <div className="h-3 w-9 rounded-sm bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-[inset_0_-1px_0_rgb(0_0_0/0.35)]" />
          <div className="h-2 w-1.5 bg-zinc-500" />
        </div>

        <div className="[perspective:1100px]">
          <div
            ref={tiltRef}
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            aria-label={`${profile.name}'s developer ID badge. Press to flip it over.`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setFlipped((value) => !value);
              }
            }}
            className="group/badge cursor-grab touch-none rounded-2xl outline-none select-none [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-white/50 data-[dragging]:cursor-grabbing"
          >
            <div
              className={`relative rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.3,1.4,0.5,1)] [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* Front */}
              <div
                aria-hidden={flipped}
                className="relative rounded-2xl bg-raised p-3 shadow-[0_30px_60px_-20px_var(--shadow)] ring-1 ring-white/10 [backface-visibility:hidden]"
              >
                <Slot />
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <Label>Developer ID</Label>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-emerald-300 uppercase">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                      <span className="relative size-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Available
                  </span>
                </div>

                <div data-tour-greeting="">
                  <Portrait alt={`Portrait of ${profile.name}`} framed />
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight text-zinc-50 sm:text-lg">
                      {profile.name}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {profile.role}
                    </p>
                  </div>
                  {/* Holographic security sticker. */}
                  <div
                    aria-hidden
                    className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[conic-gradient(from_var(--foil,0deg),#a5b4fc,#f0abfc,#fcd34d,#6ee7b7,#93c5fd,#a5b4fc)] opacity-85 ring-1 ring-white/20"
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.25)_0_1px,transparent_1px_3px)] mix-blend-overlay" />
                    <span className="relative font-mono text-[8px] font-bold text-[rgb(0_0_0/0.5)]">
                      ME
                    </span>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
                  <div>
                    <dt>
                      <Label>Based in</Label>
                    </dt>
                    <dd className="text-xs text-zinc-200">
                      {profile.location.split(", ")[1]}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Label>Experience</Label>
                    </dt>
                    <dd className="text-xs text-zinc-200">
                      {stats[0].value} years
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div aria-hidden className="flex h-7 items-stretch gap-[2px]">
                    {bars.map((width, i) => (
                      <span
                        key={i}
                        className={i % 2 ? "bg-transparent" : "bg-zinc-300"}
                        style={{ width }}
                      />
                    ))}
                  </div>
                  <span className="truncate font-mono text-[9px] text-zinc-500">
                    @{profile.github}
                  </span>
                </div>
                <Glare />
              </div>

              {/* Back */}
              <div
                aria-hidden={!flipped}
                className="absolute inset-0 flex flex-col rounded-2xl bg-raised p-3 ring-1 ring-white/10 [backface-visibility:hidden] [transform:rotateY(180deg)]"
              >
                <Slot />
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <Label>Scan to connect</Label>
                  <Label>GitHub</Label>
                </div>
                <div className="rounded-xl bg-[#fff] p-2.5">
                  <Image
                    src="/badge-qr.svg"
                    alt={`QR code linking to github.com/${profile.github}`}
                    width={290}
                    height={290}
                    unoptimized
                    className="h-auto w-full"
                  />
                </div>
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={flipped ? 0 : -1}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="mt-2 block truncate text-center font-mono text-[10px] text-zinc-300 underline decoration-white/20 underline-offset-2 hover:text-white"
                >
                  github.com/{profile.github}
                </a>

                <div className="mt-auto border-t border-white/[0.06] pt-3">
                  <Label>If found, please return to</Label>
                  <p className="mt-0.5 truncate text-xs text-zinc-200">
                    {profile.email}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {/* Smart-card chip. */}
                    <div
                      aria-hidden
                      className="grid h-6 w-8 grid-cols-3 grid-rows-3 gap-px overflow-hidden rounded-[5px] bg-zinc-500 p-px"
                    >
                      {Array.from({ length: 9 }, (_, i) => (
                        <span
                          key={i}
                          className="rounded-[1px] bg-gradient-to-br from-zinc-200 to-zinc-400"
                        />
                      ))}
                    </div>
                    <Label>Building since {since}</Label>
                  </div>
                </div>
                <Glare />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] text-zinc-600">
        <span className="[@media(pointer:coarse)]:hidden">
          Drag to swing · Click to flip
        </span>
        <span className="hidden [@media(pointer:coarse)]:inline">
          Drag to swing · Tap to flip
        </span>
      </p>
    </div>
  );
}
