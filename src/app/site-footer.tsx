import Link from "next/link";
import { profile } from "@/lib/profile";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p className="flex gap-6">
          <Link
            href="/contributions"
            className="transition-colors hover:text-white"
          >
            GitHub contributions
          </Link>
          {profile.location}
        </p>
      </div>
    </footer>
  );
}
