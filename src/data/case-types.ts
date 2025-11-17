/**
 * New case system for multi-case workflow
 * This replaces the old simple Case type with a richer structure
 * that supports multiple questions, difficulty tiers, and era gating
 */

import type { SampleType } from './organisms';

// Era system for historical progression
export type Era = '1800s' | '1900s-early' | '1900s-mid' | '1900s-late' | '2000s' | '2020s';

// Difficulty tiers
export type DifficultyTier = 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert';

// Case types
export type CaseType = 
  | 'diagnostic'      // Full investigation with multiple tests
  | 'processing';     // Quick single-test job (teaches instruments)

// Question types for diagnosis
export type QuestionType =
  | 'organism-id'           // Select organism from filtered list
  | 'antibiotic-choice'     // Choose best antibiotic
  | 'blood-type'            // ABO blood typing
  | 'immunity-status'       // Immune vs not immune
  | 'antibody-detection'    // Positive/negative antibodies
  | 'clinical-diagnosis'    // Clinical condition from electrophoresis
  | 'multiple-choice'       // Generic multiple choice
  | 'numeric-input';        // Enter a number (e.g., colony count)

// Individual question in a case
export interface CaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options?: string[];        // For multiple choice
  points: number;            // Points awarded for correct answer
  hint?: string;             // Optional hint
}

// Full case definition
export interface GameCase {
  id: string;
  type: CaseType;
  
  // Display info (generic to avoid spoilers)
  title: string;              // e.g., "Respiratory Infection Investigation"
  clientName: string;         // e.g., "City Hospital - Dr. Smith"
  description: string;        // Brief non-spoiler description
  
  // Story (shown after accepting)
  patientInfo: string;        // Detailed patient presentation
  clinicalNotes?: string;     // Additional notes
  
  // Difficulty & progression
  difficultyTier: DifficultyTier;
  requiredEra: Era;           // Earliest era this case appears
  
  // Sample requirements
  correctSampleType: SampleType;
  suggestedTests?: string[];  // Hints for which instruments to use
  
  // Diagnosis questions
  questions: CaseQuestion[];
  
  // Rewards
  payment: number;            // Money earned on completion
  reputationGain: number;     // Reputation points
  
  // Time & processing
  estimatedTime?: number;     // Minutes (for processing jobs)
  timeLimit?: number;         // Optional time limit in minutes
  
  // Compatibility with old system (for gradual migration)
  legacyAnswerFormat?: string;
  legacyCorrectAnswer?: string;
  pcrTarget?: {
    geneId: string;
    description: string;
  };
  bestAntibiotic?: string;
}

// Case status in active workflow
export type CaseStatus =
  | 'available'       // On job board
  | 'accepted'        // Player accepted, working on it
  | 'awaiting-results' // Waiting for incubation/processing
  | 'ready-for-diagnosis' // All tests done, ready to submit
  | 'completed'       // Submitted and graded
  | 'failed';         // Time limit exceeded or failed

// Active case instance (player's working copy)
export interface ActiveCase {
  case: GameCase;
  status: CaseStatus;
  acceptedAt: number;         // Timestamp
  completedAt?: number;
  
  // Evidence collected so far
  evidenceCollected: Record<string, unknown>;
  
  // Answers submitted
  answersSubmitted: Record<string, string>; // questionId -> answer
  
  // Results
  score?: number;
  feedback?: string;
  
  // Processing state
  processingJobs?: Array<{
    instrumentType: string;
    startedAt: number;
    completesAt: number;
    status: 'running' | 'complete';
  }>;
}
