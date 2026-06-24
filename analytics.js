/* ============================================================================
   analytics.js: lightweight visitor + question tracking for "Ask Rohan".

   Backed by GoatCounter (https://www.goatcounter.com) - free for personal use,
   privacy-friendly, no cookies, no consent banner required.

   GoatCounter automatically records each PAGE VIEW (count, referrer, country,
   browser, device, screen size). This file adds CUSTOM EVENTS on top so Rohan
   can also see:
     - every QUESTION a visitor types into the chat
     - which TOPIC buttons/chips get clicked (Projects, Resume, Contact, ...)
     - resume PDF downloads
     - outbound clicks (email, LinkedIn, GitHub, project repos)

   Everything here is anonymous and aggregate - no names, no emails, no IPs
   tied to a person. It is a safe no-op when GoatCounter is not loaded
   (e.g. opened from file://, blocked by an ad blocker, or before the script
   finishes loading), so the site never breaks.

   SETUP (one time, ~2 minutes):
     1. Sign up at https://www.goatcounter.com and pick a "code"
        (the subdomain), e.g. "rohanpant" -> rohanpant.goatcounter.com
     2. In index.html, replace MYCODE in the data-goatcounter URL with it.
   That's it. Visit https://YOURCODE.goatcounter.com to see the dashboard.
   ============================================================================ */

(function () {
  "use strict";

  // Send a custom event to GoatCounter. Retries briefly in case the count.js
  // script is still loading when an early event fires. Never throws.
  function send(path, title, attempt) {
    try {
      var gc = window.goatcounter;
      if (gc && typeof gc.count === "function") {
        gc.count({ path: path, title: title || path, event: true });
        return;
      }
    } catch (e) {
      return; // give up silently on any error
    }
    // count.js not ready yet: retry a couple of times, then give up.
    attempt = attempt || 0;
    if (attempt < 5) {
      setTimeout(function () { send(path, title, attempt + 1); }, 400);
    }
  }

  // Normalize free text into a short, single-line, length-capped event label.
  function clean(text, max) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max || 200);
  }

  // Public API used by app.js and the click handler below.
  window.askRohanTrack = {
    // Raw question typed into the chat composer.
    question: function (text) {
      var q = clean(text);
      if (q) send("question: " + q, "Q: " + q);
    },
    // A sidebar/chip topic was opened (e.g. "projects", "resume").
    topic: function (id) {
      if (id) send("topic: " + id, "Topic: " + id);
    },
    // Generic escape hatch for any other event.
    event: send,
  };

  // ---------------------------------------------------------------------------
  // Automatic click tracking for links/buttons, via event delegation. This
  // keeps the rest of the app clean - we just read the DOM the chat renders.
  // ---------------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a[href]");
    if (link) {
      var href = link.getAttribute("href") || "";

      // Resume PDF download.
      if (/Resume.*\.pdf/i.test(href)) {
        send("resume-download", "Resume downloaded");
        return;
      }
      // Contact / social outbound clicks.
      if (/^mailto:/i.test(href)) { send("contact: email", "Clicked email"); return; }
      if (/linkedin\.com/i.test(href)) { send("contact: linkedin", "Clicked LinkedIn"); return; }
      if (/github\.com/i.test(href)) { send("outbound: github", "Clicked GitHub: " + clean(href, 120)); return; }

      // Any other external link (e.g. project repos already covered by github above).
      if (/^https?:\/\//i.test(href) && link.target === "_blank") {
        send("outbound: " + clean(href, 120), "Outbound: " + clean(href, 120));
      }
    }
  });
})();
