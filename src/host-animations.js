import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

// ── Smooth scrolling — Lenis driven by GSAP's ticker and synced to
//    ScrollTrigger so the pinned hero timeline stays frame-accurate. ──
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const plane     = document.querySelector('.hero__plane');
const center    = document.querySelector('.hero__center');
const reveal    = document.querySelector('.hero__reveal');
const blueprint = document.querySelector('.hero__blueprint');
const revealRule = document.querySelector('.hero__reveal .hero__rule');
const strip     = document.querySelector('.hero__strip');
const metrics   = document.querySelector('.hero__metrics');

if (plane) {
  // Phases 1–3 are identical on every screen; only the Phase-4 "A350 reveal"
  // differs (desktop: title slides left + blueprint crops in from the right;
  // mobile: title stays centred up top + the full blueprint rises below it).
  // gsap.matchMedia builds the right variant per breakpoint and reverts/rebuilds
  // automatically on resize, so each layout stays self-contained.
  const mm = gsap.matchMedia();

  mm.add(
    { isMobile: '(max-width: 768px)', isDesktop: '(min-width: 769px)' },
    (ctx) => {
      const { isMobile } = ctx.conditions;

      // Flip nose-first (PNG faces left) — maintained throughout all phases
      gsap.set(plane,  { yPercent: -50, x: '-110vw', scaleX: -1, scaleY: 1, rotation: -2 });
      gsap.set(reveal, { xPercent: -50, yPercent: -50, opacity: 0, willChange: 'transform, opacity' });
      // Blueprint waits off-stage until Phase 4 — to the right on desktop, below on mobile.
      gsap.set(blueprint, isMobile
        ? { opacity: 0, y: '8vh', scale: 1.04, transformOrigin: 'center bottom' }
        : { opacity: 0, x: '8vw', scale: 1.06, transformOrigin: 'right center' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: '+=440%',
          pin: true,
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,   // recompute the function-based slide target on resize
        },
      });

      // ─── Phase 1 (0 → 2): Plane enters from left, lands at screen centre ──────
      tl.to(plane, { x: '16vw', rotation: -2, ease: 'power1.inOut', duration: 2 }, 0);

      // Title fades as the plane approaches — starts when plane is mid-flight
      tl.to(center, { opacity: 0, ease: 'power1.in', duration: 1.0 }, 0.8);

      // ─── Phase 2 (2 → 3.2): Plane expands — scaleX stays negative to keep flip ─
      tl.to(plane, {
        scaleX: -6,   // negative = flip preserved, magnitude = expansion
        scaleY: 6,
        opacity: 1,
        ease: 'power2.in',
        duration: 1.2,
      }, 2);

      // Part-1 chrome (top flight strip + bottom metrics) dissolves as the aircraft
      // engulfs the screen — the A350 reveal that follows belongs to a clean frame.
      // Scrubbed, so it fades back in when scrolling up. Scroll cue is left alone.
      const chrome = [strip, metrics].filter(Boolean);
      if (chrome.length) {
        tl.to(chrome, { opacity: 0, ease: 'power1.in', duration: 1.0 }, 2);
      }

      // ─── Phase 3 (3.2 → 4.4): Plane dissolves → Airbus title rises ────────────
      tl.to(plane, { opacity: 0, duration: 0.9, ease: 'power1.inOut' }, 3.2);
      tl.to(reveal, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 3.5);

      // ─── Phase 4 (4.4 → 5.8): blueprint reveal ────────────────────────────────
      if (isMobile) {
        // Title stays centred near the top (positioned in host.css); the full
        // blueprint rises into the lower half. No leftward slide, no re-anchor.
        tl.to(blueprint, {
          opacity: 0.95,
          y: 0,
          scale: 1,
          duration: 1.4,
          ease: 'power2.out',
          force3D: true,
        }, 4.5);
      } else {
        // Desktop: title slides left, blueprint crops in from the right.
        // Slide with a transform (x) not `left`, so the move stays on the
        // compositor and scrubs smoothly. The block keeps its centred anchor
        // (left:50% / xPercent:-50); x carries it to a 7vw left edge. Resize-safe
        // function value, recomputed via invalidateOnRefresh:
        //   edge = 50%·vw + x − 50%·W  ⇒  x = 7%·vw − 50%·vw + 50%·W
        const revealShiftX = () =>
          0.07 * window.innerWidth - 0.5 * window.innerWidth
          + 0.5 * Math.min(620, 0.88 * window.innerWidth);

        tl.to(reveal, {
          x: revealShiftX,
          duration: 1.4,
          ease: 'power2.inOut',
          force3D: true,
        }, 4.4);

        // Re-anchor text to the left column. text-align/margin can't tween, so flip
        // them at mid-slide (5.1 ≈ peak velocity of the inOut ease) where the motion
        // masks the discrete jump.
        tl.set(reveal, { textAlign: 'left' }, 5.1);
        if (revealRule) tl.set(revealRule, { marginLeft: 0, marginRight: 'auto' }, 5.1);

        tl.to(blueprint, {
          opacity: 0.95,
          x: 0,
          scale: 1,
          duration: 1.4,
          ease: 'power2.out',
          force3D: true,
        }, 4.5);
      }
    },
  );
}

