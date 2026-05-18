import { Scene, GameObjects, Input } from 'phaser';
import { strainBus, type PhaserSnapshot } from '../lib/event-bus';
import {
  DEFENSE_TOOLS,
  GENES,
  SECTOR_IDS,
  THREATS,
  type DefenseToolId,
  type GeneId,
  type SectorId,
  type ThreatId,
} from '../lib/strain-data';

const DEFAULT_SNAPSHOT: PhaserSnapshot = {
  elapsedSeconds: 0,
  activeThreats: ['neutrophil'],
  propagatedGenes: ['biofilm'],
  desiredGenes: ['biofilm'],
  telegraph: { nextThreat: 'macrophage', nextThreatKnown: false },
  colonyDensity: 100,
  founderState: 'healthy',
  sectors: [],
  placements: [],
  activeProbes: [],
  selectedTool: 'biofilm',
  toolCooldowns: { biofilm: 0, capsule: 0, surfaceSwitch: 0 },
  wave: 1,
  paused: false,
};

export class TissueScene extends Scene {
  private tissue!: GameObjects.Graphics;
  private actors!: GameObjects.Graphics;
  private snapshot: PhaserSnapshot = DEFAULT_SNAPSHOT;
  private unsubscribers: Array<() => void> = [];
  private pulse = 0;
  private hoveredSector: SectorId | null = null;

  constructor() {
    super({ key: 'TissueScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#4f1f21');
    this.tissue = this.add.graphics();
    this.actors = this.add.graphics();

    this.unsubscribers = [
      strainBus.on('state:update', snapshot => {
        this.snapshot = snapshot;
      }),
      strainBus.on('game:reset', snapshot => {
        this.snapshot = snapshot;
      }),
      strainBus.on('sample:pulse', () => {
        this.pulse = 1;
      }),
    ];

    this.input.on('pointermove', (pointer: Input.Pointer) => {
      const sectorId = this.getSectorAt(pointer.x, pointer.y);
      if (sectorId === this.hoveredSector) return;
      this.hoveredSector = sectorId;
      strainBus.emit('battlefield:hover-sector', { sectorId });
    });

    this.input.on('pointerdown', (pointer: Input.Pointer) => {
      const sectorId = this.getSectorAt(pointer.x, pointer.y);
      if (!sectorId) return;
      strainBus.emit('battlefield:place-defense', { sectorId });
    });
  }

  override update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.pulse = Math.max(0, this.pulse - dt * 1.6);
    this.drawTissue();
    this.drawActors();
  }

  shutdown() {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
  }

  private drawTissue() {
    const { width, height } = this.scale;
    this.tissue.clear();
    this.tissue.fillGradientStyle(0x7d3338, 0x7d3338, 0xd78078, 0x9f4949, 1);
    this.tissue.fillRect(0, 0, width, height);

    this.tissue.lineStyle(1, 0xf6b4a5, 0.18);
    for (let i = 0; i < 34; i++) {
      const y = (i / 34) * height + Math.sin(i * 1.7) * 18;
      this.tissue.beginPath();
      this.tissue.moveTo(0, y);
      for (let x = 0; x <= width; x += 60) {
        this.tissue.lineTo(x, y + Math.sin(x * 0.018 + i) * 16);
      }
      this.tissue.strokePath();
    }

    const glow = 0.08 + this.pulse * 0.22;
    this.tissue.fillStyle(0xfff1a8, glow);
    this.tissue.fillCircle(width - 60, height * 0.22, 52 + this.pulse * 28);
  }

  private drawActors() {
    const { width, height } = this.scale;
    const cx = width * 0.46;
    const cy = height * 0.53;
    const radius = Math.max(62, Math.min(width, height) * 0.17);

    this.actors.clear();
    this.drawSectorFeedback(cx, cy, radius);
    this.drawBiofilm(cx, cy, radius);
    this.drawAntibodies(width, height);
    this.drawColony(cx, cy, radius);
    this.drawImmuneCells(width, height, cx, cy);
  }

