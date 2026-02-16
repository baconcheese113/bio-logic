<script lang="ts">
  import type { Observation } from '../../../../shared/types';
  import type { MediaType } from './streak-types';

  interface Props {
    patientId: string;
    caseId: string;
    patientName: string;
    mediaType: MediaType;
    observations: Observation[];
    onRecordObservation: (observation: Omit<Observation, 'id' | 'timestamp'>) => void;
  }

  let { patientId, caseId, patientName, mediaType, observations, onRecordObservation }: Props = $props();

  // Observation state
  let selectedGrowth = $state<string | null>(null);
  let selectedColor = $state<string | null>(null);
  let selectedHemolysis = $state<string | null>(null);
  let selectedLactose = $state<string | null>(null);

  const isOnGelatin = $derived(mediaType === 'gelatin');

  // Sync from existing observations
  const existingObs = $derived(
    observations.filter(o => o.patientId === patientId && o.source === 'culture')
  );

  let initializedFor = $state<string | null>(null);
  $effect.pre(() => {
    if (patientId !== initializedFor) {
      initializedFor = patientId;
      selectedGrowth = existingObs.find(o => o.field === 'growth')?.value ?? null;
      selectedColor = existingObs.find(o => o.field === 'colony-color')?.value ?? null;
      selectedHemolysis = existingObs.find(o => o.field === 'hemolysis')?.value ?? null;
      selectedLactose = existingObs.find(o => o.field === 'lactose-fermentation')?.value ?? null;
    }
  });

  const canRecord = $derived(selectedGrowth !== null && selectedColor !== null);

  function recordObservations() {
    if (!canRecord) return;

    const fields: Array<{ field: string; value: string }> = [];
    if (selectedGrowth) fields.push({ field: 'growth', value: selectedGrowth });
    if (selectedColor) fields.push({ field: 'colony-color', value: selectedColor });
    if (selectedHemolysis) fields.push({ field: 'hemolysis', value: selectedHemolysis });
    if (selectedLactose) fields.push({ field: 'lactose-fermentation', value: selectedLactose });

    for (const { field, value } of fields) {
      onRecordObservation({
        patientId,
        caseId,
        patientName,
        source: 'culture',
        field,
        value,
      });
    }
  }

  const growthOptions = ['heavy', 'moderate', 'light', 'none'];
  const colorOptions: Array<{ value: string; label: string; hex: string }> = [
    { value: 'golden', label: 'Golden', hex: '#daa520' },
    { value: 'white', label: 'White', hex: '#f5f5dc' },
    { value: 'cream', label: 'Cream', hex: '#fffdd0' },
    { value: 'gray', label: 'Gray', hex: '#a0a0a0' },
    { value: 'green', label: 'Green', hex: '#6b8e5a' },
  ];
  const hemolysisOptions = [
    { value: 'beta', label: 'Beta (clear)' },
    { value: 'alpha', label: 'Alpha (green)' },
    { value: 'gamma', label: 'Gamma (none)' },
  ];
  const lactoseOptions = [
    { value: 'fermenter', label: 'Fermenter (pink)' },
    { value: 'non-fermenter', label: 'Non-fermenter' },
  ];
</script>

<div class="p-md rounded-md" style:background="var(--bg-medium)">
  <h4 class="m-0 mb-sm text-xs" style:color="var(--brass)">What do you observe?</h4>

  <div class="obs-group">
    <span class="obs-label">Growth:</span>
    <div class="flex flex-wrap gap-xs">
      {#each growthOptions as opt}
        <button
          class="obs-btn"
          class:selected={selectedGrowth === opt}
          onclick={() => selectedGrowth = opt}
        >{opt}</button>
      {/each}
    </div>
  </div>

  <div class="obs-group">
    <span class="obs-label">Colony Color:</span>
    <div class="flex flex-wrap gap-xs">
      {#each colorOptions as opt}
        <button
          class="obs-btn color-btn"
          class:selected={selectedColor === opt.value}
          onclick={() => selectedColor = opt.value}
        >
          <span class="color-swatch" style:background={opt.hex}></span>
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="obs-group">
    <span class="obs-label">Hemolysis:</span>
    <div class="flex flex-wrap gap-xs">
      {#each hemolysisOptions as opt}
        <button
          class="obs-btn"
          class:selected={selectedHemolysis === opt.value}
          onclick={() => selectedHemolysis = opt.value}
        >{opt.label}</button>
      {/each}
    </div>
  </div>

  {#if isOnGelatin}
    <div class="obs-group">
      <span class="obs-label">Gelatin Liquefaction:</span>
      <div class="flex flex-wrap gap-xs">
        {#each lactoseOptions as opt}
          <button
            class="obs-btn"
            class:selected={selectedLactose === opt.value}
            onclick={() => selectedLactose = opt.value}
          >{opt.label}</button>
        {/each}
      </div>
    </div>
  {/if}

  <button
    class="btn btn-primary record-btn"
    disabled={!canRecord}
    onclick={recordObservations}
  >
    Record Observations
  </button>
</div>

<style>
  .obs-group {
    margin-bottom: var(--space-sm);
  }

  .obs-label {
    display: block;
    font-size: 0.8rem;
    color: var(--brass);
    margin-bottom: var(--space-xs);
    text-transform: uppercase;
  }

  .obs-btn {
    padding: 4px 8px;
    font-size: 0.8rem;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--parchment);
    cursor: pointer;
    transition: all 0.15s;
    text-transform: capitalize;
  }

  .obs-btn:hover { border-color: var(--brass); }
  .obs-btn.selected {
    background: var(--brass);
    color: var(--bg-darkest);
    border-color: var(--brass-light);
  }

  .color-swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
</style>
