# Persistence — local storage strategy

Storage key

- Use `nuts-and-bolts:progress` as the single top-level key in `localStorage`.

Minimal persisted payload

- `version: number` — schema version
- `difficulties: { [difficulty]: { currentLevel: number, maxReached: number } }`
- `settings: { paletteId: number }`

When to save

- Save on these events:
  - level complete
  - explicit settings change (palette, accessibility)
  - visibilitychange/unload (best-effort autosave)

Load behavior

- On app start, read and validate the schema version. If missing or invalid, initialize defaults.

Migration

- When updating the schema, bump `version` and provide a migration path in code to upgrade older persisted payloads to the new shape.

Security & privacy

- All data is local-only by default. If network sync is added later, obtain explicit user consent.
