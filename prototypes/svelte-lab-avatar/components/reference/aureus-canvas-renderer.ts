/**
 * Standalone Canvas 2D renderer: S. aureus on blood agar.
 * Photorealistic 600×600 plate with PBR-inspired lighting pipeline.
 *
 * Pipeline:
 *  1. Bench surface + agar base (gradient + smooth noise)
 *  2. Colony height map — float buffer splatted from streak/confluent geometry
 *     - Cross-section profile: center valley (loop pressure), opaque sides, fuzzy edges
 *     - Progressive thinning along streak length
 *     - Asymmetric edge fade for natural variation
 *  3. Normal map computed from height gradients (Sobel-like)
 *  4. Phong shading: ambient + diffuse + Blinn-Phong specular
 *  5. Albedo × lighting composited over agar
 *  6. Wet agar specular + glass rim
 */

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;
const PLATE_R = 260;

// S. aureus golden color — warm beige-gold like real colonies
const GOLDEN_R = 210;
const GOLDEN_G = 170;
const GOLDEN_B = 90;

function hash(x: number, y: number): number {
  let h = x * 12.9898 + y * 78.233;
  h = Math.sin(h) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ── Streak data ──

interface StreakCurve {
  x1: number; y1: number;
  cpx: number; cpy: number;
  x2: number; y2: number;
  width: number;
  growth: number;
}

function generateStreaks(): StreakCurve[] {
  const s: StreakCurve[] = [];

  // Zone 1: Circular swirl streaks — confluent area upper-right
  // Tighter swirls, thinner lines to match real photo
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + Math.PI * 0.8;
    const r1 = 20 + i * 10;
    const r2 = 26 + i * 11;
    const cx1 = CX + 65;
    const cy1 = CY - 95;
    s.push({
      x1: cx1 + Math.cos(angle) * r1,
      y1: cy1 + Math.sin(angle) * r1,
      cpx: cx1 + Math.cos(angle + 0.5) * (r1 + r2) * 0.5,
      cpy: cy1 + Math.sin(angle + 0.5) * (r1 + r2) * 0.5,
      x2: cx1 + Math.cos(angle + 1.0) * r2,
      y2: cy1 + Math.sin(angle + 1.0) * r2,
      width: 2.5 - i * 0.05,
      growth: 0.95,
    });
  }

  // Zone 2: Angular zigzag streaks — sharper turns, good spacing
  const z2: [number, number, number, number, number, number][] = [
    // Upper group — sweeps across top of plate
    [CX - 230, CY - 120, CX - 100, CY - 145, CX + 30, CY - 110],
    [CX + 30, CY - 110, CX + 70, CY - 85, CX - 40, CY - 70],
    [CX - 40, CY - 70, CX - 180, CY - 95, CX - 240, CY - 55],
    [CX - 240, CY - 55, CX - 100, CY - 30, CX + 50, CY - 50],
    // Middle group — zigzag across plate
    [CX + 50, CY - 50, CX + 90, CY - 20, CX - 30, CY - 10],
    [CX - 30, CY - 10, CX - 180, CY - 35, CX - 240, CY + 15],
    [CX - 240, CY + 15, CX - 80, CY + 50, CX + 60, CY + 25],
    [CX + 60, CY + 25, CX + 110, CY + 55, CX - 20, CY + 65],
    [CX - 20, CY + 65, CX - 160, CY + 40, CX - 230, CY + 70],
    // Lower-middle — more spread
    [CX - 230, CY + 80, CX - 70, CY + 115, CX + 70, CY + 95],
    [CX + 70, CY + 95, CX + 120, CY + 115, CX - 10, CY + 130],
    [CX - 10, CY + 130, CX - 150, CY + 110, CX - 220, CY + 130],
  ];
  for (const [x1, y1, cpx, cpy, x2, y2] of z2) {
    s.push({
      x1, y1, cpx, cpy, x2, y2,
      width: 4.5 + hash(x1 * 0.01, y1 * 0.01) * 2.5,
      growth: 0.85 + hash(x1 * 0.02, y1 * 0.03) * 0.15,
    });
  }

  // Zone 3: Sweeping strokes
  const z3: [number, number, number, number, number, number][] = [
    [CX - 180, CY + 110, CX - 60, CY + 150, CX + 60, CY + 130],
    [CX + 60, CY + 130, CX + 130, CY + 110, CX + 190, CY + 140],
    [CX - 140, CY + 150, CX - 20, CY + 180, CX + 100, CY + 165],
    [CX + 100, CY + 165, CX + 160, CY + 150, CX + 210, CY + 170],
    [CX - 100, CY + 130, CX + 10, CY + 160, CX + 120, CY + 145],
  ];
  for (const [x1, y1, cpx, cpy, x2, y2] of z3) {
    s.push({
      x1, y1, cpx, cpy, x2, y2,
      width: 3.5 + hash(x1 * 0.01, y1 * 0.02) * 2.0,
      growth: 0.70 + hash(x1 * 0.03, y1 * 0.01) * 0.15,
    });
  }

  // Zone 4: Sparse bottom
  const z4: [number, number, number, number, number, number][] = [
    [CX - 100, CY + 185, CX + 10, CY + 210, CX + 130, CY + 195],
    [CX + 130, CY + 195, CX + 180, CY + 180, CX + 220, CY + 200],
    [CX - 60, CY + 200, CX + 40, CY + 220, CX + 150, CY + 210],
  ];
  for (const [x1, y1, cpx, cpy, x2, y2] of z4) {
    s.push({
      x1, y1, cpx, cpy, x2, y2,
      width: 2.5 + hash(x1 * 0.02, y1 * 0.01) * 1.5,
      growth: 0.55 + hash(x1 * 0.04, y1 * 0.02) * 0.2,
    });
  }

  return s;
}

