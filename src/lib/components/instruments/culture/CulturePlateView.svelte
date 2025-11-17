<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import AntibioticPlate from './AntibioticPlate.svelte';
  import { goToBiochemicalTests, correctOrganism } from '../../../stores/game-state';
  import { isCorrectSample } from '../../../stores/inventory';
  import { instrumentState, selectMedia, streakPlate, startIncubation, setIncubationProgress, showColonies, type Colony } from '../../../stores/instrument-state';
  import { evidence, setColonyColor, setHemolysis, setPenicillinZone, setStreptomycinZone, setTetracyclineZone, setChloramphenicolZone, setErythromycinZone } from '../../../stores/evidence';
  import type { ColonyColor } from '../../../../data/organisms';
  import '../../../styles/instrument-controls.css';
  
  let showMediaSection = $state(true);
  let showObservationsSection = $state(true);
  let showAntibioticSection = $state(false);
  let lastHoveredInfo = $state<string | null>(null);

  // Antibiotic testing state
  let antibioticTestingStarted = $state(false);
  let bacterialLawnPrepared = $state(false);
  let antibioticPlacedDisks = $state<Array<{antibiotic: string, x: number, y: number, zoneSize: number}>>([]);
  let antibioticIncubating = $state(false);
  let incubationProgress = $state(0);
  let antibioticIncubated = $state(false);

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }

  const MEDIA_INFO = {
    'blood-agar': {
      name: 'Blood Agar',
      description: 'Enriched medium containing sheep blood. Shows hemolysis patterns and supports growth of most bacteria.'
    },
    'macconkey': {
      name: 'MacConkey Agar',
      description: 'Selective for Gram-negative bacteria. Lactose fermenters produce pink colonies, non-fermenters remain colorless.'
    }
  };

  const COLONY_COLORS: Record<ColonyColor, string> = {
    golden: '#f0d68c',
    white: '#f5f5f5',
    gray: '#c0c0c0',
    pink: '#ff99b4',
    colorless: '#e8d8d0',
    none: 'transparent',
  };

  function generateColonies() {
    const organism = $correctOrganism;
    if (!organism?.culture) return [];

    const cultureProps = $instrumentState.culture.selectedMedia === 'blood-agar' 
      ? organism.culture.bloodAgar 
      : organism.culture.macConkey;

    if (cultureProps.growthQuality === 'none') return [];

    const count = cultureProps.growthQuality === 'good' ? 12 : 5;
    const newColonies: Colony[] = [];

    for (let i = 0; i < count; i++) {
      // Generate random position within dish (avoiding edges)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.35 + 0.1; // 10-45% from center
      const x = 50 + Math.cos(angle) * radius * 100;
      const y = 50 + Math.sin(angle) * radius * 100;
      
      // Vary colony sizes
      const baseSize = cultureProps.growthQuality === 'good' ? 35 : 20;
      const size = baseSize + Math.random() * 15;

      newColonies.push({ x, y, size });
    }

    return newColonies;
  }

  function handleStreak() {
    streakPlate();
  }

  function handleIncubate() {
    startIncubation();
    
    // Simulate incubation with progress bar
    const interval = setInterval(() => {
      const newProgress = $instrumentState.culture.incubationProgress + 5;
      setIncubationProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(interval);
        const newColonies = generateColonies();
        showColonies(newColonies);
      }
    }, 50); // 2 seconds total (100ms * 20 steps)
  }

  function resetCulture() {
    selectMedia($instrumentState.culture.selectedMedia); // This resets all culture state
  }

  function getColonyColor(): string {
    const organism = $correctOrganism;
    if (!organism?.culture) return COLONY_COLORS.gray;

    const cultureProps = $instrumentState.culture.selectedMedia === 'blood-agar'
      ? organism.culture.bloodAgar
      : organism.culture.macConkey;

    return COLONY_COLORS[cultureProps.colonyColor];
  }

  function getHemolysisZone(): number {
    const organism = $correctOrganism;
    if (!organism?.culture || $instrumentState.culture.selectedMedia !== 'blood-agar') return 0;

    const hemolysis = organism.culture.bloodAgar.hemolysis;
    if (hemolysis === 'beta') return 1.8; // Large clear zone
    if (hemolysis === 'alpha') return 1.4; // Smaller greenish zone
    return 0; // gamma = no hemolysis
  }

  function startAntibioticTesting() {
    antibioticTestingStarted = true;
    showAntibioticSection = true;
  }

  function prepareBacterialLawn() {
    bacterialLawnPrepared = true;
  }

  function placeAntibioticDisk(antibiotic: string) {
    if (!bacterialLawnPrepared) return; // Can't place disks without lawn
    if (antibioticPlacedDisks.length >= 5) return; // Max 5 disks
    if (antibioticPlacedDisks.some(d => d.antibiotic === antibiotic)) return; // Already placed

    // Find a position that doesn't overlap with existing disks
    let attempts = 0;
    let x: number = 0;
    let y: number = 0;
    const minDistance = 40; // Minimum 40px between disk centers
    
    do {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 80 + 40; // 40-120px from center (within 180px dish)
      x = 250 + Math.cos(angle) * radius;
      y = 200 + Math.sin(angle) * radius;
      
      // Check distance from all existing disks
      const tooClose = antibioticPlacedDisks.some(disk => {
        const dx = disk.x - x;
        const dy = disk.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });
      
      if (!tooClose) break;
      attempts++;
    } while (attempts < 50);

    antibioticPlacedDisks.push({ antibiotic, x, y, zoneSize: 0 });
    antibioticPlacedDisks = antibioticPlacedDisks; // Trigger reactivity
  }

  function removeDisk(antibiotic: string) {
    if (antibioticIncubating || antibioticIncubated) return; // Can't remove during/after incubation
    antibioticPlacedDisks = antibioticPlacedDisks.filter(d => d.antibiotic !== antibiotic);
  }

  function incubateAntibioticPlate() {
    const organism = $correctOrganism;
    antibioticIncubating = true;
    incubationProgress = 0;
    
    // Animate incubation progress
    const interval = setInterval(() => {
      incubationProgress += 5;
      
      if (incubationProgress >= 100) {
        clearInterval(interval);
        
        // Update zone sizes based on organism sensitivity
        antibioticPlacedDisks = antibioticPlacedDisks.map(disk => {
          let zoneSize = 0;
          
          // If organism has antibiotic data, use it
          if (organism?.antibiotics) {
            const antibioticKey = disk.antibiotic.toLowerCase().replace(' ', '') as keyof typeof organism.antibiotics;
            zoneSize = organism.antibiotics[antibioticKey] || 0;
          } else {
            // Placeholder data for testing
            const sensitivities = {
              'Penicillin': 22,
              'Streptomycin': 18,
              'Tetracycline': 25,
              'Chloramphenicol': 20,
              'Erythromycin': 15
            };
            zoneSize = sensitivities[disk.antibiotic as keyof typeof sensitivities] || 15;
          }
          
          return { ...disk, zoneSize };
        });
        
        antibioticIncubating = false;
        antibioticIncubated = true;
      }
    }, 50); // 2 seconds total (100ms * 20 steps)
  }

  function resetAntibioticTest() {
    antibioticTestingStarted = false;
    bacterialLawnPrepared = false;
    antibioticPlacedDisks = [];
    antibioticIncubating = false;
    incubationProgress = 0;
    antibioticIncubated = false;
    showAntibioticSection = false;
  }

  function recordZoneMeasurement(antibiotic: string, zoneSize: number) {
    const antibioticKey = antibiotic.toLowerCase();
    if (antibioticKey === 'penicillin') setPenicillinZone(zoneSize);
    else if (antibioticKey === 'streptomycin') setStreptomycinZone(zoneSize);
    else if (antibioticKey === 'tetracycline') setTetracyclineZone(zoneSize);
    else if (antibioticKey === 'chloramphenicol') setChloramphenicolZone(zoneSize);
    else if (antibioticKey === 'erythromycin') setErythromycinZone(zoneSize);
  }

  function getRecordedZone(antibiotic: string): number | null {
    const antibioticKey = antibiotic.toLowerCase();
    if (antibioticKey === 'penicillin') return $evidence.penicillinZone;
    if (antibioticKey === 'streptomycin') return $evidence.streptomycinZone;
    if (antibioticKey === 'tetracycline') return $evidence.tetracyclineZone;
    if (antibioticKey === 'chloramphenicol') return $evidence.chloramphenicolZone;
    if (antibioticKey === 'erythromycin') return $evidence.erythromycinZone;
    return null;
  }
