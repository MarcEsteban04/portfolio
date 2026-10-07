"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { currentGuidePoint, GUIDE_CURSOR_MOVE } from "@/app/ui/navigation";

type Point = { x: number; y: number };

// One photo per direction, named from the visitor's side of the screen: with
// the cursor up and to the left, "up-left" shows the photo looking that way.
// Classes are spelled out in full so Tailwind can find them.
const poses = {
  "up-left": "group-data-[pose=up-left]/portrait:opacity-100",
  up: "group-data-[pose=up]/portrait:opacity-100",
  "up-right": "group-data-[pose=up-right]/portrait:opacity-100",
  left: "group-data-[pose=left]/portrait:opacity-100",
  center: "group-data-[pose=center]/portrait:opacity-100",
  right: "group-data-[pose=right]/portrait:opacity-100",
  "down-left": "group-data-[pose=down-left]/portrait:opacity-100",
  down: "group-data-[pose=down]/portrait:opacity-100",
  "down-right": "group-data-[pose=down-right]/portrait:opacity-100",
};

type Pose = keyof typeof poses;

// Each theme has its own set of the nine poses: sunglasses for light mode.
const photoSets = [
  { folder: "portrait", className: "light:hidden" },
  { folder: "portrait-light", className: "hidden light:block" },
];

// The eight turned poses by the direction they face, clockwise from the right
// in 45° steps (screen y grows downward, so 90° is straight down).
const around: Pose[] = [
  "right",
  "down-right",
  "down",
  "down-left",
  "left",
  "up-left",
  "up",
  "up-right",
];

// Within this fraction of the portrait's width of the eyes, the face looks
// straight ahead.
const CENTER_ZONE = 0.4;
// Extra degrees the cursor must travel past a boundary before the pose
// changes, so it doesn't flicker when the cursor rests on the line.
const STICKY = 6;
// Up and down count double. A cursor far to the side but clearly below the
// face is only a few degrees under level, yet people expect the head to drop;
// the side-facing photos also hold the chin slightly raised.
const VERTICAL_WEIGHT = 2;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

// Picks the photo facing the cursor from the angle between the eyes and the
// cursor (with VERTICAL_WEIGHT applied), so it behaves the same on any screen
// shape.
function poseFor(dx: number, dy: number, size: number, previous: Pose): Pose {
  if (Math.hypot(dx, dy) < size * CENTER_ZONE) return "center";
  const angle = (Math.atan2(dy * VERTICAL_WEIGHT, dx) * 180) / Math.PI;
  const index = previous === "center" ? -1 : around.indexOf(previous);
  if (index >= 0) {
    const offset = Math.abs(((angle - index * 45 + 540) % 360) - 180);
    if (offset < 22.5 + STICKY) return previous;
  }
  return around[((Math.round(angle / 45) % 8) + 8) % 8];
}

// A halftone portrait that looks at the cursor: it swaps to the photo facing
// the cursor's direction and tilts slightly toward it. The guided cursor takes
// priority while the tour runs; otherwise it follows the visitor's pointer and
// looks straight ahead when the pointer leaves the window. Everything is
// written straight to the element (data-pose, --lx, --ly), so following the
// pointer never re-renders React.
export function Portrait({
  alt,
  framed = false,
}: {
  alt: string;
  // Inside a card the photo keeps its own rectangle and the card does the
  // tilting; on its own it fades into the page and tilts itself.
  framed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const tilt = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    let pointer: Point | null = null;
    // A tour may already be running if this mounted late.
    let guided: Point | null = currentGuidePoint();
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;

    function tick() {
      current.x += (target.x - current.x) * 0.09;
      current.y += (target.y - current.y) * 0.09;
      element!.style.setProperty("--lx", current.x.toFixed(4));
      element!.style.setProperty("--ly", current.y.toFixed(4));
      const settled =
        Math.abs(target.x - current.x) < 0.001 &&
        Math.abs(target.y - current.y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }

    function aim() {
      const point = guided ?? pointer;
      let pose: Pose = "center";
      if (point) {
        const rect = element!.getBoundingClientRect();
        const dx = point.x - (rect.left + rect.width / 2);
        const dy = point.y - (rect.top + rect.height * 0.3);
        const previous = (element!.dataset.pose ?? "center") as Pose;
        pose = poseFor(dx, dy, rect.width, previous);
        // The tilt eases toward the exact direction, filling in between poses.
        target.x = clamp(dx / (window.innerWidth * 0.45));
        target.y = clamp(dy / (window.innerHeight * 0.55));
      } else {
        target.x = 0;
        target.y = 0;
      }
      element!.dataset.pose = pose;
      if (tilt && !frame) frame = requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    }
    function onLeave() {
      pointer = null;
      aim();
    }
    function onGuide(event: Event) {
      guided = (event as CustomEvent<Point | null>).detail;
      aim();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", aim, { passive: true });
    window.addEventListener(GUIDE_CURSOR_MOVE, onGuide);
    if (guided) aim();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", aim);
      window.removeEventListener(GUIDE_CURSOR_MOVE, onGuide);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-pose="center"
      className="group/portrait relative aspect-[4/5] w-full [perspective:900px]"
    >
      <div
        className={
          framed
            ? "absolute inset-0 overflow-hidden rounded-xl ring-1 ring-white/10"
            : "absolute inset-0 [transform:rotateY(calc(var(--lx,0)*6deg))_rotateX(calc(var(--ly,0)*-4deg))_translate3d(calc(var(--lx,0)*6px),calc(var(--ly,0)*4px),0)] [mask-image:radial-gradient(ellipse_58%_66%_at_50%_40%,black_40%,transparent_97%)]"
        }
      >
        {photoSets.map((set) =>
          Object.entries(poses).map(([pose, visible]) => (
          <Image
            key={`${set.folder}-${pose}`}
            src={`/${set.folder}/${pose}.webp`}
            alt={pose === "center" ? alt : ""}
            fill
            // Lazy, so the set hidden by the other theme never downloads.
            loading="lazy"
            sizes="(min-width: 1536px) 320px, (min-width: 1280px) 220px, 180px"
            className={`object-cover opacity-0 [filter:saturate(1.15)_contrast(1.12)] transition-[opacity,filter] duration-150 group-hover/portrait:[filter:none] ${set.className} ${visible}`}
          />
          )),
        )}
        {/* Shown while the theme toggle is hovered: putting the sunglasses on
            (or taking them off), looking up toward the toggle. */}
        <Image
          src="/portrait/glasses-on.webp"
          alt=""
          fill
          sizes="(min-width: 1536px) 320px, (min-width: 1280px) 220px, 180px"
          className="object-cover opacity-0 [filter:saturate(1.15)_contrast(1.12)] transition-[opacity,filter] duration-200 peek:opacity-100 group-hover/portrait:[filter:none]"
        />
        {/* Halftone dots over the colour photo, fading out on hover to show it clean. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle,rgb(7_8_10/0.55)_0.9px,transparent_1.4px)] [background-size:4px_4px] transition-opacity duration-700 group-hover/portrait:opacity-0"
        />
      </div>
    </div>
  );
}
