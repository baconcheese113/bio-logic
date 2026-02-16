# BioLogic - Initial Design Document

## Game Concept

BioLogic is a strategic diagnostic-science game where players run biological assays to solve scientific mysteries. Players operate a diagnostic laboratory, starting in the 1920s with basic microscopy and progressing through the complete history of diagnostic technology up to modern multi-omics analysis. Each case presents biological samples that must be analyzed using period-appropriate equipment and techniques to identify pathogens, mutations, and biological conditions.

The game combines the deductive reasoning of Papers Please, the technical mastery of Car Mechanic Simulator, the reference-based investigation of Strange Horticulture, and the technological progression of Kerbal Space Program.

**Core Fantasy:** Train from novice to expert diagnostician by mastering real scientific techniques across 100+ years of biological discovery.

## Design Pillars

### 1. **Discovery Through Experimentation**
- No hand-holding or direct hints about which tests to run
- Players learn by doing, failing, and researching
- Equipment uses real historical names (e.g., "Zeiss Standard Microscope")
- Players can research equipment and techniques externally (Google, Wikipedia)
- Trial-and-error is encouraged but resource-constrained

### 2. **Historical Authenticity**
- Start in the 1920s with period-accurate equipment
- Progress chronologically through diagnostic history (1920s → 1950s → 1980s → 2000s → 2020s)
- Use real equipment brands and models from each era
- Realistic assay results and techniques
- Players gain perspective on how and why diagnostics evolved

### 3. **Realistic Scientific Workflow**
- Players follow the same workflow as real scientists/technicians
- Choose appropriate sample types based on clinical context
- Apply staining techniques to reveal information
- Interpret raw results (no automated analysis)
- Use reference materials to identify pathogens
- Make diagnosis based on evidence

### 4. **Educational Depth**
- Game should teach players to become experienced technicians
- Use real nomenclature and terminology (with tooltips for accessibility)
- Realistic assay inputs and outputs
- Players learn pattern recognition like real microbiologists
- Can translate learned skills to understanding real microscopy

### 5. **Strategic Resource Management**
- Limited time, money, and reagents
- Must choose which cases to accept
- Decide which tests to run (each has cost/time/accuracy trade-offs)
- Balance speed vs thoroughness
- Economic consequences for wrong diagnoses

### 6. **Realistic Data Integration**
- Use real biological sequences, proteins, and datasets
- API integration with public databases:
  - NCBI E-utilities and BLAST (sequence analysis)
  - Ensembl REST (genomic data)
  - UniProt and PDB (protein structures)
  - GEO and Expression Atlas (gene expression)
  - GISAID (viral sequences)
- Players can analyze actual outbreak strains, published sequences
- Results match real scientific literature
- Optional: support user-uploaded data (CSV, FASTA files)

## Core Gameplay Loop

### Player Fantasy
"I am experiencing the complete history of diagnostic science, learning what questions each era could answer and discovering why new techniques were invented when old methods failed."

### The Loop

```
1. CASE PRESENTATION
   ↓ Biological mystery presented (symptoms, context, sample)
   ↓ Some cases solvable with current techniques, some require future methods
   
2. TECHNIQUE SELECTION
   ↓ Choose which available technique to apply
   ↓ Each method reveals different evidence types
   ↓ Player must understand what each technique can/cannot answer
   
3. CONDUCT ASSAY
   ↓ Perform the technique with period-appropriate workflow
   ↓ Make technique-specific observations (morphology, bands, colors, sequences)
   ↓ Interpret imperfect/ambiguous results (challenge)
   ↓ Record evidence in deduction system
   
4. DEDUCTION & DIAGNOSIS
   ↓ Evidence filters possible organisms/conditions
   ↓ Compare findings to reference materials
   ↓ Submit diagnosis when confident
   
5. FEEDBACK & PROGRESSION
   ↓ Learn why answer was correct/wrong
   ↓ Understand technique limitations
   ↓ Unlock new techniques when cases reveal gaps
   ↓ Progress through historical eras
```

### Historical Case Evolution

