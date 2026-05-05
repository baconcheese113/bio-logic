import { describe, it, expect } from 'vitest';
import { runEngine, checkExpect } from './simulation-engine';
import { PARTS_DEF_MAP } from './parts-grammar';
import type { PlacedPart, EnvironmentState } from './types';

// Helper to build a PlacedPart array from an ordered list of defIds
let idCounter = 0;
function makePlasmid(defIds: string[]): PlacedPart[] {
  return defIds.map(defId => ({
    instanceId: `p${++idCounter}`,
    defId,
    orientation: 'clockwise' as const,
  }));
}

const BACT_ENV: EnvironmentState = { signals: {}, hostMode: 'bacterial' };

describe('L15 — Bicistronic Trick', () => {
  it('single promoter bicistronic operon: Cat is about 50% of LacZ', () => {
    // Constitutive strong → strong RBS → LacZ → weak RBS → Cat → strong terminator
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'bact-rbs-weak',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    const e1 = output.proteins['LacZ'] ?? 0;
    const e2 = output.proteins['Cat'] ?? 0;
    expect(e1).toBeGreaterThanOrEqual(2);
    expect(e2).toBeGreaterThan(0);
    const ratio = e2 / e1;
    expect(ratio).toBeGreaterThanOrEqual(0.35);
    expect(ratio).toBeLessThanOrEqual(0.65);
  });

  it('two separate strong promoters → cell burdened (load 10 = threshold)', () => {
    // Two strong promoters: 2×5 = 10 >= BURDEN_THRESHOLD(10) → burdened
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'bact-term-strong',
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.cellHealth.state).toBe('burdened');
  });

  it('cell burdened when many strong promoters', () => {
    // 4 strong promoters (4×5=20 > critical threshold 16 → lysed)
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'gene-enzyme1',
      'bact-term-strong',
      'bact-prom-const-strong',
      'gene-enzyme2',
      'bact-term-strong',
      'bact-prom-const-strong',
      'gene-gfp',
      'bact-term-strong',
      'bact-prom-const-strong',
      'gene-rfp',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(['burdened', 'lysed']).toContain(output.cellHealth.state);
  });
});

describe('L16 — Terminator Tuning', () => {
  it('single RBS before lacZ does not translate downstream cat without its own RBS', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['LacZ'] ?? 0).toBeGreaterThan(0);
    expect(output.proteins['Cat'] ?? 0).toBe(0);
  });

  it('fusion linker allows continuous translation into downstream coding sequence', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'linker-flex',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['LacZ'] ?? 0).toBe(0);
    expect(output.proteins['Cat'] ?? 0).toBe(0);
    expect(output.proteins['LacZ::fusion::Cat'] ?? 0).toBeGreaterThan(0);
  });

  it('leaky terminator allows read-through expression of downstream gene', () => {
    // Constitutive → GeneA → leaky term → IPTG promoter → GeneB → strong term
    // Without IPTG: GeneA expressed, GeneB gets ~15% read-through
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'bact-term-leaky',
      'bact-prom-iptg',
      'bact-rbs-strong',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    const e1 = output.proteins['LacZ'] ?? 0;
    const e2 = output.proteins['Cat'] ?? 0;
    expect(e1).toBeGreaterThan(0);
    // Cat gets read-through contribution even without IPTG
    expect(e2).toBeGreaterThan(0);
    expect(e2).toBeLessThan(e1); // significantly less than main operon
    expect(output.efficiencyScore.transcriptionalLoad).toBe(5);
  });

  it('with IPTG: GeneB fully expressed', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'bact-term-leaky',
      'bact-prom-iptg',
      'bact-rbs-strong',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const env: EnvironmentState = { signals: { iptg: 1 }, hostMode: 'bacterial' };
    const output = runEngine(parts, PARTS_DEF_MAP, env);
    expect(output.proteins['Cat'] ?? 0).toBeGreaterThanOrEqual(2);
    expect(output.efficiencyScore.transcriptionalLoad).toBe(7);
  });

  it('strong terminator: no read-through', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'bact-term-strong',
      'bact-prom-iptg',
      'bact-rbs-strong',
      'gene-enzyme2',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    // Without IPTG and no read-through, Cat = 0
    expect(output.proteins['Cat'] ?? 0).toBe(0);
  });
});

