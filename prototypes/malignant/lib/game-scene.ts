import * as Phaser from 'phaser';
import { malignantBus } from './event-bus';
import type { GamePhase, GeneId, MarkerKind, ProgressState, UiState } from './types';

type TileKind = 'open' | 'fibrous' | 'nest';
type UnitKind = 'collector' | 'combat';
type UnitMode = 'idle' | 'to-marker' | 'to-debris' | 'to-pcr' | 'digestion' | 'rebooting' | 'engulfed' | 'dead';
type MacMode = 'advance' | 'scan' | 'engulf' | 'retreat';

interface Hex {
  q: number;
  r: number;
}

interface Tile extends Hex {
  kind: TileKind;
  colonized: boolean;
}

interface DebrisNode extends Hex {
  id: string;
  label: string;
  gene: GeneId;
  band: number;
  available: boolean;
  graphic: Phaser.GameObjects.Graphics | null;
}

interface LabSample {
  id: string;
  label: string;
  gene: GeneId;
  band: number;
}

interface Marker extends Hex {
  id: number;
  kind: MarkerKind;
  expiresAt: number;
  assignedUnitIds: number[];
}

interface Unit extends Hex {
  id: number;
  kind: UnitKind;
  x: number;
  y: number;
  speed: number;
  genes: Set<GeneId>;
  mode: UnitMode;
  carryingDebris: boolean;
  target: Hex | null;
  targetMarkerId: number | null;
  path: Hex[];
  body: Phaser.GameObjects.Graphics;
  ring: Phaser.GameObjects.Arc;
  rebootUntil: number;
}

interface Macrophage extends Hex {
  id: number;
  x: number;
  y: number;
  hp: number;
  scout: boolean;
  mode: MacMode;
  targetUnitId: number | null;
  modeUntil: number;
  bounces: number;
  body: Phaser.GameObjects.Graphics;
}

interface Digestion {
  tile: Hex;
  completeAt: number;
}

interface TimedProgress extends ProgressState {
  startedAt: number;
  duration: number;
}

const GRID_W = 20;
const GRID_H = 15;
const HEX = 28;
const SQRT3 = Math.sqrt(3);
const CENTER: Hex = { q: 8, r: 7 };
const PCR: Hex = { q: 5, r: 7 };
const GEL: Hex = { q: 5, r: 8 };
const INCUBATOR: Hex = { q: 8, r: 8 };
const NEST: Hex = { q: 18, r: 7 };
const FIBROUS = new Set(['13,7', '14,7']);
const SCOUT_WAVE_DELAY = 24000;
const FIRST_WAVE_DELAY = 90000;
const ENGULF_DURATION = 7000;
const DEBRIS_NODES: Array<Omit<DebrisNode, 'available' | 'graphic'>> = [
  { id: 'apoptotic-start', label: 'Apoptotic Start', gene: 'sod', band: 400, q: 11, r: 7 },
  { id: 'motility-fragment', label: 'Motility Fragment', gene: 'motility', band: 290, q: 10, r: 4 },
  { id: 'mmp-fragment', label: 'MMP Fragment', gene: 'mmp', band: 620, q: 12, r: 10 },
];
const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function key(hex: Hex) {
  return `${hex.q},${hex.r}`;
}

function distance(a: Hex, b: Hex) {
  const aq = a.q;
  const ar = a.r;
  const as = -aq - ar;
  const bq = b.q;
  const br = b.r;
  const bs = -bq - br;
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}

function progress(state: TimedProgress, now: number) {
  if (state.status !== 'running') return state.progress;
  return Math.min(1, (now - state.startedAt) / state.duration);
}

export class MalignantScene extends Phaser.Scene {
  private tiles = new Map<string, Tile>();
  private debrisNodes: DebrisNode[] = [];
  private units: Unit[] = [];
  private macrophages: Macrophage[] = [];
  private markers: Marker[] = [];
  private digestion: Digestion | null = null;
  private nextId = 1;
  private pcrQueue: LabSample[] = [];
  private gelQueue: LabSample[] = [];
  private activePcrSample: LabSample | null = null;
  private activeGelSample: LabSample | null = null;
  private lastGelSample: LabSample | null = null;
  private completedGelSamples: LabSample[] = [];
  private pcr: TimedProgress = { status: 'idle', progress: 0, startedAt: 0, duration: 10000 };
  private gel: TimedProgress = { status: 'idle', progress: 0, startedAt: 0, duration: 8000 };
  private gelBand: number | null = null;
  private currentGene: GeneId | null = null;
  private integratingGene: GeneId | null = null;
  private carriedGeneByUnit = new Map<number, GeneId>();
  private sampleStage: 'debris' | 'pcr-input' | 'pcr-running' | 'amplified' | 'gel-running' | 'gel-band' = 'debris';
  private bookReady = false;
  private phase: GamePhase = 'playing';
  private pausedByBook = false;
  private wave = 'None';
  private message = 'Collect apoptotic debris, then run the lab chain.';
  private startedAt = 0;
  private finalStartedAt = 0;
  private firstWaveSpawned = false;
  private scoutSpawned = false;
  private nestAttackStarted = 0;
  private nestHp = 1;
  private unsubscribeDeploy: (() => void) | null = null;
  private unsubscribeRestart: (() => void) | null = null;
  private unsubscribePause: (() => void) | null = null;

  constructor() {
    super({ key: 'MalignantScene' });
  }

