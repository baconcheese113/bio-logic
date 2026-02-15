<script lang="ts">
  import type { Instrument, Sample, Observation } from '../../shared/types';
  import { INSTRUMENT_ICONS, STATUS_COLORS } from '../../shared/types';
  import MicroscopeStage from './instruments/MicroscopeStage.svelte';

  interface Props {
    instrument: Instrument;
    samples: Sample[];
    observations: Observation[];
    onClose: () => void;
    onRecordObservation?: (observation: Omit<Observation, 'id' | 'timestamp'>) => void;
  }

  let { instrument, samples, observations, onClose, onRecordObservation }: Props = $props();

  const icon = $derived(INSTRUMENT_ICONS[instrument.type]);
  const statusColor = $derived(STATUS_COLORS[instrument.status]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="fullscreen" data-ref="instrument-detail-view">
  <header class="header-bar">
    <div class="flex items-center gap-md">
      <span class="icon-lg">{icon}</span>
      <h1>{instrument.name}</h1>
      <span class="tag" style:background={statusColor}>
        {instrument.status.toUpperCase()}
      </span>
    </div>
    <button class="btn-close" onclick={onClose} data-ref="btn-close-detail">
      ✕ Close
    </button>
  </header>

  <main class="fullscreen-content">
    {#if instrument.type === 'microscope'}
      <MicroscopeStage {instrument} {samples} {observations} {onRecordObservation} />
    {:else}
      <div class="text-center text-muted">
        <p class="icon-xl mb-md">{icon}</p>
        <p class="text-lg mb-sm">{instrument.name} detail view coming soon</p>
        <p>Input type: <code>{instrument.inputConfig.type}</code></p>
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
