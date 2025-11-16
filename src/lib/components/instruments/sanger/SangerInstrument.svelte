<script lang="ts">
  import type { DdNTPType } from '../../../../data/organisms';

  interface Props {
    currentStage: 'preparation' | 'reaction-setup' | 'thermal-cycling' | 'gel-loading' | 'gel-running' | 'sequence-reading';
    selectedDdNTPs: DdNTPType[];
  }

  let { currentStage, selectedDdNTPs }: Props = $props();

  // Internal state
  let templatePrepared = $state(false);
  let primerAdded = $state(false);
  let polymeraseAdded = $state(false);
  let isCycling = $state(false);
  let gelLoaded = $state(false);
  let gelRunning = $state(false);
  let gelComplete = $state(false);
  let sequenceRevealed = $state(false);

  // DNA sequence to display (example sequence)
  const DNA_SEQUENCE = 'ATCGATCGATCGATCG';
  
  // Gel lanes for each ddNTP (simulate band positions)
  const gelLanes = $derived({
    ddATP: DNA_SEQUENCE.split('').map((base, i) => base === 'A' ? i + 1 : -1).filter(x => x > 0),
    ddTTP: DNA_SEQUENCE.split('').map((base, i) => base === 'T' ? i + 1 : -1).filter(x => x > 0),
    ddGTP: DNA_SEQUENCE.split('').map((base, i) => base === 'G' ? i + 1 : -1).filter(x => x > 0),
    ddCTP: DNA_SEQUENCE.split('').map((base, i) => base === 'C' ? i + 1 : -1).filter(x => x > 0),
  });

  // Public methods for parent component
  export function showTemplatePrepared() {
    templatePrepared = true;
  }

  export function showPrimerAdded() {
    primerAdded = true;
  }

  export function updateDdNTPs(ddntps: DdNTPType[]) {
    // Visual update handled by props
  }

  export function showPolymeraseAdded() {
    polymeraseAdded = true;
  }

  export function startCycling() {
    isCycling = true;
  }

  export function completeCycling() {
    isCycling = false;
  }

  export function loadGel() {
    gelLoaded = true;
  }

  export function startGelRun() {
    gelRunning = true;
  }

  export function completeGelRun() {
    gelRunning = false;
    gelComplete = true;
  }

  export function revealSequence() {
    sequenceRevealed = true;
  }

  export function reset() {
    templatePrepared = false;
    primerAdded = false;
    polymeraseAdded = false;
    isCycling = false;
    gelLoaded = false;
    gelRunning = false;
    gelComplete = false;
    sequenceRevealed = false;
  }
</script>

