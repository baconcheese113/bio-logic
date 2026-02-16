<script lang="ts">
  import type { Furniture, Sample, Observation, Patient, CulturePlateState, MediaType, ActivePrep } from '../../shared/types';
  import { FURNITURE_DEFS, detectWorkbenchMode } from '../../shared/types';
  import MicroscopeStage from './instruments/MicroscopeStage.svelte';
  import CultureStation from './instruments/CultureStation.svelte';
  import PrepStation from './instruments/PrepStation.svelte';

  interface Props {
    furniture: Furniture;
    samples: Sample[];
    observations: Observation[];
    patients: Patient[];
    currentTick: number;
    activePrep: ActivePrep | null;
    onClose: () => void;
    onRecordObservation?: (observation: Omit<Observation, 'id' | 'timestamp'>) => void;
    onPrepMedia?: (furnitureId: string, mediaType: MediaType) => void;
  }

  let { furniture, samples, observations, patients, currentTick, activePrep, onClose, onRecordObservation, onPrepMedia }: Props = $props();

  const def = $derived(FURNITURE_DEFS[furniture.type]);
  const mode = $derived(detectWorkbenchMode(furniture.contents));

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="fullscreen" data-ref="furniture-detail-view">
  <header class="header-bar">
    <div class="flex items-center gap-md">
      <span class="icon-lg">{def.icon}</span>
      <h1>{furniture.name}</h1>
      <span class="tag">{mode}</span>
    </div>
    <button class="btn-close" onclick={onClose} data-ref="btn-close-detail">
      ✕ Close
    </button>
  </header>

  <main class="fullscreen-content">
    {#if mode === 'microscope'}
      <MicroscopeStage {furniture} {samples} {observations} {onRecordObservation} />
    {:else if mode === 'culture'}
      <CultureStation {furniture} {samples} {observations} {patients} {currentTick} {onRecordObservation} />
    {:else if mode === 'prep'}
      <PrepStation {furniture} {currentTick} {activePrep} onPrepStart={(mediaType) => onPrepMedia?.(furniture.id, mediaType)} />
    {:else}
      <div class="text-center text-muted">
        <p class="icon-xl mb-md">{def.icon}</p>
        <p class="text-lg mb-sm">{furniture.name} detail view coming soon</p>
        <p>Mode: <code>{mode}</code></p>
      </div>
    {/if}
  </main>

  <footer class="footer-bar">
    <p>Press <kbd>ESC</kbd> or click Close to return to lab</p>
  </footer>
</div>

<style>
  h1 {
    margin: 0;
  }

  .text-lg {
    font-size: 1.25rem;
  }
</style>
