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
 *   fan, compressor, combustion, combustionGlow, turbine, nozzle, wing, pylon
 */

import * as THREE from 'three';

export function buildEngine() {
  const root = new THREE.Group();
  root.name = 'jetEngine';

  // ─── Materials ─────────────────────────────────────────────────────────────

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x2a2d36, metalness: 0.82, roughness: 0.38,
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
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x23262e, metalness: 0.78, roughness: 0.40,
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

  // ─── 7. PYLON ────────────────────────────────────────────────────────────────
  // Tapered vertical strut connecting the engine nacelle to the wing.
  // Wider at the top (wing box attachment), narrower at the bottom.

  const pylonGroup = new THREE.Group();
  pylonGroup.name = 'pylon';

  // Main strut — three stacked boxes to approximate taper
  const pylonSegs = [
    { y: 1.84, h: 0.64, cz: 0.62 },
    { y: 2.36, h: 0.64, cz: 0.72 },
    { y: 2.88, h: 0.64, cz: 0.84 },
  ];
  for (const seg of pylonSegs) {
    const geo = new THREE.BoxGeometry(0.22, seg.h, seg.cz);
    const mesh = new THREE.Mesh(geo, shellMat);
    mesh.position.set(0.18, seg.y, 0);
    pylonGroup.add(mesh);
  }

  // Lower attachment fillet (nacelle–pylon junction)
  const lowerFilletGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 16);
  const lowerFillet = new THREE.Mesh(lowerFilletGeo, shellMat);
  lowerFillet.position.set(0.18, 1.52, 0);
  pylonGroup.add(lowerFillet);

  // Upper attachment plate (pylon–wing junction)
  const upperPlateGeo = new THREE.BoxGeometry(0.24, 0.12, 1.1);
  const upperPlate = new THREE.Mesh(upperPlateGeo, shellMat);
  upperPlate.position.set(0.18, 3.18, 0);
  pylonGroup.add(upperPlate);

  root.add(pylonGroup);

  // ─── 8. WING STUB ────────────────────────────────────────────────────────────
  // Inboard section of the A350-1000's swept wing (~35° leading-edge sweep).
  // Both halves built from a custom swept-trapezoid BufferGeometry.

  const wingGroup = new THREE.Group();
  wingGroup.name = 'wing';

  // Port (z > 0) and starboard (z < 0) halves
  for (const side of [1, -1]) {
    const halfMesh = _buildWingHalf(wingMat, side);
    wingGroup.add(halfMesh);
  }

  // Root section that spans the pylon width (bridges port and starboard)
  const wingRootGeo = new THREE.BoxGeometry(2.45, 0.19, 0.44);
  const wingRoot = new THREE.Mesh(wingRootGeo, wingMat);
  wingRoot.position.set(0.28, 3.04, 0);
  wingGroup.add(wingRoot);

  // Leading-edge caps (rounded rod along each half's LE)
  for (const side of [1, -1]) {
    const leGeo = new THREE.CylinderGeometry(0.09, 0.065, 4.4, 8);
    const le = new THREE.Mesh(leGeo, bladeMat);
    // LE direction vector: from (1.5, 0.22*side) → (0.1, 4.5*side) in XZ
    const dir = new THREE.Vector3(-1.4, 0, 4.28 * side).normalize();
    le.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    le.position.set(0.8, 3.04, 2.36 * side); // midpoint of LE
    wingGroup.add(le);
  }

  root.add(wingGroup);

  return root;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * One swept wing half as a closed BufferGeometry.
 * side = 1 → port (z > 0),  side = -1 → starboard (z < 0).
 *
 * Plan-form (viewed from above):
 *   Root  z≈0.22  chord x: 1.5 (LE) → −0.95 (TE)
 *   Tip   z≈4.5   chord x: 0.1 (LE) → −1.45 (TE)   ~32° LE sweep
 */
function _buildWingHalf(mat, side) {
  const yt = 3.14, yb = 2.95; // top / bottom y (wing thickness ≈ 0.19)

  const z0 = 0.22 * side; // inner (root) z
  const z1 = 4.5  * side; // outer (tip)  z

  // Leading/trailing edge x at root and tip
  const xLE0 = 1.5,  xTE0 = -0.95;
  const xLE1 = 0.1,  xTE1 = -1.45;

  // 8 vertices: 0–3 top surface, 4–7 bottom surface
  // 0=rootLE  1=tipLE  2=tipTE  3=rootTE
  const pos = new Float32Array([
    xLE0, yt, z0,   xLE1, yt, z1,   xTE1, yt, z1,   xTE0, yt, z0,
    xLE0, yb, z0,   xLE1, yb, z1,   xTE1, yb, z1,   xTE0, yb, z0,
  ]);

  // Triangle indices — winding flips for the mirrored side so normals stay outward
  let idx;
  if (side === 1) {
    idx = [
      0, 1, 2,  0, 2, 3,   // top   (+Y)
      4, 6, 5,  4, 7, 6,   // bottom(-Y)
      0, 4, 5,  0, 5, 1,   // leading edge
      3, 2, 6,  3, 6, 7,   // trailing edge
      1, 5, 6,  1, 6, 2,   // tip
    ];
  } else {
    idx = [
      0, 2, 1,  0, 3, 2,   // top   (reversed for mirror)
      4, 5, 6,  4, 6, 7,   // bottom
      0, 5, 4,  0, 1, 5,   // leading edge
      3, 6, 2,  3, 7, 6,   // trailing edge
      1, 6, 5,  1, 2, 6,   // tip
    ];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  return new THREE.Mesh(geo, mat);
}
