"use client";

/**
 * ProjectsCarousel: an Apple Cards Carousel style project display, recreated
 * from the Aceternity UI pattern (not copied). Horizontally scrollable cards
 * that expand into a modal via a shared-layout `motion` morph on the card,
 * title, and category. Each carousel instance is wrapped in its own LayoutGroup
 * (keyed by useId) so multiple carousels in the transcript never cross-morph.
 */

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { Project } from "@/data/rohan";
import { Pills } from "./Pills";
import { track } from "@/lib/analytics";

const GRADIENTS = [
  "linear-gradient(160deg, #4f46e5, #7c3aed)",
  "linear-gradient(160deg, #0ea5e9, #6366f1)",
  "linear-gradient(160deg, #db2777, #7c3aed)",
  "linear-gradient(160deg, #f59e0b, #ef4444)",
];

function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, ref]);
}

export function ProjectsCarousel({ projects }: { projects: Project[] }) {
  const groupId = useId().replace(/:/g, "");
  const [openId, setOpenId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const openIndex = projects.findIndex((p) => p.id === openId);
  const open = openIndex >= 0 ? projects[openIndex] : null;
  useDismiss(!!open, () => setOpenId(null), modalRef);

  const grad = (i: number) => GRADIENTS[i % GRADIENTS.length];

  return (
    <LayoutGroup id={groupId}>
      <div className="carousel" role="list">
        {projects.map((p, i) => (
          <motion.button
            layoutId={`card-${groupId}-${p.id}`}
            key={p.id}
            type="button"
            className="carousel-card"
            style={{ backgroundImage: grad(i) }}
            onClick={() => setOpenId(p.id)}
            role="listitem"
            aria-label={`Open ${p.name}`}
          >
            <motion.span layoutId={`cat-${groupId}-${p.id}`} className="carousel-cat">
              {p.stack[0]}
            </motion.span>
            <motion.span layoutId={`title-${groupId}-${p.id}`} className="carousel-title">
              {p.name}
            </motion.span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <div className="carousel-modal-root">
            <div className="carousel-overlay" />
            <motion.div
              layoutId={`card-${groupId}-${open.id}`}
              className="carousel-modal"
              ref={modalRef}
              style={{ backgroundImage: grad(openIndex) }}
            >
              <button
                type="button"
                className="carousel-close"
                onClick={() => setOpenId(null)}
                aria-label="Close"
              >
                ×
              </button>
              <motion.span
                layoutId={`cat-${groupId}-${open.id}`}
                className="carousel-cat"
              >
                {open.stack[0]}
              </motion.span>
              <motion.span
                layoutId={`title-${groupId}-${open.id}`}
                className="carousel-modal-title"
              >
                {open.name}
              </motion.span>
              <div className="carousel-modal-body">
                <p>{open.blurb}</p>
                <Pills items={open.stack} />
                <a
                  className="btn carousel-repo"
                  href={open.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("outbound-click", open.id)}
                >
                  View repo ↗
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
