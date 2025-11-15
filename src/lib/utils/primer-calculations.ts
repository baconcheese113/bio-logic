// Primer design quality calculation algorithms

import type { PrimerDesign, PrimerQuality } from '../../data/organisms';

/**
 * Calculate melting temperature (Tm) using basic formula
 * For more accuracy, could use nearest-neighbor method (SantaLucia 1998)
 */
export function calculateTm(sequence: string): number {
  const length = sequence.length;
  const gc = (sequence.match(/[GC]/gi) || []).length;
  
  // Basic Tm formula: Tm = 64.9 + 41 * (G+C-16.4) / length
  // This is simplified; real calculators use nearest-neighbor thermodynamics
  const tm = 64.9 + (41 * (gc - 16.4)) / length;
  
  return Math.round(tm * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate GC content percentage
 */
export function calculateGC(sequence: string): number {
  const gc = (sequence.match(/[GC]/gi) || []).length;
  return Math.round((gc / sequence.length) * 100);
}

/**
 * Check self-complementarity between forward and reverse primers
 * Returns score 0-10 (0 = no match, 10 = high risk of primer-dimers)
 */
export function checkSelfComplementarity(forward: string, reverse: string): number {
  let maxScore = 0;
  const revComp = getReverseComplement(reverse);
  
  // Check for consecutive matches between forward and reverse complement
  for (let i = 0; i <= forward.length - 3; i++) {
    for (let j = 0; j <= revComp.length - 3; j++) {
      let score = 0;
      let k = 0;
      
      while (
        i + k < forward.length &&
        j + k < revComp.length &&
        forward[i + k] === revComp[j + k]
      ) {
        score++;
        k++;
      }
      
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }
  
  // Scale to 0-10
  return Math.min(10, maxScore);
}

/**
 * Get reverse complement of DNA sequence
 */
function getReverseComplement(sequence: string): string {
  const complement: Record<string, string> = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
    'a': 't', 't': 'a', 'g': 'c', 'c': 'g'
  };
  
  return sequence
    .split('')
    .reverse()
    .map(base => complement[base] || base)
    .join('');
}

/**
 * Detect hairpin structures within a primer
 * Hairpins form when a primer is complementary to itself (reverse complement)
 */
export function detectHairpins(sequence: string): Array<{
  primer: 'forward' | 'reverse';
  position: number;
  stemLength: number;
}> {
  const hairpins: Array<{
    primer: 'forward' | 'reverse';
    position: number;
    stemLength: number;
  }> = [];
  
  // Look for self-complementarity (hairpin potential)
  for (let i = 0; i < sequence.length - 6; i++) {
    for (let j = i + 4; j < sequence.length - 3; j++) {
      let stemLength = 0;
      let k = 0;
      
      // Check if regions are complementary
      while (
        i + k < j &&
        j + k < sequence.length &&
        isComplement(sequence[i + k], sequence[sequence.length - 1 - (j + k)])
      ) {
        stemLength++;
        k++;
      }
      
      // Hairpin detected if stem ≥ 4bp
      if (stemLength >= 4) {
        hairpins.push({
          primer: 'forward',
          position: i,
          stemLength,
        });
      }
    }
  }
  
  return hairpins;
}

function isComplement(base1: string, base2: string): boolean {
  const pairs: Record<string, string> = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
    'a': 't', 't': 'a', 'g': 'c', 'c': 'g'
  };
  return pairs[base1] === base2;
}

/**
 * Extract primer sequences from gene sequence based on design
 */
export function extractPrimerSequences(
  geneSequence: string,
  design: PrimerDesign
): { forward: string; reverse: string } {
  const forward = geneSequence.substring(
    design.forwardStart,
    design.forwardStart + design.forwardLength
  ).toUpperCase();
  
  const reverse = geneSequence.substring(
    design.reverseStart,
    design.reverseStart + design.reverseLength
  ).toUpperCase();
  
  return { forward, reverse };
}

/**
 * Evaluate overall primer quality
 */
export function evaluatePrimerQuality(
  geneSequence: string,
  design: PrimerDesign
): PrimerQuality {
  const { forward, reverse } = extractPrimerSequences(geneSequence, design);
  
  // Calculate metrics
  const forwardTm = calculateTm(forward);
  const reverseTm = calculateTm(reverse);
  const tmDifference = Math.abs(forwardTm - reverseTm);
  const tmMatch = tmDifference <= 5;
  
  const forwardGC = calculateGC(forward);
  const reverseGC = calculateGC(reverse);
  const gcContentGood = 
    forwardGC >= 40 && forwardGC <= 60 &&
    reverseGC >= 40 && reverseGC <= 60;
  
  const selfComplementarity = checkSelfComplementarity(forward, reverse);
  const selfCompGood = selfComplementarity < 4;
  
  const forwardHairpins = detectHairpins(forward);
  const reverseHairpins = detectHairpins(reverse);
  const hasHairpins = forwardHairpins.length > 0 || reverseHairpins.length > 0;
  
  const productSize = design.reverseStart - design.forwardStart + design.reverseLength;
  const productSizeGood = productSize >= 100 && productSize <= 1000;
  
  // Determine overall quality
  let overallQuality: PrimerQuality['overallQuality'];
  let canAmplify = true;
  let expectedBandPattern: PrimerQuality['expectedBandPattern'];
  
  if (hasHairpins) {
    overallQuality = 'fail';
    canAmplify = false;
    expectedBandPattern = 'none';
  } else if (!tmMatch && selfComplementarity > 6) {
    overallQuality = 'poor';
    canAmplify = false;
    expectedBandPattern = 'dimers';
  } else if (!tmMatch) {
    overallQuality = 'poor';
    canAmplify = true;
    expectedBandPattern = 'weak';
  } else if (selfComplementarity > 6) {
    overallQuality = 'poor';
    canAmplify = true;
    expectedBandPattern = 'dimers';
  } else if (!gcContentGood || !productSizeGood) {
    overallQuality = 'acceptable';
    canAmplify = true;
    expectedBandPattern = 'weak';
  } else if (tmDifference <= 2 && selfComplementarity <= 2) {
    overallQuality = 'excellent';
    canAmplify = true;
    expectedBandPattern = 'clean';
  } else {
    overallQuality = 'good';
    canAmplify = true;
    expectedBandPattern = 'clean';
  }
  
  return {
    forwardTm,
    reverseTm,
    tmMatch,
    tmDifference,
    forwardGC,
    reverseGC,
    gcContentGood,
    selfComplementarity,
    selfCompGood,
    hasHairpins,
    hairpinDetails: [...forwardHairpins, ...reverseHairpins],
    productSize,
    productSizeGood,
    overallQuality,
    canAmplify,
    expectedBandPattern,
  };
}
