import { cleanNote, type Note } from "@/lib/notes";

// The cork board's notes, read and written through Supabase's REST API with
// the publishable key (row-level security only allows reading visible notes
// and adding short new ones). Posting goes through here so notes are
// checked first, and so one visitor can't flood the board.
const url = process.env.SUPABASE_PROJECT_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const headers = () => ({ apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

export async function GET() {
  if (!url || !key) return Response.json({ notes: [] });
  try {
    const res = await fetch(
      `${url}/rest/v1/office_notes?select=id,name,body,created_at&order=created_at.desc&limit=12`,
      { headers: headers(), next: { revalidate: 30 }, signal: AbortSignal.timeout(8_000) },
    );
    // Before the table exists the board is simply empty.
    if (!res.ok) return Response.json({ notes: [] });
    return Response.json({ notes: (await res.json()) as Note[] });
  } catch {
    return Response.json({ notes: [] });
  }
}

// One note a minute per visitor, best effort (per server instance).
const lastPost = new Map<string, number>();

export async function POST(request: Request) {
  if (!url || !key) return Response.json({ error: "Notes aren't set up yet." }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  if (now - (lastPost.get(ip) ?? 0) < 60_000) {
    return Response.json({ error: "One note a minute, please." }, { status: 429 });
  }
  const input = await request.json().catch(() => ({}));
  const note = cleanNote(input);
  if (!note.ok) return Response.json({ error: note.reason }, { status: 400 });
  try {
    const res = await fetch(`${url}/rest/v1/office_notes`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify({ name: note.name, body: note.body }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return Response.json({ error: "The board isn't ready yet." }, { status: 503 });
    lastPost.set(ip, now);
    if (lastPost.size > 5000) lastPost.clear();
    return Response.json({ ok: true, name: note.name, body: note.body });
  } catch {
    return Response.json({ error: "Couldn't pin that, try again." }, { status: 503 });
  }
}
