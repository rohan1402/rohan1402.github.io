/* ============================================================================
   data.js — single source of truth for everything "Ask Rohan" knows.
   Pure data + small HTML builders. No DOM, no dependencies.
   To plug in a real Claude API later, this same content becomes the system
   prompt and the INTENTS below become the offline fallback.
   ============================================================================ */

const ROHAN = {
  name: "Rohan Pant",
  title: "AI / ML Engineer",
  tagline: "Building agent systems, RAG pipelines & LLM-eval frameworks.",
  location: "New Jersey, USA",
  education: {
    school: "Rutgers University",
    degree: "M.S. Data Science",
    grad: "May 2027",
  },
  nowRoles: [
    "Software Developer @ Rutgers SAS IT",
    "M.S. Data Science @ Rutgers (May 2027)",
  ],
  past: "Software Engineer + QA @ Cohesity (3 years)",
  focus: [
    "Agentic AI & LLM pipelines",
    "RAG systems & custom evaluation frameworks",
    "Developer tooling & automation",
  ],
  availability:
    "Open to AI Engineer · ML Engineer · SWE internships (Summer/Fall 2026). F-1 OPT eligible.",
  contact: {
    email: "rp1610@scarletmail.rutgers.edu",
    altEmail: "rohan.pant14@gmail.com",
    phone: "(908) 801-0976",
    linkedin: "https://www.linkedin.com/in/rohan1402",
    github: "https://github.com/rohan1402",
  },
  projects: [
    {
      id: "patchwork",
      icon: "🔧",
      name: "Patchwork",
      blurb:
        "GitHub App that turns bug reports into regression tests and opens PRs automatically. Built solo at the Zero to Agent hackathon (Vercel × Google DeepMind).",
      stack: ["Gemini 2.5 Pro", "Next.js", "Octokit", "Supabase", "Vercel"],
      url: "https://github.com/rohan1402/patchwork",
    },
    {
      id: "agentically",
      icon: "🏥",
      name: "Agentically",
      blurb:
        "AI compliance intelligence — healthcare staff search accreditation standards in plain English and get precise, cited answers without digging through PDFs.",
      stack: ["Claude Sonnet", "MongoDB Atlas", "Voyage AI", "Next.js", "Vercel"],
      url: "https://github.com/rohan1402/agentically",
    },
    {
      id: "llm",
      icon: "📊",
      name: "Rutgers LLM Benchmarking",
      blurb:
        "Local LLM evaluation pipeline — 4 GGUF Q4_K_M models, a custom RAG harness, and Groq-as-judge scoring. Built proactively at SAS IT.",
      stack: ["llama-cpp-python", "LangChain", "Groq", "Python"],
      url: "https://github.com/rohan1402/llm-playground",
    },
    {
      id: "f1",
      icon: "🏎️",
      name: "F1 Race Rewind",
      blurb:
        "Interactive what-if race simulator — change pit-stop laps and watch downstream position changes in an animated lap-by-lap replay.",
      stack: ["Python", "Streamlit", "FastF1", "Pandas"],
      url: "https://github.com/rohan1402/f1-race-simulator",
    },
  ],
  experience: [
    {
      role: "Software Developer",
      org: "Rutgers SAS IT",
      when: "2024 — present",
      points: [
        "Build internal developer tooling and automation.",
        "Proactively shipped a local LLM benchmarking pipeline with a custom RAG eval harness.",
      ],
    },
    {
      role: "Software Engineer + QA",
      org: "Cohesity",
      when: "3 years",
      points: [
        "Shipped and tested production software across the engineering + QA lifecycle.",
        "Built automation and reliability tooling for enterprise data management.",
      ],
    },
  ],
  skills: {
    Languages: ["Python", "TypeScript", "JavaScript", "R", "SQL"],
    "AI / ML": [
      "LangChain",
      "Anthropic / Claude",
      "Gemini",
      "Groq",
      "Hugging Face",
      "PyTorch",
      "scikit-learn",
      "llama-cpp-python",
    ],
    "Infra / Dev": [
      "Next.js",
      "Supabase",
      "Vercel",
      "Streamlit",
      "Docker",
      "Git",
      "PostgreSQL",
      "MongoDB",
    ],
  },
};

