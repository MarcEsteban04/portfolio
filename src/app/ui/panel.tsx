import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/app/ui/icons";

export function PanelHeader({
  icon,
  title,
  description,
  action,
  as: Heading = "h2",
  id,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h2" | "h3";
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-300 ring-1 ring-white/[0.08] ring-inset">
          <Icon name={icon} />
        </span>
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
}: {
  icon: IconName;
  value: ReactNode;
  label: string;
  index?: number;
}) {
  return (
    <div
      style={{ "--i": index } as CSSProperties}
      className="panel group flex animate-rise flex-col-reverse overflow-hidden p-5 stagger"
    >
      <dt className="mt-1.5 text-sm leading-snug text-zinc-500">{label}</dt>
      <dd className="flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold tracking-tight text-zinc-50 tabular-nums sm:text-[2.125rem]">
          {value}
        </span>
        <span className="mb-1 flex size-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 ring-1 ring-white/[0.08] ring-inset">
          <Icon name={icon} />
        </span>
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
