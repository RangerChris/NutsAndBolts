# Testing & validation

Test-driven development (required)

- The repository uses unit tests (Vitest) for engine/generator logic and component tests in `src/` plus Playwright for E2E. See `package.json` scripts and the GitHub workflow `.github/workflows/playwright.yml` for the CI configuration.

- Follow TDD for gameplay, generator, and persistence changes and keep unit tests for engine logic (generator/reversibility, move rules, persistence migration) before implementation.
  1. Red: write a failing test for the intended behavior.
  2. Green: implement the minimal change to make the test pass.
  3. Refactor: clean up code while keeping tests green.
- Do not merge behavior changes without tests that were authored or updated first.

Unit tests (current coverage recommendations)

- Engine: contiguous-top-group detection, move legality (empty target, color-match, capacity), extra-bolt single-use, undo semantics.
- Generator: seeded reproducibility and reverse-play consistency; generator currently precomputes an optimal-move bound for small depths — add regression seeds to prevent accidental drift.
- Persistence: read/write round-trip and migration paths (`migrateProgress`).

Integration tests

- Simulated playthroughs for a selection of seeds across difficulties. Verify win detection and that extra bolt usage is enforced.

Playtests

- Manual playtests with human players to tune shuffle counts and difficulty progression. Collect metrics:
  - average time to complete per level
  - moves per level
  - extra-bolt usage frequency

Acceptance criteria

- Levels generated with a seed are reproducible.
- Move rules are enforced consistently by unit tests.
- Progress persists and restores correctly.
- New behavior changes include proof of Red-Green-Refactor in PR notes or commit sequence.

Test data

- Provide a small set of canonical seeds per difficulty with expected properties (bolt count, color distribution) for regression tests.
