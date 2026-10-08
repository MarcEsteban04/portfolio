import { catNames, counterKeys, parseCareRequest, type CareState } from "@/lib/cats";

// The desk's shared cats and counters, read and written through Supabase's
// REST API with the publishable key. Reads are public; every write goes
// through the office_care() function (see supabase/migrations), here, so
// one visitor can't hammer it.
const url = process.env.SUPABASE_PROJECT_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const headers = () => ({ apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

export async function GET() {
  if (!url || !key) return Response.json({ care: null });
  try {
    const [cats, counters] = await Promise.all([
      fetch(`${url}/rest/v1/office_cats?select=name,fed_at,played_at`, { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(8_000) }),
      fetch(`${url}/rest/v1/office_counters?select=key,value`, { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(8_000) }),
    ]);
    // Before the tables exist there's nothing shared yet.
    if (!cats.ok || !counters.ok) return Response.json({ care: null });
    const catRows = (await cats.json()) as { name: string; fed_at: string; played_at: string }[];
    const counterRows = (await counters.json()) as { key: string; value: number }[];
    const care = {
      cats: Object.fromEntries(
        catNames.map((name) => {
          const row = catRows.find((r) => r.name === name);
          return [name, { fedAt: row?.fed_at ?? new Date(0).toISOString(), playedAt: row?.played_at ?? new Date(0).toISOString() }];
        }),
      ),
      counters: Object.fromEntries(counterKeys.map((k) => [k, Number(counterRows.find((r) => r.key === k)?.value ?? 0)])),
    } as CareState;
    return Response.json({ care });
  } catch {
    return Response.json({ care: null });
  }
}

// One of each kind of care per visitor every few seconds (a visit once
// every half hour), best effort per server instance.
const recent = new Map<string, number>();

export async function POST(request: Request) {
  if (!url || !key) return Response.json({ error: "Not set up yet." }, { status: 503 });
  const input = await request.json().catch(() => ({}));
  const care = parseCareRequest(input);
  if (!care.ok) return Response.json({ error: "Unknown care." }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const slot = `${ip}:${care.action}:${care.cat}`;
  const now = Date.now();
  if (now - (recent.get(slot) ?? 0) < (care.action === "visit" ? 30 * 60_000 : 8_000)) {
    return Response.json({ ok: true, skipped: true });
  }
  recent.set(slot, now);
  if (recent.size > 5000) recent.clear();
  try {
    const res = await fetch(`${url}/rest/v1/rpc/office_care`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ p_action: care.action, p_cat: care.cat }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return Response.json({ error: "Not set up yet." }, { status: 503 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Try again." }, { status: 503 });
  }
}
