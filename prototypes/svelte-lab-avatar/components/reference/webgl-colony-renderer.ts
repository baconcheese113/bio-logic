/**
 * WebGL2 PBR colony renderer for blood agar plates.
 *
 * Material model:
 *  - Agar: translucent dielectric gel with wrap lighting + clearcoat wet film
 *  - Colony: opaque dielectric with micro-bump texture + optional clearcoat
 *  - Both use roughness-based normalized Blinn-Phong, Schlick fresnel,
 *    energy conservation, and two-layer compositing
 */

import {
  REFERENCE_PATHS,
  type ReferenceStreakData,
} from './reference-streak-paths';

export { REFERENCE_PATHS };

const SIZE = 600;
const HALF = SIZE / 2;
const PLATE_R = SIZE * 0.46;

// ── Public types ──

export interface ColonyParams {
  lightX: number;
  lightY: number;
  lightZ: number;

  agarR: number;
  agarG: number;
  agarB: number;
  agarRoughness: number;
  agarSpecular: number;
  agarClearcoat: number;
  agarClearcoatRough: number;
  agarTranslucency: number;
  hemoIntensity: number;

  colonyR: number;
  colonyG: number;
  colonyB: number;
  colonyRoughness: number;
  colonySpecular: number;
  colonyClearcoat: number;
  colonyClearcoatRough: number;
  colonyMicroBump: number;
  colonyOpacity: number;
  edgeGlow: number;

  bumpStrength: number;
  heightScale: number;

  ambient: number;
  underlight: number;
  aoStrength: number;
  vignetteStrength: number;
  exposure: number;
  grainAmount: number;
}

export function defaultParams(): ColonyParams {
  return {
    lightX: -0.1,
    lightY: 0.15,
    lightZ: 1.0,

    agarR: 0.92,
    agarG: 0.005,
    agarB: 0.003,
    agarRoughness: 0.3,
    agarSpecular: 0.06,
    agarClearcoat: 0.15,
    agarClearcoatRough: 0.02,
    agarTranslucency: 0.9,
    hemoIntensity: 0.06,

    colonyR: 0.75,
    colonyG: 0.15,
    colonyB: 0.04,
    colonyRoughness: 0.55,
    colonySpecular: 0.08,
    colonyClearcoat: 0.1,
    colonyClearcoatRough: 0.04,
    colonyMicroBump: 0.06,
    colonyOpacity: 0.85,
    edgeGlow: 0.15,

    bumpStrength: 3.0,
    heightScale: 0.24,

    ambient: 0.3,
    underlight: 0.15,
    aoStrength: 0.15,
    vignetteStrength: 0.15,
    exposure: 1.3,
    grainAmount: 0.015,
  };
}

// ── Procedural heightmap (colony-based deposition) ──

function insidePlate(x: number, y: number): boolean {
  const dx = x - HALF, dy = y - HALF;
  return dx * dx + dy * dy < PLATE_R * PLATE_R;
}

type Pt = [number, number];

/**
 * Catmull-Rom spline interpolation between control points.
 * Produces smooth curves through all control points — no sharp corners.
 */
