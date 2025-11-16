<script lang="ts">
  import { selectInstrument, returnToSampleSelection, currentCase } from '../stores/game-state';
  import { inventory } from '../stores/inventory';

  let lastHoveredInfo = $state<'microscope' | 'culture' | 'biochemical' | 'serology' | 'electrophoresis' | 'pcr' | 'gel' | null>(null);
  
  // Check if a sample is loaded
  const hasActiveSample = $derived($inventory.activeSampleId !== null);

  const INSTRUMENT_INFO = {
    microscope: {
      title: 'Optical Microscope',
      description: 'Examine stained samples under magnification to observe bacterial morphology, arrangement, and staining characteristics.'
    },
    culture: {
      title: 'Culture Plate',
      description: 'Grow bacteria on selective media to observe colony characteristics, hemolysis patterns, and growth requirements.'
    },
    biochemical: {
      title: 'Biochemical Tests',
      description: 'Perform catalase and coagulase tests to identify bacterial enzyme activity and differentiate species.'
    },
    serology: {
      title: 'Serology',
      description: 'Detect antibodies and antigens through agglutination reactions. Blood typing, immunity screening, and antibody detection for syphilis and other diseases.'
    },
    electrophoresis: {
      title: 'Protein Electrophoresis',
      description: 'Separate serum proteins by size and charge to identify abnormal protein patterns in blood disorders, liver disease, and immune conditions.'
    },
    pcr: {
      title: 'PCR Thermocycler',
      description: 'Amplify specific DNA sequences through thermal cycling to detect genetic markers for disease identification and antibiotic resistance.'
    },
    gel: {
      title: 'DNA Gel Electrophoresis',
      description: 'Visualize PCR products by separating DNA fragments by size on an agarose gel under UV light.'
    }
  };

  function handleInstrumentSelect(instrument: 'microscope' | 'culture' | 'biochemical' | 'serology' | 'electrophoresis' | 'pcr' | 'gel') {
    if (!hasActiveSample && instrument !== 'gel') {
      alert('Please load a sample from your inventory before using this instrument.');
      return;
    }
    selectInstrument(instrument);
  }

  function setHoveredInfo(instrument: 'microscope' | 'culture' | 'biochemical' | 'serology' | 'electrophoresis' | 'pcr' | 'gel' | null) {
    if (instrument !== null) {
      lastHoveredInfo = instrument;
    }
  }

  // Check if PCR is available for this case
  const showPCR = $derived($currentCase?.pcrTarget !== undefined);
</script>

