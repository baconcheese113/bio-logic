import Phaser from 'phaser';
import { CASES, ORGANISMS, SAMPLE_BACKGROUNDS, type Organism, type SampleType } from '@/data/organisms';
import { Slide } from '@/utils/slide';

export class LabScene extends Phaser.Scene {
  private currentCase = CASES[Phaser.Math.Between(0, CASES.length - 1)];
  private currentOrganism: Organism | undefined;
  private selectedSampleType: SampleType | null = null;
  private selectedDiagnosis: string | null = null;
  private currentStain: 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore' = 'none';
  private microscopeContainer: Phaser.GameObjects.Container | null = null;
  private floatingDust: Phaser.GameObjects.Graphics[] = [];
  private apertureVignette: Phaser.GameObjects.Graphics | null = null;
  private focusOffset: number = 0; // -15 to +15, allows focusing well beyond slide specimen range
  private slide: Slide | null = null; // Pre-generated slide data

  constructor() {
    super({ key: 'LabScene' });
  }

  create() {
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

    // Show case presentation screen first
    this.showCasePresentation();
  }

  private createFocusControl() {
    const controlX = 560;
    const controlY = 380;

    // Background panel
    this.add.rectangle(controlX - 40, controlY - 60, 80, 120, 0x2a2a2a).setOrigin(0);
    this.add.rectangle(controlX - 40, controlY - 60, 80, 120).setStrokeStyle(2, 0x444444).setOrigin(0);

    // Label
    this.add.text(controlX, controlY - 45, 'FOCUS', {
      fontSize: '11px',
      color: '#888888',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);

    // Vertical track
    const track = this.add.graphics();
    track.lineStyle(3, 0x444444);
    track.strokeLineShape(new Phaser.Geom.Line(controlX, controlY - 25, controlX, controlY + 35));
    
    // Tick marks (-6 to +6 range)
    for (let i = -6; i <= 6; i++) {
      const tickY = controlY + 5 + (i * 5);
      track.lineStyle(1, 0x666666);
      track.strokeLineShape(new Phaser.Geom.Line(controlX - 5, tickY, controlX + 5, tickY));
    }

    // Focus knob (draggable)
    const knob = this.add.circle(controlX, controlY + 5, 10, 0x5a5a5a).setStrokeStyle(2, 0x888888);
    knob.setInteractive({ draggable: true, useHandCursor: true });

    // Knob detail (center dot)
    const knobCenter = this.add.circle(controlX, controlY + 5, 3, 0x888888);

    // Labels
    this.add.text(controlX + 15, controlY - 25, '+', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'Courier New',
    }).setOrigin(0, 0.5);

    this.add.text(controlX + 15, controlY + 35, '-', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'Courier New',
    }).setOrigin(0, 0.5);

