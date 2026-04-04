import {
  DEBUG_LOG_DEFAULT,
  SIM,
  type Action,
  type ActiveStrokeDiagnostics,
  type DebugLogConfig,
  type FilmState,
  type LoopSector,
  type PlateSession,
  type Rect,
  type SpeciesDef,
  type StrokeDiagnostics,
  type StrokeProfile,
  type TransferScenario,
  type TransferScenarioId,
  type TransferSnapshot,
  clamp01,
  createPlateSession,
  createRect,
  createTransferSnapshot,
  normalizeSpeciesLoads,
  pointToCell,
  rectArea,
  totalFloat32,
  unionRect,
  cellIndex,
} from './streak-types';

interface WeightedCell {
  x: number;
  y: number;
  index: number;
  weight: number;
}

interface SectorContact {
  sectorIndex: number;
  pickupCells: WeightedCell[];
  depositCells: WeightedCell[];
  dirtyRect: Rect | null;
}

interface PickupTransfer {
  overlapStrength: number;
}

interface ScenarioBuildResult {
  actions: Action[];
  nextTime: number;
}

const SCENARIO_PLATE_SEED = 0x0cd3f711;

export const CANONICAL_TRANSFER_SCENARIOS: TransferScenario[] = [
  {
    id: 'balanced-three-species',
    name: 'Balanced 3-species streak',
    description: 'A single balanced pass so the dilution profile stays easy to read while all three species remain visible.',
    recommendedSpeciesIndex: 0,
  },
  {
    id: 'dominant-minor-species',
    name: 'Dominant + minor species',
    description: 'One species dominates the loop while two minor species stay detectable in the same transfer band.',
    recommendedSpeciesIndex: 1,
  },
  {
    id: 'sterile-cross-smear',
    name: 'Sterile cross-smear',
    description: 'Lay down a prior streak, sterilize the loop, then cross-smear through it to inspect pickup and redeposition.',
    recommendedSpeciesIndex: 0,
  },
  {
    id: 'reload-through-prior-region',
    name: 'Reload through prior region',
    description: 'Reload the loop with a new composition and run back through an earlier region to inspect remixing across strokes.',
    recommendedSpeciesIndex: 1,
  },
];

export function createCanonicalTransferSession(
  speciesConfig: SpeciesDef[],
  scenarioId: TransferScenarioId,
  plateSeed = SCENARIO_PLATE_SEED,
): PlateSession {
  const session = createPlateSession(speciesConfig, plateSeed);
  session.actionLog = buildScenarioActions(scenarioId);
  return session;
}

export function applyTransferAction(
  snapshot: TransferSnapshot,
  action: Action,
  species: SpeciesDef[],
  debugLog: DebugLogConfig = DEBUG_LOG_DEFAULT,
): TransferSnapshot {
  switch (action.type) {
    case 'loadSample':
      applyLoadSample(snapshot, normalizeSpeciesLoads(action.speciesLoads, species.length));
      break;
    case 'sterilize':
      applySterilize(snapshot);
      break;
    case 'beginStroke':
      snapshot.strokeActive = true;
      snapshot.dirtyRect = null;
      snapshot.activeStroke = createActiveStrokeDiagnostics(species.length, snapshot.film.resolution, action.timestamp, snapshot.strokeReports.length + 1);
      break;
    case 'strokeSegment':
      if (snapshot.strokeActive) {
        applyStrokeSegment(snapshot, action.from, action.to, clamp01(action.pressure), debugLog);
      }
      break;
    case 'endStroke':
      snapshot.strokeActive = false;
      finalizeStroke(snapshot, action.timestamp);
      if (debugLog.transfer && snapshot.lastStrokeReport) {
        logTransferSummary(snapshot.lastStrokeReport, snapshot);
      }
      break;
  }

  syncLedger(snapshot);
  return snapshot;
}

export function replayTransferSession(
  session: PlateSession,
  resolution = SIM.defaultResolution,
  debugLog: DebugLogConfig = DEBUG_LOG_DEFAULT,
): TransferSnapshot {
  const snapshot = createTransferSnapshot(session.speciesConfig.length, resolution);
  for (const action of session.actionLog) {
    applyTransferAction(snapshot, action, session.speciesConfig, debugLog);
  }
  return snapshot;
}

function buildScenarioActions(scenarioId: TransferScenarioId): Action[] {
  let time = 1;

  switch (scenarioId) {
    case 'balanced-three-species':
      return buildBalancedThreeSpeciesScenario(time).actions;
    case 'dominant-minor-species':
      return buildDominantMinorScenario(time).actions;
    case 'sterile-cross-smear':
      return buildSterileCrossSmearScenario(time).actions;
    case 'reload-through-prior-region':
      return buildReloadThroughPriorRegionScenario(time).actions;
  }
}

