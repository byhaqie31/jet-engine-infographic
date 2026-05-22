/**
 * engine-model.js
 * Rolls-Royce Trent XWB-97 turbofan — stylised from Three.js primitives.
 * Engine mounted beneath a swept wing on a tapered pylon (A350-1000 config).
 *
 * Coordinate system:
 *   X   thrust axis  (+ = intake/forward, − = exhaust/aft)
 *   Y   vertical     (+ = up)
 *   Z   lateral      (+ = port / viewer side)
 *
 * Named objects consumed by animation + tooltip systems:
 *   fan, compressor, combustion, combustionGlow, turbine, nozzle
 */

import * as THREE from 'three';

export function buildEngine() {
  const root = new THREE.Group();
  root.name = 'jetEngine';

  // ─── Materials ─────────────────────────────────────────────────────────────

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xEDF0F4, metalness: 0.22, roughness: 0.58, // airline white paint
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xc9ccd1, metalness: 0.96, roughness: 0.18,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x16181f, metalness: 0.72, roughness: 0.55,
  });
  const combustionMat = new THREE.MeshStandardMaterial({
    color: 0xff6b35, emissive: 0xff4500, emissiveIntensity: 0.0,
    metalness: 0.3, roughness: 0.4,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff8c42, transparent: true, opacity: 0.0,
  });
  // ─── 1. NACELLE ─────────────────────────────────────────────────────────────
  // Trent XWB has a very large-diameter fan cowl (high bypass ratio)
  // with a distinct "step" to the narrower core cowl at the bypass exit.

  const nacelle = new THREE.Group();
  nacelle.name = 'nacelle';

  // Fan cowl — large forward section (intake at x=+2.6, bypass exit at x=−1.0)
  const fanCowlGeo = new THREE.CylinderGeometry(1.52, 1.5, 3.6, 64, 1, true);
  const fanCowl = new THREE.Mesh(fanCowlGeo, shellMat);
  fanCowl.rotation.z = Math.PI / 2;
  fanCowl.position.x = 0.8;
  nacelle.add(fanCowl);

  // Intake lip — smooth rounded leading edge
  const lipGeo = new THREE.TorusGeometry(1.5, 0.082, 16, 64);
  const lip = new THREE.Mesh(lipGeo, bladeMat);
  lip.position.x = 2.6;
  lip.rotation.y = Math.PI / 2;
  nacelle.add(lip);

  // Bypass exit ring — visible step/split between fan cowl and core cowl
  const bypassRingGeo = new THREE.TorusGeometry(1.48, 0.024, 8, 64);
  const bypassRing = new THREE.Mesh(bypassRingGeo, bladeMat);
  bypassRing.position.x = -1.0;
  bypassRing.rotation.y = Math.PI / 2;
  nacelle.add(bypassRing);

  // Core cowl — narrower aft section (bypass exit at x=−1.0, fan nozzle exit at x=−2.8)
  const coreCowlGeo = new THREE.CylinderGeometry(0.88, 1.08, 2.0, 64, 1, true);
  const coreCowl = new THREE.Mesh(coreCowlGeo, shellMat);
  coreCowl.rotation.z = Math.PI / 2;
  coreCowl.position.x = -1.8;
  nacelle.add(coreCowl);

  // Fan nozzle exit ring
  const fanNozzleRingGeo = new THREE.TorusGeometry(0.86, 0.024, 8, 64);
  const fanNozzleRing = new THREE.Mesh(fanNozzleRingGeo, bladeMat);
  fanNozzleRing.position.x = -2.8;
  fanNozzleRing.rotation.y = Math.PI / 2;
  nacelle.add(fanNozzleRing);

  // Chevron serrations on the fan cowl trailing edge — Trent XWB noise-reduction signature
  const CHEVRON_COUNT = 20;
  for (let i = 0; i < CHEVRON_COUNT; i++) {
    const angle = (i / CHEVRON_COUNT) * Math.PI * 2;
    const chevGeo = new THREE.BoxGeometry(0.22, 0.04, 0.09);
    const chev = new THREE.Mesh(chevGeo, bladeMat);
    chev.position.set(-0.98, Math.cos(angle) * 1.5, Math.sin(angle) * 1.5);
    // Cant each tab slightly inward toward the engine axis
    chev.rotation.x = angle + Math.PI / CHEVRON_COUNT;
    nacelle.add(chev);
  }

  root.add(nacelle);

  // ─── 2. NOZZLE GROUP (named for tooltip) ────────────────────────────────────

  const nozzle = new THREE.Group();
  nozzle.name = 'nozzle';

  // Hot gas nozzle — core exit (inner, smaller diameter)
  const hotNozzleGeo = new THREE.CylinderGeometry(0.5, 0.68, 0.5, 64, 1, true);
  const hotNozzle = new THREE.Mesh(hotNozzleGeo, innerMat);
  hotNozzle.rotation.z = Math.PI / 2;
  hotNozzle.position.x = -3.06;
  nozzle.add(hotNozzle);

  // Exhaust plug cone (inner centrebody)
  const exhaustConeGeo = new THREE.ConeGeometry(0.46, 1.0, 24);
  const exhaustCone = new THREE.Mesh(exhaustConeGeo, innerMat);
  exhaustCone.rotation.z = -Math.PI / 2;
  exhaustCone.position.x = -2.78;
  nozzle.add(exhaustCone);

  // Thin nozzle exit ring (also helps raycaster detect clicks near nozzle)
  const nozzleExitRingGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 64);
  const nozzleExitRing = new THREE.Mesh(nozzleExitRingGeo, bladeMat);
  nozzleExitRing.position.x = -3.1;
  nozzleExitRing.rotation.y = Math.PI / 2;
  nozzle.add(nozzleExitRing);

  root.add(nozzle);

  // ─── 3. SPINNER + FAN (named 'fan') ─────────────────────────────────────────
  // Trent XWB: 22 wide-chord, swept composite fan blades.

  const fan = new THREE.Group();
  fan.name = 'fan';

  // Nose cone / spinner
  const spinnerGeo = new THREE.ConeGeometry(0.28, 0.68, 24);
  const spinner = new THREE.Mesh(spinnerGeo, bladeMat);
  spinner.rotation.z = -Math.PI / 2; // point forward (+X)
  spinner.position.x = 2.44;
  fan.add(spinner);

  // Hub ring
  const hubGeo = new THREE.CylinderGeometry(0.29, 0.22, 0.3, 24);
  const hub = new THREE.Mesh(hubGeo, bladeMat);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = 2.1;
  fan.add(hub);

  // 22 wide-chord fan blades
  const FAN_BLADES = 22;
  const fanBladeGeo = new THREE.BoxGeometry(0.07, 1.1, 0.28);
  for (let i = 0; i < FAN_BLADES; i++) {
    const angle = (i / FAN_BLADES) * Math.PI * 2;
    const blade = new THREE.Mesh(fanBladeGeo, bladeMat);
    blade.position.set(2.0, Math.cos(angle) * 0.72, Math.sin(angle) * 0.72);
    blade.rotation.x = angle;
    blade.rotation.y = Math.PI / 8; // blade pitch angle
    fan.add(blade);
  }
  root.add(fan);

  // ─── 4. COMPRESSOR (named 'compressor') ─────────────────────────────────────

  const compressor = new THREE.Group();
  compressor.name = 'compressor';

  const compX = [1.4, 1.0, 0.56, 0.12];
  for (let s = 0; s < 4; s++) {
    const stage = new THREE.Group();
    const r = 0.78 - s * 0.07;
    const compBladeGeo = new THREE.BoxGeometry(0.045, 0.28, 0.1);
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const blade = new THREE.Mesh(compBladeGeo, bladeMat);
      blade.position.set(compX[s], Math.cos(angle) * (r - 0.08), Math.sin(angle) * (r - 0.08));
      blade.rotation.x = angle;
      blade.rotation.y = Math.PI / 6;
      stage.add(blade);
    }
    compressor.add(stage);
  }
  root.add(compressor);

  // ─── 5. COMBUSTION CHAMBER (named 'combustion') ──────────────────────────────

  const combustionGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.88, 32);
  const combustion = new THREE.Mesh(combustionGeo, combustionMat);
  combustion.rotation.z = Math.PI / 2;
  combustion.position.x = -0.3;
  combustion.name = 'combustion';
  root.add(combustion);

  // Inner glow shell — opacity animated up on ignition
  const innerGlowGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.96, 32);
  const glow = new THREE.Mesh(innerGlowGeo, glowMat);
  glow.rotation.z = Math.PI / 2;
  glow.position.x = -0.3;
  glow.name = 'combustionGlow';
  root.add(glow);

  // ─── 6. TURBINE (named 'turbine') ────────────────────────────────────────────
  // 3 stages representing HP + LP turbines; spins counter to compressor.

  const turbine = new THREE.Group();
  turbine.name = 'turbine';

  const turbX = [-1.22, -1.58, -1.94];
  for (let s = 0; s < 3; s++) {
    const stage = new THREE.Group();
    const turbBladeGeo = new THREE.BoxGeometry(0.045, 0.36, 0.12);
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const blade = new THREE.Mesh(turbBladeGeo, bladeMat);
      blade.position.set(turbX[s], Math.cos(angle) * 0.72, Math.sin(angle) * 0.72);
      blade.rotation.x = angle;
      blade.rotation.y = -Math.PI / 5; // reverse pitch (counter-rotation)
      stage.add(blade);
    }
    turbine.add(stage);
  }
  root.add(turbine);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL AIRCRAFT BODY — Airbus A350-1000 proportions
