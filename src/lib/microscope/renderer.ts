import type { Slide } from './slide';
import type { Organism } from '../../data/organisms';

export interface RenderConfig {
  centerX: number;
  centerY: number;
  radius: number;
  focusOffset: number;
  stain: 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore';
}

export class MicroscopeRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context');
    this.ctx = context;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  render(slide: Slide, organism: Organism | undefined, config: RenderConfig) {
    this.clear();
    
    // Draw background
    this.drawBackground(config);
    
    // Add optical aberrations (chromatic fringing, lens imperfections)
    this.addOpticalAberrations(config);
    
    // Draw background cells
    this.renderBackgroundCells(slide, config);
    
    // Draw bacteria if organism exists
    if (organism) {
      this.renderBacteria(slide, organism, config);
    }
    
    // Add sample artifacts (debris, bubbles, stain artifacts)
    this.addSampleArtifacts(slide, config);
    
    // Add focus blur overlay
    this.addFocusBlur(config);
    
    // Draw eyepiece rim
    this.drawEyepieceRim(config);
  }

  private drawBackground(config: RenderConfig) {
    const { centerX, centerY, radius } = config;
    
    // Light microscope background - illuminated field
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#f5f0e8');
    gradient.addColorStop(0.7, '#e8e3d8');
    gradient.addColorStop(1, '#d4cfc3');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEyepieceRim(config: RenderConfig) {
    const { centerX, centerY, radius } = config;
    
    // Inner rim shadow
    this.ctx.strokeStyle = '#1a1a1a';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Main eyepiece rim (brass/metal look)
    this.ctx.strokeStyle = '#3a3a3a';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private renderBackgroundCells(slide: Slide, config: RenderConfig) {
    // Blood cells
    for (const cell of slide.bloodCells) {
      const zDepth = cell.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, cell.radius);
      
      const radius = cell.radius * defocus.sizeMultiplier;
      const opacity = 0.25 * defocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(0xe74c3c, opacity);
      this.ctx.beginPath();
      this.ctx.arc(cell.x, cell.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Epithelial cells
    for (const cell of slide.epithelialCells) {
      const zDepth = cell.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, cell.width);
      
      const width = cell.width * defocus.sizeMultiplier;
      const height = cell.height * defocus.sizeMultiplier;
      const opacity = 0.3 * defocus.opacityMultiplier;
      
      this.ctx.save();
      this.ctx.translate(cell.x, cell.y);
      this.ctx.rotate(cell.rotation);
      
      this.ctx.fillStyle = this.rgbaString(0xd4a5a5, opacity);
      this.ctx.fillRect(-width / 2, -height / 2, width, height);
      
      this.ctx.strokeStyle = this.rgbaString(0x8b6969, opacity * 0.6);
      this.ctx.lineWidth = defocus.blurWidth;
      this.ctx.strokeRect(-width / 2, -height / 2, width, height);
      
      this.ctx.restore();
    }
    
    // Fecal matter
    for (const particle of slide.fecalParticles) {
      const zDepth = particle.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, particle.size);
      
      const size = particle.size * defocus.sizeMultiplier;
      const opacity = 0.35 * defocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(particle.color, opacity);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Pus cells
    for (const cell of slide.pusCells) {
      const zDepth = cell.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, cell.radius);
      
      const radius = cell.radius * defocus.sizeMultiplier;
      const finalOpacity = cell.opacity * defocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(0xe6e6e6, finalOpacity);
      this.ctx.beginPath();
      this.ctx.arc(cell.x, cell.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = this.rgbaString(0xa0a0a0, finalOpacity * 0.5);
      this.ctx.lineWidth = defocus.blurWidth;
      this.ctx.stroke();
    }
    
    // Clear fluid debris
    for (const debris of slide.debris) {
      const zDepth = debris.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, debris.size);
      
      const size = debris.size * defocus.sizeMultiplier;
      const finalOpacity = debris.opacity * defocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(0xb0b0b0, finalOpacity);
      this.ctx.beginPath();
      this.ctx.arc(debris.x, debris.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderBacteria(slide: Slide, organism: Organism, config: RenderConfig) {
    const { baseColor, opacity } = this.getBacteriaColor(organism, config.stain);
    
    // Cocci in chains
    for (const chain of slide.bacteria.chains) {
      const chainZDepth = chain.zDepth - config.focusOffset;
      const chainDefocus = this.calculateDefocus(chainZDepth, 1.5);
      
      for (const cocci of chain.cocci) {
        const radius = 1.2 * cocci.sizeVariation * chainDefocus.sizeMultiplier;
        const finalOpacity = opacity * chain.stainVariation * chainDefocus.opacityMultiplier;
        
        this.ctx.fillStyle = this.rgbaString(baseColor, finalOpacity);
        this.ctx.strokeStyle = this.rgbaString(baseColor, finalOpacity * 0.8);
        this.ctx.lineWidth = chainDefocus.blurWidth;
        
        this.ctx.beginPath();
        this.ctx.arc(cocci.x, cocci.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
      }
    }
    
    // Cocci in clusters
    for (const cluster of slide.bacteria.clusters) {
      const clusterZDepth = cluster.zDepth - config.focusOffset;
      const clusterDefocus = this.calculateDefocus(clusterZDepth, 1.5);
      
      for (const cocci of cluster.cocci) {
        const radius = 1.2 * cocci.sizeVariation * clusterDefocus.sizeMultiplier;
        const finalOpacity = opacity * cluster.stainVariation * clusterDefocus.opacityMultiplier;
        
        this.ctx.fillStyle = this.rgbaString(baseColor, finalOpacity);
        this.ctx.strokeStyle = this.rgbaString(baseColor, finalOpacity * 0.8);
        this.ctx.lineWidth = clusterDefocus.blurWidth;
        
        this.ctx.beginPath();
        this.ctx.arc(cocci.x, cocci.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
      }
    }
    
    // Diplococci (pairs)
    for (const pair of slide.bacteria.pairs) {
      const pairZDepth = pair.zDepth - config.focusOffset;
      const pairDefocus = this.calculateDefocus(pairZDepth, 1.2);
      
      const radius = 1.2 * pair.sizeVariation * pairDefocus.sizeMultiplier;
      const finalOpacity = opacity * pair.stainVariation * pairDefocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(baseColor, finalOpacity);
      this.ctx.strokeStyle = this.rgbaString(baseColor, finalOpacity * 0.8);
      this.ctx.lineWidth = pairDefocus.blurWidth;
      
      // Draw two cocci in a pair
      const offset = radius * 0.9;
      const x1 = pair.x + offset * Math.cos(pair.orientation);
      const y1 = pair.y + offset * Math.sin(pair.orientation);
      const x2 = pair.x - offset * Math.cos(pair.orientation);
      const y2 = pair.y - offset * Math.sin(pair.orientation);
      
      this.ctx.beginPath();
      this.ctx.arc(x1, y1, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.arc(x2, y2, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }
    
    // Single bacilli
    for (const bacillus of slide.bacteria.bacilli) {
      const bacillusZDepth = bacillus.zDepth - config.focusOffset;
      const bacillusDefocus = this.calculateDefocus(bacillusZDepth, bacillus.width);
      
      const width = bacillus.width * bacillusDefocus.sizeMultiplier;
      const length = bacillus.length * bacillusDefocus.sizeMultiplier;
      const finalOpacity = opacity * bacillus.stainVariation * bacillusDefocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(baseColor, finalOpacity * 0.6);
      this.ctx.strokeStyle = this.rgbaString(baseColor, finalOpacity);
      this.ctx.lineWidth = bacillusDefocus.blurWidth;
      
      const x1 = bacillus.x - (length / 2) * Math.cos(bacillus.orientation);
      const y1 = bacillus.y - (length / 2) * Math.sin(bacillus.orientation);
      const x2 = bacillus.x + (length / 2) * Math.cos(bacillus.orientation);
      const y2 = bacillus.y + (length / 2) * Math.sin(bacillus.orientation);
      
      this.ctx.beginPath();
      this.ctx.arc(x1, y1, width, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(x2, y2, width, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      
      // Capsule if applicable
      if (config.stain === 'capsule' && organism.capsule) {
        this.ctx.strokeStyle = this.rgbaString(0x4169e1, 0.3);
        this.ctx.lineWidth = 2;
        this.ctx.save();
        this.ctx.translate(bacillus.x, bacillus.y);
        this.ctx.rotate(bacillus.orientation);
        this.ctx.strokeRect(-length * 0.75, -width * 1.5, length * 1.5, width * 3);
        this.ctx.restore();
      }
    }
    
    // Palisades (for Corynebacterium)
    for (const palisade of slide.bacteria.palisades) {
      for (const bacillus of palisade.bacilli) {
        const zDepth = bacillus.zDepth - config.focusOffset;
        const defocus = this.calculateDefocus(zDepth, bacillus.width);
        
        const width = bacillus.width * defocus.sizeMultiplier;
        const length = bacillus.length * defocus.sizeMultiplier;
        const finalOpacity = opacity * bacillus.stainVariation * defocus.opacityMultiplier;
        
        this.ctx.fillStyle = this.rgbaString(baseColor, finalOpacity * 0.6);
        this.ctx.strokeStyle = this.rgbaString(baseColor, finalOpacity);
        this.ctx.lineWidth = defocus.blurWidth;
        
        const x1 = bacillus.x - (length / 2) * Math.cos(bacillus.orientation);
        const y1 = bacillus.y - (length / 2) * Math.sin(bacillus.orientation);
        const x2 = bacillus.x + (length / 2) * Math.cos(bacillus.orientation);
        const y2 = bacillus.y + (length / 2) * Math.sin(bacillus.orientation);
        
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, width, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x2, y2, width, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
    }
    
    // Coccobacilli
    for (const bacterium of slide.bacteria.coccobacilli) {
      const zDepth = bacterium.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, bacterium.width);
      
      const width = bacterium.width * defocus.sizeMultiplier;
      const length = bacterium.length * defocus.sizeMultiplier;
      const finalOpacity = opacity * bacterium.stainVariation * defocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(baseColor, finalOpacity * 0.6);
      this.ctx.strokeStyle = this.rgbaString(baseColor, finalOpacity);
      this.ctx.lineWidth = defocus.blurWidth;
      
      const x1 = bacterium.x - (length / 2) * Math.cos(bacterium.orientation);
      const y1 = bacterium.y - (length / 2) * Math.sin(bacterium.orientation);
      const x2 = bacterium.x + (length / 2) * Math.cos(bacterium.orientation);
      const y2 = bacterium.y + (length / 2) * Math.sin(bacterium.orientation);
      
      this.ctx.beginPath();
      this.ctx.arc(x1, y1, width, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(x2, y2, width, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      
      // Capsule if applicable
      if (config.stain === 'capsule' && organism.capsule) {
        this.ctx.strokeStyle = this.rgbaString(0x4169e1, 0.3);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(bacterium.x, bacterium.y, length * 1.5, width * 1.5, bacterium.orientation, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  private getBacteriaColor(organism: Organism, stain: string): { baseColor: number; opacity: number } {
    if (stain === 'none') {
      return { baseColor: 0xd0d0d0, opacity: 0.15 };
    }
    
    if (stain === 'gram') {
      return organism.gramStain === 'positive'
        ? { baseColor: 0x4b0082, opacity: 0.85 } // Purple
        : { baseColor: 0xff1493, opacity: 0.75 }; // Pink
    }
    
    if (stain === 'acid-fast') {
      return organism.acidFast
        ? { baseColor: 0xff0000, opacity: 0.85 } // Red
        : { baseColor: 0x0000ff, opacity: 0.65 }; // Blue
    }
    
    if (stain === 'capsule') {
      return organism.capsule
        ? { baseColor: 0x8b4513, opacity: 0.75 } // Brown with blue halo
        : { baseColor: 0xd0d0d0, opacity: 0.3 };
    }
    
    if (stain === 'spore') {
      return organism.sporeFormer
        ? { baseColor: 0x00ff00, opacity: 0.85 } // Green spores
        : { baseColor: 0xff0000, opacity: 0.75 }; // Red vegetative cells
    }
    
    return { baseColor: 0xd0d0d0, opacity: 0.15 };
  }

  private calculateDefocus(zDepth: number, objectSize: number = 1): { 
    sizeMultiplier: number; 
    opacityMultiplier: number; 
    blurWidth: number;
  } {
    const sizeScale = Math.log10(objectSize + 1) * 0.5 + 1;
    const effectiveZDepth = zDepth / sizeScale;
    const defocusAmount = Math.abs(effectiveZDepth) / 15;
    const blurFactor = defocusAmount * defocusAmount * defocusAmount;
    
    const sizeMultiplier = 1.0 + (blurFactor * 2.5);
    const opacityFalloff = 5.5 - (sizeScale * 0.05);
    const opacityMultiplier = Math.max(0.0, 1.0 - (blurFactor * opacityFalloff));
    const blurWidth = 1 + (blurFactor * 7);
    
    return { sizeMultiplier, opacityMultiplier, blurWidth };
  }

  private rgbaString(color: number, opacity: number): string {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private addOpticalAberrations(config: RenderConfig) {
    const { centerX, centerY, radius } = config;
    
    // Chromatic aberration (color fringing at edges)
    this.ctx.strokeStyle = 'rgba(102, 102, 255, 0.05)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(centerX - 1, centerY - 1, radius - 5, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = 'rgba(255, 102, 102, 0.05)';
    this.ctx.beginPath();
    this.ctx.arc(centerX + 1, centerY + 1, radius - 5, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Subtle lens imperfections (dust/scratches)
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = (radius * 0.4) + (Math.random() * radius * 0.4);
      const dustX = centerX + distance * Math.cos(angle);
      const dustY = centerY + distance * Math.sin(angle);
      const dustSize = 1 + Math.random();
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      this.ctx.beginPath();
      this.ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private addSampleArtifacts(slide: Slide, config: RenderConfig) {
    // Debris particles
    for (const debris of slide.debris) {
      const zDepth = debris.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, debris.size);
      
      const size = debris.size * defocus.sizeMultiplier;
      const opacity = debris.opacity * defocus.opacityMultiplier;
      
      this.ctx.fillStyle = this.rgbaString(0xb8b4ac, opacity);
      this.ctx.beginPath();
      this.ctx.arc(debris.x, debris.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Air bubbles
    for (const bubble of slide.bubbles) {
      const zDepth = bubble.zDepth - config.focusOffset;
      const defocus = this.calculateDefocus(zDepth, bubble.radius);
      
      const radius = bubble.radius * defocus.sizeMultiplier;
      const edgeOpacity = 0.4 * defocus.opacityMultiplier;
      const centerOpacity = 0.15 * defocus.opacityMultiplier;
      
      // Darker ring (edge of bubble)
      this.ctx.strokeStyle = this.rgbaString(0xc8c4bc, edgeOpacity);
      this.ctx.lineWidth = 2 * defocus.sizeMultiplier;
      this.ctx.beginPath();
      this.ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      // Lighter center (refraction effect)
      this.ctx.fillStyle = this.rgbaString(0xffffff, centerOpacity);
      this.ctx.beginPath();
      this.ctx.arc(bubble.x, bubble.y, radius * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Stain artifacts (only if stained)
    if (config.stain !== 'none') {
      // Stain precipitate crystals
      const precipColors = {
        gram: 0x4a3366,
        'acid-fast': 0x8b0000,
        capsule: 0x2a2a4a,
        spore: 0x1a4a1a,
      };
      
      for (const precip of slide.stainPrecipitates) {
        const zDepth = precip.zDepth - config.focusOffset;
        const defocus = this.calculateDefocus(zDepth, precip.size);
        
        const size = precip.size * defocus.sizeMultiplier;
        const opacity = precip.opacity * defocus.opacityMultiplier;
        
        this.ctx.fillStyle = this.rgbaString(precipColors[config.stain], opacity);
        this.ctx.beginPath();
        this.ctx.arc(precip.x, precip.y, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Stain smears
      const smearColors: Record<string, number[]> = {
        gram: [0x663399, 0xff69b4],
        'acid-fast': [0xff0000, 0x0000ff],
        capsule: [0x4169e1, 0xffc0cb],
        spore: [0x228b22, 0xff6347],
      };
      
      const colors = smearColors[config.stain];
      for (const smear of slide.stainSmears) {
        const zDepth = smear.zDepth - config.focusOffset;
        const defocus = this.calculateDefocus(zDepth, smear.width);
        
        const smearColor = colors[smear.colorIndex];
        const width = smear.width * defocus.sizeMultiplier;
        const opacity = smear.opacity * defocus.opacityMultiplier;
        
        this.ctx.strokeStyle = this.rgbaString(smearColor, opacity);
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        
        const endX = smear.startX + smear.length * Math.cos(smear.angle);
        const endY = smear.startY + smear.length * Math.sin(smear.angle);
        this.ctx.moveTo(smear.startX, smear.startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
      }
      
      // Background stain residue
      for (const residue of slide.stainResidues) {
        const zDepth = residue.zDepth - config.focusOffset;
        const defocus = this.calculateDefocus(zDepth, residue.size);
        
        const residueColor = residue.colorIndex === 0 ? 0x663399 : 0xff69b4;
        const size = residue.size * defocus.sizeMultiplier;
        const opacity = residue.opacity * defocus.opacityMultiplier;
        
        this.ctx.fillStyle = this.rgbaString(residueColor, opacity);
        this.ctx.beginPath();
        this.ctx.arc(residue.x, residue.y, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private addFocusBlur(config: RenderConfig) {
    const { centerX, centerY, radius } = config;
    
    // Add subtle radial blur overlay to simulate depth of field
    const gradient = this.ctx.createRadialGradient(centerX, centerY, radius * 0.6, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(245, 240, 232, 0)');
    gradient.addColorStop(0.8, 'rgba(245, 240, 232, 0.02)');
    gradient.addColorStop(1, 'rgba(245, 240, 232, 0.08)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
