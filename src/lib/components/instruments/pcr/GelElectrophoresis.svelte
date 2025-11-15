<script lang="ts">
  import Phaser from 'phaser';
  import type { PrimerQuality } from '../../../../data/organisms';

  interface Props {
    primerQuality: PrimerQuality;
    step: 1 | 2 | 3 | 4;
    isRunning: boolean;
    onComplete?: (fragmentSize: number) => void;
    onHover?: (key: string) => void;
  }

  let { 
    primerQuality,
    step,
    isRunning,
    onComplete = () => {},
    // onHover = () => {}
  }: Props = $props();

  let canvasContainer = $state<HTMLDivElement>();
  let game = $state<Phaser.Game>();
  let currentScene = $state<Phaser.Scene>();

  // React to step changes
  $effect(() => {
    if (!currentScene) return;
    
    if (step === 1 || step === 2 || step === 3) {
      renderGelApparatus();
    } else if (step === 4) {
      renderUVView();
      // Calculate fragment size and trigger completion
      const fragmentSize = primerQuality.expectedBandPattern === 'clean' || 
                          primerQuality.expectedBandPattern === 'weak'
        ? primerQuality.productSize
        : 0;
      onComplete(fragmentSize);
    }
  });

  // Render gel apparatus (steps 1, 2, and 3)
  function renderGelApparatus() {
    if (!currentScene) return;
    
    currentScene.children.removeAll();
    currentScene.cameras.main.setBackgroundColor('#3a3a3a');
    
    const graphics = currentScene.add.graphics();
    const centerX = 300;

    // Title
    const title = step === 1 ? 'Load PCR Product into Gel' :
                  step === 2 && !isRunning ? 'Ready to Run Electrophoresis' :
                  isRunning ? 'Running Electrophoresis...' :
                  'Electrophoresis Complete';
    currentScene.add.text(centerX, 20, title, {
      fontSize: '16px',
      color: '#e0e0e0',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    
    // === GEL CASTING TRAY (Yellow/Amber) ===
    const trayX = 30;
    const trayY = 50;
    const trayW = 380;
    const trayH = 360;
    
    // Tray shadow
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRoundedRect(trayX + 5, trayY + 5, trayW, trayH, 4);
    
    // Main tray - YELLOW/AMBER acrylic (classic 1980s style)
    graphics.fillStyle(0xffcc00, 0.7);
    graphics.fillRoundedRect(trayX, trayY, trayW, trayH, 4);
    
    // Tray walls (darker amber edges)
    graphics.lineStyle(6, 0xcc9900, 0.9);
    graphics.strokeRoundedRect(trayX, trayY, trayW, trayH, 4);
    
    // Inner tray highlight
    graphics.lineStyle(2, 0xffdd44, 0.5);
    graphics.strokeRoundedRect(trayX + 6, trayY + 6, trayW - 12, trayH - 12, 3);

    // === BUFFER LIQUID (TAE) - Clear/slightly tinted ===
    const bufferX = trayX + 20;
    const bufferY = trayY + 20;
    const bufferW = trayW - 40;
    const bufferH = trayH - 40;
    
    // Buffer - very light blue tint
    graphics.fillStyle(0x88aacc, 0.2);
    graphics.fillRect(bufferX, bufferY, bufferW, bufferH);
    
    // Buffer surface shine
    graphics.fillStyle(0xffffff, 0.15);
    graphics.fillRect(bufferX, bufferY, bufferW, 6);

    // === ELECTRODES (Platinum wire in yellow holders) ===
    // Cathode (negative) - LEFT side
    const cathodeX = bufferX + 15;
    graphics.lineStyle(3, 0xc0c0c0, 1);
    graphics.lineBetween(cathodeX, bufferY + 10, cathodeX, bufferY + bufferH - 10);
    
    // Yellow electrode holder
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillRect(cathodeX - 8, bufferY - 8, 16, 12);
    graphics.lineStyle(1, 0xcc9900, 1);
    graphics.strokeRect(cathodeX - 8, bufferY - 8, 16, 12);
    
    // Anode (positive) - RIGHT side  
    const anodeX = bufferX + bufferW - 15;
    graphics.lineStyle(3, 0xc0c0c0, 1);
    graphics.lineBetween(anodeX, bufferY + 10, anodeX, bufferY + bufferH - 10);
    
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillRect(anodeX - 8, bufferY - 8, 16, 12);
    graphics.lineStyle(1, 0xcc9900, 1);
    graphics.strokeRect(anodeX - 8, bufferY - 8, 16, 12);

    // === AGAROSE GEL SLAB - Milky white/translucent ===
    const gelX = bufferX + 35;
    const gelY = bufferY + 15;
    const gelW = bufferW - 70;
    const gelH = bufferH - 30;
    
    // Gel - milky/cloudy white
    graphics.fillStyle(0xf5f5f5, 0.85);
    graphics.fillRect(gelX, gelY, gelW, gelH);
    
    // Gel texture speckles
    graphics.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 20; i++) {
      const px = gelX + Math.random() * gelW;
      const py = gelY + Math.random() * gelH;
      graphics.fillCircle(px, py, 0.5 + Math.random());
    }
    
    // Gel edge
    graphics.lineStyle(1, 0xdddddd, 0.7);
    graphics.strokeRect(gelX, gelY, gelW, gelH);

    // === WELLS (dark indentations in gel) ===
    const wellW = 16;
    const wellH = 12;
    const wellSpacing = 34;
    const numWells = 6;
    const firstWellX = gelX + (gelW - (numWells - 1) * wellSpacing - wellW) / 2;
    const wellY = gelY + 8;
    
    graphics.fillStyle(0x444444, 0.7);
    for (let i = 0; i < numWells; i++) {
      const wx = firstWellX + i * wellSpacing;
      graphics.fillRect(wx, wellY, wellW, wellH);
    }

    // Well labels
    const ladderX = firstWellX + wellW / 2;
    const sampleX = firstWellX + wellSpacing + wellW / 2;
    
    currentScene.add.text(ladderX, gelY - 8, 'L', {
      fontSize: '10px',
      color: '#333333',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    currentScene.add.text(sampleX, gelY - 8, 'S', {
      fontSize: '10px',
      color: '#333333',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // === LOADING DYE (if sample loaded) ===
    if (step >= 2) {
      graphics.fillStyle(0x0055cc, 0.8);
      graphics.fillRect(ladderX - wellW/2 + 2, wellY + 2, wellW - 4, wellH - 4);
      graphics.fillRect(sampleX - wellW/2 + 2, wellY + 2, wellW - 4, wellH - 4);

      // Migration during run
      if (isRunning) {
        const migrationDist = 40;
        const dyeY = wellY + wellH + migrationDist;
        
        graphics.fillStyle(0x0055cc, 0.6);
        graphics.fillRect(ladderX - 6, dyeY, 12, 3);
        graphics.fillRect(sampleX - 6, dyeY, 12, 3);
        
        // Trail
        for (let i = 0; i < migrationDist; i += 6) {
          const trailY = wellY + wellH + i;
          const alpha = 0.25 * (1 - i / migrationDist);
          graphics.fillStyle(0x0055cc, alpha);
          graphics.fillRect(ladderX - 4, trailY, 8, 4);
          graphics.fillRect(sampleX - 4, trailY, 8, 4);
        }
      }
    }

    // === POWER SUPPLY BOX ===
    const psX = 430;
    const psY = 50;
    const psW = 150;
    const psH = 360;
    
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRoundedRect(psX + 3, psY + 3, psW, psH, 3);
    
    // Main body - classic beige/cream lab equipment color
    graphics.fillStyle(0xe8dcc8, 1);
    graphics.fillRoundedRect(psX, psY, psW, psH, 3);
    graphics.lineStyle(2, 0x9a8b6f, 1);
    graphics.strokeRoundedRect(psX, psY, psW, psH, 3);
    
    // Front panel label plate
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillRect(psX + 10, psY + 20, psW - 20, 22);
    currentScene.add.text(psX + psW/2, psY + 28, 'EC APPARATUS CORP', {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    currentScene.add.text(psX + psW/2, psY + 37, 'MODEL EC-105', {
      fontSize: '7px',
      color: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Digital voltage display (LCD)
    graphics.fillStyle(0x2a4a2a, 1);
    graphics.fillRect(psX + 20, psY + 60, psW - 40, 40);
    graphics.lineStyle(1, 0x1a2a1a, 1);
    graphics.strokeRect(psX + 20, psY + 60, psW - 40, 40);
    
    const voltage = isRunning ? '100' : '000';
    currentScene.add.text(psX + psW/2, psY + 80, voltage, {
      fontSize: '28px',
      color: isRunning ? '#00ff00' : '#003300',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    currentScene.add.text(psX + psW/2 + 36, psY + 80, 'V', {
      fontSize: '16px',
      color: isRunning ? '#00ff00' : '#003300',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Current meter (smaller LCD below voltage)
    const current = isRunning ? '042' : '000';
    currentScene.add.text(psX + psW/2 - 10, psY + 110, current, {
      fontSize: '12px',
      color: isRunning ? '#00ff00' : '#003300',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    currentScene.add.text(psX + psW/2 + 24, psY + 110, 'mA', {
      fontSize: '10px',
      color: isRunning ? '#00ff00' : '#003300',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Power LED
    const ledColor = isRunning ? 0x00ff00 : 0x113311;
    graphics.fillStyle(ledColor, 1);
    graphics.fillCircle(psX + 30, psY + 145, 5);
    graphics.lineStyle(1, 0x333333, 1);
    graphics.strokeCircle(psX + 30, psY + 145, 5);
    
    currentScene.add.text(psX + 42, psY + 145, 'POWER', {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);
    
    // Voltage knob
    graphics.fillStyle(0x3a3a3a, 1);
    graphics.fillCircle(psX + psW/2, psY + 200, 22);
    graphics.lineStyle(2, 0x2a2a2a, 1);
    graphics.strokeCircle(psX + psW/2, psY + 200, 22);
    
    // Knob indicator line
    graphics.lineStyle(2, 0xcccccc, 1);
    graphics.lineBetween(psX + psW/2, psY + 200, psX + psW/2 + 15, psY + 200);
    
    currentScene.add.text(psX + psW/2, psY + 235, 'VOLTAGE', {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Output terminals
    const termY = psY + psH - 50;
    
    // Negative terminal (black)
    graphics.fillStyle(0x1a1a1a, 1);
    graphics.fillCircle(psX + 35, termY, 10);
    graphics.lineStyle(1, 0x000000, 1);
    graphics.strokeCircle(psX + 35, termY, 10);
    
    currentScene.add.text(psX + 35, termY - 15, '−', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Positive terminal (red)
    graphics.fillStyle(0xcc0000, 1);
    graphics.fillCircle(psX + psW - 35, termY, 10);
    graphics.lineStyle(1, 0x880000, 1);
    graphics.strokeCircle(psX + psW - 35, termY, 10);
    
    currentScene.add.text(psX + psW - 35, termY - 15, '+', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

  }


  // Render UV transilluminator view (step 4)
  function renderUVView() {
    if (!currentScene) return;
    
    currentScene.children.removeAll();
    currentScene.cameras.main.setBackgroundColor('#2a2a2a');
    
    const graphics = currentScene.add.graphics();
    const centerX = 300;

    // Title
    currentScene.add.text(centerX, 20, 'UV Transilluminator - DNA Analysis', {
      fontSize: '16px',
      color: '#e0e0e0',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // === GEL CASTING TRAY ===
    const trayX = 30;
    const trayY = 50;
    const trayW = 380;
    const trayH = 360;
    
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRoundedRect(trayX + 5, trayY + 5, trayW, trayH, 4);
    graphics.fillStyle(0xffcc00, 0.7);
    graphics.fillRoundedRect(trayX, trayY, trayW, trayH, 4);
    graphics.lineStyle(6, 0xcc9900, 0.9);
    graphics.strokeRoundedRect(trayX, trayY, trayW, trayH, 4);
    graphics.lineStyle(2, 0xffdd44, 0.5);
    graphics.strokeRoundedRect(trayX + 6, trayY + 6, trayW - 12, trayH - 12, 3);

    const bufferX = trayX + 20;
    const bufferY = trayY + 20;
    const bufferW = trayW - 40;
    const bufferH = trayH - 40;
    
    graphics.fillStyle(0x88aacc, 0.2);
    graphics.fillRect(bufferX, bufferY, bufferW, bufferH);
    graphics.fillStyle(0xffffff, 0.15);
    graphics.fillRect(bufferX, bufferY, bufferW, 6);

    // Electrodes
    const cathodeX = bufferX + 15;
    graphics.lineStyle(3, 0xc0c0c0, 1);
    graphics.lineBetween(cathodeX, bufferY + 10, cathodeX, bufferY + bufferH - 10);
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillRect(cathodeX - 8, bufferY - 8, 16, 12);
    graphics.lineStyle(1, 0xcc9900, 1);
    graphics.strokeRect(cathodeX - 8, bufferY - 8, 16, 12);
    
    const anodeX = bufferX + bufferW - 15;
    graphics.lineStyle(3, 0xc0c0c0, 1);
    graphics.lineBetween(anodeX, bufferY + 10, anodeX, bufferY + bufferH - 10);
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillRect(anodeX - 8, bufferY - 8, 16, 12);
    graphics.lineStyle(1, 0xcc9900, 1);
    graphics.strokeRect(anodeX - 8, bufferY - 8, 16, 12);

    // === AGAROSE GEL - GLOWING ORANGE UNDER UV ===
    const gelX = bufferX + 35;
    const gelY = bufferY + 15;
    const gelW = bufferW - 70;
    const gelH = bufferH - 30;
    
    // Gel glow effect (outer halo)
    graphics.fillStyle(0xff8833, 0.15);
    graphics.fillRect(gelX - 4, gelY - 4, gelW + 8, gelH + 8);
    
    // Main glowing gel
    graphics.fillStyle(0xff9955, 0.95);
    graphics.fillRect(gelX, gelY, gelW, gelH);
    graphics.lineStyle(1, 0xffaa66, 0.7);
    graphics.strokeRect(gelX, gelY, gelW, gelH);

    // === WELLS (still visible as dark indentations) ===
    const wellW = 16;
    const wellH = 12;
    const wellSpacing = 34;
    const numWells = 6;
    const firstWellX = gelX + (gelW - (numWells - 1) * wellSpacing - wellW) / 2;
    const wellY = gelY + 8;
    
    graphics.fillStyle(0x662200, 0.8);
    for (let i = 0; i < numWells; i++) {
      const wx = firstWellX + i * wellSpacing;
      graphics.fillRect(wx, wellY, wellW, wellH);
    }

    const ladderX = firstWellX + wellW / 2;
    const sampleX = firstWellX + wellSpacing + wellW / 2;
    
    currentScene.add.text(ladderX, gelY - 8, 'L', {
      fontSize: '10px',
      color: '#ffaa66',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    currentScene.add.text(sampleX, gelY - 8, 'S', {
      fontSize: '10px',
      color: '#ffaa66',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // === DNA LADDER BANDS (standard marker sizes) ===
    const ladderSizes = [2000, 1500, 1000, 750, 500, 250, 100];
    ladderSizes.forEach(size => {
      const bandY = getBandYPosition(size, wellY);
      const bandW = 12;
      const bandH = 3;
      
      // Glow layer
      graphics.fillGradientStyle(0xff6600, 0xff6600, 0xff6600, 0xff6600, 0.3, 0.3, 0.3, 0.3);
      graphics.fillRect(ladderX - bandW/2, bandY - 1, bandW, 5);
      
      // Sharp band with gradient
      graphics.fillGradientStyle(0xff5500, 0xff5500, 0xff3300, 0xff3300, 1, 1, 0.8, 0.8);
      graphics.fillRect(ladderX - bandW/2, bandY, bandW, bandH);
    });

    // === SAMPLE BANDS (based on primerQuality) ===
    const pattern = primerQuality.expectedBandPattern;
    const productSize = primerQuality.productSize;
    
    if (pattern === 'clean') {
      // Single sharp bright band
      const bandY = getBandYPosition(productSize, wellY);
      const bandW = 12;
      const bandH = 3;
      
      graphics.fillGradientStyle(0xff6600, 0xff6600, 0xff6600, 0xff6600, 0.3, 0.3, 0.3, 0.3);
      graphics.fillRect(sampleX - bandW/2, bandY - 1, bandW, 5);
      graphics.fillGradientStyle(0xff5500, 0xff5500, 0xff3300, 0xff3300, 1, 1, 0.8, 0.8);
      graphics.fillRect(sampleX - bandW/2, bandY, bandW, bandH);
      
    } else if (pattern === 'weak') {
      // Dim band at product size
      const bandY = getBandYPosition(productSize, wellY);
      const bandW = 12;
      const bandH = 3;
      
      graphics.fillGradientStyle(0xcc6633, 0xcc6633, 0xcc6633, 0xcc6633, 0.2, 0.2, 0.2, 0.2);
      graphics.fillRect(sampleX - bandW/2, bandY - 1, bandW, 5);
      graphics.fillGradientStyle(0xcc5533, 0xcc5533, 0xaa3322, 0xaa3322, 0.6, 0.6, 0.4, 0.4);
      graphics.fillRect(sampleX - bandW/2, bandY, bandW, bandH);
      
    } else if (pattern === 'smeared') {
      // Vertical smear of overlapping bands
      for (let y = wellY + 20; y < wellY + 80; y += 3) {
        const bandW = 10;
        const bandH = 4;
        const alpha = 0.3 + Math.random() * 0.3;
        
        graphics.fillGradientStyle(0xff6633, 0xff6633, 0xff4422, 0xff4422, alpha, alpha, alpha * 0.7, alpha * 0.7);
        graphics.fillRect(sampleX - bandW/2, y, bandW, bandH);
      }
      
    } else if (pattern === 'dimers') {
      // Small band near bottom (primer dimers ~100bp)
      const dimerY = getBandYPosition(100, wellY);
      const bandW = 12;
      const bandH = 3;
      
      graphics.fillGradientStyle(0xff6600, 0xff6600, 0xff6600, 0xff6600, 0.25, 0.25, 0.25, 0.25);
      graphics.fillRect(sampleX - bandW/2, dimerY - 1, bandW, 5);
      graphics.fillGradientStyle(0xff5500, 0xff5500, 0xff3300, 0xff3300, 0.8, 0.8, 0.6, 0.6);
      graphics.fillRect(sampleX - bandW/2, dimerY, bandW, bandH);
      
      // Main product band
      const productY = getBandYPosition(productSize, wellY);
      graphics.fillGradientStyle(0xff6600, 0xff6600, 0xff6600, 0xff6600, 0.3, 0.3, 0.3, 0.3);
      graphics.fillRect(sampleX - bandW/2, productY - 1, bandW, 5);
      graphics.fillGradientStyle(0xff5500, 0xff5500, 0xff3300, 0xff3300, 1, 1, 0.8, 0.8);
      graphics.fillRect(sampleX - bandW/2, productY, bandW, bandH);
    }
    // 'none' pattern: no bands rendered

    // === POWER SUPPLY BOX (same as normal view but powered off) ===
    const psX = 430;
    const psY = 50;
    const psW = 150;
    const psH = 360;
    
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRoundedRect(psX + 3, psY + 3, psW, psH, 3);
    graphics.fillStyle(0xe8dcc8, 1);
    graphics.fillRoundedRect(psX, psY, psW, psH, 3);
    graphics.lineStyle(2, 0x9a8b6f, 1);
    graphics.strokeRoundedRect(psX, psY, psW, psH, 3);
    
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillRect(psX + 10, psY + 20, psW - 20, 22);
    currentScene.add.text(psX + psW/2, psY + 28, 'EC APPARATUS CORP', {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    currentScene.add.text(psX + psW/2, psY + 37, 'MODEL EC-105', {
      fontSize: '7px',
      color: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    graphics.fillStyle(0x2a4a2a, 1);
    graphics.fillRect(psX + 20, psY + 60, psW - 40, 40);
    graphics.lineStyle(1, 0x1a2a1a, 1);
    graphics.strokeRect(psX + 20, psY + 60, psW - 40, 40);
    
    currentScene.add.text(psX + psW/2, psY + 80, '000', {
      fontSize: '28px',
      color: '#003300',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    currentScene.add.text(psX + psW/2 + 36, psY + 80, 'V', {
      fontSize: '16px',
      color: '#003300',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    currentScene.add.text(psX + psW/2 - 10, psY + 110, '000', {
      fontSize: '12px',
      color: '#003300',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    currentScene.add.text(psX + psW/2 + 24, psY + 110, 'mA', {
      fontSize: '10px',
      color: '#003300',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    graphics.fillStyle(0x113311, 1);
    graphics.fillCircle(psX + 30, psY + 145, 5);
    graphics.lineStyle(1, 0x333333, 1);
    graphics.strokeCircle(psX + 30, psY + 145, 5);
    
    currentScene.add.text(psX + 42, psY + 145, 'POWER', {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);
    
    graphics.fillStyle(0x3a3a3a, 1);
    graphics.fillCircle(psX + psW/2, psY + 200, 22);
    graphics.lineStyle(2, 0x2a2a2a, 1);
    graphics.strokeCircle(psX + psW/2, psY + 200, 22);
    graphics.lineStyle(2, 0xcccccc, 1);
    graphics.lineBetween(psX + psW/2, psY + 200, psX + psW/2 + 15, psY + 200);
    
    currentScene.add.text(psX + psW/2, psY + 235, 'VOLTAGE', {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    const termY = psY + psH - 50;
    graphics.fillStyle(0x1a1a1a, 1);
    graphics.fillCircle(psX + 35, termY, 10);
    graphics.lineStyle(1, 0x000000, 1);
    graphics.strokeCircle(psX + 35, termY, 10);
    currentScene.add.text(psX + 35, termY - 15, '−', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    graphics.fillStyle(0xcc0000, 1);
    graphics.fillCircle(psX + psW - 35, termY, 10);
    graphics.lineStyle(1, 0x880000, 1);
    graphics.strokeCircle(psX + psW - 35, termY, 10);
    currentScene.add.text(psX + psW - 35, termY - 15, '+', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Status message (removed - was rendering outside canvas)
    
    // Add DNA ladder reference card
    if (currentScene) createDNALadderReference(currentScene);
  }

  function getBandYPosition(size: number, wellY: number): number {
    // Map fragment size to Y position relative to wells
    // Smaller fragments migrate farther from wells
    // Maximum migration distance is ~260px (wellY is ~73, max is ~333 to stay in gel)
    if (size >= 2000) return wellY + 30;
    if (size >= 1500) return wellY + 65;
    if (size >= 1000) return wellY + 105;
    if (size >= 750) return wellY + 150;
    if (size >= 500) return wellY + 190;
    if (size >= 250) return wellY + 225;
    return wellY + 255; // < 250bp - stays within gel bounds
  }

  function createDNALadderReference(scene: Phaser.Scene) {
    // DNA ladder reference card (like gel documentation scientists would have)
    const refCardX = 580;
    const refCardY = 220;
    
    const refCardContainer = scene.add.container(refCardX, refCardY);
    
    // Card background (aged manual page/insert)
    const refCard = scene.add.rectangle(0, 0, 140, 320, 0xf8f4e0);
    refCard.setStrokeStyle(1, 0xa89878);
    refCardContainer.add(refCard);
    
    // Product header (typical 1980s documentation style)
    const header = scene.add.text(0, -145, 'BRL', {
      fontSize: '10px',
      color: '#2a2a2a',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    header.setOrigin(0.5);
    refCardContainer.add(header);
    
    const productName = scene.add.text(0, -132, '1 kb DNA Ladder', {
      fontSize: '9px',
      color: '#3a3a3a',
      align: 'center',
      fontFamily: 'Arial',
    });
    productName.setOrigin(0.5);
    refCardContainer.add(productName);
    
    const catNum = scene.add.text(0, -120, 'Cat. No. 5615SA', {
      fontSize: '7px',
      color: '#666666',
      align: 'center',
      fontFamily: 'Courier New',
    });
    catNum.setOrigin(0.5);
    refCardContainer.add(catNum);
    
    // Separator line
    const separator = scene.add.graphics();
    separator.lineStyle(1, 0xc8c4b8, 1);
    separator.lineBetween(-60, -108, 60, -108);
    refCardContainer.add(separator);
    
    // Fragment sizes table header
    const tableHeader = scene.add.text(0, -96, 'Fragment Sizes (bp)', {
      fontSize: '8px',
      color: '#2a2a2a',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    tableHeader.setOrigin(0.5);
    refCardContainer.add(tableHeader);
    
    // Ladder sizes in table format
    const ladderSizes = [
      { size: 2000, label: '2,000' },
      { size: 1500, label: '1,500' },
      { size: 1000, label: '1,000' },
      { size: 750, label: '750' },
      { size: 500, label: '500' },
      { size: 250, label: '250' },
      { size: 100, label: '100' },
    ];
    
    let yOffset = -75;
    ladderSizes.forEach((ladder) => {
      const sizeText = scene.add.text(0, yOffset, ladder.label, {
        fontSize: '9px',
        color: '#2a2a2a',
        fontFamily: 'Courier New',
        align: 'center',
      });
      sizeText.setOrigin(0.5);
      refCardContainer.add(sizeText);
      yOffset += 20;
    });
    
    // Footer with manufacturer info
    const footer1 = scene.add.text(0, 130, 'Bethesda Research', {
      fontSize: '7px',
      color: '#666666',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'italic',
    });
    footer1.setOrigin(0.5);
    refCardContainer.add(footer1);
    
    const footer2 = scene.add.text(0, 142, 'Laboratories, Inc.', {
      fontSize: '7px',
      color: '#666666',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'italic',
    });
    footer2.setOrigin(0.5);
    refCardContainer.add(footer2);
    
    // Make draggable
    refCardContainer.setInteractive(
      new Phaser.Geom.Rectangle(-70, -160, 140, 320),
      Phaser.Geom.Rectangle.Contains
    );
    refCardContainer.setDepth(1000);
    
    scene.input.setDraggable(refCardContainer);
    
    scene.input.on('drag', (_pointer: any, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
    
    refCardContainer.on('pointerover', () => {
      scene.input.setDefaultCursor('grab');
    });
    
    refCardContainer.on('pointerout', () => {
      scene.input.setDefaultCursor('default');
    });
    
    return refCardContainer;
  }

  // Initialize Phaser
  $effect(() => {
    if (!canvasContainer) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: canvasContainer,
      backgroundColor: '#0a0a0a',
      scene: {
        create: function() {
          currentScene = this;
          renderGelApparatus(); // Start with empty apparatus (includes reference card)
        }
      }
    };

    game = new Phaser.Game(config);

    return () => {
      game?.destroy(true);
    };
  });
</script>

<div class="gel-electrophoresis">
  <div class="visualization" bind:this={canvasContainer}></div>
</div>

<style>
  .gel-electrophoresis {
    width: 100%;
    height: 100%;
    background: #0a0a0a;
  }

  .visualization {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #0a0a0a;
  }
</style>
