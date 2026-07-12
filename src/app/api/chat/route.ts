import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { tools } from "@/lib/tools";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { checkRateLimit } from "@/lib/ratelimit";

// Dynamic route; allow up to 30s for streamed tool calls.
export const maxDuration = 30;

// Static, so it is built once and can be prompt-cached.
const SYSTEM = buildSystemPrompt();

// Server-side input cap (matches the client maxLength).
const MAX_INPUT = 400;

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}

/**
 * Chat route. Streams a Claude response with tool calls. On any condition that
 * should degrade to the scripted engine (missing key, rate limit, bad request,
 * error) it returns a small JSON body with { fallback: true } and a non-2xx
 * status, which the client catches to render the scripted fallback plus a
 * small "scripted mode" notice.
 */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ fallback: true, reason: "no-key" }, { status: 503 });
  }

  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ fallback: true, reason: "bad-request" }, { status: 400 });
  }

  // Rate limiting (per-IP + global daily cap).
  const rl = await checkRateLimit(getIp(req));
  if (!rl.ok) {
    return Response.json(
      { fallback: true, reason: rl.reason ?? "rate-limited" },
      { status: 429 }
    );
  }

  // Only the last 3 turns (6 messages) are sent to the model, and each user
  // message is capped at MAX_INPUT characters server-side.
  const recent = messages.slice(-6).map((m) =>
    m.role === "user"
      ? {
          ...m,
          parts: m.parts.map((p) =>
            p.type === "text" ? { ...p, text: p.text.slice(0, MAX_INPUT) } : p
          ),
        }
      : m
  );

  try {
    const modelMessages = await convertToModelMessages(recent);
    const result = streamText({
      model: anthropic("claude-haiku-4-5"),
      messages: [
        {
          role: "system",
          content: SYSTEM,
          providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
        },
        ...modelMessages,
      ],
      tools,
      maxOutputTokens: 350,
      stopWhen: stepCountIs(5),
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("chat route error:", err);
    return Response.json({ fallback: true, reason: "error" }, { status: 503 });
  }
}
