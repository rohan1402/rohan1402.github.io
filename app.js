/* ============================================================================
   app.js: DOM wiring for "Ask Rohan".
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

  /* ----------------------------- Welcome --------------------------------- */
  // Centered hero shown on a fresh chat: avatar, tagline, availability badge,
  // and a few big suggested questions. Collapses into the normal chat the
  // moment the visitor asks something or taps a suggestion.
  const WELCOME_QS = [
    { id: "about", q: "Who is Rohan?" },
    { id: "projects", q: "What projects is he most proud of?" },
    { id: "skills", q: "What's his tech stack?" },
    { id: "availability", q: "Is he open to work?" },
  ];

  function renderWelcome() {
    const cards = WELCOME_QS.map(
      (s) =>
        `<button class="welcome-q" data-intent="${s.id}">
           <span>${esc(s.q)}</span><span class="welcome-q-go" aria-hidden="true">&rsaquo;</span>
         </button>`
    ).join("");
    messages.innerHTML = `
      <div class="welcome">
        <span class="welcome-avatar"><img src="assets/rohan-avatar.jpg" alt="Rohan Pant" onerror="this.parentNode.textContent='R'"></span>
        <h1 class="welcome-title">Hi, I'm Rohan's AI twin</h1>
        <p class="welcome-sub">Ask me anything about his projects, experience, and skills.</p>
        <div class="welcome-badge"><span class="welcome-dot"></span> Available for internships</div>
        <div class="welcome-qs">${cards}</div>
      </div>`;
  }

  // Smoothly slide the hero up and out, then run `done`. Falls back to an
  // instant swap when reduced motion is requested or the hero isn't present.
  function exitWelcome(done) {
    const hero = messages.querySelector(".welcome");
    let called = false;
    const finish = () => {
      if (called) return;
      called = true;
      document.body.classList.remove("welcome-mode");
      messages.innerHTML = "";
      if (done) done();
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Drive the fade with the Web Animations API. A CSS class + transition is
    // unreliable here: the click's own style invalidation gets batched into a
    // single recalc, so the transition never arms. animate() is deterministic.
    if (!hero || reduce || typeof hero.animate !== "function") { finish(); return; }
    const anim = hero.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-22px)" },
      ],
      { duration: 280, easing: "ease", fill: "forwards" }
    );
    anim.onfinish = finish;
    anim.oncancel = finish;
    setTimeout(finish, 360); // safety net if the animation never resolves
  }

  /* --------------------------- Conversation ------------------------------ */
  // The actual user -> bot exchange, with no welcome-state handling.
  function beginExchange(userText, intent) {
    addUser(userText);
    const typing = showTyping();
    const delay = 480 + Math.min(700, userText.length * 14);
    setTimeout(() => {
      typing.remove();
      if (intent) {
        addBot(intent.answer());
        setChips(intent.followups);
      } else {
        addBot(fallbackHTML(userText));
        setChips(["about", "projects", "skills", "contact"]);
      }
    }, delay);
  }

  function respond(userText, intent) {
    // From the hero: animate it away first, then start the conversation.
    if (document.body.classList.contains("welcome-mode")) {
      exitWelcome(() => beginExchange(userText, intent));
    } else {
      beginExchange(userText, intent);
    }
  }

  function fallbackHTML(question) {
    const c = ROHAN.contact;
    // Pre-fill an email with the visitor's actual question so reaching Rohan
    // is a single click. Falls back to a plain greeting if there's no text.
    const q = String(question || "").trim();
    const subject = encodeURIComponent("Question from your website");
    const body = encodeURIComponent(
      q
        ? `Hi Rohan,\n\nI was on your site and wanted to ask:\n"${q}"\n\n`
        : "Hi Rohan,\n\nI had a question for you:\n\n"
    );
    const mailto = `mailto:${c.email}?subject=${subject}&body=${body}`;
    return `<p>That's a good question, and one I don't have scripted yet. I'm a lightweight assistant, so I can't answer everything on my own.</p>
      <p><strong>The fastest way to get a real answer is to ask Rohan directly.</strong> He usually replies quickly.</p>
      <p>
        <a class="btn" href="${mailto}">Email Rohan</a>
        <a class="btn btn-ghost" href="${esc(c.linkedin)}" target="_blank" rel="noopener">Message on LinkedIn</a>
      </p>
      <p style="color:var(--text-muted)">Or explore what I do know: his <strong>projects</strong>, <strong>experience</strong>, <strong>skills</strong>, <strong>education</strong>, <strong>availability</strong>, or how to <strong>contact</strong> him.</p>`;
  }

  function triggerIntent(id) {
    const intent = intentById(id);
    if (!intent) return;
    if (window.askRohanTrack) window.askRohanTrack.topic(id);
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
    document.body.classList.add("welcome-mode");
    renderWelcome();
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
    if (window.askRohanTrack) window.askRohanTrack.question(text);
    respond(text, matchIntent(text));
  });

  /* ------------------------------- Boot ---------------------------------- */
  let saved = null;
  try { saved = localStorage.getItem("ask-rohan-theme"); } catch (e) {}
  applyTheme(saved);
  newChat();
})();
