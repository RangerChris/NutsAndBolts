# Design System: Tactile Play & Premium Depth

## 1. Overview & Creative North Star
**Creative North Star: "The Elevated Toybox"**

This design system moves away from the flat, sterile world of traditional mobile puzzles. Instead, it treats the screen as a physical stage—a high-end tabletop experience where digital elements possess weight, friction, and "juice." We are blending **Organic Softness** with **Industrial Contrast**. 

By pairing vibrant, candy-like "Nuts" against deep, architectural "Bolts" and backgrounds, we create a visual hierarchy that feels intentional and expensive. The system breaks the standard "mobile grid" by utilizing overlapping layers, soft-touch surfaces, and asymmetrical layouts that invite the player to reach out and touch the interface.

---

## 2. Colors & Surface Logic

### The Palette Strategy
The color system is divided into two emotional zones: the **Base** (the dark, metallic/wooden foundation) and the **Interactives** (the vibrant, soft-hued puzzle pieces).

*   **Primary (`#ffb59c`) & Secondary (`#77dc7a`):** These aren't just colors; they are materials. Use these for the core "Nuts" and primary CTAs.
*   **Surface Containers:** We avoid flat black. We use the `surface-container` tiers to create a sense of carved-out space or extruded platforms.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To separate a header from a body or a card from a background, use tonal shifts. A `surface-container-low` card sitting on a `surface` background provides all the definition needed. Lines create visual noise; tonal shifts create atmosphere.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested trays:
1.  **Level 0 (Background):** `surface` (`#131316`) - The deep, "wooden" base.
2.  **Level 1 (Sections):** `surface-container-low` - Large grouped areas.
3.  **Level 2 (Active Cards):** `surface-container-high` - Individual puzzle pods or menu items.
4.  **Level 3 (Floating UI):** `surface-bright` with Glassmorphism - Modals and tooltips.

### The "Glass & Gradient" Rule
To give the "Nuts" their "juicy" feel, never use a flat fill for a primary action. Use a subtle linear gradient from `primary` to `primary_container`. For floating overlays, use a 60% opacity version of the surface color combined with a `20px` backdrop-blur to maintain the "frosted glass" premium aesthetic.

---

## 3. Typography: Friendly Authority

We utilize **Plus Jakarta Sans** for its unique balance of geometric precision and friendly, open counters. It feels "rounded" without feeling "childish."

*   **Display (lg/md/sm):** Reserved for level numbers and "Success" states. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to make the numbers feel like physical objects.
*   **Headlines & Titles:** Used for menu headers. The contrast between a `headline-lg` title and a `surface-container-lowest` background creates an editorial, high-end feel.
*   **Body & Labels:** All body text must use `on_surface_variant` to reduce harshness against the dark background, ensuring the vibrant primary colors remain the focal point.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Instead of using a shadow to show a button is clickable, place a `surface-container-highest` element inside a `surface-container-low` tray. The eye perceives the lighter tone as "closer" to the light source.

### Ambient Shadows
For floating game pieces (Nuts) being dragged across the screen:
*   **Color:** Use a tinted shadow. Use `on_surface` at 8% opacity.
*   **Blur:** High diffusion (24px to 40px blur).
*   **Spread:** -4px to keep the shadow "under" the object, mimicking a soft overhead studio light.

### The "Ghost Border" Fallback
If an element (like an empty bolt slot) requires a boundary, use the **Ghost Border**: `outline-variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### The "Juicy" Button (Primary)
*   **Shape:** `xl` roundedness (3rem).
*   **Fill:** Gradient from `primary` to `primary_fixed_dim`.
*   **Feedback:** On press, the scale should shrink to 0.95 and the `surface_tint` should increase in intensity (a subtle "glow" effect).

### Puzzle Nut (Interactive Element)
*   **Accessibility:** Every color MUST be paired with a unique "Signature Pattern" (e.g., Coral has tiny circles, Mint has diagonal stripes) using `on_primary_container` at 10% opacity.
*   **Shadow:** Neumorphic "soft lift" when unselected; "glow" when active.

### Cards & Lists
*   **Strict Rule:** No dividers. 
*   **Separation:** Use `spacing-scale-lg` (vertical white space) or alternate between `surface-container-low` and `surface-container-lowest` backgrounds to distinguish between list items.

### Input Fields
*   **Style:** Inset (concave) look. Use `surface-container-lowest` with a subtle inner shadow to make the field look like it is carved into the dark wooden/metallic background.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place "Close" buttons or secondary actions slightly off-center or overlapping the edge of a container to break the "template" feel.
*   **Exaggerated Radii:** Use the `xl` (3rem) and `full` corner radii for almost everything. Sharp corners are forbidden.
*   **Tactile Haptics:** Design UI transitions to feel like they have momentum (Ease-out-back curves).

### Don't:
*   **Don't use Pure White:** Use `on_surface` (`#e4e2e5`) for text. Pure white is too harsh against the dark metallic palette.
*   **Don't use 1px Lines:** If you feel the urge to draw a line, use a background color shift instead.
*   **Don't Flatten the Experience:** Avoid flat, single-color buttons. Always add a subtle gradient or a "inner glow" to maintain the tactile, toy-like quality.