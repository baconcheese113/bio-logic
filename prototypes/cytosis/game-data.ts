export const roleProfiles = [
  {
    id: 'pathology',
    name: 'Pathology',
    color: '#d95f59',
    objective: 'Push organ damage to 12 before remission stabilizes.',
    resourceName: 'Selection pressure',
  },
  {
    id: 'immune',
    name: 'Immune',
    color: '#4f9bd8',
    objective: 'Reveal and clear tumor cells while limiting autoimmune damage.',
    resourceName: 'Recognition',
  },
] as const;

export type RoleId = (typeof roleProfiles)[number]['id'];
export type ScenarioId = 'cancer' | 'viral';

export const phases = [
  { id: 'initiation', name: 'Initiation', threshold: 0 },
  { id: 'promotion', name: 'Promotion', threshold: 4 },
  { id: 'progression', name: 'Progression', threshold: 8 },
  { id: 'resolution', name: 'Resolution', threshold: 12 },
] as const;

export type PhaseId = (typeof phases)[number]['id'];

export const partLibrary = [
  {
    id: 'hypoxia-promoter',
    name: 'Hypoxia promoter',
    type: 'promoter',
    text: 'Turns on when oxygen is low.',
    score: 2,
  },
  {
    id: 'stress-promoter',
    name: 'Stress promoter',
    type: 'promoter',
    text: 'Turns on near inflammation or damaged tissue.',
    score: 2,
  },
  {
    id: 'tumor-marker-sensor',
    name: 'Tumor marker promoter',
    type: 'promoter',
    text: 'Turns on when a confirmed tumor surface marker is present.',
    score: 3,
  },
  {
    id: 'self-marker-sensor',
    name: 'Self-safety promoter',
    type: 'promoter',
    text: 'Turns on near healthy host markers so logic can avoid self.',
    score: 2,
  },
  {
    id: 'viral-sensor',
    name: 'Viral payload promoter',
    type: 'promoter',
    text: 'Turns on when viral sequence or payload is present.',
    score: 3,
  },
  {
    id: 'and-gate',
    name: 'AND gate',
    type: 'logic',
    text: 'Requires two upstream signals before the payload fires.',
    score: 3,
  },
  {
    id: 'or-gate',
    name: 'OR gate',
    type: 'logic',
    text: 'Lets either upstream signal activate the payload.',
    score: 2,
  },
  {
    id: 'not-gate',
    name: 'NOT gate',
    type: 'logic',
    text: 'Blocks expression when the paired signal is present.',
    score: 3,
  },
  {
    id: 'cd47-silencer',
    name: 'CD47 silencer',
    type: 'gene',
    text: 'Makes marked cells easier for macrophages to eat.',
    score: 3,
  },
  {
    id: 'marker-restorer',
    name: 'Marker restorer',
    type: 'gene',
    text: 'Forces evasive cells to show a targetable marker again.',
    score: 3,
  },
  {
    id: 'il2-signal',
    name: 'IL-2 signal',
    type: 'gene',
    text: 'Calls T cells toward the expressing cell.',
    score: 2,
  },
  {
    id: 'apoptosis-payload',
    name: 'Apoptosis payload',
    type: 'gene',
    text: 'Makes the target self-destruct when the trigger is true.',
    score: 4,
  },
  {
    id: 'decoy-shedder',
    name: 'Decoy shedder',
    type: 'gene',
    text: 'Sheds false markers that confuse nearby targeting.',
    score: 3,
  },
  {
    id: 'matrix-protease',
    name: 'Matrix protease',
    type: 'gene',
    text: 'Digests matrix so cells can invade through tissue.',
    score: 3,
  },
  {
    id: 'motility-program',
    name: 'Motility program',
    type: 'gene',
    text: 'Moves the expressing cell toward compatible routes.',
    score: 2,
  },
  {
    id: 'degradation-tag',
    name: 'Degradation tag',
    type: 'control',
    text: 'Shortens expression so the effect is sharp but brief.',
    score: 1,
  },
  {
    id: 'vector-stabilizer',
    name: 'Vector stabilizer',
    type: 'control',
    text: 'Keeps expression active for longer after deployment.',
    score: 2,
  },
  {
    id: 'generic-terminator',
    name: 'Terminator',
    type: 'terminator',
    text: 'Ends transcription cleanly.',
    score: 1,
  },
] as const;

