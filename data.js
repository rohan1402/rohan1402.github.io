/* ============================================================================
   data.js — single source of truth for everything "Ask Rohan" knows.
   Pure data + small HTML builders. No DOM, no dependencies.
   To plug in a real Claude API later, this same content becomes the system
   prompt and the INTENTS below become the offline fallback.
   ============================================================================ */

const ROHAN = {
  name: "Rohan Pant",
  title: "AI / ML Engineer",
  tagline: "Building agentic AI systems, LLM-integrated backends, and RAG pipelines.",
  location: "New Brunswick, NJ",
  summary:
    "Software engineer specializing in agentic AI systems, LLM-integrated backends, and production Node.js/TypeScript services. Builds autonomous agents with Gemini and Claude (tool use, MCP-style integrations, RAG), plus ML automation and AWS-integrated systems.",
  education: [
    {
      school: "Rutgers University",
      degree: "M.S. Data Science",
      detail: "CGPA 4.0",
      when: "Sep 2025 - May 2027",
      where: "New Brunswick, NJ",
    },
    {
      school: "University of Petroleum & Energy Studies",
      degree: "B.Tech, Computer Science & Engineering (Big Data)",
      detail: "",
      when: "Aug 2018 - May 2022",
      where: "India",
    },
  ],
  nowRoles: [
    "Software Developer at Rutgers University",
    "M.S. Data Science at Rutgers (May 2027)",
  ],
  past: "Member of Technical Staff 2 at Cohesity (2022-2025)",
  focus: [
    "Agentic AI, tool use & autonomous workflows",
    "RAG systems & LLM evaluation frameworks",
    "LLM-integrated backends (Node.js / TypeScript)",
  ],
  availability:
    "Open to AI Engineer, ML Engineer, and SWE internships (Summer/Fall 2026). F-1 OPT eligible.",
  contact: {
    email: "rohan.pant14@gmail.com",
    altEmail: "rp1610@scarletmail.rutgers.edu",
    phone: "(908) 801-0976",
    linkedin: "https://www.linkedin.com/in/rohan1402",
    github: "https://github.com/rohan1402",
  },
  projects: [
    {
      id: "patchwork",
      name: "Patchwork",
      blurb:
        "Autonomous agent that ingests a bug report, generates regression tests, runs them in an E2B sandbox, and opens a GitHub PR with passing tests, end to end with no human in the loop. Built at the Zero to Agent hackathon (Vercel x DeepMind).",
      stack: ["Gemini", "E2B Sandbox", "GitHub API", "Next.js", "Tool Use"],
      url: "https://github.com/rohan1402/patchwork",
    },
    {
      id: "agentically",
      name: "Agentically",
      blurb:
        "AI compliance intelligence that lets healthcare staff search accreditation standards in plain English and get precise, cited answers without digging through PDFs.",
      stack: ["Claude Sonnet", "MongoDB Atlas", "Voyage AI", "Next.js", "Vercel"],
      url: "https://github.com/rohan1402/agentically",
    },
    {
      id: "llm",
      name: "Rutgers LLM Benchmarking",
      blurb:
        "Local LLM evaluation pipeline running 4 GGUF Q4_K_M models through a custom RAG harness, with Groq-as-judge scoring. Built at Rutgers.",
      stack: ["llama-cpp-python", "LangChain", "Groq", "Python"],
      url: "https://github.com/rohan1402/llm-playground",
    },
    {
      id: "f1",
      name: "F1 Race Rewind",
      blurb:
        "Interactive what-if race simulator that lets you change pit-stop laps and watch downstream position changes in an animated lap-by-lap replay.",
      stack: ["Python", "Streamlit", "FastF1", "Pandas"],
      url: "https://github.com/rohan1402/f1-race-simulator",
    },
  ],
  experience: [
    {
      role: "Software Developer",
      org: "Rutgers University, New Brunswick",
      when: "Jan 2026 - Present",
      points: [
        "Built an agentic AI chatbot from scratch (Node.js, TypeScript, Express, React), integrating LLM APIs with tool use and retrieval to deliver context-aware academic content across departments.",
        "Designed a modular LLM evaluation framework supporting 4+ models with structured logging, latency tracking, and token-usage metrics for benchmarking RAG quality and instruction-following.",
        "Implemented RAG to ground responses in structured academic content, enabling automated MCQ, programming, and essay-question generation mapped to learning objectives.",
      ],
    },
    {
      role: "Member of Technical Staff 2",
      org: "Cohesity",
      when: "Jul 2022 - Jul 2025",
      points: [
        "Engineered a production Auto-Triage system (Python and ML) classifying defects across Product, Automation, and Environment, cutting debugging turnaround by 37%.",
        "Built backend workflows processing 150k+ log events with NLP-based pattern detection for faster root-cause analysis across distributed systems.",
        "Owned a full Jenkins CI/CD pipeline and a Grafana monitoring dashboard, reducing manual QA effort by 20%.",
      ],
    },
    {
      role: "Data Science Intern",
      org: "Alpha AI",
      when: "Jun 2021 - Jul 2021",
      points: [
        "Built Facial Expression and Speech Emotion Recognition pipelines (Keras, 27k 48x48 grayscale images).",
        "Used OpenCV for face detection and emotion prediction, reaching ~73% accuracy.",
      ],
    },
  ],
  skills: {
    "Agentic AI": [
      "Claude Agent SDK",
      "MCP Servers",
      "Tool Use",
      "Gemini tool calling",
      "Autonomous workflows",
      "Prompt engineering",
    ],
    "RAG & Vector DBs": [
      "RAG pipelines",
      "Semantic search",
      "MongoDB Atlas",
      "OpenSearch",
      "S3 Vectors",
      "sentence-transformers",
    ],
    AWS: ["Lambda", "Bedrock", "S3", "EC2"],
    Languages: ["Python", "Node.js", "TypeScript", "Java", "SQL"],
    "Backend & DevOps": ["Express", "REST APIs", "Jenkins CI/CD", "Git", "Docker"],
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
    <div class="card-title">${esc(p.name)} <span class="card-link">&#8599;</span></div>
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
    keywords: ["about", "who", "yourself", "bio", "summary", "intro", "background"],
    answer: () => `
      <img class="about-photo" src="assets/rohan-photo.jpg" alt="Rohan Pant" onerror="this.style.display='none'">
      <p><strong>${esc(ROHAN.name)}</strong> is an <strong>${esc(ROHAN.title)}</strong> who builds agentic AI systems, LLM-integrated backends, and RAG pipelines.</p>
      <p>He's currently a <strong>${esc(ROHAN.nowRoles[0])}</strong> while finishing his
      <strong>${esc(ROHAN.education[0].degree)} at ${esc(ROHAN.education[0].school)}</strong>
      (${esc(ROHAN.education[0].when)}). Before grad school he spent
      <strong>3 years at Cohesity as a Member of Technical Staff 2</strong>.</p>
      <p>What he loves building:</p>
      <ul>${ROHAN.focus.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`,
    followups: ["projects", "experience", "skills"],
  },
  {
    id: "projects",
    label: "Projects",
    keywords: ["project", "projects", "built", "build", "work", "portfolio", "shipped", "made"],
    answer: () => `
      <p>Here's what Rohan has shipped recently. Tap any card to open the repo:</p>
      <div class="cards">${ROHAN.projects.map(projectCard).join("")}</div>`,
    followups: ["patchwork", "agentically", "skills"],
  },
  {
    id: "patchwork",
    label: "Patchwork",
    keywords: ["patchwork", "hackathon", "deepmind", "regression", "github app"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[0])}</div>
      <p>It was built <strong>solo</strong> at the Zero to Agent hackathon (Vercel x Google DeepMind).
      It's an end-to-end agent: it reads a bug report, synthesizes a failing regression test, and opens a PR.</p>`,
    followups: ["agentically", "projects", "contact"],
  },
  {
    id: "agentically",
    label: "Agentically",
    keywords: ["agentically", "compliance", "healthcare", "accreditation", "rag agent", "cited"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[1])}</div>
      <p>A real RAG system with cited answers, built on Claude with MongoDB Atlas vector search and
      Voyage AI embeddings, so compliance staff stop hunting through accreditation PDFs.</p>`,
    followups: ["patchwork", "llm", "skills"],
  },
  {
    id: "llm",
    label: "LLM Benchmarking",
    keywords: ["llm", "benchmark", "benchmarking", "eval", "evaluation", "rag", "playground", "groq", "gguf"],
    answer: () => `<div class="cards">${projectCard(ROHAN.projects[2])}</div>
      <p>Rohan built this at Rutgers. It's a local evaluation pipeline running 4 quantized
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
          <div class="xp-head"><strong>${esc(e.role)}</strong>, ${esc(e.org)}
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
    keywords: ["education", "school", "degree", "rutgers", "study", "masters", "master", "university", "grad", "petroleum", "upes"],
    answer: () => `
      ${ROHAN.education
        .map(
          (ed) => `<p><strong>${esc(ed.degree)}</strong>, ${esc(ed.school)}<br/>
          ${esc(ed.when)}${ed.detail ? ", " + esc(ed.detail) : ""}</p>`
        )
        .join("")}
      <p>Alongside the master's he works as a Software Developer at Rutgers, so the coursework
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
      <p>You can grab the full resume two ways:</p>
      <p>
        <a class="btn" href="assets/Rohan_Pant_Resume.pdf" target="_blank" rel="noopener">Download PDF</a>
        <button class="btn btn-ghost" data-action="plain">View as plain resume</button>
      </p>`,
    followups: ["experience", "skills", "contact"],
  },
  {
    id: "availability",
    label: "Availability",
    keywords: ["available", "availability", "open to", "looking", "internship", "intern", "opt", "visa", "sponsor", "hiring", "hire", "roles", "opportunity"],
    answer: () => `
      <p><strong>Yes, actively looking.</strong></p>
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
        <li>Email: <a href="mailto:${ROHAN.contact.email}">${esc(ROHAN.contact.email)}</a></li>
        <li>LinkedIn: <a href="${ROHAN.contact.linkedin}" target="_blank" rel="noopener">linkedin.com/in/rohan1402</a></li>
        <li>GitHub: <a href="${ROHAN.contact.github}" target="_blank" rel="noopener">github.com/rohan1402</a></li>
        <li>Phone: ${esc(ROHAN.contact.phone)}</li>
      </ul>`,
    followups: ["availability", "resume", "projects"],
  },
  {
    id: "easter",
    label: "Are you really AI?",
    keywords: ["are you ai", "are you real", "real ai", "human", "bot", "robot", "chatgpt", "claude", "who are you really", "fake", "actually ai"],
    answer: () => `
      <p>Caught me. Right now I'm a lightweight scripted assistant (no model behind me yet), so I'm
      fast, free, and work even offline.</p>
      <p>Rohan built me this way on purpose, but he also builds the real thing: production RAG agents
      on Claude and Gemini. Ask him to wire a live model behind this and he absolutely can.</p>`,
    followups: ["projects", "skills", "contact"],
  },
];

const GREETING = `
  <p>Hi, I'm an AI assistant trained on everything about <strong>${esc(ROHAN.name)}</strong>,
  an AI / ML Engineer building agentic AI systems, LLM-integrated backends, and RAG pipelines.</p>
  <p>Ask me anything, or tap a suggestion below.</p>`;

const INITIAL_CHIPS = ["about", "projects", "skills", "contact"];
