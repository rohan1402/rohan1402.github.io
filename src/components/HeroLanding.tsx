"use client";

/**
 * HeroLanding: the centered landing hero shown in the empty state (before any
 * message). Avatar, intro, an availability pill, and large question preview
 * cards. Picking a card runs the scripted answer (zero API calls) and collapses
 * the hero into the chat transcript.
 */

import type { IntentId } from "@/lib/scripted";

const HERO_QUESTIONS: { id: IntentId; label: string }[] = [
  { id: "about", label: "Who is Rohan?" },
  { id: "projects", label: "What projects is he most proud of?" },
  { id: "skills", label: "What's his tech stack?" },
  { id: "availability", label: "Is he open to work?" },
];

export function HeroLanding({
  onPick,
}: {
  onPick: (id: IntentId, displayText: string) => void;
}) {
  return (
    <div className="hero">
      <span className="hero-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/rohan-photo.jpg" alt="Rohan Pant" />
      </span>
      <h2 className="hero-title">Hi, I&apos;m Rohan&apos;s AI twin</h2>
      <p className="hero-sub">
        Ask me anything about his projects, experience, and skills.
      </p>
      <div className="hero-avail">
        <span className="hero-dot" aria-hidden="true" />
        Available for internships
      </div>
      <div className="hero-cards">
        {HERO_QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            className="hero-card"
            onClick={() => onPick(q.id, q.label)}
          >
            <span>{q.label}</span>
            <span className="hero-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
