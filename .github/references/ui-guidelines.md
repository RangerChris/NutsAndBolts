# UI Guidelines — current

This document captures the current UI layout, behaviors, accessibility considerations, and implementation notes for the NutsAndBolts app as implemented in the repository.

Summary of current UI features

- Top bar (`TopBar`): shows Level, Difficulty, Seed, and Palette controls. The top bar is responsive and uses wrapping (`flex-wrap`) so items move to the next row when width is constrained. Seed editing and palette selection are inline and will wrap below the level/difficulty when needed.
- Main board (`Board`): bolts are laid out inline and wrap naturally to the next row using a wrapping flex container. FLIP-style animations are used when moving nuts (cloned nut elements animate from source to target).
- Bolt rendering (`BoltView`): side-view bolt with nuts — SVG scaled down when bolt height would exceed a maximum display height. An 8px top padding ensures the top nut isn't clipped.
- Bottom controls (`BottomBar`): `Extra Bolt`, `Undo`, `Hint` and status indicators; Extra Bolt is single-use per level and disabled appropriately.
- Level Complete modal: shown when `isWin(state)` is true; Continue advances `currentLevel`, persists it, and generates a new seed.

Layout and responsiveness

- TopBar: implemented in `src/components/TopBar.tsx`. Layout rules:
 	- Container uses `display:flex`, `justify-content:space-between`, and `flexWrap: 'wrap'` so controls naturally wrap to the next line on narrow viewports.
 	- Level and Difficulty are kept visible together; Seed and Palette are rendered to the right (and wrap under when needed).
 	- Avoids a separate "More" menu; items flow across rows for predictable behavior and simpler keyboard/aria handling.
- Board: `src/components/Board.tsx` uses a wrapping flex container (`flexWrap: 'wrap'`, `flex: 0 0 auto` per bolt) so bolts fill available width and wrap remaining bolts. This makes the UI adaptively show as many bolts as will fit, then flow to next row.

Bolt visual and geometry

- `src/components/BoltView.tsx` renders a side-view bolt with the following features:
 	- Constants for geometry (WIDTH, HEAD_W/HEAD_H, SHAFT_W, SLOT_H, NUT_W/NUT_H).
 	- `slotTop`/`nutTop` helper functions compute nut positions relative to the bolt origin.
 	- `TOP_PAD` (8px) added to avoid clipping the top nut.
 	- `MAX_DISPLAY_HEIGHT` scaling: bolt SVG scales down when it would exceed a configured max height (currently 320px), preserving aspect ratio and keeping all nuts visible.
 	- Visual details: gradients for head/shaft, nut chamfer lines, thread hole ellipses, subtle highlights.

Animations and FLIP behavior

- Board collects pre-move DOM rects for each lifted nut and creates fixed-position DOM clones to animate them to their target positions. The animation is implemented using CSS transforms (translate) and transition timing (360ms ease). Clones are removed after transitionend; a safety timeout cleans up remaining clones.
- Keep animations on transforms to leverage GPU compositing (no layout/reflow during animation).

Game flow & state

- `src/app/GameShell.tsx` is the orchestrator:
 	- Uses persisted `difficulty`, `paletteId`, and per-difficulty `currentLevel` via `src/lib/persistence.ts`.
 	- `createLevel({ difficulty, level, seed })` builds `state` (generator produces deterministic boards by seed).
 	- `handleContinue()` increments `currentLevel`, persists it, generates a new seed and lets the `useEffect` regenerate the board.
 	- Level Complete dialog is shown based on `isWin(state)`.

Generator & engine notes (relevant to UI expectations)

- Reverse-play generator (`src/lib/generator.ts`) now:
 	- Uses a temporary extra column during reverse-shuffle but filters out temporary moves so returned boards do not contain helper columns.
 	- Replays the filtered move history from a solved board to produce a scrambled, reversible starting state.
 	- Ensures at least one mixed (non-uniform) bolt in the starting board so the board is not visually solved on load.
