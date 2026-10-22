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
            /* The ledger mixes billions, trillions and percentages, so the
               unit and the decimal places come from the cell's own text
               rather than being stamped on as a percent sign. */
            const unit = (cell.textContent.trim().match(/[a-z%]+$/i) || [""])[0];
            const decimals = (String(cell.dataset.num).split(".")[1] || "").length;
            const label = () =>
              unit === "%" ? `${to.toFixed(decimals)}%` : unit ? `${to.toFixed(decimals)} ${unit}` : to.toFixed(decimals);
            window.setTimeout(() => {
              countTo(cell, to, { decimals, duration: 760 });
              window.setTimeout(() => {
                cell.textContent = label();
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
    const steps = $$("[data-step]");

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);

    /* Distance from one card's left edge to the next, gap included. */
    const cardStep = () => {
      if (cards.length < 2) return cards[0]?.getBoundingClientRect().width || 0;
      return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
    };

    /* The deck snaps each card's left edge to the scroll padding, so the
       current card is the last one whose edge has reached that line. At the
       far end the tail cannot align, so fall back to the nearest edge. */
    const currentIndex = () => {
      const max = maxScroll();
      if (max <= 0) return 0;
      if (track.scrollLeft >= max - 4) return cards.length - 1;
      const padLine =
        track.getBoundingClientRect().left +
        (parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0);
      let index = 0;
      cards.forEach((card, i) => {
        if (card.getBoundingClientRect().left <= padLine + 8) index = i;
      });
      return index;
    };

    const paintSteps = () => {
      const at = maxScroll();
      steps.forEach((btn) => {
        btn.disabled = Number(btn.dataset.step) < 0 ? track.scrollLeft <= 4 : track.scrollLeft >= at - 4;
      });
    };

    const stepBy = (cards_) => {
      const to = track.scrollLeft + cards_ * cardStep();
      track.scrollTo({
        left: clamp(to, 0, maxScroll()),
        behavior: reduce.matches ? "auto" : "smooth",
      });
    };

    steps.forEach((btn) =>
      btn.addEventListener("click", () => stepBy(Number(btn.dataset.step)))
    );

    const paintPosition = () => {
      const max = maxScroll();
      if (fill) fill.style.width = `${20 + (max > 0 ? track.scrollLeft / max : 0) * 80}%`;
      if (now) now.textContent = String(currentIndex() + 1).padStart(2, "0");
      paintSteps();
    };

    track.addEventListener("scroll", paintPosition, { passive: true });
    window.addEventListener("resize", paintPosition);
    paintPosition();

    /* Snap on idle rather than in CSS. A `scroll-snap-type` axis captures a
       vertical wheel and settles it sideways before the page may scroll, which
       is what made the deck feel like it hijacked the page. Here the deck only
       settles itself when it has actually been moved sideways and then stops. */
    let settleTimer;
    let horizontal = false;

    /* Settle waits for the gesture to actually stop. A trackpad keeps firing
       scroll events for its whole momentum tail, so a short delay would snap
       back between events and swallow the travel. */
    const settleSoon = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (!horizontal) return;
        const step = cardStep();
        if (!step || track.classList.contains("is-dragging")) return;
        horizontal = false;
        const to = clamp(Math.round(track.scrollLeft / step) * step, 0, maxScroll());
        if (Math.abs(to - track.scrollLeft) < 2) return;
        track.scrollTo({ left: to, behavior: reduce.matches ? "auto" : "smooth" });
      }, 320);
    };

    track.addEventListener("scroll", () => {
      if (horizontal) settleSoon();
    }, { passive: true });

    /* A horizontal scroller swallows a wheel event that carries any sideways
       delta at all, even when the gesture is overwhelmingly vertical, and
       because the deck has no vertical overflow the page then does not move.
       Measured on this build: ten wheel events of deltaX 8 / deltaY 100 moved
       the deck 80px and the page 94px, against 1000px of intended travel. So a
       vertical-dominant wheel is taken off the deck and handed to the page;
       only a sideways-dominant one moves the deck. */
    track.addEventListener(
      "wheel",
      (event) => {
        const { deltaX, deltaY } = event;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          horizontal = false;
          const perUnit =
            event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
          event.preventDefault();
          /* `instant`, because `scroll-behavior: smooth` would otherwise turn
             every wheel tick into its own animation. */
          window.scrollBy({ top: deltaY * perUnit, behavior: "instant" });
          return;
        }
        if (!deltaX) return;
        horizontal = true;
        settleSoon();
      },
      { passive: false }
    );

    let touchStart = null;
    track.addEventListener("touchstart", (event) => {
      const t = event.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    track.addEventListener("touchmove", (event) => {
      if (!touchStart) return;
      const t = event.touches[0];
      if (Math.abs(t.clientX - touchStart.x) > Math.abs(t.clientY - touchStart.y)) horizontal = true;
    }, { passive: true });

    track.addEventListener("touchend", () => {
      touchStart = null;
      /* The finger lifts before the fling finishes, so the flag has to outlive
         the gesture for the momentum tail to snap at all. */
      if (horizontal) settleSoon();
    }, { passive: true });

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
        /* Settle on the nearest card boundary, never past the end. */
        const step = cardStep();
        const to = Math.round(track.scrollLeft / step) * step;
        track.scrollTo({ left: clamp(to, 0, maxScroll()), behavior: reduce.matches ? "auto" : "smooth" });
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
      /* Step by delta rather than scrollIntoView: a card sitting inside the
         scroll padding already counts as in view, so scrollIntoView does
         nothing at the first card. */
      const dir = event.key === "ArrowRight" ? 1 : -1;
      stepBy(dir);
      const next = cards[clamp(currentIndex() + dir, 0, cards.length - 1)];
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