function smoothPath(controls: Pt[]): Pt[] {
  if (controls.length < 2) return controls;
  const pts: Pt[] = [];
  for (let i = 0; i < controls.length - 1; i++) {
    const p0 = controls[Math.max(0, i - 1)];
    const p1 = controls[i];
    const p2 = controls[i + 1];
    const p3 = controls[Math.min(controls.length - 1, i + 2)];
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(4, Math.round(segLen / 2));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t, t3 = t2 * t;
      pts.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  pts.push(controls[controls.length - 1]);
  return pts;
}

/** Mulberry32 — fast seeded 32-bit PRNG. */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function genHeightMap(
  rng: () => number,
  refPaths?: ReferenceStreakData,
): Float32Array {
  const d = new Float32Array(SIZE * SIZE);

  function noise(x: number, y: number, s: number): number {
    return (
      (Math.sin(x * s + y * 0.7) +
        Math.sin(y * s * 1.3 + x * 0.5) +
        Math.sin((x + y) * s * 0.6)) /
        6 +
      0.5
    );
  }

  function stamp(cx: number, cy: number, radius: number, peak: number): void {
    const rc = Math.ceil(radius * 2.5);
    for (let dy = -rc; dy <= rc; dy++) {
      for (let dx = -rc; dx <= rc; dx++) {
        const px = Math.round(cx + dx);
        const py = Math.round(cy + dy);
        if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
        if (!insidePlate(px, py)) continue;
        const dist2 = dx * dx + dy * dy;
        const g = peak * Math.exp(-dist2 / (2 * radius * radius));
        if (g > 0.003) d[py * SIZE + px] = Math.max(d[py * SIZE + px], g);
      }
    }
  }

  interface StreakOpts {
    startDensity: number;
    endDensity: number;
    startWidth: number;
    endWidth: number;
    colonyR: [number, number];
    colonyH: [number, number];
  }

  function depositStreak(controls: Pt[], opts: StreakOpts): void {
    const path = smoothPath(controls);
    if (path.length < 2) return;

    const logRatio = Math.log(
      Math.max(0.0001, opts.endDensity) / opts.startDensity,
    );

    for (let i = 0; i < path.length; i++) {
      const t = i / (path.length - 1);
      const density = opts.startDensity * Math.exp(logRatio * t);
      const width = opts.startWidth + (opts.endWidth - opts.startWidth) * t;
      const [px, py] = path[i];

      const next = path[Math.min(i + 1, path.length - 1)];
      const prev = path[Math.max(0, i - 1)];
      const tx = next[0] - prev[0],
        ty = next[1] - prev[1];
      const tl = Math.hypot(tx, ty) || 1;
      const perpX = -ty / tl,
        perpY = tx / tl;

      const spacing =
        i > 0
          ? Math.hypot(
              path[i][0] - path[i - 1][0],
              path[i][1] - path[i - 1][1],
            )
          : 2;

      const numCol = Math.max(
        0,
        Math.round(density * spacing * (0.8 + rng() * 0.4)),
      );

      for (let c = 0; c < numCol; c++) {
        let cross: number;
        if (width > 2 && rng() < 0.6) {
          const side = rng() < 0.5 ? -1 : 1;
          cross = side * width * (0.2 + rng() * 0.35);
        } else {
          cross = (rng() - 0.5) * width * 0.5;
        }
        cross += (rng() - 0.5) * width * 0.25;
        const along = (rng() - 0.5) * 3;

        const cx = px + perpX * cross + (tx / tl) * along;
        const cy = py + perpY * cross + (ty / tl) * along;

        if (!insidePlate(Math.round(cx), Math.round(cy))) continue;

        const r =
          opts.colonyR[0] + rng() * (opts.colonyR[1] - opts.colonyR[0]);
        const h =
          opts.colonyH[0] + rng() * (opts.colonyH[1] - opts.colonyH[0]);
        stamp(cx, cy, r, h);
      }
    }
  }

  function zigzagControls(
    startY: number,
    numStrokes: number,
    strokeSpacing: number,
    leftX: number,
    rightX: number,
  ): Pt[] {
    const pts: Pt[] = [];
    for (let i = 0; i < numStrokes; i++) {
      const y = startY + i * strokeSpacing;
      const goingRight = i % 2 === 0;
      const fromX = goingRight ? leftX : rightX;
      const toX = goingRight ? rightX : leftX;
      const midX = (fromX + toX) / 2 + (rng() - 0.5) * 40;
      const midY = y + (rng() - 0.5) * strokeSpacing * 0.3;

      pts.push([
        fromX + (rng() - 0.5) * 20,
        y + (rng() - 0.5) * 8,
      ]);
      pts.push([midX, midY]);
      pts.push([
        toX + (rng() - 0.5) * 20,
        y + (rng() - 0.5) * 8,
      ]);
    }
    return pts;
  }

  const swirlCX = refPaths?.swirl.cx ?? HALF + 20;
  const swirlCY = refPaths?.swirl.cy ?? HALF - 85;
  const swirlR = refPaths?.swirl.radius ?? 80;
  const swirlBaseFill = refPaths?.swirl.baseFill ?? 0.45;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - swirlCX;
      const dy = y - swirlCY;
      const dist = Math.hypot(dx, dy);
      if (dist > swirlR + 5) continue;
      if (!insidePlate(x, y)) continue;
      const f = dist / swirlR;
      let h = 0;
      if (f < 0.6) h = swirlBaseFill;
      else if (f < 1.0) {
        const et = (f - 0.6) / 0.4;
        h = swirlBaseFill * (1 - et * et);
      }
      const angle = Math.atan2(dy, dx);
      h *= 0.75 + 0.25 * Math.sin(dist * 0.12 + angle * 0.8);
      h *= 0.85 + noise(x, y, 0.05) * 0.3;
      if (h > 0) d[y * SIZE + x] = Math.max(d[y * SIZE + x], h);
    }
  }

  const swirlColCount = refPaths?.swirl.colonyCount ?? 600;
  const swirlColR = refPaths?.swirl.colonyR ?? [1.5, 2.5] as [number, number];
  const swirlColH = refPaths?.swirl.colonyH ?? [0.3, 0.55] as [number, number];
  for (let i = 0; i < swirlColCount; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rng() * swirlR;
    const cx = swirlCX + Math.cos(angle) * r;
    const cy = swirlCY + Math.sin(angle) * r;
    if (!insidePlate(Math.round(cx), Math.round(cy))) continue;
    stamp(
      cx,
      cy,
      swirlColR[0] + rng() * (swirlColR[1] - swirlColR[0]),
      swirlColH[0] + rng() * (swirlColH[1] - swirlColH[0]),
    );
  }

  if (refPaths) {
    for (const zone of refPaths.zones) {
      depositStreak(zone.path, zone.deposition);
    }
  } else {
    depositStreak(zigzagControls(155, 7, 26, 80, 520), {
      startDensity: 4,
      endDensity: 0.25,
      startWidth: 14,
      endWidth: 7,
      colonyR: [1.5, 3.5],
      colonyH: [0.2, 0.5],
    });
    depositStreak(zigzagControls(340, 5, 28, 110, 490), {
      startDensity: 1.5,
      endDensity: 0.04,
      startWidth: 10,
      endWidth: 5,
      colonyR: [2, 5],
      colonyH: [0.2, 0.5],
    });
    depositStreak(zigzagControls(460, 3, 26, 140, 460), {
      startDensity: 0.3,
      endDensity: 0.008,
      startWidth: 7,
      endWidth: 3,
      colonyR: [2.5, 5.5],
      colonyH: [0.25, 0.55],
    });
  }

  if (refPaths) {
    const { radiusRange, heightRange } = refPaths.scattered;
    for (const [sx, sy] of refPaths.scattered.positions) {
      if (!insidePlate(Math.round(sx), Math.round(sy))) continue;
      const iy = Math.round(Math.min(SIZE - 1, Math.max(0, sy)));
      const ix = Math.round(Math.min(SIZE - 1, Math.max(0, sx)));
      if (d[iy * SIZE + ix] > 0.04) continue;
      stamp(
        sx,
        sy,
        radiusRange[0] + rng() * (radiusRange[1] - radiusRange[0]),
        heightRange[0] + rng() * (heightRange[1] - heightRange[0]),
      );
    }
  } else {
    for (let i = 0; i < 200; i++) {
      const angle = rng() * Math.PI * 2;
      const r = 30 + rng() * (PLATE_R - 40);
      const cx = HALF + Math.cos(angle) * r;
      const cy = HALF + Math.sin(angle) * r;
      const iy = Math.round(Math.min(SIZE - 1, Math.max(0, cy)));
      const ix = Math.round(Math.min(SIZE - 1, Math.max(0, cx)));
      if (d[iy * SIZE + ix] > 0.04) continue;
      stamp(cx, cy, 2.5 + rng() * 5, 0.2 + rng() * 0.45);
    }
  }

  for (let i = 0; i < SIZE * SIZE; i++) {
    d[i] += noise(i % SIZE, (i / SIZE) | 0, 0.03) * 0.005;
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - HALF;
      const dy = y - HALF;
      const dist = Math.hypot(dx, dy) / (SIZE / 2);
      if (dist > 0.92)
        d[y * SIZE + x] *= Math.max(0, 1 - (dist - 0.92) / 0.08);
    }
  }

  return d;
}

