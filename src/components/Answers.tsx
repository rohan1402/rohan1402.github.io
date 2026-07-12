"use client";

/**
 * Answers.tsx: React renderers for the scripted engine's replies, one per
 * intent id, plus the greeting and fallback. Content is ported verbatim from
 * the original data.js answer() strings. From Phase 2 these same renderers
 * become the components the live model's tools map to.
 */

import Link from "next/link";
import { ROHAN } from "@/data/rohan";
import type { IntentId } from "@/lib/scripted";
import { track } from "@/lib/analytics";
import { Pills } from "./Pills";
import { ProjectCard } from "./ProjectCard";
import { ProjectsCarousel } from "./ProjectsCarousel";

export function Greeting() {
  return (
    <>
      <p>
        Hi, I&apos;m an AI assistant trained on everything about{" "}
        <strong>{ROHAN.name}</strong>, an AI / ML Engineer building agentic AI
        systems, LLM-integrated backends, and RAG pipelines.
      </p>
      <p>Ask me anything, or tap a suggestion below.</p>
    </>
  );
}

export function Fallback() {
  return (
    <>
      <p>
        I&apos;m not totally sure what you meant, but I know plenty about Rohan.
        Try one of these:
      </p>
      <p>
        his <strong>projects</strong>, <strong>experience</strong>,{" "}
        <strong>skills</strong>, <strong>education</strong>,{" "}
        <strong>availability</strong>, or how to <strong>contact</strong> him.
      </p>
    </>
  );
}

function About() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="about-photo"
        src="/assets/rohan-photo.jpg"
        alt="Rohan Pant"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <p>
        <strong>{ROHAN.name}</strong> is an <strong>{ROHAN.title}</strong> who
        builds agentic AI systems, LLM-integrated backends, and RAG pipelines.
      </p>
      <p>
        He&apos;s currently a <strong>{ROHAN.nowRoles[0]}</strong> while
        finishing his{" "}
        <strong>
          {ROHAN.education[0].degree} at {ROHAN.education[0].school}
        </strong>{" "}
        ({ROHAN.education[0].when}). Before grad school he spent{" "}
        <strong>3 years at Cohesity as a Member of Technical Staff 2</strong>.
      </p>
      <p>What he loves building:</p>
      <ul>
        {ROHAN.focus.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </>
  );
}

function Projects() {
  return (
    <>
      <p>Here&apos;s what Rohan has shipped recently. Tap a card to expand it:</p>
      <ProjectsCarousel projects={ROHAN.projects} />
    </>
  );
}

function OneProject({ index, children }: { index: number; children: React.ReactNode }) {
  const p = ROHAN.projects[index];
  return (
    <>
      <div className="cards">
        <ProjectCard project={p} onOutbound={() => track("outbound-click", p.id)} />
      </div>
      {children}
    </>
  );
}

function Experience() {
  return (
    <>
      <p>Rohan&apos;s track record:</p>
      {ROHAN.experience.map((e) => (
        <div className="xp" key={e.role + e.org}>
          <div className="xp-head">
            <strong>{e.role}</strong>, {e.org}
            <span className="xp-when">{e.when}</span>
          </div>
          <ul>
            {e.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Education() {
  return (
    <>
      {ROHAN.education.map((ed) => (
        <p key={ed.school}>
          <strong>{ed.degree}</strong>, {ed.school}
          <br />
          {ed.when}
          {ed.detail ? ", " + ed.detail : ""}
        </p>
      ))}
      <p>
        Alongside the master&apos;s he works as a Software Developer at Rutgers,
        so the coursework and the production work feed each other.
      </p>
    </>
  );
}

function Skills() {
  return (
    <>
      <p>Rohan&apos;s toolkit:</p>
      {Object.entries(ROHAN.skills).map(([group, items]) => (
        <div className="skill-group" key={group}>
          <div className="skill-label">{group}</div>
          <Pills items={items} />
        </div>
      ))}
    </>
  );
}

function Resume() {
  return (
    <>
      <p>You can grab the full resume two ways:</p>
      <p>
        <a
          className="btn"
          href="/assets/Rohan_Pant_Resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("resume-download")}
        >
          Download PDF
        </a>
        <Link className="btn btn-ghost" href="/resume">
          View as plain resume
        </Link>
      </p>
    </>
  );
}

function Availability() {
  return (
    <>
      <p>
        <strong>Yes, actively looking.</strong>
      </p>
      <p>{ROHAN.availability}</p>
      <p>
        If you&apos;re building with agents, LLMs, or developer tooling,
        he&apos;d love to talk.
      </p>
    </>
  );
}

function Contact() {
  const c = ROHAN.contact;
  return (
    <>
      <p>Easiest ways to reach Rohan:</p>
      <ul className="contact-list">
        <li>
          Email:{" "}
          <a href={`mailto:${c.email}`} onClick={() => track("outbound-click", "email")}>
            {c.email}
          </a>
        </li>
        <li>
          LinkedIn:{" "}
          <a
            href={c.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("outbound-click", "linkedin")}
          >
            linkedin.com/in/rohan1402
          </a>
        </li>
        <li>
          GitHub:{" "}
          <a
            href={c.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("outbound-click", "github")}
          >
            github.com/rohan1402
          </a>
        </li>
        <li>Phone: {c.phone}</li>
      </ul>
    </>
  );
}

function Easter() {
  return (
    <>
      <p>
        Caught me. Right now I&apos;m a lightweight scripted assistant (no model
        behind me yet), so I&apos;m fast, free, and work even offline.
      </p>
      <p>
        Rohan built me this way on purpose, but he also builds the real thing:
        production RAG agents on Claude and Gemini. Ask him to wire a live model
        behind this and he absolutely can.
      </p>
    </>
  );
}

/** Maps an intent id to its rendered answer. */
export function IntentAnswer({ id }: { id: IntentId }) {
  switch (id) {
    case "about":
      return <About />;
    case "projects":
      return <Projects />;
    case "patchwork":
      return (
        <OneProject index={0}>
          <p>
            It was built <strong>solo</strong> at the Zero to Agent hackathon
            (Vercel x Google DeepMind). It&apos;s an end-to-end agent: it reads a
            bug report, synthesizes a failing regression test, and opens a PR.
          </p>
        </OneProject>
      );
    case "agentically":
      return (
        <OneProject index={1}>
          <p>
            A real RAG system with cited answers, built on Claude with MongoDB
            Atlas vector search and Voyage AI embeddings, so compliance staff
            stop hunting through accreditation PDFs.
          </p>
        </OneProject>
      );
    case "llm":
      return (
        <OneProject index={2}>
          <p>
            Rohan built this at Rutgers. It&apos;s a local evaluation pipeline
            running 4 quantized GGUF models through a custom RAG harness, with
            Groq-as-judge scoring.
          </p>
        </OneProject>
      );
    case "f1":
      return (
        <OneProject index={3}>
          <p>
            A what-if race simulator: change a pit-stop lap and watch the
            downstream finishing order replay lap-by-lap. Powered by the FastF1
            telemetry dataset.
          </p>
        </OneProject>
      );
    case "experience":
      return <Experience />;
    case "education":
      return <Education />;
    case "skills":
      return <Skills />;
    case "resume":
      return <Resume />;
    case "availability":
      return <Availability />;
    case "contact":
      return <Contact />;
    case "easter":
      return <Easter />;
  }
}