    // Drag behavior
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, _dragX: number, dragY: number) => {
      if (gameObject !== knob) return;

      // Constrain to track
      const minY = controlY - 25;
      const maxY = controlY + 35;
      const clampedY = Phaser.Math.Clamp(dragY, minY, maxY);
      
      knob.setPosition(controlX, clampedY);
      knobCenter.setPosition(controlX, clampedY);

      // Calculate focus offset (-15 to +15)
      // Top = +15 (far above focal plane), Bottom = -15 (far below)
      const normalizedPosition = (clampedY - minY) / (maxY - minY); // 0 to 1
      this.focusOffset = 30 - (normalizedPosition * 60); // +30 to -30

      // Only re-render bacteria, not the entire microscope view
      this.refreshMicroscopeView();
    });

    // Hover effect
    knob.on('pointerover', () => {
      knob.setFillStyle(0x6a6a6a);
    });

    knob.on('pointerout', () => {
      knob.setFillStyle(0x5a5a5a);
    });
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
        
        // Regenerate slide with new stain state (stain.type is never 'none', so always has stain)
        const caseIndex = CASES.indexOf(this.currentCase);
        const viewerCenterX = 320;
        const viewerCenterY = 380;
        const viewerRadius = 180;
        const sampleBackground = this.selectedSampleType ? SAMPLE_BACKGROUNDS[this.selectedSampleType] : 'blood-cells';
        this.slide = new Slide(caseIndex, viewerCenterX, viewerCenterY, viewerRadius, true, this.currentOrganism, sampleBackground);
        
        // Destroy and recreate dust/vignette for stain changes (different optical effects)
        this.floatingDust.forEach(dust => dust.destroy());
        this.floatingDust = [];
        if (this.apertureVignette) {
          this.apertureVignette.destroy();
          this.apertureVignette = null;
        }
        
        this.refreshMicroscopeView();
        
        // Recreate dynamic effects for new stain
        this.createApertureBreathing(viewerCenterX, viewerCenterY, viewerRadius);
        this.createFloatingDust(viewerCenterX, viewerCenterY, viewerRadius);
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

    // Generate slide with pre-determined positions
    const caseIndex = CASES.indexOf(this.currentCase);
    const sampleBackground = this.selectedSampleType ? SAMPLE_BACKGROUNDS[this.selectedSampleType] : 'blood-cells';
    this.slide = new Slide(caseIndex, viewerCenterX, viewerCenterY, viewerRadius, this.currentStain !== 'none', this.currentOrganism, sampleBackground);

    // Render background cells using slide data
    this.renderBackgroundCells(this.microscopeContainer);

    // Render bacteria using slide data
    if (this.currentOrganism) {
      this.renderBacteria(this.currentOrganism, this.microscopeContainer);
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
    
    // Note: Don't destroy dust particles or aperture vignette - they persist across focus changes
    // Only the microscope container content (blood cells, bacteria) gets re-rendered

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
    const caseIndex = CASES.indexOf(this.currentCase);
    
    // Only regenerate slide if it doesn't exist (shouldn't happen, but safety check)
    if (!this.slide) {
      const sampleBackground = this.selectedSampleType ? SAMPLE_BACKGROUNDS[this.selectedSampleType] : 'blood-cells';
      this.slide = new Slide(caseIndex, viewerCenterX, viewerCenterY, viewerRadius, this.currentStain !== 'none', this.currentOrganism, sampleBackground);
    }
    
    this.renderBackgroundCells(this.microscopeContainer);
    
    if (this.currentOrganism) {
      this.renderBacteria(this.currentOrganism, this.microscopeContainer);
    }
    
    // Re-add focus blur (static overlay)
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

  private renderBackgroundCells(container: Phaser.GameObjects.Container) {
    if (!this.slide) return;

    const graphics = this.add.graphics();

    // Render blood cells
    for (const cell of this.slide.bloodCells) {
      const baseCellRadius = cell.radius;
      const zDepth = cell.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, baseCellRadius);
      const cellRadius = baseCellRadius * defocus.sizeMultiplier;
      const fillOpacity = 0.2 * defocus.opacityMultiplier;

      // RBCs appear as donuts (biconcave discs viewed from above)
      graphics.fillStyle(0xcc6666, fillOpacity * 1.2);
      graphics.fillEllipse(cell.x, cell.y, cellRadius * cell.irregularity, cellRadius / cell.irregularity);
      
      const centerRatio = .45;
      const centerRadius = cellRadius * centerRatio;
      graphics.fillStyle(0xfff5f5, fillOpacity * 0.9);
      graphics.fillEllipse(cell.x, cell.y, centerRadius * cell.irregularity, centerRadius / cell.irregularity);
    }

    // Render epithelial cells (larger, flatter, with visible nuclei)
    for (const cell of this.slide.epithelialCells) {
      const zDepth = cell.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, cell.width);
      const width = cell.width * defocus.sizeMultiplier;
      const height = cell.height * defocus.sizeMultiplier;
      const opacity = 0.25 * defocus.opacityMultiplier;

      graphics.save();
      graphics.translateCanvas(cell.x, cell.y);
      graphics.rotateCanvas(cell.rotation);
      
      // Cell membrane (pale pink/blue)
      graphics.fillStyle(0xd4b8c8, opacity);
      graphics.fillEllipse(0, 0, width, height);
      
      // Nucleus (darker purple)
      graphics.fillStyle(0x6a4a6a, opacity * 1.5);
      graphics.fillEllipse(cell.nucleusOffset.x, cell.nucleusOffset.y, width * 0.3, height * 0.25);
      
      graphics.restore();
    }

    // Render fecal particles (brown fibers, chunks, fragments)
    for (const particle of this.slide.fecalParticles) {
      const zDepth = particle.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, particle.size);
      const size = particle.size * defocus.sizeMultiplier;
      const opacity = 0.6 * defocus.opacityMultiplier;

      graphics.fillStyle(particle.color, opacity);
      
      if (particle.shape === 'fiber') {
        // Draw elongated fiber
        graphics.save();
        graphics.translateCanvas(particle.x, particle.y);
        graphics.rotateCanvas(particle.rotation);
        graphics.fillRect(-size * 2, -size * 0.3, size * 4, size * 0.6);
        graphics.restore();
      } else if (particle.shape === 'chunk') {
        // Irregular chunk
        graphics.fillCircle(particle.x, particle.y, size);
      } else {
        // Small fragment
        graphics.fillCircle(particle.x, particle.y, size * 0.5);
      }
    }

    // Render pus cells (neutrophils with multi-lobed nuclei)
    for (const cell of this.slide.pusCells) {
      const zDepth = cell.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, cell.radius);
      const radius = cell.radius * defocus.sizeMultiplier;
      const opacity = cell.opacity * defocus.opacityMultiplier * 0.3;

      // Cell body (pale with granules)
      graphics.fillStyle(0xe8dcd8, opacity);
      graphics.fillCircle(cell.x, cell.y, radius);
      
      // Multi-lobed nucleus (darker purple segments)
      graphics.fillStyle(0x4a3a5a, opacity * 1.8);
      const lobeSize = radius * 0.3;
      for (let i = 0; i < cell.nuclei; i++) {
        const angle = (i / cell.nuclei) * Math.PI * 2;
        const offsetX = Math.cos(angle) * radius * 0.25;
        const offsetY = Math.sin(angle) * radius * 0.25;
        graphics.fillCircle(cell.x + offsetX, cell.y + offsetY, lobeSize);
      }
    }

    container.add(graphics);

    // Add sample prep artifacts
    this.addSampleArtifacts(container);
  }

  private addSampleArtifacts(container: Phaser.GameObjects.Container) {
    if (!this.slide) return;

    const artifacts = this.add.graphics();

    // Debris particles (dust, cell fragments) - use pre-generated data with defocus
    for (const debris of this.slide.debris) {
      const zDepth = debris.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, debris.size);
      
      const size = debris.size * defocus.sizeMultiplier;
      const opacity = debris.opacity * defocus.opacityMultiplier;
      
      artifacts.fillStyle(0xb8b4ac, opacity);
      artifacts.fillCircle(debris.x, debris.y, size);
    }

    // Stain artifacts (only if stained)
    if (this.currentStain !== 'none') {
      // Stain precipitate crystals
      const precipColors = {
        gram: 0x4a3366,
        'acid-fast': 0x8b0000,
        capsule: 0x2a2a4a,
        spore: 0x1a4a1a,
      };
      for (const precip of this.slide.stainPrecipitates) {
        const zDepth = precip.zDepth - this.focusOffset;
        const defocus = this.calculateDefocus(zDepth, precip.size);
        
        const size = precip.size * defocus.sizeMultiplier;
        const opacity = precip.opacity * defocus.opacityMultiplier;
        
        artifacts.fillStyle(precipColors[this.currentStain], opacity);
        artifacts.fillCircle(precip.x, precip.y, size);
      }

      // Stain smears (streaks across the slide from staining process)
      const smearColors = {
        gram: [0x663399, 0xff69b4],
        'acid-fast': [0xff0000, 0x0000ff],
        capsule: [0x4169e1, 0xffc0cb],
        spore: [0x228b22, 0xff6347],
      };
      const colors = smearColors[this.currentStain];
      for (const smear of this.slide.stainSmears) {
        const zDepth = smear.zDepth - this.focusOffset;
        const defocus = this.calculateDefocus(zDepth, smear.width);
        
        const smearColor = colors[smear.colorIndex];
        const width = smear.width * defocus.sizeMultiplier;
        const opacity = smear.opacity * defocus.opacityMultiplier;
        
        artifacts.lineStyle(width, smearColor, opacity);
        
        const endX = smear.startX + smear.length * Math.cos(smear.angle);
        const endY = smear.startY + smear.length * Math.sin(smear.angle);
        artifacts.strokeLineShape(new Phaser.Geom.Line(smear.startX, smear.startY, endX, endY));
      }

      // Background stain residue (slide wasn't perfectly washed)
      for (const residue of this.slide.stainResidues) {
        const zDepth = residue.zDepth - this.focusOffset;
        const defocus = this.calculateDefocus(zDepth, residue.size);
        
        const residueColor = residue.colorIndex === 0 ? 0x663399 : 0xff69b4;
        const size = residue.size * defocus.sizeMultiplier;
        const opacity = residue.opacity * defocus.opacityMultiplier;
        
        artifacts.fillStyle(residueColor, opacity);
        artifacts.fillCircle(residue.x, residue.y, size);
      }
    }

    // Air bubbles (circular with refraction-like appearance)
    for (const bubble of this.slide.bubbles) {
      const zDepth = bubble.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, bubble.radius);
      
      const radius = bubble.radius * defocus.sizeMultiplier;
      const edgeOpacity = 0.4 * defocus.opacityMultiplier;
      const centerOpacity = 0.15 * defocus.opacityMultiplier;
      
      // Darker ring (edge of bubble)
      artifacts.lineStyle(2 * defocus.sizeMultiplier, 0xc8c4bc, edgeOpacity);
      artifacts.strokeCircle(bubble.x, bubble.y, radius);
      
      // Lighter center (refraction effect)
      artifacts.fillStyle(0xffffff, centerOpacity);
      artifacts.fillCircle(bubble.x, bubble.y, radius * 0.6);
    }

    container.add(artifacts);
  }

  private renderBacteria(
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
      this.renderCocciChains(graphics, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'cocci' && organism.arrangement === 'clusters') {
      this.renderCocciClusters(graphics, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'diplococci' && organism.arrangement === 'pairs') {
      this.renderDiplococci(graphics, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'single') {
      this.renderBacilli(graphics, bacteriaColor, baseOpacity, organism);
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'chains') {
      this.renderBacilliChains(graphics, bacteriaColor, baseOpacity, organism);
    } else if (organism.shape === 'bacilli' && organism.arrangement === 'palisades') {
      this.renderBacilliPalisades(graphics, bacteriaColor, baseOpacity);
    } else if (organism.shape === 'coccobacilli') {
      this.renderCoccobacilli(graphics, bacteriaColor, baseOpacity, organism);
    }

    container.add(graphics);
  }

  private renderCocciChains(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
  ) {
    if (!this.slide) return;

    // Streptococcus: cocci in chains - use pre-generated data
    for (const chain of this.slide.bacteria.chains) {
      const chainZDepth = chain.zDepth - this.focusOffset;
      const chainDefocus = this.calculateDefocus(chainZDepth, 1.5);

      for (const coccus of chain.cocci) {
        const baseCoccusRadius = 1.5 * coccus.sizeVariation;
        const coccusRadius = baseCoccusRadius * chainDefocus.sizeMultiplier;
        const opacity = baseOpacity * chain.stainVariation * chainDefocus.opacityMultiplier;

        graphics.lineStyle(chainDefocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);
        graphics.fillCircle(coccus.x, coccus.y, coccusRadius);
        graphics.strokeCircle(coccus.x, coccus.y, coccusRadius);
      }
    }
  }

  private renderCocciClusters(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
  ) {
    if (!this.slide) return;

    // Staphylococcus: cocci in grape-like clusters - use pre-generated data
    for (const cluster of this.slide.bacteria.clusters) {
      const clusterZDepth = cluster.zDepth - this.focusOffset;
      const clusterDefocus = this.calculateDefocus(clusterZDepth, 1.5);

      for (const coccus of cluster.cocci) {
        const baseCoccusRadius = 1.5 * coccus.sizeVariation;
        const coccusRadius = baseCoccusRadius * clusterDefocus.sizeMultiplier;
        const opacity = baseOpacity * cluster.stainVariation * clusterDefocus.opacityMultiplier;

        graphics.lineStyle(clusterDefocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);
        graphics.fillCircle(coccus.x, coccus.y, coccusRadius);
        graphics.strokeCircle(coccus.x, coccus.y, coccusRadius);
      }
    }
  }

  private renderDiplococci(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
  ) {
    if (!this.slide) return;

    // Neisseria: cocci in pairs - use pre-generated data
    for (const pair of this.slide.bacteria.pairs) {
      const pairZDepth = pair.zDepth - this.focusOffset;
      const pairDefocus = this.calculateDefocus(pairZDepth, 1.2);

      const baseCoccusRadius = 1.2 * pair.sizeVariation;
      const coccusRadius = baseCoccusRadius * pairDefocus.sizeMultiplier;
      const opacity = baseOpacity * pair.stainVariation * pairDefocus.opacityMultiplier;

      graphics.lineStyle(pairDefocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      // Draw two cocci side by side
      const spacing = 2.5;
      const coccus1X = pair.x + spacing * Math.cos(pair.orientation);
      const coccus1Y = pair.y + spacing * Math.sin(pair.orientation);
      const coccus2X = pair.x - spacing * Math.cos(pair.orientation);
      const coccus2Y = pair.y - spacing * Math.sin(pair.orientation);

      graphics.fillCircle(coccus1X, coccus1Y, coccusRadius);
      graphics.strokeCircle(coccus1X, coccus1Y, coccusRadius);
      graphics.fillCircle(coccus2X, coccus2Y, coccusRadius);
      graphics.strokeCircle(coccus2X, coccus2Y, coccusRadius);
    }
  }

  private renderBacilli(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
    organism: Organism,
  ) {
    if (!this.slide) return;

    // Rod-shaped bacteria - use pre-generated data
    for (const bacillus of this.slide.bacteria.bacilli) {
      const bacillusZDepth = bacillus.zDepth - this.focusOffset;
      const bacillusDefocus = this.calculateDefocus(bacillusZDepth, bacillus.width);

      const width = bacillus.width * bacillusDefocus.sizeMultiplier;
      const length = bacillus.length * bacillusDefocus.sizeMultiplier;
      const opacity = baseOpacity * bacillus.stainVariation * bacillusDefocus.opacityMultiplier;

      graphics.lineStyle(bacillusDefocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      // Draw as rounded rectangle
      const x1 = bacillus.x - (length / 2) * Math.cos(bacillus.orientation);
      const y1 = bacillus.y - (length / 2) * Math.sin(bacillus.orientation);
      const x2 = bacillus.x + (length / 2) * Math.cos(bacillus.orientation);
      const y2 = bacillus.y + (length / 2) * Math.sin(bacillus.orientation);

      graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
      graphics.fillCircle(x1, y1, width);
      graphics.fillCircle(x2, y2, width);

      // Add terminal spore if spore stain and organism is spore former
      if (this.currentStain === 'spore' && organism.sporeFormer) {
        graphics.fillStyle(0x228b22, 0.9);
        graphics.fillCircle(x2, y2, width * 1.8);
      }
    }
  }

  private renderBacilliChains(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
    organism: Organism,
  ) {
    if (!this.slide) return;

    // Bacillus anthracis - bacilli in chains - use pre-generated data
    for (const chain of this.slide.bacteria.bacilliChains) {
      for (const bacillus of chain.bacilli) {
        const zDepth = bacillus.zDepth - this.focusOffset;
        const defocus = this.calculateDefocus(zDepth, bacillus.width);

        const width = bacillus.width * defocus.sizeMultiplier;
        const length = bacillus.length * defocus.sizeMultiplier;
        const opacity = baseOpacity * bacillus.stainVariation * defocus.opacityMultiplier;

        graphics.lineStyle(defocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);

        // Square-ended rods
        const x1 = bacillus.x - (length / 2) * Math.cos(chain.orientation);
        const y1 = bacillus.y - (length / 2) * Math.sin(chain.orientation);
        const x2 = bacillus.x + (length / 2) * Math.cos(chain.orientation);
        const y2 = bacillus.y + (length / 2) * Math.sin(chain.orientation);

        graphics.fillCircle(x1, y1, width);
        graphics.fillCircle(x2, y2, width);
        graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));

        // Add spore if spore stain and organism is spore former
        if (this.currentStain === 'spore' && organism.sporeFormer) {
          graphics.fillStyle(0x228b22, 0.9);
          const sporeX = bacillus.x + (length * 0.3) * Math.cos(chain.orientation);
          const sporeY = bacillus.y + (length * 0.3) * Math.sin(chain.orientation);
          graphics.fillCircle(sporeX, sporeY, width * 1.2);
        }
      }
    }
  }

  private renderBacilliPalisades(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
  ) {
    if (!this.slide) return;

    // Corynebacterium - club-shaped bacilli in palisades - use pre-generated data
    for (const group of this.slide.bacteria.palisades) {
      for (const bacillus of group.bacilli) {
        const zDepth = bacillus.zDepth - this.focusOffset;
        const defocus = this.calculateDefocus(zDepth, 1.0);

        // Club-shaped: wider at one end
        const baseWidth = 0.8 * defocus.sizeMultiplier;
        const clubWidth = 1.4 * defocus.sizeMultiplier;
        const length = 4 * defocus.sizeMultiplier;
        const opacity = baseOpacity * bacillus.stainVariation * defocus.opacityMultiplier;

        graphics.lineStyle(defocus.blurWidth, color, opacity);
        graphics.fillStyle(color, opacity * 0.6);

        const x1 = bacillus.x - (length / 2) * Math.cos(bacillus.orientation);
        const y1 = bacillus.y - (length / 2) * Math.sin(bacillus.orientation);
        const x2 = bacillus.x + (length / 2) * Math.cos(bacillus.orientation);
        const y2 = bacillus.y + (length / 2) * Math.sin(bacillus.orientation);

        graphics.fillCircle(x1, y1, baseWidth); // Narrow end
        graphics.fillCircle(x2, y2, clubWidth); // Club end
        graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
      }
    }
  }

  private renderCoccobacilli(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    baseOpacity: number,
    organism: Organism,
  ) {
    if (!this.slide) return;

    // Short oval bacteria - use pre-generated data
    for (const bacterium of this.slide.bacteria.coccobacilli) {
      const zDepth = bacterium.zDepth - this.focusOffset;
      const defocus = this.calculateDefocus(zDepth, bacterium.width);

      const width = bacterium.width * defocus.sizeMultiplier;
      const length = bacterium.length * defocus.sizeMultiplier;
      const opacity = baseOpacity * bacterium.stainVariation * defocus.opacityMultiplier;

      graphics.lineStyle(defocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      const x1 = bacterium.x - (length / 2) * Math.cos(bacterium.orientation);
      const y1 = bacterium.y - (length / 2) * Math.sin(bacterium.orientation);
      const x2 = bacterium.x + (length / 2) * Math.cos(bacterium.orientation);
      const y2 = bacterium.y + (length / 2) * Math.sin(bacterium.orientation);

      graphics.fillCircle(x1, y1, width);
      graphics.fillCircle(x2, y2, width);
      graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));

      // Capsule if capsule stain and organism has capsule
      if (this.currentStain === 'capsule' && organism.capsule) {
        graphics.lineStyle(2, 0x4169e1, 0.3);
        graphics.strokeEllipse(bacterium.x, bacterium.y, length * 1.5, width * 1.5);
      }
    }
  }

  private calculateDefocus(zDepth: number, objectSize: number = 1): { sizeMultiplier: number; opacityMultiplier: number; blurWidth: number } {
    // Optical defocus algorithm based on depth of field
    // zDepth: effective range -24 to +24 (focus offset -15 to +15, blood cells -9 to +9)
    // objectSize: physical size of object - larger objects stay visible longer when defocused
    
    // Size-dependent depth of field - larger objects have greater tolerance to defocus
    // Blood cells (~8 units) vs bacteria (~1-2 units)
    const sizeScale = Math.log10(objectSize + 1) * 0.5 + 1; // Logarithmic scaling
    const effectiveZDepth = zDepth / sizeScale; // Larger objects "feel" less defocus
    
    // Allow full range without clamping (can go beyond organism z-depths)
    const defocusAmount = Math.abs(effectiveZDepth) / 15; // Normalize to 0-1+ (can exceed 1)
    
    // Cubic falloff for very aggressive fading when out of focus
    const blurFactor = defocusAmount * defocusAmount * defocusAmount;
    
    // Size increases dramatically with defocus (point spread function)
    // In-focus: 1.0x, extreme defocus: 3.5x size (very blurry, can exceed specimen range)
    const sizeMultiplier = 1.0 + (blurFactor * 2.5);
    
    // Opacity decreases very rapidly with defocus
    // Using higher base falloff and steeper curve for faster disappearance
    // Small objects (bacteria): nearly instant fade
    // Large objects (blood cells): still fade quickly but slightly more gradual
    const opacityFalloff = 5.5 - (sizeScale * 0.05); // Higher base falloff, larger objects still get some benefit
    const opacityMultiplier = Math.max(0.0, 1.0 - (blurFactor * opacityFalloff));
    
    // Blur width increases significantly
    // In-focus: 1px, extreme defocus: 8px (very soft edges)
    const blurWidth = 1 + (blurFactor * 7);
    
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
    if (!this.selectedDiagnosis || !this.selectedSampleType) {
      return;
    }

    const isCorrectSample = this.selectedSampleType === this.currentCase.correctSampleType;
    const isCorrectOrganism = this.selectedDiagnosis === this.currentCase.organismId;
    
    // Player can only be truly correct if they selected the right sample AND identified it correctly
    const isFullyCorrect = isCorrectSample && isCorrectOrganism;

    // Clear previous feedback
    this.children.list
      .filter((child) => child.name === 'feedback')
      .forEach((child) => child.destroy());

    // Determine feedback message
    let feedbackColor: string;
    let feedbackText: string;
    let detailText: string;

    if (isFullyCorrect) {
      feedbackColor = '#2a6a2a';
      feedbackText = 'CORRECT!';
      detailText = 'You selected the correct sample and identified the pathogen!';
    } else if (!isCorrectSample) {
      feedbackColor = '#6a4a2a';
      feedbackText = 'WRONG SAMPLE';
      const correctSampleLabel = this.getSampleTypeLabel(this.currentCase.correctSampleType);
      detailText = `No pathogen visible - only background material. Correct sample: ${correctSampleLabel}`;
    } else {
      // Correct sample but wrong identification
      feedbackColor = '#6a2a2a';
      feedbackText = 'INCORRECT';
      const correctOrganism = ORGANISMS.find((o) => o.id === this.currentCase.organismId);
      detailText = `The correct answer was: ${correctOrganism?.scientificName}`;
    }

    // Show feedback
    this.add
      .rectangle(640, 650, 500, 60, Phaser.Display.Color.HexStringToColor(feedbackColor).color)
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
      .text(640, 665, detailText, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setName('feedback');
  }

  private showCasePresentation() {
    // Case info
    this.add
      .text(640, 100, this.currentCase.title, {
        fontSize: '24px',
        color: '#ffd700',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setName('casePresentation');

    this.add
      .text(640, 180, this.currentCase.story, {
        fontSize: '16px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
        wordWrap: { width: 800 },
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setName('casePresentation');

    // Sample selection instruction
    this.add
      .text(640, 280, 'Select a sample type to examine:', {
        fontSize: '18px',
        color: '#cccccc',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setName('casePresentation');

    // Sample type buttons
    const sampleTypes: Array<{ type: SampleType; label: string }> = [
      { type: 'blood', label: 'Blood Sample' },
      { type: 'sputum', label: 'Sputum' },
      { type: 'throat-swab', label: 'Throat Swab' },
      { type: 'stool', label: 'Stool Sample' },
      { type: 'wound', label: 'Wound Swab' },
      { type: 'csf', label: 'Cerebrospinal Fluid' },
      { type: 'urine', label: 'Urine Sample' },
      { type: 'tissue', label: 'Tissue Biopsy' },
    ];

    const buttonsPerRow = 4;
    const buttonWidth = 180;
    const buttonHeight = 45;
    const buttonSpacing = 200;
    const rowSpacing = 70;
    const startY = 340;

    sampleTypes.forEach((sample, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const x = 640 - ((buttonsPerRow - 1) * buttonSpacing) / 2 + col * buttonSpacing;
      const y = startY + row * rowSpacing;

      const button = this.add
        .rectangle(x, y, buttonWidth, buttonHeight, 0x4a3a2a)
        .setStrokeStyle(2, 0x6a5a4a)
        .setInteractive({ useHandCursor: true })
        .setName('casePresentation');

      this.add
        .text(x, y, sample.label, {
          fontSize: '13px',
          color: '#e0e0e0',
          fontFamily: 'Courier New',
          align: 'center',
        })
        .setOrigin(0.5)
        .setName('casePresentation');

      button.on('pointerover', () => {
        button.setFillStyle(0x6a5a4a);
      });

      button.on('pointerout', () => {
        button.setFillStyle(0x4a3a2a);
      });

      button.on('pointerdown', () => {
        this.onSampleSelected(sample.type);
      });
    });
  }

  private onSampleSelected(sampleType: SampleType) {
    this.selectedSampleType = sampleType;

    // Remove case presentation UI
    this.children.list
      .filter((child) => child.name === 'casePresentation')
      .forEach((child) => child.destroy());

    // Determine which organism to show
    const isCorrectSample = sampleType === this.currentCase.correctSampleType;
    
    if (isCorrectSample) {
      // Show the pathogen
      this.currentOrganism = ORGANISMS.find((o) => o.id === this.currentCase.organismId);
    } else {
      // Wrong sample - no bacteria visible, only background material
      this.currentOrganism = undefined;
    }

    // Seed random number generator for consistent bacteria placement
    const caseIndex = CASES.indexOf(this.currentCase);
    Phaser.Math.RND.sow([caseIndex.toString()]);

    // Show selected sample type info
    this.add
      .text(640, 70, `${this.currentCase.title} - ${this.getSampleTypeLabel(sampleType)}`, {
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

    // Proceed to microscope view
    this.createMicroscopeViewer();
    this.createFocusControl();
    this.createStainingControls();
    this.createReferenceManual();
    this.createDiagnosisInterface();

    // Add "Change Sample" button AFTER other UI so it's on top
    const changeSampleBtn = this.add
      .rectangle(80, 160, 140, 30, 0x4a3a2a)
      .setStrokeStyle(2, 0x6a5a4a)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000) // Ensure it's on top
      .on('pointerover', () => changeSampleBtn.setFillStyle(0x6a5a4a))
      .on('pointerout', () => changeSampleBtn.setFillStyle(0x4a3a2a))
      .on('pointerdown', () => this.returnToSampleSelection());

    this.add
      .text(80, 160, 'Change Sample', {
        fontSize: '12px',
        color: '#e0e0e0',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setDepth(1000); // Ensure it's on top
  }

  private getSampleTypeLabel(sampleType: SampleType): string {
    const labels: Record<SampleType, string> = {
      'blood': 'Blood Sample',
      'sputum': 'Sputum',
      'throat-swab': 'Throat Swab',
      'stool': 'Stool Sample',
      'wound': 'Wound Swab',
      'csf': 'Cerebrospinal Fluid',
      'urine': 'Urine Sample',
      'tissue': 'Tissue Biopsy',
    };
    return labels[sampleType];
  }

  private returnToSampleSelection() {
    // Clear all microscope and UI elements except title
    this.children.list
      .filter((child) => {
        // Keep the title at top
        const text = child as Phaser.GameObjects.Text;
        return !(text.y === 30 && text.text?.includes('BioLogic Laboratory'));
      })
      .forEach((child) => child.destroy());

    // Reset state
    this.currentOrganism = undefined;
    this.selectedSampleType = null;
    this.selectedDiagnosis = null;
    this.currentStain = 'none';
    this.microscopeContainer = null;
    this.floatingDust = [];
    this.apertureVignette = null;
    this.focusOffset = 0;
    this.slide = null;

    // Show case presentation again
    this.showCasePresentation();
  }
}
