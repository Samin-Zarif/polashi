// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — War room in 3D (three.js)
//
// One canvas, drawn every frame:
//   • Zarif's painted picture of the empty room fills the screen; past its edges the room
//     carries on as a soft, darkening reflection, so there is never a black border; the four
//     painted wall torches flicker
//   • the stone statues sit in their chairs round the painted table, lit by the room's
//     twelve wall lamps (the painted table hides the legs of the statues behind it), with
//     soft shadows on the painted floor and table top
//   • a statue lights up from within in its colour (red / yellow for what you know about
//     them, warm white when the leader picks them, green when on the team), a ring glows on
//     the table in front of picked / team statues, and the statue under the mouse gets a
//     clear pale-blue outline
// The camera is the one the picture was painted from (data/warRoom.js), so everything lines up.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { WAR_ROOM as ROOM, TABLE_OUTLINE, seatFrames } from '../data/warRoom';

// ── The statue files ──────────────────────────────────────────────────────────
// Every file is in the chair's own frame: chair centre on the floor at 0, facing +z.
const MODEL_FILES = {
  chair: '/assets/models/war-room/chair.glb',
  A: '/assets/models/war-room/man-beard.glb',     // beard and pagri
  B: '/assets/models/war-room/man-clean.glb',     // clean-shaven, bare head
  W: '/assets/models/war-room/woman.glb',         // the woman (players choose their statue in the lobby)
};
export const HEAD_TOP = 1.52;     // height of the tallest statue's head (m), for name plates

const models = new Map();
let loader = null;
function toFloat(attr) {
  const n = attr.count, size = attr.itemSize, out = new Float32Array(n * size);
  for (let i = 0; i < n; i++) {
    out[i * size] = attr.getX(i);
    if (size > 1) out[i * size + 1] = attr.getY(i);
    if (size > 2) out[i * size + 2] = attr.getZ(i);
  }
  return new THREE.BufferAttribute(out, size);
}
function bake(mesh) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', toFloat(mesh.geometry.attributes.position));
  if (mesh.geometry.attributes.normal) g.setAttribute('normal', toFloat(mesh.geometry.attributes.normal));
  if (mesh.geometry.index) g.setIndex(mesh.geometry.index);
  g.applyMatrix4(mesh.matrixWorld);
  if (!g.attributes.normal) g.computeVertexNormals();
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}
// Loads one statue file (once; later calls share it): { geo, pick } geometries.
export function loadModel(key) {
  if (!models.has(key)) {
    if (!loader) { loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); }
    const p = loader.loadAsync(MODEL_FILES[key]).then(gltf => {
      gltf.scene.updateMatrixWorld(true);
      // two meshes per file: the statue, and a much simpler copy used for mouse picking
      const meshes = [];
      gltf.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
      if (!meshes.length) throw new Error('No statue in ' + MODEL_FILES[key]);
      const tris = o => (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      meshes.sort((a, b) => tris(b) - tris(a));
      const main = meshes[0], pick = meshes[meshes.length - 1];
      return { geo: bake(main), pick: bake(pick) };
    });
    p.catch(() => models.delete(key));
    models.set(key, p);
  }
  return models.get(key);
}
// Starts downloading the statues used during play.
export function preloadModels() {
  ['chair', 'A', 'B', 'W'].forEach(k => loadModel(k).catch(() => {}));
}

// ── Looks ─────────────────────────────────────────────────────────────────────
const STONE = new THREE.Color().setRGB(0.50, 0.48, 0.45, THREE.SRGBColorSpace);
const CHAIR_STONE = new THREE.Color().setRGB(0.43, 0.41, 0.38, THREE.SRGBColorSpace);
const HOVER = new THREE.Color().setRGB(0.70, 0.86, 1.0, THREE.SRGBColorSpace);   // pale blue: the statue under the mouse
const TABLE_R = 1.34;           // the painted table's radius (m)
const SLAB_BOTTOM = 0.69;       // underside of the table top (m)
const BASE_R = 1.1;             // the table's legs stand within this radius (m)

// The colours a statue lights up in (red: known EIC traitor, deep crimson; yellow: suspect,
// luminous gold; picked by the leader: warm white, like a lamp held to the stone; green: on
// the team). Each multiplies the statue's own light and shade, keeping a little of the grey
// stone (`keep`) so faces and folds stay readable; `inner` is how strongly it glows from within.
function tint(r, g, b, gain, keep) {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return new THREE.Vector3(r, g, b).multiplyScalar(gain / lum).lerp(new THREE.Vector3(1, 1, 1), keep);
}
const TINTS = [tint(0.75, 0.03, 0.018, 0.6, 0.18), tint(1.0, 0.64, 0.10, 2.9, 0.12), tint(1.0, 0.93, 0.80, 2.5, 0), tint(0.12, 0.62, 0.22, 1.8, 0.15)];
const INNER = new THREE.Vector4(0.11, 0.06, 0.03, 0.05);