// ── Bézier helper ──

function bezierPt(
  x1: number, y1: number, cpx: number, cpy: number,
  x2: number, y2: number, t: number,
): [number, number] {
  const u = 1 - t;
  return [u * u * x1 + 2 * u * t * cpx + t * t * x2,
          u * u * y1 + 2 * u * t * cpy + t * t * y2];
}

// ── Height map splatting ──

/** Splat a single streak into the height buffer.
 *  Flat, wet, homogeneous cross-section — colonies merge into a smooth mass.
 *  Subtle center thinning (loop pressure) but no deep valley/ridge.
 */
function splatStreak(hmap: Float32Array, s: StreakCurve): void {
  const samples = 300;
  const halfW = s.width * s.growth;
  // Per-streak variation — each streak looks different
  const asymmetry = (hash(s.x1 * 0.03, s.y1 * 0.07) - 0.5) * 0.3;
  const taperVariation = 0.7 + hash(s.x1 * 0.11, s.y1 * 0.23) * 0.6; // 0.7–1.3x end taper speed
  const widthWobble = hash(s.x1 * 0.17, s.y1 * 0.31); // Per-streak width variation seed

  for (let si = 0; si < samples; si++) {
    const t = si / (samples - 1);
    const [cx, cy] = bezierPt(s.x1, s.y1, s.cpx, s.cpy, s.x2, s.y2, t);

    // Progressive deposition: loop starts loaded, deposits less as it runs out
    const lengthFade = s.growth + (1.0 - s.growth) * Math.exp(-t * 3.5);
    // Taper at start and end — streaks come to rounded points, not blunt edges
    const startTaper = Math.min(1, t * 12);
    const endTaper = Math.min(1, (1 - t) * (6 + taperVariation * 4)); // Varied end taper
    // Per-streak width wobble along length — no two streaks identical
    const wobble = 1.0 + (hash(t * 80 + widthWobble * 100, si * 0.37) - 0.5) * 0.3;
    const w = halfW * lengthFade * startTaper * endTaper * wobble;
    if (w < 0.3) continue;

    // Tangent → perpendicular
    const dt = 0.003;
    const [cx2, cy2] = bezierPt(s.x1, s.y1, s.cpx, s.cpy, s.x2, s.y2, Math.min(t + dt, 1));
    const tx = cx2 - cx;
    const ty = cy2 - cy;
    const tlen = Math.sqrt(tx * tx + ty * ty) || 1;
    const px = -ty / tlen;
    const py = tx / tlen;

    // Splat across the width — smooth gaussian-ish profile, no hard ridges
    for (let d = -w - 2; d <= w + 2; d += 0.4) {
      const x = Math.round(cx + px * d);
      const y = Math.round(cy + py * d);
      if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) continue;

      const ddx = x - CX;
      const ddy = y - CY;
      if (ddx * ddx + ddy * ddy > (PLATE_R - 3) * (PLATE_R - 3)) continue;

      const norm = d / w; // -1 to +1, 0 at center
      const absNorm = Math.abs(norm);

      // Smooth bell-curve cross section — colonies merge into homogeneous mass
      let profile: number;
      if (absNorm < 0.75) {
        // Core region: flat and uniform (merged colonies)
        profile = 1.0;
      } else if (absNorm < 1.0) {
        // Smooth edge rolloff
        const et = (absNorm - 0.75) / 0.25;
        profile = 1.0 - et * et; // quadratic
      } else {
        // Gentle fringe — colonies tapering off at edges
        const beyond = (absNorm - 1.0) * w;
        profile = Math.exp(-beyond * beyond * 0.3) * 0.4;
      }

      // Subtle center thinning — loop presses slightly, not a deep valley
      // Just reduces opacity at very center, doesn't create ridges
      const centerDip = 1.0 - 0.15 * Math.exp(-(norm * norm) / 0.04);

      // Asymmetry
      const sideScale = 1.0 + asymmetry * Math.sign(norm) * 0.2;

      let h = profile * centerDip * s.growth * lengthFade * sideScale;

      // Very subtle texture variation — keeps it looking wet/organic not noisy
      const noise = 0.95 + hash(x * 0.13, y * 0.17) * 0.1;
      h *= noise;

      h = Math.max(0, Math.min(1, h));
      const idx = y * SIZE + x;
      hmap[idx] = Math.max(hmap[idx], h);
    }
  }
}

