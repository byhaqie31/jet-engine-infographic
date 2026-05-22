# EDITORIAL SECTIONS SPEC

> **Companion to PROJECT-SPEC.md**
> **For:** Claude Code
> **Adds:** Three 3DS-style scroll-driven sections to the host page
> **Reference:** https://www.3ds.com/industries/industrial-equipment

---

## Overview

The host page currently has: a cinematic hero → a faux article paragraph → the
3D infographic component → a short outro paragraph → footer.

This spec adds **three new sections** that frame the 3D infographic in a richer
editorial experience, modelled on 3DS's industrial-equipment page:

| # | Section | Position | Purpose |
|---|---|---|---|
| **A** | Animated stat strip | Above the 3D infographic | Quick context, build anticipation |
| **B** | Sticky chapter scroll | Below the existing intro paragraph, above section A | Editorial storytelling |
| **C** | Pull quote with parallax | Below the 3D infographic | Emotional close before footer |

### Final page order after this work

```
1. Cinematic hero (existing — plane flyby → A350 title)
2. Editorial intro paragraph (existing)
3. NEW Section B — Sticky chapter scroll
4. NEW Section A — Animated stat strip
5. The 3D infographic (existing — <jet-engine-infographic>)
6. Existing outro paragraph
7. NEW Section C — Pull quote with parallax
8. Footer (existing)
```

---

## Design Principles for All New Sections

**Inherit from the existing design system** (DESIGN-SYSTEM.md). Do NOT introduce:
- New colors outside the existing palette
- New font families
- New easing curves
- New spacing values

**Visual rhythm:** Each new section should feel like a deliberate chapter, with
generous whitespace above and below. Default vertical padding between sections:
`var(--space-32)` (128px) on desktop, `var(--space-20)` (80px) on mobile.

**Background alternation:** The page already alternates dark hero → light article →
dark component. New sections should respect this rhythm:
- Section A (stat strip) → light bg, sits inside the article flow
- Section B (sticky chapters) → light bg, sits inside the article flow
- Section C (pull quote) → dark bg, full-bleed, breaks the article flow for contrast

**Motion principles:**
- All scroll-driven animations use **GSAP ScrollTrigger**
- Use `--ease-cinematic` for dramatic reveals, `--ease-out` for smaller ones
- Respect `prefers-reduced-motion` — collapse to static fallback
- Never animate `top/left/width/height` — use `transform` and `opacity` only

---

## SECTION A — Animated Stat Strip

### Purpose
A horizontal band of 4 large stats with mono typography. Numbers count up from 0
when the section enters the viewport. Sets the stakes before the 3D infographic.

### Position
Inside the host article, immediately above the `<figure>` that wraps
`<jet-engine-infographic>`.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│   97,000      12,200      1,700°C      16,100                  │
│   LBF         RPM         COMBUSTION   KM                       │
│   THRUST      HP SHAFT    TEMPERATURE  MAX RANGE                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

4 columns on desktop, 2×2 on tablet, 1 column on mobile.

### Specifications

**Container**
```css
.stat-strip {
  max-width: 1200px;
  margin: var(--space-32) auto;
  padding: var(--space-12) var(--space-8);
  border-top: 1px solid var(--host-rule);
  border-bottom: 1px solid var(--host-rule);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-12);
}

@media (max-width: 1023px) {
  .stat-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-8);
  }
}

@media (max-width: 600px) {
  .stat-strip {
    grid-template-columns: 1fr;
    gap: var(--space-6);
    text-align: center;
  }
}
```

**Each stat block**
```html
<div class="stat-strip__item">
  <div class="stat-strip__value" data-count-to="97000" data-suffix=" lbf">
    0
  </div>
  <div class="stat-strip__label">Thrust per engine</div>
</div>
```

```css
.stat-strip__value {
  font-family: var(--font-mono);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--host-ink);
  font-variant-numeric: tabular-nums;
  margin-bottom: var(--space-3);
}

.stat-strip__label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--host-muted);
}
```

### Stats to display

| Value | Label | Suffix |
|---|---|---|
| `97000` | Thrust per engine | ` lbf` |
| `12200` | HP shaft speed | ` RPM` |
| `1700` | Combustion temperature | `°C` |
| `16100` | Aircraft max range | ` km` |

Format numbers with `toLocaleString()` so `97000` displays as `97,000`.