<div class="sanger-instrument">
  {#if currentStage === 'preparation' || currentStage === 'reaction-setup' || currentStage === 'thermal-cycling'}
    <!-- Reaction tube visualization -->
    <div class="reaction-area">
      <div class="vintage-panel">
        <div class="panel-header">SANGER SEQUENCING REACTION</div>
        
        <div class="reaction-tube-container">
          <div class="tube-rack">
            <!-- Main reaction tube -->
            <div class="reaction-tube">
              <div class="tube-label">Reaction Mix</div>
              <div class="tube-glass">
                {#if templatePrepared}
                  <div class="liquid template"></div>
                {/if}
                {#if primerAdded}
                  <div class="liquid primer"></div>
                {/if}
                {#if selectedDdNTPs.length > 0}
                  <div class="liquid ddntps" style="opacity: {selectedDdNTPs.length / 4}"></div>
                {/if}
                {#if polymeraseAdded}
                  <div class="liquid polymerase"></div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Component indicators -->
          <div class="component-status">
            <div class="status-item" class:active={templatePrepared}>
              <span class="indicator">●</span>
              <span>DNA Template</span>
            </div>
            <div class="status-item" class:active={primerAdded}>
              <span class="indicator">●</span>
              <span>Sequencing Primer</span>
            </div>
            <div class="status-item" class:active={selectedDdNTPs.length > 0}>
              <span class="indicator">●</span>
              <span>ddNTPs ({selectedDdNTPs.length}/4)</span>
            </div>
            <div class="status-item" class:active={polymeraseAdded}>
              <span class="indicator">●</span>
              <span>DNA Polymerase</span>
            </div>
          </div>
        </div>

        {#if currentStage === 'thermal-cycling'}
          <div class="thermal-cycler">
            <div class="cycler-display">
              <div class="display-title">THERMAL CYCLER</div>
              {#if isCycling}
                <div class="temp-indicator cycling">
                  <span class="temp-value">94°C</span>
                  <span class="temp-label">Cycling...</span>
                </div>
              {:else}
                <div class="temp-indicator">
                  <span class="temp-value">25°C</span>
                  <span class="temp-label">Standby</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if currentStage === 'gel-loading' || currentStage === 'gel-running' || currentStage === 'sequence-reading'}
    <!-- Gel electrophoresis visualization -->
    <div class="gel-area">
      <div class="vintage-panel">
        <div class="panel-header">POLYACRYLAMIDE GEL ELECTROPHORESIS</div>
        
        <div class="gel-box">
          <div class="gel-container">
            <div class="gel" class:running={gelRunning}>
              <!-- Electrode markers -->
              <div class="electrode top">− Cathode</div>
              <div class="electrode bottom">+ Anode</div>

              <!-- Gel lanes -->
              <div class="gel-lanes">
                {#each ['ddATP', 'ddTTP', 'ddGTP', 'ddCTP'] as ddntp}
                  {@const isSelected = selectedDdNTPs.includes(ddntp as DdNTPType)}
                  {@const lanes = gelLanes[ddntp as DdNTPType]}
                  
                  <div class="lane" class:inactive={!isSelected}>
                    <div class="lane-label">{ddntp}</div>
                    <div class="lane-track">
                      {#if gelComplete && isSelected}
                        {#each lanes as position}
                          <div 
                            class="band {ddntp.toLowerCase()}"
                            style="top: {position * 5}%"
                            class:revealed={sequenceRevealed}
                          ></div>
                        {/each}
                      {/if}
                      
                      {#if gelLoaded && !gelComplete && isSelected}
                        <div class="loading-sample" class:migrating={gelRunning}></div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>

              {#if currentStage === 'sequence-reading' && sequenceRevealed}
                <div class="sequence-overlay">
                  <div class="sequence-title">DNA Sequence (5' → 3')</div>
                  <div class="sequence-display">
                    {#each DNA_SEQUENCE.split('') as base, i}
                      <span class="base base-{base.toLowerCase()}">{base}</span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <div class="gel-info">
            <div class="info-row">
              <span class="label">Gel Type:</span>
              <span class="value">Polyacrylamide</span>
            </div>
            <div class="info-row">
              <span class="label">Buffer:</span>
              <span class="value">TBE</span>
            </div>
            <div class="info-row">
              <span class="label">Voltage:</span>
              <span class="value">{gelRunning ? '1500V' : '0V'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .sanger-instrument {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    padding: 2rem;
  }

  .vintage-panel {
    background: #2a2a2a;
    border: 3px solid #4a4a4a;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .panel-header {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffd700;
    text-align: center;
    padding: 0.75rem;
    border-bottom: 2px solid #4a4a4a;
    margin-bottom: 1.5rem;
    font-family: 'Courier New', monospace;
    letter-spacing: 2px;
  }

  /* Reaction Area Styles */
  .reaction-area {
    min-width: 500px;
  }

  .reaction-tube-container {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }

  .tube-rack {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 2rem;
    background: #1a1a1a;
    border-radius: 8px;
  }

  .reaction-tube {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .tube-label {
    font-size: 0.9rem;
    color: #aaa;
    font-weight: bold;
  }

  .tube-glass {
    width: 80px;
    height: 200px;
    background: linear-gradient(to bottom, rgba(200, 200, 255, 0.1), rgba(200, 200, 255, 0.2));
    border: 3px solid #5a5a5a;
    border-radius: 0 0 8px 8px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .liquid {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    transition: all 0.5s ease;
  }

  .liquid.template {
    background: rgba(100, 150, 255, 0.3);
    height: 40px;
  }

  .liquid.primer {
    background: rgba(255, 200, 100, 0.3);
    height: 50px;
  }

  .liquid.ddntps {
    background: rgba(255, 100, 255, 0.3);
    height: 60px;
  }

  .liquid.polymerase {
    background: rgba(100, 255, 100, 0.3);
    height: 80px;
  }

  .component-status {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
    transition: all 0.3s;
  }

  .status-item.active {
    color: #5fb86c;
  }

  .status-item .indicator {
    font-size: 1.5rem;
  }

  .thermal-cycler {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #1a1a1a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
  }

  .cycler-display {
    text-align: center;
  }

  .display-title {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 1rem;
    font-family: 'Courier New', monospace;
  }

  .temp-indicator {
    padding: 1rem;
    background: #0a0a0a;
    border-radius: 4px;
  }

  .temp-value {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: #6a9fb5;
    font-family: 'Courier New', monospace;
  }

  .temp-label {
    display: block;
    font-size: 0.9rem;
    color: #888;
    margin-top: 0.5rem;
  }

  .temp-indicator.cycling .temp-value {
    color: #ff6b6b;
    animation: pulse 1s ease-in-out infinite;
  }

  /* Gel Area Styles */
  .gel-area {
    min-width: 700px;
  }

  .gel-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .gel-container {
    background: #1a1a1a;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .gel {
    width: 100%;
    height: 500px;
    background: linear-gradient(to bottom, #1a1a2a 0%, #2a2a3a 100%);
    border: 3px solid #4a4a4a;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }

  .gel.running {
    box-shadow: 0 0 20px rgba(106, 159, 181, 0.4);
  }

  .electrode {
    position: absolute;
    left: 0;
    right: 0;
    padding: 0.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: #888;
    font-family: 'Courier New', monospace;
  }

  .electrode.top {
    top: 0;
    background: linear-gradient(to bottom, rgba(255, 100, 100, 0.2), transparent);
  }

  .electrode.bottom {
    bottom: 0;
    background: linear-gradient(to top, rgba(100, 100, 255, 0.2), transparent);
  }

  .gel-lanes {
    display: flex;
    height: 100%;
    padding: 3rem 1rem;
  }

  .lane {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lane.inactive {
    opacity: 0.3;
  }

  .lane-label {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 1rem;
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .lane-track {
    flex: 1;
    width: 60px;
    background: rgba(100, 100, 100, 0.1);
    border: 1px solid #3a3a3a;
    position: relative;
  }

  .loading-sample {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: rgba(255, 255, 255, 0.3);
    transition: top 3s linear;
  }

  .loading-sample.migrating {
    top: calc(100% - 20px);
  }

  .band {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0;
    transition: opacity 0.5s;
  }

  .band.revealed {
    opacity: 1;
  }

  .band.ddatp {
    background: #00ff00;
    box-shadow: 0 0 8px #00ff00;
  }

  .band.ddttp {
    background: #ff0000;
    box-shadow: 0 0 8px #ff0000;
  }

  .band.ddgtp {
    background: #ffffff;
    box-shadow: 0 0 8px #ffffff;
  }

  .band.ddctp {
    background: #0000ff;
    box-shadow: 0 0 8px #0000ff;
  }

  .sequence-overlay {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #ffd700;
    border-radius: 4px;
    padding: 1rem;
  }

  .sequence-title {
    font-size: 0.9rem;
    color: #ffd700;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  .sequence-display {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .base {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 1.2rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    background: #2a2a2a;
    border-radius: 3px;
  }

  .base-a {
    color: #00ff00;
  }

  .base-t {
    color: #ff0000;
  }

  .base-g {
    color: #ffffff;
  }

  .base-c {
    color: #0000ff;
  }

  .gel-info {
    display: flex;
    gap: 2rem;
    justify-content: center;
    padding: 1rem;
    background: #1a1a1a;
    border-radius: 4px;
  }

  .info-row {
    display: flex;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .info-row .label {
    color: #888;
  }

  .info-row .value {
    color: #6a9fb5;
    font-weight: bold;
    font-family: 'Courier New', monospace;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
</style>
