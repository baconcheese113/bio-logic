// Types live with the data they describe
export interface Organism {
  id: string;
  scientificName: string;
  commonName: string;
  gramStain: 'positive' | 'negative' | 'variable';
  acidFast: boolean; // For Ziehl-Neelsen stain
  capsule: boolean; // For capsule stain
  sporeFormer: boolean; // For spore stain
  shape: 'cocci' | 'bacilli' | 'spirochete' | 'diplococci' | 'coccobacilli';
  arrangement: 'chains' | 'clusters' | 'pairs' | 'single' | 'palisades';
  notes: string;
}

export interface Case {
  id: string;
  title: string;
  organismId: string;
  story: string;
}

// Epic 0+1+3+4: Expanded organisms with multiple stain types
export const ORGANISMS: Organism[] = [
  {
    id: 'strep_pyogenes',
    scientificName: 'Streptococcus pyogenes',
    commonName: 'Group A Streptococcus',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'cocci',
    arrangement: 'chains',
    notes: 'Common in throat infections, scarlet fever, rheumatic fever',
  },
  {
    id: 'staph_aureus',
    scientificName: 'Staphylococcus aureus',
    commonName: 'Golden Staph',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'cocci',
    arrangement: 'clusters',
    notes: 'Skin infections, boils, food poisoning, pneumonia',
  },
  {
    id: 'e_coli',
    scientificName: 'Escherichia coli',
    commonName: 'E. coli',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Normal gut flora, some strains cause food poisoning',
  },
  {
    id: 'n_gonorrhoeae',
    scientificName: 'Neisseria gonorrhoeae',
    commonName: 'Gonococcus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'diplococci',
    arrangement: 'pairs',
    notes: 'Sexually transmitted infection, urethritis',
  },
  {
    id: 'm_tuberculosis',
    scientificName: 'Mycobacterium tuberculosis',
    commonName: 'TB bacillus',
    gramStain: 'variable',
    acidFast: true,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Tuberculosis, acid-fast stain required, extremely slow growing',
  },
  {
    id: 'c_tetani',
    scientificName: 'Clostridium tetani',
    commonName: 'Tetanus bacillus',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: true,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Lockjaw, drumstick appearance due to terminal spores',
  },
  {
    id: 'v_cholerae',
    scientificName: 'Vibrio cholerae',
    commonName: 'Cholera vibrio',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Comma-shaped, causes severe watery diarrhea (rice-water stools)',
  },
  {
    id: 's_typhi',
    scientificName: 'Salmonella typhi',
    commonName: 'Typhoid bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Typhoid fever, enteric fever, rose spots on abdomen',
  },
  {
    id: 'c_diphtheriae',
    scientificName: 'Corynebacterium diphtheriae',
    commonName: 'Diphtheria bacillus',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'palisades',
    notes: 'Club-shaped, Chinese letter arrangement, pseudomembrane in throat',
  },
  {
    id: 'k_pneumoniae',
    scientificName: 'Klebsiella pneumoniae',
    commonName: 'Friedländer bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Thick capsule, mucoid colonies, lobar pneumonia',
  },
  {
    id: 'p_aeruginosa',
    scientificName: 'Pseudomonas aeruginosa',
    commonName: 'Blue-green pus organism',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Produces blue-green pigment, burn infections, sweet grape odor',
  },
  {
    id: 'b_anthracis',
    scientificName: 'Bacillus anthracis',
    commonName: 'Anthrax bacillus',
    gramStain: 'positive',
    acidFast: false,
    capsule: true,
    sporeFormer: true,
    shape: 'bacilli',
    arrangement: 'chains',
    notes: 'Large square-ended rods in chains (boxcar appearance), central spores',
  },
  {
    id: 's_dysenteriae',
    scientificName: 'Shigella dysenteriae',
    commonName: 'Shiga bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Bloody diarrhea (dysentery), very low infectious dose',
  },
  {
    id: 'y_pestis',
    scientificName: 'Yersinia pestis',
    commonName: 'Plague bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'coccobacilli',
    arrangement: 'single',
    notes: 'Bipolar staining (safety pin appearance), bubonic plague',
  },
  {
    id: 'strep_pneumoniae',
    scientificName: 'Streptococcus pneumoniae',
    commonName: 'Pneumococcus',
    gramStain: 'positive',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    shape: 'diplococci',
    arrangement: 'pairs',
    notes: 'Lancet-shaped diplococci, polysaccharide capsule, lobar pneumonia',
  },
  {
    id: 'h_influenzae',
    scientificName: 'Haemophilus influenzae',
    commonName: 'Pfeiffer bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    shape: 'coccobacilli',
    arrangement: 'single',
    notes: 'Small pleomorphic, meningitis in children, requires blood factors',
  },
];