function buildBalancedThreeSpeciesScenario(startTime: number): ScenarioBuildResult {
  const actions: Action[] = [
    { type: 'loadSample', speciesLoads: [0.34, 0.33, 0.33], timestamp: startTime },
  ];

  return appendStroke(
    actions,
    [
      { x: 0.2, y: 0.28 },
      { x: 0.36, y: 0.31 },
      { x: 0.54, y: 0.33 },
      { x: 0.8, y: 0.35 },
    ],
    0.62,
    startTime + 1,
  );
}

function buildDominantMinorScenario(startTime: number): ScenarioBuildResult {
  const actions: Action[] = [
    { type: 'loadSample', speciesLoads: [0.84, 0.12, 0.04], timestamp: startTime },
  ];

  return appendStroke(
    actions,
    [
      { x: 0.18, y: 0.47 },
      { x: 0.34, y: 0.48 },
      { x: 0.54, y: 0.49 },
      { x: 0.82, y: 0.51 },
    ],
    0.58,
    startTime + 1,
  );
}

function buildSterileCrossSmearScenario(startTime: number): ScenarioBuildResult {
  const actions: Action[] = [
    { type: 'loadSample', speciesLoads: [0.45, 0.35, 0.2], timestamp: startTime },
  ];

  const firstStroke = appendStroke(
    actions,
    [
      { x: 0.18, y: 0.36 },
      { x: 0.4, y: 0.37 },
      { x: 0.62, y: 0.38 },
      { x: 0.82, y: 0.4 },
    ],
    0.6,
    startTime + 1,
  );

  firstStroke.actions.push({ type: 'sterilize', timestamp: firstStroke.nextTime });

  return appendStroke(
    firstStroke.actions,
    [
      { x: 0.54, y: 0.2 },
      { x: 0.53, y: 0.34 },
      { x: 0.51, y: 0.5 },
      { x: 0.49, y: 0.72 },
    ],
    0.7,
    firstStroke.nextTime + 1,
  );
}

function buildReloadThroughPriorRegionScenario(startTime: number): ScenarioBuildResult {
  const actions: Action[] = [
    { type: 'loadSample', speciesLoads: [0.5, 0.3, 0.2], timestamp: startTime },
  ];

  const firstStroke = appendStroke(
    actions,
    [
      { x: 0.18, y: 0.67 },
      { x: 0.34, y: 0.63 },
      { x: 0.56, y: 0.58 },
      { x: 0.76, y: 0.53 },
    ],
    0.63,
    startTime + 1,
  );

  firstStroke.actions.push({
    type: 'loadSample',
    speciesLoads: [0.18, 0.62, 0.2],
    timestamp: firstStroke.nextTime,
  });

  return appendStroke(
    firstStroke.actions,
    [
      { x: 0.24, y: 0.42 },
      { x: 0.4, y: 0.48 },
      { x: 0.58, y: 0.56 },
      { x: 0.8, y: 0.68 },
    ],
    0.68,
    firstStroke.nextTime + 1,
  );
}

function appendStroke(
  actions: Action[],
  anchors: Array<{ x: number; y: number }>,
  pressure: number,
  startTime: number,
): ScenarioBuildResult {
  const strokePoints = densifyAnchors(anchors, 8);
  let time = startTime;
  actions.push({ type: 'beginStroke', timestamp: time });
  time += 1;

  for (let index = 1; index < strokePoints.length; index += 1) {
    actions.push({
      type: 'strokeSegment',
      from: strokePoints[index - 1],
      to: strokePoints[index],
      pressure,
      timestamp: time,
    });
    time += 1;
  }

  actions.push({ type: 'endStroke', timestamp: time });
  return { actions, nextTime: time + 1 };
}

function densifyAnchors(
  anchors: Array<{ x: number; y: number }>,
  segmentsPerSpan: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const from = anchors[index];
    const to = anchors[index + 1];

    if (index === 0) points.push(from);

    for (let step = 1; step <= segmentsPerSpan; step += 1) {
      const t = step / segmentsPerSpan;
      points.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      });
    }
  }

  return points;
}

function createActiveStrokeDiagnostics(
  speciesCount: number,
  resolution: number,
  startedAt: number,
  strokeIndex: number,
): ActiveStrokeDiagnostics {
  const cellCount = resolution * resolution;
  return {
    strokeIndex,
    startedAt,
    dirtyRect: null,
    centerSum: { x: 0, y: 0 },
    directionSum: { x: 0, y: 0 },
    segmentCount: 0,
    deposited: Array.from({ length: speciesCount }, () => 0),
    pickedUp: Array.from({ length: speciesCount }, () => 0),
    netDelta: Array.from({ length: speciesCount }, () => new Float32Array(cellCount)),
  };
}

