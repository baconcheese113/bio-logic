<script lang="ts">
  import { createInitialLabState } from './lib/mock-data';
  import type { LabState, GridPosition, SampleType, Item, ActivePrep } from './lib/types';
  import {
    isAdjacent, movePlayerTo,
    collectSample, placeItem, pickupFromFixture, takeFromCabinet,
    checkPrepCompletion,
    submitDiagnosis,
    updateSampleDegradation, updatePatientPatience, maybeSpawnNewPatient,
  } from './lib/game-actions';
  import type { Diagnosis } from './lib/types';

  import LabGrid from './components/lab/LabGrid.svelte';
  import ClockBar from './components/hud/ClockBar.svelte';
  import FixturePanel from './components/panels/FixturePanel.svelte';
  import CarryingBar from './components/hud/CarryingBar.svelte';
  import WorkbenchView from './components/workbench/WorkbenchView.svelte';
  import PatientPanel from './components/panels/PatientPanel.svelte';
  import NotebookPanel from './components/panels/NotebookPanel.svelte';
  import DiagnosisPanel from './components/panels/DiagnosisPanel.svelte';
  import ModalOverlay from './components/ui/ModalOverlay.svelte';
  import ItemSlot from './components/ui/ItemSlot.svelte';
  import ReferenceView from './components/reference/ReferenceView.svelte';
  import CodexStreakDashboard from './components/reference/codex-streak/pipeline-harness.svelte';

  // ── Reactive state ──

  let labState = $state<LabState>(createInitialLabState());
  let activePreps = $state<ActivePrep[]>([]);

  // UI-only selection state
  let selectedFixtureId = $state<string | null>(null);
  let selectedPatientId = $state<string | null>(null);
  let viewingFixtureId = $state<string | null>('workbench-centrifuge');
  let notebookOpen = $state(false);
  let diagnosisPatientId = $state<string | null>(null);
  let cabinetOpenId = $state<string | null>(null);

  const CODEX_STREAK_DASHBOARD_ROUTE = '#/reference/codex-streak/pipeline';
  const legacyCodexStreakRoutes = new Set([
    '#/reference/codex-streak',
    '#/reference/codex-streak/transfer',
    '#/reference/codex-streak/seeding',
    '#/reference/codex-streak/growth',
  ]);

  // ── Hash route ──
  let currentRoute = $state(window.location.hash);
  $effect(() => {
    const handler = () => currentRoute = window.location.hash;
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  });

  const displayRoute = $derived(
    legacyCodexStreakRoutes.has(currentRoute)
      ? CODEX_STREAK_DASHBOARD_ROUTE
      : currentRoute,
  );

  $effect(() => {
    if (currentRoute === displayRoute) return;
    const canonicalUrl = `${window.location.pathname}${window.location.search}${CODEX_STREAK_DASHBOARD_ROUTE}`;
    window.history.replaceState(null, '', canonicalUrl);
  });

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

  function handleSubmitDiagnosis(diagnosis: Diagnosis) {
    if (diagnosisPatientId) {
      submitDiagnosis(labState, diagnosisPatientId, diagnosis);
      diagnosisPatientId = null;
    }
  }
  const viewingSamples = $derived(
    viewingFixture
      ? labState.samples.filter(s => s.location.type === 'fixture' && s.location.fixtureId === viewingFixture.id)
      : [],
  );
</script>

<div class="app-container">
  {#if displayRoute === CODEX_STREAK_DASHBOARD_ROUTE}
    <CodexStreakDashboard />
  {:else if displayRoute === '#/reference'}
    <ReferenceView />
  {:else if viewingFixture}
    <WorkbenchView
      fixture={viewingFixture}
      samples={viewingSamples}
      onClose={() => viewingFixtureId = null}
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
        <CarryingBar carrying={labState.player.carrying} carryCapacity={labState.player.carryCapacity} />
        
        <NotebookPanel 
          observations={labState.observations}
          isOpen={notebookOpen}
          onToggle={() => notebookOpen = !notebookOpen}
        />

        <LabGrid
          {labState}
          selectedFixtureId={selectedFixtureId}
          onFixtureClick={handleFixtureClick}
          onFixtureDoubleClick={handleFixtureDoubleClick}
          onCameraChange={(c) => { labState.camera = { ...c }; }}
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
        <FixturePanel
          fixture={selectedFixture}
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
          <ModalOverlay onClose={() => cabinetOpenId = null}>
            <div class="card-header">
              <span class="icon-lg">🗄️</span>
              <h2>{cabinet.name}</h2>
            </div>
            <p class="mb-md text-parchment-aged">Take a supply:</p>
            <div class="flex flex-col gap-sm">
              {#each cabinet.items as item (item.id)}
                <ItemSlot {item} onClick={() => handleCabinetTake(item)} />
              {/each}
            </div>
          </ModalOverlay>
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
