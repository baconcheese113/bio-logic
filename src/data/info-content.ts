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

export const ANTIBIOTIC_INFO = {
  'penicillin': {
    title: 'Penicillin (1928)',
    text: 'Alexander Fleming discovered penicillin when Penicillium mold contaminated a bacterial culture. Mass-produced during WWII. First beta-lactam antibiotic - disrupts bacterial cell wall synthesis. Highly effective against Gram-positive bacteria. Resistance emerged by 1940s through beta-lactamase enzymes.'
  },
  'streptomycin': {
    title: 'Streptomycin (1943)',
    text: 'Selman Waksman discovered streptomycin from soil bacterium Streptomyces griseus. First effective treatment for tuberculosis. Aminoglycoside class - inhibits protein synthesis by binding 30S ribosomal subunit. Effective against many Gram-negative bacteria. Can cause hearing loss and kidney damage.'
  },
  'tetracycline': {
    title: 'Tetracycline (1948)',
    text: 'Benjamin Duggar isolated chlortetracycline from Streptomyces aureofaciens. Broad-spectrum antibiotic effective against both Gram-positive and Gram-negative bacteria. Inhibits protein synthesis by blocking tRNA binding to ribosome. Widely used but resistance is common. Stains developing teeth yellow.'
  },
  'chloramphenicol': {
    title: 'Chloramphenicol (1947)',
    text: 'David Gottlieb discovered chloramphenicol from Streptomyces venezuelae. Broad-spectrum, bacteriostatic antibiotic. Inhibits protein synthesis by blocking peptidyl transferase. Extremely effective but can cause fatal aplastic anemia (1:40,000 cases). Reserved for serious infections like bacterial meningitis.'
  },
  'erythromycin': {
    title: 'Erythromycin (1952)',
    text: 'J.M. McGuire isolated erythromycin from Saccharopolyspora erythraea. First macrolide antibiotic - alternative for penicillin-allergic patients. Inhibits protein synthesis by binding 50S ribosomal subunit. Effective against Gram-positive bacteria and atypical pneumonia. Common side effect: gastrointestinal upset.'
  },
  'kirby-bauer': {
    title: 'Kirby-Bauer Method (1956)',
    text: 'William Kirby and Alfred Bauer developed standardized disk diffusion method. Paper disks soaked in antibiotics are placed on bacterial lawn. Antibiotics diffuse outward, creating concentration gradient. Zone of inhibition = area where bacteria cannot grow. Zone diameter correlates with antibiotic effectiveness.'
  },
  'zone-measurement': {
    title: 'Zone Diameter Interpretation',
    text: 'Measure zone from edge to edge in millimeters. Compare to standardized breakpoints: Sensitive (S) = large zone, antibiotic will work; Intermediate (I) = medium zone, may work at high doses; Resistant (R) = small/no zone, antibiotic ineffective. Breakpoints vary by organism and antibiotic combination.'
  },
  'resistance': {
    title: 'Antibiotic Resistance',
    text: 'Bacteria evolve resistance through mutations or acquiring resistance genes. Mechanisms: enzymes that destroy antibiotics (beta-lactamase), altered drug targets, efflux pumps that expel antibiotics, reduced permeability. Resistance emerged within years of penicillin use. Different strains of same species can have vastly different resistance patterns.'
  },
  'sensitivity-s': {
    title: 'Sensitive (S)',
    text: 'Large zone of inhibition. Antibiotic concentration at infection site will be high enough to kill or inhibit the bacteria. First-line treatment option. Example: 25mm zone for penicillin against Streptococcus indicates sensitivity.'
  },
  'sensitivity-i': {
    title: 'Intermediate (I)',
    text: 'Medium zone of inhibition. Antibiotic may work if used at maximum dosage or if infection is in site where drug concentrates (urine, bile). Use with caution or consider alternative. Represents borderline effectiveness.'
  },
  'sensitivity-r': {
    title: 'Resistant (R)',
    text: 'Small or no zone of inhibition. Bacteria will continue growing despite antibiotic treatment. Do not use this antibiotic - treatment will fail. Select alternative antibiotic showing sensitivity. Example: 0mm zone indicates complete resistance.'
  },
  'mueller-hinton': {
    title: 'Mueller-Hinton Agar',
    text: 'Standardized medium for antibiotic susceptibility testing. Low in inhibitors, provides consistent results. Depth of 4mm ensures uniform antibiotic diffusion. Developed in 1941, became standard for Kirby-Bauer method. Composition: beef extract, casein hydrolysate, starch.'
  }
};

