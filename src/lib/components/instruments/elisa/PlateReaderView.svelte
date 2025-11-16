<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import { instrumentState, readElisaWell } from '../../../stores/instrument-state';
  import { currentCase } from '../../../stores/game-state';

  let lastHoveredInfo = $state<string | null>(null);
  let selectedWell = $state<number | null>(null);
  let readingInProgress = $state(false);
  let currentReading = $state<number | null>(null);

  // Simulate plate reader taking measurements
  function readWell(wellIndex: number) {
    selectedWell = wellIndex;
    readingInProgress = true;
    currentReading = null;

    // Simulate reading delay (1970s spectrophotometer was slower)
    setTimeout(() => {
      const well = $instrumentState.elisa.wells[wellIndex];
      let absorbance = 0;

      // Calculate absorbance based on well type
      // Positive controls: high OD (1.5-2.5)
      if (well.wellType === 'positive-control') {
        absorbance = 1.8 + Math.random() * 0.4;
      }
      // Negative controls: low OD (0.05-0.15)
      else if (well.wellType === 'negative-control') {
        absorbance = 0.08 + Math.random() * 0.05;
      }
      // Blank: very low OD (0.02-0.05)
      else if (well.wellType === 'blank') {
        absorbance = 0.02 + Math.random() * 0.03;
      }
      // Patient samples: variable based on case (simulate positive result)
      else if (well.wellType === 'sample') {
        // For now, simulate a positive result (OD > cutoff of 0.5)
        absorbance = 1.2 + Math.random() * 0.6;
      }

      // Round to 3 decimal places (typical for 1970s plate readers)
      absorbance = Math.round(absorbance * 1000) / 1000;
      
      currentReading = absorbance;
      readElisaWell(wellIndex, absorbance);
      readingInProgress = false;
    }, 1500);
  }

  function readAllWells() {
    // Read wells sequentially (authentic to 1970s operation)
    let index = 0;
    const interval = setInterval(() => {
      if (index < $instrumentState.elisa.wells.length) {
        readWell(index);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1800);
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }

  // Calculate average OD for each well type
  const statistics = $derived(() => {
    const wells = $instrumentState.elisa.wells;
    const positiveODs = wells
      .filter(w => w.wellType === 'positive-control' && w.absorbance !== null)
      .map(w => w.absorbance as number);
    const negativeODs = wells
      .filter(w => w.wellType === 'negative-control' && w.absorbance !== null)
      .map(w => w.absorbance as number);
    const sampleODs = wells
      .filter(w => w.wellType === 'sample' && w.absorbance !== null)
      .map(w => w.absorbance as number);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      positiveAvg: avg(positiveODs),
      negativeAvg: avg(negativeODs),
      sampleAvg: avg(sampleODs),
      cutoff: avg(negativeODs) + 0.4, // Common cutoff calculation
    };
  });

  function getWellColor(well: any): string {
    if (well.absorbance === null) return '#f5f5f5';
    
    // Color intensity based on OD value
    if (well.absorbance > 1.5) return '#ffd700'; // High positive
    if (well.absorbance > 0.8) return '#ffe066'; // Moderate positive
    if (well.absorbance > 0.4) return '#fff4cc'; // Low positive
    return '#ffffee'; // Negative
  }
</script>

<div class="plate-reader-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <div class="reader-instrument">
        <div class="instrument-header">
          <h2>Spectrophotometer Plate Reader</h2>
          <p class="instrument-model">Titertek Multiskan (1970s)</p>
          <p class="wavelength">λ = 450nm (TMB substrate)</p>
        </div>

        <div class="plate-display">
          <div class="plate-grid">
            {#each $instrumentState.elisa.wells as well, index}
              <button 
                class="reader-well"
                class:selected={selectedWell === index}
                class:reading={readingInProgress && selectedWell === index}
                style="background-color: {getWellColor(well)}"
                onclick={() => readWell(index)}
              >
                <div class="well-id">{index + 1}</div>
                {#if well.absorbance !== null}
                  <div class="od-value">{well.absorbance.toFixed(3)}</div>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        {#if currentReading !== null}
          <div class="digital-display">
            <div class="display-label">OPTICAL DENSITY</div>
            <div class="display-value">{currentReading.toFixed(3)}</div>
            <div class="display-unit">AU @ 450nm</div>
          </div>
        {/if}
      </div>
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <div class="controls-panel">
    <CollapsibleSection title="Plate Reader Controls" isOpen={true}>
      <div class="control-buttons">
        <button 
          class="read-button"
          disabled={readingInProgress}
          onclick={() => readAllWells()}
          onmouseenter={() => setHoveredInfo('plate-reader')}
        >
          {readingInProgress ? 'Reading...' : 'Read All Wells'}
        </button>
      </div>

      <div class="instructions">
        <p>Click individual wells to read OD values</p>
        <p>Or use "Read All Wells" for sequential reading</p>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Results Summary" isOpen={true}>
      <div class="statistics">
        <div class="stat-row">
          <span class="stat-label">Positive Control:</span>
          <span class="stat-value">{statistics().positiveAvg.toFixed(3)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Negative Control:</span>
          <span class="stat-value">{statistics().negativeAvg.toFixed(3)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Sample Average:</span>
          <span class="stat-value">{statistics().sampleAvg.toFixed(3)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Cutoff Value:</span>
          <span class="stat-value">{statistics().cutoff.toFixed(3)}</span>
        </div>
        
        {#if statistics().sampleAvg > statistics().cutoff}
          <div class="result positive">
            POSITIVE - Antibodies Detected
          </div>
        {:else if statistics().sampleAvg > 0}
          <div class="result negative">
            NEGATIVE - No Antibodies
          </div>
        {/if}
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Interpretation Guide" isOpen={false}>
      <div class="interpretation-guide">
        <p onmouseenter={() => setHoveredInfo('positive-control')}>
          <strong>Positive Control:</strong> Should be &gt; 1.5 OD
        </p>
        <p onmouseenter={() => setHoveredInfo('negative-control')}>
          <strong>Negative Control:</strong> Should be &lt; 0.2 OD
        </p>
        <p onmouseenter={() => setHoveredInfo('reading-od')}>
          <strong>Sample:</strong> Positive if &gt; (Negative + 0.4)
        </p>
      </div>
    </CollapsibleSection>

    <NavigationButtons />
  </div>
</div>

<style>
  .plate-reader-view {
    width: 100%;
    height: 100%;
    display: flex;
    background: #1a1a1a;
  }

  .stage-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .reader-instrument {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  }

  .instrument-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .instrument-header h2 {
    color: #e0e0e0;
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
  }

  .instrument-model {
    color: #8a9fb5;
    margin: 0.25rem 0;
    font-style: italic;
  }

  .wavelength {
    color: #999;
    margin: 0.25rem 0;
    font-family: monospace;
  }

  .plate-display {
    background: #3a3a3a;
    border: 4px solid #5a5a5a;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }

  .plate-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .reader-well {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    border: 2px solid #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .reader-well:hover {
    transform: scale(1.05);
    border-color: #888;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.3);
  }

  .reader-well.selected {
    border-color: #6a9fb5;
    box-shadow: 0 0 12px rgba(106, 159, 181, 0.5);
  }

  .reader-well.reading {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .well-id {
    color: #333;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .od-value {
    color: #333;
    font-size: 0.75rem;
    font-family: monospace;
    margin-top: 0.2rem;
  }

  .digital-display {
    background: #1a1a1a;
    border: 3px solid #4a4a4a;
    border-radius: 8px;
    padding: 1.5rem 2rem;
    margin-top: 2rem;
    text-align: center;
    min-width: 300px;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .display-label {
    color: #666;
    font-size: 0.8rem;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
  }

  .display-value {
    color: #00ff00;
    font-size: 3rem;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  }

  .display-unit {
    color: #888;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .controls-panel {
    width: 280px;
    background: #2a2a2a;
    border-left: 2px solid #4a4a4a;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
    overflow-y: auto;
  }

  .control-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .read-button {
    background: #5a6a7a;
    color: #fff;
    border: 2px solid #6a7a8a;
    padding: 0.8rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
    transition: all 0.2s;
  }

  .read-button:hover:not(:disabled) {
    background: #6a7a8a;
  }

  .read-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .instructions {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #3a3a3a;
    border-radius: 4px;
  }

  .instructions p {
    color: #aaa;
    margin: 0.25rem 0;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .statistics {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem;
    background: #3a3a3a;
    border-radius: 4px;
  }

  .stat-label {
    color: #aaa;
    font-size: 0.8rem;
  }

  .stat-value {
    color: #e0e0e0;
    font-family: monospace;
    font-weight: bold;
  }

  .result {
    margin-top: 0.5rem;
    padding: 0.7rem;
    border-radius: 4px;
    text-align: center;
    font-weight: bold;
    font-size: 0.85rem;
  }

  .result.positive {
    background: #4a7c59;
    color: #fff;
    border: 2px solid #5a8c69;
  }

  .result.negative {
    background: #7c4a4a;
    color: #fff;
    border: 2px solid #8c5a5a;
  }

  .interpretation-guide p {
    color: #b0b0b0;
    margin: 0.5rem 0;
    font-size: 0.8rem;
    line-height: 1.6;
  }

  .interpretation-guide strong {
    color: #8a9fb5;
  }
</style>
