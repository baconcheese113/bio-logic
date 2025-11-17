/**
 * Sample cases in the new GameCase format
 * These demonstrate the new multi-question, multi-case system
 */

import type { GameCase } from './case-types';

// Processing jobs (quick single-test tutorial cases)
export const PROCESSING_JOB_CASES: GameCase[] = [
  {
    id: 'proc_gram_stain_001',
    type: 'processing',
    title: 'Gram Stain Analysis',
    clientName: 'City Hospital Lab',
    description: 'Quick gram stain identification needed for throat culture',
    patientInfo: 'Throat swab from patient with sore throat. Perform gram stain and identify cell characteristics.',
    difficultyTier: 'tutorial',
    requiredEra: '1800s',
    correctSampleType: 'throat-swab',
    suggestedTests: ['microscope'],
    questions: [
      {
        id: 'q1',
        type: 'organism-id',
        prompt: 'Identify the organism based on gram stain',
        correctAnswer: 'strep_pyogenes',
        points: 100,
      }
    ],
    payment: 50,
    reputationGain: 5,
    estimatedTime: 5,
  },
  {
    id: 'proc_culture_001',
    type: 'processing',
    title: 'Blood Culture Processing',
    clientName: 'Emergency Department',
    description: 'Culture blood sample and identify growth characteristics',
    patientInfo: 'Blood culture from febrile patient. Streak on blood agar and identify colony characteristics.',
    difficultyTier: 'tutorial',
    requiredEra: '1800s',
    correctSampleType: 'blood',
    suggestedTests: ['culture'],
    questions: [
      {
        id: 'q1',
        type: 'organism-id',
        prompt: 'Identify organism based on culture characteristics',
        correctAnswer: 'staph_aureus',
        points: 100,
      }
    ],
    payment: 75,
    reputationGain: 5,
    estimatedTime: 24 * 60, // 24 hours for incubation
  },
];

// Diagnostic cases (full investigations)
export const DIAGNOSTIC_CASES: GameCase[] = [
  {
    id: 'diag_respiratory_001',
    type: 'diagnostic',
    title: 'Respiratory Infection Investigation',
    clientName: 'County Medical Center',
    description: 'Patient with severe respiratory symptoms. Full workup needed.',
    patientInfo: 'Male, 45 years. Presenting with high fever (39.5°C), productive cough with purulent sputum, chest pain, and difficulty breathing. History of smoking (20 pack-years). No recent travel.',
    clinicalNotes: 'Chest X-ray shows consolidation in right lower lobe. Patient is hypoxic (SpO2 88% on room air).',
    difficultyTier: 'medium',
    requiredEra: '1900s-early',
    correctSampleType: 'sputum',
    suggestedTests: ['microscope', 'culture', 'biochemical'],
    questions: [
      {
        id: 'q1_organism',
        type: 'organism-id',
        prompt: 'Based on your laboratory findings, identify the causative organism',
        correctAnswer: 'strep_pneumoniae',
        points: 150,
        hint: 'Consider the gram stain results, colony morphology, and hemolysis pattern',
      },
      {
        id: 'q2_treatment',
        type: 'antibiotic-choice',
        prompt: 'Select the most appropriate first-line antibiotic based on sensitivity testing',
        correctAnswer: 'penicillin',
        options: ['penicillin', 'tetracycline', 'erythromycin', 'chloramphenicol'],
        points: 100,
      },
      {
        id: 'q3_prognosis',
        type: 'multiple-choice',
        prompt: 'What is the expected recovery time with appropriate treatment?',
        correctAnswer: '7-14 days',
        options: ['2-3 days', '7-14 days', '3-4 weeks', '2-3 months'],
        points: 50,
      },
    ],
    payment: 500,
    reputationGain: 20,
  },
  {
    id: 'diag_tb_001',
    type: 'diagnostic',
    title: 'Chronic Cough Investigation',
    clientName: 'Public Health Department',
    description: 'Patient with persistent cough. TB workup requested.',
    patientInfo: 'Female, 32 years. Presenting with persistent productive cough for 3 months, night sweats, weight loss (10 kg over 3 months), and low-grade fever. Recent immigrant from endemic area.',
    clinicalNotes: 'Chest X-ray shows upper lobe infiltrates with cavitation. PPD skin test strongly positive.',
    difficultyTier: 'hard',
    requiredEra: '1900s-mid',
    correctSampleType: 'sputum',
    suggestedTests: ['microscope'], // Acid-fast stain
    questions: [
      {
        id: 'q1_organism',
        type: 'organism-id',
        prompt: 'Identify the causative organism',
        correctAnswer: 'mycobacterium_tuberculosis',
        points: 200,
        hint: 'Special staining technique required for this organism',
      },
      {
        id: 'q2_notification',
        type: 'multiple-choice',
        prompt: 'What is the next required action?',
        correctAnswer: 'Notify public health authorities immediately',
        options: [
          'Prescribe standard antibiotics',
          'Notify public health authorities immediately',
          'Schedule follow-up in 2 weeks',
          'Send patient home with instructions',
        ],
        points: 100,
      },
    ],
    payment: 800,
    reputationGain: 35,
  },
];

// All new-format cases
export const NEW_FORMAT_CASES: GameCase[] = [
  ...PROCESSING_JOB_CASES,
  ...DIAGNOSTIC_CASES,
];
