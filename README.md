# The Action Party: website

Static site: `index.html`, `styles.css`, `main.js`, plus `assets/`. No build step, no
dependencies. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

## The site

Six sections, each with its own personality but on one spine. A tile panel at
`#contents` is the map: every section is one click from the front door.

| Section | Title | What it does | Its own gesture |
| --- | --- | --- | --- |
| `#plan` | Our Plan to Take Action | 31 clauses in five areas | A horizontal deck you drag, swipe, or arrow through; each clause opens in place |
| `#finances` | The Finances, in the Open | Four-year ledger | Rows enter from the left, figures count up, change bars draw from a centre line |
| `#system` | How Your Vote Actually Counts | NZ MMP, explained | The page inverts to black; clouds drift; an interactive 120-seat hemicycle |
| `#people` | The Three Who Would Hold the Front Bench | The list, and who chose it | Cards tilt in 3D with the pointer and lift out of the stack |
| `#record` | The Record, Corrections Included | Everything published | Dated lines tick in against their date column |
| `#join` | Put Your Name in the Register | Join, volunteer, donate | A sliding segmented block; a black sky as the reward for finishing |

Red is the brand red (`#EA3323`) for the arrow, the tagline, and fills. Small red
labels use `--action-deep` (`#D62D1E`, 4.94:1 on white) so text passes contrast while
the hue stays put; on the black MMP field it lifts to `#F4655A`.

## MMP, correctly

The seat map is real arithmetic, not a graphic:
- below **5%** of the party vote, a party returns **no seats**;
- seats are allocated by **largest remainder** against the rest of the vote;
- **61 of 120** is a majority, and the verdict text says so.

The party you set is modelled against three opponents carved out of the remaining
vote, so the House always totals 120.

## Brand constraints this build follows

`docs/logo-and-tagline.md` is the source of truth for the identity.

- **The wordmark and tagline are never re-set in a webfont.** Both appear as raster
  crops of `docs/reference/logo-lockup-artboard.png`, per §4 and §9. The header uses
  the mark plus the party name as plain site text.
- **The vertical rule is part of the identity, not decoration.** It becomes the
  section spine: a sticky left rail carrying the clause count, the timeframe, or the
  membership price, and it draws downward as each section arrives.
- **No photography, gradients, or tinted near-black behind the lockup** (§9). The
  page is flat white, pure `#000`, one grey, one hairline. The black MMP field is a
  full page section, never a backdrop for the lockup.
- **The tagline keeps both full stops and its weight drop** (§5). It is the hero,
  set light with wide tracking, sized so each sentence stays on one line at every
  viewport, and it arrives by settling from heavy to light rather than sliding.

## Motion

Motion is authored per section so that no two sections move the same way, and every
gesture is gated on being in view. Shared rules:

- `prefers-reduced-motion: reduce` removes all movement, keeps all content visible,
  and disables smooth scrolling and the progress hairline.
- Nothing that is hidden for a reveal is hidden when scripting is off: reveal
  states are gated behind a `js` class on `<html>`.
- A pointer drag on the clause deck sets pointer capture only after 6px of travel,
  so clicking a button inside a card still works.
- The deck's arrow keys only act while focus is inside the deck, so the page is
  never hijacked.

## Accessibility

- axe-core: **0 violations** at 1440 / 834 / 390 / 320 px.
- Keyboard: skip link, visible 2px focus rings, tab strip with arrow-key navigation,
  clause deck reachable by Tab with arrow keys to move between cards, the mobile
  menu closes on Escape, and the success overlay is announced once and can be
  dismissed with Escape or a click.
- The ledger table collapses to a stacked definition layout under 48rem.
- Contrast: all small text is at or above 4.5:1, measured, including the red labels.

## Type

One variable family, self-hosted: **Archivo** (`assets/fonts/archivo-latin.woff2`,
Latin subset, `wght` 100–900, `wdth` 62–125, OFL). Display uses the wider and heavier
end; the ledger and marginalia use the condensed end; body is normal width. The brand
doc's typeface identification is unresolved (§10.1), so Archivo is a stand-in chosen
for feel. Swap the `@font-face` block and the `font-variation-settings` in
`.statement` if the real family is licensed.

## Content

All copy, candidates, figures, and the party itself are fictional demonstration
content. The footer carries an authorisation line, as real electoral material must.

Forms are front-end only: they validate and report what *would* happen, then reset.
Nothing is transmitted and nothing is stored. Wire them to a backend before any real
use.
