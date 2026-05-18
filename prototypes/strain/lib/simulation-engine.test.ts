import { describe, expect, it } from 'vitest';
import {
  DEFENSE_TOOLS,
  GENES,
  LOSS_COPY,
  PROPAGATION_SECONDS,
  WAVE_SECONDS,
  WAVE_THREE_SURVIVAL_SECONDS,
  type DefenseToolId,
  type GeneId,
  type ThreatId,
} from './strain-data';
import {
  createInitialSimulation,
  getElisaSignal,
  getUsedSlots,
  isToolAvailable,
  placeDefense,
  revealTelegraphWithElisa,
  setDesiredGenes,
  tickSimulation,
  type SimulationState,
} from './simulation-engine';

describe('strain simulation engine', () => {
  it('progresses waves on a 45 second cadence', () => {
    const initial = {
      ...createInitialSimulation(),
      desiredGenes: ['biofilm', 'capsule', 'surfaceSwitch'] as GeneId[],
      propagatedGenes: ['biofilm', 'capsule', 'surfaceSwitch'] as GeneId[],
    };
    const waveTwo = advanceWithDefense(initial, WAVE_SECONDS);
    const waveThree = advanceWithDefense(waveTwo, WAVE_SECONDS);

    expect(waveTwo.wave).toBe(2);
    expect(waveTwo.activeThreats).toEqual(['neutrophil', 'macrophage']);
    expect(waveThree.wave).toBe(3);
    expect(waveThree.activeThreats).toEqual(['neutrophil', 'macrophage', 'antibody']);
  });

  it('accounts for plasmid slots and ignores overflow genes', () => {
    const state = createInitialSimulation();
    const next = setDesiredGenes(state, ['biofilm', 'capsule', 'surfaceSwitch', 'mucinPlus']);

    expect(getUsedSlots(next.desiredGenes)).toBeLessThanOrEqual(6);
    expect(next.desiredGenes).toEqual(['biofilm', 'capsule', 'surfaceSwitch']);
    expect(GENES.mucinPlus.slotCost).toBe(2);
  });

  it('delays propagated genes after a desired plasmid change', () => {
    const state = setDesiredGenes(createInitialSimulation(), ['biofilm', 'capsule']);
    const midway = tickSimulation(state, { seconds: PROPAGATION_SECONDS - 1 });
    const propagated = tickSimulation(midway, { seconds: 1 });

    expect(state.propagatedGenes).toEqual(['biofilm']);
    expect(midway.propagatedGenes).toEqual(['biofilm']);
    expect(propagated.propagatedGenes).toEqual(['biofilm', 'capsule']);
  });

  it('correct gene unlocks the corresponding placement tool', () => {
    const initial = createInitialSimulation();
    const withCapsule = {
      ...setDesiredGenes(initial, ['biofilm', 'capsule']),
      propagatedGenes: ['biofilm', 'capsule'] as GeneId[],
    };

    expect(isToolAvailable(initial, 'biofilm')).toBe(true);
    expect(isToolAvailable(initial, 'capsule')).toBe(false);
    expect(isToolAvailable(withCapsule, 'capsule')).toBe(true);
  });

  it('placement only protects matching threat in the targeted sector', () => {
    let state = preparedWaveOne();
    state = tickSimulation(state, { seconds: 1 });
    const probe = state.activeProbes.find(activeProbe => activeProbe.threat === 'neutrophil');
    expect(probe).toBeDefined();

    state = placeDefense(state, { toolId: 'capsule', sectorId: probe!.sectorId, placedAtSeconds: state.elapsedSeconds });
    state = tickSimulation(state, { seconds: 6 });
    expect(state.sectors.find(sector => sector.id === probe!.sectorId)?.status).toBe('breached');
  });

  it('expired placement stops protecting the sector', () => {
    const state = tickSimulation({
      ...preparedWaveOne(),
      elapsedSeconds: 80,
      activeProbes: [{ threat: 'neutrophil', sectorId: 'northeast', intensity: 1 }],
      placements: [{
        id: 'expired-biofilm',
        toolId: 'biofilm',
        sectorId: 'northeast',
        placedAtSeconds: 0,
        expiresAtSeconds: DEFENSE_TOOLS.biofilm.durationSeconds,
      }],
      sectors: preparedWaveOne().sectors.map(sector =>
        sector.id === 'northeast'
          ? { ...sector, threat: 'neutrophil', status: 'pressured', pressure: 4.9 }
          : sector
      ),
    }, { seconds: 1 });

    expect(state.placements).toHaveLength(0);
    expect(state.sectors.find(sector => sector.id === 'northeast')?.status).toBe('breached');
  });

  it('breach is recoverable with correct placement', () => {
    let state = preparedWaveOne();
    state = tickSimulation(state, { seconds: 7 });
    const breached = state.sectors.find(sector => sector.status === 'breached' && sector.threat === 'neutrophil');
    expect(breached).toBeDefined();

    state = placeDefense(state, { toolId: 'biofilm', sectorId: breached!.id, placedAtSeconds: state.elapsedSeconds });
    state = tickSimulation(state, { seconds: 5 });
    expect(state.sectors.find(sector => sector.id === breached!.id)?.status).not.toBe('founder-threatened');
  });

  it('breach reaches Founder Cell if ignored', () => {
    const state = tickSimulation(preparedWaveOne(), { seconds: 18 });

    expect(state.gameOver?.kind).toBe('loss');
    expect(state.gameOver?.cause).toBe('neutrophil');
    expect(state.gameOver?.suggestion).toBe(LOSS_COPY.neutrophil.suggestion);
  });

  it('correct plasmid with no placements still loses', () => {
    const state = advanceWithoutDefense(preparedAllCounters(), 140);

    expect(state.gameOver?.kind).toBe('loss');
  });

  it('skilled placement can survive Wave 3 for 90 seconds and win', () => {
    let state = tickSimulation(preparedAllCounters(), { seconds: 0 });

    for (let i = 0; i < WAVE_THREE_SURVIVAL_SECONDS + 2; i++) {
      state = defendCurrentProbes(state);
      state = tickSimulation(state, { seconds: 1 });
      state = defendCurrentProbes(state);
      expect(state.gameOver?.kind).not.toBe('loss');
    }

    expect(state.gameOver?.kind).toBe('win');
    expect(state.gameOver?.cause).toBe('stabilized');
  });

  it('ELISA resolves the next threat telegraph', () => {
    const state = createInitialSimulation();
    const revealed = revealTelegraphWithElisa(state);
    const signal = getElisaSignal(revealed.telegraph.nextThreat);

    expect(state.telegraph.nextThreatKnown).toBe(false);
    expect(revealed.telegraph.nextThreatKnown).toBe(true);
    expect(signal.cytokine).toBe('TGF-beta');
  });
});

