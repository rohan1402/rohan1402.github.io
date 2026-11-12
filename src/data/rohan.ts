/**
 * rohan.ts: the single source of truth for everything "Ask Rohan" knows.
 * Ported verbatim from the original data.js ROHAN object. Every component and
 * every chat tool reads from this file. Do not invent or reword any facts here.
 */

export interface Education {
  school: string;
  degree: string;
  detail: string;
  when: string;
  where: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  blurb: string;
  stack: string[];
  /** Public repo. Absent for private or proprietary work. */
  url?: string;
  demoUrl?: string;
  demoLabel?: string;
  image: string;
  imageAlt: string;
  story?: {
    problem: string;
    build: string;
    decision: string;
    result: string;
    proof: string[];
    previewSteps: string[];
  };
}

export interface Experience {
  role: string;
  org: string;
  when: string;
  points: string[];
}

export interface Contact {
  email: string;
  altEmail: string;
  linkedin: string;
  github: string;
}

export interface Rohan {
  name: string;
  title: string;
  tagline: string;
  location: string;
  summary: string;
  education: Education[];
  nowRoles: string[];
  past: string;
  focus: string[];
  availabilityShort: string;
  availability: string;
  contact: Contact;
  projects: Project[];
  experience: Experience[];
  skills: Record<string, string[]>;
}

