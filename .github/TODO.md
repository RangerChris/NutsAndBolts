# Nuts and Bolts - Master TODO

Use this as the single execution checklist for MVP -> polish.

## 0) Project Management and Scope Lock

- [ ] Confirm MVP scope and non-goals
  - [ ] Lock MVP features: core moves, seeded levels, extra bolt, palette selector, persistence
  - [ ] Mark optional features: hint quality improvements, richer audio, advanced analytics
  - [ ] Define "done" criteria for MVP release candidate
- [ ] Establish delivery plan
  - [ ] Create milestone dates (Setup, Engine, UI, QA, Release)
  - [ ] Assign owners (design, frontend, QA)
  - [ ] Decide review cadence (daily async + milestone demo)
- [ ] Create issue tracking map
  - [ ] Create one ticket per group in this checklist
  - [ ] Link each ticket to acceptance criteria in PRD
  - [ ] Tag priorities: P0 (blocker), P1 (core), P2 (polish)

## 1) Foundation and Tooling

- [ ] Initialize and verify app baseline
  - [ ] Ensure Vite + React + TypeScript app is set up and runs
  - [ ] Enable strict TypeScript settings
  - [ ] Add scripts: dev, build, test, test:watch
- [ ] Add baseline project structure
  - [ ] Create folders: src/app, src/components, src/features, src/game, src/lib, src/styles, src/test
  - [ ] Add index barrel files where useful
  - [ ] Add basic app shell and routing approach (single-screen game view is fine)
- [ ] Configure code quality and CI basics
  - [ ] ESLint + Prettier configured
  - [ ] Add CI task for lint + tests + build
  - [ ] Add pre-commit hooks (optional but recommended)

## 2) Core Domain Model and Rules Engine

- [ ] Define game types and constants
  - [ ] Create types: Bolt, NutId/ColorId, Move, GameState, Difficulty, PaletteId
  - [ ] Create constants: storage key, max bolts, difficulty configs, capacities
  - [ ] Add state invariants and guard helpers
- [ ] Implement move mechanics
  - [ ] Detect contiguous same-color group from source top
  - [ ] Validate legal target (empty or matching top color)
  - [ ] Enforce capacity constraints on destination
  - [ ] Return deterministic move result object (success/failure + reason)
- [ ] Implement extra bolt and undo
  - [ ] Add single-use extra bolt action per level
  - [ ] Track extraBoltUsed and prevent second use
  - [ ] Implement undo using move history snapshots or reversible moves
- [ ] Implement win/loss state checks
  - [ ] Win: each non-empty bolt contains only one color
  - [ ] Ignore empty bolts in win evaluation
  - [ ] Trigger level completion event payload

## 3) Seeded Level Generator (Guaranteed Solvable)

- [ ] Build reproducible RNG
  - [ ] Add seeded RNG utility (string/number seed support)
  - [ ] Add helper for deterministic random int/range/shuffle
  - [ ] Verify same seed -> same sequence across sessions
- [ ] Implement solved-state constructor
  - [ ] Generate solved board by difficulty config
  - [ ] Ensure color count matches active bolt count rules
  - [ ] Validate no bolt exceeds capacity
- [ ] Implement reverse-play shuffler
  - [ ] Perform N legal random reverse moves by difficulty range
  - [ ] Avoid immediate move reversal where possible
  - [ ] Ensure generated board is playable and non-trivial
- [ ] Expose generator API
  - [ ] createLevel({ difficulty, level, seed? }) returns GameState + seed metadata
  - [ ] Add deterministic seed format for sharing/replay
  - [ ] Store generation metadata for debugging

## 4) Progression and Difficulty Scaling

- [ ] Define progression formulas
  - [ ] Easy/Medium/Hard/Extreme config table (bolts, capacity, shuffle range)
  - [ ] Level-to-parameter scaling rules per difficulty
  - [ ] Set guardrails for max complexity on mobile
- [ ] Implement progression state
  - [ ] Separate level counters per difficulty
  - [ ] Level increment only on successful completion
  - [ ] Difficulty switch loads correct progress and current board policy
- [ ] Add balancing hooks
  - [ ] Add tunable config file for designers
  - [ ] Add quick simulation script hook (optional)
  - [ ] Add notes for playtest tuning deltas

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
