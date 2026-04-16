import type { BioPart, SimulationResult } from './types';

const MAX_PASSES = 5;

export function simulate(
  strand: (BioPart | null)[],
  signals: Record<string, boolean>,
): SimulationResult {
  // Iterative convergence: re-evaluate until protein set stabilizes
  let proteins = evaluateStrand(strand, signals, new Set());

  for (let i = 0; i < MAX_PASSES; i++) {
    const produced = new Set(
      Object.entries(proteins)
        .filter(([, amount]) => amount > 0)
        .map(([name]) => name),
    );

    const needsReevaluation = strand.some(
      p =>
        p?.category === 'promoter' &&
        ((p.repressedBy && produced.has(p.repressedBy)) ||
          (p.activatedBy && produced.has(p.activatedBy))),
    );

    if (!needsReevaluation) break;

    const next = evaluateStrand(strand, signals, produced);
    if (JSON.stringify(next) === JSON.stringify(proteins)) break;
    proteins = next;
  }

  // Split GFP complementation: both halves needed for functional GFP
  const gfpN = proteins['GFP-N'] ?? 0;
  const gfpC = proteins['GFP-C'] ?? 0;
  if (gfpN > 0 && gfpC > 0) {
    proteins['GFP'] = (proteins['GFP'] ?? 0) + Math.min(gfpN, gfpC);
  }

  return computeResult(proteins);
}

function computeResult(proteins: Record<string, number>): SimulationResult {
  const gfp = proteins['GFP'] ?? 0;
  const rfp = proteins['RFP'] ?? 0;
  let glowColor: string | null = null;
  let glowIntensity = 0;

  if (gfp > 0 && rfp > 0) {
    glowColor = '#eab308';
    glowIntensity = Math.min((gfp + rfp) / 8, 1);
  } else if (gfp > 0) {
    glowColor = '#22c55e';
    glowIntensity = Math.min(gfp / 6, 1);
  } else if (rfp > 0) {
    glowColor = '#ef4444';
    glowIntensity = Math.min(rfp / 6, 1);
  }

  return { proteins, glowColor, glowIntensity };
}

function evaluateStrand(
  strand: (BioPart | null)[],
  signals: Record<string, boolean>,
  knownProteins: Set<string>,
): Record<string, number> {
  const proteins: Record<string, number> = {};
  let active: { strength: number; on: boolean } | null = null;

  for (const part of strand) {
    if (!part) continue;

    switch (part.category) {
      case 'promoter': {
        const strength = part.strength ?? 2;
        const signalActive = part.signal ? signals[part.signal] === true : true;
        const repressed = part.repressedBy ? knownProteins.has(part.repressedBy) : false;
        const activated = part.activatedBy ? knownProteins.has(part.activatedBy) : true;
        active = { strength, on: signalActive && !repressed && activated };
        break;
      }
      case 'gene': {
        if (active?.on && part.product) {
          proteins[part.product] = (proteins[part.product] ?? 0) + active.strength;
        }
        break;
      }
      case 'terminator': {
        active = null;
        break;
      }
    }
  }

  return proteins;
}
