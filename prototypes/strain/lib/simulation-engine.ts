import {
  GENES,
  DEFENSE_TOOLS,
  INITIAL_PLASMID,
  LOSS_COPY,
  PLASMID_SLOT_COUNT,
  PROPAGATION_SECONDS,
  SECTOR_IDS,
  THREAT_SEQUENCE,
  THREATS,
  WAVE_SECONDS,
  WAVE_THREE_SURVIVAL_SECONDS,
  WIN_COPY,
  type DefenseToolId,
  type GeneId,
  type SectorId,
  type ThreatId,
} from './strain-data';

export type FounderState = 'healthy' | 'stressed' | 'critical' | 'dead';
export type LossCause = ThreatId;
export type OutcomeKind = 'loss' | 'win';
export type SectorStatus = 'safe' | 'pressured' | 'breached' | 'founder-threatened';

export interface TelegraphState {
  nextThreat: ThreatId;
  nextThreatKnown: boolean;
}

export interface GameOverState {
  kind: OutcomeKind;
  cause: LossCause | 'stabilized';
  title: string;
  detail: string;
  suggestion: string;
  sectorId?: SectorId;
}

export interface ThreatProbe {
  threat: ThreatId;
  sectorId: SectorId;
  intensity: number;
}

export interface DefensePlacement {
  id: string;
  toolId: DefenseToolId;
  sectorId: SectorId;
  placedAtSeconds: number;
  expiresAtSeconds: number;
}

export interface SectorState {
  id: SectorId;
  status: SectorStatus;
  threat: ThreatId | null;
  pressure: number;
  breachProgress: number;
  recoveryProgress: number;
}

export interface PlacementCommand {
  toolId: DefenseToolId;
  sectorId: SectorId;
  placedAtSeconds: number;
}

export interface SimulationState {
  elapsedSeconds: number;
  wave: number;
  secondsToEscalation: number;
  activeThreats: ThreatId[];
  telegraph: TelegraphState;
  desiredGenes: GeneId[];
  propagatedGenes: GeneId[];
  propagationRemaining: number;
  stabilizedSeconds: number;
  waveThreeSurvivalSeconds: number;
  sectors: SectorState[];
  placements: DefensePlacement[];
  toolCooldowns: Record<DefenseToolId, number>;
  activeProbes: ThreatProbe[];
  colonyDensity: number;
  founderState: FounderState;
  gameOver: GameOverState | null;
}

export interface TickOptions {
  seconds: number;
}

export function createInitialSimulation(): SimulationState {
  return {
    elapsedSeconds: 0,
    wave: 1,
    secondsToEscalation: WAVE_SECONDS,
    activeThreats: ['neutrophil'],
    telegraph: {
      nextThreat: getThreatForWave(2),
      nextThreatKnown: false,
    },
    desiredGenes: [...INITIAL_PLASMID],
    propagatedGenes: [...INITIAL_PLASMID],
    propagationRemaining: 0,
    stabilizedSeconds: 0,
    waveThreeSurvivalSeconds: 0,
    sectors: createInitialSectors(),
    placements: [],
    toolCooldowns: createInitialCooldowns(),
    activeProbes: [],
    colonyDensity: 100,
    founderState: 'healthy',
    gameOver: null,
  };
}

