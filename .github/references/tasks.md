# Agent tasks — actionable checklist

Work items for implementers. Items are intentionally small and verifiable.

Testing workflow

- [ ] For each behavior change, apply TDD: Red (failing test) -> Green (minimal fix) -> Refactor.

---

## Feature: improved-game

Full design spec: `.github/references/menu-system.md`  
Acceptance criteria are listed there; implement in the order below (each step is independently testable).

### Step 1 — Types and constants

- [ ] Add `PlayMode` type (`'journey' | 'daily' | 'custom' | 'endless' | 'tutorial'`) to `src/lib/types.ts`.
- [ ] Add `Screen` discriminated union type to `src/lib/types.ts` (see `menu-system.md` → Routing/Navigation Model).
- [ ] Add `DAILY_DIFFICULTY` constant (default `'medium'`) to `src/lib/constants.ts`.
- [ ] Add `TUTORIAL_SEED` constant (`"tutorial-v1"`) to `src/lib/constants.ts`.
- [ ] Add `DAILY_SEED_VERSION` constant (`"daily-v1"`) to `src/lib/constants.ts` for future-proof daily seed prefix.

### Step 2 — Daily seed utility (TDD first)

- [ ] Write failing unit test for `getDailySeed()` in a new `src/lib/daily.test.ts`:
  - same UTC date → same seed string (format `"daily-v1-YYYY-MM-DD"`).
  - different UTC date → different seed string.
- [ ] Implement `getDailySeed(): string` in `src/lib/daily.ts`.
- [ ] Run tests green; refactor if needed.

### Step 3 — Persistence migration v1 → v2 (TDD first)

- [ ] Write failing test in `src/lib/persistence.test.ts` for `migrateProgress` v1 → v2:
  - adds `settings.tutorialCompleted: false` if missing.
  - adds `daily: { lastCompleted: null }` if missing.
  - preserves existing difficulty progress.
- [ ] Update `migrateProgress` in `src/lib/persistence.ts` to handle v1 → v2.
- [ ] Bump schema `version` to `2` in `DEFAULT_PROGRESS`.
- [ ] Run tests green.

### Step 4 — Home screen component

- [ ] Create `src/app/HomeScreen.tsx` — renders 4 mode cards (Journey, Daily, Custom Seed, Endless) plus Help/Tutorial button and Palette selector.
- [ ] Cards are keyboard-focusable with ARIA roles (`role="button"`, `aria-label`).
- [ ] Journey and Endless cards open a difficulty selector sub-screen.
- [ ] Custom Seed card opens a seed entry sub-screen with a text input and difficulty selector.
- [ ] Daily card navigates directly to game with `getDailySeed()` and `DAILY_DIFFICULTY`.
- [ ] Palette selector on home screen calls the same persistence save as in-game.
- [ ] Write Playwright E2E test: tap each card, verify navigation to game screen.

### Step 5 — AppShell / screen routing

- [ ] Create `src/app/AppShell.tsx` to own the `screen` state and render the correct screen.
- [ ] Replace direct render of `GameShell` in `src/App.tsx` with `AppShell`.
- [ ] `AppShell` passes `PlayMode`, `difficulty`, and `seed` down to `GameShell` as props.
- [ ] Add a Back button to `GameShell`'s TopBar; tapping it sets screen back to `{ type: 'home' }`.
- [ ] Back button is hidden in tutorial mode (tutorial has its own exit).

### Step 6 — TopBar: hide seed/debug per mode

- [ ] Add `showSeed: boolean` prop to `TopBar`.
- [ ] `showSeed` is `true` only when `playMode === 'custom'`.
- [ ] Remove or conditionally hide any debug-only output (seed text not in an input) for all other modes.
- [ ] Daily mode TopBar shows the date label (e.g. "Daily · Apr 11") instead of level number.
- [ ] Update `TopBar` unit/snapshot tests to cover the new prop.

### Step 7 — BottomBar: center buttons

- [ ] Update `src/components/BottomBar.tsx` layout to `display:flex; justify-content:center; gap:1.5rem`.
- [ ] Verify on narrow viewports (320px) that buttons do not overflow.
- [ ] Update Playwright screenshot test if one exists for BottomBar.

### Step 8 — Tutorial mode

- [ ] Create `src/app/TutorialShell.tsx` — wraps `GameShell` with a step-driven overlay.
- [ ] Define tutorial steps array (5 steps) with: `targetElement`, `message`, `requiredAction`.
- [ ] Overlay renders as a bottom-anchored banner pointing at the target element.
- [ ] Overlay advances only when the player performs the instructed action; step detection hooks into engine events (move success, extra bolt, win).
- [ ] "Skip tutorial" button visible at all times; dismisses overlay and marks tutorial done.
- [ ] On tutorial win or skip: set `tutorialCompleted: true` in persistence, transition to home screen.
- [ ] Uses `aria-live="polite"` region for step announcements.
- [ ] Write Playwright E2E test: complete all 5 tutorial steps, verify home screen returned and flag set.

### Step 9 — Daily completion tracking

- [ ] On win in Daily mode: save `daily.lastCompleted = today's UTC date` to persistence.
- [ ] Home screen Daily card shows a "Completed today ✓" badge when `daily.lastCompleted === getDailySeed date`.
- [ ] Write unit test for completion detection logic.

### Step 10 — Endless mode wiring

- [ ] In `GameShell`, when `playMode === 'endless'`: on win, generate a new random seed (use `Math.random()` as seed source, no persistence update) and reload the board.
- [ ] "Next Puzzle" button replaces the standard "Continue" in the Level Complete modal for Endless mode.
- [ ] No level counter shown in TopBar for Endless mode.

### Step 11 — Integration and regression

- [ ] Run full unit test suite; fix any regressions.
- [ ] Run Playwright E2E suite; fix any regressions.
- [ ] Manually verify on a 375px wide viewport (iPhone SE) that:
  - Home screen cards are tappable.
  - Bottom bar buttons are centered and not clipped.
  - TopBar wraps cleanly for Journey and Daily modes (no seed input).
- [ ] Update `.github/references/menu-system.md` acceptance criteria checkboxes.

---

Design

- [ ] Finalize move rules and capacity policy (documented in `game-mechanics.md`).
- [ ] Approve palette designs (colors + patterns) in `palettes.md`.

Generator

- [ ] Implement seeded reverse-play generator using parameters in `level-generator.md`.
- [ ] Add reproducibility tests using canonical seeds.

Engine

- [ ] Implement `GameState` and `Bolt` types per `data-model.md`.
- [ ] Implement move logic: pick contiguous group, validate target, execute move, record history.
- [ ] Implement extra-bolt single-use logic.

UI

- [ ] Create mobile mockups and get design signoff.
- [ ] Implement bolts rendering and touch handlers following `ui-guidelines.md`.
- [ ] Implement palette selector and pattern overlays.

Persistence & QA

- [ ] Implement `localStorage` persistence and migrations per `persistence.md`.
- [ ] Create unit tests and integration tests listed in `testing.md`.

Polish

- [ ] Add placeholder assets and sound FX (UI feedback and success chime).
- [ ] Run playtest sessions for early levels and iterate on shuffle counts.

Notes

- Each task should include a small PR with focused changes, tests for behavior, and a short description of decisions.
- PR descriptions should state which tests were written first (Red), what made them pass (Green), and any safe refactors.
