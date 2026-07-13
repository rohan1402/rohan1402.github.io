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
  blurb: string;
  stack: string[];
  url: string;
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
  phone: string;
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
  availability: string;
  contact: Contact;
  projects: Project[];
  experience: Experience[];
  skills: Record<string, string[]>;
}

export const ROHAN: Rohan = {
  name: "Rohan Pant",
  title: "AI / ML Engineer",
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
