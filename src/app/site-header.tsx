import Link from "next/link";
import { profile } from "@/lib/profile";

const nav = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#skills", label: "Skills" },
  { href: "/#education", label: "Education" },
  { href: "/contributions", label: "Contributions" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/#top" className="text-sm font-medium tracking-tight">
          {profile.name}
        </Link>
        <nav className="flex items-center gap-8 text-sm text-zinc-400">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === current ? "page" : undefined}
              className="hidden transition-colors hover:text-white aria-[current=page]:text-white sm:block"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="rounded-full border border-white/15 px-4 py-1.5 text-white transition-colors hover:bg-white hover:text-black"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
