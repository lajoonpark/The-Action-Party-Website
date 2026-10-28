/* The Action Party: motion
   One gesture per section, all reversible, none of them required. The page
   reads as complete without this file: html.motion is only added when the
   document is ready for it, and GSAP arriving late is handled by falling back
   to plain CSS states. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const root = document.documentElement;
  const calm = root.classList.contains("calm");
  const canAnimate = !calm;

  const gsap = window.gsap;
  const hasGsap = Boolean(gsap);
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* ─── chrome: stuck state, hide on scroll down, progress ─── */

  const header = $("[data-masthead]");
  const progress = $("[data-progress]");
  const sections = $$("[data-section]");
  const toneSections = $$("[data-tone]");

  let lastY = window.scrollY;
  let navOpen = false;

  const paintChrome = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    if (!header) return;
    header.classList.toggle("is-stuck", y > 24);
    const down = y > lastY + 6;
    const up = y < lastY - 6;
    if (down && y > 480 && !navOpen) header.classList.add("is-hidden");
    if (up || y < 160) header.classList.remove("is-hidden");
    lastY = y;
  };

  const toneFor = (el) => el?.dataset.tone || "paper";

  const paintTone = () => {
    if (!header) return;
    const mid = window.innerHeight * 0.32;
    let current = "paper";
    toneSections.forEach((section) => {
      const box = section.getBoundingClientRect();
      if (box.top <= mid && box.bottom > mid) current = toneFor(section);
    });
    if (header.dataset.tone === current) return;
    header.dataset.tone = current;
    document.body.style.setProperty(
      "--page-bg",
      current === "ink" ? "#0b0c0e" : current === "bone" ? "#e7e0cf" : "#f5f2ea"
    );
  };

  const scrollHandler = () => {
    paintChrome();
    paintTone();
  };

  scrollHandler();
  window.addEventListener("scroll", scrollHandler, { passive: true });
  window.addEventListener("resize", scrollHandler, { passive: true });

  /* ─── menu ─── */

  const toggle = $("[data-nav-toggle]");
  const nav = $("[data-nav]");
  const toggleWord = $(".masthead__toggle-word");

  const setNav = (open, focus = false) => {
    navOpen = open;
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    if (toggleWord) toggleWord.textContent = open ? "Close" : "Menu";
    const main = $("#main");
    const footer = $(".footer");
    main?.toggleAttribute("inert", open);
    footer?.toggleAttribute("inert", open);
    if (open) header?.classList.remove("is-hidden");
    else if (focus) toggle.focus();
  };

  toggle?.addEventListener("click", () => setNav(toggle.getAttribute("aria-expanded") !== "true"));
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navOpen) setNav(false, true);
  });
  window.matchMedia("(min-width: 62.0625rem)").addEventListener("change", (event) => {
    if (event.matches && navOpen) setNav(false);
  });

  /* ─── current section, for the nav ─── */

  const navLinks = new Map(
    $$("[data-nav] a[href^='#']").map((a) => [a.getAttribute("href").slice(1), a])
  );
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.classList.remove("is-current"));
          navLinks.get(entry.target.id)?.classList.add("is-current");
        });
      },
      { rootMargin: "-42% 0px -52% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ─── reveals: one observer, every gesture underneath ─── */

  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.06 }
  );

  const revealTargets = $$(
    "[data-reveal], [data-toc-row], [data-record-row], [data-member], .ledger"
  );
  revealTargets.forEach((el) => revealer.observe(el));

  /* The words of the undertaking light one at a time as it is read. */
  const wordLine = $("[data-wordlight]");
  if (wordLine && canAnimate) {
    const words = wordLine.textContent.trim().split(/\s+/);
    wordLine.textContent = "";
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.dataset.word = "";
      span.textContent = word;
      wordLine.append(span);
      if (i < words.length - 1) wordLine.append(document.createTextNode(" "));
    });
    const lit = $$("[data-word]", wordLine);
    let litFrame = 0;
    const lightWords = () => {
      const box = wordLine.getBoundingClientRect();
      const start = window.innerHeight * 0.86;
      const end = window.innerHeight * 0.3;
      const t = clamp((start - box.top) / Math.max(1, start - end + box.height), 0, 1);
      const upTo = Math.round(t * lit.length);
      lit.forEach((word, i) => word.classList.toggle("is-lit", i < upTo));
    };
    const onLightScroll = () => {
      if (litFrame) return;
      litFrame = requestAnimationFrame(() => {
        litFrame = 0;
        lightWords();
      });
    };
    lightWords();
    window.addEventListener("scroll", onLightScroll, { passive: true });
  }

  /* ─── the count machine ───
     120 seats on an arc. The party vote sets the share; five percent is the
     line below which a party returns nobody; 61 is a majority. The rest of
     the House is modelled from three opponents so the arithmetic is honest
     about the threshold instead of producing seats out of nothing. */

  const SEATS = 120;
  const MAJORITY = 61;
  const THRESHOLD = 5;
  const CX = 210;
  const CY = 226;
  const ROWS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 10];
  const NS = "http://www.w3.org/2000/svg";

  const chamber = $("[data-hemicycle]");
  const dial = $("[data-dial]");
  const machine = $("[data-machine]");
  const rig = $("[data-rig]");
  const scene = $("[data-scene]");
  const seatFigure = $("[data-seat-figure]");
  const verdict = $("[data-verdict]");
  const screenVote = $("[data-screen-vote]");
  const screenSeats = $("[data-screen-seats]");
  const screenNote = $("[data-screen-note]");
  const machineMode = $("[data-machine-mode]");
  /* The machine's shell also carries data-cast as a CSS state hook, so the
     selector has to name the button or every click on the panel casts a vote. */
  const castButton = $("button[data-cast]");
  const presets = $$("[data-preset]");
  const manualSteps = $$("[data-step-item]");
  const soundButton = $("[data-sound]");

  /* ─── sound: short mechanical clicks, built on demand ─── */

  const sound = (() => {
    let ctx = null;
    let on = true;
    const ensure = () => {
      if (!on) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try {
          ctx = new AC();
        } catch (error) {
          return null;
        }
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    };

    /* A click is a very short burst of noise through a band-pass: enough to
       feel mechanical without pretending to be a recording. */
    const click = (freq = 1400, gain = 0.1, length = 0.03) => {
      const ac = ensure();
      if (!ac) return;
      const frames = Math.max(1, Math.floor(ac.sampleRate * length));
      const buffer = ac.createBuffer(1, frames, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
      }
      const source = ac.createBufferSource();
      source.buffer = buffer;
      const filter = ac.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      const amp = ac.createGain();
      amp.gain.value = gain;
      source.connect(filter).connect(amp).connect(ac.destination);
      source.start();
    };

    return {
      detent: () => click(1600, 0.05, 0.022),
      cast: () => {
        click(420, 0.14, 0.05);
        window.setTimeout(() => click(240, 0.1, 0.07), 60);
      },
      set: (value) => {
        on = value;
        if (soundButton) {
          soundButton.setAttribute("aria-pressed", String(on));
          $(".sound__word", soundButton).textContent = on ? "Sound" : "Muted";
        }
      },
      get: () => on,
    };
  })();

  soundButton?.addEventListener("click", () => sound.set(!sound.get()));

  /* ─── the dial: a real 320 degree sweep across 0-100 ─── */

  const SWEEP = 320;
  const START = -SWEEP / 2;
  let vote = 12;

  if (dial) {
    const ring = $("[data-dial-ticks]", dial);
    if (ring) {
      for (let i = 0; i <= 40; i += 1) {
        const tick = document.createElement("span");
        tick.className = i % 10 === 0 ? "dial__tick is-major" : "dial__tick";
        tick.style.transform = `rotate(${START + (SWEEP * i) / 40}deg)`;
        ring.append(tick);
      }
    }
  }

  const dialAngle = (percent) => START + (SWEEP * percent) / 100;

  /* Seat positions across the whole chamber, ordered by angle from the
     Speaker so a party forms a contiguous wedge rather than a striped row. */
  const seatPoints = (() => {
    const inner = 62;
    const outer = 200;
    const all = [];
    ROWS.forEach((count, r) => {
      const radius = inner + ((outer - inner) * (r + 0.5)) / ROWS.length;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.PI - (Math.PI * (i + 0.5)) / count;
        all.push({ x: CX + Math.cos(angle) * radius, y: CY - Math.sin(angle) * radius, a: angle });
      }
    });
    return all.sort((p, q) => q.a - p.a).slice(0, SEATS);
  })();

  let seatNodes = [];

  const buildChamber = () => {
    if (!chamber) return;
    /* The seats are printed into the markup so the map still reads without
       scripting; scripting clears that first pass and rebuilds it, because the
       live version is what the dial and the cast button move. */
    chamber.querySelectorAll(".seat, .baseline, .chamber-note").forEach((node) => node.remove());
    const base = document.createElementNS(NS, "path");
    const first = seatPoints[0];
    const last = seatPoints[seatPoints.length - 1];
    base.setAttribute("class", "baseline");
    base.setAttribute(
      "d",
      `M ${first.x - 8} ${first.y + 6} A ${(200 + 62) / 2} ${(200 + 62) / 2} 0 0 1 ${last.x + 8} ${last.y + 6}`
    );
    chamber.append(base);

    seatNodes = seatPoints.map((point, i) => {
      const seat = document.createElementNS(NS, "circle");
      seat.setAttribute("class", "seat");
      seat.setAttribute("cx", point.x.toFixed(2));
      seat.setAttribute("cy", point.y.toFixed(2));
      seat.setAttribute("r", "4.4");
      seat.dataset.index = String(i);
      chamber.append(seat);
      return seat;
    });

    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "chamber-note");
    label.setAttribute("x", String(CX));
    label.setAttribute("y", String(CY - 6));
    label.setAttribute("text-anchor", "middle");
    label.textContent = "120 SEATS";
    chamber.append(label);
  };

  buildChamber();

  /* Largest remainder across our party and three opponents. Votes for a party
     under five percent are set aside, which is the cliff the section explains. */
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
      return `<strong>${percent.toFixed(1)} percent is under the five percent line,</strong> so it returns no seats at all. The votes are still counted, then set aside. This is the cliff in MMP, and it is why small parties chase an electorate seat.`;
    }
    if (n >= MAJORITY) {
      return `<strong>${n} seats is a majority.</strong> At ${percent.toFixed(1)} percent a party governs alone, which no party has managed under MMP. The last single-party majority was elected in 1951.`;
    }
    return `${percent.toFixed(1)} percent is <strong>${n} seats</strong>. That is ${MAJORITY - n} short of the ${MAJORITY} needed to govern, so the next question is who we govern with, and what they want in return.`;
  };

  const countUp = (el, to, from, duration = 460) => {
    if (!el) return;
    if (!canAnimate) {
      el.textContent = String(to);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const paintChamber = (percent, animate = true) => {
    const n = seatsFor(percent);
    seatNodes.forEach((seat, i) => {
      /* The arc runs right to left, so the first n seats on our side. */
      const ours = i < n;
      seat.classList.toggle("is-ours", ours);
      if (animate && canAnimate) {
        seat.style.transitionDelay = `${(SEATS - i) * 2}ms`;
        seat.style.transform = ours ? "scale(1.4)" : "";
        window.setTimeout(() => {
          seat.style.transform = "";
        }, 420 + (SEATS - i) * 2);
      } else {
        seat.style.transform = "";
      }
    });

    const shown = Number(seatFigure?.textContent) || 0;
    countUp(seatFigure, n, shown);
    if (screenSeats) screenSeats.textContent = String(n);
    if (screenVote) screenVote.textContent = percent.toFixed(1);
    if (screenNote) {
      screenNote.textContent =
        percent < THRESHOLD
          ? "below the 5% line"
          : n >= MAJORITY
            ? `${n - MAJORITY} over the 61 needed`
            : `${MAJORITY - n} short of 61`;
    }
    if (verdict) verdict.innerHTML = verdictFor(percent, n);
    if (machineMode) machineMode.textContent = percent < THRESHOLD ? "Below line" : n >= MAJORITY ? "Majority" : "Counted";
    return n;
  };

  const setVote = (value, { animate = true, silent = false, speak = false } = {}) => {
    const next = clamp(Math.round(Number(value) * 10) / 10 || 0, 0, 100);
    const changed = next !== vote;
    vote = next;
    if (dial) {
      dial.style.setProperty("--dial-rot", `${dialAngle(vote)}deg`);
      dial.setAttribute("aria-valuenow", String(vote));
      const n = seatsFor(vote);
      dial.setAttribute("aria-valuetext", `${vote.toFixed(1)} percent, ${n} seats`);
    }
    presets.forEach((p) => {
      p.setAttribute("aria-pressed", String(Number(p.dataset.preset) === vote));
    });
    paintChamber(vote, animate && changed);
    if (changed && !silent) sound.detent();
    if (speak) {
      /* A polite announcement after a preset, so the result is not only visual. */
      window.setTimeout(() => {
        if (verdict) verdict.setAttribute("data-announced", String(Date.now()));
      }, 40);
    }
    return vote;
  };

  if (chamber) {
    let dialDragging = false;
    let dialStartY = 0;
    let dialStartValue = 0;

    /* Drag reads the angle from the dial's own centre, so a tilted machine
       still tracks the pointer correctly. */
    const angleFromPointer = (event) => {
      const box = dial.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      let deg = (Math.atan2(x, -y) * 180) / Math.PI;
      if (deg < -160) deg += 360;
      if (deg > 160) deg -= 360;
      return clamp(((clamp(deg, START, START + SWEEP) - START) / SWEEP) * 100, 0, 100);
    };

    dial?.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      dial.setPointerCapture(event.pointerId);
      dialDragging = false;
      dialStartY = event.clientY;
      dialStartValue = vote;
      dial.classList.add("is-dragging");
    });

    dial?.addEventListener("pointermove", (event) => {
      if (!dial.hasPointerCapture?.(event.pointerId)) return;
      const travel = Math.abs(event.clientY - dialStartY);
      dialDragging = dialDragging || travel > 4;
      if (dialDragging) {
        setVote(angleFromPointer(event), { animate: false });
      }
    });

    const endDial = (event) => {
      if (!dial?.hasPointerCapture?.(event.pointerId)) return;
      dial.releasePointerCapture(event.pointerId);
      dial.classList.remove("is-dragging");
      if (!dialDragging) {
        /* A tap on the rim nudges by a detent, a tap in the middle casts. */
        const box = dial.getBoundingClientRect();
        const x = event.clientX - (box.left + box.width / 2);
        const y = event.clientY - (box.top + box.height / 2);
        if (Math.hypot(x, y) < box.width * 0.26) castButton?.click();
      }
    };
    dial?.addEventListener("pointerup", endDial);
    dial?.addEventListener("pointercancel", endDial);

    dial?.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 5 : 1;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        setVote(vote + step);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        setVote(vote - step);
      } else if (event.key === "Home") {
        event.preventDefault();
        setVote(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setVote(100);
      } else if (event.key === "PageUp") {
        event.preventDefault();
        setVote(vote + 10);
      } else if (event.key === "PageDown") {
        event.preventDefault();
        setVote(vote - 10);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        castButton?.click();
      }
    });

    presets.forEach((preset) => {
      preset.addEventListener("click", () => {
        setVote(preset.dataset.preset, { speak: true });
        preset.focus({ preventScroll: true });
      });
    });

    let castTimer = 0;
    castButton?.addEventListener("click", () => {
      if (!machine) return;
      sound.cast();
      machine.dataset.cast = "true";
      window.clearTimeout(castTimer);
      castTimer = window.setTimeout(() => {
        machine.dataset.cast = "false";
      }, 1500);
      paintChamber(vote, true);
    });

    /* The manual is a set of steps that open as you reach them. */
    const setStep = (index) => {
      manualSteps.forEach((step, i) => {
        if (i === index) step.setAttribute("aria-current", "true");
        else step.removeAttribute("aria-current");
      });
    };
    manualSteps.forEach((step, i) => {
      step.addEventListener("click", () => setStep(i));
      step.addEventListener("focus", () => setStep(i));
      step.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const dir = event.key === "ArrowDown" ? 1 : -1;
        const next = clamp(i + dir, 0, manualSteps.length - 1);
        manualSteps[next].focus();
        setStep(next);
      });
    });

    setVote(12, { animate: false, silent: true });

    /* The chamber fills when it is first seen, not on load. */
    if ("IntersectionObserver" in window) {
      const fill = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            obs.disconnect();
            seatNodes.forEach((seat) => {
              seat.style.transform = "scale(0.2)";
            });
            window.setTimeout(() => paintChamber(vote, true), 260);
          });
        },
        { threshold: 0.35 }
      );
      fill.observe(chamber);
    }
  }

  /* ─── the rig: it tilts to the pointer, and settles back ─── */

  if (rig && scene && canAnimate) {
    let targetX = 13;
    let targetY = -15;
    let currentX = 13;
    let currentY = -15;
    let rigFrame = 0;

    const settle = () => {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;
      rig.style.setProperty("--rx", `${currentX.toFixed(2)}deg`);
      rig.style.setProperty("--ry", `${currentY.toFixed(2)}deg`);
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rigFrame = requestAnimationFrame(settle);
      } else {
        rigFrame = 0;
      }
    };

    const nudge = () => {
      if (!rigFrame) rigFrame = requestAnimationFrame(settle);
    };

    scene.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const box = scene.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      targetY = -15 + x * 22;
      targetX = 13 - y * 16;
      nudge();
    });

    scene.addEventListener("pointerleave", () => {
      targetX = 13;
      targetY = -15;
      nudge();
    });

    /* Scroll scrubs a last few degrees, so the object keeps responding as
       the page moves past it rather than sitting still on screen. */
    if (hasGsap && window.ScrollTrigger) {
      window.ScrollTrigger.create({
        trigger: scene,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const drift = (self.progress - 0.5) * 8;
          rig.style.setProperty("--scroll-drift", `${drift.toFixed(2)}deg`);
        },
      });
    }
  }

  /* ─── the plan: seven files that open, one tab strip that follows ─── */

  const files = $$("[data-file]");
  const planTabs = $$("[data-plan-tab]");

  const setFile = (file, open) => {
    const button = $("[data-file-toggle]", file);
    file.dataset.open = String(open);
    button?.setAttribute("aria-expanded", String(open));
  };

  files.forEach((file) => {
    const button = $("[data-file-toggle]", file);
    button?.addEventListener("click", () => {
      const open = file.dataset.open === "true";
      files.forEach((other) => {
        if (other !== file && other.dataset.open === "true") setFile(other, false);
      });
      setFile(file, !open);
    });
  });

  /* The tab strip mirrors whichever file is on screen, so it works as a map
     as well as a control. Opening from a tab opens that file, not just scrolls. */
  planTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.planTab;
      const file = document.getElementById(id);
      if (!file) return;
      setFile(file, true);
    });
  });

  /* Arrow keys walk the seven files while focus is on one of them, and carry
     focus with the selection so the next arrow press lands where expected.
     Escape closes the file that is open, which is the contract the
     accessibility page states. */
  files.forEach((file, index) => {
    const button = $("[data-file-toggle]", file);
    button?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (file.dataset.open !== "true") return;
        event.preventDefault();
        setFile(file, false);
        return;
      }
      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
      if (!forward && !back) return;
      event.preventDefault();
      const next = files[(index + (forward ? 1 : -1) + files.length) % files.length];
      /* One file open at a time is the whole idea of the cabinet: walking with
         the arrows has to close the others exactly as a click does. */
      files.forEach((other) => {
        if (other !== next && other.dataset.open === "true") setFile(other, false);
      });
      setFile(next, true);
      $("[data-file-toggle]", next)?.focus();
    });
  });

  if (files.length && "IntersectionObserver" in window) {
    const currentFile = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          planTabs.forEach((tab) => {
            const on = tab.dataset.planTab === entry.target.id;
            tab.classList.toggle("is-current", on);
            tab.setAttribute("aria-current", on ? "true" : "false");
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    files.forEach((f) => currentFile.observe(f));
  }

  /* The bench is a list of cards, not controls, so the arrow keys only move
     focus between the cards; there is nothing to activate on them. */
  const bench = $$("[data-member-card]");
  bench.forEach((card, index) => {
    card.addEventListener("keydown", (event) => {
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!forward && !back) return;
      event.preventDefault();
      bench[(index + (forward ? 1 : -1) + bench.length) % bench.length].focus();
    });
  });

  /* ─── the finances: a two-year switch with real values ─── */

  const moneyModes = $$("[data-money-mode]");
  const moneySwitch = $(".switch");
  /* The papers carry their own small ledgers with no year switch, so every
     lookup here has to survive a page without the main table. */
  const ledger = $("[data-ledger]");
  const ledgerRows = () => (ledger ? $$("[data-row]", ledger) : []);

  const setMoneyMode = (mode) => {
    moneyModes.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.moneyMode === mode));
    });
    moneySwitch?.setAttribute("data-at", mode);
    ledgerRows().forEach((row) => {
      const cell = $("[data-cell]", row);
      if (!cell) return;
      cell.style.opacity = "0";
      cell.style.transform = "translateY(4px)";
      window.setTimeout(() => {
        cell.textContent = mode === "then" ? cell.dataset.then : cell.dataset.now;
        cell.style.opacity = "1";
        cell.style.transform = "none";
      }, 130);
    });
  };

  /* Every figure on the balance card is derived from the table, so the three
     numbers always reconcile. Switching the column simply restates them. */
  const balanceNum = $("[data-balance-num]");
  const balanceFund = $(".balance__fund");
  const deltaTotal = () =>
    ledgerRows().reduce(
      (sum, row) => sum + (Number(row.dataset.thenNum) - Number(row.dataset.nowNum)),
      0
    );

  const paintBalance = () => {
    if (!balanceNum) return;
    const net = deltaTotal();
    const label = `Net new spending ${(net / 1000).toFixed(2)} trillion dollars a year`;
    balanceNum.textContent = (net / 1000).toFixed(2);
    balanceFund?.setAttribute("aria-label", label);
  };

  moneyModes.forEach((btn) => {
    btn.addEventListener("click", () => {
      setMoneyMode(btn.dataset.moneyMode);
      paintBalance();
    });
  });

  ledgerRows().map((row) => $("[data-cell]", row)).filter(Boolean).forEach((cell) => {
    cell.style.transition = "opacity 200ms ease, transform 260ms cubic-bezier(0.16,0.84,0.28,1)";
  });

  /* ─── the record: hover opens the dek, touch and keyboard open it too ─── */

  $$("[data-record-row] .record__link").forEach((link) => {
    link.addEventListener("click", (event) => {
      /* On a touch screen the first tap opens the entry rather than leaving
         the page, so the record is readable before it is navigated. */
      if (event.pointerType === "touch" || window.matchMedia("(hover: none)").matches) {
        const item = link.closest("[data-record-row]");
        if (item && !item.classList.contains("is-open")) {
          event.preventDefault();
          item.classList.add("is-open");
        }
      }
    });
  });

  /* ─── membership: tabs, validation, and the stamp ─── */

  const tabs = $$('[role="tab"]');
  const segmentInk = $("[data-segment-ink]");
  const stamp = $("[data-stamp]");
  let stampTimer = 0;
  let stampReturn = null;
  let stampRestore = null;

  const hideStamp = () => {
    if (!stamp) return;
    /* The page behind the sheet is inert while it is open, so focus cannot have
       gone anywhere else: it always belongs back on the submit button. */
    stampRestore = stampReturn;
    stamp.removeAttribute("data-open");
    window.clearTimeout(stampTimer);
    stampReturn = null;
  };

  const showStamp = (returnTo) => {
    if (!stamp) return;
    stampReturn = returnTo || null;
    stamp.removeAttribute("data-open");
    void stamp.offsetWidth;
    stamp.setAttribute("data-open", "");
    window.clearTimeout(stampTimer);
    stampTimer = window.setTimeout(hideStamp, 5200);
  };

  const selectTab = (tab, focus = false) => {
    tabs.forEach((item, i) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = !active;
        if (active) {
          panel.removeAttribute("data-entering");
          void panel.offsetWidth;
          panel.setAttribute("data-entering", "");
        }
      }
      if (active && segmentInk) segmentInk.style.transform = `translateX(${i * 100}%)`;
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        selectTab(tabs[event.key === "Home" ? 0 : tabs.length - 1], true);
        return;
      }
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });

  const selectedTab = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  if (segmentInk && selectedTab > 0) {
    segmentInk.style.transform = `translateX(${selectedTab * 100}%)`;
  }

  if (stamp) {
    stamp.setAttribute("aria-hidden", "false");
    stamp.addEventListener("click", hideStamp);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && stamp.hasAttribute("data-open")) hideStamp();
    });
    const background = [$("#main"), $(".footer"), $("header")].filter(Boolean);
    new MutationObserver(() => {
      const open = stamp.hasAttribute("data-open");
      background.forEach((el) => el.toggleAttribute("inert", open));
      if (!open) $("[data-stamp]")?.setAttribute("aria-hidden", "true");
      else stamp.setAttribute("aria-hidden", "false");
      /* #main is inert while the stamp is up, so a returned focus has to wait
         until that is lifted; otherwise the call is a no-op on an inert node. */
      if (!open && stampRestore) {
        const target = stampRestore;
        stampRestore = null;
        if (document.contains(target)) target.focus({ preventScroll: true });
      }
    }).observe(stamp, { attributes: true, attributeFilter: ["data-open"] });
    stamp.setAttribute("aria-hidden", "true");
  }

  const messages = {
    join: (name) =>
      `Thanks, ${name}. Check your inbox for the membership confirmation and the first policy update.`,
    volunteer: (name) =>
      `Thanks, ${name}. Your local organiser will be in touch within two working days.`,
    donate: (amount) =>
      `Thank you. A receipt for $${amount} is on its way, and the donation will appear on the live register within seven days.`,
  };

  $$("[data-panel]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const status = $(".form__status", form);
      const fields = [...form.elements].filter((el) => el.willValidate && el.type !== "checkbox");
      fields.forEach((el) => el.removeAttribute("aria-invalid"));
      const firstInvalid = fields.find((el) => !el.checkValidity());

      if (firstInvalid) {
        firstInvalid.setAttribute("aria-invalid", "true");
        if (status) {
          status.dataset.state = "error";
          status.textContent =
            firstInvalid.type === "email"
              ? "That email is missing an @ or a domain. Check it and try again."
              : firstInvalid.pattern
                ? "A New Zealand postcode is four digits. Check it and try again."
                : "Fill in the fields above so we can reach you.";
        }
        firstInvalid.focus();
        return;
      }

      const panel = form.closest("[role=tabpanel]");
      const key = panel?.id.replace("panel-", "") || "join";
      const name = $('input[name="name"]', form)?.value.trim().split(" ")[0] || "friend";
      const amount = $('input[name="amount"]:checked', form)?.value;

      form.reset();
      if (status) {
        status.dataset.state = "ok";
        status.textContent = messages[key](key === "donate" ? (amount ?? "25") : name);
      }
      if (key !== "donate") showStamp(form.querySelector('button[type="submit"]'));
    });
  });

  /* ─── anchors: the menu and the toc move without breaking focus ─── */

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href").slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      const offset = (header?.offsetHeight || 0) + 14;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      if (window.__lenis) window.__lenis.scrollTo(top, { immediate: calm });
      else window.scrollTo({ top, behavior: calm ? "auto" : "smooth" });
      history.replaceState(null, "", `#${id}`);
      const focusable = target.matches("a,button,input") ? target : target.querySelector("h1,h2,h3");
      if (focusable) {
        focusable.setAttribute("tabindex", "-1");
        focusable.focus({ preventScroll: true });
      }
    });
  });

  /* ─── the machine's body: real thickness, built from copies ───
     Each copy sits a little further along Z, so the shell has an actual edge
     that holds up under the tilt. Depth is in cqw so it scales with the box. */
  const slabHost = $("[data-slab]");

  const extrude = () => {
    if (!slabHost || !machine) return;
    const depth = Math.round(machine.clientWidth * 0.07);
    machine.style.setProperty("--depth", `${depth}px`);
    const layers = window.innerWidth < 720 ? 8 : 14;
    slabHost.textContent = "";
    for (let i = 0; i < layers; i += 1) {
      const layer = document.createElement("span");
      layer.className = "slab";
      const z = (depth * i) / (layers - 1);
      layer.style.transform = `translateZ(${z.toFixed(2)}px)`;
      layer.style.setProperty("--z", String(i));
      slabHost.append(layer);
    }
  };

  if (slabHost) {
    extrude();
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => extrude()).observe(machine);
    } else {
      window.addEventListener("resize", extrude, { passive: true });
    }
  }

  /* ─── the footer lockup prints in from the top ─── */

  const lockup = $("[data-print]");
  if (lockup && "IntersectionObserver" in window) {
    const printer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.disconnect();
          lockup.classList.add("is-printed");
        });
      },
      { threshold: 0.25 }
    );
    /* Observe the wrapper: the image itself is clipped to nothing until it
       prints, and an element with no visible area never reports intersecting. */
    printer.observe(lockup.parentElement || lockup);
  }

  /* ─── smooth scrolling, but only where it helps ─── */

  if (window.Lenis && canAnimate && !window.matchMedia("(max-width: 62rem)").matches) {
    const lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
    });
    window.__lenis = lenis;
    if (hasGsap && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  /* ─── the cover: two plates settling into register, then blown apart ─── */

  const cover = $("[data-cover]");
  if (cover && hasGsap && canAnimate) {
    const inkPlate = $('[data-plate="ink"]', cover);
    const redPlate = $('[data-plate="red"]', cover);
    const lines = $$("[data-statement-line]", cover);
    const coverLines = $$("[data-cover-line]", cover);

    gsap.set(coverLines, { opacity: 0, y: 18 });
    gsap.set(lines, { opacity: 0, y: "12%" });

    const intro = gsap.timeline({ delay: 0.15 });
    intro
      .to(inkPlate, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0)
      .to(redPlate, { opacity: 0.9, duration: 0.9, ease: "power2.out" }, 0.08)
      /* The plates start out of register and slide into it, like a second
         colour being pulled onto the sheet. */
      .fromTo(
        redPlate,
        { "--offx": "22px", "--offy": "-16px" },
        { "--offx": "0px", "--offy": "0px", duration: 1.25, ease: "power3.out" },
        0
      )
      .to(coverLines, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out" }, 0.25)
      .to(lines, { opacity: 1, y: 0, duration: 0.95, stagger: 0.1, ease: "power3.out" }, 0.3);

    /* Pointer parallax on the plates: a few pixels, never more. */
    if (!window.matchMedia("(hover: none)").matches) {
      const plates = $("[data-plates]");
      window.addEventListener(
        "pointermove",
        (event) => {
          const x = event.clientX / window.innerWidth - 0.5;
          const y = event.clientY / window.innerHeight - 0.5;
          plates?.style.setProperty("--mx", x.toFixed(3));
          plates?.style.setProperty("--my", y.toFixed(3));
        },
        { passive: true }
      );
    }

    if (window.ScrollTrigger) {
      /* The statement does not fade and does not leave the sheet: it steps back
         to a masthead while the mark grows into the room it gives up. The beat
         swaps subject without ever printing a half-strength glyph or cutting
         through a letter, both of which read as a printing fault, and faded
         text at an arbitrary scroll position would be text under the contrast
         floor this site promises never happens. Progress drives it directly: a
         scrubbed tween latches whatever value it caught mid-flight and leaves
         the headline either shrunk or full size on the way back. */
      const masthead = $(".cover__masthead", cover);
      const coverExit = (progress) => {
        const from = 0.42;
        const t = progress <= from ? 0 : (progress - from) / (1 - from);
        const eased = t * t * (3 - 2 * t);
        if (!masthead) return;
        gsap.set(masthead, {
          scale: 1 - eased * 0.5,
          transformOrigin: "0% 0%",
          y: `${(-eased * 14).toFixed(2)}px`,
        });
      };

      /* Pinning only works where the cover fits the viewport. On a phone the
         sheet is taller than the screen, so a pin would hold the headline and
         hide the call to action underneath it for a whole screen of scrolling.
         matchMedia reverts the pin and its inline styles on resize. */
      gsap.matchMedia().add("(min-width: 62.0625rem)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: cover,
            start: "top top",
            end: "+=85%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            onUpdate: (self) => coverExit(self.progress),
            onRefresh: (self) => coverExit(self.progress),
          },
        });

        /* The plate rises into the space the statement vacates, so the frame
           is never a hole between the type and the foot: the mark becomes the
           subject of the beat. The two inks are never pulled apart, because
           the mark is fixed art and an offset slices its own edge against the
           print frame. */
        timeline
          .to($(".plate-figure", cover), { y: "-11%", scale: 1.16, ease: "none" }, 0)
          .to($(".cover__sun"), { scale: 1.6, opacity: 0.4, ease: "none" }, 0)
          .to($(".cover__ray"), { rotate: 12, scale: 1.2, opacity: 0.35, ease: "none" }, 0);

        return () => {
          gsap.set([masthead, $(".plate-figure", cover)], { clearProps: "transform" });
        };
      });
    }
  }

  /* ─── section heads: one line of travel, no bounce ─── */

  if (hasGsap && canAnimate) {
    $$("[data-reveal]").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }
      );
    });

    /* The index rows arrive in order, one after another. */
    const tocRows = $$("[data-toc-row]");
    if (tocRows.length) {
      gsap.to(tocRows, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: { trigger: ".toc", start: "top 82%", once: true },
      });
    }

    /* The bench rises one card at a time. The card itself already sits at its
       own tilt, so the list item has to settle to zero: rotating both compounds
       the angle and drags the right-hand column of the card out of register. */
    const members = $$("[data-member]");
    if (members.length) {
      gsap.to(members, {
        opacity: 1,
        y: 0,
        rotate: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: ".members", start: "top 78%", once: true },
      });
    }

    /* Records unfold downward, dated lines arriving last. */
    const recordRows = $$("[data-record-row]");
    if (recordRows.length) {
      gsap.to(recordRows, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: { trigger: ".record", start: "top 80%", once: true },
      });
    }
  }

  /* ─── ScrollTrigger needs to know when the page has settled ─── */

  if (window.ScrollTrigger) {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => window.ScrollTrigger.refresh());
    }
    window.addEventListener("load", () => window.ScrollTrigger.refresh());
  }

  /* If the libraries never arrive, drop the motion class so nothing stays
     hidden behind an animation that will not run. */
  window.setTimeout(() => {
    if (!window.gsap) root.classList.remove("motion");
  }, 2600);
})();
