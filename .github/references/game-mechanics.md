# Game mechanics — Nuts and Bolts

Summary

- Single-player, deterministic, turn-based grouping puzzle. The player moves contiguous same-colored nuts from the top of one bolt to another.

- Objective: starting from a scrambled board, rearrange nuts so that each non-empty bolt contains nuts of a single color.

Board constraints

- Bolts: levels use 3–9 base bolt columns. The player may add exactly one temporary extra bolt during play (single-use). Each bolt has a fixed capacity (commonly 3–10 slots depending on difficulty/level parameters).

- Nuts: colored tokens stacked on bolts. A solved bolt contains nuts of a single color only.

- Colors: the generator targets a number of distinct colors appropriate for the level. To support shuffle generation the generator may temporarily use additional columns (a transient extra bolt) during reverse-play shuffling, but the returned starting board does not include that transient bolt. The player's single-use extra bolt is not present in the returned starting board and must be added by the player during play.

Move rules

- Selection: tapping (or keyboard-activating) a bolt picks up the contiguous group of same-colored nuts at the top of that bolt (one or more). If the bolt is empty the tap is ignored.

- Placement: tapping a target bolt attempts to place the picked group on top of that bolt.

- Valid placement: the move is allowed iff the target bolt is empty OR the color of the picked group equals the color of the target bolt's top nut, AND the target has enough free capacity to accept the entire group. Partial placements are disallowed.

- Invalid placement: if placement is invalid the UI should provide immediate feedback (shake, brief red flash, etc.) and the engine must leave the game state unchanged.

Extra bolt (player-controlled)

- The UI exposes an "Extra Bolt" action that adds one empty bolt to the board. This action is single-use per level; the UI should disable the action when an extra bolt is already present or when the board has reached the maximum allowed columns.

- The engine enforces this invariant and will return a failure result when an attempt is made to add a second extra bolt.

- The extra bolt is removed on level completion or when the level is restarted.

- Generator note: during reverse-play generation the shuffler may temporarily create an extra bolt to enable legal reverse moves; this transient bolt is removed before returning the starting board so the player does not see it pre-added.

Win condition

- A level is complete when every non-empty bolt contains nuts of a single color (no mixed bolts) and any level-specific solved constraints are met. The presence of the player's extra bolt does not alter the solved predicate; if the solved condition is met while the extra is present, the level is considered completed and the extra is cleaned up.

Undo / Hint

- `Undo` should revert the last successful move and restore engine state to the previous moment. If the engine semantics allow it, undo should also restore any resources consumed by the last move.

- `Hint` may highlight a legal move or suggest the next move from a computed solution path. Hints should be conservative and rate-limited to avoid trivializing puzzles.

Engine & generator notes

- Determinism: level generation is seedable — given the same seed and difficulty the generator must produce the same starting board.

- Scrambling: the reverse-play shuffler biases toward producing visually scrambled starts. To achieve this it may allow temporary helper columns during shuffle, but it must strip transient helper columns before returning the starting state.

- Extra bolt in generation: the generator should not return a board with the player's extra bolt pre-added; the extra bolt exists only when the player requests it during play.

Edge cases & invariants

- Capacity: moves that would exceed a bolt's capacity are disallowed.
- Deterministic selection: selection and move resolution must be deterministic and independent of rendering timing or animations.
- Single extra bolt: the engine must never allow more than one player extra bolt per level.
- IDs: bolt and nut ids must be stable and unique within a level so replay/undo and animations can reliably reference DOM elements.

Telemetry events (recommended)

- `level_started` — include seed and difficulty
- `move_attempted` — include src, tgt, moved count, and attempted color
- `move_succeeded`
- `move_failed` — include failure reason (capacity, color mismatch, etc.)
- `extra_bolt_requested` — accepted/denied
- `level_completed` — moves count, elapsed time

Accessibility notes

- All interactive controls (difficulty, seed input, palette picker, Extra Bolt, Undo, Hint) must be keyboard-focusable and expose appropriate ARIA attributes. The palette picker and Extra Bolt should support both keyboard and mouse interaction.

- Animations are presentation-only; the game logic must be accessible via non-animated flows and must not rely on animation timing.

Design notes

- The UI uses a FLIP-style clone animation for moving nuts to give smooth visual feedback. Animations must be cancelled/cleaned up when the game resets or navigates away.

- The engine returns structured success/failure results for actions (move, addExtraBolt, undo) so the UI can show contextual feedback without guessing engine internals.

Implementation notes (current codebase)

- Bolt stack representation: nuts are stored with the top at the array end (push/pop semantics). See `src/lib/types.ts` and `src/components/BoltView.tsx`.
- Extra bolt guard: `addExtraBolt` checks `state.extraBoltUsed` and for existing bolt ids prefixed with `extra-` and will refuse a second extra. See `src/lib/engine.ts`.
- Win predicate: the implemented `isWin` requires each non-empty bolt to be uniform and for no color to appear on more than one bolt.
- Generator behavior: the reverse-play generator (`src/lib/generator.ts`) may add a temporary helper bolt (`__temp_extra`) while shuffling and removes it before returning the starting board; the generator normalizes state and attempts to ensure the returned start has at least one mixed bolt.
- Telemetry: the code uses `src/lib/balancer.ts` to emit generator and game events (including `levelComplete` details). Designers can subscribe to `onBalancerEvent` to capture playtest data.