// ── Lamps: twelve round the hall (the room is about 13 m across) ──────────────
// [x, y, z, painted torch it belongs to (flickers with it), or -1]
const LAMPS = [
  [-3.10, 2.25, -4.70, 0], [2.95, 2.25, -4.70, 1],       // far wall, either side of the corridor
  [-4.90, 1.85, -4.45, 2], [4.75, 1.85, -4.45, 3],       // far corners
  [-6.00, 2.25, 1.90, 4], [6.00, 2.15, 1.95, 5],         // side walls, in the niches
  [0.0, 2.10, -6.50, -1],                                // down the corridor
  [-6.20, 2.20, -1.60, -1], [6.20, 2.20, -1.60, -1],     // side walls, middle
  [-3.20, 2.20, 4.60, -1], [0.0, 2.20, 5.00, -1], [3.20, 2.20, 4.60, -1],   // near wall (behind us)
];

// A living flame: smooth random wobble at a few speeds (no jumps), about -1 .. 1.
function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
function noise1(x, seed) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = hash1(i + seed * 57.0), b = hash1(i + 1 + seed * 57.0);
  return a + (b - a) * u;
}
function flicker(t, seed) {
  return 0.55 * noise1(t * 6.1, seed) + 0.30 * noise1(t * 13.7, seed + 3.1) + 0.15 * noise1(t * 29.3, seed + 7.7);
}
const PXS = ROOM.width / 2700;   // picture pixels per pixel of the scale these effects were tuned at

// ── The painted room (full-screen) ────────────────────────────────────────────
const ROOM_VERT = `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const ROOM_FRAG = `
#define PXS ${PXS.toFixed(4)}
uniform sampler2D uMap;
uniform vec2  uRes;          // drawing size, device px
uniform vec4  uView;         // picture placement: left, top (CSS px), scale (CSS px per picture px), pixel ratio
uniform vec2  uImg;          // picture size, picture px
uniform float uLod;
uniform float uMag;          // screen pixels per picture pixel
uniform vec3  uTorch[${ROOM.torches.length}];   // x, y (picture px), size
uniform float uFlick[${ROOM.torches.length}];
uniform float uTime;
void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uView.w;
  vec2 pic = (css - uView.xy) / uView.z;
  vec2 q = pic / uImg;
  // signed distance to the picture's edge: negative inside, positive beyond it (picture px)
  vec2 o = max(-pic, pic - uImg);
  float sd = length(max(o, 0.0)) + min(max(o.x, o.y), 0.0);
  // beyond the picture the room carries on: a soft reflection of its edge, then a
  // blurred wash of the edge's colours that fades into shadow
  vec2 mq = 1.0 - abs(1.0 - mod(q, 2.0));
  float lod = max(uLod, clamp((sd + ${(14 * 1.26).toFixed(1)} * PXS) / (${(24 * 1.26).toFixed(1)} * PXS), 0.0, 6.5));
  vec3 col = textureLod(uMap, mq, lod).rgb;
  // when the picture is shown larger than its own pixels, sharpen it a little so it keeps up
  // with the crisp statues
  float sharp = 0.55 * smoothstep(1.05, 1.9, uMag) * step(sd, 0.0);
  if (sharp > 0.001) {
    vec2 tx = 1.0 / uImg;
    vec3 nb = textureLod(uMap, mq + vec2(tx.x, 0.0), 0.0).rgb + textureLod(uMap, mq - vec2(tx.x, 0.0), 0.0).rgb
            + textureLod(uMap, mq + vec2(0.0, tx.y), 0.0).rgb + textureLod(uMap, mq - vec2(0.0, tx.y), 0.0).rgb;
    col = clamp(col + sharp * (col - nb * 0.25), 0.0, 1.0);
  }
  float ext = max(sd, 0.0);
  if (ext > 0.0) {
    vec3 wash = textureLod(uMap, clamp(q, vec2(0.015), vec2(0.985)), 6.5).rgb;
    col = mix(col, wash, smoothstep(2.5 * PXS, 45.0 * PXS, ext));
    col *= exp(-ext / (330.0 * PXS));
  }
  // wall torches: the pool of light on the wall breathes with the flame, the flame itself
  // glows and licks upwards
  for (int i = 0; i < ${ROOM.torches.length}; i++) {
    float k = uTorch[i].z * PXS;
    vec2 d = (pic - uTorch[i].xy) / k;
    float r2 = dot(d * vec2(1.0, 0.8), d * vec2(1.0, 0.8));
    float fl = uFlick[i];
    col *= 1.0 + (0.10 + 0.16 * fl) * exp(-r2 / 16000.0);
    float lick = 0.75 + 0.5 * sin(d.y * 0.45 + uTime * 9.0 + float(i) * 1.7) * sin(d.x * 0.6 - uTime * 5.0);
    vec2 fd = vec2(d.x, (d.y + 4.0) * 0.55);
    col += vec3(1.0, 0.62, 0.28) * (0.20 + 0.16 * fl) * lick * exp(-dot(fd, fd) / 70.0);
    col += vec3(1.0, 0.55, 0.22) * (0.06 + 0.05 * fl) * exp(-r2 / 2600.0);
  }
  // gentle darkening towards the corners of the screen
  vec2 v = (css * uView.w / uRes - 0.5) * vec2(1.0, 0.92);
  col *= 1.0 - 0.42 * smoothstep(0.42, 0.9, length(v));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// ── The wall lamps, worked out at the corners of the statues (not at every pixel) ──
