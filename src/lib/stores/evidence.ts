import { writable, derived } from 'svelte/store';
import { ORGANISMS } from '../../data/organisms';
import type { GramStain, Shape, Arrangement, ColonyColor, Hemolysis, ProteinPattern, AlbuminLevel, GlobulinLevel, PrimerDesign, GeneTarget } from '../../data/organisms';

export type FlowCytometryPopulationType = 'bacteria' | 'wbc' | 'debris' | 'epithelial';

export interface Evidence {
  // Microscopy evidence
  gramStain: GramStain | null;
  shape: Shape | null;
  arrangement: Arrangement | null;
  acidFast: boolean | null;
  capsule: boolean | null;
  spores: boolean | null;
  
  // Culture evidence
  bloodAgarGrowth: 'good' | 'poor' | 'none' | null;
  bloodAgarColor: ColonyColor | null;
  hemolysis: Hemolysis | null;
  macConkeyGrowth: 'good' | 'poor' | 'none' | null;
  macConkeyColor: ColonyColor | null;
  
  // Biochemical evidence
  catalase: boolean | null;
  coagulase: boolean | null;
  
  // Serology evidence
  bloodType: 'A' | 'B' | 'AB' | 'O' | null;
  rhFactor: boolean | null; // true = positive, false = negative
  syphilisAntibodies: boolean | null;
  diphtheriaAntitoxin: boolean | null;
  
  // Antibiotic evidence
  penicillinZone: number | null; // Zone size in mm
  streptomycinZone: number | null;
  tetracyclineZone: number | null;
  chloramphenicolZone: number | null;
  erythromycinZone: number | null;
  
  // Protein electrophoresis evidence
  proteinPattern: ProteinPattern | null;
  albuminLevel: AlbuminLevel | null;
  globulinLevel: GlobulinLevel | null;
  
  // PCR evidence - Interactive primer design
  primerDesign: PrimerDesign | null;  // Player's custom primer design
  pcrComplete: boolean;                // PCR amplification completed
  estimatedFragmentSize: number | null; // Player's estimate from gel (bp)
  detectedGenes: GeneTarget[];         // Genes detected via PCR (mecA, IS6110, etc)
  
  // Flow cytometry evidence
  flowCytometryPopulations: FlowCytometryPopulationType[]; // Gated populations player identified
}

const initialEvidence: Evidence = {
  // Microscopy
  gramStain: null,
  shape: null,
  arrangement: null,
  acidFast: null,
  capsule: null,
  spores: null,
  
  // Culture
  bloodAgarGrowth: null,
  bloodAgarColor: null,
  hemolysis: null,
  macConkeyGrowth: null,
  macConkeyColor: null,
  
  // Biochemical
  catalase: null,
  coagulase: null,
  
  // Serology
  bloodType: null,
  rhFactor: null,
  syphilisAntibodies: null,
  diphtheriaAntitoxin: null,
  
  // Antibiotics
  penicillinZone: null,
  streptomycinZone: null,
  tetracyclineZone: null,
  chloramphenicolZone: null,
  erythromycinZone: null,
  
  // Protein electrophoresis
  proteinPattern: null,
  albuminLevel: null,
  globulinLevel: null,
  
  // PCR - Interactive primer design
  primerDesign: null,
  pcrComplete: false,
  estimatedFragmentSize: null,
  detectedGenes: [],
  
  // Flow cytometry
  flowCytometryPopulations: [],
};

export const evidence = writable<Evidence>(initialEvidence);