### Animation Logic

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('.stat-strip__value').forEach((el) => {
  const target = parseInt(el.dataset.countTo, 10);
  const suffix = el.dataset.suffix || '';
  const obj = { value: 0 };

  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        value: target,
        duration: 2.0,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent =
            Math.round(obj.value).toLocaleString() + suffix;
        },
      });
    },
  });
});
```

### Acceptance criteria
- [ ] All 4 stats are visible and aligned correctly on desktop, tablet, mobile
- [ ] Numbers count up from 0 when the strip enters the viewport (top of stat is at 80% viewport)
- [ ] Numbers use `tabular-nums` — no digit jitter during animation
- [ ] Counting only happens once (use `once: true`)
- [ ] Mobile shows 1 column, centered, smaller type
- [ ] Reduced-motion: numbers appear directly at final value, no animation

---

## SECTION B — Sticky Chapter Scroll

### Purpose
The 3DS signature interaction. An image pinned on the left of the viewport stays
in place while text content on the right scrolls through 3 chapters. As each
chapter reaches the viewport center, the pinned image cross-fades to a matching
image for that chapter.

### Position
After the existing article intro paragraph, before Section A (stat strip).

### Layout

```
[ scroll position 0 ]            [ scroll position 33% ]         [ scroll position 66% ]

┌──────────┬────────────┐        ┌──────────┬────────────┐       ┌──────────┬────────────┐
│          │ CHAPTER 1  │        │          │ CHAPTER 1  │       │          │ CHAPTER 1  │
│          │ ─────────  │        │          │ ─────────  │       │          │ ─────────  │
│          │ Aircraft   │        │          │ Aircraft   │       │          │ Aircraft   │
│  IMG-1   │ paragraph  │        │  IMG-2   │ paragraph  │       │  IMG-3   │ paragraph  │
│ pinned   │            │        │ pinned   │            │       │ pinned   │            │
│          │ CHAPTER 2  │        │          │ CHAPTER 2  │       │          │ CHAPTER 2  │
│          │ active     │        │          │ ─────────  │       │          │ ─────────  │
│          │            │        │          │ Engine     │       │          │ Engine     │
│          │            │        │          │ paragraph  │       │          │ paragraph  │
│          │            │        │          │            │       │          │            │
│          │            │        │          │ CHAPTER 3  │       │          │ CHAPTER 3  │
│          │            │        │          │            │       │          │ ─────────  │
│          │            │        │          │            │       │          │ Testing    │
└──────────┴────────────┘        └──────────┴────────────┘       └──────────┴────────────┘
```

The image stays sticky-pinned to viewport center while right column scrolls naturally.

### Specifications

**Container**
```html
<section class="chapters">
  <div class="chapters__inner">
    <div class="chapters__media" data-media>
      <img src="/chapter-1.jpg" alt="A350 silhouette" data-chapter-img="0" class="is-active" />
      <img src="/chapter-2.jpg" alt="Trent XWB cutaway" data-chapter-img="1" />
      <img src="/chapter-3.jpg" alt="Engine test rig" data-chapter-img="2" />
    </div>

    <div class="chapters__content">
      <article class="chapter" data-chapter="0">
        <div class="chapter__label">Chapter 01 · The Aircraft</div>
        <h2 class="chapter__title">A system of compromises.</h2>
        <p class="chapter__body">
          An aircraft is rarely the best at any one thing. Range trades against
          payload. Speed trades against fuel. Reliability trades against weight.
          The A350-1000 sits at the intersection of every compromise a modern
          long-haul wide-body must make — and gets closer than anything before it.
        </p>
      </article>

      <article class="chapter" data-chapter="1">
        <div class="chapter__label">Chapter 02 · The Engine</div>
        <h2 class="chapter__title">But the engine is its own miracle.</h2>
        <p class="chapter__body">
          The Trent XWB-97 is the most powerful civil turbofan in service. It moves
          more air, runs hotter, and lasts longer than any engine of its size in
          aviation history. It is also the only engine certified for the A350-1000 —
          a calculated bet that paid off for both Rolls-Royce and Airbus.
        </p>
      </article>

      <article class="chapter" data-chapter="2">
        <div class="chapter__label">Chapter 03 · The Trial</div>
        <h2 class="chapter__title">Eleven million pounds of testing.</h2>
        <p class="chapter__body">
          Before a single XWB-97 carried a passenger, the family endured the
          equivalent of decades of service in test cells: simulated bird strikes,
          dust ingestion, ice ingestion, blade-off events, and thousands of hours
          at maximum thrust. What follows is the choreography that survived all of it.
        </p>
      </article>
    </div>
  </div>
</section>
```

**Layout CSS**
```css
.chapters {
  max-width: 1280px;
  margin: var(--space-32) auto;
  padding: 0 var(--space-8);
}

.chapters__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  align-items: start;
}

.chapters__media {
  position: sticky;
  top: 12vh;
  height: 76vh;
  border-radius: 4px;
  overflow: hidden;
  background: var(--host-ink);
}

.chapters__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}

.chapters__media img.is-active {
  opacity: 1;
}

.chapters__content {
  display: flex;
  flex-direction: column;
  gap: 50vh; /* generous gap so each chapter dwells in the viewport */
}

