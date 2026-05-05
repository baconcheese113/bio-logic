<script lang="ts">
  import { PUZZLES, CIRCULAR_PUZZLES } from './lib/puzzles';
  import { PARTS_MAP } from './lib/parts';
  import { simulate } from './lib/simulation';
  import { runEngine, checkExpect } from './lib/simulation-engine';
  import { PARTS_DEF_MAP } from './lib/parts-grammar';
  import type { BioPart, SimulationResult, TestResult, PlacedPart, EngineOutput, CircularPuzzle } from './lib/types';
  import type { DeskItem, PcrResult, ExcisedBandData, BookSection, DigestResult, SampleTubeData, GrowthPoint, ElisaSignal, ElisaResultData } from './lib/lab-types';
  import { LAB_PUZZLES, GENE_SEQUENCES, buildBookEntries } from './lib/lab-puzzles';

  import CellView from './components/CellView.svelte';
  import DnaStrand from './components/DnaStrand.svelte';
  import InstrumentPanel from './components/InstrumentPanel.svelte';
  import PartsLibrary from './components/PartsLibrary.svelte';
  import PcrInstrument from './components/PcrInstrument.svelte';
  import GelView from './components/GelView.svelte';
  import SequencerView from './components/SequencerView.svelte';
  import DeskSurface from './components/DeskSurface.svelte';
  import DigestInstrument from './components/DigestInstrument.svelte';
  import ElisaView from './components/ElisaView.svelte';
  import SpectrophotometerView from './components/SpectrophotometerView.svelte';
  import AssemblyWorkspace from './components/AssemblyWorkspace.svelte';
  import PromoterArchitect from './components/PromoterArchitect.svelte';
  import CircularPlasmid from './components/CircularPlasmid.svelte';
  import MolecularAnimation from './components/MolecularAnimation.svelte';

  // Unified puzzle nav: strand → circular → lab
  const STRAND_COUNT = PUZZLES.length;
  const CIRCULAR_COUNT = CIRCULAR_PUZZLES.length;
  const CIRCULAR_START = STRAND_COUNT;
  const LAB_START = STRAND_COUNT + CIRCULAR_COUNT;
  const allPuzzleLabels = [
    ...PUZZLES.map(p => ({ id: p.id, title: p.title })),
    ...CIRCULAR_PUZZLES.map(p => ({ id: p.id, title: p.title })),
    ...LAB_PUZZLES.map(p => ({ id: p.id, title: p.title })),
  ];

  let puzzleIndex = $state(0);
  const isCircularPuzzle = $derived(puzzleIndex >= CIRCULAR_START && puzzleIndex < LAB_START);
  const isLabPuzzle = $derived(puzzleIndex >= LAB_START);
  const labPuzzleOffset = $derived(puzzleIndex - LAB_START);

  // Sidebar tab
  let sidebarTab = $state<'parts' | 'instruments'>('parts');

  // ── Strand puzzle state ──────────────────────────────────────────
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

  const puzzle = $derived(PUZZLES[Math.min(puzzleIndex, STRAND_COUNT - 1)]);
  const hasInstrument = $derived(!isLabPuzzle && puzzle.detectableProteins !== undefined);
  const hasMultipleConditions = $derived(
    !isLabPuzzle && new Set(puzzle.tests.map(t => JSON.stringify(t.signals))).size > 1,
  );
  const isReadonly = $derived(!isLabPuzzle && !!puzzle.prefilled && !!puzzle.hiddenGenes);
  const isDebug = $derived(!isLabPuzzle && !!puzzle.prefilled && !puzzle.hiddenGenes);
  const availableParts = $derived(
    isLabPuzzle ? [] :
    puzzle.availablePartIds
      .map(id => PARTS_MAP.get(id))
      .filter((p): p is BioPart => p !== undefined),
  );
  const strandEmpty = $derived(strand.every(s => s === null));
  const availableInstruments = $derived(
    isLabPuzzle ? [] :
    [
      ...(puzzle.detectableProteins ? ['protein-detector'] as const : []),
      ...(puzzle.brightnessMeter ? ['brightness-meter'] as const : []),
    ]
  );

  // ── Lab puzzle state ─────────────────────────────────────────────
  const labPuzzle = $derived(LAB_PUZZLES[Math.max(0, labPuzzleOffset)]);
  let labInstrument = $state<'pcr' | 'gel' | 'cell' | 'sequencer' | 'digest' | 'elisa' | 'spectrophotometer' | 'assembly' | 'promoter-architect'>('cell');
  let elisaLoadedSample = $state<string | null>(null);
  let pcrLoadedSample = $state<string | null>(null);
  let digestLoadedTube = $state<string | null>(null);
  let deskItems = $state<DeskItem[]>([]);
  let gelLanes = $state<{ label: string; bands: number[] }[]>([]);
  let labTubeCount = $state(0);
  let wrongGuesses = $state<Set<string>>(new Set());
  let excisedBands = $state<Set<string>>(new Set());
  let sequencerBand = $state<ExcisedBandData | null>(null);
  let spectReadings = $state<GrowthPoint[]>([]);
  const MAX_GUESSES = 3;

  // Cross-area tube drag state
  let tubeDrag = $state<{ id: string; label: string; x: number; y: number } | null>(null);

  // ── Circular puzzle state ────────────────────────────────────────
  const circularPuzzle = $derived<CircularPuzzle>(CIRCULAR_PUZZLES[Math.max(0, puzzleIndex - CIRCULAR_START)]);
  let circularParts = $state<PlacedPart[]>([]);
  let circularEngineOutput = $state<EngineOutput | null>(null);
  let circularConditionOutputs = $state<EngineOutput[]>([]);
  let circularConditionIndex = $state(0);
  let circularTestResults = $state<Array<{ passed: boolean; label: string }>>([]);
  let circularPuzzleComplete = $state(false);
  let circularShowHint = $state(false);
  let circularIdCounter = $state(0);

  const circularAvailableParts = $derived.by(() => {
    if (!isCircularPuzzle) return [] as Array<ReturnType<typeof PARTS_DEF_MAP.get> & { count: number }>;
    const countMap = new Map<string, number>();
    for (const id of circularPuzzle.availablePartIds) {
      countMap.set(id, (countMap.get(id) ?? 0) + 1);
    }
    return Array.from(countMap.entries())
      .map(([id, count]) => {
        const def = PARTS_DEF_MAP.get(id);
        return def ? { ...def, count } : null;
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  });

  const circularPassedCount = $derived(circularTestResults.filter(r => r.passed).length);
  const proteinDisplayName = (protein: string): string => {
    const names: Record<string, string> = {
      LacZ: 'LacZ beta-galactosidase',
      Cat: 'Cat acetyltransferase',
      AmyE: 'AmyE amylase',
      CcdB: 'CcdB toxin',
      Protein1: 'Reporter protein A',
      Protein2: 'Reporter protein B',
      Protein3: 'Reporter protein C',
      CancerActivator: 'Cancer activator',
      'dCas9-NLS': 'dCas9-NLS',
    };
    return names[protein] ?? protein;
  };

  const circularVisualProteins = $derived.by(() => {
    if (!circularEngineOutput) return [] as string[];
    return Object.entries(circularEngineOutput.proteins)
      .filter(([, amount]) => amount > 0.1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => proteinDisplayName(name));
  });

  const circularHealthTone = $derived.by(() => circularEngineOutput?.cellHealth.state ?? 'normal');

  const circularConditionChoices = $derived.by(() => {
    const seen = new Set<string>();
    return circularPuzzle.tests
      .map((test, index) => ({ index, key: JSON.stringify(test.environment.signals), label: circularConditionLabel(test.environment.signals) }))
      .filter(choice => {
        if (seen.has(choice.key)) return false;
        seen.add(choice.key);
        return true;
      });
  });

  const circularHealthMessage = $derived.by(() => {
    if (!circularEngineOutput || circularEngineOutput.cellHealth.state === 'normal') return '';

    const reasons = circularEngineOutput.cellHealth.reasons;
    const reason = reasons.includes('toxic-protein')
      ? 'toxic-protein'
      : reasons.includes('protease-saturation')
        ? 'protease-saturation'
        : reasons[0];
    if (reason === 'transcriptional-load') {
      return `Cell stress is the failed condition: active RNA polymerase load is ${circularEngineOutput.efficiencyScore.transcriptionalLoad}. Use fewer active promoters or combine genes on one transcript.`;
    }
    if (reason === 'protease-saturation') {
      return `Cell stress is the failed condition: tagged-protein cleanup load is ${circularEngineOutput.efficiencyScore.proteaseLoad.toFixed(1)}, so ClpXP/proteasome capacity is saturated.`;
    }
    if (reason === 'toxic-protein') {
      return 'Cell stress is the failed condition: toxic protein has built up above the safe threshold. Reduce toxin expression before running again.';
    }

    return 'Cell is stressed. Simplify the plasmid design and run again.';
  });

  const circularFailedChecks = $derived(
    circularTestResults.filter(result => !result.passed).map(result => result.label),
  );

  function circularConditionLabel(signals: Record<string, number>): string {
    const activeSignals = Object.entries(signals)
      .filter(([, value]) => value > 0)
      .map(([signal]) => {
        const names: Record<string, string> = {
          iptg: 'IPTG',
          toxin: 'toxin',
          'cancer-marker': 'cancer marker',
          nutrient: 'nutrient',
          'healthy-marker': 'healthy marker',
        };
        return names[signal] ?? signal;
      });

    return activeSignals.length === 0 ? 'No signals' : activeSignals.join(' + ');
  }

  function setCircularCondition(index: number) {
    circularConditionIndex = index;
    circularEngineOutput = circularConditionOutputs[index] ?? circularEngineOutput;
  }

  function runCircularPuzzle() {
    const outputs = circularPuzzle.tests.map(test => runEngine(circularParts, PARTS_DEF_MAP, test.environment));
    const results = circularPuzzle.tests.map((test, index) => {
      const output = outputs[index];
      return { passed: output ? checkExpect(output, test.expect) : false, label: test.label };
    });

    circularConditionOutputs = outputs;
    circularConditionIndex = 0;
    circularEngineOutput = outputs[0] ?? runEngine(circularParts, PARTS_DEF_MAP, {
      signals: {},
      hostMode: circularPuzzle.hostMode,
    });
    circularTestResults = results;
    circularPuzzleComplete = results.every(r => r.passed);
  }

  function resetCircularPuzzle() {
    const cp = CIRCULAR_PUZZLES[Math.max(0, puzzleIndex - CIRCULAR_START)];
    circularIdCounter = 0;
    circularParts = (cp.prefilled ?? []).map(defId => ({
      instanceId: `pre${++circularIdCounter}`,
      defId,
      orientation: 'clockwise' as const,
    }));
    circularEngineOutput = null;
    circularConditionOutputs = [];
    circularConditionIndex = 0;
    circularTestResults = [];
    circularPuzzleComplete = false;
    circularShowHint = false;
  }

  function handleCircularPlace(defId: string, afterIndex: number) {
    const newPart: PlacedPart = {
      instanceId: `p${++circularIdCounter}`,
      defId,
      orientation: 'clockwise',
    };
    const next = [...circularParts];
    next.splice(afterIndex, 0, newPart);
    circularParts = next;
    circularEngineOutput = null;
    circularConditionOutputs = [];
    circularConditionIndex = 0;
    circularTestResults = [];
    circularPuzzleComplete = false;
  }

  function addPartToCircular(partId: string) {
    handleCircularPlace(partId, circularParts.length);
  }

  function handleCircularRemove(instanceId: string) {
    // Prevent removing prefilled parts
    const cp = CIRCULAR_PUZZLES[Math.max(0, puzzleIndex - CIRCULAR_START)];
    const prefilledCount = cp.prefilled?.length ?? 0;
    const idx = circularParts.findIndex(p => p.instanceId === instanceId);
    if (idx < prefilledCount) return; // can't remove prefilled
    circularParts = circularParts.filter(p => p.instanceId !== instanceId);
    circularEngineOutput = null;
    circularConditionOutputs = [];
    circularConditionIndex = 0;
    circularTestResults = [];
    circularPuzzleComplete = false;
  }

  function handleCircularReorder(fromIndex: number, toIndex: number) {
    const cp = CIRCULAR_PUZZLES[Math.max(0, puzzleIndex - CIRCULAR_START)];
    const prefilledCount = cp.prefilled?.length ?? 0;
    if (fromIndex < prefilledCount || toIndex < prefilledCount) return;
    const next = [...circularParts];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    circularParts = next;
    circularEngineOutput = null;
    circularConditionOutputs = [];
    circularConditionIndex = 0;
    circularTestResults = [];
    circularPuzzleComplete = false;
  }

  // Reference book open state
  let bookOpen = $state(false);
  let bookSection = $state<BookSection>('toc');
  let bookPage = $state(0);
  const bookEntries = $derived(
    isLabPuzzle
      ? buildBookEntries({
          ...labPuzzle.reference,
          geneSequences: labPuzzle.geneSequences ?? labPuzzle.reference.geneSequences ?? GENE_SEQUENCES,
          enzymes: labPuzzle.enzymes,
          referenceEnzymes: labPuzzle.referenceEnzymes,
          antibodies: labPuzzle.elisaDesign?.antibodies,
          primers: labPuzzle.samplePcr?.primers,
        })
      : []
  );

  // ── Shared title/goal derived from current puzzle ────────────────
  const currentTitle = $derived(isCircularPuzzle ? circularPuzzle.title : isLabPuzzle ? labPuzzle.title : puzzle.title);
  const currentGoal = $derived(isCircularPuzzle ? circularPuzzle.goal : isLabPuzzle ? labPuzzle.briefing : puzzle.goal);

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
    // Append after the rightmost occupied slot
    let lastOccupied = -1;
    for (let i = strand.length - 1; i >= 0; i--) {
      if (strand[i] !== null) { lastOccupied = i; break; }
    }
    const target = lastOccupied + 1;
    if (target >= strand.length || strand[target] !== null) return;
    const next = [...strand];
    next[target] = partId;
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
    const newRevealed = new Set(revealedTests);
    testResults.forEach((_, i) => {
      const expectKeys = Object.keys(puzzle.tests[i].expect);
      if (expectKeys.includes(protein)) {
        newRevealed.add(i);
      }
    });
    revealedTests = newRevealed;

    if (revealedTests.size === testResults.length) {
      puzzleComplete = testResults.every(r => r.passed);
    }
  }

  function goToPuzzle(index: number) {
    puzzleIndex = index;
    puzzleComplete = false;
    showHint = false;

    if (index < STRAND_COUNT) {
      const p = PUZZLES[index];
      strand = p.prefilled ? [...p.prefilled] : new Array(p.strandSlots).fill(null);
      deskItems = [];
      showingResult = false;
      scanning = false;
      scanIndex = -1;
      testResults = [];
      displayResult = null;
      revealedTests = new Set();
      allSimResults = [];
      activeConditionIndex = 0;
      selectedInstrument = null;
      sidebarTab = 'parts';
      labInstrument = 'cell';
    } else if (index < LAB_START) {
      resetCircularPuzzle();
      deskItems = [];
      sidebarTab = 'parts';
    } else {
      const lp = LAB_PUZZLES[index - LAB_START];
      labInstrument = lp.instruments[0] as typeof labInstrument;
      gelLanes = [];
      labTubeCount = 0;
      wrongGuesses = new Set();
      excisedBands = new Set();
      sequencerBand = null;
      spectReadings = [];
      elisaLoadedSample = null;
      pcrLoadedSample = null;
      digestLoadedTube = null;
      sidebarTab = 'instruments';
      bookOpen = false;
      bookSection = 'toc';
      bookPage = 0;
      const answerOptions = lp.answerOptions ?? lp.reference.geneTable.map(g => g.name);
      const items: DeskItem[] = [
        {
          id: 'briefing-note',
          type: 'briefing-note',
          label: 'Objective',
          data: { briefing: lp.briefing },
          x: 10,
          y: 10,
        },
        {
          id: 'ref-book',
          type: 'reference-book',
          label: 'Gene Reference',
          data: { ...lp.reference, geneSequences: lp.geneSequences, page: 0 },
          x: 360,
          y: 10,
        },
        ...(lp.acceptedAnswers.length > 0 ? [{
          id: 'answer-sheet',
          type: 'answer-sheet' as const,
          label: 'Answer Sheet',
          data: {
            genes: answerOptions,
            prompt: lp.question,
            mappingLabels: lp.answerMappingLabels,
            mappingOptions: lp.answerMappingOptions,
          },
          x: 660,
          y: 10,
        }] : []),
      ];

      // Add sample tubes when puzzle provides them
      const samples = lp.elisaDesign?.samples ?? lp.samplePcr?.samples ?? lp.startingSamples;
      if (samples) {
        samples.forEach((name, i) => {
          items.push({
            id: `sample-${i}`,
            type: 'sample-tube',
            label: name,
            data: { sampleName: name } satisfies SampleTubeData,
            x: 10 + i * 140,
            y: 180,
          });
        });
      }

      deskItems = items;
    }
  }

  function clearStrand() {
    goToPuzzle(puzzleIndex);
  }

  function nextPuzzle() {
    if (puzzleIndex >= allPuzzleLabels.length - 1) return;
    goToPuzzle(puzzleIndex + 1);
  }

  // Lab helpers
  function handlePcrResult(bandSize: number | null, failReason?: string) {
    labTubeCount++;
    const extraBands = (bandSize && labPuzzle.contaminantBands)
      ? labPuzzle.contaminantBands.map(b => b.bp)
      : [];
    const item: DeskItem = {
      id: `tube-${labTubeCount}`,
      type: 'pcr-tube',
      label: `PCR #${labTubeCount}`,
      data: { bandSize, failReason, extraBands } satisfies PcrResult,
      x: 10 + (labTubeCount - 1) * 160,
      y: 180,
    };
    deskItems = [...deskItems, item];
  }

  function handleLoadGel(tubeId: string) {
    const item = deskItems.find(d => d.id === tubeId);
    if (!item) return;
    if (item.type === 'pcr-tube') {
      const data = item.data as PcrResult;
      if (!data.bandSize) return;
      const bands = [data.bandSize, ...(data.extraBands ?? [])];
      gelLanes = [...gelLanes, { label: item.label, bands }];
    } else if (item.type === 'digest-tube') {
      const data = item.data as DigestResult;
      gelLanes = [...gelLanes, { label: item.label, bands: data.fragments }];
    } else {
      return;
    }
    labInstrument = 'gel';
  }

  function handleGelExcise(laneIndex: number, bandBp: number) {
    const key = `${laneIndex}-${bandBp}`;
    if (excisedBands.has(key)) return;
    excisedBands = new Set([...excisedBands, key]);

    // Find the sequence for this band
    const contaminant = labPuzzle.contaminantBands?.find(b => b.bp === bandBp);
    const sequence = contaminant?.sequence
      ?? (labPuzzle.actualInsert ? GENE_SEQUENCES[labPuzzle.actualInsert.name] : undefined)
      ?? 'ATGNNNNNNNNNNNNNNNNNNNNNNNNNNNN';

    const exciseCount = excisedBands.size + 1;
    const sourceLabel = gelLanes[laneIndex]?.label ?? '';
    const item: DeskItem = {
      id: `excised-${Date.now()}`,
      type: 'excised-band',
      label: `Excised Band #${exciseCount}`,
      data: { bandBp, sequence, sourceLabel } satisfies ExcisedBandData,
      x: 10,
      y: 320,
    };
    deskItems = [...deskItems, item];
  }

  function handleLoadSequencer(itemId: string) {
    const item = deskItems.find(d => d.id === itemId);
    if (!item || item.type !== 'excised-band') return;
    sequencerBand = item.data as ExcisedBandData;
    labInstrument = 'sequencer';
  }

  function handleDigestResult(enzyme: string, fragments: number[]) {
    labTubeCount++;
    const item: DeskItem = {
      id: `digest-${labTubeCount}`,
      type: 'digest-tube',
      label: `${enzyme} Digest`,
      data: { enzyme, fragments } satisfies DigestResult,
      x: 10 + (labTubeCount - 1) * 160,
      y: 180,
    };
    deskItems = [...deskItems, item];
  }

  function handleLoadDigest(itemId: string) {
    const item = deskItems.find(d => d.id === itemId);
    if (!item || item.type !== 'pcr-tube') return;
    digestLoadedTube = item.label;
    labInstrument = 'digest';
  }

  function handleTubeGrab(tubeId: string, e: PointerEvent) {
    const item = deskItems.find(d => d.id === tubeId);
    if (!item) return;
    tubeDrag = { id: tubeId, label: item.label, x: e.clientX, y: e.clientY };

    const onMove = (ev: PointerEvent) => {
      if (tubeDrag) tubeDrag = { ...tubeDrag, x: ev.clientX, y: ev.clientY };
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const wellEl = el?.closest('[data-gel-well]');
      const seqEl = el?.closest('[data-seq-well]');
      const elisaEl = el?.closest('[data-elisa-well]');
      const pcrEl = el?.closest('[data-pcr-well]');
      const digestEl = el?.closest('[data-digest-well]');
      if (wellEl && tubeDrag) {
        handleLoadGel(tubeDrag.id);
      } else if (seqEl && tubeDrag) {
        handleLoadSequencer(tubeDrag.id);
      } else if (elisaEl && tubeDrag) {
        handleLoadElisa(tubeDrag.id);
      } else if (pcrEl && tubeDrag) {
        handleLoadPcr(tubeDrag.id);
      } else if (digestEl && tubeDrag) {
        handleLoadDigest(tubeDrag.id);
      } else if (tubeDrag) {
        // Dropped on desk — reposition the item
        const deskEl = document.querySelector('.desk');
        if (deskEl) {
          const rect = deskEl.getBoundingClientRect();
          const x = Math.max(0, ev.clientX - rect.left - 70);
          const y = Math.max(0, ev.clientY - rect.top - 20);
          handleDeskMove(tubeDrag.id, x, y);
        }
      }
      tubeDrag = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function handleDeskMove(id: string, x: number, y: number) {
    deskItems = deskItems.map(d => d.id === id ? { ...d, x, y } : d);
  }

  function handleBringToFront(id: string) {
    const item = deskItems.find(d => d.id === id);
    if (!item) return;
    deskItems = [...deskItems.filter(d => d.id !== id), item];
  }

  function handleDeskAnswer(gene: string) {
    if (wrongGuesses.has(gene) || wrongGuesses.size >= MAX_GUESSES) return;
    const correct = labPuzzle.acceptedAnswers.some(
      a => a.toLowerCase() === gene.toLowerCase()
    );
    if (correct) {
      puzzleComplete = true;
    } else {
      wrongGuesses = new Set([...wrongGuesses, gene]);
    }
  }

  function resetLabExperiments() {
    // Clear all experimental results from the desk, keep tubes/samples/reference/answer-sheet
    const keepTypes = new Set(['sample-tube', 'reference-book', 'answer-sheet', 'objective-card']);
    deskItems = deskItems.filter(d => keepTypes.has(d.type));
    // Reset instrument state
    elisaLoadedSample = null;
    pcrLoadedSample = null;
    digestLoadedTube = null;
    gelLanes = [];
    excisedBands = new Set();
    sequencerBand = null;
  }

  function handleMappingAnswer(mapping: Record<string, string>) {
    if (!labPuzzle.answerMappingLabels) return;
    const truthMap = labPuzzle.elisaDesign?.truthMap ?? labPuzzle.samplePcr?.truthMap;
    if (!truthMap) return;
    const allCorrect = labPuzzle.answerMappingLabels.every(
      label => mapping[label] === truthMap[label]
    );
    if (allCorrect) {
      puzzleComplete = true;
    } else {
      // Wrong mapping — clear experiments so the player must re-run with a better strategy
      resetLabExperiments();
    }
  }

  function handleLoadElisa(itemId: string) {
    const item = deskItems.find(d => d.id === itemId);
    if (!item || item.type !== 'sample-tube') return;
    const data = item.data as SampleTubeData;
    elisaLoadedSample = data.sampleName;
    labInstrument = 'elisa';
  }

  function handleElisaTest(sample: string, antibody: string, signal: ElisaSignal) {
    if (!labPuzzle.elisaDesign) return;
    labTubeCount++;
    const item: DeskItem = {
      id: `elisa-${labTubeCount}`,
      type: 'elisa-result',
      label: `${sample} + ${antibody}`,
      data: { sample, antibody, signal } satisfies ElisaResultData,
      x: 10 + (labTubeCount - 1) * 140,
      y: 320,
    };
    deskItems = [...deskItems, item];
  }

  function handleLoadPcr(itemId: string) {
    const item = deskItems.find(d => d.id === itemId);
    if (!item || item.type !== 'sample-tube') return;
    const data = item.data as SampleTubeData;
    pcrLoadedSample = data.sampleName;
    labInstrument = 'pcr';
  }

  function handleSamplePcrResult(bandSize: number | null, failReason?: string) {
    if (!pcrLoadedSample) return;
    labTubeCount++;
    const item: DeskItem = {
      id: `tube-${labTubeCount}`,
      type: 'pcr-tube',
      label: `${pcrLoadedSample} PCR`,
      data: { bandSize, failReason: failReason ?? (bandSize ? undefined : 'No amplification'), extraBands: [] } satisfies PcrResult,
      x: 10 + (labTubeCount - 1) * 160,
      y: 320,
    };
    deskItems = [...deskItems, item];
  }

  function handleBookOpen(_id: string) {
    bookOpen = true;
    // Ensure the opened book starts in-view on shorter viewports.
    deskItems = deskItems.map(d => d.type === 'reference-book' ? { ...d, y: 10 } : d);
  }

  function handleBookClose(_id: string) {
    bookOpen = false;
  }
</script>

<main class="app" class:lab-mode={isLabPuzzle} class:circular-mode={isCircularPuzzle}>
  <!-- Header -->
  <header class="header">
    <nav class="puzzle-nav">
      {#each allPuzzleLabels as p, i}
        <button
          class="puzzle-pip"
          class:active={i === puzzleIndex}
          class:lab-pip={i >= STRAND_COUNT && i < CIRCULAR_START}
          class:circular-pip={i >= CIRCULAR_START}
          onclick={() => goToPuzzle(i)}
          title={p.title}
        >{p.id}</button>
      {/each}
    </nav>
    <h1 class="puzzle-title">{currentTitle}</h1>
    {#if !isLabPuzzle}<p class="puzzle-goal">{currentGoal}</p>{/if}
  </header>

  <!-- Body: sidebar + instrument/cell + desk -->
  <div class="body">
    <aside class="sidebar">
      <!-- Sidebar tabs -->
      <div class="sidebar-tabs">
        <button
          class="sidebar-tab"
          class:active={sidebarTab === 'parts'}
          onclick={() => sidebarTab = 'parts'}
        >Parts</button>
        <button
          class="sidebar-tab"
          class:active={sidebarTab === 'instruments'}
          onclick={() => sidebarTab = 'instruments'}
        >Instruments</button>
      </div>

      {#if sidebarTab === 'parts'}
        {#if isCircularPuzzle}
          <PartsLibrary parts={circularAvailableParts} onadd={addPartToCircular} compact={true} />
          <p class="circular-help">Click a part to add it. Drag parts on the ring to reorder. Hover a placed part to reveal the red x delete control.</p>
          <button class="hint-btn" onclick={() => circularShowHint = !circularShowHint}>
            {circularShowHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          {#if circularShowHint}
            <p class="hint-text">{circularPuzzle.hint}</p>
          {/if}
        {:else if availableParts.length > 0}
          <PartsLibrary parts={availableParts} disabled={showingResult} onadd={addPartToFirstSlot} />
        {:else}
          <p class="sidebar-empty">No parts for this puzzle.</p>
        {/if}

        {#if !isLabPuzzle && !isCircularPuzzle && puzzle.hint}
          <button class="hint-btn" onclick={() => showHint = !showHint}>
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          {#if showHint}
            <p class="hint-text">{puzzle.hint}</p>
          {/if}
        {/if}
      {:else}
        <div class="instrument-list">
          {#if !isLabPuzzle}
            <button
              class="instrument-tab"
              class:active={labInstrument === 'cell'}
              onclick={() => labInstrument = 'cell'}
            >🔬 Cell View</button>
          {/if}
          {#if isLabPuzzle}
            {#if labPuzzle.instruments.includes('pcr')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'pcr'}
                onclick={() => labInstrument = 'pcr'}
              >🧬 PCR</button>
            {/if}
            {#if labPuzzle.instruments.includes('gel')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'gel'}
                onclick={() => labInstrument = 'gel'}
              >⚡ Gel</button>
            {/if}
            {#if labPuzzle.instruments.includes('sequencer')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'sequencer'}
                onclick={() => labInstrument = 'sequencer'}
              >🔬 Sequencer</button>
            {/if}
            {#if labPuzzle.instruments.includes('digest')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'digest'}
                onclick={() => labInstrument = 'digest'}
              >✂️ Digest</button>
            {/if}
            {#if labPuzzle.instruments.includes('elisa')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'elisa'}
                onclick={() => labInstrument = 'elisa'}
              >🧫 ELISA</button>
            {/if}
            {#if labPuzzle.instruments.includes('spectrophotometer')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'spectrophotometer'}
                onclick={() => labInstrument = 'spectrophotometer'}
              >📊 Spec</button>
            {/if}
            {#if labPuzzle.instruments.includes('assembly')}
              <button
                class="instrument-tab"
                class:active={labInstrument === 'assembly'}
                onclick={() => labInstrument = 'assembly'}
              >🧩 Assembly</button>
            {/if}
          {/if}
        </div>
      {/if}
    </aside>

    <div class="main-column">
      {#if isCircularPuzzle}
        <!-- Circular plasmid fills the main column -->
        <div class="circular-canvas">
          <div class="plasmid-wrap">
            <CircularPlasmid
              parts={circularParts}
              engineOutput={circularEngineOutput}
              onplace={handleCircularPlace}
              onremove={handleCircularRemove}
              onreorder={handleCircularReorder}
            />
            <MolecularAnimation parts={circularParts} engineOutput={circularEngineOutput} />
          </div>
        </div>
        <div class="circular-footer">
          <div class="circular-controls">
            <span class="host-badge" class:eukaryotic={circularPuzzle.hostMode === 'eukaryotic'}>
              {circularPuzzle.hostMode === 'bacterial' ? '🦠 Bacterial cell' : '🧫 Eukaryotic cell'}
            </span>
            <button class="ctrl-btn run" onclick={runCircularPuzzle} disabled={circularParts.length === 0}>
              ▶ Run Simulation
            </button>
            <button class="ctrl-btn clear" onclick={resetCircularPuzzle}>
              Reset
            </button>
          </div>
          <p class="circular-legend">
            Amber RNA polymerase transcribes the DNA ring. Released messenger RNA docks in the transcript lanes; pale ribosomes bind those RNA strands and release protein.
          </p>
          {#if circularEngineOutput}
            {#if circularConditionChoices.length > 1}
              <div class="condition-switcher circular-condition-switcher">
                {#each circularConditionChoices as condition}
                  <button
                    class="condition-tab"
                    class:active={circularConditionIndex === condition.index}
                    onclick={() => setCircularCondition(condition.index)}
                  >
                    {condition.label}
                  </button>
                {/each}
              </div>
            {/if}
            <div class="sim-hud" class:warn={circularHealthTone !== 'normal'}>
              <span class="hud-pill" class:warn={circularHealthTone !== 'normal'} title="Cell health state"></span>
              <div class="hud-proteins" aria-label="Detected proteins">
                {#if circularVisualProteins.length > 0}
                  {#each circularVisualProteins as protein}
                    <span class="protein-chip">{protein}</span>
                  {/each}
                {:else}
                  <span class="protein-chip muted">No output</span>
                {/if}
              </div>
              <span class="hud-checks" title="Passed checks">{circularPassedCount}/{Math.max(1, circularTestResults.length)}</span>
            </div>
            {#if circularHealthMessage}
              <p class="hud-warning">⚠ {circularHealthMessage}</p>
            {/if}
          {/if}
          {#if circularTestResults.length > 0}
            <div class="circular-results">
              <div class="check-dots" aria-label="Puzzle check results">
                {#each circularTestResults as result}
                  <span
                    class="check-dot"
                    class:passed={result.passed}
                    class:failed={!result.passed}
                    title={result.label}
                  ></span>
                {/each}
              </div>
              {#if circularPuzzleComplete}
                <p class="complete-msg">Puzzle complete! 🎉</p>
                {#if circularEngineOutput}
                  <p class="efficiency-score">⚗ {circularEngineOutput.efficiencyScore.partCount} parts · RNA polymerase load {circularEngineOutput.efficiencyScore.transcriptionalLoad}</p>
                {/if}
              {/if}
            </div>
          {/if}
          {#if circularFailedChecks.length > 0}
            <div class="circular-feedback" class:warn={circularHealthTone !== 'normal'}>
              <span class="feedback-title">Needs work</span>
              {#each circularFailedChecks as label}
                <p>{label}</p>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
      <!-- Instrument / Cell view area -->
      <section class="instrument-area">
        {#if labInstrument === 'cell'}
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
        {:else if labInstrument === 'pcr' && isLabPuzzle && labPuzzle.plasmid}
          {#if labPuzzle.startingSamples}
            <PcrInstrument
              plasmid={labPuzzle.plasmid}
              dragActive={tubeDrag !== null}
              loadedSample={pcrLoadedSample}
              onresult={handlePcrResult}
              oneject={() => pcrLoadedSample = null}
            />
          {:else}
            <PcrInstrument plasmid={labPuzzle.plasmid} onresult={handlePcrResult} />
          {/if}
        {:else if labInstrument === 'pcr' && isLabPuzzle && labPuzzle.samplePcr}
          <PcrInstrument
            samplePcr={labPuzzle.samplePcr}
            dragActive={tubeDrag !== null}
            loadedSample={pcrLoadedSample}
            onresult={handleSamplePcrResult}
            oneject={() => pcrLoadedSample = null}
          />
        {:else if labInstrument === 'gel' && isLabPuzzle}
          <GelView
            lanes={gelLanes}
            dragActive={tubeDrag !== null}
            {excisedBands}
            onexcise={labPuzzle.instruments.includes('sequencer') ? handleGelExcise : undefined}
          />
        {:else if labInstrument === 'sequencer' && isLabPuzzle}
          <SequencerView loadedBand={sequencerBand} dragActive={tubeDrag !== null} />
        {:else if labInstrument === 'digest' && isLabPuzzle && labPuzzle.plasmid && labPuzzle.enzymes && labPuzzle.restrictionSites}
          {#if labPuzzle.startingSamples}
            <DigestInstrument
              plasmid={labPuzzle.plasmid}
              enzymes={labPuzzle.enzymes}
              restrictionSites={labPuzzle.restrictionSites}
              insertLength={labPuzzle.actualInsert?.length}
              candidateGenes={labPuzzle.candidateGenes}
              dragActive={tubeDrag !== null}
              loadedTube={digestLoadedTube}
              oneject={() => digestLoadedTube = null}
              onresult={handleDigestResult}
            />
          {:else}
            <DigestInstrument
              plasmid={labPuzzle.plasmid}
              enzymes={labPuzzle.enzymes}
              restrictionSites={labPuzzle.restrictionSites}
              insertLength={labPuzzle.actualInsert?.length}
              candidateGenes={labPuzzle.candidateGenes}
              onresult={handleDigestResult}
            />
          {/if}
        {:else if labInstrument === 'elisa' && isLabPuzzle && labPuzzle.elisaDesign}
          <ElisaView
            design={labPuzzle.elisaDesign}
            dragActive={tubeDrag !== null}
            loadedSample={elisaLoadedSample}
            ontest={handleElisaTest}
            oneject={() => elisaLoadedSample = null}
          />
        {:else if labInstrument === 'spectrophotometer' && isLabPuzzle}
          <SpectrophotometerView
            curve={labPuzzle.growthCurve}
            budget={labPuzzle.spectBudget}
            readings={spectReadings}
            onreading={(p) => spectReadings = [...spectReadings, p].sort((a, b) => a.timepoint - b.timepoint)}
          />
        {:else if labInstrument === 'assembly' && isLabPuzzle && labPuzzle.assemblyData}
          <AssemblyWorkspace data={labPuzzle.assemblyData} />
        {:else if labInstrument === 'promoter-architect' && isLabPuzzle && labPuzzle.promoterData}
          {#key labPuzzle.id}
            <PromoterArchitect data={labPuzzle.promoterData} onpuzzlecomplete={() => puzzleComplete = true} />
          {/key}
        {/if}

        {#if puzzleComplete}
          <div class="success-banner">
            Puzzle Complete!
            {#if puzzleIndex < allPuzzleLabels.length - 1}
              <button class="next-btn" onclick={nextPuzzle}>Next Puzzle →</button>
            {:else}
              <span class="final-msg">You finished all puzzles! 🧬</span>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Desk area (always visible) -->
      <section class="desk-section">
        <DeskSurface
          items={deskItems}
          onmove={handleDeskMove}
          onbringtofront={handleBringToFront}
          ontubegrab={handleTubeGrab}
          onanswer={handleDeskAnswer}
          onmappinganswer={handleMappingAnswer}
          onbookopen={handleBookOpen}
          onbookclose={handleBookClose}
          onbooksection={(s) => bookSection = s}
          onbookpage={(p) => bookPage = p}
          {bookOpen}
          {bookSection}
          {bookPage}
          bookEntries={bookEntries}
          wrongGuesses={wrongGuesses}
          maxGuesses={MAX_GUESSES}
          draggedTubeId={tubeDrag?.id}
        />
      </section>
      {/if}
    </div>
  </div>

  {#if !isLabPuzzle && !isCircularPuzzle}
    <!-- Bottom: strand + controls (strand puzzles only) -->
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

    <footer class="controls">
      <button class="ctrl-btn clear" onclick={clearStrand} disabled={strandEmpty && !showingResult}>
        Reset
      </button>
      <button class="ctrl-btn run" onclick={runCell} disabled={strandEmpty || showingResult || scanning}>
        ▶ Run Cell
      </button>
    </footer>
  {/if}

  {#if tubeDrag}
    {@const dragItem = deskItems.find(d => d.id === tubeDrag?.id)}
    <div
      class="tube-ghost"
      style:left="{tubeDrag.x}px"
      style:top="{tubeDrag.y}px"
    >{dragItem?.type === 'excised-band' ? '🔬' : dragItem?.type === 'digest-tube' ? '✂️' : dragItem?.type === 'sample-tube' ? '🧫' : '🧪'} {tubeDrag.label}</div>
  {/if}
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

  .puzzle-pip.lab-pip {
    border-color: #5a7a5a;
  }

  .puzzle-pip.lab-pip.active {
    background: #3a5a3a;
    border-color: #7a9a7a;
  }

  .puzzle-pip.circular-pip {
    border-color: #5a5a8a;
  }

  .puzzle-pip.circular-pip.active {
    background: #2a2a5a;
    border-color: #7a7aaa;
  }

  /* Circular puzzle layout */
  .circular-mode .main-column {
    flex-direction: column;
  }

  .circular-canvas {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
  }

  /* Square wrapper so the anim overlay aligns with the plasmid SVG */
  .plasmid-wrap {
    position: relative;
    height: 100%;
    aspect-ratio: 1;
  }

  .circular-footer {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    padding: 8px 0;
    flex-shrink: 0;
  }

  .circular-controls {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .circular-legend {
    margin: 0;
    max-width: 680px;
    font-size: 12px;
    line-height: 1.35;
    color: var(--parchment-aged);
  }

  .circular-results {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .circular-condition-switcher {
    flex-wrap: wrap;
    justify-content: flex-start;
    max-width: 520px;
  }

  .test-icon {
    font-size: 14px;
    font-weight: bold;
  }

  .complete-msg {
    text-align: center;
    font-size: 15px;
    color: #8ada8a;
    font-weight: bold;
    margin-top: 8px;
  }

  .efficiency-score {
    text-align: center;
    font-size: 12px;
    color: #93c5fd;
    margin: 0;
  }

  .sim-hud {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 300px;
    max-width: 520px;
    padding: 6px 8px;
    border: 1px solid #24523a;
    border-radius: 6px;
    background: #0f2019;
  }

  .sim-hud.warn {
    border-color: #7a5d1f;
    background: #2b220f;
  }

  .hud-pill {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
    flex-shrink: 0;
  }

  .hud-pill.warn {
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.7);
  }

  .hud-proteins {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    min-height: 20px;
  }

  .protein-chip {
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid #2f4f3e;
    background: #173124;
    font-size: 12px;
    color: var(--parchment);
  }

  .protein-chip.muted {
    border-color: #4b5563;
    background: #1f2937;
    color: #9ca3af;
  }

  .hud-checks {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: #e5e7eb;
    min-width: 40px;
    text-align: right;
  }

  .hud-warning {
    margin: 6px 0 0;
    max-width: 560px;
    font-size: 12px;
    color: #fbbf24;
    background: #2b1f07;
    border: 1px solid #7a5d1f;
    border-radius: 6px;
    padding: 6px 10px;
    line-height: 1.35;
  }

  .circular-feedback {
    max-width: 540px;
    padding: 6px 10px;
    border: 1px solid #5a3f3f;
    border-radius: 6px;
    background: #251717;
    color: #fca5a5;
    font-size: 12px;
    line-height: 1.35;
  }

  .circular-feedback.warn {
    border-color: #7a5d1f;
    background: #2b1f07;
    color: #fbbf24;
  }

  .feedback-title {
    display: block;
    margin-bottom: 2px;
    color: var(--parchment);
    font-weight: 700;
  }

  .circular-feedback p {
    margin: 0;
  }

  .check-dots {
    display: flex;
    gap: 6px;
  }

  .check-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #374151;
  }

  .check-dot.passed { background: #22c55e; }
  .check-dot.failed { background: #ef4444; }

  .circular-help {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--parchment-aged);
    line-height: 1.3;
  }

  .circular-mode .sidebar,
  .circular-mode .main-column {
    user-select: none;
  }

  .hint-btn {
    margin: 8px 0 0;
    padding: 4px 10px;
    font-size: 12px;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--parchment);
    cursor: pointer;
    width: 100%;
  }

  .hint-btn:hover { border-color: var(--brass); }

  .hint-text {
    font-size: 12px;
    color: #c8b87a;
    padding: 6px 8px;
    background: #2a2000;
    border-radius: 4px;
    border: 1px solid #5a4a20;
    margin-top: 4px;
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
    overflow: hidden;
  }

  .lab-mode .body {
    gap: 10px;
    padding: 8px;
  }

  .sidebar {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  .lab-mode .sidebar {
    width: 190px;
  }

  .sidebar-tabs {
    display: flex;
    gap: 4px;
  }

  .sidebar-tab {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-medium);
    color: var(--parchment-aged);
    font-family: var(--font-heading);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .sidebar-tab:hover {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .sidebar-tab.active {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  .sidebar-empty {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    padding: 8px;
    margin: 0;
  }

  .main-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    min-height: 0;
  }

  .instrument-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-width: 0;
    min-height: 0;
  }

  .lab-mode .instrument-area {
    flex: 1.2;
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

  /* Tube ghost (cross-area drag) */
  .tube-ghost {
    position: fixed;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1000;
    background: var(--bg-dark);
    border: 1px solid var(--brass);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment);
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    opacity: 0.9;
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

  .host-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-family: var(--font-heading);
    background: rgba(30, 58, 138, 0.3);
    border: 1px solid rgba(96, 165, 250, 0.35);
    color: #93c5fd;
    letter-spacing: 0.01em;
  }

  .host-badge.eukaryotic {
    background: rgba(88, 28, 135, 0.3);
    border-color: rgba(167, 139, 250, 0.35);
    color: #c4b5fd;
  }

  /* Desk section */
  .desk-section {
    position: relative;
    flex: 1;
    display: flex;
    min-height: 180px;
    border-top: 1px solid var(--brass-dark);
  }

  .lab-mode .desk-section {
    flex: 1;
    min-height: 250px;
  }

  /* Lab sidebar instruments */
  .instrument-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .instrument-tab {
    padding: 8px 12px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-medium);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }

  .instrument-tab:hover:not(:disabled) {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .instrument-tab.active {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  .instrument-tab:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