function preparedWaveOne(): SimulationState {
  return {
    ...createInitialSimulation(),
    desiredGenes: ['biofilm', 'capsule', 'surfaceSwitch'] as GeneId[],
    propagatedGenes: ['biofilm', 'capsule', 'surfaceSwitch'] as GeneId[],
  };
}

function preparedAllCounters(): SimulationState {
  return {
    ...createInitialSimulation(),
    wave: 3,
    secondsToEscalation: WAVE_SECONDS,
    activeThreats: ['neutrophil', 'macrophage', 'antibody'] as ThreatId[],
    desiredGenes: ['biofilm', 'capsule', 'surfaceSwitch'] as GeneId[],
    propagatedGenes: ['biofilm', 'capsule', 'surfaceSwitch'] as GeneId[],
    colonyDensity: 100,
  };
}

function defendCurrentProbes(state: SimulationState): SimulationState {
  return state.activeProbes.reduce((next, probe) => {
    const toolId = toolForThreat(probe.threat);
    if (!isToolAvailable(next, toolId)) return next;
    return placeDefense(next, {
      toolId,
      sectorId: probe.sectorId,
      placedAtSeconds: next.elapsedSeconds,
    });
  }, state);
}

function advanceWithDefense(state: SimulationState, seconds: number): SimulationState {
  let next = state;
  for (let i = 0; i < seconds; i++) {
    next = tickSimulation(next, { seconds: 1 });
    next = defendCurrentProbes(next);
    if (next.gameOver) return next;
  }
  return next;
}

function advanceWithoutDefense(state: SimulationState, seconds: number): SimulationState {
  let next = state;
  for (let i = 0; i < seconds; i++) {
    next = tickSimulation(next, { seconds: 1 });
    if (next.gameOver) return next;
  }
  return next;
}

function toolForThreat(threat: ThreatId): DefenseToolId {
  if (threat === 'neutrophil') return 'biofilm';
  if (threat === 'macrophage') return 'capsule';
  return 'surfaceSwitch';
}
