<script lang="ts">
  import { createInitialLabState, generatePatient, WAITING_BENCHES, TILE_SIZE } from '../shared/mock-data';
  import type { LabState, Sample, GridPosition, SampleType, Patient, Observation, Fixture, Item, CulturePlateState, MediaType, ActivePrep } from '../shared/types';
  import { getCarryingLoad, getItemSize, getItemIcon, getItemLabel, FIXTURE_DEFS, ITEM_DEFS, detectWorkbenchMode, MEDIA_RECIPES, consumeRecipeIngredients, isPortable } from '../shared/types';
  import LabGrid from './components/LabGrid.svelte';
  import ClockBar from './components/ClockBar.svelte';
  import InstrumentPanel from './components/InstrumentPanel.svelte';
  import SampleHUD from './components/SampleHUD.svelte';
  import InstrumentDetailView from './components/InstrumentDetailView.svelte';
  import PatientPanel from './components/PatientPanel.svelte';
  import NotebookPanel from './components/NotebookPanel.svelte';
  import DiagnosisPanel from './components/DiagnosisPanel.svelte';
  import type { Diagnosis } from '../shared/types';

  let labState = $state<LabState>(createInitialLabState());
  let selectedFixtureId = $state<string | null>(null);
  let selectedPatientId = $state<string | null>(null);
  /** When set, shows full-screen fixture detail view */
  let viewingFixtureId = $state<string | null>(null);
  /** Whether the notebook panel is open */
  let notebookOpen = $state(false);
  /** When set, shows diagnosis panel for this patient */
  let diagnosisPatientId = $state<string | null>(null);
  /** When set, shows cabinet contents picker */
  let cabinetOpenId = $state<string | null>(null);
  /** Background media preparations in progress */
  let activePreps = $state<ActivePrep[]>([]);

  // Counters for generating unique IDs
  let sampleCounter = 0;
  let plateCounter = 0;
  let itemCounter = 100; // offset from mock-data's counter

  // Tick simulation for degradation and patience
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (tickInterval) clearInterval(tickInterval);
    
    if (!labState.isPaused) {
      tickInterval = setInterval(() => {
        labState.currentTick += labState.speed;
        updateSampleDegradation();
        updatePatientPatience();
        maybeSpawnNewPatient();
        checkPrepCompletion();
      }, 100); // Update 10 times per second
    }

    return () => {
      if (tickInterval) clearInterval(tickInterval);
    };
  });

  function updatePatientPatience() {
    let patientsChanged = false;
    
    const updatedPatients = labState.patients.map(patient => {
      const newPatience = patient.patienceTicks - labState.speed;
      if (newPatience !== patient.patienceTicks) {
        patientsChanged = true;
        return { ...patient, patienceTicks: newPatience };
      }
      return patient;
    });

    // Remove patients who ran out of patience
    const remainingPatients = updatedPatients.filter(p => p.patienceTicks > 0);
    
    if (remainingPatients.length < updatedPatients.length) {
      // Clear bench tiles for departed patients
      updatedPatients
        .filter(p => p.patienceTicks <= 0)
        .forEach(p => {
          const { x, y } = p.benchPosition;
          if (labState.grid[y]?.[x]) {
            labState.grid[y][x].patientId = null;
          }
          // If this patient was selected, deselect
          if (selectedPatientId === p.id) {
            selectedPatientId = null;
          }
        });
    }

    if (patientsChanged || remainingPatients.length < updatedPatients.length) {
      labState.patients = remainingPatients;
    }
  }

  function maybeSpawnNewPatient() {
    // Spawn new patient if there's an empty bench
    const emptyBench = WAITING_BENCHES.find(bench => {
      const tile = labState.grid[bench.y]?.[bench.x];
      return tile && tile.type === 'waiting-bench' && !tile.patientId;
    });

    if (emptyBench && Math.random() < 0.0005 * labState.speed) {
      const newPatient = generatePatient(emptyBench, labState.currentTick);
      labState.grid[emptyBench.y][emptyBench.x].patientId = newPatient.id;
      labState.patients = [...labState.patients, newPatient];
    }
  }

  function updateSampleDegradation() {
    // Samples degrade over time unless in cold storage (ice box)
    const degradationRate = 0.0001; // per tick
    const spoilThreshold = 0.3;
    const degradeThreshold = 0.6;

    labState.samples = labState.samples.map(sample => {
      // Check if in ice box (slows degradation significantly)
      let isInColdStorage = false;
      const loc = sample.location;
      if (loc.type === 'fixture') {
        const furn = labState.fixtures.find(f => f.id === loc.fixtureId);
        isInColdStorage = furn?.type === 'ice-box';
      }
      
      const age = labState.currentTick - sample.collectedAtTick;
      const effectiveAge = isInColdStorage ? age * 0.1 : age;
      const freshness = Math.max(0, 1 - effectiveAge * degradationRate);

      let condition: Sample['condition'] = 'fresh';
      if (freshness < spoilThreshold) {
        condition = 'spoiled';
      } else if (freshness < degradeThreshold) {
        condition = 'degraded';
      }

      return { ...sample, condition };
    });
  }

  function handleSpeedChange(speed: number) {
    labState.speed = speed;
  }

  function handlePauseToggle() {
    labState.isPaused = !labState.isPaused;
  }

  function handleInstrumentClick(furnitureId: string) {
    selectedFixtureId = selectedFixtureId === furnitureId ? null : furnitureId;
    selectedPatientId = null;
  }

  function handleInstrumentDoubleClick(furnitureId: string) {
    const furn = labState.fixtures.find(f => f.id === furnitureId);
    if (!furn) return;
    if (!isAdjacent(labState.player.position, furn.position)) return;
    
    // Cabinets open an overlay picker instead of detail view
    if (furn.type === 'cabinet') {
      cabinetOpenId = furnitureId;
      return;
    }
    viewingFixtureId = furnitureId;
  }

  function handleCloseInstrumentView() {
    viewingFixtureId = null;
  }

  function handlePatientClick(patientId: string) {
    const patient = labState.patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Only allow selection if player is adjacent to patient's bench
    if (!isAdjacent(labState.player.position, patient.benchPosition)) return;
    
    selectedPatientId = patientId;
    selectedFixtureId = null; // Deselect fixture when selecting patient
  }

  function handleCollectSample(sampleType: SampleType) {
    if (!selectedPatientId) return;
    
    const player = labState.player;
    const load = getCarryingLoad(player.carrying);
    if (load >= player.carryCapacity) return; // hands full
    
    const patient = labState.patients.find(p => p.id === selectedPatientId);
    if (!patient) return;
    
    // Check adjacency
    if (!isAdjacent(labState.player.position, patient.benchPosition)) return;
    
    // Check sample is available
    if (!patient.availableSamples.includes(sampleType)) return;
    if (patient.collectedSamples.includes(sampleType)) return;
    
    // Create the sample
    sampleCounter++;
    const newSample: Sample = {
      id: `sample-${sampleCounter}`,
      type: sampleType,
      caseId: patient.caseId,
      patientId: patient.id,
      condition: 'fresh',
      collectedAtTick: labState.currentTick,
      location: { type: 'player' },
      label: `${sampleType.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} - ${patient.name}`,
    };
    
    // Add sample-vial item to player's carrying (id matches sample for cross-reference)
    labState.player.carrying = [...labState.player.carrying, { id: newSample.id, type: 'sample-vial' as const, quantity: 1 }];
    labState.samples = [...labState.samples, newSample];
    
    // Mark sample as collected on patient
    labState.patients = labState.patients.map(p => 
      p.id === patient.id 
        ? { ...p, collectedSamples: [...p.collectedSamples, sampleType] }
        : p
    );
    
    // Close panel after collecting
    selectedPatientId = null;
  }

  function handleCameraChange(camera: LabState['camera']) {
    labState.camera = camera;
  }

  function handleTileClick(position: GridPosition) {
    const tile = labState.grid[position.y]?.[position.x];
    if (tile?.walkable) {
      movePlayerTo(position);
    }
  }

  function movePlayerTo(target: GridPosition) {
    labState.player = {
      ...labState.player,
      isMoving: true,
      targetPosition: target,
    };

    setTimeout(() => {
      labState.player = {
        ...labState.player,
        position: target,
        isMoving: false,
        targetPosition: null,
        facing: getDirection(labState.player.position, target),
      };
    }, 300);
  }

  function getDirection(from: GridPosition, to: GridPosition): 'up' | 'down' | 'left' | 'right' {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  function handleSamplePickup(sampleId: string) {
    const player = labState.player;
    const load = getCarryingLoad(player.carrying);
    if (load >= player.carryCapacity) return;

    const sample = labState.samples.find(s => s.id === sampleId);
    if (!sample) return;

    const loc = sample.location;
    if (loc.type === 'fixture') {
      const furn = labState.fixtures.find(f => f.id === loc.fixtureId);
      if (furn && isAdjacent(labState.player.position, furn.position)) {
        // Find and remove the sample-vial item (id matches sample id)
        const vialItem = furn.items.find(i => i.id === sampleId);
        if (!vialItem) return;
        furn.items = furn.items.filter(i => i.id !== sampleId);
        
        labState.player.carrying = [...labState.player.carrying, vialItem];
        labState.samples = labState.samples.map(s =>
          s.id === sampleId ? { ...s, location: { type: 'player' as const } } : s
        );
      }
    }
  }

  function handleItemDrop(furnitureId: string) {
    if (labState.player.carrying.length === 0) return;

    const furn = labState.fixtures.find(f => f.id === furnitureId);
    if (!furn) return;
    if (!isAdjacent(labState.player.position, furn.position)) return;

    const def = FIXTURE_DEFS[furn.type];
    if (furn.items.length >= def.capacity) return;

    // Drop the first item from carrying
    const [dropped, ...rest] = labState.player.carrying;
    
    // Add to fixture items
    furn.items = [...furn.items, dropped];
    labState.player.carrying = rest;

    // If item is a sample vial, update sample location
    if (dropped.type === 'sample-vial') {
      labState.samples = labState.samples.map(s =>
        s.id === dropped.id
          ? { ...s, location: { type: 'fixture' as const, fixtureId: furnitureId } }
          : s
      );
    }
  }

  function handlePrepMedia(furnitureId: string, mediaType: MediaType) {
    const furn = labState.fixtures.find(f => f.id === furnitureId);
    if (!furn) return;

    // Don't start if already prepping on this bench
    if (activePreps.some(p => p.fixtureId === furnitureId)) return;

    // Consume ingredients immediately
    furn.items = consumeRecipeIngredients(furn.items, mediaType);

    // Start background prep timer
    const recipe = MEDIA_RECIPES[mediaType];
    activePreps = [...activePreps, {
      fixtureId: furnitureId,
      mediaType,
      startTick: labState.currentTick,
      duration: recipe.prepTicks,
    }];
  }

  function checkPrepCompletion() {
    const completed = activePreps.filter(p =>
      labState.currentTick - p.startTick >= p.duration
    );

    if (completed.length === 0) return;

    for (const prep of completed) {
      const furn = labState.fixtures.find(f => f.id === prep.fixtureId);
      if (!furn) continue;

      plateCounter++;
      const plateId = `plate-${plateCounter}`;
      const plateItem: Item = {
        id: plateId,
        type: 'empty-dish',
        quantity: 1,
        contents: {
          substance: prep.mediaType,
          volume: 1,
          sealed: false,
          meta: { kind: 'prepared-media' as const, cooledAtTick: labState.currentTick },
        },
      };
      furn.items = [...furn.items, plateItem];
    }

    activePreps = activePreps.filter(p =>
      labState.currentTick - p.startTick < p.duration
    );
  }

  function handleCabinetTake(item: Item) {
    const player = labState.player;
    const load = getCarryingLoad(player.carrying);
    if (load + getItemSize(item) > player.carryCapacity) return;
    
    if (cabinetOpenId) {
      const cabinet = labState.fixtures.find(f => f.id === cabinetOpenId);
      if (cabinet) {
        const idx = cabinet.items.findIndex(i => i.type === item.type);
        if (idx >= 0) {
          const existing = cabinet.items[idx];
          if (existing.quantity > 1) {
            cabinet.items = cabinet.items.map((c, i) =>
              i === idx ? { ...c, quantity: c.quantity - 1 } : c
            );
          } else {
            cabinet.items = cabinet.items.filter((_, i) => i !== idx);
          }
        }
      }
    }
    
    // Create a new single-quantity item for the player
    itemCounter++;
    const newItem: Item = { id: `item-${itemCounter}`, type: item.type, quantity: 1 };
    labState.player.carrying = [...labState.player.carrying, newItem];
    cabinetOpenId = null;
  }

  function handlePickupFromFurniture(furnitureId: string, itemIndex: number) {
    const player = labState.player;
    const furn = labState.fixtures.find(f => f.id === furnitureId);
    if (!furn) return;
    if (!isAdjacent(player.position, furn.position)) return;
    
    const item = furn.items[itemIndex];
    if (!item) return;
    
    // Don't pick up non-portable items (equipment fixed to the bench)
    if (!isPortable(item)) return;
    
    const load = getCarryingLoad(player.carrying);
    if (load + getItemSize(item) > player.carryCapacity) return;
    
    // Remove from fixture
    furn.items = furn.items.filter((_, i) => i !== itemIndex);
    
    // Add to carrying
    labState.player.carrying = [...labState.player.carrying, item];
    
    // Update sample location if applicable
    if (item.type === 'sample-vial') {
      labState.samples = labState.samples.map(s =>
        s.id === item.id
          ? { ...s, location: { type: 'player' as const } }
          : s
      );
    }
  }

  let observationCounter = 0;

  function handleRecordObservation(obs: Omit<Observation, 'id' | 'timestamp'>) {
    // Check if observation already exists for this patient+source+field
    const existingIndex = labState.observations.findIndex(
      o => o.patientId === obs.patientId && 
           o.source === obs.source && 
           o.field === obs.field
    );
    
    if (existingIndex >= 0) {
      // Replace existing observation
      labState.observations = labState.observations.map((o, i) => 
        i === existingIndex 
          ? { ...o, value: obs.value, timestamp: labState.currentTick }
          : o
      );
    } else {
      // Add new observation
      observationCounter++;
      const newObservation: Observation = {
        ...obs,
        id: `obs-${observationCounter}`,
        timestamp: labState.currentTick,
      };
      labState.observations = [...labState.observations, newObservation];
    }
  }

  function isAdjacent(a: GridPosition, b: GridPosition): boolean {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1);
  }

  const selectedFixture = $derived(
    selectedFixtureId
      ? labState.fixtures.find(f => f.id === selectedFixtureId) ?? null
      : null
  );

  const viewingFixture = $derived(
    viewingFixtureId
      ? labState.fixtures.find(f => f.id === viewingFixtureId) ?? null
      : null
  );

  const selectedPatient = $derived(
    selectedPatientId
      ? labState.patients.find(p => p.id === selectedPatientId) ?? null
      : null
  );

  const diagnosisPatient = $derived(
    diagnosisPatientId
      ? labState.patients.find(p => p.id === diagnosisPatientId) ?? null
      : null
  );

  // Check if selected patient has any observations recorded
  const selectedPatientHasObservations = $derived(
    selectedPatientId 
      ? labState.observations.some(o => o.patientId === selectedPatientId)
      : false
  );

  // Get observations for the diagnosis patient
  const diagnosisPatientObservations = $derived(
    diagnosisPatientId
      ? labState.observations.filter(o => o.patientId === diagnosisPatientId)
      : []
  );

  function handleOpenDiagnosis() {
    if (selectedPatientId) {
      diagnosisPatientId = selectedPatientId;
      selectedPatientId = null; // Close patient panel
    }
  }

  function handleCloseDiagnosis() {
    diagnosisPatientId = null;
  }

  function handleSubmitDiagnosis(diagnosis: Diagnosis) {
    if (!diagnosisPatient) return;
    
    const correct = diagnosisPatient.correctDiagnosis;
    const isCorrect = 
      diagnosis.organism === correct.organism &&
      diagnosis.category === correct.category &&
      diagnosis.treatment === correct.treatment;
    
    // Update patient status based on diagnosis accuracy
    labState.patients = labState.patients.map(p => 
      p.id === diagnosisPatientId
        ? { 
            ...p, 
            status: isCorrect ? 'treated' : 'worsened',
            diagnosisResult: {
              submitted: diagnosis,
              correct: correct,
              isCorrect,
            }
          }
        : p
    );
    
    diagnosisPatientId = null;
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
      onClose={handleCloseInstrumentView}
      onRecordObservation={handleRecordObservation}
      onPrepMedia={handlePrepMedia}
    />
  {:else}
    <ClockBar
      currentTick={labState.currentTick}
      speed={labState.speed}
      isPaused={labState.isPaused}
      onSpeedChange={handleSpeedChange}
      onPauseToggle={handlePauseToggle}
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
          onFurnitureClick={handleInstrumentClick}
          onFurnitureDoubleClick={handleInstrumentDoubleClick}
          onCameraChange={handleCameraChange}
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
          onCancel={handleCloseDiagnosis}
        />
      {:else if selectedPatient}
        <PatientPanel
          patient={selectedPatient}
          playerHasItem={labState.player.carrying.length > 0}
          hasObservations={selectedPatientHasObservations}
          onCollectSample={handleCollectSample}
          onSubmitDiagnosis={handleOpenDiagnosis}
        />
      {:else}
        <InstrumentPanel
          furniture={selectedFixture}
          samples={labState.samples}
          playerPosition={labState.player.position}
          carrying={labState.player.carrying}
          carryCapacity={labState.player.carryCapacity}
          onDrop={() => selectedFixture && handleItemDrop(selectedFixture.id)}
          onPickup={(idx) => selectedFixture && handlePickupFromFurniture(selectedFixture.id, idx)}
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
