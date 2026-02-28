/**
 * Standalone PixiJS (v8) renderer: S. aureus on blood agar.
 * Photorealistic 600×600 plate with PBR-inspired lighting pipeline.
 *
 * Renders the full plate (agar + colonies + PBR lighting + rim) to an
 * OffscreenCanvas, then displays it as a PixiJS Sprite. This achieves
 * the same visual quality as the Canvas 2D renderer while keeping the
 * PixiJS Application architecture required by ReferenceView.svelte.
 */

import { Application, Sprite, Texture } from 'pixi.js';

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;
const PLATE_R = 260;

// S. aureus golden color — warm beige-gold like real colonies
const GOLDEN_R = 210;
const GOLDEN_G = 170;
const GOLDEN_B = 90;

// ── Math helpers ──

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
    [CX - 230, CY - 120, CX - 100, CY - 145, CX + 30, CY - 110],
    [CX + 30, CY - 110, CX + 70, CY - 85, CX - 40, CY - 70],
    [CX - 40, CY - 70, CX - 180, CY - 95, CX - 240, CY - 55],
    [CX - 240, CY - 55, CX - 100, CY - 30, CX + 50, CY - 50],
    [CX + 50, CY - 50, CX + 90, CY - 20, CX - 30, CY - 10],
    [CX - 30, CY - 10, CX - 180, CY - 35, CX - 240, CY + 15],
    [CX - 240, CY + 15, CX - 80, CY + 50, CX + 60, CY + 25],
    [CX + 60, CY + 25, CX + 110, CY + 55, CX - 20, CY + 65],
    [CX - 20, CY + 65, CX - 160, CY + 40, CX - 230, CY + 70],
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

function splatStreak(hmap: Float32Array, s: StreakCurve): void {
  const samples = 300;
  const halfW = s.width * s.growth;
  const asymmetry = (hash(s.x1 * 0.03, s.y1 * 0.07) - 0.5) * 0.4;

  for (let si = 0; si < samples; si++) {
    const t = si / (samples - 1);
    const [cx, cy] = bezierPt(s.x1, s.y1, s.cpx, s.cpy, s.x2, s.y2, t);

    const lengthFade = s.growth + (1.0 - s.growth) * Math.exp(-t * 3.5);
    const w = halfW * lengthFade;
    if (w < 0.3) continue;

    const dt = 0.003;
    const [cx2, cy2] = bezierPt(s.x1, s.y1, s.cpx, s.cpy, s.x2, s.y2, Math.min(t + dt, 1));
    const tx = cx2 - cx;
    const ty = cy2 - cy;
    const tlen = Math.sqrt(tx * tx + ty * ty) || 1;
    const px = -ty / tlen;
    const py = tx / tlen;

    for (let d = -w - 3; d <= w + 3; d += 0.4) {
      const x = Math.round(cx + px * d);
      const y = Math.round(cy + py * d);
      if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) continue;

      const ddx = x - CX;
      const ddy = y - CY;
      if (ddx * ddx + ddy * ddy > (PLATE_R - 3) * (PLATE_R - 3)) continue;

      const dist = d / w;
      const absDist = Math.abs(dist);

      const valleyDepth = (1.0 - s.growth * 0.4) * 0.8;
      const valleyWidth = 0.22 + (1.0 - s.growth) * 0.18;
      const valley = valleyDepth * Math.exp(-(dist * dist) / (2 * valleyWidth * valleyWidth));

      let edgeProfile: number;
      if (absDist < 0.65) {
        edgeProfile = 1.0;
      } else if (absDist < 1.0) {
        const et = (absDist - 0.65) / 0.35;
        edgeProfile = 1.0 - et * et * et;
      } else {
        const fringe = (absDist - 1.0) * w;
        const fringeBase = Math.exp(-fringe * fringe * 0.5) * 0.35;
        const fringeNoise = hash(x * 0.23 + fringe, y * 0.31);
        edgeProfile = fringeNoise > 0.4 ? fringeBase : fringeBase * 0.1;
      }

      const sideScale = 1.0 + asymmetry * Math.sign(dist) * 0.25;

      let h = edgeProfile * (1.0 - valley) * s.growth * lengthFade * sideScale;

      const noise = 0.9 + hash(x * 0.13, y * 0.17) * 0.2;
      h *= noise;

      h = Math.max(0, Math.min(1, h));
      const idx = y * SIZE + x;
      hmap[idx] = Math.max(hmap[idx], h);
    }

    if (si % 5 === 0) {
      const numDots = Math.floor(1 + hash(si * 0.71, s.x1 * 0.13) * 3) * lengthFade;
      for (let di = 0; di < numDots; di++) {
        const side = hash(si * 0.37 + di, si * 0.91) > 0.5 ? 1 : -1;
        const edgeDist = w * (0.7 + hash(si * 0.53 + di, si * 0.17) * 0.8);
        const colX = Math.round(cx + px * side * edgeDist + (hash(si * 0.19 + di, si * 0.67) - 0.5) * 2);
        const colY = Math.round(cy + py * side * edgeDist + (hash(si * 0.83 + di, si * 0.41) - 0.5) * 2);
        if (colX < 0 || colX >= SIZE || colY < 0 || colY >= SIZE) continue;
        const cdx = colX - CX;
        const cdy = colY - CY;
        if (cdx * cdx + cdy * cdy > (PLATE_R - 3) * (PLATE_R - 3)) continue;

        const colR = 1.0 + hash(si * 0.29 + di, si * 0.73) * 1.5;
        const colH = 0.5 + hash(si * 0.47 + di, si * 0.61) * 0.3;
        for (let oy = -Math.ceil(colR); oy <= Math.ceil(colR); oy++) {
          for (let ox = -Math.ceil(colR); ox <= Math.ceil(colR); ox++) {
            const dr = Math.sqrt(ox * ox + oy * oy);
            if (dr > colR) continue;
            const fx = colX + ox;
            const fy = colY + oy;
            if (fx < 0 || fx >= SIZE || fy < 0 || fy >= SIZE) continue;
            const bump = colH * (1 - dr / colR);
            const bidx = fy * SIZE + fx;
            hmap[bidx] = Math.max(hmap[bidx], bump);
          }
        }
      }
    }
  }
}

