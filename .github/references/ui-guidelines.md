# UI Guidelines — Mobile-first

Layout

- Top bar: difficulty selector, level number, seed display/input, palette selector.
- Main area: bolts laid out horizontally. Support 3–9 base bolts plus one temporary extra bolt (max total 10). If bolt count exceeds available width, allow horizontal scroll or pinch/zoom.
- Bottom controls: `Extra Bolt` (shows remaining availability), `Undo`, `Hint` (optional), pause/menu.

Interaction model

- Tap a bolt to select source; highlight the contiguous top-group and lift slightly to indicate pick-up.
- Tap a target bolt to place. Animate a slide/stack motion for the group.
- Provide short animations for invalid moves (shake or brief red flash) and successful moves (snap & small scale pop).

Touch ergonomics

- Targets should be large enough for thumb taps (min ~44px touch target recommended).
- Provide visual feedback for taps within 50ms.

Accessibility

- Four selectable palettes, each defined with up to 10 colors in PRD; at least one must be colorblind-friendly.
- Provide shape overlays or subtle patterns on nuts to disambiguate colors.
- Add ARIA labels for bolt elements and controls for keyboard/screen-reader users.
- Reduce-motion option in settings.

Performance

- Favor lightweight DOM/SVG rendering to simplify hit testing and accessibility.
- Use CSS transforms for animations (GPU-accelerated) and keep repaints minimal.

Visual style

- Clear contrast between background and nut colors.
- Subtle shadows for depth; avoid excessive effects that distract from gameplay.

Seed UI

- Display current level seed near the level number with a copy/share affordance.
- Provide a small input field in the menu to load a seed and regenerate the board.

Analytics & Telemetry

- Emit events for `level_started`, `level_completed`, `extra_bolt_used`, `palette_changed`.
