# The Action Party — website

Static site: `index.html`, `styles.css`, `main.js`, plus `assets/`. No build step, no
dependencies. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

## Brand constraints this build follows

`docs/logo-and-tagline.md` is the source of truth for the identity. The site is built to
respect it rather than to look generically "modern":

- **The wordmark and tagline are never re-set in a webfont.** Both appear as raster crops of
  `docs/reference/logo-lockup-artboard.png` (`assets/img/mark.png`, `assets/img/logo-lockup.png`),
  per §4 and §9. The header uses the mark plus the party name as plain site text — not a
  re-drawn wordmark.
- **The vertical rule is part of the identity, not decoration.** On the page it becomes the
  section spine: a sticky left rail whose rule carries the clause count, the timeframe, or
  the membership price for that section.
- **Red stays a minority.** `--action` (`#EA3323`) is used only for the arrow (in the logo
  artwork), "More action." in the hero, and form error text. Measured red ink is ~3% of a
  desktop viewport, ~1% on mobile; the brand doc's artboard reference is 1.6%.
- **No photography, gradients or tinted near-black behind the lockup** (§9). The page is flat
  white, pure `#000`, one grey, one hairline.
- **The tagline keeps both full stops and its weight drop** (§5). It is set light with wide
  tracking, sized so each sentence stays on one line at every viewport, and is used as the
  hero rather than demoted to a caption.

## Type

One variable family, self-hosted: **Archivo** (`assets/fonts/archivo-latin.woff2`, Latin
subset, `wght` 100–900, `wdth` 62–125, OFL). Display uses the wider/heavier end; the ledger
and marginalia use the condensed end; body is normal width. The brand doc's *typeface
identification is unresolved* (§10.1), so Archivo is a stand-in chosen for feel — swap the
`@font-face` block (and the `font-variation-settings` in `.statement`/`.statement__line` if
the new family is not variable) when the real family is licensed.

## Content

All copy, candidates, figures and the party itself are fictional demonstration content. The
footer carries an authorisation line, as real electoral material must.

Forms are front-end only: they validate and report what *would* happen, then reset. Nothing
is transmitted and nothing is stored. Wire them to a backend before any real use.

## Accessibility

- axe-core: 0 violations at 1440 / 834 / 390 / 320 px.
- Keyboard: skip link, visible 2px focus rings, tab strip with arrow-key navigation, native
  `<details>` disclosures, mobile menu closes on Escape.
- `prefers-reduced-motion` removes the single entrance animation and smooth scrolling.
- The ledger table collapses to a stacked definition layout under 48rem.