/* ------------------------------- HTML helpers ----------------------------- */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const pills = (arr) =>
  `<div class="pills">${arr.map((s) => `<span class="pill">${esc(s)}</span>`).join("")}</div>`;

const projectCard = (p) => `
  <a class="card" href="${p.url}" target="_blank" rel="noopener">
    <div class="card-title">${p.icon} ${esc(p.name)} <span class="card-link">↗</span></div>
    <div class="card-blurb">${esc(p.blurb)}</div>
    ${pills(p.stack)}
  </a>`;

/* ------------------------------- Knowledge -------------------------------- */
/* Each intent: id, label (shown in sidebar/chips), keywords, answer() → HTML,
   and follow-up chip ids to surface after it answers. */
const INTENTS = [
  {
    id: "about",
    label: "About Rohan",
    keywords: ["about", "who", "yourself", "bio", "summary", "tell me", "intro", "rohan"],
    answer: () => `
      <p><strong>${esc(ROHAN.name)}</strong> is an <strong>${esc(ROHAN.title)}</strong> ${esc(ROHAN.tagline)}</p>
      <p>He's currently an <strong>${esc(ROHAN.nowRoles[0])}</strong> while finishing his
      <strong>${esc(ROHAN.education.degree)} @ ${esc(ROHAN.education.school)}</strong>
      (${esc(ROHAN.education.grad)}). Before grad school he spent
      <strong>3 years as a ${esc("Software Engineer + QA")} at Cohesity</strong>.</p>
      <p>What he loves building:</p>
      <ul>${ROHAN.focus.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`,
    followups: ["projects", "experience", "skills"],
  },
  {
    id: "projects",
    label: "Projects",
    keywords: ["project", "projects", "built", "build", "work", "portfolio", "shipped", "made"],
    answer: () => `
      <p>Here's what Rohan has shipped recently — tap any card to open the repo:</p>
      <div class="cards">${ROHAN.projects.map(projectCard).join("")}</div>`,
    followups: ["patchwork", "agentically", "skills"],
  },
  {
    id: "patchwork",
    label: "Patchwork",
    keywords: ["patchwork", "hackathon", "deepmind", "regression", "github app"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[0])}</div>
      <p>It was built <strong>solo</strong> at the Zero to Agent hackathon (Vercel × Google DeepMind) —
      an end-to-end agent: read a bug report, synthesize a failing regression test, and open a PR.</p>`,
    followups: ["agentically", "projects", "contact"],
  },
  {
    id: "agentically",
    label: "Agentically",
    keywords: ["agentically", "compliance", "healthcare", "accreditation", "rag agent", "cited"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[1])}</div>
      <p>A real RAG system with cited answers — built on Claude with MongoDB Atlas vector search and
      Voyage AI embeddings, so compliance staff stop hunting through accreditation PDFs.</p>`,
    followups: ["patchwork", "llm", "skills"],
  },
  {
    id: "llm",
    label: "LLM Benchmarking",
    keywords: ["llm", "benchmark", "benchmarking", "eval", "evaluation", "rag", "playground", "groq", "gguf"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[2])}</div>
      <p>Rohan built this proactively at SAS IT — a local evaluation pipeline running 4 quantized
      GGUF models through a custom RAG harness, with Groq-as-judge scoring.</p>`,
    followups: ["projects", "skills", "experience"],
  },
  {
    id: "f1",
    label: "F1 Race Rewind",
    keywords: ["f1", "formula", "race", "racing", "pit", "simulator", "fastf1"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[3])}</div>
      <p>A what-if race simulator: change a pit-stop lap and watch the downstream finishing order
      replay lap-by-lap. Powered by the FastF1 telemetry dataset.</p>`,
    followups: ["projects", "skills", "contact"],
  },
  {
    id: "experience",
    label: "Experience",
    keywords: ["experience", "job", "jobs", "career", "cohesity", "sas it", "history", "worked", "employment"],
    answer: () => `
      <p>Rohan's track record:</p>
      ${ROHAN.experience
        .map(
          (e) => `
        <div class="xp">
          <div class="xp-head"><strong>${esc(e.role)}</strong> · ${esc(e.org)}
            <span class="xp-when">${esc(e.when)}</span></div>
          <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>`
        )
        .join("")}`,
    followups: ["education", "projects", "skills"],
  },
  {
    id: "education",
    label: "Education",
    keywords: ["education", "school", "degree", "rutgers", "study", "masters", "master", "ms", "university", "grad"],
    answer: () => `
      <p><strong>${esc(ROHAN.education.degree)}</strong> — ${esc(ROHAN.education.school)}<br/>
      Expected ${esc(ROHAN.education.grad)}.</p>
      <p>Alongside the degree he works as a Software Developer at Rutgers SAS IT, so the coursework
      and the production work feed each other.</p>`,
    followups: ["experience", "skills", "availability"],
  },
  {
    id: "skills",
    label: "Skills",
    keywords: ["skill", "skills", "stack", "tech", "technology", "technologies", "tools", "language", "languages", "framework"],
    answer: () => `
      <p>Rohan's toolkit:</p>
      ${Object.entries(ROHAN.skills)
        .map(([group, items]) => `<div class="skill-group"><div class="skill-label">${esc(group)}</div>${pills(items)}</div>`)
        .join("")}`,
    followups: ["projects", "experience", "contact"],
  },
  {
    id: "resume",
    label: "Resume",
    keywords: ["resume", "cv", "download", "pdf"],
    answer: () => `
      <p>You can grab the full résumé two ways:</p>
      <p>
        <a class="btn" href="assets/Rohan_Pant_Resume.pdf" target="_blank" rel="noopener">⬇ Download PDF</a>
        <button class="btn btn-ghost" data-action="plain">📄 View as plain résumé</button>
      </p>`,
    followups: ["experience", "skills", "contact"],
  },
  {
    id: "availability",
    label: "Availability",
    keywords: ["available", "availability", "open to", "looking", "internship", "intern", "opt", "visa", "sponsor", "hiring", "hire", "roles", "opportunity"],
    answer: () => `
      <p><strong>Yes — actively looking.</strong></p>
      <p>${esc(ROHAN.availability)}</p>
      <p>If you're building with agents, LLMs, or developer tooling, he'd love to talk.</p>`,
    followups: ["contact", "projects", "resume"],
  },
  {
    id: "contact",
    label: "Contact",
    keywords: ["contact", "email", "reach", "linkedin", "github", "phone", "call", "message", "connect", "touch", "talk"],
    answer: () => `
      <p>Easiest ways to reach Rohan:</p>
      <ul class="contact-list">
        <li>📧 <a href="mailto:${ROHAN.contact.email}">${esc(ROHAN.contact.email)}</a></li>
        <li>💼 <a href="${ROHAN.contact.linkedin}" target="_blank" rel="noopener">linkedin.com/in/rohan1402</a></li>
        <li>🐙 <a href="${ROHAN.contact.github}" target="_blank" rel="noopener">github.com/rohan1402</a></li>
        <li>📱 ${esc(ROHAN.contact.phone)}</li>
      </ul>`,
    followups: ["availability", "resume", "projects"],
  },
  {
    id: "easter",
    label: "Are you really AI?",
    keywords: ["are you ai", "are you real", "real ai", "human", "bot", "robot", "chatgpt", "claude", "who are you really", "fake", "actually ai"],
    answer: () => `
      <p>Caught me 🙂 — right now I'm a lightweight scripted assistant (no model behind me yet), so I'm
      fast, free, and work even offline.</p>
      <p>Rohan built me this way on purpose — but he also builds the real thing: production RAG agents
      on Claude and Gemini. Ask him to wire a live model behind this and he absolutely can.</p>`,
    followups: ["projects", "skills", "contact"],
  },
];

const GREETING = `
  <p>Hi! I'm an AI assistant trained on everything about <strong>${esc(ROHAN.name)}</strong> —
  an ${esc(ROHAN.title.toLowerCase())} who ${esc(ROHAN.tagline.toLowerCase())}</p>
  <p>Ask me anything, or tap a suggestion below. 👇</p>`;

const INITIAL_CHIPS = ["about", "projects", "skills", "contact"];