// Twelve lights per pixel made the statues the slowest part of the room. The lamps are far
// away and the stone is matt, so lighting each corner of the statue (thousands of them) and
// blending across looks the same, at a fraction of the cost, and the shaders compile faster.
// uLampCol is each lamp's colour times its brightness right now (with the flicker).
const lampUniforms = {
  uLampPos: { value: LAMPS.map(([x, y, z]) => new THREE.Vector3(x, y, z)) },
  uLampCol: { value: LAMPS.map(() => new THREE.Vector3()) },
};
function addLamps(shader) {
  shader.uniforms.uLampPos = lampUniforms.uLampPos;
  shader.uniforms.uLampCol = lampUniforms.uLampCol;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform vec3 uLampPos[${LAMPS.length}];
uniform vec3 uLampCol[${LAMPS.length}];
varying vec3 vLamp;`)
    .replace('#include <project_vertex>', `#include <project_vertex>
{
  vec3 wp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vec3 wn = normalize(mat3(modelMatrix) * objectNormal);
  vLamp = vec3(0.0);
  for (int i = 0; i < ${LAMPS.length}; i++) {
    vec3 L = uLampPos[i] - wp;
    float d2 = max(dot(L, L), 0.01);
    vLamp += uLampCol[i] * (max(dot(wn, L), 0.0) * inversesqrt(d2) / d2);
  }
}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vLamp;')
    .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
  reflectedLight.directDiffuse += vLamp * BRDF_Lambert( material.diffuseColor );`);
}

// ── Statue stone: lit by the room, coloured from within ──────────────────────
function statueMaterial(color) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.0 });
  const u = {
    uTone: { value: new THREE.Vector4() },     // how red, yellow, picked, green (0..1)
    uHover: { value: 0 },
    uGlow: { value: 1 },
    uHoverColor: { value: HOVER },
    uTints: { value: TINTS },
    uInner: { value: INNER },
  };
  m.userData.u = u;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    addLamps(shader);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoomPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRoomPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vRoomPos;
uniform vec4 uTone;
uniform float uHover;
uniform float uGlow;
uniform vec3 uHoverColor;
uniform vec3 uTints[4];
uniform vec4 uInner;`)
      .replace('#include <opaque_fragment>', `{
  // under the table top it is dark
  float under = (1.0 - smoothstep(${(SLAB_BOTTOM - 0.05).toFixed(3)}, ${(SLAB_BOTTOM + 0.04).toFixed(3)}, vRoomPos.y))
              * (1.0 - smoothstep(${(TABLE_R - 0.04).toFixed(3)}, ${(TABLE_R + 0.14).toFixed(3)}, length(vRoomPos.xz)));
  outgoingLight *= 1.0 - 0.72 * under;
  float nv = saturate(dot(normal, geometryViewDir));
  float tw = uTone.x + uTone.y + uTone.z + uTone.w;
  if (tw > 0.001) {
    // the stone takes on the colour, keeping its light and shade...
    float L = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
    L = 0.16 * pow(max(L, 0.0) / 0.16, 1.25);      // a little more contrast, so the shape reads
    vec3 tint = (uTone.x * uTints[0] + uTone.y * uTints[1] + uTone.z * uTints[2] + uTone.w * uTints[3]) / tw;
    float inner = dot(uTone, uInner) / tw;
    // ...and is lit from within: a soft glow all over, strongest at the thin edges
    float glow = inner * (0.22 + 0.78 * pow(1.0 - nv, 2.2)) * uGlow * (1.0 - 0.5 * under);
    outgoingLight = mix(outgoingLight, tint * (L + glow), min(tw, 1.0));
  }
  // under the mouse: a cool pale light on the stone, brightest at its edges
  outgoingLight += uHoverColor * uHover * (0.03 + 0.42 * pow(1.0 - nv, 2.4));
}
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'polashi-statue';
  return m;
}

// ── Table rings ───────────────────────────────────────────────────────────────
const RING_R = 0.13, RING_W = 0.019;
const RING_VERT = `
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = `
varying vec2 vP;
uniform vec2 uAmt;     // gold (picked), green (team)
uniform float uPulse;
void main() {
  float amt = uAmt.x + uAmt.y;
  if (amt < 0.002) discard;
  float d = length(vP);
  float aa = max(fwidth(d), 1e-4);
  float band = 1.0 - smoothstep(${RING_W} - aa, ${RING_W} + aa, abs(d - ${RING_R}));
  float soft = exp(-pow((d - ${RING_R}) / 0.075, 2.0));
  vec3 rc = (uAmt.x * vec3(0.98, 0.78, 0.33) + uAmt.y * vec3(0.26, 0.90, 0.52)) / amt;
  float a = min(amt, 1.0) * uPulse;
  // premultiplied: the band paints over the table, the soft glow adds light
  gl_FragColor = vec4(rc * (band * a * 0.92 + soft * a * 0.28), band * a * 0.92);
}`;

// ── Hover outline: drawn from a mask of the statue under the mouse ───────────
const FULL_VERT = `
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const OUTLINE_FRAG = `
varying vec2 vUv;
uniform sampler2D uMask;     // r: the visible part of the statue under the mouse
uniform vec2 uTexel;
uniform float uPx;           // device px per CSS px
uniform float uAmt;
uniform vec3 uColor;
void main() {
  if (uAmt < 0.002) discard;
  float here = texture2D(uMask, vUv).r;
  if (here > 0.99) discard;
  float edge = 0.0, glow = 0.0;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 0.39269908;
    vec2 dir = vec2(cos(a), sin(a)) * uTexel * uPx;
    edge = max(edge, max(texture2D(uMask, vUv + dir * 1.5).r, texture2D(uMask, vUv + dir * 2.8).r));
    glow += texture2D(uMask, vUv + dir * 4.5).r * 0.4 + texture2D(uMask, vUv + dir * 8.0).r * 0.6;
  }
  glow /= 16.0;
  // a crisp line just outside the statue, and a soft light round it
  float a = clamp(edge * 0.95 + glow * 0.5, 0.0, 1.0) * (1.0 - here) * uAmt;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * a, a);
}`;

// ── Contact shadows: soft darkness under the chairs and under the hands on the table ──
// Seen from just below the floor (or the table top) looking up, every statue surface close
// to it is drawn dark (the closer, the darker), then blurred, then laid on the painted
// surface. Drawn once whenever the statues change.
const NEAR_VERT = `
uniform float uBase;
uniform float uRange;
uniform float uSkew;
varying float vH;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vH = (wp.y - uBase) / uRange;
  wp.z += max(wp.y - uBase, 0.0) * uSkew;     // the soft light comes from behind, so shadows lean towards the camera
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const NEAR_FRAG = `
varying float vH;
uniform float uGain;
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, clamp((1.0 - vH) * uGain, 0.0, 1.0));
}`;
const BLUR_FRAG = `
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;
void main() {
  float a = texture2D(uTex, vUv).a * 0.2270;
  a += (texture2D(uTex, vUv + uStep * 1.3846).a + texture2D(uTex, vUv - uStep * 1.3846).a) * 0.3162;
  a += (texture2D(uTex, vUv + uStep * 3.2308).a + texture2D(uTex, vUv - uStep * 3.2308).a) * 0.0703;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}`;