- Engine (`src/lib/engine.ts`) changes relevant to UI:
 	- `addExtraBolt` respects `extraBoltUsed` and prevents duplicates; `Extra Bolt` UI is disabled when an extra bolt exists or bolt count limit reached.
 	- `isWin` requires that each non-empty bolt be uniform and each color appears on exactly one bolt (matches the Level Complete UI trigger).

Persistence and controls

- `src/lib/persistence.ts` stores: selected palette, selected difficulty, and per-difficulty `currentLevel`.
- TopBar's difficulty selector updates persisted difficulty and loads the stored `currentLevel` for the newly selected difficulty.

Accessibility & ARIA

- ARIA labels: bolt wrapper elements include accessible labels (e.g., `aria-label="Bolt <id>, <n> of <capacity> nuts"`). Keep these up to date when modifying `BoltView` or bolt wrapper markup.
- Keyboard interactions: bolt wrapper supports `tabIndex=0` and key handlers for Enter/Space to emulate click selection.
- Palette selection: current implementation uses inline buttons; consider adding ARIA roles and keyboard navigation for palettes.
- Reduce-motion: visual settings should respect a reduced-motion preference; animation durations can be shortened or disabled based on `prefers-reduced-motion`.

Touch ergonomics

- Ensure touch-target sizes remain large (bolt container is `inline-block`; ensure CSS keeps spacing and padding so the interactive area is reachable for thumbs).

Performance

- Keep nut cloning/animation code minimal; clones are basic fixed-position nodes with small SVG content used for the sliding animation.
- Use transform for animation to avoid layout and paint churn.

Visual & UX details

- Bolt scaling: very tall bolts scale down so nuts are always visible — improves readability when bolt capacity is large.
- Wrapping behavior: TopBar and Board use wrapping to avoid hidden controls; when width is limited, controls and bolts move to the next line instead of truncating.

Testing & CI

- Unit tests (Vitest) cover engine invariants, generator reversibility, progression and persistence behaviors.
- Playwright E2E tests cover main control flows (difficulty selector, palette picker, Extra Bolt UI) and capture screenshots. CI workflow exists in `.github/workflows/playwright.yml` to run E2E on PRs and upload artifacts on failure.

Seed & sharing

- Seed is displayed in the TopBar; seed editing regenerates the board. Consider adding a small copy/share affordance next to the seed display so players can share specific levels.

Telemetry

- Suggested events to emit (consistent with current analytics plan): `level_started`, `level_completed`, `extra_bolt_used`, `palette_changed`, `seed_loaded`.

Developer notes — files of interest

- `src/components/BoltView.tsx` — bolt SVG geometry, `TOP_PAD`, scaling logic, animation anchor points.
- `src/components/Board.tsx` — FLIP clone animation and wrapping layout.
- `src/components/TopBar.tsx` — responsive top bar, moved Level/Difficulty into TopBar, seed and palette controls.
- `src/app/GameShell.tsx` — orchestration, `currentLevel` persistent state, Level Complete dialog.
- `src/lib/generator.ts` — reverse-play generator updates to avoid returning helper columns and guarantee scrambled starts.
- `src/lib/engine.ts` — `addExtraBolt`, `isWin`, move/undo semantics.
- `src/lib/persistence.ts` — persistence helpers for selected difficulty, palette, and current level.
- E2E: `playwright.config.ts`, `e2e/tests/controls.spec.ts`.

Open items / suggestions

- Palette accessibility: add keyboard navigation, ARIA roles, and optionally pattern overlays for colorblind support.
- TopBar wrap tuning: force the right-hand group (seed/palette) to full-width when wrapping for a cleaner stacked layout.
- Motion preferences: respect `prefers-reduced-motion` to disable clone animations for users who opt out.
- Bolt sizing: consider a global board-level scaling or ResizeObserver to evenly scale bolts to available space on very small screens.

Notes

- The above reflects the current implementation and recommendations. When making further UI changes, update this document and the unit/e2e tests accordingly.
