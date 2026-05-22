/**
 * jet-engine.js
 * <jet-engine-infographic>
 *
 * A self-contained Web Component that renders a cinematic
 * interactive infographic of a turbofan engine.
 *
 * Encapsulated in Shadow DOM so it can be embedded into any
 * host page without style or script collisions.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import gsap from 'gsap';
import { buildEngine, buildRunway } from './engine-model.js';
import { loadAircraftWithFallback } from './model-loader.js';
import {
  buildIntakeParticles,
  buildExhaustParticles,
  tickParticles,
  transitionScene,
} from './scenes.js';
import { buildSky, buildClouds, tickClouds } from './sky.js';
import { initTooltips, initIgnition } from './interactions.js';

// ---------- SCENE CONTENT ----------
// Rolls-Royce Trent XWB-97 / Airbus A350-1000 specifications.
// `raw` is the numeric value for the animated counter;
// `value` is the pre-formatted string used in the initial static render.
const SCENES = [
  {
    id: 'intro',
    label: 'Airbus · A350-1000',
    title: 'Explore the aircraft.',
    subline: 'The Airbus A350-1000 — the longest-range widebody in service. Orbit freely, then dive deep into the engine.',
    stats: [
      { label: 'Max range',  value: '16,100', raw: 16100, unit: 'km' },
      { label: 'Passengers', value: '369',    raw: 369,   unit: '' },
    ],
    accent: '#4FC3F7',
  },
  {
    id: 'engine-approach',
    label: '· The Engine',
    title: 'The engine.',
    subline: 'Powering the A350-1000: the Rolls-Royce Trent XWB-97 — the most powerful civil turbofan ever built.',
    stats: [
      { label: 'Engines',      value: '2',       raw: 2,      unit: '' },
      { label: 'Total thrust', value: '194,000', raw: 194000, unit: 'lbf' },
    ],
    accent: '#4FC3F7',
  },
  {
    id: 'exterior',
    label: '· Engine Exterior',
    title: 'The machine beneath the wing.',
    subline: 'Three metres across. Seven tonnes. Mounted on a swept titanium pylon — and from the outside, deceptively quiet.',
    stats: [
      { label: 'Dry weight', value: '7,277', raw: 7277, unit: 'kg' },
      { label: 'Diameter',   value: '3.0',   raw: 3.0,  unit: 'm' },
    ],
    accent: '#4FC3F7',
  },
  {
    id: 'intake',
    label: '01 · Intake',
    title: 'It begins with air.',
    subline: 'Every second, the 22-blade fan draws in 1,335 kg of air — enough to fill a double-decker bus.',
    stats: [
      { label: 'Air flow',     value: '1,335', raw: 1335, unit: 'kg/s' },
      { label: 'Fan diameter', value: '3.0',   raw: 3.0,  unit: 'm' },
    ],
    accent: '#4FC3F7',
  },
  {
    id: 'compression',
    label: '02 · Compression',
    title: 'Squeezed fifty times tighter.',
    subline: 'Fourteen compressor stages raise the air pressure to a 50:1 ratio — the highest of any civil engine.',
    stats: [
      { label: 'Pressure ratio',    value: '50', raw: 50, unit: ':1' },
      { label: 'Compressor stages', value: '14', raw: 14, unit: '' },
    ],
    accent: '#8FB4C8',
  },
  {
    id: 'combustion',
    label: '03 · Combustion',
    title: 'Then, ignition.',
    subline: 'Fuel ignites at 1,700°C — hotter than volcanic lava, inside a chamber the size of a desk.',
    stats: [
      { label: 'Temperature', value: '1,700', raw: 1700, unit: '°C' },
      { label: 'Fuel burn',   value: '4,200', raw: 4200, unit: 'L/hr' },
    ],
    accent: '#FF6B35',
  },
  {
    id: 'turbine',
    label: '04 · Turbine',
    title: 'The fire spins the wheel.',
    subline: 'Six turbine stages extract energy from the gas stream, spinning the fan shaft at 12,200 RPM.',
    stats: [
      { label: 'HP shaft speed', value: '12,200', raw: 12200, unit: 'RPM' },
      { label: 'Efficiency',     value: '42',     raw: 42,    unit: '%' },
    ],
    accent: '#FF8C42',
  },
  {
    id: 'thrust',
    label: '05 · Thrust',
    title: 'And the world moves.',
    subline: '97,000 lbf of thrust per engine — the most powerful Trent ever built, powering the A350-1000.',
    stats: [
      { label: 'Thrust',        value: '97,000', raw: 97000, unit: 'lbf' },
      { label: 'Bypass ratio',  value: '9.3',    raw: 9.3,   unit: ':1' },
    ],
    accent: '#FFB07A',
  },
  {
    id: 'departure',
    label: '· Departure',
    title: 'And it flies.',
    subline: 'A quarter-million parts, two of these engines, one impossible act — lifting 300 tonnes into the sky and holding it there for nine thousand miles.',
    stats: [
      { label: 'Cruise speed',    value: '945',    raw: 945,   unit: 'km/h' },
      { label: 'Cruise altitude', value: '13,100', raw: 13100, unit: 'm' },
    ],
    accent: '#4FC3F7',
  },
];

// ---------- COMPONENT STYLES ----------
const styles = `
  :host {
    /* Design system tokens (Shadow DOM scope) */
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
    --color-focus-ring:     rgba(79, 195, 247, 0.5);
    --font-display: 'Playfair Display Variable';
    --font-body:    'Geist', system-ui, sans-serif;
    --font-mono:    'JetBrains Mono Variable', 'SF Mono', monospace;
    --ease-out:      cubic-bezier(0.25, 1, 0.5, 1);
    --ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);
    --ease-precise:  cubic-bezier(0.4, 0, 0.2, 1);
    --radius-sharp:  2px;
    --shadow-glow-hot: 0 0 32px rgba(255, 107, 53, 0.4);

    /* Legacy aliases — keep existing var() references working */
    --bg:       var(--color-bg-base);
    --surface:  var(--color-bg-surface);
    --cool:     var(--color-cool);
    --hot:      var(--color-hot);
    --ink:      var(--color-ink-primary);
    --muted:    var(--color-ink-muted);
    --hairline: var(--color-hairline);

    display: block;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    font-family: var(--font-body);
    color: var(--color-ink-primary);
  }

  /* Single shared border wraps both panels — guarantees pixel-perfect alignment */
  .component-wrap {
    border: 1px solid var(--color-hairline);
    border-radius: 12px;
    overflow: hidden;
  }

  .stage {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 720px;
    background: radial-gradient(ellipse at center, #14161E 0%, var(--bg) 70%);
    overflow: hidden;
  }

  /* Three.js canvas sits behind everything */
  .canvas-host {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    cursor: default;
  }

  .canvas-host canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  /* ---------- SCENE INFO PANEL (above canvas) ---------- */
  .scene-info {
    background: var(--color-bg-base);
    border-bottom: 1px solid var(--color-hairline);
    padding: 24px 32px 20px;
    text-align: center;
  }

  .info-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .topbar__label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-ink-muted);
  }

  .topbar__progress {
    width: 120px;
    height: 2px;
    background: var(--hairline);
    border-radius: 2px;
    overflow: hidden;
  }

  .topbar__progress-bar {
    height: 100%;
    width: 20%;
    background: var(--ink);
    transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1);
  }

  /* ---------- HEADLINE (in scene-info panel) ---------- */
  .headline {
    margin-bottom: 20px;
    text-align: center;
  }

  .headline__title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(32px, 4.5vw, 56px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
  }

  /* Word-stagger reveal: each word sits in an overflow-clipped box and its inner
     span slides up into view. The padding/negative-margin pair gives descenders
     (g, y, p) room so the clip never shaves them. */
  .headline__title .word {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    padding-bottom: 0.12em;
    margin-bottom: -0.12em;
  }

  .headline__title .word-inner {
    display: inline-block;
    will-change: transform;
  }

  .headline__subline {
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    color: var(--color-ink-secondary);
    max-width: 540px;
    margin: 0 auto;
    letter-spacing: -0.005em;
  }

  /* ---------- DATA READOUT (in scene-info panel) ---------- */
  .data {
    display: flex;
    justify-content: center;
    gap: 48px;
  }

  .data__item { text-align: center; }

  .data__label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-ink-muted);
    margin-bottom: 6px;
  }

  .data__value {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 500;
    color: var(--color-ink-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }

  .data__unit {
    font-size: 12px;
    color: var(--color-ink-muted);
    margin-left: 4px;
  }

  /* ---------- TOOLTIP ---------- */
  .tooltip {
    position: absolute;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-hairline);
    border-radius: 4px;
    padding: 12px 16px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s var(--ease-out);
    z-index: 20;
    min-width: 180px;
    max-width: 240px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-hairline-soft);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .tooltip.is-visible { opacity: 1; }

  .tooltip__name {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-ink-muted);
    margin-bottom: 8px;
  }

  .tooltip__detail {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 14px;
    color: var(--color-ink-primary);
    line-height: 1.35;
    letter-spacing: -0.01em;
  }

  /* ---------- EXPLORE / VIEW ENGINE BUTTON (solid dark) ---------- */
  .explore-btn {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-bg-base);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: var(--color-ink-primary);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 12px 28px;
    border-radius: var(--radius-sharp);
    cursor: pointer;
    z-index: 15;
    display: none;
    align-items: center;
    gap: 10px;
    opacity: 0;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background var(--duration-quick) var(--ease-precise),
                border-color var(--duration-quick) var(--ease-precise),
                color var(--duration-quick) var(--ease-precise);
  }

  .explore-btn:hover {
    background: var(--color-ink-primary);
    color: var(--color-bg-base);
    border-color: var(--color-ink-primary);
  }

  .explore-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 3px;
  }

  @keyframes explorePulse {
    0%   { box-shadow: 0 0 0 0px  rgba(245, 245, 240, 0.2); }
    70%  { box-shadow: 0 0 0 10px rgba(245, 245, 240, 0);   }
    100% { box-shadow: 0 0 0 0px  rgba(245, 245, 240, 0);   }
  }

  .explore-btn.is-pulsing { animation: explorePulse 2.4s var(--ease-out) infinite; }

  /* ---------- STAGE NAV (click-through for scenes 3–7) ---------- */
  .stage-nav {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 24px;
    display: none;            /* toggled to flex in scenes 3–7 */
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    z-index: 12;
    pointer-events: none;     /* only the buttons are interactive */
  }

  .stage-nav__btn {
    pointer-events: auto;
    background: rgba(10, 11, 15, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: var(--color-ink-primary);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 11px 22px;
    border-radius: var(--radius-sharp);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background var(--duration-quick, 0.3s) var(--ease-precise),
                border-color var(--duration-quick, 0.3s) var(--ease-precise),
                color var(--duration-quick, 0.3s) var(--ease-precise);
  }

  .stage-nav__btn:hover {
    background: var(--color-ink-primary);
    color: var(--color-bg-base);
    border-color: var(--color-ink-primary);
  }

  .stage-nav__btn--primary {
    background: var(--color-ink-primary);
    color: var(--color-bg-base);
    border-color: var(--color-ink-primary);
  }

  .stage-nav__btn--primary:hover { box-shadow: 0 0 20px rgba(245, 245, 240, 0.25); }

  .stage-nav__btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 3px;
  }

  /* ---------- IGNITE BUTTON (primary style) ---------- */
  .ignite-btn {
    position: absolute;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-ink-primary);
    border: none;
    color: var(--color-bg-base);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 14px 28px;
    border-radius: var(--radius-sharp);
    cursor: pointer;
    z-index: 15;
    display: none;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: background var(--duration-quick) var(--ease-precise),
                color var(--duration-quick) var(--ease-precise),
                transform var(--duration-quick) var(--ease-precise),
                box-shadow var(--duration-quick) var(--ease-precise);
  }

  .ignite-btn:hover {
    background: var(--color-hot);
    color: var(--color-ink-primary);
    transform: translate(-50%, calc(-50% - 1px));
    box-shadow: var(--shadow-glow-hot);
  }

  .ignite-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 3px;
  }

  /* Attention pulse — hot ring radiating from the button until it's clicked */
  @keyframes ignitePulse {
    0%   { box-shadow: 0 0 0 0px  rgba(255, 107, 53, 0.55); }
    70%  { box-shadow: 0 0 0 16px rgba(255, 107, 53, 0);    }
    100% { box-shadow: 0 0 0 0px  rgba(255, 107, 53, 0);    }
  }

  .ignite-btn.is-hinting { animation: ignitePulse 2s var(--ease-out) infinite; }

  /* "Tap to ignite" caption sitting just under the IGNITE button */
  .ignite-hint {
    position: absolute;
    top: calc(38% + 32px);
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-ink-secondary);
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
    z-index: 15;
    display: none;
    opacity: 0.7;  /* base; the blink animation modulates this when shown */
    white-space: nowrap;
    pointer-events: none;
    animation: igniteHintBlink 2.2s var(--ease-in-out) infinite;
  }

  @keyframes igniteHintBlink {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 0.95; }
  }

  /* Scene 0 interaction hint — a HUD pill in the corner of the stage. Legible
     over the bright sky-blue intro via a blurred dark backdrop. JS reveals it
     on Scene 0 and hides it elsewhere. */
  .orbit-hint {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    display: none;
    opacity: 0;
    z-index: 15;
    pointer-events: none;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-secondary);
    background: rgba(10, 11, 15, 0.5);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sharp);
    padding: 8px 12px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    white-space: nowrap;
  }

  /* ---------- LOADING ---------- */
  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-base);
    color: var(--color-ink-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    z-index: 100;
    transition: opacity var(--duration-standard);
  }

  .loading.is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  /* ---------- MOBILE ---------- */
  @media (max-width: 768px) {
    .scene-info { padding: 16px 20px 14px; }
    .info-topbar { margin-bottom: 12px; }
    .topbar__progress { width: 88px; }
    .headline { margin-bottom: 12px; }
    .stage { aspect-ratio: 375 / 560; max-height: 560px; }
    .headline__title { font-size: 24px; }
    .headline__subline { font-size: 13px; }
    .data { gap: 24px; }
    .data__value { font-size: 15px; }

    /* Touch targets: every on-canvas control clears the 44px minimum.
       min-height does the work so the labels can stay compact. */
    .ignite-btn {
      font-size: 10px; padding: 12px 24px; min-height: 44px;
      justify-content: center;
    }
    .explore-btn {
      font-size: 10px; padding: 12px 22px; min-height: 44px;
      justify-content: center; bottom: 16px;
    }
    .stage-nav { bottom: 16px; padding: 0 16px; }
    .stage-nav__btn {
      font-size: 10px; letter-spacing: 0.14em;
      padding: 12px 18px; min-height: 44px;
    }

    .orbit-hint {
      top: 12px;
      font-size: 9px; letter-spacing: 0.1em; padding: 7px 12px;
      white-space: normal; max-width: 80%; line-height: 1.5;
    }
  }

  /* Narrow phones — keep the two-up data row from crowding and let the
     scene nav buttons shrink before they ever touch. */
  @media (max-width: 420px) {
    .scene-info { padding: 14px 16px 12px; }
    .data { gap: 16px; }
    .data__value { font-size: 14px; }
    .data__label { font-size: 9px; letter-spacing: 0.16em; }
    .stage-nav { padding: 0 12px; }
    .stage-nav__btn { padding: 12px 14px; letter-spacing: 0.1em; }
  }

  /* ---------- FOCUS & ACCESSIBILITY ---------- */
  button:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  /* ---------- REDUCED MOTION ---------- */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Scratch vector reused each frame for the parallax-offset lookAt (no per-frame alloc).
