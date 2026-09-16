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
  url: string;
  image: string;
  imageAlt: string;
  story?: {
    problem: string;
    build: string;
    result: string;
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
        result:
          "The machinery and security suite passes 89 of 89 checks, while committed behavioral runs score 17 to 21 out of 21 without leaking direct answers.",
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
          "A multi-step Python pipeline that gathers search and citation evidence, compares multiple AI platforms, generates a branded deliverable bundle, and automates prospect enrichment and outreach preparation.",
        result:
          "One system carries an audit from raw business queries to an actionable report, page rewrites, an AI scorecard, and a CRM-ready lead record.",
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
      image: "/assets/projects/patchwork.jpg",
      imageAlt: "Illustration of an agent converting a software bug into a tested pull request",
      story: {
        problem:
          "When a bug is fixed, the regression test that would prevent it from returning is often skipped.",
        build:
          "A GitHub App that receives an issue webhook, reads the repository's test files, generates a targeted regression test with Gemini, and creates the branch, commit, and pull request through Octokit.",
        result:
          "A reviewable test-only pull request that raises coverage without allowing the agent to change production code.",
        previewSteps: ["GitHub issue", "Read test patterns", "Generate test", "Open PR"],
      },
    },
    {
      id: "agentically",
      name: "Agentically",
      category: "Healthcare compliance RAG",
      blurb:
        "AI compliance intelligence that lets healthcare staff search accreditation standards in plain English and get precise, cited answers without digging through PDFs.",
      stack: ["Claude Sonnet", "MongoDB Atlas", "Voyage AI", "Next.js", "Vercel"],
      url: "https://github.com/rohan1402/agentically",
      image: "/assets/projects/agentically.jpg",
      imageAlt: "Illustration of healthcare standards becoming a grounded cited answer",
      story: {
        problem:
          "Accreditation standards live across long documents, making precise answers slow to find and difficult to verify.",
        build:
          "A retrieval system using Claude Sonnet, MongoDB Atlas vector search, and Voyage AI embeddings.",
        result:
          "The system indexes 1,919 standards chunks and passed 13 of 13 test queries across semantic, exact-citation, browse, and hybrid retrieval modes.",
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
          "A TypeScript evaluation and RAG harness that serves one quantized model at a time through llama-cpp-python and supports deterministic and LLM-judge scoring.",
        result:
          "Reproducible comparisons across accuracy, latency, retrieval hit rate, and citation validity for local models and a Groq cloud baseline.",
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