export type PartId = (typeof partLibrary)[number]['id'];
export type PartType = (typeof partLibrary)[number]['type'];
export type PartInventory = Partial<Record<PartId, number>>;

export const instruments = [
  {
    id: 'microscope',
    name: 'Microscope',
    turns: 1,
    input: 'Tile smear',
    output: 'Morphology: normal, abnormal, or infected shape.',
  },
  {
    id: 'flow-cytometer',
    name: 'Flow cytometer',
    turns: 2,
    input: 'Cell suspension',
    output: 'Marker counts across nearby cells.',
  },
  {
    id: 'pcr',
    name: 'PCR',
    turns: 2,
    input: 'DNA sample',
    output: 'Genetic identity and plasmid sequence.',
  },
  {
    id: 'elisa',
    name: 'ELISA',
    turns: 2,
    input: 'Protein sample',
    output: 'Inflammation and cytokine signal.',
  },
] as const;

export type InstrumentId = (typeof instruments)[number]['id'];

export type CellKind = 'tumor' | 't-cell' | 'macrophage' | 'healthy' | 'infected' | 'virion';
export type TileZone = 'organ' | 'vessel' | 'lymph' | 'matrix';
export type EnvironmentState = 'hypoxic' | 'acidic' | 'immunosuppressed';
export type SurfaceMarker = 'tumor' | 'self' | 'viral' | 'none';
export type MorphologyState = 'normal' | 'abnormal' | 'infected';
export type PlasmidEffect =
  | 'beacon'
  | 'marker-restorer'
  | 'decoy-shedder'
  | 'matrix-protease'
  | 'kill-switch'
  | 'motility'
  | 'proliferation'
  | 'angiogenesis'
  | 'viral-replication'
  | 'baseline';
export type RecentEffect =
  | 'vessel-growth'
  | 'scan'
  | 'morphology'
  | 'marker-read'
  | 'genetic-confirm'
  | 'cytokine'
  | 'damage'
  | 'decoy'
  | 'matrix-break'
  | 'plasmid'
  | 'proliferation'
  | 'metastasis'
  | 'collateral'
  | 'inflammation'
  | 'infection'
  | 'lysis';

export interface TileState {
  id: string;
  x: number;
  y: number;
  zone: TileZone;
  oxygen: number;
  damage: number;
  visible: boolean;
  chemistryKnown: boolean;
  inflammation: number;
  matrixOpen: boolean;
  environment?: EnvironmentState;
  recentEffect?: RecentEffect;
}

export interface CellState {
  id: string;
  kind: CellKind;
  role: RoleId | 'neutral';
  x: number;
  y: number;
  hidden: boolean;
  morphology: MorphologyState;
  marker: SurfaceMarker;
  health: number;
  maxHealth: number;
  attack: number;
  movement: number;
  markerVisible: boolean;
  morphologyKnown: boolean;
  markersKnown: boolean;
  confirmed: boolean;
  plasmid?: string;
  plasmidEffect?: PlasmidEffect;
  expression?: number;
  viralLoad?: number;
}

export interface DebrisState {
  id: string;
  x: number;
  y: number;
  source: CellKind;
  parts: PartId[];
}

export interface ScoreEvent {
  id: number;
  kind: 'organ' | 'remission' | 'autoimmune';
  amount: number;
  tileId: string;
  cause: string;
  turn: number;
  role: RoleId | 'system';
}

export interface PendingPlay {
  id: number;
  instrumentId?: InstrumentId;
  plasmidId?: string;
  role: RoleId;
  name: string;
  targetTileId: string;
  remainingTurns: number;
  result: string;
}

export interface DesignedPlasmid {
  id: string;
  name: string;
  role: RoleId;
  parts: PartId[];
  behavior: string;
  effect: PlasmidEffect;
  valid: boolean;
  validated: boolean;
}

