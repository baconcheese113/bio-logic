/**
 * Progression system - reputation, funds, tech tree, era advancement
 * Handles instrument unlocks and lawsuit consequences
 */

import { ERA_CONFIG, SAMPLE_COSTS } from './types';
import type { 
  Era, 
  InstrumentType, 
  PlayerState, 
  TechTreeNode, 
  LawsuitResult,
  CaseResult,
  PatientSampleType
} from './types';

// ============================================================================
// Tech Tree Configuration
// ============================================================================

export const TECH_TREE: TechTreeNode[] = [
  // Classical era (1880s) - starter
  {
    instrumentType: 'microscope',
    era: 'classical',
    cost: 0, // Free starter
    requires: [],
    description: 'Basic light microscope for observing stained samples',
  },
  {
    instrumentType: 'culture-plate',
    era: 'classical',
    cost: 50,
    requires: ['microscope'],
    description: 'Petri dishes for growing bacterial cultures',
  },
  
  // Golden Age (1940s)
  {
    instrumentType: 'biochemical-panel',
    era: 'golden-age',
    cost: 200,
    requires: ['culture-plate'],
    description: 'Panel of biochemical tests for bacterial identification',
  },
  {
    instrumentType: 'serology-slide',
    era: 'golden-age',
    cost: 150,
    requires: ['microscope'],
    description: 'Agglutination testing for blood typing and antibodies',
  },
  
  // Molecular Era (1970s)
  {
    instrumentType: 'electrophoresis',
    era: 'molecular',
    cost: 500,
    requires: ['biochemical-panel'],
    description: 'Gel electrophoresis for protein and DNA separation',
  },
  {
    instrumentType: 'pcr-thermocycler',
    era: 'molecular',
    cost: 1000,
    requires: ['electrophoresis'],
    description: 'PCR machine for DNA amplification',
  },
  {
    instrumentType: 'gel-imager',
    era: 'molecular',
    cost: 400,
    requires: ['electrophoresis'],
    description: 'UV imaging system for visualizing gels',
  },
  {
    instrumentType: 'elisa-reader',
    era: 'molecular',
    cost: 800,
    requires: ['serology-slide'],
    description: 'Automated plate reader for ELISA assays',
  },
  
  // Genomic Era (1995+)
  {
    instrumentType: 'sanger-sequencer',
    era: 'genomic',
    cost: 2000,
    requires: ['pcr-thermocycler'],
    description: 'DNA sequencing via Sanger method',
  },
  
  // Modern Era (2020+)
  {
    instrumentType: 'flow-cytometer',
    era: 'modern',
    cost: 5000,
    requires: ['elisa-reader'],
    description: 'Single-cell analysis by laser scatter and fluorescence',
  },
];

// ============================================================================
// Player State
// ============================================================================

const DEFAULT_PLAYER: PlayerState = {
  reputation: 50, // Start middle-ground
  funds: 100,
  currentEra: 'classical',
  ownedInstruments: ['microscope'], // Start with microscope
  completedCases: 0,
  failedCases: 0,
  lawsuits: [],
};

let player = $state<PlayerState>({ ...DEFAULT_PLAYER });

// ============================================================================
// Public API
// ============================================================================

export const progression = {
  get player() { return player; },
  get reputation() { return player.reputation; },
  get funds() { return player.funds; },
  get era() { return player.currentEra; },
  get ownedInstruments() { return player.ownedInstruments; },
  
  /** Check if player owns an instrument */
  ownsInstrument(type: InstrumentType): boolean {
    return player.ownedInstruments.includes(type);
  },
  
  /** Check if an instrument is available to purchase */
  canPurchase(type: InstrumentType): { canPurchase: boolean; reason?: string } {
    const node = TECH_TREE.find(n => n.instrumentType === type);
    if (!node) return { canPurchase: false, reason: 'Unknown instrument' };
    
    if (player.ownedInstruments.includes(type)) {
      return { canPurchase: false, reason: 'Already owned' };
    }
    
    // Check prerequisites
    for (const req of node.requires) {
      if (!player.ownedInstruments.includes(req)) {
        return { canPurchase: false, reason: `Requires ${req}` };
      }
    }
    
    // Check era
    if (ERA_CONFIG[node.era].order > ERA_CONFIG[player.currentEra].order) {
      return { canPurchase: false, reason: `Requires ${ERA_CONFIG[node.era].name}` };
    }
    
    // Check funds
    if (player.funds < node.cost) {
      return { canPurchase: false, reason: `Need ${node.cost} funds` };
    }
    
    return { canPurchase: true };
  },
  
  /** Get instruments available in current era */
  availableInstruments(): TechTreeNode[] {
    const currentOrder = ERA_CONFIG[player.currentEra].order;
    return TECH_TREE.filter(node => 
      ERA_CONFIG[node.era].order <= currentOrder &&
      !player.ownedInstruments.includes(node.instrumentType)
    );
  },
};