  private drawBiofilm(cx: number, cy: number, radius: number) {
    if (!this.snapshot.placements.some(placement => placement.toolId === 'biofilm')) return;
    this.actors.lineStyle(12, 0x55c982, 0.34);
    this.actors.beginPath();
    this.actors.arc(cx + radius * 0.48, cy - radius * 0.16, radius * 1.05, -1.1, 0.65);
    this.actors.strokePath();
    this.actors.lineStyle(3, 0xc0f4c8, 0.55);
    this.actors.beginPath();
    this.actors.arc(cx + radius * 0.48, cy - radius * 0.16, radius * 1.1, -1.1, 0.65);
    this.actors.strokePath();
  }

  private drawColony(cx: number, cy: number, radius: number) {
    const density = this.snapshot.colonyDensity / 100;
    const count = Math.max(10, Math.round(38 * density));
    const capsule = this.snapshot.propagatedGenes.includes('capsule');
    const surfaceSwitch = this.snapshot.propagatedGenes.includes('surfaceSwitch');
    const haloColor = capsule ? 0xd9c4ff : 0xfff2c4;
    const rodColor = surfaceSwitch ? 0x95b8ff : 0xffdc83;

    if (capsule) {
      this.actors.fillStyle(haloColor, 0.18);
      this.actors.fillCircle(cx, cy, radius + 22);
    }

    for (let i = 0; i < count; i++) {
      const angle = i * 2.399;
      const dist = Math.sqrt(((i * 37) % 100) / 100) * radius;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist * 0.72;
      const stressed = this.snapshot.founderState === 'critical' || density < 0.45;
      this.drawBacterium(x, y, 16, rodColor, stressed, i === 0);
    }
  }

  private drawBacterium(x: number, y: number, size: number, color: number, stressed: boolean, founder: boolean) {
    const alpha = stressed && !founder ? 0.58 : 0.95;
    if (founder) {
      const glow = this.snapshot.founderState === 'healthy' ? 0.35 : this.snapshot.founderState === 'stressed' ? 0.22 : 0.12;
      this.actors.fillStyle(0xfff2a8, glow);
      this.actors.fillEllipse(x, y, size * 3.3, size * 2.1);
    }

    this.actors.fillStyle(color, alpha);
    this.actors.lineStyle(founder ? 2.4 : 1.2, founder ? 0xffffff : 0x51351f, 0.8);
    this.actors.fillEllipse(x, y, founder ? size * 2.2 : size * 1.7, founder ? size * 1.05 : size * 0.8);
    this.actors.strokeEllipse(x, y, founder ? size * 2.2 : size * 1.7, founder ? size * 1.05 : size * 0.8);

    const spikeColor = color === 0x95b8ff ? 0x244d9a : 0x6f3d23;
    this.actors.fillStyle(spikeColor, 0.72);
    this.actors.fillCircle(x - size * 0.35, y - size * 0.2, 1.8);
    this.actors.fillCircle(x + size * 0.22, y + size * 0.18, 1.8);
  }

  private drawImmuneCells(width: number, height: number, cx: number, cy: number) {
    for (const probe of this.snapshot.activeProbes) {
      const point = this.sectorPoint(probe.sectorId, cx, cy, Math.min(width, height) * 0.34);
      if (probe.threat === 'neutrophil') this.drawNeutrophils(point.x, point.y, cx, cy, probe.sectorId);
      if (probe.threat === 'macrophage') this.drawMacrophages(point.x, point.y, cx, cy, probe.sectorId);
    }
  }