export interface GameState {
  scenario: ScenarioId;
  activeRole: RoleId;
  turn: number;
  actionsRemaining: number;
  organDamage: number;
  autoimmuneDamage: number;
  pathologyResource: number;
  immuneResource: number;
  vectorSupply: number;
  remissionScore: number;
  immuneMemory: SurfaceMarker[];
  decoyShield: boolean;
  selectedTileId: string;
  selectedInstrumentId: InstrumentId;
  selectedParts: PartId[];
  partInventory: PartInventory;
  log: string[];
  tiles: TileState[];
  cells: CellState[];
  debris: DebrisState[];
  scoreEvents: ScoreEvent[];
  pending: PendingPlay[];
  plasmids: DesignedPlasmid[];
}

export const boardColumns = 8;
export const boardRows = 7;

const vesselTiles = new Set(['2-1', '3-2', '4-3', '5-4', '6-5']);
const lymphTiles = new Set(['1-1', '6-5']);
const organTiles = new Set(['3-3', '4-3', '5-3', '3-4', '4-4', '5-4']);

export function createInitialGameState(scenario: ScenarioId = 'cancer'): GameState {
  return {
    scenario,
    activeRole: 'immune',
    turn: 1,
    actionsRemaining: 3,
    organDamage: 0,
    autoimmuneDamage: 0,
    pathologyResource: 2,
    immuneResource: 2,
    vectorSupply: 2,
    remissionScore: 0,
    immuneMemory: [],
    decoyShield: false,
    selectedTileId: '4-3',
    selectedInstrumentId: 'microscope',
    selectedParts: ['hypoxia-promoter', 'and-gate', 'tumor-marker-sensor', 'il2-signal', 'generic-terminator'],
    partInventory: createInitialPartInventory(scenario),
    log: getScenarioLog(scenario),
    tiles: createTiles(),
    cells: createScenarioCells(scenario),
    debris: [],
    scoreEvents: [],
    pending: [],
    plasmids: createStarterPlasmids(scenario),
  };
}

function createStarterPlasmids(scenario: ScenarioId): DesignedPlasmid[] {
  const shared: DesignedPlasmid[] = [
      {
        id: 'patrol-plasmid',
        name: 'Patrol plasmid',
        role: 'immune',
        parts: ['stress-promoter', 'motility-program', 'generic-terminator'],
        behavior: 'Move toward damaged or inflamed tissue.',
        effect: 'motility',
        valid: true,
        validated: true,
      },
      {
        id: 'marker-kill-switch',
        name: 'Marker kill switch',
        role: 'immune',
        parts: ['tumor-marker-sensor', 'apoptosis-payload', 'generic-terminator'],
        behavior: 'Confirmed marker-positive targets trigger precise apoptosis.',
        effect: 'kill-switch',
        valid: true,
        validated: true,
      },
    ];

  if (scenario === 'viral') {
    return [
      ...shared,
      {
        id: 'viral-replication-program',
        name: 'Viral replication program',
        role: 'pathology',
        parts: ['viral-sensor', 'motility-program', 'generic-terminator'],
        behavior: 'Infected cells replicate faster and release virions on lysis.',
        effect: 'viral-replication',
        valid: true,
        validated: true,
      },
      {
        id: 'viral-mimic-program',
        name: 'Host-marker mimic',
        role: 'pathology',
        parts: ['self-marker-sensor', 'decoy-shedder', 'generic-terminator'],
        behavior: 'Infected cells shed confusing host-like markers.',
        effect: 'decoy-shedder',
        valid: true,
        validated: true,
      },
    ];
  }

  return [
    ...shared,
    {
      id: 'cancer-proliferation-program',
      name: 'Uncontrolled proliferation',
      role: 'pathology',
      parts: ['hypoxia-promoter', 'motility-program', 'generic-terminator'],
      behavior: 'Tumor cells divide into nearby tissue during resolution.',
      effect: 'proliferation',
      valid: true,
      validated: true,
    },
    {
      id: 'cancer-evasion-program',
      name: 'Host-marker mimic',
      role: 'pathology',
      parts: ['self-marker-sensor', 'decoy-shedder', 'generic-terminator'],
      behavior: 'Tumor cells shed targetable markers and fool antigen scans.',
      effect: 'decoy-shedder',
      valid: true,
      validated: true,
    },
    {
      id: 'cancer-invasion-program',
      name: 'Matrix invasion program',
      role: 'pathology',
      parts: ['stress-promoter', 'matrix-protease', 'generic-terminator'],
      behavior: 'Tumor cells digest matrix and open invasion routes.',
      effect: 'matrix-protease',
      valid: true,
      validated: true,
    },
    {
      id: 'cancer-angiogenesis-program',
      name: 'Angiogenic growth program',
      role: 'pathology',
      parts: ['hypoxia-promoter', 'vector-stabilizer', 'generic-terminator'],
      behavior: 'Hypoxic tumor regions recruit vessel sprouts.',
      effect: 'angiogenesis',
      valid: true,
      validated: true,
    },
  ];
}

