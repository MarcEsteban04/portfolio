"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/app/ui/icons";
import type { NavProject } from "@/app/ui/navigation";
import { Avatar } from "@/app/ui/sidebar";
import { CommandTrigger, ShortcutHint, ThemeToggle } from "@/app/ui/widgets";
import { profile } from "@/lib/profile";

function crumbsFor(pathname: string, projects: NavProject[]) {
  if (pathname.startsWith("/projects/")) {
    const project = projects.find(
      (p) => `/projects/${p.slug}` === pathname,
    );
    return [
      { label: "Projects", href: "/#projects" },
      { label: project?.name ?? "Project" },
    ];
  }
  if (pathname === "/desk") {
    return [{ label: "Dashboard", href: "/#overview" }, { label: "My desk" }];
  }
  if (pathname === "/contributions") {
    return [{ label: "Activity", href: "/#activity" }, { label: "Contributions" }];
  }
  return [{ label: "Dashboard", href: "/#overview" }, { label: "Overview" }];
}

export function Topbar({ projects }: { projects: NavProject[] }) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname, projects);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/#overview" aria-label={`${profile.name}, home`} className="lg:hidden">
          <Avatar />
        </Link>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-2 text-sm">
            {crumbs.map((crumb, i) => (
              <li
                key={crumb.label}
                className="flex min-w-0 items-center gap-2 not-last:hidden sm:not-last:flex"
              >
                {i > 0 && (
                  <span aria-hidden className="text-zinc-700">
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="truncate text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="truncate font-medium text-zinc-100">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <CommandTrigger className="hidden h-9 w-60 items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-zinc-500 transition-colors hover:border-white/15 hover:text-zinc-300 md:flex lg:hidden xl:flex">
          <Icon name="search" />
          <span className="flex-1 text-left">Search…</span>
          <ShortcutHint />
        </CommandTrigger>

        <ThemeToggle className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/15 hover:text-white" />

        <a
          href={`https://github.com/${profile.github}`}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub profile"
          className="hidden size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/15 hover:text-white sm:flex"
        >
          <Icon name="github" />
        </a>

        <a
          href={`mailto:${profile.email}`}
          className="hidden h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 sm:inline-flex"
        >
          <Icon name="mail" />
          Hire me
        </a>

        <CommandTrigger
          label="Open menu"
          className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 transition-colors hover:text-white lg:hidden"
        >
          <Icon name="menu" />
        </CommandTrigger>
      </div>
    </header>
  );
}
