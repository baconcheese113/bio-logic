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

export const SEROLOGY_INFO = {
  'test-anti-a': {
    title: 'Anti-A Serum Test (1901)',
    text: 'Add Anti-A antibodies to patient blood. If blood has A antigens (type A or AB), red cells will clump together (agglutinate). No agglutination means no A antigens (type B or O). Must combine with Anti-B test results to determine blood type.'
  },
  'test-anti-b': {
    title: 'Anti-B Serum Test (1901)',
    text: 'Add Anti-B antibodies to patient blood. If blood has B antigens (type B or AB), red cells will agglutinate. No agglutination means no B antigens (type A or O). Combine with Anti-A results: A+B=AB, A only=A, B only=B, neither=O.'
  },
  'test-abo': {
    title: 'ABO Blood Typing (1901)',
    text: 'Karl Landsteiner discovered ABO blood groups by mixing sera and red blood cells. Anti-A serum agglutinates type A blood, Anti-B serum agglutinates type B, both agglutinate AB, neither agglutinate O. Revolutionary for safe blood transfusions.'
  },
  'test-rh': {
    title: 'Rh Factor Test (1940)',
    text: 'Landsteiner and Wiener discovered the Rh antigen using rhesus monkey antibodies. Anti-D serum agglutinates Rh-positive blood (has D antigen), no reaction with Rh-negative. Critical for preventing hemolytic disease in newborns.'
  },
  'test-syphilis': {
    title: 'Syphilis Serology (1906)',
    text: 'Wassermann developed the first antibody test for syphilis using complement fixation. Modern tests detect antibodies against Treponema pallidum. Positive = patient has been exposed and body produced antibodies. Remains standard for diagnosis.'
  },
  'test-diphtheria': {
    title: 'Diphtheria Antitoxin Test (1890)',
    text: 'Emil von Behring and Shibasaburo Kitasato demonstrated "antitoxin" immunity - serum from immunized animals could protect against diphtheria toxin. Schick test detects presence of protective antibodies. Founded the field of serology and immunology.'
  },
  'blood-type-a': {
    title: 'Type A Blood',
    text: 'Red blood cells have A antigens on surface. Agglutinates with Anti-A serum, not with Anti-B. Patient has naturally occurring Anti-B antibodies in plasma. Can receive A or O blood.'
  },
  'blood-type-b': {
    title: 'Type B Blood',
    text: 'Red blood cells have B antigens on surface. Agglutinates with Anti-B serum, not with Anti-A. Patient has naturally occurring Anti-A antibodies in plasma. Can receive B or O blood.'
  },
  'blood-type-ab': {
    title: 'Type AB Blood',
    text: 'Red blood cells have both A and B antigens. Agglutinates with both Anti-A and Anti-B sera. No naturally occurring antibodies - "universal recipient" for ABO system. Can receive any ABO type.'
  },
  'blood-type-o': {
    title: 'Type O Blood',
    text: 'Red blood cells lack both A and B antigens. No agglutination with either serum. Has both Anti-A and Anti-B antibodies - "universal donor" for red cells. Can only receive O blood.'
  },
  'rh-positive': {
    title: 'Rh Positive (+)',
    text: 'Red blood cells have D antigen (Rh factor) on surface. Agglutinates with Anti-D serum. About 85% of population. Rh+ can receive Rh+ or Rh- blood.'
  },
  'rh-negative': {
    title: 'Rh Negative (−)',
    text: 'Red blood cells lack D antigen. No agglutination with Anti-D serum. About 15% of population. Rh- should only receive Rh- blood to avoid sensitization and antibody production.'
  },
  'syphilis-positive': {
    title: 'Syphilis Antibodies Detected',
    text: 'Patient serum contains antibodies against Treponema pallidum. Indicates current or past infection. Antibodies may persist for life even after treatment. Agglutination or complement fixation confirms exposure.'
  },
  'syphilis-negative': {
    title: 'No Syphilis Antibodies',
    text: 'No antibodies detected. Patient has not been exposed to Treponema pallidum, or infection is too recent for antibody production (window period typically 3-6 weeks). No agglutination reaction.'
  },
  'diphtheria-immune': {
    title: 'Immune to Diphtheria',
    text: 'Serum contains protective antitoxin antibodies against diphtheria toxin. Patient has been vaccinated or previously infected. Antibodies will neutralize toxin if exposed. Schick test negative (no skin reaction).'
  },
  'diphtheria-not-immune': {
    title: 'Not Immune to Diphtheria',
    text: 'Serum lacks protective antitoxin antibodies. Patient is susceptible to diphtheria toxin. Vaccination recommended. Schick test positive (skin inflammation where toxin injected).'
  },
  'agglutination': {
    title: 'Agglutination Reaction',
    text: 'When antibodies bind to antigens on cell surfaces, cells clump together into visible clusters. The lattice structure forms because each antibody can bind two antigen sites. Positive agglutination = antibody-antigen match. Foundation of blood typing and serology.'
  }
};

// Helper to get info by key from any category
export function getInfoContent(key: string) {
  return STAIN_INFO[key as keyof typeof STAIN_INFO] 
    || MORPHOLOGY_INFO[key as keyof typeof MORPHOLOGY_INFO]
    || CULTURE_INFO[key as keyof typeof CULTURE_INFO]
    || BIOCHEMICAL_INFO[key as keyof typeof BIOCHEMICAL_INFO]
    || SEROLOGY_INFO[key as keyof typeof SEROLOGY_INFO]
    || null;
}
