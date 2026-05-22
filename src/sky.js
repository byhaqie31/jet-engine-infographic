/**
 * sky.js
 * Finale environment for the jet engine infographic.
 *
 * Builds an atmospheric sky (three.js Sky shader) and a field of drifting
 * billboard cloud sprites that the A350 model flies through in the final scene.
 *
 * Everything here is created hidden and toggled on only for the finale, so it
 * has zero cost during the engine-anatomy scenes.
 */

import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// ─── SKY ──────────────────────────────────────────────────────────────────────

/** Atmospheric-scattering sky dome. Forced to the far plane by its own shader,
 *  so the modest camera.far (300) is fine. */
export function buildSky() {
  const sky = new Sky();
  sky.scale.setScalar(450000);

  const u = sky.material.uniforms;
  u.turbidity.value       = 7;
  u.rayleigh.value        = 1.4;
  u.mieCoefficient.value  = 0.006;
  u.mieDirectionalG.value = 0.8;

  // Sun fairly high and to one side — clean daytime cruise light.
  const sun = new THREE.Vector3();
  const phi   = THREE.MathUtils.degToRad(90 - 24); // 24° elevation
  const theta = THREE.MathUtils.degToRad(150);
  sun.setFromSphericalCoords(1, phi, theta);
  u.sunPosition.value.copy(sun);

  sky.name = 'sky';
  sky.visible = false;
  return sky;
}

// ─── CLOUDS ─────────────────────────────────────────────────────────────────

/** Soft puffy cloud texture painted on a canvas — no external asset needed. */
function makeCloudTexture() {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // Stack several soft radial blobs into one billowy puff.
  for (let i = 0; i < 7; i++) {
    const r = size * (0.16 + Math.random() * 0.16);
    const x = size * (0.28 + Math.random() * 0.44);
    const y = size * (0.40 + Math.random() * 0.24);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Spread of the cloud field around the aircraft (which sits near the origin,
// fuselage ≈ 30 units long). Clouds travel along -X, the way the nose points.
const FIELD_X = 130;

function _placeCloud(sprite, scatter) {
  sprite.position.set(
    scatter ? (Math.random() * 2 - 1) * FIELD_X : FIELD_X + Math.random() * 30,
    -16 + Math.random() * 44,
    -55 + Math.random() * 90,
  );
  const w = 16 + Math.random() * 30;
  sprite.scale.set(w, w * 0.62, 1);
  sprite.userData.speed = 0.10 + Math.random() * 0.22;
  sprite.userData.baseOpacity = 0.45 + Math.random() * 0.4;
}

/** A drifting field of billboard clouds. Hidden until the finale. */
export function buildClouds(count = 18) {
  const tex = makeCloudTexture();
  const group = new THREE.Group();
  group.name = 'clouds';

  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    _placeCloud(sprite, true);
    group.add(sprite);
  }

  group.visible = false;
  return group;
}

/** Advance the cloud field one frame; recycle clouds that drift past the camera.
 *  Sprites fade up to their target opacity so the finale starts clean. */
export function tickClouds(group) {
  if (!group || !group.visible) return;
  for (const s of group.children) {
    s.position.x -= s.userData.speed;

    if (s.material.opacity < s.userData.baseOpacity) {
      s.material.opacity = Math.min(s.userData.baseOpacity, s.material.opacity + 0.008);
    }

    if (s.position.x < -FIELD_X) {
      _placeCloud(s, false);   // respawn ahead of the aircraft
      s.material.opacity = 0;  // fade the recycled cloud back in
    }
  }
}
