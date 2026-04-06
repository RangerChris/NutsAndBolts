# Nuts and Bolts - Master TODO

Use this as the single execution checklist for MVP -> polish.

## 0) Project Management and Scope Lock

- [x] Confirm MVP scope and non-goals
  - [x] Lock MVP features: core moves, seeded levels, extra bolt, palette selector, persistence — RangerChris
  - [x] Mark optional features: hint quality improvements, richer audio, advanced analytics — RangerChris
  - [x] Define "done" criteria for MVP release candidate — RangerChris
- [x] Establish delivery plan
  - [x] Create milestone dates (Setup, Engine, UI, QA, Release) — flexible / no fixed deadlines
  - [x] Assign owners (design: RangerChris, frontend: RangerChris, QA: RangerChris)
  - [x] Decide review cadence (as-needed + milestone demo) — RangerChris
- [x] Create issue tracking map — Not applicable (solo hobby project; using TODO.md in repo)
  - [x] Create one ticket per group in this checklist — Not required
  - [x] Link each ticket to acceptance criteria in PRD — Not required
  - [x] Tag priorities: P0 (blocker), P1 (core), P2 (polish) — Not required

## 1) Foundation and Tooling

- [x] Initialize and verify app baseline
  - [x] Ensure Vite + React + TypeScript app is set up and runs
  - [x] Enable strict TypeScript settings
  - [x] Add scripts: dev, build, test, test:watch
- [x] Add baseline project structure
  - [x] Create folders: src/app, src/components, src/features, src/game, src/lib, src/styles, src/test
  - [x] Add index barrel files where useful
  - [x] Add basic app shell and routing approach (single-screen game view is fine)

## 2) Core Domain Model and Rules Engine

- [x] Define game types and constants
- [x] Create types: Bolt, NutId/ColorId, Move, GameState, Difficulty, PaletteId
- [x] Create constants: storage key, max bolts, difficulty configs, capacities
- [x] Add state invariants and guard helpers
- [x] Implement move mechanics
- [x] Detect contiguous same-color group from source top
- [x] Validate legal target (empty or matching top color)
- [x] Enforce capacity constraints on destination
- [x] Return deterministic move result object (success/failure + reason)
  - [x] Implement extra bolt and undo
  - [x] Add single-use extra bolt action per level
  - [x] Track extraBoltUsed and prevent second use
  - [x] Implement undo using move history snapshots or reversible moves
- [x] Implement win/loss state checks
- [x] Win: each non-empty bolt contains only one color
- [x] Ignore empty bolts in win evaluation
- [x] Trigger level completion event payload

## 3) Seeded Level Generator (Guaranteed Solvable)

- [x] Build reproducible RNG
  - [x] Add seeded RNG utility (string/number seed support)
  - [x] Add helper for deterministic random int/range/shuffle
  - [x] Verify same seed -> same sequence across sessions
- [x] Implement solved-state constructor
- [x] Generate solved board by difficulty config
- [x] Ensure color count matches active bolt count rules
- [x] Validate no bolt exceeds capacity
- [x] Implement reverse-play shuffler
- [x] Perform N legal random reverse moves by difficulty range
- [x] Avoid immediate move reversal where possible
- [x] Ensure generated board is playable and non-trivial
- [x] Expose generator API
- [x] createLevel({ difficulty, level, seed? }) returns GameState + seed metadata
- [x] Add deterministic seed format for sharing/replay
- [x] Store generation metadata for debugging

## 4) Progression and Difficulty Scaling

- [x] Define progression formulas
- [x] Easy/Medium/Hard/Extreme config table (bolts, capacity, shuffle range)
- [x] Level-to-parameter scaling rules per difficulty
- [x] Set guardrails for max complexity on mobile
- [x] Implement progression state
- [x] Separate level counters per difficulty
- [x] Level increment only on successful completion
- [x] Difficulty switch loads correct progress and current board policy
- [x] Add balancing hooks

