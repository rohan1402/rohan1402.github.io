/* ============================================================================
   app.js — DOM wiring for "Ask Rohan".
   Depends on globals from data.js: ROHAN, INTENTS, GREETING, INITIAL_CHIPS, esc.
   Vanilla JS, no modules (so it runs straight from file://).
   ============================================================================ */

(function () {
  "use strict";

  const messages = document.getElementById("messages");
  const chipsBox = document.getElementById("chips");
  const form = document.getElementById("input-form");
  const input = document.getElementById("input");
  const themeBtn = document.getElementById("theme-btn");

  // Friendly phrasing shown as the "user message" when a button/chip is tapped.
  const PROMPTS = {
    about: "Who is Rohan?",
    projects: "Show me his projects",
    patchwork: "Tell me about Patchwork",
    agentically: "Tell me about Agentically",
    llm: "Tell me about the LLM benchmarking project",
    f1: "Tell me about F1 Race Rewind",
    experience: "What's his experience?",
    education: "Where did he study?",
    skills: "What's his tech stack?",
    resume: "Can I see his resume?",
    availability: "Is he open to work?",
    contact: "How do I get in touch?",
    easter: "Wait, are you really AI?",
  };

  const intentById = (id) => INTENTS.find((i) => i.id === id);

  /* ----------------------------- Rendering ------------------------------- */
  function scrollDown() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addUser(text) {
    const wrap = document.createElement("div");
    wrap.className = "msg user";
    wrap.innerHTML = `<div class="text">${esc(text)}</div>`;
    messages.appendChild(wrap);
    scrollDown();
  }

  function addBot(html) {
    const wrap = document.createElement("div");
    wrap.className = "msg bot";
    wrap.innerHTML = `<span class="avatar"><img src="assets/rohan-avatar.jpg" alt="Rohan" onerror="this.parentNode.textContent='R'"></span><div class="text">${html}</div>`;
    messages.appendChild(wrap);
    scrollDown();
  }

  function showTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg bot typing-msg";
    wrap.innerHTML =
      `<span class="avatar"><img src="assets/rohan-avatar.jpg" alt="Rohan" onerror="this.parentNode.textContent='R'"></span><div class="text"><div class="typing"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function setChips(ids) {
    chipsBox.innerHTML = (ids || [])
      .map((id) => `<button class="chip" data-chip="${id}">${esc(PROMPTS[id] || id)}</button>`)
      .join("");
  }

  /* --------------------------- Conversation ------------------------------ */
  function respond(userText, intent) {
    addUser(userText);
    const typing = showTyping();
    const delay = 480 + Math.min(700, userText.length * 14);
    setTimeout(() => {
      typing.remove();
      if (intent) {
        addBot(intent.answer());
        setChips(intent.followups);
      } else {
        addBot(fallbackHTML());
        setChips(["about", "projects", "skills", "contact"]);
      }
    }, delay);
  }

  function fallbackHTML() {
    return `<p>I'm not totally sure what you meant, but I know plenty about Rohan. Try one of these:</p>
      <p>his <strong>projects</strong>, <strong>experience</strong>, <strong>skills</strong>,
      <strong>education</strong>, <strong>availability</strong>, or how to <strong>contact</strong> him.</p>`;
  }

  function triggerIntent(id) {
    const intent = intentById(id);
    if (!intent) return;
    respond(PROMPTS[id] || intent.label, intent);
  }

  function matchIntent(text) {
    const q = " " + text.toLowerCase() + " ";
    let best = null;
    let bestScore = 0;
    for (const intent of INTENTS) {
      let score = 0;
      for (const kw of intent.keywords) {
        if (q.includes(kw)) {
          // weight by specificity: longer / multi-word keywords beat generic short ones,
          // so "tell me about patchwork" matches patchwork, not the generic about intent.
          score += kw.length + (kw.includes(" ") ? 2 : 0);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    }
    return bestScore > 0 ? best : null;
  }

  function newChat() {
    messages.innerHTML = "";
    addBot(GREETING);
    setChips(INITIAL_CHIPS);
    input.focus();
  }

  /* ------------------------------ Theme ---------------------------------- */
  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    const isDark =
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (themeBtn) themeBtn.textContent = isDark ? "Light" : "Dark";
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const isDark =
      cur === "dark" ||
      (!cur && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    try { localStorage.setItem("ask-rohan-theme", next); } catch (e) {}
    applyTheme(next);
  }

  /* --------------------------- Plain résumé ------------------------------ */
  function buildPlain() {
    const c = ROHAN.contact;
    const exp = ROHAN.experience
      .map(
        (e) => `
        <div class="r-item">
          <div class="r-item-head"><strong>${esc(e.role)}, ${esc(e.org)}</strong>
            <span class="r-item-when">${esc(e.when)}</span></div>
          <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>`
      )
      .join("");
    const projects = ROHAN.projects
      .map(
        (p) => `
        <div class="r-item">
          <div class="r-item-head"><strong>${esc(p.name)}</strong>
            <a class="r-item-when" href="${p.url}" target="_blank" rel="noopener">repo &#8599;</a></div>
          <div>${esc(p.blurb)}</div>
          ${pills(p.stack)}
        </div>`
      )
      .join("");
    const skills = Object.entries(ROHAN.skills)
      .map(([g, items]) => `<div class="skill-group"><div class="skill-label">${esc(g)}</div>${pills(items)}</div>`)
      .join("");

    return `<div class="plain-wrap">
      <div class="r-head">
        <img class="r-photo" src="assets/rohan-photo.jpg" alt="Rohan Pant" onerror="this.style.display='none'">
        <div class="r-head-text">
          <h1>${esc(ROHAN.name)}</h1>
          <div class="r-sub">${esc(ROHAN.title)}. ${esc(ROHAN.tagline)}</div>
          <div class="r-links">
            <a href="mailto:${c.email}">${esc(c.email)}</a>
            <a href="${c.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
            <a href="${c.github}" target="_blank" rel="noopener">GitHub</a>
            <span>${esc(c.phone)}</span>
          </div>
        </div>
      </div>
      <div class="r-section"><h2>Summary</h2>
        <p>${esc(ROHAN.summary)} ${esc(ROHAN.availability)}</p>
      </div>
      <div class="r-section"><h2>Experience</h2>${exp}</div>
      <div class="r-section"><h2>Education</h2>
        ${ROHAN.education
          .map(
            (ed) => `<div class="r-item"><div class="r-item-head">
            <strong>${esc(ed.degree)}, ${esc(ed.school)}</strong>
            <span class="r-item-when">${esc(ed.when)}${ed.detail ? ", " + esc(ed.detail) : ""}</span></div></div>`
          )
          .join("")}
      </div>
      <div class="r-section"><h2>Projects</h2>${projects}</div>
      <div class="r-section"><h2>Skills</h2>${skills}</div>
    </div>`;
  }

  function showPlain() {
    const host = document.getElementById("plain-content");
    if (!host.dataset.built) {
      host.innerHTML = buildPlain();
      host.dataset.built = "1";
    }
    document.getElementById("plain-view").hidden = false; // clear the initial hidden attr
    document.body.classList.add("plain-mode");
  }
  function showChat() {
    document.getElementById("plain-view").hidden = true;
    document.body.classList.remove("plain-mode");
  }

  /* --------------------------- Sidebar (mobile) -------------------------- */
  function openSidebar() {
    document.body.classList.add("sidebar-open");
    document.getElementById("scrim").hidden = false;
  }
  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    document.getElementById("scrim").hidden = true;
  }

  /* ------------------------------ Actions -------------------------------- */
  function handleAction(action) {
    switch (action) {
      case "new-chat": newChat(); closeSidebar(); break;
      case "plain": showPlain(); closeSidebar(); break;
      case "chat": showChat(); break;
      case "theme": toggleTheme(); break;
      case "open-sidebar": openSidebar(); break;
      case "close-sidebar": closeSidebar(); break;
    }
  }

  /* ------------------------------ Events --------------------------------- */
  document.addEventListener("click", (e) => {
    const intentBtn = e.target.closest("[data-intent]");
    if (intentBtn) { triggerIntent(intentBtn.dataset.intent); closeSidebar(); return; }
    const chip = e.target.closest("[data-chip]");
    if (chip) { triggerIntent(chip.dataset.chip); return; }
    const action = e.target.closest("[data-action]");
    if (action) { handleAction(action.dataset.action); }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    respond(text, matchIntent(text));
  });

  /* ------------------------------- Boot ---------------------------------- */
  let saved = null;
  try { saved = localStorage.getItem("ask-rohan-theme"); } catch (e) {}
  applyTheme(saved);
  newChat();
})();