function applyLoadSample(snapshot: TransferSnapshot, composition: number[]): void {
  snapshot.loop.isSterile = false;
  discardLoopContents(snapshot);

  for (let sectorIndex = 0; sectorIndex < snapshot.loop.sectors.length; sectorIndex += 1) {
    const sector: LoopSector = snapshot.loop.sectors[sectorIndex];
    const loadScale = SIM.baseSectorLoad * (0.94 + Math.abs(SIM.sectorOffsets[sectorIndex]) * 1.8);

    for (let speciesIndex = 0; speciesIndex < composition.length; speciesIndex += 1) {
      const loadedMass = composition[speciesIndex] * loadScale;
      sector.load[speciesIndex] = loadedMass;
      sector.captured[speciesIndex] = 0;
      snapshot.ledger.loaded[speciesIndex] += loadedMass;
    }

    sector.fluid = getSectorFluidBaseline(sectorIndex);
  }
}

function applySterilize(snapshot: TransferSnapshot): void {
  discardLoopContents(snapshot);
  snapshot.loop.isSterile = true;
  for (let sectorIndex = 0; sectorIndex < snapshot.loop.sectors.length; sectorIndex += 1) {
    snapshot.loop.sectors[sectorIndex].fluid = getSectorFluidBaseline(sectorIndex);
  }
}

function getSectorFluidBaseline(sectorIndex: number): number {
  return SIM.loopFluidBaseline * (0.95 + Math.abs(SIM.sectorOffsets[sectorIndex]) * 1.5);
}

function discardLoopContents(snapshot: TransferSnapshot): void {
  for (const sector of snapshot.loop.sectors) {
    for (let speciesIndex = 0; speciesIndex < sector.load.length; speciesIndex += 1) {
      const lostMass = sector.load[speciesIndex] + sector.captured[speciesIndex];
      if (lostMass > 0) {
        snapshot.ledger.discarded[speciesIndex] += lostMass;
        sector.load[speciesIndex] = 0;
        sector.captured[speciesIndex] = 0;
      }
    }

    if (sector.fluid > 0) {
      snapshot.ledger.fluidDiscarded += sector.fluid;
      sector.fluid = 0;
    }
  }
}

function applyStrokeSegment(
  snapshot: TransferSnapshot,
  from: { x: number; y: number },
  to: { x: number; y: number },
  pressure: number,
  debugLog: DebugLogConfig,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (snapshot.activeStroke && distance > 0) {
    snapshot.activeStroke.centerSum.x += from.x + dx * 0.5;
    snapshot.activeStroke.centerSum.y += from.y + dy * 0.5;
    snapshot.activeStroke.directionSum.x += dx / distance;
    snapshot.activeStroke.directionSum.y += dy / distance;
    snapshot.activeStroke.segmentCount += 1;
  }
  const steps = Math.max(1, Math.ceil(distance / SIM.stampSpacing));
  const dirX = distance > 0 ? dx / distance : 1;
  const dirY = distance > 0 ? dy / distance : 0;
  const speedNorm = distance / steps;
  let dirtyRect: Rect | null = null;

  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;
    const px = from.x + dx * progress;
    const py = from.y + dy * progress;
    const contacts: SectorContact[] = [];

    for (let sectorIndex = 0; sectorIndex < snapshot.loop.sectors.length; sectorIndex += 1) {
      const offset = SIM.sectorOffsets[sectorIndex];
      const pickupCenter = {
        x: px - dirY * offset * SIM.pickupOffsetScale,
        y: py + dirX * offset * SIM.pickupOffsetScale,
      };
      const depositCenter = {
        x: px - dirY * offset * SIM.depositOffsetScale,
        y: py + dirX * offset * SIM.depositOffsetScale,
      };
      const pickupCells = collectKernelCells(snapshot.film, pickupCenter, SIM.pickupRadius, 'pickup');
      const depositCells = collectKernelCells(snapshot.film, depositCenter, SIM.depositRadius, 'deposit');
      if (pickupCells.length === 0 && depositCells.length === 0) continue;

      const localDirty = unionRect(boundsFromCells(pickupCells), boundsFromCells(depositCells));
      dirtyRect = unionRect(dirtyRect, localDirty);
      if (snapshot.activeStroke) {
        snapshot.activeStroke.dirtyRect = unionRect(snapshot.activeStroke.dirtyRect, localDirty);
      }
      contacts.push({ sectorIndex, pickupCells, depositCells, dirtyRect: localDirty });
    }

    const pickupTransfers = contacts.map((contact) =>
      pickupFromFilm(snapshot, contact.sectorIndex, contact.pickupCells, pressure),
    );

    for (let contactIndex = 0; contactIndex < contacts.length; contactIndex += 1) {
      shiftOverlapFilm(
        snapshot,
        contacts[contactIndex].pickupCells,
        contacts[contactIndex].depositCells,
        pickupTransfers[contactIndex],
        pressure,
      );
    }

    for (let contactIndex = 0; contactIndex < contacts.length; contactIndex += 1) {
      const contact = contacts[contactIndex];
      depositToFilm(snapshot, contact.sectorIndex, contact.depositCells, pressure, speedNorm, pickupTransfers[contactIndex]);
    }

    for (const contact of contacts) {
      writeGroove(snapshot.film, contact.pickupCells, contact.sectorIndex, pressure);
      if (contact.dirtyRect) {
        decayLocalFluid(snapshot.film, contact.dirtyRect);
      }
    }

    if (contacts.length > 0) {
      remixLoop(snapshot);
    }
  }

  snapshot.dirtyRect = unionRect(snapshot.dirtyRect, dirtyRect);
  snapshot.lastProfileRow = snapshot.dirtyRect ? Math.round((snapshot.dirtyRect.minY + snapshot.dirtyRect.maxY) / 2) : snapshot.lastProfileRow;

  if (debugLog.transfer && debugLog.verbose && dirtyRect) {
    console.log('[transfer] dirtyRect', dirtyRect);
  }
}

