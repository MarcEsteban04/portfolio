import Link from "next/link";
import type { ReactNode } from "react";
import { AskPanel } from "@/app/ui/ask";
import { CommandMenu } from "@/app/ui/command-menu";
import { Guide } from "@/app/ui/guide";
import { PresenceConnector, ViewerCount } from "@/app/ui/presence";
import type { NavProject } from "@/app/ui/navigation";
import { Sidebar } from "@/app/ui/sidebar";
import { ThemeFavicon } from "@/app/ui/theme-favicon";
import { Topbar } from "@/app/ui/topbar";
import { profile } from "@/lib/profile";
import { projects } from "@/lib/projects";

const navProjects: NavProject[] = projects.map(
  ({ slug, name, icon, tagline }) => ({ slug, name, icon, tagline }),
);

// The dashboard frame around every page: a fixed sidebar on large screens, a
// sticky top bar, and the ⌘K menu, which is also the menu on small screens.
export function AppShell({ children }: { children: ReactNode }) {
  // Public by design: a publishable key only allows what Realtime permits.
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  return (
    <>
      {supabaseUrl && supabaseKey && (
        <PresenceConnector url={supabaseUrl} publishableKey={supabaseKey} />
      )}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="bg-dots absolute inset-x-0 top-0 h-[70vh]" />
      </div>

      <a
        href="#content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar projects={navProjects} />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Topbar projects={navProjects} />
        <main
          id="content"
          className="w-full flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8"
        >
          {children}
        </main>
        <footer className="border-t border-white/[0.06]">
          {/* Extra room at the bottom on phones, clear of the floating Ask button. */}
          <div className="flex flex-col gap-2 px-4 pt-6 pb-24 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p>
                © {new Date().getFullYear()} {profile.name} · {profile.location}
              </p>
              <span className="lg:hidden">
                <ViewerCount compact />
              </span>
            </div>
            <p className="-my-1.5 flex gap-5">
              <Link
                href="/contributions"
                className="py-1.5 transition-colors hover:text-zinc-200"
              >
                GitHub contributions
              </Link>
              <a
                href={`mailto:${profile.email}`}
                className="py-1.5 transition-colors hover:text-zinc-200"
              >
                Email
              </a>
            </p>
          </div>
        </footer>
      </div>

      <ThemeFavicon />
      <AskPanel />
      <Guide />
      <CommandMenu
        projects={navProjects}
        email={profile.email}
        github={profile.github}
      />
    </>
  );
}
