# DESIGN SYSTEM — Anatomy of Thrust

> A production-grade design language for the jet engine infographic.
> Use this as the source of truth for every visual decision.

---

## 1. Design Philosophy

**One sentence:** Editorial engineering documentary — cinematic, restrained, technical, and quietly luxurious.

**Three guiding principles:**
1. **Restraint over decoration.** Every visual element earns its place. If it doesn't tell the story, cut it.
2. **Type does the heavy lifting.** Strong serif headlines + precise monospace data = built-in editorial credibility.
3. **Motion is choreographed, not sprinkled.** Animations have intent and rhythm. No bouncy easings, no decorative wiggles.

**Reference territory:**
- Apple product pages (precision + restraint)
- Linear's marketing site (typography hierarchy)
- Dassault Systèmes 3DEXPERIENCE (industrial seriousness)
- Aviation magazines (editorial pacing)

**What to avoid:**
- Purple/pink gradients (overused AI aesthetic)
- Inter as primary body font (default-feel)
- Glassmorphism, neon glows, generic motion graphics
- Sans-serif headlines (too startup-y for this concept)
- Heavy drop shadows (kills the cinematic flat feel)

---

## 2. Color System

### Primary Palette

```css
:root {
  /* === Backgrounds === */
  --color-bg-base:        #0A0B0F;   /* Near-black, the canvas */
  --color-bg-surface:     #13151C;   /* Cards, tooltips, raised UI */
  --color-bg-elevated:    #1C1F28;   /* Hover states on surfaces */

  /* === Ink (text) === */
  --color-ink-primary:    #F5F5F0;   /* Warm white — headlines, key data */
  --color-ink-secondary:  #B8BAC3;   /* Body text, sublines */
  --color-ink-muted:      #8B8D98;   /* Captions, labels, metadata */
  --color-ink-faint:      #5A5C66;   /* Disabled, decorative */

  /* === Story accents === */
  --color-cool:           #4FC3F7;   /* Electric blue — air, intake */
  --color-cool-soft:      #8FB4C8;   /* Transitioning, muted cool */
  --color-hot:            #FF6B35;   /* Combustion orange */
  --color-hot-soft:       #FF8C42;   /* Glow, after-burn */
  --color-amber:          #FFB07A;   /* Warm finish, thrust scene */

  /* === Structural === */
  --color-hairline:       rgba(255, 255, 255, 0.08);   /* Subtle borders */
  --color-hairline-soft:  rgba(255, 255, 255, 0.04);   /* Even more subtle */
  --color-divider:        rgba(255, 255, 255, 0.12);   /* Stronger separators */

  /* === Functional === */
  --color-focus-ring:     rgba(79, 195, 247, 0.5);     /* Accessibility focus */
  --color-overlay:        rgba(10, 11, 15, 0.85);      /* Modal/loading backdrop */
}
```

### Color Narrative (per scene)

The palette tells the story of combustion — cool air entering, heat building, fire releasing.

| Scene | Dominant | Secondary | Mood |
|---|---|---|---|
| 1 — Intake | `--color-cool` | warm white ink | Cool, clinical, expectant |
| 2 — Compression | `--color-cool-soft` | warm white | Transitional, building |
| 3 — Combustion | `--color-hot` | warm white | Dramatic, ignited |
| 4 — Turbine | `--color-hot-soft` | amber | Sustained energy |
| 5 — Thrust | `--color-amber` + cool rim | white | Triumphant, cinematic |

### Color Usage Rules

- **80/15/5 rule** — 80% backgrounds + ink, 15% one accent (cool or hot), 5% the opposing accent as contrast.
- **Never put cool and hot at full saturation side-by-side.** One leads, the other supports as a rim light or hairline.
- **Headlines stay warm white** (`--color-ink-primary`) across all scenes. Never tint headline text with the scene accent — it cheapens the typography.
- **Data values stay warm white.** Labels stay muted gray. Never tint either with accent colors.