/** Splat the confluent zone — smaller, more transparent with visible swirl lines. */
function splatConfluentZone(hmap: Float32Array): void {
  const swirlCX = CX + 65;
  const swirlCY = CY - 95;
  const swirlR = 70; // Smaller to match real photo

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - swirlCX;
      const dy = y - swirlCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > swirlR + 5) continue;

      // Inside plate check
      const pdx = x - CX;
      const pdy = y - CY;
      if (pdx * pdx + pdy * pdy > (PLATE_R - 3) * (PLATE_R - 3)) continue;

      // Base height: very thin film, agar visible through it
      const edgeFrac = dist / swirlR;
      let h: number;
      if (edgeFrac < 0.6) {
        h = 0.35; // Thin — you can clearly see agar through it
      } else if (edgeFrac < 1.0) {
        const t = (edgeFrac - 0.6) / 0.4;
        h = 0.35 * (1 - t * t);
      } else {
        h = 0.35 * Math.exp(-(edgeFrac - 1.0) * (edgeFrac - 1.0) * 50) * 0.15;
      }

      // Swirl texture — subtle visible lines from loop motion
      const angle = Math.atan2(dy, dx);
      const swirlPhase = dist * 0.1 + angle * 0.7;
      const ridge = 0.7 + 0.3 * Math.sin(swirlPhase * Math.PI * 2);
      h *= ridge;

      // Multi-octave noise — makes the film look organic, not mechanical
      const n1 = smoothNoise(x, y, 20) * 0.4;
      const n2 = hash(x * 0.15, y * 0.17) * 0.3;
      const noise = 0.5 + n1 + n2;
      h *= noise;

      h = Math.max(0, Math.min(1, h));
      const idx = y * SIZE + x;
      hmap[idx] = Math.max(hmap[idx], h);
    }
  }
}

// ── PBR lighting pass ──

/** Compute hemolysis map — beta-hemolysis lightens agar around colony growth. */
function computeHemolysisMap(hmap: Float32Array): Float32Array {
  const hemoMap = new Float32Array(SIZE * SIZE);
  // Blur the height map to get a wider influence zone
  const blurR = 12; // Hemolysis extends ~12px beyond colony edge
  // Fast box blur approximation — sample in a grid pattern
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let maxH = 0;
      // Sample nearby pixels in a sparse grid
      for (let dy = -blurR; dy <= blurR; dy += 3) {
        for (let dx = -blurR; dx <= blurR; dx += 3) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sx >= SIZE || sy < 0 || sy >= SIZE) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > blurR) continue;
          const falloff = 1.0 - dist / blurR;
          const val = hmap[sy * SIZE + sx] * falloff;
          if (val > maxH) maxH = val;
        }
      }
      hemoMap[y * SIZE + x] = maxH;
    }
  }
  return hemoMap;
}

