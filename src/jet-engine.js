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
import gsap from 'gsap';
import { buildEngine } from './engine-model.js';
import {
  buildIntakeParticles,
  buildExhaustParticles,
  tickParticles,
  initWheelNavigation,
  transitionScene,
} from './scenes.js';
import { initTooltips, initIgnition } from './interactions.js';

// ---------- SCENE CONTENT ----------
// Rolls-Royce Trent XWB-97 / Airbus A350-1000 specifications.
// `raw` is the numeric value for the animated counter;
// `value` is the pre-formatted string used in the initial static render.
const SCENES = [
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
];

// ---------- COMPONENT STYLES ----------
const styles = `
  :host {
    --bg:       #0A0B0F;
    --surface:  #13151C;
    --cool:     #4FC3F7;
    --hot:      #FF6B35;
    --ink:      #F5F5F0;
    --muted:    #8B8D98;
    --hairline: rgba(255, 255, 255, 0.08);

    display: block;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    font-family: 'Geist', system-ui, sans-serif;
    color: var(--ink);
  }

  .stage {
    position: relative;
    width: 100%;
    aspect-ratio: 1440 / 900;
    max-height: 900px;
    background: radial-gradient(ellipse at center, #14161E 0%, var(--bg) 70%);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--hairline);
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

  /* ---------- TOP BAR ---------- */
  .topbar {
    position: absolute;
    top: 0; left: 0; right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    z-index: 10;
    pointer-events: none;
  }

  .topbar__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
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
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ---------- HEADLINE OVERLAY ---------- */
  .headline {
    position: absolute;
    bottom: 120px;
    left: 0; right: 0;
    text-align: center;
    z-index: 5;
    padding: 0 32px;
    pointer-events: none;
  }

  .headline__title {
    font-family: 'Fraunces', serif;
    font-weight: 300;
    font-size: clamp(32px, 4.5vw, 56px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
  }

  .headline__subline {
    font-size: 15px;
    line-height: 1.5;
    color: var(--muted);
    max-width: 540px;
    margin: 0 auto;
  }

  /* ---------- DATA READOUT ---------- */
  .data {
    position: absolute;
    bottom: 56px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 48px;
    z-index: 5;
    pointer-events: none;
  }

  .data__item { text-align: center; }

  .data__label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--muted);
    margin-bottom: 6px;
    font-family: 'JetBrains Mono', monospace;
  }

  .data__value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
  }

  .data__unit {
    font-size: 12px;
    color: var(--muted);
    margin-left: 4px;
  }

  /* ---------- SCENE DOTS ---------- */
  .dots {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 10;
  }

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--hairline);
    cursor: pointer;
    transition: all 0.3s;
    border: none;
    padding: 0;
  }

  .dot.is-active {
    background: var(--ink);
    transform: scale(1.5);
  }

  .dot:hover { background: var(--muted); }

  /* ---------- TOOLTIP ---------- */
  .tooltip {
    position: absolute;
    background: rgba(19, 21, 28, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 10px 14px;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 20;
    min-width: 160px;
    max-width: 220px;
  }

  .tooltip.is-visible { opacity: 1; }

  .tooltip__name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--ink);
    margin-bottom: 5px;
  }

  .tooltip__detail {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    line-height: 1.6;
  }

  /* ---------- IGNITE BUTTON ---------- */
  .ignite-btn {
    position: absolute;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: transparent;
    border: 1px solid var(--hot);
    color: var(--hot);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 13px 32px;
    border-radius: 3px;
    cursor: pointer;
    z-index: 15;
    display: none;         /* shown via JS when Scene 3 activates */
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: background 0.25s, box-shadow 0.25s;
  }

  .ignite-btn:hover {
    background: rgba(255, 107, 53, 0.1);
    box-shadow: 0 0 24px rgba(255, 107, 53, 0.25);
  }

  /* ---------- LOADING ---------- */
  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    z-index: 100;
    transition: opacity 0.6s;
  }

  .loading.is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  /* ---------- MOBILE ---------- */
  @media (max-width: 768px) {
    .stage { aspect-ratio: 375 / 677; max-height: 677px; }
    .topbar { padding: 16px 20px; }
    .headline { bottom: 140px; padding: 0 20px; }
    .headline__title { font-size: 28px; }
    .headline__subline { font-size: 13px; }
    .data { gap: 24px; bottom: 64px; }
    .data__value { font-size: 15px; }
    .ignite-btn { font-size: 10px; padding: 11px 24px; }
  }
`;

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
  }

  disconnectedCallback() {
    this.renderer?.dispose();
    this.resizeObserver?.disconnect();
  }

  // ---------- RENDER SHADOW DOM ----------
  render() {
    const scene = this.scenes[0];
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="stage">
        <div class="canvas-host"></div>

        <div class="topbar">
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

        <div class="dots" data-dots>
          ${this.scenes
            .map((s, i) =>
              `<button class="dot ${i === 0 ? 'is-active' : ''}" data-dot="${i}" aria-label="Go to scene ${i + 1}"></button>`
            )
            .join('')}
        </div>

        <!-- Tooltip shown by raycaster in interactions.js -->
        <div class="tooltip" data-tooltip>
          <div class="tooltip__name"   data-tooltip-name></div>
          <div class="tooltip__detail" data-tooltip-detail></div>
        </div>

        <!-- Ignite button shown only during Scene 3 -->
        <button class="ignite-btn" data-ignite aria-label="Ignite engine">
          ⚡&nbsp;IGNITE
        </button>

        <div class="loading" data-loading>Initialising · Three.js</div>
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
    this.threeScene.fog = new THREE.Fog(0x0a0b0f, 8, 18);

    // Camera — starts at Scene 1 position
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    this.camera.position.set(6, 1.5, 6);

    // cameraTarget is tweened by GSAP in transitionScene();
    // the animate loop feeds it into camera.lookAt() every frame.
    this.cameraTarget = new THREE.Vector3(2, 0, 0); // Scene 1 lookAt
    this.camera.lookAt(this.cameraTarget);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    host.appendChild(this.renderer.domElement);

    // Lighting — cinematic three-point setup
    this.threeScene.add(new THREE.AmbientLight(0x404858, 0.6));

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(5, 6, 5);
    this.threeScene.add(key);

    const rim = new THREE.DirectionalLight(0x4fc3f7, 0.8);
    rim.position.set(-4, 2, -3);
    this.threeScene.add(rim);

    const fill = new THREE.DirectionalLight(0xff6b35, 0.3);
    fill.position.set(-2, -2, 2);
    this.threeScene.add(fill);

    // Engine model
    this.engine = buildEngine();
    this.threeScene.add(this.engine);

    // Particle systems — added to the Three.js scene, visibility toggled per scene
    this.intakeParticles  = buildIntakeParticles();
    this.exhaustParticles = buildExhaustParticles();
    this.threeScene.add(this.intakeParticles);
    this.threeScene.add(this.exhaustParticles);

    // Orbit controls — disabled until Scene 5
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping  = true;
    this.controls.dampingFactor  = 0.08;
    this.controls.enabled        = false;
    this.controls.enablePan      = false;
    this.controls.minDistance    = 4;
    this.controls.maxDistance    = 12;

    // Cache references to parts that need per-frame or event-driven animation
    this.fan            = this.engine.getObjectByName('fan');
    this.turbine        = this.engine.getObjectByName('turbine');
    this.combustion     = this.engine.getObjectByName('combustion');
    this.combustionGlow = this.engine.getObjectByName('combustionGlow');

    // Responsive resize
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(host);

    // Scene 1 particles start visible
    this.intakeParticles.visible = true;

    // Dismiss the loading overlay
    setTimeout(() => {
      this.shadowRoot.querySelector('[data-loading]')?.classList.add('is-hidden');
    }, 300);
  }

  onResize() {
    const host = this.shadowRoot.querySelector('.canvas-host');
    const { width, height } = host.getBoundingClientRect();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ---------- INTERACTIONS ----------
  initInteractions() {
    // Scene dots — click to jump
    this.shadowRoot.querySelectorAll('[data-dot]').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        this.goToScene(parseInt(e.target.dataset.dot, 10));
      });
    });

    // Wheel / touch / keyboard navigation from scenes.js
    initWheelNavigation(this);

    // Raycaster tooltips from interactions.js
    initTooltips(this);

    // Ignition button wiring from interactions.js
    initIgnition(this);
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

    // Gentle engine sway — disabled once OrbitControls has taken over
    if (this.engine && !this.controls.enabled) {
      this.engine.rotation.y = Math.sin(Date.now() * 0.0003) * 0.05;
    }

    // Drive camera lookAt from the tweened cameraTarget (not active when OrbitControls is on)
    if (!this.controls.enabled && this.cameraTarget) {
      this.camera.lookAt(this.cameraTarget);
    }

    // Particle systems
    tickParticles(this.intakeParticles, this.exhaustParticles);

    if (this.controls) this.controls.update();
    this.renderer?.render(this.threeScene, this.camera);
  }
}

customElements.define('jet-engine-infographic', JetEngineInfographic);
