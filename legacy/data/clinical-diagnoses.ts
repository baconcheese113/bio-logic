// Clinical diagnoses for protein electrophoresis cases
// Types live with the data they describe

import type { FlowCytometryProperties } from './organisms';

export interface ClinicalPresentation {
  age: string;
  symptoms: string[];
  keyFindings: string[];
}

export interface ClinicalDiagnosis {
  id: string;
  displayName: string;
  description: string;
  clinicalPresentation: ClinicalPresentation;
  proteinPattern: string; // Description of the expected electrophoresis pattern
  electrophoresis: {
    pattern: 'm-spike' | 'beta-gamma-bridge' | 'low-albumin' | 'polyclonal-gammopathy' | 'normal';
    densitometer: {
      albumin: number;
      alpha1: number;
      alpha2: number;
      beta: number;
      gamma: number;
    };
  };
  flowCytometry?: FlowCytometryProperties; // Optional for flow cytometry cases
}

export const CLINICAL_DIAGNOSES: ClinicalDiagnosis[] = [
  {
    id: 'multiple-myeloma',
    displayName: 'Multiple Myeloma',
    description: 'Malignant plasma cell disorder causing overproduction of a single antibody type',
    clinicalPresentation: {
      age: '65-year-old',
      symptoms: ['Severe bone pain (back, ribs)', 'Fatigue', 'Recurrent infections'],
      keyFindings: ['Anemia', 'Elevated total protein', 'Hypercalcemia', 'Punched-out bone lesions on X-ray']
    },
    proteinPattern: 'Sharp, narrow spike (M-spike) in gamma region - single dark band instead of normal broad gamma',
    electrophoresis: {
      pattern: 'm-spike',
      densitometer: {
        albumin: 45,
        alpha1: 3,
        alpha2: 8,
        beta: 10,
        gamma: 34,
      },
    },
  },
  {
    id: 'liver-cirrhosis',
    displayName: 'Liver Cirrhosis',
    description: 'Chronic liver disease with scarring and impaired function',
    clinicalPresentation: {
      age: '55-year-old',
      symptoms: ['Jaundice', 'Abdominal swelling (ascites)', 'Easy bruising'],
      keyFindings: ['History of alcohol use', 'Elevated bilirubin', 'Low albumin', 'Spider angiomas']
    },
    proteinPattern: 'Beta-gamma bridge - beta and gamma bands merge together without clear separation',
    electrophoresis: {
      pattern: 'beta-gamma-bridge',
      densitometer: {
        albumin: 38,
        alpha1: 2.5,
        alpha2: 7,
        beta: 18,
        gamma: 34.5,
      },
    },
  },
  {
    id: 'nephrotic-syndrome',
    displayName: 'Nephrotic Syndrome',
    description: 'Kidney disorder causing massive protein loss in urine',
    clinicalPresentation: {
      age: '8-year-old',
      symptoms: ['Severe edema (swelling)', 'Foamy urine', 'Weight gain from fluid'],
      keyFindings: ['Massive proteinuria (4+ on dipstick)', 'Low albumin', 'High cholesterol', 'Puffy face and ankles']
    },
    proteinPattern: 'Very faint, thin albumin band - appears washed out compared to normal reference',
    electrophoresis: {
      pattern: 'low-albumin',
      densitometer: {
        albumin: 32,
        alpha1: 4,
        alpha2: 18,
        beta: 12,
        gamma: 14,
      },
    },
  },
  {
    id: 'chronic-inflammation',
    displayName: 'Chronic Inflammation',
    description: 'Long-standing immune activation from chronic infection or autoimmune disease',
    clinicalPresentation: {
      age: '45-year-old',
      symptoms: ['Fatigue', 'Low-grade fever', 'Joint pain'],
      keyFindings: ['Elevated ESR/CRP', 'History of rheumatoid arthritis or chronic infection']
    },
    proteinPattern: 'Polyclonal gammopathy - broad, diffuse elevation of entire gamma region (not a sharp spike)',
    electrophoresis: {
      pattern: 'polyclonal-gammopathy',
      densitometer: {
        albumin: 48,
        alpha1: 4,
        alpha2: 10,
        beta: 11,
        gamma: 27,
      },
    },
  },
  {
    id: 'normal-serum',
    displayName: 'Normal Serum',
    description: 'Healthy patient with balanced protein distribution',
    clinicalPresentation: {
      age: '35-year-old',
      symptoms: ['Routine health screening', 'No complaints'],
      keyFindings: ['Normal CBC', 'Normal liver/kidney function', 'No abnormal findings']
    },
    proteinPattern: 'Five distinct balanced bands - dark albumin, faint α₁, light α₂, medium β, medium-broad γ',
    electrophoresis: {
      pattern: 'normal',
      densitometer: {
        albumin: 60,
        alpha1: 3.5,
        alpha2: 8,
        beta: 11,
        gamma: 17.5,
      },
    },
  }
];
