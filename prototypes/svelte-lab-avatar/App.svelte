<script lang="ts">
  import { createInitialLabState, generatePatient, WAITING_BENCHES, TILE_SIZE } from '../shared/mock-data';
  import type { LabState, Sample, GridPosition, SampleType, Patient, Observation, HeldItem, CulturePlate, MediaType } from '../shared/types';
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
  let selectedInstrumentId = $state<string | null>(null);
  let selectedPatientId = $state<string | null>(null);
  /** When set, shows full-screen instrument detail view */
  let viewingInstrumentId = $state<string | null>(null);
  /** Whether the notebook panel is open */
  let notebookOpen = $state(false);
  /** When set, shows diagnosis panel for this patient */
  let diagnosisPatientId = $state<string | null>(null);
  /** When set, shows supply shelf media picker */
  let supplyShelfOpen = $state(false);
  /** Culture plates loaded into instruments (keyed by instrumentId) */
  let loadedPlates = $state<Record<string, CulturePlate>>({});

  // Counter for generating unique sample IDs
  let sampleCounter = 0;
  let plateCounter = 0;

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
      if (loc.type === 'instrument') {
        const inst = labState.instruments.find(i => i.id === loc.instrumentId);
        isInColdStorage = inst?.type === 'ice-box';
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

  function handleInstrumentClick(instrumentId: string) {
    selectedInstrumentId = selectedInstrumentId === instrumentId ? null : instrumentId;
    selectedPatientId = null; // Deselect patient when selecting instrument
  }

  function handleInstrumentDoubleClick(instrumentId: string) {
    const instrument = labState.instruments.find(i => i.id === instrumentId);
    if (!instrument) return;
    if (!isAdjacent(labState.player.position, instrument.position)) return;
    viewingInstrumentId = instrumentId;
  }

  function handleCloseInstrumentView() {
    viewingInstrumentId = null;
  }

  function handlePatientClick(patientId: string) {
    const patient = labState.patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Only allow selection if player is adjacent to patient's bench
    if (!isAdjacent(labState.player.position, patient.benchPosition)) return;
    
    selectedPatientId = patientId;
    selectedInstrumentId = null; // Deselect instrument when selecting patient
  }

  function handleCollectSample(sampleType: SampleType) {
    if (!selectedPatientId) return;
    if (labState.player.heldItem) return; // Can only hold one item
    
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
    
    // Add sample to player's hand
    labState.player.heldItem = { kind: 'sample', sample: newSample };
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
    if (labState.player.heldItem) return;

    const sample = labState.samples.find(s => s.id === sampleId);
    if (!sample) return;

    const loc = sample.location;
    if (loc.type === 'instrument') {
      const instrument = labState.instruments.find(i => i.id === loc.instrumentId);
      if (instrument && isAdjacent(labState.player.position, instrument.position)) {
        labState.player.heldItem = { kind: 'sample', sample: { ...sample } };
        
        const inst = labState.instruments.find(i => i.id === loc.instrumentId);
        if (inst) {
          const slot = inst.slots.find(s => s.sampleId === sampleId);
          if (slot) slot.sampleId = null;
        }

        labState.samples = labState.samples.map(s =>
          s.id === sampleId ? { ...s, location: { type: 'player' as const } } : s
        );
      }
    }
  }

  function handleSampleDrop(instrumentId: string) {
    if (!labState.player.heldItem || labState.player.heldItem.kind !== 'sample') return;

    const instrument = labState.instruments.find(i => i.id === instrumentId);
    if (!instrument) return;

    if (!isAdjacent(labState.player.position, instrument.position)) return;

    const emptySlot = instrument.slots.find(s => s.sampleId === null);
    if (!emptySlot) return;

    const sampleId = labState.player.heldItem.sample.id;

    emptySlot.sampleId = sampleId;

    labState.samples = labState.samples.map(s =>
      s.id === sampleId
        ? { ...s, location: { type: 'instrument' as const, instrumentId, slotIndex: emptySlot.index } }
        : s
    );

    labState.player.heldItem = null;
  }

  function handleCollectPlate(mediaType: MediaType) {
    if (labState.player.heldItem) return;
    
    const MEDIA_LABELS: Record<MediaType, string> = {
      'blood-agar': 'Blood Agar',
      'macconkey': 'MacConkey',
      'nutrient-agar': 'Nutrient Agar',
    };
    
    plateCounter++;
    const plate: CulturePlate = {
      id: `plate-${plateCounter}`,
      mediaType,
      label: MEDIA_LABELS[mediaType],
    };
    
    labState.player.heldItem = { kind: 'plate', plate };
    supplyShelfOpen = false;
  }

  function handleSupplyShelfClick() {
    // Find the supply shelf tile
    for (let y = 0; y < labState.height; y++) {
      for (let x = 0; x < labState.width; x++) {
        if (labState.grid[y][x].type === 'supply-shelf') {
          if (isAdjacent(labState.player.position, { x, y })) {
            if (labState.player.heldItem) return; // hands full
            supplyShelfOpen = true;
            return;
          }
        }
      }
    }
  }

  function handleItemDrop(instrumentId: string) {
    if (!labState.player.heldItem) return;
    if (labState.player.heldItem.kind === 'sample') {
      handleSampleDrop(instrumentId);
    } else if (labState.player.heldItem.kind === 'plate') {
      // Drop plate into culture workbench
      const instrument = labState.instruments.find(i => i.id === instrumentId);
      if (!instrument || instrument.type !== 'culture-incubator') return;
      if (!isAdjacent(labState.player.position, instrument.position)) return;
      if (loadedPlates[instrumentId]) return; // already has a plate
      
      loadedPlates = { ...loadedPlates, [instrumentId]: labState.player.heldItem.plate };
      labState.player.heldItem = null;
    }
  }

  let observationCounter = 0;

  function handleRecordObservation(obs: Omit<Observation, 'id' | 'timestamp'>) {
    // Check if observation already exists for this patient+instrument+field
    const existingIndex = labState.observations.findIndex(
      o => o.patientId === obs.patientId && 
           o.instrumentType === obs.instrumentType && 
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

  const selectedInstrument = $derived(
    selectedInstrumentId
      ? labState.instruments.find(i => i.id === selectedInstrumentId) ?? null
      : null
  );

  const viewingInstrument = $derived(
    viewingInstrumentId
      ? labState.instruments.find(i => i.id === viewingInstrumentId) ?? null
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
  {#if viewingInstrument}
    <InstrumentDetailView
      instrument={viewingInstrument}
      samples={labState.samples.filter(s =>
        s.location.type === 'instrument' && s.location.instrumentId === viewingInstrument.id
      )}
      observations={labState.observations}
      patients={labState.patients}
      currentTick={labState.currentTick}
      loadedPlate={loadedPlates[viewingInstrument.id] ?? null}
      onClose={handleCloseInstrumentView}
      onRecordObservation={handleRecordObservation}
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
        <SampleHUD heldItem={labState.player.heldItem} />
        
        <NotebookPanel 
          observations={labState.observations}
          isOpen={notebookOpen}
          onToggle={() => notebookOpen = !notebookOpen}
        />

        <LabGrid
          {labState}
          {selectedInstrumentId}
          onInstrumentClick={handleInstrumentClick}
          onInstrumentDoubleClick={handleInstrumentDoubleClick}
          onCameraChange={handleCameraChange}
          onTileClick={handleTileClick}
          onSamplePickup={handleSamplePickup}
          onSampleDrop={handleItemDrop}
          onPatientClick={handlePatientClick}
          onSupplyShelfClick={handleSupplyShelfClick}
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
          playerHasItem={labState.player.heldItem !== null}
          hasObservations={selectedPatientHasObservations}
          onCollectSample={handleCollectSample}
          onSubmitDiagnosis={handleOpenDiagnosis}
        />
      {:else}
        <InstrumentPanel
          instrument={selectedInstrument}
          samples={labState.samples}
          playerPosition={labState.player.position}
          heldItem={labState.player.heldItem}
          onDrop={() => selectedInstrument && handleItemDrop(selectedInstrument.id)}
          onOpen={() => selectedInstrument && (viewingInstrumentId = selectedInstrument.id)}
        />
      {/if}

      {#if supplyShelfOpen}
        <div class="overlay" onclick={() => supplyShelfOpen = false}>
          <div class="card" onclick={(e) => e.stopPropagation()}>
            <div class="card-header">
              <span class="icon-lg">🗄️</span>
              <h2>Supply Shelf</h2>
            </div>
            <p class="mb-md" style="color: var(--parchment-aged)">Select a prepared plate:</p>
            <div class="flex flex-col gap-sm">
              <button class="btn" onclick={() => handleCollectPlate('blood-agar')}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#8b3a3a;margin-right:8px"></span>
                Blood Agar
              </button>
              <button class="btn" onclick={() => handleCollectPlate('macconkey')}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#c97b8b;margin-right:8px"></span>
                MacConkey
              </button>
              <button class="btn" onclick={() => handleCollectPlate('nutrient-agar')}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#c9b896;margin-right:8px"></span>
                Nutrient Agar
              </button>
            </div>
          </div>
        </div>
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