// ── Shaders ──

const VERT_SRC = `#version 300 es
layout(location=0) in vec2 a;
out vec2 v;
void main() {
  v = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0, 1);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 v;
out vec4 o;

uniform sampler2D u_height;
uniform vec3  u_lightPos;
uniform float u_time;
uniform vec2  u_res;

uniform vec3  u_agarColor;
uniform float u_agarRough;
uniform float u_agarSpec;
uniform float u_agarCC;
uniform float u_agarCCRough;
uniform float u_agarTranslucency;
uniform float u_hemoIntensity;

uniform vec3  u_colColor;
uniform float u_colRough;
uniform float u_colSpec;
uniform float u_colCC;
uniform float u_colCCRough;
uniform float u_colMicroBump;
uniform float u_colOpacity;
uniform float u_edgeGlow;

uniform float u_bumpStr;
uniform float u_heightScale;

uniform float u_ambient;
uniform float u_underlight;
uniform float u_aoStr;
uniform float u_vigStr;
uniform float u_exposure;
uniform float u_grainAmount;

const vec3 HEMO_CLEAR = vec3(0.76, 0.69, 0.51);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
}

float r2s(float roughness) {
  return pow(8192.0, 1.0 - clamp(roughness, 0.01, 1.0));
}

float specD(float NdotH, float shininess) {
  float norm = min((shininess + 2.0) / 8.0, 4.0);
  return norm * pow(max(NdotH, 0.0), shininess);
}

void main() {
  vec2 uv = v;
  vec2 tx = 1.0 / u_res;

  vec2 center = uv - 0.5;
  float dist = length(center) * 2.0;
  if (dist > 0.96) { o = vec4(vec3(0.12), 1); return; }
  float rimMask = smoothstep(0.88, 0.93, dist);

  float h   = texture(u_height, uv).r * u_heightScale;
  float h_l = texture(u_height, uv - vec2(tx.x, 0)).r * u_heightScale;
  float h_r = texture(u_height, uv + vec2(tx.x, 0)).r * u_heightScale;
  float h_d = texture(u_height, uv - vec2(0, tx.y)).r * u_heightScale;
  float h_u = texture(u_height, uv + vec2(0, tx.y)).r * u_heightScale;

  float colonyMask = clamp(smoothstep(0.02, 0.08, h) * u_colOpacity, 0.0, 1.0);
  float denseColony = smoothstep(0.15, 0.35, h);

  // Scale bump strength: agar surface is smooth wet gel, colonies get full bump
  float bumpScale = u_bumpStr * (colonyMask * 0.85 + 0.15);
  vec3 N = normalize(vec3(
    (h_l - h_r) * bumpScale,
    (h_d - h_u) * bumpScale,
    1.0
  ));

  vec3 V = normalize(vec3(0.5 - uv.x, 0.5 - uv.y, 1.2));
  // Directional key light (large diffuse overhead source, not point light)
  vec3 L = normalize(u_lightPos);

  vec3 Nsmooth = N;

  // Colony micro-texture (granular bacterial bumps)
  float microX = noise(uv * 500.0) * 2.0 - 1.0;
  float microY = noise(uv * 500.0 + vec2(73.1, 91.7)) * 2.0 - 1.0;
  N = normalize(N + vec3(microX, microY, 0.0) * u_colMicroBump * colonyMask);

  vec3 H = normalize(L + V);
  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);

  float sNdotH = max(dot(Nsmooth, H), 0.0);
  float sNdotV = max(dot(Nsmooth, V), 0.0);

  // Schlick fresnel (F0 = 0.04 for water/glass, IOR ~1.33)
  float schlickF = 0.04 + 0.96 * pow(1.0 - sNdotV, 5.0);

  // ── Hemolysis zone ──
  float hemoZone = 0.0;
  for (float i = -3.0; i <= 3.0; i++) {
    for (float j = -3.0; j <= 3.0; j++) {
      float nh = texture(u_height, uv + vec2(i, j) * tx * 5.0).r * u_heightScale;
      hemoZone += smoothstep(0.03, 0.1, nh);
    }
  }
  hemoZone = hemoZone / 49.0;
  hemoZone = smoothstep(0.05, 0.3, hemoZone) * (1.0 - colonyMask);

  // ════════════════════════════════════════════
  //  AGAR — translucent blood-red gel + wet film
  // ════════════════════════════════════════════

  float n1 = noise(uv * 80.0) * 0.05;
  float n2 = noise(uv * 200.0) * 0.03;
  vec3 agarDeep = u_agarColor * vec3(0.92, 0.55, 0.55);
  vec3 agar = mix(u_agarColor, agarDeep, 0.15 + n1 * 0.4 - n2 * 0.3);
  agar = mix(agar, HEMO_CLEAR, hemoZone * u_hemoIntensity);

  // Wrap lighting — gel is translucent, light wraps around instead of hard shadow
  float wrap = u_agarTranslucency;
  float agarDiff = max(0.0, (NdotL + wrap) / (1.0 + wrap));
  agarDiff = agarDiff * (1.0 - u_ambient) + u_ambient;
  // Underlight: light pad beneath the dish illuminating through translucent gel
  agarDiff += u_underlight * (1.0 - colonyMask);

  // Base specular (gel surface reflection — no Fresnel, controlled by slider directly)
  float agarShin = r2s(u_agarRough);
  float agarSpecH = specD(NdotH, agarShin) * u_agarSpec;

  // Clearcoat (wet surface film — separate sharp lobe)
  float ccShin = r2s(u_agarCCRough);
  float agarCC = specD(sNdotH, ccShin) * u_agarCC * schlickF;

  // Energy conservation: reflected light doesn't re-enter the volume
  float agarRefl = clamp(agarSpecH + agarCC, 0.0, 0.95);
  vec3 agarLit = agar * agarDiff * (1.0 - agarRefl * 0.5);
  agarLit += vec3(agarSpecH + agarCC);

  // ════════════════════════════════════════════
  //  COLONY — opaque matte bacterial growth
  // ════════════════════════════════════════════

  float colDiff = max(0.0, NdotL) * (1.0 - u_ambient) + u_ambient;

  // Base specular (colony surface — no Fresnel, controlled by slider directly)
  float colShin = r2s(u_colRough);
  float colSpecH = specD(NdotH, colShin) * u_colSpec;

  float colCCShin = r2s(u_colCCRough);
  float colCC = specD(sNdotH, colCCShin) * u_colCC * schlickF;

  // Edge glow (SSS through thin colony edges)
  vec3 sssCol = vec3(
    min(1.0, u_agarColor.r * 1.4),
    min(1.0, u_agarColor.g * 1.4),
    u_agarColor.b
  );
  float edgeMask = colonyMask * (1.0 - denseColony);
  vec3 colEdge = sssCol * edgeMask * u_edgeGlow;

  float colRefl = clamp(colSpecH + colCC, 0.0, 0.95);
  vec3 colonyLit = u_colColor * colDiff * (1.0 - colRefl * 0.3) + colEdge;
  colonyLit += vec3(colSpecH + colCC);

  // ════════════════════════════════════════════
  //  COMPOSITE
  // ════════════════════════════════════════════

  vec3 color = mix(agarLit, colonyLit, colonyMask);

  float ao = 1.0 - smoothstep(0.0, 0.05, h) * u_aoStr * (1.0 - denseColony);
  color *= ao;

  color = mix(color, vec3(0.08, 0.02, 0.02), rimMask);

  float vig = 1.0 - dist * dist * u_vigStr;
  color *= vig;

  float grain = hash(uv * u_res + u_time) * u_grainAmount * 2.0 - u_grainAmount;
  color += grain;

  // Per-channel Reinhard + saturation boost (compensates gamma desaturation)
  color = color / (color + 0.8) * u_exposure;
  float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(grey), color, 1.2);
  color = clamp(color, 0.0, 1.0);
  color = pow(color, vec3(1.0 / 2.2));

  o = vec4(color, 1);
}`;

