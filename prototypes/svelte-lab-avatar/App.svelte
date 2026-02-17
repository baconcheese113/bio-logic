<script lang="ts">
  import { createInitialLabState, TILE_SIZE } from '../shared/mock-data';
  import type { LabState, GridPosition, SampleType, Item, MediaType, ActivePrep } from '../shared/types';
  import { getItemIcon, getItemLabel, FIXTURE_DEFS } from '../shared/types';
  import {
    isAdjacent, movePlayerTo,
    collectSample, pickupSample, placeItem, pickupFromFixture, takeFromCabinet,
    startPrep, checkPrepCompletion,
    recordObservation, submitDiagnosis,
    updateSampleDegradation, updatePatientPatience, maybeSpawnNewPatient,
  } from '../shared/game-actions';
  import type { Diagnosis } from '../shared/types';

  import LabGrid from './components/LabGrid.svelte';
  import ClockBar from './components/ClockBar.svelte';
  import InstrumentPanel from './components/InstrumentPanel.svelte';
  import SampleHUD from './components/SampleHUD.svelte';
  import InstrumentDetailView from './components/InstrumentDetailView.svelte';
  import PatientPanel from './components/PatientPanel.svelte';
  import NotebookPanel from './components/NotebookPanel.svelte';
  import DiagnosisPanel from './components/DiagnosisPanel.svelte';

  // ── Reactive state ──

  let labState = $state<LabState>(createInitialLabState());
  let activePreps = $state<ActivePrep[]>([]);

  // UI-only selection state
  let selectedFixtureId = $state<string | null>(null);
  let selectedPatientId = $state<string | null>(null);
  let viewingFixtureId = $state<string | null>(null);
  let notebookOpen = $state(false);
  let diagnosisPatientId = $state<string | null>(null);
  let cabinetOpenId = $state<string | null>(null);

  // ── Tick loop ──

  let tickInterval: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (tickInterval) clearInterval(tickInterval);

    if (!labState.isPaused) {
      tickInterval = setInterval(() => {
        labState.currentTick += labState.speed;
        updateSampleDegradation(labState);

        const departed = updatePatientPatience(labState);
        for (const id of departed) {
          if (selectedPatientId === id) selectedPatientId = null;
        }

        maybeSpawnNewPatient(labState);
        activePreps = checkPrepCompletion(labState, activePreps);
      }, 100);
    }

    return () => { if (tickInterval) clearInterval(tickInterval); };
  });

  // ── Derived ──

  const selectedFixture = $derived(
    selectedFixtureId ? labState.fixtures.find(f => f.id === selectedFixtureId) ?? null : null
  );
  const viewingFixture = $derived(
    viewingFixtureId ? labState.fixtures.find(f => f.id === viewingFixtureId) ?? null : null
  );
  const selectedPatient = $derived(
    selectedPatientId ? labState.patients.find(p => p.id === selectedPatientId) ?? null : null
  );
  const diagnosisPatient = $derived(
    diagnosisPatientId ? labState.patients.find(p => p.id === diagnosisPatientId) ?? null : null
  );
  const selectedPatientHasObservations = $derived(
    selectedPatientId ? labState.observations.some(o => o.patientId === selectedPatientId) : false
  );
  const diagnosisPatientObservations = $derived(
    diagnosisPatientId ? labState.observations.filter(o => o.patientId === diagnosisPatientId) : []
  );

  // ── Event handlers (thin wrappers around game-actions) ──

  function handleFixtureClick(fixtureId: string) {
    selectedFixtureId = selectedFixtureId === fixtureId ? null : fixtureId;
    selectedPatientId = null;
  }

  function handleFixtureDoubleClick(fixtureId: string) {
    const furn = labState.fixtures.find(f => f.id === fixtureId);
    if (!furn || !isAdjacent(labState.player.position, furn.position)) return;
    if (furn.type === 'cabinet') { cabinetOpenId = fixtureId; return; }
    viewingFixtureId = fixtureId;
  }

  function handlePatientClick(patientId: string) {
    const patient = labState.patients.find(p => p.id === patientId);
    if (!patient || !isAdjacent(labState.player.position, patient.benchPosition)) return;
    selectedPatientId = patientId;
    selectedFixtureId = null;
  }

  function handleCollectSample(sampleType: SampleType) {
    if (!selectedPatientId) return;
    collectSample(labState, selectedPatientId, sampleType);
    selectedPatientId = null;
  }

  function handleTileClick(position: GridPosition) {
    if (labState.grid[position.y]?.[position.x]?.walkable) {
      movePlayerTo(labState, position);
    }
  }

  function handleItemDrop(fixtureId: string) {
    placeItem(labState, fixtureId);
  }

  function handlePickup(fixtureId: string, idx: number) {
    pickupFromFixture(labState, fixtureId, idx);
  }

  function handleCabinetTake(item: Item) {
    if (cabinetOpenId) {
      takeFromCabinet(labState, cabinetOpenId, item);
      cabinetOpenId = null;
    }
  }

  function handlePrepMedia(fixtureId: string, mediaType: MediaType) {
    activePreps = startPrep(labState, activePreps, fixtureId, mediaType);
  }

  function handleSubmitDiagnosis(diagnosis: Diagnosis) {
    if (diagnosisPatientId) {
      submitDiagnosis(labState, diagnosisPatientId, diagnosis);
      diagnosisPatientId = null;
    }
  }
