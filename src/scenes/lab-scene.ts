import Phaser from 'phaser';
import { CASES, ORGANISMS, type Organism } from '@/data/organisms';

export class LabScene extends Phaser.Scene {
  private currentCase = CASES[0];
  private currentOrganism: Organism | undefined;
  private selectedDiagnosis: string | null = null;

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

    // Reference manual
    this.createReferenceManual();

    // Diagnosis submission
    this.createDiagnosisInterface();
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
    const viewContainer = this.add.container(0, 0);

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

    viewContainer.add([backgroundCircle, vignette]);

    // Label
    this.add
      .text(viewerCenterX, 180, 'Microscope View - 1000x (Gram Stained)', {
        fontSize: '14px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Render blood cells background
    this.renderBloodCells(viewerCenterX, viewerCenterY, viewerRadius, viewContainer);

    // Render bacteria (Streptococcus pyogenes - purple cocci in chains)
    if (this.currentOrganism) {
      this.renderBacteria(viewerCenterX, viewerCenterY, viewerRadius, this.currentOrganism, viewContainer);
    }

    // Apply circular mask
    viewContainer.setMask(mask.createGeometryMask());

    // Draw eyepiece rim (metal casing)
    const rim = this.add.graphics();
    
    // Inner rim shadow
    rim.lineStyle(2, 0x1a1a1a);
    rim.strokeCircle(viewerCenterX, viewerCenterY, viewerRadius + 1);
    
    // Main eyepiece rim (brass/metal look)
    rim.lineStyle(6, 0x3a3a3a);
    rim.strokeCircle(viewerCenterX, viewerCenterY, viewerRadius + 4);
    
    // Outer rim highlight
    rim.lineStyle(2, 0x5a5a5a);
    rim.strokeCircle(viewerCenterX, viewerCenterY, viewerRadius + 8);
  }

  private renderBloodCells(centerX: number, centerY: number, radius: number, container: Phaser.GameObjects.Container) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xff9999, 0.3);
    graphics.fillStyle(0xffcccc, 0.1);

    // Draw ~20 red blood cells scattered within circular view
    // RBCs are ~7-8 micrometers, bacteria are ~1 micrometer
    // At 1000x, RBCs should be relatively large
    for (let i = 0; i < 20; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, radius - 40);
      const cellX = centerX + distance * Math.cos(angle);
      const cellY = centerY + distance * Math.sin(angle);
      const cellRadius = Phaser.Math.Between(28, 35); // RBCs are much larger than bacteria

      graphics.strokeCircle(cellX, cellY, cellRadius);
      graphics.fillCircle(cellX, cellY, cellRadius);
    }

    container.add(graphics);
  }

  private renderBacteria(
    centerX: number,
    centerY: number,
    radius: number,
    organism: Organism,
    container: Phaser.GameObjects.Container,
  ) {
    const graphics = this.add.graphics();

    // Gram positive = purple
    const bacteriaColor = organism.gramStain === 'positive' ? 0x663399 : 0xff69b4;

    graphics.lineStyle(1, bacteriaColor, 1);
    graphics.fillStyle(bacteriaColor, 0.8);

    // Render cocci in chains (Streptococcus)
    // Bacteria are ~1 micrometer, much smaller than RBCs
    // At 1000x magnification, cocci should be ~5-6 pixels
    if (organism.shape === 'cocci' && organism.arrangement === 'chains') {
      // Draw 3-4 chains scattered in the view
      for (let chain = 0; chain < 4; chain++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(0, radius - 60);
        const startX = centerX + distance * Math.cos(angle);
        const startY = centerY + distance * Math.sin(angle);
        const chainAngle = Phaser.Math.Between(0, 360);
        const chainLength = Phaser.Math.Between(4, 8);

        for (let i = 0; i < chainLength; i++) {
          const coccusX = startX + i * 11 * Math.cos((chainAngle * Math.PI) / 180);
          const coccusY = startY + i * 11 * Math.sin((chainAngle * Math.PI) / 180);
          const coccusRadius = 5; // Small relative to RBCs

          graphics.fillCircle(coccusX, coccusY, coccusRadius);
          graphics.strokeCircle(coccusX, coccusY, coccusRadius);
        }
      }
    }

    container.add(graphics);
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