export function tickSimulation(state: SimulationState, options: TickOptions): SimulationState {
  if (state.gameOver) return state;

  let next = cloneState(state);
  const seconds = Math.max(0, options.seconds);
  next.elapsedSeconds += seconds;
  next.secondsToEscalation -= seconds;

  if (next.propagationRemaining > 0) {
    next.propagationRemaining = Math.max(0, next.propagationRemaining - seconds);
    if (next.propagationRemaining === 0) {
      next.propagatedGenes = [...next.desiredGenes];
    }
  }

  next.placements = next.placements.filter(placement => placement.expiresAtSeconds > next.elapsedSeconds);
  for (const tool of Object.keys(next.toolCooldowns) as DefenseToolId[]) {
    next.toolCooldowns[tool] = Math.max(0, next.toolCooldowns[tool] - seconds);
  }

  while (next.secondsToEscalation <= 0) {
    next.wave += 1;
    next.activeThreats = getThreatsForWave(next.wave);
    next.secondsToEscalation += WAVE_SECONDS;
    next.telegraph = {
      nextThreat: getThreatForWave(next.wave + 1),
      nextThreatKnown: false,
    };
  }

  next.activeProbes = getActiveProbes(next.elapsedSeconds, next.activeThreats);
  next.sectors = updateSectors(next, seconds);
  const damage = calculateSectorDamage(next.sectors, next.propagatedGenes) * seconds;
  const recovery = calculateRecovery(next.propagatedGenes) * seconds;
  next.colonyDensity = clamp(next.colonyDensity - damage + recovery, 0, 100);
  next.founderState = getFounderState(next.colonyDensity);

  next.waveThreeSurvivalSeconds = next.wave >= 3 ? next.waveThreeSurvivalSeconds + seconds : 0;
  next.stabilizedSeconds = isStabilized(next) ? next.stabilizedSeconds + seconds : 0;
  if (next.waveThreeSurvivalSeconds >= WAVE_THREE_SURVIVAL_SECONDS && isStabilized(next)) {
    next.gameOver = getWinState();
    return next;
  }

  const founderThreat = next.sectors.find(sector => sector.status === 'founder-threatened' && sector.threat);
  const lethalThreat = getLethalThreat(next.sectors, next.colonyDensity);
  const cause = founderThreat?.threat ?? lethalThreat;
  if (cause) {
    next.founderState = 'dead';
    next.gameOver = getGameOver(cause, founderThreat?.id);
  }

  return next;
}

export function placeDefense(state: SimulationState, command: PlacementCommand): SimulationState {
  const tool = DEFENSE_TOOLS[command.toolId];
  if (!state.propagatedGenes.includes(tool.gene) || state.toolCooldowns[command.toolId] > 0 || state.gameOver) {
    return state;
  }

  const next = cloneState(state);
  next.placements = [
    ...next.placements.filter(placement => !(placement.toolId === command.toolId && placement.sectorId === command.sectorId)),
    {
      id: `${command.toolId}-${command.sectorId}-${Math.round(command.placedAtSeconds * 10)}`,
      toolId: command.toolId,
      sectorId: command.sectorId,
      placedAtSeconds: command.placedAtSeconds,
      expiresAtSeconds: command.placedAtSeconds + tool.durationSeconds,
    },
  ];
  next.toolCooldowns[command.toolId] = tool.cooldownSeconds;
  return next;
}

export function isToolAvailable(state: SimulationState, toolId: DefenseToolId): boolean {
  const tool = DEFENSE_TOOLS[toolId];
  return state.propagatedGenes.includes(tool.gene) && state.toolCooldowns[toolId] <= 0;
}

export function setDesiredGenes(state: SimulationState, desiredGenes: GeneId[]): SimulationState {
  const normalized = normalizeGenes(desiredGenes);
  return {
    ...cloneState(state),
    desiredGenes: normalized,
    propagationRemaining: arraysEqual(normalized, state.propagatedGenes) ? 0 : PROPAGATION_SECONDS,
  };
}

export function revealTelegraphWithElisa(state: SimulationState): SimulationState {
  return {
    ...cloneState(state),
    telegraph: {
      nextThreat: state.telegraph.nextThreat,
      nextThreatKnown: true,
    },
  };
}

export function getUsedSlots(genes: GeneId[]): number {
  return genes.reduce((total, gene) => total + GENES[gene].slotCost, 0);
}

export function canUseGenes(genes: GeneId[]): boolean {
  return getUsedSlots(genes) <= PLASMID_SLOT_COUNT;
}