// Derive filtered organisms based on evidence
export const filteredOrganisms = derived(
  evidence,
  ($evidence) => {
    return ORGANISMS.filter(organism => {
      // Microscopy evidence
      if ($evidence.gramStain !== null && organism.gramStain !== $evidence.gramStain) {
        return false;
      }
      if ($evidence.shape !== null && organism.shape !== $evidence.shape) {
        return false;
      }
      if ($evidence.arrangement !== null && organism.arrangement !== $evidence.arrangement) {
        return false;
      }
      if ($evidence.acidFast !== null && organism.acidFast !== $evidence.acidFast) {
        return false;
      }
      if ($evidence.capsule !== null && organism.capsule !== $evidence.capsule) {
        return false;
      }
      if ($evidence.spores !== null && organism.sporeFormer !== $evidence.spores) {
        return false;
      }
      
      // Culture evidence (only check if organism has culture data)
      if (organism.culture) {
        if ($evidence.bloodAgarGrowth !== null && organism.culture.bloodAgar.growthQuality !== $evidence.bloodAgarGrowth) {
          return false;
        }
        if ($evidence.bloodAgarColor !== null && organism.culture.bloodAgar.colonyColor !== $evidence.bloodAgarColor) {
          return false;
        }
        if ($evidence.hemolysis !== null && organism.culture.bloodAgar.hemolysis !== $evidence.hemolysis) {
          return false;
        }
        if ($evidence.macConkeyGrowth !== null && organism.culture.macConkey.growthQuality !== $evidence.macConkeyGrowth) {
          return false;
        }
        if ($evidence.macConkeyColor !== null && organism.culture.macConkey.colonyColor !== $evidence.macConkeyColor) {
          return false;
        }
        
        // Biochemical evidence
        if ($evidence.catalase !== null && organism.culture.catalase !== $evidence.catalase) {
          return false;
        }
        if ($evidence.coagulase !== null && organism.culture.coagulase !== $evidence.coagulase) {
          return false;
        }
      }
      
      // Protein electrophoresis evidence
      if (organism.proteinElectrophoresis) {
        if ($evidence.proteinPattern !== null && organism.proteinElectrophoresis.pattern !== $evidence.proteinPattern) {
          return false;
        }
        
        // Albumin level matching (approximate ranges based on densitometer values)
        if ($evidence.albuminLevel !== null) {
          const albuminValue = organism.proteinElectrophoresis.densitometer.albumin;
          if ($evidence.albuminLevel === 'low' && albuminValue >= 50) return false;
          if ($evidence.albuminLevel === 'normal' && (albuminValue < 50 || albuminValue > 70)) return false;
          if ($evidence.albuminLevel === 'high' && albuminValue <= 70) return false;
        }
        
        // Globulin level matching (sum of alpha, beta, gamma)
        if ($evidence.globulinLevel !== null) {
          const { alpha1, alpha2, beta, gamma } = organism.proteinElectrophoresis.densitometer;
          const globulinTotal = alpha1 + alpha2 + beta + gamma;
          if ($evidence.globulinLevel === 'low' && globulinTotal >= 35) return false;
          if ($evidence.globulinLevel === 'normal' && (globulinTotal < 30 || globulinTotal > 50)) return false;
          if ($evidence.globulinLevel === 'high' && globulinTotal <= 45) return false;
        }
      }
      
      // PCR evidence - gene detection filtering
      if ($evidence.detectedGenes.length > 0) {
        // If organism has pcrMarkers field, check if all detected genes are present
        if (organism.pcrMarkers) {
          for (const detectedGene of $evidence.detectedGenes) {
            if (!organism.pcrMarkers.includes(detectedGene)) {
              return false; // Organism doesn't have this detected gene
            }
          }
        } else {
          // Organism has no PCR markers defined - exclude if any genes detected
          return false;
        }
      }
      
      // Flow cytometry evidence - population filtering
      if ($evidence.flowCytometryPopulations.length > 0) {
        // If organism has flow cytometry data, check if gated populations match
        if (organism.flowCytometry) {
          const hasMatchingPopulations = $evidence.flowCytometryPopulations.every(gatedPop => {
            // Check if organism has a population matching the gated type
            return organism.flowCytometry!.populations.some(pop => {
              const cellType = pop.type;
              if (gatedPop === 'bacteria' && (cellType === 'bacteria-cocci' || cellType === 'bacteria-bacilli')) {
                return true;
              }
              if (gatedPop === 'wbc' && (cellType === 'lymphocyte' || cellType === 'monocyte' || cellType === 'neutrophil')) {
                return true;
              }
              if (gatedPop === 'debris' && cellType === 'debris') {
                return true;
              }
              if (gatedPop === 'epithelial' && cellType === 'epithelial') {
                return true;
              }
              return false;
            });
          });
          
          if (!hasMatchingPopulations) {
            return false;
          }
        } else {
          // Organism has no flow cytometry data - exclude
          return false;
        }
      }
      
      return true;
    });
  }
);

export const matchCount = derived(
  filteredOrganisms,
  ($filtered) => $filtered.length
);

// Helper functions
export function toggleGramStain(value: GramStain) {
  evidence.update(e => ({
    ...e,
    gramStain: e.gramStain === value ? null : value,
  }));
}

export function toggleShape(value: Shape) {
  evidence.update(e => ({
    ...e,
    shape: e.shape === value ? null : value,
  }));
}

export function toggleArrangement(value: Arrangement) {
  evidence.update(e => ({
    ...e,
    arrangement: e.arrangement === value ? null : value,
  }));
}

export function toggleAcidFast(value: boolean) {
  evidence.update(e => ({
    ...e,
    acidFast: e.acidFast === value ? null : value,
  }));
}

export function toggleCapsule(value: boolean) {
  evidence.update(e => ({
    ...e,
    capsule: e.capsule === value ? null : value,
  }));
}

export function toggleSpores(value: boolean) {
  evidence.update(e => ({
    ...e,
    spores: e.spores === value ? null : value,
  }));
}

// Culture evidence toggles
export function setColonyColor(medium: 'blood-agar' | 'macconkey', color: ColonyColor) {
  evidence.update(e => {
    if (medium === 'blood-agar') {
      return {
        ...e,
        bloodAgarColor: e.bloodAgarColor === color ? null : color,
      };
    } else {
      return {
        ...e,
        macConkeyColor: e.macConkeyColor === color ? null : color,
      };
    }
  });
}

