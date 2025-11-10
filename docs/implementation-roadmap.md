# Implementation Roadmap# Implementation Roadmap# Implementation Roadmap



**Vision:** Build an interactive history of diagnostic science where players experience how biological understanding evolved from pre-scientific observation to modern genomics. Each epic adds a historically significant technique that answers questions previous methods couldn't.



**Core Principle:** Cases unlock techniques AND techniques unlock cases. Some mysteries are impossible until the right technology is invented.**Vision:** Build an interactive history of diagnostic science where players experience how biological understanding evolved from pre-scientific observation to modern genomics. Each epic adds a historically significant technique that answers questions previous methods couldn't.**Vision:** Build an interactive history of diagnostic science where players experience how biological understanding evolved from pre-scientific observation to modern genomics. Each epic adds a historically significant technique that answers questions previous methods couldn't.



---



## Current State: Era 1 Complete (1880s-1920s Bacteriology)**Core Principle:** Cases unlock techniques AND techniques unlock cases. Some mysteries are impossible until the right technology is invented.**Core Principle:** Cases unlock techniques AND techniques unlock cases. Some mysteries are impossible until the right technology is invented.



**What we've built (Epics 0-6):**

- ✅ Epic 0: Project Setup

- ✅ Epic 1: Minimal Diagnostic Loop------

- ✅ Epic 2: Staining Mechanic

- ✅ Epic 3: Multiple Organisms

- ✅ Epic 4: Sample Selection

- ✅ Epic 5: Observation Notes System## Current State: Era 1 Complete (1880s-1920s Bacteriology)## Current State: Era 1 Complete (1880s-1920s Bacteriology)

- ✅ Epic 6: Educational Info Panels



**Result:** Complete 1880s-1920s bacteriology workflow

- Optical microscopy with multiple stains (Gram, Acid-Fast, Capsule, Spore)**What we've built (Epics 0-8):****What we've built (Epics 0-8):**

- 16 bacterial organisms with morphological characteristics

- Evidence-based deduction system- ✅ Core diagnostic loop with evidence-based deduction- ✅ Core diagnostic loop with evidence-based deduction

- Case presentation with sample selection

- Educational info panels throughout- ✅ Optical microscopy with multiple stains (Gram, Acid-Fast, Capsule, Spore)- ✅ Optical microscopy with multiple stains (Gram, Acid-Fast, Capsule, Spore)



**Questions this era can answer:**- ✅ 16 bacterial organisms with morphological characteristics- ✅ 16 bacterial organisms with morphological characteristics

- "Which bacterium is causing this infection?"

- "Is this Gram-positive or Gram-negative?"- ✅ Case presentation with sample selection- ✅ Case presentation with sample selection

- "Does this patient have tuberculosis?" (acid-fast stain)

- ✅ Educational info panels throughout gameplay- ✅ Educational info panels throughout gameplay

**Questions this era CANNOT answer:**

- "Which exact species?" (need biochemical tests)- ✅ Comparison table for organism deduction- ✅ Comparison table for organism deduction

- "Has this person been exposed?" (need serology)

- "Which antibiotic works?" (need sensitivity testing)

- "Is this a virus?" (invisible to optical microscopy)