export function normalizeGenes(genes: GeneId[]): GeneId[] {
  const unique = Array.from(new Set(genes));
  const accepted: GeneId[] = [];
  for (const gene of unique) {
    const trial = [...accepted, gene];
    if (canUseGenes(trial)) accepted.push(gene);
  }
  return accepted;
}

export function getThreatsForWave(wave: number): ThreatId[] {
  if (wave <= 1) return ['neutrophil'];
  if (wave === 2) return ['neutrophil', 'macrophage'];
  return ['neutrophil', 'macrophage', 'antibody'];
}

export function getThreatForWave(wave: number): ThreatId {
  return THREAT_SEQUENCE[(Math.max(1, wave) - 1) % THREAT_SEQUENCE.length] ?? 'neutrophil';
}

export function getElisaSignal(threat: ThreatId): { cytokine: string; meaning: string; threat: ThreatId } {
  const definition = THREATS[threat];
  return {
    cytokine: definition.cytokine,
    meaning: definition.cytokineMeaning,
    threat,
  };
}

function calculateSectorDamage(sectors: SectorState[], genes: GeneId[]): number {
  const complementReduction = genes.includes('complementInh') ? 0.16 : 0;
  return sectors.reduce((total, sector) => {
    if (!sector.threat) return total;
    const base = sector.status === 'founder-threatened' ? 4 : sector.status === 'breached' ? 2.2 : sector.status === 'pressured' ? 0.45 : 0;
    return total + Math.max(0, base - complementReduction);
  }, 0);
}

function calculateRecovery(genes: GeneId[]): number {
  return genes.includes('fastGrow') ? 0.9 : 0.35;
}

function getCounterForThreat(threat: ThreatId): GeneId {
  if (threat === 'neutrophil') return 'biofilm';
  if (threat === 'macrophage') return 'capsule';
  return 'surfaceSwitch';
}

function getLethalThreat(sectors: SectorState[], colonyDensity: number): ThreatId | null {
  if (colonyDensity > 20) return null;
  return sectors.find(sector => sector.threat)?.threat ?? 'neutrophil';
}

function getFounderState(colonyDensity: number): FounderState {
  if (colonyDensity <= 0) return 'dead';
  if (colonyDensity < 35) return 'critical';
  if (colonyDensity < 65) return 'stressed';
  return 'healthy';
}

function getGameOver(cause: LossCause, sectorId?: SectorId): GameOverState {
  const copy = LOSS_COPY[cause];
  return {
    kind: 'loss',
    cause,
    title: copy.title,
    detail: sectorId ? `${copy.cause} The ${sectorId.replace('-', ' ')} sector could not be pushed back.` : copy.cause,
    suggestion: copy.suggestion,
    sectorId,
  };
}

function getWinState(): GameOverState {
  return {
    kind: 'win',
    cause: 'stabilized',
    title: WIN_COPY.title,
    detail: WIN_COPY.cause,
    suggestion: WIN_COPY.suggestion,
  };
}

function isStabilized(state: SimulationState): boolean {
  return (
    state.wave >= 3 &&
    state.activeThreats.length === 3 &&
    state.activeThreats.every(threat => state.propagatedGenes.includes(getCounterForThreat(threat)))
  );
}

function createInitialSectors(): SectorState[] {
  return SECTOR_IDS.map(id => ({
    id,
    status: 'safe',
    threat: null,
    pressure: 0,
    breachProgress: 0,
    recoveryProgress: 0,
  }));
}

function createInitialCooldowns(): Record<DefenseToolId, number> {
  return {
    biofilm: 0,
    capsule: 0,
    surfaceSwitch: 0,
  };
}

function getActiveProbes(elapsedSeconds: number, threats: ThreatId[]): ThreatProbe[] {
  return threats.flatMap(threat => {
    if (threat === 'antibody' && elapsedSeconds % 16 > 8) return [];
    const period = threat === 'neutrophil' ? 10 : threat === 'macrophage' ? 16 : 12;
    const offset = threat === 'neutrophil' ? 1 : threat === 'macrophage' ? 5 : 3;
    const sectorId = SECTOR_IDS[(Math.floor(elapsedSeconds / period) + offset) % SECTOR_IDS.length];
    return [{ threat, sectorId, intensity: threat === 'antibody' ? 1.35 : threat === 'macrophage' ? 1.15 : 1 }];
  });
}