function pickupFromFilm(
  snapshot: TransferSnapshot,
  sectorIndex: number,
  weightedCells: WeightedCell[],
  pressure: number,
): PickupTransfer {
  const pressureFactor = 0.45 + pressure * 0.55;
  const sector: LoopSector = snapshot.loop.sectors[sectorIndex];
  const currentLoad = sector.load.reduce((sum, value, index) => sum + value + sector.captured[index], 0);
  const depletionBoost =
    1 +
    clamp01(1 - currentLoad / Math.max(0.0001, SIM.baseSectorLoad * 0.7)) * SIM.depletedLoopPickupBoost;
  let overlapSource = 0;
  for (const cell of weightedCells) {
    let localFilmTotal = 0;
    for (let speciesIndex = 0; speciesIndex < snapshot.film.filmMass.length; speciesIndex += 1) {
      localFilmTotal += snapshot.film.filmMass[speciesIndex][cell.index];
    }

    overlapSource += (localFilmTotal + snapshot.film.depositFluid[cell.index] * 0.35) * cell.weight;
  }
  const overlapStrength = clamp01(overlapSource / SIM.overlapExchangeReference);
  const pickupScale =
    SIM.pickupRate *
    SIM.sectorPickupBias[sectorIndex] *
    pressureFactor *
    depletionBoost *
    (1 + overlapStrength * SIM.overlapPickupBoost);
  let biomassFluidPickup = 0;

  for (let speciesIndex = 0; speciesIndex < snapshot.film.filmMass.length; speciesIndex += 1) {
    const channel = snapshot.film.filmMass[speciesIndex];
    let pickedTotal = 0;

    for (const cell of weightedCells) {
      const available = channel[cell.index];
      if (available <= 0) continue;

      const effectiveWetness = clamp01(
        0.38 +
          snapshot.film.agarWetness[cell.index] * 1.45 +
          snapshot.film.depositFluid[cell.index] * 6.1 +
          snapshot.film.groove[cell.index] * 0.35,
      );
      const requestedPickup = available * pickupScale * effectiveWetness * cell.weight;
      const picked = Math.min(available, requestedPickup);
      channel[cell.index] = Math.max(0, available - picked);
      pickedTotal += picked;

      snapshot.deltaMaps.pickup[speciesIndex][cell.index] += picked;
      snapshot.deltaMaps.net[speciesIndex][cell.index] -= picked;

      if (snapshot.activeStroke) {
        snapshot.activeStroke.pickedUp[speciesIndex] += picked;
        snapshot.activeStroke.netDelta[speciesIndex][cell.index] -= picked;
      }
    }

    sector.captured[speciesIndex] += pickedTotal;
    snapshot.ledger.pickedUp[speciesIndex] += pickedTotal;
    biomassFluidPickup += pickedTotal * 0.24;
  }

  let pickedFluid = 0;
  for (const cell of weightedCells) {
    const availableFluid = snapshot.film.depositFluid[cell.index];
    if (availableFluid > 0) {
      const depositFluidPickup = availableFluid * SIM.fluidPickupRate * pressureFactor * cell.weight;
      snapshot.film.depositFluid[cell.index] = Math.max(0, availableFluid - depositFluidPickup);
      pickedFluid += depositFluidPickup;
    }

    const agarWetness = snapshot.film.agarWetness[cell.index];
    const removableWetness = Math.max(0, agarWetness - SIM.minAgarWetness);
    if (removableWetness <= 0) continue;

    const agarPickup = removableWetness * SIM.agarFluidPickupRate * pressureFactor * cell.weight;
    snapshot.film.agarWetness[cell.index] = Math.max(SIM.minAgarWetness, agarWetness - agarPickup);
    pickedFluid += agarPickup;
  }

  sector.fluid += pickedFluid + biomassFluidPickup;
  snapshot.ledger.fluidPickedUp += pickedFluid + biomassFluidPickup;
  return { overlapStrength };
}

