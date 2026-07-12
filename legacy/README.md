# Ask Rohan — an AI-chat-style portfolio

A personal portfolio for **Rohan Pant** built as an homage to the ChatGPT/Claude chat UI:
visitors "chat" with an AI assistant that answers about Rohan's background, projects, skills,
and contact info.

- **Zero dependencies.** Pure HTML/CSS/vanilla JS — no framework, no build step, no WebGL.
- **Runs anywhere.** Open `index.html` directly, or host it on any static host.
- **Scripted (free) today.** Answers come from a local knowledge base in `data.js`.
- **Real-AI ready.** The intent layer is a drop-in fallback for a future Claude API endpoint.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page shell — sidebar, chat, composer, plain-résumé view |
| `styles.css` | ChatGPT/Claude-style theme · light + dark · responsive |
| `app.js` | Chat rendering, typing animation, intent matching, UI wiring |
| `data.js` | All of Rohan's content + the scripted Q&A knowledge base |
| `assets/` | Favicon + résumé PDF |

## Run locally
Just open `index.html` in any browser. (Or serve it: `python3 -m http.server` then visit the URL.)

## Edit content
Everything lives in `data.js` — update the `ROHAN` object (bio, projects, skills, contact) and the
`INTENTS` array (what the assistant can answer). One source of truth feeds both the chat and the
plain-résumé view.

## Deploy
Static site — works on **Vercel** (`vercel` / git push) or **GitHub Pages** (push to a repo, enable
Pages). Free auto-SSL on both.

## Phase 2 (optional): wire a real Claude API
Add a serverless function (Vercel Function or Cloudflare Worker) that calls the Anthropic API with
Rohan's résumé as the system prompt; have the composer POST to it. Keep the API key server-side as an
env secret. The scripted engine in `data.js` stays as the offline fallback.

## To-do for Rohan
- Drop a real `assets/Rohan_Pant_Resume.pdf` (a placeholder is included).
- Confirm the contact email to feature (currently `rp1610@scarletmail.rutgers.edu`).
