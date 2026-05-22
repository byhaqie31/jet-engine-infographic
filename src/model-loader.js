/**
 * model-loader.js
 * GLB aircraft model loading for the jet-engine-infographic.
 *
 * Responsibilities:
 * - DRACOLoader setup (most Sketchfab exports are DRACO-compressed)
 * - Auto-normalization: scales the model to fit the scene, lands on the runway
 * - Transparency patch: enables opacity on all materials so scenes.js fade works
 * - Color-space correction for PBR textures
 * - Graceful fallback to the procedural buildAircraftBody() on any error
 */

import * as THREE from 'three';
import { GLTFLoader }   from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader }  from 'three/examples/jsm/loaders/DRACOLoader.js';
import { buildAircraftBody } from './engine-model.js';

// Google's Draco decoder CDN — works for any GLB regardless of Three.js version.
// If you need offline support, copy node_modules/three/examples/jsm/libs/draco/
// into public/draco/ and change this to './draco/'.
const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

// Target fuselage length in scene units.
// The A350-1000 GLB has its fuselage along Z (74 units raw). After rotation and
// scaling to 52 units the aircraft sits comfortably in the Scene 0 runway view.
const TARGET_FUSELAGE_LENGTH = 30;

// ─── LOADER SINGLETON ────────────────────────────────────────────────────────

let _loader = null;

function getLoader() {
  if (_loader) return _loader;

  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_DECODER);
  draco.preload(); // kick off decoder fetch in parallel with the GLB

  _loader = new GLTFLoader();
  _loader.setDRACOLoader(draco);
  return _loader;
}

// ─── NORMALIZATION ────────────────────────────────────────────────────────────

/**
 * Scales, centers, and prepares a loaded GLTF scene group for the infographic.
 *
 *  Scale  — longest horizontal axis is brought to TARGET_FUSELAGE_LENGTH units
 *  Center — X and Z axes centered on world origin
 *  Y      — aircraft belly set at y = -1.2 (matches the runway plane in engine-model.js)
 *  Materials — transparent:true patched on every mesh so GSAP opacity tweens work
 */
function normalizeModel(model) {
  // ── Orientation ───────────────────────────────────────────────────────────
  // The A350 GLB has its nose at +Z and wings along X.
  // Rotating 90° around Y maps +Z → +X so the aircraft runs along the runway (X axis).
  model.rotation.y = Math.PI / 2;

  // ── Scale ────────────────────────────────────────────────────────────────
  // Box3 honours the rotation above, so size.x now reflects fuselage length.
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const longestAxis = Math.max(size.x, size.z); // ignore Y (height)
  if (longestAxis > 0) {
    model.scale.setScalar(TARGET_FUSELAGE_LENGTH / longestAxis);
  }

  // ── Position ─────────────────────────────────────────────────────────────
  // Re-measure after scale to get accurate world-space extents.
  box.setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);

  model.position.set(
    -center.x,            // center X on origin
    -box.min.y - 1.2,     // belly on runway surface (y = -1.2)
    -center.z,            // center Z on origin
  );

  // ── Engine alignment ─────────────────────────────────────────────────────
  // The procedural engine model lives at world origin (0, 0, 0).
  // Shift the aircraft body so that the starboard engine nacelle ('engine_r')
  // sits at X=0, Z=0 — making it co-axial with the procedural engine.
  // Y is intentionally left alone so the belly stays on the runway.
  model.updateMatrixWorld(true);
  const engR = model.getObjectByName('engine_r');
  if (engR) {
    const wp = new THREE.Vector3();
    engR.getWorldPosition(wp);
    model.position.x -= wp.x;
    model.position.z -= wp.z;
  }

  // ── Materials ─────────────────────────────────────────────────────────────
  model.traverse((child) => {
    if (!child.isMesh) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      // Transparency is required for the Scene 0→1 aircraft ghost-fade in scenes.js
      mat.transparent = true;

      // GLB textures embed linear data; Three.js r152+ needs explicit sRGB assignment
      if (mat.map)          mat.map.colorSpace         = THREE.SRGBColorSpace;
      if (mat.emissiveMap)  mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
    });
  });

  return model;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Load a GLB file, normalize it, and call onReady with the prepared Group.
 *
 * Place your .glb inside the project's `public/` folder and pass the filename
 * (e.g. 'a350.glb'). Vite serves public/ from the root automatically.
 *
 * @param {string}   url      Path relative to public/ root, e.g. 'a350.glb'
 * @param {Function} onReady  (model: THREE.Group) => void
 * @param {Function} onPct    (percent: number 0–100) => void   — download progress
 * @param {Function} onError  (err: Error) => void
 */
export function loadAircraftGLB(url, onReady, onPct, onError) {
  getLoader().load(
    url,
    (gltf) => onReady(normalizeModel(gltf.scene)),
    (xhr) => {
      if (xhr.total > 0) onPct?.(Math.round((xhr.loaded / xhr.total) * 100));
    },
    (err) => onError?.(err),
  );
}

/**
 * Same as loadAircraftGLB, but falls back to the procedural buildAircraftBody()
 * if the file is missing or fails to parse.
 *
 * The fallback fires onFallback() (for UI messages), then calls onReady with
 * the procedural model — so callers only need a single success handler.
 *
 * @param {string}   url         Path to the .glb, e.g. 'a350.glb'
 * @param {Function} onReady     (model: THREE.Group) => void
 * @param {Function} onPct       (percent: number) => void
 * @param {Function} onFallback  () => void  — called before fallback onReady
 */
export function loadAircraftWithFallback(url, onReady, onPct, onFallback) {
  loadAircraftGLB(
    url,
    onReady,
    onPct,
    (err) => {
      console.warn(`[model-loader] "${url}" failed — falling back to procedural model.`, err.message ?? err);
      onFallback?.();
      onReady(buildAircraftBody());
    },
  );
}