describe('L17 — Protease Queueing', () => {
  it('single tagged protein degrades normally', () => {
    const parts = makePlasmid([
      'bact-prom-const-med',
      'bact-rbs-strong',
      'gene-enzyme-a',
      'tag-ssra-laa',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    const ea = output.proteins['AmyE'] ?? 0;
    // Level should be reduced by fast tag (promoter strength 2, rbs 1.0, tag 3 → 2/3 ≈ 0.67)
    expect(ea).toBeGreaterThan(0);
    expect(ea).toBeLessThan(2); // degraded below untagged level
  });

  it('too many tagged proteins → ClpXP saturation → all accumulate', () => {
    // High-load tagged proteins swamp the protease
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme-a',
      'tag-ssra-laa',
      'bact-term-strong',
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-toxin-b',
      'tag-ssra-laa',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    // Both proteins accumulate more than they would without saturation
    const ea = output.proteins['AmyE'] ?? 0;
    const tb = output.proteins['CcdB'] ?? 0;
    expect(ea).toBeGreaterThan(0);
    expect(tb).toBeGreaterThan(0);
    expect(output.efficiencyScore.proteaseLoad).toBeGreaterThanOrEqual(12);
    expect(output.cellHealth.reasons).toContain('protease-saturation');
  });
});

describe('L18 — Programmable Repressor', () => {
  it('without toxin: Gene1/2/3 all expressed', () => {
    // Three separate constitutive operons for Gene1, Gene2, Gene3
    const parts = makePlasmid([
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
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['Protein1'] ?? 0).toBeGreaterThan(0);
    expect(output.proteins['Protein2'] ?? 0).toBeGreaterThan(0);
    expect(output.proteins['Protein3'] ?? 0).toBeGreaterThan(0);
  });

  it('with toxin + dCas9 + strong RBS + all 3 guides: all three genes silenced', () => {
    const parts = makePlasmid([
      // Toxin-inducible operon producing dCas9 and guide RNAs
      'bact-prom-toxin',
      'bact-rbs-strong', // strong RBS for dCas9
      'gene-dcas9',
      'grna-a',
      'grna-b',
      'grna-c',
      'bact-term-strong',
      // Gene1/2/3 operons
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
    ]);
    const env: EnvironmentState = { signals: { toxin: 1 }, hostMode: 'bacterial' };
    const output = runEngine(parts, PARTS_DEF_MAP, env);
    // With strong RBS dCas9 and all 3 guides, all targets should be blocked
    expect(output.proteins['Protein1'] ?? 0).toBe(0);
    expect(output.proteins['Protein2'] ?? 0).toBe(0);
    expect(output.proteins['Protein3'] ?? 0).toBe(0);
  });

  it('with toxin + weak RBS on dCas9 + all 3 guides: partial silencing', () => {
    const parts = makePlasmid([
      'bact-prom-toxin',
      'bact-rbs-weak', // weak RBS → insufficient dCas9
      'gene-dcas9',
      'grna-a',
      'grna-b',
      'grna-c',
      'bact-term-strong',
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
    ]);
    const env: EnvironmentState = { signals: { toxin: 1 }, hostMode: 'bacterial' };
    const output = runEngine(parts, PARTS_DEF_MAP, env);
    // With weak dCas9, some genes may not be fully repressed
    // dCas9 level = 2 × 0.5 = 1.0 total; split 3 ways = 0.33 each < threshold 0.5
    const p1 = output.proteins['Protein1'] ?? 0;
    const p2 = output.proteins['Protein2'] ?? 0;
    const p3 = output.proteins['Protein3'] ?? 0;
    expect(p1 + p2 + p3).toBeGreaterThan(0); // at least some not silenced
  });
});

describe('L19 - Smart Drug Gate', () => {
  const smartDrugParts = [
    'euk-prom-cancer',
    'euk-kozak-strong',
    'gene-cancer-activator',
    'euk-polya',
    'euk-prom-nutrient-activator',
    'euk-kozak-strong',
    'gene-drug',
    'euk-polya',
    'euk-prom-healthy',
    'euk-kozak-strong',
    'gene-dcas9',
    'nls',
    'grna-drug-off',
    'euk-polya',
  ];

  it('requires cancer marker and nutrient together to produce Drug', () => {
    const parts = makePlasmid(smartDrugParts);
    const cancerOnly: EnvironmentState = { signals: { 'cancer-marker': 1 }, hostMode: 'eukaryotic' };
    const nutrientOnly: EnvironmentState = { signals: { nutrient: 1 }, hostMode: 'eukaryotic' };
    const both: EnvironmentState = { signals: { 'cancer-marker': 1, nutrient: 1 }, hostMode: 'eukaryotic' };

    expect(runEngine(parts, PARTS_DEF_MAP, cancerOnly).proteins['Drug'] ?? 0).toBe(0);
    expect(runEngine(parts, PARTS_DEF_MAP, nutrientOnly).proteins['Drug'] ?? 0).toBe(0);
    expect(runEngine(parts, PARTS_DEF_MAP, both).proteins['Drug'] ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('uses healthy-marker dCas9-NLS and guide RNA to block Drug', () => {
    const parts = makePlasmid(smartDrugParts);
    const env: EnvironmentState = {
      signals: { 'cancer-marker': 1, nutrient: 1, 'healthy-marker': 1 },
      hostMode: 'eukaryotic',
    };
    const output = runEngine(parts, PARTS_DEF_MAP, env);

    expect(output.proteins['Drug'] ?? 0).toBe(0);
    expect(output.proteins['dCas9-NLS'] ?? 0).toBeGreaterThan(0);
    expect(Object.values(output.partStates).some(state => state.state === 'blocked')).toBe(true);
  });

  it('does not block eukaryotic promoters when dCas9 lacks NLS', () => {
    const parts = makePlasmid(smartDrugParts.filter(defId => defId !== 'nls'));
    const env: EnvironmentState = {
      signals: { 'cancer-marker': 1, nutrient: 1, 'healthy-marker': 1 },
      hostMode: 'eukaryotic',
    };
    const output = runEngine(parts, PARTS_DEF_MAP, env);

    expect(output.proteins['Drug'] ?? 0).toBeGreaterThan(0);
    expect(Object.values(output.partStates).some(state => state.state === 'blocked')).toBe(false);
  });
});

describe('Engine basics', () => {
  it('unterminated sweep is discarded', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-gfp',
      // no terminator
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['GFP'] ?? 0).toBe(0);
  });

  it('inducible promoter: silent without signal', () => {
    const parts = makePlasmid([
      'bact-prom-iptg',
      'bact-rbs-strong',
      'gene-gfp',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['GFP'] ?? 0).toBe(0);
  });

  it('inducible promoter: active with signal', () => {
    const parts = makePlasmid([
      'bact-prom-iptg',
      'bact-rbs-strong',
      'gene-gfp',
      'bact-term-strong',
    ]);
    const env: EnvironmentState = { signals: { iptg: 1 }, hostMode: 'bacterial' };
    const output = runEngine(parts, PARTS_DEF_MAP, env);
    expect(output.proteins['GFP'] ?? 0).toBeGreaterThan(0);
  });

  it('repressible promoter: active without repressor', () => {
    const parts = makePlasmid([
      'bact-prom-laco',
      'bact-rbs-strong',
      'gene-gfp',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['GFP'] ?? 0).toBeGreaterThan(0);
  });

  it('repressible promoter: silenced when repressor present', () => {
    // LacI repressor produced by a constitutive operon silences lacO
    const parts = makePlasmid([
      'bact-prom-const-med',
      'bact-rbs-strong',
      'gene-repressor-laci',
      'bact-term-strong',
      'bact-prom-laco',
      'bact-rbs-strong',
      'gene-gfp',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['GFP'] ?? 0).toBe(0);
    expect(output.proteins['LacI'] ?? 0).toBeGreaterThan(0);
  });

  it('gene without RBS produces no protein (bacterial)', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'gene-gfp', // no SD sequence
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['GFP'] ?? 0).toBe(0);
  });

  it('gene with RBS produces protein (bacterial)', () => {
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-gfp',
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['GFP'] ?? 0).toBeGreaterThan(0);
  });

  it('read-through gene without RBS in downstream segment produces no extra protein', () => {
    // LacZ has RBS; after leaky terminator cat has no RBS → only LacZ expressed
    const parts = makePlasmid([
      'bact-prom-const-strong',
      'bact-rbs-strong',
      'gene-enzyme1',
      'bact-term-leaky',
      'gene-enzyme2', // no RBS upstream in read-through segment
      'bact-term-strong',
    ]);
    const output = runEngine(parts, PARTS_DEF_MAP, BACT_ENV);
    expect(output.proteins['LacZ'] ?? 0).toBeGreaterThan(0);
    expect(output.proteins['Cat'] ?? 0).toBe(0);
  });

  it('checkExpect: protein ratio check', () => {
    const output = {
      proteins: { A: 3, B: 1.5 },
      transcripts: {},
      functionalRNAs: {},
      partStates: {},
      cellHealth: { state: 'normal' as const, reasons: [] },
      transcriptionUnits: [],
      efficiencyScore: { partCount: 0, transcriptionalLoad: 0, proteaseLoad: 0 },
    };
    expect(checkExpect(output, { proteinRatio: { a: 'B', b: 'A', min: 0.4, max: 0.6 } })).toBe(true);
    expect(checkExpect(output, { proteinRatio: { a: 'B', b: 'A', min: 0.6, max: 0.8 } })).toBe(false);
  });
});