**Example: "Patient with persistent cough and weight loss"**
- **1880s (Acid-Fast Stain)**: Identify TB by red bacilli → basic identification
- **1920s (Culture)**: Grow on Löwenstein-Jensen medium → confirmation after 6 weeks
- **1980s (PCR)**: Detect *M. tuberculosis* DNA → answer in hours instead of weeks
- **2000s (WGS)**: Sequence genome → identify exact strain + all drug resistance mutations

**Same question, progressively better/faster answers.**

**Example: "Unknown respiratory outbreak"**
- **1920s (Microscopy)**: If bacterial → can see it; if viral → invisible, unsolvable
- **1950s (Serology)**: Detect antibodies → know exposure occurred, but not which virus
- **1980s (PCR)**: Amplify known viral targets → works for known viruses only
- **2000s (Metagenomics)**: Sequence everything → discover novel pathogens

**Some cases impossible with early tech → drives player to unlock new methods.**

## Key Mechanics

### Case System & Sample Selection
Cases arrive with patient/sample information and story-driven context without explicit answers:
- **Human:** "Steel mill worker with infected hand wound"
- **Agricultural:** "Crop failure at local farm - tomato plants wilting"
- **Environmental:** "City water supply contamination concerns"
- **Asymptomatic:** "Pre-employment health screening"

Player must choose which sample type to request:
- Blood smear, sputum, throat swab, stool, tissue biopsy, cerebrospinal fluid
- Environmental samples (water, soil, crop tissue)
- Wrong sample choice = wasted effort
- Right sample choice = proceed with testing

### Sample Quality
Samples arrive with quality indicators affecting result clarity:
- **Fresh:** Clean, clear results
- **Fair:** Some degradation, slightly ambiguous
- **Poor:** Significant artifacts, difficult to interpret
- **Spoiled:** Contaminated or unreadable

Players learn to recognize artifacts vs real signals and may need to request fresh samples.

### Microscopy (1920s Era)

1920s microscopes magnified up to 1000× (oil immersion), but bacteria are essentially transparent without staining.

**Workflow:**
1. **View Unstained Sample:** Mostly blood cells/tissue visible, bacteria nearly invisible
2. **Choose Stain:** 
   - Gram Stain (Gram+ = purple, Gram- = pink)
   - Acid-Fast Stain (AFB+ = red, AFB- = blue)
   - Giemsa Stain (parasites, intracellular structures)
3. **Observe Results:** Shape (cocci/bacilli/spirals), arrangement (chains/clusters/pairs), stain reaction
4. **Identify Pathogen:** Consult laboratory manual, match observations to descriptions

### Reference Manual & Diagnosis
In-game reference book listing known pathogens with text-based descriptions:
```
Staphylococcus aureus
Gram: Positive
Shape: Cocci
Arrangement: Clusters (grape-like)
Notes: Common in skin/wound infections
```

Players match observations to descriptions. Manual is limited to organisms documented by that era. Diagnosis submission via searchable catalog (not free-text) with educational feedback.

### Clinical Context Reasoning
Same bacteria can be pathogenic or normal depending on context:
- Staphylococcus: normal on skin swab, serious in blood (septicemia)
- E. coli: normal in stool, pathogenic in urine (UTI)

Player must reason whether organism's presence is diagnostic.

## Assay Categories & Techniques

### Molecular Diagnostics
**PCR-based techniques:**
- Standard PCR (gel electrophoresis visualization)
- qPCR / Real-time PCR (amplification curves, Ct values)
- Digital PCR (absolute quantification)
- RT-PCR (RNA detection)
- Multiplex PCR (multiple targets simultaneously)

**Visualization:** Gel bands, amplification curves, threshold adjustment

**Sequencing:**
- Sanger sequencing (chromatogram reading, base calling)
- Next-generation sequencing (coverage plots, variant calling)
- 16S rRNA sequencing (microbiome composition)
- Whole genome sequencing (assembly, annotation)
- RNA-seq (gene expression profiling)
- Single-cell RNA-seq (cell population analysis)

**Visualization:** Chromatograms, coverage plots, heatmaps