// ============================================================================
// Funds & Reputation
// ============================================================================

/** Add or remove funds */
export function adjustFunds(amount: number): number {
  player.funds = Math.max(0, player.funds + amount);
  return player.funds;
}

/** Add or remove reputation */
export function adjustReputation(amount: number): number {
  player.reputation = Math.max(0, Math.min(100, player.reputation + amount));
  checkEraProgression();
  return player.reputation;
}

/** Deduct cost for taking a patient sample */
export function paySampleCost(sampleType: PatientSampleType): boolean {
  const cost = SAMPLE_COSTS[sampleType];
  if (player.funds < cost) return false;
  
  player.funds -= cost;
  return true;
}

// ============================================================================
// Instrument Purchases
// ============================================================================

/** Purchase an instrument */
export function purchaseInstrument(type: InstrumentType): boolean {
  const check = progression.canPurchase(type);
  if (!check.canPurchase) return false;
  
  const node = TECH_TREE.find(n => n.instrumentType === type)!;
  
  player.funds -= node.cost;
  player.ownedInstruments.push(type);
  
  checkEraProgression();
  return true;
}

// ============================================================================
// Case Results
// ============================================================================

/** Apply results from a completed case */
export function applyCaseResult(result: CaseResult) {
  adjustFunds(result.fundsChange);
  adjustReputation(result.reputationChange);
  
  if (result.correct) {
    player.completedCases++;
  } else {
    player.failedCases++;
  }
  
  if (result.lawsuit) {
    applyLawsuit(result.lawsuit);
  }
}

/** Apply lawsuit consequences */
export function applyLawsuit(lawsuit: LawsuitResult) {
  player.lawsuits.push(lawsuit);
  player.funds = Math.max(0, player.funds - lawsuit.fundsPenalty);
  player.reputation = Math.max(0, player.reputation - lawsuit.reputationPenalty);
}

// ============================================================================
// Era Progression
// ============================================================================

const ERA_ORDER: Era[] = ['classical', 'golden-age', 'molecular', 'genomic', 'modern'];

/** Check if player should advance to next era */
function checkEraProgression() {
  const currentIndex = ERA_ORDER.indexOf(player.currentEra);
  if (currentIndex >= ERA_ORDER.length - 1) return; // Already at max
  
  const nextEra = ERA_ORDER[currentIndex + 1];
  
  // Requirements to advance:
  // 1. Reputation >= 60
  // 2. Own at least one instrument from current era (other than starter)
  
  if (player.reputation < 60) return;
  
  // Check if player has instruments from next era's prerequisites
  const nextEraInstruments = TECH_TREE.filter(n => n.era === nextEra);
  const canUnlockNext = nextEraInstruments.some(node => 
    node.requires.every(req => player.ownedInstruments.includes(req))
  );
  
  if (canUnlockNext) {
    player.currentEra = nextEra;
  }
}

/** Manually set era (for testing or special cases) */
export function setEra(era: Era) {
  player.currentEra = era;
}

// ============================================================================
// Reset
// ============================================================================

export function resetProgression() {
  player = { ...DEFAULT_PLAYER };
}

// ============================================================================
// Stats
// ============================================================================

export function getPlayerStats() {
  return {
    reputation: player.reputation,
    funds: player.funds,
    era: player.currentEra,
    eraName: ERA_CONFIG[player.currentEra].name,
    instrumentsOwned: player.ownedInstruments.length,
    casesCompleted: player.completedCases,
    casesFailed: player.failedCases,
    lawsuits: player.lawsuits.length,
    successRate: player.completedCases + player.failedCases > 0
      ? Math.round((player.completedCases / (player.completedCases + player.failedCases)) * 100)
      : 0,
  };
}
