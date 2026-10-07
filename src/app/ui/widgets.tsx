"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/app/ui/icons";
import { openCommandMenu } from "@/app/ui/navigation";
import { peekTheme, toggleTheme, useTheme } from "@/app/ui/theme";

const manilaTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});

function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 10_000);
  return () => clearInterval(id);
}

// The current time in the Philippines. It renders a placeholder on the server,
// since the prerendered page would otherwise show the build's time.
export function LocalTime() {
  const time = useSyncExternalStore(
    subscribeToClock,
    () => manilaTime.format(Date.now()),
    () => null,
  );
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

function subscribeToNothing() {
  return () => {};
}

// ⌘K on Apple devices, Ctrl K elsewhere (and on the server).
export function ShortcutHint() {
  const isApple = useSyncExternalStore(
    subscribeToNothing,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
  return (
    <span className="flex items-center gap-1">
      <Kbd>{isApple ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>K</Kbd>
    </span>
  );
}

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard access can be refused; the address is still on screen.
        }
      }}
      className={className}
    >
      <Icon name={copied ? "check" : "copy"} />
      {copied ? "Copied" : label}
      <span className="sr-only" aria-live="polite">
        {copied ? `${value} copied to the clipboard` : ""}
      </span>
    </button>
  );
}

export function CommandTrigger({
  className,
  children,
  label = "Search and jump to",
  tip,
}: {
  className?: string;
  children: React.ReactNode;
  label?: string;
  // Makes this trigger a stop on the guided tour, with its own tooltip.
  tip?: { title: string; text: string };
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      data-tip={tip?.text}
      data-tip-title={tip?.title}
      data-tour={tip ? "" : undefined}
      onClick={openCommandMenu}
      className={className}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] text-zinc-400">
      {children}
    </kbd>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onPointerEnter={() => peekTheme(true)}
      onPointerLeave={() => peekTheme(false)}
      onFocus={() => peekTheme(true)}
      onBlur={() => peekTheme(false)}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        toggleTheme({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={className}
    >
      <Icon name={theme === "light" ? "moon" : "sun"} />
    </button>
  );
}
