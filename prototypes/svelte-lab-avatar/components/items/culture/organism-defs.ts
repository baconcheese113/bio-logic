/**
 * Organism definitions: scientifically calibrated data for the culture plate simulation.
 *
 * Colony sizes calibrated for a 90mm agar plate (PLATE_RADIUS = 185px = 45mm real).
 * Plate-fraction formula: colony_mm / 45mm = plate-fraction radius.
 * Examples: 1mm → 0.022, 1.5mm → 0.033, 2mm → 0.044
 * (Note: these are true biological radii; colony-generator scales these by density tier.)
 *
 * Scientific references for colony sizes & hemolysis from ASM MicrobeLibrary and
 * Bailey & Scott's Diagnostic Microbiology (14th ed).
 */

import type { MediaType, CultureFindings } from '../../../lib/types';

interface OrganismDef {
  id: string;
  /** Short display name */
  name: string;
  /** Full scientific name (italic in UI) */
  scientific: string;
  gramType: 'positive' | 'negative' | 'none';
  /** Colony appearance per media type. Absent key = organism does not grow on that media. */
  onMedia: Partial<Record<MediaType, MediaAppearance>>;
}

interface MediaAppearance {
  colonyColor: CultureFindings['colonyColor'];
  hemolysis: 'alpha' | 'beta' | 'gamma';
  /** [min, max] isolated colony radius in plate-fraction units.
   *  These are the ISOLATED (zone 3+) sizes; dense/confluent are scaled down by colony-generator. */
  isolatedRadius: [number, number];
  /** MacConkey differential: true = pink/red colonies */
  lactoseFermenter?: boolean;
  /** UI label for differential appearance, e.g. "Pink — lactose fermenter" */
  differential?: string;
  /** Special growth morphology affecting rendering */
  morphology?: 'spreading' | 'mucoid' | 'wrinkled';
}

/** Get CultureFindings for a specific organism on a specific media. Returns null if no growth. */
export function cultureFindings(org: OrganismDef, media: MediaType): CultureFindings | null {
  const app = org.onMedia[media];
  if (!app) return null;
  return {
    growth: true,
    gramType: org.gramType === 'none' ? 'positive' : org.gramType,
    colonyColor: app.colonyColor,
    hemolysis: app.hemolysis,
    lactoseFermenter: app.lactoseFermenter,
    isolatedRadiusRange: app.isolatedRadius,
  };
}

// ==============================================================================
// Organism Definitions
// ==============================================================================

