"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/app/ui/icons";
import { Avatar } from "@/app/ui/sidebar";
import { LIMITS, type ChatMessage } from "@/lib/assistant";
import { profile } from "@/lib/profile";

const OPEN_ASK = "open-ask";
const STORAGE_KEY = "ask-conversation";

const suggestions = [
  "What does Marc build?",
  "Is he available for freelance work?",
  "Tell me about Obsidian",
  "What's his tech stack?",
];

// Opens the chat, optionally asking a question straight away.
export function openAsk(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_ASK, { detail: question }));
}

// Turns **bold**, links, emails and /projects/... paths in a reply into
// elements. Built from text, never from HTML, so a reply can't inject markup.
function inline(text: string) {
  const parts = text.split(
    /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+|\/projects\/[a-z0-9-]+)/g,
  );
  return parts.map((part, i) => {
    if (!part) return null;
    const link =
      "text-zinc-100 underline decoration-white/25 underline-offset-2 hover:decoration-white";
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" className={link}>
          {part.replace(/^https?:\/\//, "")}
        </a>
      );
    }
    if (part.includes("@")) {
      return (
        <a key={i} href={`mailto:${part.replace(/\.$/, "")}`} className={link}>
          {part}
        </a>
      );
    }
    if (part.startsWith("/projects/")) {
      return (
        <Link key={i} href={part} className={link}>
          {part}
        </Link>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function Reply({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className="space-y-1">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="mt-[0.6em] h-px w-2 shrink-0 bg-zinc-500" />
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

const firstName = profile.name.split(" ")[0];

function AssistantMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-[92%] gap-2.5">
      <span
        aria-hidden
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/25 ring-inset"
      >
        <Icon name="sparkles" className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Typing() {
  return (
    <span className="flex gap-1 py-1.5" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-zinc-500"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

// A chat panel that answers questions about Marc from the portfolio's own
// data, streamed from /api/ask. The conversation lasts for the browser tab.
export function AskPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Saving waits until the saved conversation has been read back, so the
  // empty first render never overwrites it.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let saved: ChatMessage[] = [];
    try {
      saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      // Storage can be blocked; the chat simply starts empty.
    }
    // Restoring after mount keeps the server and client markup the same.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Array.isArray(saved) && saved.length) setMessages(saved);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Not saved; the chat still works for this page view.
    }
  }, [messages, restored]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setFailure(null);
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(
          (await response.text()) ||
            "The assistant can't answer right now. Please try again.",
        );
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const current = reply;
        setMessages((all) => [
          ...all.slice(0, -1),
          { role: "assistant", content: current },
        ]);
      }
      if (!reply.trim()) throw new Error("No answer came back. Please try again.");
    } catch (error) {
      if (controller.signal.aborted) {
        // Stopped by the visitor: keep whatever arrived, drop an empty reply.
        setMessages((all) =>
          all.at(-1)?.content ? all : all.slice(0, -2),
        );
      } else {
        setMessages((all) => all.slice(0, -2));
        setDraft(text);
        setFailure(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  });

  useEffect(() => {
    function onOpen(event: Event) {
      const question = (event as CustomEvent<string | undefined>).detail;
      setOpen(true);
      if (question) askRef.current(question);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    window.addEventListener(OPEN_ASK, onOpen);
    return () => window.removeEventListener(OPEN_ASK, onOpen);
  }, []);

  const remaining = LIMITS.messageChars - draft.length;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => openAsk()}
          data-tip="Ask my AI assistant anything about my work, projects or availability."
          data-tip-title="Ask me anything"
          data-tour=""
          className="fixed right-4 bottom-4 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-black shadow-[0_12px_32px_-8px_var(--shadow)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:right-6 sm:bottom-6"
        >
          <Icon name="sparkles" />
          <span className="hidden sm:inline">Ask about me</span>
          <span className="sr-only sm:hidden">Ask about me</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={`Ask about ${profile.name}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="fixed inset-2 z-50 flex animate-[pop_180ms_ease-out_both] flex-col overflow-hidden rounded-2xl bg-raised shadow-[0_24px_64px_-12px_var(--shadow)] ring-1 ring-white/10 sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(620px,calc(100dvh-3rem))] sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
            <Avatar className="size-9 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">
                Ask about {firstName}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                AI · answers from this site
              </p>
            </div>
            {messages.length > 0 && !busy && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setFailure(null);
                }}
                className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <Icon name="x" />
            </button>
          </header>

          <div
            ref={listRef}
            aria-live="polite"
            className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm leading-relaxed text-zinc-300"
          >
            {/* The assistant's opening message. It's only shown, never sent. */}
            <AssistantMessage>
              <p>
                Hi! I&apos;m {firstName}&apos;s AI assistant. Ask me anything
                about his work, projects, skills or availability.
              </p>
            </AssistantMessage>

            {messages.length === 0 && (
              <div className="pl-9">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => ask(question)}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, i) =>
              message.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-3.5 py-2 whitespace-pre-wrap text-black">
                    {message.content}
                  </p>
                </div>
              ) : (
                <AssistantMessage key={i}>
                  {message.content ? <Reply text={message.content} /> : <Typing />}
                </AssistantMessage>
              ),
            )}

            {failure && (
              <p className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-3.5 py-2.5 text-xs text-rose-300">
                {failure}
              </p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
            className="border-t border-white/[0.07] p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 focus-within:border-white/25">
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={LIMITS.messageChars}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask(draft);
                  }
                }}
                placeholder={`Ask anything about ${firstName}…`}
                aria-label="Your question"
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-base text-zinc-100 sm:text-sm outline-none placeholder:text-zinc-500 [field-sizing:content]"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => abort.current?.abort()}
                  aria-label="Stop answering"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-zinc-200 transition-colors hover:bg-white/15"
                >
                  <span className="size-3 rounded-sm bg-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-opacity disabled:opacity-30"
                >
                  <Icon name="arrowUpRight" className="size-4 -rotate-45" />
                </button>
              )}
            </div>
            <p className="mt-2 flex justify-between gap-3 px-1 text-[11px] text-zinc-600">
              <span>AI can make mistakes. For anything important, email Marc.</span>
              {remaining < 100 && <span className="tabular-nums">{remaining}</span>}
            </p>
          </form>
        </section>
      )}
    </>
  );
}

// A small "ask me" box for elsewhere on the page: opens the chat, or asks
// one of the example questions straight away.
export function AskPrompt({ questions }: { questions: string[] }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3.5">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        <Icon name="sparkles" className="size-3 text-violet-300" />
        Quick question?
      </p>
      <button
        type="button"
        onClick={() => openAsk()}
        className="mt-2.5 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:border-white/20 hover:text-zinc-300"
      >
        Ask my AI about my work…
        <Icon name="arrowRight" className="ml-auto size-3.5 shrink-0" />
      </button>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => openAsk(question)}
            className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
