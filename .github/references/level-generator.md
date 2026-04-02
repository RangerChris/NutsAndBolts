# Level generator — seeded reverse-play approach

Goal

- Produce shuffled but guaranteed-solvable level states. Support reproducible seeds so levels can be shared or replayed.

Recommended method (reverse-play)

- Start from a solved board configuration where each bolt contains only one color.
- Perform N legal random moves (according to game rules) to shuffle the board. The resulting board is the playable starting state.
- Use a seeded pseudo-random generator (PRNG) so the same seed and parameters reproduce the same shuffled board.

Why reverse-play

- Guarantees solvability because each shuffle move is a legal game move; reversing the shuffle yields a solution.
- Deterministic when seeded, enabling level sharing and deterministic playtests.

Parameters

- `numBolts`: number of base bolts for level (3–9)
- `stackHeight`: capacity per bolt (3–10)
- `numColors`: number of distinct colors used; must equal active bolt count for the level per PRD rules
- `shuffleMoves`: number of reverse-play moves (scales with difficulty)
- `seed`: string/int used to initialize PRNG

Suggested shuffleMoves by difficulty

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

Pseudocode (high-level)

- initialize PRNG with `seed`
- create solved board with `numBolts`, `stackHeight`, `numColors`
- repeat `shuffleMoves` times:
  - pick random source bolt with movable top group
  - pick random valid target bolt (respecting capacity and placement rules)
  - perform move; record move
  - prevent next iteration from reversing last move
- output shuffled board and the seed used

Testing

- For several seeds per difficulty, verify that the board is solvable by reversing the recorded shuffle moves (sanity check) and that the UI can display the seed.
