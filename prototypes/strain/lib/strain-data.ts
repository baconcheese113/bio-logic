export const WAVE_SECONDS = 45;
export const PROPAGATION_SECONDS = 5;
export const INSTRUMENT_RUN_SECONDS = 8;
export const TUBE_RESPAWN_SECONDS = 20;
export const PLASMID_SLOT_COUNT = 6;
export const WAVE_THREE_SURVIVAL_SECONDS = 90;

export const SECTOR_IDS = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
] as const;

export type SectorId = (typeof SECTOR_IDS)[number];

export const THREATS = {
  neutrophil: {
    id: 'neutrophil',
    label: 'Neutrophils',
    shortLabel: 'Neutrophil',
    icon: 'N',
    color: '#7d4fb3',
    cytokine: 'IL-8',
    cytokineMeaning: 'Neutrophil recruitment',
  },
  macrophage: {
    id: 'macrophage',
    label: 'Macrophages',
    shortLabel: 'Macrophage',
    icon: 'M',
    color: '#bd6a4f',
    cytokine: 'TGF-beta',
    cytokineMeaning: 'Macrophage polarization',
  },
  antibody: {
    id: 'antibody',
    label: 'Antibodies',
    shortLabel: 'Antibody',
    icon: 'A',
    color: '#3a6ac2',
    cytokine: 'IL-4',
    cytokineMeaning: 'Antibody class switching',
  },
} as const;

export type ThreatId = keyof typeof THREATS;

export const GENES = {
  biofilm: {
    id: 'biofilm',
    label: 'Biofilm',
    slotCost: 2,
    color: '#3a8c4d',
    counters: 'neutrophil',
    effect: 'Builds a matrix barrier that slows neutrophils.',
  },
  capsule: {
    id: 'capsule',
    label: 'Capsule',
    slotCost: 2,
    color: '#6b4a8c',
    counters: 'macrophage',
    effect: 'Adds a polysaccharide halo that resists engulfment.',
  },
  surfaceSwitch: {
    id: 'surfaceSwitch',
    label: 'SurfaceSwitch',
    slotCost: 2,
    color: '#3a6ac2',
    counters: 'antibody',
    effect: 'Changes surface proteins so antibodies stop binding.',
  },
  fastGrow: {
    id: 'fastGrow',
    label: 'FastGrow',
    slotCost: 1,
    color: '#d4a72c',
    counters: null,
    effect: 'Recovers lost colony density faster.',
  },
  complementInh: {
    id: 'complementInh',
    label: 'ComplementInh',
    slotCost: 1,
    color: '#c4471f',
    counters: null,
    effect: 'Reduces background complement damage.',
  },
  mucinPlus: {
    id: 'mucinPlus',
    label: 'Mucin++',
    slotCost: 2,
    color: '#3fb39b',
    counters: null,
    effect: 'Slightly slows all incoming threats.',
  },
} as const;

export type GeneId = keyof typeof GENES;

export const DEFENSE_TOOLS = {
  biofilm: {
    id: 'biofilm',
    label: 'Biofilm',
    gene: 'biofilm',
    counters: 'neutrophil',
    durationSeconds: 15,
    cooldownSeconds: 4,
    color: '#3a8c4d',
    hotkey: '1',
  },
  capsule: {
    id: 'capsule',
    label: 'Capsule',
    gene: 'capsule',
    counters: 'macrophage',
    durationSeconds: 12,
    cooldownSeconds: 5,
    color: '#3a6ac2',
    hotkey: '2',
  },
  surfaceSwitch: {
    id: 'surfaceSwitch',
    label: 'SurfaceSwitch',
    gene: 'surfaceSwitch',
    counters: 'antibody',
    durationSeconds: 10,
    cooldownSeconds: 5,
    color: '#d4a72c',
    hotkey: '3',
  },
} as const satisfies Record<string, {
  id: string;
  label: string;
  gene: GeneId;
  counters: ThreatId;
  durationSeconds: number;
  cooldownSeconds: number;
  color: string;
  hotkey: string;
}>;

export type DefenseToolId = keyof typeof DEFENSE_TOOLS;

export const INITIAL_PLASMID: GeneId[] = ['biofilm'];

export const THREAT_SEQUENCE: ThreatId[] = ['neutrophil', 'macrophage', 'antibody'];

export const PCR_ANTIGEN_READOUTS = {
  baseline: {
    label: 'Surface antigen alpha',
    bands: [240],
    note: 'Host antibodies still recognize the baseline surface antigen.',
  },
  switched: {
    label: 'Surface antigen beta',
    bands: [410],
    note: 'SurfaceSwitch is expressed; current antibodies bind poorly.',
  },
} as const;

export const LOSS_COPY = {
  neutrophil: {
    title: 'Neutrophils breached the colony',
    cause: 'Neutrophils reached the Founder Cell because Biofilm was not active in time.',
    suggestion: 'Add Biofilm before the next neutrophil wave.',
  },
  macrophage: {
    title: 'Macrophages engulfed the colony edge',
    cause: 'Macrophages ate through the perimeter because Capsule was not active in time.',
    suggestion: 'Add Capsule before macrophages reach the colony edge.',
  },
  antibody: {
    title: 'Antibody clearance accelerated',
    cause: 'Antibodies tagged exposed surface proteins because SurfaceSwitch was not active in time.',
    suggestion: 'Add SurfaceSwitch before antibody tagging accelerates clearance.',
  },
} as const satisfies Record<ThreatId, { title: string; cause: string; suggestion: string }>;

export const WIN_COPY = {
  title: 'Colony stabilized',
  cause: 'Biofilm, Capsule, and SurfaceSwitch held all active immune fronts long enough for the Founder Cell to recover.',
  suggestion: 'Prototype complete: try winning earlier by using ELISA to prep each counter before escalation.',
} as const;

export function getCounterGene(threat: ThreatId): GeneId {
  const entry = Object.values(GENES).find(gene => gene.counters === threat);
  if (!entry) throw new Error(`No counter gene configured for ${threat}`);
  return entry.id;
}
