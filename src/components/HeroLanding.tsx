"use client";

/**
 * HeroLanding: the centered landing hero shown in the empty state (before any
 * message). Avatar, intro, an availability pill, and large question preview
 * cards. Picking a card runs the scripted answer (zero API calls) and collapses
 * the hero into the chat transcript.
 */

import type { IntentId } from "@/lib/scripted";
import { ROHAN } from "@/data/rohan";
import { track } from "@/lib/analytics";

const HERO_QUESTIONS: { id: IntentId; label: string }[] = [
  { id: "experience", label: "How did Rohan cut debugging time by 37%?" },
  { id: "patchwork", label: "Show me the agent that opens GitHub PRs" },
  { id: "skills", label: "What does Rohan build with?" },
  { id: "availability", label: "Is Rohan open to 2027 internships?" },
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
      <h1 className="hero-name">{ROHAN.name}</h1>
      <p className="hero-title">{ROHAN.title}</p>
      <p className="hero-sub">{ROHAN.tagline}</p>
      <div className="hero-avail">
        <span className="hero-dot" aria-hidden="true" />
        {ROHAN.availabilityShort}
      </div>
      <div className="hero-actions" aria-label="Portfolio actions">
        <button
          type="button"
          className="hero-action hero-action-primary"
          onClick={() => onPick("projects", "Show me Rohan's projects")}
        >
          View Projects
        </button>
        <a
          className="hero-action hero-action-secondary"
          href="/assets/Rohan_Pant_Resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("resume-download")}
        >
          Download Resume
        </a>
      </div>
      <ul className="hero-proof" aria-label="Selected impact">
        {ROHAN.proofPoints.map((point) => (
          <li key={point.label}>
            <strong>{point.value}</strong>
            <span>{point.label}</span>
          </li>
        ))}
      </ul>
      <p className="hero-ai-label">Or explore my work with my AI assistant</p>
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