// Epic 3+4: Multiple cases for variety
export const CASES: Case[] = [
  {
    id: 'case_001',
    title: 'Factory Worker Fever',
    organismId: 'strep_pyogenes',
    story:
      'Steel mill worker, age 38. High fever (3 days), severe sore throat, difficulty swallowing. No recent travel.',
  },
  {
    id: 'case_002',
    title: 'Infected Wound',
    organismId: 'staph_aureus',
    story:
      'Dockworker, age 45. Deep cut on hand (5 days ago), now red, swollen, pus-filled. Local fever.',
  },
  {
    id: 'case_003',
    title: 'Severe Diarrhea',
    organismId: 'e_coli',
    story:
      'Restaurant cook, age 28. Watery diarrhea (2 days), abdominal cramps, vomiting. Several coworkers ill.',
  },
  {
    id: 'case_004',
    title: 'Urethral Discharge',
    organismId: 'n_gonorrhoeae',
    story:
      'Sailor, age 24. Painful urination, purulent discharge (3 days). Recent shore leave.',
  },
  {
    id: 'case_005',
    title: 'Chronic Cough',
    organismId: 'm_tuberculosis',
    story:
      'Textile worker, age 52. Persistent cough (3 months), night sweats, weight loss, blood in sputum.',
  },
  {
    id: 'case_006',
    title: 'Rusty Nail Injury',
    organismId: 'c_tetani',
    story:
      'Farmhand, age 35. Stepped on rusty nail (7 days ago). Now jaw stiffness, difficulty opening mouth, muscle spasms.',
  },
  {
    id: 'case_007',
    title: 'Rice-Water Stools',
    organismId: 'v_cholerae',
    story:
      'Immigrant laborer, age 29. Sudden onset severe watery diarrhea (1 day), vomiting, severe dehydration. Recently arrived by ship.',
  },
  {
    id: 'case_008',
    title: 'Sustained Fever',
    organismId: 's_typhi',
    story:
      'Boarding house resident, age 33. High fever (10 days), rose-colored spots on abdomen, confusion, constipation.',
  },
  {
    id: 'case_009',
    title: 'Throat Membrane',
    organismId: 'c_diphtheriae',
    story:
      'Schoolchild, age 8. Sore throat (4 days), thick gray membrane in throat, difficulty breathing, bull neck appearance.',
  },
  {
    id: 'case_010',
    title: 'Pneumonia',
    organismId: 'k_pneumoniae',
    story:
      'Alcoholic vagrant, age 58. Sudden fever, productive cough with thick mucoid sputum (currant jelly), shortness of breath.',
  },
  {
    id: 'case_011',
    title: 'Burn Infection',
    organismId: 'p_aeruginosa',
    story:
      'Factory fire victim, age 42. Severe burns (8 days ago), now green-blue discharge from wounds, sweet smell, high fever.',
  },
  {
    id: 'case_012',
    title: 'Woolsorter Disease',
    organismId: 'b_anthracis',
    story:
      'Wool mill worker, age 44. Black painless skin lesion on arm (5 days), surrounding swelling, fever, malaise.',
  },
  {
    id: 'case_013',
    title: 'Bloody Flux',
    organismId: 's_dysenteriae',
    story:
      'Tenement resident, age 26. Severe bloody diarrhea (3 days), abdominal cramps, fever. Children in building also ill.',
  },
  {
    id: 'case_014',
    title: 'Bubonic Affliction',
    organismId: 'y_pestis',
    story:
      'Wharf rat catcher, age 31. High fever (2 days), painful swollen lymph nodes in groin, black fingers, confusion.',
  },
  {
    id: 'case_015',
    title: 'Lobar Pneumonia',
    organismId: 'strep_pneumoniae',
    story:
      'Coal miner, age 49. Sudden fever with shaking chills, rust-colored sputum, chest pain when breathing.',
  },
  {
    id: 'case_016',
    title: 'Child Meningitis',
    organismId: 'h_influenzae',
    story:
      'Orphanage child, age 4. High fever (2 days), stiff neck, vomiting, lethargy, bulging fontanelle.',
  },
];
