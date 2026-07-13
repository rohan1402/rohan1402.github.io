# Ask Rohan

A ChatGPT-style "Ask Rohan" portfolio: a real Claude chat that answers questions
about Rohan Pant and renders live React cards (projects, skills, resume, contact)
inline, with a zero-cost scripted engine as the always-on fallback.

Built with Next.js 15 (App Router), TypeScript, Tailwind v4, the Vercel AI SDK
with the Anthropic provider, framer's `motion`, and `vaul`. Deployed on Vercel.

This is the `next-migration` branch. The original vanilla HTML/CSS/JS site lives
in `legacy/` for reference and still serves from `main` via GitHub Pages until
the DNS cutover.

## Architecture

```
Browser
  |
  |  page.tsx (Server Component) renders the SSR shell (sidebar, greeting, chips)
  v
ChatApp.tsx  ("use client")  ------------------------------------------------.
  |  - useChat() from @ai-sdk/react drives the transcript                     |
  |  - typed questions  -> POST /api/chat (live model)                        |
  |  - chips / sidebar  -> scripted answer, ZERO API calls                    |
  |  - on any route error -> silent scripted fallback + "scripted mode" note  |
  |                                                                           |
  |   renders parts:                                                          |
  |     text part        -> streamed model text                              |
  |     tool-<name> part -> ToolRenderer -> the same card the scripted        |
  |     data-scripted    -> Greeting / Fallback / IntentAnswer                |
  v                                                                           |
/api/chat/route.ts  (Node, maxDuration 30)                                    |
  |  1. no ANTHROPIC_API_KEY            -> 503 { fallback: true } ------------>|  scripted
  |  2. checkRateLimit(ip)  (lib/ratelimit.ts)                                |
  |       per-IP 8/min + 40/day, global 300/day (Upstash)                     |
  |       not ok                        -> 429 { fallback: true } ----------->|  scripted
  |  3. cap each user message to 400 chars, keep last 3 turns                 |
  |  4. streamText(claude-haiku-4-5, tools, cached system) ------------------.|
  v                                                                          v|
  Anthropic  <----  system prompt built from src/data/rohan.ts (cached)   ---'

Single source of truth: src/data/rohan.ts
  -> the system prompt (systemPrompt.ts)
  -> every tool's data (tools.ts)
  -> every rendered card (components/*)
  -> the scripted engine's answers (lib/scripted.ts + components/Answers.tsx)
```

### The three fallback layers

1. **Live model** — typed questions hit `/api/chat`, which streams Claude with
   tool calls. Tools return data from `rohan.ts`; the client maps each tool to a
   React card.
2. **Scripted engine** — the four initial chips and the sidebar topics render
   pre-baked answers with **zero API calls**. This is the same keyword engine as
   the original site (`lib/scripted.ts`), rendered by the same card components.
3. **Silent degradation** — if the route returns non-2xx for any reason (no key,
   rate limit, error), the client silently serves the scripted answer for that
   question and shows a small "Running in scripted mode right now." note. It
   fires a `fallback-served` analytics event.

So the site is fully usable with **no API key at all** (scripted mode), and
upgrades to the live model when a key (and Upstash, in production) is present.

## Environment variables

Copy `.env.example` to `.env.local` (gitignored, never commit it).

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | for the live model | Without it, every question is scripted. |
| `UPSTASH_REDIS_REST_URL` | in production | Rate limiting + the global daily cap. |
| `UPSTASH_REDIS_REST_TOKEN` | in production | Paired with the URL above. |
| `NEXT_PUBLIC_GOATCOUNTER_CODE` | optional | GoatCounter site code; unset = analytics is a no-op. |

**Fail-closed:** in **production**, if the Upstash vars are missing, the route
fails closed to scripted mode for everyone (this bounds API spend even if the
vars are forgotten). So the live model in production needs **both** the Anthropic
key **and** the two Upstash vars. Local dev only needs the Anthropic key (it uses
a best-effort in-memory limiter).

## Local development

```bash
pnpm install
pnpm dev            # http://localhost:3000, scripted mode with no key

# to exercise the live model locally, add your key first:
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
pnpm dev
```

```bash
pnpm build          # production build + typecheck
pnpm start          # serve the production build
```

Note: the WebGL fluid hero renders only in a real browser (it needs a GPU and a
foreground tab). It is disabled on touch devices and under
`prefers-reduced-motion`, and degrades to nothing if WebGL is unavailable.

## Deploy checklist (Vercel)

1. **Create the project**: Vercel -> Add New Project -> import
   `rohan1402/rohan1402.github.io`. Set the **Production Branch** to
   `next-migration` so it never builds `main`.
2. **Env vars** (Project Settings -> Environment Variables): add
   `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
   and optionally `NEXT_PUBLIC_GOATCOUNTER_CODE`. Redeploy.
3. **Cap spend**: in the Anthropic Console, set a monthly spend limit / budget
   alert. The global 300/day cap is a second guardrail, not a billing limit.
4. **Verify** on the `*.vercel.app` URL: live answers stream, tools render cards,
   scripted fallback works, mobile + both themes look right.
5. **DNS cutover** (do this only after verifying): point `www.rohanpant.com` and
   the apex at Vercel, add both to the Vercel project, and set up the www <-> apex
   redirect. TLS provisions after the record resolves to Vercel.
6. **Close the old door**: after the cutover, **remove the domain from GitHub
   Pages and delete the `CNAME` file** so there is no dangling Pages claim
   (subdomain-takeover hygiene). Keep GitHub Pages live until step 4 passes.

## Do not

- Do not modify `main` before the cutover: GitHub Pages serves it and it must
  stay live. It cannot serve this app (it is a Next.js server app), so merging it
  in early would take the live site down.
- Do not commit `.env.local` or any key.