---

## 3. Typography

### Type Stack

| Role | Font | Weights | Source |
|---|---|---|---|
| **Display / Headlines** | **Fraunces** | 300, 400, 500 (variable optical size 9–144) | Google Fonts |
| **Body / UI** | **Geist Sans** | 400, 500 | npm `geist` or CDN |
| **Data / Numbers / Labels** | **JetBrains Mono** | 400, 500 | Google Fonts |

### Why This Pairing

- **Fraunces** is a contemporary serif with a soft, slightly editorial feel — modern but warm. Avoids the cold tech-y vibe of Inter and the over-used elegance of Playfair. Variable optical size means it looks crisp at 12px and dramatic at 96px.
- **Geist Sans** (by Vercel) has more character than Inter while staying neutral. It reads as "designed by engineers who care about type" — exactly your brand.
- **JetBrains Mono** for data signals precision and engineering credibility. Numbers feel measured and trustworthy.

### Type Scale

```css
:root {
  /* === Display === */
  --font-display-hero:    clamp(48px, 6vw, 96px);    /* Article hero */
  --font-display-large:   clamp(32px, 4.5vw, 56px);  /* Scene headlines */
  --font-display-medium:  clamp(24px, 3vw, 36px);    /* Section titles */

  /* === Body === */
  --font-body-large:      18px;   /* Lede paragraphs */
  --font-body:            16px;   /* Default body */
  --font-body-small:      14px;   /* Sublines, descriptions */

  /* === UI === */
  --font-ui:              13px;   /* Buttons, links */
  --font-caption:         11px;   /* Captions, footnotes */
  --font-label:           10px;   /* Uppercase labels */

  /* === Data === */
  --font-data-large:      24px;   /* Featured stats */
  --font-data:            18px;   /* Standard stats */
  --font-data-small:      14px;   /* Inline data */
}
```

### Typographic Treatments

**Display (Fraunces)**
```css
.text-display {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 300;
  font-size: var(--font-display-large);
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-variation-settings: 'opsz' 144;
}
```

**Body (Geist)**
```css
.text-body {
  font-family: 'Geist', system-ui, sans-serif;
  font-weight: 400;
  font-size: var(--font-body);
  line-height: 1.6;
  letter-spacing: -0.005em;
}
```

**Label (JetBrains Mono, uppercase)**
```css
.text-label {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: var(--font-label);
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
```

**Data Value (JetBrains Mono)**
```css
.text-data {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: var(--font-data);
  line-height: 1.1;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;  /* important — keeps numbers aligned */
  color: var(--color-ink-primary);
}
```

### Typography Rules

- **Headlines:** Always Fraunces Light (300). Tracking `-0.02em` for tighter feel. Line-height `1.05`.
- **Body:** Geist Regular (400). Line-height `1.6` for readability.
- **Numbers always use `tabular-nums`** — without this, animated counters jitter as digits change width. Critical for data readouts.
- **Labels are always UPPERCASE** with `0.2em` letter-spacing — gives them an architectural, schematic feel.
- **Never mix more than these three families.** No icon fonts, no decorative serifs sprinkled in.

---

## 4. Spacing System

8-point grid. Every spacing value is a multiple of 4px (sub-8) or 8px (default).

```css
:root {
  --space-1:   4px;    /* hairline gaps */
  --space-2:   8px;    /* tight pairings */
  --space-3:   12px;   /* small gaps */
  --space-4:   16px;   /* default gap */
  --space-5:   20px;   /* */
  --space-6:   24px;   /* section gaps */
  --space-8:   32px;   /* component padding */
  --space-10:  40px;   /* */
  --space-12:  48px;   /* large section spacing */
  --space-16:  64px;   /* major dividers */
  --space-20:  80px;   /* hero spacing */
  --space-24:  96px;   /* */
  --space-32:  128px;  /* page-level rhythm */
}
```

