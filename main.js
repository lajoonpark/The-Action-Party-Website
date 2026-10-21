/* The Action Party: motion
   Every section owns one gesture. Shared rules: nothing moves unless it is
   already in view, everything is reversible, and prefers-reduced-motion
   removes the movement without removing the content. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  /* ---------- Masthead: stuck state, reading progress ---------- */

  const header = $("[data-masthead]");
  const progress = $("[data-progress]");

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-stuck", y > 8);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  const toggle = $("[data-nav-toggle]");
  const nav = $("[data-nav]");

  const setNav = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    setNav(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setNav(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 48.0625rem)").addEventListener("change", (event) => {
    if (event.matches) setNav(false);
  });

  /* ---------- Which section are we in ---------- */

  const sections = $$("[data-section]");
  const navLinks = new Map(
    $$("[data-nav] a[href^='#']").map((a) => [a.getAttribute("href").slice(1), a])
  );

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove("is-current"));
        const link = navLinks.get(entry.target.id);
        if (link) link.classList.add("is-current");
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  sections.forEach((section) => spy.observe(section));

  /* ---------- Reveals: one observer, many gestures ---------- */

  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
  );

  $$(
    "[data-reveal], .tiles, .deck-wrap, .deck, .ledger, .record, .system, .band, [data-section]"
  ).forEach((el) => revealer.observe(el));

  /* Section heads stagger: the title lands, then its paragraph. */
  $$("[data-reveal]").forEach((el) => {
    const siblings = [...$$("[data-reveal]", el.parentElement)];
    el.style.setProperty("--d", `${siblings.indexOf(el) * 90}ms`);
  });

  /* ---------- Count-up ---------- */

  const countTo = (el, to, { decimals = 0, duration = 900, from = 0 } = {}) => {
    if (reduce.matches) {
      el.textContent = to.toFixed(decimals);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (from + (to - from) * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- 02 The finances: figures count up, once ---------- */

  const ledger = $("[data-ledger]");

  if (ledger) {
    new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.disconnect();

          $$("[data-num]", ledger).forEach((cell, i) => {
            const to = Number(cell.dataset.num);
            window.setTimeout(() => {
              countTo(cell, to, { decimals: 1, duration: 760 });
              window.setTimeout(() => {
                cell.textContent = `${to.toFixed(1)}%`;
              }, 780);
            }, 80 + i * 55);
          });
        });
      },
      { threshold: 0.25 }
    ).observe(ledger);
  }

  /* ---------- 01 The plan: a deck you can drag, swipe and key through ---------- */

  const track = $("[data-track]");

  if (track) {
    const cards = $$("[data-clause]", track);
    const now = $("[data-clause-now]");
    const fill = $("[data-clause-fill]");

    const paintPosition = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (fill) fill.style.width = `${20 + (max > 0 ? track.scrollLeft / max : 0) * 80}%`;

      if (!now) return;
      /* Measure against the viewport, not the scroll origin: the track is
         padded to the page gutter, so offsetLeft is offset by that padding. */
      const edge = track.getBoundingClientRect().left + track.clientWidth * 0.3;
      let index = 0;
      cards.forEach((card, i) => {
        if (card.getBoundingClientRect().left <= edge) index = i;
      });
      /* At the far end the last card never reaches the edge, so pin the count
         to the end rather than stranding it one short. */
      if (max > 0 && track.scrollLeft >= max - 4) index = cards.length - 1;
      now.textContent = String(index + 1).padStart(2, "0");
    };

    track.addEventListener("scroll", paintPosition, { passive: true });
    window.addEventListener("resize", paintPosition);
    paintPosition();

    /* Pointer drag for mice. Touch keeps native panning, which is better. */
    let drag = null;
    let moved = 0;

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, left: track.scrollLeft, id: event.pointerId };
      moved = 0;
    });

    track.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (!track.classList.contains("is-dragging")) {
        /* Capture only once the gesture is clearly a drag, so a plain click
           on a button inside a card still reaches the button. */
        if (Math.abs(dx) < 6) return;
        track.classList.add("is-dragging");
        track.setPointerCapture(drag.id);
      }
      moved = Math.abs(dx);
      track.scrollLeft = drag.left - dx;
    });

    const endDrag = () => {
      if (!drag) return;
      drag = null;
      if (track.classList.contains("is-dragging")) {
        track.classList.remove("is-dragging");
        const origin = track.getBoundingClientRect().left - track.scrollLeft;
        const nearest = cards.reduce((best, card) =>
          Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left) <
          Math.abs(best.getBoundingClientRect().left - track.getBoundingClientRect().left)
            ? card
            : best
        );
        track.scrollTo({
          left: nearest.getBoundingClientRect().left - origin,
          behavior: reduce.matches ? "auto" : "smooth",
        });
      }
    };

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    /* A finished drag must not also press a button inside the card. */
    track.addEventListener(
      "click",
      (event) => {
        if (moved > 6) {
          event.preventDefault();
          event.stopPropagation();
        }
        moved = 0;
      },
      true
    );

    /* Arrow keys move focus card by card, but only from inside the deck. */
    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const from = document.activeElement?.closest("[data-clause]");
      if (!from) return;
      event.preventDefault();
      const next = cards[clamp(cards.indexOf(from) + (event.key === "ArrowRight" ? 1 : -1), 0, cards.length - 1)];
      next.scrollIntoView({
        behavior: reduce.matches ? "auto" : "smooth",
        inline: "start",
        block: "nearest",
      });
      next.querySelector(".clause__btn")?.focus({ preventScroll: true });
    });

    /* Each clause opens in place: the card grows, the deck does not jump. */
    cards.forEach((card) => {
      const btn = $(".clause__btn", card);
      const panel = $(".clause__panel", card);
      panel.inert = true;

      btn.addEventListener("click", () => {
        const open = card.dataset.open === "true";
        card.dataset.open = String(!open);
        btn.setAttribute("aria-expanded", String(!open));
        $(".clause__btn-label", btn).textContent = open ? "Open clause" : "Close clause";
        panel.inert = open;
      });
    });
  }

  /* ---------- 03 MMP: the seat map ----------
     120 seats in an arc. The party vote sets the share; five percent is the
     line below which a party returns nobody; 61 seats is a majority. Figures
     are modelled against a four-party House so the arithmetic is honest about
     the threshold rather than pretending seats appear from nowhere. */

  const svg = $("[data-hemicycle]");
  const figure = $("[data-seat-figure]");
  const verdict = $("[data-verdict]");
  const range = $("[data-vote-range]");
  const out = $("[data-vote-out]");
  const presets = $$("[data-preset]");

  const SEATS = 120;
  const MAJORITY = 61;
  const THRESHOLD = 5;
  const ROWS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 10];
  const NS = "http://www.w3.org/2000/svg";

  /* Seat positions, ordered left to right across the whole chamber by angle
     from the Speaker, so a party's seats form a contiguous wedge rather than
     filling row by row. */
  const CX = 210;
  const CY = 212;
  const points = (() => {
    const inner = 60;
    const outer = 198;
    const all = [];
    ROWS.forEach((count, r) => {
      const radius = inner + ((outer - inner) * (r + 0.5)) / ROWS.length;
      for (let i = 0; i < count; i += 1) {
        const a = Math.PI - (Math.PI * (i + 0.5)) / count;
        all.push({
          x: CX + Math.cos(a) * radius,
          y: CY - Math.sin(a) * radius,
          a,
        });
      }
    });
    return all.sort((p, q) => q.a - p.a).slice(0, SEATS);
  })();

  let seats = [];

  const buildSeats = () => {
    if (!svg) return;
    seats = points.map((pt, i) => {
      const seat = document.createElementNS(NS, "circle");
      seat.setAttribute("class", "seat");
      seat.setAttribute("cx", pt.x.toFixed(2));
      seat.setAttribute("cy", pt.y.toFixed(2));
      seat.setAttribute("r", "4.5");
      seat.dataset.index = String(i);
      svg.append(seat);
      return seat;
    });
  };

  /* The number typed is a share of the whole party vote. The rest is split
     across three opposing parties, and every party that clears five percent
     shares the 120 seats by largest remainder. Votes for parties under the
     line are set aside, which is the whole point of the threshold. */
  const seatsFor = (percent) => {
    if (percent < THRESHOLD) return 0;
    const rest = 100 - percent;
    const shares = [percent, rest * 0.45, rest * 0.33, rest * 0.22];
    const field = shares.filter((s) => s >= THRESHOLD);
    const pooled = field.reduce((a, b) => a + b, 0);
    const raw = field.map((s) => (s / pooled) * SEATS);
    const base = raw.map(Math.floor);
    const left = SEATS - base.reduce((a, b) => a + b, 0);
    raw
      .map((v, i) => ({ i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac)
      .slice(0, left)
      .forEach((x) => {
        base[x.i] += 1;
      });
    return base[0];
  };

  const verdictFor = (percent, n) => {
    if (percent < THRESHOLD) {
      return `<strong>${percent.toFixed(1)} percent falls under the five percent line,</strong> so it returns no seats at all. The votes are still counted, then set aside. This is the cliff in MMP, and it is why small parties chase an electorate seat.`;
    }
    if (n >= MAJORITY) {
      return `<strong>${n} seats is a majority.</strong> At ${percent.toFixed(1)} percent a party can govern alone, which no party has managed under MMP. The last single-party majority government was elected in 1951.`;
    }
    return `${percent.toFixed(1)} percent is <strong>${n} seats</strong>. That is ${MAJORITY - n} short of the ${MAJORITY} needed to govern, so the next question is who we govern with, and what they want in return.`;
  };

  const paint = (percent, animate) => {
    if (!svg) return;
    const n = seatsFor(percent);

    seats.forEach((seat, i) => {
      /* The arc is sorted right to left, so the first n seats are one side. */
      const ours = i < n;
      seat.classList.toggle("is-ours", ours);
      if (animate && !reduce.matches) {
        seat.style.transitionDelay = `${(SEATS - i) * 2.2}ms`;
        seat.style.transform = ours ? "scale(1.35)" : "scale(1)";
        window.setTimeout(() => {
          seat.style.transform = "";
        }, 460 + (SEATS - i) * 2.2);
      } else {
        seat.style.transform = "";
      }
    });

    if (figure) {
      const shown = Number(figure.textContent) || 0;
      countTo(figure, n, { duration: 420, from: shown });
    }
    if (verdict) verdict.innerHTML = verdictFor(percent, n);
  };

  const setVote = (value, { mirror = true } = {}) => {
    const v = clamp(Math.round(Number(value) * 10) / 10 || 0, 0, 100);
    if (range) {
      if (mirror) range.value = String(v);
      range.style.setProperty("--fill", `${(v / Number(range.max)) * 100}%`);
    }
    if (out) out.textContent = `${v.toFixed(v % 1 === 0 ? 0 : 1)}%`;
    presets.forEach((p) => p.classList.toggle("is-active", Number(p.dataset.preset) === v));
    paint(v, true);
  };

  if (svg && range) {
    buildSeats();

    const rule = document.createElementNS(NS, "line");
    rule.setAttribute("class", "hemi-rule");
    rule.setAttribute("x1", "210");
    rule.setAttribute("y1", "212");
    rule.setAttribute("x2", "210");
    rule.setAttribute("y2", "10");
    svg.append(rule);

    setVote(range.value, { mirror: false });

    range.addEventListener("input", () => setVote(range.value));

    presets.forEach((p) =>
      p.addEventListener("click", () => {
        setVote(p.dataset.preset);
        range.focus({ preventScroll: true });
      })
    );

    /* The House fills when it comes into view, not on load. */
    new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.disconnect();
          seats.forEach((seat) => {
            seat.style.transform = "scale(0.2)";
            seat.classList.remove("is-ours");
          });
          window.setTimeout(() => paint(Number(range.value), true), 240);
        });
      },
      { threshold: 0.4 }
    ).observe(svg);
  }

  /* ---------- 04 The front bench: the deck tilts with the pointer ---------- */

  const deck = $("[data-deck]");

  if (deck && !reduce.matches) {
    let frame = 0;

    deck.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = deck.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        deck.style.perspectiveOrigin = `${50 + x * 30}% ${50 + y * 40}%`;
        $$("[data-card]", deck).forEach((card, i) => {
          const bend = (i - 1) * -2.5;
          card.style.transform = `rotateY(${(x * 7 + bend).toFixed(2)}deg) rotateX(${(y * -5).toFixed(2)}deg) translateZ(${i === 1 ? 12 : 0}px)`;
        });
      });
    });

    deck.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      $$("[data-card]", deck).forEach((card) => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- 06 Membership: a sliding block, and a sky for finishing ---------- */

  const tabs = $$('[role="tab"]');
  const ink = $("[data-segment-ink]");
  const sky = $("[data-sky]");
  let skyTimer;

  const hideSky = () => {
    if (!sky) return;
    sky.removeAttribute("data-open");
    sky.inert = true;
    window.clearTimeout(skyTimer);
  };

  const showSky = () => {
    if (!sky) return;
    sky.removeAttribute("data-open");
    void sky.offsetWidth;
    sky.setAttribute("data-open", "");
    sky.inert = false;
    window.clearTimeout(skyTimer);
    skyTimer = window.setTimeout(hideSky, 4600);
  };

  const selectTab = (tab, focus = false) => {
    tabs.forEach((item, i) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute("aria-controls"));
      panel.hidden = !active;
      if (active && ink) {
        ink.style.transform = `translateX(${i * 100}%)`;
        panel.removeAttribute("data-entering");
        void panel.offsetWidth;
        panel.setAttribute("data-entering", "");
      }
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });

  if (ink) {
    const selected = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    ink.style.transform = `translateX(${Math.max(0, selected) * 100}%)`;
  }

  if (sky) {
    sky.inert = true;
    sky.addEventListener("click", hideSky);
    /* The overlay is a full-screen modal, so Escape must dismiss it and the
       page behind it must not take focus while it is up. */
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sky.hasAttribute("data-open")) hideSky();
    });

    const background = [$("main"), $(".footer"), $("header")].filter(Boolean);
    const observer = new MutationObserver(() => {
      const open = sky.hasAttribute("data-open");
      background.forEach((el) => {
        el.inert = open;
      });
    });
    observer.observe(sky, { attributes: true, attributeFilter: ["data-open"] });
  }

  const messages = {
    join: (name) => `Thanks, ${name}. Check your inbox for the membership confirmation and the first register update.`,
    volunteer: (name) => `Thanks, ${name}. Your local organiser will be in touch within two working days.`,
    donate: (amount) => `Thank you. A receipt for $${amount} is on its way, and the donation will appear on the live register within seven days.`,
  };

  $$("[data-panel]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const status = $(".form__status", form);
      const firstInvalid = [...form.elements].find((el) => el.willValidate && !el.checkValidity());

      if (firstInvalid) {
        status.dataset.state = "error";
        status.textContent =
          firstInvalid.type === "email"
            ? "That email address is missing an @ or a domain. Check it and try again."
            : firstInvalid.pattern
              ? "A New Zealand postcode is four digits. Check it and try again."
              : "Fill in the fields above so we can reach you.";
        firstInvalid.focus();
        return;
      }

      const key = form.closest("[role=tabpanel]").id.replace("panel-", "");
      const name = $('input[name="name"]', form)?.value.trim().split(" ")[0] || "friend";
      const amount = $('input[name="amount"]:checked', form)?.value;

      form.reset();
      status.dataset.state = "ok";
      status.textContent = messages[key](key === "donate" ? (amount ?? "25") : name);

      if (key !== "donate") showSky();
    });
  });

  /* ---------- Smooth anchor scrolling that respects the masthead ---------- */

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href").slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (header.offsetHeight + 12);
      window.scrollTo({ top, behavior: reduce.matches ? "auto" : "smooth" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      history.replaceState(null, "", `#${id}`);
    });
  });
})();
