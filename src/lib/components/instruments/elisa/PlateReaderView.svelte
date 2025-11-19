<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import InstrumentRightPanel from '../../shared/InstrumentRightPanel.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import { instrumentState, readElisaWell } from '../../../stores/instrument-state';
  import { setElisaPositiveControlOD, setElisaNegativeControlOD, setElisaSampleOD, setElisaAntibodiesDetected } from '../../../stores/evidence';

  let lastHoveredInfo = $state<string | null>(null);
  let selectedWell = $state<number | null>(null);
  let readingInProgress = $state(false);
  let currentReading = $state<number | null>(null);
  let scanningAll = $state(false);
  let scanProgress = $state(0);

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

  async function readAllWells() {
    scanningAll = true;
    scanProgress = 0;
    
    // Read wells sequentially with animated scanning
    for (let index = 0; index < $instrumentState.elisa.wells.length; index++) {
      scanProgress = index;
      await new Promise<void>((resolve) => {
        selectedWell = index;
        readingInProgress = true;
        currentReading = null;

        setTimeout(() => {
          const well = $instrumentState.elisa.wells[index];
          let absorbance = 0;

          if (well.wellType === 'positive-control') {
            absorbance = 1.8 + Math.random() * 0.4;
          } else if (well.wellType === 'negative-control') {
            absorbance = 0.08 + Math.random() * 0.05;
          } else if (well.wellType === 'blank') {
            absorbance = 0.02 + Math.random() * 0.03;
          } else if (well.wellType === 'sample') {
            absorbance = 1.2 + Math.random() * 0.6;
          }

          absorbance = Math.round(absorbance * 1000) / 1000;
          currentReading = absorbance;
          readElisaWell(index, absorbance);
          readingInProgress = false;
          resolve();
        }, 1500);
      });
    }
    
    scanningAll = false;
    selectedWell = null;
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

    const positiveAvg = avg(positiveODs);
    const negativeAvg = avg(negativeODs);
    const sampleAvg = avg(sampleODs);
    const cutoff = negativeAvg + 0.4; // Common cutoff calculation

    return {
      positiveAvg,
      negativeAvg,
      sampleAvg,
      cutoff,
    };
  });

  // Record evidence when measurements are available - use $effect to avoid state mutation in $derived
  $effect(() => {
    const stats = statistics();
    if (stats.positiveAvg > 0) setElisaPositiveControlOD(stats.positiveAvg);
    if (stats.negativeAvg > 0) setElisaNegativeControlOD(stats.negativeAvg);
    if (stats.sampleAvg > 0) {
      setElisaSampleOD(stats.sampleAvg);
      setElisaAntibodiesDetected(stats.sampleAvg > stats.cutoff);
    }
  });

  function getWellColor(well: any): string {
    if (well.absorbance === null) return '#f5f5f5';
    
    // Color intensity based on OD value
    if (well.absorbance > 1.5) return '#ffd700'; // High positive
    if (well.absorbance > 0.8) return '#ffe066'; // Moderate positive
    if (well.absorbance > 0.4) return '#fff4cc'; // Low positive
    return '#ffffee'; // Negative
  }

  // Calculate needle rotation angle for analog gauge
  const needleAngle = $derived(() => {
    if (currentReading === null) return -90;
    // Map 0-3.0 OD to -90 to +90 degrees
    const normalized = Math.min(currentReading / 3.0, 1.0);
    return -90 + (normalized * 180);
  });
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
          {#if scanningAll}
            <div class="scanning-indicator">
              <div class="scan-head" style="left: {(scanProgress / 16) * 100}%"></div>
              <div class="scan-message">Scanning well {scanProgress + 1}/16...</div>
            </div>
          {/if}
          
          <div class="plate-grid">
            {#each $instrumentState.elisa.wells as well, index}
              <button 
                class="reader-well"
                class:selected={selectedWell === index}
                class:reading={readingInProgress && selectedWell === index}
                class:scanned={well.absorbance !== null}
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

        <!-- Analog Gauge Display -->
        <div class="analog-gauge">
          <div class="gauge-container">
            <svg viewBox="0 0 200 120" class="gauge-svg">
              <!-- Gauge arc -->
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#444"
                stroke-width="2"
              />
              
              <!-- Tick marks -->
              {#each Array(11) as _, i}
                <line
                  x1={100 + 75 * Math.cos((Math.PI * (i / 10)) + Math.PI)}
                  y1={100 + 75 * Math.sin((Math.PI * (i / 10)) + Math.PI)}
                  x2={100 + 85 * Math.cos((Math.PI * (i / 10)) + Math.PI)}
                  y2={100 + 85 * Math.sin((Math.PI * (i / 10)) + Math.PI)}
                  stroke="#666"
                  stroke-width={i % 2 === 0 ? "2" : "1"}
                />
                {#if i % 2 === 0}
                  <text
                    x={100 + 65 * Math.cos((Math.PI * (i / 10)) + Math.PI)}
                    y={100 + 65 * Math.sin((Math.PI * (i / 10)) + Math.PI)}
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="#888"
                    font-size="10"
                  >
                    {(i * 0.3).toFixed(1)}
                  </text>
                {/if}
              {/each}
              
              <!-- Needle -->
              <line
                x1="100"
                y1="100"
                x2={100 + 70 * Math.cos((needleAngle() * Math.PI / 180) + Math.PI)}
                y2={100 + 70 * Math.sin((needleAngle() * Math.PI / 180) + Math.PI)}
                stroke="#d32f2f"
                stroke-width="2"
                class="gauge-needle"
              />
              
              <!-- Center pivot -->
              <circle cx="100" cy="100" r="4" fill="#d32f2f" />
            </svg>
            
            <div class="gauge-label">OPTICAL DENSITY</div>
            {#if currentReading !== null}
              <div class="gauge-digital">{currentReading.toFixed(3)} AU</div>
            {:else}
              <div class="gauge-digital">---</div>
            {/if}
          </div>
        </div>
      </div>
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <InstrumentRightPanel tabConfig="controls-inventory" showDiagnosis={false}>
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
  </InstrumentRightPanel>
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
    position: relative;
  }

  .scanning-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10;
    border-radius: 8px;
  }

  .scan-head {
    position: absolute;
    top: 2rem;
    width: 8px;
    height: calc(100% - 4rem);
    background: linear-gradient(90deg, transparent, #6a9fb5, transparent);
    box-shadow: 0 0 20px #6a9fb5;
    transition: left 1.5s ease-in-out;
  }

  .scan-message {
    color: #6a9fb5;
    font-size: 1.2rem;
    font-weight: bold;
    text-shadow: 0 0 10px #6a9fb5;
    z-index: 11;
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

  .reader-well.scanned {
    border-color: #4a8a5a;
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

  /* Analog Gauge Styles */
  .analog-gauge {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }

  .gauge-container {
    background: #2a2a2a;
    border: 4px solid #4a4a4a;
    border-radius: 12px;
    padding: 1.5rem;
    min-width: 280px;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .gauge-svg {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .gauge-needle {
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 0 3px #d32f2f);
  }

  .gauge-label {
    text-align: center;
    color: #888;
    font-size: 0.75rem;
    letter-spacing: 2px;
    margin-top: 0.5rem;
  }

  .gauge-digital {
    text-align: center;
    color: #00ff00;
    font-size: 1.8rem;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
    margin-top: 0.5rem;
    background: #1a1a1a;
    padding: 0.5rem;
    border-radius: 4px;
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
