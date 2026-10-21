# Logo Lockup and Tagline — Reference Description

**Status:** reference description only. This file documents a raster screenshot of the
brand artwork; it is **not** the vector source. Do not trace, rebuild, or "improve" the mark
without the original Canva file or an exported SVG/PDF from the designer.

**Source assets**

| File | What it is |
| --- | --- |
| `docs/reference/canva-source-screenshot.jpg` | The original 1280×800 screenshot of the Canva editor window, exactly as received (browser chrome, tabs, and thumbnail filmstrip included — those are **not** part of the design). |
| `docs/reference/logo-lockup-artboard.png` | A pixel-exact crop of the white Canva artboard only, 838×471 px. All measurements in this document are taken from this crop. |

**Provenance (from the screenshot, for later verification)**

- Tool: Canva web editor, opened on a design named "The Action Party — Pr…" (browser tab and
  top-bar doc label).
- Editing at **49% zoom**, page **1 of 5**, 16:9 slide format. The artboard crop is 838×471 px,
  an aspect ratio of ≈1.779 (16:9 = 1.778). The design format is therefore 16:9, but the zoom
  readout does **not** map 1:1 to design pixels here (838 px ≠ 49% of 1920), so the on-screen
  pixel numbers below are proportions to preserve, not the source's real dimensions.
- Page 1 is selected in the filmstrip; pages 2–5 are empty white slides carrying only a small
  cropped corner motif (see "Filmstrip" below).
- Nothing in the screenshot defines safe margins, bleed, or export presets — those still need
  to be chosen when the mark is recomposed for the web.

---

## 1. Overall composition

The artboard is a flat white field with a single horizontal lockup plus one line of tagline
beneath it. There is no background texture, border, gradient, shadow, or photographic element
anywhere on the artboard. The design is a classic three-zone lockup:

```
 ┌──────────────────────────────────────────────────────────────┐
 │                                                              │
 │      [ A + arrow ]  │        THE                            │
 │        (mark)       │        ACTION   (stacked wordmark)     │
 │                     │        PARTY                          │
 │                                                              │
 │            Less Talk.  More Action.   (tagline)              │
 └──────────────────────────────────────────────────────────────┘
```

Reading order is deliberate: the eye hits the heavy black letterform first, is carried up and
to the right by the red arrow, lands on "ACTION" (the visually dominant word), and then drops
to the tagline. The vertical rule between mark and wordmark acts as a stop that keeps the two
halves from competing.

All elements are optically centered as a single unit within the artboard — the lockup sits
slightly above middle, leaving a visibly larger band of white beneath the tagline than above
the mark.

---

## 2. The mark: a custom "A" crossed by an arrow

### 2.1 Letterform

- **Form:** A heavy, geometric capital **A** built from two solid diagonal slabs. It is not
  drawn from a standard typeface; the strokes are unmodulated (uniform width along each leg)
  and the joins are hard, so it reads as constructed geometry rather than calligraphy.
- **Apex:** **flat and truncated**, not pointed. The top of the A is a short horizontal cut
  roughly 20% of the letter's width, which gives the mark a blunt, poster-like weight.
- **Crossbar:** **none visible.** The red arrow occupies exactly the position and angle where
  a crossbar would sit, so the arrow does double duty: it is both the A's missing stroke and
  an independent directional element. This is the core idea of the mark — action passing
  through the letter.
- **Counter:** the triangular negative space inside the A is open at the crossbar height
  because the arrow runs through it; the arrow's shaft is narrower than the counter, so slivers
  of white remain above and below the shaft at that crossing.
- **Feet:** both leg bottoms are **flat horizontal cuts** sitting on a common baseline. No
  serifs, no rounding, no overshoot.
- **Measured size:** bounding box **235 × 222 px** on the 838×471 crop — essentially square.
  With the arrow included the whole mark spans x 66–314, i.e. **248 px wide**.

### 2.2 The arrow

- **Color and treatment:** solid, flat red. No outline, no gradient, no keyline. The red butts
  directly against the black with only raster anti-aliasing between them; there is **no white
  separation gap** and the arrow reads as being **in front of** the A.