### Spacing Rules

- **Inside the component**, use generous space. Industrial aesthetic = room to breathe.
- **Default component padding:** `--space-8` (32px) on desktop, `--space-5` (20px) on mobile.
- **Between sibling elements:** `--space-4` (16px) tight, `--space-6` (24px) standard, `--space-12` (48px) sectional.
- **Headline to subline:** `--space-4` (16px).
- **Subline to data:** `--space-8` (32px).

---

## 5. Layout & Composition

### Canvas Dimensions (per brief)
- **Desktop:** 1440 × 900px (16:10 aspect ratio)
- **Mobile:** 375 × 677px (~9:16 aspect ratio)

### Grid Inside the Component

**Desktop:** Single centered column, max-content-width `680px`. Engine canvas is the background; text overlays on top.

**Mobile:** Single column, full-width. Text below engine, not overlapping.

### Z-Index Scale

```css
:root {
  --z-canvas:      0;     /* Three.js canvas */
  --z-particles:   1;     /* Particle overlays */
  --z-content:     5;     /* Headlines, data, captions */
  --z-controls:    10;    /* Scene dots, top bar, buttons */
  --z-tooltip:     20;    /* Hover tooltips */
  --z-modal:       50;    /* Ignition prompt, instructions */
  --z-loading:     100;   /* Loading overlay */
}
```

---

## 6. Component Library

### Buttons

**Primary (used sparingly — e.g., "Ignite Engine" in Scene 3)**

```css
.btn-primary {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-bg-base);
  background: var(--color-ink-primary);
  border: none;
  padding: 14px 28px;
  border-radius: 2px;            /* sharp, architectural */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: var(--color-hot);
  color: var(--color-ink-primary);
  transform: translateY(-1px);
}
```

**Ghost (for secondary actions)**

```css
.btn-ghost {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
  background: transparent;
  border: 1px solid var(--color-hairline);
  padding: 12px 24px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  color: var(--color-ink-primary);
  border-color: var(--color-ink-muted);
}
```

### Tooltips

```css
.tooltip {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-hairline);
  border-radius: 4px;
  padding: var(--space-3) var(--space-4);
  min-width: 180px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.5),
    0 0 0 1px var(--color-hairline-soft);
  backdrop-filter: blur(8px);
}

.tooltip__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
  margin-bottom: var(--space-2);
}

.tooltip__value {
  font-family: 'Fraunces', serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--color-ink-primary);
  line-height: 1.2;
}
```

### Progress Bar

```css
.progress {
  width: 120px;
  height: 2px;
  background: var(--color-hairline);
  border-radius: 2px;
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  background: var(--color-ink-primary);
  transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Scene Dots

```css
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-hairline);
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dot.is-active {
  background: var(--color-ink-primary);
  transform: scale(1.5);
}