<div class="instrument-selection">
  <div class="header">
    <button class="back-button" onclick={() => returnToSampleSelection()}>
      ← Back to Sample Selection
    </button>
    <h2>Select Analysis Method</h2>
  </div>

  <div class="instruments-container">
    <button 
      class="instrument-card"
      class:disabled={!hasActiveSample}
      onclick={() => handleInstrumentSelect('microscope')}
      onmouseenter={() => setHoveredInfo('microscope')}
      onmouseleave={() => setHoveredInfo(null)}
    >
      <div class="instrument-icon">🔬</div>
      <h3>Optical Microscope</h3>
      <p>Examine bacterial morphology with staining techniques</p>
      {#if !hasActiveSample}
        <span class="requires-sample">Requires active sample</span>
      {/if}
    </button>

    <button 
      class="instrument-card"
      class:disabled={!hasActiveSample}
      onclick={() => handleInstrumentSelect('culture')}
      onmouseenter={() => setHoveredInfo('culture')}
      onmouseleave={() => setHoveredInfo(null)}
    >
      <div class="instrument-icon">🧫</div>
      <h3>Culture Plate</h3>
      <p>Grow colonies on selective media</p>
      {#if !hasActiveSample}
        <span class="requires-sample">Requires active sample</span>
      {/if}
    </button>

    <button 
      class="instrument-card"
      class:disabled={!hasActiveSample}
      onclick={() => handleInstrumentSelect('biochemical')}
      onmouseenter={() => setHoveredInfo('biochemical')}
      onmouseleave={() => setHoveredInfo(null)}
    >
      <div class="instrument-icon">🧪</div>
      <h3>Biochemical Tests</h3>
      <p>Identify enzyme activity and metabolism</p>
      {#if !hasActiveSample}
        <span class="requires-sample">Requires active sample</span>
      {/if}
    </button>

    <button 
      class="instrument-card"
      class:disabled={!hasActiveSample}
      onclick={() => handleInstrumentSelect('serology')}
      onmouseenter={() => setHoveredInfo('serology')}
      onmouseleave={() => setHoveredInfo(null)}
    >
      <div class="instrument-icon">🩸</div>
      <h3>Serology</h3>
      <p>Blood typing and antibody detection</p>
      {#if !hasActiveSample}
        <span class="requires-sample">Requires active sample</span>
      {/if}
    </button>

    <button 
      class="instrument-card"
      class:disabled={!hasActiveSample}
      onclick={() => handleInstrumentSelect('electrophoresis')}
      onmouseenter={() => setHoveredInfo('electrophoresis')}
      onmouseleave={() => setHoveredInfo(null)}
    >
      <div class="instrument-icon">📊</div>
      <h3>Protein Electrophoresis</h3>
      <p>Analyze serum protein patterns</p>
      {#if !hasActiveSample}
        <span class="requires-sample">Requires active sample</span>
      {/if}
    </button>

    {#if showPCR}
      <button 
        class="instrument-card"
        class:disabled={!hasActiveSample}
        onclick={() => handleInstrumentSelect('pcr')}
        onmouseenter={() => setHoveredInfo('pcr')}
        onmouseleave={() => setHoveredInfo(null)}
      >
        <div class="instrument-icon">🧬</div>
        <h3>PCR Thermocycler</h3>
        <p>Amplify specific DNA sequences</p>
        {#if !hasActiveSample}
          <span class="requires-sample">Requires active sample</span>
        {/if}
      </button>
      
      <button 
        class="instrument-card"
        onclick={() => handleInstrumentSelect('gel')}
        onmouseenter={() => setHoveredInfo('gel')}
        onmouseleave={() => setHoveredInfo(null)}
      >
        <div class="instrument-icon">⚡</div>
        <h3>DNA Gel Electrophoresis</h3>
        <p>Visualize DNA fragments</p>
      </button>
    {/if}
  </div>

  <div class="info-panel">
    {#if lastHoveredInfo}
      <div class="info-content">
        <h4>{INSTRUMENT_INFO[lastHoveredInfo].title}</h4>
        <p>{INSTRUMENT_INFO[lastHoveredInfo].description}</p>
      </div>
    {:else}
      <div class="info-placeholder">
        Hover over an instrument to learn more
      </div>
    {/if}
  </div>
</div>

<style>
  .instrument-selection {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 2rem;
    background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
  }

  .header {
    margin-bottom: 2rem;
  }

  .back-button {
    background: none;
    border: 1px solid #4a4a4a;
    color: #ccc;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .back-button:hover {
    background: #3a3a3a;
    border-color: #6a6a6a;
  }

  h2 {
    color: #fff;
    font-size: 2rem;
    margin: 0;
  }

  .instruments-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    justify-content: center;
    flex: 1;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .instrument-card {
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 12px;
    padding: 2.5rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    position: relative;
  }

  .instrument-card:hover {
    border-color: #6a9fb5;
    background: #3a3a3a;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(106, 159, 181, 0.2);
  }
  
  .instrument-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .instrument-card.disabled:hover {
    border-color: #4a4a4a;
    background: #2a2a2a;
    transform: none;
    box-shadow: none;
  }
  
  .requires-sample {
    position: absolute;
    bottom: 0.5rem;
    font-size: 0.75rem;
    color: #ff6b6b;
    font-style: italic;
  }

  .instrument-icon {
    font-size: 4rem;
  }

  .instrument-card h3 {
    color: #fff;
    font-size: 1.5rem;
    margin: 0;
  }

  .instrument-card p {
    color: #aaa;
    text-align: center;
    margin: 0;
    font-size: 0.9rem;
  }

  .info-panel {
    background: #2a2a2a;
    border-top: 2px solid #4a4a4a;
    padding: 1.5rem 2rem;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-content {
    max-width: 800px;
    text-align: center;
  }

  .info-content h4 {
    color: #6a9fb5;
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
  }

  .info-content p {
    color: #ccc;
    margin: 0;
    line-height: 1.6;
  }

  .info-placeholder {
    color: #666;
    font-style: italic;
  }
</style>
