import { BrandIcon } from "@/app/ui/brand-icons";
import { Icon } from "@/app/ui/icons";
import { CopyButton } from "@/app/ui/widgets";
import { contacts } from "@/lib/profile";

const external = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});

// In the hero, under the invitations: every way to reach Marc, compact.
export function ContactChips() {
  return (
    <div className="mt-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Reach me on</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {contacts.map((contact) => (
          <li key={contact.kind}>
            <a
              href={contact.href}
              {...external(contact.href)}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <BrandIcon kind={contact.kind} className="size-[18px]" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-zinc-100">{contact.label}</span>
                <span className="block truncate text-[11px] text-zinc-500">{contact.value}</span>
              </span>
              <Icon
                name="arrowRight"
                className="size-3 shrink-0 -rotate-45 text-zinc-600 transition-colors group-hover:text-zinc-300"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// In the contact section: each one as a card, to open or to copy.
export function ContactCards() {
  return (
    <ul className="relative mt-8 grid gap-3 border-t border-white/[0.06] pt-8 sm:grid-cols-2 xl:grid-cols-4">
      {contacts.map((contact) => (
        <li
          key={contact.kind}
          className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10 ring-inset">
              <BrandIcon kind={contact.kind} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100">{contact.label}</p>
              <p className="truncate text-xs text-zinc-500">{contact.value}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href={contact.href}
              {...external(contact.href)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/[0.1]"
            >
              {contact.kind === "github" ? "View profile" : contact.kind === "gmail" ? "Send an email" : "Message me"}
              <Icon name="arrowRight" className="size-3 -rotate-45" />
            </a>
            {contact.copy && (
              <CopyButton
                value={contact.copy}
                label="Copy"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
