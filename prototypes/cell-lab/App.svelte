<script lang="ts">
  import { PUZZLES } from './lib/puzzles';
  import { PARTS_MAP } from './lib/parts';
  import { simulate } from './lib/simulation';
  import type { BioPart, SimulationResult, TestResult } from './lib/types';

  import CellView from './components/CellView.svelte';
  import DnaStrand from './components/DnaStrand.svelte';
  import InstrumentPanel from './components/InstrumentPanel.svelte';
  import PartsLibrary from './components/PartsLibrary.svelte';

  let puzzleIndex = $state(0);
  let strand = $state<(string | null)[]>(new Array(PUZZLES[0].strandSlots).fill(null));
  let testResults = $state<TestResult[]>([]);
  let showingResult = $state(false);
  let puzzleComplete = $state(false);
  let displayResult = $state<SimulationResult | null>(null);
  let showHint = $state(false);
  let scanIndex = $state(-1);
  let scanning = $state(false);
  let revealedTests = $state<Set<number>>(new Set());
  let allSimResults = $state<SimulationResult[]>([]);
  let activeConditionIndex = $state(0);
  let selectedInstrument = $state<'protein-detector' | 'brightness-meter' | null>(null);

  const puzzle = $derived(PUZZLES[puzzleIndex]);
  const hasInstrument = $derived(puzzle.detectableProteins !== undefined);
  const hasMultipleConditions = $derived(
    new Set(puzzle.tests.map(t => JSON.stringify(t.signals))).size > 1,
  );
  const isReadonly = $derived(!!puzzle.prefilled && !!puzzle.hiddenGenes);
  const isDebug = $derived(!!puzzle.prefilled && !puzzle.hiddenGenes);
  const availableParts = $derived(
    puzzle.availablePartIds
      .map(id => PARTS_MAP.get(id))
      .filter((p): p is BioPart => p !== undefined),
  );
  const strandEmpty = $derived(strand.every(s => s === null));
  const availableInstruments = $derived(
    [
      ...(puzzle.detectableProteins ? ['protein-detector'] as const : []),
      ...(puzzle.brightnessMeter ? ['brightness-meter'] as const : []),
    ]
  );

  function updateStrand(next: (string | null)[]) {
    strand = next;
    if (showingResult) {
      showingResult = false;
      testResults = [];
      displayResult = null;
      puzzleComplete = false;
      selectedInstrument = null;
    }
  }

  function addPartToFirstSlot(partId: string) {
    const idx = strand.indexOf(null);
    if (idx === -1) return;
    const next = [...strand];
    next[idx] = partId;
    updateStrand(next);
  }

  function runCell() {
    const parts = strand.map(id => (id ? PARTS_MAP.get(id) ?? null : null));

    const results: TestResult[] = puzzle.tests.map(test => {
      const result = simulate(parts, test.signals);
      let passed = true;

      for (const [protein, constraint] of Object.entries(test.expect)) {
        const amount = result.proteins[protein] ?? 0;
        if (constraint.min !== undefined && amount < constraint.min) passed = false;
        if (constraint.max !== undefined && amount > constraint.max) passed = false;
      }

      return { passed, label: test.label, result };
    });

    allSimResults = results.map(r => r.result);

    // Start scan animation, then reveal results
    scanning = true;
    scanIndex = 0;
    showingResult = false;

    const step = () => {
      scanIndex++;
      if (scanIndex >= strand.length) {
        scanning = false;
        scanIndex = -1;
        testResults = results;
        displayResult = results[0]?.result ?? null;
        showingResult = true;

        if (hasInstrument) {
          // Instrument puzzles: tests start hidden, completion checked on probe
          revealedTests = new Set();
          puzzleComplete = false;
          activeConditionIndex = 0;
        } else {
          puzzleComplete = results.every(r => r.passed);
        }
      } else {
        setTimeout(step, 200);
      }
    };
    setTimeout(step, 200);
  }

  function handleProbe(protein: string) {
    // Reveal all tests whose expect mentions this protein
    const newRevealed = new Set(revealedTests);
    testResults.forEach((_, i) => {
      const expectKeys = Object.keys(puzzle.tests[i].expect);
      if (expectKeys.includes(protein)) {
        newRevealed.add(i);
      }
    });
    revealedTests = newRevealed;

    // Check if all tests are revealed AND pass
    if (revealedTests.size === testResults.length) {
      puzzleComplete = testResults.every(r => r.passed);
    }
  }

  function goToPuzzle(index: number) {
    const p = PUZZLES[index];
    puzzleIndex = index;
    strand = p.prefilled ? [...p.prefilled] : new Array(p.strandSlots).fill(null);
    showingResult = false;
    scanning = false;
    scanIndex = -1;
    testResults = [];
    displayResult = null;
    puzzleComplete = false;
    showHint = false;
    revealedTests = new Set();
    allSimResults = [];
    activeConditionIndex = 0;
    selectedInstrument = null;
  }

  function clearStrand() {
    goToPuzzle(puzzleIndex);
  }

  function nextPuzzle() {
    if (puzzleIndex >= PUZZLES.length - 1) return;
    goToPuzzle(puzzleIndex + 1);
  }