### Immunological Assays
**ELISA (Enzyme-Linked Immunosorbent Assay):**
- 96-well plate with color intensity gradients
- Player sets threshold for positive/negative
- Compare sample wells to controls
- Calculate optical density values

**Western Blot:**
- Protein bands on membrane
- Choose antibodies
- Match observed vs expected molecular weights
- Identify specific proteins

**Flow Cytometry:**
- 2D scatter plots (FSC vs SSC, fluorescence channels)
- Draw gates to isolate cell populations
- Count and characterize cell types
- Identify subpopulations

**Visualization:** Colorimetric plates, band patterns, scatter plots with gating

### Microscopy Techniques
**Optical Microscopy:**
- Brightfield, phase-contrast, dark-field
- Magnification: 40× to 1000× (oil immersion)
- Staining: Gram, acid-fast, Giemsa, Wright, etc.
- Morphology identification

**Fluorescence Microscopy:**
- Immunofluorescence staining
- FISH (Fluorescent In Situ Hybridization)
- Multi-channel imaging

**Electron Microscopy:**
- Viral particle visualization
- Ultrastructure analysis

**Visualization:** Cell/bacterial morphology, arrangement patterns, fluorescent markers

### Computational & Bioinformatics
**Sequence Analysis:**
- BLAST searches (real NCBI API calls)
- Sequence alignment (pairwise, multiple)
- Phylogenetic tree construction
- Variant calling and annotation
- Resistance gene identification

**Gene Expression Analysis:**
- Differential expression (DESeq2-style analysis)
- Heatmap clustering
- Pathway enrichment
- Gene ontology analysis

**Microbiome Analysis:**
- Taxonomic classification
- Alpha diversity (species richness)
- Beta diversity (sample comparison)
- Functional profiling

**Visualization:** Alignment grids, phylogenetic trees, heatmaps, volcano plots, PCA plots

### Cell Culture & Growth
**Bacterial Culture:**
- Plate on selective/differential media
- Incubation with time delays
- Colony morphology observation
- Biochemical tests (catalase, oxidase, etc.)

**Viral Culture:**
- Cell line infection
- Cytopathic effect observation
- Plaque assays

**Visualization:** Petri dish colonies, growth curves

### Mass Spectrometry
**MALDI-TOF MS:**
- Rapid bacterial identification
- Protein fingerprint matching
- Mass spectrum peak analysis

**LC-MS/MS:**
- Metabolomics
- Proteomics profiling

**Visualization:** Mass spectra, peak matching

### Chromatography
**Paper/Thin-Layer Chromatography (early eras):**
- Separation visualization
- Rf value calculation

**HPLC/GC (later eras):**
- Peak identification
- Quantitative analysis

**Visualization:** Separation patterns, chromatograms

## Player Trade-offs & Strategic Decisions

### Test Selection Strategy
- **Shotgun approach:** Run expensive comprehensive test (RNA-seq, whole genome) - high cost, complete information
- **Targeted approach:** Run specific tests based on hypothesis - lower cost, risk missing answer
- **Sequential testing:** Start cheap (microscopy), escalate if needed - efficient but time-consuming

### Sample Choice
- **Fast/obvious sample** → might not contain pathogen
- **Comprehensive sample** → takes longer to collect, process

### Resource Allocation
- **Buy cheap equipment** → slower, less accurate, but affordable
- **Save for better equipment** → unlocks new capabilities
- **Stock many reagents** → handle more cases
- **Upgrade lab space** → better environment, lower contamination

### Time vs Accuracy
- **Rush tests** → faster results, higher contamination risk, less certainty
- **Careful execution** → slower, more reliable, cleaner data
- **Culture-based methods** → definitive answers but days/weeks wait time
- **Molecular methods** → faster but may need confirmation

## Economic & Progression Systems

### Daily Cycle
- **Fixed costs:** Rent, utilities (scale with lab tier)
- **Variable costs:** Reagents, consumables per test
- **Income:** Case rewards (accuracy-based)
- **Penalties:** Wrong diagnoses incur fees