export const ORGANISMS: Readonly<Record<string, OrganismDef>> = {

  'staph-aureus': {
    id: 'staph-aureus',
    name: 'S. aureus',
    scientific: 'Staphylococcus aureus',
    gramType: 'positive',
    onMedia: {
      'blood-agar': {
        colonyColor: 'golden',
        hemolysis: 'beta',
        isolatedRadius: [0.016, 0.028],  // 1.4–2.5mm
      },
      'nutrient-agar': {
        colonyColor: 'golden',
        hemolysis: 'gamma',
        isolatedRadius: [0.014, 0.025],
      },
      // MacConkey: gram-positive — inhibited by bile salts and crystal violet
    },
  },

  'staph-epidermidis': {
    id: 'staph-epidermidis',
    name: 'S. epidermidis',
    scientific: 'Staphylococcus epidermidis',
    gramType: 'positive',
    onMedia: {
      'blood-agar': {
        colonyColor: 'white',
        hemolysis: 'gamma',
        isolatedRadius: [0.010, 0.018],  // 0.9–1.6mm — smaller than S. aureus
      },
      'nutrient-agar': {
        colonyColor: 'white',
        hemolysis: 'gamma',
        isolatedRadius: [0.009, 0.016],
      },
    },
  },

  'strep-pyogenes': {
    id: 'strep-pyogenes',
    name: 'S. pyogenes',
    scientific: 'Streptococcus pyogenes',
    gramType: 'positive',
    onMedia: {
      'blood-agar': {
        colonyColor: 'gray',
        hemolysis: 'beta',
        isolatedRadius: [0.006, 0.011],  // 0.5–1mm — pinpoint; large beta-hemolysis zone
      },
      'nutrient-agar': {
        colonyColor: 'gray',
        hemolysis: 'gamma',
        isolatedRadius: [0.005, 0.009],
      },
    },
  },

  'strep-pneumoniae': {
    id: 'strep-pneumoniae',
    name: 'S. pneumoniae',
    scientific: 'Streptococcus pneumoniae',
    gramType: 'positive',
    onMedia: {
      'blood-agar': {
        colonyColor: 'gray',
        hemolysis: 'alpha',
        morphology: 'wrinkled',          // characteristic "draughtsman" colony
        isolatedRadius: [0.007, 0.012],  // 0.6–1.1mm, slightly umbilicated
      },
      'nutrient-agar': {
        colonyColor: 'gray',
        hemolysis: 'gamma',
        isolatedRadius: [0.006, 0.011],
      },
    },
  },

  'e-coli': {
    id: 'e-coli',
    name: 'E. coli',
    scientific: 'Escherichia coli',
    gramType: 'negative',
    onMedia: {
      'blood-agar': {
        colonyColor: 'gray',
        hemolysis: 'gamma',
        isolatedRadius: [0.014, 0.024],  // 1.3–2.2mm
      },
      'nutrient-agar': {
        colonyColor: 'gray',
        hemolysis: 'gamma',
        isolatedRadius: [0.013, 0.022],
      },
      'macconkey': {
        colonyColor: 'pink',
        hemolysis: 'gamma',
        lactoseFermenter: true,
        differential: 'Pink/red — lactose fermenter',
        isolatedRadius: [0.013, 0.023],
      },
    },
  },

  'klebsiella-pneumoniae': {
    id: 'klebsiella-pneumoniae',
    name: 'K. pneumoniae',
    scientific: 'Klebsiella pneumoniae',
    gramType: 'negative',
    onMedia: {
      'blood-agar': {
        colonyColor: 'mucoid',
        hemolysis: 'gamma',
        morphology: 'mucoid',
        isolatedRadius: [0.020, 0.033],  // 1.8–3mm — large mucoid mounds
      },
      'nutrient-agar': {
        colonyColor: 'mucoid',
        hemolysis: 'gamma',
        morphology: 'mucoid',
        isolatedRadius: [0.018, 0.030],
      },
      'macconkey': {
        colonyColor: 'pink',
        hemolysis: 'gamma',
        lactoseFermenter: true,
        morphology: 'mucoid',
        differential: 'Pink mucoid — lactose fermenter',
        isolatedRadius: [0.020, 0.033],
      },
    },
  },

  'p-aeruginosa': {
    id: 'p-aeruginosa',
    name: 'P. aeruginosa',
    scientific: 'Pseudomonas aeruginosa',
    gramType: 'negative',
    onMedia: {
      'blood-agar': {
        colonyColor: 'green',
        hemolysis: 'beta',
        morphology: 'spreading',
        isolatedRadius: [0.018, 0.030],  // spreading/flat, up to 3mm+
      },
      'nutrient-agar': {
        colonyColor: 'green',
        hemolysis: 'gamma',
        morphology: 'spreading',
        isolatedRadius: [0.018, 0.030],
      },
      'macconkey': {
        colonyColor: 'colorless',
        hemolysis: 'gamma',
        differential: 'Colorless — non-fermenter',
        isolatedRadius: [0.016, 0.026],
      },
    },
  },

  'candida-albicans': {
    id: 'candida-albicans',
    name: 'C. albicans',
    scientific: 'Candida albicans',
    gramType: 'none',           // yeast — gram-variable but stains gram-positive
    onMedia: {
      'blood-agar': {
        colonyColor: 'cream',
        hemolysis: 'gamma',
        isolatedRadius: [0.013, 0.022],  // butyrous/pasty, 1.2–2mm
      },
      'nutrient-agar': {
        colonyColor: 'cream',
        hemolysis: 'gamma',
        isolatedRadius: [0.011, 0.020],
      },
      // MacConkey: inhibited by bile salts
    },
  },

  'enterococcus-faecalis': {
    id: 'enterococcus-faecalis',
    name: 'E. faecalis',
    scientific: 'Enterococcus faecalis',
    gramType: 'positive',
    onMedia: {
      'blood-agar': {
        colonyColor: 'gray',
        hemolysis: 'gamma',  // typically non-hemolytic; some strains alpha
        isolatedRadius: [0.008, 0.014],  // 0.7–1.3mm — small gray
      },
      'nutrient-agar': {
        colonyColor: 'gray',
        hemolysis: 'gamma',
        isolatedRadius: [0.007, 0.012],
      },
      'macconkey': {
        // Grows on MacConkey (unlike other gram+) — tolerates bile
        colonyColor: 'colorless',
        hemolysis: 'gamma',
        differential: 'Colorless — non-fermenter',
        isolatedRadius: [0.006, 0.011],
      },
    },
  },

};
