"use client";

/**
 * ProjectsCarousel: an Apple Cards Carousel style project display, recreated
 * from the Aceternity UI pattern (not copied). Horizontally scrollable cards
 * that expand into a modal via a shared-layout `motion` morph on the card,
 * title, and category. Each carousel instance is wrapped in its own LayoutGroup
 * (keyed by useId) so multiple carousels in the transcript never cross-morph.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import type { Project } from "@/data/rohan";
import { Pills } from "./Pills";
import { track } from "@/lib/analytics";
import { cueAvatar } from "@/lib/avatar";

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
  const [openId, setOpenId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const openIndex = projects.findIndex((p) => p.id === openId);
  const open = openIndex >= 0 ? projects[openIndex] : null;
  useDismiss(
    !!open,
    () => {
      setOpenId(null);
      cueAvatar("idle");
    },
    modalRef
  );

  const grad = (i: number) => GRADIENTS[i % GRADIENTS.length];

  return (
    <>
      <div className="carousel" role="list">
        {projects.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            className="carousel-card"
            style={{ backgroundImage: grad(i) }}
            onClick={() => {
              setOpenId(p.id);
              cueAvatar("presenting");
            }}
            role="listitem"
            aria-label={`Open ${p.name}`}
          >
            <img
              className="carousel-image"
              src={p.image}
              alt=""
              loading="lazy"
              draggable={false}
            />
            <span className="carousel-scrim" aria-hidden="true" />
            <span className="carousel-cat">
              {p.stack[0]}
            </span>
            <span className="carousel-title">
              {p.name}
            </span>
          </motion.button>
        ))}
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="carousel-modal-root">
                <div className="carousel-overlay" />
                <motion.div
                  className="carousel-modal"
                  ref={modalRef}
                  style={{ backgroundImage: grad(openIndex) }}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <button
                    type="button"
                    className="carousel-close"
                    onClick={() => {
                      setOpenId(null);
                      cueAvatar("idle");
                    }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <img
                    className="carousel-modal-image"
                    src={open.image}
                    alt={open.imageAlt}
                    draggable={false}
                  />
                  <span className="carousel-cat">{open.stack[0]}</span>
                  <span className="carousel-modal-title">{open.name}</span>
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
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