</script>

<div class="app-container">
  {#if viewingFixture}
    <InstrumentDetailView
      furniture={viewingFixture}
      samples={labState.samples.filter(s =>
        s.location.type === 'fixture' && s.location.fixtureId === viewingFixture.id
      )}
      observations={labState.observations}
      patients={labState.patients}
      currentTick={labState.currentTick}
      activePrep={activePreps.find(p => p.fixtureId === viewingFixture.id) ?? null}
      onClose={() => viewingFixtureId = null}
      onRecordObservation={(obs) => recordObservation(labState, obs)}
      onPrepMedia={handlePrepMedia}
    />
  {:else}
    <ClockBar
      currentTick={labState.currentTick}
      speed={labState.speed}
      isPaused={labState.isPaused}
      onSpeedChange={(s) => labState.speed = s}
      onPauseToggle={() => labState.isPaused = !labState.isPaused}
    />

    <div class="main-content">
      <div class="lab-viewport">
        <SampleHUD carrying={labState.player.carrying} carryCapacity={labState.player.carryCapacity} />
        
        <NotebookPanel 
          observations={labState.observations}
          isOpen={notebookOpen}
          onToggle={() => notebookOpen = !notebookOpen}
        />

        <LabGrid
          {labState}
          selectedFurnitureId={selectedFixtureId}
          onFurnitureClick={handleFixtureClick}
          onFurnitureDoubleClick={handleFixtureDoubleClick}
          onCameraChange={(c) => labState.camera = c}
          onTileClick={handleTileClick}
          onItemDrop={handleItemDrop}
          onPatientClick={handlePatientClick}
        />
      </div>

      {#if diagnosisPatient}
        <DiagnosisPanel
          patient={diagnosisPatient}
          observations={diagnosisPatientObservations}
          onSubmit={handleSubmitDiagnosis}
          onCancel={() => diagnosisPatientId = null}
        />
      {:else if selectedPatient}
        <PatientPanel
          patient={selectedPatient}
          playerHasItem={labState.player.carrying.length > 0}
          hasObservations={selectedPatientHasObservations}
          onCollectSample={handleCollectSample}
          onSubmitDiagnosis={() => {
            if (selectedPatientId) { diagnosisPatientId = selectedPatientId; selectedPatientId = null; }
          }}
        />
      {:else}
        <InstrumentPanel
          furniture={selectedFixture}
          samples={labState.samples}
          playerPosition={labState.player.position}
          carrying={labState.player.carrying}
          carryCapacity={labState.player.carryCapacity}
          onDrop={() => selectedFixture && handleItemDrop(selectedFixture.id)}
          onPickup={(idx) => selectedFixture && handlePickup(selectedFixture.id, idx)}
          onOpen={() => selectedFixture && (viewingFixtureId = selectedFixture.id)}
        />
      {/if}

      {#if cabinetOpenId}
        {@const cabinet = labState.fixtures.find(f => f.id === cabinetOpenId)}
        {#if cabinet}
          <div class="overlay" onclick={() => cabinetOpenId = null}>
            <div class="card" onclick={(e) => e.stopPropagation()}>
              <div class="card-header">
                <span class="icon-lg">🗄️</span>
                <h2>{cabinet.name}</h2>
              </div>
              <p class="mb-md text-parchment-aged">Take a supply:</p>
              <div class="flex flex-col gap-sm">
                {#each cabinet.items as item}
                  <button class="btn" onclick={() => handleCabinetTake(item)}>
                    {getItemIcon(item)} {getItemLabel(item)}
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-darkest);
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .lab-viewport {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
</style>
