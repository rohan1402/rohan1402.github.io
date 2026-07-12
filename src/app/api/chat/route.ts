import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { tools } from "@/lib/tools";
import { buildSystemPrompt } from "@/lib/systemPrompt";

// Dynamic route; allow up to 30s for streamed tool calls.
export const maxDuration = 30;

// Static, so it is built once and can be prompt-cached.
const SYSTEM = buildSystemPrompt();

/**
 * Chat route. Streams a Claude response with tool calls. On any condition that
 * should degrade to the scripted engine (missing key, bad request, error) it
 * returns a small JSON body with { fallback: true } and a non-2xx status, which
 * the client catches to render the scripted fallback silently.
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

  // Only the last 3 turns (6 messages) are sent to the model.
  const recent = messages.slice(-6);

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
