/* ============================================================================
   mascot.js: a playful Shiba Inu that lives in the corner of the portfolio.
   Soft-shaded SVG (looks 3D, weighs ~nothing). Vanilla JS, self-contained.
   Recruiter-safe: dismissible (persisted), respects reduced-motion, pauses
   when the tab is hidden, and never overlays interactive UI.
   ============================================================================ */
(function () {
  "use strict";

  var KEY = "ask-rohan-mascot-hidden";
  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SHIBA =
    '<svg viewBox="0 0 120 120" aria-hidden="true">' +
    '<defs>' +
    '<radialGradient id="shBody" cx="40%" cy="32%" r="75%">' +
    '<stop offset="0%" stop-color="#f2c592"/><stop offset="55%" stop-color="#d99a52"/><stop offset="100%" stop-color="#b9772f"/>' +
    '</radialGradient>' +
    '<radialGradient id="shHead" cx="42%" cy="30%" r="75%">' +
    '<stop offset="0%" stop-color="#f5cd9e"/><stop offset="60%" stop-color="#dca25b"/><stop offset="100%" stop-color="#c2842f"/>' +
    '</radialGradient>' +
    '</defs>' +
    '<ellipse cx="60" cy="115" rx="30" ry="5" fill="rgba(0,0,0,.15)"/>' +
    '<g class="tail"><path d="M86 84 q22 -6 16 -24 q-2 14 -16 16 z" fill="#e7ac63"/>' +
    '<animateTransform attributeName="transform" type="rotate" values="-7 88 84; 9 88 84; -7 88 84" dur="1.2s" repeatCount="indefinite"/></g>' +
    '<path d="M60 58 C40 58 32 76 34 94 C35 106 45 110 60 110 C75 110 85 106 86 94 C88 76 80 58 60 58 Z" fill="url(#shBody)"/>' +
    '<path d="M60 70 C52 70 48 82 49 96 C50 104 55 107 60 107 C65 107 70 104 71 96 C72 82 68 70 60 70 Z" fill="#fff6ea"/>' +
    '<ellipse cx="50" cy="106" rx="8" ry="6" fill="#fff6ea"/>' +
    '<ellipse cx="70" cy="106" rx="8" ry="6" fill="#fff6ea"/>' +
    '<g class="paw"><ellipse cx="85" cy="88" rx="7" ry="9" fill="#e0a157"/></g>' +
    '<g class="head">' +
    '<path d="M38 30 L30 6 L52 22 Z" fill="#d99a52"/>' +
    '<path d="M82 30 L90 6 L68 22 Z" fill="#d99a52"/>' +
    '<path d="M40 28 L35 12 L49 23 Z" fill="#6e4422"/>' +
    '<path d="M80 28 L85 12 L71 23 Z" fill="#6e4422"/>' +
    '<circle cx="60" cy="42" r="30" fill="url(#shHead)"/>' +
    '<circle cx="47" cy="32" r="4" fill="#f7ddb6"/>' +
    '<circle cx="73" cy="32" r="4" fill="#f7ddb6"/>' +
    '<ellipse cx="60" cy="52" rx="22" ry="16" fill="#fff6ea"/>' +
    '<g class="eyes">' +
    '<ellipse cx="49" cy="42" rx="4.6" ry="6.2" fill="#2c1d11"/>' +
    '<ellipse cx="71" cy="42" rx="4.6" ry="6.2" fill="#2c1d11"/>' +
    '<circle cx="50.6" cy="39.6" r="1.6" fill="#fff"/>' +
    '<circle cx="72.6" cy="39.6" r="1.6" fill="#fff"/>' +
    '</g>' +
    '<ellipse cx="60" cy="50" rx="3.4" ry="2.6" fill="#2c1d11"/>' +
    '<path d="M60 52 L60 56" stroke="#2c1d11" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M60 56 q-7 7 -13 2" stroke="#2c1d11" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
    '<path d="M60 56 q7 7 13 2" stroke="#2c1d11" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
    '<path d="M57 58 q3 5 6 0 z" fill="#ff8fa3"/>' +
    '</g></svg>';

  var hidden = function () {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  };
  var setHidden = function (v) {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
  };

  // Build DOM
  var host = document.createElement("div");
  host.className = "mascot-host";
  host.innerHTML =
    '<button class="mascot-dismiss" aria-label="Hide the mascot" title="Hide">×</button>' +
    '<div class="mascot-fig" role="img" aria-label="Shiba mascot"><div class="mascot-inner">' +
    SHIBA +
    "</div></div>";
  var restore = document.createElement("button");
  restore.className = "mascot-restore";
  restore.setAttribute("aria-label", "Bring back the mascot");
  restore.title = "Bring back the mascot";
  restore.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' +
    '<circle cx="6.5" cy="10" r="1.9"/><circle cx="11" cy="8" r="2.1"/><circle cx="16" cy="9.5" r="1.9"/>' +
    '<ellipse cx="11" cy="15.5" rx="3.6" ry="3"/></svg>';
  document.body.appendChild(host);
  document.body.appendChild(restore);

  var fig = host.querySelector(".mascot-fig");
  var inner = host.querySelector(".mascot-inner");

  if (reduced) {
    // Strip SMIL so the figure is completely still; CSS animations are disabled via media query.
    host.querySelectorAll("animate, animateTransform").forEach(function (n) { n.remove(); });
  }

  // FX burst (stars / hearts) anchored at the mascot's screen position
  function burst(sym, color) {
    var r = fig.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 6; i++) {
      var s = document.createElement("span");
      s.className = "m-fx";
      s.textContent = sym;
      s.style.color = color;
      s.style.left = cx + "px";
      s.style.top = cy + "px";
      s.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
      document.body.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 1000); })(s);
    }
  }

  // Antics
  var ANTICS = ["a-wave", "a-hop", "a-spin", "a-peekdown", "a-peekside", "a-surprise"];
  var busy = false, last = null, timer = null;

  function play(name) {
    if (busy) return;
    busy = true;
    inner.classList.add(name);
    if (name === "a-surprise") burst("★", "#f5a623");
    var done = function () {
      inner.classList.remove(name);
      inner.removeEventListener("animationend", done);
      busy = false;
    };
    inner.addEventListener("animationend", done);
    // safety net in case animationend doesn't fire
    setTimeout(function () {
      if (inner.classList.contains(name)) { inner.classList.remove(name); busy = false; }
    }, 2400);
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var n;
      do { n = ANTICS[Math.floor(Math.random() * ANTICS.length)]; } while (n === last);
      last = n;
      play(n);
      schedule();
    }, 20000 + Math.random() * 10000);
  }

  // Interactions
  fig.addEventListener("click", function () {
    burst("♥", "#ff6b8b");
    play("a-spin");
  });
  host.querySelector(".mascot-dismiss").addEventListener("click", function (e) {
    e.stopPropagation();
    hide();
  });
  restore.addEventListener("click", show);

  function show() {
    host.style.display = "";
    restore.style.display = "none";
    setHidden(false);
    if (!reduced) schedule();
  }
  function hide() {
    host.style.display = "none";
    restore.style.display = "flex";
    setHidden(true);
    clearTimeout(timer);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) clearTimeout(timer);
    else if (!hidden() && !reduced) schedule();
  });

  // Boot
  if (hidden()) {
    host.style.display = "none";
    restore.style.display = "flex";
  } else if (!reduced) {
    setTimeout(function () { play("a-peekside"); }, 900); // little hello
    schedule();
  }
})();
