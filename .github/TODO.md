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

- [ ] Implement persistence schema
  - [ ] Use key: nuts-and-bolts:progress
  - [ ] Save progress per difficulty
  - [ ] Save settings: selected palette, optional haptics/audio toggles
- [ ] Implement load/save lifecycle
  - [ ] Load on app start with safe fallback
  - [ ] Save on level complete
  - [ ] Save on visibility change / app background
- [ ] Add migration and resilience
  - [ ] Version persisted schema
  - [ ] Add migration path for future schema updates
  - [ ] Handle corrupted localStorage gracefully (reset with warning)

## 6) UX/UI Implementation (Mobile-First)

- [ ] Build top bar
  - [ ] Difficulty selector
  - [ ] Level display
  - [ ] Seed display + seed input/recreate action
  - [ ] Palette selector
- [ ] Build board area
  - [ ] Horizontal scroll/swipe when bolts overflow
  - [ ] Bolt component with clear slot capacity visualization
  - [ ] Nut tokens with color + pattern overlay support
- [ ] Build interaction flow
  - [ ] Tap source highlights valid contiguous pick
  - [ ] Tap target executes move if valid
  - [ ] Invalid target shows blocked feedback animation
- [ ] Build bottom action bar
  - [ ] Extra Bolt action with remaining indicator
  - [ ] Undo action
  - [ ] Hint placeholder button and disabled-state rules
- [ ] Responsive and performance polish
  - [ ] Smooth 60fps animation targets on common mobile devices
  - [ ] Touch-friendly hit targets
  - [ ] Minimize layout shift during animations

## 7) Accessibility and Color System

- [ ] Implement 4 palettes from PRD
  - [ ] Vibrant palette mapping
  - [ ] Pastel palette mapping
  - [ ] Dark palette mapping
  - [ ] Colorblind-friendly palette mapping
- [ ] Add non-color distinguishers
  - [ ] Pattern/shape overlays per color id
  - [ ] Ensure overlays remain visible on small token sizes
  - [ ] Verify contrast for UI labels and controls
- [ ] Add accessibility checks
  - [ ] Keyboard navigation basics for non-touch users
  - [ ] Accessible names for controls
  - [ ] Reduced motion preference handling (optional for MVP, recommended)

## 8) Feedback, Audio, and Feel

- [ ] Add interaction feedback
  - [ ] Valid move animation
  - [ ] Invalid move blocked animation
  - [ ] Win celebration micro-animation
- [ ] Add optional haptics/audio
  - [ ] Move/click/blocked/win sound placeholders
  - [ ] Haptic pulse on key actions where supported
  - [ ] Add settings toggles for audio/haptics
- [ ] Add game feel tuning pass
  - [ ] Adjust animation timings for readability and speed
  - [ ] Tune highlight clarity for selected source/group
  - [ ] Reduce accidental taps with subtle debounce where needed

## 9) Testing Strategy and QA

- [ ] Unit tests (engine)
  - [ ] Contiguous top-group detection
  - [ ] Move legality rules (empty target, matching color, capacity)
  - [ ] Extra bolt single-use enforcement
  - [ ] Win condition evaluation
- [ ] Unit tests (generator + persistence)
  - [ ] Same seed reproducibility
  - [ ] Difficulty shuffle range adherence
  - [ ] Save/load round-trip for progress and palette
- [ ] Integration tests
  - [ ] Simulated playthroughs for sample seeds per difficulty
  - [ ] Regression tests for undo and extra bolt interactions
  - [ ] UI flow tests: select source -> select target -> result state update
- [ ] Manual QA matrix
  - [ ] iOS Safari latest stable
  - [ ] Android Chrome latest stable
  - [ ] Small-screen and large-screen mobile layouts

## 10) Documentation and Developer Experience

- [ ] Update README
  - [ ] Game overview and controls
  - [ ] Local run instructions
  - [ ] Test and build instructions
- [ ] Add design docs
  - [ ] Link PRD and this TODO
  - [ ] Add balancing notes and tunable parameters doc
  - [ ] Add seed/debug guide for QA reproduction
- [ ] Add contribution guidance
  - [ ] Branch/PR checklist
  - [ ] Definition of done
  - [ ] Release notes template

## 11) Release Readiness

- [ ] Acceptance criteria verification
  - [ ] Moves follow all PRD rules
  - [ ] Empty-target moves allowed
  - [ ] Extra bolt single-use enforced
  - [ ] Palette selectable and persisted
  - [ ] Seeded generator reproducible
  - [ ] Progress saved/restored
- [ ] Performance and stability gate
  - [ ] No critical console errors in production build
  - [ ] No failing tests in CI
  - [ ] Mobile usability sign-off
- [ ] Launch package
  - [ ] Tag release candidate
  - [ ] Publish build
  - [ ] Capture post-launch metrics baseline

## Optional Stretch (Post-MVP)

- [ ] Smart hint system that avoids trivial suggestions
- [ ] Daily challenge seeded mode
- [ ] Theme packs and cosmetic unlocks
- [ ] Lightweight analytics dashboard for balancing insights
