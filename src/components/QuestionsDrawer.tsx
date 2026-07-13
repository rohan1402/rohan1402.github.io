"use client";

/**
 * QuestionsDrawer: a bottom drawer (vaul) of curated questions grouped by
 * category. Picking one submits it into the chat and closes the drawer.
 */

import { useState } from "react";
import { Drawer } from "vaul";

const GROUPS: { label: string; questions: string[] }[] = [
  {
    label: "Me",
    questions: ["Who is Rohan?", "What's your background?", "Where are you based?"],
  },
  {
    label: "Projects",
    questions: [
      "Show me your projects",
      "Tell me about Patchwork",
      "What did you build at the hackathon?",
    ],
  },
  {
    label: "Skills",
    questions: [
      "What's your tech stack?",
      "What agentic AI tools do you use?",
      "Do you work with AWS?",
    ],
  },
  {
    label: "Experience",
    questions: ["What did you do at Cohesity?", "What's your current role at Rutgers?"],
  },
  {
    label: "Contact",
    questions: ["How can I reach you?", "Are you open to work?"],
  },
  {
    label: "Fun",
    questions: ["Are you really AI?", "What do you love building?"],
  },
];

export function QuestionsDrawer({ onPick }: { onPick: (question: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="questions-trigger" aria-label="Browse suggested questions">
        Browse questions
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content">
          <div className="drawer-handle" />
          <Drawer.Title className="drawer-title">Ask me about</Drawer.Title>
          <div className="drawer-groups">
            {GROUPS.map((g) => (
              <div className="drawer-group" key={g.label}>
                <div className="drawer-group-label">{g.label}</div>
                <div className="drawer-qs">
                  {g.questions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="chip"
                      onClick={() => {
                        onPick(q);
                        setOpen(false);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