function depositToFilm(
  snapshot: TransferSnapshot,
  sectorIndex: number,
  weightedCells: WeightedCell[],
  pressure: number,
  speedNorm: number,
  pickupTransfer: PickupTransfer,
): void {
  const sector: LoopSector = snapshot.loop.sectors[sectorIndex];
  const fluidFactor = 0.2 + 0.8 * (sector.fluid / (sector.fluid + SIM.fluidTransferK));
  const pressureFactor = 0.4 + pressure * 0.8;
  const speedFactor = clamp01(1.25 - speedNorm * 18) * 0.6 + 0.4;
  const overlapReleaseBoost = pickupTransfer.overlapStrength * SIM.overlapReleaseBoost;
  const effectiveContactEfficiency =
    SIM.depositRate *
    SIM.sectorDepositBias[sectorIndex] *
    fluidFactor *
    pressureFactor *
    speedFactor;

  for (let speciesIndex = 0; speciesIndex < snapshot.film.filmMass.length; speciesIndex += 1) {
    const channel = snapshot.film.filmMass[speciesIndex];
    const baseLoad = sector.load[speciesIndex];
    const capturedLoad = sector.captured[speciesIndex];
    const accessibleMass = baseLoad + capturedLoad;
    if (accessibleMass <= 0) continue;

    const releaseDrive =
      (1 - SIM.loopCarryRetention) * SIM.contactExchangeGain + overlapReleaseBoost;
    const releaseRate = clamp01(effectiveContactEfficiency * releaseDrive);
    const targetDeposited = Math.min(accessibleMass, accessibleMass * releaseRate);
    if (targetDeposited <= 0) continue;

    const depositedCaptured = Math.min(capturedLoad, targetDeposited);
    const depositedBase = Math.min(baseLoad, targetDeposited - depositedCaptured);
    const depositedTotal = depositedBase + depositedCaptured;
    sector.load[speciesIndex] = Math.max(0, baseLoad - depositedBase);
    sector.captured[speciesIndex] = Math.max(0, capturedLoad - depositedCaptured);
    snapshot.ledger.deposited[speciesIndex] += depositedTotal;
    if (snapshot.activeStroke) {
      snapshot.activeStroke.deposited[speciesIndex] += depositedTotal;
    }

    for (const cell of weightedCells) {
      const delta = depositedTotal * cell.weight;
      channel[cell.index] += delta;
      snapshot.deltaMaps.net[speciesIndex][cell.index] += delta;
      if (snapshot.activeStroke) {
        snapshot.activeStroke.netDelta[speciesIndex][cell.index] += delta;
      }
    }
  }

  const fluidDeposit = sector.fluid * SIM.fluidDepositRate * fluidFactor * (0.55 + pressure * 0.45);
  sector.fluid = Math.max(SIM.minLoopFluid, sector.fluid - fluidDeposit);
  snapshot.ledger.fluidDeposited += fluidDeposit;

  for (const cell of weightedCells) {
    snapshot.film.depositFluid[cell.index] += fluidDeposit * cell.weight;
  }
}

function writeGroove(film: FilmState, weightedCells: WeightedCell[], sectorIndex: number, pressure: number): void {
  const grooveStrength = SIM.grooveStrength * SIM.sectorGrooveBias[sectorIndex] * pressure;
  if (grooveStrength <= 0) return;

  for (const cell of weightedCells) {
    film.groove[cell.index] = Math.min(1, film.groove[cell.index] + grooveStrength * cell.weight * 3.5);
  }
}

