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

if (plane) {
  // Flip nose-first (PNG faces left) — maintained throughout all phases
  gsap.set(plane,  { yPercent: -50, x: '-110vw', scaleX: -1, scaleY: 1, rotation: -2 });
  gsap.set(reveal, { xPercent: -50, yPercent: -50, opacity: 0 });
  // Blueprint waits off to the right, slightly enlarged, until Phase 4
  gsap.set(blueprint, { opacity: 0, x: '8vw', scale: 1.06, transformOrigin: 'right center' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=440%',
      pin: true,
      scrub: 1.5,
      anticipatePin: 1,
    },
  });

  // ─── Phase 1 (0 → 2): Plane enters from left, lands at screen centre ──────
  tl.to(plane, {
    x: '16vw',
    rotation: -2,
    ease: 'power1.inOut',
    duration: 2,
  }, 0);

  // Title fades as the plane approaches — starts when plane is mid-flight
  tl.to(center, {
    opacity: 0,
    ease: 'power1.in',
    duration: 1.0,
  }, 0.8);

  // ─── Phase 2 (2 → 3.2): Plane expands — scaleX stays negative to keep flip ─
  tl.to(plane, {
    scaleX: -6,   // negative = flip preserved, magnitude = expansion
    scaleY: 6,
    opacity: 1,
    ease: 'power2.in',
    duration: 1.2,
  }, 2);

  // ─── Phase 3 (3.2 → 4.4): Plane dissolves → Airbus title rises ────────────
  tl.to(plane, {
    opacity: 0,
    duration: 0.9,
    ease: 'power1.inOut',
  }, 3.2);

  tl.to(reveal, {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
  }, 3.5);

  // ─── Phase 4 (4.4 → 5.6): Title slides left, blueprint reveals on the right ─
  // Re-anchor the title to a left column and left-align its content.
  tl.set(reveal, { textAlign: 'left' }, 4.4);
  if (revealRule) tl.set(revealRule, { marginLeft: 0, marginRight: 'auto' }, 4.4);

  tl.to(reveal, {
    left: '7vw',
    xPercent: 0,
    duration: 1.2,
    ease: 'power2.inOut',
  }, 4.4);

  // Blueprint slides in from the right and settles, melting into the navy field.
  tl.to(blueprint, {
    opacity: 0.95,
    x: 0,
    scale: 1,
    duration: 1.2,
    ease: 'power2.out',
  }, 4.5);
}