- "What's the DNA sequence?" (molecular methods don't exist yet)**Questions this era can answer:****Questions this era can answer:**



---- "Which bacterium is causing this infection?"- "Which bacterium is causing this infection?"



## Era 2: Biochemical Differentiation (1920s-1940s)- "Is this Gram-positive or Gram-negative?"- "Is this Gram-positive or Gram-negative?"



### Epic 7: Bacterial Culture & Biochemical Testing- "Does this patient have tuberculosis?" (acid-fast stain)- "Does this patient have tuberculosis?" (acid-fast stain)

**Historical Context:** By the 1920s, microbiologists could see bacteria under microscopes, but many looked identical. How to tell *Staphylococcus* from *Streptococcus* when both are Gram-positive cocci? Answer: grow them and test their biochemical properties.



**New Question Answered:** "Which bacterial species exactly?"

**Questions this era CANNOT answer:****Questions this era CANNOT answer:**

**Why This Was Revolutionary:**

- Two bacteria can look identical under microscope but behave completely differently- "Which exact species?" (need biochemical tests)- "Which exact species?" (need biochemical tests)

- Some produce catalase (bubbles in H₂O₂), others don't

- Some ferment lactose (turns medium yellow), others don't- "Has this person been exposed?" (need serology)- "Has this person been exposed?" (need serology)

- Chemical tests distinguish species that morphology cannot

- "Which antibiotic works?" (need sensitivity testing)- "Which antibiotic works?" (need sensitivity testing)

**Technique Components:**

- **Culture Plates**: Petri dish visualization with colony growth- "Is this a virus?" (invisible to optical microscopy)- "Is this a virus?" (invisible to optical microscopy)

  - Colony morphology: size, color, shape, texture

  - Different media types: blood agar (hemolysis patterns), MacConkey (lactose fermentation)- "What's the DNA sequence?" (molecular methods don't exist yet)- "What's the DNA sequence?" (molecular methods don't exist yet)

  - Growth characteristics as evidence

  

- **Biochemical Tests**: Individual test tubes/reactions

  - Catalase test (bubbles = positive)------

  - Oxidase test (purple = positive)

  - Coagulase test (clumping = positive)

  - Sugar fermentation (color change = positive)

## Era 2: Biochemical Differentiation (1920s-1940s)## Era 2: Biochemical Differentiation (1920s-1940s)

**New Observation Types:**

- Colony color (white/cream/golden/gray)

- Colony size (pinpoint/small/medium/large)

- Hemolysis (alpha/beta/gamma)### Epic 9: Bacterial Culture & Biochemical Testing### Epic 9: Bacterial Culture & Biochemical Testing

- Test results (positive/negative for each biochemical)

**Historical Context:** By the 1920s, microbiologists could see bacteria under microscopes, but many looked identical. How to tell *Staphylococcus* from *Streptococcus* when both are Gram-positive cocci? Answer: grow them and test their biochemical properties.**Historical Context:** By the 1920s, microbiologists could see bacteria under microscopes, but many looked identical. How to tell *Staphylococcus* from *Streptococcus* when both are Gram-positive cocci? Answer: grow them and test their biochemical properties.

**Gameplay:**

1. Streak sample onto culture plate

2. Incubate (time delay or fast-forward mechanic)

3. Observe colony morphology**New Question Answered:** "Which bacterial species exactly?"**New Question Answered:** "Which bacterial species exactly?"

4. Pick colony and run biochemical tests

5. Interpret color changes and reactions

6. Record results as evidence

**Why This Was Revolutionary:****Why This Was Revolutionary:**

**Cases This Unlocks:**

- "Differentiate *Staph aureus* from *Staph epidermidis*" (coagulase test)- Two bacteria can look identical under microscope but behave completely differently- Two bacteria can look identical under microscope but behave completely differently

- "Is this *E. coli* or *Salmonella*?" (lactose fermentation)

- "Confirm strep throat" (beta-hemolysis on blood agar)- Some produce catalase (bubbles in H₂O₂), others don't- Some produce catalase (bubbles in H₂O₂), others don't



**Challenge Elements:**- Some ferment lactose (turns medium yellow), others don't- Some ferment lactose (turns medium yellow), others don't

- Similar colony colors (cream vs pale yellow)

- Weak positive vs negative reactions- Chemical tests distinguish species that morphology cannot- Chemical tests distinguish species that morphology cannot

- Contamination (multiple colony types)

- Choosing which tests to run (can't run all of them)



**Implementation Notes:****Technique Components:****Technique Components:**

- New view component: `CulturePlateView.svelte`

- New view component: `BiochemicalTestView.svelte`- **Culture Plates**: Petri dish visualization with colony growth- **Culture Plates**: Petri dish visualization with colony growth

- Extend evidence store with biochemical properties

- Add culture-growable organisms to organism database  - Colony morphology: size, color, shape, texture  - Colony morphology: size, color, shape, texture

- Time mechanic (overnight incubation) or skip-forward

  - Different media types: blood agar (hemolysis patterns), MacConkey (lactose fermentation)  - Different media types: blood agar (hemolysis patterns), MacConkey (lactose fermentation)

---

  - Growth characteristics as evidence  - Growth characteristics as evidence

## Era 3: Immunological Detection (1900s-1950s)

    

### Epic 8: Serological Testing (Antibody Detection)

**Historical Context:** Not all pathogens can be cultured or seen easily. But when the body encounters a pathogen, it produces antibodies that remain detectable for weeks/months. Serology revolutionized diagnostics by detecting *exposure* rather than the pathogen itself.- **Biochemical Tests**: Individual test tubes/reactions- **Biochemical Tests**: Individual test tubes/reactions



**New Question Answered:** "Has this person been exposed to a disease? Do they have immunity?"  - Catalase test (bubbles = positive)  - Catalase test (bubbles = positive)



**Why This Was Revolutionary:**  - Oxidase test (purple = positive)  - Oxidase test (purple = positive)

- Can diagnose syphilis, typhoid, brucellosis without isolating organism

- Blood typing saves lives in transfusions (discovered 1901)  - Coagulase test (clumping = positive)  - Coagulase test (clumping = positive)

- Pregnancy tests (hCG detection)

- Works for viruses (which can't be cultured easily in 1920s-1940s)  - Sugar fermentation (color change = positive)  - Sugar fermentation (color change = positive)



**Technique Components:**

- **Agglutination Tests**: Mix patient serum with antigens on slide

  - Visible clumping = antibodies present**New Observation Types:****New Observation Types:**

  - Strength graded (1+ to 4+)

  - Blood typing (ABO, Rh)- Colony color (white/cream/golden/gray)- Colony color (white/cream/golden/gray)

  

- **Precipitin Tests**: Antibody-antigen complexes form visible precipitate- Colony size (pinpoint/small/medium/large)- Colony size (pinpoint/small/medium/large)

  - Ring test in tube

  - Intensity indicates concentration- Hemolysis (alpha/beta/gamma)- Hemolysis (alpha/beta/gamma)



**New Observation Types:**- Test results (positive/negative for each biochemical)- Test results (positive/negative for each biochemical)

- Agglutination strength (negative/weak/moderate/strong)

- Precipitin ring formation (present/absent, clarity)

- Antibody titer (dilution at which reaction occurs)

**Gameplay:****Gameplay:**

**Gameplay:**

1. Mix patient serum with test antigens1. Streak sample onto culture plate1. Streak sample onto culture plate

2. Observe for clumping or precipitation

3. Grade reaction strength2. Incubate (time delay or fast-forward mechanic)2. Incubate (time delay or fast-forward mechanic)

4. Record antibody evidence

3. Observe colony morphology3. Observe colony morphology

**Cases This Unlocks:**

- "Suspected syphilis case" (can't culture *Treponema*, but can detect antibodies)4. Pick colony and run biochemical tests4. Pick colony and run biochemical tests

- "Blood transfusion typing" (ABO compatibility)

- "Has this person had measles?" (antibody presence = prior exposure)5. Interpret color changes and reactions5. Interpret color changes and reactions

- "Pregnant or not?" (hCG detection)

6. Record results as evidence6. Record results as evidence

**Challenge Elements:**

- Weak vs negative reactions (is that slight clumping or just debris?)

- Cross-reactivity (false positives from related organisms)

- Timing (antibodies appear days after infection, not immediately)**Cases This Unlocks:****Cases This Unlocks:**



**Implementation Notes:**- "Differentiate *Staph aureus* from *Staph epidermidis*" (coagulase test)- "Differentiate *Staph aureus* from *Staph epidermidis*" (coagulase test)

- New view component: `SerologyView.svelte`

- Agglutination visualization (clumping patterns)- "Is this *E. coli* or *Salmonella*?" (lactose fermentation)- "Is this *E. coli* or *Salmonella*?" (lactose fermentation)

- Grading interface for reaction strength

- Extend evidence store with antibody data- "Confirm strep throat" (beta-hemolysis on blood agar)- "Confirm strep throat" (beta-hemolysis on blood agar)



---



### Epic 9: ELISA (1971) - Quantitative Immunoassay**Challenge Elements:****Challenge Elements:**

**Historical Context:** Agglutination tests are qualitative (yes/no). ELISA, invented in 1971, uses enzymes to produce measurable color changes, allowing precise quantification of antibodies or antigens.

- Similar colony colors (cream vs pale yellow)- Similar colony colors (cream vs pale yellow)

**New Question Answered:** "How much antibody/antigen is present? Can we detect tiny amounts?"

- Weak positive vs negative reactions- Weak positive vs negative reactions

**Why This Was Revolutionary:**

- 100-1000× more sensitive than agglutination- Contamination (multiple colony types)- Contamination (multiple colony types)

- HIV screening (1985+)

- Hormone quantification (thyroid, fertility)- Choosing which tests to run (can't run all of them)- Choosing which tests to run (can't run all of them)

- Food allergen testing

- Quantitative results guide treatment decisions



**Technique Components:****Implementation Notes:****Implementation Notes:**

- **96-Well Plate**: Grid of tiny wells

  - Each well contains sample + reagents- New view component: `CulturePlateView.svelte`- New view component: `CulturePlateView.svelte`

  - Enzyme reaction produces colored product

  - Color intensity ∝ concentration- New view component: `BiochemicalTestView.svelte`- New view component: `BiochemicalTestView.svelte`

  

- **Plate Reader** (conceptual): Measure optical density- Extend evidence store with biochemical properties- Extend evidence store with biochemical properties

  - Player visually compares well colors

  - Sets threshold for positive/negative- Add culture-growable organisms to organism database- Add culture-growable organisms to organism database

  - Calculates relative amounts

- Time mechanic (overnight incubation) or skip-forward- Time mechanic (overnight incubation) or skip-forward

**New Observation Types:**

- Well color intensity (none/faint/moderate/strong)

- Optical density values (if showing numbers)

- Positive/negative calls based on threshold------

- Pattern analysis across wells

**Goal:** Prove the core diagnostic loop works

**Gameplay:**

1. Load patient samples into wells (with controls)## Era 3: Immunological Detection (1900s-1950s)

2. Add detection reagents

3. Incubate (color develops)### Epic 0: Project Setup ✅

4. Compare well intensities to controls

5. Set threshold for positive/negative### Epic 10: Serological Testing (Antibody Detection)- Initialize project structure and build system

6. Record antibody/antigen levels

**Historical Context:** Not all pathogens can be cultured or seen easily. But when the body encounters a pathogen, it produces antibodies that remain detectable for weeks/months. Serology revolutionized diagnostics by detecting *exposure* rather than the pathogen itself.- Set up TypeScript, Phaser, and development environment

**Cases This Unlocks:**

- "HIV screening program" (antibody detection)- Define data schemas and interfaces

- "Hepatitis B surface antigen" (acute infection marker)

- "Pregnancy confirmation" (hCG quantification)**New Question Answered:** "Has this person been exposed to a disease? Do they have immunity?"- Basic rendering pipeline functional

- "Thyroid function" (hormone levels)

- "Food allergy testing" (IgE antibodies)



**Challenge Elements:****Why This Was Revolutionary:**### Epic 1: Minimal Diagnostic Loop ✅

- Setting threshold (where to draw the line?)

- Edge cases (wells near threshold)- Can diagnose syphilis, typhoid, brucellosis without isolating organism- Single fixed case with pre-stained sample

- Interpreting patterns (controls must work correctly)

- False positives from cross-reactivity- Blood typing saves lives in transfusions (discovered 1901)- Microscope viewer displays sample



**Implementation Notes:**- Pregnancy tests (hCG detection)- Reference manual with one organism

- New view component: `ELISAPlateView.svelte`

- 96-well grid visualization with color gradients- Works for viruses (which can't be cultured easily in 1920s-1940s)- Diagnosis submission and feedback

- Threshold slider UI

- Comparison to positive/negative controls- **Playable:** Complete one diagnosis end-to-end



---**Technique Components:**



## Era 4: Molecular Diagnostics (1980s-1990s)- **Agglutination Tests**: Mix patient serum with antigens on slide### Epic 2: Staining Mechanic ✅



### Epic 10: PCR & Gel Electrophoresis (1983)  - Visible clumping = antibodies present- Unstained sample view

**Historical Context:** PCR (Polymerase Chain Reaction), invented by Kary Mullis in 1983, was a revolution. Instead of waiting weeks for culture or hoping antibodies are present, directly amplify and detect pathogen DNA in hours.

  - Strength graded (1+ to 4+)- Apply Gram stain button

**New Question Answered:** "Can we detect the pathogen's DNA directly, even if we can't culture it?"

  - Blood typing (ABO, Rh)- Visual transformation when stained

**Why This Was Revolutionary:**

- Detects organisms that won't grow in culture (viruses, fastidious bacteria)  - **Playable:** Staining reveals information

- Hours instead of weeks (TB culture takes 6 weeks, PCR takes 4 hours)

- HIV viral load monitoring- **Precipitin Tests**: Antibody-antigen complexes form visible precipitate

- Forensic DNA typing

- Detect specific genes (toxins, antibiotic resistance)  - Ring test in tube### Epic 3: Multiple Organisms ✅



**Technique Components:**  - Intensity indicates concentration- Add 4 more organisms (total 5)

- **Thermal Cycler**: Run PCR amplification

  - Set temperature cycles (denaturation, annealing, extension)- Expand reference manual

  - Conceptual: show cycling animation or progress bar

  **New Observation Types:**- Random case generation

- **Gel Electrophoresis**: Visualize PCR products

  - DNA fragments separate by size- Agglutination strength (negative/weak/moderate/strong)- **Playable:** Diagnostic challenge with variety

  - Smaller = travels farther through gel

  - Compare band positions to DNA ladder- Precipitin ring formation (present/absent, clarity)

  - UV visualization (bands glow)

- Antibody titer (dilution at which reaction occurs)---

**New Observation Types:**

- Band presence/absence for each target

- Band size (compare to ladder: 100bp, 200bp, 500bp, 1000bp markers)

- Band intensity (strong/weak amplification)**Gameplay:**## Phase 2: Deduction Mechanics (Epics 4-7) ✅

- Multiple bands (contamination or primer issues)

1. Mix patient serum with test antigens**Goal:** Build evidence-based diagnostic workflow

**Gameplay:**

1. Choose PCR primers/targets (which genes to amplify?)2. Observe for clumping or precipitation

2. Run PCR (thermal cycling visualization)

3. Load samples onto gel alongside DNA ladder3. Grade reaction strength### Epic 4: Sample Selection ✅

4. Run electrophoresis (fragments migrate)

5. Visualize under UV (bands appear)4. Record antibody evidence- Case presentation screen with patient story

6. Compare band sizes to ladder

7. Identify which targets amplified- Player chooses sample type



**Cases This Unlocks:****Cases This Unlocks:**- Wrong sample = no diagnostic info

- "Is this *Chlamydia*?" (can't culture, but PCR detects)

- "HIV viral load" (quantify virus in blood)- "Suspected syphilis case" (can't culture *Treponema*, but can detect antibodies)- **Playable:** Pre-test strategic decision

- "Detect *Clostridium difficile* toxin gene" (PCR finds toxin producers)

- "Antibiotic resistance genes" (detect mecA for MRSA)- "Blood transfusion typing" (ABO compatibility)

- "Forensic paternity test" (DNA fingerprinting)

- "Unknown respiratory virus" (amplify conserved viral regions)- "Has this person had measles?" (antibody presence = prior exposure)### Epic 5: Observation Notes System ✅



**Challenge Elements:**- "Pregnant or not?" (hCG detection)- Record observed characteristics (shape, Gram stain, arrangement, etc.)

- Band size estimation (is that 450bp or 500bp?)

- Faint bands (real signal or artifact?)- Toggle observations on/off as evidence

- Primer dimer bands (non-specific amplification)

- No band (failed PCR or truly negative?)**Challenge Elements:**- Persistent notes panel showing confirmed findings

- Ladder comparison (which marker is closest?)

- Weak vs negative reactions (is that slight clumping or just debris?)- Reactive filtering narrows organism candidates

**Implementation Notes:**

- New view component: `PCRView.svelte` (thermal cycler interface)- Cross-reactivity (false positives from related organisms)- **Playable:** Build evidence before diagnosis

- New view component: `GelElectrophoresisView.svelte`

- Gel rendering with lanes, ladder, and sample bands- Timing (antibodies appear days after infection, not immediately)

- Band size calculation and comparison logic

- Extend evidence store with genetic targets### Epic 6: Educational Info Panels ✅



---**Implementation Notes:**- Hover-based info system for game elements



## Era 5: Genomic Sequencing (1990s-2000s)- New view component: `SerologyView.svelte`- Educational content for stains, characteristics, and features



### Epic 11: Sanger Sequencing (1977) & Basic Bioinformatics- Agglutination visualization (clumping patterns)- Fixed-height persistent display showing last hovered item

**Historical Context:** PCR tells you if DNA is present. Sequencing tells you *what the DNA says*. Sanger sequencing (1977) became practical in the 1990s, enabling identification of mutations, exact species confirmation, and phylogenetic analysis.

- Grading interface for reaction strength- Integrated into microscope and diagnosis views

**New Question Answered:** "What is the exact DNA sequence? What mutations are present?"

- Extend evidence store with antibody data- **Playable:** Learn terminology and concepts during gameplay

**Why This Was Revolutionary:**

- Identify unknown organisms by sequencing conserved genes (16S rRNA)

- Detect specific mutations (cystic fibrosis, sickle cell, cancer)

- Phylogenetic typing (which outbreak strain?)---### Epic 7: Deductive Diagnosis Interface ✅

- Antibiotic resistance mutations

- Forensic identification- Side-by-side organism comparison table



**Technique Components:**### Epic 9: ELISA (1971) - Quantitative Immunoassay- Shows all filtered candidates with their characteristics

- **Chromatogram Reading**: Colored peaks (A=green, C=blue, G=black, T=red)

  - Read sequence from peak patterns**Historical Context:** Agglutination tests are qualitative (yes/no). ELISA, invented in 1971, uses enzymes to produce measurable color changes, allowing precise quantification of antibodies or antigens.- Highlight matching/non-matching traits

  - Ambiguous bases (overlapping peaks)

  - Quality scores (peak height/clarity)- Submit diagnosis from narrowed list

  

- **BLAST Search**: Compare sequence to database**New Question Answered:** "How much antibody/antigen is present? Can we detect tiny amounts?"- Feedback shows correct organism when wrong

  - Enter sequence obtained from chromatogram

  - Find closest matches (% identity)- **Playable:** Deduce diagnosis from evidence

  - Identify organism or gene

**Why This Was Revolutionary:**

**New Observation Types:**

- DNA sequence (ATCG string)- 100-1000× more sensitive than agglutination### Epic 8: Microscopy & Stain Controls ✅

- Sequence quality (clean vs noisy)

- BLAST match percentage (98% = *E. coli*, 100% = exact match)- HIV screening (1985+)- Multiple stain types (None, Gram, Acid-fast, Capsule, Spore)

- Top organism matches from database

- Hormone quantification (thyroid, fertility)- Each stain reveals different characteristics

**Gameplay:**

1. Sequence amplified DNA (from PCR)- Food allergen testing- Visual feedback for applied stains

2. View chromatogram with colored peaks

3. Read sequence (call bases from peaks)- Quantitative results guide treatment decisions- Toggle-based observation recording

4. Handle ambiguous positions (N for unclear)

5. Input sequence into BLAST- **Playable:** Choose tools to gather evidence

6. Review top matches with % identity

7. Identify organism or gene**Technique Components:**



**Cases This Unlocks:**- **96-Well Plate**: Grid of tiny wells---

- "Unknown organism in environmental sample" (16S sequencing → ID)

- "Is this *E. coli* O157:H7?" (sequence serotype genes)  - Each well contains sample + reagents

- "Cancer mutation screening" (BRCA1/2, EGFR, TP53)

- "Confirm antibiotic resistance mechanism" (sequence resistance gene)  - Enzyme reaction produces colored product## Phase 3: Realism & Complexity (Epics 9-12)

- "Outbreak strain typing" (sequence hypervariable regions)

  - Color intensity ∝ concentration**Goal:** Add realistic constraints and challenges

**Challenge Elements:**

- Ambiguous bases (overlapping peaks - which base is it?)  

- Poor quality regions (sequence degrades toward end)

- Interpreting % identity (97% match - same species or different?)- **Plate Reader** (conceptual): Measure optical density### Epic 9: Contamination System

- Choosing which gene to sequence (16S for bacteria, ITS for fungi, etc.)

  - Player visually compares well colors- Carefulness slider per test

**Implementation Notes:**

- New view component: `ChromatogramView.svelte`  - Sets threshold for positive/negative- Contamination chance based on settings

- Peak visualization (4-color traces)

- Sequence reading interface  - Calculates relative amounts- Visual contamination artifacts

- BLAST search UI (could use real NCBI API or simulated)

- Database of organism sequences for matching- **Playable:** Risk/reward speed vs accuracy



---**New Observation Types:**



## Era 6: High-Throughput Genomics (2010s-2020s)- Well color intensity (none/faint/moderate/strong)### Epic 10: Equipment System



### Epic 12: Next-Generation Sequencing (2005+) & Metagenomics- Optical density values (if showing numbers)- Zeiss Standard Microscope as equipment object

**Historical Context:** Sanger sequencing reads one gene at a time. NGS (Illumina, 2006+) sequences entire genomes in a day. Metagenomics sequences *everything* in a sample - no culture needed, no prior knowledge required.

- Positive/negative calls based on threshold- Basic equipment stats (magnification, resolution)

**New Question Answered:** "What is the complete genome? What's ALL the DNA in this sample (even unknown organisms)?"

- Pattern analysis across wells- Foundation for future equipment variety

**Why This Was Revolutionary:**

- Whole genome sequencing for personalized medicine- **Playable:** Equipment context visible to player

- Discover novel pathogens (SARS-CoV-2 identified in weeks)

- Microbiome analysis (all bacteria in gut, skin, etc.)**Gameplay:**

- Real-time outbreak surveillance

- Resistance gene profiling across entire genome1. Load patient samples into wells (with controls)### Epic 11: Clinical Context Reasoning



**Technique Components:**2. Add detection reagents- Same organism in different sample types

- **NGS Sequencer**: Massively parallel sequencing

  - Millions of reads simultaneously3. Incubate (color develops)- Normal flora vs pathogenic context

  - Output: coverage plots, variant calls

  4. Compare well intensities to controls- Cases require reasoning beyond identification

- **Metagenomic Analysis**: Identify all organisms in sample

  - Taxonomic classification (pie chart of species)5. Set threshold for positive/negative- **Playable:** Context-dependent diagnosis

  - Detect unexpected pathogens

  - Functional profiling (which genes present?)6. Record antibody/antigen levels



**New Observation Types:**### Epic 12: Ambiguous Cases

- Genome coverage (depth across positions)

- Variant calls (SNPs, indels detected)**Cases This Unlocks:**- Multiple valid interpretations

- Taxonomic composition (% of each organism)

- Resistance genes detected (full resistome)- "HIV screening program" (antibody detection)- Differential diagnosis scenarios

- Virulence factors present

- "Hepatitis B surface antigen" (acute infection marker)- Follow-up testing needed

**Gameplay:**

1. Prepare sample for NGS (extract all DNA)- "Pregnancy confirmation" (hCG quantification)- **Playable:** Complex diagnostic reasoning

2. Run sequencer (progress bar, millions of reads)

3. View coverage plot (genome map with read depth)- "Thyroid function" (hormone levels)

4. Identify variants (SNPs highlighted)

5. Taxonomic breakdown (pie chart or bar graph)- "Food allergy testing" (IgE antibodies)### Epic 13: Multi-Sample Cases

6. Detect resistance/virulence genes

7. Interpret complex results- Cases with multiple sample types available



**Cases This Unlocks:****Challenge Elements:**- Player can request additional samples

- "Unknown outbreak pathogen" (metagenomic discovery)

- "Cancer genome sequencing" (all mutations at once)- Setting threshold (where to draw the line?)- Sequential testing strategy

- "Microbiome dysbiosis" (IBD patient gut composition)

- "Pandemic surveillance" (SARS-CoV-2 variant tracking)- Edge cases (wells near threshold)- **Playable:** Comprehensive investigation

- "Multi-drug resistant organism" (find all resistance genes)

- "Rare disease diagnosis" (whole exome sequencing)- Interpreting patterns (controls must work correctly)



**Challenge Elements:**- False positives from cross-reactivity---

- Interpreting complex coverage plots

- Distinguishing real variants from sequencing errors

- Taxonomic ambiguity (reads match multiple species)

- Too much data (which findings are relevant?)**Implementation Notes:**## Phase 4: Polish & Content (Epics 14-18)



**Implementation Notes:**- New view component: `ELISAPlateView.svelte`**Goal:** Expand content and improve experience

- New view component: `NGSView.svelte`

- Coverage plot visualization- 96-well grid visualization with color gradients

- Pie chart for taxonomic composition

- Variant table with positions and impacts- Threshold slider UI### Epic 14: Expanded Organism Library

- Gene annotation display

- Comparison to positive/negative controls- Add 10-15 more organisms

---

- Diverse morphologies and contexts

## Future Eras (Beyond Initial Scope)

---- Agricultural and environmental samples

### Epic 13+: Additional Techniques (Potential)

- **Flow Cytometry**: Cell population analysis, scatter plots, gating- **Playable:** Much greater variety

- **MALDI-TOF Mass Spec**: Rapid bacterial ID via protein fingerprint

- **Western Blot**: Protein detection, HIV confirmation## Era 4: Molecular Diagnostics (1980s-1990s)

- **Fluorescence Microscopy**: Immunofluorescence, FISH

- **Real-time PCR (qPCR)**: Quantitative amplification curves### Epic 15: Case Narrative System

- **Long-read Sequencing**: Nanopore, structural variants

- **Spatial Transcriptomics**: Gene expression in tissue context### Epic 12: PCR & Gel Electrophoresis (1983)- Rich patient stories



### Pre-1880s Techniques (Historical Extension)**Historical Context:** PCR (Polymerase Chain Reaction), invented by Kary Mullis in 1983, was a revolution. Instead of waiting weeks for culture or hoping antibodies are present, directly amplify and detect pathogen DNA in hours.- Historical context (1920s setting)

- **Uroscopy (Medieval-1800s)**: Urine color, clarity, smell examination

- **Wound Assessment (Ancient)**: Visual inspection, pus characteristics- Multiple case types (human, agricultural, veterinary)

- **Early Microscopy (1670s)**: Van Leeuwenhoek's simple microscope

- **Germ Theory Experiments (1850s-1870s)**: Pasteur's swan-neck flask**New Question Answered:** "Can we detect the pathogen's DNA directly, even if we can't culture it?"- **Playable:** Immersive case presentations

- **Koch's Postulates (1880s)**: Prove causation experimentally



---

**Why This Was Revolutionary:**### Epic 16: Reference Manual Enhancement

## Implementation Strategy

- Detects organisms that won't grow in culture (viruses, fastidious bacteria)- Searchable interface

**Immediate Next Steps:**

1. **Epic 7: Bacterial Culture** - Natural next step, 1920s-1940s era- Hours instead of weeks (TB culture takes 6 weeks, PCR takes 4 hours)- Organized by characteristics

2. **Epic 8: Serology** - Completes pre-molecular diagnostics

3. **Epic 9: ELISA** - Bridges to modern methods- HIV viral load monitoring- Educational notes and context

4. **Epic 10: PCR** - Enters molecular era

5. **Epic 11-12**: Continue chronologically through genomics- Forensic DNA typing- **Playable:** Better diagnostic workflow



**Design Principles:**- Detect specific genes (toxins, antibiotic resistance)

- Each epic is independently playable

- Build new view components for each technique### Epic 17: Feedback & Education

- Extend evidence system to handle new data types

- Cases should showcase technique strengths/limitations**Technique Components:**- Detailed explanations after diagnosis

- Educational focus: why was this invented?

- **Thermal Cycler**: Run PCR amplification- Learn why answer was correct/wrong

**Technical Approach:**

- Create instrument view components (like `MicroscopeView.svelte`)  - Set temperature cycles (denaturation, annealing, extension)- Historical notes about organisms

- Evidence store accommodates different evidence types

- Case data specifies which techniques are relevant  - Conceptual: show cycling animation or progress bar- **Playable:** Educational value

- Organism/condition database expands with era-specific data

  

**Flexible Progression:**

- Players can unlock techniques in historical order- **Gel Electrophoresis**: Visualize PCR products### Epic 18: Visual Polish

- Or explore techniques freely (sandbox mode)

- Some cases locked until appropriate technique available  - DNA fragments separate by size- Scientific illustration aesthetic

- Technique limitations clearly communicated

  - Smaller = travels farther through gel- UI/UX refinement

---

  - Compare band positions to DNA ladder- Animations and transitions

## Beyond Playground Scope

  - UV visualization (bands glow)- **Playable:** Professional feel

**Deferred Systems:**

- Economic/resource management (money, reagents, time pressure)

- Lab environment progression (kitchen → BSL-3)

- Equipment degradation and maintenance**New Observation Types:**---

- Real-time day cycles

- Multi-sample complex cases- Band presence/absence for each target

- Clinical context reasoning (normal flora vs pathogenic)

- Contamination risk/reward mechanics- Band size (compare to ladder: 100bp, 200bp, 500bp, 1000bp markers)## Phase 5: Advanced Features (Epics 19-21)



These add strategic depth but aren't essential for the core "history of diagnostic techniques" experience.- Band intensity (strong/weak amplification)**Goal:** Add sophisticated mechanics


- Multiple bands (contamination or primer issues)

### Epic 19: Culture & Incubation

**Gameplay:**- Time-delayed culture results

1. Choose PCR primers/targets (which genes to amplify?)- Choose culture medium

2. Run PCR (thermal cycling visualization)- Colony morphology observation

3. Load samples onto gel alongside DNA ladder- **Playable:** Long-term diagnostic strategy

4. Run electrophoresis (fragments migrate)

5. Visualize under UV (bands appear)### Epic 20: Equipment Degradation

6. Compare band sizes to ladder- Lenses get dirty over time

7. Identify which targets amplified- Maintenance mechanic

- Visual quality degradation

**Cases This Unlocks:**- **Playable:** Equipment care matters

- "Is this *Chlamydia*?" (can't culture, but PCR detects)

- "HIV viral load" (quantify virus in blood)### Epic 21: Advanced Diagnostics Preview

- "Detect *Clostridium difficile* toxin gene" (PCR finds toxin producers)- Basic gel electrophoresis (PCR placeholder)

- "Antibiotic resistance genes" (detect mecA for MRSA)- Simple ELISA simulation

- "Forensic paternity test" (DNA fingerprinting)- Preview of future eras

- "Unknown respiratory virus" (amplify conserved viral regions)- **Playable:** Glimpse of progression



**Challenge Elements:**---

- Band size estimation (is that 450bp or 500bp?)

- Faint bands (real signal or artifact?)## Beyond Playground

- Primer dimer bands (non-specific amplification)**Future work not in current scope:**

- No band (failed PCR or truly negative?)

- Ladder comparison (which marker is closest?)- Economic system (money, reagent costs, daily cycle)

- Time pressure (real-time work day)

**Implementation Notes:**- Lab progression (kitchen → basement → professional lab)

- New view component: `PCRView.svelte` (thermal cycler interface)- Historical era transitions (1950s, 1980s, 2000s, 2020s)

- New view component: `GelElectrophoresisView.svelte`- Real data API integration (NCBI BLAST, etc.)

- Gel rendering with lanes, ladder, and sample bands- Additional assay types (Western blot, flow cytometry, sequencing)

- Band size calculation and comparison logic- Computational bioinformatics tools

- Extend evidence store with genetic targets- Multi-omics analysis



------



## Era 5: Genomic Sequencing (1990s-2000s)## Implementation Notes



### Epic 13: Sanger Sequencing (1977) & Basic Bioinformatics**Completed (Epics 0-8):**

**Historical Context:** PCR tells you if DNA is present. Sequencing tells you *what the DNA says*. Sanger sequencing (1977) became practical in the 1990s, enabling identification of mutations, exact species confirmation, and phylogenetic analysis.- Core diagnostic loop with 16 organisms and stains

- Evidence-based deduction system (Obra Dinn-style filtering)

**New Question Answered:** "What is the exact DNA sequence? What mutations are present?"- Educational info panels for learning during gameplay

- Case presentation with sample selection

**Why This Was Revolutionary:**- Microscope controls with multiple stain types

- Identify unknown organisms by sequencing conserved genes (16S rRNA)

- Detect specific mutations (cystic fibrosis, sickle cell, cancer)**Current State:**

- Phylogenetic typing (which outbreak strain?)- Game has complete playable loop from case → sample → observation → diagnosis

- Antibiotic resistance mutations- All 16 organisms implemented with unique characteristics

- Forensic identification- Evidence filtering narrows candidates as observations are recorded

- Info panels provide educational context throughout

**Technique Components:**

- **Chromatogram Reading**: Colored peaks (A=green, C=blue, G=black, T=red)**Next Priorities:**

  - Read sequence from peak patterns- Epic 9: Add contamination risk/reward mechanic

  - Ambiguous bases (overlapping peaks)- Epic 10: Implement equipment as an explicit game object

  - Quality scores (peak height/clarity)- Epic 11: Add clinical context to cases (normal flora vs pathogenic)

  

- **BLAST Search**: Compare sequence to database**Flexible approach:** Epics can be reordered, combined, or skipped based on learning and priorities. Each should deliver independently testable value.

  - Enter sequence obtained from chromatogram
  - Find closest matches (% identity)
  - Identify organism or gene

**New Observation Types:**
- DNA sequence (ATCG string)
- Sequence quality (clean vs noisy)
- BLAST match percentage (98% = *E. coli*, 100% = exact match)
- Top organism matches from database

**Gameplay:**
1. Sequence amplified DNA (from PCR)
2. View chromatogram with colored peaks
3. Read sequence (call bases from peaks)
4. Handle ambiguous positions (N for unclear)
5. Input sequence into BLAST
6. Review top matches with % identity
7. Identify organism or gene

**Cases This Unlocks:**
- "Unknown organism in environmental sample" (16S sequencing → ID)
- "Is this *E. coli* O157:H7?" (sequence serotype genes)
- "Cancer mutation screening" (BRCA1/2, EGFR, TP53)
- "Confirm antibiotic resistance mechanism" (sequence resistance gene)
- "Outbreak strain typing" (sequence hypervariable regions)

**Challenge Elements:**
- Ambiguous bases (overlapping peaks - which base is it?)
- Poor quality regions (sequence degrades toward end)
- Interpreting % identity (97% match - same species or different?)
- Choosing which gene to sequence (16S for bacteria, ITS for fungi, etc.)

**Implementation Notes:**
- New view component: `ChromatogramView.svelte`
- Peak visualization (4-color traces)
- Sequence reading interface
- BLAST search UI (could use real NCBI API or simulated)
- Database of organism sequences for matching

---

## Era 6: High-Throughput Genomics (2010s-2020s)

### Epic 12: Next-Generation Sequencing (2005+) & Metagenomics
**Historical Context:** Sanger sequencing reads one gene at a time. NGS (Illumina, 2006+) sequences entire genomes in a day. Metagenomics sequences *everything* in a sample - no culture needed, no prior knowledge required.

**New Question Answered:** "What is the complete genome? What's ALL the DNA in this sample (even unknown organisms)?"

**Why This Was Revolutionary:**
- Whole genome sequencing for personalized medicine
- Discover novel pathogens (SARS-CoV-2 identified in weeks)
- Microbiome analysis (all bacteria in gut, skin, etc.)
- Real-time outbreak surveillance
- Resistance gene profiling across entire genome

**Technique Components:**
- **NGS Sequencer**: Massively parallel sequencing
  - Millions of reads simultaneously
  - Output: coverage plots, variant calls
  
- **Metagenomic Analysis**: Identify all organisms in sample
  - Taxonomic classification (pie chart of species)
  - Detect unexpected pathogens
  - Functional profiling (which genes present?)

**New Observation Types:**
- Genome coverage (depth across positions)
- Variant calls (SNPs, indels detected)
- Taxonomic composition (% of each organism)
- Resistance genes detected (full resistome)
- Virulence factors present

**Gameplay:**
1. Prepare sample for NGS (extract all DNA)
2. Run sequencer (progress bar, millions of reads)
3. View coverage plot (genome map with read depth)
4. Identify variants (SNPs highlighted)
5. Taxonomic breakdown (pie chart or bar graph)
6. Detect resistance/virulence genes
7. Interpret complex results

**Cases This Unlocks:**
- "Unknown outbreak pathogen" (metagenomic discovery)
- "Cancer genome sequencing" (all mutations at once)
- "Microbiome dysbiosis" (IBD patient gut composition)
- "Pandemic surveillance" (SARS-CoV-2 variant tracking)
- "Multi-drug resistant organism" (find all resistance genes)
- "Rare disease diagnosis" (whole exome sequencing)

**Challenge Elements:**
- Interpreting complex coverage plots
- Distinguishing real variants from sequencing errors
- Taxonomic ambiguity (reads match multiple species)
- Too much data (which findings are relevant?)

**Implementation Notes:**
- New view component: `NGSView.svelte`
- Coverage plot visualization
- Pie chart for taxonomic composition
- Variant table with positions and impacts
- Gene annotation display

---

## Future Eras (Beyond Initial Scope)

### Epic 13+: Additional Techniques (Potential)
- **Flow Cytometry**: Cell population analysis, scatter plots, gating
- **MALDI-TOF Mass Spec**: Rapid bacterial ID via protein fingerprint
- **Western Blot**: Protein detection, HIV confirmation
- **Fluorescence Microscopy**: Immunofluorescence, FISH
- **Real-time PCR (qPCR)**: Quantitative amplification curves
- **Long-read Sequencing**: Nanopore, structural variants
- **Spatial Transcriptomics**: Gene expression in tissue context

### Pre-1880s Techniques (Historical Extension)
- **Uroscopy (Medieval-1800s)**: Urine color, clarity, smell examination
- **Wound Assessment (Ancient)**: Visual inspection, pus characteristics
- **Early Microscopy (1670s)**: Van Leeuwenhoek's simple microscope
- **Germ Theory Experiments (1850s-1870s)**: Pasteur's swan-neck flask
- **Koch's Postulates (1880s)**: Prove causation experimentally

---

## Implementation Strategy

**Immediate Next Steps:**
1. **Epic 7: Bacterial Culture** - Natural next step, 1920s-1940s era
2. **Epic 8: Serology** - Completes pre-molecular diagnostics
3. **Epic 9: ELISA** - Bridges to modern methods
4. **Epic 10: PCR** - Enters molecular era
5. **Epic 11-12**: Continue chronologically through genomics

**Design Principles:**
- Each epic is independently playable
- Build new view components for each technique
- Extend evidence system to handle new data types
- Cases should showcase technique strengths/limitations
- Educational focus: why was this invented?

**Technical Approach:**
- Create instrument view components (like `MicroscopeView.svelte`)
- Evidence store accommodates different evidence types
- Case data specifies which techniques are relevant
- Organism/condition database expands with era-specific data

**Flexible Progression:**
- Players can unlock techniques in historical order
- Or explore techniques freely (sandbox mode)
- Some cases locked until appropriate technique available
- Technique limitations clearly communicated

---

## Beyond Playground Scope

**Deferred Systems:**
- Economic/resource management (money, reagents, time pressure)
- Lab environment progression (kitchen → BSL-3)
- Equipment degradation and maintenance
- Real-time day cycles
- Multi-sample complex cases
- Clinical context reasoning (normal flora vs pathogenic)
- Contamination risk/reward mechanics

These add strategic depth but aren't essential for the core "history of diagnostic techniques" experience.
