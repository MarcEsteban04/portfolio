"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/app/ui/icons";
import {
  contributionsTip,
  deskTip,
  usesTip,
  searchTip,
  sections,
  startTour,
  type NavProject,
} from "@/app/ui/navigation";
import { ViewerCount } from "@/app/ui/presence";
import { CommandTrigger, ShortcutHint } from "@/app/ui/widgets";
import { profile } from "@/lib/profile";


// Tracks which home section sits in the band just above the middle of the
// viewport. At the very bottom of the page the last section wins, since a short
// final section never reaches that band.
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    if (!enabled) return;
    const last = sections[sections.length - 1].id;
    const atBottom = () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;

    const observer = new IntersectionObserver(
      (entries) => {
        if (atBottom()) return setActive(last);
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }

    function onScroll() {
      if (atBottom()) setActive(last);
      else if (window.scrollY < 80) setActive(sections[0].id);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  return enabled ? active : null;
}

const linkClass =
  "group flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 aria-[current]:bg-white/[0.06] aria-[current]:text-white data-[touring]:bg-white/[0.06] data-[touring]:text-white data-[within]:text-white";

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </p>
  );
}

// Whether the Projects dropdown is open, remembered in this browser so it
// stays as it was left across pages and reloads ("1" open, "0" closed, null
// not chosen yet).
const PROJECTS_OPEN_KEY = "sidebar-projects-open";
const projectsOpenEvent = "sidebar-projects-change";
function readProjectsOpen() {
  try {
    return localStorage.getItem(PROJECTS_OPEN_KEY);
  } catch {
    return null;
  }
}
function writeProjectsOpen(open: boolean) {
  try {
    localStorage.setItem(PROJECTS_OPEN_KEY, open ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(projectsOpenEvent));
}
function subscribeProjectsOpen(onChange: () => void) {
  window.addEventListener(projectsOpenEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(projectsOpenEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function ProjectLink({ project, pathname }: { project: NavProject; pathname: string }) {
  const href = `/projects/${project.slug}`;
  return (
    <li>
      <Link
        href={href}
        aria-current={pathname === href ? "page" : undefined}
        data-tip={project.tagline}
        data-tip-title={project.name}
        className={`${linkClass} relative before:absolute before:top-1.5 before:bottom-1.5 before:-left-[9px] before:w-0.5 before:rounded-full aria-[current]:font-medium aria-[current]:before:bg-white`}
      >
        <Image src={project.icon} alt="" width={18} height={18} className="size-[18px] rounded-md" />
        {project.name}
      </Link>
    </li>
  );
}

export function Sidebar({ projects }: { projects: NavProject[] }) {
  const { name, role, email } = profile;
  const pathname = usePathname();
  const activeSection = useActiveSection(pathname === "/");
  // The Projects item folds out into the case studies. It stays however it
  // was last left, and opens by itself on a case study's page so the current
  // one shows.
  const onProject = pathname.startsWith("/projects/");
  const storedOpen = useSyncExternalStore(subscribeProjectsOpen, readProjectsOpen, () => null);
  const projectsOpen = storedOpen === null ? onProject : storedOpen === "1";
  useEffect(() => {
    if (onProject) writeProjectsOpen(true);
  }, [onProject, pathname]);
  const ownProjects = projects.filter((project) => !project.organization);
  const workProjects = projects.filter((project) => project.organization);
  const organizations = [...new Set(workProjects.map((project) => project.organization!))];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-background/85 backdrop-blur-xl lg:flex">
      <Link
        href="/#overview"
        className="flex items-center gap-3 px-5 pt-5 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <Avatar className="size-10 rounded-xl" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-zinc-100">
            {name}
          </span>
          <span className="block truncate text-xs text-zinc-500">{role}</span>
        </span>
      </Link>

      <div className="px-3">
        <CommandTrigger
          tip={{ title: "Search", text: searchTip }}
          className="flex w-full items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-sm text-zinc-500 transition-colors hover:border-white/15 hover:text-zinc-300 data-[touring]:border-white/25 data-[touring]:text-zinc-200"
        >
          <Icon name="search" />
          <span className="flex-1 text-left">Jump to…</span>
          <ShortcutHint />
        </CommandTrigger>
      </div>

      <nav
        aria-label="Site"
        className="scrollbar-thin mt-5 flex-1 space-y-6 overflow-y-auto px-3 pb-6"
      >
        <div>
          <GroupLabel>Dashboard</GroupLabel>
          <ul className="space-y-0.5">
            {sections.map((section) => {
              const current = activeSection === section.id;
              const isProjects = section.id === "projects";
              return (
                <li key={section.id}>
                  {isProjects ? (
                    // The whole row opens and closes the list of projects.
                    <button
                      type="button"
                      onClick={() => writeProjectsOpen(!projectsOpen)}
                      aria-expanded={projectsOpen}
                      aria-controls="sidebar-projects"
                      data-within={onProject || current ? "" : undefined}
                      data-tip={section.tip}
                      data-tip-title={section.label}
                      data-tour=""
                      className={`${linkClass} w-full text-left`}
                    >
                      <Icon
                        name={section.icon}
                        className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-300 group-data-[within]:text-white"
                      />
                      {section.label}
                      <Icon
                        name="chevronDown"
                        className={`ml-auto size-3.5 text-zinc-500 transition-transform group-hover:text-zinc-300 ${projectsOpen ? "" : "-rotate-90"}`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={`/#${section.id}`}
                      aria-current={current ? "location" : undefined}
                      data-tip={section.tip}
                      data-tip-title={section.label}
                      data-tour=""
                      className={linkClass}
                    >
                      <Icon
                        name={section.icon}
                        className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-300 group-aria-[current]:text-white"
                      />
                      {section.label}
                    </Link>
                  )}
                  {isProjects && (
                    <>
                      {projectsOpen && (
                        <ul
                          id="sidebar-projects"
                          className="mt-0.5 ml-[18px] space-y-0.5 border-l border-white/[0.06] pl-2"
                        >
                          {ownProjects.map((project) => (
                            <ProjectLink key={project.slug} project={project} pathname={pathname} />
                          ))}
                          {organizations.map((organization) => (
                            <li key={organization}>
                              {/* Work done for an organisation, set apart
                                  from my own projects. */}
                              <p className="flex items-center gap-2 px-2.5 pt-2.5 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-zinc-500">
                                <span className="h-px w-3 bg-white/10" />
                                {organization}
                                <span className="h-px flex-1 bg-white/10" />
                              </p>
                              <ul className="space-y-0.5">
                                {workProjects
                                  .filter((project) => project.organization === organization)
                                  .map((project) => (
                                    <ProjectLink key={project.slug} project={project} pathname={pathname} />
                                  ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <GroupLabel>Pages</GroupLabel>
          <Link
            href="/contributions"
            aria-current={pathname === "/contributions" ? "page" : undefined}
            data-tip={contributionsTip}
            data-tip-title="Contributions"
            data-tour=""
            className={linkClass}
          >
            <Icon
              name="calendar"
              className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-300 group-aria-[current]:text-white"
            />
            Contributions
          </Link>
          <Link
            href="/uses"
            aria-current={pathname === "/uses" ? "page" : undefined}
            data-tip={usesTip}
            data-tip-title="My setup"
            className={linkClass}
          >
            <Icon
              name="cpu"
              className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-300 group-aria-[current]:text-white"
            />
            My setup
          </Link>
          <Link
            href="/desk"
            aria-current={pathname === "/desk" ? "page" : undefined}
            data-tip={deskTip}
            data-tip-title="My desk"
            data-tour=""
            className={linkClass}
          >
            <Icon
              name="monitor"
              className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-300 group-aria-[current]:text-white"
            />
            My desk
            {/* The room follows the real time in Manila, so it's live. */}
            <span className="ml-auto flex items-center gap-1 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-rose-400 uppercase ring-1 ring-rose-500/20 ring-inset">
              <span className="size-1.5 rounded-full bg-rose-500 motion-safe:animate-pulse" />
              Live
            </span>
          </Link>
        </div>
      </nav>

      <div className="p-3">
        <div className="px-2.5 pb-3">
          <ViewerCount />
        </div>
        <div className="panel overflow-hidden p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-zinc-200">
            <StatusDot />
            Open to freelance work
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Websites, internal systems and web apps.
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors hover:text-white"
          >
            Start a conversation
            <Icon name="arrowRight" className="size-3.5" />
          </a>
        </div>
        <button
          type="button"
          onClick={startTour}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
        >
          <Icon name="sparkles" className="size-3.5" />
          Take the guided tour
        </button>
      </div>
    </aside>
  );
}

// The sidebar photo, with the sunglasses version in light mode.
export function Avatar({ className = "size-9 rounded-xl" }: { className?: string }) {
  const shared = `shrink-0 object-cover object-[50%_20%] ring-1 ring-white/10 ${className}`;
  return (
    <>
      <Image
        src="/profile.webp"
        alt=""
        width={80}
        height={80}
        className={`light:hidden ${shared}`}
      />
      <Image
        src="/profile-light.webp"
        alt=""
        width={80}
        height={80}
        loading="lazy"
        className={`hidden light:block ${shared}`}
      />
    </>
  );
}

export function StatusDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
    </span>
  );
}
