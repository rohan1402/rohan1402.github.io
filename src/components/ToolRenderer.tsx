"use client";

/**
 * ToolRenderer: maps a streamed tool call to the React component that renders
 * it inline in the chat. Reuses the same answer renderers as the scripted
 * engine (keyed by intent id), so live-model cards and scripted cards look
 * identical.
 */

import type { IntentId } from "@/lib/scripted";
import { PROJECT_IDS } from "@/lib/tools";
import { IntentAnswer } from "./Answers";

const TOOL_TO_INTENT: Record<string, IntentId> = {
  getPresentation: "about",
  getProjects: "projects",
  getSkills: "skills",
  getExperience: "experience",
  getResume: "resume",
  getContact: "contact",
  getAvailability: "availability",
};

export function ToolRenderer({
  toolName,
  input,
}: {
  toolName: string;
  input: unknown;
}) {
  if (toolName === "getProject") {
    const id = (input as { id?: string } | undefined)?.id;
    if (id && (PROJECT_IDS as readonly string[]).includes(id)) {
      return <IntentAnswer id={id as IntentId} />;
    }
    // If the id is missing/invalid, fall back to showing all projects.
    return <IntentAnswer id="projects" />;
  }
  const intent = TOOL_TO_INTENT[toolName];
  return intent ? <IntentAnswer id={intent} /> : null;
}
