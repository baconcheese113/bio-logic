<script lang="ts">
  import '../svelte-lab-avatar/lib/base.css';
  import BottomBar from './components/bottom-bar.svelte';
  import CytokineStrip from './components/cytokine-strip.svelte';
  import DefenseTools from './components/defense-tools.svelte';
  import GameOverModal from './components/game-over-modal.svelte';
  import InstrumentBay from './components/instrument-bay.svelte';
  import PlasmidEditor from './components/plasmid-editor.svelte';
  import TissueBattlefield from './components/tissue-battlefield.svelte';
  import { strainBus, type PhaserSnapshot } from './lib/event-bus';
  import {
    createInitialSimulation,
    getUsedSlots,
    isToolAvailable,
    placeDefense,
    revealTelegraphWithElisa,
    setDesiredGenes,
    tickSimulation,
  } from './lib/simulation-engine';
  import { DEFENSE_TOOLS, WAVE_THREE_SURVIVAL_SECONDS, THREATS, type DefenseToolId, type GeneId } from './lib/strain-data';

  let simulation = $state(createInitialSimulation());
  let paused = $state(false);
  let sampling = $state(false);
  let selectedTool = $state<DefenseToolId | null>('biofilm');

  const usedSlots = $derived(getUsedSlots(simulation.desiredGenes));
  const propagating = $derived(simulation.propagationRemaining > 0);
  const surfaceSwitchActive = $derived(simulation.propagatedGenes.includes('surfaceSwitch'));
  const nextThreatDefinition = $derived(THREATS[simulation.telegraph.nextThreat]);
  const survivalProgress = $derived(Math.min(1, simulation.waveThreeSurvivalSeconds / WAVE_THREE_SURVIVAL_SECONDS));
  const snapshot = $derived<PhaserSnapshot>({
    elapsedSeconds: simulation.elapsedSeconds,
    activeThreats: simulation.activeThreats,
    propagatedGenes: simulation.propagatedGenes,
    desiredGenes: simulation.desiredGenes,
    telegraph: simulation.telegraph,
    colonyDensity: simulation.colonyDensity,
    founderState: simulation.founderState,
    sectors: simulation.sectors,
    placements: simulation.placements,
    activeProbes: simulation.activeProbes,
    selectedTool,
    toolCooldowns: simulation.toolCooldowns,
    wave: simulation.wave,
    paused,
  });

  $effect(() => {
    const interval = window.setInterval(() => {
      if (!paused) {
        simulation = tickSimulation(simulation, { seconds: 0.25 });
      }
    }, 250);

    return () => window.clearInterval(interval);
  });

  $effect(() => {
    strainBus.emit('state:update', snapshot);
  });

  $effect(() => {
    const unsubscribe = strainBus.on('battlefield:place-defense', ({ sectorId }) => {
      if (!selectedTool) return;
      simulation = placeDefense(simulation, {
        toolId: selectedTool,
        sectorId,
        placedAtSeconds: simulation.elapsedSeconds,
      });
    });
    return unsubscribe;
  });

  $effect(() => {
    const handler = (event: KeyboardEvent) => {
      const tool = Object.values(DEFENSE_TOOLS).find(definition => definition.hotkey === event.key);
      if (!tool) return;
      event.preventDefault();
      selectTool(tool.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  function updateGenes(genes: GeneId[]) {
    simulation = setDesiredGenes(simulation, genes);
  }

  function selectTool(toolId: DefenseToolId) {
    if (!isToolAvailable(simulation, toolId)) return;
    selectedTool = toolId;
  }

  function revealNextThreat() {
    simulation = revealTelegraphWithElisa(simulation);
  }

  function pulseSample(instrument: 'elisa' | 'pcr') {
    sampling = true;
    strainBus.emit('sample:pulse', { instrument });
    window.setTimeout(() => {
      sampling = false;
    }, 1200);
  }

  function resetGame() {
    simulation = createInitialSimulation();
    paused = false;
    selectedTool = 'biofilm';
  }
</script>

<main class="strain-app">
  <section class="battle-panel">
    <div class="battle-label">
      <strong>tissue site</strong>
      <span>forearm dermis · live assault</span>
    </div>
    <TissueBattlefield />
  </section>

  <CytokineStrip telegraph={simulation.telegraph} {sampling} {propagating} />

  <section class="bench-panel">
    <header class="bench-header">
      <div>
        <h1>Strain</h1>
        <p>engineer the colony before the immune response adapts</p>
      </div>
      <button type="button" onclick={() => paused = !paused}>{paused ? 'Resume' : 'Pause'}</button>
    </header>

    <PlasmidEditor
      desiredGenes={simulation.desiredGenes}
      propagatedGenes={simulation.propagatedGenes}
      propagationRemaining={simulation.propagationRemaining}
      onChange={updateGenes}
    />

    <DefenseTools
      {selectedTool}
      propagatedGenes={simulation.propagatedGenes}
      toolCooldowns={simulation.toolCooldowns}
      onSelect={selectTool}
    />

    <div class="telegraph-card">
      {#if simulation.wave >= 3}
        <span>wave 3 survival</span>
        <strong style="--threat:#2f6b3f">{Math.floor(survivalProgress * 100)}%</strong>
        <em>survive {WAVE_THREE_SURVIVAL_SECONDS}s after Wave 3 begins</em>
      {:else}
        <span>next escalation</span>
        {#if simulation.telegraph.nextThreatKnown}
          <strong style={`--threat:${nextThreatDefinition.color}`}>{nextThreatDefinition.label}</strong>
          <em>{nextThreatDefinition.cytokine} confirmed by ELISA</em>
        {:else}
          <strong>unknown</strong>
          <em>run ELISA to reveal the cytokine signal</em>
        {/if}
      {/if}
    </div>

    <InstrumentBay
      telegraph={simulation.telegraph}
      activeThreats={simulation.activeThreats}
      {surfaceSwitchActive}
      onElisaComplete={revealNextThreat}
      onSamplePulse={pulseSample}
    />
  </section>

  <BottomBar
    wave={simulation.wave}
    secondsToEscalation={simulation.secondsToEscalation}
    activeThreats={simulation.activeThreats}
    telegraph={simulation.telegraph}
    {usedSlots}
    founderState={simulation.founderState}
    colonyDensity={simulation.colonyDensity}
  />

  {#if simulation.gameOver}
    <GameOverModal
      gameOver={simulation.gameOver}
      elapsedSeconds={simulation.elapsedSeconds}
      wave={simulation.wave}
      onRetry={resetGame}
    />
  {/if}
</main>

<style>
  :global(html),
  :global(body),
  :global(#app) {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .strain-app {
    height: 100vh;
    display: grid;
    grid-template-columns: minmax(360px, 1fr) 42px minmax(390px, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    background: #e8dec2;
    color: #1f1d18;
    font-family: var(--font-body);
  }

  .battle-panel {
    position: relative;
    min-width: 0;
    min-height: 0;
    background: #7d3338;
  }

  .battle-label {
    position: absolute;
    left: 14px;
    top: 14px;
    z-index: 2;
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 7px 10px;
    border: 1px solid #2a261c;
    border-radius: 8px;
    background: rgba(255, 251, 240, 0.92);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.16);
    font-size: 14px;
  }

  .battle-label strong {
    font-family: var(--font-heading);
  }

  .bench-panel {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto auto auto minmax(0, 1fr);
    gap: 10px;
    padding: 14px 16px;
    overflow: auto;
    background:
      repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.025) 0 1px, transparent 1px 7px),
      linear-gradient(180deg, #f8f2e2, #e8dec2);
    border-left: 1px solid #2a261c;
  }

  .bench-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px dashed #6f6553;
    padding-bottom: 8px;
  }

  h1 {
    margin: 0;
    font-size: 26px;
    color: #1f1d18;
    letter-spacing: 0;
  }

  p {
    margin: 0;
  }

  .bench-header p {
    color: #6f6553;
    font-size: 14px;
  }

  .bench-header button {
    min-height: 36px;
    border: 1px solid #2a261c;
    border-radius: 6px;
    background: #fffbf0;
    color: #1f1d18;
    padding: 7px 12px;
    font-size: 14px;
  }

  .telegraph-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 8px 10px;
    border: 1px solid #2a261c;
    border-radius: 8px;
    background: #fffbf0;
    color: #1f1d18;
    font-size: 14px;
  }

  .telegraph-card span {
    font-family: var(--font-heading);
    color: #6f6553;
  }

  .telegraph-card strong {
    color: var(--threat, #a8551c);
    font-size: 15px;
  }

  .telegraph-card em {
    color: #6f6553;
    font-style: normal;
  }

  .strain-app > :global(.bottom-bar) {
    grid-column: 1 / -1;
  }

  @media (max-width: 900px) {
    .strain-app {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(320px, 44vh) 34px minmax(0, 1fr) auto;
      overflow: auto;
    }

    .strain-app > :global(.cytokine-strip) {
      width: 100%;
      min-width: 0;
      height: 34px;
    }
  }
</style>
