<script lang="ts">
  import { gameState } from './lib/stores/game-state';
  import { currentActiveCase } from './lib/stores/active-cases';
  import CasePresentation from './lib/components/CasePresentation.svelte';
  import SampleSelection from './lib/components/SampleSelection.svelte';
  import InstrumentSelection from './lib/components/InstrumentSelection.svelte';
  import MicroscopeView from './lib/components/instruments/microscope/MicroscopeView.svelte';
  import CulturePlateView from './lib/components/instruments/culture/CulturePlateView.svelte';
  import BiochemicalTestView from './lib/components/instruments/biochemical/BiochemicalTestView.svelte';
  import SerologyView from './lib/components/instruments/serology/SerologyView.svelte';
  import ElectrophoresisView from './lib/components/instruments/electrophoresis/ElectrophoresisView.svelte';
  import PCRView from './lib/components/instruments/pcr/PCRView.svelte';
  import SangerView from './lib/components/instruments/sanger/SangerView.svelte';
  import ElisaPlateView from './lib/components/instruments/elisa/ElisaPlateView.svelte';
  import PlateReaderView from './lib/components/instruments/elisa/PlateReaderView.svelte';
  import FlowCytometryView from './lib/components/instruments/flow-cytometry/FlowCytometryView.svelte';
  import DiagnosisView from './lib/components/DiagnosisView.svelte';
  import PersistentTopBar from './lib/components/shared/PersistentTopBar.svelte';
  import EvidenceSummaryBar from './lib/components/shared/EvidenceSummaryBar.svelte';
  
  // Show persistent bars when we have an active case and not on case presentation
  const showPersistentUI = $derived(
    $currentActiveCase !== null && 
    $gameState.gamePhase !== 'case-presentation'
  );
</script>

<main>
  <!-- Persistent UI elements -->
  {#if showPersistentUI}
    <PersistentTopBar />
    <EvidenceSummaryBar />
  {/if}
  
  <!-- Keep all components mounted to preserve state, show/hide with CSS -->
  <div class="view" class:visible={$gameState.gamePhase === 'case-presentation'} class:with-bars={showPersistentUI}>
    <CasePresentation />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'sample-selection'} class:with-bars={showPersistentUI}>
    <SampleSelection />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'instrument-selection'} class:with-bars={showPersistentUI}>
    <InstrumentSelection />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'microscope-observation'} class:with-bars={showPersistentUI}>
    <MicroscopeView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'culture-observation'} class:with-bars={showPersistentUI}>
    <CulturePlateView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'biochemical-testing'} class:with-bars={showPersistentUI}>
    <BiochemicalTestView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'serology-testing'} class:with-bars={showPersistentUI}>
    <SerologyView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'electrophoresis-testing'} class:with-bars={showPersistentUI}>
    <ElectrophoresisView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'pcr-testing'} class:with-bars={showPersistentUI}>
    <PCRView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'sanger-sequencing'} class:with-bars={showPersistentUI}>
    <SangerView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'elisa-testing'} class:with-bars={showPersistentUI}>
    <ElisaPlateView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'plate-reader'} class:with-bars={showPersistentUI}>
    <PlateReaderView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'flow-cytometry'} class:with-bars={showPersistentUI}>
    <FlowCytometryView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'diagnosis'} class:with-bars={showPersistentUI}>
    <DiagnosisView />
  </div>
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    background: #1a1a1a;
    color: #e0e0e0;
    font-family: 'Georgia', serif;
    overflow: hidden;
    position: relative;
  }

  .view {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
  }

  .view.visible {
    display: block;
  }
  
  /* Adjust layout when persistent bars are shown */
  .view.with-bars {
    top: 140px; /* 60px top bar + 80px evidence bar */
    height: calc(100% - 140px);
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  :global(*) {
    box-sizing: border-box;
  }
</style>
