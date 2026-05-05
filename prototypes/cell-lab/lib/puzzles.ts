import type { Puzzle, CircularPuzzle } from './types';

export const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'Hello, Cell!',
    goal: 'Make the cell glow.',
    hint: 'A gene needs a promoter upstream to be expressed. Don\'t forget the terminator!',
    availablePartIds: ['constitutive-promoter', 'gfp-gene', 'terminator'],
    strandSlots: 3,
    tests: [
      {
        signals: {},
        label: 'Cell glows',
        expect: { GFP: { min: 1 } },
      },
    ],
  },
  {
    id: 2,
    title: 'Sugar Switch',
    goal: 'Make the cell glow only when sugar is present.',
    hint: 'The constitutive promoter is always on. Try a different one.',
    availablePartIds: ['constitutive-promoter', 'sugar-promoter', 'gfp-gene', 'terminator'],
    strandSlots: 3,
    tests: [
      {
        signals: { sugar: true },
        label: 'With sugar → glows',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: {},
        label: 'Without sugar → dark',
        expect: { GFP: { max: 0 } },
      },
    ],
  },
  {
    id: 3,
    title: 'Brighter!',
    goal: 'Make the cell glow with intensity ≥ 4.',
    hint: 'Use a stronger promoter, or add more copies of the gene.',
    availablePartIds: ['constitutive-promoter', 'strong-promoter', 'gfp-gene', 'terminator'],
    strandSlots: 7,
    tests: [
      {
        signals: {},
        label: 'GFP intensity ≥ 4',
        expect: { GFP: { min: 4 } },
      },
    ],
  },
  {
    id: 4,
    title: 'Dual Color',
    goal: 'Make the cell glow both green AND red simultaneously.',
    hint: 'Each gene needs a promoter upstream. You can share one or use separate promoter–gene pairs.',
    availablePartIds: ['constitutive-promoter', 'gfp-gene', 'rfp-gene', 'terminator'],
    strandSlots: 7,
    tests: [
      {
        signals: {},
        label: 'Green AND red',
        expect: { GFP: { min: 1 }, RFP: { min: 1 } },
      },
    ],
  },
  {
    id: 5,
    title: 'Exclusive Switch',
    goal: 'Green when sugar, red when toxin — never both at once.',
    hint: 'The repressor blocks the toxin promoter. If sugar drives both GFP and the repressor…',
    availablePartIds: [
      'sugar-promoter', 'poison-promoter',
      'gfp-gene', 'rfp-gene', 'repressor-gene',
      'terminator',
    ],
    strandSlots: 9,
    tests: [
      {
        signals: { sugar: true },
        label: 'Sugar only → green',
        expect: { GFP: { min: 1 }, RFP: { max: 0 } },
      },
      {
        signals: { poison: true },
        label: 'Toxin only → red',
        expect: { RFP: { min: 1 }, GFP: { max: 0 } },
      },
      {
        signals: { sugar: true, poison: true },
        label: 'Both → green only',
        expect: { GFP: { min: 1 }, RFP: { max: 0 } },
      },
      {
        signals: {},
        label: 'Neither → dark',
        expect: { GFP: { max: 0 }, RFP: { max: 0 } },
      },
    ],
  },
  {
    id: 6,
    title: 'Inverted',
    goal: 'Make the cell glow when sugar is ABSENT.',
    hint: 'The repressor silences the repressible promoter. If sugar drives the repressor…',
    availablePartIds: [
      'sugar-promoter', 'repressible-promoter',
      'repressor-gene', 'gfp-gene',
      'terminator',
    ],
    strandSlots: 7,
    tests: [
      {
        signals: {},
        label: 'No sugar → glows',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: { sugar: true },
        label: 'With sugar → dark',
        expect: { GFP: { max: 0 } },
      },
    ],
  },
  {
    id: 7,
    title: 'Both Required',
    goal: 'Glow ONLY when both sugar AND toxin are present.',
    hint: 'Split GFP needs both halves to fluoresce. Each half can be driven by a different signal.',
    availablePartIds: [
      'sugar-promoter', 'poison-promoter',
      'gfp-n-gene', 'gfp-c-gene',
      'terminator',
    ],
    strandSlots: 7,
    tests: [
      {
        signals: { sugar: true, poison: true },
        label: 'Both → glows',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: { sugar: true },
        label: 'Sugar only → dark',
        expect: { GFP: { max: 0 } },
      },
      {
        signals: { poison: true },
        label: 'Toxin only → dark',
        expect: { GFP: { max: 0 } },
      },
      {
        signals: {},
        label: 'Neither → dark',
        expect: { GFP: { max: 0 } },
      },
    ],
  },
  {
    id: 8,
    title: 'Amplifier',
    goal: 'Amplify a weak signal. GFP ≥ 6 when sugar is present.',
    hint: 'The activator gene (ACT) produces ActA protein. The activator-responsive promoter (ACTR) only fires when ActA is present — and it\'s strong (strength 3). Use this relay to amplify a weak sugar signal.',
    availablePartIds: [
      'weak-sugar-promoter', 'activator-promoter',
      'activator-gene', 'gfp-gene',
      'terminator',
    ],
    strandSlots: 6,
    tests: [
      {
        signals: { sugar: true },
        label: 'Sugar → GFP ≥ 6',
        expect: { GFP: { min: 6 } },
      },
      {
        signals: {},
        label: 'No sugar → dark',
        expect: { GFP: { max: 0 } },
      },
    ],
  },
  {
    id: 9,
    title: 'NOR Gate',
    goal: 'Glow ONLY when NEITHER sugar NOR toxin is present.',
    hint: 'Both signals should silence the cell. What if both drive the same repressor, which blocks your GFP promoter?',
    availablePartIds: [
      'sugar-promoter', 'toxin-promoter',
      'repressible-promoter', 'repressor-gene', 'gfp-gene',
      'terminator',
    ],
    strandSlots: 9,
    tests: [
      {
        signals: {},
        label: 'Neither → glows',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: { sugar: true },
        label: 'Sugar only → dark',
        expect: { GFP: { max: 0 } },
      },
      {
        signals: { poison: true },
        label: 'Toxin only → dark',
        expect: { GFP: { max: 0 } },
      },
      {
        signals: { sugar: true, poison: true },
        label: 'Both → dark',
        expect: { GFP: { max: 0 } },
      },
    ],
  },
  {
    id: 10,
    title: 'Hidden Product',
    goal: 'Make Insulin when sugar is present. Insulin doesn\'t glow — use the Protein Detector to verify.',
    hint: 'Insulin is just like GFP — it needs a promoter upstream. But you won\'t see a glow. Use the detector!',
    availablePartIds: [
      'sugar-promoter', 'constitutive-promoter',
      'insulin-gene', 'gfp-gene',
      'terminator',
    ],
    strandSlots: 5,
    detectableProteins: ['GFP', 'RFP', 'Insulin', 'RepA', 'ActA'],
    tests: [
      {
        signals: { sugar: true },
        label: 'Sugar → Insulin?',
        expect: { Insulin: { min: 1 } },
      },
      {
        signals: {},
        label: 'No sugar → no Insulin?',
        expect: { Insulin: { max: 0 } },
      },
    ],
  },
  {
    id: 11,
    title: 'The Silencer',
    goal: 'This cell glows green normally, but goes dark when sugar is added. Something is silencing the GFP. Identify what the hidden gene produces.',
    hint: 'Look at the visible promoters. RPR is a repressible promoter — what protein silences it? You learned this in earlier puzzles.',
    availablePartIds: [],
    strandSlots: 6,
    prefilled: ['sugar-promoter', 'repressor-gene', 'terminator', 'repressible-promoter', 'gfp-gene', 'terminator'],
    hiddenGenes: true,
    detectableProteins: ['GFP', 'RFP', 'Insulin', 'RepA', 'ActA'],
    tests: [
      {
        signals: {},
        label: 'No sugar → ?',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: { sugar: true },
        label: 'With sugar → ?',
        expect: { RepA: { min: 1 } },
      },
    ],
  },
  {
    id: 12,
    title: 'Signal Boost',
    goal: 'This cell has two hidden genes. CMV drives the first, ACTR drives the second. The cell glows green. Identify both hidden proteins.',
    hint: 'The cell glows green — which gene makes green? ACTR only activates when a specific protein is present — which protein?',
    availablePartIds: [],
    strandSlots: 6,
    prefilled: ['constitutive-promoter', 'activator-gene', 'terminator', 'activator-promoter', 'gfp-gene', 'terminator'],
    hiddenGenes: true,
    detectableProteins: ['GFP', 'RFP', 'Insulin', 'RepA', 'ActA'],
    tests: [
      {
        signals: {},
        label: 'Hidden protein 1?',
        expect: { ActA: { min: 1 } },
      },
      {
        signals: {},
        label: 'Hidden protein 2?',
        expect: { GFP: { min: 1 } },
      },
    ],
  },
  {
    id: 13,
    title: 'Silent Gene',
    goal: 'This cell should glow, but it doesn\'t. The parts are all here — something is in the wrong order.',
    hint: 'A gene needs a promoter UPSTREAM (to the left) to be expressed. Check the order.',
    availablePartIds: ['constitutive-promoter', 'gfp-gene', 'terminator'],
    strandSlots: 3,
    prefilled: ['gfp-gene', 'constitutive-promoter', 'terminator'],
    tests: [
      {
        signals: {},
        label: 'Cell glows',
        expect: { GFP: { min: 1 } },
      },
    ],
  },
  {
    id: 14,
    title: 'The Leak',
    goal: 'This cell should only glow when sugar is added, but it glows all the time. Find and fix the leak.',
    hint: 'The brightness meter shows GFP even without sugar. That means something constitutive is driving GFP. Look for a second expression unit.',
    availablePartIds: ['sugar-promoter', 'gfp-gene', 'terminator'],
    strandSlots: 6,
    prefilled: ['sugar-promoter', 'gfp-gene', 'terminator', 'constitutive-promoter', 'gfp-gene', 'terminator'],
    brightnessMeter: ['GFP'],
    tests: [
      {
        signals: { sugar: true },
        label: 'With sugar → glows',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: {},
        label: 'No sugar → dark',
        expect: { GFP: { max: 0 } },
      },
    ],
  },
];