function shiftOverlapFilm(
  snapshot: TransferSnapshot,
  pickupCells: WeightedCell[],
  depositCells: WeightedCell[],
  pickupTransfer: PickupTransfer,
  pressure: number,
): void {
  if (pickupCells.length === 0 || depositCells.length === 0 || pickupTransfer.overlapStrength <= 0.0001) return;

  const shiftFactor = clamp01(
    SIM.overlapFilmShiftRate * pickupTransfer.overlapStrength * (0.45 + pressure * 0.55),
  );
  if (shiftFactor <= 0) return;

  for (let speciesIndex = 0; speciesIndex < snapshot.film.filmMass.length; speciesIndex += 1) {
    const channel = snapshot.film.filmMass[speciesIndex];
    let shiftedTotal = 0;

    for (const cell of pickupCells) {
      const available = channel[cell.index];
      if (available <= 0) continue;

      const shifted = available * shiftFactor * cell.weight;
      if (shifted <= 0) continue;

      channel[cell.index] = Math.max(0, available - shifted);
      shiftedTotal += shifted;
      snapshot.deltaMaps.pickup[speciesIndex][cell.index] += shifted;
      snapshot.deltaMaps.net[speciesIndex][cell.index] -= shifted;

      if (snapshot.activeStroke) {
        snapshot.activeStroke.pickedUp[speciesIndex] += shifted;
        snapshot.activeStroke.netDelta[speciesIndex][cell.index] -= shifted;
      }
    }

    if (shiftedTotal <= 0) continue;

    snapshot.ledger.pickedUp[speciesIndex] += shiftedTotal;
    snapshot.ledger.deposited[speciesIndex] += shiftedTotal;
    if (snapshot.activeStroke) {
      snapshot.activeStroke.deposited[speciesIndex] += shiftedTotal;
    }

    for (const cell of depositCells) {
      const delta = shiftedTotal * cell.weight;
      channel[cell.index] += delta;
      snapshot.deltaMaps.net[speciesIndex][cell.index] += delta;

      if (snapshot.activeStroke) {
        snapshot.activeStroke.netDelta[speciesIndex][cell.index] += delta;
      }
    }
  }
}

function decayLocalFluid(film: FilmState, rect: Rect): void {
  for (let y = rect.minY; y <= rect.maxY; y += 1) {
    for (let x = rect.minX; x <= rect.maxX; x += 1) {
      const index = cellIndex(x, y, film.resolution);
      film.depositFluid[index] *= SIM.fluidDecay;
    }
  }
}

function remixLoop(snapshot: TransferSnapshot): void {
  const sectorCount = snapshot.loop.sectors.length;

  for (let speciesIndex = 0; speciesIndex < snapshot.loop.sectors[0].load.length; speciesIndex += 1) {
    const nextLoad = Array.from({ length: sectorCount }, () => 0);
    const nextCaptured = Array.from({ length: sectorCount }, () => 0);
    for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
      const currentLoad = snapshot.loop.sectors[sectorIndex].load[speciesIndex];
      const leftLoad = snapshot.loop.sectors[Math.max(0, sectorIndex - 1)].load[speciesIndex];
      const rightLoad = snapshot.loop.sectors[Math.min(sectorCount - 1, sectorIndex + 1)].load[speciesIndex];
      const loadNeighborAverage = (leftLoad + currentLoad + rightLoad) / 3;
      nextLoad[sectorIndex] = currentLoad + (loadNeighborAverage - currentLoad) * SIM.remixRate;

      const currentCaptured = snapshot.loop.sectors[sectorIndex].captured[speciesIndex];
      const leftCaptured = snapshot.loop.sectors[Math.max(0, sectorIndex - 1)].captured[speciesIndex];
      const rightCaptured = snapshot.loop.sectors[Math.min(sectorCount - 1, sectorIndex + 1)].captured[speciesIndex];
      const capturedNeighborAverage = (leftCaptured + currentCaptured + rightCaptured) / 3;
      nextCaptured[sectorIndex] = currentCaptured + (capturedNeighborAverage - currentCaptured) * SIM.remixRate;
    }

    for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
      snapshot.loop.sectors[sectorIndex].load[speciesIndex] = nextLoad[sectorIndex];
      snapshot.loop.sectors[sectorIndex].captured[speciesIndex] = nextCaptured[sectorIndex];
    }
  }

  const fluidNext = Array.from({ length: sectorCount }, () => 0);
  for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
    const current = snapshot.loop.sectors[sectorIndex].fluid;
    const left = snapshot.loop.sectors[Math.max(0, sectorIndex - 1)].fluid;
    const right = snapshot.loop.sectors[Math.min(sectorCount - 1, sectorIndex + 1)].fluid;
    const neighborAverage = (left + current + right) / 3;
    fluidNext[sectorIndex] = current + (neighborAverage - current) * SIM.remixRate;
  }

  for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
    snapshot.loop.sectors[sectorIndex].fluid = fluidNext[sectorIndex];
  }
}

