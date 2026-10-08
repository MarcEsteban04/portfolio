import type { IconName } from "@/app/ui/icons";

// Sections of the home dashboard, in page order. The sidebar highlights the
// one in view, the command menu jumps to any of them, and the guided cursor
// explains each one with its tip.
export const sections = [
  {
    id: "overview",
    label: "Overview",
    icon: "dashboard",
    tip: "Who I am, what I do and how to reach me, at a glance.",
  },
  {
    id: "projects",
    label: "Projects",
    icon: "folder",
    tip: "Apps I've designed and built, each with screens and a full case study.",
  },
  {
    id: "activity",
    label: "Activity",
    icon: "activity",
    tip: "My GitHub contributions over the last year, updated hourly.",
  },
  {
    id: "about",
    label: "About",
    icon: "user",
    tip: "How I work and the results I've delivered for clients.",
  },
  {
    id: "skills",
    label: "Skills",
    icon: "layers",
    tip: "The languages, frameworks and tools I build with.",
  },
  {
    id: "experience",
    label: "Experience",
    icon: "briefcase",
    tip: "Where I've worked, from my current role back to my first.",
  },
  {
    id: "education",
    label: "Education",
    icon: "graduation",
    tip: "My Computer Science degree, GPA and award.",
  },
  {
    id: "contact",
    label: "Contact",
    icon: "mail",
    tip: "Have a project in mind? This is where we start.",
  },
] as const satisfies { id: string; label: string; icon: IconName; tip: string }[];

export const deskTip =
  "Step into my 3D office: it follows my day in Philippine time, and you can pick what I'm doing.";
export const searchTip = "Press Ctrl K anytime to search and jump anywhere.";
export const usesTip = "My PC, monitors and peripherals, and the software I build with.";
export const contributionsTip =
  "The full GitHub calendar, with streaks and my busiest day.";

export type NavProject = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  organization?: string;
};

export const OPEN_COMMAND_MENU = "open-command-menu";
export const START_TOUR = "start-guided-tour";
// Where the guided cursor is heading, so the portrait can look at it.
export const GUIDE_CURSOR_MOVE = "guide-cursor-move";

type Point = { x: number; y: number };

// The guided cursor's latest position, kept here as well as broadcast, so a
// portrait that mounts mid-tour still knows where to look.
let guidePoint: Point | null = null;

export function moveGuide(point: Point | null) {
  guidePoint = point;
  window.dispatchEvent(new CustomEvent(GUIDE_CURSOR_MOVE, { detail: point }));
}

export function currentGuidePoint() {
  return guidePoint;
}

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_COMMAND_MENU));
}

// Set in session storage once a visitor has taken the tour, so the
// overview can offer it "again" instead.
export const TOUR_SEEN_KEY = "guided-tour-seen";

export function startTour() {
  window.dispatchEvent(new Event(START_TOUR));
}
