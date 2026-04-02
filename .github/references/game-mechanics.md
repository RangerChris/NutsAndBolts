# Game mechanics — Nuts and Bolts

Summary

- Single-player, turn-based grouping puzzle. Player moves contiguous same-colored nuts from the top of one bolt to another.

Board constraints

- Bolts: 3–9 base columns per level, plus one player-created temporary extra bolt (max total 10). Each bolt has a fixed capacity (3–10 slots depending on level parameters).
- Nuts: colored tokens. Each bolt in a solved state contains nuts of a single color.
- Colors: number of distinct colors in a level equals the number of bolts in that level (the temporary extra bolt counts toward this total per PRD rules).

Move rules

- Selection: tapping a bolt picks up the contiguous group of same-colored nuts at the top of that bolt (one or more). The contiguous group is formed by consecutive nuts at the top that share the same color.
- Placement: tapping a target bolt attempts to place the picked group on top of that bolt.
- Valid placement: the move is allowed if either the target bolt is empty, OR the color of the picked group equals the color of the target bolt's top nut. Also the target bolt must have enough free capacity to accept the whole group.
- Invalid placement: if placement is invalid, the game should provide immediate feedback (shake, brief red flash, or similar) and return the group to the source bolt.

Extra bolt

- The player may request exactly one temporary empty bolt per level. This extra bolt is a single-use resource and is removed on level completion or restart.

Win condition

- A level is completed when every non-empty bolt contains nuts of only one color (i.e., all nuts on each bolt share the same color) and no bolt contains a mix of colors.

Undo/hint (optional)

- `Undo` can revert the last move; useful for accessibility and players who make quick mistakes.
- `Hint` may show a safe move or the next move from a known solution path; should be limited (e.g., cooldown or charge).

Edge cases

- Moves that would exceed bolt capacity must be disallowed.
- If a player picks from an empty bolt, ignore the tap.
- Selection should be deterministic and consistent across platforms.

Telemetry events (recommended)

- `move_attempted`, `move_succeeded`, `move_failed`, `extra_bolt_used`, `level_completed`, `level_started`.
