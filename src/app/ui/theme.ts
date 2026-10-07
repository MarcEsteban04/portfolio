"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/app/ui/theme-script";

export type Theme = "dark" | "light";

const CHANGE = "themechange";

function read(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

export function useTheme() {
  return useSyncExternalStore(subscribe, read, () => "dark" as Theme);
}

function apply(theme: Theme) {
  // The switch ends any hover preview, so the revealed theme shows the
  // portrait already wearing (or without) the sunglasses.
  peekTheme(false);
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked; the choice then lasts until the page reloads.
  }
  window.dispatchEvent(new Event(CHANGE));
}

// Switches theme. Given an origin (such as the toggle's centre), the new theme
// spreads out from it in a circle, where the browser supports view transitions
// and the visitor hasn't asked for reduced motion.
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!origin || still || !document.startViewTransition) {
    apply(theme);
    return Promise.resolve();
  }
  const transition = document.startViewTransition(() => apply(theme));
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  // A browser can skip the animation (a hidden tab, a slow frame). The theme
  // has switched by then anyway, so a skipped transition is not an error.
  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  return transition.finished.catch(() => {});
}

export function toggleTheme(origin?: { x: number; y: number }) {
  return setTheme(read() === "light" ? "dark" : "light", origin);
}

// Marks the page while the theme toggle is hovered or focused.
export function peekTheme(on: boolean) {
  if (on) document.documentElement.dataset.themePeek = "";
  else delete document.documentElement.dataset.themePeek;
}
