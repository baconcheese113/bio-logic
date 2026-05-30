<script lang="ts">
  import {
    boardColumns,
    createInitialGameState,
    getBaseCellStats,
    instruments,
    partLibrary,
    roleProfiles,
    type CellState,
    type DesignedPlasmid,
    type GameState,
    type InstrumentId,
    type PartId,
    type PartType,
    type PlasmidEffect,
    type PendingPlay,
    type RoleId,
    type ScenarioId,
    type ScoreEvent,
    type SurfaceMarker,
    type TileState,
  } from './game-data';
  import microscopeUrl from '../../assets/biorender/svg-happy-path/microscope--binocular-light-microscope-with-slide-1.svg';
  import flowCytometerUrl from '../../assets/biorender/svg-happy-path/flow-cytometer--flow-cytometer-thermo-attune-1.svg';
  import pcrUrl from '../../assets/biorender/svg-happy-path/pcr-machine--pcr-machine-1.svg';
  import elisaUrl from '../../assets/biorender/svg-happy-path/elisa-plate--open-reservoir-plate-96-well-top-view-2.svg';
  import plasmidUrl from '../../assets/biorender/svg-happy-path/plasmid--dna-circular-pill-shaped-1.svg';

  type MoveId = InstrumentId | `plasmid:${string}`;
  type PlaybackEvent = { play: PendingPlay; message: string };
  type ScoreHighlight = 'organ' | 'remission' | null;

  interface MoveView {
    id: MoveId;
    name: string;
    label: string;
    icon: string;
    role: RoleId;
    cost: number;
    charge: number;
  }

  interface PlasmidValidation {
    valid: boolean;
    name: string;
    behavior: string;
    effect: PlasmidEffect;
    reason: string;
  }

  const moveAssetUrls: Partial<Record<string, string>> = {
    scan: microscopeUrl,
    'flow-cytometer': flowCytometerUrl,
    pcr: pcrUrl,
    elisa: elisaUrl,
    plasmid: plasmidUrl,
  };

  const actionLimit = 3;
  const startingTumorCount = 3;
  const roundLimit = 20;
  const immuneSearchPattern = ['4-3', '5-4', '3-4', '6-3', '2-2', '5-2', '1-5', '6-5'];
  const partCategories = ['promoter', 'logic', 'gene', 'control', 'terminator'] as const satisfies readonly PartType[];
  const cancerImmuneStartingHand: MoveId[] = ['microscope', 'flow-cytometer', 'pcr'];
  const viralImmuneStartingHand: MoveId[] = ['microscope', 'flow-cytometer', 'pcr'];
  const cancerPathologyStartingHand: MoveId[] = [
    'plasmid:cancer-proliferation-program',
    'plasmid:cancer-evasion-program',
    'plasmid:cancer-invasion-program',
  ];
  const viralPathologyStartingHand: MoveId[] = ['plasmid:viral-replication-program', 'plasmid:viral-mimic-program', 'elisa'];
  const cancerImmuneStartingDeck: MoveId[] = [
    'microscope',
    'flow-cytometer',
    'pcr',
    'elisa',
    'flow-cytometer',
    'flow-cytometer',
    'microscope',
    'pcr',
    'elisa',
    'microscope',
    'flow-cytometer',
    'flow-cytometer',
    'pcr',
    'flow-cytometer',
    'microscope',
    'elisa',
  ];
  const viralImmuneStartingDeck: MoveId[] = [
    'microscope',
    'flow-cytometer',
    'pcr',
    'flow-cytometer',
    'microscope',
    'flow-cytometer',
    'elisa',
    'pcr',
  ];
  const cancerPathologyStartingDeck: MoveId[] = [
    'plasmid:cancer-angiogenesis-program',
    'plasmid:cancer-proliferation-program',
    'plasmid:cancer-evasion-program',
    'plasmid:cancer-invasion-program',
    'elisa',
    'pcr',
  ];
  const viralPathologyStartingDeck: MoveId[] = [
    'plasmid:viral-replication-program',
    'plasmid:viral-mimic-program',
    'elisa',
    'pcr',
  ];

  let game: GameState = $state(createInitialGameState());
  let playerRole: RoleId | null = $state(null);
  let selectedScenario: ScenarioId = $state('cancer');
  let hand: MoveId[] = $state([]);
  let deck: MoveId[] = $state([]);
  let draggedMoveId: MoveId | null = $state(null);
  let draggedQueuedId: number | null = $state(null);
  let playbackQueue: PlaybackEvent[] = $state([]);
  let playbackIndex = $state(0);
  let plasmidEditorOpen = $state(false);
  let turnOverlay = $state('');
  let discoveredParts: PartId[] = $state(['hypoxia-promoter', 'tumor-marker-sensor', 'and-gate', 'il2-signal', 'generic-terminator']);
  let draftValidated = $state(false);
  let aiScanCursor = $state(0);
  let selectedPartType: PartType = $state('promoter');
  let scoreHighlight: ScoreHighlight = $state(null);
  let idSequence = 0;

  const playerProfile = $derived(roleProfiles.find((role) => role.id === playerRole) ?? roleProfiles[1]);
  const opponentRole = $derived(playerRole === 'immune' ? 'pathology' : 'immune');
  const opponentProfile = $derived(roleProfiles.find((role) => role.id === opponentRole) ?? roleProfiles[0]);
  const isPlayerTurn = $derived(playerRole === game.activeRole);
  const selectedTile = $derived(game.tiles.find((tile) => tile.id === game.selectedTileId) ?? game.tiles[0]);
  const selectedTileCells = $derived(game.cells.filter((cell) => cell.x === selectedTile.x && cell.y === selectedTile.y));
  const selectedParts = $derived(partLibrary.filter((part) => game.selectedParts.includes(part.id)));
  const availableParts = $derived(partLibrary.filter((part) => getPartCount(part.id) > 0));
  const visibleParts = $derived(partLibrary.filter((part) => part.type === selectedPartType));
  const confirmedThreatCount = $derived(game.cells.filter((cell) => isThreatCell(cell) && cell.confirmed).length);
  const remainingThreatCount = $derived(game.cells.filter((cell) => isThreatCell(cell)).length);
  const clearedThreatCount = $derived(Math.max(0, startingTumorCount - Math.min(startingTumorCount, remainingThreatCount)));
  const remissionProgress = $derived(Math.min(100, Math.max(0, game.remissionScore * 10 + confirmedThreatCount * 8 - game.autoimmuneDamage * 10)));
  const pathologyProgress = $derived(Math.min(100, Math.round((game.organDamage / 12) * 100)));
  const yourProgress = $derived(playerRole === 'pathology' ? pathologyProgress : remissionProgress);
  const opponentProgress = $derived(playerRole === 'pathology' ? remissionProgress : pathologyProgress);
  const plasmidValidation = $derived.by(() => validatePlasmid(game.selectedParts));
  const plasmidBehavior = $derived(plasmidValidation.behavior);
  const currentPlayback = $derived(playbackQueue[playbackIndex] ?? null);
  const gameOutcome = $derived.by(() => getOutcome());
  const phaseName = $derived(getPhaseName());
  const canOpenPlasmidEditor = $derived(isPlayerTurn && game.actionsRemaining > 0 && availableParts.length >= 2 && playbackQueue.length === 0);
  const canAffordDraft = $derived(canAffordParts(game.selectedParts));
  const objectiveDetail = $derived(
    `Organ Damage ${game.organDamage}/12. Remission source events ${game.remissionScore}. Confirmed threats ${confirmedThreatCount}.`
  );
  const recentScoreEvents = $derived(game.scoreEvents.slice(0, 5));

  function chooseRole(role: RoleId) {
    game = createInitialGameState(selectedScenario);
    playerRole = role;
    game.activeRole = role;
    setKnownForRole(role);
    game.selectedParts = getStarterParts(selectedScenario);
    hand = getStartingHand(role, selectedScenario);
    deck = getStartingDeck(role, selectedScenario);
    playbackQueue = [];
    playbackIndex = 0;
    plasmidEditorOpen = false;
    draftValidated = false;
    discoveredParts = getStarterDiscoveries(selectedScenario);
    aiScanCursor = 0;
    showTurnOverlay(`${roleProfiles.find((item) => item.id === role)?.name ?? 'Player'} Turn 1`);
  }

  function getStartingHand(role: RoleId, scenario: ScenarioId): MoveId[] {
    if (role === 'immune') return scenario === 'viral' ? [...viralImmuneStartingHand] : [...cancerImmuneStartingHand];
    return scenario === 'viral' ? [...viralPathologyStartingHand] : [...cancerPathologyStartingHand];
  }

  function getStartingDeck(role: RoleId, scenario: ScenarioId): MoveId[] {
    if (role === 'immune') return scenario === 'viral' ? [...viralImmuneStartingDeck] : [...cancerImmuneStartingDeck];
    return scenario === 'viral' ? [...viralPathologyStartingDeck] : [...cancerPathologyStartingDeck];
  }

  function getStarterParts(scenario: ScenarioId): PartId[] {
    return scenario === 'viral'
      ? ['stress-promoter', 'and-gate', 'viral-sensor', 'il2-signal', 'generic-terminator']
      : ['hypoxia-promoter', 'and-gate', 'tumor-marker-sensor', 'il2-signal', 'generic-terminator'];
  }

  function getStarterDiscoveries(scenario: ScenarioId): PartId[] {
    return scenario === 'viral'
      ? ['stress-promoter', 'and-gate', 'viral-sensor', 'il2-signal', 'generic-terminator']
      : ['hypoxia-promoter', 'tumor-marker-sensor', 'and-gate', 'il2-signal', 'generic-terminator'];
  }

  function isThreatCell(cell: CellState): boolean {
    return cell.kind === 'tumor' || cell.kind === 'infected' || cell.kind === 'virion';
  }

  function showTurnOverlay(text: string) {
    turnOverlay = text;
    window.setTimeout(() => {
      if (turnOverlay === text) turnOverlay = '';
    }, 1000);
  }

  function setKnownForRole(role: RoleId) {
    for (const cell of game.cells) {
      const known = cell.role === role;
      if (!known) continue;
      cell.hidden = false;
      cell.morphologyKnown = true;
      cell.markersKnown = true;
      cell.confirmed = true;
    }
  }

  function startMoveDrag(event: DragEvent, moveId: MoveId) {
    draggedMoveId = moveId;
    event.dataTransfer?.setData('text/plain', `move:${moveId}`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  function startQueuedDrag(event: DragEvent, pendingId: number) {
    draggedQueuedId = pendingId;
    event.dataTransfer?.setData('text/plain', `queued:${pendingId}`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  function clearDrag() {
    draggedMoveId = null;
    draggedQueuedId = null;
  }

  function allowTileDrop(event: DragEvent, tile: TileState) {
    if (draggedMoveId && isValidMoveTarget(draggedMoveId, tile)) event.preventDefault();
  }

  function dropMoveOnTile(event: DragEvent, tile: TileState) {
    event.preventDefault();
    if (!draggedMoveId || !isValidMoveTarget(draggedMoveId, tile)) {
      clearDrag();
      return;
    }

    commitMove(draggedMoveId, tile);
    clearDrag();
  }

  function allowTrayDrop(event: DragEvent) {
    if (draggedQueuedId !== null) event.preventDefault();
  }

  function dropQueuedToTray(event: DragEvent) {
    event.preventDefault();
    if (draggedQueuedId === null) return;
    cancelQueuedMove(draggedQueuedId);
    clearDrag();
  }

  function commitMove(moveId: MoveId, tile: TileState) {
    const move = getMove(moveId);
    if (!move || !canPlayMove(moveId)) return;

    const pendingPlay: PendingPlay = {
      id: nextNumericId(),
      role: game.activeRole,
      instrumentId: isInstrumentId(moveId) ? moveId : undefined,
      plasmidId: getPlasmidId(moveId),
      name: move.name,
      targetTileId: tile.id,
      remainingTurns: move.charge,
      result: move.label,
    };

    game.pending.push(pendingPlay);
    game.actionsRemaining -= move.cost;
    if (moveId.startsWith('plasmid:')) game.vectorSupply = Math.max(0, game.vectorSupply - 1);
    hand = removeOneMove(hand, moveId);
    game.log.unshift(`${move.label} queued.`);
  }

  function cancelQueuedMove(pendingId: number) {
    const pending = game.pending.find((play) => play.id === pendingId);
    if (!pending || pending.role !== game.activeRole || !isPlayerTurn) return;

    const moveId = pending.instrumentId ?? (pending.plasmidId ? (`plasmid:${pending.plasmidId}` as MoveId) : undefined);
    const move = moveId ? getMove(moveId) : null;
    game.pending = game.pending.filter((play) => play.id !== pendingId);
    if (moveId) hand = [...hand, moveId];
    if (move) game.actionsRemaining = Math.min(actionLimit, game.actionsRemaining + move.cost);
    game.log.unshift(`${pending.name} returned to hand.`);
  }

  function drawCard() {
    if (!isPlayerTurn || game.actionsRemaining <= 0) return;
    if (deck.length === 0) {
      recycleInstrumentDeck();
      if (deck.length === 0) return;
    }
    const [nextCard, ...rest] = deck;
    if (!nextCard) return;
    hand = [...hand, nextCard];
    deck = rest;
    game.actionsRemaining -= 1;
  }

  function openPlasmidEditor() {
    if (!canOpenPlasmidEditor) return;
    game.actionsRemaining -= 1;
    plasmidEditorOpen = true;
    draftValidated = false;
  }

  function endPlayerTurn() {
    if (playbackQueue.length > 0 || gameOutcome) return;
    collectAndPlayResolved(() => runOpponentTurn());
  }

  function runOpponentTurn() {
    game.activeRole = opponentRole;
    game.actionsRemaining = actionLimit;
    showTurnOverlay(`${opponentProfile.name} Turn ${game.turn}`);
    queueOpponentMove();
    window.setTimeout(() => {
      collectAndPlayResolved(() => {
        game.activeRole = playerRole ?? 'immune';
        game.actionsRemaining = actionLimit;
        game.vectorSupply = Math.min(3, game.vectorSupply + 1);
        game.turn += 1;
        drawStartOfTurnCard();
        showTurnOverlay(`${playerProfile.name} Turn ${game.turn}`);
      });
    }, 700);
  }

  function queueOpponentMove() {
    if (opponentRole === 'pathology' && game.turn % 2 !== 0) return;
    const decision = chooseOpponentDecision();
    if (!decision) return;
    const move = getMove(decision.moveId);
    if (!move) return;
    game.pending.push({
      id: nextNumericId(),
      role: opponentRole,
      instrumentId: isInstrumentId(decision.moveId) ? decision.moveId : undefined,
      plasmidId: getPlasmidId(decision.moveId),
      name: move.name,
      targetTileId: decision.targetTileId,
      remainingTurns: move.charge,
      result: move.label,
    });
  }

  function chooseOpponentDecision(): { moveId: MoveId; targetTileId: string } | null {
    if (opponentRole === 'immune') {
      const searchTileId = getNextAiScanTarget([]);
      if (searchTileId) return { moveId: game.turn % 3 === 0 ? 'pcr' : game.turn % 2 === 0 ? 'flow-cytometer' : 'microscope', targetTileId: searchTileId };
      return { moveId: 'elisa', targetTileId: '1-1' };
    }

    if (game.scenario === 'viral') {
      const infected = game.cells.find((cell) => cell.kind === 'infected');
      if (infected) return { moveId: 'plasmid:viral-replication-program', targetTileId: `${infected.x}-${infected.y}` };
      return { moveId: 'plasmid:viral-mimic-program', targetTileId: '4-3' };
    }

    const tumor = game.cells.find((cell) => cell.kind === 'tumor' && cell.markersKnown) ?? game.cells.find((cell) => cell.kind === 'tumor');
    if (!tumor) return null;
    const targetTileId = `${tumor.x}-${tumor.y}`;
    if (game.turn % 4 === 0) return { moveId: 'plasmid:cancer-angiogenesis-program', targetTileId };
    if (game.turn % 3 === 0) return { moveId: 'plasmid:cancer-invasion-program', targetTileId };
    if (tumor.markersKnown) return { moveId: 'plasmid:cancer-evasion-program', targetTileId };
    return { moveId: 'plasmid:cancer-proliferation-program', targetTileId };
  }

  function getNextAiScanTarget(plannedTargets: string[]): string | null {
    for (let index = 0; index < immuneSearchPattern.length; index += 1) {
      const tileId = immuneSearchPattern[(aiScanCursor + index) % immuneSearchPattern.length];
      const alreadyRevealed = game.cells.some((cell) => isThreatCell(cell) && cell.confirmed && `${cell.x}-${cell.y}` === tileId);
      if (!plannedTargets.includes(tileId) && !alreadyRevealed) {
        aiScanCursor = (aiScanCursor + index + 1) % immuneSearchPattern.length;
        return tileId;
      }
    }

    return null;
  }

  function collectAndPlayResolved(done: () => void) {
    const resolved: PendingPlay[] = [];
    for (const play of game.pending) {
      play.remainingTurns -= 1;
      if (play.remainingTurns <= 0) resolved.push(play);
    }
    game.pending = game.pending.filter((play) => play.remainingTurns > 0);

    if (resolved.length === 0) {
      runCellPrograms();
      done();
      return;
    }

    playbackQueue = resolved.map((play) => ({ play, message: getPlaybackMessage(play) }));
    playbackIndex = 0;
    playNextResolved(done);
  }

  function playNextResolved(done: () => void) {
    const event = playbackQueue[playbackIndex];
    if (!event) {
      playbackQueue = [];
      playbackIndex = 0;
      done();
      return;
    }

    applyPlay(event.play);
    window.setTimeout(() => {
      if (playbackIndex < playbackQueue.length - 1) {
        playbackIndex += 1;
        playNextResolved(done);
        return;
      }

      playbackQueue = [];
      playbackIndex = 0;
      runCellPrograms();
      done();
    }, 1500);
  }

  function drawStartOfTurnCard() {
    if (hand.length >= 5) return;
    if (deck.length === 0) recycleInstrumentDeck();
    if (deck.length === 0) return;
    const [nextCard, ...rest] = deck;
    if (!nextCard) return;
    hand = [...hand, nextCard];
    deck = rest;
  }

  function applyPlay(play: PendingPlay) {
    clearTileEffects();

    if (play.instrumentId === 'microscope') {
      revealMorphology(play.targetTileId, 1);
      markTilesNear(play.targetTileId, 1, 'morphology');
      game.immuneResource += 1;
      discoverPart('hypoxia-promoter');
      discoverPart('stress-promoter');
      return;
    }

    if (play.instrumentId === 'flow-cytometer') {
      revealMarkers(play.targetTileId, 1, false);
      markTilesNear(play.targetTileId, 1, 'marker-read');
      game.immuneResource += 1;
      discoverPart('tumor-marker-sensor');
      return;
    }

    if (play.instrumentId === 'pcr') {
      confirmGenetics(play.targetTileId, 1);
      harvestDebris(play.targetTileId);
      markTilesNear(play.targetTileId, 1, 'genetic-confirm');
      discoverPart('cd47-silencer');
      discoverPart('marker-restorer');
      discoverPart('not-gate');
      return;
    }

    if (play.instrumentId === 'elisa') {
      revealChemistry(play.targetTileId, 1);
      markTilesNear(play.targetTileId, 1, 'cytokine');
      discoverPart('self-marker-sensor');
      discoverPart('or-gate');
      discoverPart('vector-stabilizer');
      return;
    }

    if (play.plasmidId) {
      const tile = game.tiles.find((item) => item.id === play.targetTileId);
      if (!tile) return;
      const plasmid = game.plasmids.find((item) => item.id === play.plasmidId);
      if (!plasmid) return;
      tile.recentEffect = 'plasmid';
      const targetCell = game.cells.find((cell) => cell.x === tile.x && cell.y === tile.y && cell.role === play.role);
      if (!targetCell) return;

      if (!plasmid.valid) {
        targetCell.expression = 0;
        tile.recentEffect = 'damage';
        damageTile(tile.id, 1, `${plasmid.name} misexpression`, play.role);
        game.log.unshift(`${plasmid.name} misexpressed. The target cell lost function.`);
        return;
      }

      targetCell.plasmid = plasmid.name;
      targetCell.plasmidEffect = plasmid.effect;
      targetCell.expression = (targetCell.expression ?? 0) + (plasmid.validated ? 2 : 1);
      applyPlasmidEffect(targetCell, tile, plasmid);
    }
  }

  function savePlasmid() {
    if (!isPlayerTurn || game.selectedParts.length < 2 || !canAffordDraft) return;
    const validation = plasmidValidation;
    const plasmid: DesignedPlasmid = {
      id: nextEntityId('plasmid'),
      name: draftValidated ? validation.name : `Unvalidated ${validation.name}`,
      role: game.activeRole,
      parts: [...game.selectedParts],
      behavior: validation.behavior,
      effect: validation.effect,
      valid: validation.valid,
      validated: draftValidated && validation.valid,
    };
    consumeParts(game.selectedParts);
    game.plasmids.push(plasmid);
    const moveId: MoveId = `plasmid:${plasmid.id}`;
    hand = [...hand, moveId];
    plasmidEditorOpen = false;
    draftValidated = false;
    game.log.unshift(`${plasmid.name} added to hand: ${plasmid.behavior}`);
  }

  function validateDraft() {
    if (!isPlayerTurn || draftValidated || game.actionsRemaining <= 0) return;
    game.actionsRemaining -= 1;
    draftValidated = true;
    game.log.unshift(plasmidValidation.valid ? `Validated: ${plasmidValidation.behavior}` : `Invalid plasmid: ${plasmidValidation.reason}`);
  }

  function togglePart(partId: PartId) {
    if (getPartCount(partId) <= 0) return;
    draftValidated = false;
    if (game.selectedParts.includes(partId)) {
      game.selectedParts = game.selectedParts.filter((id) => id !== partId);
      return;
    }

    if (game.selectedParts.length >= 7) return;
    game.selectedParts = [...game.selectedParts, partId];
  }

  function resetPrototype() {
    game = createInitialGameState(selectedScenario);
    playerRole = null;
    hand = [];
    deck = [];
    draggedMoveId = null;
    draggedQueuedId = null;
    playbackQueue = [];
    playbackIndex = 0;
    plasmidEditorOpen = false;
    turnOverlay = '';
    draftValidated = false;
    discoveredParts = getStarterDiscoveries(selectedScenario);
    aiScanCursor = 0;
  }

  function recycleInstrumentDeck() {
    if (!playerRole) return;
    const fallback: MoveId[] = playerRole === 'immune'
      ? ['microscope', 'flow-cytometer', 'pcr', 'elisa', 'microscope', 'flow-cytometer']
      : ['elisa', 'pcr', ...getStartingDeck(playerRole, selectedScenario).filter((moveId) => moveId.startsWith('plasmid:'))];
    deck = fallback;
    game.log.unshift('Deck recycled into reusable instruments and known plasmid programs.');
  }

  function removeOneMove(source: MoveId[], moveId: MoveId): MoveId[] {
    const index = source.indexOf(moveId);
    if (index < 0) return source;
    return [...source.slice(0, index), ...source.slice(index + 1)];
  }

  function discoverPart(partId: PartId) {
    if (!discoveredParts.includes(partId)) discoveredParts = [...discoveredParts, partId];
    game.partInventory = { ...game.partInventory, [partId]: getPartCount(partId) + 1 };
  }

  function getPartCount(partId: PartId): number {
    return game.partInventory[partId] ?? 0;
  }

  function canAffordParts(partIds: PartId[]): boolean {
    const required: Partial<Record<PartId, number>> = {};
    for (const partId of partIds) required[partId] = (required[partId] ?? 0) + 1;
    return Object.entries(required).every(([partId, count]) => getPartCount(partId as PartId) >= count);
  }

  function consumeParts(partIds: PartId[]) {
    const next = { ...game.partInventory };
    for (const partId of partIds) next[partId] = Math.max(0, (next[partId] ?? 0) - 1);
    game.partInventory = next;
  }

  function getPlasmidId(moveId: MoveId): string | undefined {
    return moveId.startsWith('plasmid:') ? moveId.slice('plasmid:'.length) : undefined;
  }

  function nextEntityId(prefix: string): string {
    idSequence += 1;
    return `${prefix}-${game.turn}-${idSequence}`;
  }

  function nextNumericId(): number {
    idSequence += 1;
    return game.turn * 100_000 + idSequence;
  }

  function revealMorphology(tileId: string, range: number) {
    for (const tile of game.tiles) {
      if (tileDistance(tile, tileId) <= range) {
        tile.visible = true;
        tile.chemistryKnown = true;
      }
    }

    for (const cell of game.cells) {
      if (distanceToTile(cell, tileId) <= range) cell.morphologyKnown = true;
    }
  }

  function revealMarkers(tileId: string, range: number, forceConfirm: boolean) {
    for (const tile of game.tiles) {
      if (tileDistance(tile, tileId) <= range) tile.visible = true;
    }

    for (const cell of game.cells) {
      if (distanceToTile(cell, tileId) > range) continue;
      cell.markersKnown = true;
      if (forceConfirm || (isThreatCell(cell) && cell.markerVisible && (cell.marker === 'tumor' || cell.marker === 'viral'))) {
        cell.confirmed = true;
        cell.hidden = false;
        rememberMarker(cell.marker);
      }
    }
  }

  function confirmGenetics(tileId: string, range: number) {
    revealMorphology(tileId, range);
    revealMarkers(tileId, range, true);
    for (const cell of game.cells) {
      if (distanceToTile(cell, tileId) <= range && isThreatCell(cell)) {
        cell.confirmed = true;
        cell.hidden = false;
        rememberMarker(cell.marker);
      }
    }
  }

  function harvestDebris(tileId: string) {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (!tile) return;
    const debrisHere = game.debris.filter((debris) => Math.max(Math.abs(debris.x - tile.x), Math.abs(debris.y - tile.y)) <= 1);
    if (debrisHere.length === 0) return;
    for (const debris of debrisHere) {
      for (const partId of debris.parts) discoverPart(partId);
    }
    game.debris = game.debris.filter((debris) => !debrisHere.some((used) => used.id === debris.id));
    game.log.unshift(`PCR harvested ${debrisHere.length} debris sample${debrisHere.length === 1 ? '' : 's'} into part inventory.`);
  }

  function revealChemistry(tileId: string, range: number) {
    for (const tile of game.tiles) {
      if (tileDistance(tile, tileId) <= range) {
        tile.visible = true;
        tile.chemistryKnown = true;
        tile.inflammation = Math.min(3, tile.inflammation + 1);
      }
    }
  }

  function createImmuneCell(
    id: string,
    kind: Extract<CellState['kind'], 't-cell' | 'macrophage'>,
    x: number,
    y: number,
    plasmid?: string,
    plasmidEffect?: PlasmidEffect
  ): CellState {
    const stats = getBaseCellStats(kind);
    return {
      id,
      kind,
      role: 'immune',
      x,
      y,
      hidden: false,
      morphology: 'normal',
      marker: 'self',
      ...stats,
      markerVisible: true,
      morphologyKnown: true,
      markersKnown: true,
      confirmed: true,
      plasmid,
      plasmidEffect,
      expression: plasmid ? 1 : undefined,
    };
  }

  function createTumorCell(id: string, x: number, y: number): CellState {
    const stats = getBaseCellStats('tumor');
    return {
      id,
      kind: 'tumor',
      role: 'pathology',
      x,
      y,
      hidden: true,
      morphology: 'abnormal',
      marker: 'tumor',
      ...stats,
      markerVisible: true,
      morphologyKnown: false,
      markersKnown: false,
      confirmed: false,
    };
  }

  function createInfectedCell(id: string, x: number, y: number, viralLoad = 1): CellState {
    const stats = getBaseCellStats('infected');
    return {
      id,
      kind: 'infected',
      role: 'pathology',
      x,
      y,
      hidden: true,
      morphology: 'infected',
      marker: 'viral',
      ...stats,
      markerVisible: true,
      morphologyKnown: false,
      markersKnown: false,
      confirmed: false,
      viralLoad,
    };
  }

  function createVirion(id: string, x: number, y: number): CellState {
    const stats = getBaseCellStats('virion');
    return {
      id,
      kind: 'virion',
      role: 'pathology',
      x,
      y,
      hidden: true,
      morphology: 'infected',
      marker: 'viral',
      ...stats,
      markerVisible: true,
      morphologyKnown: false,
      markersKnown: false,
      confirmed: false,
      viralLoad: 1,
    };
  }

  function infectHostCell(tileId: string) {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (!tile) return;
    const host = game.cells.find((cell) => cell.x === tile.x && cell.y === tile.y && cell.kind === 'healthy');
    if (!host) return;
    host.kind = 'infected';
    host.role = 'pathology';
    host.hidden = true;
    host.morphology = 'infected';
    host.marker = 'viral';
    host.markerVisible = true;
    host.morphologyKnown = false;
    host.markersKnown = false;
    host.confirmed = false;
    host.viralLoad = 1;
    tile.recentEffect = 'infection';
  }

  function lyseInfectedCells(tileId: string) {
    const infected = game.cells.filter((cell) => cell.kind === 'infected' && distanceToTile(cell, tileId) <= 1);
    if (infected.length === 0) return;

    for (const cell of infected) {
      const tile = game.tiles.find((item) => item.x === cell.x && item.y === cell.y);
      if (tile) {
        tile.damage += 1;
        tile.recentEffect = 'lysis';
      }
      const targets = game.tiles.filter((item) => tile && tileDistance(item, tile.id) <= 1).slice(0, 3);
      for (const target of targets) game.cells.push(createVirion(nextEntityId(`virion-${target.id}`), target.x, target.y));
    }

    for (const cell of infected) {
      const tileId = `${cell.x}-${cell.y}`;
      killCell(cell, tileId, 'Infected host lysis', 'pathology');
      addScoreEvent('organ', 1, tileId, 'Infected host lysis', 'pathology');
    }
  }

  function rememberMarker(marker: SurfaceMarker) {
    if (marker === 'none' || game.immuneMemory.includes(marker)) return;
    game.immuneMemory = [...game.immuneMemory, marker];
    game.immuneResource += 1;
    if (marker === 'tumor') {
      discoverPart('apoptosis-payload');
      discoverPart('marker-restorer');
    }
    if (marker === 'viral') {
      discoverPart('viral-sensor');
      discoverPart('apoptosis-payload');
    }
  }

  function seedTumorNear(tile: TileState) {
    const source = game.cells.find((cell) => cell.kind === 'tumor' && distanceToTile(cell, tile.id) <= 1);
    const target = source ? findOpenAdjacentTile(source.x, source.y) : tile;
    if (!target) return;
    game.cells.push(createTumorCell(nextEntityId('tumor'), target.x, target.y));
  }

  function divideTumorNear(tileId: string) {
    const tumor = game.cells.find((cell) => cell.kind === 'tumor' && distanceToTile(cell, tileId) <= 1);
    if (!tumor) return;
    const target = findOpenAdjacentTile(tumor.x, tumor.y);
    if (!target) return;
    game.cells.push(createTumorCell(nextEntityId('tumor'), target.x, target.y));
    damageTile(`${tumor.x}-${tumor.y}`, 1);
  }

  function metastasizeFrom(tileId: string) {
    const source = game.cells.find((cell) => cell.kind === 'tumor' && distanceToTile(cell, tileId) <= 1);
    const vessel = game.tiles.find((tile) => tile.zone === 'vessel' && source && distanceToTile(source, tile.id) <= 1);
    const destination = [...game.tiles]
      .filter((tile) => tile.zone !== 'lymph' && tile.id !== vessel?.id && tileDistance(tile, tileId) > 2)
      .sort((a, b) => b.x + b.y - (a.x + a.y))[0];
    if (!source || !vessel || !destination) return;

    game.cells.push(createTumorCell(nextEntityId('metastasis'), destination.x, destination.y));
    vessel.recentEffect = 'metastasis';
    destination.recentEffect = 'metastasis';
    destination.damage += 1;
    addScoreEvent('organ', 2, destination.id, 'Metastatic seeding through vessel', 'pathology');
  }

  function applyPlasmidEffect(cell: CellState, tile: TileState, plasmid: DesignedPlasmid) {
    if (plasmid.effect === 'beacon') {
      tile.recentEffect = 'plasmid';
      tile.inflammation = Math.min(3, tile.inflammation + 1);
      game.immuneResource += cell.role === 'immune' ? 1 : 0;
    }

    if (plasmid.effect === 'marker-restorer') {
      cell.markerVisible = true;
      cell.markersKnown = true;
      if (isThreatCell(cell)) cell.confirmed = true;
    }

    if (plasmid.effect === 'decoy-shedder') {
      cell.markerVisible = false;
      cell.markersKnown = false;
      cell.confirmed = false;
      tile.recentEffect = 'decoy';
    }

    if (plasmid.effect === 'matrix-protease') {
      tile.matrixOpen = true;
      tile.recentEffect = 'matrix-break';
    }

    if (plasmid.effect === 'proliferation') {
      tile.recentEffect = 'proliferation';
      if (cell.kind === 'tumor') divideTumorNear(tile.id);
    }

    if (plasmid.effect === 'angiogenesis') {
      tile.recentEffect = 'vessel-growth';
      growVesselToward(tile.id);
    }

    if (plasmid.effect === 'viral-replication' && cell.kind === 'infected') {
      cell.viralLoad = (cell.viralLoad ?? 1) + 1;
      tile.recentEffect = 'infection';
    }

    if (plasmid.effect === 'kill-switch' && isThreatCell(cell)) {
      killCell(cell, tile.id, `${plasmid.name} precision kill`, cell.role === 'immune' ? 'immune' : 'pathology');
      tile.recentEffect = 'damage';
    }
  }

  function growVesselToward(tileId: string) {
    const target = game.tiles.find((tile) => tile.id === tileId);
    if (!target) return;
    const candidates = game.tiles
      .filter((tile) => tile.zone === 'matrix' && tileDistance(tile, tileId) <= 1)
      .sort((a, b) => Math.abs(a.x - target.x) + Math.abs(a.y - target.y) - (Math.abs(b.x - target.x) + Math.abs(b.y - target.y)));
    const sprout = candidates[0] ?? target;
    sprout.zone = 'vessel';
    sprout.visible = true;
    sprout.recentEffect = 'vessel-growth';
    damageTile(target.id, 1, 'Angiogenic vessel stress', 'pathology');
  }

  function findOpenAdjacentTile(x: number, y: number): TileState | null {
    const occupied = new Set(game.cells.map((cell) => `${cell.x}-${cell.y}`));
    return (
      game.tiles.find((tile) => {
        const adjacent = Math.max(Math.abs(tile.x - x), Math.abs(tile.y - y)) === 1;
        const permeable = tile.zone !== 'matrix' || tile.matrixOpen;
        return adjacent && permeable && !occupied.has(tile.id);
      }) ?? null
    );
  }

  function runCellPrograms() {
    if (!playerRole) return;
    for (const tile of game.tiles) {
      if (tile.inflammation > 0) tile.inflammation = Math.max(0, tile.inflammation - 0.25);
    }

    moveImmuneCells();
    resolveInnateCombat();
    expressTumorPrograms();
    expressViralPrograms();
  }

  function moveImmuneCells() {
    const confirmedTumors = game.cells.filter((cell) => cell.kind === 'tumor' && cell.confirmed);
    const confirmedViral = game.cells.filter((cell) => (cell.kind === 'infected' || cell.kind === 'virion') && cell.confirmed);
    const targets = game.scenario === 'viral' ? confirmedViral : confirmedTumors;
    if (targets.length === 0) return;

    for (const cell of game.cells) {
      if (cell.role !== 'immune') continue;
      const steps = getEffectiveMovement(cell);
      if (steps <= 0) continue;
      const target = [...targets].sort((a, b) => Math.abs(a.x - cell.x) + Math.abs(a.y - cell.y) - (Math.abs(b.x - cell.x) + Math.abs(b.y - cell.y)))[0];
      if (!target) continue;
      for (let step = 0; step < steps; step += 1) stepCellToward(cell, target.x, target.y);
    }
  }

  function resolveInnateCombat() {
    for (const cell of [...game.cells]) {
      if (cell.role !== 'immune') continue;
      const attack = getEffectiveAttack(cell);
      if (attack <= 0) continue;
      const target = game.cells.find((candidate) => isThreatCell(candidate) && candidate.confirmed && distanceToTile(candidate, `${cell.x}-${cell.y}`) <= 1);
      if (!target) continue;
      target.health -= attack + (cell.plasmidEffect === 'kill-switch' ? 1 : 0);
      const tileId = `${target.x}-${target.y}`;
      const tile = game.tiles.find((item) => item.id === tileId);
      if (tile) tile.recentEffect = 'damage';
      game.log.unshift(`${cell.kind} attacked confirmed ${target.kind} at ${tileId}.`);
      if (target.health <= 0) killCell(target, tileId, `${cell.kind} innate clearance`, 'immune');
    }
  }

  function getEffectiveMovement(cell: CellState): number {
    const tile = game.tiles.find((item) => item.x === cell.x && item.y === cell.y);
    if (cell.role === 'immune' && tile?.environment === 'hypoxic') return Math.max(0, cell.movement - 1);
    return cell.movement;
  }

  function getEffectiveAttack(cell: CellState): number {
    const tile = game.tiles.find((item) => item.x === cell.x && item.y === cell.y);
    if (cell.role === 'immune' && tile?.environment === 'hypoxic') return Math.max(0, cell.attack - 1);
    return cell.attack;
  }

  function expressTumorPrograms() {
    for (const cell of [...game.cells]) {
      if (cell.kind !== 'tumor') continue;
      const tile = game.tiles.find((item) => item.x === cell.x && item.y === cell.y);
      if (!tile) continue;

      if (cell.plasmidEffect === 'matrix-protease') {
        tile.matrixOpen = true;
        tile.recentEffect = 'matrix-break';
      }

      if (cell.plasmidEffect === 'proliferation' && game.turn % 2 === 0) divideTumorNear(tile.id);

      if (cell.plasmidEffect === 'angiogenesis' && tile.environment === 'hypoxic' && game.turn % 2 === 0) growVesselToward(tile.id);

      if (tile.environment === 'hypoxic' || tile.environment === 'acidic') {
        cell.markerVisible = false;
      }

      if (game.turn % 4 === 0 && tile.zone === 'organ') divideTumorNear(tile.id);
    }
  }

  function expressViralPrograms() {
    if (game.scenario !== 'viral') return;

    for (const cell of [...game.cells]) {
      if (cell.kind === 'infected') {
        cell.viralLoad = (cell.viralLoad ?? 1) + (cell.plasmidEffect === 'viral-replication' ? 2 : 1);
        const tile = game.tiles.find((item) => item.x === cell.x && item.y === cell.y);
        if (tile?.zone === 'organ') damageTile(tile.id, 0.25, 'Viral hijacking of host tissue', 'pathology');
        if (cell.viralLoad >= 4) lyseInfectedCells(`${cell.x}-${cell.y}`);
      }

      if (cell.kind === 'virion' && game.turn % 2 === 0) {
        const host = findAdjacentHealthyCell(cell.x, cell.y);
        if (host) {
          infectHostCell(`${host.x}-${host.y}`);
          game.cells = game.cells.filter((item) => item.id !== cell.id);
        }
      }
    }
  }

  function findAdjacentHealthyCell(x: number, y: number): CellState | undefined {
    return game.cells.find((cell) => cell.kind === 'healthy' && Math.max(Math.abs(cell.x - x), Math.abs(cell.y - y)) <= 1);
  }

  function stepCellToward(cell: CellState, targetX: number, targetY: number) {
    const nextX = cell.x + Math.sign(targetX - cell.x);
    const nextY = cell.y + Math.sign(targetY - cell.y);
    const targetTile = game.tiles.find((tile) => tile.x === nextX && tile.y === nextY);
    if (!targetTile || (targetTile.zone === 'matrix' && !targetTile.matrixOpen)) return;
    cell.x = nextX;
    cell.y = nextY;
  }

  function markTilesNear(tileId: string, range: number, effect: NonNullable<TileState['recentEffect']>) {
    for (const tile of game.tiles) {
      if (tileDistance(tile, tileId) <= range) tile.recentEffect = effect;
    }
  }

  function clearTileEffects() {
    for (const tile of game.tiles) {
      tile.recentEffect = undefined;
    }
  }

  function adjustResource(role: RoleId, amount: number) {
    if (role === 'immune') {
      game.immuneResource = Math.max(0, game.immuneResource + amount);
      return;
    }
    game.pathologyResource = Math.max(0, game.pathologyResource + amount);
  }

  function damageTile(tileId: string, amount: number, cause = 'Tissue damage', role: RoleId | 'system' = 'system') {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (!tile) return;
    tile.damage += amount;
    if (tile.zone === 'organ') addScoreEvent('organ', amount, tileId, cause, role);
  }

  function addScoreEvent(kind: 'organ' | 'remission' | 'autoimmune', amount: number, tileId: string, cause: string, role: RoleId | 'system') {
    const scoreEvent = { id: nextNumericId(), kind, amount, tileId, cause, turn: game.turn, role };
    game.scoreEvents = [scoreEvent, ...game.scoreEvents].slice(0, 24);
    if (kind === 'organ') game.organDamage = Math.min(12, game.organDamage + amount);
    if (kind === 'remission') game.remissionScore += amount;
    if (kind === 'autoimmune') game.autoimmuneDamage += amount;
    const tile = game.tiles.find((item) => item.id === tileId);
    if (tile) tile.recentEffect = kind === 'organ' ? 'damage' : kind === 'remission' ? 'scan' : 'collateral';
    game.log.unshift(`${kind}: +${amount} from ${cause} at ${tileId}.`);
  }

  function killCell(cell: CellState, tileId: string, cause: string, role: RoleId | 'system') {
    game.cells = game.cells.filter((item) => item.id !== cell.id);
    game.debris = [
      ...game.debris,
      {
        id: nextEntityId(`debris-${cell.id}`),
        x: cell.x,
        y: cell.y,
        source: cell.kind,
        parts: getDebrisParts(cell),
      },
    ];
    if (isThreatCell(cell) && role === 'immune') addScoreEvent('remission', 2, tileId, cause, role);
  }

  function getDebrisParts(cell: CellState): PartId[] {
    if (cell.kind === 'tumor') return ['tumor-marker-sensor', 'apoptosis-payload', 'marker-restorer'];
    if (cell.kind === 'infected' || cell.kind === 'virion') return ['viral-sensor', 'apoptosis-payload', 'stress-promoter'];
    if (cell.kind === 'healthy') return ['self-marker-sensor', 'generic-terminator'];
    return ['motility-program', 'generic-terminator'];
  }

  function distanceToTile(cell: CellState, tileId: string): number {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (!tile) return Number.POSITIVE_INFINITY;
    return Math.max(Math.abs(cell.x - tile.x), Math.abs(cell.y - tile.y));
  }

  function tileDistance(tile: TileState, targetTileId: string): number {
    const target = game.tiles.find((item) => item.id === targetTileId);
    if (!target) return Number.POSITIVE_INFINITY;
    return Math.max(Math.abs(tile.x - target.x), Math.abs(tile.y - target.y));
  }

  function canPlayMove(moveId: MoveId): boolean {
    const move = getMove(moveId);
    const hasVector = !moveId.startsWith('plasmid:') || game.vectorSupply > 0;
    return Boolean(move && hasVector && isPlayerTurn && playbackQueue.length === 0 && game.actionsRemaining >= move.cost && hand.includes(moveId));
  }

  function isValidMoveTarget(moveId: MoveId, tile: TileState): boolean {
    if (!canPlayMove(moveId)) return false;
    if (moveId === 'pcr' || moveId === 'elisa') return tile.zone === 'organ' || tile.environment !== undefined || tile.inflammation > 0;
    if (moveId.startsWith('plasmid:')) return game.cells.some((cell) => cell.x === tile.x && cell.y === tile.y && cell.role === playerRole);
    return true;
  }

  function shouldShowCell(cell: CellState): boolean {
    return true;
  }

  function cellClass(cell: CellState): string {
    const ownership = cell.role === playerRole ? 'own' : cell.role === 'neutral' ? 'neutral' : 'opponent';
    const knownKind = cell.role === playerRole || cell.confirmed || cell.morphologyKnown ? cell.kind : 'unknown';
    const markerClass = cell.markersKnown ? (cell.markerVisible ? ` marker-${cell.marker}` : ' marker-lost') : '';
    const plasmidClass = cell.plasmidEffect ? ` plasmid-${cell.plasmidEffect}` : '';
    const suspiciousClass = cell.morphologyKnown && cell.morphology === 'abnormal' && !cell.confirmed ? ' cell-suspicious' : '';
    return `cell-shape cell-${knownKind} cell-${ownership}${markerClass}${plasmidClass}${suspiciousClass}`;
  }

  function getCellLabel(cell: CellState): string {
    if (cell.role === playerRole) return `your ${cell.kind}`;
    if (cell.confirmed) return `confirmed ${cell.kind}`;
    if (cell.markersKnown && !cell.markerVisible) return 'marker-negative suspicious cell';
    if (cell.markersKnown) return `${cell.marker} marker cell`;
    if (cell.morphologyKnown) return `${cell.morphology} morphology`;
    return 'unidentified cell';
  }

  function getMove(moveId: MoveId): MoveView | null {
    if (isInstrumentId(moveId)) {
      const instrument = instruments.find((item) => item.id === moveId);
      if (!instrument) return null;
      const instrumentLabels: Record<InstrumentId, string> = {
        microscope: 'Reveal morphology',
        'flow-cytometer': 'Antigen scan',
        pcr: 'Amplify DNA part',
        elisa: 'Measure cytokines',
      };
      return {
        id: moveId,
        name: instrument.name,
        label: instrumentLabels[moveId],
        icon: moveId === 'microscope' ? 'scan' : moveId,
        role: playerRole ?? 'immune',
        cost: 1,
        charge: instrument.turns,
      };
    }

    if (moveId.startsWith('plasmid:')) {
      const plasmid = game.plasmids.find((item) => moveId === `plasmid:${item.id}`);
      if (!plasmid || !playerRole) return null;
      return { id: moveId, name: plasmid.behavior, label: plasmid.name, icon: 'plasmid', role: playerRole, cost: 1, charge: 1 };
    }
    return null;
  }

  function isInstrumentId(moveId: MoveId): moveId is InstrumentId {
    return instruments.some((instrument) => instrument.id === moveId);
  }

  function getPlaybackMessage(play: PendingPlay): string {
    if (play.instrumentId === 'microscope') return 'Morphology revealed without marker certainty';
    if (play.instrumentId === 'pcr') return 'Genetic identity confirmed despite surface tricks';
    if (play.instrumentId === 'elisa') return 'Cytokine readout unlocks a signal part';
    if (play.instrumentId === 'flow-cytometer') return 'Marker counts reveal nearby targetability';
    if (play.plasmidId) return 'The construct begins expressing on the target cell';
    return play.name;
  }

  function getPendingIcon(play: PendingPlay): string {
    if (play.instrumentId) return instruments.find((instrument) => instrument.id === play.instrumentId)?.name.slice(0, 1) ?? '?';
    return 'P';
  }

  function getPhaseName(): string {
    if (game.organDamage >= 12) return 'RESOLUTION';
    if (game.organDamage >= 8) return 'PROGRESSION';
    if (game.organDamage >= 4) return 'PROMOTION';
    return 'INITIATION';
  }

  function getPhaseDescription(): string {
    if (game.organDamage >= 8) return 'Advanced visible disease: organ damage and spread are established.';
    if (game.organDamage >= 4) return 'Regional progression: tissue pressure is now visible on the board.';
    return 'Early localized disease: stage is derived from visible organ damage, not hidden intent.';
  }

  function isScoreSource(tileId: string, kind: 'organ' | 'remission'): boolean {
    return game.scoreEvents.some((event) => event.kind === kind && event.tileId === tileId);
  }

  function scoreEventHighlight(kind: ScoreEvent['kind']): ScoreHighlight {
    if (kind === 'organ' || kind === 'remission') return kind;
    return null;
  }

  function validatePlasmid(partIds: PartId[]): PlasmidValidation {
    const parts = partLibrary.filter((part) => partIds.includes(part.id));
    const promoterIndex = parts.findIndex((part) => part.type === 'promoter');
    const firstPayloadIndex = parts.findIndex((part) => part.type === 'gene');
    const terminatorIndex = parts.findIndex((part) => part.type === 'terminator');
    const hasTerminator = terminatorIndex === parts.length - 1;
    const ordered = promoterIndex >= 0 && firstPayloadIndex > promoterIndex && hasTerminator;
    const reason = !parts.length
      ? 'Add parts in 5 prime to 3 prime order.'
      : promoterIndex < 0
        ? 'Missing promoter.'
        : firstPayloadIndex < 0
          ? 'Missing payload gene.'
          : !hasTerminator
            ? 'Terminator must be last.'
            : firstPayloadIndex < promoterIndex
              ? 'Payload cannot come before promoter.'
              : 'Construct parses in 5 prime to 3 prime order.';
    const hasHypoxia = parts.some((part) => part.id === 'hypoxia-promoter');
    const hasStress = parts.some((part) => part.id === 'stress-promoter');
    const hasTumorSensor = parts.some((part) => part.id === 'tumor-marker-sensor');
    const hasViralSensor = parts.some((part) => part.id === 'viral-sensor');
    const hasSelfSensor = parts.some((part) => part.id === 'self-marker-sensor');
    const hasAnd = parts.some((part) => part.id === 'and-gate');
    const hasNot = parts.some((part) => part.id === 'not-gate');
    const hasSilencer = parts.some((part) => part.id === 'cd47-silencer');
    const hasSignal = parts.some((part) => part.id === 'il2-signal');
    const hasRestorer = parts.some((part) => part.id === 'marker-restorer');
    const hasApoptosis = parts.some((part) => part.id === 'apoptosis-payload');
    const hasDecoy = parts.some((part) => part.id === 'decoy-shedder');
    const hasProtease = parts.some((part) => part.id === 'matrix-protease');
    const hasMotility = parts.some((part) => part.id === 'motility-program');
    const compatible = !(hasSelfSensor && hasApoptosis && !hasNot);

    if (hasApoptosis) {
      return {
        valid: ordered && compatible && (hasTumorSensor || hasViralSensor || hasHypoxia),
        name: hasViralSensor ? 'Viral payload kill switch' : hasAnd ? 'Hypoxia tumor kill switch' : 'Tumor kill switch',
        behavior: hasViralSensor
          ? 'Kill only cells carrying confirmed viral payload.'
          : hasAnd
            ? 'Kill only when hypoxia and tumor marker are both present.'
            : 'Kill cells matching the chosen tumor trigger.',
        effect: 'kill-switch',
        reason: compatible ? reason : 'Self sensor plus apoptosis needs a NOT gate to avoid healthy cells.',
      };
    }

    if (hasRestorer || hasSilencer) {
      return {
        valid: ordered && (hasTumorSensor || hasViralSensor || hasHypoxia),
        name: 'Marker-restoring T cell target',
        behavior: 'Force evasive tumor cells to show a targetable marker.',
        effect: 'marker-restorer',
        reason,
      };
    }

    if (hasSignal) {
      return {
        valid: ordered && (hasHypoxia || hasStress || hasTumorSensor),
        name: hasHypoxia ? 'Hypoxia T-cell beacon' : 'T-cell beacon',
        behavior: 'Pulse a recruitment signal when the trigger is present.',
        effect: 'beacon',
        reason,
      };
    }

    if (hasDecoy) {
      return {
        valid: ordered && !hasSelfSensor,
        name: 'Host-marker mimic',
        behavior: 'Shed decoy markers and become harder for antigen scans to target.',
        effect: 'decoy-shedder',
        reason: hasSelfSensor ? 'Mimicry cannot be driven by the self-safety sensor.' : reason,
      };
    }

    if (hasProtease) {
      return {
        valid: ordered,
        name: 'Matrix invasion program',
        behavior: 'Digest dense matrix into permeable tissue around the target.',
        effect: 'matrix-protease',
        reason,
      };
    }

    if (hasMotility) {
      return {
        valid: ordered,
        name: 'Directed motility program',
        behavior: 'Move the expressing cell toward damaged or compatible tissue.',
        effect: 'motility',
        reason,
      };
    }

    return {
      valid: ordered,
      name: 'Baseline expression cassette',
      behavior: 'Express a low-risk baseline program.',
      effect: 'baseline',
      reason,
    };
  }

  function getOutcome(): string | null {
    if (!playerRole) return null;
    if (remainingThreatCount === 0) return playerRole === 'immune' ? 'Remission achieved' : 'Threat cleared';
    if (game.organDamage >= 12) return playerRole === 'pathology' ? 'Organ failure achieved' : 'Organ failure';
    if (game.turn > roundLimit) return yourProgress >= opponentProgress ? `${playerProfile.name} wins at round limit` : `${opponentProfile.name} wins at round limit`;
    return null;
  }
</script>

<svelte:head>
  <title>Cytosis Prototype</title>
</svelte:head>

<main
  class:resolving-immune={currentPlayback?.play.role === 'immune'}
  class:resolving-pathology={currentPlayback?.play.role === 'pathology'}
  class="cytosis-shell"
  style={`--player-color: ${playerProfile.color}; --opponent-color: ${opponentProfile.color}`}
>
  {#if !playerRole}
    <section class="start-screen" aria-label="Choose your side">
      <div class="start-copy">
        <p class="eyebrow">Cytosis prototype</p>
        <h1>Choose who you are</h1>
        <p>Pick a pathology model, then play the side that teaches by watching biology happen.</p>
        <div class="scenario-picker" aria-label="Choose pathology scenario">
          <button class:active={selectedScenario === 'cancer'} type="button" onclick={() => selectedScenario = 'cancer'}>
            Cancer
            <small>Proliferation, evasion, invasion, metastasis</small>
          </button>
          <button class:active={selectedScenario === 'viral'} type="button" onclick={() => selectedScenario = 'viral'}>
            Viral infection
            <small>Payloads, replication, lysis, virions</small>
          </button>
        </div>
      </div>

      <div class="side-picker">
        <button class="side-card immune-card" type="button" onclick={() => chooseRole('immune')}>
          <span class="role-portrait immune-portrait"></span>
          <span class="eyebrow">Recommended first run</span>
          <strong>You are the Immune Player</strong>
          <span>Clear the tumor before it causes organ failure.</span>
        </button>

        <button class="side-card pathology-card" type="button" onclick={() => chooseRole('pathology')}>
          <span class="role-portrait pathology-portrait"></span>
          <span class="eyebrow">Advanced</span>
          <strong>You are the Pathology Player</strong>
          <span>{selectedScenario === 'viral' ? 'Infect host cells, replicate, and burst outward.' : 'Grow, evade detection, and push the organ toward failure.'}</span>
        </button>
      </div>
    </section>
  {:else}
    <header class="game-header">
      <div class="identity-chip">
        <span class={`role-portrait ${playerRole}-portrait`}></span>
        <div>
          <p class="eyebrow">You are</p>
          <h1>{playerProfile.name}</h1>
        </div>
      </div>

      <div class="status-pills">
        <span class="phase-pill" title={getPhaseDescription()}>
          <small>Stage</small>
          {phaseName}
        </span>
      </div>

      <div class="score-pair" aria-label={`Objectives. ${objectiveDetail}`}>
        <label onmouseenter={() => scoreHighlight = playerRole === 'pathology' ? 'organ' : 'remission'} onmouseleave={() => scoreHighlight = null}>
          <span>{playerRole === 'pathology' ? 'Organ Failure' : 'Remission'}</span>
          <meter class="your-meter" min="0" max="100" value={yourProgress}></meter>
        </label>
        <label onmouseenter={() => scoreHighlight = playerRole === 'pathology' ? 'remission' : 'organ'} onmouseleave={() => scoreHighlight = null}>
          <span>{playerRole === 'pathology' ? 'Remission' : 'Organ Failure'}</span>
          <meter class="opponent-meter" min="0" max="100" value={opponentProgress}></meter>
        </label>
        {#if recentScoreEvents.length > 0}
          <div class="score-events" aria-label="Recent score sources">
            {#each recentScoreEvents as event (event.id)}
              <button
                class={`score-event event-${event.kind}`}
                type="button"
                onmouseenter={() => scoreHighlight = scoreEventHighlight(event.kind)}
                onmouseleave={() => scoreHighlight = null}
                onclick={() => game.selectedTileId = event.tileId}
              >
                <b>{event.kind}</b>
                <span>+{event.amount} {event.cause} @ {event.tileId}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <button class="icon-button" type="button" aria-label="Reset prototype" onclick={resetPrototype}>R</button>
    </header>

    <section class="fixed-playfield">
      <div class="hex-board" style={`--columns: ${boardColumns}`}>
        {#each game.tiles as tile (tile.id)}
          {@const tileCells = game.cells.filter((cell) => cell.x === tile.x && cell.y === tile.y)}
          {@const pendingHere = game.pending.filter((play) => play.targetTileId === tile.id)}
          <button
            class:selected={tile.id === game.selectedTileId}
            class:valid-target={draggedMoveId !== null && isValidMoveTarget(draggedMoveId, tile)}
            class:invalid-target={draggedMoveId !== null && !isValidMoveTarget(draggedMoveId, tile)}
            class:playback-target={currentPlayback?.play.targetTileId === tile.id}
            class:playback-dim={currentPlayback !== null && currentPlayback.play.targetTileId !== tile.id}
            class:score-organ-source={isScoreSource(tile.id, 'organ')}
            class:score-remission-source={isScoreSource(tile.id, 'remission')}
            class:score-highlight={scoreHighlight !== null && isScoreSource(tile.id, scoreHighlight)}
            class:effect-scan={tile.recentEffect === 'scan'}
            class:effect-morphology={tile.recentEffect === 'morphology'}
            class:effect-marker-read={tile.recentEffect === 'marker-read'}
            class:effect-genetic-confirm={tile.recentEffect === 'genetic-confirm'}
            class:effect-cytokine={tile.recentEffect === 'cytokine'}
            class:effect-vessel-growth={tile.recentEffect === 'vessel-growth'}
            class:effect-damage={tile.recentEffect === 'damage' || tile.recentEffect === 'collateral'}
            class:effect-decoy={tile.recentEffect === 'decoy'}
            class:effect-matrix-break={tile.recentEffect === 'matrix-break'}
            class:effect-plasmid={tile.recentEffect === 'plasmid'}
            class:effect-proliferation={tile.recentEffect === 'proliferation'}
            class:effect-metastasis={tile.recentEffect === 'metastasis'}
            class:effect-infection={tile.recentEffect === 'infection'}
            class:effect-lysis={tile.recentEffect === 'lysis'}
            class:matrix-open={tile.matrixOpen}
            class:damaged={tile.damage > 1}
            class:inflamed={tile.inflammation > 0}
            class:fogged={!tile.visible}
            class:env-hypoxic={tile.chemistryKnown && tile.environment === 'hypoxic'}
            class:env-acidic={tile.chemistryKnown && tile.environment === 'acidic'}
            class:env-immunosuppressed={tile.chemistryKnown && tile.environment === 'immunosuppressed'}
            class={`hex-tile zone-${tile.zone}`}
            type="button"
            aria-label={`${tile.zone} tile ${tile.x}, ${tile.y}`}
            ondragover={(event) => allowTileDrop(event, tile)}
            ondrop={(event) => dropMoveOnTile(event, tile)}
            onclick={() => game.selectedTileId = tile.id}
          >
            <span class="tile-label">{tile.zone}{tile.chemistryKnown && tile.environment ? ` - ${tile.environment}` : ''}</span>
            {#if isScoreSource(tile.id, 'organ')}
              <span class="warning-marker" aria-hidden="true">!</span>
            {/if}
            {#if isScoreSource(tile.id, 'remission')}
              <span class="remission-marker" aria-hidden="true">+</span>
            {/if}
            {#if scoreHighlight !== null && isScoreSource(tile.id, scoreHighlight)}
              <span class="score-tether" aria-hidden="true"></span>
            {/if}
            <span class="tile-icon" aria-hidden="true"></span>
            {#if tile.recentEffect === 'morphology'}
              <span class="instrument-result morphology-result">shape</span>
            {:else if tile.recentEffect === 'marker-read'}
              <span class="instrument-result marker-result">markers</span>
            {:else if tile.recentEffect === 'genetic-confirm'}
              <span class="instrument-result genetic-result">DNA</span>
            {:else if tile.recentEffect === 'cytokine'}
              <span class="instrument-result cytokine-result">signal</span>
            {/if}
            <span class="cell-stack">
              {#each tileCells as cell (cell.id)}
                {#if shouldShowCell(cell)}
                  <span class={cellClass(cell)} aria-label={getCellLabel(cell)}></span>
                {:else}
                  <span class="cell-shape cell-unknown" aria-label="unknown cell"></span>
                {/if}
              {/each}
            </span>
            {#each pendingHere as play (play.id)}
              <span
                class={`queued-marker charge-${play.role}`}
                role="button"
                tabindex={play.role === game.activeRole && isPlayerTurn ? 0 : -1}
                draggable={play.role === game.activeRole && isPlayerTurn}
                ondragstart={(event) => startQueuedDrag(event, play.id)}
                ondragend={clearDrag}
                aria-label={`${play.name} queued`}
              >
                <span>{getPendingIcon(play)}</span>
                <small>{play.remainingTurns}</small>
              </span>
            {/each}
          </button>
        {/each}
      </div>

      {#if currentPlayback}
        <div class={`resolution-tag tag-${currentPlayback.play.role}`}>
          <b>{currentPlayback.play.role.toUpperCase()}</b>
          <strong>{currentPlayback.play.name}</strong>
          <span>{currentPlayback.message}</span>
        </div>
      {/if}

      {#if turnOverlay}
        <div class="turn-overlay">
          <span class={`role-portrait ${game.activeRole}-portrait`}></span>
          <strong>{turnOverlay}</strong>
        </div>
      {/if}

      {#if gameOutcome}
        <div class="outcome-overlay">
          <strong>{gameOutcome}</strong>
          <button class="btn-primary" type="button" onclick={resetPrototype}>Play again</button>
        </div>
      {/if}
    </section>

    <footer class="card-tray" ondragover={allowTrayDrop} ondrop={dropQueuedToTray}>
      <button class="tray-tool" type="button" disabled={!isPlayerTurn || game.actionsRemaining <= 0} onclick={drawCard}>
        Draw
        <small>{deck.length > 0 ? deck.length : 'recycle'}</small>
      </button>
      <div class="hand" aria-label="Move cards">
        {#each hand as moveId, index (moveId + '-' + index)}
          {@const move = getMove(moveId)}
          {#if move}
            <article
              class:disabled={!canPlayMove(moveId)}
              class="move-card"
              draggable={canPlayMove(moveId)}
              ondragstart={(event) => startMoveDrag(event, moveId)}
              ondragend={clearDrag}
            >
              <span class={`move-icon move-${move.icon}`}>
                {#if moveAssetUrls[move.icon]}
                  <img src={moveAssetUrls[move.icon]} alt="" draggable="false" />
                {/if}
              </span>
              <strong>{move.label}</strong>
              <small>{move.name}</small>
              <span class="cost-dot">{move.cost}</span>
            </article>
          {/if}
        {/each}
      </div>
      <button class="tray-tool end-turn" type="button" disabled={!isPlayerTurn || playbackQueue.length > 0} onclick={endPlayerTurn}>
        End
        <small>R{Math.min(game.turn, roundLimit)} - {game.actionsRemaining}/{actionLimit} - vectors {game.vectorSupply}</small>
      </button>
      <button class="tray-tool workshop" type="button" disabled={!canOpenPlasmidEditor} onclick={openPlasmidEditor}>Editor</button>
    </footer>

    <aside class="inspect-float" aria-label="Selected tile">
      <strong>{selectedTile.zone}</strong>
      {#if selectedTile.chemistryKnown}
        <span>O2 {selectedTile.oxygen}/10</span>
      {:else}
        <span>chemistry unknown</span>
      {/if}
      {#if selectedTile.chemistryKnown && selectedTile.environment}
        <span>{selectedTile.environment}</span>
      {/if}
      {#if game.immuneMemory.length > 0}
        <span>memory {game.immuneMemory.join(', ')}</span>
      {/if}
      {#each selectedTileCells.filter((cell) => shouldShowCell(cell)) as cell (cell.id)}
        <span>{getCellLabel(cell)}</span>
        {#if cell.kind === 'infected' && cell.morphologyKnown}
          <span>viral load {cell.viralLoad ?? 1}</span>
        {/if}
      {/each}
    </aside>

    {#if plasmidEditorOpen}
      <section class="plasmid-overlay" aria-label="Plasmid editor">
        <div class="plasmid-screen">
          <header>
            <div>
              <p class="eyebrow">Plasmid editor</p>
              <h2>Design a reusable card</h2>
            </div>
            <button class="icon-button" type="button" aria-label="Close plasmid editor" onclick={() => plasmidEditorOpen = false}>X</button>
          </header>

          <div class="editor-layout">
            <nav class="part-categories" aria-label="Part categories">
              {#each partCategories as category (category)}
                <button class:active={selectedPartType === category} type="button" onclick={() => selectedPartType = category}>
                  {category}
                </button>
              {/each}
            </nav>

            <div class="parts-list">
              {#each visibleParts as part (part.id)}
                {@const count = getPartCount(part.id)}
                <button class:active={game.selectedParts.includes(part.id)} class:locked={count <= 0} type="button" onclick={() => togglePart(part.id)}>
                  <span>{part.type} - {count} left</span>
                  <strong>{part.name}</strong>
                  <small>{count > 0 ? part.text : 'Run instruments or harvest debris to collect this part.'}</small>
                </button>
              {/each}
            </div>

            <div class="construct-preview">
              <div class="dna-line" aria-label="Selected plasmid parts">
                {#each selectedParts as part (part.id)}
                  <span class={`part-token part-${part.type}`}>{part.name}</span>
                {/each}
              </div>
              <div class="plasmid-card-preview">
                <span class={`plasmid-status ${plasmidValidation.valid ? 'valid' : 'invalid'}`}>{plasmidValidation.valid ? 'valid' : 'invalid'}</span>
                <strong>{plasmidValidation.name}</strong>
                <p>{plasmidBehavior}</p>
                <small>{plasmidValidation.reason}</small>
              </div>
              <div class="editor-actions">
                <button class="btn-secondary" type="button" disabled={game.selectedParts.length < 2 || draftValidated || game.actionsRemaining <= 0} onclick={validateDraft}>
                  {draftValidated ? 'Validated' : 'Validate - 1 action'}
                </button>
                <button class="btn-primary" type="button" disabled={game.selectedParts.length < 2 || !canAffordDraft} onclick={savePlasmid}>Create card</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    {/if}
  {/if}
</main>
