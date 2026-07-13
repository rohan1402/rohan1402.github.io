import type { Metadata } from "next";
import Link from "next/link";
import { ROHAN } from "@/data/rohan";
import { Pills } from "@/components/Pills";

export const metadata: Metadata = {
  title: "Resume - Rohan Pant, AI / ML Engineer",
  description:
    "Rohan Pant's resume: summary, experience, education, projects, and skills.",
  alternates: { canonical: "/resume" },
};

/**
 * /resume: the plain resume, server-rendered from rohan.ts. Ported from the
 * original buildPlain() in app.js. Includes the PDF download link.
 */
export default function ResumePage() {
  const c = ROHAN.contact;
  return (
    <div className="plain-page">
      <div className="plain-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Link className="back-btn" href="/">
            ← Back to chat
          </Link>
          <a
            className="btn"
            href="/assets/Rohan_Pant_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download PDF
          </a>
        </div>

        <div className="r-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="r-photo"
            src="/assets/rohan-photo.jpg"
            alt="Rohan Pant"
          />
          <div className="r-head-text">
            <h1>{ROHAN.name}</h1>
            <div className="r-sub">
              {ROHAN.title}. {ROHAN.tagline}
            </div>
            <div className="r-links">
              <a href={`mailto:${c.email}`}>{c.email}</a>
              <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a href={c.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <span>{c.phone}</span>
            </div>
          </div>
        </div>

        <div className="r-section">
          <h2>Summary</h2>
          <p>
            {ROHAN.summary} {ROHAN.availability}
          </p>
        </div>

        <div className="r-section">
          <h2>Experience</h2>
          {ROHAN.experience.map((e) => (
            <div className="r-item" key={e.role + e.org}>
              <div className="r-item-head">
                <strong>
                  {e.role}, {e.org}
                </strong>
                <span className="r-item-when">{e.when}</span>
              </div>
              <ul>
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="r-section">
          <h2>Education</h2>
          {ROHAN.education.map((ed) => (
            <div className="r-item" key={ed.school}>
              <div className="r-item-head">
                <strong>
                  {ed.degree}, {ed.school}
                </strong>
                <span className="r-item-when">
                  {ed.when}
                  {ed.detail ? ", " + ed.detail : ""}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="r-section">
          <h2>Projects</h2>
          {ROHAN.projects.map((p) => (
            <div className="r-item" key={p.id}>
              <div className="r-item-head">
                <strong>{p.name}</strong>
                <a
                  className="r-item-when"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  repo ↗
                </a>
              </div>
              <div>{p.blurb}</div>
              <Pills items={p.stack} />
            </div>
          ))}
        </div>

        <div className="r-section">
          <h2>Skills</h2>
          {Object.entries(ROHAN.skills).map(([g, items]) => (
            <div className="skill-group" key={g}>
              <div className="skill-label">{g}</div>
              <Pills items={items} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
