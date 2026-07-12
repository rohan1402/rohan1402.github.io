import type { Project } from "@/data/rohan";
import { Pills } from "./Pills";

/** ProjectCard: a linked card with title, blurb, and stack pills. Ported from projectCard(). */
export function ProjectCard({
  project,
  onOutbound,
}: {
  project: Project;
  onOutbound?: () => void;
}) {
  return (
    <a
      className="card"
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOutbound}
    >
      <div className="card-title">
        {project.name} <span className="card-link">↗</span>
      </div>
      <div className="card-blurb">{project.blurb}</div>
      <Pills items={project.stack} />
    </a>
  );
}