function applyPBRLighting(
  hmap: Float32Array,
  outputData: Uint8ClampedArray,
  agarData: Uint8ClampedArray,
): void {
  // Light direction (from upper-left, slightly forward) — normalized
  const lx = -0.35, ly = -0.5, lz = 0.78;
  const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const ld = [lx / ll, ly / ll, lz / ll];

  // View direction (straight down onto plate)
  const vd = [0, 0, 1];

  // Half-vector for Blinn-Phong
  const bx = ld[0] + vd[0];
  const by = ld[1] + vd[1];
  const bz = ld[2] + vd[2];
  const bl = Math.sqrt(bx * bx + by * by + bz * bz);
  const halfV = [bx / bl, by / bl, bz / bl];

  const heightScale = 0.2; // Very flat — colonies are thin wet film, not ridges
  const shininess = 8; // Very broad specular — wet glistening surface
  const ambientStr = 0.75; // High ambient = flat, even lighting
  const diffuseStr = 0.15; // Minimal directional shading
  const specStr = 0.12; // More specular — wet colony surface catches light

  // Compute hemolysis influence
  const hemoMap = computeHemolysisMap(hmap);

  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const idx = y * SIZE + x;
      const h = hmap[idx];
      const hemo = hemoMap[idx];
      const oi = idx * 4;

      if (h < 0.005) {
        // Apply hemolysis to bare agar — lighten where colonies are nearby
        if (hemo > 0.05) {
          const hemoStr = Math.min(0.25, hemo * 0.3); // Subtle lightening
          outputData[oi] = Math.min(255, Math.round(agarData[oi] + hemoStr * 60));
          outputData[oi + 1] = Math.min(255, Math.round(agarData[oi + 1] + hemoStr * 45));
          outputData[oi + 2] = Math.min(255, Math.round(agarData[oi + 2] + hemoStr * 35));
          outputData[oi + 3] = agarData[oi + 3];
        } else {
          outputData[oi] = agarData[oi];
          outputData[oi + 1] = agarData[oi + 1];
          outputData[oi + 2] = agarData[oi + 2];
          outputData[oi + 3] = agarData[oi + 3];
        }
        continue;
      }

      // Surface normal from height gradients
      const hL = hmap[idx - 1];
      const hR = hmap[idx + 1];
      const hU = hmap[(y - 1) * SIZE + x];
      const hD = hmap[(y + 1) * SIZE + x];

      let nx = (hL - hR) * heightScale;
      let ny = (hU - hD) * heightScale;
      let nz = 1.0;

      // Granular normal perturbation — micro-bumps of individual colonies
      const grainScale = 0.08 * h; // Subtle — wet colonies are smooth, not bumpy
      nx += (hash(x * 0.37, y * 0.51) - 0.5) * grainScale;
      ny += (hash(x * 0.61, y * 0.29) - 0.5) * grainScale;

      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= nl; ny /= nl; nz /= nl;

      // Diffuse (Lambert)
      const diffuse = Math.max(0, nx * ld[0] + ny * ld[1] + nz * ld[2]);

      // Specular (Blinn-Phong)
      const nDotH = Math.max(0, nx * halfV[0] + ny * halfV[1] + nz * halfV[2]);
      const spec = Math.pow(nDotH, shininess);

      // Combined lighting
      const light = ambientStr + diffuseStr * diffuse;

      // Colony albedo with per-pixel variation
      const colVar = hash(x * 0.09, y * 0.11);
      const warmShift = (smoothNoise(x, y, 30) - 0.5) * 15;
      const cr = Math.min(255, (GOLDEN_R + warmShift * 0.8 + colVar * 12) * light + spec * specStr * 180);
      const cg = Math.min(255, (GOLDEN_G + warmShift * 0.5 + colVar * 8) * light + spec * specStr * 130);
      const cb = Math.min(255, (GOLDEN_B - warmShift * 0.3 + colVar * 5) * light + spec * specStr * 50);

      // Alpha — opaque where height is significant
      const alpha = h > 0.12 ? 255 : Math.min(255, h / 0.12 * 255);

      // Blend colony color over agar (with hemolysis-lightened agar underneath)
      const a = alpha / 255;
      const ia = 1 - a;
      const hemoStr = Math.min(0.25, hemo * 0.3);
      const aR = Math.min(255, agarData[oi] + hemoStr * 60);
      const aG = Math.min(255, agarData[oi + 1] + hemoStr * 45);
      const aB = Math.min(255, agarData[oi + 2] + hemoStr * 35);
      outputData[oi] = Math.min(255, Math.round(cr * a + aR * ia));
      outputData[oi + 1] = Math.min(255, Math.round(cg * a + aG * ia));
      outputData[oi + 2] = Math.min(255, Math.round(cb * a + aB * ia));
      outputData[oi + 3] = agarData[oi + 3];
    }
  }
}

// ── Main entry ──