export const ELECTROPHORESIS_INFO = {
  'electrophoresis-cellulose': {
    title: 'Cellulose Acetate Electrophoresis (1957)',
    text: 'Proteins in serum separate when electric current passes through cellulose acetate strip soaked in buffer (pH 8.6). Proteins migrate toward positive electrode at different rates based on size and charge. After migration, strip is stained to visualize protein bands as dark blue-purple lines. Replaced paper electrophoresis with better resolution.'
  },
  'protein-pattern-normal': {
    title: 'Normal Pattern',
    text: 'Normal serum shows 5 distinct dark bands after staining. From bottom to top: Albumin (darkest, thickest band, 60% of protein), α₁ (faint, thin), α₂ (light), β (medium), γ (medium, broad band). Pattern is balanced and symmetrical with no unusually dark or faint bands. Use this as your reference for comparison.'
  },
  'protein-pattern-m-spike': {
    title: 'M-Spike (Monoclonal Gammopathy)',
    text: 'Look for a single very dark, sharp, narrow band in the gamma region - appears as an intense spike rather than the normal broad band. Classic sign of multiple myeloma where one clone of plasma cells overproduces a single antibody type. The spike is noticeably darker and thinner than a normal gamma band.'
  },
  'protein-pattern-beta-gamma-bridge': {
    title: 'Beta-Gamma Bridge',
    text: 'Beta and gamma bands merge together - instead of two separate bands, you see them connect into one continuous dark region without a clear gap between them. Classic finding in liver cirrhosis. The bridging appears as a joined or fused area where two bands should be distinct.'
  },
  'protein-pattern-low-albumin': {
    title: 'Low Albumin Pattern',
    text: 'Albumin band appears noticeably fainter and thinner compared to normal reference pattern. Instead of being the darkest band, it appears washed out or pale. Seen in nephrotic syndrome (kidney protein loss), liver disease (reduced production), or malnutrition. Other bands may appear relatively darker by comparison.'
  },
  'protein-pattern-polyclonal': {
    title: 'Polyclonal Gammopathy',
    text: 'Gamma region appears as a darker, broader band than normal - but still diffuse, not a sharp spike. Multiple antibody types are elevated, causing general darkening rather than one intense line. Seen in chronic infections, autoimmune diseases, or liver disease. Differs from M-spike by being a broad elevation instead of a single sharp band.'
  },
  'albumin-level': {
    title: 'Albumin Protein Band',
    text: 'Darkest band on normal strip, travels furthest (bottom position). Smallest serum protein - migrates fastest toward positive electrode. Produced by liver. Maintains blood pressure, transports hormones and drugs. Compare darkness to reference: dark = normal, faint = low albumin (liver disease, kidney loss, malnutrition).'
  },
  'alpha1-globulin': {
    title: 'Alpha-1 Globulin Band',
    text: 'Small, faint band (3-5% of total protein). Contains alpha-1 antitrypsin and clotting factors. If band is absent or very faint, suspect alpha-1 antitrypsin deficiency (genetic disorder affecting lungs and liver). Band darkens during inflammation as acute phase proteins increase.'
  },
  'alpha2-globulin': {
    title: 'Alpha-2 Globulin Band',
    text: 'Light band (7-10% of total). Contains proteins that bind hemoglobin and copper. Band darkens in inflammation or nephrotic syndrome. These are "acute phase reactants" - proteins that increase when body responds to illness or tissue damage. Compare intensity to reference pattern.'
  },
  'beta-globulin': {
    title: 'Beta Globulin Band',
    text: 'Medium-intensity band (10-13% of total). Contains transferrin (carries iron) and other transport proteins. In cirrhosis, may merge with gamma band creating "beta-gamma bridge" - bands connect instead of staying separate. Sometimes appears as two close bands instead of one.'
  },
  'gamma-globulin': {
    title: 'Gamma Globulin Band (Antibodies)',
    text: 'Slowest migrating band near top (15-20% of total). Contains all antibodies (immunoglobulins). Normal = broad, medium-dark band. Sharp, intense spike = myeloma. Very faint = immunodeficiency. Darker broad band = chronic infection/inflammation. This is where you look for M-spikes or polyclonal elevation.'
  },
  'staining-ponceau': {
    title: 'Ponceau S Stain',
    text: 'Protein dye that makes colorless proteins visible as dark blue-purple bands on the strip. Without staining, proteins are invisible - you must stain to see the pattern. Dye binds to amino acids in proteins. After staining, excess dye is washed away, leaving only protein-bound color visible as bands.'
  },
  'run-electrophoresis': {
    title: 'Running Electrophoresis',
    text: 'Apply blood serum as a line near the negative electrode (cathode). Apply 120 volts for 30-45 minutes. Proteins migrate toward positive electrode (anode) at different speeds - small proteins (albumin) travel fastest and furthest. Proteins are invisible during migration - only become visible after staining. Migration complete when albumin reaches bottom.'
  },
  'albumin-low': {
    title: 'Low Albumin Band',
    text: 'Albumin band appears faint, thin, or washed out compared to reference. Instead of being the darkest band, it is pale. Causes: kidney loses protein in urine (nephrotic syndrome), liver produces less (cirrhosis), inadequate protein intake (malnutrition). Patients develop swelling (edema) and fluid in abdomen (ascites).'
  },
  'albumin-normal': {
    title: 'Normal Albumin Band',
    text: 'Albumin band is the darkest, most prominent band on the strip - clearly darker than all other bands. Should be thick and intense compared to fainter alpha, beta, and gamma bands. Indicates adequate liver function, good nutrition, and no excessive protein loss through kidneys. Maintains proper blood pressure.'
  },
  'albumin-high': {
    title: 'High Albumin Band',
    text: 'Albumin band appears even darker or relatively increased compared to other bands. Usually means patient is dehydrated - water loss concentrates all proteins, making bands darker. Rarely indicates true overproduction. If all bands look darker than reference, suspect dehydration rather than disease. Patient needs fluids.'
  },
  'globulin-low': {
    title: 'Low Globulin Bands',
    text: 'Alpha, beta, or gamma bands appear very faint or absent. Faint gamma band = immunodeficiency (cannot make antibodies) - patients get frequent infections. May need antibody replacement therapy. Faint alpha bands = low clotting factors or acute phase proteins. Compare all bands to reference strip for relative darkness.'
  },
  'globulin-normal': {
    title: 'Normal Globulin Bands',
    text: 'Alpha, beta, and gamma bands appear in expected proportions: α₁ faint, α₂ light, β medium, γ medium-broad band. No bands merge together. No sharp spikes. No unusually dark or faint areas. Pattern matches reference strip. Indicates normal immune function, liver function, and protein balance.'
  },
  'globulin-high': {
    title: 'High Globulin Bands',
    text: 'Globulin bands appear darker than reference pattern. Pattern of darkening reveals cause: sharp narrow spike in gamma = myeloma, broad gamma darkening = chronic infection, beta-gamma fusion = cirrhosis, overall darkening = dehydration. Compare to reference card to determine which bands are elevated and whether darkening is sharp spike or broad increase.'
  }
};