### Lab Environments
Each environment affects contamination rates and available space:
- **Kitchen lab:** ×3 contamination, very limited space
- **Basement/garage:** ×2 contamination, basic setup
- **School/community lab:** ×1.5 contamination, shared resources
- **BSL-1 lab:** ×1 baseline, dedicated space
- **BSL-2 lab:** ×0.75 contamination, pathogen-safe
- **BSL-3 lab:** ×0.5 contamination, high biocontainment

### Equipment Investment
- Entry-level used equipment (affordable, limited capability)
- Mid-tier instruments (balanced performance)
- Research-grade equipment (expensive, best results)
- Automation systems (high throughput, reduced manual work)

### Reagent Management
- Bulk purchases for cost efficiency
- Expiration dates (time pressure)
- Quality tiers (cheap vs reliable)
- Running out mid-session requires "Leave Early"

## Planned Mechanics

### Time Pressure
- Real-time work day (e.g., 2-minute timer)
- Tests consume in-game time
- Can skip ahead to result completion
- Clock pauses during interpretation (no rush on mini-games)
- "Leave Early" option if out of supplies

### Culture & Incubation
- Some organisms must be grown in culture to identify
- Real-time delays (overnight to weeks depending on organism)
- Player must:
  - Hypothesize which organism it might be
  - Choose appropriate culture medium
  - Set timer and move to other cases
  - Return later to check culture results
- TB culture = 6 weeks (major time investment)

### Equipment Degradation & Maintenance
- Microscope lenses get dirty over time
- Visual clarity decreases (blur increases)
- Must spend time/money cleaning and maintaining
- Creates periodic maintenance cycles
- Failure to maintain = worse results, possible equipment failure

### Contamination Risk
Player-controlled "carefulness" slider per test balances speed vs reliability:
- **Rushed:** ×0.5 time, +15% contamination
- **Careful:** ×1.5 time, +0% contamination

Base contamination rates vary by assay (PCR 8%, microscopy 2%, culture 20%), lab environment, and equipment quality. Contamination creates false positives, ambiguous signals, and mixed populations that players must learn to recognize.

### Sample Quality Degradation & Equipment Maintenance
Samples degrade during transport, affecting result clarity. Players learn to recognize artifacts vs real signals and may need fresh samples.

Equipment degrades over time (microscope lenses get dirty, visual blur increases). Periodic cleaning/maintenance required or results worsen and equipment may fail.

## Historical Progression Through Eras

### Era 1: The 1920s - Foundation of Bacteriology
**Available Equipment:**
- Optical microscopes (Zeiss Standard, Bausch & Lomb, Leitz)
- Staining kits (Gram, acid-fast, Giemsa, Wright)
- Hemocytometers, hand-crank centrifuges
- Bunsen burners, autoclaves (pressure cooker style)
- Glass petri dishes (reusable), culture media
- Microtomes for tissue sectioning

**Diagnostic Capabilities:**
- Bacterial morphology and Gram classification
- Acid-fast staining for tuberculosis
- Blood parasite identification (malaria)
- Basic bacterial culture

**Historical Context:**
- No antibiotics yet (penicillin discovered 1928, not widely used until 1940s)
- Diagnostic microbiology establishing as field
- Manual, time-intensive methods
- Natural lighting only

**Example Cases:**
- Bacterial infections (Streptococcus, Staphylococcus)
- Tuberculosis diagnosis
- Malaria identification
- Diphtheria confirmation

### Era 2: The 1950s - Serological Revolution
**New Equipment:**
- Phase-contrast microscopes
- Fluorescence microscopy
- Precipitin test apparatus
- Early electrophoresis (paper, then cellulose acetate)
- Complement fixation glassware
- Paper chromatography chambers
- Electric incubators and shakers

**Diagnostic Capabilities:**
- Antibody detection (serology)
- Blood typing (ABO, Rh)
- Protein electrophoresis
- Immunodiffusion assays
- Early viral diagnostics

**Historical Context:**
- Antibiotics widely available
- Virology emerging as field
- Electron microscopy for virus visualization
- Polio and other viral epidemics driving research

