import Phaser from 'phaser';
import { CASES, ORGANISMS, type Organism } from '@/data/organisms';

export class LabScene extends Phaser.Scene {
  private currentCase = CASES[Phaser.Math.Between(0, CASES.length - 1)];
  private currentOrganism: Organism | undefined;
  private selectedDiagnosis: string | null = null;
  private selectedOrganism: Organism | null = null;
  private currentStain: 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore' = 'none';
  private microscopeContainer: Phaser.GameObjects.Container | null = null;
  private floatingDust: Phaser.GameObjects.Graphics[] = [];
  private apertureVignette: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'LabScene' });
  }

  create() {
    this.currentOrganism = ORGANISMS.find((o) => o.id === this.currentCase.organismId);

    // Background
    this.add.rectangle(0, 0, 1280, 720, 0x2d2d2d).setOrigin(0);

    // Title
    this.add
      .text(640, 30, 'BioLogic Laboratory - 1920s Era', {
        fontSize: '24px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Case info
    this.add
      .text(640, 70, this.currentCase.title, {
        fontSize: '18px',
        color: '#ffd700',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    this.add
      .text(640, 100, this.currentCase.story, {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'Courier New',
        wordWrap: { width: 800 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Microscope viewer area
    this.createMicroscopeViewer();

    // Staining controls
    this.createStainingControls();

    // Reference manual
    this.createReferenceManual();

    // Diagnosis submission
    this.createDiagnosisInterface();
  }

  private createStainingControls() {
    const buttonX = 160;
    const buttonY = 655;
    const buttonSpacing = 120;

    const stains: Array<{ label: string; type: 'gram' | 'acid-fast' | 'capsule' | 'spore' }> = [
      { label: 'Gram Stain', type: 'gram' },
      { label: 'Acid-Fast', type: 'acid-fast' },
      { label: 'Capsule Stain', type: 'capsule' },
      { label: 'Spore Stain', type: 'spore' },
    ];

    stains.forEach((stain, index) => {
      const x = buttonX + index * buttonSpacing;
      const button = this.add
        .rectangle(x, buttonY, 110, 35, 0x4a3a2a)
        .setName(`stainButton_${stain.type}`);
      const buttonText = this.add
        .text(x, buttonY, stain.label, {
          fontSize: '11px',
          color: '#e0e0e0',
          fontFamily: 'Courier New',
        })
        .setOrigin(0.5)
        .setName(`stainButtonText_${stain.type}`);

      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        if (this.currentStain !== stain.type) {
          button.setFillStyle(0x6a5a4a);
        }
      });

      button.on('pointerout', () => {
        if (this.currentStain !== stain.type) {
          button.setFillStyle(0x4a3a2a);
        }
      });

      button.on('pointerdown', () => {
        // Reset all buttons
        stains.forEach((s) => {
          const btn = this.children.getByName(`stainButton_${s.type}`) as Phaser.GameObjects.Rectangle;
          const txt = this.children.getByName(`stainButtonText_${s.type}`) as Phaser.GameObjects.Text;
          if (btn && txt) {
            btn.setFillStyle(0x4a3a2a);
            txt.setColor('#e0e0e0');
          }
        });

        this.currentStain = stain.type;
        button.setFillStyle(0x3a7a3a);
        buttonText.setColor('#ffffff');
        this.refreshMicroscopeView();
      });
    });
  }

  private createMicroscopeViewer() {
    const viewerCenterX = 320;
    const viewerCenterY = 380;
    const viewerRadius = 180;

    // Left section background (microscope area)
    this.add.rectangle(0, 140, 640, 580, 0x1a1a1a).setOrigin(0);
    this.add.rectangle(0, 140, 640, 580).setStrokeStyle(2, 0x444444).setOrigin(0);

    // Dark background outside the eyepiece
    this.add.rectangle(120, 180, 400, 400, 0x0a0a0a).setOrigin(0);

    // Circular aperture mask using graphics
    const mask = this.make.graphics({});
    mask.fillStyle(0xffffff);
    mask.fillCircle(viewerCenterX, viewerCenterY, viewerRadius);

    // Container for microscope view content
    this.microscopeContainer = this.add.container(0, 0);

    // Light microscope background - illuminated field
    // In 1920s microscopes, the field was illuminated from below (transmitted light)
    const backgroundCircle = this.add.graphics();
    backgroundCircle.fillStyle(0xf5f0e8, 1); // Warm off-white (incandescent light color)
    backgroundCircle.fillCircle(viewerCenterX, viewerCenterY, viewerRadius);
    
    // Add slight vignetting (darkening at edges) - realistic optical effect
    const vignette = this.add.graphics();
    vignette.fillStyle(0xe8e3d8, 0.4);
    vignette.fillCircle(viewerCenterX, viewerCenterY, viewerRadius);
    vignette.fillStyle(0xd4cfc3, 0.3);
    vignette.fillCircle(viewerCenterX, viewerCenterY, viewerRadius * 0.9);

    this.microscopeContainer.add([backgroundCircle, vignette]);

    // Add optical aberrations (subtle imperfections in the optics)
    this.addOpticalAberrations(viewerCenterX, viewerCenterY, viewerRadius, this.microscopeContainer);

    // Label - updated based on staining state
    const stainLabels = {
      none: 'Microscope View - 1000x (Unstained)',
      gram: 'Microscope View - 1000x (Gram Stain)',
      'acid-fast': 'Microscope View - 1000x (Ziehl-Neelsen)',
      capsule: 'Microscope View - 1000x (Capsule Stain)',
      spore: 'Microscope View - 1000x (Spore Stain)',
    };
    const labelText = stainLabels[this.currentStain];
    this.add
      .text(viewerCenterX, 180, labelText, {
        fontSize: '14px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setName('microscopeLabel');

    // Render blood cells background
    this.renderBloodCells(viewerCenterX, viewerCenterY, viewerRadius, this.microscopeContainer);

    // Render bacteria (Streptococcus pyogenes - purple cocci in chains)
    if (this.currentOrganism) {
      this.renderBacteria(viewerCenterX, viewerCenterY, viewerRadius, this.currentOrganism, this.microscopeContainer);
    }

    // Apply circular mask
    this.microscopeContainer.setMask(mask.createGeometryMask());

    // Add dynamic aperture breathing effect
    this.createApertureBreathing(viewerCenterX, viewerCenterY, viewerRadius);

    // Add floating dust particles
    this.createFloatingDust(viewerCenterX, viewerCenterY, viewerRadius);

    // Add optical focus blur overlay
    this.addFocusBlur(viewerCenterX, viewerCenterY, viewerRadius);

    // Draw eyepiece rim (metal casing)
    const rim = this.add.graphics();
    
    // Inner rim shadow
    rim.lineStyle(2, 0x1a1a1a);
    rim.strokeCircle(viewerCenterX, viewerCenterY, viewerRadius + 1);
    
    // Main eyepiece rim (brass/metal look)
    rim.lineStyle(6, 0x3a3a3a);
    rim.strokeCircle(viewerCenterX, viewerCenterY, viewerRadius + 4);
    
    // Outer rim highlight
    // rim.lineStyle(2, 0x5a5a5a);
    // rim.strokeCircle(viewerCenterX, viewerCenterY, viewerRadius + 8);
  }

  private refreshMicroscopeView() {
    if (!this.microscopeContainer) return;

    const viewerCenterX = 320;
    const viewerCenterY = 380;
    const viewerRadius = 180;

    // Clear existing content
    this.microscopeContainer.removeAll(true);
    
    // Clear floating dust particles
    this.floatingDust.forEach(dust => dust.destroy());
    this.floatingDust = [];
    
    // Clear aperture vignette
    if (this.apertureVignette) {
      this.apertureVignette.destroy();
      this.apertureVignette = null;
    }

    // Re-render background
    const backgroundCircle = this.add.graphics();
    backgroundCircle.fillStyle(0xf5f0e8, 1);
    backgroundCircle.fillCircle(viewerCenterX, viewerCenterY, viewerRadius);
    
    const vignette = this.add.graphics();
    vignette.fillStyle(0xe8e3d8, 0.4);
    vignette.fillCircle(viewerCenterX, viewerCenterY, viewerRadius);
    vignette.fillStyle(0xd4cfc3, 0.3);
    vignette.fillCircle(viewerCenterX, viewerCenterY, viewerRadius * 0.9);

    this.microscopeContainer.add([backgroundCircle, vignette]);

    // Add optical aberrations
    this.addOpticalAberrations(viewerCenterX, viewerCenterY, viewerRadius, this.microscopeContainer);

    // Update label
    const label = this.children.getByName('microscopeLabel') as Phaser.GameObjects.Text;
    if (label) {
      label.setText('Microscope View - 1000x (Gram Stained)');
    }

    // Re-render cells and bacteria
    this.renderBloodCells(viewerCenterX, viewerCenterY, viewerRadius, this.microscopeContainer);
    if (this.currentOrganism) {
      this.renderBacteria(viewerCenterX, viewerCenterY, viewerRadius, this.currentOrganism, this.microscopeContainer);
    }
    
    // Re-add dynamic effects
    this.createApertureBreathing(viewerCenterX, viewerCenterY, viewerRadius);
    this.createFloatingDust(viewerCenterX, viewerCenterY, viewerRadius);
    this.addFocusBlur(viewerCenterX, viewerCenterY, viewerRadius);
  }

  private addOpticalAberrations(centerX: number, centerY: number, radius: number, container: Phaser.GameObjects.Container) {
    const aberrations = this.add.graphics();

    // Chromatic aberration (slight color fringing at high contrast edges)
    // Subtle blue/red fringing around the perimeter
    aberrations.lineStyle(1, 0x6666ff, 0.05);
    aberrations.strokeCircle(centerX - 1, centerY - 1, radius - 5);
    aberrations.lineStyle(1, 0xff6666, 0.05);
    aberrations.strokeCircle(centerX + 1, centerY + 1, radius - 5);

    // Subtle dust/scratches on the lens (permanent imperfections)
    for (let i = 0; i < 3; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(radius * 0.4, radius * 0.8);
      const dustX = centerX + distance * Math.cos(angle);
      const dustY = centerY + distance * Math.sin(angle);
      
      aberrations.fillStyle(0x000000, 0.08);
      aberrations.fillCircle(dustX, dustY, Phaser.Math.FloatBetween(1, 2));
    }

    container.add(aberrations);
  }

  private renderBloodCells(centerX: number, centerY: number, radius: number, container: Phaser.GameObjects.Container) {
    const graphics = this.add.graphics();

    // Draw ~20 red blood cells scattered within circular view
    // RBCs are ~7-8 micrometers, bacteria are ~1 micrometer
    // At 1000x, RBCs should be relatively large
    for (let i = 0; i < 200; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 40);
      const cellX = centerX + distance * Math.cos(angle);
      const cellY = centerY + distance * Math.sin(angle);
      const baseCellRadius = Phaser.Math.Between(28, 35); // RBCs are much larger than bacteria

      // Calculate optical defocus based on simulated z-depth
      // RBCs at different heights in the sample have different focus
      // Wide depth range: some cells extremely out of focus
      const zDepth = Phaser.Math.FloatBetween(-9, 9); // Extended range for dramatic defocus
      const defocus = this.calculateDefocus(zDepth);
      
      // Apply defocus: blur increases size and decreases opacity
      const cellRadius = baseCellRadius * defocus.sizeMultiplier;
      const fillOpacity = 0.1 * defocus.opacityMultiplier;
      const strokeOpacity = 0.3 * defocus.opacityMultiplier;

      graphics.lineStyle(defocus.blurWidth, 0xff9999, strokeOpacity);
      graphics.fillStyle(0xffcccc, fillOpacity);

      // Add slight irregularity to RBC shape (biconcave discs look irregular in 2D)
      const irregularity = Phaser.Math.FloatBetween(0.85, 1.15);
      graphics.strokeEllipse(cellX, cellY, cellRadius * irregularity, cellRadius / irregularity);
      graphics.fillEllipse(cellX, cellY, cellRadius * irregularity, cellRadius / irregularity);
    }

    container.add(graphics);

    // Add sample prep artifacts
    this.addSampleArtifacts(centerX, centerY, radius, container);
  }

  private addSampleArtifacts(centerX: number, centerY: number, radius: number, container: Phaser.GameObjects.Container) {
    const artifacts = this.add.graphics();

    // Debris particles (dust, cell fragments)
    for (let i = 0; i < Phaser.Math.Between(8, 15); i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 30);
      const debrisX = centerX + distance * Math.cos(angle);
      const debrisY = centerY + distance * Math.sin(angle);
      const debrisSize = Phaser.Math.FloatBetween(1, 3);

      artifacts.fillStyle(0xb8b4ac, Phaser.Math.FloatBetween(0.2, 0.5));
      artifacts.fillCircle(debrisX, debrisY, debrisSize);
    }

    // Stain artifacts (only if stained)
    if (this.currentStain !== 'none') {
      // Stain precipitate crystals
      for (let i = 0; i < Phaser.Math.Between(5, 10); i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, radius - 20);
        const precipX = centerX + distance * Math.cos(angle);
        const precipY = centerY + distance * Math.sin(angle);
        const precipSize = Phaser.Math.FloatBetween(2, 5);

        // Dark stain precipitate color varies by stain type
        const precipColors = {
          gram: 0x4a3366,
          'acid-fast': 0x8b0000,
          capsule: 0x2a2a4a,
          spore: 0x1a4a1a,
        };
        artifacts.fillStyle(precipColors[this.currentStain], Phaser.Math.FloatBetween(0.3, 0.6));
        artifacts.fillCircle(precipX, precipY, precipSize);
      }

      // Stain smears (streaks across the slide from staining process)
      for (let i = 0; i < Phaser.Math.Between(3, 6); i++) {
        const smearStartAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const smearDist = Phaser.Math.FloatBetween(0, radius - 80);
        const smearX = centerX + smearDist * Math.cos(smearStartAngle);
        const smearY = centerY + smearDist * Math.sin(smearStartAngle);
        const smearAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const smearLength = Phaser.Math.FloatBetween(20, 60);

        // Smear colors vary by stain type
        const smearColors = {
          gram: [0x663399, 0xff69b4],
          'acid-fast': [0xff0000, 0x0000ff],
          capsule: [0x4169e1, 0xffc0cb],
          spore: [0x228b22, 0xff6347],
        };
        const colors = smearColors[this.currentStain];
        const smearColor = colors[Phaser.Math.Between(0, colors.length - 1)];
        artifacts.lineStyle(Phaser.Math.FloatBetween(1, 3), smearColor, Phaser.Math.FloatBetween(0.1, 0.3));
        
        const endX = smearX + smearLength * Math.cos(smearAngle);
        const endY = smearY + smearLength * Math.sin(smearAngle);
        artifacts.strokeLineShape(new Phaser.Geom.Line(smearX, smearY, endX, endY));
      }

      // Background stain residue (slide wasn't perfectly washed)
      for (let i = 0; i < Phaser.Math.Between(8, 12); i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, radius - 10);
        const residueX = centerX + distance * Math.cos(angle);
        const residueY = centerY + distance * Math.sin(angle);

        const residueColor = Phaser.Math.Between(0, 1) === 0 ? 0x663399 : 0xff69b4;
        artifacts.fillStyle(residueColor, Phaser.Math.FloatBetween(0.02, 0.08));
        artifacts.fillCircle(residueX, residueY, Phaser.Math.FloatBetween(5, 15));
      }
    }

    // Air bubbles (circular with refraction-like appearance)
    for (let i = 0; i < Phaser.Math.Between(2, 4); i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 50);
      const bubbleX = centerX + distance * Math.cos(angle);
      const bubbleY = centerY + distance * Math.sin(angle);
      const bubbleRadius = Phaser.Math.FloatBetween(8, 20);

      // Darker ring (edge of bubble)
      artifacts.lineStyle(2, 0xc8c4bc, 0.4);
      artifacts.strokeCircle(bubbleX, bubbleY, bubbleRadius);
      
      // Lighter center (refraction effect)
      artifacts.fillStyle(0xffffff, 0.15);
      artifacts.fillCircle(bubbleX, bubbleY, bubbleRadius * 0.6);
    }

    container.add(artifacts);
  }

  private renderBacteria(
    centerX: number,
    centerY: number,
    radius: number,
    organism: Organism,
    container: Phaser.GameObjects.Container,
  ) {
    const graphics = this.add.graphics();

    // Determine bacteria color based on staining state and organism
    let bacteriaColor = 0xd8d4cc; // Default: unstained
    let baseOpacity = 0.25;

    if (this.currentStain === 'gram') {
      // Gram stain
      if (organism.gramStain === 'variable') {
        bacteriaColor = 0xc8c4bc; // Very pale beige (barely stains)
        baseOpacity = 0.15;
      } else if (organism.gramStain === 'positive') {
        bacteriaColor = 0x663399; // Purple
        baseOpacity = 0.8;
      } else {
        bacteriaColor = 0xff69b4; // Pink
        baseOpacity = 0.8;
      }
    } else if (this.currentStain === 'acid-fast') {
      // Ziehl-Neelsen stain (acid-fast bacteria = red, others = blue)
      if (organism.acidFast) {
        bacteriaColor = 0xff0000; // Bright red
        baseOpacity = 0.9;
      } else {
        bacteriaColor = 0x0000ff; // Blue counterstain
        baseOpacity = 0.4;
      }
    } else if (this.currentStain === 'capsule') {
      // Capsule stain (capsule = clear halo, cell = pink, background = dark)
      if (organism.capsule) {
        bacteriaColor = 0xffc0cb; // Pink cell body
        baseOpacity = 0.7;
      } else {
        bacteriaColor = 0xff69b4; // Just pink (no capsule)
        baseOpacity = 0.6;
      }
    } else if (this.currentStain === 'spore') {
      // Spore stain (spores = green, vegetative cells = red)
      bacteriaColor = 0xff6347; // Red vegetative cells
      baseOpacity = 0.6;
    }

    // Render based on morphology
    if (organism.shape === 'cocci' && organism.arrangement === 'chains') {
      this.renderCocciChains(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'cocci' && organism.arrangement === 'clusters') {
      this.renderCocciClusters(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'diplococci' && organism.arrangement === 'pairs') {
      this.renderDiplococci(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'single') {
      this.renderBacilli(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity, organism);
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'chains') {
      this.renderBacilliChains(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity, organism);
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'palisades') {
      this.renderBacilliPalisades(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'coccobacilli') {
      this.renderCoccobacilli(graphics, centerX, centerY, radius, bacteriaColor, baseOpacity, organism);
    }

    container.add(graphics);
  }

  private renderCocciChains(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
  ) {
    // Streptococcus: cocci in chains
    // Cocci ~1 micrometer, RBCs ~7-8 micrometers = 1:7 ratio
    for (let chain = 0; chain < Phaser.Math.Between(5, 6); chain++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 60);
      const startX = centerX + distance * Math.cos(angle);
      const startY = centerY + distance * Math.sin(angle);
      const chainAngle = Phaser.Math.Between(0, 360);
      const chainLength = Phaser.Math.Between(6, 12);

      const chainZDepth = Phaser.Math.FloatBetween(-3, 3);
      const chainDefocus = this.calculateDefocus(chainZDepth);
      const chainStainVariation = Phaser.Math.FloatBetween(0.6, 1.0);

      for (let i = 0; i < chainLength; i++) {
        const spacing = 3.5; // Tighter spacing for tiny bacteria
        const coccusX = startX + i * spacing * Math.cos((chainAngle * Math.PI) / 180);
        const coccusY = startY + i * spacing * Math.sin((chainAngle * Math.PI) / 180);
        
        const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);
        const baseCoccusRadius = 1.5 * sizeVariation; // Much smaller: ~1/20 of RBC diameter
        const coccusRadius = baseCoccusRadius * chainDefocus.sizeMultiplier;
        const opacity = baseOpacity * chainStainVariation * chainDefocus.opacityMultiplier;

        graphics.lineStyle(chainDefocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);
        graphics.fillCircle(coccusX, coccusY, coccusRadius);
        graphics.strokeCircle(coccusX, coccusY, coccusRadius);
      }
    }
  }

  private renderCocciClusters(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
  ) {
    // Staphylococcus: cocci in grape-like clusters
    // ~1 micrometer cocci
    for (let cluster = 0; cluster < Phaser.Math.Between(4, 6); cluster++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 60);
      const clusterCenterX = centerX + distance * Math.cos(angle);
      const clusterCenterY = centerY + distance * Math.sin(angle);

      const clusterZDepth = Phaser.Math.FloatBetween(-3, 3);
      const clusterDefocus = this.calculateDefocus(clusterZDepth);
      const clusterStainVariation = Phaser.Math.FloatBetween(0.6, 1.0);

      // Random cluster of 8-15 cocci
      const numCocci = Phaser.Math.Between(8, 15);
      for (let i = 0; i < numCocci; i++) {
        const clusterAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const clusterRadius = Phaser.Math.FloatBetween(0, 8); // Tighter clusters
        const coccusX = clusterCenterX + clusterRadius * Math.cos(clusterAngle);
        const coccusY = clusterCenterY + clusterRadius * Math.sin(clusterAngle);

        const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);
        const baseCoccusRadius = 1.5 * sizeVariation; // Much smaller
        const coccusRadius = baseCoccusRadius * clusterDefocus.sizeMultiplier;
        const opacity = baseOpacity * clusterStainVariation * clusterDefocus.opacityMultiplier;

        graphics.lineStyle(clusterDefocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);
        graphics.fillCircle(coccusX, coccusY, coccusRadius);
        graphics.strokeCircle(coccusX, coccusY, coccusRadius);
      }
    }
  }

  private renderDiplococci(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
  ) {
    // Neisseria: cocci in pairs (kidney bean shaped, facing each other)
    // Neisseria gonorrhoeae: 0.6-1.0 micrometers, RBCs: 7-8 micrometers = ~1:8 ratio
    for (let pair = 0; pair < Phaser.Math.Between(6, 10); pair++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 60);
      const pairX = centerX + distance * Math.cos(angle);
      const pairY = centerY + distance * Math.sin(angle);
      const pairAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const pairZDepth = Phaser.Math.FloatBetween(-3, 3);
      const pairDefocus = this.calculateDefocus(pairZDepth);
      const pairStainVariation = Phaser.Math.FloatBetween(0.6, 1.0);

      const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);
      const baseCoccusRadius = 1.2 * sizeVariation; // Neisseria is smaller: 0.6-1.0 µm
      const coccusRadius = baseCoccusRadius * pairDefocus.sizeMultiplier;
      const opacity = baseOpacity * pairStainVariation * pairDefocus.opacityMultiplier;

      graphics.lineStyle(pairDefocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      // Draw two cocci side by side
      const spacing = 2.5; // Very tight for tiny diplococci
      const coccus1X = pairX + spacing * Math.cos(pairAngle);
      const coccus1Y = pairY + spacing * Math.sin(pairAngle);
      const coccus2X = pairX - spacing * Math.cos(pairAngle);
      const coccus2Y = pairY - spacing * Math.sin(pairAngle);

      graphics.fillCircle(coccus1X, coccus1Y, coccusRadius);
      graphics.strokeCircle(coccus1X, coccus1Y, coccusRadius);
      graphics.fillCircle(coccus2X, coccus2Y, coccusRadius);
      graphics.strokeCircle(coccus2X, coccus2Y, coccusRadius);
    }
  }

  private renderBacilli(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
    organism: Organism,
  ) {
    // Rod-shaped bacteria (E. coli, Mycobacterium, C. tetani)
    // E. coli: ~2 µm long × 0.5 µm wide
    for (let bacillus = 0; bacillus < Phaser.Math.Between(8, 12); bacillus++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 60);
      const bacillusX = centerX + distance * Math.cos(angle);
      const bacillusY = centerY + distance * Math.sin(angle);
      const bacillusAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const bacillusZDepth = Phaser.Math.FloatBetween(-3, 3);
      const bacillusDefocus = this.calculateDefocus(bacillusZDepth);
      const bacillusStainVariation = Phaser.Math.FloatBetween(0.6, 1.0);

      // Bacilli are 2-4× longer than wide
      const baseWidth = 1; // 0.5 µm scaled
      const baseLength = Phaser.Math.Between(3, 6); // 2-3 µm scaled
      const width = baseWidth * bacillusDefocus.sizeMultiplier;
      const length = baseLength * bacillusDefocus.sizeMultiplier;
      const opacity = baseOpacity * bacillusStainVariation * bacillusDefocus.opacityMultiplier;

      graphics.lineStyle(bacillusDefocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      // Draw as rounded rectangle
      const x1 = bacillusX - (length / 2) * Math.cos(bacillusAngle);
      const y1 = bacillusY - (length / 2) * Math.sin(bacillusAngle);
      const x2 = bacillusX + (length / 2) * Math.cos(bacillusAngle);
      const y2 = bacillusY + (length / 2) * Math.sin(bacillusAngle);

      graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
      graphics.fillCircle(x1, y1, width);
      graphics.fillCircle(x2, y2, width);

      // Add terminal spore if spore stain and organism is spore former (C. tetani)
      if (this.currentStain === 'spore' && organism.sporeFormer) {
        graphics.fillStyle(0x228b22, 0.9); // Green terminal spore
        // Terminal spore at one end (drumstick appearance)
        graphics.fillCircle(x2, y2, width * 1.8);
      }
    }
  }

  private renderBacilliChains(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
    organism: Organism,
  ) {
    // Bacillus anthracis - large square-ended rods in chains (boxcar appearance)
    for (let chain = 0; chain < Phaser.Math.Between(3, 5); chain++) {
      const chainAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const chainDistance = Phaser.Math.FloatBetween(0, radius - 70);
      const chainX = centerX + chainDistance * Math.cos(chainAngle);
      const chainY = centerY + chainDistance * Math.sin(chainAngle);
      const chainOrientation = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const bacilliInChain = Phaser.Math.Between(4, 8);

      for (let i = 0; i < bacilliInChain; i++) {
        const bacillusX = chainX + i * 4 * Math.cos(chainOrientation);
        const bacillusY = chainY + i * 4 * Math.sin(chainOrientation);
        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const defocus = this.calculateDefocus(zDepth);

        const width = 1.8 * defocus.sizeMultiplier;
        const length = 5 * defocus.sizeMultiplier;
        const opacity = baseOpacity * Phaser.Math.FloatBetween(0.7, 1.0) * defocus.opacityMultiplier;

        graphics.lineStyle(defocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);

        // Square-ended rods
        const x1 = bacillusX - (length / 2) * Math.cos(chainOrientation);
        const y1 = bacillusY - (length / 2) * Math.sin(chainOrientation);
        const x2 = bacillusX + (length / 2) * Math.cos(chainOrientation);
        const y2 = bacillusY + (length / 2) * Math.sin(chainOrientation);

        graphics.fillCircle(x1, y1, width);
        graphics.fillCircle(x2, y2, width);
        graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));

        // Add spore if spore stain and organism is spore former
        if (this.currentStain === 'spore' && organism.sporeFormer) {
          graphics.fillStyle(0x228b22, 0.9); // Green spore
          const sporeX = bacillusX + (length * 0.3) * Math.cos(chainOrientation);
          const sporeY = bacillusY + (length * 0.3) * Math.sin(chainOrientation);
          graphics.fillCircle(sporeX, sporeY, width * 1.2);
        }
      }
    }
  }

  private renderBacilliPalisades(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
  ) {
    // Corynebacterium - club-shaped bacilli in palisades (Chinese letter arrangement)
    for (let group = 0; group < Phaser.Math.Between(5, 8); group++) {
      const groupAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const groupDistance = Phaser.Math.FloatBetween(0, radius - 60);
      const groupX = centerX + groupDistance * Math.cos(groupAngle);
      const groupY = centerY + groupDistance * Math.sin(groupAngle);

      const bacilliInGroup = Phaser.Math.Between(3, 6);
      for (let i = 0; i < bacilliInGroup; i++) {
        const angle = Phaser.Math.FloatBetween(-Math.PI / 4, Math.PI / 4) + (i * Math.PI) / 6;
        const offsetX = i * 2 * Math.cos(angle);
        const offsetY = i * 2 * Math.sin(angle);
        const bacillusX = groupX + offsetX;
        const bacillusY = groupY + offsetY;
        const bacillusAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

        const zDepth = Phaser.Math.FloatBetween(-3, 3);
        const defocus = this.calculateDefocus(zDepth);

        // Club-shaped: wider at one end
        const baseWidth = 0.8 * defocus.sizeMultiplier;
        const clubWidth = 1.4 * defocus.sizeMultiplier;
        const length = 4 * defocus.sizeMultiplier;
        const opacity = baseOpacity * Phaser.Math.FloatBetween(0.7, 1.0) * defocus.opacityMultiplier;

        graphics.lineStyle(defocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);

        const x1 = bacillusX - (length / 2) * Math.cos(bacillusAngle);
        const y1 = bacillusY - (length / 2) * Math.sin(bacillusAngle);
        const x2 = bacillusX + (length / 2) * Math.cos(bacillusAngle);
        const y2 = bacillusY + (length / 2) * Math.sin(bacillusAngle);

        graphics.fillCircle(x1, y1, baseWidth); // Narrow end
        graphics.fillCircle(x2, y2, clubWidth); // Club end
        graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
      }
    }
  }

  private renderCoccobacilli(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    radius: number,
    color: number,
    baseOpacity: number,
    organism: Organism,
  ) {
    // Short oval bacteria (Yersinia, Haemophilus)
    for (let i = 0; i < Phaser.Math.Between(12, 18); i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 50);
      const bacteriumX = centerX + distance * Math.cos(angle);
      const bacteriumY = centerY + distance * Math.sin(angle);
      const bacteriumAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const zDepth = Phaser.Math.FloatBetween(-3, 3);
      const defocus = this.calculateDefocus(zDepth);

      const width = 1.0 * defocus.sizeMultiplier;
      const length = 2.0 * defocus.sizeMultiplier;
      const opacity = baseOpacity * Phaser.Math.FloatBetween(0.7, 1.0) * defocus.opacityMultiplier;

      graphics.lineStyle(defocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      const x1 = bacteriumX - (length / 2) * Math.cos(bacteriumAngle);
      const y1 = bacteriumY - (length / 2) * Math.sin(bacteriumAngle);
      const x2 = bacteriumX + (length / 2) * Math.cos(bacteriumAngle);
      const y2 = bacteriumY + (length / 2) * Math.sin(bacteriumAngle);

      graphics.fillCircle(x1, y1, width);
      graphics.fillCircle(x2, y2, width);
      graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));

      // Capsule if capsule stain and organism has capsule
      if (this.currentStain === 'capsule' && organism.capsule) {
        graphics.lineStyle(2, 0x4169e1, 0.3); // Blue halo
        graphics.strokeEllipse(bacteriumX, bacteriumY, length * 1.5, width * 1.5);
      }
    }
  }

  private calculateDefocus(zDepth: number): { sizeMultiplier: number; opacityMultiplier: number; blurWidth: number } {
    // Optical defocus algorithm based on depth of field
    // zDepth: -3 (far below focal plane) to +3 (far above focal plane), 0 = in focus
    
    // Clamp to reasonable range and calculate circle of confusion
    const clampedDepth = Math.max(-3, Math.min(3, zDepth));
    const defocusAmount = Math.abs(clampedDepth) / 3; // Normalize to 0-1
    
    // Quadratic falloff for realistic optical behavior
    const blurFactor = defocusAmount * defocusAmount;
    
    // Size increases dramatically with defocus (point spread function)
    // In-focus: 1.0x, extreme defocus: 2.5x size (very blurry)
    const sizeMultiplier = 1.0 + (blurFactor * 1.5);
    
    // Opacity decreases dramatically (energy spread over much larger area)
    // In-focus: 1.0, extreme defocus: 0.1 (barely visible)
    const opacityMultiplier = 1.0 - (blurFactor * 0.9);
    
    // Blur width increases significantly
    // In-focus: 1px, extreme defocus: 5px (very soft edges)
    const blurWidth = 1 + (blurFactor * 4);
    
    return { sizeMultiplier, opacityMultiplier, blurWidth };
  }

  private addFocusBlur(centerX: number, centerY: number, radius: number) {
    // Radial blur effect - edges are slightly out of focus
    // Creates multiple concentric circles with decreasing opacity
    const blurOverlay = this.add.graphics();
    
    // Outer edge blur (most defocused)
    for (let i = 0; i < 3; i++) {
      const blurRadius = radius - (i * 15);
      blurOverlay.lineStyle(8, 0xf5f0e8, 0.15 - (i * 0.04));
      blurOverlay.strokeCircle(centerX, centerY, blurRadius);
    }
    
    // This sits above the microscope container but below the mask
    blurOverlay.setDepth(1);
  }

  private createApertureBreathing(centerX: number, centerY: number, radius: number) {
    // Subtle vignette that pulses to simulate viewer head movement
    this.apertureVignette = this.add.graphics();
    this.apertureVignette.setDepth(2);
    
    // Animate breathing effect
    this.tweens.add({
      targets: this.apertureVignette,
      alpha: 0.3,
      duration: 2, // Phaser.Math.Between(4000, 16000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.apertureVignette) return;
        
        this.apertureVignette.clear();
        
        // Draw expanding/contracting dark vignette
        const vignetteScale = 1 + (this.apertureVignette.alpha - 0.15) * 0.05;
        this.apertureVignette.fillStyle(0x000000, 0.03);
        this.apertureVignette.fillCircle(centerX, centerY, radius * vignetteScale);
        this.apertureVignette.fillStyle(0xf5f0e8, 0.03);
        this.apertureVignette.fillCircle(centerX, centerY, radius * 0.95);
      }
    });
  }

  private createFloatingDust(centerX: number, centerY: number, radius: number) {
    // Create 5-8 dust particles that drift across the field
    const numParticles = Phaser.Math.Between(5, 8);
    
    for (let i = 0; i < numParticles; i++) {
      const dust = this.add.graphics();
      dust.setDepth(3);
      
      // Random starting position
      const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const startDist = Phaser.Math.FloatBetween(0, radius - 20);
      const dustX = centerX + startDist * Math.cos(startAngle);
      const dustY = centerY + startDist * Math.sin(startAngle);
      
      const dustSize = Phaser.Math.FloatBetween(1, 25);
      const dustOpacity = Phaser.Math.FloatBetween(0.01, 0.05);
      
      dust.fillStyle(0x000000, dustOpacity);
      dust.fillCircle(dustX, dustY, dustSize);
      
      this.floatingDust.push(dust);
      
      // Animate slow drift
      const driftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const driftDistance = Phaser.Math.FloatBetween(-50, 50);
      const endX = driftDistance * Math.cos(driftAngle);
      const endY = driftDistance * Math.sin(driftAngle);
      
      this.tweens.add({
        targets: dust,
        x: endX,
        y: endY,
        duration: Phaser.Math.Between(8000, 15000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onUpdate: (tween) => {
          // Redraw at new position
          const progress = tween.progress;
          const currentX = Phaser.Math.Linear(dustX, endX, progress);
          const currentY = Phaser.Math.Linear(dustY, endY, progress);
          
          dust.clear();
          dust.fillStyle(0x000000, dustOpacity);
          dust.fillCircle(currentX, currentY, dustSize);
        }
      });
    }
  }

  private createReferenceManual() {
    const manualX = 660;
    const manualY = 140;
    const manualWidth = 600;
    const manualHeight = 280;

    // Right section background
    this.add.rectangle(640, 140, 640, 580, 0x2a2a2a).setOrigin(0);
    this.add.rectangle(640, 140, 640, 580).setStrokeStyle(2, 0x444444).setOrigin(0);

    // Manual background
    this.add.rectangle(manualX, manualY, manualWidth, manualHeight, 0x3a3a3a).setOrigin(0).setName('manualBg');
    this.add
      .rectangle(manualX, manualY, manualWidth, manualHeight)
      .setStrokeStyle(2, 0x666666)
      .setOrigin(0)
      .setName('manualBorder');

    // Title
    this.add
      .text(manualX + manualWidth / 2, manualY + 15, 'Laboratory Manual (1920 Edition)', {
        fontSize: '14px',
        color: '#ffd700',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setName('manualTitle');

    // Initial empty state
    this.add
      .text(manualX + manualWidth / 2, manualY + manualHeight / 2, 'Select a diagnosis below\nto view organism details', {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'Courier New',
        align: 'center',
      })
      .setOrigin(0.5)
      .setName('manualEmptyState');
  }

  private updateReferenceManual(organism: Organism | null) {
    const manualX = 660;
    const manualY = 140;
    const manualWidth = 600;

    // Clear existing organism content - collect first then destroy
    const toDestroy: Phaser.GameObjects.GameObject[] = [];
    this.children.each((child) => {
      if (child.name && child.name.startsWith('manualContent')) {
        toDestroy.push(child);
      }
    });
    toDestroy.forEach(child => child.destroy());

    // Clear or show empty state
    const emptyState = this.children.getByName('manualEmptyState') as Phaser.GameObjects.Text;
    if (emptyState) {
      emptyState.setVisible(!organism);
    }

    if (!organism) return;

    let yOffset = manualY + 45;

    this.add
      .text(manualX + 20, yOffset, organism.scientificName, {
        fontSize: '16px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0)
      .setName('manualContentTitle');

    yOffset += 28;

    const details = [
      `Common Name: ${organism.commonName}`,
      `Shape: ${organism.shape.charAt(0).toUpperCase() + organism.shape.slice(1)}, ${organism.arrangement.charAt(0).toUpperCase() + organism.arrangement.slice(1)}`,
      ``,
      `Staining Results:`,
      `  Gram: ${organism.gramStain === 'positive' ? 'Purple (+)' : organism.gramStain === 'negative' ? 'Pink (-)' : 'Variable'}`,
      `  Acid-Fast: ${organism.acidFast ? 'Red (+)' : 'Blue (-)'}`,
      `  Capsule: ${organism.capsule ? 'Present' : 'None'}`,
      `  Spore: ${organism.sporeFormer ? 'Green (+)' : 'None'}`,
      ``,
      `${organism.notes}`,
    ];

    details.forEach((detail, index) => {
      this.add
        .text(manualX + 20, yOffset, detail, {
          fontSize: '13px',
          color: '#cccccc',
          fontFamily: 'Courier New',
          wordWrap: { width: manualWidth - 40 },
        })
        .setOrigin(0)
        .setName(`manualContentDetail${index}`);
      yOffset += detail === '' ? 12 : 20;
    });
  }

  private createDiagnosisInterface() {
    const diagnosisX = 660;
    const diagnosisY = 435;
    const listWidth = 600;
    const listHeight = 220;

    // Instructions
    this.add
      .text(diagnosisX + listWidth / 2, diagnosisY, 'Select your diagnosis:', {
        fontSize: '14px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Scrollable container background
    const scrollY = diagnosisY + 25;
    this.add.rectangle(diagnosisX, scrollY, listWidth, listHeight, 0x1a1a1a).setOrigin(0);
    this.add.rectangle(diagnosisX, scrollY, listWidth, listHeight).setStrokeStyle(2, 0x555555).setOrigin(0);

    // Create a container for scrollable content
    const scrollContainer = this.add.container(0, 0).setName('diagnosisScrollContainer');
    
    // Create organism buttons in a single column
    const itemHeight = 32;
    const itemSpacing = 6;
    const startY = scrollY + 10;

    ORGANISMS.forEach((organism, index) => {
      const y = startY + index * (itemHeight + itemSpacing);

      const button = this.add
        .rectangle(diagnosisX + listWidth / 2, y, listWidth - 20, itemHeight, 0x4a4a4a)
        .setInteractive({ useHandCursor: true })
        .setName(`diagnosisButton_${organism.id}`)
        .on('pointerover', () => button.setFillStyle(0x5a5a5a))
        .on('pointerout', () => {
          if (this.selectedDiagnosis !== organism.id) {
            button.setFillStyle(0x4a4a4a);
          }
        })
        .on('pointerdown', () => {
          // Deselect all other buttons
          ORGANISMS.forEach((org) => {
            const btn = this.children.getByName(`diagnosisButton_${org.id}`) as Phaser.GameObjects.Rectangle;
            if (btn) btn.setFillStyle(0x4a4a4a);
          });
          
          this.selectedDiagnosis = organism.id;
          this.selectedOrganism = organism;
          button.setFillStyle(0x3a7a3a);
          
          // Update the reference manual to show selected organism
          this.updateReferenceManual(organism);
        });

      const text = this.add
        .text(diagnosisX + listWidth / 2, y, organism.scientificName, {
          fontSize: '13px',
          color: '#e0e0e0',
          fontFamily: 'Courier New',
        })
        .setOrigin(0.5);

      scrollContainer.add([button, text]);
    });

    // Mask for scrollable area
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(diagnosisX, scrollY, listWidth, listHeight);
    const mask = maskShape.createGeometryMask();
    scrollContainer.setMask(mask);

    // Add scroll functionality with mouse wheel
    const totalContentHeight = ORGANISMS.length * (itemHeight + itemSpacing);
    const maxScroll = Math.max(0, totalContentHeight - listHeight + 20);
    let currentScroll = 0;

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (pointer.x >= diagnosisX && pointer.x <= diagnosisX + listWidth &&
          pointer.y >= scrollY && pointer.y <= scrollY + listHeight) {
        currentScroll = Phaser.Math.Clamp(currentScroll + deltaY * 0.3, 0, maxScroll);
        scrollContainer.setY(-currentScroll);
      }
    });

    // Submit button
    const submitY = scrollY + listHeight + 15;
    const submitBtn = this.add
      .rectangle(diagnosisX + listWidth / 2, submitY, 200, 38, 0x2a6a2a)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => submitBtn.setFillStyle(0x3a7a3a))
      .on('pointerout', () => submitBtn.setFillStyle(0x2a6a2a))
      .on('pointerdown', () => this.submitDiagnosis());

    this.add
      .text(diagnosisX + listWidth / 2, submitY, 'Submit Diagnosis', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);
  }

  private submitDiagnosis() {
    if (!this.selectedDiagnosis) {
      return;
    }

    const isCorrect = this.selectedDiagnosis === this.currentCase.organismId;

    // Clear previous feedback
    const existingFeedback = this.children.getByName('feedback');
    if (existingFeedback) {
      existingFeedback.destroy();
    }

    // Show feedback
    const feedbackColor = isCorrect ? '#2a6a2a' : '#6a2a2a';
    const feedbackText = isCorrect ? 'CORRECT!' : 'INCORRECT';

    this.add
      .rectangle(640, 650, 400, 60, Phaser.Display.Color.HexStringToColor(feedbackColor).color)
      .setName('feedback');

    this.add
      .text(640, 640, feedbackText, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('feedback');

    this.add
      .text(
        640,
        665,
        isCorrect
          ? 'You correctly identified the pathogen!'
          : `The correct answer was: ${this.currentOrganism?.scientificName}`,
        {
          fontSize: '12px',
          color: '#ffffff',
          fontFamily: 'Courier New',
        },
      )
      .setOrigin(0.5)
      .setName('feedback');
  }
}
