# Color palettes

Four palettes are supported and selectable during gameplay. Each palette should include pattern overlays or shapes for colorblind accessibility.

1) Vibrant (default)

- Colors: `#FF6B6B`, `#FFD93D`, `#6BCB77`, `#4D96FF`, `#FF8C42`, `#A56BFF`, `#00C2A8`, `#FF4DA6`, `#C7F464`, `#2F2FFF`
- Use high saturation and clear borders for small screens.

1) Pastel

- Colors: `#FFB3BA`, `#FFDFBA`, `#FFFFBA`, `#BFFCC6`, `#B3D9FF`, `#E2B8FF`, `#FDE2FF`, `#DFF8E1`, `#FFF3B0`, `#CDEFFF`
- Softer tones for relaxed visual style.

1) Dark

- Colors: `#D7263D`, `#021827`, `#0F4C5C`, `#8EA7E9`, `#6A1B4D`, `#124E4A`, `#3B2F2F`, `#5C3E91`, `#1F6F8B`, `#7A4A2F`
- For dark theme; ensure contrast for outlines and patterns.

1) Colorblind-friendly

- Colors: `#E69F00`, `#56B4E9`, `#009E73`, `#F0E442`, `#0072B2`, `#D55E00`, `#CC79A7`, `#88CCEE`, `#999999`, `#4D4D4D`
- Use distinct hues and pair with patterns (e.g., stripes, dots, crosshatch) to disambiguate.

Implementation notes

- Represent palette as an array of color + pattern identifiers.
- Allow players to switch palettes at any time; persist selection to settings.
- When rendering, draw both color and optional pattern overlay (SVG pattern or mask).
- Treat these color lists as base sets. If runtime needs additional distinct identifiers, preserve separability via shape/pattern overlays or small hue/lightness adjustments that remain colorblind-safe.
