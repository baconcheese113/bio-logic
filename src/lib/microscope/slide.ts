import type { Organism, SampleBackground } from '../../data/organisms';

// Seeded random number generator (replaces Phaser.Math.RND)
class SeededRNG {
  private seed: number;

  constructor(seed: string[]) {
    // Convert seed array to number using simple hash
    this.seed = seed.reduce((acc, str) => {
      for (let i = 0; i < str.length; i++) {
        acc = ((acc << 5) - acc + str.charCodeAt(i)) | 0;
      }
      return acc;
    }, 0);
  }

  private next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) | 0;
    return (this.seed >>> 0) / 4294967296;
  }

  floatBetween(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  between(min: number, max: number): number {
    return Math.floor(this.floatBetween(min, max + 1));
  }
}

// Base position interface for items with x, y coordinates
interface Position {
  x: number;
  y: number;
}

// Items that are generated from polar coordinates (stored for reference but not needed for rendering)
interface PolarPosition extends Position {
  angle: number;
  distance: number;
}

interface BloodCell extends PolarPosition {
  radius: number;
  zDepth: number;
  irregularity: number;
}

interface EpithelialCell extends PolarPosition {
  width: number;
  height: number;
  rotation: number;
  zDepth: number;
  nucleusOffset: { x: number; y: number };
}

interface FecalParticle extends PolarPosition {
  size: number;
  shape: 'fiber' | 'chunk' | 'fragment';
  rotation: number;
  zDepth: number;
  color: number; // Brownish variations
}

interface PusCell extends PolarPosition {
  radius: number;
  zDepth: number;
  nuclei: number; // Multi-lobed neutrophils
  opacity: number;
}

interface Debris extends PolarPosition {
  size: number;
  opacity: number;
  zDepth: number;
}

interface Bubble extends PolarPosition {
  radius: number;
  zDepth: number;
}

interface StainPrecipitate extends PolarPosition {
  size: number;
  opacity: number;
  zDepth: number;
}

interface StainSmear {
  startAngle: number;
  startDistance: number;
  startX: number;
  startY: number;
  angle: number;
  length: number;
  width: number;
  opacity: number;
  colorIndex: number;
  zDepth: number;
}

interface StainResidue extends PolarPosition {
  size: number;
  opacity: number;
  colorIndex: number;
  zDepth: number;
}

// Bacteria data structures - using composition to reduce duplication
interface Coccus extends Position {
  sizeVariation: number;
}

interface Bacillus extends Position {
  orientation: number;
  zDepth: number;
  stainVariation: number;
  width: number;
  length: number;
}

interface BacteriaGroup extends Position {
  zDepth: number;
  stainVariation: number;
  orientation: number;
}

interface BacteriaChain extends BacteriaGroup {
  cocci: Coccus[];
}

interface BacteriaCluster extends BacteriaGroup {
  cocci: Coccus[];
}

interface BacteriaPair extends BacteriaGroup {
  sizeVariation: number;
}

interface BacteriaBacilliChain extends Position {
  orientation: number;
  bacilli: Bacillus[];
}

interface BacteriaPalisadeGroup extends Position {
  bacilli: Bacillus[];
}

interface BacteriaData {
  chains: BacteriaChain[];
  clusters: BacteriaCluster[];
  pairs: BacteriaPair[];
  bacilli: Bacillus[];
  bacilliChains: BacteriaBacilliChain[];
  palisades: BacteriaPalisadeGroup[];
  coccobacilli: Bacillus[];
}

/**
 * Represents a microscope slide with pre-generated random positions
 * for background cells, bacteria, and artifacts. Uses seeded RNG for consistency.
 */
export class Slide {
  private rng!: SeededRNG;
  
  public readonly bloodCells: BloodCell[] = [];
  public readonly epithelialCells: EpithelialCell[] = [];
  public readonly fecalParticles: FecalParticle[] = [];
  public readonly pusCells: PusCell[] = [];
  public readonly debris: Debris[] = [];
  public readonly bubbles: Bubble[] = [];
  public readonly stainPrecipitates: StainPrecipitate[] = [];
  public readonly stainSmears: StainSmear[] = [];
  public readonly stainResidues: StainResidue[] = [];
  public readonly bacteria: BacteriaData = {
    chains: [],
    clusters: [],
    pairs: [],
    bacilli: [],
    bacilliChains: [],
    palisades: [],
    coccobacilli: [],
  };

