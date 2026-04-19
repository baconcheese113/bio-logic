import type { AssemblyRead } from './lab-types';

/** Find the length of the longest suffix of `a` that matches a prefix of `b`, with minimum `minK`. */
export function findOverlap(a: string, b: string, minK: number): number {
  const maxCheck = Math.min(a.length, b.length);
  for (let k = maxCheck; k >= minK; k--) {
    if (a.slice(-k) === b.slice(0, k)) return k;
  }
  return 0;
}

/** Generate overlapping reads from a full sequence. */
export function generateReads(
  fullSequence: string,
  readLength: number,
  overlapK: number,
  seed: number = 42,
): AssemblyRead[] {
  const reads: AssemblyRead[] = [];
  let pos = 0;
  let id = 0;

  // Simple deterministic PRNG for jittering read starts
  let rng = seed;
  function nextRand(): number {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  }

  while (pos < fullSequence.length) {
    const end = Math.min(pos + readLength, fullSequence.length);
    reads.push({ id: `read-${id}`, sequence: fullSequence.slice(pos, end) });
    id++;
    // Advance by readLength minus overlap, with slight jitter
    const step = readLength - overlapK - Math.floor(nextRand() * 4);
    pos += Math.max(step, overlapK + 1);
  }

  // Ensure last read covers the end
  const lastRead = reads[reads.length - 1];
  if (lastRead.sequence.length < overlapK + 2) {
    // Last read too short — extend the previous one to cover
    reads.pop();
  }

  return reads;
}

/** Shuffle an array deterministically using a seed. */
export function shuffleReads(reads: AssemblyRead[], seed: number = 7): AssemblyRead[] {
  const arr = [...reads];
  let rng = seed;
  function nextRand(): number {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Check if an ordered list of reads correctly assembles to the target sequence. */
export function validateAssembly(
  placedReads: AssemblyRead[],
  fullSequence: string,
  minK: number,
): boolean {
  if (placedReads.length === 0) return false;
  let assembled = placedReads[0].sequence;
  for (let i = 1; i < placedReads.length; i++) {
    const overlap = findOverlap(assembled, placedReads[i].sequence, minK);
    if (overlap === 0) return false;
    assembled += placedReads[i].sequence.slice(overlap);
  }
  return assembled === fullSequence;
}

/** Build the assembled contig string from an ordered list of reads. */
export function buildContig(placedReads: AssemblyRead[], minK: number): string {
  if (placedReads.length === 0) return '';
  let contig = placedReads[0].sequence;
  for (let i = 1; i < placedReads.length; i++) {
    const overlap = findOverlap(contig, placedReads[i].sequence, minK);
    if (overlap === 0) {
      contig += '???' + placedReads[i].sequence;
    } else {
      contig += placedReads[i].sequence.slice(overlap);
    }
  }
  return contig;
}
