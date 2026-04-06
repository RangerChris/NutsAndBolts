# Level generator — seeded reverse-play approach

Goal

- Produce shuffled but guaranteed-solvable level states. Support reproducible seeds so levels can be shared or replayed.

Recommended method (reverse-play)

- The code implements a seeded reverse-play shuffler in `src/lib/generator.ts`.
- The generator starts from a solved board and performs `shuffleMoves` legal random moves using a seeded PRNG (`src/lib/rng.ts`).
- To enable richer shuffles it temporarily adds a helper extra bolt during shuffling (a temporary bolt id `__temp_extra`) and removes it before returning the starting board so players never start with the extra present.

Why reverse-play

- Guarantees solvability because each shuffle move is a legal game move; reversing the shuffle yields a solution.
- Deterministic when seeded, enabling level sharing and deterministic playtests.

Parameters (implemented)

- `numBolts` and `stackHeight` are derived from progression rules (`src/lib/progression.ts`) and the `DIFFICULTY_CONFIG` table (`src/lib/constants.ts`).
- `shuffleMoves` is chosen by sampling the configured shuffle range (difficulty config) using the seeded RNG.
- `seed` accepts strings or numbers and is normalized to a deterministic PRNG seed by `src/lib/rng.ts`.

Suggested shuffleMoves by difficulty (matches `DIFFICULTY_CONFIG.shuffleRange`):

- Easy: 5–10
- Medium: 20–30
- Hard: 50–80
- Extreme: 120–200

Shuffle rules and constraints

- Always perform legal moves (respect capacity and placement rules).
- Avoid immediate reversal: do not perform the direct inverse of the previous move on the next step.
- Optionally track moves to compute and store the solution path (useful for hints or solver verification).

Seed format and UI

- Accept integer or short string seeds. Normalize strings (e.g., hash to integer) before seeding PRNG.
- Display the seed on the level screen and allow users to input a seed to replay a level.

Alternative approach (post-randomize + solver)

- Generate a random board state then validate solvability with a solver. This is flexible but requires a solver (costly for offline generation) and is less deterministic unless also seeded.

Notes on current implementation details

- The generator performs partial moves (doesn't always move entire same-color stacks) to increase scramble variety.
- Because temporary helper bolts may be used during shuffling the recorded moveHistory from that process is not returned as-is; the generator filters and repairs moves to guarantee a valid returned state and then computes a small `filteredMoves` list that is stored on the returned `GameState.moveHistory`.
- The generator performs a post-shuffle normalization and invariant check (`normalizeState`, `checkStateInvariants`) before returning the `GameState`.
- The generator also attempts to ensure the returned start state is visually scrambled (guarantees at least one mixed bolt) and precomputes a bounded optimal-move estimate via `computeOptimalMoves` when possible.

Testing

- The implementation exposes deterministic behavior for a given `seed`; unit tests in `src/` verify reproducibility for canonical seeds. When adding or tuning shuffle logic, add a regression seed to `tests` to validate repeatability.

Testing

- For several seeds per difficulty, verify that the board is solvable by reversing the recorded shuffle moves (sanity check) and that the UI can display the seed.
