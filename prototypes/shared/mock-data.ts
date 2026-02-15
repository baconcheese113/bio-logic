/**
 * Mock data for BioLogic Lab View prototypes
 * Golden Age (1880s) lab layout with waiting room
 */

import type {
  LabState,
  LabTile,
  Instrument,
  Sample,
  Player,
  Patient,
  PatientAppearance,
  PatientStatus,
  SampleType,
  Case,
  CaseFindings,
  Diagnosis,
  TreatmentOutcome,
} from './types';

import { PATIENCE_BY_STATUS, SKIN_TONES, HAIR_COLORS } from './types';

// === Lab Grid (11x7 tiles - expanded for waiting room) ===

const GRID_WIDTH = 11;
const GRID_HEIGHT = 7;

function createTile(type: LabTile['type'], instrumentId: string | null = null): LabTile {
  return {
    type,
    walkable: type !== 'wall' && type !== 'waiting-bench',
    instrumentId,
    patientId: null,
  };
}

function createGrid(): LabTile[][] {
  const grid: LabTile[][] = [];
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: LabTile[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      // Outer walls
      if (y === 0 || y === GRID_HEIGHT - 1 || x === 0 || x === GRID_WIDTH - 1) {
        row.push(createTile('wall'));
      }
      // Interior divider wall between waiting room and lab (x=3)
      else if (x === 3 && y !== 3) {
        row.push(createTile('wall'));
      }
      // Door from waiting room to lab
      else if (x === 3 && y === 3) {
        row.push(createTile('door'));
      }
      // Waiting benches (left side)
      else if (x === 1 && (y === 2 || y === 4)) {
        row.push(createTile('waiting-bench'));
      }
      else {
        row.push(createTile('floor'));
      }
    }
    grid.push(row);
  }
  
  // Add gas lamps on walls
  grid[1][0] = createTile('gas-lamp');
  grid[5][0] = createTile('gas-lamp');
  grid[1][GRID_WIDTH - 1] = createTile('gas-lamp');
  
  // Add windows on top wall (lab area)
  grid[0][5] = createTile('window');
  grid[0][8] = createTile('window');
  
  // Add drain in lab floor
  grid[5][5] = createTile('drain');
  
  // Entry door (bottom left of waiting room)
  grid[GRID_HEIGHT - 1][1] = createTile('door');
  
  return grid;
}

// === Patient Generation ===

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAppearance(): PatientAppearance {
  const faceShapes = ['round', 'oval', 'square'] as const;
  const eyeStyles = ['normal', 'tired', 'worried'] as const;
  const hairStyles = ['bald', 'short', 'long', 'curly'] as const;
  
  return {
    faceShape: randomChoice(faceShapes),
    skinTone: randomChoice(SKIN_TONES),
    eyeStyle: randomChoice(eyeStyles),
    hairStyle: randomChoice(hairStyles),
    hairColor: randomChoice(HAIR_COLORS),
  };
}

const PATIENT_NAMES = [
  'Thomas Miller', 'Mary Johnson', 'William Brown', 'Elizabeth Davis',
  'James Wilson', 'Sarah Moore', 'Charles Taylor', 'Margaret Anderson',
  'George Thompson', 'Catherine White', 'John Harris', 'Ann Martin',
];

interface CaseTemplate {
  title: string;
  synopsis: string;
  availableSamples: SampleType[];
  correctOrganism: string;
  status: PatientStatus;
  findings: CaseFindings;
  correctDiagnosis: Diagnosis;
  treatmentOutcome: TreatmentOutcome;
}

