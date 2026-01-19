/**
 * Instrument Workflows - Multi-step process definitions
 * 
 * Each instrument has a defined sequence of steps.
 * The UI handles visualization; this just defines the structure.
 */

export interface WorkflowStep {
  id: string;
  name: string;
  duration: number;      // Ticks (0 = instant/manual)
  description: string;
  requiresInput?: boolean;  // Player must do something
}

export interface Workflow {
  instrumentId: string;
  steps: WorkflowStep[];
}

// ============================================================================
// Workflow Definitions
// ============================================================================

export const WORKFLOWS: Record<string, Workflow> = {
  microscope: {
    instrumentId: 'microscope',
    steps: [
      { id: 'load', name: 'Load Sample', duration: 0, description: 'Place sample on slide', requiresInput: true },
      { id: 'stain', name: 'Apply Stain', duration: 30, description: 'Staining reagent applied' },
      { id: 'focus', name: 'Focus', duration: 0, description: 'Adjust focus to view specimen', requiresInput: true },
      { id: 'observe', name: 'Observe', duration: 0, description: 'Record observations', requiresInput: true },
    ],
  },

  culture: {
    instrumentId: 'culture',
    steps: [
      { id: 'load', name: 'Load Sample', duration: 0, description: 'Collect sample for culture', requiresInput: true },
      { id: 'media', name: 'Select Media', duration: 0, description: 'Choose growth medium', requiresInput: true },
      { id: 'streak', name: 'Streak Plate', duration: 10, description: 'Streak sample onto agar' },
      { id: 'incubate', name: 'Incubate', duration: 600, description: 'Overnight incubation at 37°C' },
      { id: 'observe', name: 'Observe Growth', duration: 0, description: 'Examine colonies', requiresInput: true },
    ],
  },

  'culture-antibiotic': {
    instrumentId: 'culture',
    steps: [
      { id: 'lawn', name: 'Prepare Lawn', duration: 20, description: 'Spread bacterial lawn' },
      { id: 'disks', name: 'Place Disks', duration: 0, description: 'Add antibiotic disks', requiresInput: true },
      { id: 'incubate', name: 'Incubate', duration: 600, description: 'Overnight incubation' },
      { id: 'measure', name: 'Measure Zones', duration: 0, description: 'Record zone diameters', requiresInput: true },
    ],
  },

  biochemical: {
    instrumentId: 'biochemical',
    steps: [
      { id: 'load', name: 'Inoculate', duration: 10, description: 'Add sample to test tubes' },
      { id: 'incubate', name: 'Incubate', duration: 300, description: 'Allow reactions to proceed' },
      { id: 'read', name: 'Read Results', duration: 0, description: 'Interpret color changes', requiresInput: true },
    ],
  },

  serology: {
    instrumentId: 'serology',
    steps: [
      { id: 'load', name: 'Add Serum', duration: 0, description: 'Add patient serum', requiresInput: true },
      { id: 'reagent', name: 'Add Reagent', duration: 5, description: 'Add typing antisera' },
      { id: 'mix', name: 'Mix', duration: 10, description: 'Rock slide gently' },
      { id: 'read', name: 'Read Agglutination', duration: 0, description: 'Check for clumping', requiresInput: true },
    ],
  },

  elisa: {
    instrumentId: 'elisa',
    steps: [
      { id: 'coat', name: 'Coat Wells', duration: 120, description: 'Antigen adheres to plastic' },
      { id: 'block', name: 'Block', duration: 60, description: 'Block non-specific binding' },
      { id: 'sample', name: 'Add Samples', duration: 0, description: 'Add patient samples', requiresInput: true },
      { id: 'wash1', name: 'Wash', duration: 30, description: 'Remove unbound antibodies' },
      { id: 'enzyme', name: 'Add Enzyme Conjugate', duration: 60, description: 'Secondary antibody binds' },
      { id: 'wash2', name: 'Wash', duration: 30, description: 'Remove unbound conjugate' },
      { id: 'substrate', name: 'Add Substrate', duration: 15, description: 'Color develops' },
      { id: 'read', name: 'Read Plate', duration: 0, description: 'Measure absorbance', requiresInput: true },
    ],
  },

  pcr: {
    instrumentId: 'pcr',
    steps: [
      { id: 'extract', name: 'Extract DNA', duration: 60, description: 'Lyse cells and purify DNA' },
      { id: 'primers', name: 'Select Primers', duration: 0, description: 'Choose target sequence', requiresInput: true },
      { id: 'setup', name: 'Setup Reaction', duration: 20, description: 'Add reagents to tubes' },
      { id: 'amplify', name: 'Amplification', duration: 180, description: '30 cycles of PCR' },
      { id: 'gel', name: 'Run Gel', duration: 90, description: 'Electrophoresis separation' },
      { id: 'read', name: 'Read Bands', duration: 0, description: 'Interpret band pattern', requiresInput: true },
    ],
  },

  sanger: {
    instrumentId: 'sanger',
    steps: [
      { id: 'template', name: 'Prepare Template', duration: 30, description: 'Purify PCR product' },
      { id: 'sequence', name: 'Sequencing Reaction', duration: 120, description: 'Chain termination reaction' },
      { id: 'capillary', name: 'Capillary Run', duration: 180, description: 'Electrophoresis separation' },
      { id: 'read', name: 'Read Chromatogram', duration: 0, description: 'Interpret sequence', requiresInput: true },
    ],
  },

  electrophoresis: {
    instrumentId: 'electrophoresis',
    steps: [
      { id: 'load', name: 'Load Samples', duration: 0, description: 'Load protein samples', requiresInput: true },
      { id: 'run', name: 'Run Gel', duration: 120, description: 'Separate by size/charge' },
      { id: 'stain', name: 'Stain', duration: 60, description: 'Visualize protein bands' },
      { id: 'read', name: 'Analyze Pattern', duration: 0, description: 'Compare to reference', requiresInput: true },
    ],
  },

  'flow-cytometry': {
    instrumentId: 'flow-cytometry',
    steps: [
      { id: 'prepare', name: 'Prepare Cells', duration: 30, description: 'Wash and resuspend cells' },
      { id: 'stain', name: 'Add Antibodies', duration: 0, description: 'Select fluorescent markers', requiresInput: true },
      { id: 'incubate', name: 'Incubate', duration: 30, description: 'Allow antibody binding' },
      { id: 'run', name: 'Acquire Data', duration: 90, description: 'Run cells through laser' },
      { id: 'analyze', name: 'Analyze', duration: 0, description: 'Gate populations', requiresInput: true },
    ],
  },
};

// ============================================================================
// Helpers
// ============================================================================

export function getWorkflow(instrumentId: string): Workflow | undefined {
  return WORKFLOWS[instrumentId];
}

export function getStep(instrumentId: string, stepId: string): WorkflowStep | undefined {
  const workflow = WORKFLOWS[instrumentId];
  if (!workflow) return undefined;
  return workflow.steps.find(s => s.id === stepId);
}

export function getNextStep(instrumentId: string, currentStepId: string): WorkflowStep | undefined {
  const workflow = WORKFLOWS[instrumentId];
  if (!workflow) return undefined;
  
  const currentIndex = workflow.steps.findIndex(s => s.id === currentStepId);
  if (currentIndex === -1 || currentIndex >= workflow.steps.length - 1) return undefined;
  
  return workflow.steps[currentIndex + 1];
}

export function isLastStep(instrumentId: string, stepId: string): boolean {
  const workflow = WORKFLOWS[instrumentId];
  if (!workflow) return true;
  
  const lastStep = workflow.steps[workflow.steps.length - 1];
  return lastStep?.id === stepId;
}
