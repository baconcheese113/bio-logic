<script lang="ts">
  import { gameState } from './lib/stores/game-state';
  import CasePresentation from './lib/components/CasePresentation.svelte';
  import SampleSelection from './lib/components/SampleSelection.svelte';
  import MicroscopeView from './lib/components/MicroscopeView.svelte';
  import DiagnosisView from './lib/components/DiagnosisView.svelte';
</script>

<main>
  {#if $gameState.gamePhase === 'case-presentation'}
    <CasePresentation />
  {:else if $gameState.gamePhase === 'sample-selection'}
    <SampleSelection />
  {:else if $gameState.gamePhase === 'microscope-observation'}
    <MicroscopeView />
  {:else if $gameState.gamePhase === 'diagnosis'}
    <DiagnosisView />
  {/if}
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
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  :global(*) {
    box-sizing: border-box;
  }
</style>