// ── WebGL helpers ──

function compileShader(
  gl: WebGL2RenderingContext,
  src: string,
  type: number,
): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

type ULoc = WebGLUniformLocation | null;

interface Locations {
  light: ULoc;
  agarColor: ULoc;
  agarRough: ULoc;
  agarSpec: ULoc;
  agarCC: ULoc;
  agarCCRough: ULoc;
  agarTranslucency: ULoc;
  hemoIntensity: ULoc;
  colColor: ULoc;
  colRough: ULoc;
  colSpec: ULoc;
  colCC: ULoc;
  colCCRough: ULoc;
  colMicroBump: ULoc;
  colOpacity: ULoc;
  edgeGlow: ULoc;
  bumpStr: ULoc;
  heightScale: ULoc;
  ambient: ULoc;
  underlight: ULoc;
  aoStr: ULoc;
  vigStr: ULoc;
  exposure: ULoc;
  grainAmount: ULoc;
  time: ULoc;
}

export interface ColonyRenderer {
  render(time: number, params: ColonyParams): void;
  destroy(): void;
}

export interface RendererOpts {
  seed?: number;
  useReferencePaths?: boolean;
  heightMap?: Float32Array;
}

const REF_CROP = { centerX: 0.50, centerY: 0.47, radiusFrac: 0.40 };

