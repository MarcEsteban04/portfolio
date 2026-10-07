import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/app/ui/icons";

// A few muted accents for icon badges and small highlights. Panels stay dark
// and flat; color only marks what each thing is.
export const tones = {
  neutral: "bg-white/[0.05] text-zinc-300 ring-white/[0.08]",
  sky: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  emerald: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  violet: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
  rose: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
};

export type Tone = keyof typeof tones;

export function IconBadge({
  icon,
  tone = "neutral",
  className = "size-8",
  iconClassName,
}: {
  icon: IconName;
  tone?: Tone;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      <Icon name={icon} className={iconClassName} />
    </span>
  );
}

export function PanelHeader({
  icon,
  title,
  description,
  action,
  as: Heading = "h2",
  id,
  tone = "neutral",
}: {
  icon: IconName;
  tone?: Tone;
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h2" | "h3";
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <IconBadge icon={icon} tone={tone} className="mt-0.5 size-8" />
        <div>
          <Heading id={id} className="text-[15px] font-medium tracking-tight text-zinc-100">
            {title}
          </Heading>
          {description && (
            <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-zinc-300">
      {children}
    </li>
  );
}

export function StatTile({
  icon,
  value,
  label,
  index = 0,
  tone = "neutral",
}: {
  icon: IconName;
  value: ReactNode;
  label: string;
  index?: number;
  tone?: Tone;
}) {
  return (
    <div
      style={{ "--i": index } as CSSProperties}
      className="panel group flex animate-rise flex-col-reverse overflow-hidden p-5 stagger"
    >
      <dt className="mt-1.5 text-sm leading-snug text-zinc-500">{label}</dt>
      {/* On phones the icon sits above the value, so "229 days" fits on a line. */}
      <dd className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <span className="text-[1.75rem] font-semibold tracking-tight whitespace-nowrap text-zinc-50 tabular-nums sm:text-[2.125rem]">
          {value}
        </span>
        <IconBadge icon={icon} tone={tone} className="size-8 sm:mb-1" />
      </dd>
      <div
        aria-hidden
        className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
    </div>
  );
}

export function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "group inline-flex shrink-0 items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white";
  const icon = (
    <Icon
      name={external ? "arrowUpRight" : "arrowRight"}
      className="size-3.5 transition-transform group-hover:translate-x-0.5"
    />
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      {icon}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
      {icon}
    </Link>
  );
}
