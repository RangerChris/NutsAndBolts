# Color palettes

Multiple selectable palettes are implemented in the app (the runtime exposes an array of palettes in `src/lib/palettes.ts`). The shipped set includes the original four accessibility-focused palettes plus several additional theme palettes (Vibrant, Pastel, Jewel, Colorblind, Warm Sunset, Ocean, Earth, Retro, Cyberpunk, High Contrast).

Key implementation notes (current)

- Palettes are represented as simple arrays of color hex strings and an `id`/`name` pair (`Palette[]` in `src/lib/palettes.ts`).
- The UI exposes a palette dropdown in the top bar that shows a small swatch preview and persists the selected palette id via `src/lib/persistence.ts`.
- For accessibility, the `Colorblind` palette is provided and the rendering supports pattern/shape overlays; the token rendering code (in `src/components/BoltView.tsx`) uses gradients and can be extended to add SVG patterns for non-color markers.
- Palettes act as base color sets. When a level requires extra distinct identifiers the runtime prefers pattern overlays or small perceptual shifts rather than inventing arbitrary colors.

Suggested guidance for designers

- Prefer the provided palettes from `src/lib/palettes.ts` rather than adding new ad-hoc hex lists.
- When adding a palette, include a short `name`, an `id`, and 8–10 colors that remain separable at small sizes; provide a pattern identifier if the palette relies on non-color markers for accessibility.
