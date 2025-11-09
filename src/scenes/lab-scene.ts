import Phaser from 'phaser';
import { CASES, ORGANISMS, type Organism } from '@/data/organisms';

export class LabScene extends Phaser.Scene {
  private currentCase = CASES[0];
  private currentOrganism: Organism | undefined;
  private selectedDiagnosis: string | null = null;
  private isStained = false;
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
    const buttonX = 400;
    const buttonY = 600;

    const button = this.add.rectangle(buttonX, buttonY, 180, 35, 0x4a3a2a);
    const buttonText = this.add.text(buttonX, buttonY, 'Apply Gram Stain', {
      fontSize: '14px',
      color: '#e0e0e0',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      if (!this.isStained) {
        button.setFillStyle(0x6a5a4a);
      }
    });

    button.on('pointerout', () => {
      if (!this.isStained) {
        button.setFillStyle(0x4a3a2a);
      }
    });

    button.on('pointerdown', () => {
      if (!this.isStained) {
        this.isStained = true;
        button.setFillStyle(0x2a2a2a);
        buttonText.setText('Stained');
        buttonText.setColor('#888888');
        button.disableInteractive();
        this.refreshMicroscopeView();
      }
    });
  }

  private createMicroscopeViewer() {
    const viewerCenterX = 400;
    const viewerCenterY = 380;
    const viewerRadius = 180;

    // Dark background outside the eyepiece
    this.add.rectangle(200, 180, 400, 400, 0x0a0a0a).setOrigin(0);

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
    const labelText = this.isStained ? 'Microscope View - 1000x (Gram Stained)' : 'Microscope View - 1000x (Unstained)';
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

    const viewerCenterX = 400;
    const viewerCenterY = 380;
    const viewerRadius = 180;

    // Clear existing content
    this.microscopeContainer.removeAll(true);

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

    // Stain precipitate (only if stained)
    if (this.isStained) {
      for (let i = 0; i < Phaser.Math.Between(5, 10); i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, radius - 20);
        const precipX = centerX + distance * Math.cos(angle);
        const precipY = centerY + distance * Math.sin(angle);
        const precipSize = Phaser.Math.FloatBetween(2, 5);

        // Dark purple stain precipitate
        artifacts.fillStyle(0x4a3366, Phaser.Math.FloatBetween(0.3, 0.6));
        artifacts.fillCircle(precipX, precipY, precipSize);
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

    // Determine bacteria color based on staining state
    let bacteriaColor: number;
    let baseOpacity: number;

    if (this.isStained) {
      // Gram stained: vivid colors
      bacteriaColor = organism.gramStain === 'positive' ? 0x663399 : 0xff69b4;
      baseOpacity = 0.2;
    } else {
      // Unstained: barely visible pale gray/beige
      bacteriaColor = 0xd8d4cc;
      baseOpacity = 0.05;
    }

    // Render cocci in chains (Streptococcus)
    // Bacteria are ~1 micrometer, RBCs are ~7-8 micrometers
    // At 1000x magnification, cocci should be ~1/7th the size of RBCs
    // RBCs render at ~28-35px, so cocci should be ~4-5px
    if (organism.shape === 'cocci' && organism.arrangement === 'chains') {
      // Draw 5-6 chains scattered in the view (more chains since they're smaller)
      for (let chain = 0; chain < Phaser.Math.Between(2, 10); chain++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, radius - 60);
        const startX = centerX + distance * Math.cos(angle);
        const startY = centerY + distance * Math.sin(angle);
        const chainAngle = Phaser.Math.Between(0, 360);
        const chainLength = Phaser.Math.Between(12, 20); // Longer chains for Streptococcus

        // Each chain at a specific z-depth (focal plane)
        // Wide range: some chains will be extremely blurry
        const chainZDepth = Phaser.Math.FloatBetween(-3, 3);
        const chainDefocus = this.calculateDefocus(chainZDepth);
        
        // Each chain may have slightly different staining intensity (non-uniform staining)
        const chainStainVariation = Phaser.Math.FloatBetween(0.6, 1.0);

        for (let i = 0; i < chainLength; i++) {
          // Spacing between cocci: slightly overlapping (1.5-2× diameter)
          const spacing = 4; // Reduced from 11
          const coccusX = startX + i * spacing * Math.cos((chainAngle * Math.PI) / 180);
          const coccusY = startY + i * spacing * Math.sin((chainAngle * Math.PI) / 180);
          
          // Individual cocci size variation
          const sizeVariation = Phaser.Math.FloatBetween(0.85, 1.15);
          const baseCoccusRadius = 1 * sizeVariation; // Reduced from 5 to match ~1/7 RBC size
          
          // Apply optical defocus to bacteria
          const coccusRadius = baseCoccusRadius * chainDefocus.sizeMultiplier;
          const opacity = baseOpacity * chainStainVariation * chainDefocus.opacityMultiplier;

          graphics.lineStyle(chainDefocus.blurWidth, bacteriaColor, opacity);
          graphics.fillStyle(bacteriaColor, opacity * 0.6);

          graphics.fillCircle(coccusX, coccusY, coccusRadius);
          graphics.strokeCircle(coccusX, coccusY, coccusRadius);
        }
      }
    }

    container.add(graphics);
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
    const manualX = 650;
    const manualY = 180;
    const manualWidth = 400;
    const manualHeight = 300;

    // Manual background
    this.add.rectangle(manualX, manualY, manualWidth, manualHeight, 0x3a3a3a).setOrigin(0);
    this.add
      .rectangle(manualX, manualY, manualWidth, manualHeight)
      .setStrokeStyle(2, 0x666666)
      .setOrigin(0);

    // Title
    this.add
      .text(manualX + manualWidth / 2, manualY + 20, 'Laboratory Manual (1920 Edition)', {
        fontSize: '16px',
        color: '#ffd700',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Organism entry
    if (this.currentOrganism) {
      const org = this.currentOrganism;
      let yOffset = manualY + 60;

      this.add
        .text(manualX + 20, yOffset, org.scientificName, {
          fontSize: '14px',
          color: '#e0e0e0',
          fontFamily: 'Courier New',
          fontStyle: 'bold',
        })
        .setOrigin(0);

      yOffset += 30;

      const details = [
        `Common Name: ${org.commonName}`,
        `Gram Stain: ${org.gramStain.charAt(0).toUpperCase() + org.gramStain.slice(1)}`,
        `Shape: ${org.shape.charAt(0).toUpperCase() + org.shape.slice(1)}`,
        `Arrangement: ${org.arrangement.charAt(0).toUpperCase() + org.arrangement.slice(1)}`,
        ``,
        `Notes: ${org.notes}`,
      ];

      details.forEach((detail) => {
        this.add
          .text(manualX + 20, yOffset, detail, {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: 'Courier New',
            wordWrap: { width: manualWidth - 40 },
          })
          .setOrigin(0);
        yOffset += 20;
      });
    }
  }

  private createDiagnosisInterface() {
    const diagnosisY = 520;

    // Instructions
    this.add
      .text(640, diagnosisY, 'Select your diagnosis:', {
        fontSize: '14px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Diagnosis button (for Epic 0+1, only one option)
    if (this.currentOrganism) {
      const button = this.add
        .rectangle(640, diagnosisY + 40, 300, 40, 0x4a4a4a)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => button.setFillStyle(0x5a5a5a))
        .on('pointerout', () => button.setFillStyle(0x4a4a4a))
        .on('pointerdown', () => {
          this.selectedDiagnosis = this.currentOrganism!.id;
          button.setFillStyle(0x3a7a3a);
        });

      this.add
        .text(640, diagnosisY + 40, this.currentOrganism.scientificName, {
          fontSize: '14px',
          color: '#e0e0e0',
          fontFamily: 'Courier New',
        })
        .setOrigin(0.5);

      // Submit button
      const submitBtn = this.add
        .rectangle(640, diagnosisY + 100, 200, 40, 0x2a6a2a)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => submitBtn.setFillStyle(0x3a7a3a))
        .on('pointerout', () => submitBtn.setFillStyle(0x2a6a2a))
        .on('pointerdown', () => this.submitDiagnosis());

      this.add
        .text(640, diagnosisY + 100, 'Submit Diagnosis', {
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: 'Courier New',
        })
        .setOrigin(0.5);
    }
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
