"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Icon, type IconName } from "@/app/ui/icons";
import {
  OPEN_COMMAND_MENU,
  sections,
  type NavProject,
} from "@/app/ui/navigation";
import { openAsk } from "@/app/ui/ask";
import { toggleTheme, useTheme } from "@/app/ui/theme";

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
} & ({ icon: IconName } | { image: string }) &
  (
    | { href: string; external?: boolean }
    | { action: "copy-email" | "toggle-theme" | "ask"; question?: string }
  );

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

// A ⌘K palette for jumping to any section, project or link. On small screens
// it doubles as the site menu.
export function CommandMenu({
  projects,
  email,
  github,
}: {
  projects: NavProject[];
  email: string;
  github: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pressedBackdrop = useRef(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const listId = useId();
  const theme = useTheme();

  const items: Item[] = [
    ...sections.map((section) => ({
      id: `section-${section.id}`,
      group: "Dashboard",
      label: section.label,
      icon: section.icon,
      href: `/#${section.id}`,
    })),
    ...projects.map((project) => ({
      id: `project-${project.slug}`,
      group: "Projects",
      label: project.name,
      hint: "Case study",
      image: project.icon,
      href: `/projects/${project.slug}`,
    })),
    {
      id: "page-contributions",
      group: "Pages",
      label: "GitHub contributions",
      icon: "calendar",
      keywords: "activity streak calendar",
      href: "/contributions",
    },
    {
      id: "link-email",
      group: "Contact",
      label: "Send an email",
      hint: email,
      icon: "mail",
      keywords: "hire contact",
      href: `mailto:${email}`,
      external: true,
    },
    {
      id: "action-copy-email",
      group: "Contact",
      label: copied ? "Copied to clipboard" : "Copy email address",
      icon: copied ? "check" : "copy",
      keywords: "clipboard",
      action: "copy-email",
    },
    {
      id: "link-github",
      group: "Contact",
      label: "GitHub profile",
      hint: `@${github}`,
      icon: "github",
      keywords: "source code repositories",
      href: `https://github.com/${github}`,
      external: true,
    },
    {
      id: "action-ask",
      group: "AI",
      label: "Ask me anything",
      hint: "AI assistant",
      icon: "sparkles",
      keywords: "chat question assistant help",
      action: "ask",
    },
    {
      id: "action-theme",
      group: "Preferences",
      label: theme === "light" ? "Switch to dark mode" : "Switch to light mode",
      icon: theme === "light" ? "moon" : "sun",
      keywords: "theme appearance color",
      action: "toggle-theme",
    },
  ];

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? items.filter((item) =>
        `${item.label} ${item.group} ${item.keywords ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : items;
  // Anything typed can also go to the AI assistant as a question.
  const results: Item[] = needle
    ? [
        ...matches.filter((item) => item.id !== "action-ask"),
        {
          id: "ask-query",
          group: "AI",
          label: `Ask AI: “${query.trim()}”`,
          icon: "sparkles",
          action: "ask",
          question: query.trim(),
        },
      ]
    : matches;
  const active = Math.min(index, Math.max(results.length - 1, 0));

  const open = useCallback(() => {
    setQuery("");
    setIndex(0);
    setCopied(false);
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      } else if (
        event.key === "/" &&
        !dialogRef.current?.open &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_MENU, open);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_MENU, open);
    };
  }, [open, close]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, query]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(close, 700);
    } catch {
      // Clipboard access can be refused; leave the menu open.
    }
  }

  let lastGroup = "";

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search and jump to"
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) {
          close();
        }
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-4 pt-[12vh] text-foreground backdrop:bg-black/70 backdrop:backdrop-blur-sm open:animate-rise"
    >
      <div className="panel mx-auto flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden bg-surface">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
          <Icon name="search" className="size-4 shrink-0 text-zinc-500" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              results[active] ? `${listId}-${results[active].id}` : undefined
            }
            aria-label="Search sections, projects and links"
            placeholder="Search sections, projects and links…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setIndex(
                  (active + step + results.length) % Math.max(results.length, 1),
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                listRef.current
                  ?.querySelector<HTMLElement>(
                    '[aria-selected="true"] a, [aria-selected="true"] button',
                  )
                  ?.click();
              }
            }}
            className="h-14 w-full bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:text-white"
          >
            ESC
          </button>
        </div>

        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Results"
          className="scrollbar-thin overflow-y-auto p-2"
        >
          {results.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-zinc-500">
              Nothing matches “{query}”.
            </li>
          )}
          {results.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const selected = i === active;
            const content = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-300 ring-1 ring-white/[0.08] ring-inset">
                  {"image" in item ? (
                    <Image
                      src={item.image}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-lg"
                    />
                  ) : (
                    <Icon name={item.icon} />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && (
                  <span className="hidden truncate text-xs text-zinc-500 sm:block">
                    {item.hint}
                  </span>
                )}
                <Icon
                  name={"external" in item && item.external ? "arrowUpRight" : "corner"}
                  className={`size-3.5 shrink-0 text-zinc-500 ${selected ? "opacity-100" : "opacity-0"}`}
                />
              </>
            );
            const itemClass =
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 outline-none";

            return (
              <Fragment key={item.id}>
                {heading && (
                  <li
                    role="presentation"
                    className="px-3 pt-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500"
                  >
                    {heading}
                  </li>
                )}
                <li
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setIndex(i)}
                  className="rounded-xl aria-selected:bg-white/[0.06] aria-selected:text-white"
                >
                {"action" in item ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      if (item.action === "copy-email") return copyEmail();
                      if (item.action === "toggle-theme") return toggleTheme();
                      close();
                      openAsk(item.question);
                    }}
                    className={itemClass}
                  >
                    {content}
                  </button>
                ) : item.external ? (
                  <a
                    href={item.href}
                    tabIndex={-1}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={close}
                    className={itemClass}
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    tabIndex={-1}
                    onClick={close}
                    className={itemClass}
                  >
                    {content}
                  </Link>
                )}
                </li>
              </Fragment>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-white/[0.07] px-4 py-2.5 font-mono text-[10px] text-zinc-500">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span className="ml-auto">esc to close</span>
        </div>
      </div>
    </dialog>
  );
}
