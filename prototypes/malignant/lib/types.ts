export type InstrumentStatus = 'idle' | 'running' | 'ready';
export type PartKind = 'promoter' | 'rbs' | 'gene' | 'terminator';
export type MarkerKind = 'harvest' | 'defend';
export type GamePhase = 'placement' | 'playing' | 'final-wave' | 'won' | 'lost';
export type GeneId = 'sod' | 'pdl1';
export type BuildingKind = 'bioreactor' | 'pcr' | 'gel' | 'incubator' | 'energy' | 'sprout';
export type BuildCommand = BuildingKind | 'mmp-flare' | 'colonize';

export interface ProgressState {
  status: InstrumentStatus;
  progress: number;
}

export interface IncubatorState {
  status: 'idle' | 'integrating' | 'complete';
  remaining: number;
}

export interface UnitCounts {
  total: number;
  cap: number;
  selected: number;
  idle: number;
  carrying: number;
  building: number;
  combat: number;
  sod: number;
  pdl1: number;
}

export interface ActiveMarkerCount {
  harvest: number;
  defend: number;
}

export interface BuildingCounts {
  bioreactor: number;
  pcr: number;
  gel: number;
  incubator: number;
  energy: number;
  sprout: number;
}

export interface ProductionState {
  queued: number;
  remaining: number;
}

export interface PerfMetrics {
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
  drawMapCallsPerSecond: number;
}

export interface DebugSnapshot {
  seed: number;
  phase: GamePhase;
  fps: number;
  visibleDebris: Array<{ q: number; r: number; amount: number }>;
  visibleFibrous: Array<{ q: number; r: number; colonized: boolean }>;
  visibleCapillaries: Array<{ q: number; r: number; sprout: boolean; colonized: boolean }>;
  buildings: Array<{ kind: BuildingKind; q: number; r: number }>;
  units: Array<{ id: number; mode: string; q: number; r: number; x: number; y: number; target: { q: number; r: number } | null; selected: boolean; carrying: GeneId | null; genes: GeneId[] }>;
  macrophages: Array<{ q: number; r: number; adapted: boolean }>;
  totalMacrophages: number;
  victoryTarget: number;
  production: ProductionState;
  projectiles: number;
  markers: ActiveMarkerCount;
  buildMode: BuildCommand | null;
  revealedCount: number;
  visibleCount: number;
  temporaryVisibleCount: number;
  colonizedCount: number;
  cameraZoom: number;
  perf: PerfMetrics;
}

export interface MalignantDebugApi {
  snapshot: () => DebugSnapshot | null;
  hexToScreen: (q: number, r: number) => { x: number; y: number } | null;
  placeStartingBuildings: () => void;
  forcePhase: (phase: GamePhase) => void;
  forceSpawnWave: (adapted?: boolean) => void;
  forceLeakage: () => void;
  forceWin: () => void;
  forceLoss: () => void;
  forceCompleteLab: (gene?: GeneId) => void;
  forceDeployGene: (gene: GeneId) => void;
  forceMacrophageContact: (adapted?: boolean) => void;
  forceVisibleMacrophage: (q: number, r: number, adapted?: boolean) => void;
  forceLeadUnitAt: (q: number, r: number) => void;
  forceClearThreats: () => void;
  forceRevealNearestCapillary: () => void;
  forceRevealNearestFibrous: () => void;
}

export interface PlacementState {
  remaining: number;
  nextBuilding: BuildingKind | null;
  missing: BuildingKind[];
}

export interface EndStats {
  survived: number;
  chainsCompleted: number;
  adaptationsSurvived: number;
  seed: number;
  cause: string;
  adaptationLog: number[];
}

export interface UiState {
  phase: GamePhase;
  time: number;
  fps: number;
  nutrients: number;
  nutrientRate: number;
  pcr: ProgressState;
  gel: ProgressState;
  pcrQueue: number;
  gelQueue: number;
  geneReady: GeneId | null;
  availableGenes: GeneId[];
  activeGene: GeneId | null;
  incubator: IncubatorState;
  leakageRemaining: number;
  waveLabel: string;
  units: UnitCounts;
  markers: ActiveMarkerCount;
  buildMode: BuildCommand | null;
  buildings: BuildingCounts;
  selectedBuilding: BuildingKind | null;
  production: ProductionState;
  placement: PlacementState;
  message: string;
  endStats: EndStats | null;
}

export interface Part {
  id: string;
  label: string;
  kind: PartKind;
  gene?: GeneId;
}

export interface PlasmidDesign {
  promoter: string;
  rbs: string;
  gene: GeneId;
  terminator: string;
}

export interface MarkerPlacedPayload {
  kind: MarkerKind;
  q: number;
  r: number;
}

export interface MalignantEvents {
  debris_collected: { source: string };
  pcr_complete: { gene: GeneId };
  gel_complete: { gene: GeneId };
  gene_part_collected: { gene: GeneId };
  wave_spawned: { wave: string };
  leakage_triggered: { activeGene: GeneId | null };
  founder_destroyed: { cause: string };
  ui_state: UiState;
  plasmid_deployed: PlasmidDesign;
  build_selected: { command: BuildCommand | null };
  marker_placed: MarkerPlacedPayload;
  flare_placed: { q: number; r: number };
  sprout_requested: { q: number; r: number };
  restart_requested: Record<string, never>;
  auto_setup_requested: Record<string, never>;
  unit_requested: Record<string, never>;
}
