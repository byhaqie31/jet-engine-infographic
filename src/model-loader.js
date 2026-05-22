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

// ─── AXEL NOVA LIVERY ──────────────────────────────────────────────────────────
// The GLB ships two flat-grey PBR materials sharing one detail texture (windows,
// panel lines). Rather than discard that detail by swapping the texture, we paint a
// real airline-style livery directly in each material's fragment shader, keyed off
// object-space position. Because every part is baked at a shared origin (see the
// note in jet-engine.js _computeAircraftTransforms), the zones line up across the
// whole airframe: white fuselage, brand-blue belly + cheatline, and an aurora
// gradient up the tail fin — the AXEL NOVA "nova" tail.
//
// Zone thresholds are in raw model metres, from a vertex scan of a350.glb:
//   nose at +Z (≈ +36)   tail at −Z (≈ −38)   belly at −Y (≈ −3.8)
//   fin tip at +Y (≈ +13)   wingtips at X (≈ ±32)   fuselage tube |X| ≲ 4.3
// If the GLB is ever replaced, re-measure and retune the constants in the shader.
//
// Colours are the AXEL NOVA brand palette (from axelnova-dashboard). strength blends
// the livery over the original texture (0 = untouched, 1 = fully repainted).
const LIVERY = {
  body:     0xF2F5FA, // fuselage white
  blue:     0x0071E3, // brand accent — belly + cheatline
  cyan:     0x06B6D4, // pinstripe + fin mid-tone
  indigo:   0x6366F1, // fin base
  violet:   0xA855F7, // fin tip
  strength: 0.92,     // 0 = original texture, 1 = full livery
};

/**
 * Paints the AXEL NOVA livery onto every material in the model via a shader patch.
 * Safe to call once after load; shared materials are patched only once.
 */
function applyBlueLivery(model) {
  // ColorManagement (default on in r150+) gives THREE.Color linear channels, which
  // is exactly what the shader's working space expects — pass them straight through.
  const C = (hex) => new THREE.Color(hex);
  const u = {
    uBody:     { value: C(LIVERY.body)   },
    uBlue:     { value: C(LIVERY.blue)   },
    uCyan:     { value: C(LIVERY.cyan)   },
    uIndigo:   { value: C(LIVERY.indigo) },
    uViolet:   { value: C(LIVERY.violet) },
    uStrength: { value: LIVERY.strength  },
  };
  const seen = new Set();

  model.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];

    mats.forEach((mat) => {
      if (!mat || seen.has(mat)) return; // patch each shared material only once
      seen.add(mat);

      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u);

        // Carry object-space position through to the fragment stage.
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vLiveryPos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLiveryPos = position;');

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            [
              '#include <common>',
              'varying vec3 vLiveryPos;',
              'uniform vec3  uBody;',
              'uniform vec3  uBlue;',
              'uniform vec3  uCyan;',
              'uniform vec3  uIndigo;',
              'uniform vec3  uViolet;',
              'uniform float uStrength;',
            ].join('\n'),
          )
          .replace(
            '#include <map_fragment>',
            [
              '#include <map_fragment>',
              '{',
              '  vec3 P = vLiveryPos;                                  // object-space metres',
              '  float fuse = 1.0 - smoothstep(3.6, 5.0, abs(P.x));    // 1 on the fuselage tube',
              '',
              '  // keep the texture detail (windows, panel lines) as a brightness factor',
              '  float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));',
              '  float detail = mix(0.74, 1.12, clamp(lum, 0.0, 1.0));',
              '',
              '  vec3 col = uBody;                                     // Eurowhite fuselage',
              '',
              '  // belly — brand-blue lower fuselage',
              '  col = mix(col, uBlue, fuse * smoothstep(-1.2, -2.1, P.y));',
              '',
              '  // cheatline — brand-blue band that sweeps up toward the nose',
              '  float cy = 0.95 + smoothstep(18.0, 34.0, P.z) * 1.1;',
              '  col = mix(col, uBlue, fuse * (1.0 - smoothstep(0.30, 0.55, abs(P.y - cy))));',
              '  // thin cyan pinstripe just under the cheatline',
              '  col = mix(col, uCyan, fuse * (1.0 - smoothstep(0.06, 0.13, abs(P.y - (cy - 0.62)))));',
              '',
              '  // tail fin — aurora gradient up the vertical stabiliser',
              '  float fin = smoothstep(4.7, 5.5, P.y);',
              '  float ft  = clamp((P.y - 4.8) / 7.6, 0.0, 1.0);',
              '  vec3 finCol = mix(uIndigo, uBlue,   smoothstep(0.00, 0.45, ft));',
              '  finCol      = mix(finCol,  uCyan,   smoothstep(0.40, 0.72, ft));',
              '  finCol      = mix(finCol,  uViolet, smoothstep(0.72, 1.00, ft));',
              '  col = mix(col, finCol, fin);',
              '',
              '  diffuseColor.rgb = mix(diffuseColor.rgb, col * detail, uStrength);',
              '}',
            ].join('\n'),
          );
      };
      mat.needsUpdate = true; // force a recompile so onBeforeCompile runs
    });
  });
}

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

  // Paint the blue striped livery over the GLB's grey detail texture.
  applyBlueLivery(model);

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
