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
        "Autonomous agent that ingests a bug report, generates regression tests, runs them in an E2B sandbox, and opens a GitHub PR with passing tests, end to end with no human in the loop. Built at the Zero to Agent hackathon (Vercel x DeepMind).",
      stack: ["Gemini", "E2B Sandbox", "GitHub API", "Next.js", "Tool Use"],
      url: "https://github.com/rohan1402/patchwork",
      story: {
        problem:
          "A bug report rarely arrives with the regression test and validated fix a maintainer needs.",
        build:
          "A Gemini-powered workflow that writes the test, runs it inside E2B, iterates in the sandbox, and opens a GitHub pull request.",
        result:
          "A solo-built, end-to-end agent that completes the workflow without a human in the loop.",
        previewSteps: ["Bug report", "Regression test", "E2B sandbox", "GitHub PR"],
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
      story: {
        problem:
          "Accreditation standards live across long documents, making precise answers slow to find and difficult to verify.",
        build:
          "A retrieval system using Claude Sonnet, MongoDB Atlas vector search, and Voyage AI embeddings.",
        result:
          "Healthcare staff can search in plain English and receive focused answers with supporting citations.",
        previewSteps: ["Question", "Vector search", "Claude", "Cited answer"],
      },
    },
    {
      id: "llm",
      name: "Rutgers LLM Benchmarking",
      category: "Local model evaluation",
      blurb:
        "Local LLM evaluation pipeline running 4 GGUF Q4_K_M models through a custom RAG harness, with Groq-as-judge scoring. Built at Rutgers.",
      stack: ["llama-cpp-python", "LangChain", "Groq", "Python"],
      url: "https://github.com/rohan1402/llm-playground",
      story: {
        problem:
          "Local language models need a consistent retrieval and scoring setup before their quality can be compared fairly.",
        build:
          "A custom RAG harness that runs four quantized GGUF models locally and uses Groq as the evaluation judge.",
        result:
          "A repeatable pipeline for comparing model behavior through the same retrieval and scoring workflow.",
        previewSteps: ["4 local models", "RAG harness", "Groq judge", "Benchmark"],
      },
    },
    {
      id: "f1",
      name: "F1 Race Rewind",
      category: "Interactive race simulation",
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