</script>

<div class="culture-view">
  <!-- Left: Stage Area with Petri Dish -->
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      {#if antibioticTestingStarted}
        <!-- Show both culture and antibiotic plates side by side -->
        <div class="dual-plate-container">
          <!-- Original Culture Plate (smaller, left side) -->
          <div class="plate-preview">
            <div class="petri-dish-small" class:blood-agar={$instrumentState.culture.selectedMedia === 'blood-agar'} class:macconkey={$instrumentState.culture.selectedMedia === 'macconkey'}>
              {#if $instrumentState.culture.showColonies && $isCorrectSample && $instrumentState.culture.colonies.length > 0}
                <div class="colonies">
                  {#each $instrumentState.culture.colonies as colony}
                    <div 
                      class="colony" 
                      style="
                        left: {colony.x}%; 
                        top: {colony.y}%;
                        width: {colony.size * 0.6}px;
                        height: {colony.size * 0.6}px;
                        background: {getColonyColor()};
                        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                      "
                    ></div>
                  {/each}
                </div>
              {/if}
            </div>
            <p class="plate-label-small">Original Culture</p>
          </div>

          <!-- Antibiotic Sensitivity Testing Plate (main, right side) -->
          <div class="antibiotic-container">
            <AntibioticPlate 
              placedDisks={antibioticPlacedDisks} 
              bacterialLawnPrepared={bacterialLawnPrepared}
              incubationProgress={incubationProgress}
              incubated={antibioticIncubated}
              lawnColor={getColonyColor()}
            />
            <p class="plate-label">Antibiotic Sensitivity Test</p>
          </div>
        </div>
      {:else}
        <!-- Culture Plate Only -->
        <div class="petri-container">
          <div class="petri-dish" class:blood-agar={$instrumentState.culture.selectedMedia === 'blood-agar'} class:macconkey={$instrumentState.culture.selectedMedia === 'macconkey'}>
          {#if $instrumentState.culture.showColonies && $isCorrectSample && $instrumentState.culture.colonies.length > 0}
            <div class="colonies">
              {#each $instrumentState.culture.colonies as colony}
                <div 
                  class="colony" 
                  style="
                    left: {colony.x}%; 
                    top: {colony.y}%;
                    width: {colony.size}px;
                    height: {colony.size}px;
                    background: {getColonyColor()};
                    box-shadow: 
                      0 2px 4px rgba(0,0,0,0.3),
                      {getHemolysisZone() > 0 ? `0 0 0 ${colony.size * getHemolysisZone()}px rgba(139, 69, 69, 0.15)` : 'none'};
                  "
                ></div>
              {/each}
            </div>
          {:else if $instrumentState.culture.showColonies && $isCorrectSample && $instrumentState.culture.colonies.length === 0}
            {console.log('culture', $instrumentState.culture, 'isCorrectSample', $isCorrectSample)}
            <div class="no-growth">
              <p>No growth</p>
              <p class="hint">(Organism doesn't grow on {MEDIA_INFO[$instrumentState.culture.selectedMedia].name})</p>
            </div>
          {:else if $instrumentState.culture.showColonies && !$isCorrectSample}
            <div class="no-growth">
              <p>No significant growth</p>
              <p class="hint">(Wrong sample type)</p>
            </div>
          {/if}
        </div>
        <p class="plate-label">{MEDIA_INFO[$instrumentState.culture.selectedMedia].name}</p>
      </div>
      {/if}
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <!-- Right: Controls Panel -->
  <div class="controls-panel">
    <!-- Media Selection & Workflow Section -->
    <CollapsibleSection title="Culture Setup" bind:isOpen={showMediaSection}>
      <h3>1. Select Medium</h3>
      <div class="media-selection">
            <label class="radio-option"
              onmouseenter={() => setHoveredInfo('blood-agar')}
            >
              <input 
                type="radio" 
                name="media" 
                value="blood-agar"
                checked={$instrumentState.culture.selectedMedia === 'blood-agar'}
                onchange={() => selectMedia('blood-agar')}
                disabled={$instrumentState.culture.isStreaked}
              />
              <span>Blood Agar</span>
            </label>
            <label class="radio-option"
              onmouseenter={() => setHoveredInfo('macconkey')}
            >
              <input 
                type="radio" 
                name="media" 
                value="macconkey"
                checked={$instrumentState.culture.selectedMedia === 'macconkey'}
                onchange={() => selectMedia('macconkey')}
                disabled={$instrumentState.culture.isStreaked}
              />
              <span>MacConkey Agar</span>
            </label>
          </div>
          <p class="media-description">{MEDIA_INFO[$instrumentState.culture.selectedMedia].description}</p>

          <h3>2. Streak & Incubate</h3>
          <div class="workflow-buttons">
            <button 
              class="primary-button"
              onclick={handleStreak}
              disabled={$instrumentState.culture.isStreaked}
            >
              {$instrumentState.culture.isStreaked ? 'Streaked ✓' : 'Streak Sample'}
            </button>
            
            <button 
              class="primary-button"
              onclick={handleIncubate}
              disabled={!$instrumentState.culture.isStreaked || $instrumentState.culture.isIncubating || $instrumentState.culture.showColonies}
            >
              {$instrumentState.culture.showColonies ? 'Incubated ✓' : 'Incubate Overnight'}
            </button>
          </div>

          {#if $instrumentState.culture.isIncubating}
            <div class="progress-container">
              <div class="progress-bar" style="width: {$instrumentState.culture.incubationProgress}%"></div>
            </div>
            <p class="progress-text">Incubating... {$instrumentState.culture.incubationProgress}%</p>
          {/if}

          {#if $instrumentState.culture.showColonies}
            <button class="secondary-button" onclick={resetCulture}>
              Prepare New Plate
            </button>
          {/if}
    </CollapsibleSection>

    <!-- Observations Section -->
    {#if $instrumentState.culture.showColonies}
      <CollapsibleSection title="Record Observations" bind:isOpen={showObservationsSection}>
        {#if $instrumentState.culture.selectedMedia === 'blood-agar'}
              <h4>Colony Color:</h4>
              <div class="obs-buttons-grid">
                <button 
                  class="obs-button" 
                  class:active={$evidence.bloodAgarColor === 'golden'}
                  onclick={() => setColonyColor('blood-agar', 'golden')}
                >
                  Golden
                </button>
                <button 
                  class="obs-button" 
                  class:active={$evidence.bloodAgarColor === 'white'}
                  onclick={() => setColonyColor('blood-agar', 'white')}
                >
                  White
                </button>
                <button 
                  class="obs-button" 
                  class:active={$evidence.bloodAgarColor === 'gray'}
                  onclick={() => setColonyColor('blood-agar', 'gray')}
                >
                  Gray
                </button>
              </div>

              <h4>Hemolysis:</h4>
              <div class="obs-buttons-grid">
                <button 
                  class="obs-button" 
                  class:active={$evidence.hemolysis === 'beta'}
                  onclick={() => setHemolysis('beta')}
                  onmouseenter={() => setHoveredInfo('hemolysis-beta')}
                >
                  Beta (Clear)
                </button>
                <button 
                  class="obs-button" 
                  class:active={$evidence.hemolysis === 'alpha'}
                  onclick={() => setHemolysis('alpha')}
                  onmouseenter={() => setHoveredInfo('hemolysis-alpha')}
                >
                  Alpha (Green)
                </button>
                <button 
                  class="obs-button" 
                  class:active={$evidence.hemolysis === 'gamma'}
                  onclick={() => setHemolysis('gamma')}
                >
                  Gamma (None)
                </button>
              </div>
            {:else}
              <h4>Colony Color:</h4>
              <div class="obs-buttons-grid">
                <button 
                  class="obs-button" 
                  class:active={$evidence.macConkeyColor === 'pink'}
                  onclick={() => setColonyColor('macconkey', 'pink')}
                >
                  Pink
                </button>
                <button 
                  class="obs-button" 
                  class:active={$evidence.macConkeyColor === 'colorless'}
                  onclick={() => setColonyColor('macconkey', 'colorless')}
                >
                  Colorless
                </button>
              </div>
              <p class="info-hint">Pink = lactose fermenter</p>
            {/if}
      </CollapsibleSection>
    {/if}

    <!-- Antibiotic Sensitivity Testing Section -->
    {#if $instrumentState.culture.showColonies && $isCorrectSample && $instrumentState.culture.colonies.length > 0}
      {#if !antibioticTestingStarted}
        <div class="antibiotic-start-section">
          <button class="primary-button" onclick={startAntibioticTesting}>
            Run Antibiotic Sensitivity Test
          </button>
        </div>
      {:else}
        <CollapsibleSection title="Antibiotic Sensitivity Testing" bind:isOpen={showAntibioticSection}>
          {#if !bacterialLawnPrepared}
            <h3>1. Prepare Bacterial Lawn</h3>
            <p class="info-hint">Spread bacteria evenly across the agar surface</p>
            <button class="primary-button" onclick={prepareBacterialLawn}>
              Prepare Bacterial Lawn
            </button>
          {:else}
            <h3>2. Place Antibiotic Disks</h3>
            <p class="info-hint">Select up to 5 antibiotics ({antibioticPlacedDisks.length}/5)</p>
            
            <div class="antibiotic-selection">
              {#each ['Penicillin', 'Streptomycin', 'Tetracycline', 'Chloramphenicol', 'Erythromycin'] as antibiotic}
                {@const isPlaced = antibioticPlacedDisks.some(d => d.antibiotic === antibiotic)}
                <button 
                  class="antibiotic-button" 
                  class:placed={isPlaced}
                  onclick={() => isPlaced ? removeDisk(antibiotic) : placeAntibioticDisk(antibiotic)}
                  disabled={(!isPlaced && antibioticPlacedDisks.length >= 5) || antibioticIncubating || antibioticIncubated}
                >
                  {isPlaced ? '✓ ' : ''}{antibiotic}
                </button>
            {/each}
          </div>

          {#if antibioticPlacedDisks.length > 0 && !antibioticIncubating && !antibioticIncubated}
            <h3>3. Incubate Plate</h3>
            <button class="primary-button" onclick={incubateAntibioticPlate}>
              Incubate Overnight
            </button>
          {/if}

          {#if antibioticIncubating}
            <div class="progress-container">
              <div class="progress-bar" style="width: {incubationProgress}%"></div>
            </div>
            <p class="progress-text">Incubating... {incubationProgress}%</p>
            <p class="info-hint">Watch zones of inhibition grow</p>
          {/if}

          {#if antibioticIncubated}
            <h3>4. Measure Zones</h3>
            
            <div class="zone-measurements">
              {#each antibioticPlacedDisks as disk}
                {@const recordedZone = getRecordedZone(disk.antibiotic)}
                <div class="zone-measurement-row">
                  <span class="antibiotic-name">{disk.antibiotic}:</span>
                  <input 
                    type="number" 
                    class="zone-input"
                    placeholder="mm"
                    value={recordedZone ?? ''}
                    oninput={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      if (!isNaN(value) && value >= 0 && value <= 50) {
                        recordZoneMeasurement(disk.antibiotic, value);
                      }
                    }}
                    min="0"
                    max="50"
                  />
                </div>
              {/each}
            </div>

            <div class="test-complete">
              <p>✓ Incubation complete</p>
              <button class="secondary-button" onclick={resetAntibioticTest}>
                Start New Sensitivity Test
              </button>
            </div>
          {/if}
          {/if}
        </CollapsibleSection>
      {/if}
    {/if}

    <!-- Navigation Section -->
    <NavigationButtons 
      primaryAction={goToBiochemicalTests}
      primaryLabel="Run Biochemical Tests →"
    />
  </div>
</div>

<style>
  .culture-view {
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

  .petri-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .controls-panel {
    width: 280px;
    background: #2a2a2a;
    border-left: 2px solid #4a4a4a;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  h3 {
    color: #ccc;
    font-size: 0.9rem;
    margin: 1rem 0 0.5rem 0;
    font-weight: 500;
  }

  .media-selection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: #ddd;
    font-size: 0.9rem;
  }

  .radio-option input[type="radio"] {
    cursor: pointer;
  }

  .radio-option input[type="radio"]:disabled {
    cursor: not-allowed;
  }

  .media-description {
    color: #aaa;
    font-size: 0.85rem;
    line-height: 1.4;
    margin: 0;
  }

  .workflow-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .primary-button {
    background: #4a7c8c;
    color: white;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    width: 100%;
    transition: background 0.2s;
  }

  .primary-button:hover:not(:disabled) {
    background: #5a8c9c;
  }

  .primary-button:disabled {
    background: #3a3a3a;
    color: #666;
    cursor: not-allowed;
  }

  .secondary-button {
    background: none;
    border: 1px solid #4a4a4a;
    color: #ccc;
    padding: 0.6rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    width: 100%;
    transition: all 0.2s;
  }

  .secondary-button:hover {
    background: #3a3a3a;
    border-color: #6a6a6a;
  }

  .progress-container {
    width: 100%;
    height: 8px;
    background: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 0.75rem;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4a7c8c, #6a9fb5);
    transition: width 0.1s linear;
  }

  .progress-text {
    color: #aaa;
    font-size: 0.85rem;
    margin: 0.5rem 0 0 0;
    text-align: center;
  }

  h4 {
    color: #ccc;
    font-size: 0.85rem;
    margin: 1rem 0 0.5rem 0;
    font-weight: 500;
  }

  .obs-button.active {
    background: #4a7c8c;
    border-color: #6a9fb5;
    color: white;
  }

  .petri-dish {
    width: 500px;
    height: 500px;
    border-radius: 50%;
    border: 8px solid #444;
    position: relative;
    box-shadow: 
      inset 0 0 30px rgba(0,0,0,0.5),
      0 4px 20px rgba(0,0,0,0.3);
    transition: background-color 0.3s ease;
  }

  .petri-dish.blood-agar {
    background: radial-gradient(circle, #8b4545, #6b2525);
  }

  .petri-dish.macconkey {
    background: radial-gradient(circle, #d4a5a5, #b48585);
  }

  .colonies {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .colony {
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
  }

  .no-growth {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #aaa;
    text-align: center;
  }

  .no-growth p {
    margin: 0.25rem 0;
  }

  .hint {
    font-size: 0.85rem;
    color: #888;
  }

  .plate-label {
    color: #ccc;
    margin-top: 1.5rem;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .antibiotic-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dual-plate-container {
    display: flex;
    gap: 2rem;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .plate-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.8;
  }

  .petri-dish-small {
    width: 250px;
    height: 250px;
    border-radius: 50%;
    border: 4px solid #444;
    position: relative;
    box-shadow: 
      inset 0 0 20px rgba(0,0,0,0.5),
      0 2px 10px rgba(0,0,0,0.3);
    transition: background-color 0.3s ease;
  }

  .petri-dish-small.blood-agar {
    background: radial-gradient(circle, #8b4545, #6b2525);
  }

  .petri-dish-small.macconkey {
    background: radial-gradient(circle, #d4a5a5, #b48585);
  }

  .plate-label-small {
    color: #999;
    margin-top: 0.75rem;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .antibiotic-start-section {
    padding: 1.5rem;
    text-align: center;
  }

  .antibiotic-selection {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .antibiotic-button {
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border: 2px solid #444;
    color: #ccc;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .antibiotic-button:hover:not(:disabled) {
    background: #333;
    border-color: #5a9fd4;
  }

  .antibiotic-button.placed {
    background: #3a5a3a;
    border-color: #5a9fd4;
    color: #fff;
  }

  .antibiotic-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .test-complete {
    margin-top: 1rem;
    padding: 1rem;
    background: #2a3a2a;
    border-radius: 6px;
    border: 1px solid #4a7a4a;
  }

  .test-complete p {
    margin: 0.5rem 0;
  }

  .zone-measurements {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0.75rem 0;
  }

  .zone-measurement-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    background: #2a2a2a;
    border-radius: 4px;
  }

  .antibiotic-name {
    color: #ccc;
    font-weight: 500;
    font-size: 0.85rem;
  }

  .zone-input {
    width: 60px;
    padding: 0.4rem;
    background: #1a1a1a;
    border: 2px solid #444;
    color: #fff;
    border-radius: 4px;
    font-size: 0.9rem;
    text-align: center;
  }

  .zone-input:focus {
    outline: none;
    border-color: #5a9fd4;
  }
</style>
