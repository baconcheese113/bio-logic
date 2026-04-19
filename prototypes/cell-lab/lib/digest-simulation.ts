/**
 * Compute fragment sizes produced by cutting a linear DNA molecule
 * at the given positions.
 */
export function computeFragments(totalLength: number, cutPositions: number[]): number[] {
  if (cutPositions.length === 0) return [totalLength];
  const sorted = [...cutPositions].sort((a, b) => a - b);
  const fragments: number[] = [];
  let prev = 0;
  for (const pos of sorted) {
    if (pos > prev && pos < totalLength) {
      fragments.push(pos - prev);
      prev = pos;
    }
  }
  fragments.push(totalLength - prev);
  return fragments.sort((a, b) => a - b);
}