export function renderAureusCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // Pass 0: Bench surface
  drawBenchSurface(ctx);

  // Pass 1: Agar base
  drawAgarBase(ctx);

  // Pass 2: Build colony height map
  const hmap = new Float32Array(SIZE * SIZE);
  const streaks = generateStreaks();
  for (const s of streaks) {
    splatStreak(hmap, s);
  }
  splatConfluentZone(hmap);

  // Pass 3: PBR lighting — read agar pixels, compute lit colonies, write back
  const agarImg = ctx.getImageData(0, 0, SIZE, SIZE);
  const outputImg = ctx.createImageData(SIZE, SIZE);
  // Copy agar as base
  outputImg.data.set(agarImg.data);
  applyPBRLighting(hmap, outputImg.data, agarImg.data);
  ctx.putImageData(outputImg, 0, 0);

  // Pass 4: Wet surface highlights
  drawWetSurface(ctx);

  // Pass 5: Glass plate rim
  drawPlateRim(ctx);
}

// ── Pass 0: Bench surface ──

function drawBenchSurface(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e8e4e0';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const vig = ctx.createRadialGradient(CX, CY, SIZE * 0.3, CX, CY, SIZE * 0.72);
  vig.addColorStop(0, 'rgba(255,255,255,0.06)');
  vig.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Plate shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#e8e4e0';
  ctx.fill();
  ctx.restore();
}

// ── Pass 1: Blood agar ──

function drawAgarBase(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R, 0, Math.PI * 2);
  ctx.clip();

  const grad = ctx.createRadialGradient(CX - 15, CY - 20, 40, CX, CY, PLATE_R);
  grad.addColorStop(0, 'hsl(8, 88%, 58%)');
  grad.addColorStop(0.35, 'hsl(7, 85%, 54%)');
  grad.addColorStop(0.7, 'hsl(6, 80%, 50%)');
  grad.addColorStop(1.0, 'hsl(4, 74%, 44%)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Smooth noise overlay for organic variation
  const varCanvas = new OffscreenCanvas(SIZE, SIZE);
  const vctx = varCanvas.getContext('2d')!;
  const imgData = vctx.createImageData(SIZE, SIZE);
  const d = imgData.data;
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const idx = (py * SIZE + px) * 4;
      const dx = px - CX;
      const dy = py - CY;
      if (dx * dx + dy * dy > PLATE_R * PLATE_R) { d[idx + 3] = 0; continue; }
      const n1 = smoothNoise(px, py, 80) - 0.5;
      const n2 = smoothNoise(px, py, 25) - 0.5;
      const n3 = (hash(px, py) - 0.5);
      const combined = n1 * 18 + n2 * 8 + n3 * 4;
      d[idx] = 128 + combined * 1.5;
      d[idx + 1] = 128 + combined * 0.6;
      d[idx + 2] = 128 - combined * 0.3;
      d[idx + 3] = 255;
    }
  }
  vctx.putImageData(imgData, 0, 0);
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(varCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Inner dish wall shadow
  const shadow = ctx.createRadialGradient(CX, CY, PLATE_R * 0.82, CX, CY, PLATE_R);
  shadow.addColorStop(0, 'rgba(0,0,0,0)');
  shadow.addColorStop(0.7, 'rgba(0,0,0,0.02)');
  shadow.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.restore();
}

// ── Pass 4: Wet surface ──

function drawWetSurface(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R, 0, Math.PI * 2);
  ctx.clip();

  // Broader, stronger specular — wet agar surface catches overhead light
  const specGrad = ctx.createRadialGradient(CX - 50, CY - 70, 20, CX - 30, CY - 40, 220);
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  specGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.10)');
  specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = specGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Wet sheen across entire surface
  const sheen = ctx.createLinearGradient(CX - PLATE_R, CY - PLATE_R, CX + PLATE_R, CY + PLATE_R);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.01)');
  sheen.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.02)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Moisture dots
  for (let i = 0; i < 10; i++) {
    const rx = CX - 180 + hash(i * 13.7, i * 4.3) * 360;
    const ry = CY - 180 + hash(i * 5.1, i * 11.9) * 360;
    const dx = rx - CX;
    const dy = ry - CY;
    if (dx * dx + dy * dy > (PLATE_R - 20) * (PLATE_R - 20)) continue;
    ctx.beginPath();
    ctx.arc(rx, ry, 0.6 + hash(i * 2.3, i * 7.1) * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + hash(i * 3.3, i * 9.7) * 0.2})`;
    ctx.fill();
  }

  ctx.restore();
}

// ── Pass 5: Glass petri dish rim ──

function drawPlateRim(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(180, 185, 190, 0.35)';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R + 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(220, 225, 230, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R + 3, Math.PI * 1.05, Math.PI * 1.7);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R + 3, Math.PI * 0.05, Math.PI * 0.4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R - 1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100, 50, 40, 0.08)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}
