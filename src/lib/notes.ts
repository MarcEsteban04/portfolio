// Notes visitors pin to the cork board in the 3D office. Kept short and
// plain: no links, no shouting matches, nothing that would look bad on a
// portfolio. Stored in Supabase (see supabase/migrations).

export type Note = { id: number; name: string; body: string; created_at: string };

export const NOTE_MAX = 80;
export const NAME_MAX = 24;

// A deliberately small list; the board is moderated by hand too (hidden).
const blocked = ["fuck", "shit", "bitch", "cunt", "nigg", "fag", "puta", "gago", "tangina", "kantot", "porn", "sex"];

const tidy = (text: string) => text.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();

export function cleanNote(input: { name?: unknown; body?: unknown }):
  | { ok: true; name: string; body: string }
  | { ok: false; reason: string } {
  const body = tidy(typeof input.body === "string" ? input.body : "");
  const name = tidy(typeof input.name === "string" ? input.name : "") || "A visitor";
  if (!body) return { ok: false, reason: "Write something first." };
  if (body.length > NOTE_MAX) return { ok: false, reason: `Keep it under ${NOTE_MAX} characters.` };
  if (name.length > NAME_MAX) return { ok: false, reason: `Keep your name under ${NAME_MAX} characters.` };
  const both = `${name} ${body}`.toLowerCase();
  if (/https?:|www\.|\.(com|net|org|io|ph|xyz|ru)\b/.test(both)) return { ok: false, reason: "No links, please." };
  if (blocked.some((word) => both.includes(word))) return { ok: false, reason: "Let's keep it friendly." };
  return { ok: true, name, body };
}