function splatConfluentZone(hmap: Float32Array): void {
  const swirlCX = CX + 65;
  const swirlCY = CY - 95;
  const swirlR = 70;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - swirlCX;
      const dy = y - swirlCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > swirlR + 5) continue;

      const pdx = x - CX;
      const pdy = y - CY;
      if (pdx * pdx + pdy * pdy > (PLATE_R - 3) * (PLATE_R - 3)) continue;

      const edgeFrac = dist / swirlR;
      let h: number;
      if (edgeFrac < 0.6) {
        h = 0.35;
      } else if (edgeFrac < 1.0) {
        const t = (edgeFrac - 0.6) / 0.4;
        h = 0.35 * (1 - t * t);
      } else {
        h = 0.35 * Math.exp(-(edgeFrac - 1.0) * (edgeFrac - 1.0) * 50) * 0.15;
      }

      const angle = Math.atan2(dy, dx);
      const swirlPhase = dist * 0.1 + angle * 0.7;
      const ridge = 0.7 + 0.3 * Math.sin(swirlPhase * Math.PI * 2);
      h *= ridge;

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

// ── PBR lighting ──

function computeHemolysisMap(hmap: Float32Array): Float32Array {
  const hemoMap = new Float32Array(SIZE * SIZE);
  const blurR = 12;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let maxH = 0;
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
  const lx = -0.35, ly = -0.5, lz = 0.78;
  const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const ld = [lx / ll, ly / ll, lz / ll];

  const vd = [0, 0, 1];

  const bx = ld[0] + vd[0];
  const by = ld[1] + vd[1];
  const bz = ld[2] + vd[2];
  const bl = Math.sqrt(bx * bx + by * by + bz * bz);
  const halfV = [bx / bl, by / bl, bz / bl];

  const heightScale = 0.8;
  const shininess = 12;
  const ambientStr = 0.65;
  const diffuseStr = 0.25;
  const specStr = 0.08;

  const hemoMap = computeHemolysisMap(hmap);

  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const idx = y * SIZE + x;
      const h = hmap[idx];
      const hemo = hemoMap[idx];
      const oi = idx * 4;

      if (h < 0.005) {
        if (hemo > 0.05) {
          const hemoStr = Math.min(0.25, hemo * 0.3);
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

      const hL = hmap[idx - 1];
      const hR = hmap[idx + 1];
      const hU = hmap[(y - 1) * SIZE + x];
      const hD = hmap[(y + 1) * SIZE + x];

      let nx = (hL - hR) * heightScale;
      let ny = (hU - hD) * heightScale;
      let nz = 1.0;

      const grainScale = 0.3 * h;
      nx += (hash(x * 0.37, y * 0.51) - 0.5) * grainScale;
      ny += (hash(x * 0.61, y * 0.29) - 0.5) * grainScale;

      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= nl; ny /= nl; nz /= nl;

      const diffuse = Math.max(0, nx * ld[0] + ny * ld[1] + nz * ld[2]);

      const nDotH = Math.max(0, nx * halfV[0] + ny * halfV[1] + nz * halfV[2]);
      const spec = Math.pow(nDotH, shininess);

      const light = ambientStr + diffuseStr * diffuse;

      const colVar = hash(x * 0.09, y * 0.11);
      const warmShift = (smoothNoise(x, y, 30) - 0.5) * 15;
      const cr = Math.min(255, (GOLDEN_R + warmShift * 0.8 + colVar * 12) * light + spec * specStr * 180);
      const cg = Math.min(255, (GOLDEN_G + warmShift * 0.5 + colVar * 8) * light + spec * specStr * 130);
      const cb = Math.min(255, (GOLDEN_B - warmShift * 0.3 + colVar * 5) * light + spec * specStr * 50);

      const alpha = h > 0.12 ? 255 : Math.min(255, h / 0.12 * 255);

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

// ── Canvas 2D drawing passes ──

function drawBenchSurface(ctx: OffscreenCanvasRenderingContext2D): void {
  ctx.fillStyle = '#e8e4e0';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const vig = ctx.createRadialGradient(CX, CY, SIZE * 0.3, CX, CY, SIZE * 0.72);
  vig.addColorStop(0, 'rgba(255,255,255,0.06)');
  vig.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SIZE, SIZE);

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

function drawAgarBase(ctx: OffscreenCanvasRenderingContext2D): void {
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

  const shadow = ctx.createRadialGradient(CX, CY, PLATE_R * 0.82, CX, CY, PLATE_R);
  shadow.addColorStop(0, 'rgba(0,0,0,0)');
  shadow.addColorStop(0.7, 'rgba(0,0,0,0.02)');
  shadow.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.restore();
}

function drawWetSurface(ctx: OffscreenCanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, PLATE_R, 0, Math.PI * 2);
  ctx.clip();

  const specGrad = ctx.createRadialGradient(CX - 60, CY - 80, 10, CX - 40, CY - 50, 180);
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  specGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
  specGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.01)');
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = specGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const sheen = ctx.createLinearGradient(CX - PLATE_R, CY - PLATE_R, CX + PLATE_R, CY + PLATE_R);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.025)');
  sheen.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.02)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, SIZE, SIZE);

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