const CASE_TEMPLATES: CaseTemplate[] = [
  {
    title: 'Wound Infection',
    synopsis: 'Deep laceration, now red and swollen with purulent discharge. Fever present.',
    availableSamples: ['wound-swab', 'blood'],
    correctOrganism: 'staphylococcus-aureus',
    status: 'guarded',
    findings: {
      microscope: { gram: 'positive', shape: 'cocci', arrangement: 'clusters' },
      culture: { growth: true, hemolysis: 'beta', colonyColor: 'golden' },
    },
    correctDiagnosis: {
      organism: 'staphylococcus-aureus',
      category: 'gram-positive',
      treatment: 'carbolic-wash',
    },
    treatmentOutcome: {
      correct: { result: 'recovered', message: 'Wound healing well. Patient discharged.', fundsEarned: 75 },
      partial: { result: 'improved', message: 'Infection reduced but not cleared.', fundsEarned: 25 },
      wrong: { result: 'worsened', message: 'Infection spread. Fever worsening.', fundsEarned: 0 },
    },
  },
  {
    title: 'Respiratory Illness',
    synopsis: 'Persistent cough for 2 weeks, night sweats, weight loss. Blood in sputum.',
    availableSamples: ['sputum', 'blood'],
    correctOrganism: 'mycobacterium-tuberculosis',
    status: 'declining',
    findings: {
      microscope: { gram: 'positive', shape: 'bacilli', arrangement: 'singles', acidFast: true },
      culture: { growth: true, hemolysis: 'gamma', colonyColor: 'cream' },
    },
    correctDiagnosis: {
      organism: 'mycobacterium-tuberculosis',
      category: 'acid-fast',
      treatment: 'isolate-patient',
    },
    treatmentOutcome: {
      correct: { result: 'recovered', message: 'Patient isolated. Treatment begun. Slow recovery.', fundsEarned: 100 },
      partial: { result: 'improved', message: 'Coughing reduced but disease persists.', fundsEarned: 40 },
      wrong: { result: 'worsened', message: 'Disease spreading. Other patients at risk.', fundsEarned: 0 },
    },
  },
  {
    title: 'Throat Complaint',
    synopsis: 'Severe sore throat, difficulty swallowing, gray membrane visible. High fever.',
    availableSamples: ['throat-swab', 'blood'],
    correctOrganism: 'corynebacterium-diphtheriae',
    status: 'critical',
    findings: {
      microscope: { gram: 'positive', shape: 'bacilli', arrangement: 'singles' },
      culture: { growth: true, hemolysis: 'gamma', colonyColor: 'gray' },
    },
    correctDiagnosis: {
      organism: 'corynebacterium-diphtheriae',
      category: 'gram-positive',
      treatment: 'isolate-patient',
    },
    treatmentOutcome: {
      correct: { result: 'recovered', message: 'Patient isolated. Antitoxin administered. Recovery underway.', fundsEarned: 125 },
      partial: { result: 'improved', message: 'Membrane receding slowly.', fundsEarned: 50 },
      wrong: { result: 'worsened', message: 'Airway compromise. Emergency tracheotomy needed.', fundsEarned: 0 },
    },
  },
  {
    title: 'Urinary Difficulty',
    synopsis: 'Painful urination, cloudy urine with foul odor. Lower abdominal pain.',
    availableSamples: ['urine', 'blood'],
    correctOrganism: 'escherichia-coli',
    status: 'stable',
    findings: {
      microscope: { gram: 'negative', shape: 'bacilli', arrangement: 'singles' },
      culture: { growth: true, hemolysis: 'gamma', colonyColor: 'cream', lactoseFermenter: true },
    },
    correctDiagnosis: {
      organism: 'escherichia-coli',
      category: 'gram-negative',
      treatment: 'supportive-care',
    },
    treatmentOutcome: {
      correct: { result: 'recovered', message: 'Fluids and rest. Symptoms cleared.', fundsEarned: 50 },
      partial: { result: 'improved', message: 'Pain reduced but not gone.', fundsEarned: 15 },
      wrong: { result: 'worsened', message: 'Infection ascending. Fever developing.', fundsEarned: 0 },
    },
  },
];

let patientCounter = 0;

export function generatePatient(benchPosition: { x: number; y: number }, currentTick: number): Patient {
  const template = randomChoice(CASE_TEMPLATES);
  const name = randomChoice(PATIENT_NAMES);
  patientCounter++;
  
  return {
    id: `patient-${patientCounter}`,
    caseId: `case-${patientCounter}`,
    name,
    appearance: generateAppearance(),
    status: template.status,
    synopsis: template.synopsis,
    availableSamples: [...template.availableSamples],
    collectedSamples: [],
    patienceTicks: PATIENCE_BY_STATUS[template.status],
    maxPatienceTicks: PATIENCE_BY_STATUS[template.status],
    benchPosition,
    arrivedAtTick: currentTick,
    correctOrganism: template.correctOrganism,
    correctDiagnosis: template.correctDiagnosis,
    findings: template.findings,
  };
}

// === Instruments (Lab area starts at x=4, after waiting room) ===

