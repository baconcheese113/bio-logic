import * as Phaser from 'phaser';
import { malignantBus } from './event-bus';
import type { BuildCommand, BuildingCounts, BuildingKind, DebugSnapshot, GamePhase, GeneId, MalignantDebugApi, MarkerKind, PerfMetrics, ProgressState, UiState } from './types';

type TileKind = 'open' | 'fibrous' | 'capillary' | 'debris' | 'spawn';
type UnitMode = 'idle' | 'combat' | 'carrying' | 'building' | 'rebooting' | 'engulfed';
type MacMode = 'patrolling' | 'aggro' | 'engulfing' | 'bounced';

interface Hex { q: number; r: number }
interface Tile extends Hex { x: number; y: number; kind: TileKind; revealed: boolean; visible: boolean; colonized: boolean; amount: number; sprout: boolean; gene: GeneId | null }
interface Building extends Hex { kind: BuildingKind; hp: number }
interface Unit extends Hex { id: number; x: number; y: number; mode: UnitMode; target: Hex | null; path: Hex[]; carrying: GeneId | null; genes: Set<GeneId>; busyUntil: number; lastShotAt: number; spawnedAt: number; body: Phaser.GameObjects.Graphics }
interface Marker extends Hex { id: number; kind: MarkerKind; expiresAt: number; assignedUnitIds: number[]; body: Phaser.GameObjects.Graphics }
interface Macrophage extends Hex { id: number; x: number; y: number; hp: number; adapted: boolean; mode: MacMode; lastKnown: Hex | null; targetUnitId: number | null; modeUntil: number; body: Phaser.GameObjects.Graphics | null }
interface DormantMacrophage extends Hex { adapted: boolean }
interface Projectile { id: number; from: WorldPoint; to: WorldPoint; firedAt: number; expiresAt: number }
interface Sample { gene: GeneId; source: string }
interface TimedProgress extends ProgressState { startedAt: number; duration: number }
interface WorldPoint { x: number; y: number }
interface PerfAccumulator {
  frameMs: number;
  panMs: number;
  economyMs: number;
  unitProductionMs: number;
  instrumentsMs: number;
  unitsMs: number;
  projectilesMs: number;
  visibilityMs: number;
  macrophagesMs: number;
  drawDynamicMs: number;
  drawMapMs: number;
  drawMapCalls: number;
  frames: number;
}

declare global {
  interface Window {
    malignantDebug?: MalignantDebugApi;
  }
}

const GRID_W = 100;
const GRID_H = 100;
const HEX = 15;
const SQRT3 = Math.sqrt(3);
const CENTER: Hex = { q: 50, r: 50 };
const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];
const PLACEMENT_ORDER: BuildingKind[] = ['bioreactor', 'pcr', 'gel', 'incubator', 'energy'];
const BUILDING_COSTS: Record<BuildingKind, number> = { bioreactor: 50, pcr: 30, gel: 30, incubator: 20, energy: 40, sprout: 25 };
const UNIT_COST = 20;
const UNIT_PRODUCTION_TIME = 15_000;
const BUILDING_CLEARANCE = 4;
const STARTING_MACROPHAGES = 620;
const ENEMY_PRESSURE_GAP = 45_000;
const LEAKAGE_TIME = 90_000;
const UNIT_RANGE = 3;
const UNIT_FIRE_COOLDOWN = 1_550;
const BUILDING_SIGHT_RANGE = 3;
const TERRITORY_SIGHT_RANGE = 1;
const AGGRO_SENSE_RANGE = 5;
const AGGRO_PULL_RANGE = 7;
const AGGRO_MEMORY = 7_000;
const AMBIENT_PRESSURE_GAP = 3_500;
const CAMERA_ZOOM_MIN = 2.1;
const CAMERA_ZOOM_START = 2.6;
const CAMERA_ZOOM_MAX = 3.4;
const VISIBILITY_RECOMPUTE_GAP = 80;
const VISIBILITY_REDRAW_GAP = 220;
const MACROPHAGE_SIMULATION_DIVISOR = 3;
const PERF_SAMPLE_WINDOW_MS = 1_000;
const HEX_UNIT_POINTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0.8660254037844386, y: -0.5 },
  { x: 0.8660254037844386, y: 0.5 },
  { x: 0, y: 1 },
  { x: -0.8660254037844386, y: 0.5 },
  { x: -0.8660254037844386, y: -0.5 },
  { x: 0, y: -1 },
];

function tileKey(hex: Hex) {
  return `${hex.q},${hex.r}`;
}

function distance(a: Hex, b: Hex) {
  const as = -a.q - a.r;
  const bs = -b.q - b.r;
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(as - bs));
}

function progress(state: TimedProgress, now: number) {
  return state.status === 'running' ? Math.min(1, (now - state.startedAt) / state.duration) : state.progress;
}

class Random {
  constructor(private seed: number) {}

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  between(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]) {
    return items[Math.floor(this.next() * items.length)];
  }
}

export class MalignantScene extends Phaser.Scene {
  private tiles = new Map<string, Tile>();
  private buildings: Building[] = [];
  private units: Unit[] = [];
  private markers: Marker[] = [];
  private macrophages: Macrophage[] = [];
  private dormantMacrophages: DormantMacrophage[] = [];
  private projectiles: Projectile[] = [];
  private spawnZones: Hex[] = [];
  private pcrQueue: Sample[] = [];
  private gelQueue: Sample[] = [];
  private unitQueue = 0;
  private unitProductions: number[] = [];
  private activePcr: Sample | null = null;
  private activeGel: Sample | null = null;
  private pcr: TimedProgress = { status: 'idle', progress: 0, startedAt: 0, duration: 15_000 };
  private gel: TimedProgress = { status: 'idle', progress: 0, startedAt: 0, duration: 10_000 };
  private mapLayer!: Phaser.GameObjects.Graphics;
  private mapSprite: Phaser.GameObjects.Image | null = null;
  private instrumentLayer!: Phaser.GameObjects.Graphics;
  private cardLayer!: Phaser.GameObjects.Graphics;
  private buildGhostLayer!: Phaser.GameObjects.Graphics;
  private mapLabels: Phaser.GameObjects.Text[] = [];
  private founder!: Phaser.GameObjects.Arc;
  private mapTextureWidth = 0;
  private mapTextureHeight = 0;
  private readonly mapTextureKey = 'malignant-map-cache';
  private nextId = 1;
  private seed = Date.now() & 0xfffffff;
  private rng = new Random(this.seed);
  private phase: GamePhase = 'placement';
  private nutrients = 150;
  private nutrientCarry = 0;
  private startedAt = 0;
  private leakageStartedAt = 0;
  private nextEnemyPressureAt = 0;
  private nextAmbientPressureAt = 0;
  private activeGene: GeneId | null = null;
  private readyGene: GeneId | null = null;
  private availableGenes: GeneId[] = [];
  private integratingGene: GeneId | null = null;
  private incubatorDoneAt = 0;
  private chainsCompleted = 0;
  private adaptationsSurvived = 0;
  private adaptationLog: number[] = [];
  private message = 'Left-click units to select them. Right-click to move, attack, or harvest.';
  private cause = '';
  private selectedBuild: BuildCommand | null = null;
  private selectedBuilding: BuildingKind | null = null;
  private selectedUnitIds = new Set<number>();
  private hoveredHex: Hex | null = null;
  private dragSelectStart: WorldPoint | null = null;
  private dragSelectEnd: WorldPoint | null = null;
  private panKeys: Record<string, Phaser.Input.Keyboard.Key> | null = null;
  private middleDragActive = false;
  private middleDragScreen = { x: 0, y: 0 };
  private lastUiEmitAt = 0;
  private nextVisibilityRecomputeAt = 0;
  private nextVisibilityRedrawAt = 0;
  private visibilityRenderDirty = false;
  private macrophageCursor = 0;
  private smoothedFps = 60;
  private perfWindowStartAt = 0;
  private perfAccumulator: PerfAccumulator = {
    frameMs: 0,
    panMs: 0,
    economyMs: 0,
    unitProductionMs: 0,
    instrumentsMs: 0,
    unitsMs: 0,
    projectilesMs: 0,
    visibilityMs: 0,
    macrophagesMs: 0,
    drawDynamicMs: 0,
    drawMapMs: 0,
    drawMapCalls: 0,
    frames: 0,
  };
  private perfMetrics: PerfMetrics = {
    frameMs: 0,
    panMs: 0,
    economyMs: 0,
    unitProductionMs: 0,
    instrumentsMs: 0,
    unitsMs: 0,
    projectilesMs: 0,
    visibilityMs: 0,
    macrophagesMs: 0,
    drawDynamicMs: 0,
    drawMapMs: 0,
    drawMapCallsPerSecond: 0,
  };
  private unsubDeploy: (() => void) | null = null;
  private unsubRestart: (() => void) | null = null;
  private unsubBuild: (() => void) | null = null;
  private unsubAutoSetup: (() => void) | null = null;
  private unsubUnitRequest: (() => void) | null = null;

  constructor() {
    super({ key: 'MalignantScene' });
  }