- **Construction:** a straight shaft of constant thickness with a single triangular head, no
  barbs, no tail feathering. Shaft thickness measures **≈23 px** on the crop; the head is
  roughly **34 px wide by 71 px tall**.
- **Angle:** the shaft rises left-to-right at **≈25° above horizontal** (measured tail
  (71, 297) → tip (314, 153): Δy 144 over Δx 243). Steep enough to read as rise and momentum,
  shallow enough to stay legible as a crossbar.
- **Extent:** the tail starts low and left, *outside* the left leg of the A near its foot, so
  the arrow appears to enter the letter from below-left rather than being drawn inside it. The
  tip clears the A's right leg by a wide margin and stops well short of the vertical rule —
  the arrow never touches the divider, which is what keeps the lockup from feeling closed.
- **Meaning carried:** forward motion, urgency, progress. Because it is the only saturated
  element in the composition, it also functions as the single accent the rest of the design
  must not compete with.

---

## 3. The vertical rule

- A **hairline** — effectively 1 px at 838 px wide, so its true weight in the source is
  probably a 1–2 pt line at 1920 px.
- Positioned at x = 377 on the crop, i.e. **77 px to the right of the A's right edge** and
  **31 px to the left of the wordmark** — asymmetric on purpose. The mark gets the wider
  breathing room; the type is treated as closer to its own rule.
- Height: spans **y 87–326**, which is the full height of the lockup and a hair taller than the
  A itself (94–315). It therefore brackets the mark and the wordmark together rather than
  just the text.
- It stops cleanly above the tagline and does not extend into it.

---

## 4. The wordmark

Three stacked, left-aligned, all-caps lines in a heavy grotesque sans. Measured on the crop:

| Line | Vertical extent | Cap height | Treatment |
| --- | --- | --- | --- |
| `THE` | y 110–145 | 36 px | Small, black, **widely tracked** (loose letter-spacing) |
| `ACTION` | y 176–237 | 62 px | Very large, **heavy/black weight**, black, tight tracking — the dominant element |
| `PARTY` | y 271–307 | 37 px | Medium, black, widely tracked to match `THE` |

- **Hierarchy trick:** `THE` and `PARTY` are set in the same small size and the same loose
  tracking, so they frame `ACTION` symmetrically. The name's middle word is the loudest thing
  on the page after the arrow.
- **Alignment:** all three lines share one left edge at x = 408; the block ends at x = 754.
  `THE` and `PARTY` are letter-spaced so that they optically balance the much wider `ACTION`.
- **Font identification:** not confirmable from a raster. It behaves like a geometric/grotesque
  family of the Montserrat / League Spartan / Arial Black sort — square-ish counters, horizontal
  terminals, single-storey feel in the cap forms. **Do not substitute a webfont on the live site
  until the real family is confirmed**; if a match is needed, Montserrat ExtraBold is the closest
  common web-safe-adjacent candidate and should be treated as a placeholder only.

---

## 5. The tagline

> **Less Talk. More Action.**

- **Case:** sentence-style title case, **not** all caps — only the `L`, `T`, `M`, and `A` are
  capitalised. This is the one typographic element that breaks the all-caps system, which is
  what makes it read as a spoken line rather than another label.
- **Weight:** light/regular, monoline sans — a dramatic weight drop from the wordmark. Same
  family feel as the wordmark but visibly thinner.
- **Tracking:** very wide, airier than anything above it. The inter-sentence gap (after
  "Talk.") is wider than the word gaps, so the line parses as two beats: *Less Talk.* / *More Action.*
- **Colour split — the whole point of the line:**
  - `Less Talk` is **black**, and its period is **black**.
  - `More Action` is **the same red as the arrow**, and its final period is **red**.
  - Each period matches the colour of the sentence it closes; there is no third colour.
