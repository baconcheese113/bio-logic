export function hashInts(...values: number[]): number {
  let hash = 2166136261 >>> 0;
  for (const value of values) {
    hash ^= value >>> 0;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function splitmix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let value = state;
    value ^= value >>> 16;
    value = Math.imul(value, 0x21f0aaad) >>> 0;
    value ^= value >>> 15;
    value = Math.imul(value, 0x735a2d97) >>> 0;
    value ^= value >>> 15;
    return (value >>> 0) / 4294967296;
  };
}

function hashFloat01(...values: number[]): number {
  return splitmix32(hashInts(...values))();
}

export function samplePoisson(lambda: number, seed: number): number {
  if (lambda <= 0) return 0;
  const random = splitmix32(seed);
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  while (product > limit && count < 32) {
    count += 1;
    product *= random();
  }
  return count - 1;
}

export function sampleRange(min: number, max: number, seed: number): number {
  return min + (max - min) * hashFloat01(seed);
}
