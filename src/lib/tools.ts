import { tool } from "ai";
import { z } from "zod";
import { ROHAN } from "@/data/rohan";

/**
 * Chat tools. Each returns data straight from rohan.ts; the client maps each
 * tool name to a React component (see ToolRenderer) and renders it inline in
 * the stream. The model calls these instead of restating data as plain text.
 */

const noInput = z.object({});

export const PROJECT_IDS = ["patchwork", "agentically", "llm", "f1"] as const;

export const tools = {
  getPresentation: tool({
    description:
      "Show the about card (avatar, name, title, focus areas). Use for who-is-Rohan / introduce-yourself questions.",
    inputSchema: noInput,
    execute: async () => ({
      name: ROHAN.name,
      title: ROHAN.title,
      tagline: ROHAN.tagline,
      focus: ROHAN.focus,
    }),
  }),
  getProjects: tool({
    description: "Show all of Rohan's projects as a set of cards.",
    inputSchema: noInput,
    execute: async () => ({ projects: ROHAN.projects }),
  }),
  getProject: tool({
    description:
      "Show a single project by id when the user asks about a specific one.",
    inputSchema: z.object({ id: z.enum(PROJECT_IDS) }),
    execute: async ({ id }) => ({
      project: ROHAN.projects.find((p) => p.id === id) ?? null,
    }),
  }),
  getSkills: tool({
    description: "Show Rohan's grouped skills grid.",
    inputSchema: noInput,
    execute: async () => ({ skills: ROHAN.skills }),
  }),
  getExperience: tool({
    description: "Show Rohan's work experience timeline.",
    inputSchema: noInput,
    execute: async () => ({ experience: ROHAN.experience }),
  }),
  getResume: tool({
    description: "Show the resume card with a PDF download link.",
    inputSchema: noInput,
    execute: async () => ({ available: true }),
  }),
  getContact: tool({
    description: "Show Rohan's contact card (email, LinkedIn, GitHub, phone).",
    inputSchema: noInput,
    execute: async () => ({ contact: ROHAN.contact }),
  }),
  getAvailability: tool({
    description: "Show Rohan's internship availability card.",
    inputSchema: noInput,
    execute: async () => ({ availability: ROHAN.availability }),
  }),
};

export type ToolName = keyof typeof tools;