**Example Cases:**
- Hepatitis B surface antigen detection
- Blood transfusion compatibility
- Viral serology (antibody titers)
- Protein abnormalities

### Era 3: The 1980s - Molecular Revolution
**New Equipment:**
- PCR thermal cyclers (Perkin-Elmer, 1987+)
- Gel electrophoresis systems
- UV transilluminators
- ELISA plate readers
- Western blot apparatus
- Flow cytometers (Becton Dickinson FACScan)
- BACTEC automated culture systems

**Diagnostic Capabilities:**
- DNA amplification and detection
- HIV screening (ELISA + Western blot confirmation)
- DNA fingerprinting
- Pathogen-specific PCR
- Automated blood culture
- Immunophenotyping

**Historical Context:**
- AIDS epidemic drives diagnostic innovation
- PCR revolutionizes molecular diagnostics
- Forensic DNA testing emerges
- Monoclonal antibodies become available

**Example Cases:**
- HIV screening programs
- Forensic paternity testing
- Outbreak investigation (unknown respiratory virus)
- Antibiotic resistance detection

### Era 4: The 2000s - High-Throughput & Sequencing
**New Equipment:**
- Next-generation sequencers (454, Illumina MiSeq)
- qPCR systems (Applied Biosystems 7500)
- Digital PCR (Bio-Rad QX200)
- MALDI-TOF mass spectrometry
- Microarray platforms
- High-performance computing workstations
- Automated liquid handlers

**Diagnostic Capabilities:**
- Whole genome sequencing
- Real-time quantitative PCR
- Microbiome analysis (16S rRNA sequencing)
- Pathogen identification via mass spec
- Gene expression profiling
- SNP genotyping
- Bioinformatics analysis (BLAST, alignment tools)

**Historical Context:**
- Human Genome Project completed (2003)
- Sequencing costs plummeting
- Personalized medicine emerging
- Electronic health records integrating lab data

**Example Cases:**
- Antibiotic resistance gene profiling
- Microbiome composition (IBD patients)
- Cancer mutation detection
- Outbreak strain typing
- Pharmacogenomics testing

### Era 5: The 2020s - Multi-Omics Integration
**New Equipment:**
- Long-read sequencers (PacBio, Oxford Nanopore MinION)
- Single-cell RNA-seq platforms
- Spatial transcriptomics systems
- Metagenomic sequencers
- AI-assisted diagnostic software
- Cloud computing integration
- Real-time surveillance systems

**Diagnostic Capabilities:**
- Single-cell multi-omics
- Metagenomics (identify all organisms in sample)
- Variant surveillance (COVID, influenza)
- Precision oncology (actionable mutations)
- Long-read genome assembly
- Real-time outbreak tracking
- Integrative multi-omics analysis

**Historical Context:**
- COVID-19 pandemic accelerates molecular diagnostics
- Real-time genomic surveillance
- AI/ML in diagnostics
- Citizen science and data sharing (GISAID)

**Real Data Integration:**
- Cases pull from actual public datasets:
  - COVID variants from GISAID
  - Cancer mutations from TCGA
  - Outbreak strains from NCBI SRA
  - Published sequences from GenBank
- Results match real scientific literature
- Educational value: learn contemporary techniques

**Example Cases:**
- SARS-CoV-2 variant identification and spike mutations
- Cancer precision medicine (EGFR mutations → therapy selection)
- Antibiotic resistance surveillance
- Microbiome-disease associations
- Rare disease genomic diagnosis

## Inspirations & Design Philosophy

### Papers, Please
**What we're taking:** 
- Detective-style deduction through document/evidence comparison
- Time pressure creating tension
- Comparing results to reference materials
- Consequence for mistakes
- Pattern recognition mastery

**Applied to BioLogic:** 
- Comparing microscopy/assay results to laboratory manual
- Work day timer
- Economic penalties for wrong diagnoses
- Learning to spot patterns in data