- **Placement:** a single line, optically centred under the lockup, spanning x 145–716 and
  y 350–375 on the crop. Its centre break falls close to the vertical rule, so the black half
  sits under the mark and the red half sits under the wordmark. Baseline clearance below
  `PARTY` is ≈43 px — a full line-space, not a tight stack.
- **Punctuation:** two full stops, both retained. Dropping them changes the tone from a
  statement to a slogan fragment; keep them.

---

## 6. Colour

| Role | Sampled value (crop mean) | Notes |
| --- | --- | --- |
| Black | **#030303** | A, rule, `THE`/`ACTION`/`PARTY`, "Less Talk." Sampled mean is essentially pure black; source is likely #000000 rendered with anti-aliasing. |
| Red | **#E33728** | Arrow, "More Action.", final period. Mean of all red pixels, so the true flat fill is around #E33A2E–#E2372B. |
| White | **#FFFFFF** | Artboard/background. No off-white, no cream. |

Rough ink coverage on the artboard: white ≈ 91%, black ≈ 8%, red ≈ 1.6% (38,340 black px and
7,825 red px out of 394,698). The red is a deliberate minority — it must stay a minority. Any
layout that gives red more than a sixth of the page breaks the identity.

---

## 7. Proportional system (measured on the 838 × 471 crop)

| Element | Measurement | As % of artboard |
| --- | --- | --- |
| A mark | 235 × 222 px | 28% wide, 47% tall |
| Arrow reach (tail to tip) | 243 px horizontal, 144 px vertical | 29% wide |
| Vertical rule | 1 px wide × 240 px tall | 51% tall |
| Wordmark block | 346 × 197 px (408–754, 110–307) | 41% wide |
| `ACTION` cap height | 62 px | 13% tall |
| Tagline | 571 px wide, 25 px tall | 68% wide |
| Left margin to A | 66 px | 8% |
| Wordmark right edge to trim | 84 px | 10% |
| Top trim to rule top | 87 px | 18% |
| Tagline bottom to trim | 96 px | 20% |

These ratios are the closest thing to a spacing spec the screenshot contains. Use them as the
proportion to preserve when redrawing at other sizes — not as fixed pixels.

---

## 8. The filmstrip (pages 2–5)

The bottom of the screenshot shows five page thumbnails. Page 1 is the lockup above. Pages 2–5
are white 16:9 slides showing **only a small cropped fragment of the mark's top-right corner in
the upper-left of the frame** — a tiny black-and-red diagonal sliver, the arrowhead and a corner
of the A. Read together, they suggest a running motif: the mark used as a corner accent, cropped
so only a diagonal wedge remains, at small scale and one corner only. Treat this as an unfinished
idea in the source, not an approved secondary asset.

---

## 9. Rules for using this on the website

**Do**

- Keep the three zones in this order: mark, hairline rule, stacked wordmark. The rule is part of
  the logo, not a decorative divider that can be deleted.
- Keep the arrow the only saturated red element in any view it appears in.
- Give the lockup clear space of at least the height of the `THE` line on all sides; the source
  uses roughly 8–20% of the artboard, so never pack it tighter than 8%.
- On narrow screens, stack mark above wordmark and drop the rule (a horizontal rule or nothing);
  never shrink the whole lockup until `PARTY` stops resolving.

**Don't**

- Don't add a crossbar to the A, close the arrow's gaps, or give the arrow an outline.
- Don't recolour the arrow, or make "More Action." a different red from it.
- Don't set the tagline in all caps, in the wordmark's weight, or centre it under the wordmark
  alone — it belongs to the whole lockup.
- Don't put the lockup on photography, gradients, or any non-white field without a designer's
  sign-off; the source exists only on white.

---

## 10. Known gaps (ask before building)

1. Exact typeface family and license for the wordmark and tagline.
2. Vector master (SVG/PDF) — the screenshot is the only artefact we hold, so any web asset
   derived from it is a raster import, not a clean redraw.
3. Whether the tagline is locked to the logo or may be used separately in headers/hero copy.
4. Which red is canonical: #E33A2E, #E2372B, or something from a brand file.
5. Whether pages 2–5's corner crop is intentional and should become a motif.