  private drawNeutrophils(baseX: number, baseY: number, cx: number, cy: number, sectorId: SectorId) {
    const blocked = this.hasMatchingPlacement(sectorId, 'biofilm');
    const sector = this.snapshot.sectors.find(item => item.id === sectorId);
    const advance = sector?.status === 'breached' || sector?.status === 'founder-threatened' ? 0.82 : blocked ? 0.28 : 0.58;
    for (let i = 0; i < 8 + this.snapshot.wave; i++) {
      const offsetX = Math.sin(i * 1.9) * 38;
      const offsetY = Math.cos(i * 2.4) * 30;
      const x = lerp(baseX + offsetX, cx + 55, advance);
      const y = lerp(baseY + offsetY, cy - 28, advance);
      this.drawNeutrophil(x, y, 18 + (i % 3) * 2);
    }
  }

  private drawNeutrophil(x: number, y: number, size: number) {
    this.actors.fillStyle(0xf7e2ff, 0.94);
    this.actors.lineStyle(1.3, 0x5e3e79, 0.8);
    this.actors.fillCircle(x, y, size);
    this.actors.strokeCircle(x, y, size);
    this.actors.fillStyle(0x7042a8, 0.9);
    this.actors.fillEllipse(x - 5, y, 8, 11);
    this.actors.fillEllipse(x + 2, y - 4, 9, 10);
    this.actors.fillEllipse(x + 6, y + 4, 7, 10);
  }

  private drawMacrophages(baseX: number, baseY: number, cx: number, cy: number, sectorId: SectorId) {
    const blocked = this.hasMatchingPlacement(sectorId, 'capsule');
    const sector = this.snapshot.sectors.find(item => item.id === sectorId);
    const advance = sector?.status === 'breached' || sector?.status === 'founder-threatened' ? 0.84 : blocked ? 0.25 : 0.62;
    for (let index = 0; index < Math.min(3, 1 + Math.floor(this.snapshot.wave / 2)); index++) {
      this.drawMacrophage(lerp(baseX + index * 18, cx - 70, advance), lerp(baseY + index * 14, cy + 28, advance), 36 + index * 4);
    }
  }

  private drawMacrophage(x: number, y: number, size: number) {
    this.actors.fillStyle(0xd58b69, 0.9);
    this.actors.lineStyle(2, 0x7a3c2a, 0.8);
    this.actors.fillEllipse(x, y, size * 1.35, size);
    this.actors.fillCircle(x + size * 0.52, y - size * 0.15, size * 0.32);
    this.actors.fillCircle(x - size * 0.45, y + size * 0.2, size * 0.28);
    this.actors.strokeEllipse(x, y, size * 1.35, size);
    this.actors.fillStyle(0x8d4e83, 0.82);
    this.actors.fillEllipse(x - 4, y, size * 0.54, size * 0.34);
  }

  private drawAntibodies(width: number, height: number) {
    if (!this.snapshot.activeThreats.includes('antibody')) return;
    const antibodyProbes = this.snapshot.activeProbes.filter(probe => probe.threat === 'antibody');
    this.actors.lineStyle(3, 0xd4a72c, 0.8);
    for (let i = 0; i < 16; i++) {
      const probe = antibodyProbes[i % Math.max(1, antibodyProbes.length)];
      const target = probe ? this.sectorPoint(probe.sectorId, width * 0.46, height * 0.53, Math.min(width, height) * 0.24) : { x: width * 0.5, y: height * 0.5 };
      const x = target.x + Math.sin(i * 2.1) * 42;
      const y = target.y + Math.cos(i * 1.7) * 35;
      this.actors.beginPath();
      this.actors.moveTo(x, y);
      this.actors.lineTo(x, y + 12);
      this.actors.moveTo(x, y);
      this.actors.lineTo(x - 8, y - 10);
      this.actors.moveTo(x, y);
      this.actors.lineTo(x + 8, y - 10);
      this.actors.strokePath();
    }
  }