// ════════════════════════════════════════════════════════════════════
//  EDITORIAL SECTIONS — stat strip · sticky chapters · pull quote
//  These extend the hero timeline above rather than replacing it. None of
//  them pin (the chapter media pins via CSS position:sticky, not a
//  ScrollTrigger pin), so they never compete with the hero's pinned
//  scroll space. Each is an independent ScrollTrigger.create() with
//  explicit start/end, created after the hero trigger so ScrollTrigger
//  sorts them in document order, and all share the Lenis-synced ticker.
// ════════════════════════════════════════════════════════════════════

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── SECTION A: stat strip — count up from 0 once on entry ──
document.querySelectorAll('.stat-strip__value').forEach((el) => {
  const target = parseInt(el.dataset.countTo, 10);
  const suffix = el.dataset.suffix || '';
  const render = (v) => { el.textContent = Math.round(v).toLocaleString() + suffix; };

  // Reduced motion: snap straight to the final value, no animation.
  if (prefersReduced) { render(target); return; }

  const obj = { value: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    once: true,
    onEnter: () => gsap.to(obj, {
      value: target,
      duration: 2.0,
      ease: 'power3.out',
      onUpdate: () => render(obj.value),
    }),
  });
});

// ── SECTION B: sticky chapters — cross-fade media to the centred chapter ──
const chapterImgs = document.querySelectorAll('.chapters__media [data-chapter-img]');

function swapChapterImage(activeIdx) {
  chapterImgs.forEach((img) => {
    img.classList.toggle('is-active', Number(img.dataset.chapterImg) === activeIdx);
  });
}

document.querySelectorAll('.chapter').forEach((chapter) => {
  const idx = parseInt(chapter.dataset.chapter, 10);
  // The CSS opacity transition handles the fade (and collapses to instant
  // under prefers-reduced-motion via the global reduced-motion rule), so the
  // trigger only needs to flip the active class.
  ScrollTrigger.create({
    trigger: chapter,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => swapChapterImage(idx),
    onEnterBack: () => swapChapterImage(idx),
  });
});

// ── SECTION B (mobile): swipe-carousel progress dots ──
// The carousel itself is pure CSS scroll-snap (see host.css). This only powers
// the dots: highlight whichever card is centred, and let a dot scroll to its
// card. It's inert on desktop, where the dots are display:none and the
// content row isn't a horizontal scroller.
const chaptersScroller = document.querySelector('.chapters__content');
const chapterDots = document.querySelectorAll('.chapters__dot');
const chapterCards = document.querySelectorAll('.chapters__content .chapter');

if (chaptersScroller && chapterDots.length && chapterCards.length) {
  // Click a dot → centre its card in the horizontal scroller (no vertical jump).
  chapterDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.dot);
      chapterCards[idx]?.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });
  });

  // Highlight the dot of the most-visible card within the scroller.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = Number(entry.target.dataset.chapter);
        chapterDots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      });
    },
    { root: chaptersScroller, threshold: 0.6 },
  );
  chapterCards.forEach((card) => io.observe(card));
}

// ── SECTION C: pull quote — background parallax + text reveal ──
const quoteBlock = document.querySelector('.quote-block');
if (quoteBlock) {
  const bg = quoteBlock.querySelector('.quote-block__bg');
  const text = quoteBlock.querySelector('.quote-block__text');
  const attribution = quoteBlock.querySelector('.quote-block__attribution');

  if (!prefersReduced) {
    // Parallax: transform only (never top/left), scrubbed for smoothness.
    if (bg) {
      ScrollTrigger.create({
        trigger: quoteBlock,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const y = (self.progress - 0.5) * 16;   // -8% → +8%
          bg.style.transform = `translateY(${y}%)`;
        },
      });
    }

    // Text reveals on entry; attribution follows 0.4s later.
    if (text) {
      ScrollTrigger.create({
        trigger: text,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.from(text, { y: 30, opacity: 0, duration: 1.2, ease: 'power3.out' });
          if (attribution) {
            gsap.from(attribution, {
              y: 20, opacity: 0, duration: 1, delay: 0.4, ease: 'power3.out',
            });
          }
        },
      });
    }
  }
  // Reduced motion: no parallax, no reveal — quote sits at its static final state.
}