export const PCR_INFO = {
  'gene-sequence': {
    title: 'Gene Sequence Visualization',
    text: 'DNA shown as color-coded nucleotides: A (adenine, red), T (thymine, blue), G (guanine, green), C (cytosine, yellow). Primers bind to specific sequences on template DNA - forward primer binds to one strand, reverse primer binds to opposite strand. The region between primers gets amplified millions of times during PCR.'
  },
  'sequence-position': {
    title: 'Sequence Position Numbers',
    text: 'Numbers show the position of each nucleotide in the gene sequence (starting at position 1). Important for precisely defining where primers bind. Scientists use position numbers to communicate primer locations and to design primers that target specific gene regions.'
  },
  'base-A': {
    title: 'Adenine (A)',
    text: 'One of the four DNA bases (nucleotides). Pairs with Thymine (T) via 2 hydrogen bonds. Purine base with double-ring structure. ~20-25% of DNA in most organisms.'
  },
  'base-T': {
    title: 'Thymine (T)',
    text: 'One of the four DNA bases. Pairs with Adenine (A) via 2 hydrogen bonds. Pyrimidine base with single-ring structure. ~20-25% of DNA in most organisms.'
  },
  'base-G': {
    title: 'Guanine (G)',
    text: 'One of the four DNA bases. Pairs with Cytosine (C) via 3 hydrogen bonds (stronger bond). Purine base. Higher G+C content creates more stable DNA that requires higher temperatures to denature.'
  },
  'base-C': {
    title: 'Cytosine (C)',
    text: 'One of the four DNA bases. Pairs with Guanine (G) via 3 hydrogen bonds (stronger bond). Pyrimidine base. GC-rich regions are more stable and have higher melting temperatures.'
  },
  'primer-forward': {
    title: 'Forward Primer (Green)',
    text: 'Short DNA sequence (18-25 bases) that binds to the template DNA strand. Marks the START of the region to amplify. Designed to be complementary to the target sequence. During extension, DNA polymerase adds nucleotides starting from this primer, copying toward the reverse primer.'
  },
  'primer-reverse': {
    title: 'Reverse Primer (Orange)',
    text: 'Short DNA sequence (18-25 bases) that binds to the opposite DNA strand. Marks the END of the region to amplify. Must be reverse complement of target sequence. During extension, DNA polymerase adds nucleotides starting from this primer, copying toward the forward primer. Product size = distance between primers.'
  },
  'quality-overall': {
    title: 'Overall Primer Quality',
    text: 'Combines all quality metrics: Excellent = all metrics pass, Good = minor issues, Acceptable = some issues but will amplify, Poor = multiple problems, Fail = will not work. Poor quality primers waste time and reagents. Always design primers to meet all quality criteria before running PCR.'
  },
  'metric-tm': {
    title: 'Melting Temperature (Tm)',
    text: 'Temperature at which 50% of primers dissociate from DNA. Forward and reverse Tm should match within 5°C for optimal amplification. If Tm values are too different, one primer binds poorly during annealing step. Calculated from DNA sequence: GC bases contribute more (3 bonds) than AT bases (2 bonds). Higher GC% = higher Tm.'
  },
  'metric-gc': {
    title: 'GC Content Percentage',
    text: 'Percentage of G and C nucleotides in primer. Optimal: 40-60%. Too low (<40%) = weak binding, primer falls off easily. Too high (>60%) = primers stick to wrong places (non-specific binding). GC bases form 3 hydrogen bonds vs 2 for AT, so they bind more strongly. Affects Tm and specificity.'
  },
  'metric-complementarity': {
    title: 'Self-Complementarity Score',
    text: 'Measures how well primers bind to themselves or each other (primer-dimers). Score 0-10, lower is better. High scores (>6) mean primers stick together instead of binding to template DNA. Primer-dimers appear as ~50-100bp bands on gel. Wastes primers and reduces target amplification. Check 3\' ends especially - strong 3\' binding is worst.'
  },
  'metric-hairpins': {
    title: 'Hairpin Structures',
    text: 'Primer folds back on itself, forming stem-loop structure when internal sequences are complementary. Prevents primer from binding to template DNA. Even one hairpin can completely block PCR - critical failure. Detected by finding reverse-complementary regions within single primer (≥4bp stem). Redesign primers to eliminate all hairpins.'
  },
  'metric-product-size': {
    title: 'PCR Product Size',
    text: 'Length of DNA fragment between primers (in base pairs). Calculated from reverse primer position minus forward primer position. Optimal: 100-1000bp. Too small (<100bp) hard to see on gel. Too large (>1000bp) difficult to amplify efficiently - DNA polymerase takes longer, more chance of errors. Determines which gel ladder band to compare.'
  },
  'pcr-prediction': {
    title: 'Expected PCR Result',
    text: 'Predicts gel appearance based on primer quality. Clean = single bright band (good primers). Weak = faint band (Tm mismatch or poor GC). Dimers = multiple bands at 50-100bp + weak target (high complementarity). Smeared = many sizes (non-specific binding). None = no bands (hairpins block amplification). Helps you understand what gel results mean.'
  },
  'run-pcr': {
    title: 'Running PCR',
    text: 'Polymerase Chain Reaction (1983, Kary Mullis). 25 cycles of 3 steps: (1) Denaturation 94°C - separates DNA strands, (2) Annealing ~55°C - primers bind to template, (3) Extension 72°C - DNA polymerase copies DNA. Each cycle doubles DNA amount. After 25 cycles: 2²⁵ = 33 million copies! Takes ~1 hour.'
  },
  'load-gel': {
    title: 'DNA Gel Electrophoresis',
    text: 'Agarose gel with electric field separates DNA by size. Load PCR product into wells. DNA is negatively charged - migrates toward positive electrode. Small fragments move faster/farther than large fragments. Ladder provides size markers (100, 200, 500, 1000bp). UV light + DNA stain makes bands visible as purple. Compare sample band position to ladder to estimate size.'
  },
  'load-gel-sample': {
    title: 'Loading Gel Sample',
    text: 'Pipette 10µL of PCR product mixed with loading dye into gel well. Loading dye contains glycerol (makes sample dense so it sinks into well) and bromophenol blue tracking dye (blue color for visual tracking during run, migrates at ~300bp equivalent DNA fragment rate).'
  },
  'run-gel-electrophoresis': {
    title: 'Running Gel Electrophoresis',
    text: 'Apply 100V across gel (typical: 50-100V for 10-20cm gels). DNA is negatively charged and migrates toward positive electrode (anode). Smaller fragments move faster through gel matrix pores. Standard run time: 30-60 minutes. When blue tracking dye reaches 3/4 down gel, separation is usually complete.'
  },
  'view-uv-bands': {
    title: 'UV Visualization',
    text: 'UV light (302nm wavelength) excites ethidium bromide or similar DNA stain, making DNA bands glow bright orange/pink/purple. Compare your sample band position to ladder markers to estimate fragment size. Ladder shows 100, 200, 500, 1000, and 2000 base pair DNA standards. Band brightness indicates DNA quantity.'
  }
};