// ── Circular plasmid puzzles (L15–L19) ───────────────────────────────

export const CIRCULAR_PUZZLES: CircularPuzzle[] = [
  {
    id: 15,
    title: 'Balanced Reporters',
    goal: 'Build a bacterial operon that makes high LacZ and about half as much Cat, without overloading RNA polymerase.',
    hint: 'A single bacterial messenger RNA can carry both lacZ and cat. Each coding sequence needs its own Shine-Dalgarno ribosome-binding site, and the final strong terminator ends the transcript.',
    hostMode: 'bacterial',
    availablePartIds: [
      'bact-prom-const-strong',
      'bact-prom-const-strong',
      'gene-enzyme1',
      'gene-enzyme2',
      'bact-rbs-strong',
      'bact-rbs-weak',
      'bact-term-strong',
      'bact-term-leaky',
    ],
    tests: [
      {
        environment: { signals: {}, hostMode: 'bacterial' },
        label: 'LacZ high and Cat near half of LacZ',
        expect: {
          proteins: { LacZ: { min: 2 }, Cat: { min: 1 } },
          proteinRatio: { a: 'Cat', b: 'LacZ', min: 0.35, max: 0.65 },
        },
      },
      {
        environment: { signals: {}, hostMode: 'bacterial' },
        label: 'Cell not burdened',
        expect: { cellHealth: { not: 'burdened' } },
      },
    ],
  },
  {
    id: 16,
    title: 'Terminator Tuning',
    goal: 'Keep LacZ high. Cat should be low but detectable without IPTG, then high when IPTG is added.',
    hint: 'A leaky bacterial terminator stops most RNA polymerases, but a small fraction read through into the downstream cat region. IPTG turns on Plac independently.',
    hostMode: 'bacterial',
    availablePartIds: [
      'bact-prom-const-strong',
      'bact-prom-iptg',
      'gene-enzyme1',
      'gene-enzyme2',
      'linker-flex',
      'bact-rbs-strong',
      'bact-rbs-strong',
      'bact-term-strong',
      'bact-term-leaky',
    ],
    tests: [
      {
        environment: { signals: {}, hostMode: 'bacterial' },
        label: 'No IPTG: LacZ high, Cat low but present',
        expect: {
          proteins: { LacZ: { min: 2 }, Cat: { min: 0.1, max: 1.5 } },
        },
      },
      {
        environment: { signals: { iptg: 1 }, hostMode: 'bacterial' },
        label: 'With IPTG: Cat high',
        expect: {
          proteins: { LacZ: { min: 2 }, Cat: { min: 2 } },
        },
      },
    ],
  },
  {
    id: 17,
    title: 'Protease Queueing',
    goal: 'Keep AmyE at medium level (1-3), while CcdB stays below the toxic threshold so the cell remains healthy.',
    hint: 'SsrA tags send bacterial proteins to ClpXP for cleanup. Stronger tags lower protein level, but too much tagged protein can saturate the protease queue.',
    hostMode: 'bacterial',
    availablePartIds: [
      'bact-prom-const-med',
      'bact-prom-const-strong',
      'gene-enzyme-a',
      'gene-toxin-b',
      'bact-rbs-strong',
      'bact-rbs-med',
      'tag-ssra-laa',
      'tag-ssra-das',
      'tag-ssra-aav',
      'bact-term-strong',
      'bact-term-strong',
    ],
    tests: [
      {
        environment: { signals: {}, hostMode: 'bacterial' },
        label: 'AmyE 1-3, CcdB no more than 2, cell not toxic',
        expect: {
          proteins: { AmyE: { min: 1, max: 3 }, CcdB: { max: 2 } },
          cellHealth: { state: 'normal' },
        },
      },
    ],
  },
  {
    id: 18,
    title: 'The Programmable Repressor',
    goal: 'When toxin signal is present, silence all three reporter genes. Without toxin signal, keep all three active.',
    hint: 'Guide RNA is transcribed RNA: it needs to be on a transcript, but it does not need a Shine-Dalgarno site. dCas9 must be translated strongly enough to cover all three guides.',
    hostMode: 'bacterial',
    availablePartIds: [
      'bact-prom-toxin',
      'gene-dcas9',
      'linker-flex',
      'grna-a',
      'grna-b',
      'grna-c',
      'bact-rbs-weak',
      'bact-rbs-med',
      'bact-rbs-strong',
      'bact-term-strong',
    ],
    prefilled: [
      'bact-prom-g1',
      'bact-rbs-strong',
      'gene-gene1',
      'bact-term-strong',
      'bact-prom-g2',
      'bact-rbs-strong',
      'gene-gene2',
      'bact-term-strong',
      'bact-prom-g3',
      'bact-rbs-strong',
      'gene-gene3',
      'bact-term-strong',
    ],
    tests: [
      {
        environment: { signals: {}, hostMode: 'bacterial' },
        label: 'No toxin: all three reporters active',
        expect: {
          proteins: { Protein1: { min: 1 }, Protein2: { min: 1 }, Protein3: { min: 1 } },
        },
      },
      {
        environment: { signals: { toxin: 1 }, hostMode: 'bacterial' },
        label: 'Toxin present: all three reporters silenced',
        expect: {
          proteins: { Protein1: { max: 0 }, Protein2: { max: 0 }, Protein3: { max: 0 } },
        },
      },
    ],
  },
  {
    id: 19,
    title: 'The Smart Drug',
    goal: 'Produce Drug only when cancer marker and nutrient are both present, and shut Drug off when the healthy-cell marker is present.',
    hint: 'Use the cancer promoter to make an activator. Then use the nutrient promoter that also requires that activator to drive Drug. A healthy-cell transcript can make dCas9-NLS plus guide RNA to block the drug promoter.',
    hostMode: 'eukaryotic',
    availablePartIds: [
      'euk-prom-cancer',
      'euk-prom-nutrient-activator',
      'euk-prom-healthy',
      'linker-flex',
      'euk-kozak-strong',
      'euk-kozak-strong',
      'euk-kozak-strong',
      'gene-cancer-activator',
      'gene-dcas9',
      'gene-drug',
      'grna-drug-off',
      'nls',
      'euk-polya',
      'euk-polya',
      'euk-polya',
    ],
    tests: [
      {
        environment: { signals: { 'cancer-marker': 1, nutrient: 1 }, hostMode: 'eukaryotic' },
        label: 'Cancer marker plus nutrient: Drug produced',
        expect: { proteins: { Drug: { min: 1 } } },
      },
      {
        environment: { signals: { 'cancer-marker': 1 }, hostMode: 'eukaryotic' },
        label: 'Cancer marker without nutrient: Drug off',
        expect: { proteins: { Drug: { max: 0 } } },
      },
      {
        environment: { signals: { nutrient: 1 }, hostMode: 'eukaryotic' },
        label: 'Nutrient without cancer marker: Drug off',
        expect: { proteins: { Drug: { max: 0 } } },
      },
      {
        environment: { signals: { 'cancer-marker': 1, nutrient: 1, 'healthy-marker': 1 }, hostMode: 'eukaryotic' },
        label: 'Healthy marker overrides cancer and nutrient: Drug off',
        expect: { proteins: { Drug: { max: 0 } } },
      },
      {
        environment: { signals: { 'healthy-marker': 1 }, hostMode: 'eukaryotic' },
        label: 'Healthy marker alone: Drug off',
        expect: { proteins: { Drug: { max: 0 } } },
      },
    ],
  },
];
