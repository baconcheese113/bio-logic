export type InstrumentStatus = 'idle' | 'running' | 'ready';
export type PartKind = 'promoter' | 'rbs' | 'gene' | 'terminator';
export type MarkerKind = 'harvest' | 'defend';
export type GamePhase = 'playing' | 'final-wave' | 'won' | 'lost';
export type GeneId = 'sod' | 'mmp' | 'motility';

export interface ProgressState {
  status: InstrumentStatus;
  progress: number;
}

export interface IncubatorState {
  status: 'idle' | 'integrating' | 'complete';
  remaining: number;
}

export interface UnitCounts {
  collectors: number;
  combat: number;
  sod: number;
  mmp: number;
  motility: number;
}

export interface UiState {
  time: number;
  pcr: ProgressState;
  gel: ProgressState;
  pcrQueue: number;
  gelQueue: number;
  samplesWaiting: number;
  waveCountdown: number;
  gelBand: number | null;
  gelBands: number[];
  currentGene: GeneId | null;
  availableGenes: GeneId[];
  bookReady: boolean;
  incubator: IncubatorState;
  units: UnitCounts;
  phase: GamePhase;
  finalWaveRemaining: number;
  fibrousRemaining: number;
  wave: string;
  message: string;
}

export interface Part {
  id: string;
  label: string;
  kind: PartKind;
}

export interface PlasmidDesign {
  promoter: string;
  rbs: string;
  gene: string;
  terminator: string;
}

export interface MarkerPlacedPayload {
  kind: MarkerKind;
  q: number;
  r: number;
}

export interface MalignantEvents {
  debris_collected: { source: string };
  wave_started: { wave: string };
  unit_engulfed: { unitId: number };
  nest_destroyed: { time: number };
  ui_state: UiState;
  plasmid_deployed: PlasmidDesign;
  marker_placed: MarkerPlacedPayload;
  reference_unlocked: { geneId: string };
  game_paused: { paused: boolean };
  restart_requested: Record<string, never>;
}