</script>

<main class="app">
  <!-- Header -->
  <header class="header">
    <nav class="puzzle-nav">
      {#each PUZZLES as p, i}
        <button
          class="puzzle-pip"
          class:active={i === puzzleIndex}
          onclick={() => goToPuzzle(i)}
          title={p.title}
        >{p.id}</button>
      {/each}
    </nav>
    <h1 class="puzzle-title">{puzzle.title}</h1>
    <p class="puzzle-goal">{puzzle.goal}</p>
  </header>

  <!-- Body: sidebar + cell -->
  <div class="body">
    <aside class="sidebar">
      {#if availableParts.length > 0}
        <PartsLibrary parts={availableParts} disabled={showingResult} onadd={addPartToFirstSlot} />
      {/if}

      {#if puzzle.hint}
        <button class="hint-btn" onclick={() => showHint = !showHint}>
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
        {#if showHint}
          <p class="hint-text">{puzzle.hint}</p>
        {/if}
      {/if}
    </aside>

    <section class="cell-area">
      <CellView result={displayResult} running={showingResult} />

      {#if showingResult && hasMultipleConditions}
        <div class="condition-switcher">
          {#each puzzle.tests as test, i}
            <button
              class="condition-tab"
              class:active={activeConditionIndex === i}
              onclick={() => { activeConditionIndex = i; displayResult = allSimResults[i] ?? null; }}
            >
              {#if Object.keys(test.signals).length === 0}
                No signals
              {:else}
                {Object.keys(test.signals).join(' + ')}
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      {#if showingResult && availableInstruments.length > 0}
        <div class="instrument-selector">
          {#each availableInstruments as inst}
            <button
              class="instrument-btn"
              class:active={selectedInstrument === inst}
              onclick={() => { selectedInstrument = selectedInstrument === inst ? null : inst; }}
            >
              {inst === 'protein-detector' ? '🔬 Protein Detector' : '📊 Brightness Meter'}
            </button>
          {/each}
        </div>
      {/if}

      {#if selectedInstrument === 'brightness-meter' && displayResult && puzzle.brightnessMeter}
        <div class="brightness-meter">
          <span class="meter-title">📊 Brightness</span>
          {#each puzzle.brightnessMeter as protein}
            <div class="meter-row">
              <span class="meter-label">{protein}</span>
              <div class="meter-bar-track">
                <div class="meter-bar-fill" style:width="{Math.min((displayResult.proteins[protein] ?? 0) / 6, 1) * 100}%"></div>
              </div>
              <span class="meter-value">{displayResult.proteins[protein] ?? 0}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if testResults.length > 0}
        <div class="test-results">
          {#each testResults as t, i}
            {#if hasInstrument && !revealedTests.has(i)}
              <div class="test-row hidden-test">
                <span class="test-icon">🔬</span>
                <span class="test-label">{t.label}</span>
              </div>
            {:else}
              <div class="test-row" class:pass={t.passed} class:fail={!t.passed}>
                <span class="test-icon">{t.passed ? '✓' : '✗'}</span>
                <span class="test-label">{t.label}</span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      {#if selectedInstrument === 'protein-detector' && puzzle.detectableProteins}
        <InstrumentPanel
          detectableProteins={puzzle.detectableProteins}
          simulationResults={allSimResults}
          onprobe={handleProbe}
        />
      {/if}

      {#if puzzleComplete}
        <div class="success-banner">
          Puzzle Complete!
          {#if puzzleIndex < PUZZLES.length - 1}
            <button class="next-btn" onclick={nextPuzzle}>Next Puzzle →</button>
          {:else}
            <span class="final-msg">You finished all puzzles! 🧬</span>
          {/if}
        </div>
      {/if}
    </section>
  </div>

  <!-- Strand editor -->
  <section class="strand-section">
    <DnaStrand
      {strand}
      onupdate={updateStrand}
      disabled={scanning || (showingResult && !isDebug)}
      {scanIndex}
      readonly={isReadonly}
      hiddenGenes={puzzle.hiddenGenes ?? false}
    />
  </section>

  <!-- Controls -->
  <footer class="controls">
    <button class="ctrl-btn clear" onclick={clearStrand} disabled={strandEmpty && !showingResult}>
      Clear
    </button>
    <button class="ctrl-btn run" onclick={runCell} disabled={strandEmpty || showingResult || scanning}>
      ▶ Run Cell
    </button>
  </footer>
</main>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-darkest);
    color: var(--parchment);
    font-family: var(--font-body);
    overflow: hidden;
  }

  /* Header */
  .header {
    text-align: center;
    padding: 14px 20px 10px;
    border-bottom: 1px solid var(--brass-dark);
    background: var(--bg-dark);
  }

  .puzzle-nav {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .puzzle-pip {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--brass-dark);
    background: var(--bg-medium);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
    padding: 0;
  }

  .puzzle-pip:hover {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .puzzle-pip.active {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  .puzzle-title {
    font-family: var(--font-heading);
    font-size: 1.3rem;
    margin: 4px 0 2px;
    color: var(--parchment);
  }

  .puzzle-goal {
    font-size: 0.9rem;
    color: var(--parchment-aged);
    margin: 0;
  }

  /* Body */
  .body {
    flex: 1;
    display: flex;
    gap: 16px;
    padding: 16px;
    min-height: 0;
    overflow: auto;
  }

  .sidebar {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cell-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  /* Hint */
  .hint-btn {
    background: none;
    border: 1px solid var(--brass-dark);
    color: var(--brass);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-family: var(--font-body);
  }

  .hint-btn:hover {
    border-color: var(--brass);
  }

  .hint-text {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    line-height: 1.5;
    padding: 8px;
    background: var(--bg-medium);
    border-radius: 6px;
    margin: 0;
  }

  /* Test results */
  .test-results {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .test-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-family: var(--font-mono);
  }

  .test-row.pass {
    background: rgba(74, 124, 89, 0.25);
    color: #6ee7a0;
  }

  .test-row.fail {
    background: rgba(168, 68, 50, 0.25);
    color: #f87171;
  }

  .test-row.hidden-test {
    background: rgba(100, 100, 100, 0.2);
    color: var(--parchment-aged);
    border: 1px dashed var(--brass-dark);
  }

  .test-icon {
    font-size: 0.95rem;
  }

  /* Condition switcher */
  .condition-switcher {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .condition-tab {
    padding: 4px 14px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-medium);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.1s;
  }

  .condition-tab:hover {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .condition-tab.active {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  /* Instrument selector */
  .instrument-selector {
    display: flex;
    gap: 6px;
    justify-content: center;
  }

  .instrument-btn {
    padding: 6px 14px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-medium);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .instrument-btn:hover {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .instrument-btn.active {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  /* Brightness meter */
  .brightness-meter {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 16px;
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 8px;
    min-width: 180px;
  }

  .meter-title {
    font-family: var(--font-heading);
    font-size: 0.85rem;
    color: var(--parchment);
  }

  .meter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }

  .meter-label {
    width: 40px;
    color: var(--parchment-aged);
  }

  .meter-bar-track {
    flex: 1;
    height: 10px;
    background: var(--bg-darkest);
    border-radius: 5px;
    overflow: hidden;
  }

  .meter-bar-fill {
    height: 100%;
    background: var(--brass);
    border-radius: 5px;
    transition: width 0.3s;
  }

  .meter-value {
    width: 20px;
    text-align: right;
    color: var(--parchment);
    font-weight: 600;
  }

  /* Success */
  .success-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: rgba(74, 124, 89, 0.3);
    border: 1px solid var(--status-idle);
    border-radius: 8px;
    font-family: var(--font-heading);
    font-size: 1rem;
    color: #6ee7a0;
  }

  .next-btn {
    background: var(--brass-dark);
    color: var(--parchment);
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-family: var(--font-heading);
    font-size: 0.85rem;
    transition: background 0.15s;
  }

  .next-btn:hover {
    background: var(--brass);
    color: var(--bg-darkest);
  }

  .final-msg {
    font-size: 0.85rem;
  }

  /* Strand section */
  .strand-section {
    padding: 14px 20px;
    background: var(--bg-dark);
    border-top: 1px solid var(--brass-dark);
    display: flex;
    justify-content: center;
    overflow-x: auto;
  }

  /* Controls */
  .controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 12px 20px;
    background: var(--bg-dark);
    border-top: 1px solid var(--bg-light);
  }

  .ctrl-btn {
    padding: 10px 24px;
    border: 1px solid var(--brass-dark);
    border-radius: 8px;
    font-family: var(--font-heading);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s;
    background: var(--bg-medium);
    color: var(--parchment);
  }

  .ctrl-btn:hover:not(:disabled) {
    border-color: var(--brass);
  }

  .ctrl-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .ctrl-btn.run {
    background: var(--brass-dark);
    color: var(--parchment);
    font-weight: 600;
  }

  .ctrl-btn.run:hover:not(:disabled) {
    background: var(--brass);
    color: var(--bg-darkest);
  }
</style>