const _lookTmp = new THREE.Vector3();

// ---------- WEB COMPONENT DEFINITION ----------
class JetEngineInfographic extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentScene = 0;
    this.scenes = SCENES;
    this.ignited = false; // tracks whether Scene 3 has been ignited
  }

  connectedCallback() {
    this.render();
    this.initThree();
    this.initInteractions();
    this.animate();
    // Scene 0 is an orbit scene — let the wheel zoom the canvas, not scroll the page
    this.setAttribute('data-lenis-prevent', '');
  }

  disconnectedCallback() {
    this.composer?.dispose();
    this.renderer?.dispose();
    this.resizeObserver?.disconnect();
  }

  // ---------- RENDER SHADOW DOM ----------
  render() {
    const scene = this.scenes[0];
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>

      <div class="component-wrap">
      <div class="scene-info">
        <div class="info-topbar">
          <div class="topbar__label" data-scene-label>${scene.label}</div>
          <div class="topbar__progress">
            <div class="topbar__progress-bar" data-progress></div>
          </div>
        </div>
        <div class="headline">
          <h2 class="headline__title" data-headline-title>${scene.title}</h2>
          <p  class="headline__subline" data-headline-subline>${scene.subline}</p>
        </div>
        <div class="data" data-data-readout>
          ${this.renderStats(scene.stats)}
        </div>
      </div>

      <div class="stage">
        <div class="canvas-host"></div>

        <!-- Scene 0 interaction hint — how to play with the 3D view -->
        <div class="orbit-hint" data-orbit-hint>Drag to orbit&nbsp;·&nbsp;scroll to zoom&nbsp;·&nbsp;hover to explore</div>

        <button class="explore-btn" data-explore>&#x2192;&nbsp;&nbsp;VIEW ENGINE</button>

        <!-- Click-through nav for the thrust stages (scenes 3–7) -->
        <div class="stage-nav" data-stage-nav>
          <button class="stage-nav__btn" data-stage-prev>&#x2039;&nbsp;&nbsp;Back</button>
          <button class="stage-nav__btn stage-nav__btn--primary" data-stage-next>Next stage&nbsp;&nbsp;&#x203A;</button>
        </div>

        <div class="tooltip" data-tooltip>
          <div class="tooltip__name"   data-tooltip-name></div>
          <div class="tooltip__detail" data-tooltip-detail></div>
        </div>

        <button class="ignite-btn" data-ignite aria-label="Ignite engine">
          ⚡&nbsp;IGNITE
        </button>
        <div class="ignite-hint" data-ignite-hint>Tap to ignite the chamber</div>

        <div class="loading" data-loading>Initialising · Three.js</div>
      </div>
      </div>
    `;
  }

  renderStats(stats) {
    return stats
      .map(
        (s) => `
        <div class="data__item">
          <div class="data__label">${s.label}</div>
          <div class="data__value">${s.value}<span class="data__unit">${s.unit}</span></div>
        </div>`,
      )
      .join('');
  }

  // ---------- THREE.JS SETUP ----------
  initThree() {
    const host = this.shadowRoot.querySelector('.canvas-host');
    const { width, height } = host.getBoundingClientRect();

    // Scene
    this.threeScene = new THREE.Scene();
    this.threeScene.fog = new THREE.Fog(0xBFD8EC, 220, 1400); // far fog so Scene 0's Sky shader reads clean; pulled in dark for Scene 2+

    // Camera — starts at Scene 0 (full aircraft) position
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    this.camera.position.set(12, 7, 36);

    // cameraTarget is tweened by GSAP in transitionScene();
    // the animate loop feeds it into camera.lookAt() every frame.
    // Scene 0 lookAt — matches aircraft body center after engine-alignment shift in model-loader.js
    this.cameraTarget = new THREE.Vector3(-7.7, 3, -1.2);
    this.camera.lookAt(this.cameraTarget);

    // Cursor parallax — in the scripted scenes (OrbitControls off) the view leans
    // very slightly toward the cursor, so the engine feels alive even at rest.
    // Applied as an offset on the lookAt target (never the GSAP-owned position),
    // so it can't fight the camera tweens or the ignition pull-back.
    this._parallax       = new THREE.Vector3();
    this._parallaxTarget = new THREE.Vector3();
    this._reducedMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    host.appendChild(this.renderer.domElement);

    // ---------- POST-PROCESSING: selective bloom ----------
    // EffectComposer renders the scene into an offscreen buffer, blooms only the
    // brightest pixels (the ignited combustion chamber, the exhaust plume, runway
    // lights), then OutputPass re-applies tone mapping + sRGB so the look matches a
    // direct render. Bloom strength is driven per-scene by setBloom(): it sits at a
    // subtle base in the cool scenes and is ramped hard on ignition (interactions.js).
    this.BLOOM_BASE = 0.16;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.threeScene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.BLOOM_BASE, // strength
      0.65,            // radius
      0.72,            // threshold — only bright (hot) pixels bloom past their edges
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
    this.composer.setSize(width, height);

    // Scene 0 shares the finale's atmospheric Sky shader, so no solid background
    // here — it's set to a dark Color in Scenes 1–5 and back to null in the finale.
    this.threeScene.background = null;

    // Lighting
    this.threeScene.add(new THREE.AmbientLight(0xC8D8E8, 1.2)); // bright sky ambient for Scene 0

    const key = new THREE.DirectionalLight(0xffffff, 1.8); // sun
    key.position.set(20, 30, 15);
    this.threeScene.add(key);

    const rim = new THREE.DirectionalLight(0x4fc3f7, 0.8);
    rim.position.set(-4, 2, -3);
    this.threeScene.add(rim);

    const fill = new THREE.DirectionalLight(0xff6b35, 0.3);
    fill.position.set(-2, -2, 2);
    this.threeScene.add(fill);

    // Store light refs to adjust per scene
    this._ambientLight = this.threeScene.children.find(c => c.isAmbientLight);
    this._keyLight = key;

    // Aircraft body — loaded asynchronously from public/a350.glb.
    // Falls back to the procedural buildAircraftBody() if the file is missing.
    // scenes.js guards every access with `if (component.aircraftBody)` so it's
    // safe for this to be null until the model arrives.
    this.aircraftBody = null;
    this._loadAircraft();

    // Detailed engine model — hidden in Scene 0, shown in Scenes 1–6
    this.engine = buildEngine();
    this.engine.visible = false;
    this.threeScene.add(this.engine);

    // Particle systems — added to the Three.js scene, visibility toggled per scene
    this.intakeParticles  = buildIntakeParticles();
    this.exhaustParticles = buildExhaustParticles();
    this.threeScene.add(this.intakeParticles);
    this.threeScene.add(this.exhaustParticles);

    // Atmospheric sky + drifting clouds. Shared by Scene 0 and the finale, so
    // they're shown from the start (hidden again for the engine-anatomy scenes).
    this.sky = buildSky();
    this.clouds = buildClouds();
    this.threeScene.add(this.sky);
    this.threeScene.add(this.clouds);
    this.sky.visible = true;
    this.clouds.visible = true;

    // Runway for the Scene 8 takeoff — world-space, hidden until the finale.
    this.runway = buildRunway();
    this.runway.visible = false;
    this.threeScene.add(this.runway);

    this._finaleActive = false;

    // Orbit controls — starts targeting the aircraft body; switches to engine in Scene 6.
    // Kept disabled until _loadAircraft fires so the user can't orbit an empty scene.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan     = false;
    // Wheel-zoom only in the orbit scenes (0 + finale); transitionScene toggles it
    // per scene, and pairs it with data-lenis-prevent so the wheel zooms the canvas
    // there but scrolls the host page everywhere else.
    this.controls.enableZoom    = true;
    this.controls.enabled       = false;
    this.controls.autoRotateSpeed = 0.6; // gentle auto-rotate — Scene 0 hint + the finale
    this.controls.target.set(-7.7, 3, -1.2);
    this.controls.minDistance   = 14;
    this.controls.maxDistance   = 55;

    // Once the user grabs the model, stop auto-rotating so it doesn't fight their
    // drag, and retire the Scene 0 hint — they've discovered the interaction.
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
      const orbitHint = this.shadowRoot.querySelector('[data-orbit-hint]');
      if (orbitHint && orbitHint.style.display !== 'none') {
        gsap.to(orbitHint, {
          opacity: 0, duration: 0.4,
          onComplete() { orbitHint.style.display = 'none'; },
        });
      }
    });

    // Cache references to parts that need per-frame or event-driven animation
    this.fan            = this.engine.getObjectByName('fan');
    this.turbine        = this.engine.getObjectByName('turbine');
    this.combustion     = this.engine.getObjectByName('combustion');
    this.combustionGlow = this.engine.getObjectByName('combustionGlow');

    // Responsive resize
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(host);

    // Particles start hidden (Scene 0 is the aircraft intro)
    this.intakeParticles.visible = false;

    // Loading overlay is dismissed inside _loadAircraft() once the model is ready
  }

  // ---------- AIRCRAFT MODEL LOADER ----------
  _loadAircraft() {
    const loadingEl = this.shadowRoot.querySelector('[data-loading]');
    if (loadingEl) loadingEl.textContent = 'Loading aircraft · 0%';

    loadAircraftWithFallback(
      'a350.glb',

      // onReady — called for both GLB success and procedural fallback
      (model) => {
        this.aircraftBody = model;
        this.threeScene.add(model);
        this._computeAircraftTransforms(model);
        // Capture the level orientation now (nose → +X), before any bank/pitch —
        // the takeoff pitches relative to this. See setAircraftPitch() in scenes.js.
        this._aircraftLevelQuat = model.quaternion.clone();
        if (loadingEl) {
          loadingEl.style.transition = 'opacity 0.8s';
          loadingEl.classList.add('is-hidden');
        }

        // Enable aircraft orbit, with a gentle auto-rotate to signal it's draggable
        this.controls.enabled = true;
        this.controls.autoRotate = true;

        // Show CTA — "VIEW ENGINE" in Scene 0 proceeds to the side-angle shot
        const exploreBtn = this.shadowRoot.querySelector('[data-explore]');
        if (exploreBtn) {
          exploreBtn.innerHTML = '&#x2192;&nbsp;&nbsp;VIEW ENGINE';
          exploreBtn.style.display = 'flex';
          gsap.fromTo(exploreBtn, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.8 });
          setTimeout(() => exploreBtn.classList.add('is-pulsing'), 2000);
        }

        // Reveal the Scene 0 interaction hint once the aircraft is interactive.
        const orbitHint = this.shadowRoot.querySelector('[data-orbit-hint]');
        if (orbitHint && this.currentScene === 0) {
          orbitHint.style.display = 'block';
          gsap.fromTo(orbitHint, { opacity: 0 }, { opacity: 0.6, duration: 0.8, delay: 1.0 });
        }
      },

      // onPct — download progress 0–100
      (pct) => {
        if (loadingEl && !loadingEl.classList.contains('is-hidden')) {
          loadingEl.textContent = `Loading aircraft · ${pct}%`;
        }
      },

      // onFallback — GLB missing or failed, brief notice before fallback fires
      () => {
        if (loadingEl) loadingEl.textContent = 'No GLB found · using built-in model';
      },
    );
  }

  // Capture two aircraft poses:
  //   base    — full-aircraft view (Scenes 0–1), as normalized by model-loader
  //   aligned — starboard nacelle dropped onto the procedural engine at origin and
  //             scaled to the same diameter, for the Scene 2 x-ray overlay.
  //
  // a350.glb is modelled in metres (wingspan 64.8, length 74.2). Every part is baked
  // into meshes at the origin and the engine_l/r nodes are empty mount markers offset
  // from the real nacelle — so the nacelle centre below comes from a vertex scan of
  // the file (starboard pod ≈ X-10.36, axis along local +Z, outer cowl Ø≈3.78 m).
  // If the GLB is ever replaced, re-measure these.
  _computeAircraftTransforms(model) {
    this._aircraftBase = { pos: model.position.clone(), scale: model.scale.clone() };

    // No engine_r marker ⇒ procedural fallback aircraft; skip the overlay.
    if (!model.getObjectByName('engine_r')) {
      this._aircraftAligned = {
        pos: this._aircraftBase.pos.clone(),
        scale: this._aircraftBase.scale.clone(),
      };
      return;
    }

    const NACELLE_CENTER  = new THREE.Vector3(-10.36, -1.89, 6.11); // GLB-local metres
    const NACELLE_DIAMETER = 3.78;                                  // outer cowl (vertical)
    const PROC_DIAMETER    = 3.04;                                  // procedural fan-cowl Ø
    const FIT_MARGIN       = 1.15;                                  // scale plane up so the engine sits well inside the nacelle
    const Y_NUDGE          = -0.1;                                  // drop the plane slightly so the engine centres in the nacelle
    const s = (PROC_DIAMETER * FIT_MARGIN) / NACELLE_DIAMETER;      // ≈ 0.82

    // model keeps rotation.y = π/2 (nose → +X). R_y(90°): (x,y,z) → (z,y,-x).
    const c = NACELLE_CENTER.clone().multiplyScalar(s);
    const rotated = new THREE.Vector3(c.z, c.y, -c.x);

    const pos = rotated.multiplyScalar(-1);  // land the nacelle centre on world origin
    pos.y += Y_NUDGE;
    this._aircraftAligned = {
      pos,
      scale: new THREE.Vector3(s, s, s),
    };
  }

  onResize() {
    const host = this.shadowRoot.querySelector('.canvas-host');
    const { width, height } = host.getBoundingClientRect();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer?.setSize(width, height);
    this.bloomPass?.setSize(width, height);
  }

  // ---------- INTERACTIONS ----------
  initInteractions() {
    // CTA button: steps the aircraft scenes (0→1→2→3) and replays from the finale
    const exploreBtn = this.shadowRoot.querySelector('[data-explore]');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        if (this.currentScene <= 2) this.goToScene(this.currentScene + 1);
        else if (this.currentScene === 8) this.goToScene(0); // replay
      });
    }

    // Click-through stage nav (scenes 3–7). Next on Scene 7 leads to the finale.
    this.shadowRoot.querySelector('[data-stage-prev]')
      ?.addEventListener('click', () => this.goToScene(this.currentScene - 1));
    this.shadowRoot.querySelector('[data-stage-next]')
      ?.addEventListener('click', () => this.goToScene(this.currentScene + 1));

    // Cursor parallax driver — track the normalized cursor position over the stage;
    // the animate loop eases the lookAt toward it. Skipped under reduced motion.
    if (!this._reducedMotion) {
      const stage = this.shadowRoot.querySelector('.stage');
      stage?.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1 … 1
        const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2; // -1 … 1
        this._parallaxTarget.set(nx * 0.55, -ny * 0.4, 0);      // world-space lookAt offset
      });
      stage?.addEventListener('pointerleave', () => this._parallaxTarget.set(0, 0, 0));
    }

    // Raycaster tooltips from interactions.js
    initTooltips(this);

    // Ignition button wiring from interactions.js
    initIgnition(this);
  }

  // Eased bloom strength change — base in the cool scenes, ramped on combustion.
  setBloom(strength, dur = 0.6) {
    if (!this.bloomPass) return;
    gsap.killTweensOf(this.bloomPass);
    if (dur > 0) gsap.to(this.bloomPass, { strength, duration: dur, ease: 'power2.out' });
    else this.bloomPass.strength = strength;
  }

  goToScene(idx) {
    if (idx < 0 || idx >= this.scenes.length) return;
    // transitionScene reads this.currentScene as the *previous* index — update after
    transitionScene(this, idx);
    this.currentScene = idx;
  }

  // ---------- ANIMATION LOOP ----------
  animate() {
    requestAnimationFrame(() => this.animate());

    // Idle rotation — fan always spins forward, turbine spins opposite
    if (this.fan)     this.fan.rotation.x     += 0.015;
    if (this.turbine) this.turbine.rotation.x -= 0.02; // counter-rotation is physically correct

    // Gentle engine sway — disabled once OrbitControls has taken over, and in
    // Scene 2 where the engine must stay locked under the ghost-aircraft overlay.
    if (this.engine && !this.controls.enabled && this.currentScene !== 2) {
      this.engine.rotation.y = Math.sin(Date.now() * 0.0003) * 0.05;
    } else if (this.engine && this.currentScene === 2) {
      this.engine.rotation.y = 0;
    }

    // Drive camera lookAt from the tweened cameraTarget (not active when OrbitControls is on).
    // Ease in the cursor-parallax offset so the view leans gently toward the pointer.
    if (!this.controls.enabled && this.cameraTarget) {
      this._parallax.lerp(this._parallaxTarget, 0.06);
      _lookTmp.copy(this.cameraTarget).add(this._parallax);
      this.camera.lookAt(_lookTmp);
    }

    // Particle systems
    tickParticles(this.intakeParticles, this.exhaustParticles);

    // Drift the cloud field (Scene 0 + finale); tickClouds self-guards on visibility
    tickClouds(this.clouds);

    // Only run update() while OrbitControls owns the view (Scenes 0 & 7).
    // When disabled it would still call camera.lookAt(controls.target) and
    // override the tweened cameraTarget, pulling the engine off-centre.
    if (this.controls && this.controls.enabled) this.controls.update();

    // Render through the bloom composer (falls back to a direct render if it
    // failed to initialise for any reason).
    if (this.composer) this.composer.render();
    else this.renderer?.render(this.threeScene, this.camera);
  }
}

customElements.define('jet-engine-infographic', JetEngineInfographic);