### Car Mechanic Simulator
**What we're taking:**
- Freedom to run any test without hand-holding
- Understanding every component and tool
- Hands-on technical mastery
- Learning through experimentation
- No tutorials, just tools and problems

**Applied to BioLogic:**
- Choose any assay based on hypothesis
- Learn equipment capabilities through use
- Technical depth without tutorials
- Master diagnostic techniques through repetition

### Strange Horticulture
**What we're taking:**
- Physical reference book as core mechanic
- Pattern matching between observation and description
- Detective work using botanical guide
- Satisfying moment of finding the right entry

**Applied to BioLogic:**
- Laboratory manual as essential reference
- Matching visual observations (shape, color, arrangement) to text descriptions
- Searching and cross-referencing pathogen characteristics
- "Eureka!" when identification clicks

### Kerbal Space Program
**What we're taking:**
- Freedom to experiment and fail
- Starting from technological basics
- Learning through iteration
- Historical/technological progression
- No arbitrary restrictions, just physics/reality

**Applied to BioLogic:**
- Start with 1920s basic technology
- Unlock progressively complex tools
- Learn how diagnostics evolved historically
- Reality-based constraints (sample quality, contamination, time)
- Players discover optimal workflows themselves

### Additional Influences
- **Return of the Obra Dinn:** Deductive reasoning from incomplete information
- **Opus Magnum:** Tactile puzzle-solving with optimization
- **They Are Billions:** Progression and building systems
- **PC Building Simulator:** Technical learning through hands-on interaction

## Rendering & Visual Approach

### Scientific Illustration Style
- Inspired by 1920s microbiology textbooks
- Clean, hand-drawn aesthetic (not photorealistic)
- Clear visual language for educational clarity
- Period-appropriate art style
- Reference: historical scientific lithographs and engravings

### Procedural Generation for Microscopy
Bacteria rendered as simple 2D shapes to ensure scalability and educational clarity:

**Morphology Templates:**
- **Cocci:** Circles (~8-12 pixels at 1000×)
- **Bacilli:** Rounded rectangles (~6×20 pixels)
- **Diplococci:** Paired circles (coffee bean shape)
- **Spirochetes:** Wavy spiral lines
- **Yeast:** Larger ovals with budding cells

**Arrangement Patterns (Procedural):**
- **Chains:** Linear sequence (Streptococcus)
- **Clusters:** Grape-like bunches (Staphylococcus)
- **Pairs:** Two shapes together (Pneumococcus, Neisseria)
- **Single:** Scattered randomly (E. coli)
- **Tetrads:** Groups of 4 (Micrococcus)

