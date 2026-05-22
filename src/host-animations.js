import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const plane  = document.querySelector('.hero__plane');
const center = document.querySelector('.hero__center');
const reveal = document.querySelector('.hero__reveal');

if (plane) {
  // Flip nose-first (PNG faces left) — maintained throughout all phases
  gsap.set(plane,  { yPercent: -50, x: '-110vw', scaleX: -1, scaleY: 1, rotation: -2 });
  gsap.set(reveal, { xPercent: -50, yPercent: -50, opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=320%',
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
}