export function setGrowthQuality(medium: 'blood-agar' | 'macconkey', quality: 'good' | 'poor' | 'none') {
  evidence.update(e => {
    if (medium === 'blood-agar') {
      return {
        ...e,
        bloodAgarGrowth: e.bloodAgarGrowth === quality ? null : quality,
      };
    } else {
      return {
        ...e,
        macConkeyGrowth: e.macConkeyGrowth === quality ? null : quality,
      };
    }
  });
}

export function setHemolysis(value: Hemolysis) {
  evidence.update(e => ({
    ...e,
    hemolysis: e.hemolysis === value ? null : value,
  }));
}

// Biochemical evidence toggles
export function toggleCatalase() {
  evidence.update(e => ({
    ...e,
    catalase: e.catalase === null ? true : (e.catalase ? false : null),
  }));
}

export function setCatalase(value: boolean) {
  evidence.update(e => ({
    ...e,
    catalase: e.catalase === value ? null : value,
  }));
}

export function toggleCoagulase() {
  evidence.update(e => ({
    ...e,
    coagulase: e.coagulase === null ? true : (e.coagulase ? false : null),
  }));
}

export function setCoagulase(value: boolean) {
  evidence.update(e => ({
    ...e,
    coagulase: e.coagulase === value ? null : value,
  }));
}

// Serology evidence toggles
export function setBloodType(value: 'A' | 'B' | 'AB' | 'O') {
  evidence.update(e => ({
    ...e,
    bloodType: e.bloodType === value ? null : value,
  }));
}

export function setRhFactor(value: boolean) {
  evidence.update(e => ({
    ...e,
    rhFactor: e.rhFactor === value ? null : value,
  }));
}

export function setSyphilisAntibodies(value: boolean) {
  evidence.update(e => ({
    ...e,
    syphilisAntibodies: e.syphilisAntibodies === value ? null : value,
  }));
}

export function setDiphtheriaAntitoxin(value: boolean) {
  evidence.update(e => ({
    ...e,
    diphtheriaAntitoxin: e.diphtheriaAntitoxin === value ? null : value,
  }));
}

// Antibiotic evidence setters
export function setPenicillinZone(zoneSize: number) {
  evidence.update(e => ({
    ...e,
    penicillinZone: zoneSize,
  }));
}

export function setStreptomycinZone(zoneSize: number) {
  evidence.update(e => ({
    ...e,
    streptomycinZone: zoneSize,
  }));
}

export function setTetracyclineZone(zoneSize: number) {
  evidence.update(e => ({
    ...e,
    tetracyclineZone: zoneSize,
  }));
}

export function setChloramphenicolZone(zoneSize: number) {
  evidence.update(e => ({
    ...e,
    chloramphenicolZone: zoneSize,
  }));
}

export function setErythromycinZone(zoneSize: number) {
  evidence.update(e => ({
    ...e,
    erythromycinZone: zoneSize,
  }));
}

// Protein electrophoresis evidence toggles
export function toggleProteinPattern(value: ProteinPattern) {
  evidence.update(e => ({
    ...e,
    proteinPattern: e.proteinPattern === value ? null : value,
  }));
}

export function setAlbuminLevel(value: AlbuminLevel) {
  evidence.update(e => ({
    ...e,
    albuminLevel: e.albuminLevel === value ? null : value,
  }));
}

export function setGlobulinLevel(value: GlobulinLevel) {
  evidence.update(e => ({
    ...e,
    globulinLevel: e.globulinLevel === value ? null : value,
  }));
}

// PCR evidence setters
export function setPrimerDesign(design: PrimerDesign | null) {
  evidence.update(e => ({
    ...e,
    primerDesign: design,
  }));
}

export function setPCRComplete(complete: boolean) {
  evidence.update(e => ({
    ...e,
    pcrComplete: complete,
  }));
}

export function setEstimatedFragmentSize(size: number | null) {
  evidence.update(e => ({
    ...e,
    estimatedFragmentSize: size,
  }));
}

export function addDetectedGene(gene: GeneTarget) {
  evidence.update(e => {
    if (e.detectedGenes.includes(gene)) {
      return e; // Already detected, no change
    }
    return {
      ...e,
      detectedGenes: [...e.detectedGenes, gene],
    };
  });
}

export function clearDetectedGenes() {
  evidence.update(e => ({
    ...e,
    detectedGenes: [],
  }));
}

// Flow cytometry evidence setters
export function addFlowCytometryPopulation(populationType: FlowCytometryPopulationType) {
  evidence.update(e => {
    if (e.flowCytometryPopulations.includes(populationType)) {
      return e; // Already recorded
    }
    return {
      ...e,
      flowCytometryPopulations: [...e.flowCytometryPopulations, populationType],
    };
  });
}

export function clearFlowCytometryPopulations() {
  evidence.update(e => ({
    ...e,
    flowCytometryPopulations: [],
  }));
}

export function clearEvidence() {
  evidence.set(initialEvidence);
}
