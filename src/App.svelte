<script lang="ts">
  import { gameState } from './lib/stores/game-state';
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
  import DiagnosisView from './lib/components/DiagnosisView.svelte';
</script>

<main>
  <!-- Keep all components mounted to preserve state, show/hide with CSS -->
  <div class="view" class:visible={$gameState.gamePhase === 'case-presentation'}>
    <CasePresentation />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'sample-selection'}>
    <SampleSelection />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'instrument-selection'}>
    <InstrumentSelection />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'microscope-observation'}>
    <MicroscopeView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'culture-observation'}>
    <CulturePlateView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'biochemical-testing'}>
    <BiochemicalTestView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'serology-testing'}>
    <SerologyView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'electrophoresis-testing'}>
    <ElectrophoresisView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'pcr-testing'}>
    <PCRView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'sanger-sequencing'}>
    <SangerView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'elisa-testing'}>
    <ElisaPlateView />
  </div>

  <div class="view" class:visible={$gameState.gamePhase === 'plate-reader'}>
    <PlateReaderView />
  </div>
  
  <div class="view" class:visible={$gameState.gamePhase === 'diagnosis'}>
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

  :global(body) {
    margin: 0;
    padding: 0;
  }

  :global(*) {
    box-sizing: border-box;
  }
</style>
