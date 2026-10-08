import Link from "next/link";
import { GearPicture, type GearArt } from "@/app/ui/gear-art";
import { Icon, type IconName } from "@/app/ui/icons";
import { IconBadge } from "@/app/ui/panel";
import { SkillIcon } from "@/app/ui/skill-icons";
import { profile } from "@/lib/profile";
import { pageMetadata } from "@/lib/site";
import { setup, type UseItem } from "@/lib/uses";

export const metadata = pageMetadata({
  title: `Uses | ${profile.name}`,
  description: `${profile.name}'s setup: an AMD Ryzen 5 5600 and Radeon RX 6600 PC, a 300Hz main monitor and a 100Hz second one, Attack Shark keyboard and mouse, and the software he builds with.`,
  path: "/uses",
});

// A picture of the thing, with its name and a line about it underneath.
function Card({ item }: { item: UseItem }) {
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20 transition-colors hover:border-white/15">
      <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(90%_80%_at_50%_30%,rgba(255,255,255,0.06),transparent_70%)] p-5">
        {item.art ? (
          <GearPicture
            kind={item.art as GearArt}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : item.logo ? (
          <SkillIcon name={item.logo} className="size-14 transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <Icon
            name={(item.icon ?? "code") as IconName}
            className="size-14 text-zinc-300 transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>
      <div className="border-t border-white/[0.06] px-4 py-3">
        <p className="text-sm font-medium text-zinc-100">{item.name}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{item.detail}</p>
      </div>
    </li>
  );
}

export default function UsesPage() {
  return (
    <div className="space-y-4">
      <header className="animate-rise px-1 pt-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Uses</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">My setup.</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
          The PC, monitors and peripherals I work and play on, and the software I build with.
        </p>
      </header>

      <Link
        href="/desk"
        className="panel group flex items-center gap-4 p-5 transition-colors hover:bg-white/[0.03] sm:p-6"
      >
        <IconBadge icon="monitor" tone="violet" className="size-10" />
        <span className="min-w-0">
          <span className="block font-medium text-zinc-100">See it in 3D</span>
          <span className="block text-sm text-zinc-500">The same desk and two monitors, in my 3D office.</span>
        </span>
        <Icon
          name="arrowRight"
          className="ml-auto size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-200"
        />
      </Link>

      {setup.map((group, i) => (
        <section
          key={group.group}
          aria-labelledby={`uses-${i}`}
          style={{ "--i": i } as React.CSSProperties}
          className="panel animate-rise p-6 stagger sm:p-7"
        >
          <h2 id={`uses-${i}`} className="text-[15px] font-medium tracking-tight text-zinc-100">
            {group.group}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => (
              <Card key={item.name} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
