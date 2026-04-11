# Menu System — improved-game feature

## Overview

The "improved-game" feature replaces the inline in-game difficulty dropdown with a proper **Home Screen Menu** that lets players choose how they want to play. Inside the game itself, the TopBar and BottomBar are also cleaned up.

---

## Home Screen Layout

```
┌──────────────────────────────────────┐
│           Nuts & Bolts               │
│          [logo / title]              │
│                                      │
│  ┌──────────┐   ┌──────────┐         │
│  │ Journey  │   │  Daily   │         │
│  └──────────┘   └──────────┘         │
│  ┌──────────┐   ┌──────────┐         │
│  │ Custom   │   │ Endless  │         │
│  │  Seed    │   │          │         │
│  └──────────┘   └──────────┘         │
│                                      │
│       [ ? Help / Tutorial ]          │
│         [ Palette ]                  │
└──────────────────────────────────────┘
```

- Rendered as a full-screen card grid on mobile.
- Palette selector and help button accessible from home screen (do not require entering a level).
- Journey mode offers a secondary screen for difficulty selection (Easy / Medium / Hard / Extreme).

---

## Play Modes

### Journey

- Existing progression behaviour: per-difficulty level counter.
- On selecting Journey, player chooses difficulty (Easy/Medium/Hard/Extreme) then enters the game.
- Seed is generated from `difficulty + currentLevel`; seed input is **hidden** from TopBar.
- Level counter visible in TopBar.

### Daily

- One board per UTC calendar day, identical for all players.
- Seed formula: `"daily-" + toISOString().slice(0,10)` (e.g. `"daily-2026-04-11"`).
- Difficulty for the daily board is fixed at **Medium** (tunable via a constant).
- TopBar shows "Daily" label and the date; seed input is **hidden**.
- No persistent level progression is stored for Daily — only a completion flag per date.
- Persisted key addition: `daily: { lastCompleted: "YYYY-MM-DD" }` in the progress schema.

### Custom Seed

- Player types any seed string on the home screen before entering.
- Difficulty selector also shown on this screen.
- TopBar shows the seed input (the one case where seed is visible in-game).
- No level counter increments; not persisted as progress.

### Endless

- Random seed per board (not reproducible, no sharing).
- Player picks difficulty on home screen.
- No level counter shown in TopBar.
- Seed is **hidden** from TopBar.

---

## Tutorial / Help Mode

Goal: teach a new player the complete game loop on a simple, guided board.

### Structure (step-by-step overlay)

1. **Welcome** — "Sort the nuts! Tap a bolt to pick up nuts of the same color."
2. **Pick** — Highlight a suggested source bolt. Player taps it; overlay confirms group is lifted.
3. **Place** — Highlight a valid target bolt. Player taps it; move executes.
4. (removed) Extra Bolt — the Extra Bolt feature was removed from the game. Tutorial steps do not require it.
5. **Win** — Trigger win state on a simple 3-bolt, 3-color, depth-3 board. Show congratulation overlay.

### Fixed tutorial board

- Hard-coded seed: `"tutorial-v1"` using `createLevel` with `difficulty: 'easy'` and a forced low shuffle count.
- The tutorial board is always the same and does not use random generation.
- Tutorial state is not persisted as level progress.
- A `tutorialCompleted` flag is stored in `settings` so the tutorial is not auto-launched on second visit, but remains accessible from the home screen.

### Overlay UX

- Each step is a small bottom-anchored tooltip / banner pointing at the target UI element.
- Player must perform the instructed action to advance; overlay does not auto-advance.
- A "Skip tutorial" button is always visible.
- Overlay uses `aria-live` region for screen-reader announcements.

---

## In-Game UI Changes

### TopBar

| Mode | Shows seed input? | Shows level? | Shows difficulty? |
|---|---|---|---|
| Journey | No | Yes | Yes |
| Daily | No (shows date) | No | No |
| Custom Seed | Yes | No | Yes |
| Endless | No | No | Yes |
| Tutorial | No | No | No |

### BottomBar

- Current layout: buttons left-aligned or unevenly spaced.
- New layout: `display:flex; justify-content:center; gap: 1.5rem;` — Extra Bolt, Undo, Hint evenly centered.
- Extra Bolt indicator (remaining count) stays inline with the button.

---

## Routing / Navigation Model

No router library is required. Use a `screen` state value in `GameShell` (or a new `AppShell`):

```
type Screen =
  | { type: 'home' }
  | { type: 'difficulty-select'; mode: 'journey' | 'endless' }
  | { type: 'custom-seed-entry' }
  | { type: 'game'; mode: PlayMode; difficulty: Difficulty; seed: string }
  | { type: 'tutorial' }
```

Transition: Home → (difficulty select or seed entry) → Game  
Back button (in TopBar) returns to Home from within any game screen.

---

## Data Model Additions

### `PlayMode` type

```typescript
type PlayMode = 'journey' | 'daily' | 'custom' | 'endless' | 'tutorial';
```

### Persistence additions (schema version bump required)

```json
{
  "version": 2,
  "difficulties": { ... },
  "settings": {
    "paletteId": 0,
    "tutorialCompleted": false
  },
  "daily": {
    "lastCompleted": "2026-04-11"
  }
}
```

---

## Daily Seed Formula

```typescript
function getDailySeed(): string {
  return 'daily-' + new Date().toISOString().slice(0, 10); // UTC date YYYY-MM-DD
}
```

- Pure function, no server dependency.
- Same result for all players in the same UTC day.
- Changing the board: increment a version suffix (e.g. `"daily-v2-2026-04-11"`) as a constant in code if a daily puzzle needs to be replaced.

---

## Acceptance Criteria

- [ ] Home screen renders with 4 play mode cards + Help button + Palette selector.
- [ ] Journey mode: selects difficulty, enters game, hides seed in TopBar, persists level progress.
- [ ] Daily mode: generates identical board for all players on same UTC day; shows date not seed; stores completion flag.
- [ ] Custom Seed mode: allows seed entry, shows seed in TopBar, does not increment level progress.
- [ ] Endless mode: generates random boards; hides seed; no level counter.
- [ ] Tutorial: guided 5-step overlay on fixed board; skip button; `tutorialCompleted` flag persisted.
- [ ] BottomBar buttons are centered (flexbox) in all modes.
- [ ] TopBar seed input absent in Journey/Daily/Endless/Tutorial modes.
- [ ] Persistence schema migrated to version 2; existing progress preserved.
- [ ] Back navigation from any game screen returns to Home.
- [ ] All new UI elements keyboard-accessible with ARIA labels.
- [ ] Unit tests: `getDailySeed()` returns consistent value for same UTC date.
- [ ] Unit tests: persistence migration v1 → v2 round-trips correctly.
- [ ] Playwright E2E: navigate to each mode, complete a short game, return to home.
- [ ] Playwright E2E: tutorial completes all 5 steps and sets `tutorialCompleted` flag.