  constructor(
    private readonly caseIndex: number,
    private readonly centerX: number,
    private readonly centerY: number,
    private readonly radius: number,
    private readonly hasStain: boolean,
    organism?: Organism,
    sampleBackground: SampleBackground = 'blood-cells',
    private readonly variationSeed: number = 0
  ) {
    // Generate appropriate background based on sample type
    switch (sampleBackground) {
      case 'blood-cells':
        this.generateBloodCells();
        break;
      case 'epithelial-cells':
        this.generateEpithelialCells();
        break;
      case 'fecal-matter':
        this.generateFecalMatter();
        break;
      case 'pus-cells':
        this.generatePusCells();
        break;
      case 'clear-fluid':
        this.generateClearFluid();
        break;
    }
    
    this.generateArtifacts();
    if (organism) {
      this.generateBacteria(organism);
    }
  }

  private generateBloodCells(): void {
    // Seed specifically for blood cells
    this.rng = new SeededRNG([this.caseIndex.toString(), 'blood']);

    for (let i = 0; i < 200; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 40);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = this.rng.between(28, 35);
      const zDepth = this.rng.floatBetween(-9, 9);
      const irregularity = this.rng.floatBetween(0.9, 1.1);

      this.bloodCells.push({ angle, distance, x, y, radius, zDepth, irregularity });
    }
  }

  private generateEpithelialCells(): void {
    // Seed for epithelial cells
    this.rng = new SeededRNG([this.caseIndex.toString(), 'epithelial']);

    // Fewer, larger cells than red blood cells
    for (let i = 0; i < 40; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 50);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const width = this.rng.floatBetween(60, 90);
      const height = this.rng.floatBetween(40, 70);
      const rotation = this.rng.floatBetween(0, Math.PI * 2);
      const zDepth = this.rng.floatBetween(-8, 8);
      const nucleusOffset = {
        x: this.rng.floatBetween(-10, 10),
        y: this.rng.floatBetween(-8, 8),
      };

      this.epithelialCells.push({ angle, distance, x, y, width, height, rotation, zDepth, nucleusOffset });
    }
  }

  private generateFecalMatter(): void {
    // Seed for fecal particles
    this.rng = new SeededRNG([this.caseIndex.toString(), 'fecal']);

    // Mix of fibers, chunks, and fragments
    for (let i = 0; i < 80; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 30);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const size = this.rng.floatBetween(10, 40);
      const shapeRoll = this.rng.floatBetween(0, 1);
      const shape: 'fiber' | 'chunk' | 'fragment' = 
        shapeRoll < 0.4 ? 'fiber' : shapeRoll < 0.7 ? 'chunk' : 'fragment';
      const rotation = this.rng.floatBetween(0, Math.PI * 2);
      const zDepth = this.rng.floatBetween(-7, 7);
      const color = 
        (this.rng.between(120, 180) << 16) |
        (this.rng.between(80, 120) << 8) |
        this.rng.between(40, 80);

      this.fecalParticles.push({ angle, distance, x, y, size, shape, rotation, zDepth, color });
    }
  }

  private generatePusCells(): void {
    // Seed for pus cells (neutrophils)
    this.rng = new SeededRNG([this.caseIndex.toString(), 'pus']);

    for (let i = 0; i < 120; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 35);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = this.rng.floatBetween(35, 45);
      const zDepth = this.rng.floatBetween(-8, 8);
      const nuclei = this.rng.between(2, 5); // Multi-lobed nuclei
      const opacity = this.rng.floatBetween(0.7, 1.0);

      this.pusCells.push({ angle, distance, x, y, radius, zDepth, nuclei, opacity });
    }
  }

  private generateClearFluid(): void {
    // Seed for clear fluid (minimal cells)
    this.rng = new SeededRNG([this.caseIndex.toString(), 'clear']);

    // Very few cells - CSF and urine are normally nearly cell-free
    for (let i = 0; i < 5; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 40);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = this.rng.between(30, 40);
      const zDepth = this.rng.floatBetween(-5, 5);
      const irregularity = this.rng.floatBetween(0.9, 1.1);

      // Reuse bloodCells array for the few cells present
      this.bloodCells.push({ angle, distance, x, y, radius, zDepth, irregularity });
    }
  }

  private generateArtifacts(): void {
    // Debris uses variation seed to randomize on focus change
    this.rng = new SeededRNG([this.caseIndex.toString(), 'debris', this.variationSeed.toString()]);

    // Debris particles - increased count for more prevalence
    const debrisCount = this.rng.between(15, 25);
    for (let i = 0; i < debrisCount; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 30);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const size = this.rng.floatBetween(1, 3);
      const opacity = this.rng.floatBetween(0.2, 0.5);
      const zDepth = this.rng.floatBetween(-5, 5);

      this.debris.push({ angle, distance, x, y, size, opacity, zDepth });
    }

    // Other artifacts (bubbles, stain artifacts) use stable seed - don't randomize on focus change
    this.rng = new SeededRNG([this.caseIndex.toString(), 'artifacts']);

    // Air bubbles
    const bubbleCount = this.rng.between(2, 4);
    for (let i = 0; i < bubbleCount; i++) {
      const angle = this.rng.floatBetween(0, Math.PI * 2);
      const distance = this.rng.floatBetween(0, this.radius - 50);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = this.rng.floatBetween(8, 20);
      const zDepth = this.rng.floatBetween(-4, 4);

      this.bubbles.push({ angle, distance, x, y, radius, zDepth });
    }

    // Stain artifacts (only if stained)
    if (this.hasStain) {
      // Stain precipitate crystals
      const precipCount = this.rng.between(5, 10);
      for (let i = 0; i < precipCount; i++) {
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const distance = this.rng.floatBetween(0, this.radius - 20);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const size = this.rng.floatBetween(2, 5);
        const opacity = this.rng.floatBetween(0.3, 0.6);
        const zDepth = this.rng.floatBetween(-4, 4);

        this.stainPrecipitates.push({ angle, distance, x, y, size, opacity, zDepth });
      }

      // Stain smears
      const smearCount = this.rng.between(3, 6);
      for (let i = 0; i < smearCount; i++) {
        const startAngle = this.rng.floatBetween(0, Math.PI * 2);
        const startDistance = this.rng.floatBetween(0, this.radius - 80);
        const startX = this.centerX + startDistance * Math.cos(startAngle);
        const startY = this.centerY + startDistance * Math.sin(startAngle);
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const length = this.rng.floatBetween(20, 60);
        const width = this.rng.floatBetween(1, 3);
        const opacity = this.rng.floatBetween(0.1, 0.3);
        const colorIndex = this.rng.between(0, 1);
        const zDepth = this.rng.floatBetween(-3, 3);

        this.stainSmears.push({
          startAngle,
          startDistance,
          startX,
          startY,
          angle,
          length,
          width,
          opacity,
          colorIndex,
          zDepth,
        });
      }

      // Background stain residue
      const residueCount = this.rng.between(8, 12);
      for (let i = 0; i < residueCount; i++) {
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const distance = this.rng.floatBetween(0, this.radius - 10);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const size = this.rng.floatBetween(5, 15);
        const opacity = this.rng.floatBetween(0.02, 0.08);
        const colorIndex = this.rng.between(0, 1);
        const zDepth = this.rng.floatBetween(-3, 3);

        this.stainResidues.push({ angle, distance, x, y, size, opacity, colorIndex, zDepth });
      }
    }
  }

  private generateBacteria(organism: Organism): void {
    // Seed specifically for bacteria (use same seed as original implementation)
    this.rng = new SeededRNG([this.caseIndex.toString(), '999']);

    if (organism.shape === 'cocci' && organism.arrangement === 'chains') {
      // Streptococcus: cocci in chains
      const chainCount = this.rng.between(5, 6);
      for (let chain = 0; chain < chainCount; chain++) {
        const startAngle = this.rng.floatBetween(0, Math.PI * 2);
        const startDistance = this.rng.floatBetween(0, this.radius - 60);
        const x = this.centerX + startDistance * Math.cos(startAngle);
        const y = this.centerY + startDistance * Math.sin(startAngle);
        const chainAngle = this.rng.between(0, 360);
        const chainLength = this.rng.between(6, 12);
        const zDepth = this.rng.floatBetween(-3, 3);
        const stainVariation = this.rng.floatBetween(0.6, 1.0);
        const orientation = (chainAngle * Math.PI) / 180;

        const cocci: Coccus[] = [];
        for (let i = 0; i < chainLength; i++) {
          const spacing = 3.5;
          const coccusX = x + i * spacing * Math.cos(orientation);
          const coccusY = y + i * spacing * Math.sin(orientation);
          const sizeVariation = this.rng.floatBetween(0.85, 1.15);
          cocci.push({ x: coccusX, y: coccusY, sizeVariation });
        }

        this.bacteria.chains.push({ x, y, zDepth, stainVariation, orientation, cocci });
      }
    } else if (organism.shape === 'cocci' && organism.arrangement === 'clusters') {
      // Staphylococcus: cocci in clusters
      const clusterCount = this.rng.between(4, 6);
      for (let cluster = 0; cluster < clusterCount; cluster++) {
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const distance = this.rng.floatBetween(0, this.radius - 60);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const zDepth = this.rng.floatBetween(-3, 3);
        const stainVariation = this.rng.floatBetween(0.6, 1.0);

        const numCocci = this.rng.between(8, 15);
        const cocci: Coccus[] = [];
        for (let i = 0; i < numCocci; i++) {
          const clusterAngle = this.rng.floatBetween(0, Math.PI * 2);
          const clusterRadius = this.rng.floatBetween(0, 8);
          const coccusX = x + clusterRadius * Math.cos(clusterAngle);
          const coccusY = y + clusterRadius * Math.sin(clusterAngle);
          const sizeVariation = this.rng.floatBetween(0.85, 1.15);
          cocci.push({ x: coccusX, y: coccusY, sizeVariation });
        }

        this.bacteria.clusters.push({ x, y, zDepth, stainVariation, orientation: 0, cocci });
      }
    } else if (organism.shape === 'diplococci' && organism.arrangement === 'pairs') {
      // Neisseria: cocci in pairs
      const pairCount = this.rng.between(6, 10);
      for (let pair = 0; pair < pairCount; pair++) {
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const distance = this.rng.floatBetween(0, this.radius - 60);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const orientation = this.rng.floatBetween(0, Math.PI * 2);
        const zDepth = this.rng.floatBetween(-3, 3);
        const stainVariation = this.rng.floatBetween(0.6, 1.0);
        const sizeVariation = this.rng.floatBetween(0.85, 1.15);

        this.bacteria.pairs.push({ x, y, zDepth, stainVariation, orientation, sizeVariation });
      }
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'single') {
      // Single rod-shaped bacteria
      const bacillusCount = this.rng.between(8, 12);
      for (let bacillus = 0; bacillus < bacillusCount; bacillus++) {
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const distance = this.rng.floatBetween(0, this.radius - 60);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const orientation = this.rng.floatBetween(0, Math.PI * 2);
        const zDepth = this.rng.floatBetween(-3, 3);
        const stainVariation = this.rng.floatBetween(0.6, 1.0);
        const width = 1;
        const length = this.rng.between(3, 6);

        this.bacteria.bacilli.push({ x, y, orientation, zDepth, stainVariation, width, length });
      }
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'chains') {
      // Bacillus anthracis - bacilli in chains
      const chainCount = this.rng.between(3, 5);
      for (let chain = 0; chain < chainCount; chain++) {
        const chainAngle = this.rng.floatBetween(0, Math.PI * 2);
        const chainDistance = this.rng.floatBetween(0, this.radius - 70);
        const x = this.centerX + chainDistance * Math.cos(chainAngle);
        const y = this.centerY + chainDistance * Math.sin(chainAngle);
        const orientation = this.rng.floatBetween(0, Math.PI * 2);
        const bacilliInChain = this.rng.between(4, 8);

        const bacilli: Bacillus[] = [];
        for (let i = 0; i < bacilliInChain; i++) {
          const bacillusX = x + i * 4 * Math.cos(orientation);
          const bacillusY = y + i * 4 * Math.sin(orientation);
          const zDepth = this.rng.floatBetween(-3, 3);
          const stainVariation = this.rng.floatBetween(0.7, 1.0);
          const width = 1.8;
          const length = 5;
          bacilli.push({ x: bacillusX, y: bacillusY, orientation, zDepth, stainVariation, width, length });
        }

        this.bacteria.bacilliChains.push({ x, y, orientation, bacilli });
      }
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'palisades') {
      // Corynebacterium - club-shaped bacilli in palisades
      const groupCount = this.rng.between(5, 8);
      for (let group = 0; group < groupCount; group++) {
        const groupAngle = this.rng.floatBetween(0, Math.PI * 2);
        const groupDistance = this.rng.floatBetween(0, this.radius - 60);
        const x = this.centerX + groupDistance * Math.cos(groupAngle);
        const y = this.centerY + groupDistance * Math.sin(groupAngle);

        const bacilliInGroup = this.rng.between(3, 6);
        const bacilli: Bacillus[] = [];

        for (let i = 0; i < bacilliInGroup; i++) {
          const offsetAngle = this.rng.floatBetween(-Math.PI / 4, Math.PI / 4) + (i * Math.PI) / 6;
          const offsetX = i * 2 * Math.cos(offsetAngle);
          const offsetY = i * 2 * Math.sin(offsetAngle);
          const bacillusX = x + offsetX;
          const bacillusY = y + offsetY;
          const orientation = this.rng.floatBetween(0, Math.PI * 2);
          const zDepth = this.rng.floatBetween(-3, 3);
          const stainVariation = this.rng.floatBetween(0.7, 1.0);
          const width = 0.8;
          const length = 4;
          bacilli.push({ x: bacillusX, y: bacillusY, orientation, zDepth, stainVariation, width, length });
        }

        this.bacteria.palisades.push({ x, y, bacilli });
      }
    } else if (organism.shape === 'coccobacilli') {
      // Short oval bacteria
      const count = this.rng.between(12, 18);
      for (let i = 0; i < count; i++) {
        const angle = this.rng.floatBetween(0, Math.PI * 2);
        const distance = this.rng.floatBetween(0, this.radius - 50);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const orientation = this.rng.floatBetween(0, Math.PI * 2);
        const zDepth = this.rng.floatBetween(-3, 3);
        const stainVariation = this.rng.floatBetween(0.7, 1.0);
        const width = 1.0;
        const length = 2.0;

        this.bacteria.coccobacilli.push({ x, y, orientation, zDepth, stainVariation, width, length });
      }
    }
  }
}
