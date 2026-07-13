"use client";

/**
 * ChatApp (Phase 2): the interactive shell wired to the live model via useChat,
 * with the scripted engine as a zero-cost fallback.
 *
 * - Typed questions call /api/chat and stream text plus tool-rendered cards.
 * - The initial chips and sidebar topics render pre-baked scripted answers with
 *   zero API calls.
 * - If the route degrades (no key, rate limit, error) useChat surfaces an error
 *   and we silently serve the scripted engine for that question.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, generateId, type UIMessage } from "ai";
import {
  INTENT_BY_ID,
  INITIAL_CHIPS,
  FALLBACK_CHIPS,
  matchIntent,
  type IntentId,
} from "@/lib/scripted";
import { track } from "@/lib/analytics";
import { BotAvatar } from "./BotAvatar";
import { Greeting, Fallback, IntentAnswer } from "./Answers";
import { ToolRenderer } from "./ToolRenderer";
import { QuestionsDrawer } from "./QuestionsDrawer";
import { HeroLanding } from "./HeroLanding";

// Lazy, client-only: the fluid sim touches window/document at import.
const FluidCursor = dynamic(() => import("./FluidCursor"), { ssr: false });

const SIDEBAR_TOPICS: IntentId[] = [
  "about",
  "projects",
  "experience",
  "skills",
  "resume",
  "contact",
];

type ScriptedKind = "greeting" | "fallback" | "intent";

function userMessage(text: string): UIMessage {
  return {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text }],
  } as unknown as UIMessage;
}

function scriptedMessage(kind: ScriptedKind, intentId?: IntentId): UIMessage {
  return {
    id: generateId(),
    role: "assistant",
    parts: [{ type: "data-scripted", data: { kind, intentId } }],
  } as unknown as UIMessage;
}

/** Render streamed model text as paragraphs. */
function TextBlock({ text }: { text: string }) {
  const paras = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  if (paras.length === 0) return null;
  return (
    <>
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function AssistantParts({ message }: { message: UIMessage }) {
  const parts = (message.parts ?? []) as any[];
  return (
    <>
      {parts.map((part, i) => {
        const type: string = part.type;
        if (type === "text") {
          return <TextBlock key={i} text={part.text ?? ""} />;
        }
        if (type === "data-scripted") {
          const d = part.data as { kind: ScriptedKind; intentId?: IntentId };
          if (d.kind === "greeting") return <Greeting key={i} />;
          if (d.kind === "fallback") return <Fallback key={i} />;
          if (d.kind === "intent" && d.intentId)
            return <IntentAnswer key={i} id={d.intentId} />;
          return null;
        }
        if (type.startsWith("tool-")) {
          const state: string = part.state;
          if (state === "input-available" || state === "output-available") {
            return (
              <ToolRenderer key={i} toolName={type.slice(5)} input={part.input} />
            );
          }
          return null;
        }
        return null;
      })}
    </>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatApp() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // Send only real text turns (drop greeting/scripted/tool UI parts) and
        // cap at the last 3 turns, matching the server-side slice.
        prepareSendMessagesRequest: ({ messages }) => {
          const cleaned = messages
            .map((m) => ({
              ...m,
              parts: m.parts.filter((p) => p.type === "text"),
            }))
            .filter((m) => m.parts.length > 0)
            .slice(-6);
          return { body: { messages: cleaned } };
        },
      }),
    []
  );

  // Start empty: the landing hero stands in for the greeting until the first
  // question, then the transcript takes over.
  const { messages, sendMessage, setMessages, status, error, clearError } =
    useChat({ transport });

  const [chips, setChips] = useState<IntentId[]>(INITIAL_CHIPS);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scriptedTyping, setScriptedTyping] = useState(false);
  const [scriptedMode, setScriptedMode] = useState(false);
  const [themeLabel, setThemeLabel] = useState("Dark");
  const [enableFluid, setEnableFluid] = useState(false);

  const lastQueryRef = useRef<string>("");
  const scriptedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, scriptedTyping, status]);

  useEffect(() => {
    return () => {
      if (scriptedTimer.current) clearTimeout(scriptedTimer.current);
    };
  }, []);

  // Enable the fluid hero only on non-touch, non-reduced-motion devices, and
  // lazy-mount it after first paint.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch =
      window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    if (reduced || touch) return;
    const t = setTimeout(() => setEnableFluid(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Silent fallback: when the route errors, serve the scripted engine for the
  // last question, then clear the error so the chat keeps working.
  useEffect(() => {
    if (!error) return;
    const text = lastQueryRef.current;
    const intent = text ? matchIntent(text) : null;
    if (intent) {
      setMessages((prev) => [...prev, scriptedMessage("intent", intent.id)]);
      setChips(intent.followups);
    } else {
      setMessages((prev) => [...prev, scriptedMessage("fallback")]);
      setChips(FALLBACK_CHIPS);
    }
    track("fallback-served");
    setScriptedMode(true);
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  /* ------------------------------ Theme -------------------------------- */
  function computeIsDark(theme: string | null) {
    return (
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }
  function applyTheme(theme: string | null) {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    setThemeLabel(computeIsDark(theme) ? "Light" : "Dark");
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = computeIsDark(cur) ? "light" : "dark";
    try {
      localStorage.setItem("ask-rohan-theme", next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  }
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("ask-rohan-theme");
    } catch {
      /* ignore */
    }
    setThemeLabel(computeIsDark(saved) ? "Light" : "Dark");
  }, []);

  /* --------------------------- Conversation ---------------------------- */
  // Zero-API scripted answer for a chip, sidebar topic, or hero card.
  // displayText overrides the echoed user message (used by the hero cards).
  function triggerIntent(id: IntentId, displayText?: string) {
    const intent = INTENT_BY_ID[id];
    if (!intent) return;
    const shown = displayText ?? intent.prompt;
    track("chip-click", id);
    closeSidebar();
    setMessages((prev) => [...prev, userMessage(shown)]);
    setScriptedTyping(true);
    const delay = 480 + Math.min(700, shown.length * 14);
    if (scriptedTimer.current) clearTimeout(scriptedTimer.current);
    scriptedTimer.current = setTimeout(() => {
      setScriptedTyping(false);
      setMessages((prev) => [...prev, scriptedMessage("intent", id)]);
      setChips(intent.followups);
    }, delay);
  }

  // Ask the live model (falls back to scripted on error). Shared by the
  // composer form and the questions drawer.
  function submitText(raw: string) {
    const text = raw.trim().slice(0, 400);
    if (!text) return;
    track("question-asked");
    lastQueryRef.current = text;
    setChips(INITIAL_CHIPS);
    if (error) clearError();
    sendMessage({ text });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    submitText(input);
    setInput("");
  }

  function newChat() {
    if (scriptedTimer.current) clearTimeout(scriptedTimer.current);
    setScriptedTyping(false);
    setScriptedMode(false);
    if (error) clearError();
    setMessages([]);
    setChips(INITIAL_CHIPS);
    closeSidebar();
    inputRef.current?.focus();
  }

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const showTyping = scriptedTyping || status === "submitted";
  // The hero state: empty transcript, nothing in flight.
  const landing =
    messages.length === 0 &&
    !scriptedTyping &&
    status !== "submitted" &&
    status !== "streaming";

  const appClass =
    "app" + (sidebarOpen ? " sidebar-open" : "") + (landing ? " landing" : "");

  /* ----------------------------- Render -------------------------------- */
  return (
    <>
      {enableFluid && <FluidCursor />}
      <div className={appClass}>
      <aside className="sidebar" aria-label="Navigation">
        <div className="brand">{"Ask Rohan"}</div>
        <button className="new-chat" onClick={newChat}>
          ＋ New chat
        </button>

        <nav className="recent" aria-label="Topics">
          <div className="recent-label">EXPLORE</div>
          {SIDEBAR_TOPICS.map((id) => (
            <button
              key={id}
              className="recent-item"
              onClick={() => triggerIntent(id)}
            >
              {INTENT_BY_ID[id].label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Link className="ghost-row" href="/resume">
            Plain resume view
          </Link>
          <div className="account">
            <BotAvatar sm /> Rohan Pant
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="scrim" onClick={closeSidebar} aria-hidden="true" />
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn only-mobile"
            onClick={openSidebar}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="topbar-title">Ask Rohan</div>
          <div className="topbar-actions">
            <button
              className="pill-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {themeLabel}
            </button>
            <Link className="pill-btn" href="/resume">
              Plain view
            </Link>
          </div>
        </header>

        <div className="messages" ref={messagesRef} aria-live="polite">
          {landing && <HeroLanding onPick={triggerIntent} />}
          {messages.map((m) =>
            m.role === "user" ? (
              <div className="msg user" key={m.id}>
                <div className="text">{messageText(m)}</div>
              </div>
            ) : (
              <div className="msg bot" key={m.id}>
                <BotAvatar />
                <div className="text">
                  <AssistantParts message={m} />
                </div>
              </div>
            )
          )}
          {showTyping && (
            <div className="msg bot typing-msg">
              <BotAvatar />
              <div className="text">
                <div className="typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="composer">
          {scriptedMode && (
            <div className="scripted-notice" role="status">
              Running in scripted mode right now.
            </div>
          )}
          {!landing && (
            <div className="composer-actions">
              <QuestionsDrawer onPick={submitText} />
            </div>
          )}
          {!landing && (
            <div className="chips">
              {chips.map((id) => (
                <button
                  key={id}
                  className="chip"
                  onClick={() => triggerIntent(id)}
                >
                  {INTENT_BY_ID[id].prompt}
                </button>
              ))}
            </div>
          )}
          <form className="input-row" autoComplete="off" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={400}
              placeholder="Ask anything about Rohan…"
              aria-label="Ask anything about Rohan"
            />
            <button type="submit" className="send" aria-label="Send">
              ↑
            </button>
          </form>
          <div className="composer-note">
            Built by Rohan Pant.{" "}
            <a
              href="https://github.com/rohan1402"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/rohan1402
            </a>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