// Shown in Scene 0 only. Hidden when engine anatomy is active.
//
// After rotation.z = π/2 on cylinders:  "top" (+Y → -X) = rear end
//                                        "bottom" (-Y → +X) = forward end
//
// Fuselage centerline: y = 6.0  (3 units above wing root at y = 3)
// Engine pods:         z = ±9   (under inner wing, ~41% semi-span)
// Fuselage span:       x = -26 (tail) → x = +24 (nose apex)
// Wing semi-span:      z = 3 → z = 22  (~19 units each side)
// ─────────────────────────────────────────────────────────────────────────────

export function buildAircraftBody() {
  const root = new THREE.Group();
  root.name = 'aircraftBody';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xEEF1F5, metalness: 0.18, roughness: 0.60,
    transparent: true, opacity: 1.0,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xD2D6DC, metalness: 0.40, roughness: 0.48,
    transparent: true, opacity: 1.0,
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xC9CCD1, metalness: 0.96, roughness: 0.18,
    transparent: true, opacity: 1.0,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x1A2535, metalness: 0.1, roughness: 0.8,
    transparent: true, opacity: 1.0,
  });

  const FY = 6.0; // fuselage centerline Y

  // ── Nose profile — 3 tapered cylinder sections ───────────────────────────
  // After rotation.z=π/2: radiusTop → -X (rear), radiusBottom → +X (forward)
  // Sections span: tip[22→24], mid[20→22], base[18→20], then barrel[−20→18]

  const noseSecs = [
    { rT: 1.5, rB: 0.0, h: 2.0, cx: 23.0 },  // nose tip   x=22→24
    { rT: 2.5, rB: 1.5, h: 2.0, cx: 21.0 },  // nose mid   x=20→22
    { rT: 3.0, rB: 2.5, h: 2.0, cx: 19.0 },  // nose base  x=18→20
  ];
  for (const s of noseSecs) {
    const geo = new THREE.CylinderGeometry(s.rT, s.rB, s.h, 48);
    const mesh = new THREE.Mesh(geo, bodyMat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(s.cx, FY, 0);
    root.add(mesh);
  }

  // ── Main barrel  x: −20 → +18 ────────────────────────────────────────────
  const barrelGeo = new THREE.CylinderGeometry(3.0, 3.0, 38, 48);
  const barrel = new THREE.Mesh(barrelGeo, bodyMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.scale.y = 0.91; // very slight oval cross-section
  barrel.position.set(-1.0, FY, 0);
  root.add(barrel);

  // ── Tail taper  x: −26 → −20 ─────────────────────────────────────────────
  const tailGeo = new THREE.CylinderGeometry(0.0, 3.0, 6.0, 32);
  const tailSec = new THREE.Mesh(tailGeo, bodyMat);
  tailSec.rotation.z = Math.PI / 2;
  tailSec.position.set(-23.0, FY, 0);
  root.add(tailSec);

  // ── Window band — thin dark strip along fuselage waterline ───────────────
  const winBandGeo = new THREE.CylinderGeometry(3.02, 3.02, 34, 48, 1, true,
    Math.PI * 0.62, Math.PI * 0.76); // arc covering window zone only
  const winBand = new THREE.Mesh(winBandGeo, windowMat);
  winBand.rotation.z = Math.PI / 2;
  winBand.scale.y = 0.91;
  winBand.position.set(-1.0, FY - 0.4, 0); // slightly below centerline
  root.add(winBand);

  // ── Main wings ───────────────────────────────────────────────────────────
  root.add(_buildMainWing(bodyMat,  1));
  root.add(_buildMainWing(bodyMat, -1));

  // Wing leading-edge caps
  // LE goes from (4, 3.04, 3*side) to (-7, 3.04, 22*side)
  // ΔX=−11, ΔZ=19  →  length≈21.95
  for (const side of [1, -1]) {
    const leLen = Math.sqrt(11 * 11 + 19 * 19); // ≈21.95
    const leGeo = new THREE.CylinderGeometry(0.038, 0.125, leLen, 8);
    const le = new THREE.Mesh(leGeo, trimMat);
    const dir = new THREE.Vector3(-11, 0, 19 * side).normalize();
    le.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    le.position.set(-1.5, 3.04, 12.5 * side);
    root.add(le);
  }

  // Wing-body fairing (smooth blend at root)
  for (const side of [1, -1]) {
    const fairGeo = new THREE.CylinderGeometry(0.55, 0.55, 5.8, 16);
    const fair = new THREE.Mesh(fairGeo, bodyMat);
    fair.rotation.x = Math.PI / 2;
    fair.position.set(1.0, 3.04, 3.0 * side);
    root.add(fair);
  }

  // ── Vertical tail fin ────────────────────────────────────────────────────
  root.add(_buildVFin2(bodyMat, FY));

  // ── Horizontal stabilizers ───────────────────────────────────────────────
  root.add(_buildHStab2(bodyMat,  1, FY));
  root.add(_buildHStab2(bodyMat, -1, FY));

  // ── Engine pods at z = ±9 ────────────────────────────────────────────────
  for (const side of [1, -1]) {
    root.add(_buildPodPylon2(bodyMat, side));
    root.add(_buildPod2(bodyMat, trimMat, bladeMat, side));
  }

  // Runway is no longer part of the aircraft body — the component owns a single
  // world-space runway (shown only for the Scene 8 takeoff). See jet-engine.js.

  return root;
}

// ── Wings ────────────────────────────────────────────────────────────────────
// Root z=±3 (fuselage side), tip z=±22. ~30° leading-edge sweep (A350-like).
// Root chord=6, tip chord=2, taper ratio≈0.33.

function _buildMainWing(mat, side) {
  const yt = 3.12, yb = 2.93;
  const z0 = 3.0 * side, z1 = 22.0 * side;
  const xLE0 = 4.0, xTE0 = -2.0;
  const xLE1 = -7.0, xTE1 = -9.0;

  const pos = new Float32Array([
    xLE0, yt, z0,  xLE1, yt, z1,  xTE1, yt, z1,  xTE0, yt, z0,
    xLE0, yb, z0,  xLE1, yb, z1,  xTE1, yb, z1,  xTE0, yb, z0,
  ]);

  let idx;
  if (side === 1) {
    idx = [
      0, 1, 2,  0, 2, 3,   4, 6, 5,  4, 7, 6,
      0, 4, 5,  0, 5, 1,   3, 2, 6,  3, 6, 7,
      1, 5, 6,  1, 6, 2,
    ];
  } else {
    idx = [
      0, 2, 1,  0, 3, 2,   4, 5, 6,  4, 6, 7,
      0, 5, 4,  0, 1, 5,   3, 6, 2,  3, 7, 6,
      1, 6, 5,  1, 2, 6,
    ];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

// ── Vertical tail fin ────────────────────────────────────────────────────────

function _buildVFin2(mat, FY) {
  const z = 0.18;
  // Root x=−20→−24 at y=FY; tip x=−22→−24 at y=FY+5.5
  const TY = FY + 5.5;
  const pos = new Float32Array([
    -20, FY,  z,  -24, FY,  z,  -24, TY,  z,  -22, TY,  z,
    -20, FY, -z,  -24, FY, -z,  -24, TY, -z,  -22, TY, -z,
  ]);
  const idx = [
    0, 3, 2,  0, 2, 1,   4, 5, 6,  4, 6, 7,
    0, 4, 7,  0, 7, 3,   1, 2, 6,  1, 6, 5,
    0, 1, 5,  0, 5, 4,   3, 7, 6,  3, 6, 2,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

// ── Horizontal stabilizers ───────────────────────────────────────────────────

function _buildHStab2(mat, side, FY) {
  const yt = FY + 0.09, yb = FY - 0.09;
  const z0 = 0.4 * side, z1 = 8.0 * side;
  const xLE0 = -19.5, xTE0 = -23.8;
  const xLE1 = -22.0, xTE1 = -24.2;

  const pos = new Float32Array([
    xLE0, yt, z0,  xLE1, yt, z1,  xTE1, yt, z1,  xTE0, yt, z0,
    xLE0, yb, z0,  xLE1, yb, z1,  xTE1, yb, z1,  xTE0, yb, z0,
  ]);

  let idx;
  if (side === 1) {
    idx = [
      0, 1, 2,  0, 2, 3,   4, 6, 5,  4, 7, 6,
      0, 4, 5,  0, 5, 1,   3, 2, 6,  3, 6, 7,
      1, 5, 6,  1, 6, 2,
    ];
  } else {
    idx = [
      0, 2, 1,  0, 3, 2,   4, 5, 6,  4, 6, 7,
      0, 5, 4,  0, 1, 5,   3, 6, 2,  3, 7, 6,
      1, 6, 5,  1, 2, 6,
    ];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

// ── Engine pod (simplified nacelle, no internals) ────────────────────────────

function _buildPod2(bodyMat, trimMat, bladeMat, side) {
  const pod = new THREE.Group();

  // Fan cowl
  const cowlGeo = new THREE.CylinderGeometry(1.52, 1.5, 3.6, 48, 1, false);
  const cowl = new THREE.Mesh(cowlGeo, bodyMat);
  cowl.rotation.z = Math.PI / 2;
  cowl.position.x = 0.8;
  pod.add(cowl);

  // Intake lip
  const lipGeo = new THREE.TorusGeometry(1.5, 0.08, 12, 48);
  const lip = new THREE.Mesh(lipGeo, trimMat);
  lip.position.x = 2.6;
  lip.rotation.y = Math.PI / 2;
  pod.add(lip);

  // Bypass exit ring
  const bypassGeo = new THREE.TorusGeometry(1.48, 0.022, 8, 48);
  const bypass = new THREE.Mesh(bypassGeo, trimMat);
  bypass.position.x = -1.0;
  bypass.rotation.y = Math.PI / 2;
  pod.add(bypass);

  // Core cowl
  const coreGeo = new THREE.CylinderGeometry(0.88, 1.08, 2.0, 48, 1, false);
  const core = new THREE.Mesh(coreGeo, bodyMat);
  core.rotation.z = Math.PI / 2;
  core.position.x = -1.8;
  pod.add(core);

  // Hot nozzle
  const nozGeo = new THREE.CylinderGeometry(0.5, 0.68, 0.5, 32, 1, false);
  const noz = new THREE.Mesh(nozGeo, trimMat);
  noz.rotation.z = Math.PI / 2;
  noz.position.x = -3.06;
  pod.add(noz);

  // Spinner
  const spinGeo = new THREE.ConeGeometry(0.27, 0.65, 20);
  const spin = new THREE.Mesh(spinGeo, bladeMat);
  spin.rotation.z = -Math.PI / 2;
  spin.position.x = 2.42;
  pod.add(spin);

  // Chevrons
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const chevGeo = new THREE.BoxGeometry(0.20, 0.033, 0.078);
    const chev = new THREE.Mesh(chevGeo, trimMat);
    chev.position.set(-0.97, Math.cos(angle) * 1.5, Math.sin(angle) * 1.5);
    chev.rotation.x = angle + Math.PI / 16;
    pod.add(chev);
  }

  pod.position.set(0, 0, 9.0 * side);
  return pod;
}

// ── Pod pylon (engine to wing strut) ─────────────────────────────────────────

function _buildPodPylon2(mat, side) {
  const g = new THREE.Group();

  // Three stacked boxes tapering upward
  const segs = [
    { y: 1.84, h: 0.64, cz: 0.62 },
    { y: 2.36, h: 0.64, cz: 0.72 },
    { y: 2.88, h: 0.64, cz: 0.84 },
  ];
  for (const seg of segs) {
    const geo = new THREE.BoxGeometry(0.22, seg.h, seg.cz);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0.18, seg.y, 0);
    g.add(mesh);
  }

  const filletGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 14);
  const fillet = new THREE.Mesh(filletGeo, mat);
  fillet.position.set(0.18, 1.52, 0);
  g.add(fillet);

  g.position.z = 9.0 * side;
  return g;
}

// ── Runway ───────────────────────────────────────────────────────────────────

export function buildRunway() {
  const g = new THREE.Group();
  g.name = 'runway';

  // Asphalt surface
  const aspMat = new THREE.MeshStandardMaterial({
    color: 0x1A1D22, roughness: 0.98, metalness: 0.0,
  });
  const asp = new THREE.Mesh(new THREE.PlaneGeometry(400, 100), aspMat);
  asp.rotation.x = -Math.PI / 2;
  asp.position.y = -1.2;
  g.add(asp);

  // Runway edge lines
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xF0F0F0 });
  for (const z of [22, -22]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.22), edgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(0, -1.19, z);
    g.add(edge);
  }

  // Center-line dashes (white, every 6 units)
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  for (let i = -18; i <= 18; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.28), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(i * 6, -1.19, 0);
    g.add(dash);
  }

  // Runway edge lights — small amber dots along edges
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFCC44 });
  for (let i = -16; i <= 16; i += 4) {
    for (const z of [24, -24]) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lightMat);
      light.position.set(i * 2, -1.1, z);
      g.add(light);
    }
  }

  return g;
}
