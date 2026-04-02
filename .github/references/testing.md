# Testing & validation

Test-driven development (required)

- Follow TDD for gameplay, generator, and persistence changes.
- Use the Red-Green-Refactor loop for each behavior change:
  1. Red: write a failing test for the intended behavior.
  2. Green: implement the minimal change to make the test pass.
  3. Refactor: clean up code while keeping tests green.
- Do not merge behavior changes without tests that were authored or updated first.

Unit tests

- Move rules: pick contiguous-top-group, validate placement rules, capacity enforcement.
- Level generator: seeded generation reproducibility and reverse-play verification (reversing recorded moves returns to solved state).
- Persistence: read/write schema and migrations.

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
