"use client";

/**
 * ChatApp: the interactive shell (sidebar, chat, composer) wired to the
 * scripted engine. Ported from app.js. Rendered from a server page, so its
 * initial output (greeting + chips + sidebar + composer) is server-rendered
 * and meaningful without JS; interaction hydrates on the client.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  INTENT_BY_ID,
  INITIAL_CHIPS,
  FALLBACK_CHIPS,
  matchIntent,
  type Intent,
  type IntentId,
} from "@/lib/scripted";
import { track } from "@/lib/analytics";
import { BotAvatar } from "./BotAvatar";
import { Greeting, Fallback, IntentAnswer } from "./Answers";

const SIDEBAR_TOPICS: IntentId[] = [
  "about",
  "projects",
  "experience",
  "skills",
  "resume",
  "contact",
];

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "bot"; content: "greeting" | "fallback" | "intent"; intentId?: IntentId };

// Omit that distributes over the union so each branch keeps its own fields.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", content: "greeting" },
  ]);
  const [chips, setChips] = useState<IntentId[]>(INITIAL_CHIPS);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeLabel, setThemeLabel] = useState("Dark");

  const nextId = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the transcript scrolled to the newest message.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  // Clear any pending typing timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
  // Sync the toggle label to the theme the anti-FOUC script already applied.
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
  function pushMessage(msg: DistributiveOmit<Message, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: nextId.current++ } as Message]);
  }

  function respond(userText: string, intent: Intent | null) {
    pushMessage({ role: "user", text: userText });
    setTyping(true);
    const delay = 480 + Math.min(700, userText.length * 14);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTyping(false);
      if (intent) {
        pushMessage({ role: "bot", content: "intent", intentId: intent.id });
        setChips(intent.followups);
      } else {
        pushMessage({ role: "bot", content: "fallback" });
        setChips(FALLBACK_CHIPS);
        track("fallback-served");
      }
    }, delay);
  }

  function triggerIntent(id: IntentId) {
    const intent = INTENT_BY_ID[id];
    if (!intent) return;
    track("chip-click", id);
    respond(intent.prompt, intent);
    closeSidebar();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    track("question-asked");
    respond(text, matchIntent(text));
  }

  function newChat() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTyping(false);
    nextId.current = 1;
    setMessages([{ id: 0, role: "bot", content: "greeting" }]);
    setChips(INITIAL_CHIPS);
    closeSidebar();
    inputRef.current?.focus();
  }

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  /* ----------------------------- Render -------------------------------- */
  function BotContent({ m }: { m: Extract<Message, { role: "bot" }> }) {
    if (m.content === "greeting") return <Greeting />;
    if (m.content === "fallback") return <Fallback />;
    if (m.content === "intent" && m.intentId) return <IntentAnswer id={m.intentId} />;
    return null;
  }

  return (
    <div className={sidebarOpen ? "app sidebar-open" : "app"}>
      <aside className="sidebar" aria-label="Navigation">
        <div className="brand">{"Ask Rohan"}</div>
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
          {messages.map((m) =>
            m.role === "user" ? (
              <div className="msg user" key={m.id}>
                <div className="text">{m.text}</div>
              </div>
            ) : (
              <div className="msg bot" key={m.id}>
                <BotAvatar />
                <div className="text">
                  <BotContent m={m} />
                </div>
              </div>
            )
          )}
          {typing && (
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
          <form className="input-row" autoComplete="off" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Rohan…"
              aria-label="Ask anything about Rohan"
            />
            <button type="submit" className="send" aria-label="Send">
              ↑
            </button>
          </form>
          <div className="composer-note">
            Scripted demo, built by Rohan Pant.{" "}
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
  );
}
