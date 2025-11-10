// Centralized educational content for all instruments and tests

export const STAIN_INFO = {
  'stain-none': {
    title: 'No Stain',
    text: 'Bacteria are nearly transparent without staining, showing only basic cellular outlines.'
  },
  'stain-gram': {
    title: 'Gram Stain',
    text: 'Gram-positive bacteria appear purple (thick cell wall). Gram-negative appear pink/red (thin cell wall).'
  },
  'stain-acid-fast': {
    title: 'Acid-Fast Stain',
    text: 'Acid-fast positive bacteria retain red/pink dye (waxy mycolic acids). Negative bacteria appear blue.'
  },
  'stain-capsule': {
    title: 'Capsule Stain',
    text: 'Capsules appear as clear halos surrounding bacteria against a dark background.'
  },
  'stain-spore': {
    title: 'Spore Stain',
    text: 'Endospores appear as bright green oval structures inside or outside bacterial cells.'
  }
};

export const MORPHOLOGY_INFO = {
  'shape-cocci': {
    title: 'Cocci',
    text: 'Round or spherical bacterial cells.'
  },
  'shape-bacilli': {
    title: 'Bacilli',
    text: 'Rod-shaped bacterial cells, longer than they are wide.'
  },
  'shape-diplococci': {
    title: 'Diplococci',
    text: 'Bacteria occurring in pairs of spherical cells.'
  },
  'gram-positive': {
    title: 'Gram Positive (+)',
    text: 'Purple/violet color after Gram staining indicates thick peptidoglycan layer.'
  },
  'gram-negative': {
    title: 'Gram Negative (−)',
    text: 'Pink/red color after Gram staining indicates thin peptidoglycan layer.'
  },
  'acid-fast-pos': {
    title: 'Acid-Fast Positive',
    text: 'Red/pink color indicates presence of waxy mycolic acids in cell wall.'
  },
  'acid-fast-neg': {
    title: 'Acid-Fast Negative',
    text: 'Blue color indicates absence of mycolic acids.'
  },
  'capsule-pos': {
    title: 'Capsule Present',
    text: 'Clear halo visible around stained bacteria.'
  },
  'capsule-neg': {
    title: 'No Capsule',
    text: 'No clear halo around bacteria.'
  },
  'spores-pos': {
    title: 'Spores Present',
    text: 'Green oval endospores visible inside or outside cells.'
  },
  'spores-neg': {
    title: 'No Spores',
    text: 'No green oval structures visible.'
  }
};

export const CULTURE_INFO = {
  'blood-agar': {
    title: 'Blood Agar (1889)',
    text: 'Enriched, non-selective medium containing sheep blood. Supports growth of fastidious bacteria and reveals hemolysis patterns. The "gold standard" for clinical bacteriology. Developed by Richard Petri and Julius Petri.'
  },
  'macconkey': {
    title: 'MacConkey Agar (1900)',
    text: 'Selective and differential medium. Crystal violet and bile salts inhibit Gram-positive bacteria. Lactose and pH indicator differentiate lactose fermenters (pink) from non-fermenters (colorless). Critical for identifying enteric pathogens.'
  },
  'hemolysis-alpha': {
    title: 'Alpha Hemolysis (α)',
    text: 'Partial hemolysis creating a greenish zone around colonies. Red blood cells are damaged but not completely lysed. Seen in Streptococcus pneumoniae and viridans streptococci.'
  },
  'hemolysis-beta': {
    title: 'Beta Hemolysis (β)',
    text: 'Complete hemolysis creating a clear zone around colonies. Red blood cells are completely lysed. Seen in Streptococcus pyogenes and Staphylococcus aureus. Associated with more virulent strains.'
  },
  'hemolysis-gamma': {
    title: 'Gamma Hemolysis (γ)',
    text: 'No hemolysis - no change in blood agar around colonies. Red blood cells remain intact. Seen in Enterococcus species and some Staphylococcus species.'
  },
  'lactose-positive': {
    title: 'Lactose Fermenter',
    text: 'Bacteria that can ferment lactose sugar, producing acid. On MacConkey agar, acid production turns colonies pink. Examples: E. coli, Klebsiella. Important for identifying enteric bacteria.'
  },
  'lactose-negative': {
    title: 'Non-Lactose Fermenter',
    text: 'Bacteria unable to ferment lactose. On MacConkey agar, colonies remain colorless/pale. Examples: Salmonella, Shigella, Proteus. Helps narrow identification of pathogens.'
  }
};

export const BIOCHEMICAL_INFO = {
  'catalase': {
    title: 'Catalase Test (1893)',
    text: 'Detects the enzyme catalase, which breaks down hydrogen peroxide (H₂O₂) into water and oxygen. Positive result = bubbles (O₂ production). Key for differentiating Staphylococcus (positive) from Streptococcus (negative). Protects bacteria from oxidative damage.'
  },
  'coagulase': {
    title: 'Coagulase Test (1903)',
    text: 'Detects the enzyme coagulase, which causes blood plasma to clot by converting fibrinogen to fibrin. Positive result = visible clotting. Differentiates Staphylococcus aureus (positive, pathogenic) from coagulase-negative staphylococci. Important virulence factor - helps bacteria evade immune system.'
  },
  'catalase-positive': {
    title: 'Catalase Positive (+)',
    text: 'Organism produces catalase enzyme. Bubbles form when H₂O₂ is added. Indicates aerobic or facultative anaerobic metabolism. Protects bacteria from toxic oxygen radicals.'
  },
  'catalase-negative': {
    title: 'Catalase Negative (−)',
    text: 'Organism lacks catalase enzyme. No bubbles when H₂O₂ is added. Common in strict anaerobes and some facultative anaerobes like Streptococcus.'
  },
  'coagulase-positive': {
    title: 'Coagulase Positive (+)',
    text: 'Organism produces coagulase enzyme. Plasma clots within hours. Strong indicator of Staphylococcus aureus, a major human pathogen. Clotting may protect bacteria from phagocytosis.'
  },
  'coagulase-negative': {
    title: 'Coagulase Negative (−)',
    text: 'Organism lacks coagulase enzyme. Plasma remains liquid. Indicates coagulase-negative staphylococci (CoNS) like S. epidermidis. Generally less pathogenic than S. aureus.'
  }
};

// Helper to get info by key from any category
export function getInfoContent(key: string) {
  return STAIN_INFO[key as keyof typeof STAIN_INFO] 
    || MORPHOLOGY_INFO[key as keyof typeof MORPHOLOGY_INFO]
    || CULTURE_INFO[key as keyof typeof CULTURE_INFO]
    || BIOCHEMICAL_INFO[key as keyof typeof BIOCHEMICAL_INFO]
    || null;
}
