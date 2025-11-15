<script lang="ts">
  import { onMount } from 'svelte';
  import Phaser from 'phaser';
  import { gameState, currentCase, correctOrganism, isCorrectSample, currentBackground } from '../stores/game-state';
  import { Slide } from '../microscope/slide';
  import type { Organism } from '../../data/organisms';

  let phaserContainer = $state<HTMLDivElement>();
  let phaserGame: Phaser.Game | null = null;
  let currentScene: Phaser.Scene | null = null;
  let slide: Slide | null = null;
  let microscopeContainer: Phaser.GameObjects.Container | null = null;
  let floatingDust: Phaser.GameObjects.Graphics[] = [];
  let apertureVignette: Phaser.GameObjects.Graphics | null = null;
  let focusOffset = 0;
  let renderCount = 0; // Increment on each render to randomize artifacts

  const centerX = 500;
  const centerY = 350;
  const radius = 180;

  onMount(() => {
    if (!phaserContainer) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1000,
      height: 700,
      parent: phaserContainer,
      backgroundColor: '#2d2d2d',
      scene: { create: createMicroscopeScene }
    };

    phaserGame = new Phaser.Game(config);
    
    return () => {
      phaserGame?.destroy(true);
    };
  });

  $effect(() => {
    const newFocusOffset = 15 - ($gameState.focusDepth / 100) * 30;
    
    if (newFocusOffset !== focusOffset) {
      focusOffset = newFocusOffset;
      renderMicroscopeContent();
    }
  });

  // Refresh when sample background changes
  $effect(() => {
    // Access the reactive value to track it
    $currentBackground;
    // Only refresh if scene is ready
    if (currentScene && microscopeContainer) {
      renderMicroscopeContent();
    }
  });

  function createMicroscopeScene(this: Phaser.Scene) {
    currentScene = this;
    
    this.add.rectangle(250, 100, 500, 500, 0x0a0a0a).setOrigin(0);

    const mask = this.make.graphics({});
    mask.fillStyle(0xffffff);
    mask.fillCircle(centerX, centerY, radius);

    microscopeContainer = this.add.container(0, 0);
    microscopeContainer.setMask(mask.createGeometryMask());

    renderMicroscopeContent();

    createApertureBreathing(this);
    createFloatingDust(this);
  }

  export function renderMicroscopeContent() {
    if (!currentScene || !microscopeContainer) return;

    microscopeContainer.removeAll(true);

    const backgroundCircle = currentScene.add.graphics();
    backgroundCircle.fillStyle(0xf5f0e8, 1);
    backgroundCircle.fillCircle(centerX, centerY, radius);
    
    const vignette = currentScene.add.graphics();
    vignette.fillStyle(0xe2ded2, 1);
    vignette.fillCircle(centerX, centerY, radius);

    microscopeContainer.add([backgroundCircle, vignette]);

    const caseIndex = $currentCase ? $currentCase.id.charCodeAt(0) % 100 : 0;
    const organism = $isCorrectSample ? $correctOrganism : undefined;
    const background = $currentBackground || 'blood-cells';
    
    // Increment render count to randomize artifacts on each render
    renderCount++;
    slide = new Slide(caseIndex, centerX, centerY, radius, $gameState.currentStain !== 'none', organism, background, renderCount);
    
    renderBackgroundCells(currentScene, microscopeContainer);
    
    if (organism) {
      renderBacteria(currentScene, organism, microscopeContainer);
    }
  }

  function calculateDefocus(zDepth: number, objectSize: number) {
    // Size-dependent depth of field - larger objects have greater tolerance to defocus
    const sizeScale = Math.log10(objectSize + 1) * 0.5 + 1;
    const effectiveZDepth = zDepth / sizeScale;
    
    const defocusAmount = Math.abs(effectiveZDepth) / 15;
    
    // Cubic falloff for very aggressive fading when out of focus
    const blurFactor = defocusAmount * defocusAmount * defocusAmount;
    
    // Size increases dramatically with defocus (point spread function)
    const sizeMultiplier = 1.0 + (blurFactor * 2.5);
    
    // Opacity decreases very rapidly with defocus
    const opacityFalloff = 5.5 - (sizeScale * 0.05);
    const opacityMultiplier = Math.max(0.0, 1.0 - (blurFactor * opacityFalloff));
    
    // Blur width increases significantly
    const blurWidth = 1 + (blurFactor * 7);
    
    return {
      sizeMultiplier,
      opacityMultiplier,
      blurWidth
    };
  }

  function renderBackgroundCells(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    if (!slide) return;

    const graphics = scene.add.graphics();

    for (const cell of slide.bloodCells) {
      const zDepth = cell.zDepth - focusOffset;
      const defocus = calculateDefocus(zDepth, cell.radius);
      
      const cellRadius = cell.radius * defocus.sizeMultiplier;
      const fillOpacity = 0.2 * defocus.opacityMultiplier;

      graphics.fillStyle(0xcc6666, fillOpacity * 1.2);
      graphics.fillEllipse(cell.x, cell.y, cellRadius * cell.irregularity, cellRadius / cell.irregularity);
      
      const centerRatio = 0.45;
      const centerRadius = cellRadius * centerRatio;
      graphics.fillStyle(0xfff5f5, fillOpacity * 0.9);
      graphics.fillEllipse(cell.x, cell.y, centerRadius * cell.irregularity, centerRadius / cell.irregularity);
    }

    for (const cell of slide.epithelialCells) {
      const zDepth = cell.zDepth - focusOffset;
      const defocus = calculateDefocus(zDepth, cell.width);
      const width = cell.width * defocus.sizeMultiplier;
      const height = cell.height * defocus.sizeMultiplier;
      const opacity = 0.25 * defocus.opacityMultiplier;

      graphics.fillStyle(0xd4b8c8, opacity);
      const angle = cell.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      graphics.beginPath();
      for (let i = 0; i <= 32; i++) {
        const t = (i / 32) * Math.PI * 2;
        const localX = (width / 2) * Math.cos(t);
        const localY = (height / 2) * Math.sin(t);
        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;
        if (i === 0) {
          graphics.moveTo(cell.x + rotatedX, cell.y + rotatedY);
        } else {
          graphics.lineTo(cell.x + rotatedX, cell.y + rotatedY);
        }
      }
      graphics.closePath();
      graphics.fillPath();
      
      const nucleusX = cell.x + cell.nucleusOffset.x * cos - cell.nucleusOffset.y * sin;
      const nucleusY = cell.y + cell.nucleusOffset.x * sin + cell.nucleusOffset.y * cos;
      graphics.fillStyle(0x6a4a6a, opacity * 1.5);
      graphics.fillCircle(nucleusX, nucleusY, width * 0.3);
    }

    for (const cell of slide.pusCells) {
      const zDepth = cell.zDepth - focusOffset;
      const defocus = calculateDefocus(zDepth, cell.radius);
      const radius = cell.radius * defocus.sizeMultiplier;
      const opacity = cell.opacity * defocus.opacityMultiplier * 0.3;

      graphics.fillStyle(0xe8dcd8, opacity);
      graphics.fillCircle(cell.x, cell.y, radius);
      
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
    addSampleArtifacts(scene, container);
  }

  function addSampleArtifacts(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    if (!slide) return;

    const artifacts = scene.add.graphics();

    
    // Debris uses variation seed to randomize on focus change
    // const rng = new SeededRNG([this.caseIndex.toString(), 'debris', this.variationSeed.toString()]);

    // // Debris particles - increased count for more prevalence
    // const debrisCount = this.rng.between(1, 3);
    // for (let i = 0; i < debrisCount; i++) {
    //   const angle = this.rng.floatBetween(0, Math.PI * 2);
    //   const distance = this.rng.floatBetween(0, this.radius - 30);
    //   const x = this.centerX + distance * Math.cos(angle);
    //   const y = this.centerY + distance * Math.sin(angle);
    //   const size = this.rng.floatBetween(1, 3);
    //   const opacity = this.rng.floatBetween(0.2, 0.5);
    //   const zDepth = this.rng.floatBetween(-5, 5);

    //   this.debris.push({ angle, distance, x, y, size, opacity, zDepth });
    // }

    for (const debris of slide.debris) {      
      artifacts.fillStyle(0x000, 0.05);
      artifacts.fillCircle(debris.x, debris.y, 2);
    }

    if ($gameState.currentStain !== 'none') {
      const precipColors = {
        gram: 0x4a3366,
        'acid-fast': 0x8b0000,
        capsule: 0x2a2a4a,
        spore: 0x1a4a1a,
      };
      const precipColor = precipColors[$gameState.currentStain] || 0x4a3366;
      
      for (const precip of slide.stainPrecipitates) {
        const zDepth = precip.zDepth - focusOffset;
        const defocus = calculateDefocus(zDepth, precip.size);
        
        const size = precip.size * defocus.sizeMultiplier;
        const opacity = precip.opacity * defocus.opacityMultiplier;
        
        artifacts.fillStyle(precipColor, opacity);
        artifacts.fillCircle(precip.x, precip.y, size);
      }

      const smearColors = {
        gram: [0x663399, 0xff69b4],
        'acid-fast': [0xff0000, 0x0000ff],
        capsule: [0x4169e1, 0xffc0cb],
        spore: [0x228b22, 0xff6347],
      };
      const colors = smearColors[$gameState.currentStain] || [0x663399, 0xff69b4];
      for (const smear of slide.stainSmears) {
        const zDepth = smear.zDepth - focusOffset;
        const defocus = calculateDefocus(zDepth, smear.width);
        
        const smearColor = colors[smear.colorIndex];
        const width = smear.width * defocus.sizeMultiplier;
        const opacity = smear.opacity * defocus.opacityMultiplier;
        
        artifacts.lineStyle(width, smearColor, opacity);
        
        const endX = smear.startX + smear.length * Math.cos(smear.angle);
        const endY = smear.startY + smear.length * Math.sin(smear.angle);
        artifacts.strokeLineShape(new Phaser.Geom.Line(smear.startX, smear.startY, endX, endY));
      }

      for (const residue of slide.stainResidues) {
        const zDepth = residue.zDepth - focusOffset;
        const defocus = calculateDefocus(zDepth, residue.size);
        
        const residueColor = residue.colorIndex === 0 ? 0x663399 : 0xff69b4;
        const size = residue.size * defocus.sizeMultiplier;
        const opacity = residue.opacity * defocus.opacityMultiplier;
        
        artifacts.fillStyle(residueColor, opacity);
        artifacts.fillCircle(residue.x, residue.y, size);
      }
    }

    for (const bubble of slide.bubbles) {
      const zDepth = bubble.zDepth - focusOffset;
      const defocus = calculateDefocus(zDepth, bubble.radius);
      
      const bubbleRadius = bubble.radius * defocus.sizeMultiplier;
      const edgeOpacity = 0.4 * defocus.opacityMultiplier;
      const centerOpacity = 0.15 * defocus.opacityMultiplier;
      
      artifacts.lineStyle(2 * defocus.sizeMultiplier, 0xc8c4bc, edgeOpacity);
      artifacts.strokeCircle(bubble.x, bubble.y, bubbleRadius);
      
      artifacts.fillStyle(0xffffff, centerOpacity);
      artifacts.fillCircle(bubble.x, bubble.y, bubbleRadius * 0.6);
    }

    container.add(artifacts);
  }

  function renderBacteria(scene: Phaser.Scene, organism: Organism, container: Phaser.GameObjects.Container) {
    if (!slide) return;

    const graphics = scene.add.graphics();
    
    const getStainColor = () => {
      if ($gameState.currentStain === 'none') return 0x888888;
      if ($gameState.currentStain === 'gram') {
        return organism.gramStain === 'positive' ? 0x663399 : 0xff6b9d;
      }
      if ($gameState.currentStain === 'acid-fast') {
        return organism.acidFast ? 0xff0000 : 0x4169e1;
      }
      return 0x663399;
    };

    const color = getStainColor();
    const baseOpacity = 0.8;

    if (organism.shape === 'cocci') {
      if (organism.arrangement === 'chains') {
        renderCocciChains(graphics, color, baseOpacity);
      } else if (organism.arrangement === 'pairs') {
        renderDiplococci(graphics, color, baseOpacity);
      } else if (organism.arrangement === 'clusters') {
        renderCocciClusters(graphics, color, baseOpacity);
      }
    } else if (organism.shape === 'bacilli') {
      renderBacilli(graphics, organism, color, baseOpacity);
    }

    container.add(graphics);
  }

  function renderCocciChains(graphics: Phaser.GameObjects.Graphics, color: number, baseOpacity: number) {
    if (!slide) return;

    for (const chain of slide.bacteria.chains) {
      const chainZDepth = chain.zDepth - focusOffset;
      const chainDefocus = calculateDefocus(chainZDepth, 1.5);

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

  function renderCocciClusters(graphics: Phaser.GameObjects.Graphics, color: number, baseOpacity: number) {
    if (!slide) return;

    for (const cluster of slide.bacteria.clusters) {
      const clusterZDepth = cluster.zDepth - focusOffset;
      const clusterDefocus = calculateDefocus(clusterZDepth, 1.5);

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

  function renderDiplococci(graphics: Phaser.GameObjects.Graphics, color: number, baseOpacity: number) {
    if (!slide) return;

    for (const pair of slide.bacteria.pairs) {
      const pairZDepth = pair.zDepth - focusOffset;
      const pairDefocus = calculateDefocus(pairZDepth, 1.2);

      const baseCoccusRadius = 1.2 * pair.sizeVariation;
      const coccusRadius = baseCoccusRadius * pairDefocus.sizeMultiplier;
      const opacity = baseOpacity * pair.stainVariation * pairDefocus.opacityMultiplier;

      graphics.lineStyle(pairDefocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

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

  function renderBacilli(graphics: Phaser.GameObjects.Graphics, organism: Organism, color: number, baseOpacity: number) {
    if (!slide) return;

    for (const bacillus of slide.bacteria.bacilli) {
      const bacillusZDepth = bacillus.zDepth - focusOffset;
      const bacillusDefocus = calculateDefocus(bacillusZDepth, bacillus.width);

      const width = bacillus.width * bacillusDefocus.sizeMultiplier;
      const length = bacillus.length * bacillusDefocus.sizeMultiplier;
      const opacity = baseOpacity * bacillus.stainVariation * bacillusDefocus.opacityMultiplier;

      graphics.lineStyle(bacillusDefocus.blurWidth, color, opacity);
      graphics.fillStyle(color, opacity * 0.6);

      const x1 = bacillus.x - (length / 2) * Math.cos(bacillus.orientation);
      const y1 = bacillus.y - (length / 2) * Math.sin(bacillus.orientation);
      const x2 = bacillus.x + (length / 2) * Math.cos(bacillus.orientation);
      const y2 = bacillus.y + (length / 2) * Math.sin(bacillus.orientation);

      graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
      graphics.fillCircle(x1, y1, width);
      graphics.fillCircle(x2, y2, width);

      if ($gameState.currentStain === 'spore' && organism.sporeFormer) {
        graphics.fillStyle(0x228b22, 0.9);
        graphics.fillCircle(x2, y2, width * 1.8);
      }
    }
  }

  function createApertureBreathing(scene: Phaser.Scene) {
    apertureVignette = scene.add.graphics();
    apertureVignette.setDepth(2);
    
    scene.tweens.add({
      targets: apertureVignette,
      alpha: 0.3,
      duration: 25,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!apertureVignette) return;
        
        apertureVignette.clear();
        const vignetteScale = 1 + (apertureVignette.alpha - 0.15) * 0.05;
        apertureVignette.fillStyle(0x000000, 0.09);
        apertureVignette.fillCircle(centerX, centerY, radius * vignetteScale);
        apertureVignette.fillStyle(0xf5f0e8, 0.09);
        apertureVignette.fillCircle(centerX, centerY, radius * vignetteScale);
      }
    });
  }

  function createFloatingDust(scene: Phaser.Scene) {
    const numParticles = 15;
    
    for (let i = 0; i < numParticles; i++) {
      const dust = scene.add.graphics();
      dust.setDepth(3);
      
      const startAngle = Math.random() * Math.PI * 2;
      const startDist = Math.random() * (radius - 20);
      const dustX = centerX + startDist * Math.cos(startAngle);
      const dustY = centerY + startDist * Math.sin(startAngle);
      
      const dustSize = 10 + Math.random() * 24;
      const dustOpacity = 0.01 + Math.random() * 0.04;
      
      dust.fillStyle(0x000000, dustOpacity);
      dust.fillCircle(dustX, dustY, dustSize);
      
      floatingDust.push(dust);
      
      const driftAngle = Math.random() * Math.PI * 2;
      const driftDistance = -50 + Math.random() * 100;
      const endX = driftDistance * Math.cos(driftAngle);
      const endY = driftDistance * Math.sin(driftAngle);
      
      scene.tweens.add({
        targets: dust,
        x: endX,
        y: endY,
        duration: 8000 + Math.random() * 7000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onUpdate: (tween) => {
          const progress = tween.progress;
          const currentX = dustX + (endX - dustX) * progress;
          const currentY = dustY + (endY - dustY) * progress;
          
          dust.clear();
          dust.fillStyle(0x000000, dustOpacity);
          dust.fillCircle(currentX, currentY, dustSize);
        }
      });
    }
  }
</script>

<div class="microscope-instrument">
  <div class="phaser-container" bind:this={phaserContainer}></div>
</div>

<style>
  .microscope-instrument {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .phaser-container {
    width: 1000px;
    height: 700px;
  }
</style>