.chapter {
  min-height: 40vh;
}

.chapter__label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--host-muted);
  margin-bottom: var(--space-4);
}

.chapter__title {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--host-ink);
  margin-bottom: var(--space-6);
}

.chapter__body {
  font-size: 17px;
  line-height: 1.7;
  color: #2a2a2a;
  max-width: 480px;
}

/* Mobile (≤900px): a horizontal swipe carousel — see "Mobile behaviour" below.
   The shared sticky media is dropped; each .chapter becomes a snap-aligned card
   carrying its own .chapter__img, and a .chapters__dots row tracks position.
   (Full implementation in src/host.css.) */
```

### Mobile behaviour (≤900px) — swipe carousel

The desktop sticky cross-fade can't survive a single-column stack (the pinned media
just scrolls away above the text), so on mobile Section B switches to a **horizontal
swipe carousel** instead of stacking:

- `.chapters__media` (the shared sticky frame) is hidden; each `.chapter` instead
  renders its **own** `.chapter__img` (hidden on desktop) so the image changes per card.
- `.chapters__content` becomes a horizontal `scroll-snap-type: x mandatory` flex row;
  each `.chapter` is `flex: 0 0 86%` with `scroll-snap-align: center` (the 86% leaves a
  sliver of the next card as a swipe affordance). Native scroll-snap does the sliding —
  no scroll-hijacking, no Lenis conflict.
- A `.chapters__dots` row (3 dots, hidden on desktop) shows position. An
  `IntersectionObserver` (root = the scroller) highlights the centred card's dot;
  tapping a dot scrolls its card to centre. Dots use a 44px touch target.
- Reduced motion: dot-driven scrolling falls back to `behavior: 'auto'`.

### Animation Logic

```js
// Each chapter triggers an image swap when it enters viewport center
document.querySelectorAll('.chapter').forEach((chapter) => {
  const idx = parseInt(chapter.dataset.chapter, 10);
  const images = document.querySelectorAll('.chapters__media img');

  ScrollTrigger.create({
    trigger: chapter,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => swapImage(images, idx),
    onEnterBack: () => swapImage(images, idx),
  });
});

function swapImage(images, activeIdx) {
  images.forEach((img, i) => {
    img.classList.toggle('is-active', i === activeIdx);
  });
}
```

### Chapter Images Needed

Place in `/public`:
- `/public/chapter-1.jpg` — A350-1000 in flight (silhouette against sky, dark/moody)
- `/public/chapter-2.jpg` — Trent XWB engine cutaway or close-up technical shot
- `/public/chapter-3.jpg` — Engine test rig with flames, or a wind tunnel shot

**Image specs:**
- 1200×1500px minimum (3:4 portrait orientation for the sticky frame)
- Compressed to <250KB each (use TinyPNG or Squoosh)
- WebP preferred, JPG fallback acceptable

**If real images aren't available immediately:** Use placeholder SVG illustrations
with the engine's color palette. The structure works regardless.

### Acceptance criteria
- [ ] Image pins to viewport while right-side text scrolls past (desktop)
- [ ] Image smoothly cross-fades between chapters (no flash) (desktop)
- [ ] Active chapter's label/title is visible when its image is shown
- [ ] On mobile (≤900px), the section becomes a horizontal swipe carousel: one
      image per card, snap-aligned, with working progress dots (tap + active state)
- [ ] No scroll jank — verify with Chrome DevTools rendering tab
- [ ] Reduced-motion: image still swaps but with instant transition

---

## SECTION C — Pull Quote with Parallax

### Purpose
A full-bleed cinematic moment. A large editorial quote sits over a dark background
with a subtle parallax effect — the background image moves slower than the text as
the user scrolls, creating depth.

### Position
After the existing outro paragraph that follows the 3D infographic, before the footer.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [parallax background image at 30% opacity, dark engine room]    │
│                                                                  │
│              ┌─────────────────────────────────────┐             │
│              │                                     │             │
│              │   The engine doesn't care           │             │
│              │   about the weather. It cares       │             │
│              │   about thrust, fuel flow, and      │             │
│              │   turbine inlet temperature.        │             │
│              │   Everything else is poetry.        │             │
│              │                                     │             │
│              │   ──                                │             │
│              │   CAPT. REZA · A350 LINE PILOT      │             │
│              │                                     │             │
│              └─────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Specifications

**HTML**
```html
<section class="quote-block">
  <div class="quote-block__bg" data-parallax>
    <img src="/quote-bg.jpg" alt="" aria-hidden="true" />
  </div>

  <blockquote class="quote-block__quote">
    <p class="quote-block__text">
      The engine doesn't care about the weather. It cares about thrust, fuel
      flow, and turbine inlet temperature. Everything else is poetry.
    </p>
    <footer class="quote-block__attribution">
      <span class="quote-block__rule"></span>
      <cite>Capt. Reza · A350 line pilot</cite>
    </footer>
  </blockquote>