**Staining as Color Application:**
- **Unstained:** Faint gray, 10-20% opacity, nearly invisible
- **Gram Stain:**
  - Gram+ → Purple (#663399)
  - Gram- → Pink (#FF69B4)
- **Acid-Fast Stain:**
  - AFB+ → Bright red (#E63946)
  - AFB- → Blue (#1D3557)
- **Giemsa Stain:**
  - Nuclei → Purple
  - Cytoplasm → Blue
  - Blood cells → Pale blue

**Background Elements:**
- Red blood cells (most blood smears)
- White blood cells (occasional)
- Tissue cells (for biopsies)
- Debris and artifacts (based on sample quality)

### Microscopy Simulation Details
- Zoom levels: 40×, 100×, 400×, 1000× (oil immersion)
- Focus slider (adds/removes blur effect)
- Depth of field simulation
- Period-accurate optical limitations

### Other Assay Visualizations
Simple, clear representations that can be rendered programmatically or with minimal assets:

- **Gel Electrophoresis:** Rectangular bands in lanes (SVG or Canvas)
- **ELISA Plates:** 8×12 grid with color gradients (HTML divs or Canvas)
- **Flow Cytometry:** Scatter plots with interactive gating (Canvas/Chart library)
- **Chromatograms:** 4-color peak traces (Canvas line drawing)
- **Heatmaps:** Gene × sample matrices with color scales (Canvas or D3.js)
- **Phylogenetic Trees:** Node-link diagrams (SVG)

All visualizations prioritize clarity and educational value over photorealism.

## Success Criteria & Design Goals

### Educational Value
- Players learn real diagnostic techniques used by professionals
- Understanding of how different stains and assays reveal information
- Pattern recognition skills transferable to real microscopy and data analysis
- Historical context for modern diagnostics
- Computational biology and bioinformatics literacy
- From novice to expert-level technician knowledge

### Gameplay Satisfaction
- **"Eureka!" moments** when diagnosis becomes clear from data
- **Mastery through pattern recognition** (learning to read gels, identify morphologies)
- **Strategic depth** in test selection and resource management
- **Progression satisfaction** through technological eras
- **Problem-solving** using scientific reasoning
- **No arbitrary difficulty** - challenge comes from realistic complexity

### Avoiding Common Pitfalls
- ❌ Don't make it feel like homework (keep it tactile and interactive)
- ❌ Don't punish players for things outside their control (no random unavoidable failures)
- ❌ Don't require domain knowledge to start (learnable through play)
- ❌ Don't make mistakes unrecoverable (avoid economic death spirals)
- ❌ Don't add unnecessary complexity (less code is better code)
- ❌ Don't obscure player intent with poor UX (barrier should be science, not interface confusion)

### Core Player Experience
**"I feel like a real scientist making real decisions with real consequences, learning through hands-on experimentation in an authentic historical and technical context."**

The game should teach players to think like diagnosticians:
- Formulate hypotheses based on clinical context
- Design test strategies to confirm or reject hypotheses
- Interpret ambiguous data critically
- Recognize when more information is needed
- Make evidence-based conclusions

## Real-World Data Integration

### Public Datasets & APIs

**NCBI (National Center for Biotechnology Information):**
- E-utilities API for sequence retrieval
- BLAST API for sequence alignment and identification
- GenBank for annotated sequences
- SRA (Sequence Read Archive) for raw sequencing data
- PubMed for literature references

**Ensembl:**
- REST API for genomic data
- Gene annotations
- Variant databases
- Comparative genomics

**Protein Databases:**
- UniProt (protein sequences and functions)
- PDB (Protein Data Bank - 3D structures)

**Gene Expression:**
- GEO (Gene Expression Omnibus)
- Expression Atlas
- Cancer genome databases (TCGA, COSMIC)

**Viral Surveillance:**
- GISAID (influenza, coronavirus sequences)
- NextStrain (real-time pathogen evolution)

**Other Resources:**
- OpenBiome (microbiome data)
- KEGG (pathway databases)
- GO (Gene Ontology)

### Use Cases
- **Late-game sequencing:** Player sequences unknown sample → BLAST against real NCBI database → identifies actual strain
- **COVID cases:** Pull real SARS-CoV-2 sequences from GISAID → player identifies variants and mutations
- **Cancer diagnostics:** Use TCGA mutation data → player identifies actionable mutations
- **Outbreak investigation:** Real outbreak strain sequences → phylogenetic analysis
- **Research mode:** Players can upload their own data (FASTA, CSV) for interpretation

### Educational Authenticity
- Results match published literature
- Players learn to use same tools as professional bioinformaticians
- Can verify findings by researching actual sequences/organisms
- Bridges gap between game and real-world science

## Case Design Philosophy

Every case tells a micro-story providing context clues without direct answers:
- **Human:** "38-year-old steel mill worker, cut hand on machinery last week, wound increasingly painful"
- **Agricultural:** "Tomato crop showing leaf spots and wilting, threatening harvest"
- **Environmental:** "City water supply, residents reporting gastrointestinal illness"
- **Veterinary:** "Prize dairy cow, decreased milk production, recurring fever"

**Clue examples:**
- "Recent travel to tropics" → suggests tropical diseases
- "Works with cattle" → suggests zoonotic exposure
- "Sudden onset after picnic" → food-borne pathogen

**Case diversity:**
- Asymptomatic/routine (pre-employment screening, food handler certification)
- Ambiguous presentations requiring differential diagnosis (persistent cough could be TB, pneumonia, or bronchitis)
- Cross-domain (medical + environmental, agricultural + human, research + clinical)
