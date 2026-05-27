<script lang="ts">
  import {
    boardColumns,
    cards,
    createInitialGameState,
    instruments,
    partLibrary,
    roleProfiles,
    type CardId,
    type CellState,
    type DesignedPlasmid,
    type GameState,
    type InstrumentId,
    type PartId,
    type PendingPlay,
    type RoleId,
    type TileState,
  } from './game-data';

  type MoveId = CardId | InstrumentId | `plasmid:${string}`;
  type PlaybackEvent = { play: PendingPlay; message: string };

  interface MoveView {
    id: MoveId;
    name: string;
    label: string;
    icon: string;
    role: RoleId;
    cost: number;
    charge: number;
  }

  const actionLimit = 3;
  const startingTumorCount = 3;
  const roundLimit = 20;
  const immuneSearchPattern = ['4-3', '5-4', '3-4', '6-3', '2-2', '5-2', '1-5', '6-5'];
  const immuneStartingHand: MoveId[] = ['microscope', 'antigen-scan', 'recruit-t-cells'];
  const pathologyStartingHand: MoveId[] = ['angiogenesis', 'immune-decoy', 'matrix-breakdown'];
  const immuneStartingDeck: MoveId[] = [
    'microscope',
    'antigen-scan',
    'antigen-scan',
    'recruit-t-cells',
    'flow-cytometer',
    'cytotoxic-burst',
    'pcr',
    'elisa',
    'microscope',
    'antigen-scan',
    'recruit-t-cells',
    'cytotoxic-burst',
    'pcr',
    'flow-cytometer',
    'antigen-scan',
    'microscope',
    'elisa',
    'recruit-t-cells',
    'cytotoxic-burst',
    'antigen-scan',
  ];
  const pathologyStartingDeck: MoveId[] = [
    'angiogenesis',
    'immune-decoy',
    'matrix-breakdown',
    'angiogenesis',
    'immune-decoy',
    'angiogenesis',
    'matrix-breakdown',
    'immune-decoy',
    'angiogenesis',
    'matrix-breakdown',
    'immune-decoy',
    'angiogenesis',
    'matrix-breakdown',
    'immune-decoy',
    'angiogenesis',
    'matrix-breakdown',
    'immune-decoy',
    'angiogenesis',
    'matrix-breakdown',
    'immune-decoy',
  ];

  let game: GameState = $state(createInitialGameState());
  let playerRole: RoleId | null = $state(null);
  let hand: MoveId[] = $state([]);
  let deck: MoveId[] = $state([]);
  let draggedMoveId: MoveId | null = $state(null);
  let draggedQueuedId: number | null = $state(null);
  let playbackQueue: PlaybackEvent[] = $state([]);
  let playbackIndex = $state(0);
  let plasmidEditorOpen = $state(false);
  let turnOverlay = $state('');
  let discoveredParts: PartId[] = $state(['generic-terminator']);
  let aiScanCursor = $state(0);

  const playerProfile = $derived(roleProfiles.find((role) => role.id === playerRole) ?? roleProfiles[1]);
  const opponentRole = $derived(playerRole === 'immune' ? 'pathology' : 'immune');
  const opponentProfile = $derived(roleProfiles.find((role) => role.id === opponentRole) ?? roleProfiles[0]);
  const isPlayerTurn = $derived(playerRole === game.activeRole);
  const selectedTile = $derived(game.tiles.find((tile) => tile.id === game.selectedTileId) ?? game.tiles[0]);
  const selectedTileCells = $derived(game.cells.filter((cell) => cell.x === selectedTile.x && cell.y === selectedTile.y));
  const selectedParts = $derived(partLibrary.filter((part) => game.selectedParts.includes(part.id)));
  const availableParts = $derived(partLibrary.filter((part) => discoveredParts.includes(part.id)));
  const visibleTumorCount = $derived(game.cells.filter((cell) => cell.kind === 'tumor' && !cell.hidden).length);
  const remainingTumorCount = $derived(game.cells.filter((cell) => cell.kind === 'tumor').length);
  const remissionProgress = $derived(Math.min(100, Math.max(0, visibleTumorCount * 18 + (startingTumorCount - remainingTumorCount) * 28 - game.autoimmuneDamage * 10)));
  const pathologyProgress = $derived(Math.min(100, Math.round((game.organDamage / 12) * 100)));
  const yourProgress = $derived(playerRole === 'pathology' ? pathologyProgress : remissionProgress);
  const opponentProgress = $derived(playerRole === 'pathology' ? remissionProgress : pathologyProgress);
  const plasmidBehavior = $derived.by(() => describePlasmid(game.selectedParts));
  const currentPlayback = $derived(playbackQueue[playbackIndex] ?? null);
  const gameOutcome = $derived.by(() => getOutcome());
  const phaseName = $derived(getPhaseName());
  const canOpenPlasmidEditor = $derived(isPlayerTurn && game.actionsRemaining > 0 && availableParts.length >= 2 && playbackQueue.length === 0);
  const objectiveDetail = $derived(
    `Organ Damage ${game.organDamage}/12. Remission uses revealed tumors (${visibleTumorCount}) and cleared tumors (${startingTumorCount - remainingTumorCount}).`
  );

  function chooseRole(role: RoleId) {
    game = createInitialGameState();
    playerRole = role;
    game.activeRole = role;
    game.selectedCardId = role === 'immune' ? 'antigen-scan' : 'angiogenesis';
    game.selectedParts = ['generic-terminator'];
    hand = role === 'immune' ? [...immuneStartingHand] : [...pathologyStartingHand];
    deck = role === 'immune' ? [...immuneStartingDeck] : [...pathologyStartingDeck];
    playbackQueue = [];
    playbackIndex = 0;
    plasmidEditorOpen = false;
    discoveredParts = ['generic-terminator'];
    aiScanCursor = 0;
    showTurnOverlay(`${roleProfiles.find((item) => item.id === role)?.name ?? 'Player'} Turn 1`);
  }

  function showTurnOverlay(text: string) {
    turnOverlay = text;
    window.setTimeout(() => {
      if (turnOverlay === text) turnOverlay = '';
    }, 1000);
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
      id: Date.now(),
      role: game.activeRole,
      cardId: isCardId(moveId) ? moveId : undefined,
      instrumentId: isInstrumentId(moveId) ? moveId : undefined,
      plasmidId: getPlasmidId(moveId),
      name: move.name,
      targetTileId: tile.id,
      remainingTurns: move.charge,
      result: move.label,
    };

    game.pending.push(pendingPlay);
    game.actionsRemaining -= move.cost;
    hand = removeOneMove(hand, moveId);
    if (isCardId(moveId)) adjustResource(game.activeRole, -move.cost);
    game.log.unshift(`${move.label} queued.`);
  }

  function cancelQueuedMove(pendingId: number) {
    const pending = game.pending.find((play) => play.id === pendingId);
    if (!pending || pending.role !== game.activeRole || !isPlayerTurn) return;

    const moveId = pending.cardId ?? pending.instrumentId ?? (pending.plasmidId ? (`plasmid:${pending.plasmidId}` as MoveId) : undefined);
    const move = moveId ? getMove(moveId) : null;
    game.pending = game.pending.filter((play) => play.id !== pendingId);
    if (moveId) hand = [...hand, moveId];
    if (move) game.actionsRemaining = Math.min(actionLimit, game.actionsRemaining + move.cost);
    if (pending.cardId) {
      const card = cards.find((item) => item.id === pending.cardId);
      if (card) adjustResource(pending.role, card.cost);
    }
    game.log.unshift(`${pending.name} returned to hand.`);
  }

  function drawCard() {
    if (!isPlayerTurn || game.actionsRemaining <= 0 || deck.length === 0) return;
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
        game.turn += 1;
        drawStartOfTurnCard();
        showTurnOverlay(`${playerProfile.name} Turn ${game.turn}`);
      });
    }, 700);
  }

  function queueOpponentMove() {
    let budget = actionLimit;
    const plannedTargets: string[] = [];

    while (budget > 0) {
      const decision = chooseOpponentDecision(budget, plannedTargets);
      if (!decision) return;
      const card = cards.find((item) => item.id === decision.cardId);
      if (!card || card.cost > budget) return;
      game.pending.push({
        id: Date.now() + plannedTargets.length,
        role: opponentRole,
        cardId: card.id,
        name: card.name,
        targetTileId: decision.targetTileId,
        remainingTurns: card.charge,
        result: card.effectLabel,
      });
      budget -= card.cost;
      plannedTargets.push(decision.targetTileId);
    }
  }

  function chooseOpponentDecision(budget: number, plannedTargets: string[]): { cardId: CardId; targetTileId: string } | null {
    if (opponentRole === 'immune') {
      const revealedTumor = game.cells.find((cell) => cell.kind === 'tumor' && !cell.hidden);
      if (revealedTumor && budget >= 2) return { cardId: 'cytotoxic-burst', targetTileId: `${revealedTumor.x}-${revealedTumor.y}` };

      const searchTileId = getNextAiScanTarget(plannedTargets);
      if (searchTileId) return { cardId: 'antigen-scan', targetTileId: searchTileId };

      return { cardId: 'recruit-t-cells', targetTileId: '1-1' };
    }

    const exposedTumor = game.cells.find((cell) => cell.kind === 'tumor' && !cell.hidden);
    if (exposedTumor) return { cardId: 'immune-decoy', targetTileId: `${exposedTumor.x}-${exposedTumor.y}` };
    if (budget >= 2 && game.organDamage >= 5) return { cardId: 'matrix-breakdown', targetTileId: '4-4' };
    return { cardId: 'angiogenesis', targetTileId: '4-3' };
  }

  function getNextAiScanTarget(plannedTargets: string[]): string | null {
    for (let index = 0; index < immuneSearchPattern.length; index += 1) {
      const tileId = immuneSearchPattern[(aiScanCursor + index) % immuneSearchPattern.length];
      const alreadyRevealed = game.cells.some((cell) => cell.kind === 'tumor' && !cell.hidden && `${cell.x}-${cell.y}` === tileId);
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
      done();
    }, 1500);
  }

  function drawStartOfTurnCard() {
    if (hand.length >= 5 || deck.length === 0) return;
    const [nextCard, ...rest] = deck;
    if (!nextCard) return;
    hand = [...hand, nextCard];
    deck = rest;
  }

  function applyPlay(play: PendingPlay) {
    clearTileEffects();

    if (play.cardId === 'antigen-scan' || play.instrumentId === 'microscope' || play.instrumentId === 'flow-cytometer') {
      revealNear(play.targetTileId, play.instrumentId === 'flow-cytometer' ? 2 : 1);
      markTilesNear(play.targetTileId, play.instrumentId === 'flow-cytometer' ? 2 : 1, 'scan');
      game.immuneResource += 1;
      if (playerRole === 'immune' && !hand.includes('cytotoxic-burst')) hand = [...hand, 'cytotoxic-burst'];
      discoverPart(play.instrumentId === 'flow-cytometer' ? 'il2-signal' : 'hypoxia-promoter');
      return;
    }

    if (play.instrumentId === 'pcr' || play.instrumentId === 'elisa') {
      markTilesNear(play.targetTileId, 1, 'scan');
      discoverPart(play.instrumentId === 'pcr' ? 'cd47-silencer' : 'il2-signal');
      return;
    }

    if (play.cardId === 'cytotoxic-burst') {
      game.cells = game.cells.filter((cell) => !(cell.kind === 'tumor' && !cell.hidden && distanceToTile(cell, play.targetTileId) <= 1));
      game.autoimmuneDamage += 1;
      markTilesNear(play.targetTileId, 1, 'damage');
      return;
    }

    if (play.cardId === 'recruit-t-cells') {
      game.cells.push({ id: `t-cell-${Date.now()}`, kind: 't-cell', role: 'immune', x: 1, y: 1, hidden: false, plasmid: 'fresh patrol plasmid', expression: 1 });
      game.immuneResource += 2;
      return;
    }

    if (play.cardId === 'angiogenesis') {
      game.organDamage += 2;
      game.pathologyResource += 1;
      growVesselToward(play.targetTileId);
      return;
    }

    if (play.cardId === 'immune-decoy') {
      game.decoyShield = true;
      for (const cell of game.cells) {
        if (cell.kind === 'tumor' && distanceToTile(cell, play.targetTileId) <= 1) cell.hidden = true;
      }
      markTilesNear(play.targetTileId, 1, 'decoy');
      return;
    }

    if (play.cardId === 'matrix-breakdown') {
      const tile = game.tiles.find((item) => item.id === play.targetTileId);
      if (tile) game.cells.push({ id: `tumor-${Date.now()}`, kind: 'tumor', role: 'pathology', x: tile.x, y: tile.y, hidden: true });
      if (tile) tile.recentEffect = 'matrix-break';
      game.organDamage += 1;
      return;
    }

    if (play.plasmidId) {
      const tile = game.tiles.find((item) => item.id === play.targetTileId);
      if (!tile) return;
      tile.recentEffect = 'plasmid';
      for (const cell of game.cells) {
        if (cell.x === tile.x && cell.y === tile.y && cell.role === play.role) {
          cell.plasmid = play.name;
          cell.expression = (cell.expression ?? 0) + 1;
        }
      }
    }
  }

  function savePlasmid() {
    if (!isPlayerTurn || game.selectedParts.length < 2) return;
    const plasmid: DesignedPlasmid = {
      id: `plasmid-${Date.now()}`,
      name: `${playerProfile.name} construct ${game.plasmids.length + 1}`,
      parts: [...game.selectedParts],
      behavior: plasmidBehavior,
    };
    game.plasmids.push(plasmid);
    const moveId: MoveId = `plasmid:${plasmid.id}`;
    hand = [...hand, moveId];
    plasmidEditorOpen = false;
  }

  function togglePart(partId: PartId) {
    if (!discoveredParts.includes(partId)) return;
    if (game.selectedParts.includes(partId)) {
      game.selectedParts = game.selectedParts.filter((id) => id !== partId);
      return;
    }

    if (game.selectedParts.length >= 7) return;
    game.selectedParts = [...game.selectedParts, partId];
  }

  function resetPrototype() {
    game = createInitialGameState();
    playerRole = null;
    hand = [];
    deck = [];
    draggedMoveId = null;
    draggedQueuedId = null;
    playbackQueue = [];
    playbackIndex = 0;
    plasmidEditorOpen = false;
    turnOverlay = '';
    discoveredParts = ['generic-terminator'];
    aiScanCursor = 0;
  }

  function removeOneMove(source: MoveId[], moveId: MoveId): MoveId[] {
    const index = source.indexOf(moveId);
    if (index < 0) return source;
    return [...source.slice(0, index), ...source.slice(index + 1)];
  }

  function discoverPart(partId: PartId) {
    if (!discoveredParts.includes(partId)) discoveredParts = [...discoveredParts, partId];
  }

  function getPlasmidId(moveId: MoveId): string | undefined {
    return moveId.startsWith('plasmid:') ? moveId.slice('plasmid:'.length) : undefined;
  }

  function revealNear(tileId: string, range: number) {
    for (const tile of game.tiles) {
      if (tileDistance(tile, tileId) <= range) tile.visible = true;
    }

    for (const cell of game.cells) {
      if (cell.kind === 'tumor' && distanceToTile(cell, tileId) <= range) cell.hidden = false;
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
    damageTile(target.id, 1);
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

  function damageTile(tileId: string, amount: number) {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (tile) tile.damage += amount;
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
    return Boolean(move && isPlayerTurn && playbackQueue.length === 0 && game.actionsRemaining >= move.cost && hand.includes(moveId));
  }

  function isValidMoveTarget(moveId: MoveId, tile: TileState): boolean {
    if (!canPlayMove(moveId)) return false;
    if (moveId === 'cytotoxic-burst') return game.cells.some((cell) => cell.x === tile.x && cell.y === tile.y && cell.kind === 'tumor' && !cell.hidden);
    if (moveId === 'recruit-t-cells') return tile.zone === 'lymph';
    if (moveId === 'pcr' || moveId === 'elisa') return tile.environment !== undefined || tile.zone === 'organ';
    if (moveId.startsWith('plasmid:')) return game.cells.some((cell) => cell.x === tile.x && cell.y === tile.y && cell.role === playerRole);
    return true;
  }

  function shouldShowCell(cell: CellState): boolean {
    if (cell.role === playerRole || cell.role === 'neutral') return true;
    return !cell.hidden;
  }

  function cellClass(cell: CellState): string {
    const ownership = cell.role === playerRole ? 'own' : cell.role === 'neutral' ? 'neutral' : 'opponent';
    return `cell-shape cell-${cell.kind} cell-${ownership}`;
  }

  function getMove(moveId: MoveId): MoveView | null {
    if (isInstrumentId(moveId)) {
      const instrument = instruments.find((item) => item.id === moveId);
      if (!instrument) return null;
      const instrumentLabels: Record<InstrumentId, string> = {
        microscope: 'Reveal morphology',
        'flow-cytometer': 'Sort marker signals',
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
      return { id: moveId, name: plasmid.name, label: 'Deploy plasmid', icon: 'plasmid', role: playerRole, cost: 1, charge: 1 };
    }

    const card = cards.find((item) => item.id === moveId);
    if (!card) return null;
    return { id: card.id, name: card.name, label: card.effectLabel, icon: card.id, role: card.role, cost: card.cost, charge: card.charge };
  }

  function isCardId(moveId: MoveId): moveId is CardId {
    return cards.some((card) => card.id === moveId);
  }

  function isInstrumentId(moveId: MoveId): moveId is InstrumentId {
    return instruments.some((instrument) => instrument.id === moveId);
  }

  function getPlaybackMessage(play: PendingPlay): string {
    const card = play.cardId ? cards.find((item) => item.id === play.cardId) : undefined;
    if (card) return card.effectLabel;
    if (play.instrumentId === 'microscope') return 'Reveal hidden cells';
    if (play.instrumentId === 'pcr') return 'Amplified fragment unlocks a plasmid part';
    if (play.instrumentId === 'elisa') return 'Cytokine readout unlocks a signal part';
    if (play.instrumentId === 'flow-cytometer') return 'Marker counts reveal nearby cells';
    if (play.plasmidId) return 'The construct begins expressing on the target cell';
    return play.name;
  }

  function getPendingIcon(play: PendingPlay): string {
    if (play.cardId) return cards.find((card) => card.id === play.cardId)?.effectLabel.slice(0, 1) ?? '?';
    if (play.instrumentId) return instruments.find((instrument) => instrument.id === play.instrumentId)?.name.slice(0, 1) ?? '?';
    return 'P';
  }

  function getPhaseName(): string {
    if (game.organDamage >= 12) return 'RESOLUTION';
    if (game.organDamage >= 8) return 'PROGRESSION';
    if (game.organDamage >= 4) return 'PROMOTION';
    return 'INITIATION';
  }

  function describePlasmid(partIds: PartId[]): string {
    const parts = partLibrary.filter((part) => partIds.includes(part.id));
    const hasHypoxia = parts.some((part) => part.id === 'hypoxia-promoter');
    const hasSilencer = parts.some((part) => part.id === 'cd47-silencer');
    const hasSignal = parts.some((part) => part.id === 'il2-signal');
    const hasTag = parts.some((part) => part.id === 'degradation-tag');
    if (hasHypoxia && hasSilencer) return 'Exposes eat-me signals in low oxygen.';
    if (hasSignal && hasTag) return 'Briefly pulls T cells toward the target.';
    if (hasSignal) return 'Attracts immune cells toward the target.';
    if (hasSilencer) return 'Makes the target easier to clear.';
    return 'Baseline expression program.';
  }

  function getOutcome(): string | null {
    if (!playerRole) return null;
    if (remainingTumorCount === 0) return playerRole === 'immune' ? 'Remission achieved' : 'Tumor cleared';
    if (game.organDamage >= 12) return playerRole === 'pathology' ? 'Organ failure achieved' : 'Organ failure';
    if (game.turn > roundLimit) return yourProgress >= opponentProgress ? `${playerProfile.name} wins at round limit` : `${opponentProfile.name} wins at round limit`;
    return null;
  }
</script>

<svelte:head>
  <title>Cytosis Prototype</title>
</svelte:head>

<main class="cytosis-shell" style={`--player-color: ${playerProfile.color}; --opponent-color: ${opponentProfile.color}`}>
  {#if !playerRole}
    <section class="start-screen" aria-label="Choose your side">
      <div class="start-copy">
        <p class="eyebrow">Cytosis scenario 1</p>
        <h1>Choose who you are</h1>
        <p>Start with a hand, a deck, and a board that teaches by moving.</p>
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
          <span>Grow, evade detection, and push the organ toward failure.</span>
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
        <span class="phase-pill">{phaseName}</span>
        <span class="round-pill">R{Math.min(game.turn, roundLimit)}/{roundLimit}</span>
        <span class="action-pill">{game.actionsRemaining}/{actionLimit}</span>
      </div>

      <div class="score-pair" aria-label="Objectives" title={objectiveDetail}>
        <label>
          <span>{playerRole === 'pathology' ? 'Organ Failure' : 'Remission'}</span>
          <meter class="your-meter" min="0" max="100" value={yourProgress}></meter>
        </label>
        <label>
          <span>{playerRole === 'pathology' ? 'Remission' : 'Organ Failure'}</span>
          <meter class="opponent-meter" min="0" max="100" value={opponentProgress}></meter>
        </label>
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
            class:effect-scan={tile.recentEffect === 'scan'}
            class:effect-vessel-growth={tile.recentEffect === 'vessel-growth'}
            class:effect-damage={tile.recentEffect === 'damage'}
            class:effect-decoy={tile.recentEffect === 'decoy'}
            class:effect-matrix-break={tile.recentEffect === 'matrix-break'}
            class:effect-plasmid={tile.recentEffect === 'plasmid'}
            class:env-hypoxic={tile.environment === 'hypoxic'}
            class:env-acidic={tile.environment === 'acidic'}
            class:env-immunosuppressed={tile.environment === 'immunosuppressed'}
            class={`hex-tile zone-${tile.zone}`}
            type="button"
            aria-label={`${tile.zone} tile ${tile.x}, ${tile.y}`}
            ondragover={(event) => allowTileDrop(event, tile)}
            ondrop={(event) => dropMoveOnTile(event, tile)}
            onclick={() => game.selectedTileId = tile.id}
          >
            <span class="tile-icon" aria-hidden="true"></span>
            <span class="cell-stack">
              {#each tileCells as cell (cell.id)}
                {#if shouldShowCell(cell)}
                  <span class={cellClass(cell)} aria-label={cell.kind}></span>
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
        <div class="resolution-tag">
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
      <button class="tray-tool" type="button" disabled={!isPlayerTurn || game.actionsRemaining <= 0 || deck.length === 0} onclick={drawCard}>
        Draw
        <small>{deck.length}</small>
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
              <span class={`move-icon move-${move.icon}`}></span>
              <strong>{move.label}</strong>
              <small>{move.name}</small>
              <span class="cost-dot">{move.cost}</span>
            </article>
          {/if}
        {/each}
      </div>
      <button class="tray-tool end-turn" type="button" disabled={!isPlayerTurn || playbackQueue.length > 0} onclick={endPlayerTurn}>End</button>
      <button class="tray-tool workshop" type="button" disabled={!canOpenPlasmidEditor} onclick={openPlasmidEditor}>Editor</button>
    </footer>

    <aside class="inspect-float" aria-label="Selected tile">
      <strong>{selectedTile.zone}</strong>
      <span>O2 {selectedTile.oxygen}/10</span>
      {#if selectedTile.environment}
        <span>{selectedTile.environment}</span>
      {/if}
      {#each selectedTileCells.filter((cell) => shouldShowCell(cell)) as cell (cell.id)}
        <span>{cell.role === playerRole ? 'your' : cell.role === 'neutral' ? 'tissue' : 'opponent'} {cell.kind}</span>
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
            <div class="parts-list">
              {#each partLibrary as part (part.id)}
                <button class:active={game.selectedParts.includes(part.id)} class:locked={!discoveredParts.includes(part.id)} type="button" onclick={() => togglePart(part.id)}>
                  <span>{part.type}</span>
                  <strong>{part.name}</strong>
                  <small>{discoveredParts.includes(part.id) ? part.text : 'Run instruments to discover this part.'}</small>
                </button>
              {/each}
            </div>

            <div class="construct-preview">
              <div class="dna-line" aria-label="Selected plasmid parts">
                {#each selectedParts as part (part.id)}
                  <span class={`part-token part-${part.type}`}>{part.name}</span>
                {/each}
              </div>
              <p>{plasmidBehavior}</p>
              <button class="btn-primary" type="button" disabled={game.selectedParts.length < 2} onclick={savePlasmid}>Create card</button>
            </div>
          </div>
        </div>
      </section>
    {/if}
  {/if}
</main>