export async function extractHeightMapFromImage(
  imageUrl: string,
): Promise<Float32Array> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Failed to load: ${imageUrl}`));
    el.src = imageUrl;
  });

  const offscreen = document.createElement('canvas');
  offscreen.width = SIZE;
  offscreen.height = SIZE;
  const ctx = offscreen.getContext('2d')!;

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const plateCX = imgW * REF_CROP.centerX;
  const plateCY = imgH * REF_CROP.centerY;
  const plateR = Math.min(imgW, imgH) * REF_CROP.radiusFrac;
  ctx.drawImage(
    img,
    plateCX - plateR, plateCY - plateR, plateR * 2, plateR * 2,
    0, 0, SIZE, SIZE,
  );

  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  let agarR = 0, agarG = 0, agarB = 0, agarCount = 0;
  const innerR2 = (PLATE_R * 0.78) ** 2;
  const outerR2 = (PLATE_R * 0.88) ** 2;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - HALF, dy = y - HALF;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < innerR2 || dist2 > outerR2) continue;

      const i = (y * SIZE + x) * 4;
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];

      const maxC = Math.max(pr, pg, pb);
      const minC = Math.min(pr, pg, pb);
      if (maxC === 0 || (maxC - minC) / maxC < 0.25) continue;

      agarR += pr; agarG += pg; agarB += pb; agarCount++;
    }
  }

  if (agarCount === 0) agarCount = 1;
  agarR /= agarCount;
  agarG /= agarCount;
  agarB /= agarCount;

  const d = new Float32Array(SIZE * SIZE);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - HALF, dy = y - HALF;
      if (dx * dx + dy * dy > PLATE_R * PLATE_R) continue;

      const i = (y * SIZE + x) * 4;
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];

      const maxC = Math.max(pr, pg, pb);
      const minC = Math.min(pr, pg, pb);
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
      if (sat < 0.15 || maxC < 25 || maxC > 245) continue;

      const dR = pr - agarR;
      const dG = pg - agarG;
      const dB = pb - agarB;

      const colonySignal = (dG * 2.0 - dR * 0.5 - dB * 0.3) / 255;

      if (colonySignal > 0) {
        d[y * SIZE + x] = Math.min(0.35, colonySignal * 0.9);
      }
    }
  }

  const blurred = new Float32Array(SIZE * SIZE);
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += d[(y + dy) * SIZE + (x + dx)];
        }
      }
      blurred[y * SIZE + x] = sum / 9;
    }
  }

  const flipped = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    const srcRow = (SIZE - 1 - y) * SIZE;
    const dstRow = y * SIZE;
    for (let x = 0; x < SIZE; x++) {
      flipped[dstRow + x] = blurred[srcRow + x];
    }
  }

  for (let i = 0; i < SIZE * SIZE; i++) {
    const px = i % SIZE;
    const py = (i / SIZE) | 0;
    flipped[i] += (
      (Math.sin(px * 0.03 + py * 0.7) +
        Math.sin(py * 0.039 + px * 0.5) +
        Math.sin((px + py) * 0.018)) / 6 + 0.5
    ) * 0.005;
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dist = Math.hypot(x - HALF, y - HALF) / (SIZE / 2);
      if (dist > 0.92)
        flipped[y * SIZE + x] *= Math.max(0, 1 - (dist - 0.92) / 0.08);
    }
  }

  return flipped;
}

export function createColonyRenderer(
  canvas: HTMLCanvasElement,
  opts?: RendererOpts,
): ColonyRenderer | null {
  const gl = canvas.getContext('webgl2');
  if (!gl) return null;

  canvas.width = SIZE;
  canvas.height = SIZE;

  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('EXT_color_buffer_float');

  let heightFloat: Float32Array;
  if (opts?.heightMap) {
    heightFloat = opts.heightMap;
  } else {
    const rng = opts?.seed != null ? mulberry32(opts.seed) : Math.random;
    const refPaths = opts?.useReferencePaths ? REFERENCE_PATHS : undefined;
    heightFloat = genHeightMap(rng, refPaths);
  }
  const heightU8 = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    heightU8[i] = Math.min(255, Math.round(Math.min(1, heightFloat[i]) * 255));
  }

  const heightTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, heightTex);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.R8, SIZE, SIZE, 0,
    gl.RED, gl.UNSIGNED_BYTE, heightU8,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, VERT_SRC, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(gl, FRAG_SRC, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const loc: Locations = {
    light: u('u_lightPos'),
    agarColor: u('u_agarColor'),
    agarRough: u('u_agarRough'),
    agarSpec: u('u_agarSpec'),
    agarCC: u('u_agarCC'),
    agarCCRough: u('u_agarCCRough'),
    agarTranslucency: u('u_agarTranslucency'),
    hemoIntensity: u('u_hemoIntensity'),
    colColor: u('u_colColor'),
    colRough: u('u_colRough'),
    colSpec: u('u_colSpec'),
    colCC: u('u_colCC'),
    colCCRough: u('u_colCCRough'),
    colMicroBump: u('u_colMicroBump'),
    colOpacity: u('u_colOpacity'),
    edgeGlow: u('u_edgeGlow'),
    bumpStr: u('u_bumpStr'),
    heightScale: u('u_heightScale'),
    ambient: u('u_ambient'),
    underlight: u('u_underlight'),
    aoStr: u('u_aoStr'),
    vigStr: u('u_vigStr'),
    exposure: u('u_exposure'),
    grainAmount: u('u_grainAmount'),
    time: u('u_time'),
  };

  gl.uniform1i(u('u_height'), 0);
  gl.uniform2f(u('u_res'), SIZE, SIZE);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, heightTex);
  gl.viewport(0, 0, SIZE, SIZE);

  return {
    render(time: number, p: ColonyParams) {
      gl.uniform3f(loc.light, p.lightX, p.lightY, p.lightZ);
      gl.uniform3f(loc.agarColor, p.agarR, p.agarG, p.agarB);
      gl.uniform1f(loc.agarRough, p.agarRoughness);
      gl.uniform1f(loc.agarSpec, p.agarSpecular);
      gl.uniform1f(loc.agarCC, p.agarClearcoat);
      gl.uniform1f(loc.agarCCRough, p.agarClearcoatRough);
      gl.uniform1f(loc.agarTranslucency, p.agarTranslucency);
      gl.uniform1f(loc.hemoIntensity, p.hemoIntensity);
      gl.uniform3f(loc.colColor, p.colonyR, p.colonyG, p.colonyB);
      gl.uniform1f(loc.colRough, p.colonyRoughness);
      gl.uniform1f(loc.colSpec, p.colonySpecular);
      gl.uniform1f(loc.colCC, p.colonyClearcoat);
      gl.uniform1f(loc.colCCRough, p.colonyClearcoatRough);
      gl.uniform1f(loc.colMicroBump, p.colonyMicroBump);
      gl.uniform1f(loc.colOpacity, p.colonyOpacity);
      gl.uniform1f(loc.edgeGlow, p.edgeGlow);
      gl.uniform1f(loc.bumpStr, p.bumpStrength);
      gl.uniform1f(loc.heightScale, p.heightScale);
      gl.uniform1f(loc.ambient, p.ambient);
      gl.uniform1f(loc.underlight, p.underlight);
      gl.uniform1f(loc.aoStr, p.aoStrength);
      gl.uniform1f(loc.vigStr, p.vignetteStrength);
      gl.uniform1f(loc.exposure, p.exposure);
      gl.uniform1f(loc.grainAmount, p.grainAmount);
      gl.uniform1f(loc.time, time * 0.001);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
      gl.deleteTexture(heightTex);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
}
