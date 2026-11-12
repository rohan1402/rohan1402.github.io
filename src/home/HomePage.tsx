"use client";

/**
 * HomePage: the server renders the static markup, then the engine takes over the DOM:
 * the project strip, the project view and the on-page agent.
 *
 * The agent's typed questions go to the live chat through useChat, the same /api/chat
 * route and tools as the full chat. Every update of the conversation is forwarded to the
 * engine, which turns tool calls into actions on the page. If the route fails (no key,
 * rate limit, error), the engine answers from its scripted router instead.
 *
 * React must never touch the engine's DOM after hydration, so the markup lives in a
 * memoized component that does not re-render, and the chat state lives in a sibling.
 */

import { memo, useEffect, useMemo, useRef, type RefObject } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { track } from "@/lib/analytics";
import { MARKUP } from "./markup";
import { startHome } from "./engine";

type Engine = ReturnType<typeof startHome>;
type Ask = (text: string) => void;

const Markup = memo(function Markup({ hostRef }: { hostRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={hostRef}
      className="home"
      dangerouslySetInnerHTML={{ __html: MARKUP }}
      suppressHydrationWarning
    />
  );
});

/** Holds the chat: sends the agent's questions and forwards every update to the engine. */
function ChatBridge({
  engineRef,
  askRef,
}: {
  engineRef: RefObject<Engine | null>;
  askRef: RefObject<Ask | null>;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // Send only real text turns, capped at the last 3 turns like the server.
        prepareSendMessagesRequest: ({ messages }) => {
          const cleaned = messages
            .map((m) => ({ ...m, parts: m.parts.filter((p) => p.type === "text") }))
            .filter((m) => m.parts.length > 0)
            .slice(-6);
          return { body: { messages: cleaned } };
        },
      }),
    []
  );
  const { messages, sendMessage, status, error, clearError } = useChat({ transport });

  askRef.current = (text: string) => {
    track("question-asked");
    if (error) clearError();
    sendMessage({ text: text.slice(0, 400) });
  };

  useEffect(() => {
    engineRef.current?.live({ status, messages, error: error ?? null });
    if (error) track("fallback-served");
  }, [engineRef, messages, status, error]);

  return null;
}

export function HomePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const askRef = useRef<Ask | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const engine = startHome(host, MARKUP, {
      ask: (text: string) => askRef.current?.(text),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <>
      <Markup hostRef={hostRef} />
      <ChatBridge engineRef={engineRef} askRef={askRef} />
    </>
  );
}