function createInstruments(): Instrument[] {
  return [
    {
      id: 'microscope-1',
      type: 'microscope',
      name: 'Brass Microscope',
      position: { x: 5, y: 1 },
      status: 'idle',
      inputConfig: { type: 'stage', capacity: 1 },
      slots: [
        { index: 0, sampleId: null, offsetX: 0, offsetY: 0 },
      ],
      progress: 0,
    },
    {
      id: 'staining-1',
      type: 'staining-bench',
      name: 'Staining Bench',
      position: { x: 7, y: 1 },
      status: 'idle',
      inputConfig: { type: 'slots', capacity: 2 },
      slots: [
        { index: 0, sampleId: null, offsetX: -8, offsetY: 0 },
        { index: 1, sampleId: null, offsetX: 8, offsetY: 0 },
      ],
      progress: 0,
    },
    {
      id: 'culture-1',
      type: 'culture-incubator',
      name: 'Culture Incubator',
      position: { x: 9, y: 2 },
      status: 'idle',
      inputConfig: { type: 'dish', capacity: 4 },
      slots: [
        { index: 0, sampleId: null, offsetX: -8, offsetY: -8 },
        { index: 1, sampleId: null, offsetX: 8, offsetY: -8 },
        { index: 2, sampleId: null, offsetX: -8, offsetY: 8 },
        { index: 3, sampleId: null, offsetX: 8, offsetY: 8 },
      ],
      progress: 0,
    },
    {
      id: 'serology-1',
      type: 'serology-station',
      name: 'Serology Station',
      position: { x: 9, y: 4 },
      status: 'idle',
      inputConfig: { type: 'stage', capacity: 1 },
      slots: [
        { index: 0, sampleId: null, offsetX: 0, offsetY: 0 },
      ],
      progress: 0,
    },
    {
      id: 'centrifuge-1',
      type: 'centrifuge',
      name: 'Hand Centrifuge',
      position: { x: 5, y: 3 },
      status: 'idle',
      inputConfig: { type: 'slots', capacity: 4 },
      slots: [
        { index: 0, sampleId: null, offsetX: -10, offsetY: -10 },
        { index: 1, sampleId: null, offsetX: 10, offsetY: -10 },
        { index: 2, sampleId: null, offsetX: -10, offsetY: 10 },
        { index: 3, sampleId: null, offsetX: 10, offsetY: 10 },
      ],
      progress: 0,
    },
    {
      id: 'icebox-1',
      type: 'ice-box',
      name: 'Ice Box',
      position: { x: 4, y: 5 },
      status: 'idle',
      inputConfig: { type: 'slots', capacity: 6 },
      slots: [
        { index: 0, sampleId: null, offsetX: -16, offsetY: -8 },
        { index: 1, sampleId: null, offsetX: 0, offsetY: -8 },
        { index: 2, sampleId: null, offsetX: 16, offsetY: -8 },
        { index: 3, sampleId: null, offsetX: -16, offsetY: 8 },
        { index: 4, sampleId: null, offsetX: 0, offsetY: 8 },
        { index: 5, sampleId: null, offsetX: 16, offsetY: 8 },
      ],
      progress: 0,
    },
  ];
}

// === Player (starts in lab area) ===

function createPlayer(): Player {
  return {
    position: { x: 6, y: 3 },
    heldSample: null,
    facing: 'down',
    isMoving: false,
    targetPosition: null,
  };
}

// === Waiting Bench Positions ===

const WAITING_BENCHES = [
  { x: 1, y: 2 },
  { x: 1, y: 4 },
];

// === Main Factory ===

export function createInitialLabState(): LabState {
  const grid = createGrid();
  const instruments = createInstruments();
  
  // Mark instrument positions in grid
  for (const inst of instruments) {
    const { x, y } = inst.position;
    if (grid[y] && grid[y][x]) {
      grid[y][x].instrumentId = inst.id;
      grid[y][x].walkable = false;
    }
  }
  
  // Spawn initial patient on first bench
  const initialPatient = generatePatient(WAITING_BENCHES[0], 0);
  grid[WAITING_BENCHES[0].y][WAITING_BENCHES[0].x].patientId = initialPatient.id;
  
  return {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    grid,
    instruments,
    samples: [],
    player: createPlayer(),
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
      minZoom: 0.5,
      maxZoom: 2,
    },
    currentTick: 0,
    isPaused: false,
    speed: 1,
    patients: [initialPatient],
    activeCases: [],
    observations: [],
    stats: {
      livesaved: 0,
      livesLost: 0,
      casesCompleted: 0,
      funds: 100,
    },
  };
}

/** Get case template by organism ID */
export function getCaseTemplate(organismId: string): CaseTemplate | undefined {
  return CASE_TEMPLATES.find(t => t.correctOrganism === organismId);
}

export { WAITING_BENCHES };

// === Tile Size Constants ===

export const TILE_SIZE = 64;
export const HALF_TILE = TILE_SIZE / 2;