function finalizeStroke(snapshot: TransferSnapshot, completedAt: number): void {
  const activeStroke = snapshot.activeStroke;
  if (!activeStroke) return;

  copyDeltaChannels(snapshot.deltaMaps.lastStroke, activeStroke.netDelta);

  const dirtyRect = activeStroke.dirtyRect;
  const strokeCenter =
    activeStroke.segmentCount > 0
      ? {
          x: activeStroke.centerSum.x / activeStroke.segmentCount,
          y: activeStroke.centerSum.y / activeStroke.segmentCount,
        }
      : null;
  const directionMagnitude = Math.hypot(activeStroke.directionSum.x, activeStroke.directionSum.y);
  const strokeDirection =
    directionMagnitude > 0
      ? {
          x: activeStroke.directionSum.x / directionMagnitude,
          y: activeStroke.directionSum.y / directionMagnitude,
        }
      : null;
  const profileRow = strokeCenter ? Math.round(strokeCenter.y * snapshot.film.resolution) : null;
  snapshot.lastProfileRow = profileRow;

  const report: StrokeDiagnostics = {
    strokeIndex: activeStroke.strokeIndex,
    startedAt: activeStroke.startedAt,
    completedAt,
    dirtyRect,
    dirtyArea: rectArea(dirtyRect),
    strokeCenter,
    strokeDirection,
    deposited: [...activeStroke.deposited],
    pickedUp: [...activeStroke.pickedUp],
    net: activeStroke.deposited.map((value, index) => value - activeStroke.pickedUp[index]),
    remainingSectorLoads: snapshot.loop.sectors.map((sector) =>
      sector.load.map((value, index) => value + sector.captured[index]),
    ),
    remainingLoopFluid: snapshot.loop.sectors.map((sector) => sector.fluid),
    profiles: buildStrokeProfiles(snapshot.film, strokeCenter, strokeDirection, dirtyRect),
  };

  snapshot.strokeReports.push(report);
  snapshot.lastStrokeReport = report;
  snapshot.activeStroke = null;
}

function buildStrokeProfiles(
  film: FilmState,
  center: { x: number; y: number } | null,
  direction: { x: number; y: number } | null,
  bounds: Rect | null,
): StrokeProfile[] {
  if (!center || !direction || !bounds) return [];

  const dirtyWidth = bounds.maxX - bounds.minX + 1;
  const dirtyHeight = bounds.maxY - bounds.minY + 1;
  const halfWidthCells = Math.max(10, Math.ceil(Math.min(dirtyWidth, dirtyHeight) * 0.7));
  const samples = Math.max(41, halfWidthCells * 2 + 1);

  return film.filmMass.map((_, speciesIndex) => {
    const values = sampleCrossSectionProfile(film, center, direction, speciesIndex, halfWidthCells, samples);
    const centerIndex = Math.floor(values.length / 2);
    const centerValue = values[centerIndex] ?? 0;
    const centerExclusion = Math.max(1, Math.floor(values.length * 0.08));
    let sideLobeLeft = 0;
    let sideLobeRight = 0;

    for (let index = 0; index < Math.max(0, centerIndex - centerExclusion); index += 1) {
      sideLobeLeft = Math.max(sideLobeLeft, values[index] ?? 0);
    }

    for (let index = Math.min(values.length - 1, centerIndex + centerExclusion + 1); index < values.length; index += 1) {
      sideLobeRight = Math.max(sideLobeRight, values[index] ?? 0);
    }

    const sideLobeAverage = (sideLobeLeft + sideLobeRight) / 2;

    return {
      speciesIndex,
      values,
      centerValue,
      sideLobeLeft,
      sideLobeRight,
      sideLobeAverage,
      troughDepth: sideLobeAverage - centerValue,
    };
  });
}

function sampleCrossSectionProfile(
  film: FilmState,
  center: { x: number; y: number },
  direction: { x: number; y: number },
  speciesIndex: number,
  halfWidthCells: number,
  samples: number,
): number[] {
  const directionLength = Math.hypot(direction.x, direction.y);
  if (directionLength <= 0) return [];

  const perpX = -direction.y / directionLength;
  const perpY = direction.x / directionLength;
  const profile = Array.from({ length: samples }, () => 0);

  for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
    const offsetCells = ((sampleIndex / Math.max(1, samples - 1)) - 0.5) * 2 * halfWidthCells;
    const samplePoint = {
      x: center.x + (perpX * offsetCells) / film.resolution,
      y: center.y + (perpY * offsetCells) / film.resolution,
    };
    const cell = pointToCell(samplePoint, film.resolution);
    if (!cell) continue;
    profile[sampleIndex] = film.filmMass[speciesIndex][cellIndex(cell.x, cell.y, film.resolution)];
  }

  return profile;
}