function updateSectors(state: SimulationState, seconds: number): SectorState[] {
  return state.sectors.map(sector => {
    const probe = state.activeProbes.find(activeProbe => activeProbe.sectorId === sector.id) ?? null;
    if (!probe) {
      if ((sector.status === 'breached' || sector.status === 'founder-threatened') && sector.threat) {
        if (hasMatchingPlacement(state, sector.id, sector.threat)) {
          const breachProgress = Math.max(0, sector.breachProgress - seconds * 0.5);
          return {
            ...sector,
            status: breachProgress <= 0 ? 'safe' : 'breached',
            pressure: Math.max(0, sector.pressure - seconds),
            breachProgress,
            recoveryProgress: sector.recoveryProgress + seconds,
          };
        }

        const breachProgress = sector.breachProgress + seconds * 0.6;
        return {
          ...sector,
          status: breachProgress >= 10 ? 'founder-threatened' : 'breached',
          breachProgress,
          recoveryProgress: 0,
        };
      }

      return {
        ...sector,
        status: 'safe',
        threat: null,
        pressure: Math.max(0, sector.pressure - seconds * 1.2),
      };
    }

    const protectedNow = hasMatchingPlacement(state, sector.id, probe.threat);
    if (protectedNow && (sector.status === 'breached' || sector.status === 'founder-threatened')) {
      const breachProgress = Math.max(0, sector.breachProgress - seconds * 0.5);
      return {
        ...sector,
        threat: probe.threat,
        status: breachProgress <= 0 ? 'pressured' : 'breached',
        pressure: Math.max(0, sector.pressure - seconds * 0.8),
        breachProgress,
        recoveryProgress: sector.recoveryProgress + seconds,
      };
    }

    if (protectedNow) {
      return {
        ...sector,
        status: 'pressured',
        threat: probe.threat,
        pressure: Math.max(0, sector.pressure - seconds * 0.6),
        breachProgress: 0,
        recoveryProgress: 0,
      };
    }

    const pressure = sector.pressure + seconds * probe.intensity;
    const threshold = probe.threat === 'antibody' ? 4 : probe.threat === 'neutrophil' ? 5 : 8;
    const breached = pressure >= threshold || sector.status === 'breached' || sector.status === 'founder-threatened';
    const breachProgress = breached ? sector.breachProgress + seconds * (probe.threat === 'macrophage' ? 0.75 : 1) : 0;
    return {
      ...sector,
      status: breachProgress >= 10 ? 'founder-threatened' : breached ? 'breached' : 'pressured',
      threat: probe.threat,
      pressure,
      breachProgress,
      recoveryProgress: 0,
    };
  });
}

function hasMatchingPlacement(state: SimulationState, sectorId: SectorId, threat: ThreatId): boolean {
  return state.placements.some(placement => {
    const tool = DEFENSE_TOOLS[placement.toolId];
    return placement.sectorId === sectorId && tool.counters === threat && placement.expiresAtSeconds > state.elapsedSeconds;
  });
}

function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    activeThreats: [...state.activeThreats],
    telegraph: { ...state.telegraph },
    desiredGenes: [...state.desiredGenes],
    propagatedGenes: [...state.propagatedGenes],
    sectors: state.sectors.map(sector => ({ ...sector })),
    placements: state.placements.map(placement => ({ ...placement })),
    toolCooldowns: { ...state.toolCooldowns },
    activeProbes: state.activeProbes.map(probe => ({ ...probe })),
    gameOver: state.gameOver ? { ...state.gameOver } : null,
  };
}

function arraysEqual(left: readonly GeneId[], right: readonly GeneId[]): boolean {
  return left.length === right.length && left.every((gene, index) => gene === right[index]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
