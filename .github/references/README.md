# References for Nuts and Bolts

This folder contains design and implementation references for agents working on the Nuts and Bolts project. Files are grouped by topic so implementers can find the information they need quickly.

Files:

- `game-mechanics.md` — detailed gameplay rules and move semantics
- `level-generator.md` — seeded reverse-play generator design and parameters
- `ui-guidelines.md` — mobile-first UI and interaction guidelines
- `palettes.md` — four selectable color palettes and accessibility notes
- `data-model.md` — runtime and persisted data structures
- `persistence.md` — localStorage schema and save/load behavior
- `testing.md` — unit/integration/playtest guidance
- `tasks.md` — actionable checklist for agent implementers
- `menu-system.md` — **improved-game feature**: home screen hub, play modes (Journey/Daily/Custom/Endless/Tutorial), in-game UI changes (TopBar seed visibility, BottomBar centering)

Read the relevant file before starting work; these documents are living and should be updated as design decisions change.

Source of truth

- If any reference conflicts with `.github/PRD.md`, follow `PRD.md` and update the reference doc.
