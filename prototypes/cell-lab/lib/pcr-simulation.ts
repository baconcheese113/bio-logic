import type { PlasmidMap, PcrResult } from './lab-types';

/** Minimum primer length for viable amplification */
const MIN_PRIMER_LENGTH = 16;
/** Maximum primer length */
const MAX_PRIMER_LENGTH = 30;

/** GC content of a sequence (simplified: use position-based approximation) */
export function estimateGc(start: number, length: number, totalLength: number): number {
  // Vary GC by position to make some regions harder to design primers for
  const pos = start / totalLength;
  const base = 0.45 + 0.15 * Math.sin(pos * Math.PI * 4);
  return Math.round(base * 100) / 100;
}

/** Estimate melting temperature from length and GC content */
export function estimateTm(length: number, gc: number): number {
  // Simplified Wallace rule for short oligos, adjusted
  if (length <= 20) {
    return 2 * (length * (1 - gc)) + 4 * (length * gc);
  }
  // Longer primers: salt-adjusted
  return 64.9 + 41 * (gc - 0.168);
}

export interface PrimerPlacement {
  /** Start position on linear map (bp from 5') */
  position: number;
  /** Primer length in bases */
  length: number;
}

export function runPcr(
  plasmid: PlasmidMap,
  forward: PrimerPlacement,
  reverse: PrimerPlacement,
): PcrResult {
  // Validate primer lengths
  if (forward.length < MIN_PRIMER_LENGTH || reverse.length < MIN_PRIMER_LENGTH) {
    return { bandSize: null, failReason: 'Primer too short — no amplification' };
  }
  if (forward.length > MAX_PRIMER_LENGTH || reverse.length > MAX_PRIMER_LENGTH) {
    return { bandSize: null, failReason: 'Primer too long — nonspecific binding' };
  }

  // Validate Tm range (55-65°C)
  const fwdGc = estimateGc(forward.position, forward.length, plasmid.totalLength);
  const revGc = estimateGc(reverse.position, reverse.length, plasmid.totalLength);
  const fwdTm = estimateTm(forward.length, fwdGc);
  const revTm = estimateTm(reverse.length, revGc);

  if (fwdTm < 50 || revTm < 50) {
    return { bandSize: null, failReason: 'Tm too low — primers won\'t anneal' };
  }

  // Forward must be upstream of reverse
  if (forward.position >= reverse.position) {
    return { bandSize: null, failReason: 'Primers face wrong direction — no product' };
  }

  // Compute amplified region size (distance between primer start positions)
  const bandSize = reverse.position - forward.position;

  // Sanity check: band must be reasonable (50 bp - 10000 bp)
  if (bandSize < 50) {
    return { bandSize: null, failReason: 'Primers too close — no viable product' };
  }
  if (bandSize > 10000) {
    return { bandSize: null, failReason: 'Product too large for standard PCR' };
  }

  return { bandSize };
}