export function createInitialPartInventory(scenario: ScenarioId = 'cancer'): PartInventory {
  const inventory: PartInventory = {
    'hypoxia-promoter': 2,
    'stress-promoter': 2,
    'and-gate': 1,
    'il2-signal': 2,
    'motility-program': 1,
    'generic-terminator': 4,
  };

  if (scenario === 'viral') {
    inventory['viral-sensor'] = 2;
    inventory['tumor-marker-sensor'] = 0;
  } else {
    inventory['tumor-marker-sensor'] = 2;
    inventory['viral-sensor'] = 0;
  }

  return inventory;
}

function getScenarioLog(scenario: ScenarioId): string[] {
  if (scenario === 'viral') {
    return [
      'Viral infection: most cells are healthy hosts, but some contain hidden viral payloads.',
      'Microscope shows infected morphology; antigen scan finds viral surface markers; PCR confirms viral sequence.',
    ];
  }

  return [
    'Cancer initiation: many cells look ambiguous until you investigate.',
    'Microscope reveals shape; antigen scan reveals targetable markers; PCR confirms genetic identity.',
  ];
}

function createScenarioCells(scenario: ScenarioId): CellState[] {
  const immuneCells = [
    createCell('t-cell-a', 't-cell', 'immune', 1, 1, 'normal', 'self', true, false, 'patrol plasmid', 'motility'),
    createCell('macrophage-a', 'macrophage', 'immune', 3, 2, 'normal', 'self', true, false),
  ];
  const pathologySpawns = shufflePositions([
    [4, 3],
    [5, 4],
    [3, 4],
    [5, 3],
    [4, 4],
    [6, 3],
  ]);

  if (scenario === 'viral') {
    const infectedA = pathologySpawns[0];
    const infectedB = pathologySpawns[1];
    const virionA = pathologySpawns[2];
    const blocked = new Set([toTileId(infectedA), toTileId(infectedB), toTileId(virionA), '1-1', '3-2']);
    return [
      createCell('infected-a', 'infected', 'pathology', infectedA[0], infectedA[1], 'infected', 'viral', true, true, undefined, undefined, 2),
      createCell('infected-b', 'infected', 'pathology', infectedB[0], infectedB[1], 'infected', 'viral', false, true, undefined, undefined, 1),
      createCell('virion-a', 'virion', 'pathology', virionA[0], virionA[1], 'infected', 'viral', true, true, undefined, undefined, 1),
      ...immuneCells,
      ...createHealthyCells(blocked),
    ];
  }

  const tumorA = pathologySpawns[0];
  const tumorB = pathologySpawns[1];
  const tumorC = pathologySpawns[2];
  const blocked = new Set([toTileId(tumorA), toTileId(tumorB), toTileId(tumorC), '1-1', '3-2']);
  return [
    createCell('tumor-a', 'tumor', 'pathology', tumorA[0], tumorA[1], 'abnormal', 'tumor', true, true, 'stealth plasmid', 'decoy-shedder'),
    createCell('tumor-b', 'tumor', 'pathology', tumorB[0], tumorB[1], 'abnormal', 'tumor', false, true),
    createCell('tumor-c', 'tumor', 'pathology', tumorC[0], tumorC[1], 'abnormal', 'tumor', true, true),
    ...immuneCells,
    ...createHealthyCells(blocked),
  ];
}