.dot:hover:not(.is-active) {
  background: var(--color-ink-muted);
}
```

---

## 7. Motion System

### Easing Curves

```css
:root {
  --ease-out:        cubic-bezier(0.25, 1, 0.5, 1);       /* default fade-ins */
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);      /* camera moves */
  --ease-precise:    cubic-bezier(0.4, 0, 0.2, 1);        /* UI interactions */
  --ease-cinematic:  cubic-bezier(0.16, 1, 0.3, 1);       /* dramatic reveals */
}
```

### Duration Scale

```css
:root {
  --duration-instant:  0.15s;   /* hover states */
  --duration-quick:    0.3s;    /* small UI changes */
  --duration-standard: 0.6s;    /* default transitions */
  --duration-slow:     0.8s;    /* text reveals */
  --duration-cinematic: 1.2s;   /* camera moves, scene changes */
  --duration-counter:  1.5s;    /* number counters */
}
```

### Motion Rules

- **Default to `--ease-out`** for entrances. Things should arrive softly.
- **Use `--ease-in-out`** for two-sided animations (camera moves from A to B).
- **Never use spring/elastic/bounce easings.** They break the cinematic tone.
- **Stagger reveals** by 80–120ms between elements. Don't animate everything at once.
- **Headline reveal pattern:** Label (300ms) → Title (500ms) → Subline (700ms) → Data (900ms).
- **Idle motion is sacred.** Fan rotation, subtle particle drift, gentle engine sway — never let the screen feel static.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Borders, Radii & Shadows

### Border Radius
- **Buttons & inputs:** `2px` — sharp, architectural
- **Cards & surfaces:** `4px`
- **Component container:** `12px` — only the outermost wrapper gets the softer corner
- **Avatars/circles:** `50%`

### Shadows

```css
:root {
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md:   0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg:   0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow-cool: 0 0 24px rgba(79, 195, 247, 0.3);
  --shadow-glow-hot:  0 0 32px rgba(255, 107, 53, 0.4);
}
```

**Shadow rules:**
- On dark backgrounds, shadows are subtle — they create depth without softness.
- Use `--shadow-glow-*` only on illuminated elements (the combustion chamber, the ignite button when active).
- Don't put shadows on text. Ever.

---

## 9. Iconography

**Approach:** No icon library. Use minimal custom SVG icons drawn from primitives where needed (arrows, play, pause).

If you need an icon set for utility: **Lucide** is the cleanest free option. Stroke width `1.5px`, color `currentColor`.

**Rules:**
- Icon size: `16px` default, `20px` for prominent actions
- Stroke-only, never filled (matches the engineering schematic vibe)
- Never decorative — every icon communicates a function

---

## 10. Accessibility

- **Color contrast:** All body text passes WCAG AA (4.5:1) against background. Verified: warm white on near-black hits ~14:1.
- **Focus states:** Visible 2px outline using `--color-focus-ring` on all interactive elements.
- **Reduced motion:** Honor `prefers-reduced-motion` — disable particles, fade scene transitions instead of animating camera.
- **Keyboard navigation:** Scene dots fully keyboard-accessible (tab + enter). Ignite button keyboard-triggerable.
- **Alt text:** Canvas has descriptive `aria-label` summarizing the infographic.
- **Min touch target:** 44×44px on mobile for all interactive elements.

---

## 11. Photography & Imagery

You're not using any photography — the engine model IS the imagery. This is intentional and aesthetically correct for the concept. Don't add stock photos, decorative illustrations, or background imagery.

If you absolutely need imagery for the host article context (you currently don't), use:
- Black and white photography only
- High grain/film texture
- Aviation or industrial subject matter
- Editorial composition (rule of thirds, negative space)

---

## 12. Voice & Copywriting

The interactive's copy is already written, but for any additional UI text (button labels, tooltips, error states):

**Voice principles:**
- **Precise, not chatty.** "Ignite" not "Click here to start the engine!"
- **Active, not passive.** "Pressure climbs" not "Pressure is increased"
- **Technical when it earns credibility, poetic when it earns emotion.** Headlines lean poetic; data leans technical.
- **No exclamation marks.** Ever. Confidence doesn't shout.

**Examples:**

| Don't | Do |
|---|---|
| "Click here to ignite!" | "Ignite" |
| "Loading awesome 3D model..." | "Initialising" |
| "Drag to look around!" | "Drag to explore" |
| "Cool stat: 84,000 lbf!" | "84,000 lbf · enough to lift 38 cars" |

---

## 13. Quick-Reference Token Sheet

Drop this entire block into a `tokens.css` file or the top of your component styles.

```css
:root {
  /* === Colors === */
  --color-bg-base:        #0A0B0F;
  --color-bg-surface:     #13151C;
  --color-bg-elevated:    #1C1F28;
  --color-ink-primary:    #F5F5F0;
  --color-ink-secondary:  #B8BAC3;
  --color-ink-muted:      #8B8D98;
  --color-ink-faint:      #5A5C66;
  --color-cool:           #4FC3F7;
  --color-cool-soft:      #8FB4C8;
  --color-hot:            #FF6B35;
  --color-hot-soft:       #FF8C42;
  --color-amber:          #FFB07A;
  --color-hairline:       rgba(255, 255, 255, 0.08);
  --color-hairline-soft:  rgba(255, 255, 255, 0.04);
  --color-divider:        rgba(255, 255, 255, 0.12);
  --color-focus-ring:     rgba(79, 195, 247, 0.5);
  --color-overlay:        rgba(10, 11, 15, 0.85);

  /* === Typography === */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'Geist', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'SF Mono', monospace;

  --font-display-hero:    clamp(48px, 6vw, 96px);
  --font-display-large:   clamp(32px, 4.5vw, 56px);
  --font-display-medium:  clamp(24px, 3vw, 36px);
  --font-body-large:      18px;
  --font-body:            16px;
  --font-body-small:      14px;
  --font-ui:              13px;
  --font-caption:         11px;
  --font-label:           10px;
  --font-data-large:      24px;
  --font-data:            18px;
  --font-data-small:      14px;

  /* === Spacing === */
  --space-1:  4px;   --space-2:  8px;   --space-3: 12px;
  --space-4:  16px;  --space-5:  20px;  --space-6: 24px;
  --space-8:  32px;  --space-10: 40px;  --space-12: 48px;
  --space-16: 64px;  --space-20: 80px;  --space-24: 96px;

  /* === Motion === */
  --ease-out:        cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);
  --ease-precise:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-cinematic:  cubic-bezier(0.16, 1, 0.3, 1);

  --duration-instant:  0.15s;
  --duration-quick:    0.3s;
  --duration-standard: 0.6s;
  --duration-slow:     0.8s;
  --duration-cinematic: 1.2s;
  --duration-counter:  1.5s;

  /* === Radii === */
  --radius-sharp:    2px;
  --radius-card:     4px;
  --radius-surface:  12px;

  /* === Shadows === */
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md:   0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg:   0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow-cool: 0 0 24px rgba(79, 195, 247, 0.3);
  --shadow-glow-hot:  0 0 32px rgba(255, 107, 53, 0.4);

  /* === Z-Index === */
  --z-canvas:    0;
  --z-particles: 1;
  --z-content:   5;
  --z-controls:  10;
  --z-tooltip:   20;
  --z-modal:     50;
  --z-loading:   100;
}
```

---

## 14. Design QA Checklist

Before considering the project "done," verify:

**Typography**
- [ ] Fraunces loads correctly with optical sizing
- [ ] All numbers use `tabular-nums`
- [ ] No font fallbacks visible (FOIT/FOUT handled)
- [ ] Letter-spacing applied to all uppercase labels

**Color**
- [ ] No purple or pink anywhere
- [ ] Hot and cool accents never appear at full saturation side-by-side
- [ ] Headlines always warm white (never tinted)
- [ ] Background is true near-black `#0A0B0F`, not pure black

**Motion**
- [ ] No bouncy/elastic easings anywhere
- [ ] Idle animation always running (fan + turbine rotating)
- [ ] All transitions use defined easing curves, never `ease` or `linear` defaults
- [ ] `prefers-reduced-motion` respected

**Spacing**
- [ ] All spacing values come from the token scale
- [ ] No arbitrary pixel values like `padding: 17px`
- [ ] Component has breathing room — never crowded

**Polish**
- [ ] No default browser focus rings (custom focus styles applied)
- [ ] No icon library logos visible
- [ ] No console errors
- [ ] Component works embedded in the demo article
- [ ] Mobile variant tested at exactly 375×677

---

## 15. The One Question That Settles Every Decision

When in doubt, ask:

> *"Would this appear in a 3DS or Rolls-Royce brand film?"*

If yes → ship it.
If no → cut it.

That's the entire system in one sentence.