  private drawSectorFeedback(cx: number, cy: number, radius: number) {
    const outer = radius + 92;
    const inner = radius + 14;
    for (const sector of this.snapshot.sectors) {
      const index = SECTOR_IDS.indexOf(sector.id);
      if (index < 0) continue;
      const start = -Math.PI / 2 + index * (Math.PI * 2 / SECTOR_IDS.length);
      const end = start + Math.PI * 2 / SECTOR_IDS.length;
      const placement = this.snapshot.placements.find(item => item.sectorId === sector.id);
      const probe = this.snapshot.activeProbes.find(item => item.sectorId === sector.id);

      if (probe) {
        const alpha = 0.18 + Math.sin(this.time.now * 0.012) * 0.08;
        this.drawWedge(cx, cy, inner, outer, start, end, 0xff3d2e, alpha);
      }

      if (sector.status === 'breached' || sector.status === 'founder-threatened') {
        this.drawWedge(cx, cy, radius * 0.35, outer, start, end, 0xff6b2e, 0.28 + Math.sin(this.time.now * 0.018) * 0.12);
        const edge = this.sectorPoint(sector.id, cx, cy, outer - 28);
        this.actors.lineStyle(sector.status === 'founder-threatened' ? 4 : 2, 0xff2d2d, 0.75);
        this.actors.lineBetween(edge.x, edge.y, cx, cy);
      }

      if (placement) {
        const tool = DEFENSE_TOOLS[placement.toolId];
        const remaining = Math.max(0, placement.expiresAtSeconds - this.snapshot.elapsedSeconds);
        const fraction = remaining / tool.durationSeconds;
        this.drawWedge(cx, cy, inner, outer - 18, start, end, colorToNumber(tool.color), 0.26);
        this.actors.lineStyle(5, colorToNumber(tool.color), 0.88);
        this.actors.beginPath();
        this.actors.arc(cx, cy, outer + 6, start, start + (end - start) * fraction);
        this.actors.strokePath();
      }

      if (this.hoveredSector === sector.id && this.snapshot.selectedTool) {
        this.drawWedge(cx, cy, inner, outer, start, end, colorToNumber(DEFENSE_TOOLS[this.snapshot.selectedTool].color), 0.14);
      }
    }
  }

  private drawWedge(cx: number, cy: number, inner: number, outer: number, start: number, end: number, color: number, alpha: number) {
    const steps = 8;
    this.actors.fillStyle(color, alpha);
    this.actors.beginPath();
    for (let i = 0; i <= steps; i++) {
      const angle = start + ((end - start) * i) / steps;
      const x = cx + Math.cos(angle) * outer;
      const y = cy + Math.sin(angle) * outer;
      if (i === 0) this.actors.moveTo(x, y);
      else this.actors.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const angle = start + ((end - start) * i) / steps;
      this.actors.lineTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    }
    this.actors.closePath();
    this.actors.fillPath();
  }

  private getSectorAt(x: number, y: number): SectorId | null {
    const { width, height } = this.scale;
    const cx = width * 0.46;
    const cy = height * 0.53;
    const distance = Math.hypot(x - cx, y - cy);
    if (distance < 62 || distance > Math.min(width, height) * 0.47) return null;
    const angle = Math.atan2(y - cy, x - cx);
    const normalized = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    return SECTOR_IDS[Math.floor(normalized / (Math.PI * 2 / SECTOR_IDS.length))] ?? null;
  }

  private sectorPoint(sectorId: SectorId, cx: number, cy: number, radius: number): { x: number; y: number } {
    const index = SECTOR_IDS.indexOf(sectorId);
    const angle = -Math.PI / 2 + (index + 0.5) * (Math.PI * 2 / SECTOR_IDS.length);
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  }

  private hasMatchingPlacement(sectorId: SectorId, toolId: DefenseToolId): boolean {
    return this.snapshot.placements.some(placement => placement.sectorId === sectorId && placement.toolId === toolId);
  }

}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function geneColor(gene: GeneId): string {
  return GENES[gene].color;
}

export function threatColor(threat: ThreatId): string {
  return THREATS[threat].color;
}

function colorToNumber(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16);
}
