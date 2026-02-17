<script lang="ts">
  import type { Fixture, Sample, Observation, Patient, MediaType, ActivePrep } from '../../shared/types';
  import { FIXTURE_DEFS, detectWorkbenchMode } from '../../shared/types';
  import DetailView from './ui/DetailView.svelte';
  import MicroscopeStage from './instruments/MicroscopeStage.svelte';
  import CultureStation from './instruments/CultureStation.svelte';
  import PrepStation from './instruments/PrepStation.svelte';

  interface Props {
    furniture: Fixture;
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

  const def = $derived(FIXTURE_DEFS[furniture.type]);
  const mode = $derived(detectWorkbenchMode(furniture.items));
</script>

<DetailView icon={def.icon} title={furniture.name} tag={mode} {onClose}>
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
</DetailView>
