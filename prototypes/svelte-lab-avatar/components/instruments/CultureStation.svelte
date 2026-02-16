<script lang="ts">
  import type { Furniture, Sample, Observation, CultureFindings, Patient, CulturePlateState } from '../../../shared/types';
  import type { MediaType, DensityGrid, Colony, StreakQuality } from './culture/streak-types';
  import { MEDIA_COLORS } from './culture/streak-types';
  import { generateColoniesFromGrid, computeGridQuality } from './culture/colony-generator';
  import CultureWorkbench from './culture/CultureWorkbench.svelte';
  import IncubationView from './culture/IncubationView.svelte';
  import ColonyPlateView from './culture/ColonyPlateView.svelte';
  import CultureObservations from './culture/CultureObservations.svelte';

  interface Props {
    furniture: Furniture;
    samples: Sample[];
    observations: Observation[];
    patients: Patient[];
    currentTick: number;
    onRecordObservation?: (observation: Omit<Observation, 'id' | 'timestamp'>) => void;
  }

  let { furniture, samples, observations, patients, currentTick, onRecordObservation }: Props = $props();

  // --- Derived from furniture contents ---
  const loadedPlate = $derived(
    furniture.contents.find((i): i is Extract<typeof i, { kind: 'culture-plate' }> => i.kind === 'culture-plate')?.plate ?? null
  );
  const loadedSample = $derived(samples[0] ?? null);
  const patient = $derived(
    loadedSample ? patients.find(p => p.id === loadedSample.patientId) ?? null : null
  );
  const caseFindings = $derived<CultureFindings | null>(
    patient?.findings?.culture ?? null
  );
  const patientName = $derived(loadedSample?.label.split(' - ')[1] ?? 'Unknown');
  
  // Derive media type from the loaded plate
  const selectedMedia = $derived<MediaType>(loadedPlate?.mediaType ?? 'blood-agar');
  const bothLoaded = $derived(loadedSample !== null && loadedPlate !== null);

  // --- Phase: workbench → incubating → reading ---
  type StationPhase = 'workbench' | 'incubating' | 'reading';
  let phase = $state<StationPhase>('workbench');

  // Incubation / results state
  let densityGrid = $state<DensityGrid | null>(null);
  let contaminationCount = $state(0);
  let lidExposure = $state(0);
  let quality = $state<StreakQuality | null>(null);
  let colonies = $state<Colony[]>([]);
  let selectedColony = $state<Colony | null>(null);
  let incubationStartTick = $state(0);
  const INCUBATION_DURATION = 600;

  // --- Handlers ---

  function handleStreakComplete(grid: DensityGrid, contamEvents: number) {
    densityGrid = grid;
    contaminationCount = contamEvents;
    incubationStartTick = currentTick;
    phase = 'incubating';
  }

  function generateAndShowColonies() {
    if (!densityGrid) return;
    const findings: CultureFindings = caseFindings ?? {
      growth: true,
      hemolysis: 'beta',
      colonyColor: 'golden',
      gramType: 'positive',
    };
    colonies = generateColoniesFromGrid({
      grid: densityGrid,
      findings,
      mediaType: selectedMedia,
      contaminationEvents: contaminationCount,
      lidExposure,
    });
    quality = computeGridQuality(densityGrid, colonies);
    phase = 'reading';
  }

  function handleSkipIncubation() { generateAndShowColonies(); }

  function handleColonyPicked(colony: Colony) { selectedColony = colony; }

  function handleRestart() {
    phase = 'workbench';
    densityGrid = null;
    contaminationCount = 0;
    lidExposure = 0;
    quality = null;
    colonies = [];
    selectedColony = null;
  }

  // Auto-complete incubation
  $effect(() => {
    if (phase === 'incubating' && currentTick - incubationStartTick >= INCUBATION_DURATION) {
      generateAndShowColonies();
    }
  });
</script>

<div class="culture-station">
  {#if phase === 'workbench'}
    {#if loadedPlate}
      <div class="media-info">
        <span class="media-swatch" style:background={MEDIA_COLORS[selectedMedia].base}></span>
        <span>{MEDIA_COLORS[selectedMedia].label} plate</span>
      </div>
    {/if}

    <CultureWorkbench
      {loadedSample}
      {loadedPlate}
      mediaType={selectedMedia}
      onStreakComplete={handleStreakComplete}
    />

  {:else if phase === 'incubating'}
    <div class="phase-centered">
      <IncubationView
        mediaType={selectedMedia}
        {currentTick}
        {incubationStartTick}
        incubationDuration={INCUBATION_DURATION}
        onSkip={handleSkipIncubation}
      />
    </div>

  {:else if phase === 'reading'}
    <div class="phase-header">
      <h3>Read Colony Growth</h3>
      {#if quality}
        <span class="quality-badge quality-{quality.overallGrade}">
          {quality.overallGrade} ({quality.score}/100)
        </span>
      {/if}
    </div>

    <div class="reading-layout">
      <ColonyPlateView
        {colonies}
        mediaType={selectedMedia}
        pickingEnabled={true}
        onColonyPicked={handleColonyPicked}
      />
      <div class="reading-controls">
        {#if onRecordObservation && loadedSample}
          <CultureObservations
            patientId={loadedSample.patientId}
            caseId={loadedSample.caseId}
            {patientName}
            mediaType={selectedMedia}
            {observations}
            {onRecordObservation}
          />
        {/if}
        <button class="btn-restart" onclick={handleRestart}>Start New Plate</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .culture-station {
    width: 100%;
    max-width: 900px;
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }



  /* Media info display (replaces media selector bar) */
  .media-info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.85rem;
    color: var(--parchment-aged);
  }
  .media-swatch {
    width: 12px; height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.15);
  }

  .phase-centered {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  .phase-header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    border-bottom: var(--border-thin);
    padding-bottom: var(--space-sm);
  }
  .phase-header h3 {
    margin: 0;
    color: var(--brass-light);
    font-family: var(--font-heading);
  }

  .quality-badge {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .quality-excellent { background: #2a4a2a; color: #6cba6c; }
  .quality-good { background: #2a3a4a; color: #6ca8d0; }
  .quality-fair { background: #4a3a1a; color: #e0a840; }
  .quality-poor { background: #4a2a2a; color: #d06c6c; }
  .quality-none { background: #3a3a3a; color: #888; }

  .reading-layout {
    display: flex;
    gap: var(--space-xl);
    align-items: flex-start;
  }
  .reading-controls {
    flex: 1;
    min-width: 280px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .btn-restart {
    background: var(--bg-medium);
    border: var(--border-thin);
    color: var(--parchment-aged);
    padding: var(--space-sm) var(--space-md);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  .btn-restart:hover { border-color: var(--brass); }
</style>