function drawPlateRim(ctx: OffscreenCanvasRenderingContext2D): void {
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

// ── Orchestrator ──

function renderPlateToCanvas(): OffscreenCanvas {
  const oc = new OffscreenCanvas(SIZE, SIZE);
  const ctx = oc.getContext('2d')!;

  // Pass 0: Bench surface
  drawBenchSurface(ctx);

  // Pass 1: Blood agar base
  drawAgarBase(ctx);

  // Pass 2: Colony height map
  const hmap = new Float32Array(SIZE * SIZE);
  const streaks = generateStreaks();
  for (const s of streaks) {
    splatStreak(hmap, s);
  }
  splatConfluentZone(hmap);

  // Pass 3: PBR lighting — read agar, compute lit colonies, write back
  const agarImg = ctx.getImageData(0, 0, SIZE, SIZE);
  const outputImg = ctx.createImageData(SIZE, SIZE);
  outputImg.data.set(agarImg.data);
  applyPBRLighting(hmap, outputImg.data, agarImg.data);
  ctx.putImageData(outputImg, 0, 0);

  // Pass 4: Wet surface highlights
  drawWetSurface(ctx);

  // Pass 5: Glass plate rim
  drawPlateRim(ctx);

  return oc;
}

// ── Main entry ──

export function renderAureusPixi(container: HTMLElement): () => void {
  const app = new Application();

  const initPromise = app.init({
    width: SIZE,
    height: SIZE,
    backgroundColor: 0xe8e4e0,
    antialias: true,
  }).then(() => {
    container.appendChild(app.canvas);
    const plateCanvas = renderPlateToCanvas();
    const texture = Texture.from({ resource: plateCanvas, antialias: true });
    const sprite = new Sprite(texture);
    app.stage.addChild(sprite);
  });

  return () => {
    initPromise.then(() => app.destroy(true, true));
  };
}
