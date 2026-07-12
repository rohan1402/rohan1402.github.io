/**
 * scripted.ts: the zero-cost fallback engine, ported from the original
 * data.js INTENTS array and app.js matchIntent() keyword scorer.
 *
 * This module is pure data + matching logic. The actual answer content is
 * rendered by React components (see components/answers), keyed by intent id.
 * From Phase 2 on, this same engine answers whenever the live model is
 * unavailable: no API key, rate limit hit, budget flag, or API error.
 */

export type IntentId =
  | "about"
  | "projects"
  | "patchwork"
  | "agentically"
  | "llm"
  | "f1"
  | "experience"
  | "education"
  | "skills"
  | "resume"
  | "availability"
  | "contact"
  | "easter";

export interface Intent {
  id: IntentId;
  /** Shown in the sidebar and as a label. */
  label: string;
  /** Friendly phrasing echoed as the user message when a chip/button is tapped. */
  prompt: string;
  /** Keywords for the substring scorer. Order and content preserved verbatim. */
  keywords: string[];
  /** Follow-up chip ids surfaced after this intent answers. */
  followups: IntentId[];
}

/**
 * INTENTS: order is behaviorally load-bearing. matchIntent() breaks ties in
 * favour of the earliest intent in this array, so do not reorder casually.
 */
export const INTENTS: Intent[] = [
  {
    id: "about",
    label: "About Rohan",
    prompt: "Who is Rohan?",
    keywords: ["about", "who", "yourself", "bio", "summary", "intro", "background"],
    followups: ["projects", "experience", "skills"],
  },
  {
    id: "projects",
    label: "Projects",
    prompt: "Show me his projects",
    keywords: ["project", "projects", "built", "build", "work", "portfolio", "shipped", "made"],
    followups: ["patchwork", "agentically", "skills"],
  },
  {
    id: "patchwork",
    label: "Patchwork",
    prompt: "Tell me about Patchwork",
    keywords: ["patchwork", "hackathon", "deepmind", "regression", "github app"],
    followups: ["agentically", "projects", "contact"],
  },
  {
    id: "agentically",
    label: "Agentically",
    prompt: "Tell me about Agentically",
    keywords: ["agentically", "compliance", "healthcare", "accreditation", "rag agent", "cited"],
    followups: ["patchwork", "llm", "skills"],
  },
  {
    id: "llm",
    label: "LLM Benchmarking",
    prompt: "Tell me about the LLM benchmarking project",
    keywords: ["llm", "benchmark", "benchmarking", "eval", "evaluation", "rag", "playground", "groq", "gguf"],
    followups: ["projects", "skills", "experience"],
  },
  {
    id: "f1",
    label: "F1 Race Rewind",
    prompt: "Tell me about F1 Race Rewind",
    keywords: ["f1", "formula", "race", "racing", "pit", "simulator", "fastf1"],
    followups: ["projects", "skills", "contact"],
  },
  {
    id: "experience",
    label: "Experience",
    prompt: "What's his experience?",
    keywords: ["experience", "job", "jobs", "career", "cohesity", "sas it", "history", "worked", "employment"],
    followups: ["education", "projects", "skills"],
  },
  {
    id: "education",
    label: "Education",
    prompt: "Where did he study?",
    keywords: ["education", "school", "degree", "rutgers", "study", "masters", "master", "university", "grad", "petroleum", "upes"],
    followups: ["experience", "skills", "availability"],
  },
  {
    id: "skills",
    label: "Skills",
    prompt: "What's his tech stack?",
    keywords: ["skill", "skills", "stack", "tech", "technology", "technologies", "tools", "language", "languages", "framework"],
    followups: ["projects", "experience", "contact"],
  },
  {
    id: "resume",
    label: "Resume",
    prompt: "Can I see his resume?",
    keywords: ["resume", "cv", "download", "pdf"],
    followups: ["experience", "skills", "contact"],
  },
  {
    id: "availability",
    label: "Availability",
    prompt: "Is he open to work?",
    keywords: ["available", "availability", "open to", "looking", "internship", "intern", "opt", "visa", "sponsor", "hiring", "hire", "roles", "opportunity"],
    followups: ["contact", "projects", "resume"],
  },
  {
    id: "contact",
    label: "Contact",
    prompt: "How do I get in touch?",
    keywords: ["contact", "email", "reach", "linkedin", "github", "phone", "call", "message", "connect", "touch", "talk"],
    followups: ["availability", "resume", "projects"],
  },
  {
    id: "easter",
    label: "Are you really AI?",
    prompt: "Wait, are you really AI?",
    keywords: ["are you ai", "are you real", "real ai", "human", "bot", "robot", "chatgpt", "claude", "who are you really", "fake", "actually ai"],
    followups: ["projects", "skills", "contact"],
  },
];

export const INTENT_BY_ID: Record<IntentId, Intent> = Object.fromEntries(
  INTENTS.map((i) => [i.id, i])
) as Record<IntentId, Intent>;

export const INITIAL_CHIPS: IntentId[] = ["about", "projects", "skills", "contact"];

/** Chips shown after the fallback answer, matching the original respond() path. */
export const FALLBACK_CHIPS: IntentId[] = ["about", "projects", "skills", "contact"];

/**
 * matchIntent: the original keyword scorer, unchanged.
 * Substring matching (not tokenized). Longer / multi-word keywords score higher,
 * so "tell me about patchwork" matches patchwork, not the generic about intent.
 * Ties resolve to the earliest intent in INTENTS (strict > keeps the first).
 * Returns null when nothing scores, which drives the scripted fallback.
 */
export function matchIntent(text: string): Intent | null {
  const q = " " + text.toLowerCase() + " ";
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (q.includes(kw)) {
        score += kw.length + (kw.includes(" ") ? 2 : 0);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  return bestScore > 0 ? best : null;
}
