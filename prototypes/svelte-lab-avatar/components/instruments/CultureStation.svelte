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

<div class="w-full max-w-[900px] p-md flex flex-col gap-md">
  {#if phase === 'workbench'}
    {#if loadedPlate}
      <div class="flex items-center gap-sm py-xs px-sm text-sm" style:color="var(--parchment-aged)">
        <span class="sample-dot" style:background={MEDIA_COLORS[selectedMedia].base}></span>
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
    <div class="flex items-center justify-center min-h-[300px]">
      <IncubationView
        mediaType={selectedMedia}
        {currentTick}
        {incubationStartTick}
        incubationDuration={INCUBATION_DURATION}
        onSkip={handleSkipIncubation}
      />
    </div>

  {:else if phase === 'reading'}
    <div class="flex items-center gap-md border-b-thin pb-sm">
      <h3 class="m-0 font-heading" style:color="var(--brass-light)">Read Colony Growth</h3>
      {#if quality}
        <span class="quality-badge quality-{quality.overallGrade}">
          {quality.overallGrade} ({quality.score}/100)
        </span>
      {/if}
    </div>

    <div class="flex gap-xl items-start">
      <ColonyPlateView
        {colonies}
        mediaType={selectedMedia}
        pickingEnabled={true}
        onColonyPicked={handleColonyPicked}
      />
      <div class="flex-1 min-w-[280px] max-w-[320px] flex flex-col gap-md">
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
        <button class="btn-sm" onclick={handleRestart}>Start New Plate</button>
      </div>
    </div>
  {/if}
</div>

<style>
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
</style>