export const FLOW_CYTOMETRY_INFO = {
  'run-cytometer': {
    title: 'Flow Cytometry Analysis',
    text: 'The Cytofluorograph 4800A (1970s) analyzes individual cells as they flow through a laser beam. Forward scatter (X-axis) measures cell size - larger cells scatter more light forward. Side scatter (Y-axis) measures cell complexity/granularity - cells with more internal structures scatter more light sideways. Each dot represents one cell.'
  },
  'gate-control': {
    title: 'Rectangular Gating',
    text: 'Draw a rectangle (gate) around cell populations of interest. Drag the red corner handles to adjust the gate boundaries. The gate allows you to select and quantify specific cell populations. In the 1970s, rectangular gates were the standard analysis method - more advanced polygon gates came later.'
  }
};

// Helper to get info by key from any category
export function getInfoContent(key: string) {
  return STAIN_INFO[key as keyof typeof STAIN_INFO] 
    || MORPHOLOGY_INFO[key as keyof typeof MORPHOLOGY_INFO]
    || CULTURE_INFO[key as keyof typeof CULTURE_INFO]
    || BIOCHEMICAL_INFO[key as keyof typeof BIOCHEMICAL_INFO]
    || SEROLOGY_INFO[key as keyof typeof SEROLOGY_INFO]
    || ANTIBIOTIC_INFO[key as keyof typeof ANTIBIOTIC_INFO]
    || ELECTROPHORESIS_INFO[key as keyof typeof ELECTROPHORESIS_INFO]
    || PCR_INFO[key as keyof typeof PCR_INFO]
    || FLOW_CYTOMETRY_INFO[key as keyof typeof FLOW_CYTOMETRY_INFO]
    || null;
}