  create() {
    this.startedAt = this.time.now;
    this.buildTiles();
    this.buildDebrisNodes();
    this.drawStaticWorld();
    this.spawnStartUnits();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));
    this.input.mouse?.disableContextMenu();
    this.unsubscribeDeploy = malignantBus.on('plasmid_deployed', design => {
      const gene = this.toGeneId(design.gene);
      if (gene) this.integratePlasmid(gene);
    });
    this.unsubscribeRestart = malignantBus.on('restart_requested', () => this.scene.restart());
    this.unsubscribePause = malignantBus.on('game_paused', payload => {
      this.pausedByBook = payload.paused;
    });
  }

  shutdown() {
    this.unsubscribeDeploy?.();
    this.unsubscribeRestart?.();
    this.unsubscribePause?.();
  }

  override update(_: number, delta: number) {
    const dt = delta / 1000;
    const now = this.time.now;
    if (this.phase === 'won' || this.phase === 'lost') {
      this.emitUi();
      return;
    }
    if (this.pausedByBook) {
      this.emitUi();
      return;
    }

    this.updateInstruments(now);
    this.updateMarkers(now);
    this.updateUnits(dt, now);
    this.updateMacrophages(dt, now);
    this.updateNest(now);
    this.maybeStartScout(now);
    this.maybeStartFirstWave(now);
    this.updateFinalWave(now);
    this.emitUi();
  }

  private buildTiles() {
    this.tiles.clear();
    for (let r = 0; r < GRID_H; r++) {
      for (let q = 0; q < GRID_W; q++) {
        const tile: Tile = {
          q,
          r,
          kind: key({ q, r }) === key(NEST) ? 'nest' : FIBROUS.has(`${q},${r}`) ? 'fibrous' : 'open',
          colonized: distance({ q, r }, CENTER) <= 4,
        };
        this.tiles.set(key(tile), tile);
      }
    }
  }

  private buildDebrisNodes() {
    this.debrisNodes = DEBRIS_NODES.map(node => ({ ...node, available: true, graphic: null }));
  }

  private world(hex: Hex) {
    const x = 70 + HEX * SQRT3 * (hex.q + hex.r / 2);
    const y = 54 + HEX * 1.5 * hex.r;
    return { x, y };
  }

  private hexAt(x: number, y: number): Hex | null {
    let best: Hex | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const tile of this.tiles.values()) {
      const pos = this.world(tile);
      const d = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
      if (d < bestDist) {
        best = tile;
        bestDist = d;
      }
    }
    return bestDist < HEX * 1.25 ? best : null;
  }

  private drawStaticWorld() {
    this.cameras.main.setBackgroundColor('#17120f');
    const g = this.add.graphics();
    for (const tile of this.tiles.values()) {
      const pos = this.world(tile);
      const color = tile.kind === 'fibrous' ? 0x211a17 : tile.kind === 'nest' ? 0x481317 : tile.colonized ? 0x36251b : 0x2a201a;
      g.fillStyle(color, 1);
      g.lineStyle(1, 0x3a2e25, 0.7);
      this.drawHex(g, pos.x, pos.y, HEX - 1, true);
      if (tile.kind === 'fibrous') {
        g.lineStyle(1, 0x5b5147, 0.45);
        g.lineBetween(pos.x - 13, pos.y - 8, pos.x + 13, pos.y + 8);
        g.lineBetween(pos.x - 13, pos.y + 8, pos.x + 13, pos.y - 8);
      }
    }
    this.drawWarburgChannel();
    this.drawBuilding(PCR, 0x777777);
    this.addMapLabel(PCR, 'PCR Station', -38);
    this.drawBuilding(GEL, 0x777777);
    this.addMapLabel(GEL, 'Gel Station', 34);
    this.drawBuilding(INCUBATOR, 0x777777);
    this.addMapLabel(INCUBATOR, 'Incubator', 34);
    this.drawFounder();
    this.addMapLabel(CENTER, 'Founder Cell', 42);
    this.drawDebrisNodes();
    this.drawNest();
    this.addMapLabel(NEST, 'Pathogen Nest', -48);
    this.addFibrousLabels();
  }

  private redrawTile(hex: Hex) {
    const tile = this.tiles.get(key(hex));
    if (!tile) return;
    const pos = this.world(tile);
    const g = this.add.graphics();
    g.fillStyle(tile.colonized ? 0x4a2e1d : 0x211a17, 1);
    g.lineStyle(1, 0xd2693a, 0.45);
    this.drawHex(g, pos.x, pos.y, HEX - 1, true);
    g.setDepth(-1);
  }

  private drawHex(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, fill: boolean) {
    const points: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      points.push(new Phaser.Math.Vector2(x + radius * Math.cos(angle), y + radius * Math.sin(angle)));
    }
    if (fill) g.fillPoints(points, true);
    g.strokePoints(points, true);
  }

  private drawFounder() {
    const pos = this.world(CENTER);
    const cell = this.add.circle(pos.x, pos.y, 26, 0xd2693a, 0.96);
    cell.setStrokeStyle(2, 0xffefd0, 1);
    this.add.circle(pos.x, pos.y, 12, 0x8a3a18, 1);
    this.tweens.add({ targets: cell, scale: 1.13, alpha: 0.78, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private addMapLabel(hex: Hex, label: string, yOffset: number) {
    const pos = this.world(hex);
    const text = this.add.text(pos.x, pos.y + yOffset, label, {
      color: '#f2dfc7',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: 'rgba(15, 12, 10, 0.72)',
      padding: { x: 5, y: 3 },
    });
    text.setOrigin(0.5);
    text.setDepth(5);
  }

  private addFibrousLabels() {
    for (const tileKey of FIBROUS) {
      const tile = this.tiles.get(tileKey);
      if (tile) this.addMapLabel(tile, 'Fibrous tissue', 34);
    }
  }

  private drawBuilding(hex: Hex, color: number) {
    const pos = this.world(hex);
    const box = this.add.rectangle(pos.x, pos.y, 24, 24, color, 0.92);
    box.setStrokeStyle(1, 0xd8c1a5, 0.55);
  }

  private drawDebrisNodes() {
    for (const node of this.debrisNodes) {
      const pos = this.world(node);
      const g = this.add.graphics();
      node.graphic = g;
      g.fillStyle(0xd8d8d8, 0.95);
      g.lineStyle(2, 0xffffff, 0.9);
      this.drawHex(g, pos.x, pos.y, 12, true);
      this.drawVial(g, pos.x + 18, pos.y - 14, 0xd8d8d8, 0xffffff);
      this.addMapLabel(node, node.label, -34);
      this.tweens.add({ targets: g, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  private drawNest() {
    const pos = this.world(NEST);
    const g = this.add.graphics();
    g.fillStyle(0x5a1619, 1);
    g.lineStyle(2, 0xb8433f, 0.8);
    this.drawHex(g, pos.x, pos.y, 30, true);
    g.fillStyle(0x3b1114, 1);
    this.drawHex(g, pos.x - 22, pos.y + 12, 18, true);
    this.drawHex(g, pos.x + 22, pos.y + 12, 18, true);
  }

  private drawWarburgChannel() {
    const a = this.world(CENTER);
    const b = this.world(PCR);
    const g = this.add.graphics();
    g.lineStyle(4, 0x3a78b8, 0.75);
    g.lineBetween(a.x, a.y, b.x, b.y);
    this.tweens.add({ targets: g, alpha: 0.45, duration: 1200, yoyo: true, repeat: -1 });
  }

  private drawInstrumentVisuals(now: number) {
    const g = this.add.graphics();
    g.name = 'instrument-visual';
    this.drawInstrumentProgress(g, PCR, this.pcr.progress, this.pcr.status === 'running' ? 0x3a78b8 : 0x777777);
    this.drawInstrumentProgress(g, GEL, this.gel.progress, this.gel.status === 'running' ? 0x79b568 : 0x777777);

    if (this.sampleStage === 'pcr-input' || this.sampleStage === 'pcr-running') {
      const pos = this.world(PCR);
      this.drawVial(g, pos.x + 20, pos.y - 18, 0xd8d8d8, 0xffffff);
      if (this.pcr.status === 'running') {
        g.lineStyle(2, 0x3a78b8, 0.75 + Math.sin(now / 160) * 0.2);
        g.strokeCircle(pos.x, pos.y, 28);
      }
    }
    if (this.sampleStage === 'amplified' || this.sampleStage === 'gel-running' || this.sampleStage === 'gel-band') {
      const pcrPos = this.world(PCR);
      for (let i = 0; i < 5; i++) {
        this.drawVial(g, pcrPos.x - 18 + i * 9, pcrPos.y - 24, 0xd8d8d8, 0xffffff);
      }
    }
    if (this.sampleStage === 'gel-running' || this.sampleStage === 'gel-band') {
      this.drawGelReadout(g);
    }
  }

  private drawInstrumentProgress(g: Phaser.GameObjects.Graphics, hex: Hex, amount: number, color: number) {
    if (amount <= 0) return;
    const pos = this.world(hex);
    g.lineStyle(4, color, 0.9);
    g.beginPath();
    g.arc(pos.x, pos.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
    g.strokePath();
  }

  private drawGelReadout(g: Phaser.GameObjects.Graphics) {
    const pos = this.world(GEL);
    g.fillStyle(0x101922, 0.92);
    g.fillRoundedRect(pos.x + 24, pos.y - 34, 30, 54, 4);
    g.lineStyle(1, 0x9ec9ff, 0.65);
    g.strokeRoundedRect(pos.x + 24, pos.y - 34, 30, 54, 4);
    g.fillStyle(0xd8d8d8, 0.95);
    g.fillRoundedRect(pos.x + 33, pos.y - 28, 12, 7, 3);
    const bandY = this.sampleStage === 'gel-band' ? pos.y - 2 : pos.y - 16 + this.gel.progress * 20;
    g.fillStyle(0x9ec9ff, this.sampleStage === 'gel-band' ? 1 : 0.55);
    g.fillRoundedRect(pos.x + 29, bandY, 20, 4, 2);
  }

  private drawVial(g: Phaser.GameObjects.Graphics, x: number, y: number, fill: number, stroke: number) {
    g.fillStyle(fill, 0.95);
    g.lineStyle(1, stroke, 0.9);
    g.fillRoundedRect(x - 4, y - 5, 8, 12, 3);
    g.strokeRoundedRect(x - 4, y - 5, 8, 12, 3);
    g.fillStyle(stroke, 0.85);
    g.fillRect(x - 3, y - 8, 6, 3);
  }

  private spawnStartUnits() {
    const starts: Array<{ kind: UnitKind; offset: Hex }> = [
      { kind: 'collector', offset: { q: -1, r: 0 } },
      { kind: 'collector', offset: { q: 0, r: -1 } },
      { kind: 'collector', offset: { q: 1, r: -1 } },
      { kind: 'combat', offset: { q: 0, r: 1 } },
      { kind: 'combat', offset: { q: 1, r: 0 } },
    ];
    for (const start of starts) {
      const hex = { q: CENTER.q + start.offset.q, r: CENTER.r + start.offset.r };
      const pos = this.world(hex);
      const body = this.add.graphics();
      const ring = this.add.circle(pos.x, pos.y, start.kind === 'collector' ? 10 : 13);
      ring.setStrokeStyle(2, 0x79b568, 0);
      const unit: Unit = {
        id: this.nextId++,
        kind: start.kind,
        q: hex.q,
        r: hex.r,
        x: pos.x,
        y: pos.y,
        speed: start.kind === 'collector' ? 95 : 62,
        genes: new Set<GeneId>(),
        mode: 'idle',
        carryingDebris: false,
        target: null,
        targetMarkerId: null,
        path: [],
        body,
        ring,
        rebootUntil: 0,
      };
      this.units.push(unit);
      this.drawUnit(unit);
    }
  }

  private drawUnit(unit: Unit) {
    unit.body.clear();
    unit.body.fillStyle(0xd2693a, unit.mode === 'rebooting' ? 0.45 : 1);
    unit.body.lineStyle(1, 0x1a1612, 1);
    if (unit.kind === 'collector') {
      unit.body.fillCircle(unit.x, unit.y, 7);
      unit.body.strokeCircle(unit.x, unit.y, 7);
    } else {
      this.drawHex(unit.body, unit.x, unit.y, 10, true);
    }
    if (unit.carryingDebris) this.drawVial(unit.body, unit.x + 9, unit.y - 9, 0xd8d8d8, 0xffffff);
    if (unit.genes.has('sod')) {
      unit.body.fillStyle(0x79b568, 1);
      unit.body.fillCircle(unit.x, unit.y - 13, 3);
    }
    if (unit.genes.has('mmp')) {
      unit.body.fillStyle(0xd2693a, 1);
      unit.body.fillTriangle(unit.x - 4, unit.y + 13, unit.x + 4, unit.y + 13, unit.x, unit.y + 7);
    }
    if (unit.genes.has('motility')) {
      unit.body.lineStyle(1, 0x3a78b8, 0.8);
      unit.body.lineBetween(unit.x - 11, unit.y + 10, unit.x - 18, unit.y + 15);
      unit.body.lineBetween(unit.x + 11, unit.y + 10, unit.x + 18, unit.y + 15);
    }
    unit.ring.setPosition(unit.x, unit.y);
    unit.ring.setAlpha(unit.genes.has('sod') ? 0.95 : 0);
  }

  private handlePointer(pointer: Phaser.Input.Pointer) {
    if (this.phase !== 'playing' && this.phase !== 'final-wave') return;
    const hex = this.hexAt(pointer.worldX, pointer.worldY);
    if (!hex) return;
    const tile = this.tiles.get(key(hex));
    if (!tile) return;
    if (tile.kind === 'fibrous' && !tile.colonized && this.isAdjacentToColony(tile)) {
      this.placeFlare(tile);
      return;
    }
    if (tile.kind === 'fibrous' && !tile.colonized) {
      this.message = 'Fibrous tissue must touch amber colony territory before an MMP Flare can digest it.';
      return;
    }
    if (!this.isPassable(tile)) return;
    this.placeMarker(pointer.rightButtonDown() ? 'defend' : 'harvest', tile);
  }

  private placeMarker(kind: MarkerKind, hex: Hex) {
    const active = this.markers.filter(marker => marker.kind === kind);
    if (active.length >= 5) {
      const oldest = active.sort((a, b) => a.expiresAt - b.expiresAt)[0];
      this.markers = this.markers.filter(marker => marker.id !== oldest.id);
    }
    const marker: Marker = { id: this.nextId++, kind, q: hex.q, r: hex.r, expiresAt: this.time.now + 15000, assignedUnitIds: [] };
    this.markers.push(marker);
    const assigned = this.assignUnitsToMarker(marker);
    this.message = kind === 'harvest'
      ? assigned > 0 ? 'Harvest signal placed. One collector is moving tile-by-tile.' : 'No free collector can take that harvest signal.'
      : assigned > 0 ? 'Defend signal placed. Combat cells are moving tile-by-tile.' : 'No free combat cell can take that defend signal.';
    malignantBus.emit('marker_placed', { kind, q: hex.q, r: hex.r });
  }

  private assignUnitsToMarker(marker: Marker) {
    const unitKind: UnitKind = marker.kind === 'harvest' ? 'collector' : 'combat';
    const limit = marker.kind === 'harvest' ? 1 : 2;
    const candidates = this.units
      .filter(unit => unit.kind === unitKind && this.canTakeMarkerCommand(unit, marker.kind))
      .sort((a, b) => distance(a, marker) - distance(b, marker))
      .slice(0, limit);

    for (const unit of candidates) {
      this.clearMarkerAssignment(unit.id);
      marker.assignedUnitIds.push(unit.id);
      this.setUnitTarget(unit, marker, 'to-marker', marker.id);
    }
    return candidates.length;
  }

  private canTakeMarkerCommand(unit: Unit, markerKind: MarkerKind) {
    if (unit.mode === 'dead' || unit.mode === 'engulfed' || unit.mode === 'rebooting') return false;
    if (unit.mode === 'to-pcr' || unit.mode === 'digestion' || unit.carryingDebris) return false;
    if (markerKind === 'harvest' && unit.targetMarkerId !== null) return false;
    return true;
  }

  private clearMarkerAssignment(unitId: number) {
    for (const marker of this.markers) {
      marker.assignedUnitIds = marker.assignedUnitIds.filter(id => id !== unitId);
    }
  }

  private placeFlare(tile: Tile) {
    if (this.digestion) return;
    const mmpUnits = this.units.filter(unit => unit.kind === 'combat' && unit.genes.has('mmp')).length;
    const duration = mmpUnits > 0 ? 4500 : 8000;
    this.digestion = { tile, completeAt: this.time.now + duration };
    this.message = 'MMP Flare digesting fibrous tissue.';
    const combat = this.units.filter(unit => unit.kind === 'combat' && unit.mode !== 'dead');
    for (const unit of combat.slice(0, 2)) {
      this.clearMarkerAssignment(unit.id);
      this.setUnitTarget(unit, tile, 'digestion', null, true);
    }
  }

  private updateMarkers(now: number) {
    const expired = this.markers.filter(marker => marker.expiresAt <= now);
    for (const marker of expired) {
      for (const unitId of marker.assignedUnitIds) {
        const unit = this.units.find(candidate => candidate.id === unitId);
        if (unit?.targetMarkerId === marker.id) this.stopUnit(unit);
      }
    }
    this.markers = this.markers.filter(marker => marker.expiresAt > now);
    this.children.list
      .filter(child => child.name === 'marker' || child.name === 'instrument-visual')
      .forEach(child => child.destroy());
    for (const marker of this.markers) {
      const pos = this.world(marker);
      const remaining = (marker.expiresAt - now) / 15000;
      const color = marker.kind === 'harvest' ? 0x3a78b8 : 0xb8433f;
      const g = this.add.graphics();
      g.name = 'marker';
      g.fillStyle(color, 0.95);
      g.fillCircle(pos.x, pos.y, 5 + Math.sin(now / 160) * 1.5);
      g.lineStyle(2, color, Math.max(0.1, remaining));
      g.strokeCircle(pos.x, pos.y, 19 * remaining);
      g.lineStyle(1, color, 0.25);
      for (const unitId of marker.assignedUnitIds) {
        const unit = this.units.find(candidate => candidate.id === unitId);
        if (unit) g.lineBetween(unit.x, unit.y, pos.x, pos.y);
      }
    }
    this.drawInstrumentVisuals(now);
    if (this.digestion) {
      const pos = this.world(this.digestion.tile);
      const remaining = Math.max(0, (this.digestion.completeAt - now) / 8000);
      const g = this.add.graphics();
      g.name = 'marker';
      g.fillStyle(0x79b568, 0.16);
      this.drawHex(g, pos.x, pos.y, HEX - 2, true);
      g.lineStyle(3, 0x79b568, 0.8);
      g.strokeCircle(pos.x, pos.y, 22 * remaining + 8);
      if (now >= this.digestion.completeAt) {
        const tile = this.tiles.get(key(this.digestion.tile));
        if (tile) {
          tile.colonized = true;
          this.redrawTile(tile);
          this.message = 'Fibrous tissue colonized.';
        }
        this.digestion = null;
      }
    }
  }

  private updateUnits(dt: number, now: number) {
    for (const unit of this.units) {
      if (unit.mode === 'dead' || unit.mode === 'engulfed') continue;
      if (unit.mode === 'rebooting' && now >= unit.rebootUntil) {
        unit.mode = 'idle';
        if (this.integratingGene) unit.genes.add(this.integratingGene);
      }
      if (unit.mode !== 'rebooting') this.assignUnitTarget(unit);
      if (unit.target) this.moveUnit(unit, dt);
      this.handleUnitArrival(unit, now);
      this.drawUnit(unit);
    }
    this.units = this.units.filter(unit => unit.mode !== 'dead');
  }

  private assignUnitTarget(unit: Unit) {
    if (unit.mode === 'to-pcr' || unit.mode === 'digestion') return;
    if (unit.kind === 'collector' && unit.carryingDebris) {
      this.setUnitTarget(unit, PCR, 'to-pcr', null);
      return;
    }
    if (!unit.target && unit.kind === 'combat' && this.isNestAttackable()) {
      this.setUnitTarget(unit, NEST, 'to-marker', null);
    }
  }

  private moveUnit(unit: Unit, dt: number) {
    const destination = this.nextUnitDestination(unit);
    if (!destination) return;
    const angle = Phaser.Math.Angle.Between(unit.x, unit.y, destination.x, destination.y);
    const step = unit.speed * (unit.genes.has('motility') ? 1.45 : 1) * dt;
    const d = Phaser.Math.Distance.Between(unit.x, unit.y, destination.x, destination.y);
    if (d <= step) {
      unit.x = destination.x;
      unit.y = destination.y;
      if (unit.path.length > 0) {
        const reached = unit.path.shift();
        if (reached) {
          unit.q = reached.q;
          unit.r = reached.r;
        }
      } else if (unit.target) {
        unit.q = unit.target.q;
        unit.r = unit.target.r;
      }
    } else {
      unit.x += Math.cos(angle) * step;
      unit.y += Math.sin(angle) * step;
    }
  }

  private nextUnitDestination(unit: Unit) {
    if (unit.path.length > 0) return this.world(unit.path[0]);
    if (!unit.target) return null;
    const pos = this.world(unit.target);
    const offset = this.formationOffset(unit);
    return { x: pos.x + offset.x, y: pos.y + offset.y };
  }

  private formationOffset(unit: Unit) {
    if (!unit.target) return { x: 0, y: 0 };
    const targetKey = key(unit.target);
    const companions = this.units
      .filter(candidate => candidate.id !== unit.id && candidate.target && key(candidate.target) === targetKey)
      .map(candidate => candidate.id);
    const index = [unit.id, ...companions].sort((a, b) => a - b).indexOf(unit.id);
    if (index <= 0) return { x: 0, y: 0 };
    const angle = (index / 6) * Math.PI * 2;
    const radius = unit.kind === 'collector' ? 11 : 15;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }

  private setUnitTarget(unit: Unit, target: Hex, mode: UnitMode, markerId: number | null, allowBlockedTarget = false) {
    unit.target = { q: target.q, r: target.r };
    unit.targetMarkerId = markerId;
    unit.mode = mode;
    unit.path = this.findPath(unit, target, allowBlockedTarget);
  }

  private stopUnit(unit: Unit) {
    unit.target = null;
    unit.targetMarkerId = null;
    unit.path = [];
    if (unit.mode === 'to-marker') unit.mode = 'idle';
  }

  private findPath(start: Hex, goal: Hex, allowBlockedGoal = false) {
    if (distance(start, goal) === 0) return [];
    const startKey = key(start);
    const goalKey = key(goal);
    const frontier: Hex[] = [{ q: start.q, r: start.r }];
    const cameFrom = new Map<string, string | null>([[startKey, null]]);
    const byKey = new Map<string, Hex>([[startKey, { q: start.q, r: start.r }]]);

    while (frontier.length > 0) {
      const current = frontier.shift();
      if (!current) break;
      if (key(current) === goalKey) break;
      for (const neighbor of this.neighbors(current)) {
        const neighborKey = key(neighbor);
        if (cameFrom.has(neighborKey)) continue;
        const tile = this.tiles.get(neighborKey);
        if (!tile) continue;
        const isGoal = neighborKey === goalKey;
        if (!this.isPassable(tile) && !(allowBlockedGoal && isGoal)) continue;
        frontier.push(neighbor);
        byKey.set(neighborKey, neighbor);
        cameFrom.set(neighborKey, key(current));
      }
    }

    if (!cameFrom.has(goalKey)) return [{ q: goal.q, r: goal.r }];

    const path: Hex[] = [];
    let cursor: string | null = goalKey;
    while (cursor && cursor !== startKey) {
      const step = byKey.get(cursor);
      if (step) path.unshift(step);
      cursor = cameFrom.get(cursor) ?? null;
    }
    return path;
  }

  private neighbors(hex: Hex) {
    return DIRECTIONS.map(direction => ({ q: hex.q + direction.q, r: hex.r + direction.r }))
      .filter(candidate => candidate.q >= 0 && candidate.q < GRID_W && candidate.r >= 0 && candidate.r < GRID_H);
  }

  private handleUnitArrival(unit: Unit, now: number) {
    if (!unit.target || distance(unit, unit.target) > 0) return;
    const debris = this.debrisNodes.find(node => node.available && distance(unit, node) <= 1);
    if (unit.kind === 'collector' && debris) {
      debris.available = false;
      debris.graphic?.setVisible(false);
      unit.carryingDebris = true;
      this.carriedGeneByUnit.set(unit.id, debris.gene);
      this.sampleStage = 'pcr-input';
      this.setUnitTarget(unit, PCR, 'to-pcr', null);
      malignantBus.emit('debris_collected', { source: debris.label });
      this.message = 'Debris retrieved. Collector routing sample to PCR.';
      return;
    }
    if (unit.mode === 'to-pcr' && distance(unit, PCR) === 0 && unit.carryingDebris) {
      const gene = this.carriedGeneByUnit.get(unit.id);
      if (gene) {
        const definition = DEBRIS_NODES.find(node => node.gene === gene);
        if (definition) {
          this.pcrQueue.push({
            id: `${definition.id}-${this.time.now}`,
            label: definition.label,
            gene,
            band: definition.band,
          });
        }
      }
      unit.carryingDebris = false;
      this.carriedGeneByUnit.delete(unit.id);
      unit.mode = 'idle';
      unit.target = null;
      this.startNextPcr(now);
      this.message = this.activePcrSample ? 'Sample queued. PCR is amplifying one vial at a time.' : 'Sample queued at PCR.';
    }
  }

  private updateInstruments(now: number) {
    this.startNextPcr(now);
    this.startNextGel(now);
    if (this.pcr.status === 'running') {
      this.sampleStage = 'pcr-running';
      this.pcr.progress = progress(this.pcr, now);
      if (this.pcr.progress >= 1) {
        this.pcr.status = 'ready';
        if (this.activePcrSample) this.gelQueue.push(this.activePcrSample);
        this.activePcrSample = null;
        this.sampleStage = 'amplified';
        this.message = 'PCR copied one sample into many matching vials.';
        this.startNextPcr(now);
        this.startNextGel(now);
      }
    }
    if (this.gel.status === 'running') {
      this.sampleStage = 'gel-running';
      this.gel.progress = progress(this.gel, now);
      if (this.gel.progress >= 1) {
        this.gel.status = 'ready';
        this.lastGelSample = this.activeGelSample;
        this.activeGelSample = null;
        this.currentGene = this.lastGelSample?.gene ?? null;
        this.gelBand = this.lastGelSample?.band ?? null;
        if (this.lastGelSample && !this.completedGelSamples.some(sample => sample.gene === this.lastGelSample?.gene)) {
          this.completedGelSamples.push(this.lastGelSample);
        }
        this.sampleStage = 'gel-band';
        this.bookReady = true;
        this.message = this.gelBand ? `Gel complete. Reference Book matched a ${this.gelBand}bp band.` : 'Gel complete.';
        this.startNextGel(now);
      }
    }
  }

  private startNextPcr(now: number) {
    if (this.pcr.status === 'running' || this.activePcrSample || this.pcrQueue.length === 0) return;
    this.activePcrSample = this.pcrQueue.shift() ?? null;
    if (!this.activePcrSample) return;
    this.pcr = { status: 'running', progress: 0, startedAt: now, duration: 10000 };
    this.sampleStage = 'pcr-running';
  }

  private startNextGel(now: number) {
    if (this.gel.status === 'running' || this.activeGelSample || this.gelQueue.length === 0) return;
    this.activeGelSample = this.gelQueue.shift() ?? null;
    if (!this.activeGelSample) return;
    this.gel = { status: 'running', progress: 0, startedAt: now, duration: 8000 };
    this.sampleStage = 'gel-running';
  }

  private integratePlasmid(gene: GeneId) {
    this.integratingGene = gene;
    const completeAt = this.time.now + 5000;
    for (const unit of this.units) {
      if (unit.mode !== 'dead') {
        unit.mode = 'rebooting';
        unit.rebootUntil = completeAt;
        unit.target = null;
      }
    }
    this.message = `Incubator integrating ${gene.toUpperCase()} plasmid.`;
  }

  private toGeneId(value: string): GeneId | null {
    if (value === 'sod' || value === 'mmp' || value === 'motility') return value;
    return null;
  }

  private maybeStartFirstWave(now: number) {
    if (this.firstWaveSpawned) return;
    if (now - this.startedAt >= FIRST_WAVE_DELAY || this.units.some(unit => unit.q >= 16)) {
      this.firstWaveSpawned = true;
      this.spawnWave(4, 'Macrophage wave', [{ q: 19, r: 3 }, { q: 19, r: 6 }, { q: 19, r: 9 }, { q: 19, r: 12 }]);
    }
  }

  private maybeStartScout(now: number) {
    if (this.scoutSpawned) return;
    if (now - this.startedAt < SCOUT_WAVE_DELAY) return;
    this.scoutSpawned = true;
    this.spawnWave(1, 'Macrophage scout', [{ q: 19, r: 8 }]);
  }

  private spawnWave(count: number, label: string, starts: Hex[]) {
    this.wave = label;
    malignantBus.emit('wave_started', { wave: label });
    for (let i = 0; i < count; i++) {
      const start = starts[i % starts.length];
      const pos = this.world(start);
      const body = this.add.graphics();
      const mac: Macrophage = {
        id: this.nextId++,
        q: start.q,
        r: start.r,
        x: pos.x,
        y: pos.y,
        hp: 2,
        scout: label === 'Macrophage scout',
        mode: 'advance',
        targetUnitId: null,
        modeUntil: 0,
        bounces: 0,
        body,
      };
      this.macrophages.push(mac);
      this.drawMac(mac);
    }
    this.message = `${label} detected.`;
  }

  private drawMac(mac: Macrophage) {
    mac.body.clear();
    mac.body.fillStyle(0x7d4aa8, mac.mode === 'retreat' ? 0.5 : 0.9);
    mac.body.fillCircle(mac.x, mac.y, 18);
    mac.body.fillCircle(mac.x + 14, mac.y + 4, 9);
    mac.body.fillCircle(mac.x - 9, mac.y + 12, 7);
    mac.body.fillCircle(mac.x + 2, mac.y - 14, 6);
    if (mac.mode === 'scan') {
      mac.body.lineStyle(2, 0xd9b8ff, 0.85);
      mac.body.strokeCircle(mac.x, mac.y, 28);
    }
    if (mac.mode === 'engulf') {
      const t = 1 - Math.max(0, (mac.modeUntil - this.time.now) / ENGULF_DURATION);
      mac.body.fillStyle(0x9f6bd0, 0.32);
      mac.body.fillCircle(mac.x, mac.y, 22 + t * 24);
    }
  }

  private updateMacrophages(dt: number, now: number) {
    for (const mac of this.macrophages) {
      if (mac.mode === 'retreat') {
        mac.x += 85 * dt;
        if (mac.x > this.scale.width + 50) mac.hp = 0;
      } else if (mac.mode === 'engulf') {
        this.tryInterruptEngulfment(mac);
        if (now >= mac.modeUntil) this.resolveMacContact(mac, now);
      } else if (mac.mode === 'scan') {
        if (now >= mac.modeUntil) this.resolveMacContact(mac, now);
      } else {
        const nearest = this.nearestLivingUnit(mac);
        if (mac.scout && !nearest) {
          mac.mode = 'retreat';
          this.drawMac(mac);
          continue;
        }
        const target = nearest ?? CENTER;
        const pos = 'x' in target ? target : this.world(target);
        const angle = Phaser.Math.Angle.Between(mac.x, mac.y, pos.x, pos.y);
        mac.x += Math.cos(angle) * 45 * dt;
        mac.y += Math.sin(angle) * 45 * dt;
        const unit = this.nearestLivingUnit(mac);
        if (unit && Phaser.Math.Distance.Between(mac.x, mac.y, unit.x, unit.y) < 23) {
          mac.mode = 'scan';
          mac.targetUnitId = unit.id;
          mac.modeUntil = now + 2000;
        }
        const founder = this.world(CENTER);
        if (Phaser.Math.Distance.Between(mac.x, mac.y, founder.x, founder.y) < 22) {
          if (mac.scout) {
            mac.mode = 'retreat';
            this.message = 'The scout brushed the Founder Cell and withdrew. A full wave will not.';
          } else {
            this.lose();
          }
        }
      }
      this.drawMac(mac);
    }
    this.macrophages = this.macrophages.filter(mac => mac.hp > 0);
  }

  private resolveMacContact(mac: Macrophage, now: number) {
    const unit = this.units.find(candidate => candidate.id === mac.targetUnitId);
    if (!unit || unit.mode === 'dead') {
      mac.mode = 'advance';
      return;
    }
    if (mac.mode === 'scan') {
      if (unit.genes.has('sod')) {
        mac.bounces++;
        mac.hp--;
        mac.x += 35;
        mac.mode = mac.bounces >= 2 || mac.hp <= 0 ? 'retreat' : 'advance';
        this.message = 'SOD unit neutralized macrophage oxidative attack.';
      } else {
        mac.mode = 'engulf';
        mac.modeUntil = now + ENGULF_DURATION;
        unit.mode = 'engulfed';
        this.message = 'Macrophage engulfment in progress. Red defend signals can pull combat cells into a rescue.';
      }
    } else if (mac.mode === 'engulf') {
      unit.mode = 'dead';
      mac.mode = mac.scout ? 'retreat' : 'advance';
      malignantBus.emit('unit_engulfed', { unitId: unit.id });
      this.dropFragment(unit);
      if (mac.scout) this.message = 'Scout engulfed one cell and retreated. Full waves will keep pushing.';
    }
  }

  private tryInterruptEngulfment(mac: Macrophage) {
    const unit = this.units.find(candidate => candidate.id === mac.targetUnitId);
    if (!unit || unit.mode !== 'engulfed') return;
    const defendNearby = this.markers.some(marker => {
      if (marker.kind !== 'defend') return false;
      const pos = this.world(marker);
      return Phaser.Math.Distance.Between(pos.x, pos.y, mac.x, mac.y) < 95;
    });
    if (!defendNearby) return;
    const rescuers = this.units.filter(candidate => (
      candidate.kind === 'combat'
      && candidate.id !== unit.id
      && candidate.mode !== 'dead'
      && candidate.mode !== 'engulfed'
      && candidate.mode !== 'rebooting'
      && Phaser.Math.Distance.Between(candidate.x, candidate.y, mac.x, mac.y) < 105
    ));
    const sodRescuer = rescuers.some(candidate => candidate.genes.has('sod'));
    if (!sodRescuer && rescuers.length < 2) return;
    unit.mode = 'idle';
    unit.target = null;
    unit.path = [];
    mac.hp -= sodRescuer ? 2 : 1;
    mac.mode = mac.hp <= 0 ? 'retreat' : 'advance';
    mac.targetUnitId = null;
    mac.x += sodRescuer ? 38 : 22;
    this.message = sodRescuer
      ? 'SOD combat cell broke the engulfment and drove the macrophage back.'
      : 'Combat cells interrupted engulfment, buying lab time.';
  }

  private dropFragment(unit: Unit) {
    const g = this.add.circle(unit.x, unit.y, 4, 0xffffff, 0.9);
    this.tweens.add({ targets: g, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });
  }

  private updateNest(now: number) {
    if (!this.isNestAttackable()) return;
    const attackers = this.units.filter(unit => unit.kind === 'combat' && Phaser.Math.Distance.Between(unit.x, unit.y, this.world(NEST).x, this.world(NEST).y) < 54);
    if (attackers.length === 0) {
      this.nestAttackStarted = 0;
      return;
    }
    if (this.nestAttackStarted === 0) this.nestAttackStarted = now;
    this.nestHp = Math.max(0, 1 - (now - this.nestAttackStarted) / 10000);
    const pos = this.world(NEST);
    const g = this.add.graphics();
    g.name = 'marker';
    g.lineStyle(4, 0xb8433f, 0.9);
    g.beginPath();
    g.arc(pos.x, pos.y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.nestHp);
    g.strokePath();
    if (this.nestHp <= 0 && this.phase === 'playing') {
      this.phase = 'final-wave';
      this.finalStartedAt = now;
      malignantBus.emit('nest_destroyed', { time: Math.floor((now - this.startedAt) / 1000) });
      this.spawnWave(6, 'Final wave', [{ q: 19, r: 2 }, { q: 19, r: 12 }, { q: 2, r: 0 }, { q: 2, r: 14 }, { q: 12, r: 0 }, { q: 15, r: 14 }]);
      this.message = 'NEST DESTROYED - SURVIVE THE FINAL WAVE';
    }
  }

  private updateFinalWave(now: number) {
    if (this.phase === 'final-wave' && now - this.finalStartedAt >= 30000) {
      this.phase = 'won';
      this.message = 'COLONY SURVIVED';
    }
  }

  private lose() {
    this.phase = 'lost';
    this.message = 'FOUNDER CELL DESTROYED';
  }

  private nearestLivingUnit(mac: Macrophage) {
    return this.units
      .filter(unit => unit.mode !== 'dead' && unit.mode !== 'engulfed' && unit.mode !== 'rebooting')
      .sort((a, b) => Phaser.Math.Distance.Between(mac.x, mac.y, a.x, a.y) - Phaser.Math.Distance.Between(mac.x, mac.y, b.x, b.y))[0] ?? null;
  }

  private isPassable(tile: Tile) {
    return tile.kind === 'open' || tile.colonized || (tile.kind === 'nest' && this.isNestAttackable());
  }

  private isAdjacentToColony(tile: Tile) {
    return Array.from(this.tiles.values()).some(candidate => candidate.colonized && distance(candidate, tile) === 1);
  }

  private isNestAttackable() {
    return Array.from(FIBROUS).every(tileKey => this.tiles.get(tileKey)?.colonized);
  }

  private emitUi() {
    const now = this.time.now;
    const incubating = this.units.some(unit => unit.mode === 'rebooting');
    const remaining = incubating ? Math.max(0, Math.ceil((Math.max(...this.units.map(unit => unit.rebootUntil)) - now) / 1000)) : 0;
    const uiState: UiState = {
      time: Math.floor((now - this.startedAt) / 1000),
      pcr: { status: this.pcr.status, progress: this.pcr.progress },
      gel: { status: this.gel.status, progress: this.gel.progress },
      pcrQueue: this.pcrQueue.length,
      gelQueue: this.gelQueue.length,
      samplesWaiting: this.debrisNodes.filter(node => node.available).length,
      waveCountdown: this.firstWaveSpawned ? 0 : Math.max(0, Math.ceil((FIRST_WAVE_DELAY - (now - this.startedAt)) / 1000)),
      gelBand: this.gelBand,
      gelBands: this.completedGelSamples.map(sample => sample.band),
      currentGene: this.currentGene,
      availableGenes: this.completedGelSamples.map(sample => sample.gene),
      bookReady: this.bookReady,
      incubator: { status: incubating ? 'integrating' : this.units.some(unit => unit.genes.size > 0) ? 'complete' : 'idle', remaining },
      units: {
        collectors: this.units.filter(unit => unit.kind === 'collector').length,
        combat: this.units.filter(unit => unit.kind === 'combat').length,
        sod: this.units.filter(unit => unit.genes.has('sod')).length,
        mmp: this.units.filter(unit => unit.genes.has('mmp')).length,
        motility: this.units.filter(unit => unit.genes.has('motility')).length,
      },
      phase: this.phase,
      finalWaveRemaining: this.phase === 'final-wave' ? Math.max(0, Math.ceil(30 - (now - this.finalStartedAt) / 1000)) : 0,
      fibrousRemaining: Array.from(FIBROUS).filter(tileKey => !this.tiles.get(tileKey)?.colonized).length,
      wave: this.wave,
      message: this.message,
    };
    malignantBus.emit('ui_state', uiState);
  }
}
