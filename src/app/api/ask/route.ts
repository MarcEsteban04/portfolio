import {
  buildSystemPrompt,
  createDeltaReader,
  createRateLimiter,
  LIMITS,
  parseAskRequest,
  type ChatMessage,
} from "@/lib/assistant";

// Groq first, since it answers fastest; OpenAI if Groq is down or limited.
const providers = [
  {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: () => process.env.GROQ_AI_API_KEY,
    body: {
      model: "openai/gpt-oss-120b",
      reasoning_effort: "low",
      include_reasoning: false,
      temperature: 0.4,
    },
  },
  {
    name: "openai",
    url: "https://api.openai.com/v1/chat/completions",
    key: () => process.env.OPENAI_API_KEY,
    body: { model: "gpt-5.4-mini", reasoning_effort: "low" },
  },
];

// 20 questions per visitor every 10 minutes.
const allow = createRateLimiter(20, 10 * 60 * 1000);

function plain(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function openStream(messages: ChatMessage[], signal: AbortSignal) {
  const conversation = [
    { role: "system", content: buildSystemPrompt() },
    ...messages,
  ];
  for (const provider of providers) {
    const key = provider.key();
    if (!key) continue;
    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...provider.body,
          messages: conversation,
          stream: true,
          max_completion_tokens: LIMITS.replyTokens,
        }),
        signal,
      });
      if (response.ok && response.body) return response.body;
      console.error(`ask: ${provider.name} answered ${response.status}`);
    } catch (error) {
      if (signal.aborted) throw error;
      console.error(`ask: ${provider.name} failed`, error);
    }
  }
  return null;
}

// Answers a question about Marc from the portfolio's own data, streaming the
// reply back as plain text.
export async function POST(request: Request) {
  const visitor =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!allow(visitor)) {
    return plain(
      "That's a lot of questions! Give it a few minutes, or email Marc directly.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return plain("Send the question as JSON.", 400);
  }
  const parsed = parseAskRequest(body);
  if ("error" in parsed) return plain(parsed.error, 400);

  const upstream = await openStream(parsed.messages, request.signal);
  if (!upstream) {
    return plain(
      "The assistant can't answer right now. Please try again in a moment, or email Marc directly.",
      502,
    );
  }

  const read = createDeltaReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reply = upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = read(decoder.decode(chunk, { stream: true }));
        if (text) controller.enqueue(encoder.encode(text));
      },
    }),
  );

  return new Response(reply, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