function copyDeltaChannels(target: Float32Array[], source: Float32Array[]): void {
  for (let index = 0; index < target.length; index += 1) {
    target[index].set(source[index]);
  }
}

function collectKernelCells(
  film: FilmState,
  center: { x: number; y: number },
  radius: number,
  profile: 'pickup' | 'deposit',
): WeightedCell[] {
  const resolution = film.resolution;
  const centerCell = pointToCell(center, resolution);
  if (!centerCell) return [];

  const radiusCells = Math.ceil(radius * resolution);
  const cells: WeightedCell[] = [];
  let weightTotal = 0;

  for (let y = Math.max(0, centerCell.y - radiusCells); y <= Math.min(resolution - 1, centerCell.y + radiusCells); y += 1) {
    for (let x = Math.max(0, centerCell.x - radiusCells); x <= Math.min(resolution - 1, centerCell.x + radiusCells); x += 1) {
      const nx = (x + 0.5) / resolution;
      const ny = (y + 0.5) / resolution;
      const plateDx = nx - 0.5;
      const plateDy = ny - 0.5;
      if (plateDx * plateDx + plateDy * plateDy > 0.25) continue;

      const dx = nx - center.x;
      const dy = ny - center.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = radius * radius;
      if (distSq > radiusSq) continue;

      const normalizedDistance = Math.sqrt(distSq) / radius;
      const weight = resolveKernelWeight(normalizedDistance, profile);
      if (weight <= 0.0005) continue;
      cells.push({ x, y, index: cellIndex(x, y, resolution), weight });
      weightTotal += weight;
    }
  }

  if (weightTotal <= 0) return [];
  return cells.map((cell) => ({ ...cell, weight: cell.weight / weightTotal }));
}

function resolveKernelWeight(
  normalizedDistance: number,
  profile: 'pickup' | 'deposit',
): number {
  if (profile === 'pickup') {
    return Math.exp(-(normalizedDistance * normalizedDistance) / 0.14);
  }

  const centeredRing =
    Math.exp(-((normalizedDistance - SIM.depositRingCenter) ** 2) / (2 * SIM.depositRingWidth ** 2)) * 1.18;
  const shoulder = Math.exp(-((normalizedDistance - 0.5) ** 2) / (2 * 0.14 ** 2)) * 0.1;
  const centerSuppression = normalizedDistance < 0.28 ? 0.012 : 1;
  return (centeredRing + shoulder) * centerSuppression;
}

function boundsFromCells(cells: WeightedCell[]): Rect | null {
  if (cells.length === 0) return null;

  let minX = cells[0].x;
  let minY = cells[0].y;
  let maxX = cells[0].x;
  let maxY = cells[0].y;

  for (let index = 1; index < cells.length; index += 1) {
    minX = Math.min(minX, cells[index].x);
    minY = Math.min(minY, cells[index].y);
    maxX = Math.max(maxX, cells[index].x);
    maxY = Math.max(maxY, cells[index].y);
  }

  return createRect(minX, minY, maxX, maxY);
}

function syncLedger(snapshot: TransferSnapshot): void {
  for (let speciesIndex = 0; speciesIndex < snapshot.ledger.sectorTotals.length; speciesIndex += 1) {
    let sectorTotal = 0;
    for (const sector of snapshot.loop.sectors) {
      sectorTotal += sector.load[speciesIndex] + sector.captured[speciesIndex];
    }
    snapshot.ledger.sectorTotals[speciesIndex] = sectorTotal;
    snapshot.ledger.filmTotals[speciesIndex] = totalFloat32(snapshot.film.filmMass[speciesIndex]);
  }
}

function logTransferSummary(report: StrokeDiagnostics, snapshot: TransferSnapshot): void {
  const conservation = snapshot.ledger.loaded.map((loaded, index) => {
    if (loaded <= 0) return 100;
    const current =
      snapshot.ledger.filmTotals[index] +
      snapshot.ledger.sectorTotals[index] +
      snapshot.ledger.discarded[index];
    return (current / loaded) * 100;
  });

  console.log(
    `[transfer] stroke=${report.strokeIndex} deposited=${report.deposited.map((value) => value.toFixed(3)).join(', ')} ` +
      `picked=${report.pickedUp.map((value) => value.toFixed(3)).join(', ')} ` +
      `net=${report.net.map((value) => value.toFixed(3)).join(', ')} ` +
      `dirtyArea=${report.dirtyArea} ` +
      `conservation=${conservation.map((value) => `${value.toFixed(1)}%`).join(', ')}`,
  );
}
