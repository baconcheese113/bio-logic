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
    id: 'cd47-silencer',
    name: 'CD47 silencer',
    type: 'gene',
    text: 'Makes marked cells easier for macrophages to eat.',
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
    id: 'degradation-tag',
    name: 'Degradation tag',
    type: 'control',
    text: 'Shortens expression so the effect is sharp but brief.',
    score: 1,
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

export const cards = [
  {
    id: 'antigen-scan',
    role: 'immune',
    name: 'Antigen scan',
    charge: 1,
    cost: 1,
    tag: 'Detection',
    text: 'Reveal hidden pathology cells near vessels and lymph nodes.',
  },
  {
    id: 'cytotoxic-burst',
    role: 'immune',
    name: 'Cytotoxic burst',
    charge: 2,
    cost: 2,
    tag: 'Elimination',
    text: 'Destroy one revealed tumor cluster, but add autoimmune damage nearby.',
  },
  {
    id: 'recruit-t-cells',
    role: 'immune',
    name: 'Recruit T cells',
    charge: 2,
    cost: 1,
    tag: 'Amplify',
    text: 'Add immune cells from the lymph node and increase recognition.',
  },
  {
    id: 'angiogenesis',
    role: 'pathology',
    name: 'Angiogenesis',
    charge: 2,
    cost: 1,
    tag: 'Invasion',
    text: 'Grow toward vessel tiles and raise organ damage.',
  },
  {
    id: 'immune-decoy',
    role: 'pathology',
    name: 'Antigen decoy',
    charge: 1,
    cost: 1,
    tag: 'Evasion',
    text: 'Hide one revealed cluster and waste the next scan.',
  },
  {
    id: 'matrix-breakdown',
    role: 'pathology',
    name: 'Matrix breakdown',
    charge: 3,
    cost: 2,
    tag: 'Spread',
    text: 'Seed a new tumor cell through the tissue matrix.',
  },
] as const;

export type CardId = (typeof cards)[number]['id'];

export const instruments = [
  {
    id: 'microscope',
    name: 'Microscope',
    turns: 1,
    input: 'Tile smear',
    output: 'Morphology and rough marker state.',
  },
  {
    id: 'flow-cytometer',
    name: 'Flow cytometer',
    turns: 2,
    input: 'Cell suspension',
    output: 'Counts cells by surface markers.',
  },
  {
    id: 'pcr',
    name: 'PCR',
    turns: 2,
    input: 'DNA sample',
    output: 'Amplified plasmid fragment.',
  },
  {
    id: 'elisa',
    name: 'ELISA',
    turns: 2,
    input: 'Protein sample',
    output: 'Quantified cytokine signal.',
  },
] as const;

export type InstrumentId = (typeof instruments)[number]['id'];

export type CellKind = 'tumor' | 't-cell' | 'macrophage' | 'healthy';
export type TileZone = 'organ' | 'vessel' | 'lymph' | 'matrix';

export interface TileState {
  id: string;
  x: number;
  y: number;
  zone: TileZone;
  oxygen: number;
  damage: number;
  visible: boolean;
}

export interface CellState {
  id: string;
  kind: CellKind;
  role: RoleId | 'neutral';
  x: number;
  y: number;
  hidden: boolean;
  plasmid?: string;
  expression?: number;
}

export interface PendingPlay {
  id: number;
  cardId?: CardId;
  instrumentId?: InstrumentId;
  role: RoleId;
  name: string;
  targetTileId: string;
  remainingTurns: number;
  result: string;
}

export interface DesignedPlasmid {
  id: string;
  name: string;
  parts: PartId[];
  behavior: string;
}

export interface GameState {
  activeRole: RoleId;
  turn: number;
  actionsRemaining: number;
  organDamage: number;
  autoimmuneDamage: number;
  pathologyResource: number;
  immuneResource: number;
  decoyShield: boolean;
  selectedTileId: string;
  selectedCardId: CardId;
  selectedInstrumentId: InstrumentId;
  selectedParts: PartId[];
  log: string[];
  tiles: TileState[];
  cells: CellState[];
  pending: PendingPlay[];
  plasmids: DesignedPlasmid[];
}

const vesselTiles = new Set(['3-1', '4-2', '5-3', '6-4', '7-5', '8-6']);
const lymphTiles = new Set(['1-1', '9-6']);
const organTiles = new Set(['4-3', '5-3', '6-3', '4-4', '5-4', '6-4', '5-5']);

export function createInitialGameState(): GameState {
  return {
    activeRole: 'immune',
    turn: 1,
    actionsRemaining: 3,
    organDamage: 2,
    autoimmuneDamage: 0,
    pathologyResource: 2,
    immuneResource: 2,
    decoyShield: false,
    selectedTileId: '5-3',
    selectedCardId: 'antigen-scan',
    selectedInstrumentId: 'microscope',
    selectedParts: ['hypoxia-promoter', 'cd47-silencer', 'generic-terminator'],
    log: [
      'Initiation phase: tumor cluster is suspected near the vessel bed.',
      'Immune player starts with detection tools; pathology player has tempo.',
    ],
    tiles: createTiles(),
    cells: [
      { id: 'tumor-a', kind: 'tumor', role: 'pathology', x: 5, y: 3, hidden: true, plasmid: 'stealth plasmid', expression: 2 },
      { id: 'tumor-b', kind: 'tumor', role: 'pathology', x: 6, y: 4, hidden: true },
      { id: 'tumor-c', kind: 'tumor', role: 'pathology', x: 4, y: 4, hidden: true },
      { id: 't-cell-a', kind: 't-cell', role: 'immune', x: 1, y: 1, hidden: false, plasmid: 'patrol plasmid', expression: 1 },
      { id: 'macrophage-a', kind: 'macrophage', role: 'immune', x: 3, y: 2, hidden: false },
      { id: 'healthy-a', kind: 'healthy', role: 'neutral', x: 5, y: 5, hidden: false },
      { id: 'healthy-b', kind: 'healthy', role: 'neutral', x: 7, y: 3, hidden: false },
    ],
    pending: [
      {
        id: 1,
        role: 'pathology',
        cardId: 'angiogenesis',
        name: 'Angiogenesis',
        targetTileId: '6-4',
        remainingTurns: 1,
        result: 'A charged pathology play is visible. It will raise damage unless countered.',
      },
    ],
    plasmids: [
      {
        id: 'patrol-plasmid',
        name: 'Patrol plasmid',
        parts: ['il2-signal', 'generic-terminator'],
        behavior: 'Moves immune cells toward the nearest detected threat.',
      },
    ],
  };
}

function createTiles(): TileState[] {
  const tiles: TileState[] = [];

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 11; x += 1) {
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
        visible: x < 4 || lymphTiles.has(id),
      });
    }
  }

  return tiles;
}
