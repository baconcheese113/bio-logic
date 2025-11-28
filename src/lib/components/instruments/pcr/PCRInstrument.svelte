<script lang="ts">
  import { onMount } from 'svelte';
  import Phaser from 'phaser';
  import type { PrimerQuality } from '../../../../data/organisms';

  interface Props {
    currentCycle?: number;
    currentTemp?: number;
    currentStage?: 'denaturation' | 'annealing' | 'extension' | 'idle';
    primerQuality?: PrimerQuality | null;
    hasSample?: boolean;
    onSamplePortClick?: () => void;
  }

  let { 
    currentCycle = 0, 
    currentTemp = 25, 
    currentStage = 'idle',
    primerQuality = null,
    hasSample = false,
    onSamplePortClick
  }: Props = $props();

  let phaserContainer = $state<HTMLDivElement>();
  let phaserGame: Phaser.Game | null = null;
  let currentScene: Phaser.Scene | null = null;
  let instrumentContainer: Phaser.GameObjects.Container | null = null;
  let samplePortHovered = $state(false);
  
  // Derive display mode from primer quality, sample, and cycling state
  let displayMode = $derived(() => {
    if (currentStage !== 'idle') return 'cycling';
    if (primerQuality && hasSample) return 'ready';
    if (primerQuality) return 'primers-loaded';
    return 'empty';
  });
  
  const centerX = 400;
  const centerY = 350;

  onMount(() => {
    if (!phaserContainer) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 700,
      parent: phaserContainer,
      backgroundColor: '#0a0a0a',
      scene: { create: createPCRScene }
    };

    phaserGame = new Phaser.Game(config);
    
    return () => {
      phaserGame?.destroy(true);
    };
  });

  // Render appropriate view when display mode changes
  $effect(() => {
    const mode = displayMode();
    if (mode === 'primers-loaded') {
      renderPrimerView();
    } else if (mode === 'cycling') {
      currentTemp; currentCycle; currentStage; // Track dependencies
      renderCyclingView();
    }
  });

  function createPCRScene(this: Phaser.Scene) {
    currentScene = this;
    instrumentContainer = this.add.container(0, 0);
    renderEmptyView();
  }

  function renderEmptyView() {
    if (!currentScene || !instrumentContainer) return;
    instrumentContainer.removeAll(true);

    // Main machine body - beige/tan metal casing (1980s style)
    const body = currentScene.add.graphics();
    body.fillStyle(0xd4c5b0, 1);
    body.fillRoundedRect(centerX - 220, centerY - 200, 440, 380, 8);
    body.lineStyle(4, 0xa89b88);
    body.strokeRoundedRect(centerX - 220, centerY - 200, 440, 380, 8);

    // Front panel - darker
    const panel = currentScene.add.graphics();
    panel.fillStyle(0x3a3a3a, 1);
    panel.fillRect(centerX - 200, centerY - 180, 400, 80);
    panel.lineStyle(2, 0x555555);
    panel.strokeRect(centerX - 200, centerY - 180, 400, 80);

    // LED display (7-segment style)
    const display = currentScene.add.graphics();
    display.fillStyle(0x1a1a1a, 1);
    display.fillRect(centerX - 150, centerY - 165, 120, 50);
    display.lineStyle(1, 0x333333);
    display.strokeRect(centerX - 150, centerY - 165, 120, 50);
    
    const displayText = currentScene.add.text(centerX - 90, centerY - 140, '25°C', {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Power indicator LED
    const powerLED = currentScene.add.graphics();
    powerLED.fillStyle(0x00ff00, 1);
    powerLED.fillCircle(centerX + 160, centerY - 140, 6);
    powerLED.lineStyle(1, 0x00aa00);
    powerLED.strokeCircle(centerX + 160, centerY - 140, 6);

    const powerLabel = currentScene.add.text(centerX + 120, centerY - 140, 'POWER', {
      fontSize: '10px',
      color: '#888'
    }).setOrigin(1, 0.5);

    // Heated block with tube wells - exposed metal block
    const heatedBlock = currentScene.add.graphics();
    heatedBlock.fillStyle(0x606060, 1);
    heatedBlock.fillRect(centerX - 180, centerY - 80, 360, 220);
    heatedBlock.lineStyle(2, 0x404040);
    heatedBlock.strokeRect(centerX - 180, centerY - 80, 360, 220);

    const wells = [];
    // Create 6x8 grid of tube wells (48 wells total - typical 1980s block)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const wellX = centerX - 160 + (col * 42);
        const wellY = centerY - 60 + (row * 35);
        
        const well = currentScene.add.graphics();
        well.fillStyle(0x2a2a2a, 1);
        well.fillCircle(wellX, wellY, 10);
        well.lineStyle(1, 0x1a1a1a);
        well.strokeCircle(wellX, wellY, 10);
        wells.push(well);
      }
    }

    const label = currentScene.add.text(centerX, centerY - 230, 'MJ Research PTC-100', {
      fontSize: '20px',
      color: '#2a2a2a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const instruction = currentScene.add.text(centerX, centerY + 160, 'Design primers and load samples', {
      fontSize: '14px',
      color: '#666'
    }).setOrigin(0.5);

    instrumentContainer.add([body, panel, display, displayText, powerLED, powerLabel, heatedBlock, label, instruction, ...wells]);
  }

  export function loadSample() {
    // Mode will auto-update via $derived when primerQuality is set
    renderPrimerView();
  }

  function renderPrimerView() {
    if (!currentScene || !instrumentContainer) return;
    instrumentContainer.removeAll(true);

    // Same machine body as empty view
    const body = currentScene.add.graphics();
    body.fillStyle(0xd4c5b0, 1);
    body.fillRoundedRect(centerX - 220, centerY - 200, 440, 380, 8);
    body.lineStyle(4, 0xa89b88);
    body.strokeRoundedRect(centerX - 220, centerY - 200, 440, 380, 8);

    const panel = currentScene.add.graphics();
    panel.fillStyle(0x3a3a3a, 1);
    panel.fillRect(centerX - 200, centerY - 180, 400, 80);
    panel.lineStyle(2, 0x555555);
    panel.strokeRect(centerX - 200, centerY - 180, 400, 80);

    const display = currentScene.add.graphics();
    display.fillStyle(0x1a1a1a, 1);
    display.fillRect(centerX - 150, centerY - 165, 120, 50);
    display.lineStyle(1, 0x333333);
    display.strokeRect(centerX - 150, centerY - 165, 120, 50);
    
    const displayText = currentScene.add.text(centerX - 90, centerY - 140, '25°C', {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const powerLED = currentScene.add.graphics();
    powerLED.fillStyle(0x00ff00, 1);
    powerLED.fillCircle(centerX + 160, centerY - 140, 6);

    const powerLabel = currentScene.add.text(centerX + 120, centerY - 140, 'POWER', {
      fontSize: '10px',
      color: '#888'
    }).setOrigin(1, 0.5);

    const heatedBlock = currentScene.add.graphics();
    heatedBlock.fillStyle(0x606060, 1);
    heatedBlock.fillRect(centerX - 180, centerY - 80, 360, 220);
    heatedBlock.lineStyle(2, 0x404040);
    heatedBlock.strokeRect(centerX - 180, centerY - 80, 360, 220);

    // Show PCR tubes loaded in first row (8 tubes)
    for (let col = 0; col < 8; col++) {
      const tubeX = centerX - 160 + (col * 42);
      const tubeY = centerY - 60;
      
      // PCR tube cap
      const cap = currentScene.add.graphics();
      const capColors = [0xff6b6b, 0x4a9eff, 0x5fb86c, 0xffd93d];
      cap.fillStyle(capColors[col % 4], 1);
      cap.fillCircle(tubeX, tubeY - 15, 8);
      cap.lineStyle(1, 0x333333);
      cap.strokeCircle(tubeX, tubeY - 15, 8);
      
      // Tube body
      const tube = currentScene.add.graphics();
      tube.fillStyle(0xe0e0e0, 0.9);
      tube.fillRect(tubeX - 6, tubeY - 10, 12, 25);
      tube.lineStyle(1, 0xaaaaaa);
      tube.strokeRect(tubeX - 6, tubeY - 10, 12, 25);
      
      instrumentContainer.add([cap, tube]);
    }

    // Draw rest of empty wells
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        if (row === 0) continue;
        const wellX = centerX - 160 + (col * 42);
        const wellY = centerY - 60 + (row * 35);
        
        const well = currentScene.add.graphics();
        well.fillStyle(0x2a2a2a, 1);
        well.fillCircle(wellX, wellY, 10);
        well.lineStyle(1, 0x1a1a1a);
        well.strokeCircle(wellX, wellY, 10);
        instrumentContainer.add(well);
      }
    }

    const label = currentScene.add.text(centerX, centerY - 230, 'MJ Research PTC-100', {
      fontSize: '20px',
      color: '#2a2a2a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const instruction = currentScene.add.text(centerX, centerY + 160, 'Samples loaded - ready to run', {
      fontSize: '14px',
      color: '#5fb86c'
    }).setOrigin(0.5);

    instrumentContainer.add([body, panel, display, displayText, powerLED, powerLabel, heatedBlock, label, instruction]);
  }

  export function startCycling() {
    // Mode will auto-update via $derived when currentStage changes
    renderCyclingView();
  }

  function renderCyclingView() {
    if (!currentScene || !instrumentContainer || displayMode() !== 'cycling') return;
    instrumentContainer.removeAll(true);

    // Machine body
    const body = currentScene.add.graphics();
    body.fillStyle(0xd4c5b0, 1);
    body.fillRoundedRect(centerX - 220, centerY - 200, 440, 380, 8);
    body.lineStyle(4, 0xa89b88);
    body.strokeRoundedRect(centerX - 220, centerY - 200, 440, 380, 8);

    // Front panel
    const panel = currentScene.add.graphics();
    panel.fillStyle(0x3a3a3a, 1);
    panel.fillRect(centerX - 200, centerY - 180, 400, 80);
    panel.lineStyle(2, 0x555555);
    panel.strokeRect(centerX - 200, centerY - 180, 400, 80);

    // LED display showing temperature
    const display = currentScene.add.graphics();
    display.fillStyle(0x1a1a1a, 1);
    display.fillRect(centerX - 150, centerY - 165, 120, 50);
    display.lineStyle(1, 0x333333);
    display.strokeRect(centerX - 150, centerY - 165, 120, 50);
    
    const tempColor = currentTemp > 85 ? '#ff4444' : currentTemp > 65 ? '#ff8844' : '#4488ff';
    const displayText = currentScene.add.text(centerX - 90, centerY - 140, `${currentTemp}°C`, {
      fontSize: '28px',
      color: tempColor,
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Cycling indicator LED (blinks during cycling)
    const cyclingLED = currentScene.add.graphics();
    cyclingLED.fillStyle(0xffaa00, 1);
    cyclingLED.fillCircle(centerX + 80, centerY - 140, 6);

    const cyclingLabel = currentScene.add.text(centerX + 40, centerY - 140, 'CYCLING', {
      fontSize: '10px',
      color: '#888'
    }).setOrigin(1, 0.5);

    // Power indicator
    const powerLED = currentScene.add.graphics();
    powerLED.fillStyle(0x00ff00, 1);
    powerLED.fillCircle(centerX + 160, centerY - 140, 6);

    const powerLabel = currentScene.add.text(centerX + 120, centerY - 140, 'POWER', {
      fontSize: '10px',
      color: '#888'
    }).setOrigin(1, 0.5);

    // Heated block with temperature-based color
    const blockColor = currentTemp > 85 ? 0xff6b6b : currentTemp > 65 ? 0xff8844 : 0x606060;
    const heatedBlock = currentScene.add.graphics();
    heatedBlock.fillStyle(blockColor, 1);
    heatedBlock.fillRect(centerX - 180, centerY - 80, 360, 220);
    heatedBlock.lineStyle(2, 0x404040);
    heatedBlock.strokeRect(centerX - 180, centerY - 80, 360, 220);

    // Draw wells in the heated block (6 rows x 8 columns)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const wellX = centerX - 160 + (col * 42);
        const wellY = centerY - 60 + (row * 35);
        
        heatedBlock.fillStyle(0x2a2a2a, 1);
        heatedBlock.fillCircle(wellX, wellY, 10);
        heatedBlock.lineStyle(1, 0x1a1a1a);
        heatedBlock.strokeCircle(wellX, wellY, 10);
      }
    }

    // Glowing effect when hot (add to container before tubes)
    let glowGraphic = null;
    if (currentTemp > 70) {
      glowGraphic = currentScene.add.graphics();
      glowGraphic.fillStyle(blockColor, 0.3);
      glowGraphic.fillRect(centerX - 185, centerY - 85, 370, 230);
    }

    // PCR tubes in heated block - only in first row, caps visible
    const tubeGraphics = [];
    for (let col = 0; col < 8; col++) {
      const tubeX = centerX - 160 + (col * 42);
      const tubeY = centerY - 60;
      
      // PCR tube cap (on top of wells)
      const cap = currentScene.add.graphics();
      const capColors = [0xff6b6b, 0x4a9eff, 0x5fb86c, 0xffd93d];
      cap.fillStyle(capColors[col % 4], 1);
      cap.fillCircle(tubeX, tubeY - 15, 8);
      cap.lineStyle(1, 0x333333);
      cap.strokeCircle(tubeX, tubeY - 15, 8);
      
      tubeGraphics.push(cap);
    }

    // Cycle counter
    const cycleText = currentScene.add.text(centerX, centerY + 150, `Cycle ${currentCycle} / 25`, {
      fontSize: '18px',
      color: '#5fb86c',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stage description
    const stageDescriptions = {
      'denaturation': '94°C - DNA strands separating',
      'annealing': `${currentTemp}°C - Primers binding`,
      'extension': '72°C - DNA polymerase extending',
      'idle': 'Idle'
    };
    const stageInfo = currentScene.add.text(centerX, centerY + 165, stageDescriptions[currentStage], {
      fontSize: '12px',
      color: '#888'
    }).setOrigin(0.5);

    const label = currentScene.add.text(centerX, centerY - 230, 'MJ Research PTC-100', {
      fontSize: '20px',
      color: '#2a2a2a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add elements in correct order: body, panel, display, block (with wells), glow, tubes on top
    const baseElements = [body, panel, display, displayText, cyclingLED, cyclingLabel, powerLED, powerLabel, heatedBlock];
    if (glowGraphic) baseElements.push(glowGraphic);
    baseElements.push(...tubeGraphics);
    baseElements.push(cycleText, stageInfo, label);
    
    instrumentContainer.add(baseElements);
  }

  export function completeCycling() {
    const completionText = currentScene?.add.text(centerX, centerY + 180, '✓ Amplification Complete', {
      fontSize: '18px',
      color: '#5fb86c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    if (completionText && instrumentContainer) {
      instrumentContainer.add(completionText);
    }
  }
</script>

<div class="pcr-instrument-container">
  <!-- Sample insertion site overlay (only shown when no sample) -->
  {#if !hasSample}
    <button 
      class="sample-insertion-site" 
      class:hovered={samplePortHovered}
      onclick={onSamplePortClick}
      onmouseenter={() => samplePortHovered = true}
      onmouseleave={() => samplePortHovered = false}
      title="Click to load sample"
    >
      <div class="insertion-icon">🧪</div>
      <div class="insertion-label">Load Sample</div>
    </button>
  {/if}
  
  <div class="pcr-instrument" bind:this={phaserContainer}></div>
</div>

<style>
  .pcr-instrument-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .sample-insertion-site {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    background: rgba(26, 42, 26, 0.95);
    border: 3px dashed #4a7a4a;
    border-radius: 12px;
    padding: 3rem 4rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    animation: pulse 2s ease-in-out infinite;
    color: inherit;
    font-family: inherit;
  }

  .sample-insertion-site.hovered {
    background: rgba(42, 62, 42, 0.98);
    border-color: #6a9fb5;
    transform: translate(-50%, -50%) scale(1.05);
    box-shadow: 0 0 30px rgba(106, 159, 181, 0.4);
  }

  .insertion-icon {
    font-size: 4rem;
    filter: drop-shadow(0 0 10px rgba(74, 122, 74, 0.6));
  }

  .insertion-label {
    color: #8ab98a;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.85;
      border-color: #4a7a4a;
    }
    50% {
      opacity: 1;
      border-color: #6a9fb5;
    }
  }
  .pcr-instrument {
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    position: relative;
  }
</style>
