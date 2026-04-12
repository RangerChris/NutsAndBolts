# Color palette

The app uses a single canonical palette: **Bold Spectrum**. Palette selection has been removed from the UI and the runtime uses this palette for all levels.

Palette (Bold Spectrum)

- #E11D48, #FB721A, #F59E0B, #16A34A, #059669, #0EA5E9, #2563EB, #7C3AED, #DB2777, #B45309

Notes

- Palettes are represented as simple arrays of color hex strings in `src/lib/palettes.ts` and exposed via `PALETTES`.
- The UI no longer exposes a palette dropdown; the `paletteId` persistence key remains for compatibility but is not used by the runtime to change colors.
- For accessibility, the runtime still supports pattern/shape overlays and other non-color markers; designers should rely on pattern overlays when additional distinct identifiers are required.
