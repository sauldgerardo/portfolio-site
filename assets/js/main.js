/* Every LinkedIn / email / résumé link on the page is wired from here. */

const LINKS = {
  linkedin: "https://www.linkedin.com/in/saulgerardo/",
  github:   "https://github.com/sauldgerardo",
  x:        "https://x.com/saul_ito_",

  // No "mailto:" prefix — that's added below.
  email: "sauldgerardo@gmail.com",
  emailAlt: "sgerardo@iastate.edu",   // set to "" to hide it everywhere
  emailSubject: "Hello from your portfolio site",

  resume: "assets/resume/resume.pdf",
};

(function () {
  "use strict";

  /* ── Wire the links into the page ── */
  const subject = "?subject=" + encodeURIComponent(LINKS.emailSubject);

  const hrefs = {
    linkedin:  LINKS.linkedin,
    github:    LINKS.github,
    x:         LINKS.x,
    email:     "mailto:" + LINKS.email + subject,
    "email-alt": LINKS.emailAlt ? "mailto:" + LINKS.emailAlt + subject : "",
    resume:    LINKS.resume,
  };

  // Elements that display an address/handle as text rather than link it
  const texts = {
    "email-text":     LINKS.email,
    "email-alt-text": LINKS.emailAlt,
    "github-text":    LINKS.github.replace(/^https?:\/\/(www\.)?github\.com\//, ""),
    "x-text":         "@" + LINKS.x.replace(/^https?:\/\/(www\.)?x\.com\//, "").replace(/\/$/, ""),
    "linkedin-text":  "/in/" + LINKS.linkedin.replace(/^.*\/in\//, "").replace(/\/$/, ""),
  };

  document.querySelectorAll("[data-link]").forEach(function (el) {
    const key = el.dataset.link;

    if (key in texts) {
      el.textContent = texts[key];
      return;
    }
    if (hrefs[key]) {
      el.setAttribute("href", hrefs[key]);
    } else {
      // No value configured (e.g. emailAlt left blank). Drop the whole row
      // only if this is its only link, otherwise just drop this one link so
      // we don't take a sibling address down with it.
      const row = el.closest("li");
      if (row && row.querySelectorAll("a[data-link]").length <= 1) row.remove();
      else el.remove();
    }
  });

  /* ── Current year in the footer ── */
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Theme toggle (persists in localStorage) ── */
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  /* ── Nav: solid background once you scroll past the top ── */
  const nav = document.getElementById("nav");
  const onScroll = function () {
    nav.classList.toggle("is-stuck", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── Mobile menu ── */
  const burger = document.getElementById("burger");
  const links = document.querySelector(".nav__links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      const open = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── Logo ticker ──
     Duplicates the list once so the -50% scroll loops seamlessly, then
     resolves each <li data-logo="..."> to an image file. You only ever edit
     the original <li> items in index.html. */
  const track = document.getElementById("tickerTrack");

  if (track) {
    // Try each extension in turn; first one that loads wins. If none exist,
    // the item keeps its text wordmark.
    const EXTS = ["svg", "png", "jpg", "jpeg", "webp"];

    // Duplicate FIRST, then resolve logos across originals and copies together.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Array.prototype.slice.call(track.children).forEach(function (li) {
        const copy = li.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      });
    }

    Array.prototype.forEach.call(track.children, function (li) {
      const slug = li.dataset.logo;
      const name = li.textContent.trim();
      if (!slug) return;

      li.classList.add("tk--text");

      let i = 0;
      const probe = new Image();
      probe.onload = function () {
        li.classList.remove("tk--text");
        li.textContent = "";
        const img = document.createElement("img");
        img.src = probe.src;
        img.alt = name;
        li.appendChild(img);
      };
      probe.onerror = function () {
        i += 1;
        if (i < EXTS.length) probe.src = "assets/img/logos/" + slug + "." + EXTS[i];
        // else: leave the text wordmark in place
      };
      probe.src = "assets/img/logos/" + slug + "." + EXTS[0];
    });
  }

  /* ── Dropdown menus ──
     Opens on hover (desktop) and on click/tap or keyboard (everywhere).
     Closes on outside click, Escape, or after picking an item. */
  const dropdowns = Array.prototype.slice.call(document.querySelectorAll(".dropdown"));
  const hoverCapable = window.matchMedia("(hover: hover) and (min-width: 761px)");

  const closeAll = function (except) {
    dropdowns.forEach(function (d) {
      if (d === except) return;
      d.classList.remove("is-open");
      const t = d.querySelector(".dropdown__trigger");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  };

  dropdowns.forEach(function (d) {
    const trigger = d.querySelector(".dropdown__trigger");
    if (!trigger) return;

    const setOpen = function (open) {
      d.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      if (open) closeAll(d);
    };

    trigger.addEventListener("click", function (e) {
      // On desktop the "Experience" trigger is also a link to #experience.
      // Only hijack the click when the menu isn't already open on hover.
      if (!hoverCapable.matches || trigger.tagName === "BUTTON") {
        e.preventDefault();
        setOpen(!d.classList.contains("is-open"));
      }
    });

    d.addEventListener("mouseenter", function () {
      if (hoverCapable.matches) setOpen(true);
    });
    d.addEventListener("mouseleave", function () {
      if (hoverCapable.matches) setOpen(false);
    });

    // Close once a menu item is chosen
    d.querySelectorAll(".dropdown__menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) closeAll(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll(null);
  });

  /* ── Selected Work category filter ──
     Nav items with data-filter show/hide showcase cards by data-cat.
     "all" shows everything. Cards stay visible if JS is off. */
  const showcase = document.getElementById("showcase");
  if (showcase) {
    const cards = Array.prototype.slice.call(showcase.querySelectorAll(".show"));
    document.querySelectorAll("[data-filter]").forEach(function (ctrl) {
      ctrl.addEventListener("click", function () {
        const f = ctrl.dataset.filter;
        cards.forEach(function (c) {
          c.classList.toggle("is-hidden", f !== "all" && c.dataset.cat !== f);
        });
      });
    });
  }

  /* ── Scroll reveal ──
     The hidden state lives behind .js-reveal on <html>, and that class is only
     added once we know we can actually reveal things again. If this block
     never runs — JS disabled, old browser, a throw further up — the class is
     absent and every .reveal element renders at rest. The page must never be
     able to end up permanently invisible. */
  const reveals = document.querySelectorAll(".reveal");
  const wantsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reveals.length && wantsMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");

    const revealer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target); // one-shot; no re-hide on scroll up
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );

    reveals.forEach(function (el) {
      revealer.observe(el);
    });
  }

  /* ── Highlight the nav link for the section you're currently reading ── */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (s) {
      spy.observe(s);
    });
  }
})();