## 5) Persistence and Recovery

- [x] Implement persistence schema
- [x] Use key: nuts-and-bolts:progress
- [x] Save progress per difficulty
- [x] Save settings: selected palette, optional haptics/audio toggles
- [x] Implement load/save lifecycle
- [x] Load on app start with safe fallback
- [x] Save on level complete
- [x] Save on visibility change / app background
- [x] Add migration and resilience
- [x] Version persisted schema
- [x] Add migration path for future schema updates
- [x] Handle corrupted localStorage gracefully (reset with warning)
- [x] Persist per-difficulty `seed` so reloads recreate same level

## 6) UX/UI Implementation (Mobile-First)

- [x] Build top bar
  - [x] Difficulty selector
  - [x] Level display
  - [x] Seed display + seed input/recreate action
  - [x] Palette selector
- [x] Build board area
  - [x] Horizontal scroll/swipe when bolts overflow
  - [x] Bolt component with clear slot capacity visualization
  - [x] Nut tokens with color + pattern overlay support
- [x] Build interaction flow
  - [x] Tap source highlights valid contiguous pick
  - [x] Tap target executes move if valid
  - [x] Invalid target shows blocked feedback animation
- [x] Build bottom action bar
  - [x] Extra Bolt action with remaining indicator
  - [x] Undo action
  - [x] Hint placeholder button and disabled-state rules

## 7) Accessibility and Color System

- [x] Implement 4 palettes from PRD
  - [x] Vibrant palette mapping
  - [x] Pastel palette mapping
  - [x] Dark palette mapping
  - [x] Colorblind-friendly palette mapping
- [x] Add non-color distinguishers
  - [x] Pattern/shape overlays per color id
  - [x] Ensure overlays remain visible on small token sizes
  - [x] Verify contrast for UI labels and controls
- [x] Add accessibility checks
  - [x] Keyboard navigation basics for non-touch users
  - [x] Accessible names for controls
  - [x] Reduced motion preference handling (optional for MVP, recommended)

## 8) Feedback, Audio, and Feel

- [x] Add interaction feedback
  - [x] Valid move animation
  - [x] Invalid move blocked animation
  - [x] Win celebration micro-animation
- [x] Add game feel tuning pass
  - [x] Adjust animation timings for readability and speed
  - [x] Tune highlight clarity for selected source/group

## 9) Testing Strategy and QA

- [x] Unit tests (engine)
  - [x] Contiguous top-group detection
  - [x] Move legality rules (empty target, matching color, capacity)
  - [x] Extra bolt single-use enforcement
  - [x] Win condition evaluation

- [x] Unit tests (generator + persistence)
  - [x] Same seed reproducibility
  - [x] Difficulty shuffle range adherence
  - [x] Save/load round-trip for progress and palette

- [x] Integration tests
  - [x] Simulated playthroughs for sample seeds per difficulty
  - [x] Regression tests for undo and extra bolt interactions
  - [x] UI flow tests: select source -> select target -> result state update

## 10) Documentation and Developer Experience

- [x] Update README
  - [x] Game overview and controls
  - [x] Local run instructions
  - [x] Test and build instructions
- [x] Add design docs
  - [x] Link PRD and this TODO
  - [x] Add balancing notes and tunable parameters doc
  - [x] Add seed/debug guide for QA reproduction

## 11) Release Readiness

- [ ] Acceptance criteria verification
  - [x] Moves follow all PRD rules
  - [x] Empty-target moves allowed
  - [x] Extra bolt single-use enforced
  - [x] Palette selectable and persisted
  - [x] Seeded generator reproducible
  - [x] Progress saved/restored
- [ ] Performance and stability gate
  - [x] No critical console errors in production build
  - [x] No failing tests in CI
  - [ ] Mobile usability sign-off
- [ ] Launch package
  - [ ] Tag release candidate
  - [x] Publish build
  - [ ] Capture post-launch metrics baseline