  create() {
    this.resetSceneState();
    this.mapLayer = this.add.graphics();
    this.instrumentLayer = this.add.graphics().setDepth(8);
    this.cardLayer = this.add.graphics().setDepth(9);
    this.buildGhostLayer = this.add.graphics().setDepth(10);
    this.buildMap();
    this.setupCamera();
    this.drawMap();
    this.drawFounder();
    this.spawnUnits(5);
    this.spawnInitialEnemies();
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.handlePointerMove(pointer));
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.handlePointerUp(pointer));
    this.input.on('pointerout', () => this.setCanvasCursor('crosshair'));
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom + (dy > 0 ? -0.12 : 0.12), CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX);
    });
    this.input.keyboard?.on('keydown-ESC', () => this.selectBuild(null));
    this.unsubDeploy = malignantBus.on('plasmid_deployed', design => this.deployPlasmid(design.gene));
    this.unsubRestart = malignantBus.on('restart_requested', () => this.scene.restart());
    this.unsubBuild = malignantBus.on('build_selected', payload => this.selectBuild(payload.command));
    this.unsubAutoSetup = malignantBus.on('auto_setup_requested', () => this.autoSetupLab());
    this.unsubUnitRequest = malignantBus.on('unit_requested', () => this.requestUnit());
    this.installDebugApi();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubDeploy?.();
      this.unsubRestart?.();
      this.unsubBuild?.();
      this.unsubAutoSetup?.();
      this.unsubUnitRequest?.();
      this.clearMapLabels();
      this.mapSprite?.destroy();
      this.mapSprite = null;
      if (this.textures.exists(this.mapTextureKey)) this.textures.remove(this.mapTextureKey);
      delete window.malignantDebug;
    });
  }

  override update(_: number, delta: number) {
    const frameStart = performance.now();
    const now = this.time.now;
    const dt = delta / 1000;
    const actualFps = this.game.loop.actualFps;
    this.smoothedFps = this.smoothedFps * 0.9 + actualFps * 0.1;
    if (this.phase === 'won' || this.phase === 'lost') {
      this.emitUi(true);
      return;
    }
    const panStart = performance.now();
    this.panCamera(delta);
    this.perfAccumulator.panMs += performance.now() - panStart;

    const economyStart = performance.now();
    this.updateEconomy(dt);
    this.perfAccumulator.economyMs += performance.now() - economyStart;

    const productionStart = performance.now();
    this.updateUnitProduction(now);
    this.perfAccumulator.unitProductionMs += performance.now() - productionStart;

    const instrumentsStart = performance.now();
    this.updateInstruments(now);
    this.perfAccumulator.instrumentsMs += performance.now() - instrumentsStart;

    this.updateIncubator(now);
    this.updateMarkers(now);
    const unitsStart = performance.now();
    this.updateUnits(dt, now);
    this.perfAccumulator.unitsMs += performance.now() - unitsStart;

    const projectilesStart = performance.now();
    this.updateProjectiles(now);
    this.perfAccumulator.projectilesMs += performance.now() - projectilesStart;

    if (now >= this.nextVisibilityRecomputeAt) {
      const visibilityStart = performance.now();
      this.nextVisibilityRecomputeAt = now + VISIBILITY_RECOMPUTE_GAP;
      const visibilityChanged = this.recomputeVisibility();
      if (visibilityChanged) {
        this.activateDormantMacrophages();
        this.visibilityRenderDirty = true;
      }
      this.perfAccumulator.visibilityMs += performance.now() - visibilityStart;
    }
    if (this.visibilityRenderDirty && now >= this.nextVisibilityRedrawAt) {
      this.nextVisibilityRedrawAt = now + VISIBILITY_REDRAW_GAP;
      this.visibilityRenderDirty = false;
      this.drawMap();
    }
    const macrophageStart = performance.now();
    this.updateMacrophages(dt, now);
    this.perfAccumulator.macrophagesMs += performance.now() - macrophageStart;

    this.updateAmbientImmuneDensity(now);
    this.updateEnemyPressure(now);
    this.updateLeakage(now);
    this.updateWin(now);
    const drawDynamicStart = performance.now();
    this.drawDynamic();
    this.perfAccumulator.drawDynamicMs += performance.now() - drawDynamicStart;
    this.drawGeneCard();
    this.drawBuildGhost();
    this.emitUi(false);

    this.perfAccumulator.frameMs += performance.now() - frameStart;
    this.perfAccumulator.frames++;
    if (now - this.perfWindowStartAt >= PERF_SAMPLE_WINDOW_MS) {
      this.flushPerfWindow(now);
    }
  }

  private resetSceneState() {
    this.seed = (Date.now() + Math.floor(Math.random() * 99_999)) & 0xfffffff;
    this.rng = new Random(this.seed);
    this.tiles.clear();
    this.buildings = [
      { kind: 'bioreactor', q: CENTER.q + 1, r: CENTER.r, hp: 6 },
      { kind: 'energy', q: CENTER.q - 1, r: CENTER.r + 1, hp: 8 },
    ];
    this.units = [];
    this.markers = [];
    this.macrophages = [];
    this.dormantMacrophages = [];
    this.projectiles = [];
    this.spawnZones = [];
    this.pcrQueue = [];
    this.gelQueue = [];
    this.unitQueue = 0;
    this.unitProductions = [];
    this.activePcr = null;
    this.activeGel = null;
    this.pcr = { status: 'idle', progress: 0, startedAt: 0, duration: 15_000 };
    this.gel = { status: 'idle', progress: 0, startedAt: 0, duration: 10_000 };
    this.nextId = 1;
    this.phase = 'playing';
    this.nutrients = 150;
    this.nutrientCarry = 0;
    this.startedAt = this.time.now;
    this.leakageStartedAt = this.time.now;
    this.nextEnemyPressureAt = this.startedAt + ENEMY_PRESSURE_GAP;
    this.nextAmbientPressureAt = this.startedAt + AMBIENT_PRESSURE_GAP;
    this.activeGene = null;
    this.readyGene = null;
    this.availableGenes = [];
    this.integratingGene = null;
    this.incubatorDoneAt = 0;
    this.chainsCompleted = 0;
    this.adaptationsSurvived = 0;
    this.adaptationLog = [];
    this.cause = '';
    this.selectedBuild = null;
    this.selectedBuilding = null;
    this.selectedUnitIds.clear();
    this.hoveredHex = null;
    this.dragSelectStart = null;
    this.dragSelectEnd = null;
    this.nextVisibilityRecomputeAt = 0;
    this.nextVisibilityRedrawAt = 0;
    this.visibilityRenderDirty = false;
    this.macrophageCursor = 0;
    this.perfWindowStartAt = this.time.now;
    this.perfAccumulator = {
      frameMs: 0,
      panMs: 0,
      economyMs: 0,
      unitProductionMs: 0,
      instrumentsMs: 0,
      unitsMs: 0,
      projectilesMs: 0,
      visibilityMs: 0,
      macrophagesMs: 0,
      drawDynamicMs: 0,
      drawMapMs: 0,
      drawMapCalls: 0,
      frames: 0,
    };
  }

  private buildMap() {
    for (let r = 0; r < GRID_H; r++) {
      for (let q = 0; q < GRID_W; q++) {
        this.tiles.set(tileKey({ q, r }), {
          q,
          r,
          x: HEX * SQRT3 * (q + r / 2),
          y: HEX * 1.5 * r,
          kind: 'open',
          revealed: false,
          visible: false,
          colonized: false,
          amount: 0,
          sprout: false,
          gene: null,
        });
      }
    }
    this.reveal(CENTER, 10);
    this.colonize(CENTER, 8);
    this.placeFeatures();
    this.placeStartingFeatures();
    this.recomputeVisibility();
  }

  private placeStartingFeatures() {
    this.placeDebris({ q: CENTER.q + 4, r: CENTER.r - 1 }, 'sod', this.rng.between(3, 4), true);
    this.placeDebris({ q: CENTER.q - 4, r: CENTER.r + 2 }, 'pdl1', this.rng.between(5, 6), true);
    this.setKind({ q: CENTER.q + 6, r: CENTER.r - 2 }, 'capillary');
    this.setKind({ q: CENTER.q - 5, r: CENTER.r + 1 }, 'capillary');
    for (const hex of [{ q: CENTER.q + 5, r: CENTER.r }, { q: CENTER.q + 5, r: CENTER.r - 1 }, { q: CENTER.q + 4, r: CENTER.r + 1 }]) {
      const tile = this.tiles.get(tileKey(hex));
      if (tile && tile.kind === 'open') {
        tile.kind = 'fibrous';
        tile.colonized = false;
      }
    }
  }

  private placeFeatures() {
    const edges = this.rng.pick([['top', 'right'], ['right', 'bottom'], ['left', 'top'], ['left', 'bottom'], ['top', 'right', 'bottom']]);
    for (const edge of edges) {
      const count = this.rng.between(5, 8);
      for (let i = 0; i < count; i++) this.spawnZones.push(this.edgeHex(edge));
    }
    this.spawnZones.forEach(hex => this.setKind(hex, 'spawn'));
    for (let i = 0; i < this.rng.between(3, 5); i++) this.setKind(this.randomFarHex(8, 42), 'capillary');
    const debrisCount = this.rng.between(4, 6);
    for (let i = 0; i < debrisCount; i++) {
      const far = i === 0 ? this.randomFarHex(30, 45) : this.randomFarHex(8, 44);
      this.placeDebris(far, i % 2 === 0 ? 'sod' : 'pdl1', this.rng.between(5, 8), false);
    }
    for (let i = 0; i < 20; i++) {
      const center = this.randomFarHex(4, 42);
      for (const tile of this.tiles.values()) {
        if (distance(tile, center) <= this.rng.between(1, 3) && distance(tile, CENTER) > 6 && tile.kind === 'open') tile.kind = 'fibrous';
      }
    }
  }

  private edgeHex(edge: string): Hex {
    if (edge === 'top') return { q: this.rng.between(5, GRID_W - 6), r: 0 };
    if (edge === 'bottom') return { q: this.rng.between(5, GRID_W - 6), r: GRID_H - 1 };
    if (edge === 'left') return { q: 0, r: this.rng.between(5, GRID_H - 6) };
    return { q: GRID_W - 1, r: this.rng.between(5, GRID_H - 6) };
  }

  private randomFarHex(min: number, max: number) {
    for (let i = 0; i < 500; i++) {
      const hex = { q: this.rng.between(4, GRID_W - 5), r: this.rng.between(4, GRID_H - 5) };
      const d = distance(hex, CENTER);
      if (d >= min && d <= max) return hex;
    }
    return { q: CENTER.q + min, r: CENTER.r };
  }

  private placeDebris(hex: Hex, gene: GeneId, amount: number, revealed: boolean) {
    const tile = this.tiles.get(tileKey(hex));
    if (!tile) return;
    tile.kind = 'debris';
    tile.amount = amount;
    tile.gene = gene;
    if (revealed) tile.revealed = true;
  }

  private setKind(hex: Hex, kind: TileKind) {
    const tile = this.tiles.get(tileKey(hex));
    if (tile) tile.kind = kind;
  }

  private world(hex: Hex) {
    const maybeTile = hex as Partial<Tile>;
    if (typeof maybeTile.x === 'number' && typeof maybeTile.y === 'number') {
      return { x: maybeTile.x, y: maybeTile.y };
    }
    return { x: HEX * SQRT3 * (hex.q + hex.r / 2), y: HEX * 1.5 * hex.r };
  }

  private isWorldVisible(x: number, y: number, padding = 48) {
    const view = this.cameras.main.worldView;
    return x >= view.x - padding
      && x <= view.right + padding
      && y >= view.y - padding
      && y <= view.bottom + padding;
  }

  private hexAt(x: number, y: number): Hex | null {
    const r = Math.round(y / (HEX * 1.5));
    const q = Math.round(x / (HEX * SQRT3) - r / 2);
    let bestQ = 0;
    let bestR = 0;
    let found = false;
    let bestDistanceSq = Number.POSITIVE_INFINITY;

    const centerTile = this.tiles.get(tileKey({ q, r }));
    if (centerTile) {
      const dx = x - centerTile.x;
      const dy = y - centerTile.y;
      bestDistanceSq = dx * dx + dy * dy;
      bestQ = centerTile.q;
      bestR = centerTile.r;
      found = true;
    }

    for (const direction of DIRECTIONS) {
      const tile = this.tiles.get(tileKey({ q: q + direction.q, r: r + direction.r }));
      if (!tile) continue;
      const dx = x - tile.x;
      const dy = y - tile.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq >= bestDistanceSq) continue;
      bestDistanceSq = distanceSq;
      bestQ = tile.q;
      bestR = tile.r;
      found = true;
    }

    return found ? { q: bestQ, r: bestR } : null;
  }

  private setupCamera() {
    const end = this.world({ q: GRID_W - 1, r: GRID_H - 1 });
    this.mapTextureWidth = Math.ceil(end.x + HEX * 2);
    this.mapTextureHeight = Math.ceil(end.y + HEX * 2);
    this.cameras.main.setBounds(-160, -160, end.x + 320, end.y + 320);
    this.cameras.main.setZoom(CAMERA_ZOOM_START);
    this.cameras.main.centerOn(this.world(CENTER).x, this.world(CENTER).y);
  }

  private panCamera(delta: number) {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.panKeys ??= keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    const keys = this.panKeys;
    const speed = 0.75 * delta / this.cameras.main.zoom;
    if (keys.A.isDown || keys.LEFT.isDown) this.cameras.main.scrollX -= speed;
    if (keys.D.isDown || keys.RIGHT.isDown) this.cameras.main.scrollX += speed;
    if (keys.W.isDown || keys.UP.isDown) this.cameras.main.scrollY -= speed;
    if (keys.S.isDown || keys.DOWN.isDown) this.cameras.main.scrollY += speed;
  }

  private drawMap() {
    const drawMapStart = performance.now();
    this.clearMapLabels();
    this.mapLayer.clear();
    const cullStatic = this.canCullStaticMap();
    for (const tile of this.tiles.values()) {
      if (cullStatic && !this.isWorldVisible(tile.x, tile.y, HEX * 2)) continue;
      const hidden = !tile.revealed;
      const fill = hidden ? 0x03050a : tile.colonized ? 0x2c2419 : this.tileColor(tile);
      this.mapLayer.fillStyle(fill, hidden ? 0.98 : tile.visible ? 1 : 0.38);
      this.mapLayer.lineStyle(1, hidden ? 0x080c14 : tile.visible ? 0x273043 : 0x151c29, tile.visible ? 0.75 : 0.35);
      this.drawHex(this.mapLayer, tile.x, tile.y, HEX - 1, true);
      if (!hidden && tile.kind === 'fibrous') this.drawCrosshatch(this.mapLayer, tile.x, tile.y);
      if (!hidden && tile.kind === 'debris') this.drawDebris(this.mapLayer, tile.x, tile.y, tile.amount);
      if (!hidden && tile.kind === 'capillary') this.drawCapillary(this.mapLayer, tile.x, tile.y, tile.sprout);
      if (!hidden && tile.kind === 'spawn') {
        this.mapLayer.fillStyle(0x10111d, 0.9);
        this.mapLayer.fillCircle(tile.x, tile.y, 5);
      }
    }
    for (const tile of this.tiles.values()) {
      if (cullStatic && !this.isWorldVisible(tile.x, tile.y, HEX * 2)) continue;
      if (tile.revealed && !tile.colonized && this.adjacentToColony(tile) && tile.kind !== 'spawn') this.drawFrontier(this.mapLayer, tile);
    }
    for (const building of this.buildings) {
      const pos = this.world(building);
      if (cullStatic && !this.isWorldVisible(pos.x, pos.y, HEX * 2)) continue;
      this.drawBuilding(this.mapLayer, building);
      this.addMapLabel(pos.x, pos.y + 18, this.label(building.kind));
    }
    const founderPos = this.world(CENTER);
    if (!cullStatic || this.isWorldVisible(founderPos.x, founderPos.y, HEX * 2)) {
      this.addMapLabel(founderPos.x, founderPos.y + 28, 'Founder Cell');
    }
    for (const tile of this.tiles.values()) {
      if (!tile.revealed || !tile.visible) continue;
      if (cullStatic && !this.isWorldVisible(tile.x, tile.y, HEX * 2)) continue;
      if (tile.kind === 'capillary') this.addMapLabel(tile.x, tile.y - 18, tile.sprout ? 'Sprout' : 'Capillary node');
      if (tile.kind === 'debris' && tile.amount > 0) this.addMapLabel(tile.x, tile.y + 18, `${tile.amount} debris`);
    }
    if (this.textures.exists(this.mapTextureKey)) this.textures.remove(this.mapTextureKey);
    this.mapLayer.generateTexture(this.mapTextureKey, this.mapTextureWidth, this.mapTextureHeight);
    if (!this.mapSprite) {
      this.mapSprite = this.add.image(0, 0, this.mapTextureKey).setOrigin(0, 0).setDepth(0);
    } else {
      this.mapSprite.setTexture(this.mapTextureKey);
    }
    this.mapLayer.clear();
    this.perfAccumulator.drawMapMs += performance.now() - drawMapStart;
    this.perfAccumulator.drawMapCalls++;
  }

  private clearMapLabels() {
    for (const label of this.mapLabels) label.destroy();
    this.mapLabels = [];
  }

  private addMapLabel(x: number, y: number, text: string) {
    const label = this.add.text(x, y, text, {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: '#d7e1ec',
      backgroundColor: 'rgba(9, 12, 18, 0.76)',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    }).setOrigin(0.5, 0.5).setDepth(2);
    this.mapLabels.push(label);
  }

  private canCullStaticMap() {
    const view = this.cameras.main.worldView;
    return view.width > 0 && view.height > 0;
  }

  private tileColor(tile: Tile) {
    if (tile.kind === 'fibrous') return 0x121a25;
    if (tile.kind === 'capillary') return 0x4a1738;
    if (tile.kind === 'debris') return 0x101827;
    if (tile.kind === 'spawn') return 0x070912;
    return 0x0a0f1a;
  }

  private drawDynamic() {
    this.instrumentLayer.clear();
    for (const marker of this.markers) this.drawMarker(marker);
    for (const projectile of this.projectiles) this.drawProjectile(projectile);
    for (const building of this.buildings) {
      if (building.kind === 'bioreactor') this.drawBioreactorPulse(this.instrumentLayer, building);
      if (building.kind === 'pcr') this.drawProgressAt(this.instrumentLayer, building, this.pcr.progress, 0x78a6ff);
      if (building.kind === 'gel') this.drawGelAt(this.instrumentLayer, building);
      if (building.kind === 'incubator') this.drawIncubatorAt(this.instrumentLayer, building);
      if (building.kind === 'energy') this.drawEnergyAt(this.instrumentLayer, building);
    }
    for (const unit of this.units) {
      if (!this.isWorldVisible(unit.x, unit.y, 32)) continue;
      if (unit.mode === 'building' && unit.target) this.drawMmpFlare(this.instrumentLayer, unit.target);
      const rangedTarget = this.rangedTarget(unit);
      if (!rangedTarget) continue;
      this.instrumentLayer.lineStyle(1, 0xf2c94c, 0.35);
      this.instrumentLayer.lineBetween(unit.x, unit.y, rangedTarget.x, rangedTarget.y);
    }
    this.drawSelectionBox();
  }

  private drawHex(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, fill: boolean) {
    const first = HEX_UNIT_POINTS[0];
    g.beginPath();
    g.moveTo(x + first.x * radius, y + first.y * radius);
    for (let i = 1; i < HEX_UNIT_POINTS.length; i++) {
      const point = HEX_UNIT_POINTS[i];
      g.lineTo(x + point.x * radius, y + point.y * radius);
    }
    g.closePath();
    if (fill) g.fillPath();
    g.strokePath();
  }

  private drawCrosshatch(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.lineStyle(1, 0x586273, 0.35);
    g.lineBetween(x - 8, y - 5, x + 8, y + 5);
    g.lineBetween(x - 8, y + 5, x + 8, y - 5);
  }

  private drawDebris(g: Phaser.GameObjects.Graphics, x: number, y: number, amount: number) {
    g.fillStyle(0xffffff, 0.88);
    for (let i = 0; i < amount; i++) g.fillCircle(x + ((i % 4) - 1.5) * 4, y + (Math.floor(i / 4) - 0.5) * 4, 2);
  }

  private drawCapillary(g: Phaser.GameObjects.Graphics, x: number, y: number, sprout: boolean) {
    g.fillStyle(0xff4f9a, 0.9);
    this.drawHex(g, x, y, 9, true);
    if (sprout) {
      g.fillStyle(0xd2693a, 1);
      g.fillCircle(x, y, 4);
    }
  }

  private drawFounder() {
    const pos = this.world(CENTER);
    this.founder = this.add.circle(pos.x, pos.y, 18, 0xd2693a, 0.96).setDepth(4);
    this.founder.setStrokeStyle(2, 0xffe2b8, 1);
    this.tweens.add({ targets: this.founder, scale: 1.15, alpha: 0.74, duration: 1600, yoyo: true, repeat: -1 });
  }

  private drawBuilding(g: Phaser.GameObjects.Graphics, building: Building) {
    const pos = this.world(building);
    const color = building.kind === 'bioreactor' ? 0x8f4a22 : 0x8f97a7;
    g.fillStyle(color, 0.94);
    g.lineStyle(1, 0xf0dcc1, 0.75);
    g.fillRoundedRect(pos.x - 9, pos.y - 9, 18, 18, 3);
    g.strokeRoundedRect(pos.x - 9, pos.y - 9, 18, 18, 3);
    g.lineStyle(2, 0x101827, 0.82);
    if (building.kind === 'energy') {
      g.lineBetween(pos.x - 2, pos.y - 7, pos.x + 3, pos.y - 1);
      g.lineBetween(pos.x + 3, pos.y - 1, pos.x - 1, pos.y - 1);
      g.lineBetween(pos.x - 1, pos.y - 1, pos.x + 3, pos.y + 7);
    } else if (building.kind === 'incubator') {
      g.strokeCircle(pos.x, pos.y, 5);
      g.lineBetween(pos.x, pos.y, pos.x + 5, pos.y - 2);
    } else {
      g.fillStyle(0x101827, 0.8);
      g.fillCircle(pos.x, pos.y, 4);
    }
    this.drawBuildingGlyph(g, building, pos);
  }

  private drawBuildingGlyph(g: Phaser.GameObjects.Graphics, building: Building, pos: WorldPoint) {
    g.lineStyle(1.5, 0x101827, 0.95);
    if (building.kind === 'bioreactor') {
      g.strokeCircle(pos.x, pos.y, 6);
      g.fillStyle(0x101827, 0.95);
      g.fillCircle(pos.x, pos.y, 2);
      return;
    }
    if (building.kind === 'pcr') {
      g.lineBetween(pos.x - 6, pos.y - 4, pos.x + 6, pos.y + 4);
      g.lineBetween(pos.x - 6, pos.y + 4, pos.x + 6, pos.y - 4);
      return;
    }
    if (building.kind === 'gel') {
      g.strokeRoundedRect(pos.x - 5, pos.y - 7, 10, 14, 2);
      g.lineBetween(pos.x - 3, pos.y, pos.x + 3, pos.y);
      return;
    }
    if (building.kind === 'sprout') {
      g.lineStyle(2, 0xff4f9a, 0.95);
      g.lineBetween(pos.x, pos.y - 7, pos.x, pos.y + 6);
      g.lineBetween(pos.x, pos.y - 2, pos.x - 5, pos.y - 6);
      g.lineBetween(pos.x, pos.y - 2, pos.x + 5, pos.y - 6);
    }
  }

  private drawFrontier(g: Phaser.GameObjects.Graphics, tile: Tile) {
    const color = tile.kind === 'fibrous' ? 0xf29f3f : tile.kind === 'capillary' ? 0xff4f9a : 0xd2693a;
    g.lineStyle(2, color, 0.85 + Math.sin(this.time.now / 220) * 0.12);
    this.drawHex(g, tile.x, tile.y, HEX - 2, false);
  }

  private drawMarker(marker: Marker) {
    const pos = this.world(marker);
    if (!this.isWorldVisible(pos.x, pos.y, 24)) {
      marker.body.clear();
      return;
    }
    const color = marker.kind === 'harvest' ? 0x3a78b8 : 0xb8433f;
    const pulse = 1 + Math.sin(this.time.now / 170) * 0.18;
    marker.body.clear();
    marker.body.lineStyle(2, color, 0.7);
    marker.body.strokeCircle(pos.x, pos.y, 15 * pulse);
    marker.body.fillStyle(color, 0.92);
    marker.body.fillCircle(pos.x, pos.y, 4);
  }

  private drawProjectile(projectile: Projectile) {
    const life = Phaser.Math.Clamp((projectile.expiresAt - this.time.now) / (projectile.expiresAt - projectile.firedAt), 0, 1);
    const traveled = 1 - life;
    const head = {
      x: Phaser.Math.Linear(projectile.from.x, projectile.to.x, traveled),
      y: Phaser.Math.Linear(projectile.from.y, projectile.to.y, traveled),
    };
    const tail = {
      x: Phaser.Math.Linear(projectile.from.x, projectile.to.x, Math.max(0, traveled - 0.22)),
      y: Phaser.Math.Linear(projectile.from.y, projectile.to.y, Math.max(0, traveled - 0.22)),
    };
    if (!this.isWorldVisible(head.x, head.y, 40) && !this.isWorldVisible(tail.x, tail.y, 40)) return;
    this.instrumentLayer.lineStyle(3, 0xf2c94c, 0.8 * life);
    this.instrumentLayer.lineBetween(tail.x, tail.y, head.x, head.y);
    this.instrumentLayer.fillStyle(0xfff4ba, 0.95 * life);
    this.instrumentLayer.fillCircle(head.x, head.y, 3.5);
  }

  private drawSelectionBox() {
    if (!this.dragSelectStart || !this.dragSelectEnd) return;
    const x = Math.min(this.dragSelectStart.x, this.dragSelectEnd.x);
    const y = Math.min(this.dragSelectStart.y, this.dragSelectEnd.y);
    const width = Math.abs(this.dragSelectEnd.x - this.dragSelectStart.x);
    const height = Math.abs(this.dragSelectEnd.y - this.dragSelectStart.y);
    if (width < HEX && height < HEX) return;
    this.instrumentLayer.fillStyle(0x9ec9ff, 0.08);
    this.instrumentLayer.fillRect(x, y, width, height);
    this.instrumentLayer.lineStyle(1, 0x9ec9ff, 0.75);
    this.instrumentLayer.strokeRect(x, y, width, height);
  }

  private drawProgressAt(g: Phaser.GameObjects.Graphics, hex: Hex, amount: number, color: number) {
    if (amount <= 0) return;
    const pos = this.world(hex);
    if (!this.isWorldVisible(pos.x, pos.y, 36)) return;
    g.lineStyle(3, color, 0.95);
    g.beginPath();
    g.arc(pos.x, pos.y, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
    g.strokePath();
    if (hex === this.findBuilding('pcr')) {
      g.lineStyle(1, 0xb9d0ff, 0.75 + Math.sin(this.time.now / 120) * 0.18);
      const copies = Math.max(1, Math.floor(1 + amount * 5));
      for (let i = 0; i < copies; i++) {
        const y = pos.y - 10 + i * 4;
        g.lineBetween(pos.x - 11, y, pos.x + 11, y + 3);
        g.lineBetween(pos.x - 11, y + 3, pos.x + 11, y);
      }
    }
  }

  private drawBioreactorPulse(g: Phaser.GameObjects.Graphics, building: Building) {
    const pos = this.world(building);
    if (!this.isWorldVisible(pos.x, pos.y, 36)) return;
    const radius = 13 + Math.sin(this.time.now / 260) * 3;
    g.lineStyle(2, 0xd2693a, 0.35);
    g.strokeCircle(pos.x, pos.y, radius);
  }

  private drawIncubatorAt(g: Phaser.GameObjects.Graphics, building: Building) {
    const pos = this.world(building);
    if (!this.isWorldVisible(pos.x, pos.y, 40)) return;
    const progressAmount = this.integratingGene ? 1 - Math.max(0, this.incubatorDoneAt - this.time.now) / 8_000 : 0;
    if (progressAmount > 0) this.drawProgressAt(g, building, progressAmount, 0x79b568);
    g.lineStyle(1, 0xdff7d8, 0.75);
    const phase = this.time.now / 240;
    for (let i = 0; i < 8; i++) {
      const angle = phase + i * 0.7;
      g.lineBetween(pos.x + Math.cos(angle) * i, pos.y + Math.sin(angle) * i, pos.x + Math.cos(angle + 0.4) * (i + 1), pos.y + Math.sin(angle + 0.4) * (i + 1));
    }
  }

  private drawEnergyAt(g: Phaser.GameObjects.Graphics, building: Building) {
    const pos = this.world(building);
    if (!this.isWorldVisible(pos.x, pos.y, 36)) return;
    g.lineStyle(2, 0xf2c94c, 0.65 + Math.sin(this.time.now / 180) * 0.25);
    g.lineBetween(pos.x - 3, pos.y - 8, pos.x + 4, pos.y);
    g.lineBetween(pos.x + 4, pos.y, pos.x - 2, pos.y);
    g.lineBetween(pos.x - 2, pos.y, pos.x + 4, pos.y + 8);
  }

  private drawMmpFlare(g: Phaser.GameObjects.Graphics, hex: Hex) {
    const pos = this.world(hex);
    if (!this.isWorldVisible(pos.x, pos.y, 48)) return;
    const pulse = 1 + Math.sin(this.time.now / 120) * 0.15;
    g.lineStyle(2, 0xf29f3f, 0.9);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      g.lineBetween(pos.x, pos.y, pos.x + Math.cos(angle) * 16 * pulse, pos.y + Math.sin(angle) * 16 * pulse);
    }
    g.fillStyle(0xf29f3f, 0.45);
    g.fillCircle(pos.x, pos.y, 5 * pulse);
  }

  private drawGelAt(g: Phaser.GameObjects.Graphics, building: Building) {
    if (this.gel.status === 'idle' && !this.readyGene) return;
    const pos = this.world(building);
    if (!this.isWorldVisible(pos.x, pos.y, 48)) return;
    g.fillStyle(0x081320, 0.92);
    g.fillRoundedRect(pos.x + 13, pos.y - 28, 24, 48, 4);
    g.lineStyle(1, 0x9ec9ff, 0.65);
    g.strokeRoundedRect(pos.x + 13, pos.y - 28, 24, 48, 4);
    const target = this.activeGel?.gene === 'pdl1' || this.readyGene === 'pdl1' ? 12 : -12;
    const y = this.gel.status === 'running' ? pos.y - 17 + (target + 17) * this.gel.progress : pos.y + target;
    g.fillStyle(this.readyGene ? 0xffffff : 0x9ec9ff, 0.95);
    g.fillRoundedRect(pos.x + 18, y, 14, 4, 2);
  }

  private drawGeneCard() {
    this.cardLayer.clear();
    if (!this.readyGene) return;
    const gel = this.findBuilding('gel');
    if (!gel) return;
    const pos = this.world(gel);
    if (!this.isWorldVisible(pos.x, pos.y, 56)) return;
    this.cardLayer.fillStyle(this.readyGene === 'sod' ? 0x15331f : 0x14294a, 0.94);
    this.cardLayer.lineStyle(2, this.readyGene === 'sod' ? 0x79b568 : 0x3a78b8, 0.95);
    this.cardLayer.fillRoundedRect(pos.x - 21, pos.y - 55, 42, 24, 5);
    this.cardLayer.strokeRoundedRect(pos.x - 21, pos.y - 55, 42, 24, 5);
    this.cardLayer.fillStyle(0xf4f7fb, 0.95);
    this.cardLayer.fillCircle(pos.x, pos.y - 43, 4);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    this.hoveredHex = this.hexAt(pointer.worldX, pointer.worldY);
    if (this.dragSelectStart && pointer.leftButtonDown() && !this.selectedBuild) {
      this.dragSelectEnd = { x: pointer.worldX, y: pointer.worldY };
      this.setCanvasCursor('crosshair');
      return;
    }
    if (pointer.isDown && pointer.middleButtonDown()) {
      this.setCanvasCursor('grabbing');
      if (!this.middleDragActive) {
        this.middleDragActive = true;
        this.middleDragScreen.x = pointer.x;
        this.middleDragScreen.y = pointer.y;
        return;
      }
      const dx = pointer.x - this.middleDragScreen.x;
      const dy = pointer.y - this.middleDragScreen.y;
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.middleDragScreen.x = pointer.x;
      this.middleDragScreen.y = pointer.y;
      return;
    }
    this.middleDragActive = false;
    this.updateHoverCursor(pointer);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.dragSelectStart || !this.dragSelectEnd || !pointer.leftButtonReleased()) {
      this.dragSelectStart = null;
      this.dragSelectEnd = null;
      return;
    }
    const width = Math.abs(this.dragSelectEnd.x - this.dragSelectStart.x);
    const height = Math.abs(this.dragSelectEnd.y - this.dragSelectStart.y);
    if (width < HEX && height < HEX) {
      this.dragSelectStart = null;
      this.dragSelectEnd = null;
      return;
    }
    this.selectUnitsInBox(this.dragSelectStart, this.dragSelectEnd, pointer);
    this.dragSelectStart = null;
    this.dragSelectEnd = null;
  }

  private selectBuild(command: BuildCommand | null) {
    this.selectedBuild = command;
    this.selectedBuilding = null;
    this.selectedUnitIds.clear();
    if (!command) {
      this.buildGhostLayer?.clear();
      this.message = 'Build mode cancelled.';
      return;
    }
    this.message = `Build mode: ${this.buildLabel(command)}. Move over the grid for a placement ghost.`;
  }

  private drawBuildGhost() {
    this.buildGhostLayer.clear();
    if (!this.selectedBuild || !this.hoveredHex) return;
    const tile = this.tiles.get(tileKey(this.hoveredHex));
    if (!tile || !tile.revealed) return;
    const valid = this.canBuild(this.selectedBuild, tile).ok;
    const pos = this.world(tile);
    const color = valid ? 0x79b568 : 0xc64848;
    if (this.isBuildingCommand(this.selectedBuild) && this.selectedBuild !== 'sprout') {
      for (const candidate of this.previewBuildTiles(tile)) {
        const candidatePos = this.world(candidate);
        const candidateValid = this.canBuild(this.selectedBuild, candidate).ok;
        this.buildGhostLayer.lineStyle(1, candidateValid ? 0x79b568 : 0xc64848, 0.48);
        this.buildGhostLayer.fillStyle(candidateValid ? 0x79b568 : 0xc64848, candidate === tile ? 0.26 : 0.14);
        this.drawHex(this.buildGhostLayer, candidatePos.x, candidatePos.y, HEX - 2, true);
      }
    }
    this.buildGhostLayer.lineStyle(2, color, 0.95);
    this.drawHex(this.buildGhostLayer, pos.x, pos.y, HEX - 2, false);
    this.buildGhostLayer.fillStyle(color, 0.22);
    this.drawHex(this.buildGhostLayer, pos.x, pos.y, HEX - 3, true);
    if (this.isBuildingCommand(this.selectedBuild)) {
      this.drawGhostBuilding(this.buildGhostLayer, this.selectedBuild, pos);
    }
  }

  private previewBuildTiles(center: Hex) {
    const tiles: Tile[] = [];
    this.forEachTileInRadius(center, BUILDING_CLEARANCE, tile => {
      tiles.push(tile);
    });
    return tiles;
  }

  private drawGhostBuilding(g: Phaser.GameObjects.Graphics, kind: BuildingKind, pos: WorldPoint) {
    g.fillStyle(kind === 'bioreactor' ? 0x8f4a22 : 0x8f97a7, 0.52);
    g.lineStyle(1, 0xf0dcc1, 0.8);
    g.fillRoundedRect(pos.x - 9, pos.y - 9, 18, 18, 3);
    g.strokeRoundedRect(pos.x - 9, pos.y - 9, 18, 18, 3);
    this.drawBuildingGlyph(g, { kind, q: this.hoveredHex?.q ?? 0, r: this.hoveredHex?.r ?? 0, hp: 1 }, pos);
  }

  private isGelCardClick(hex: Hex) {
    const gel = this.findBuilding('gel');
    return gel ? distance(hex, gel) <= 1 : false;
  }

  private updateHoverCursor(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'won' || this.phase === 'lost') {
      this.setCanvasCursor('default');
      return;
    }
    if (this.selectedBuild) {
      this.setCanvasCursor('crosshair');
      return;
    }
    this.setCanvasCursor(this.selectableAt(pointer) ? 'pointer' : 'crosshair');
  }

  private selectableAt(pointer: Phaser.Input.Pointer) {
    const hex = this.hexAt(pointer.worldX, pointer.worldY);
    if (!hex) return false;
    if (this.readyGene && this.isGelCardClick(hex)) return true;
    const clickPoint = { x: pointer.worldX, y: pointer.worldY };
    const hoveredUnit = this.nearestUnit(clickPoint, unit => unit.mode !== 'engulfed' && Phaser.Math.Distance.Between(unit.x, unit.y, clickPoint.x, clickPoint.y) <= 18);
    if (hoveredUnit) return true;
    return this.isSelectableBuilding(hex);
  }

  private isSelectableBuilding(hex: Hex) {
    return this.buildings.some(building => distance(building, hex) === 0) || distance(hex, CENTER) === 0;
  }

  private setCanvasCursor(cursor: string) {
    const canvas = this.game.canvas;
    if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
  }

  private handlePointer(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'won' || this.phase === 'lost') return;
    if (this.selectedBuild && (pointer.rightButtonDown() || pointer.middleButtonDown())) {
      this.selectBuild(null);
      return;
    }
    const hex = this.hexAt(pointer.worldX, pointer.worldY);
    if (!hex) return;
    const tile = this.tiles.get(tileKey(hex));
    if (!tile) return;
    if (this.readyGene && this.isGelCardClick(hex)) {
      malignantBus.emit('gene_part_collected', { gene: this.readyGene });
      this.message = `${this.geneLabel(this.readyGene)} gene part added to the plasmid tray.`;
      return;
    }
    if (this.selectedBuild) {
      if (!tile.revealed && !tile.visible) {
        this.message = 'Buildings must be placed on revealed tissue.';
        return;
      }
      this.placeSelectedBuild(this.selectedBuild, tile);
      return;
    }
    if (pointer.leftButtonDown() && !pointer.middleButtonDown() && !pointer.rightButtonDown()) {
      this.dragSelectStart = { x: pointer.worldX, y: pointer.worldY };
      this.dragSelectEnd = { x: pointer.worldX, y: pointer.worldY };
      this.selectAt(hex, pointer);
      return;
    }
    if (pointer.rightButtonDown() && !pointer.middleButtonDown()) {
      this.commandSelectedUnits(hex, tile);
      return;
    }
  }

  private selectAt(hex: Hex, pointer: Phaser.Input.Pointer) {
    this.selectedBuild = null;
    const clickPoint = { x: pointer.worldX, y: pointer.worldY };
    const clickedUnit = this.nearestUnit(clickPoint, unit => unit.mode !== 'engulfed' && Phaser.Math.Distance.Between(unit.x, unit.y, clickPoint.x, clickPoint.y) <= 18);
    const additive = pointer.event instanceof MouseEvent && pointer.event.shiftKey;
    if (clickedUnit) {
      this.selectedBuilding = null;
      if (!additive) this.selectedUnitIds.clear();
      if (additive && this.selectedUnitIds.has(clickedUnit.id)) this.selectedUnitIds.delete(clickedUnit.id);
      else this.selectedUnitIds.add(clickedUnit.id);
      this.message = `${this.selectedUnitIds.size} unit${this.selectedUnitIds.size === 1 ? '' : 's'} selected. Right-click to move, attack, or harvest.`;
      return;
    }
    const clickedBuilding = this.buildings.find(building => distance(building, hex) === 0) ?? (distance(hex, CENTER) === 0 ? { kind: 'bioreactor' as BuildingKind, q: CENTER.q, r: CENTER.r, hp: 999 } : null);
    if (clickedBuilding) {
      this.selectedUnitIds.clear();
      this.selectedBuilding = clickedBuilding.kind;
      this.message = `${this.label(clickedBuilding.kind)} selected.`;
      return;
    }
    this.selectedUnitIds.clear();
    this.selectedBuilding = null;
    this.message = 'Selection cleared. Left-click units or buildings; right-click commands selected units.';
  }

  private selectUnitsInBox(start: WorldPoint, end: WorldPoint, pointer: Phaser.Input.Pointer) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const additive = pointer.event instanceof MouseEvent && pointer.event.shiftKey;
    const inside = this.units.filter(unit => unit.mode !== 'engulfed' && unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY);
    if (!additive) this.selectedUnitIds.clear();
    for (const unit of inside) this.selectedUnitIds.add(unit.id);
    this.selectedBuilding = null;
    this.message = inside.length > 0
      ? `${this.selectedUnitIds.size} units selected. Right-click to move, attack, or harvest.`
      : 'Selection box did not catch any units.';
  }

  private commandSelectedUnits(hex: Hex, tile: Tile) {
    const selected = this.units
      .filter(unit => this.selectedUnitIds.has(unit.id) && (unit.mode === 'idle' || unit.mode === 'combat') && !unit.carrying)
      .sort((a, b) => distance(a, hex) - distance(b, hex));
    if (selected.length === 0) {
      this.message = 'Select free units first, then right-click a destination or target.';
      return;
    }
    const reserved = new Set<string>();
    const visibleMac = this.macrophages
      .filter(mac => this.isImmuneVisible(mac) && distance(mac, hex) <= 1)
      .sort((a, b) => distance(a, hex) - distance(b, hex))[0] ?? null;
    const harvest = (tile.revealed || tile.visible) && tile.kind === 'debris' && tile.amount > 0;
    for (const unit of selected) {
      const destination = this.findNearestOpenHex(visibleMac ?? hex, reserved, unit.id);
      if (!destination) continue;
      reserved.add(tileKey(destination));
      unit.mode = harvest ? 'idle' : 'combat';
      this.setUnitTarget(unit, destination);
    }
    this.message = harvest
      ? `${selected.length} selected unit${selected.length === 1 ? '' : 's'} harvesting visible debris.`
      : visibleMac
        ? `${selected.length} selected unit${selected.length === 1 ? '' : 's'} attacking visible macrophage.`
        : `${selected.length} selected unit${selected.length === 1 ? '' : 's'} moving to ${hex.q},${hex.r}.`;
  }

  private placeSelectedBuild(command: BuildCommand, tile: Tile) {
    const result = this.canBuild(command, tile);
    if (!result.ok) {
      this.message = result.reason;
      return;
    }
    if (command === 'mmp-flare') {
      this.tryFlare(tile);
      return;
    }
    if (command === 'colonize') {
      this.tryColonizeTile(tile, tile.kind === 'capillary' ? 'Capillary node colonized. Select Sprout from the build menu next.' : 'Tissue colonized. Fog receded around the new territory.');
      return;
    }
    if (command === 'sprout') {
      this.tryBuildSprout(tile);
      return;
    }
    this.nutrients -= BUILDING_COSTS[command];
    this.buildings.push({ kind: command, q: tile.q, r: tile.r, hp: command === 'energy' ? 8 : 6 });
    this.selectedBuild = null;
    this.drawMap();
    this.message = `${this.label(command)} placed.`;
  }

  private autoSetupLab() {
    if (this.phase !== 'placement') return;
    this.debugPlaceStartingBuildings();
    this.selectedBuild = null;
    this.message = 'Default lab deployed. Expand tissue to capillary nodes and build sprouts to increase nutrients.';
  }

  private tryBuildSprout(tile: Tile) {
    if (this.nutrients < BUILDING_COSTS.sprout) {
      this.message = 'Not enough nutrients for an angiogenic sprout.';
      return;
    }
    this.nutrients -= BUILDING_COSTS.sprout;
    tile.sprout = true;
    this.buildings.push({ kind: 'sprout', q: tile.q, r: tile.r, hp: 5 });
    this.selectedBuild = null;
    this.message = 'Angiogenic sprout active. Nutrient income increased.';
    this.drawMap();
  }

  private tryFlare(tile: Tile) {
    if (this.nutrients < 15) {
      this.message = 'Not enough nutrients for a Matrix Digestion Flare.';
      return;
    }
    const builders = this.units.filter(unit => (unit.mode === 'idle' || unit.mode === 'combat') && !unit.carrying).slice(0, 2);
    if (builders.length < 2) {
      this.message = 'Two free units are needed to digest fibrous tissue.';
      return;
    }
    this.nutrients -= 15;
    builders.forEach(unit => {
      unit.mode = 'building';
      this.setUnitTarget(unit, tile);
      unit.busyUntil = this.time.now + 8_000;
    });
    this.selectedBuild = null;
    malignantBus.emit('flare_placed', { q: tile.q, r: tile.r });
    this.message = 'Matrix Digestion Flare placed. Two units are off defense for eight seconds.';
  }

  private tryColonizeTile(tile: Tile, doneMessage: string) {
    const builders = this.units.filter(unit => (unit.mode === 'idle' || unit.mode === 'combat') && !unit.carrying).slice(0, 2);
    if (builders.length < 2) {
      this.message = 'Two free units are needed to colonize new tissue.';
      return;
    }
    builders.forEach(unit => {
      unit.mode = 'building';
      this.setUnitTarget(unit, tile);
      unit.busyUntil = this.time.now + 4_000;
    });
    this.selectedBuild = null;
    this.message = doneMessage;
  }

  private spawnUnits(count: number) {
    const cap = this.unitCap();
    for (let i = 0; i < count && this.units.length < cap; i++) {
      const bioreactor = this.findBuilding('bioreactor');
      const spawnHint = bioreactor ? (this.neighbors(bioreactor)[i % 6] ?? bioreactor) : (this.neighbors(CENTER)[i % 6] ?? CENTER);
      const occupied = new Set(this.units.map(unit => tileKey(unit)));
      const hex = this.findNearestOpenHex(spawnHint, occupied);
      if (!hex) continue;
      const pos = this.world(hex);
      const body = this.add.graphics().setDepth(5);
      this.units.push({ id: this.nextId++, q: hex.q, r: hex.r, x: pos.x, y: pos.y, mode: 'idle', target: null, path: [], carrying: null, genes: new Set(), busyUntil: 0, lastShotAt: -UNIT_FIRE_COOLDOWN, spawnedAt: this.time.now, body });
    }
  }

  private updateEconomy(dt: number) {
    const rate = this.nutrientRate();
    this.nutrientCarry += rate * dt;
    if (this.nutrientCarry >= 1) {
      const whole = Math.floor(this.nutrientCarry);
      this.nutrients += whole;
      this.nutrientCarry -= whole;
    }
  }

  private updateUnitProduction(now: number) {
    const bioreactors = this.buildings.filter(building => building.kind === 'bioreactor').length;
    for (let i = this.unitProductions.length - 1; i >= 0; i--) {
      if (now < this.unitProductions[i]) continue;
      this.spawnUnits(1);
      this.unitProductions.splice(i, 1);
      this.unitQueue = Math.max(0, this.unitQueue - 1);
    }
    const maxConcurrent = Math.min(bioreactors, this.unitQueue);
    while (this.unitProductions.length < maxConcurrent) {
      this.unitProductions.push(now + UNIT_PRODUCTION_TIME);
    }
  }

  private requestUnit() {
    const bioreactor = this.findBuilding('bioreactor');
    if (!bioreactor) {
      this.message = 'Build a Bioreactor before spawning units.';
      return;
    }
    if (this.integratingGene) {
      this.message = 'Incubator reboot in progress. Unit spawning is paused.';
      return;
    }
    if (this.units.length + this.unitQueue >= this.unitCap()) {
      this.message = 'Unit cap reached. Build an Energy Generator to support more units.';
      return;
    }
    if (this.nutrients < UNIT_COST) {
      this.message = `Need ${UNIT_COST} nutrients to queue a unit.`;
      return;
    }
    this.nutrients -= UNIT_COST;
    this.unitQueue++;
    this.updateUnitProduction(this.time.now);
    this.message = `Unit queued. Each Bioreactor grows one unit every ${UNIT_PRODUCTION_TIME / 1000} seconds.`;
  }

  private updateMarkers(now: number) {
    for (let i = this.markers.length - 1; i >= 0; i--) {
      const marker = this.markers[i];
      if (marker.expiresAt > now) continue;
      marker.body.destroy();
      this.markers.splice(i, 1);
    }
  }

  private updateProjectiles(now: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (this.projectiles[i].expiresAt > now) continue;
      this.projectiles.splice(i, 1);
    }
  }

  private updateUnits(dt: number, now: number) {
    for (const unit of this.units) {
      if (now - unit.spawnedAt < 250) {
        this.drawUnit(unit);
        continue;
      }
      if (unit.mode === 'engulfed') {
        this.drawUnit(unit);
        continue;
      }
      if (unit.mode === 'building' && now >= unit.busyUntil && unit.target) {
        const tile = this.tiles.get(tileKey(unit.target));
        if (tile) {
          tile.colonized = true;
          this.reveal(tile, 2);
          this.drawMap();
        }
        unit.mode = 'idle';
        unit.target = null;
        unit.path = [];
      }
      if (unit.mode === 'rebooting' && now >= this.incubatorDoneAt) {
        const completedGene = this.integratingGene ?? this.activeGene;
        if (completedGene) unit.genes.add(completedGene);
        unit.mode = 'idle';
      }
      if (!unit.target && (unit.mode === 'idle' || unit.mode === 'combat')) {
        const target = this.defaultTarget(unit);
        if (target) this.setUnitTarget(unit, target);
      }
      this.fireAtVisibleEnemy(unit, now);
      if (unit.target && unit.mode !== 'building' && unit.mode !== 'rebooting') this.moveUnit(unit, unit.target, dt);
      this.handleArrival(unit, now);
      this.drawUnit(unit);
    }
    this.resolveUnitHexCollisions();
  }

  private defaultTarget(unit: Unit): Hex | null {
    if (unit.mode === 'combat') {
      const defend = this.markers.find(marker => marker.kind === 'defend');
      if (defend) return defend;
    }
    return null;
  }

  private moveUnit(unit: Unit, target: Hex, dt: number) {
    const next = unit.path[0] ?? target;
    const dest = this.world(next);
    const angle = Phaser.Math.Angle.Between(unit.x, unit.y, dest.x, dest.y);
    const speed = unit.mode === 'carrying' ? 56 : 78;
    const step = speed * dt;
    if (Phaser.Math.Distance.Between(unit.x, unit.y, dest.x, dest.y) <= step) {
      unit.x = dest.x;
      unit.y = dest.y;
      unit.q = next.q;
      unit.r = next.r;
      if (unit.path.length > 0) unit.path.shift();
      if (unit.path.length === 0 && distance(unit, target) === 0) {
        unit.target = null;
      }
    } else {
      unit.x += Math.cos(angle) * step;
      unit.y += Math.sin(angle) * step;
      const travelHex = this.hexAt(unit.x, unit.y);
      if (travelHex) {
        unit.q = travelHex.q;
        unit.r = travelHex.r;
      }
    }
  }

  private setUnitTarget(unit: Unit, target: Hex) {
    unit.target = { q: target.q, r: target.r };
    unit.path = this.findPath(unit, target);
  }

  private findNearestOpenHex(target: Hex, reserved: Set<string>, ignoreUnitId?: number): Hex | null {
    const occupied = new Map<string, number>();
    for (const unit of this.units) {
      if (unit.id === ignoreUnitId || unit.mode === 'engulfed') continue;
      const key = tileKey(unit);
      occupied.set(key, (occupied.get(key) ?? 0) + 1);
    }
    let best: Hex | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    this.forEachTileInRadius(target, 3, tile => {
      if (!this.isUnitPassable(tile)) return;
      const key = tileKey(tile);
      if (reserved.has(key) || occupied.has(key)) return;
      const d = distance(tile, target);
      if (d >= bestDistance) return;
      bestDistance = d;
      best = { q: tile.q, r: tile.r };
    });
    return best;
  }

  private resolveUnitHexCollisions() {
    const occupied = new Set<string>();
    for (const unit of this.units) {
      if (this.time.now - unit.spawnedAt < 250) continue;
      if (unit.mode === 'engulfed') continue;
      if (unit.target) continue;
      const key = tileKey(unit);
      if (!occupied.has(key)) {
        occupied.add(key);
        continue;
      }
      const replacement = this.findNearestOpenHex(unit, occupied, unit.id);
      if (!replacement) continue;
      occupied.add(tileKey(replacement));
      unit.q = replacement.q;
      unit.r = replacement.r;
      const pos = this.world(replacement);
      unit.x = pos.x;
      unit.y = pos.y;
      if (unit.target && distance(unit, unit.target) === 0) {
        unit.target = null;
        unit.path = [];
      } else if (unit.target) {
        unit.path = this.findPath(unit, unit.target);
      }
    }
  }

  private findPath(start: Hex, goal: Hex) {
    if (distance(start, goal) === 0) return [];
    const startKey = tileKey(start);
    const goalKey = tileKey(goal);
    const frontier: Hex[] = [{ q: start.q, r: start.r }];
    let cursorIndex = 0;
    const cameFrom = new Map<string, string | null>([[startKey, null]]);
    const byKey = new Map<string, Hex>([[startKey, { q: start.q, r: start.r }]]);

    while (cursorIndex < frontier.length) {
      const current = frontier[cursorIndex++];
      if (!current) break;
      if (tileKey(current) === goalKey) break;
      for (const neighbor of this.neighbors(current)) {
        const neighborKey = tileKey(neighbor);
        if (cameFrom.has(neighborKey)) continue;
        const tile = this.tiles.get(neighborKey);
        if (!tile) continue;
        if (!this.isUnitPassable(tile)) continue;
        frontier.push(neighbor);
        byKey.set(neighborKey, neighbor);
        cameFrom.set(neighborKey, tileKey(current));
      }
    }

    if (!cameFrom.has(goalKey)) return [];
    const path: Hex[] = [];
    let cursor: string | null = goalKey;
    while (cursor && cursor !== startKey) {
      const step = byKey.get(cursor);
      if (step) path.unshift(step);
      cursor = cameFrom.get(cursor) ?? null;
    }
    return path;
  }

  private handleArrival(unit: Unit, now: number) {
    if (!unit.target || distance(unit, unit.target) > 0) return;
    if (unit.mode === 'carrying') {
      const pcr = this.findBuilding('pcr');
      if (pcr && distance(unit, pcr) === 0 && unit.carrying) {
        this.pcrQueue.push({ gene: unit.carrying, source: 'debris field' });
        unit.carrying = null;
        unit.mode = 'idle';
        unit.target = null;
        unit.path = [];
        this.startPcr(now);
        this.clearCompletedHarvestMarkers();
      }
      return;
    }
    const debris = this.tiles.get(tileKey(unit));
    if (debris?.kind === 'debris' && debris.amount > 0) {
      this.collectDebris(unit);
      return;
    }
    const marker = this.markers.find(candidate => distance(candidate, unit) === 0);
    if (marker?.kind === 'defend') {
      unit.target = null;
      unit.path = [];
      return;
    }
    unit.target = null;
    unit.path = [];
  }

  private fireAtVisibleEnemy(unit: Unit, now: number) {
    if (unit.mode !== 'idle' && unit.mode !== 'combat') return;
    if (now - unit.lastShotAt < UNIT_FIRE_COOLDOWN) return;
    const target = this.rangedTarget(unit);
    if (!target) return;
    unit.lastShotAt = now;
    target.hp -= unit.genes.has('sod') || unit.genes.has('pdl1') ? 0.45 : 0.28;
    this.projectiles.push({
      id: this.nextId++,
      from: { x: unit.x, y: unit.y },
      to: { x: target.x, y: target.y },
      firedAt: now,
      expiresAt: now + 820,
    });
  }

  private rangedTarget(unit: Unit) {
    if (unit.mode !== 'idle' && unit.mode !== 'combat') return null;
    let best: Macrophage | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const mac of this.macrophages) {
      if (mac.mode === 'engulfing') continue;
      const d = distance(unit, mac);
      if (d > UNIT_RANGE || d >= bestDistance) continue;
      if (!this.canUnitSeeImmune(unit, mac)) continue;
      best = mac;
      bestDistance = d;
    }
    return best;
  }

  private canUnitSeeImmune(unit: Unit, mac: Macrophage) {
    if (!this.isImmuneVisible(mac)) return false;
    return distance(unit, mac) <= UNIT_RANGE;
  }

  private clearCompletedHarvestMarkers() {
    for (const marker of this.markers.filter(candidate => candidate.kind === 'harvest')) {
      const stillAssigned = marker.assignedUnitIds.some(id => this.units.some(unit => unit.id === id && unit.mode === 'carrying'));
      if (!stillAssigned) marker.expiresAt = this.time.now;
    }
  }

  private collectDebris(unit: Unit) {
    const node = this.nearestVisibleDebris(unit);
    const pcr = this.findBuilding('pcr');
    if (!node || !pcr) {
      this.message = 'No visible debris field and DNA amplifier are both available.';
      unit.target = null;
      unit.path = [];
      return;
    }
    node.amount--;
    const gene = node.gene ?? 'sod';
    unit.carrying = gene;
    unit.mode = 'carrying';
    this.setUnitTarget(unit, pcr);
    malignantBus.emit('debris_collected', { source: `${node.q},${node.r}` });
    this.message = 'Debris collected. Carrier cannot fight until it reaches the DNA amplifier.';
    this.drawMap();
  }

  private markActiveSight(center: Hex, radius: number) {
    let changed = false;
    this.forEachTileInRadius(center, radius, tile => {
      if (!tile.revealed) {
        tile.revealed = true;
        changed = true;
      }
      if (!tile.visible) {
        tile.visible = true;
        changed = true;
      }
    });
    return changed;
  }

  private markTerritorySight() {
    let changed = false;
    for (const territory of this.tiles.values()) {
      if (!territory.colonized) continue;
      this.forEachTileInRadius(territory, TERRITORY_SIGHT_RANGE, tile => {
        if (!tile.revealed) {
          tile.revealed = true;
          changed = true;
        }
        if (!tile.visible) {
          tile.visible = true;
          changed = true;
        }
      });
    }
    return changed;
  }

  private revealFromUnit(unit: Unit) {
    return this.markActiveSight(unit, UNIT_RANGE);
  }

  private revealFromBuilding(building: Building) {
    return this.markActiveSight(building, BUILDING_SIGHT_RANGE);
  }

  private recomputeVisibility() {
    const before = new Set<string>();
    for (const tile of this.tiles.values()) {
      if (tile.visible) before.add(tileKey(tile));
    }
    for (const tile of this.tiles.values()) {
      tile.visible = false;
    }
    for (const unit of this.units) {
      if (unit.mode === 'engulfed') continue;
      this.revealFromUnit(unit);
    }
    for (const building of this.buildings) {
      this.revealFromBuilding(building);
    }
    this.markTerritorySight();
    let afterCount = 0;
    for (const tile of this.tiles.values()) {
      if (tile.visible) afterCount++;
    }
    if (before.size !== afterCount) return true;
    for (const tile of this.tiles.values()) {
      if (tile.visible && !before.has(tileKey(tile))) return true;
    }
    return false;
  }

  private nearestVisibleDebris(hex: Hex) {
    let best: Tile | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const tile of this.tiles.values()) {
      if ((!tile.revealed && !tile.visible) || tile.kind !== 'debris' || tile.amount <= 0) continue;
      const d = distance(tile, hex);
      if (d >= bestDistance) continue;
      best = tile;
      bestDistance = d;
    }
    return best;
  }

  private canBuild(command: BuildCommand, tile: Tile): { ok: true } | { ok: false; reason: string } {
    if (!tile.revealed && !tile.visible) return { ok: false, reason: 'That tile is still under fog.' };
    if (command === 'mmp-flare') {
      if (this.nutrients < 15) return { ok: false, reason: 'Not enough nutrients for a Matrix Digestion Flare.' };
      if (tile.kind !== 'fibrous' || tile.colonized || !this.adjacentToColony(tile)) return { ok: false, reason: 'Matrix Digestion Flares go on revealed fibrous frontier tiles.' };
      return { ok: true };
    }
    if (command === 'colonize') {
      if (tile.colonized || !this.adjacentToColony(tile) || (tile.kind !== 'open' && tile.kind !== 'capillary')) return { ok: false, reason: 'Expansion goes on revealed open or capillary frontier tiles.' };
      return { ok: true };
    }
    if (command === 'sprout') {
      if (this.nutrients < BUILDING_COSTS.sprout) return { ok: false, reason: 'Not enough nutrients for an angiogenic sprout.' };
      if (tile.kind !== 'capillary' || !tile.colonized || tile.sprout) return { ok: false, reason: 'Sprouts can only be built on colonized capillary nodes.' };
      return { ok: true };
    }
    if (this.nutrients < BUILDING_COSTS[command]) return { ok: false, reason: `Not enough nutrients for a ${this.label(command)}.` };
    if ((command === 'pcr' || command === 'gel' || command === 'incubator') && this.findBuilding(command)) return { ok: false, reason: `${this.label(command)} is already built.` };
    if (tile.kind !== 'open') return { ok: false, reason: 'Buildings need flat revealed tissue.' };
    if (!tile.colonized) return { ok: false, reason: 'Buildings must be placed on colonized territory.' };
    if (this.buildingAt(tile)) return { ok: false, reason: 'A building already occupies that tile.' };
    if (this.tooCloseToBuilding(command, tile)) return { ok: false, reason: `${this.label(command)} needs ${BUILDING_CLEARANCE} clear hexes from other lab buildings.` };
    return { ok: true };
  }

  private isBuildingCommand(command: BuildCommand): command is BuildingKind {
    return command !== 'mmp-flare' && command !== 'colonize';
  }

  private updateInstruments(now: number) {
    this.startPcr(now);
    this.startGel(now);
    this.pcr.progress = progress(this.pcr, now);
    this.gel.progress = progress(this.gel, now);
    if (this.pcr.status === 'running' && this.pcr.progress >= 1) {
      const sample = this.activePcr;
      if (sample) {
        this.gelQueue.push(sample);
        malignantBus.emit('pcr_complete', { gene: sample.gene });
      }
      this.activePcr = null;
      this.pcr = { status: 'idle', progress: 0, startedAt: 0, duration: 15_000 };
      this.startGel(now);
    }
    if (this.gel.status === 'running' && this.gel.progress >= 1) {
      if (this.activeGel) {
        this.readyGene = this.activeGel.gene;
        malignantBus.emit('gel_complete', { gene: this.activeGel.gene });
        this.message = 'Gene part is ready above the Gel station. Add it to the plasmid editor.';
      }
      this.activeGel = null;
      this.gel = { status: 'ready', progress: 1, startedAt: 0, duration: 10_000 };
    }
  }

  private startPcr(now: number) {
    if (this.pcr.status === 'running' || this.activePcr || this.pcrQueue.length === 0) return;
    this.activePcr = this.pcrQueue.shift() ?? null;
    this.pcr = { status: 'running', progress: 0, startedAt: now, duration: 15_000 };
  }

  private startGel(now: number) {
    if (this.gel.status === 'running' || this.activeGel || this.gelQueue.length === 0) return;
    this.activeGel = this.gelQueue.shift() ?? null;
    this.gel = { status: 'running', progress: 0, startedAt: now, duration: 10_000 };
  }

  private deployPlasmid(gene: GeneId) {
    if (!this.availableGenes.includes(gene)) this.availableGenes.push(gene);
    this.readyGene = null;
    this.integratingGene = gene;
    this.incubatorDoneAt = this.time.now + 8_000;
    this.units.forEach(unit => {
      unit.mode = 'rebooting';
      unit.target = null;
      unit.path = [];
    });
    this.chainsCompleted++;
    this.leakageStartedAt = this.time.now;
    this.message = `${this.geneLabel(gene)} plasmid deployed. Units are rebooting in the Incubator.`;
  }

  private updateIncubator(now: number) {
    if (!this.integratingGene || now < this.incubatorDoneAt) return;
    this.activeGene = this.integratingGene;
    this.integratingGene = null;
  }

  private updateEnemyPressure(now: number) {
    if (now < this.nextEnemyPressureAt) return;
    this.nextEnemyPressureAt = now + ENEMY_PRESSURE_GAP;
    const expansion = this.expansionDistance();
    const desired = this.targetMacrophageCount(expansion);
    const deficit = Math.max(0, desired - this.macrophages.length);
    const spawnCount = Math.min(4, deficit);
    for (let i = 0; i < spawnCount; i++) {
      const minDistance = Math.min(45, expansion + 5);
      const maxDistance = Math.min(48, minDistance + 14);
      this.spawnMacrophage(this.randomFarHex(minDistance, maxDistance), false);
    }
  }

  private updateAmbientImmuneDensity(now: number) {
    if (now < this.nextAmbientPressureAt) return;
    this.nextAmbientPressureAt = now + AMBIENT_PRESSURE_GAP;
    const frontier = this.farthestActiveUnit() ?? CENTER;
    const pressureDistance = Math.max(this.expansionDistance(), distance(frontier, CENTER));
    if (pressureDistance < 8) return;
    const desired = this.targetMacrophageCount(pressureDistance);
    const nearby = this.macrophages.filter(mac => distance(mac, frontier) <= 16).length;
    const deficit = Math.max(0, desired - nearby);
    const spawnCount = Math.min(3, deficit);
    for (let i = 0; i < spawnCount; i++) {
      const spawn = this.randomAround(frontier, UNIT_RANGE + 2, 12);
      if (!spawn || this.isImmuneVisible(spawn)) continue;
      this.spawnMacrophage(spawn, Boolean(this.activeGene && this.rng.next() > 0.75));
    }
  }

  private updateLeakage(now: number) {
    if (now - this.leakageStartedAt < LEAKAGE_TIME) return;
    this.adaptationLog.push(Math.floor((now - this.startedAt) / 1000));
    if (this.adaptationLog.length > 256) this.adaptationLog.shift();
    malignantBus.emit('leakage_triggered', { activeGene: this.activeGene });
    this.leakageStartedAt = now;
    this.adaptationsSurvived++;
    this.message = 'Immune pressure adapted. Patrol density increases as your colony spreads.';
  }

  private spawnInitialEnemies() {
    for (let i = 0; i < STARTING_MACROPHAGES; i++) {
      const roll = this.rng.next();
      const min = roll > 0.72 ? 34 : roll > 0.38 ? 22 : 10;
      const max = roll > 0.72 ? 49 : roll > 0.38 ? 42 : 30;
      this.dormantMacrophages.push({ ...this.randomFarHex(min, max), adapted: false });
    }
    this.message = `Immune territory is seeded with ${STARTING_MACROPHAGES} macrophages. Victory requires clearing every last one.`;
  }

  private expansionDistance() {
    let maxDistance = 0;
    for (const tile of this.tiles.values()) {
      if (!tile.colonized) continue;
      maxDistance = Math.max(maxDistance, distance(tile, CENTER));
    }
    return maxDistance;
  }

  private farthestActiveUnit() {
    let farthest: Unit | null = null;
    let farthestDistance = -1;
    for (const unit of this.units) {
      if (unit.mode === 'engulfed') continue;
      const d = distance(unit, CENTER);
      if (d <= farthestDistance) continue;
      farthest = unit;
      farthestDistance = d;
    }
    return farthest;
  }

  private randomAround(center: Hex, minDistance: number, maxDistance: number) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const q = Phaser.Math.Clamp(center.q + this.rng.between(-maxDistance, maxDistance), 0, GRID_W - 1);
      const r = Phaser.Math.Clamp(center.r + this.rng.between(-maxDistance, maxDistance), 0, GRID_H - 1);
      const hex = { q, r };
      const tile = this.tiles.get(tileKey(hex));
      if (!tile || distance(hex, center) < minDistance || tile.kind === 'fibrous') continue;
      return hex;
    }
    return null;
  }

  private targetMacrophageCount(expansionDistanceFromCenter: number) {
    const tier = Math.max(0, Math.floor((expansionDistanceFromCenter - 8) / 5));
    const scaled = 6 + Math.pow(2.08, tier + 2);
    return Phaser.Math.Clamp(Math.floor(scaled), 8, 650);
  }

  private spawnMacrophage(start: Hex, adapted: boolean) {
    const pos = this.world(start);
    this.macrophages.push({ id: this.nextId++, q: start.q, r: start.r, x: pos.x, y: pos.y, hp: adapted ? 3 : 2, adapted, mode: 'patrolling', lastKnown: null, targetUnitId: null, modeUntil: 0, body: null });
  }

  private activateDormantMacrophages() {
    const remaining: DormantMacrophage[] = [];
    for (const mac of this.dormantMacrophages) {
      if (this.isImmuneVisible(mac) || this.immuneActivityNear(mac)) {
        this.spawnMacrophage(mac, mac.adapted);
      } else {
        remaining.push(mac);
      }
    }
    this.dormantMacrophages = remaining;
  }

  private spawnWave(count: number, label: string, adapted: boolean) {
    for (let i = 0; i < count; i++) {
      const start = this.spawnZones.length > 0 ? this.spawnZones[i % this.spawnZones.length] : this.edgeHex('right');
      this.spawnMacrophage(start, adapted);
    }
    this.message = `${label} entering from immune territory.`;
    malignantBus.emit('wave_spawned', { wave: label });
  }

  private updateMacrophages(dt: number, now: number) {
    const total = this.macrophages.length;
    if (total === 0) return;
    const updatesPerFrame = Math.max(1, Math.ceil(total / MACROPHAGE_SIMULATION_DIVISOR));
    const centerPos = this.world(CENTER);
    for (let step = 0; step < updatesPerFrame; step++) {
      const index = (this.macrophageCursor + step) % total;
      const mac = this.macrophages[index];
      if (!mac) continue;
      if (mac.mode === 'patrolling' && !this.isImmuneVisible(mac) && !this.immuneActivityNear(mac)) {
        this.drawMac(mac);
        continue;
      }
      if (mac.mode === 'bounced') {
        mac.x += 30 * dt;
        if (now >= mac.modeUntil) mac.mode = mac.lastKnown ? 'aggro' : 'patrolling';
        this.drawMac(mac);
        continue;
      }
      if (mac.mode === 'engulfing') {
        this.tryInterruptEngulfment(mac);
        if (now >= mac.modeUntil) this.finishEngulf(mac);
        this.drawMac(mac);
        continue;
      }
      this.updateMacrophageAggro(mac, now);
      const defender = this.nearestUnit(mac, unit => unit.mode !== 'carrying' && unit.mode !== 'rebooting' && distance(unit, mac) <= AGGRO_SENSE_RANGE);
      if (defender) {
        mac.mode = 'aggro';
        mac.lastKnown = { q: defender.q, r: defender.r };
        mac.modeUntil = now + AGGRO_MEMORY;
        this.alertNearbyMacrophages(mac, defender);
      }
      const building = mac.mode === 'aggro' ? this.nearestBuildingFromPoint(mac) : null;
      if (!defender && !mac.lastKnown && !building) {
        this.drawMac(mac);
        continue;
      }
      const pos = defender
        ? { x: defender.x, y: defender.y }
        : mac.lastKnown
          ? this.world(mac.lastKnown)
          : this.world(building as Building);
      const angle = Phaser.Math.Angle.Between(mac.x, mac.y, pos.x, pos.y);
      const speed = mac.mode === 'aggro' ? 18 : 9;
      mac.x += Math.cos(angle) * speed * dt;
      mac.y += Math.sin(angle) * speed * dt;
      const macHex = this.hexAt(mac.x, mac.y);
      if (macHex) {
        mac.q = macHex.q;
        mac.r = macHex.r;
      }
      if (defender && Phaser.Math.Distance.Between(mac.x, mac.y, defender.x, defender.y) < 20) this.contact(mac, defender, now);
      if (!defender && building && Phaser.Math.Distance.Between(mac.x, mac.y, this.world(building).x, this.world(building).y) < 18) this.damageBuilding(building, mac);
      if (Phaser.Math.Distance.Between(mac.x, mac.y, centerPos.x, centerPos.y) < 18) this.lose('Macrophages reached the Founder Cell - Oxidative Shield plasmid was not deployed in time.');
      this.drawMac(mac);
    }
    this.macrophageCursor = (this.macrophageCursor + updatesPerFrame) % Math.max(1, this.macrophages.length);
    for (let i = this.macrophages.length - 1; i >= 0; i--) {
      const mac = this.macrophages[i];
      if (mac.hp > 0) continue;
      mac.body?.destroy();
      this.macrophages.splice(i, 1);
    }
  }

  private immuneActivityNear(mac: Hex) {
    return this.units.some(unit => unit.mode !== 'engulfed' && unit.mode !== 'rebooting' && distance(unit, mac) <= AGGRO_SENSE_RANGE + 2)
      || this.buildings.some(building => distance(building, mac) <= AGGRO_SENSE_RANGE + 2)
      || distance(mac, CENTER) <= AGGRO_SENSE_RANGE + 2;
  }

  private updateMacrophageAggro(mac: Macrophage, now: number) {
    if (mac.mode !== 'aggro' || now < mac.modeUntil) return;
    mac.mode = 'patrolling';
    mac.lastKnown = null;
  }

  private alertNearbyMacrophages(source: Macrophage, target: Hex) {
    for (const mac of this.macrophages) {
      if (mac.id === source.id || mac.mode === 'engulfing' || distance(mac, source) > AGGRO_PULL_RANGE) continue;
      mac.mode = 'aggro';
      mac.lastKnown = { q: target.q, r: target.r };
      mac.modeUntil = this.time.now + AGGRO_MEMORY;
    }
  }

  private damageBuilding(building: Building, mac: Macrophage) {
    building.hp -= 0.04;
    mac.x += this.rng.between(-1, 1);
    if (building.hp > 0) return;
    this.buildings = this.buildings.filter(candidate => candidate !== building);
    this.message = `${this.label(building.kind)} destroyed by macrophages.`;
    this.drawMap();
    if (building.kind === 'pcr' || building.kind === 'gel') {
      this.lose('Genome Leakage adaptation overwhelmed the colony - new gene part was needed.');
    }
  }

  private contact(mac: Macrophage, unit: Unit, now: number) {
    if ((unit.genes.has('sod') && !mac.adapted) || (unit.genes.has('pdl1') && mac.adapted)) {
      mac.hp--;
      mac.x += 22;
      mac.mode = 'bounced';
      mac.modeUntil = now + 550;
      this.message = mac.adapted ? 'Checkpoint Mask ring confused the adapted macrophage.' : 'Oxidative Shield ring repelled a macrophage.';
      return;
    }
    unit.mode = 'engulfed';
    mac.mode = 'engulfing';
    mac.targetUnitId = unit.id;
    mac.modeUntil = now + 4_000;
    this.message = 'Engulfment started. Right-click nearby selected units onto the macrophage to interrupt it.';
  }

  private tryInterruptEngulfment(mac: Macrophage) {
    const victim = this.units.find(unit => unit.id === mac.targetUnitId);
    if (!victim) return;
    const rescuers = this.units.filter(unit => (
      unit.id !== victim.id
      && unit.mode !== 'carrying'
      && unit.mode !== 'building'
      && unit.mode !== 'rebooting'
      && unit.mode !== 'engulfed'
      && distance(unit, mac) <= 3
      && (unit.mode === 'combat' || this.selectedUnitIds.has(unit.id))
    ));
    if (rescuers.length === 0) return;
    victim.mode = 'idle';
    victim.target = null;
    victim.path = [];
    mac.hp -= rescuers.some(unit => unit.genes.has('sod') || unit.genes.has('pdl1')) ? 2 : 1;
    mac.mode = mac.hp <= 0 ? 'bounced' : 'aggro';
    mac.targetUnitId = null;
    mac.x += 18;
    this.message = 'Selected defenders interrupted macrophage engulfment.';
  }

  private finishEngulf(mac: Macrophage) {
    const unit = this.units.find(candidate => candidate.id === mac.targetUnitId);
    if (unit) {
      unit.body.destroy();
      this.units = this.units.filter(candidate => candidate.id !== unit.id);
      this.selectedUnitIds.delete(unit.id);
    }
    mac.mode = 'aggro';
    mac.targetUnitId = null;
  }

  private drawUnit(unit: Unit) {
    unit.body.clear();
    if (!this.isWorldVisible(unit.x, unit.y, 28)) return;
    const rebootPulse = unit.mode === 'rebooting' ? 0.34 + Math.sin(this.time.now / 120) * 0.15 : 1;
    unit.body.fillStyle(unit.mode === 'rebooting' ? 0x8d6d48 : 0xd2693a, unit.mode === 'engulfed' ? 0.35 : rebootPulse);
    unit.body.lineStyle(1, 0x140f0c, 1);
    unit.body.fillCircle(unit.x, unit.y, 6);
    unit.body.strokeCircle(unit.x, unit.y, 6);
    if (unit.carrying) {
      unit.body.fillStyle(0xffffff, 0.95);
      unit.body.fillCircle(unit.x + 6, unit.y - 8, 3);
    }
    if (this.selectedUnitIds.has(unit.id)) {
      unit.body.lineStyle(2, 0x9ec9ff, 0.95);
      unit.body.strokeCircle(unit.x, unit.y, 13);
    }
    if (unit.mode === 'building') {
      unit.body.lineStyle(2, 0xf29f3f, 0.8);
      unit.body.strokeCircle(unit.x, unit.y, 10);
      unit.body.lineStyle(1, 0xf8e7d1, 0.95);
      unit.body.strokeCircle(unit.x, unit.y - 11, 3);
      unit.body.lineBetween(unit.x, unit.y - 15, unit.x, unit.y - 7);
      unit.body.lineBetween(unit.x - 4, unit.y - 11, unit.x + 4, unit.y - 11);
    }
    if (unit.genes.has('sod')) {
      unit.body.lineStyle(2, 0x79b568, 0.95);
      unit.body.strokeCircle(unit.x, unit.y, 10);
    }
    if (unit.genes.has('pdl1')) {
      unit.body.lineStyle(2, 0x3a78b8, 0.95);
      unit.body.strokeCircle(unit.x, unit.y, 12);
    }
  }

  private drawMac(mac: Macrophage) {
    if (!this.isImmuneVisible(mac)) {
      if (mac.body) {
        mac.body.clear();
        mac.body.destroy();
        mac.body = null;
      }
      return;
    }
    if (!this.isWorldVisible(mac.x, mac.y, 36)) {
      if (mac.body) {
        mac.body.clear();
      }
      return;
    }
    mac.body ??= this.add.graphics().setDepth(5);
    mac.body.clear();
    mac.body.fillStyle(0x7d4aa8, 0.95);
    mac.body.fillCircle(mac.x, mac.y, 13);
    mac.body.fillCircle(mac.x + 10, mac.y + 3, 6);
    mac.body.fillCircle(mac.x - 7, mac.y + 8, 5);
    mac.body.fillCircle(mac.x + 2, mac.y - 10, 4);
    if (mac.adapted) {
      mac.body.lineStyle(3, 0xff4545, 0.95);
      mac.body.strokeCircle(mac.x, mac.y, 17);
    }
    if (mac.mode === 'engulfing') {
      mac.body.lineStyle(2, 0xd9b8ff, 0.8);
      mac.body.strokeCircle(mac.x, mac.y, 24 + Math.sin(this.time.now / 100) * 3);
    }
  }

  private updateWin(_now: number) {
    if (this.totalEnemyCount() === 0 && this.phase !== 'won') {
      this.phase = 'won';
      this.message = 'Immune territory cleared. Every macrophage on the map is gone.';
    }
  }

  private lose(cause: string) {
    if (this.phase === 'won' || this.phase === 'lost') return;
    this.phase = 'lost';
    this.cause = cause;
    this.message = cause;
    malignantBus.emit('founder_destroyed', { cause });
  }

  private totalEnemyCount() {
    return this.macrophages.length + this.dormantMacrophages.length;
  }

  private colonize(center: Hex, radius: number) {
    for (const tile of this.tiles.values()) {
      if (distance(tile, center) <= radius) tile.colonized = true;
    }
  }

  private reveal(center: Hex, radius: number) {
    for (const tile of this.tiles.values()) {
      if (distance(tile, center) <= radius) tile.revealed = true;
    }
  }

  private adjacentToColony(tile: Tile) {
    return this.neighbors(tile).some(hex => this.tiles.get(tileKey(hex))?.colonized);
  }

  private neighbors(hex: Hex) {
    return DIRECTIONS.map(direction => ({ q: hex.q + direction.q, r: hex.r + direction.r }))
      .filter(candidate => candidate.q >= 0 && candidate.q < GRID_W && candidate.r >= 0 && candidate.r < GRID_H);
  }

  private buildingAt(hex: Hex) {
    return this.buildings.some(building => distance(building, hex) === 0) || distance(hex, CENTER) === 0;
  }

  private tooCloseToBuilding(kind: BuildingKind, hex: Hex) {
    if (kind === 'energy' || kind === 'sprout') return false;
    return this.buildings.some(building => building.kind !== 'energy' && distance(building, hex) <= BUILDING_CLEARANCE) || distance(hex, CENTER) <= BUILDING_CLEARANCE;
  }

  private findBuilding(kind: BuildingKind) {
    return this.buildings.find(building => building.kind === kind) ?? null;
  }

  private nearestBuildingFromPoint(point: WorldPoint) {
    let best: Building | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const building of this.buildings) {
      const pos = this.world(building);
      const d = Phaser.Math.Distance.Between(pos.x, pos.y, point.x, point.y);
      if (d >= bestDistance) continue;
      best = building;
      bestDistance = d;
    }
    return best;
  }

  private nearestUnit(point: WorldPoint, predicate: (unit: Unit) => boolean) {
    let best: Unit | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const unit of this.units) {
      if (!predicate(unit)) continue;
      const d = Phaser.Math.Distance.Between(unit.x, unit.y, point.x, point.y);
      if (d >= bestDistance) continue;
      best = unit;
      bestDistance = d;
    }
    return best;
  }

  private forEachTileInRadius(center: Hex, radius: number, callback: (tile: Tile) => void) {
    const minR = Math.max(0, center.r - radius);
    const maxR = Math.min(GRID_H - 1, center.r + radius);
    for (let r = minR; r <= maxR; r++) {
      const minQ = Math.max(0, center.q - radius);
      const maxQ = Math.min(GRID_W - 1, center.q + radius);
      for (let q = minQ; q <= maxQ; q++) {
        const tile = this.tiles.get(tileKey({ q, r }));
        if (!tile) continue;
        if (distance(tile, center) > radius) continue;
        callback(tile);
      }
    }
  }

  private nutrientRate() {
    return this.buildings.filter(building => building.kind === 'sprout').length * 10;
  }

  private unitCap() {
    return Math.min(25, 5 + this.buildings.filter(building => building.kind === 'energy').length * 5);
  }

  private isUnitPassable(tile: Tile) {
    return tile.kind !== 'fibrous' || tile.colonized;
  }

  private isImmuneVisible(hex: Hex) {
    return this.tiles.get(tileKey(hex))?.visible ?? false;
  }

  private label(kind: BuildingKind) {
    return kind === 'pcr' ? 'DNA Amplifier' : kind === 'gel' ? 'Band Gel' : kind === 'incubator' ? 'Expression Incubator' : kind === 'energy' ? 'Energy Generator' : kind === 'sprout' ? 'Angiogenic Sprout' : kind[0].toUpperCase() + kind.slice(1);
  }

  private buildLabel(command: BuildCommand) {
    if (command === 'mmp-flare') return 'Matrix Digestion Flare';
    if (command === 'colonize') return 'Colony Expansion';
    return this.label(command);
  }

  private geneLabel(gene: GeneId) {
    return gene === 'sod' ? 'Oxidative Shield' : 'Checkpoint Mask';
  }

  private installDebugApi() {
    window.malignantDebug = {
      snapshot: () => this.debugSnapshot(),
      hexToScreen: (q, r) => {
        const world = this.world({ q, r });
        const camera = this.cameras.main;
        const rect = this.game.canvas.getBoundingClientRect();
        return {
          x: rect.left + (world.x - camera.worldView.x) * camera.zoom,
          y: rect.top + (world.y - camera.worldView.y) * camera.zoom,
        };
      },
      placeStartingBuildings: () => this.debugPlaceStartingBuildings(),
      forcePhase: phase => {
        this.phase = phase;
        if (phase === 'playing') this.startedAt = this.time.now - 31_000;
      },
      forceSpawnWave: adapted => this.spawnWave(adapted ? 4 : 3, adapted ? 'Genome Leakage adaptation' : 'Debug macrophage wave', Boolean(adapted)),
      forceLeakage: () => {
        this.leakageStartedAt = this.time.now - LEAKAGE_TIME;
      },
      forceWin: () => {
        this.phase = 'won';
        this.message = 'Colony survived eight minutes.';
      },
      forceLoss: () => this.lose('Macrophages reached the Founder Cell - Oxidative Shield plasmid was not deployed in time.'),
      forceCompleteLab: gene => this.debugCompleteLab(gene ?? 'sod'),
      forceDeployGene: gene => this.deployPlasmid(gene),
      forceMacrophageContact: adapted => this.debugMacrophageContact(Boolean(adapted)),
      forceVisibleMacrophage: (q, r, adapted) => this.debugVisibleMacrophage({ q, r }, Boolean(adapted)),
      forceLeadUnitAt: (q, r) => this.debugMoveLeadUnit({ q, r }),
      forceClearThreats: () => this.debugClearThreats(),
      forceRevealNearestCapillary: () => this.debugRevealNearest('capillary'),
      forceRevealNearestFibrous: () => this.debugRevealNearest('fibrous'),
    };
  }

  private debugMoveLeadUnit(hex: Hex) {
    const unit = this.units[0];
    const tile = this.tiles.get(tileKey(hex));
    if (!unit || !tile) return;
    const pos = this.world(hex);
    unit.q = hex.q;
    unit.r = hex.r;
    unit.x = pos.x;
    unit.y = pos.y;
    unit.target = null;
    unit.mode = 'idle';
    this.recomputeVisibility();
    this.drawMap();
  }

  private debugPlaceStartingBuildings() {
    const placements: Record<BuildingKind, Hex> = {
      bioreactor: { q: 49, r: 50 },
      pcr: { q: 52, r: 49 },
      gel: { q: 51, r: 50 },
      incubator: { q: 50, r: 51 },
      energy: { q: 48, r: 52 },
      sprout: CENTER,
    };
    for (const kind of PLACEMENT_ORDER) {
      const hex = placements[kind];
      if ((kind === 'energy' || !this.findBuilding(kind)) && !this.buildingAt(hex)) this.buildings.push({ kind, ...hex, hp: 6 });
    }
    this.phase = 'playing';
    this.drawMap();
  }

  private debugCompleteLab(gene: GeneId) {
    this.pcrQueue = [];
    this.gelQueue = [];
    this.activePcr = null;
    this.activeGel = null;
    this.pcr = { status: 'ready', progress: 1, startedAt: 0, duration: 15_000 };
    this.gel = { status: 'ready', progress: 1, startedAt: 0, duration: 10_000 };
    this.readyGene = gene;
    malignantBus.emit('pcr_complete', { gene });
    malignantBus.emit('gel_complete', { gene });
  }

  private debugRevealNearest(kind: TileKind) {
    const tile = Array.from(this.tiles.values())
      .filter(candidate => candidate.kind === kind)
      .sort((a, b) => distance(a, CENTER) - distance(b, CENTER))[0];
    if (!tile) return;
    tile.revealed = true;
    this.reveal(tile, 2);
    const neighbor = this.neighbors(tile)[0];
    const neighborTile = neighbor ? this.tiles.get(tileKey(neighbor)) : null;
    if (neighborTile) {
      neighborTile.revealed = true;
      neighborTile.colonized = true;
    }
    if (kind === 'fibrous') {
      for (const fibrous of Array.from(this.tiles.values()).filter(candidate => candidate.revealed && candidate.kind === 'fibrous')) {
        const support = this.neighbors(fibrous)[0];
        const supportTile = support ? this.tiles.get(tileKey(support)) : null;
        if (supportTile) {
          supportTile.revealed = true;
          supportTile.colonized = true;
        }
      }
    }
    this.cameras.main.centerOn(this.world(tile).x, this.world(tile).y);
    this.drawMap();
  }

  private debugClearThreats() {
    for (const mac of this.macrophages) mac.body?.destroy();
    this.macrophages = [];
    this.dormantMacrophages = [];
    this.nextEnemyPressureAt = this.time.now + 60_000;
    for (const unit of this.units) {
      if (unit.mode === 'engulfed') {
        unit.mode = 'idle';
        unit.target = null;
        unit.path = [];
      }
    }
  }

  private debugMacrophageContact(adapted: boolean) {
    const unit = this.units[0];
    if (!unit) return;
    if (!adapted) unit.genes.add('sod');
    const body = this.add.graphics().setDepth(5);
    const mac: Macrophage = {
      id: this.nextId++,
      q: unit.q,
      r: unit.r,
      x: unit.x + 8,
      y: unit.y,
      hp: adapted ? 3 : 6,
      adapted,
      mode: 'aggro',
      lastKnown: { q: unit.q, r: unit.r },
      targetUnitId: null,
      modeUntil: 0,
      body,
    };
    this.macrophages.push(mac);
    this.contact(mac, unit, this.time.now);
    this.drawMac(mac);
  }

  private debugVisibleMacrophage(hex: Hex, adapted: boolean) {
    this.reveal(hex, 3);
    this.spawnMacrophage(hex, adapted);
    this.nextEnemyPressureAt = this.time.now + 60_000;
    this.drawMap();
  }

  private debugSnapshot(): DebugSnapshot {
    const visibleTiles = Array.from(this.tiles.values()).filter(tile => tile.revealed);
    const sightTiles = Array.from(this.tiles.values()).filter(tile => tile.visible);
    const temporarySightTiles = Array.from(this.tiles.values()).filter(tile => tile.visible);
    return {
      seed: this.seed,
      phase: this.phase,
      fps: Math.round(this.smoothedFps),
      visibleDebris: visibleTiles.filter(tile => tile.kind === 'debris').map(tile => ({ q: tile.q, r: tile.r, amount: tile.amount })),
      visibleFibrous: visibleTiles.filter(tile => tile.kind === 'fibrous').map(tile => ({ q: tile.q, r: tile.r, colonized: tile.colonized })),
      visibleCapillaries: visibleTiles.filter(tile => tile.kind === 'capillary').map(tile => ({ q: tile.q, r: tile.r, sprout: tile.sprout, colonized: tile.colonized })),
      buildings: this.buildings.map(building => ({ kind: building.kind, q: building.q, r: building.r })),
      units: this.units.map(unit => ({ id: unit.id, mode: unit.mode, q: unit.q, r: unit.r, x: unit.x, y: unit.y, target: unit.target, selected: this.selectedUnitIds.has(unit.id), carrying: unit.carrying, genes: Array.from(unit.genes) })),
      macrophages: this.macrophages.filter(mac => this.isImmuneVisible(mac)).map(mac => ({ q: mac.q, r: mac.r, adapted: mac.adapted })),
      totalMacrophages: this.totalEnemyCount(),
      victoryTarget: STARTING_MACROPHAGES,
      production: this.productionState(),
      projectiles: this.projectiles.length,
      markers: this.markerCounts(),
      buildMode: this.selectedBuild,
      revealedCount: visibleTiles.length,
      visibleCount: sightTiles.length,
      temporaryVisibleCount: temporarySightTiles.length,
      colonizedCount: Array.from(this.tiles.values()).filter(tile => tile.colonized).length,
      cameraZoom: this.cameras.main.zoom,
      perf: this.perfMetrics,
    };
  }

  private flushPerfWindow(now: number) {
    const elapsedSeconds = Math.max(0.001, (now - this.perfWindowStartAt) / 1000);
    const frameCount = Math.max(1, this.perfAccumulator.frames);
    const average = (value: number) => value / frameCount;
    this.perfMetrics = {
      frameMs: average(this.perfAccumulator.frameMs),
      panMs: average(this.perfAccumulator.panMs),
      economyMs: average(this.perfAccumulator.economyMs),
      unitProductionMs: average(this.perfAccumulator.unitProductionMs),
      instrumentsMs: average(this.perfAccumulator.instrumentsMs),
      unitsMs: average(this.perfAccumulator.unitsMs),
      projectilesMs: average(this.perfAccumulator.projectilesMs),
      visibilityMs: average(this.perfAccumulator.visibilityMs),
      macrophagesMs: average(this.perfAccumulator.macrophagesMs),
      drawDynamicMs: average(this.perfAccumulator.drawDynamicMs),
      drawMapMs: average(this.perfAccumulator.drawMapMs),
      drawMapCallsPerSecond: this.perfAccumulator.drawMapCalls / elapsedSeconds,
    };
    this.perfWindowStartAt = now;
    this.perfAccumulator = {
      frameMs: 0,
      panMs: 0,
      economyMs: 0,
      unitProductionMs: 0,
      instrumentsMs: 0,
      unitsMs: 0,
      projectilesMs: 0,
      visibilityMs: 0,
      macrophagesMs: 0,
      drawDynamicMs: 0,
      drawMapMs: 0,
      drawMapCalls: 0,
      frames: 0,
    };
  }

  private markerCounts() {
    return {
      harvest: this.markers.filter(marker => marker.kind === 'harvest').length,
      defend: this.markers.filter(marker => marker.kind === 'defend').length,
    };
  }

  private buildingCounts(): BuildingCounts {
    return {
      bioreactor: this.buildings.filter(building => building.kind === 'bioreactor').length,
      pcr: this.buildings.filter(building => building.kind === 'pcr').length,
      gel: this.buildings.filter(building => building.kind === 'gel').length,
      incubator: this.buildings.filter(building => building.kind === 'incubator').length,
      energy: this.buildings.filter(building => building.kind === 'energy').length,
      sprout: this.buildings.filter(building => building.kind === 'sprout').length,
    };
  }

  private productionState() {
    const nextDone = this.unitProductions.length > 0 ? Math.min(...this.unitProductions) : 0;
    return {
      queued: this.unitQueue,
      remaining: nextDone ? Math.ceil(Math.max(0, nextDone - this.time.now) / 1000) : 0,
    };
  }

  private emitUi(force: boolean) {
    const now = this.time.now;
    if (!force && now - this.lastUiEmitAt < 100) return;
    this.lastUiEmitAt = now;
    const survived = Math.floor((now - this.startedAt) / 1000);
    const endStats = this.phase === 'won' || this.phase === 'lost'
      ? { survived, chainsCompleted: this.chainsCompleted, adaptationsSurvived: this.adaptationsSurvived, seed: this.seed, cause: this.cause, adaptationLog: this.adaptationLog }
      : null;
    const ui: UiState = {
      phase: this.phase,
      time: survived,
      fps: Math.round(this.smoothedFps),
      nutrients: Math.floor(this.nutrients),
      nutrientRate: this.nutrientRate(),
      pcr: { status: this.pcr.status, progress: this.pcr.progress },
      gel: { status: this.gel.status, progress: this.gel.progress },
      pcrQueue: this.pcrQueue.length,
      gelQueue: this.gelQueue.length,
      geneReady: this.readyGene,
      availableGenes: this.availableGenes,
      activeGene: this.activeGene,
      incubator: {
        status: this.integratingGene ? 'integrating' : this.activeGene ? 'complete' : 'idle',
        remaining: this.integratingGene ? Math.ceil(Math.max(0, this.incubatorDoneAt - now) / 1000) : 0,
      },
      leakageRemaining: Math.ceil(Math.max(0, LEAKAGE_TIME - (now - this.leakageStartedAt)) / 1000),
      waveLabel: `Enemies remaining ${this.totalEnemyCount()}`,
      units: {
        total: this.units.length,
        cap: this.unitCap(),
        selected: this.units.filter(unit => this.selectedUnitIds.has(unit.id)).length,
        idle: this.units.filter(unit => unit.mode === 'idle').length,
        carrying: this.units.filter(unit => unit.mode === 'carrying').length,
        building: this.units.filter(unit => unit.mode === 'building').length,
        combat: this.units.filter(unit => unit.mode === 'combat').length,
        sod: this.units.filter(unit => unit.genes.has('sod')).length,
        pdl1: this.units.filter(unit => unit.genes.has('pdl1')).length,
      },
      markers: this.markerCounts(),
      buildMode: this.selectedBuild,
      buildings: this.buildingCounts(),
      selectedBuilding: this.selectedBuilding,
      production: this.productionState(),
      placement: {
        remaining: 0,
        nextBuilding: null,
        missing: [],
      },
      message: this.message,
      endStats,
    };
    malignantBus.emit('ui_state', ui);
  }
}
