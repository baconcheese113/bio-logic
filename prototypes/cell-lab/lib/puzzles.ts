import type { Puzzle } from './types';

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
    title: 'Double Switch',
    goal: 'Green when sugar is present, red when sugar is absent.',
    hint: 'Use the repressor to invert the sugar signal for one color, and direct activation for the other.',
    availablePartIds: [
      'sugar-promoter', 'repressible-promoter',
      'gfp-gene', 'rfp-gene', 'repressor-gene',
      'terminator',
    ],
    strandSlots: 9,
    tests: [
      {
        signals: { sugar: true },
        label: 'Sugar → green only',
        expect: { GFP: { min: 1 }, RFP: { max: 0 } },
      },
      {
        signals: {},
        label: 'No sugar → red only',
        expect: { RFP: { min: 1 }, GFP: { max: 0 } },
      },
    ],
  },
  {
    id: 8,
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
    id: 9,
    title: 'Activator',
    goal: 'Produce BOTH GFP and the activator protein (ActA).',
    hint: 'The activator gene produces ActA protein. The activator-responsive promoter turns on when ActA is present. You need both proteins!',
    availablePartIds: [
      'constitutive-promoter', 'activator-promoter',
      'activator-gene', 'gfp-gene',
      'terminator',
    ],
    strandSlots: 7,
    tests: [
      {
        signals: {},
        label: 'GFP present',
        expect: { GFP: { min: 1 } },
      },
      {
        signals: {},
        label: 'ActA present',
        expect: { ActA: { min: 1 } },
      },
    ],
  },
  {
    id: 10,
    title: 'Amplifier',
    goal: 'Amplify a weak signal. GFP ≥ 6 when sugar is present.',
    hint: 'The sugar promoter is weak (strength 1). The activator-responsive promoter is strong (strength 3). Can you relay and amplify?',
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
    id: 11,
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
    id: 12,
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
    id: 13,
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
    id: 14,
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
    id: 15,
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
    id: 16,
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
