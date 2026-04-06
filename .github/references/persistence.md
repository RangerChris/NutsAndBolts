# Persistence — local storage strategy

Storage key

- The implementation uses `nuts-and-bolts:progress` as the single top-level key in `localStorage` (see `src/lib/constants.ts` and `src/lib/persistence.ts`).

Minimal persisted payload

- `version: number` — schema version
- `difficulties: { [difficulty]: { currentLevel: number, maxReached: number } }`
- `settings: { paletteId: number }`

When to save

- The runtime saves progress during these events (current behaviour):
  - level complete
  - explicit settings change (palette, difficulty)
  - `visibilitychange` (the app registers a visibility listener via `initPersistence` for best-effort autosave)

Load behavior

- On app start the code reads `localStorage`, attempts a migration via `migrateProgress`, and falls back to a `DEFAULT_PROGRESS` (defined in `src/lib/persistence.ts`) when the payload is missing or invalid. `migrateProgress` includes logic for older schema shapes (e.g., `levels`).

Migration

- When updating the schema, bump `version` and provide a migration path in code to upgrade older persisted payloads to the new shape.

Security & privacy

- All data is local-only by default. If network sync is added later, obtain explicit user consent.
