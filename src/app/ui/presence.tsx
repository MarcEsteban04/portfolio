"use client";

import { createClient } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/app/ui/icons";

type Viewers = { ids: string[]; self: string };

// One shared count for the whole page, filled by <PresenceConnector />, so
// every place that shows it reads the same channel instead of joining twice.
let viewers: Viewers | null = null;
const listeners = new Set<() => void>();

function publish(next: Viewers | null) {
  viewers = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useViewers() {
  return useSyncExternalStore(
    subscribe,
    () => viewers,
    () => null,
  );
}

type Connection = {
  retrack: () => void;
  close: () => void;
  users: number;
  closing?: ReturnType<typeof setTimeout>;
};

let connection: Connection | null = null;

// Opens the one presence connection this tab uses, or reuses it. React mounts
// components twice in development, and a page change can remount the shell,
// so closing waits a moment in case the component comes straight back.
function connect(url: string, publishableKey: string) {
  if (connection) {
    connection.users++;
    clearTimeout(connection.closing);
    return connection;
  }

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const self = crypto.randomUUID();
  const channel = supabase.channel("portfolio-viewers", {
    config: { presence: { key: self } },
  });
  let joined = false;

  // A tab counts while it's visible and steps out while it's hidden.
  const retrack = () => {
    if (!joined) return;
    if (document.visibilityState === "visible") {
      channel.track({ path: window.location.pathname });
    } else {
      channel.untrack();
    }
  };

  channel
    .on("presence", { event: "sync" }, () => {
      publish({ ids: Object.keys(channel.presenceState()), self });
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        joined = true;
        retrack();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        publish(null);
      }
    });
  document.addEventListener("visibilitychange", retrack);

  const close = () => {
    document.removeEventListener("visibilitychange", retrack);
    supabase.removeChannel(channel);
    connection = null;
    publish(null);
  };
  connection = { retrack, close, users: 1 };
  return connection;
}

function disconnect() {
  if (!connection) return;
  connection.users--;
  if (connection.users > 0) return;
  connection.closing = setTimeout(connection.close, 1000);
}

// Joins the Supabase Realtime presence channel that every open tab shares, so
// the site can show how many people are looking at it right now. Nothing is
// stored; a tab drops off the count when it's closed or hidden.
export function PresenceConnector({
  url,
  publishableKey,
}: {
  url: string;
  publishableKey: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    connect(url, publishableKey);
    return disconnect;
  }, [url, publishableKey]);

  // Re-announce on navigation, so each viewer's page stays current.
  useEffect(() => {
    connection?.retrack();
  }, [pathname]);

  return null;
}

const avatarTones = [
  "bg-sky-400/25 text-sky-300",
  "bg-emerald-400/25 text-emerald-300",
  "bg-amber-400/25 text-amber-300",
  "bg-violet-400/25 text-violet-300",
  "bg-rose-400/25 text-rose-300",
];

function toneFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return avatarTones[Math.abs(hash) % avatarTones.length];
}

function Face({ id, self }: { id: string; self: boolean }) {
  return (
    <span
      className={`flex size-6 items-center justify-center rounded-full font-mono text-[9px] font-semibold ring-2 ring-background ${toneFor(id)}`}
    >
      {self ? "You" : <Icon name="user" className="size-3" />}
    </span>
  );
}

// "3 people viewing now", with a face for each, the visitor's own first.
export function ViewerCount({ compact = false }: { compact?: boolean }) {
  const state = useViewers();
  if (!state || state.ids.length === 0) return null;

  const count = state.ids.length;
  const others = state.ids.filter((id) => id !== state.self);
  const here = state.ids.includes(state.self);
  const faces = [...(here ? [state.self] : []), ...others].slice(
    0,
    compact ? 3 : 4,
  );
  const alone = count === 1 && state.ids[0] === state.self;
  const label = alone
    ? "Just you here right now"
    : `${count} ${count === 1 ? "person" : "people"} viewing now`;

  return (
    <div
      className="flex items-center gap-2.5"
      title={alone ? "You're the only one here" : label}
    >
      <span className="flex -space-x-1.5" aria-hidden>
        {faces.map((id) => (
          <Face key={id} id={id} self={id === state.self} />
        ))}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        <span aria-live="polite">{label}</span>
      </span>
    </div>
  );
}
