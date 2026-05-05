export const CX = 200;
export const CY = 200;
export const R = 130; // backbone radius

export function pointOnRing(angleDeg: number, r: number): { x: number; y: number } {
  const a = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0° is at top
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

export function partAnglesFor(n: number): number[] {
  const step = 360 / Math.max(n, 6); // min 6 slots to avoid crowding
  return Array.from({ length: n }, (_, i) => i * step);
}
