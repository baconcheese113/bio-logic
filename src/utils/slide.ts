import Phaser from 'phaser';
import type { Organism, SampleBackground } from '@/data/organisms';

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
    sampleBackground: SampleBackground = 'blood-cells'
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
    Phaser.Math.RND.sow([this.caseIndex.toString(), 'blood']);

    for (let i = 0; i < 200; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 40);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = Phaser.Math.Between(28, 35);
      const zDepth = Phaser.Math.FloatBetween(-9, 9);
      const irregularity = Phaser.Math.FloatBetween(0.9, 1.1);

      this.bloodCells.push({ angle, distance, x, y, radius, zDepth, irregularity });
    }
  }

  private generateEpithelialCells(): void {
    // Seed for epithelial cells
    Phaser.Math.RND.sow([this.caseIndex.toString(), 'epithelial']);

    // Fewer, larger cells than red blood cells
    for (let i = 0; i < 40; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 50);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const width = Phaser.Math.FloatBetween(60, 90);
      const height = Phaser.Math.FloatBetween(40, 70);
      const rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const zDepth = Phaser.Math.FloatBetween(-8, 8);
      const nucleusOffset = {
        x: Phaser.Math.FloatBetween(-10, 10),
        y: Phaser.Math.FloatBetween(-8, 8),
      };

      this.epithelialCells.push({ angle, distance, x, y, width, height, rotation, zDepth, nucleusOffset });
    }
  }

  private generateFecalMatter(): void {
    // Seed for fecal particles
    Phaser.Math.RND.sow([this.caseIndex.toString(), 'fecal']);

    // Mix of fibers, chunks, and fragments
    for (let i = 0; i < 80; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 30);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const size = Phaser.Math.FloatBetween(10, 40);
      const shapeRoll = Phaser.Math.FloatBetween(0, 1);
      const shape: 'fiber' | 'chunk' | 'fragment' = 
        shapeRoll < 0.4 ? 'fiber' : shapeRoll < 0.7 ? 'chunk' : 'fragment';
      const rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const zDepth = Phaser.Math.FloatBetween(-7, 7);
      const color = Phaser.Display.Color.GetColor(
        Phaser.Math.Between(120, 180),
        Phaser.Math.Between(80, 120),
        Phaser.Math.Between(40, 80)
      );

      this.fecalParticles.push({ angle, distance, x, y, size, shape, rotation, zDepth, color });
    }
  }

  private generatePusCells(): void {
    // Seed for pus cells (neutrophils)
    Phaser.Math.RND.sow([this.caseIndex.toString(), 'pus']);

    for (let i = 0; i < 120; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 35);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = Phaser.Math.FloatBetween(35, 45);
      const zDepth = Phaser.Math.FloatBetween(-8, 8);
      const nuclei = Phaser.Math.Between(2, 5); // Multi-lobed nuclei
      const opacity = Phaser.Math.FloatBetween(0.7, 1.0);

      this.pusCells.push({ angle, distance, x, y, radius, zDepth, nuclei, opacity });
    }
  }

  private generateClearFluid(): void {
    // Seed for clear fluid (minimal cells)
    Phaser.Math.RND.sow([this.caseIndex.toString(), 'clear']);

    // Very few cells - CSF and urine are normally nearly cell-free
    for (let i = 0; i < 5; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 40);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = Phaser.Math.Between(30, 40);
      const zDepth = Phaser.Math.FloatBetween(-5, 5);
      const irregularity = Phaser.Math.FloatBetween(0.9, 1.1);

      // Reuse bloodCells array for the few cells present
      this.bloodCells.push({ angle, distance, x, y, radius, zDepth, irregularity });
    }
  }

  private generateArtifacts(): void {
    // Seed for artifacts (debris, bubbles, stain artifacts)
    Phaser.Math.RND.sow([this.caseIndex.toString(), 'artifacts']);

    // Debris particles
    const debrisCount = Phaser.Math.Between(8, 15);
    for (let i = 0; i < debrisCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 30);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const size = Phaser.Math.FloatBetween(1, 3);
      const opacity = Phaser.Math.FloatBetween(0.2, 0.5);
      const zDepth = Phaser.Math.FloatBetween(-5, 5);

      this.debris.push({ angle, distance, x, y, size, opacity, zDepth });
    }

    // Air bubbles
    const bubbleCount = Phaser.Math.Between(2, 4);
    for (let i = 0; i < bubbleCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.radius - 50);
      const x = this.centerX + distance * Math.cos(angle);
      const y = this.centerY + distance * Math.sin(angle);
      const radius = Phaser.Math.FloatBetween(8, 20);
      const zDepth = Phaser.Math.FloatBetween(-4, 4);

      this.bubbles.push({ angle, distance, x, y, radius, zDepth });
    }

    // Stain artifacts (only if stained)
    if (this.hasStain) {
      // Stain precipitate crystals
      const precipCount = Phaser.Math.Between(5, 10);
      for (let i = 0; i < precipCount; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 20);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const size = Phaser.Math.FloatBetween(2, 5);
        const opacity = Phaser.Math.FloatBetween(0.3, 0.6);
        const zDepth = Phaser.Math.FloatBetween(-4, 4);

        this.stainPrecipitates.push({ angle, distance, x, y, size, opacity, zDepth });
      }

      // Stain smears
      const smearCount = Phaser.Math.Between(3, 6);
      for (let i = 0; i < smearCount; i++) {
        const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const startDistance = Phaser.Math.FloatBetween(0, this.radius - 80);
        const startX = this.centerX + startDistance * Math.cos(startAngle);
        const startY = this.centerY + startDistance * Math.sin(startAngle);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const length = Phaser.Math.FloatBetween(20, 60);
        const width = Phaser.Math.FloatBetween(1, 3);
        const opacity = Phaser.Math.FloatBetween(0.1, 0.3);
        const colorIndex = Phaser.Math.Between(0, 1);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);

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
      const residueCount = Phaser.Math.Between(8, 12);
      for (let i = 0; i < residueCount; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 10);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const size = Phaser.Math.FloatBetween(5, 15);
        const opacity = Phaser.Math.FloatBetween(0.02, 0.08);
        const colorIndex = Phaser.Math.Between(0, 1);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);

        this.stainResidues.push({ angle, distance, x, y, size, opacity, colorIndex, zDepth });
      }
    }
  }

  private generateBacteria(organism: Organism): void {
    // Seed specifically for bacteria (use same seed as original implementation)
    Phaser.Math.RND.sow([this.caseIndex.toString(), '999']);

    if (organism.shape === 'cocci' && organism.arrangement === 'chains') {
      // Streptococcus: cocci in chains
      const chainCount = Phaser.Math.Between(5, 6);
      for (let chain = 0; chain < chainCount; chain++) {
        const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const startDistance = Phaser.Math.FloatBetween(0, this.radius - 60);
        const x = this.centerX + startDistance * Math.cos(startAngle);
        const y = this.centerY + startDistance * Math.sin(startAngle);
        const chainAngle = Phaser.Math.Between(0, 360);
        const chainLength = Phaser.Math.Between(6, 12);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const stainVariation = Phaser.Math.FloatBetween(0.6, 1.0);
        const orientation = (chainAngle * Math.PI) / 180;

        const cocci: Coccus[] = [];
        for (let i = 0; i < chainLength; i++) {
          const spacing = 3.5;
          const coccusX = x + i * spacing * Math.cos(orientation);
          const coccusY = y + i * spacing * Math.sin(orientation);
          const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);
          cocci.push({ x: coccusX, y: coccusY, sizeVariation });
        }

        this.bacteria.chains.push({ x, y, zDepth, stainVariation, orientation, cocci });
      }
    } else if (organism.shape === 'cocci' && organism.arrangement === 'clusters') {
      // Staphylococcus: cocci in clusters
      const clusterCount = Phaser.Math.Between(4, 6);
      for (let cluster = 0; cluster < clusterCount; cluster++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 60);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const stainVariation = Phaser.Math.FloatBetween(0.6, 1.0);

        const numCocci = Phaser.Math.Between(8, 15);
        const cocci: Coccus[] = [];
        for (let i = 0; i < numCocci; i++) {
          const clusterAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const clusterRadius = Phaser.Math.FloatBetween(0, 8);
          const coccusX = x + clusterRadius * Math.cos(clusterAngle);
          const coccusY = y + clusterRadius * Math.sin(clusterAngle);
          const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);
          cocci.push({ x: coccusX, y: coccusY, sizeVariation });
        }

        this.bacteria.clusters.push({ x, y, zDepth, stainVariation, orientation: 0, cocci });
      }
    } else if (organism.shape === 'diplococci' && organism.arrangement === 'pairs') {
      // Neisseria: cocci in pairs
      const pairCount = Phaser.Math.Between(6, 10);
      for (let pair = 0; pair < pairCount; pair++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 60);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const orientation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const stainVariation = Phaser.Math.FloatBetween(0.6, 1.0);
        const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);

        this.bacteria.pairs.push({ x, y, zDepth, stainVariation, orientation, sizeVariation });
      }
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'single') {
      // Single rod-shaped bacteria
      const bacillusCount = Phaser.Math.Between(8, 12);
      for (let bacillus = 0; bacillus < bacillusCount; bacillus++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 60);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const orientation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const stainVariation = Phaser.Math.FloatBetween(0.6, 1.0);
        const width = 1;
        const length = Phaser.Math.Between(3, 6);

        this.bacteria.bacilli.push({ x, y, orientation, zDepth, stainVariation, width, length });
      }
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'chains') {
      // Bacillus anthracis - bacilli in chains
      const chainCount = Phaser.Math.Between(3, 5);
      for (let chain = 0; chain < chainCount; chain++) {
        const chainAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const chainDistance = Phaser.Math.FloatBetween(0, this.radius - 70);
        const x = this.centerX + chainDistance * Math.cos(chainAngle);
        const y = this.centerY + chainDistance * Math.sin(chainAngle);
        const orientation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const bacilliInChain = Phaser.Math.Between(4, 8);

        const bacilli: Bacillus[] = [];
        for (let i = 0; i < bacilliInChain; i++) {
          const bacillusX = x + i * 4 * Math.cos(orientation);
          const bacillusY = y + i * 4 * Math.sin(orientation);
          const zDepth = Phaser.Math.FloatBetween(-3, 3);
          const stainVariation = Phaser.Math.FloatBetween(0.7, 1.0);
          const width = 1.8;
          const length = 5;
          bacilli.push({ x: bacillusX, y: bacillusY, orientation, zDepth, stainVariation, width, length });
        }

        this.bacteria.bacilliChains.push({ x, y, orientation, bacilli });
      }
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'palisades') {
      // Corynebacterium - club-shaped bacilli in palisades
      const groupCount = Phaser.Math.Between(5, 8);
      for (let group = 0; group < groupCount; group++) {
        const groupAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const groupDistance = Phaser.Math.FloatBetween(0, this.radius - 60);
        const x = this.centerX + groupDistance * Math.cos(groupAngle);
        const y = this.centerY + groupDistance * Math.sin(groupAngle);

        const bacilliInGroup = Phaser.Math.Between(3, 6);
        const bacilli: Bacillus[] = [];

        for (let i = 0; i < bacilliInGroup; i++) {
          const offsetAngle = Phaser.Math.FloatBetween(-Math.PI / 4, Math.PI / 4) + (i * Math.PI) / 6;
          const offsetX = i * 2 * Math.cos(offsetAngle);
          const offsetY = i * 2 * Math.sin(offsetAngle);
          const bacillusX = x + offsetX;
          const bacillusY = y + offsetY;
          const orientation = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const zDepth = Phaser.Math.FloatBetween(-3, 3);
          const stainVariation = Phaser.Math.FloatBetween(0.7, 1.0);
          const width = 0.8;
          const length = 4;
          bacilli.push({ x: bacillusX, y: bacillusY, orientation, zDepth, stainVariation, width, length });
        }

        this.bacteria.palisades.push({ x, y, bacilli });
      }
    } else if (organism.shape === 'coccobacilli') {
      // Short oval bacteria
      const count = Phaser.Math.Between(12, 18);
      for (let i = 0; i < count; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 50);
        const x = this.centerX + distance * Math.cos(angle);
        const y = this.centerY + distance * Math.sin(angle);
        const orientation = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const stainVariation = Phaser.Math.FloatBetween(0.7, 1.0);
        const width = 1.0;
        const length = 2.0;

        this.bacteria.coccobacilli.push({ x, y, orientation, zDepth, stainVariation, width, length });
      }
    }
  }
}