export const ROHAN: Rohan = {
  name: "Rohan Pant",
  title: "AI/ML Engineer",
  tagline:
    "Building agentic AI systems, LLM-integrated backends, and RAG pipelines.",
  location: "New Brunswick, NJ",
  summary:
    "AI Engineer and M.S. Data Science student at Rutgers University with 3+ years of production software experience, building LLM applications in Python and TypeScript. Built a RAG chatbot on a local-only LLM stack for Rutgers Medical School and the LLM-as-judge evaluation framework that selected its model; at Cohesity, shipped an ML defect-triage system that cut debugging turnaround 37%. Hands-on with tool-using agents, RAG, and multi-model orchestration across Claude, Gemini, and open-weight models.",
  education: [
    {
      school: "Rutgers University",
      degree: "M.S. Data Science",
      detail: "GPA 4.0/4.0",
      when: "Sep 2025 - May 2027",
      where: "New Brunswick, NJ",
    },
    {
      school: "University of Petroleum and Energy Studies",
      degree: "B.Tech, Computer Science and Engineering (Big Data)",
      detail: "",
      when: "Aug 2018 - May 2022",
      where: "Dehradun, India",
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
  availabilityShort: "Open to 2027 internships",
  availability:
    "Open to AI Engineer, ML Engineer, and Software Engineering internships in 2027. F-1 OPT eligible.",
  contact: {
    email: "rohan.pant14@gmail.com",
    altEmail: "rp1610@scarletmail.rutgers.edu",
    linkedin: "https://www.linkedin.com/in/rohan1402",
    github: "https://github.com/rohan1402",
  },
  projects: [
    {
      id: "whyzr",
      name: "Whyzr",
      category: "Safe Socratic learning agent",
      blurb:
        "A Socratic thinking companion for children that asks one guiding question at a time, enforces tool safety in code, and records each child's learning journey in a private git-backed growth journal.",
      stack: ["gitagent", "Claude", "Gemini", "Node.js", "Git"],
      url: "https://github.com/rohan1402/Whyzr",
      image: "/assets/projects/whyzr.jpg",
      imageAlt: "Illustration of a protected question path leading to a learning journal",
      story: {
        problem:
          "AI can help children reach answers while quietly replacing the thinking process that produces real learning.",
        build:
          "A constitution-driven tutor with fail-closed tool guards, per-child git memory, a voice interface, and separate runtime and behavioral evaluation layers.",
        decision:
          "Safety-critical limits live in a fail-closed pre-tool hook instead of relying on prompts, while each child's learning history gets an isolated git branch and worktree.",
        result:
          "The machinery and security suite passes 89 of 89 checks, while committed behavioral runs score 17 to 21 out of 21 without leaking direct answers.",
        proof: ["89/89 machinery checks", "17-21/21 behavior scores", "Zero direct-answer leaks"],
        previewSteps: [
          "Child's question",
          "Socratic guidance",
          "Safety guard",
          "Growth journal",
        ],
      },
    },
    {
      id: "scail",
      name: "SCAIL",
      category: "AI visibility automation platform",
      blurb:
        "An AI-visibility audit and outreach engine that measures whether major assistants recommend a business, identifies the gaps, and turns the analysis into reports, rewrites, and CRM-ready outreach.",
      stack: ["Python", "OpenAI", "Claude", "Gemini", "FastAPI", "Supabase"],
      url: "https://github.com/rohan1402/scail",
      image: "/assets/projects/scail.jpg",
      imageAlt: "Illustration of AI visibility analysis flowing into reports and outreach",
      story: {
        problem:
          "Businesses have little visibility into whether AI assistants recommend them or what changes could improve their presence in generated answers.",
        build:
          "I designed and built the Python audit engine, external-data collectors, deliverable assembly, FastAPI control panel, and CRM-ready prospecting flow.",
        decision:
          "Every collector can resolve to a live API or a deterministic offline fallback, so the full workflow remains testable even when a third-party integration is unavailable.",
        result:
          "One system carries an audit from raw business queries to an actionable report, page rewrites, an AI scorecard, and a CRM-ready lead record.",
        proof: ["Step 0-27 audit pipeline", "ChatGPT, Claude, Gemini", "5-part audit bundle"],
        previewSteps: [
          "Business queries",
          "Multi-model audit",
          "Deliverable bundle",
          "Outreach pipeline",
        ],
      },
    },
    {
      id: "patchwork",
      name: "Patchwork",
      category: "Autonomous engineering agent",
      blurb:
        "GitHub App that turns a bug report into a targeted regression-test pull request. It reads the repository's existing test patterns, uses Gemini 2.5 Pro to write a test that fails before the fix and passes after it, then creates the branch, commit, and PR. Built solo at the Zero to Agent hackathon.",
      stack: ["Gemini 2.5 Pro", "Next.js", "Octokit", "Supabase", "Vercel"],
      url: "https://github.com/rohan1402/patchwork",
      demoUrl: "https://pensive-jang.vercel.app",
      demoLabel: "Open live dashboard",
      image: "/assets/projects/patchwork.jpg",
      imageAlt: "Illustration of an agent converting a software bug into a tested pull request",
      story: {
        problem:
          "When a bug is fixed, the regression test that would prevent it from returning is often skipped.",
        build:
          "I built the GitHub App end to end: webhook handling, repository analysis, Gemini test generation, branch and commit creation, pull-request automation, and the activity dashboard.",
        decision:
          "The agent is deliberately limited to test-only changes. That keeps every action reviewable and avoids trusting generated code to modify production behavior.",
        result:
          "A reviewable test-only pull request that raises coverage without allowing the agent to change production code.",
        proof: ["Issue-to-PR automation", "Test-only changes", "Solo hackathon build"],
        previewSteps: ["GitHub issue", "Read test patterns", "Generate test", "Open PR"],
      },
    },
    {
      id: "rutgers-apps",
      name: "Rutgers Production Apps",
      category: "Two web apps live at Rutgers",
      blurb:
        "Two web apps I build and run in production at Rutgers. Medical residents use the Resident Survival Guide to search and read clinical guides. The SEL App helps educators find social-emotional learning resources curated by the Rutgers Psychology Department.",
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "AWS", "Docker", "GitLab CI/CD"],
      demoUrl: "https://selapp.psych.rutgers.edu",
      demoLabel: "Open the SEL App",
      image: "/assets/projects/rutgers-apps.jpg",
      imageAlt: "The SEL App's library of social-emotional learning resources",
    },
    {
      id: "auto-triage",
      name: "Cohesity Auto-Triage",
      category: "Production ML at Cohesity",
      blurb:
        "A production system that automatically classifies defects as product, automation, or environment issues, cutting debugging turnaround by 37%. Built at Cohesity; details stay general because the system is proprietary.",
      stack: ["Python", "Random Forest", "SVM", "NLP", "Jenkins", "Grafana"],
      image: "/assets/projects/auto-triage.jpg",
      imageAlt: "Test logs flowing into product, automation and environment failure classes",
    },
    {
      id: "agentically",
      name: "Agentically",
      category: "Healthcare compliance RAG",
      blurb:
        "AI compliance intelligence that lets healthcare staff search accreditation standards in plain English and get precise, cited answers without digging through PDFs.",
      stack: ["Claude Sonnet", "MongoDB Atlas", "Voyage AI", "Next.js", "Vercel"],
      url: "https://github.com/rohan1402/agentically",
      demoUrl: "https://agentically-webui.vercel.app",
      demoLabel: "View product site",
      image: "/assets/projects/agentically.jpg",
      imageAlt: "Illustration of healthcare standards becoming a grounded cited answer",
      story: {
        problem:
          "Accreditation standards live across long documents, making precise answers slow to find and difficult to verify.",
        build:
          "I built the document-ingestion pipeline, Voyage embedding flow, MongoDB Atlas search tools, Claude agent, evaluation set, and Next.js interface.",
        decision:
          "The agent routes each request through semantic, exact-citation, browse, or hybrid retrieval instead of forcing every question through one vector-search path.",
        result:
          "The system indexes 1,919 standards chunks and passed 13 of 13 test queries across semantic, exact-citation, browse, and hybrid retrieval modes.",
        proof: ["1,919 indexed chunks", "13/13 eval queries", "3-8 second responses"],
        previewSteps: ["Question", "Vector search", "Claude", "Cited answer"],
      },
    },
    {
      id: "llm",
      name: "Rutgers LLM Benchmarking",
      category: "Local model evaluation",
      blurb:
        "Two-phase evaluation platform that benchmarks four local GGUF models across 14 prompts and nine capability categories, then compares them in a PDF RAG pipeline using retrieval, citation-validity, and latency metrics.",
      stack: ["TypeScript", "llama-cpp-python", "React", "Express", "Groq"],
      url: "https://github.com/rohan1402/llm-playground",
      image: "/assets/projects/llm-benchmarking.jpg",
      imageAlt: "Illustration of four language models passing through a shared evaluation harness",
      story: {
        problem:
          "Local language models need a consistent retrieval and scoring setup before their quality can be compared fairly.",
        build:
          "I built the two-phase TypeScript benchmark and PDF RAG harness, including model adapters, deterministic scoring, LLM-judge comparison, and temperature analysis.",
        decision:
          "Only one quantized GGUF is served at a time through llama-cpp-python, preventing same-model-different-label artifacts and keeping comparisons reproducible.",
        result:
          "Llama 3.1 8B was the most consistent local model, while Phi-3.5 and Qwen each reached 100% citation validity in the shared RAG evaluation.",
        proof: ["4 local models", "14 prompts / 9 categories", "10-question RAG eval"],
        previewSteps: ["4 local models", "Shared eval suite", "PDF RAG", "Compare results"],
      },
    },
    {
      id: "f1",
      name: "F1 Race Rewind",
      category: "Interactive race simulation",
      blurb:
        "ML-powered what-if simulator for six historical Formula 1 races. Change a pit-stop lap or tyre compound, then compare the actual race with a lap-by-lap replay driven by predicted lap times.",
      stack: ["Python", "Streamlit", "FastF1", "scikit-learn", "Pandas"],
      url: "https://github.com/rohan1402/f1-race-simulator",
      image: "/assets/projects/f1-race-rewind.jpg",
      imageAlt: "Illustration of actual and alternative race strategies diverging at a pit stop",
    },
  ],
  experience: [
    {
      role: "Software Developer",
      org: "Rutgers University, New Brunswick",
      when: "Jan 2026 - Present",
      points: [
        "Built a production RAG chatbot for Rutgers Medical School's clinical guide app on a local-only LLM stack so sensitive data stays on university infrastructure, serving quantized GGUF models through an OpenAI-compatible API.",
        "Designed the LLM evaluation framework used to choose the production model: benchmarked Llama 3.1 8B, Qwen 2.5 7B, Phi-3.5 Mini, and Mistral 7B on 14 prompts across 9 categories with rule-based and LLM-as-judge scoring.",
        "Scored RAG retrieval hit rate, citation validity, and latency per model; Llama 3.1 8B led the benchmark at 86% with the best local RAG tradeoff, while cloud 70B inference ran ~40x faster at the same hit rate.",
        "Built the production deployment pipeline for two live Next.js and TypeScript apps on GitLab CI/CD and AWS EC2, with Docker image builds, health-check smoke tests, a manual promotion gate, and migrations run before launch.",
      ],
    },
    {
      role: "AI Engineering Intern",
      org: "Peregrine",
      when: "May 2026 - Aug 2026",
      points: [
        "Built Scail, an AI search visibility audit engine in Python: a 28-step pipeline with dependency-ordered execution, per-step persistence to Supabase, exponential-backoff retries, and resume-on-retry that skips completed steps.",
        "Fanned out 30 queries concurrently across 5 AI platforms (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews) with ThreadPoolExecutor, with Claude Sonnet generating queries and Gemini Flash parsing answers.",
        "Developed LeadGenAgent, an idempotent multi-step agent chaining prospect discovery, contact enrichment, email verification, scorecard generation, and Netlify deployment across the Google Maps, Apollo, and MillionVerifier APIs.",
        "Implemented a weighted 0-100 visibility score, automated PDF and Excel deliverables, per-run cost tracking with budget caps and Slack alerts, and a FastAPI control panel, covered by 176 pytest tests.",
      ],
    },
    {
      role: "Member of Technical Staff 2",
      org: "Cohesity",
      when: "Jul 2022 - Jul 2025",
      points: [
        "Engineered a production Auto-Triage ML system in Python (Random Forest and SVM classifiers) that sorted defects into Product, Automation, and Environment categories, reducing debugging turnaround time by 37%.",
        "Built backend workflows to process and analyze 150k+ system log events using NLP-based pattern detection, enabling faster root-cause analysis across distributed systems.",
        "Developed and maintained a full Jenkins CI/CD pipeline; built a Grafana dashboard for product resource monitoring, reducing manual QA effort by 20%.",
      ],
    },
  ],
  skills: {
    "Agentic AI": [
      "Tool use",
      "Multi-step agents",
      "Multi-model orchestration",
      "LLM-as-judge evaluation",
      "Prompt engineering",
    ],
    "LLMs & Serving": [
      "Claude",
      "Gemini",
      "Llama 3.1",
      "Qwen 2.5",
      "Groq",
      "OpenRouter",
      "llama-cpp-python",
      "GGUF",
      "Vercel AI SDK",
    ],
    "RAG & Vector DBs": [
      "RAG pipelines",
      "Semantic search",
      "Voyage AI and MiniLM embeddings",
      "MongoDB Atlas Vector Search",
      "Qdrant",
    ],
    Languages: ["Python", "TypeScript", "JavaScript", "SQL"],
    "Backend & Frameworks": ["FastAPI", "Node.js", "Express", "Next.js", "React", "REST APIs", "Supabase (PostgreSQL)", "pytest"],
    "Cloud & DevOps": ["AWS (EC2, S3)", "Docker", "GitLab CI/CD", "Jenkins", "GitHub Actions", "Vercel", "Git"],
  },
};