function shufflePositions<T extends readonly [number, number]>(positions: readonly T[]): T[] {
  return [...positions].sort(() => Math.random() - 0.5);
}

function toTileId(position: readonly [number, number]): string {
  return `${position[0]}-${position[1]}`;
}

function createCell(
  id: string,
  kind: CellKind,
  role: RoleId | 'neutral',
  x: number,
  y: number,
  morphology: MorphologyState,
  marker: SurfaceMarker,
  markerVisible: boolean,
  hidden: boolean,
  plasmid?: string,
  plasmidEffect?: PlasmidEffect,
  viralLoad?: number
): CellState {
  const known = false;
  const stats = getBaseCellStats(kind);

  return {
    id,
    kind,
    role,
    x,
    y,
    hidden,
    morphology,
    marker,
    ...stats,
    markerVisible,
    morphologyKnown: known,
    markersKnown: known,
    confirmed: known,
    plasmid,
    plasmidEffect,
    expression: plasmid ? 1 : undefined,
    viralLoad,
  };
}

export function getBaseCellStats(kind: CellKind): Pick<CellState, 'health' | 'maxHealth' | 'attack' | 'movement'> {
  if (kind === 'tumor') return { health: 3, maxHealth: 3, attack: 1, movement: 1 };
  if (kind === 't-cell') return { health: 2, maxHealth: 2, attack: 1, movement: 1 };
  if (kind === 'macrophage') return { health: 3, maxHealth: 3, attack: 1, movement: 1 };
  if (kind === 'infected') return { health: 2, maxHealth: 2, attack: 0, movement: 0 };
  if (kind === 'virion') return { health: 1, maxHealth: 1, attack: 0, movement: 1 };
  return { health: 1, maxHealth: 1, attack: 0, movement: 0 };
}

function createHealthyCells(blocked = new Set<string>()): CellState[] {
  const positions = [
    [0, 2],
    [1, 3],
    [2, 2],
    [2, 4],
    [3, 3],
    [3, 5],
    [4, 2],
    [4, 4],
    [4, 5],
    [5, 2],
    [5, 3],
    [5, 5],
    [6, 2],
    [6, 3],
    [6, 4],
    [7, 2],
    [7, 4],
    [7, 5],
  ] as const;

  return positions
    .filter(([x, y]) => !blocked.has(`${x}-${y}`))
    .map(([x, y], index) => createCell(`healthy-${index + 1}`, 'healthy', 'neutral', x, y, 'normal', 'self', true, true));
}

function createTiles(): TileState[] {
  const tiles: TileState[] = [];

  for (let y = 0; y < boardRows; y += 1) {
    for (let x = 0; x < boardColumns; x += 1) {
      const id = `${x}-${y}`;
      const zone: TileZone = lymphTiles.has(id)
        ? 'lymph'
        : vesselTiles.has(id)
          ? 'vessel'
          : organTiles.has(id)
            ? 'organ'
            : 'matrix';

      tiles.push({
        id,
        x,
        y,
        zone,
        oxygen: zone === 'vessel' ? 9 : zone === 'organ' ? 5 : 3,
        damage: zone === 'organ' ? 1 : 0,
        visible: true,
        chemistryKnown: x < 3 || lymphTiles.has(id),
        inflammation: 0,
        matrixOpen: zone !== 'matrix',
        environment: getEnvironment(id, zone),
      });
    }
  }

  return tiles;
}

function getEnvironment(id: string, zone: TileZone): EnvironmentState | undefined {
  if (id === '4-3' || id === '5-4') return 'hypoxic';
  if (id === '3-4') return 'acidic';
  if (zone === 'organ' && (id === '4-4' || id === '5-3')) return 'immunosuppressed';
  return undefined;
}
