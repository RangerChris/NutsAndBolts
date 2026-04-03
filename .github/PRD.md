# PRD — Nuts and Bolts

## One-line pitch

Casual single-player puzzle: group same-colored nuts onto bolts using taps and one temporary extra bolt.

## Purpose

- Goal: Mobile-first browser puzzle that's easy to learn, progressively challenging.
- Audience: Casual mobile web players.
- Success metrics: retention (D1/D7), levels completed per session, average time per level.

## Platform & Tech

- Runtime: Mobile browser (modern iOS/Android).
- Stack: React + TypeScript (PWA-ready) with Vite. DOM/SVG rendering.
- Storage: `localStorage` for progress & seeds.
- Assets: SVGs + lightweight WebAudio clips.

## Core Gameplay & Rules

- Board: 3–9 bolts (columns) plus one player-created extra bolt (max total 10); each bolt holds 3–10 nut slots. The number of distinct colors used in a level equals the number of bolts in that level (the extra/player-created bolt counts toward this total).
- Nuts: Colored tokens (with shape/pattern overlays for colorblind support).
- Move: Tap a source bolt → pick the contiguous group of same-colored nuts at the top → tap a target bolt → move allowed if target is empty OR target top nut color matches picked color. Invalid moves show blocked animation.
- Extra Bolt: One temporary empty bolt per level (single use).
- Win: All bolts contain nuts of only one color. Level increments on completion.

## Seeded Level Generation (guaranteed solvable)

- Method: Reverse-play: start from solved layout, perform N legal random moves using seeded RNG to produce a reproducible shuffled state.
- Shuffle counts by difficulty: Easy 5–10, Medium 20–30, Hard 50–80, Extreme 120–200.
- Constraints: avoid immediate reversal, respect bolt capacities, store seed with level.
- UI: show seed on level screen; allow entering a seed to recreate a level.

## Difficulty & Progression

- Modes: Easy, Medium, Hard, Extreme (each has independent level counter).
- Scaling: increase bolts/colors/stack height or shuffle iterations per level.

## Color Palettes (4 selectable, changeable during play)

- Vibrant (expanded to 10): #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF8C42, #A56BFF, #00C2A8, #FF4DA6, #C7F464, #2F2FFF
- Pastel (expanded to 10): #FFB3BA, #FFDFBA, #FFFFBA, #BFFCC6, #B3D9FF, #E2B8FF, #FDE2FF, #DFF8E1, #FFF3B0, #CDEFFF
- Dark (expanded to 10): #D7263D, #021827, #0F4C5C, #8EA7E9, #6A1B4D, #124E4A, #3B2F2F, #5C3E91, #1F6F8B, #7A4A2F
- Colorblind-friendly (expanded to 10): #E69F00, #56B4E9, #009E73, #F0E442, #0072B2, #D55E00, #CC79A7, #88CCEE, #999999, #4D4D4D

Palettes include shape/pattern overlays for accessibility; selected palette persists.

Note: these lists provide up to 10 visually distinct base colors. Because levels may require up to 10 distinct identifiers (9 bolts + 1 player-created), the runtime should prefer using the palette entries first and, if additional distinct markers are needed, complement colors with distinct shape/pattern overlays or small HSL hue/lightness shifts that preserve perceptual separability and colorblind safety.

Note: the number of distinct colors in a level matches the number of bolts for that level (up to 9 bolts + 1 player-created bolt = 10). Palettes should therefore be treated as base sets — the runtime may generate additional distinguishable hues or apply distinct shape/pattern overlays when a level requires more unique identifiers than the base palette size.

## Data Model (simplified)

- Bolt: { id, nuts: string[] }
- GameState: { bolts: Bolt[], extraBoltUsed: bool, level: number, difficulty: string, seed?: string, moveHistory: Move[] }
- Note: number of colors in the active level equals the number of bolts in `GameState.bolts` (the extra/player-created bolt counts toward this total).
- Persisted: { progress per difficulty, settings: { paletteId } }

## UX / Mobile-First UI

- Top bar: difficulty, level, seed display/input, palette selector.
- Center: bolts horizontally (scroll/swipe if overflow).
- Bottom: Extra Bolt (remaining = 1), Undo (optional), Hint (optional).
- Interactions: tap source → highlight contiguous group → tap target to move; smooth animations & haptics where available.

## Persistence

- Key: `nuts-and-bolts:progress`. Save on level complete and on visibility change.

## Testing & Acceptance

- Unit tests: move rules, contiguous picking, generator reproducibility by seed, persistence.
- Integration: simulated playthroughs for sample seeds per difficulty.
- Acceptance: moves follow rules, empty-target moves allowed, extra bolt single-use enforced, palettes selectable and persisted, seeded generator reproducible, progress saved/restored.

## Deliverables & Tasks (tickable)

- PRD.md (this file)
- Produce UI mockups (mobile)
- Implement seeded reverse-play generator + tests
- Implement core engine (move rules, win detection)
- Implement React UI (bolts, touch handlers, animations)
- Add extra-bolt feature + UI
- Add palette selector (4 palettes) + persistence
- Add unit & integration tests
- Add placeholder assets & sounds
- Create README and run instructions
- Playtest & tune difficulty

## Questions

## Reference Docs

- [Reference index](.github/references/README.md)
- [Game mechanics](.github/references/game-mechanics.md)
- [Level generator](.github/references/level-generator.md)
- [Data model](.github/references/data-model.md)
- [Palettes](.github/references/palettes.md)
- [Persistence](.github/references/persistence.md)
- [UI guidelines](.github/references/ui-guidelines.md)
- [Testing](.github/references/testing.md)
- [Task list](.github/references/tasks.md)

## Agent Integration

- **Purpose:** Provide a quick, machine- and human-readable path for agents and contributors to discover next actions, related docs, and metadata.
- **Primary index:** See [.github/AGENT_INDEX.md](.github/AGENT_INDEX.md) for a summary of files, intent, and suggested next tasks for automation.
- **Metadata:** See [.github/prd_index.json](.github/prd_index.json) for a machine-readable manifest (file roles, priorities, and recommended agent actions).
- **Typical agent workflow:**

 1. Read this PRD (`.github/PRD.md`) for game goals and acceptance criteria.
 2. Read `.github/AGENT_INDEX.md` to map artifacts to implementation tasks.
 3. Use `.github/prd_index.json` when programmatically generating tasks, tests, or scaffolding code.
 4. Update task status back to the TODO list and create PRs against the workspace.

If you are an automated agent, prefer `.github/prd_index.json` for structured inputs and `.github/AGENT_INDEX.md` for human-friendly context.