</section>
```

**CSS**
```css
.quote-block {
  position: relative;
  margin: var(--space-32) calc(50% - 50vw); /* full-bleed escape from article width */
  padding: var(--space-32) var(--space-8);
  min-height: 70vh;
  background: #0a0b0f;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quote-block__bg {
  position: absolute;
  inset: -10% 0;
  z-index: 0;
  will-change: transform;
}

.quote-block__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.25;
  filter: grayscale(100%) contrast(1.1);
}

.quote-block__quote {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0;
  padding: 0 var(--space-8);
  text-align: left;
}

.quote-block__text {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #F5F5F0;
  margin: 0 0 var(--space-8);
  text-wrap: balance; /* keeps line lengths visually even */
}

.quote-block__attribution {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8B8D98;
  font-style: normal;
}

.quote-block__rule {
  display: inline-block;
  width: 32px;
  height: 1px;
  background: #8B8D98;
}

@media (max-width: 768px) {
  .quote-block {
    min-height: 60vh;
    padding: var(--space-20) var(--space-4);
  }
}
```

### Animation Logic

```js
// Parallax: background moves slower than the foreground
ScrollTrigger.create({
  trigger: '.quote-block',
  start: 'top bottom',
  end: 'bottom top',
  scrub: 1,
  onUpdate: (self) => {
    const bg = document.querySelector('.quote-block__bg');
    if (bg) {
      // Move bg from -8% to +8% as the user scrolls through it
      const y = (self.progress - 0.5) * 16;
      bg.style.transform = `translateY(${y}%)`;
    }
  },
});

// Text reveal on enter
ScrollTrigger.create({
  trigger: '.quote-block__text',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    gsap.from('.quote-block__text', {
      y: 30,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
    });
    gsap.from('.quote-block__attribution', {
      y: 20,
      opacity: 0,
      duration: 1,
      delay: 0.4,
      ease: 'power3.out',
    });
  },
});
```

### Background image needed

Place in `/public`:
- `/public/quote-bg.jpg` — moody engine test rig with flames, or aircraft maintenance
  hangar at night
- 2400×1600 minimum, compressed to <400KB
- Should look good with grayscale + low opacity filters applied

**Fallback if no image:** Use a CSS radial gradient that suggests depth:
```css
background: radial-gradient(ellipse at 30% 50%, #1c1f28 0%, #0a0b0f 60%);
```

### Acceptance criteria
- [ ] Section is full-bleed (escapes the article max-width)
- [ ] Background image parallax-scrolls slower than text (subtle but noticeable)
- [ ] Quote text reveals with fade + upward translate on entry
- [ ] Attribution reveals 400ms after the quote
- [ ] Text is left-aligned, max-width 760px, centered horizontally
- [ ] Mobile: padding reduces, text scales down, parallax still works
- [ ] Reduced-motion: text appears statically, no parallax

---

## Integration Checklist (after all sections built)

- [ ] All new sections respect the existing design tokens (no hardcoded hex values)
- [ ] No new font families introduced
- [ ] All ScrollTriggers refresh correctly after page resize
- [ ] No layout shift when images load (use `aspect-ratio` or explicit dimensions)
- [ ] Lighthouse performance score stays above 85
- [ ] Lenis smooth scroll continues to work across all new sections
- [ ] The 3D infographic component still functions normally
- [ ] Page flow reads naturally — sections feel like chapters, not stacked widgets

---

## File Changes Expected

```
/jet-engine-infographic
├── index.html                ← Add the 3 new sections in correct order
├── /public
│   ├── chapter-1.jpg         ← NEW
│   ├── chapter-2.jpg         ← NEW
│   ├── chapter-3.jpg         ← NEW
│   └── quote-bg.jpg          ← NEW
├── /src
│   ├── host.css              ← Extend with section styles
│   ├── host-animations.js    ← Extend with new ScrollTriggers
│   └── ...                   ← (no other changes)
└── ...
```

---

## Why These Sections Were Chosen

**Stat strip** = quick win, 1h build, immediately builds anticipation before the 3D piece.

**Sticky chapter scroll** = the *3DS signature move*. This is the section the reviewer
will subconsciously recognize and approve of. It's also the most ambitious build —
~3-4h — but the highest ROI.

**Pull quote** = emotional close. The page has been intellectually engaging the whole
way down; this gives the viewer a moment of feeling before the footer. Editorial
publications use this trick because it works.

Together, these three sections transform the page from "a Web Component demo" into
"a complete editorial experience built around a Web Component" — which is a much
more impressive portfolio piece.