// the painted surface that receives a contact shadow: darkened by the shadow picture under it
function receiverMaterial(c, opacity) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTex: { value: c.rt.texture }, uSpan: { value: c.span }, uOpacity: { value: opacity } },
    vertexShader: `
varying vec2 vXZ;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vXZ = wp.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: `
varying vec2 vXZ;
uniform sampler2D uTex;
uniform float uSpan;
uniform float uOpacity;
void main() {
  // the shadow picture was taken looking up: across is +x, up is +z
  vec2 uv = vXZ / (2.0 * uSpan) + 0.5;
  float a = texture2D(uTex, uv).a * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}`,
  });
}

function contactShadow(span, base, range, size, gain, skew) {
  const opts = { depthBuffer: true };
  const rt = new THREE.WebGLRenderTarget(size, size, opts);
  const rt2 = new THREE.WebGLRenderTarget(size, size, { depthBuffer: false });
  const cam = new THREE.OrthographicCamera(-span, span, span, -span, 0, range);
  cam.position.set(0, base, 0);
  cam.rotation.x = Math.PI / 2;           // looking up
  cam.updateMatrixWorld(true);
  const near = new THREE.ShaderMaterial({
    vertexShader: NEAR_VERT, fragmentShader: NEAR_FRAG, side: THREE.DoubleSide,
    uniforms: { uBase: { value: base }, uRange: { value: range }, uGain: { value: gain }, uSkew: { value: skew } },
  });
  return { rt, rt2, cam, near, span, base };
}

function tableGeometry() {
  // the table top as a slab (top, underside and rim) plus the legs as one solid drum
  const top = ROOM.tableY, bot = SLAB_BOTTOM, n = TABLE_OUTLINE.length;
  const pos = [], idx = [];
  pos.push(0, top, 0, 0, bot, 0);
  TABLE_OUTLINE.forEach(([x, z]) => { pos.push(x, top, z, x, bot, z); });
  for (let i = 0; i < n; i++) {
    const a = 2 + i * 2, b = 2 + ((i + 1) % n) * 2;
    idx.push(0, b, a, 1, a + 1, b + 1, a, b, a + 1, b, b + 1, a + 1);
  }
  const slab = new THREE.BufferGeometry();
  slab.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  slab.setIndex(idx);
  const base = new THREE.CylinderGeometry(BASE_R, BASE_R, bot, 48, 1, false);
  base.translate(0, bot / 2, 0);
  return [slab, base];
}

function tableShape() {
  const s = new THREE.Shape();
  TABLE_OUTLINE.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  return s;
}

function convexHull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// distance from point to a convex polygon (0 inside)
function hullDistance(h, x, y) {
  if (h.length < 3) return Infinity;
  let inside = true, best = Infinity;
  for (let i = 0; i < h.length; i++) {
    const [ax, ay] = h[i], [bx, by] = h[(i + 1) % h.length];
    const ex = bx - ax, ey = by - ay;
    if (ex * (y - ay) - ey * (x - ax) < 0) inside = false;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * ex, y - ay - t * ey));
  }
  return inside ? 0 : best;
}

const LAYER_OCCLUDER = 30;
const LAYER_CASTER = 29;
const seatLayer = k => 1 + k;

// ── The room ──────────────────────────────────────────────────────────────────
// canvas: a fresh <canvas>; picture: the loaded room picture (<img>); still: no motion.
// Throws if the browser can't draw it. Statue files must be loaded first (loadModel).
export function createWarRoom3D(canvas, picture, { still = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = true;
  renderer.setClearColor(0x050505, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(...ROOM.cameraPos);
  camera.rotation.set(-(ROOM.pitchDeg * Math.PI) / 180, 0, 0);
  camera.updateMatrixWorld(true);

  // the painted room
  const tex = new THREE.Texture(picture);
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = false;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  const pictureScale = (picture.naturalWidth || ROOM.width * 2) / ROOM.width;
  const fullTri = new THREE.BufferGeometry();
  fullTri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const roomMat = new THREE.ShaderMaterial({
    vertexShader: ROOM_VERT, fragmentShader: ROOM_FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      uMap: { value: tex }, uRes: { value: new THREE.Vector2(1, 1) }, uView: { value: new THREE.Vector4(0, 0, 1, 1) },
      uImg: { value: new THREE.Vector2(ROOM.width, ROOM.height) }, uLod: { value: 0 }, uMag: { value: 1 },
      uTorch: { value: ROOM.torches.map(t => new THREE.Vector3(t.x, t.y, t.size || 1)) }, uFlick: { value: ROOM.torches.map(() => 0) },
      uTime: { value: 0 },
    },
  });
  const roomQuad = new THREE.Mesh(fullTri, roomMat);
  roomQuad.frustumCulled = false;
  roomQuad.renderOrder = -1000;
  scene.add(roomQuad);

  // the painted table, as an invisible shape that hides what is behind or under it
  const hideMat = new THREE.MeshBasicMaterial({ colorWrite: false });
  tableGeometry().forEach(g => {
    const m = new THREE.Mesh(g, hideMat);
    m.renderOrder = -500;
    m.layers.enable(LAYER_OCCLUDER);
    scene.add(m);
  });

  // soft shadows on the painted floor and table top
  const floorContact = contactShadow(3.0, 0.0, 1.2, 512, 1.8, 0.5);
  const tableContact = contactShadow(1.42, ROOM.tableY, 0.16, 512, 1.3, 0.3);
  floorContact.blur = [1, 2, 4, 6]; tableContact.blur = [1, 2, 3];
  const blurMat = new THREE.ShaderMaterial({
    vertexShader: FULL_VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false,
    uniforms: { uTex: { value: null }, uStep: { value: new THREE.Vector2() } },
  });
  const blurScene = new THREE.Scene();
  const blurQuad = new THREE.Mesh(fullTri, blurMat);
  blurQuad.frustumCulled = false;
  blurScene.add(blurQuad);
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 6.0), receiverMaterial(floorContact, 0.85));
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.position.y = 0.002;
  scene.add(floorShadow);
  const tableShadow = new THREE.Mesh(new THREE.ShapeGeometry(tableShape(), 1), receiverMaterial(tableContact, 0.45));
  tableShadow.rotation.x = -Math.PI / 2;
  tableShadow.position.y = ROOM.tableY + 0.002;
  scene.add(tableShadow);

  // light: the room's overall glow, a soft light from above, the wall lamps
  const hemi = new THREE.HemisphereLight(new THREE.Color().setRGB(0.86, 0.84, 0.80, THREE.SRGBColorSpace),
    new THREE.Color().setRGB(0.22, 0.19, 0.16, THREE.SRGBColorSpace), 0.95);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(new THREE.Color().setRGB(1.0, 0.97, 0.92, THREE.SRGBColorSpace), 1.7);
  key.position.set(0.7, 10, 2.6);
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  const lampColor = new THREE.Color().setRGB(1.0, 0.74, 0.48, THREE.SRGBColorSpace);
  const LAMP_BASE = 5.0;

  const chairMat = new THREE.MeshStandardMaterial({ color: CHAIR_STONE, roughness: 0.86, metalness: 0 });
  chairMat.onBeforeCompile = addLamps;
  chairMat.customProgramCacheKey = () => 'polashi-chair';
  const pickMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });   // never drawn: for mouse picking

  // hover outline
  const maskRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true, samples: 0 });
  const occluderMat = new THREE.MeshBasicMaterial({ colorWrite: false });
  const maskVisibleMat = new THREE.MeshBasicMaterial({ color: 0xff0000, depthWrite: false });
  const outlineMat = new THREE.ShaderMaterial({
    vertexShader: FULL_VERT, fragmentShader: OUTLINE_FRAG, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uMask: { value: maskRT.texture }, uTexel: { value: new THREE.Vector2(1, 1) }, uPx: { value: 1 },
      uAmt: { value: 0 }, uColor: { value: new THREE.Vector3(0.80, 0.92, 1.0) },
    },
  });
  const outline = new THREE.Mesh(fullTri, outlineMat);
  outline.frustumCulled = false;
  outline.renderOrder = 1000;
  scene.add(outline);

  // ── seats ──
  let statues = [];            // { group, chair, fig, pick, ring, look, mat, frame }
  let models = null;           // { chair, A, B, W } loaded geometries
  let shadowsDirty = true, maskDirty = true, hullsDirty = true;
  const view = { s: 1, left: 0, top: 0, W: 1, H: 1 };
  let dpr = 1;
  const anim = [];             // per seat: eased tone[4], hover, rings[2]
  let target = [];

  function ringMesh(k) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.ShaderMaterial({
      vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: { uAmt: { value: new THREE.Vector2() }, uPulse: { value: 1 } },
    }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 10;
    m.userData.phase = k * 1.7;
    return m;
  }

  function disposeStatues() {
    statues.forEach(s => {
      scene.remove(s.group); scene.remove(s.ring);
      s.mat.dispose(); s.ring.geometry.dispose(); s.ring.material.dispose();
    });
    statues = [];
  }

  // looks: one per seat, 'A' | 'B' | 'W'
  function setSeats(looks, loaded) {
    models = loaded;
    const n = looks.length;
    if (statues.length !== n) {
      disposeStatues();
      const frames = seatFrames(n);
      frames.forEach((f, k) => {
        const group = new THREE.Group();
        group.position.set(f.x, 0, f.z);
        group.rotation.y = f.yaw;
        const mat = statueMaterial(STONE);
        const chair = new THREE.Mesh(models.chair.geo, chairMat);
        const fig = new THREE.Mesh(models.A.geo, mat);
        [chair, fig].forEach(m => {
          m.layers.enable(seatLayer(k)); m.layers.enable(LAYER_OCCLUDER); m.layers.enable(LAYER_CASTER);
          group.add(m);
        });
        const pickChair = new THREE.Mesh(models.chair.pick, pickMat); pickChair.visible = false;
        const pickFig = new THREE.Mesh(models.A.pick, pickMat); pickFig.visible = false;
        group.add(pickChair, pickFig);
        scene.add(group);
        const ring = ringMesh(k);
        const rr = f.edge - 0.45;
        ring.position.set(rr * Math.cos(f.phi), ROOM.tableY + 0.004, rr * Math.sin(f.phi));
        scene.add(ring);
        statues.push({ group, chair, fig, pickChair, pickFig, ring, mat, look: 'A', frame: f, hull: [] });
        anim[k] = { tone: [0, 0, 0, 0], hover: 0, rings: [0, 0] };
      });
      shadowsDirty = maskDirty = hullsDirty = true;
    }
    looks.forEach((look, k) => {
      const s = statues[k];
      const shown = models[look] ? look : 'A';      // a man until that statue's file is loaded
      if (s.look !== shown) {
        s.fig.geometry = models[shown].geo; s.pickFig.geometry = models[shown].pick; s.look = shown;
        shadowsDirty = maskDirty = hullsDirty = true;
      }
    });
    scene.updateMatrixWorld(true);
  }

  // targets per seat: { tone: [red, yellow, picked, green], hover: 0/1, rings: [gold, green] }
  function setTargets(t) { target = t; }

  let hoverSeat = -1;
  function setHover(k) { if (k !== hoverSeat) { hoverSeat = k; maskDirty = true; } }

  function setView(v) {
    if (v.s !== view.s || v.left !== view.left || v.top !== view.top || v.W !== view.W || v.H !== view.H) {
      Object.assign(view, v);
      maskDirty = hullsDirty = true;
    }
  }

  // the camera of the picture, fitted to where the layout puts the picture on screen
  function updateCamera() {
    const fs = ROOM.focal * view.s;
    const px = view.left + ROOM.centerX * view.s, py = view.top + ROOM.centerY * view.s;
    const W = view.W, H = view.H, near = 0.5, far = 60;
    camera.projectionMatrix.set(
      (2 * fs) / W, 0, 1 - (2 * px) / W, 0,
      0, (2 * fs) / H, (2 * py) / H - 1, 0,
      0, 0, -(far + near) / (far - near), (-2 * far * near) / (far - near),
      0, 0, -1, 0,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(4.5e6 / Math.max(1, view.W * view.H)));
    const w = Math.max(1, Math.round(view.W * ratio)), h = Math.max(1, Math.round(view.H * ratio));
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) {
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      maskRT.setSize(w, h);
      maskDirty = true;
    }
    dpr = w / view.W;
  }

  // screen outline of every statue, for clicks that land just beside one
  const tmp = new THREE.Vector3();
  function toScreen(v) {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * view.W, (0.5 - tmp.y * 0.5) * view.H];
  }
  function updateHulls() {
    statues.forEach(s => {
      const pts = [];
      [s.pickChair, s.pickFig].forEach(m => {
        const p = m.geometry.attributes.position;
        const step = Math.max(1, Math.floor(p.count / 400));
        for (let i = 0; i < p.count; i += step) {
          tmp.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
          pts.push(toScreen(tmp));
        }
      });
      s.hull = convexHull(pts);
      s.depth = tmp.set(s.frame.x, 0.8, s.frame.z).applyMatrix4(camera.matrixWorldInverse).z;
    });
    hullsDirty = false;
  }

  // Which seat is at (x, y) CSS px in the canvas, or -1: the statue (or chair) actually under
  // the pointer, nearest the camera first; otherwise a statue whose outline is within a few px.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(x, y) {
    if (!statues.length) return -1;
    updateCamera();
    ndc.set((x / view.W) * 2 - 1, 1 - (y / view.H) * 2);
    raycaster.setFromCamera(ndc, camera);
    const meshes = statues.flatMap(s => [s.pickChair, s.pickFig]);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length) {
      const g = hits[0].object.parent;
      const k = statues.findIndex(s => s.group === g);
      if (k >= 0) return k;
    }
    if (hullsDirty) updateHulls();
    let best = -1, bestDepth = -Infinity;
    statues.forEach((s, k) => {
      if (hullDistance(s.hull, x, y) <= 6 && s.depth > bestDepth) { best = k; bestDepth = s.depth; }
    });
    return best;
  }

  function renderMask() {
    renderer.setRenderTarget(maskRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, false);
    renderer.autoClear = false;          // the passes below share one depth buffer
    if (hoverSeat >= 0 && hoverSeat < statues.length) {
      const saveBg = scene.background;
      scene.overrideMaterial = occluderMat;
      camera.layers.set(LAYER_OCCLUDER);
      renderer.render(scene, camera);
      scene.overrideMaterial = maskVisibleMat;
      camera.layers.set(seatLayer(hoverSeat));
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      scene.background = saveBg;
    }
    camera.layers.set(0);
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x050505, 1);
    maskDirty = false;
  }

  function renderContactShadows() {
    [floorContact, tableContact].forEach(c => {
      renderer.setRenderTarget(c.rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, false);
      scene.overrideMaterial = c.near;
      c.cam.layers.set(LAYER_CASTER);
      renderer.render(scene, c.cam);
      scene.overrideMaterial = null;
      // blur it a few times each way, wider each time, so the darkness is soft
      const texel = 1 / c.rt.width;
      for (const r of c.blur) {
        blurMat.uniforms.uTex.value = c.rt.texture; blurMat.uniforms.uStep.value.set(texel * r, 0);
        renderer.setRenderTarget(c.rt2); renderer.render(blurScene, camera);
        blurMat.uniforms.uTex.value = c.rt2.texture; blurMat.uniforms.uStep.value.set(0, texel * r);
        renderer.setRenderTarget(c.rt); renderer.render(blurScene, camera);
      }
    });
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x050505, 1);
    shadowsDirty = false;
  }

  const flickTorch = ROOM.torches.map(() => 0);
  let primed = false;
  let compiled = false, compiling = false;
  // Draws one frame. Returns true while something is still changing (a colour fading in,
  // the outline appearing), so the caller can draw less often when the room is at rest.
  function frame(t, dt) {
    if (!statues.length || view.W < 2) return false;
    let busy = false;
    resize();
    updateCamera();
    // the first time: let the graphics card prepare every shader without holding up the page,
    // including those the extra passes use (the soft shadows, the hover outline), so neither the
    // first frame nor the first hover stalls
    if (!compiled) {
      if (!compiling) {
        compiling = true;
        const done = () => { compiled = true; };
        const extra = new THREE.Scene();
        const g = statues[0].fig.geometry;
        [occluderMat, maskVisibleMat, floorContact.near, tableContact.near].forEach(m => extra.add(new THREE.Mesh(g, m)));
        extra.add(new THREE.Mesh(fullTri, blurMat));
        const jobs = renderer.compileAsync ? [renderer.compileAsync(scene, camera), renderer.compileAsync(extra, camera, scene)] : [];
        Promise.all(jobs).then(done, done);
      }
      return true;
    }

    // ease every statue towards how it should look
    const k = !primed || still ? 1 : 1 - Math.exp(-dt / 0.14);
    const pulse = still ? 1 : 1 + 0.10 * Math.sin(t * 1.7);
    statues.forEach((s, i) => {
      const a = anim[i], tg = target[i] || { tone: [0, 0, 0, 0], hover: 0, rings: [0, 0] };
      for (let j = 0; j < 4; j++) a.tone[j] += (tg.tone[j] - a.tone[j]) * k;
      a.hover += (tg.hover - a.hover) * (still ? 1 : 1 - Math.exp(-dt / 0.08));
      for (let j = 0; j < 2; j++) a.rings[j] += (tg.rings[j] - a.rings[j]) * k;
      for (let j = 0; j < 4; j++) if (Math.abs(tg.tone[j] - a.tone[j]) > 0.003) busy = true;
      if (Math.abs(tg.hover - a.hover) > 0.003 || Math.abs(tg.rings[0] - a.rings[0]) > 0.003 || Math.abs(tg.rings[1] - a.rings[1]) > 0.003) busy = true;
      s.mat.userData.u.uTone.value.set(...a.tone);
      s.mat.userData.u.uHover.value = a.hover;
      s.mat.userData.u.uGlow.value = pulse;
      const ru = s.ring.material.uniforms;
      ru.uAmt.value.set(a.rings[0], a.rings[1]);
      ru.uPulse.value = still ? 1 : 0.8 + 0.2 * Math.sin(t * 3.0 + s.ring.userData.phase);
    });
    primed = true;

    // torches and lamps
    for (let i = 0; i < flickTorch.length; i++) flickTorch[i] = flicker(t, i + 1);
    LAMPS.forEach(([, , , torch], i) => {
      const f = torch >= 0 ? flickTorch[torch] : 0.6 * flicker(t * 0.8, 20 + i);
      const k = LAMP_BASE * (1 + 0.35 * f);
      lampUniforms.uLampCol.value[i].set(lampColor.r * k, lampColor.g * k, lampColor.b * k);
    });

    const ru = roomMat.uniforms;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    ru.uRes.value.set(size.x, size.y);
    ru.uView.value.set(view.left, view.top, view.s, dpr);
    ru.uLod.value = Math.max(0, Math.log2(pictureScale / (view.s * dpr)));
    ru.uMag.value = (view.s * dpr) / pictureScale;
    ru.uFlick.value = flickTorch;
    ru.uTime.value = t % 1000;

    if (shadowsDirty) renderContactShadows();
    if (maskDirty) renderMask();
    const hv = hoverSeat >= 0 ? (anim[hoverSeat]?.hover || 0) : 0;
    outlineMat.uniforms.uAmt.value = hv;
    outlineMat.uniforms.uTexel.value.set(1 / size.x, 1 / size.y);
    outlineMat.uniforms.uPx.value = dpr;
    outline.visible = hv > 0.002;
    renderer.render(scene, camera);
    return busy;
  }

  // where a seat's name plate goes: just above the head, in CSS px
  function anchor(k, height = HEAD_TOP + 0.1) {
    const s = statues[k];
    if (!s) return null;
    updateCamera();
    tmp.set(0, height, 0).applyMatrix4(s.group.matrixWorld);
    return toScreen(tmp);
  }

  function dispose() {
    disposeStatues();
    scene.traverse(o => { if (o.geometry && o.geometry !== fullTri) o.geometry.dispose(); });
    fullTri.dispose();
    [roomMat, hideMat, chairMat, pickMat, occluderMat, maskVisibleMat, outlineMat, floorShadow.material, tableShadow.material, blurMat,
      floorContact.near, tableContact.near].forEach(m => m.dispose());
    [floorContact, tableContact].forEach(c => { c.rt.dispose(); c.rt2.dispose(); });
    tex.dispose(); maskRT.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  const ready = () => statues.length > 0 && view.W > 1;
  const drawn = () => compiled;
  return { setSeats, setTargets, setHover, setView, pick, frame, anchor, ready, drawn, dispose,
    // for the timing test page only
    _debug: { scene, renderer, roomQuad, hemi, key, statues: () => statues, floorShadow, tableShadow, outline } };
}
