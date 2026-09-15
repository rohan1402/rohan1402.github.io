"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  type MotionStyle,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { ROHAN, type Project } from "@/data/rohan";
import { track } from "@/lib/analytics";
import { Pills } from "./Pills";

const PROJECT_ACCENTS = ["#7c7cf0", "#2da9b2", "#c66bd6"];

type FeaturedProject = Project & { story: NonNullable<Project["story"]> };

export function ProjectsShowcase({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const projects = useMemo(
    () =>
      ROHAN.projects.filter(
        (project): project is FeaturedProject => !!project.story
      ),
    []
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const previewX = useSpring(pointerX, { stiffness: 260, damping: 30 });
  const previewY = useSpring(pointerY, { stiffness: 260, damping: 30 });

  const hoveredProject = projects.find((project) => project.id === hoveredId);
  const hoveredIndex = projects.findIndex((project) => project.id === hoveredId);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  function movePreview(event: React.PointerEvent) {
    pointerX.set(event.clientX + 24);
    pointerY.set(event.clientY - 92);
  }

  function toggleProject(project: FeaturedProject) {
    setExpandedId((current) => (current === project.id ? null : project.id));
    setHoveredId(null);
    track("project-showcase-select", project.id);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="project-showcase-root">
          <motion.button
            className="project-showcase-overlay"
            type="button"
            aria-label="Close project showcase"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.section
            className="project-showcase"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-showcase-title"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
          >
            <header className="project-showcase-header">
              <div>
                <span className="project-showcase-kicker">Selected work</span>
                <h2 id="project-showcase-title">Projects built around real workflows</h2>
                <p>Hover to preview. Select a project to see the full story.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="project-showcase-close"
                onClick={onClose}
                aria-label="Close project showcase"
              >
                ×
              </button>
            </header>

            <div
              className="project-index"
              onPointerMove={movePreview}
              onPointerLeave={() => setHoveredId(null)}
            >
              {projects.map((project, index) => {
                const expanded = expandedId === project.id;
                const accent = PROJECT_ACCENTS[index % PROJECT_ACCENTS.length];

                return (
                  <article
                    className={`project-index-item${expanded ? " expanded" : ""}`}
                    key={project.id}
                    style={{ "--project-accent": accent } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="project-index-trigger"
                      aria-expanded={expanded}
                      aria-controls={`project-detail-${project.id}`}
                      onPointerEnter={() => setHoveredId(project.id)}
                      onFocus={() => setHoveredId(project.id)}
                      onBlur={() => setHoveredId(null)}
                      onClick={() => toggleProject(project)}
                    >
                      <span className="project-index-number">0{index + 1}</span>
                      <span className="project-index-copy">
                        <strong>{project.name}</strong>
                        <small>{project.category}</small>
                      </span>
                      <span className="project-index-action">
                        {expanded ? "Close" : "Explore"}
                      </span>
                      <span className="project-index-symbol" aria-hidden="true">
                        {expanded ? "−" : "+"}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          id={`project-detail-${project.id}`}
                          className="project-index-detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.24 }}
                        >
                          <div className="project-detail-inner">
                            <div
                              className="project-workflow-inline"
                              aria-label={`${project.name} workflow`}
                            >
                              {project.story.previewSteps.map((step, stepIndex) => (
                                <div key={step} className="project-workflow-step">
                                  <span>{step}</span>
                                  {stepIndex < project.story.previewSteps.length - 1 && (
                                    <i aria-hidden="true">→</i>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="project-story-grid">
                              <section>
                                <span>Problem</span>
                                <p>{project.story.problem}</p>
                              </section>
                              <section>
                                <span>What I built</span>
                                <p>{project.story.build}</p>
                              </section>
                              <section>
                                <span>Result</span>
                                <p>{project.story.result}</p>
                              </section>
                            </div>

                            <div className="project-showcase-footer">
                              <Pills items={project.stack} />
                              <a
                                className="project-showcase-link"
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() =>
                                  track("outbound-click", `showcase-${project.id}`)
                                }
                              >
                                View repository <span aria-hidden="true">↗</span>
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>
          </motion.section>

          <AnimatePresence>
            {hoveredProject && !reduceMotion && (
              <motion.aside
                className="project-hover-preview"
                style={
                  {
                    x: previewX,
                    y: previewY,
                    "--project-accent":
                      PROJECT_ACCENTS[hoveredIndex % PROJECT_ACCENTS.length],
                  } as MotionStyle
                }
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                aria-hidden="true"
              >
                <span>{hoveredProject.category}</span>
                <strong>{hoveredProject.name}</strong>
                <div className="project-hover-flow">
                  {hoveredProject.story.previewSteps.map((step, index) => (
                    <div key={step}>
                      <b>{step}</b>
                      {index < hoveredProject.story.previewSteps.length - 1 && (
                        <i>→</i>
                      )}
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
