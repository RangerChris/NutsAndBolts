# Data model

Runtime structures (implemented)

- `Bolt`
  - `id: string`
  - `nuts: string[]` — the implementation stores the top of the stack at the array end (push/pop semantics). See `src/lib/types.ts` and `src/components/BoltView.tsx`.
  - `capacity: number`

- `GameState`
  - `bolts: Bolt[]`
  - `extraBoltUsed: boolean`
  - `level: number`
  - `difficulty: string` (easy|medium|hard|extreme)
  - `seed?: string` — optional seed used to generate level
  - `moveHistory: Move[]` — optional for undo/analytics
  - Note: active distinct color count for a level should match `bolts.length` for that level per PRD rules (including the player-created extra bolt when present)

-- `Move`

- `fromBoltId: string`
- `toBoltId: string`
- `color: string` — color identifier (single color moved)
- `count: number`
- `timestamp?: number`

Persisted structures (localStorage)

- Key: `nuts-and-bolts:progress`
- Value (example):

```
{
  "version": 1,
  "difficulties": {
    "easy": { "currentLevel": 3, "maxReached": 10 },
    "medium": { "currentLevel": 1, "maxReached": 1 }
  },
  "settings": { "paletteId": 0 }
}
```

Schema/versioning

- Include a `version` field to support future migrations of the persisted schema.
