# Agent tasks — actionable checklist

Work items for implementers. Items are intentionally small and verifiable.

Testing workflow

- [ ] For each behavior change, apply TDD: Red (failing test) -> Green (minimal fix) -> Refactor.

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
