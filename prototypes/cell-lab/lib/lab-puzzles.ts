import type { GeneEntry, LabPuzzle } from './lab-types';

/** 30+ genes with unique lengths (rounded to 20 bp) for the reference table */
const GENE_TABLE: GeneEntry[] = [
  { name: 'Insulin', length: 340 },
  { name: 'lacZ-α', length: 400 },
  { name: 'GFP', length: 720 },
  { name: 'RFP', length: 680 },
  { name: 'mCherry', length: 740 },
  { name: 'BFP', length: 700 },
  { name: 'YFP', length: 775 },
  { name: 'luciferase', length: 1660 },
  { name: 'β-lactamase', length: 860 },
  { name: 'kanR', length: 800 },
  { name: 'cmR', length: 660 },
  { name: 'tetR', length: 1200 },
  { name: 'ampR', length: 880 },
  { name: 'hygR', length: 1020 },
  { name: 'zeoR', length: 380 },
  { name: 'gyrB', length: 2400 },
  { name: 'recA', length: 1060 },
  { name: 'p53', length: 1180 },
  { name: 'myc', length: 1320 },
  { name: 'BRCA1', length: 5600 },
  { name: 'lacI', length: 1080 },
  { name: 'araC', length: 920 },
  { name: 'trpE', length: 1540 },
  { name: 'galK', length: 1160 },
  { name: 'phoA', length: 1400 },
  { name: 'malE', length: 1180 },
  { name: 'ompF', length: 1080 },
  { name: 'dnaK', length: 1920 },
  { name: 'groEL', length: 1640 },
  { name: 'rpoB', length: 4140 },
  { name: 'toxA', length: 1940 },
  { name: 'invA', length: 2160 },
  { name: 'bla-TEM', length: 860 },
  { name: 'CAT', length: 620 },
  { name: 'nptII', length: 795 },
];

/** Standard gel ladder sizes */
export const GEL_LADDER = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 5000];

export const PUZZLE_VERIFY_INSERT: LabPuzzle = {
  id: 'L1',
  title: 'Verify the Insert',
  briefing: 'A colleague shipped a plasmid labeled "insulin expression vector." The lab has a history of mislabeling. Confirm what\'s actually in the insert slot.',
  plasmid: {
    name: 'pEXP-???',
    totalLength: 3200,
    regions: [
      { label: 'CMV Promoter', length: 600, color: '#3b82f6' },
      { label: '??? INSERT', length: 720, isInsert: true, color: '#9ca3af' },
      { label: 'Terminator', length: 250, color: '#6b7280' },
      { label: 'ampR', length: 880, color: '#f59e0b' },
      { label: 'ori', length: 750, color: '#8b5cf6' },
    ],
  },
  reference: {
    geneTable: GENE_TABLE,
    notes: [
      'Design primers that flank the insert, run PCR, then load the product on a gel to measure its size.',
      'Cross-reference the band size against the gene table to identify the gene.',
    ],
  },
  actualInsert: { name: 'GFP', length: 720 },
  flankingBp: 40,
  acceptedAnswers: ['GFP', 'gfp'],
};

export const LAB_PUZZLES = [PUZZLE_VERIFY_INSERT];
