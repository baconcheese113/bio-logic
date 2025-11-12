<script lang="ts">
  import { onMount } from 'svelte';
  import Phaser from 'phaser';
  import { currentElectrophoresisData } from '../../../stores/game-state';

  let canvasContainer = $state<HTMLDivElement>();
  let game = $state<Phaser.Game>();
  let scene = $state<Phaser.Scene>();
  
  // Gel state
  let proteinBands = $state<Phaser.GameObjects.Container[]>([]);
  let proteinLabels = $state<Phaser.GameObjects.GameObject[]>([]);
  let isRunning = $state(false);
  let isStained = $state(false);
  let migrationComplete = $state(false);

  export function runElectrophoresis() {
    if (!scene || isRunning) return;
    isRunning = true;
    isStained = false;
    migrationComplete = false;
    
    // Clear existing bands and labels
    proteinBands.forEach(band => band.destroy());
    proteinBands = [];
    proteinLabels.forEach(label => label.destroy());
    proteinLabels = [];
    
    // Start migration animation
    animateProteinMigration();
  }

  function animateProteinMigration() {
    if (!scene) return;
    
    const centerX = 500;
    const gelTop = 160;
    const gelHeight = 380;
    
    // Get protein data from current electrophoresis data
    const electrophoresisData = $currentElectrophoresisData;
    const densitometer = electrophoresisData?.densitometer;
    
    if (!densitometer) {
      // Default pattern if no data
      createProteinBands(centerX, gelTop, gelHeight, {
        albumin: 60,
        alpha1: 3.5,
        alpha2: 8,
        beta: 11,
        gamma: 17.5,
      });
      return;
    }
    
    createProteinBands(centerX, gelTop, gelHeight, densitometer);
  }

  function createProteinBands(
    centerX: number,
    gelTop: number,
    gelHeight: number,
    densitometer: { albumin: number; alpha1: number; alpha2: number; beta: number; gamma: number }
  ) {
    if (!scene) return;
    
    // Get the pattern type to apply special rendering
    const electrophoresisData = $currentElectrophoresisData;
    const pattern = electrophoresisData?.pattern || 'normal';
    
    // Protein zones migrate at different rates
    // Albumin travels fastest (smallest), gamma slowest (largest)
    // For beta-gamma bridge, positions are closer to show merging
    const betaDistance = pattern === 'beta-gamma-bridge' ? 0.32 : 0.36;
    const gammaDistance = pattern === 'beta-gamma-bridge' ? 0.24 : 0.20;
    
    const zones = [
      { name: 'Albumin', percentage: densitometer.albumin, distance: 0.78, baseWidth: 35, region: 'albumin' },
      { name: 'α₁', percentage: densitometer.alpha1, distance: 0.62, baseWidth: 25, region: 'alpha1' },
      { name: 'α₂', percentage: densitometer.alpha2, distance: 0.50, baseWidth: 30, region: 'alpha2' },
      { name: 'β', percentage: densitometer.beta, distance: betaDistance, baseWidth: 32, region: 'beta' },
      { name: 'γ', percentage: densitometer.gamma, distance: gammaDistance, baseWidth: 40, region: 'gamma' },
    ];

    const bandLaneWidth = 420;
    
    zones.forEach((zone, index) => {
      const container = scene!.add.container(centerX, 0);
      const targetY = gelTop + (gelHeight * zone.distance);
      
      // Calculate band appearance based on pattern type
      let intensity = Math.min(1, zone.percentage / 40); // Normalized opacity
      let bandWidth = zone.baseWidth + (zone.percentage * 0.5); // Width varies with concentration
      
      // Pattern-specific modifications
      if (pattern === 'm-spike' && zone.region === 'gamma') {
        // M-spike: Make gamma MUCH darker and narrower
        intensity = Math.min(1, zone.percentage / 30); // Increased intensity
        bandWidth = 18; // Very narrow spike instead of broad band
      } else if (pattern === 'beta-gamma-bridge' && (zone.region === 'beta' || zone.region === 'gamma')) {
        // Beta-gamma bridge: Both bands elevated and will visually merge with increased width
        intensity = Math.min(1, zone.percentage / 32);
        bandWidth = zone.baseWidth + (zone.percentage * 1.2); // Much wider to create bridge effect
      } else if (pattern === 'low-albumin' && zone.region === 'albumin') {
        // Low albumin: Make albumin much fainter
        intensity = Math.min(0.5, zone.percentage / 60); // Much lower intensity
        bandWidth = zone.baseWidth + (zone.percentage * 0.3); // Thinner
      } else if (pattern === 'polyclonal-gammopathy') {
        // Polyclonal: All globulins elevated but no spike
        if (zone.region !== 'albumin') {
          intensity = Math.min(0.85, zone.percentage / 28);
          bandWidth = zone.baseWidth + (zone.percentage * 0.6);
        }
      }
      
      const bandHeight = bandLaneWidth;
      
      // Start at sample well
      const startY = gelTop + 5;
      
      // Create the band graphics
      const bandGraphics = scene!.add.graphics();
      container.add(bandGraphics);
      
      // Function to draw the band
      const drawBand = () => {
        bandGraphics.clear();
        
        if (isStained) {
          // Stained with Amido Black (blue-black stain)
          const stainColor = 0x1a2838; // Dark blue-black
          
          // Draw main band body (sharper, less feathering)
          const coreAlpha = Math.min(0.9, intensity * 0.95);
          bandGraphics.fillStyle(stainColor, coreAlpha);
          bandGraphics.fillRect(-bandHeight / 2, -bandWidth / 2 + 2, bandHeight, bandWidth - 4);
          
          // Slight edge softening (minimal diffusion)
          for (let i = 0; i < 2; i++) {
            const edgeAlpha = coreAlpha * 0.5;
            bandGraphics.fillStyle(stainColor, edgeAlpha);
            bandGraphics.fillRect(-bandHeight / 2, -bandWidth / 2 + i, bandHeight, 1);
            bandGraphics.fillRect(-bandHeight / 2, bandWidth / 2 - i, bandHeight, 1);
          }
        } else {
          // Unstained = invisible (proteins have no color)
          bandGraphics.fillStyle(0xffffff, 0.02);
          bandGraphics.fillRect(-bandHeight / 2, -bandWidth / 2, bandHeight, bandWidth);
        }
      };
      
      // Store the draw function on the container for later use
      (container as any).drawBand = drawBand;
      
      // Create label for this protein region (initially invisible)
      const labelBg = scene!.add.rectangle(
        centerX + bandLaneWidth / 2 + 45, 
        0, 
        70, 
        24, 
        0x000000, 
        0.75
      );
      labelBg.setOrigin(0.5, 0.5);
      labelBg.setAlpha(0);
      
      const label = scene!.add.text(centerX + bandLaneWidth / 2 + 45, 0, zone.name, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);
      label.setAlpha(0);
      label.setStroke('#000000', 3);
      
      proteinLabels.push(labelBg);
      proteinLabels.push(label);
      
      // Animate migration
      scene!.tweens.add({
        targets: container,
        y: targetY,
        duration: 2500 + (index * 300),
        ease: 'Cubic.easeOut',
        onStart: () => {
          container.y = startY;
        },
        onUpdate: () => {
          drawBand();
          // Update label position to follow band
          labelBg.y = container.y;
          label.y = container.y;
        },
        onComplete: () => {
          if (index === zones.length - 1) {
            isRunning = false;
            migrationComplete = true;
          }
        }
      });
      
      proteinBands.push(container);
    });
  }

  export function applyStain() {
    if (!migrationComplete || !scene) return;
    
    isStained = true;
    
    // Re-render all bands with stain visible
    proteinBands.forEach((container) => {
      const drawFunc = (container as any).drawBand;
      if (drawFunc) {
        drawFunc();
      }
    });
    
    // Show protein region labels with fade-in
    proteinLabels.forEach((label, index) => {
      scene!.tweens.add({
        targets: label,
        alpha: 1,
        duration: 600,
        delay: index * 80,
        ease: 'Sine.easeIn',
      });
    });
  }

  onMount(() => {
    if (!canvasContainer) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL,
      width: 1000,
      height: 700,
      parent: canvasContainer,
      backgroundColor: '#0a0a0a',
      scene: {
        create: createElectrophoresisScene,
      },
    };

    game = new Phaser.Game(config);

    return () => {
      game?.destroy(true);
    };
  });

  function createElectrophoresisScene(this: Phaser.Scene) {
    scene = this;
    
    const centerX = 500;
    const centerY = 350;
    
    // Lab bench surface (darker wood tone)
    this.add.rectangle(centerX, 680, 1000, 100, 0x1a1410);
    
    // Electrophoresis apparatus housing (beige plastic, common in 1950s-60s equipment)
    const housingColor = 0xd4c4a8;
    const housing = this.add.rectangle(centerX, centerY, 720, 580, housingColor);
    housing.setStrokeStyle(3, 0xa89878);
    
    // Inner chamber (darker)
    const chamber = this.add.rectangle(centerX, centerY + 10, 680, 520, 0x2a2a2a);
    chamber.setStrokeStyle(2, 0x4a4a4a);
    
    // Buffer chambers (glass-like containers on sides)
    const bufferGlass = 0x3a5a6a;
    const bufferLeft = this.add.rectangle(centerX - 280, centerY + 10, 80, 480, bufferGlass, 0.4);
    bufferLeft.setStrokeStyle(2, 0x5a7a8a, 0.6);
    const bufferRight = this.add.rectangle(centerX + 280, centerY + 10, 80, 480, bufferGlass, 0.4);
    bufferRight.setStrokeStyle(2, 0x5a7a8a, 0.6);
    
    // Buffer solution (light blue tint)
    this.add.rectangle(centerX - 280, centerY + 40, 70, 420, 0x6a9aaa, 0.25);
    this.add.rectangle(centerX + 280, centerY + 40, 70, 420, 0x6a9aaa, 0.25);
    
    // Cellulose acetate gel strip (semi-translucent white/cream)
    const gelStrip = this.add.rectangle(centerX, centerY + 10, 480, 420, 0xe8e4d8);
    gelStrip.setStrokeStyle(1, 0xc8c4b8);
    
    // Add subtle texture to gel strip
    const texture = this.add.graphics();
    for (let i = 0; i < 200; i++) {
      const x = centerX - 240 + Math.random() * 480;
      const y = centerY - 200 + Math.random() * 420;
      texture.fillStyle(0xd8d4c8, Math.random() * 0.1);
      texture.fillRect(x, y, 2, 2);
    }
    
    // Electrode wires and connections
    const wireColor = 0x8a7a6a;
    
    // Cathode (negative, top) - connects to top buffer chamber
    const cathodeWire = this.add.graphics();
    cathodeWire.lineStyle(4, wireColor);
    cathodeWire.beginPath();
    cathodeWire.moveTo(centerX - 350, 100);
    cathodeWire.lineTo(centerX - 280, 130);
    cathodeWire.strokePath();
    
    const cathodeTerminal = this.add.circle(centerX - 350, 100, 8, 0xff6666);
    cathodeTerminal.setStrokeStyle(2, 0xcc4444);
    
    this.add.text(centerX - 390, 90, '⊖', {
      fontSize: '28px',
      color: '#ff6666',
      fontStyle: 'bold',
    });
    
    // Anode (positive, bottom) - connects to bottom buffer chamber on opposite side
    const anodeWire = this.add.graphics();
    anodeWire.lineStyle(4, wireColor);
    anodeWire.beginPath();
    anodeWire.moveTo(centerX + 350, 600);
    anodeWire.lineTo(centerX + 280, 570);
    anodeWire.strokePath();
    
    const anodeTerminal = this.add.circle(centerX + 350, 600, 8, 0x66ff66);
    anodeTerminal.setStrokeStyle(2, 0x44cc44);
    
    this.add.text(centerX + 360, 590, '⊕', {
      fontSize: '28px',
      color: '#66ff66',
      fontStyle: 'bold',
    });
    
    // Sample application line (where serum was applied)
    this.add.rectangle(centerX, 165, 460, 2, 0x8a7a6a, 0.5);
    
    const sampleLabel = this.add.text(centerX, 130, 'Sample Application Line', {
      fontSize: '13px',
      color: '#6a6a6a',
      fontFamily: 'monospace',
    });
    sampleLabel.setOrigin(0.5);
    
    // Voltage indicator (vintage meter style)
    const meterX = centerX + 350;
    const meterY = centerY;
    
    const meterBody = this.add.rectangle(meterX, meterY, 100, 140, 0x2a2a2a);
    meterBody.setStrokeStyle(3, 0x4a4a4a);
    
    const meterFace = this.add.circle(meterX, meterY - 10, 35, 0xf8f4e8);
    meterFace.setStrokeStyle(2, 0x3a3a3a);
    
    // Meter needle
    const needle = this.add.graphics();
    needle.lineStyle(2, 0xcc4444);
    needle.beginPath();
    needle.moveTo(meterX, meterY - 10);
    needle.lineTo(meterX + 25, meterY - 10);
    needle.strokePath();
    
    this.add.text(meterX, meterY + 35, '120V', {
      fontSize: '14px',
      color: '#d8d8d8',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.add.text(meterX, meterY + 55, 'VOLTS', {
      fontSize: '10px',
      color: '#8a8a8a',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    // Instructions (fade out after first view)
    const instructions = this.add.text(centerX, centerY + 280, 
      'Run electrophoresis to separate proteins\nThen apply stain to visualize bands',
      {
        fontSize: '14px',
        color: '#6a6a6a',
        align: 'center',
        fontFamily: 'Arial',
      }
    );
    instructions.setOrigin(0.5);
    instructions.setAlpha(0.7);
    
    // Reference card (like scientists would have on their desk)
    // Create as container so it can be dragged and stay on top
    const refCardX = 820;
    const refCardY = 180;
    
    const refCardContainer = this.add.container(refCardX, refCardY);
    
    // Card background (aged paper)
    const refCard = this.add.rectangle(0, 0, 140, 240, 0xf8f4e0);
    refCard.setStrokeStyle(2, 0xa89878);
    refCardContainer.add(refCard);
    
    const refTitle = this.add.text(0, -105, 'Normal Pattern\nReference', {
      fontSize: '11px',
      color: '#2a2a2a',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    refTitle.setOrigin(0.5);
    refCardContainer.add(refTitle);
    
    // Draw miniature normal pattern
    const miniGelY = -50;
    const miniGelHeight = 150;
    
    // Mini gel strip background
    const miniGel = this.add.rectangle(0, miniGelY + 20, 100, miniGelHeight, 0xe8e4d8);
    miniGel.setStrokeStyle(1, 0xc8c4b8);
    refCardContainer.add(miniGel);
    
    // Normal pattern bands (based on standard serum)
    const normalBands = [
      { name: 'γ', y: 0.20, width: 15, intensity: 0.6 },
      { name: 'β', y: 0.36, width: 12, intensity: 0.5 },
      { name: 'α₂', y: 0.50, width: 11, intensity: 0.4 },
      { name: 'α₁', y: 0.62, width: 9, intensity: 0.35 },
      { name: 'Alb', y: 0.78, width: 13, intensity: 0.85 },
    ];
    
    const refBands = this.add.graphics();
    normalBands.forEach((band) => {
      const bandY = miniGelY + (miniGelHeight * band.y) - miniGelHeight / 2 + 20;
      const stainColor = 0x1a2838;
      
      // Draw band
      refBands.fillStyle(stainColor, band.intensity);
      refBands.fillRect(-45, bandY - band.width / 2, 90, band.width);
      
      // Label
      const label = this.add.text(-60, bandY, band.name, {
        fontSize: '9px',
        color: '#3a3a3a',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      });
      label.setOrigin(1, 0.5);
      refCardContainer.add(label);
    });
    refCardContainer.add(refBands);
    
    // Footer text
    const footer = this.add.text(0, 105, 'Standard Serum\n1957', {
      fontSize: '9px',
      color: '#6a6a6a',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'italic',
    });
    footer.setOrigin(0.5);
    refCardContainer.add(footer);
    
    // Make the reference card draggable and keep it on top
    refCardContainer.setInteractive(
      new Phaser.Geom.Rectangle(-70, -120, 140, 240),
      Phaser.Geom.Rectangle.Contains
    );
    refCardContainer.setDepth(1000); // Keep on top of everything
    
    this.input.setDraggable(refCardContainer);
    
    // Drag events
    this.input.on('drag', (_pointer: any, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
    
    // Visual feedback on hover
    refCardContainer.on('pointerover', () => {
      this.input.setDefaultCursor('grab');
    });
    
    refCardContainer.on('pointerout', () => {
      this.input.setDefaultCursor('default');
    });
    
    refCardContainer.on('pointerdown', () => {
      this.input.setDefaultCursor('grabbing');
      refCardContainer.setDepth(1001); // Bring to very front when grabbed
    });
    
    refCardContainer.on('pointerup', () => {
      this.input.setDefaultCursor('grab');
      refCardContainer.setDepth(1000);
    });
  }
</script>

<div class="electrophoresis-instrument">
  <div bind:this={canvasContainer} class="canvas-container"></div>
</div>

<style>
  .electrophoresis-instrument {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .canvas-container {
    width: 1000px;
    height: 700px;
  }
</style>
